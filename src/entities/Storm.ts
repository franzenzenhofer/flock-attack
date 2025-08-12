import { Vector2D } from '../core/Vector2D';
import { GameConfig } from '../utils/Config';

export class Storm {
  public pos: Vector2D;
  public radius: number;
  public phase: number;
  public velocity: number; // Radians per second for drift

  constructor(width: number, height: number) {
    const minDimension = Math.min(width, height);
    
    this.pos = new Vector2D(
      width * 0.5 + (Math.random() - 0.5) * width * 0.6,
      height * 0.5 + (Math.random() - 0.5) * height * 0.4
    );
    
    this.radius = minDimension * (GameConfig.storms.baseRadius + Math.random() * 0.04);
    this.phase = Math.random() * Math.PI * 2;
    this.velocity = 0.25 + Math.random() * 0.25;
  }

  update(dtS: number, width: number, height: number): void {
    // Update phase for movement pattern
    this.phase += this.velocity * dtS;
    
    // Drift movement
    const drift = GameConfig.storms.driftSpeed * dtS;
    this.pos.x += Math.cos(this.phase) * drift;
    this.pos.y += Math.sin(this.phase * 0.9) * drift;
    
    // Bounce off edges by changing phase
    if (this.pos.x < 0 || this.pos.x > width) {
      this.phase += Math.PI * 0.5;
    }
    if (this.pos.y < 0 || this.pos.y > height) {
      this.phase += Math.PI * 0.5;
    }
    
    // Keep within bounds
    this.pos.x = Math.max(0, Math.min(width, this.pos.x));
    this.pos.y = Math.max(0, Math.min(height, this.pos.y));
  }

  getRepulsionForce(targetPos: Vector2D): Vector2D | null {
    const dx = targetPos.x - this.pos.x;
    const dy = targetPos.y - this.pos.y;
    const dist2 = dx * dx + dy * dy;
    const r2 = this.radius * this.radius;
    
    if (dist2 < r2 && dist2 > 0) {
      const dist = Math.sqrt(dist2);
      const strength = (1 - dist / this.radius) * GameConfig.storms.repelForce;
      return new Vector2D(-dx / dist, -dy / dist).mult(strength);
    }
    
    return null;
  }
}