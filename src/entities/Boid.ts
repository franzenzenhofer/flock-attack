import { Vector2D } from '../core/Vector2D';
import { Team, GameConfig } from '../utils/Config';
import { Base } from './Base';

export interface BoidStats {
  perception: number;
  sepR: number;
  maxSpeed: number;
  maxForce: number;
  aura: number;
}

export class Boid {
  public pos: Vector2D;
  public vel: Vector2D;
  public acc: Vector2D;
  public carry: number = -1; // Index of carried dot, -1 if none
  public stun: number = 0;

  constructor(
    public team: Team,
    public id: number,
    base: Base
  ) {
    // Spawn near base with random offset
    const angle = Math.random() * Math.PI * 2;
    const radius = base.radius * 0.6 + Math.random() * base.radius * 0.5;
    this.pos = base.pos.copy().add(Vector2D.from(angle).mult(radius));
    
    // Random initial velocity
    this.vel = Vector2D.from(Math.random() * Math.PI * 2).mult(1 + Math.random());
    this.acc = new Vector2D();
  }

  apply(force: Vector2D): void {
    this.acc.add(force);
  }

  step(dtN: number, stats: BoidStats, width: number, height: number): void {
    // Decay stun
    if (this.stun > 0) {
      this.stun -= dtN / 6;
      if (this.stun < 0) this.stun = 0;
    }

    // Physics integration
    this.vel.add(this.acc).limit(stats.maxSpeed);
    this.pos.add(this.vel.copy().mult(dtN));
    this.acc.set(0, 0);

    // Screen wrapping
    const margin = 18;
    if (this.pos.x < -margin) {
      this.pos.x = width + margin;
    } else if (this.pos.x > width + margin) {
      this.pos.x = -margin;
    }
    
    if (this.pos.y < -margin) {
      this.pos.y = height + margin;
    } else if (this.pos.y > height + margin) {
      this.pos.y = -margin;
    }
  }

  isCarrying(): boolean {
    return this.carry >= 0;
  }

  dropCarried(): void {
    this.carry = -1;
    this.stun = 0.15;
  }

  pickupDot(dotIndex: number): void {
    this.carry = dotIndex;
  }

  static calculateStats(level: number): BoidStats {
    const config = GameConfig.boids;
    return {
      perception: config.basePerception + level * 2.5,
      sepR: config.baseSeparation + Math.min(14, level * 1.2),
      maxSpeed: config.baseMaxSpeed * (1 + Math.min(0.45, level * 0.06)),
      maxForce: config.baseMaxForce * (1 + Math.min(0.4, level * 0.05)),
      aura: 1 + level * 0.22,
    };
  }
}