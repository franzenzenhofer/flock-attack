import { Vector2D } from '../core/Vector2D';
import { Boid } from '../entities/Boid';
import { Base } from '../entities/Base';
import { Dot } from '../entities/Dot';
import { Storm } from '../entities/Storm';

export interface IStrategy {
  execute(context: StrategyContext): Vector2D | null;
  evaluate(context: StrategyContext): number;
}

export interface StrategyContext {
  playerBoids: Boid[];
  enemyBoids: Boid[];
  bases: Base[];
  dots: Dot[];
  storms: Storm[];
  width: number;
  height: number;
  team: number;
}

export abstract class BaseStrategy implements IStrategy {
  protected priority: number = 1;
  
  abstract execute(context: StrategyContext): Vector2D | null;
  
  evaluate(context: StrategyContext): number {
    return this.calculateScore(context) * this.priority;
  }
  
  protected abstract calculateScore(context: StrategyContext): number;
  
  protected getSwarmCenter(boids: Boid[]): Vector2D {
    if (boids.length === 0) return new Vector2D(0, 0);
    
    const sum = boids.reduce((acc, boid) => {
      acc.x += boid.pos.x;
      acc.y += boid.pos.y;
      return acc;
    }, new Vector2D(0, 0));
    
    return sum.div(boids.length);
  }
  
  protected countNearbyUnits(position: Vector2D, units: Boid[], radius: number): number {
    return units.filter(unit => 
      position.distanceTo(unit.pos) < radius
    ).length;
  }
  
  protected findSafePosition(
    target: Vector2D,
    threats: Vector2D[],
    safeDistance: number
  ): Vector2D {
    if (threats.length === 0) return target;
    
    const angles = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2);
    let bestPos = target;
    let bestScore = -Infinity;
    
    for (const angle of angles) {
      const testPos = new Vector2D(
        target.x + Math.cos(angle) * safeDistance,
        target.y + Math.sin(angle) * safeDistance
      );
      
      const minThreatDist = Math.min(...threats.map(t => t.distanceTo(testPos)));
      if (minThreatDist > bestScore) {
        bestScore = minThreatDist;
        bestPos = testPos;
      }
    }
    
    return bestPos;
  }
}