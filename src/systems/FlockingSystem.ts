import { Vector2D } from '../core/Vector2D';
import { Boid, BoidStats } from '../entities/Boid';
import { Base } from '../entities/Base';
import { Dot, DotState } from '../entities/Dot';
import { Storm } from '../entities/Storm';
import { SpatialHash } from './SpatialHash';
import { GameConfig } from '../utils/Config';

export class FlockingSystem {
  private spatialHash: SpatialHash;

  constructor() {
    this.spatialHash = new SpatialHash();
  }

  update(
    boids: Boid[],
    bases: Base[],
    dots: Dot[],
    storms: Storm[],
    goal: Vector2D | null,
    enemyGoal: Vector2D,
    dtN: number,
    _chaosVelocities?: Map<number, Vector2D>
  ): void {
    // Update spatial hash for performance
    const avgPerception = (
      Boid.calculateStats(bases[0].level).perception +
      Boid.calculateStats(bases[1].level).perception
    ) / 2;
    this.spatialHash.updateCellSize(avgPerception);
    this.spatialHash.rebuild(boids);

    // Apply steering to each boid
    for (let i = 0; i < boids.length; i++) {
      this.steer(i, boids, bases, dots, storms, goal, enemyGoal, dtN);
    }
  }

  private steer(
    index: number,
    boids: Boid[],
    bases: Base[],
    dots: Dot[],
    storms: Storm[],
    playerGoal: Vector2D | null,
    enemyGoal: Vector2D,
    _dtN: number
  ): void {
    const boid = boids[index];
    const stats = Boid.calculateStats(bases[boid.team].level);
    const neighbors = this.spatialHash.getNeighbors(boid, boids, stats);
    
    // Flocking forces
    const flockingForces = this.calculateFlockingForces(boid, boids, neighbors, stats);
    boid.apply(flockingForces.alignment);
    boid.apply(flockingForces.cohesion);
    boid.apply(flockingForces.separation);
    
    // Goal seeking
    const goalForce = this.calculateGoalForce(boid, bases, playerGoal, enemyGoal, stats);
    if (goalForce) {
      boid.apply(goalForce);
    }
    
    // Enemy base aura pushback
    const auraForce = this.calculateAuraForce(boid, bases);
    if (auraForce) {
      boid.apply(auraForce);
    }
    
    // Storm repulsion
    for (const storm of storms) {
      const repulsion = storm.getRepulsionForce(boid.pos);
      if (repulsion) {
        boid.apply(repulsion);
      }
    }
    
    // Interactions (pickup, deposit, drop)
    if (boid.stun <= 0) {
      this.handleInteractions(index, boid, bases, dots, neighbors, boids);
    }
  }

  private calculateFlockingForces(
    boid: Boid,
    boids: Boid[],
    neighbors: number[],
    stats: BoidStats
  ): { alignment: Vector2D; cohesion: Vector2D; separation: Vector2D } {
    const per2 = stats.perception * stats.perception;
    const sep2 = stats.sepR * stats.sepR;
    
    let count = 0;
    const sumVel = new Vector2D();
    const sumPos = new Vector2D();
    const sumSep = new Vector2D();
    
    for (const j of neighbors) {
      const other = boids[j];
      const dx = other.pos.x - boid.pos.x;
      const dy = other.pos.y - boid.pos.y;
      const d2 = dx * dx + dy * dy;
      
      if (d2 > per2 || d2 === 0) continue;
      
      if (other.team === boid.team) {
        // Friendly boid
        count++;
        sumVel.add(other.vel);
        sumPos.add(other.pos);
        
        if (d2 < sep2) {
          sumSep.add(new Vector2D(-dx, -dy).div(Math.max(1, d2)));
        }
      } else {
        // Enemy boid - stronger separation
        sumSep.add(new Vector2D(-dx, -dy).div(Math.max(1, d2)).mult(1.05));
      }
    }
    
    let alignment = new Vector2D();
    let cohesion = new Vector2D();
    let separation = new Vector2D();
    
    if (count > 0) {
      // Alignment
      alignment = sumVel.div(count)
        .setMag(stats.maxSpeed)
        .sub(boid.vel)
        .limit(stats.maxForce);
      
      // Cohesion
      cohesion = sumPos.div(count)
        .sub(boid.pos)
        .setMag(stats.maxSpeed)
        .sub(boid.vel)
        .limit(stats.maxForce)
        .mult(0.9);
      
      // Separation
      separation = sumSep
        .setMag(stats.maxSpeed)
        .sub(boid.vel)
        .limit(stats.maxForce)
        .mult(1.6);
    }
    
    return { alignment, cohesion, separation };
  }

