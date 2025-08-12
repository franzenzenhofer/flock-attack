import { Vector2D } from '../core/Vector2D';
import { Boid } from '../entities/Boid';
import { Base } from '../entities/Base';
import { Dot, DotState } from '../entities/Dot';
import { Storm } from '../entities/Storm';
import { StrategyManager, StrategyPoint, StrategyType } from './StrategyPoint';
import { FlightPattern, PatternType } from './FlightPattern';

interface ThreatAssessment {
  position: Vector2D;
  danger: number;
  type: 'enemy' | 'storm' | 'base';
}


export class PlayerAutoAI {
  private strategyManager: StrategyManager;
  private currentPattern: FlightPattern | null = null;
  private lastDecisionTime: number = 0;
  private decisionInterval: number = 2.0;
  private currentObjective: 'defend' | 'collect' | 'raid' | 'intercept' = 'collect';
  
  constructor() {
    this.strategyManager = new StrategyManager();
  }

  update(
    dt: number,
    playerBoids: Boid[],
    enemyBoids: Boid[],
    bases: Base[],
    dots: Dot[],
    storms: Storm[],
    width: number,
    height: number
  ): Vector2D | null {
    this.lastDecisionTime += dt;
    
    if (this.lastDecisionTime >= this.decisionInterval) {
      this.lastDecisionTime = 0;
      this.makeStrategicDecision(playerBoids, enemyBoids, bases, dots, storms, width, height);
    }

    this.strategyManager.update(dt);

    const centerPos = this.getSwarmCenter(playerBoids);
    const bestStrategy = this.strategyManager.getBestPoint(centerPos);
    
    if (bestStrategy) {
      return bestStrategy.position;
    }

    return this.getDefaultTarget(playerBoids, enemyBoids, bases, dots, storms, width, height);
  }

  private makeStrategicDecision(
    playerBoids: Boid[],
    enemyBoids: Boid[],
    bases: Base[],
    dots: Dot[],
    storms: Storm[],
    width: number,
    height: number
  ): void {
    const threats = this.assessThreats(enemyBoids, bases, storms);
    
    this.strategyManager.clear();

    const playerBase = bases[0];
    const enemyBase = bases[1];
    
    const stockAdvantage = playerBase.stock.length - enemyBase.stock.length;
    const boidAdvantage = playerBoids.length - enemyBoids.length;

    if (stockAdvantage < -5 || this.isBaseUnderAttack(playerBase, enemyBoids)) {
      this.currentObjective = 'defend';
      this.setupDefensiveStrategy(playerBase, threats);
    } else if (stockAdvantage > 8 && boidAdvantage > 10) {
      this.currentObjective = 'raid';
      this.setupRaidStrategy(enemyBase, playerBoids, enemyBoids);
    } else if (this.hasValuableTargets(dots)) {
      this.currentObjective = 'collect';
      this.setupCollectionStrategy(dots, threats, width, height);
    } else {
      this.currentObjective = 'intercept';
      this.setupInterceptStrategy(enemyBoids, playerBoids, width, height);
    }

    this.updateFlightPattern(playerBoids);
  }

  private setupDefensiveStrategy(base: Base, _threats: ThreatAssessment[]): void {
    const basePos = new Vector2D(base.pos.x, base.pos.y);
    
    this.strategyManager.addPoint(
      new StrategyPoint(base.pos.x, base.pos.y, StrategyType.Defend, 3, base.radius * 2)
    );

    const perimeterPoints = 4;
    for (let i = 0; i < perimeterPoints; i++) {
      const angle = (i / perimeterPoints) * Math.PI * 2;
      const dist = base.radius * 2.5;
      this.strategyManager.addPoint(
        new StrategyPoint(
          base.pos.x + Math.cos(angle) * dist,
          base.pos.y + Math.sin(angle) * dist,
          StrategyType.Patrol,
          2,
          50
        )
      );
    }

    this.currentPattern = new FlightPattern(PatternType.Circle, basePos);
  }

