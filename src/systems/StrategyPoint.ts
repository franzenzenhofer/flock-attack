import { Vector2D } from '../core/Vector2D';

export enum StrategyType {
  Gather = 'gather',
  Patrol = 'patrol',
  Defend = 'defend',
  Attack = 'attack',
  Intercept = 'intercept'
}

export class StrategyPoint {
  public position: Vector2D;
  public type: StrategyType;
  public priority: number;
  public radius: number;
  public active: boolean = true;
  public duration: number = 0;
  public elapsed: number = 0;

  constructor(x: number, y: number, type: StrategyType, priority: number = 1, radius: number = 50) {
    this.position = new Vector2D(x, y);
    this.type = type;
    this.priority = priority;
    this.radius = radius;
  }

  update(dt: number): void {
    if (this.duration > 0) {
      this.elapsed += dt;
      if (this.elapsed >= this.duration) {
        this.active = false;
      }
    }
  }

  getInfluence(pos: Vector2D): number {
    const dist = this.position.distanceTo(pos);
    if (dist > this.radius * 2) return 0;
    return Math.max(0, 1 - dist / (this.radius * 2)) * this.priority;
  }

  isInRange(pos: Vector2D): boolean {
    return this.position.distanceTo(pos) <= this.radius;
  }
}

export class StrategyManager {
  private points: StrategyPoint[] = [];
  private maxPoints: number = 5;

  addPoint(point: StrategyPoint): void {
    this.points.push(point);
    if (this.points.length > this.maxPoints) {
      this.points.shift();
    }
  }

  update(dt: number): void {
    this.points = this.points.filter(p => {
      p.update(dt);
      return p.active;
    });
  }

  getActivePoints(): StrategyPoint[] {
    return this.points.filter(p => p.active);
  }

  getBestPoint(position: Vector2D, preferredType?: StrategyType): StrategyPoint | null {
    let best: StrategyPoint | null = null;
    let bestScore = 0;

    for (const point of this.points) {
      if (!point.active) continue;
      
      let score = point.getInfluence(position);
      if (preferredType && point.type === preferredType) {
        score *= 1.5;
      }
      
      if (score > bestScore) {
        bestScore = score;
        best = point;
      }
    }

    return best;
  }

  clear(): void {
    this.points = [];
  }
}