  private calculateGoalForce(
    boid: Boid,
    bases: Base[],
    playerGoal: Vector2D | null,
    enemyGoal: Vector2D,
    stats: BoidStats
  ): Vector2D | null {
    let goal: Vector2D | null = null;
    
    if (boid.isCarrying()) {
      // Return to home base when carrying
      goal = bases[boid.team].pos;
    } else if (boid.team === GameConfig.teams.player) {
      // Player team follows pointer or defends
      if (playerGoal) {
        goal = playerGoal;
      } else {
        // Default defensive position
        const base = bases[0];
        const threatNearby = this.hasNearbyCarriers(1, base.pos, base.radius * 1.6, boid, bases);
        if (threatNearby) {
          goal = base.pos.copy().add(new Vector2D(base.radius * 0.6, 0));
        } else {
          goal = new Vector2D(boid.pos.x * 0.55, boid.pos.y * 0.5);
        }
      }
    } else {
      // Enemy team follows AI goal
      goal = enemyGoal;
    }
    
    if (goal) {
      const seek = new Vector2D(goal.x - boid.pos.x, goal.y - boid.pos.y)
        .setMag(stats.maxSpeed)
        .sub(boid.vel)
        .limit(stats.maxForce * 1.4);
      return seek;
    }
    
    return null;
  }

  private calculateAuraForce(boid: Boid, bases: Base[]): Vector2D | null {
    const enemyBase = bases[1 - boid.team];
    const dx = enemyBase.pos.x - boid.pos.x;
    const dy = enemyBase.pos.y - boid.pos.y;
    const dist = Math.hypot(dx, dy);
    const auraRadius = enemyBase.getAuraRadius();
    
    if (dist < auraRadius) {
      const strength = (1 - dist / auraRadius) * 0.8 * enemyBase.aura;
      const push = new Vector2D(-dx, -dy).setMag(strength);
      
      // Stronger push if carrying
      if (boid.isCarrying()) {
        push.mult(1.6);
      }
      
      return push;
    }
    
    return null;
  }

  private handleInteractions(
    boidIndex: number,
    boid: Boid,
    bases: Base[],
    dots: Dot[],
    neighbors: number[],
    boids: Boid[]
  ): void {
    // Try to pick up dots
    if (!boid.isCarrying()) {
      this.tryPickup(boidIndex, boid, bases, dots);
    }
    
    // Try to deposit at base
    this.tryDeposit(boid, bases, dots);
    
    // Drop if outnumbered
    this.dropIfOutnumbered(boidIndex, boid, neighbors, boids, dots);
  }

  private tryPickup(boidIndex: number, boid: Boid, bases: Base[], dots: Dot[]): void {
    // Look for free dots first
    let bestDot = -1;
    let bestDist2 = Infinity;
    const pickupRadius2 = GameConfig.dots.pickupRadius * GameConfig.dots.pickupRadius;
    
    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i];
      if (dot.state !== DotState.Free) continue;
      
      const dx = dot.pos.x - boid.pos.x;
      const dy = dot.pos.y - boid.pos.y;
      const d2 = dx * dx + dy * dy;
      
      if (d2 < bestDist2 && d2 < pickupRadius2) {
        bestDot = i;
        bestDist2 = d2;
      }
    }
    
    if (bestDot >= 0) {
      boid.pickupDot(bestDot);
      dots[bestDot].pickUp(boidIndex);
      return;
    }
    
    // Try to steal from enemy base
    const enemyBase = bases[1 - boid.team];
    const dx = enemyBase.pos.x - boid.pos.x;
    const dy = enemyBase.pos.y - boid.pos.y;
    const stealRadius2 = (enemyBase.radius * 0.9) * (enemyBase.radius * 0.9);
    
    if (dx * dx + dy * dy < stealRadius2 && enemyBase.stock.length > 0) {
      const dotId = enemyBase.stealDot();
      if (dotId !== null) {
        boid.pickupDot(dotId);
        dots[dotId].pickUp(boidIndex);
      }
    }
  }

  private tryDeposit(boid: Boid, bases: Base[], dots: Dot[]): void {
    if (!boid.isCarrying()) return;
    
    const homeBase = bases[boid.team];
    const dx = homeBase.pos.x - boid.pos.x;
    const dy = homeBase.pos.y - boid.pos.y;
    const depositRadius2 = (homeBase.radius * 0.95) * (homeBase.radius * 0.95);
    
    if (dx * dx + dy * dy < depositRadius2) {
      const dotIndex = boid.carry;
      const dot = dots[dotIndex];
      
      dot.deposit(boid.team, homeBase);
      homeBase.depositDot(dotIndex);
      boid.dropCarried();
    }
  }

  private dropIfOutnumbered(
    boidIndex: number,
    boid: Boid,
    neighbors: number[],
    boids: Boid[],
    dots: Dot[]
  ): void {
    if (!boid.isCarrying()) return;
    
    let enemyClose = 0;
    const dropRadius2 = 18 * 18;
    
    for (const j of neighbors) {
      if (j === boidIndex) continue;
      const other = boids[j];
      if (!other || other.team === boid.team) continue;
      
      const dx = other.pos.x - boid.pos.x;
      const dy = other.pos.y - boid.pos.y;
      
      if (dx * dx + dy * dy < dropRadius2) {
        enemyClose++;
      }
    }
    
    if (enemyClose >= 2) {
      const dot = dots[boid.carry];
      dot.drop(boid.vel);
      boid.dropCarried();
    }
  }

  private hasNearbyCarriers(
    _team: number,
    _pos: Vector2D,
    _radius: number,
    _currentBoid: Boid,
    _bases: Base[]
  ): boolean {
    // Simplified check - would need access to all boids
    // For now, return false
    return false;
  }
}