  private setupRaidStrategy(enemyBase: Base, _playerBoids: Boid[], enemyBoids: Boid[]): void {
    const basePos = new Vector2D(enemyBase.pos.x, enemyBase.pos.y);
    
    const enemiesNearBase = enemyBoids.filter(b => {
      const dist = Math.hypot(b.pos.x - enemyBase.pos.x, b.pos.y - enemyBase.pos.y);
      return dist < enemyBase.radius * 3;
    });

    if (enemiesNearBase.length < 5) {
      this.strategyManager.addPoint(
        new StrategyPoint(enemyBase.pos.x, enemyBase.pos.y, StrategyType.Attack, 3, enemyBase.radius)
      );
      this.currentPattern = new FlightPattern(PatternType.Pincer, basePos);
    } else {
      const feintAngle = Math.random() * Math.PI * 2;
      const feintDist = enemyBase.radius * 3;
      this.strategyManager.addPoint(
        new StrategyPoint(
          enemyBase.pos.x + Math.cos(feintAngle) * feintDist,
          enemyBase.pos.y + Math.sin(feintAngle) * feintDist,
          StrategyType.Attack,
          2,
          100
        )
      );
      this.currentPattern = new FlightPattern(PatternType.Split, basePos);
    }
  }

  private setupCollectionStrategy(dots: Dot[], threats: ThreatAssessment[], _width: number, _height: number): void {
    const freeDots = dots.filter(d => d.state === DotState.Free);
    const safeDots = freeDots.filter(dot => {
      const dotPos = new Vector2D(dot.pos.x, dot.pos.y);
      const nearestThreat = this.getNearestThreat(dotPos, threats);
      return !nearestThreat || nearestThreat.danger < 0.3;
    });

    const targetDots = safeDots.length > 0 ? safeDots : freeDots;
    
    for (let i = 0; i < Math.min(3, targetDots.length); i++) {
      const dot = targetDots[i];
      this.strategyManager.addPoint(
        new StrategyPoint(dot.pos.x, dot.pos.y, StrategyType.Gather, 2 - i * 0.5, 40)
      );
    }

    if (targetDots.length > 0) {
      const firstDot = targetDots[0];
      this.currentPattern = new FlightPattern(
        PatternType.VFormation, 
        new Vector2D(firstDot.pos.x, firstDot.pos.y)
      );
    }
  }

  private setupInterceptStrategy(enemyBoids: Boid[], _playerBoids: Boid[], width: number, height: number): void {
    const enemyCarriers = enemyBoids.filter(b => b.carry !== -1);
    
    if (enemyCarriers.length > 0) {
      for (let i = 0; i < Math.min(2, enemyCarriers.length); i++) {
        const carrier = enemyCarriers[i];
        const interceptPoint = this.predictInterceptPoint(carrier, width, height);
        this.strategyManager.addPoint(
          new StrategyPoint(
            interceptPoint.x,
            interceptPoint.y,
            StrategyType.Intercept,
            3 - i,
            60
          )
        );
      }
      this.currentPattern = new FlightPattern(PatternType.Diamond, 
        new Vector2D(enemyCarriers[0].pos.x, enemyCarriers[0].pos.y));
    } else {
      const centerX = width / 2;
      const centerY = height / 2;
      this.strategyManager.addPoint(
        new StrategyPoint(centerX, centerY, StrategyType.Patrol, 1, 100)
      );
      this.currentPattern = new FlightPattern(PatternType.Swarm, 
        new Vector2D(centerX, centerY));
    }
  }

  private updateFlightPattern(playerBoids: Boid[]): void {
    if (!this.currentPattern) return;

    const availableBoids = playerBoids.filter(b => b.stun === 0);
    const formationSize = Math.min(
      Math.floor(availableBoids.length * 0.6),
      20
    );

    this.currentPattern.assignBoids(availableBoids, formationSize);
  }

  private assessThreats(enemyBoids: Boid[], bases: Base[], storms: Storm[]): ThreatAssessment[] {
    const threats: ThreatAssessment[] = [];

    for (const enemy of enemyBoids) {
      const groupSize = enemyBoids.filter(e => 
        Math.hypot(e.pos.x - enemy.pos.x, e.pos.y - enemy.pos.y) < 50
      ).length;
      
      threats.push({
        position: new Vector2D(enemy.pos.x, enemy.pos.y),
        danger: groupSize / 10,
        type: 'enemy'
      });
    }

    const enemyBase = bases[1];
    threats.push({
      position: new Vector2D(enemyBase.pos.x, enemyBase.pos.y),
      danger: 0.7 + enemyBase.level * 0.1,
      type: 'base'
    });

    for (const storm of storms) {
      threats.push({
        position: new Vector2D(storm.pos.x, storm.pos.y),
        danger: 0.5,
        type: 'storm'
      });
    }

    return threats;
  }


