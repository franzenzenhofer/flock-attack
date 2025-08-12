import { Boid } from '../entities/Boid';
import { Base } from '../entities/Base';
import { Dot, DotState } from '../entities/Dot';
import { Storm } from '../entities/Storm';
import { Colors, GameConfig } from '../utils/Config';

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private dpr: number;

  constructor(
    private canvas: HTMLCanvasElement
  ) {
    const context = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true
    });
    
    if (!context) {
      throw new Error('Failed to get 2D context');
    }
    
    this.ctx = context;
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    
    this.canvas.width = Math.floor(width * this.dpr);
    this.canvas.height = Math.floor(height * this.dpr);
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  drawBackground(stockDifference: number): void {
    // Calculate advantage tint
    const t = Math.max(-1, Math.min(1, stockDifference / 14));
    
    // Gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
    gradient.addColorStop(0, Colors.bg0);
    gradient.addColorStop(1, Colors.bg1);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Team advantage glows
    this.ctx.globalCompositeOperation = 'lighter';
    
    // Player glow
    this.ctx.fillStyle = `rgba(122,228,255,${0.08 + 0.14 * Math.max(0, t)})`;
    this.ctx.beginPath();
    this.ctx.arc(this.width * 0.25, this.height * 0.5, Math.min(this.width, this.height) * 0.5, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Enemy glow
    this.ctx.fillStyle = `rgba(255,122,223,${0.08 + 0.14 * Math.max(0, -t)})`;
    this.ctx.beginPath();
    this.ctx.arc(this.width * 0.75, this.height * 0.5, Math.min(this.width, this.height) * 0.5, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.globalCompositeOperation = 'source-over';
  }

  drawBase(base: Base, team: number): void {
    // Base glow
    this.ctx.beginPath();
    this.ctx.arc(base.pos.x, base.pos.y, base.radius, 0, Math.PI * 2);
    
    const fillGradient = this.ctx.createRadialGradient(
      base.pos.x, base.pos.y, base.radius * 0.2,
      base.pos.x, base.pos.y, base.radius
    );
    fillGradient.addColorStop(0, `rgba(255,255,255,${0.06 + base.flash * 0.4})`);
    fillGradient.addColorStop(1, 'rgba(255,255,255,0)');
    this.ctx.fillStyle = fillGradient;
    this.ctx.fill();
    
    // Aura ring
    this.ctx.beginPath();
    this.ctx.arc(base.pos.x, base.pos.y, base.getAuraRadius(), 0, Math.PI * 2);
    this.ctx.strokeStyle = team === 0 ? Colors.auraPlayer : Colors.auraEnemy;
    this.ctx.lineWidth = 10;
    this.ctx.stroke();
    
    // Progress arc
    if (base.progress > 0) {
      this.ctx.beginPath();
      this.ctx.arc(
        base.pos.x, base.pos.y, base.radius * 0.86,
        -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * base.progress
      );
      this.ctx.strokeStyle = team === 0 
        ? 'rgba(122,228,255,.9)' 
        : 'rgba(255,122,223,.9)';
      this.ctx.lineWidth = 4;
      this.ctx.stroke();
    }
  }

  drawStorms(storms: Storm[]): void {
    for (const storm of storms) {
      // Outer ring
      this.ctx.beginPath();
      this.ctx.arc(storm.pos.x, storm.pos.y, storm.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(255,255,255,.06)';
      this.ctx.lineWidth = 14;
      this.ctx.stroke();
      
      // Inner ring
      this.ctx.beginPath();
      this.ctx.arc(storm.pos.x, storm.pos.y, storm.radius * 0.65, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(255,255,255,.08)';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
    }
  }

  drawDots(dots: Dot[]): void {
    for (const dot of dots) {
      const color = dot.state === DotState.Free 
        ? Colors.free 
        : (dot.owner === 0 ? Colors.player : Colors.enemy);
      
      // Dot with glow
      this.ctx.beginPath();
      this.ctx.arc(dot.pos.x, dot.pos.y, GameConfig.dots.dropRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = color;
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 8;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
      
      // Extra glow for free dots
      if (dot.state === DotState.Free) {
        this.ctx.globalCompositeOperation = 'lighter';
        this.ctx.globalAlpha = 0.25;
        this.ctx.beginPath();
        this.ctx.arc(dot.pos.x, dot.pos.y, 8, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
        this.ctx.globalCompositeOperation = 'source-over';
      }
    }
  }

  drawBoid(boid: Boid, base: Base): void {
    const angle = Math.atan2(boid.vel.y, boid.vel.x);
    const size = 7.5 + Math.min(4, base.level * 0.4);
    const wing = 4;
    const color = boid.team === 0 ? Colors.player : Colors.enemy;
    
    this.ctx.save();
    this.ctx.translate(boid.pos.x, boid.pos.y);
    this.ctx.rotate(angle);
    
    // Draw boid shape
    this.ctx.globalCompositeOperation = 'lighter';
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(size, 0);
    this.ctx.lineTo(-size * 0.8, wing);
    this.ctx.lineTo(-size * 0.4, 0);
    this.ctx.lineTo(-size * 0.8, -wing);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.globalCompositeOperation = 'source-over';
    
    // Carrying indicator
    if (boid.isCarrying()) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(-size * 0.9, 0);
      this.ctx.strokeStyle = 'rgba(255,255,255,.35)';
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
    }
    
    this.ctx.restore();
    
    // Stun effect
    if (boid.stun > 0) {
      this.ctx.globalCompositeOperation = 'lighter';
      this.ctx.beginPath();
      this.ctx.arc(boid.pos.x, boid.pos.y, 8, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255,255,255,.35)';
      this.ctx.fill();
      this.ctx.globalCompositeOperation = 'source-over';
    }
  }

  drawBoids(boids: Boid[], bases: Base[]): void {
    for (const boid of boids) {
      this.drawBoid(boid, bases[boid.team]);
    }
  }
}