  private getDefaultTarget(
    playerBoids: Boid[],
    enemyBoids: Boid[],
    bases: Base[],
    dots: Dot[],
    storms: Storm[],
    width: number,
    height: number
  ): Vector2D | null {
    const playerBase = bases[0];
    const enemyBase = bases[1];

    const carriers = playerBoids.filter(b => b.carry !== -1);
    if (carriers.length > playerBoids.length * 0.3) {
      return new Vector2D(playerBase.pos.x, playerBase.pos.y);
    }

    const freeDots = dots.filter(d => d.state === DotState.Free);
    if (freeDots.length > 0) {
      const nearest = this.findNearestSafeDot(
        this.getSwarmCenter(playerBoids),
        freeDots,
        storms
      );
      if (nearest) {
        return new Vector2D(nearest.pos.x, nearest.pos.y);
      }
    }

    const enemyCarriers = enemyBoids.filter(b => b.carry !== -1);
    if (enemyCarriers.length > 0 && playerBoids.length > enemyBoids.length) {
      const target = enemyCarriers[0];
      return new Vector2D(target.pos.x, target.pos.y);
    }

    if (enemyBase.stock.length > 5 && playerBoids.length > 20) {
      return new Vector2D(enemyBase.pos.x, enemyBase.pos.y);
    }

    return new Vector2D(width / 2, height / 2);
  }

  private getSwarmCenter(boids: Boid[]): Vector2D {
    if (boids.length === 0) return new Vector2D(0, 0);
    
    let sumX = 0, sumY = 0;
    for (const boid of boids) {
      sumX += boid.pos.x;
      sumY += boid.pos.y;
    }
    
    return new Vector2D(sumX / boids.length, sumY / boids.length);
  }

  private isBaseUnderAttack(base: Base, enemyBoids: Boid[]): boolean {
    const nearbyEnemies = enemyBoids.filter(b => {
      const dist = Math.hypot(b.pos.x - base.pos.x, b.pos.y - base.pos.y);
      return dist < base.radius * 2.5;
    });
    
    return nearbyEnemies.length > 5;
  }

  private hasValuableTargets(dots: Dot[]): boolean {
    const freeDots = dots.filter(d => d.state === DotState.Free);
    return freeDots.length > 2;
  }

  private getNearestThreat(position: Vector2D, threats: ThreatAssessment[]): ThreatAssessment | null {
    let nearest: ThreatAssessment | null = null;
    let minDist = Infinity;
    
    for (const threat of threats) {
      const dist = position.distanceTo(threat.position);
      if (dist < minDist) {
        minDist = dist;
        nearest = threat;
      }
    }
    
    return nearest;
  }

  private predictInterceptPoint(carrier: Boid, width: number, height: number): Vector2D {
    const predictTime = 2.0;
    let futureX = carrier.pos.x + carrier.vel.x * predictTime * 60;
    let futureY = carrier.pos.y + carrier.vel.y * predictTime * 60;
    
    futureX = Math.max(50, Math.min(width - 50, futureX));
    futureY = Math.max(50, Math.min(height - 50, futureY));
    
    return new Vector2D(futureX, futureY);
  }

  private findNearestSafeDot(position: Vector2D, dots: Dot[], storms: Storm[]): Dot | null {
    let nearest: Dot | null = null;
    let minDist = Infinity;
    
    for (const dot of dots) {
      const dotPos = new Vector2D(dot.pos.x, dot.pos.y);
      const dist = position.distanceTo(dotPos);
      
      let isSafe = true;
      for (const storm of storms) {
        const stormDist = Math.hypot(dot.pos.x - storm.pos.x, dot.pos.y - storm.pos.y);
        if (stormDist < storm.radius * 1.5) {
          isSafe = false;
          break;
        }
      }
      
      if (isSafe && dist < minDist) {
        minDist = dist;
        nearest = dot;
      }
    }
    
    return nearest;
  }

  getCurrentObjective(): string {
    return this.currentObjective;
  }

  getCurrentPattern(): PatternType | null {
    return this.currentPattern ? PatternType.VFormation : null;
  }
}