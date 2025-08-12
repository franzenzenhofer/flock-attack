import { Vector2D } from '../core/Vector2D';
import { Boid } from '../entities/Boid';
import { MathUtils } from '../utils/MathUtils';

export class ChaosEvent {
  private isActive: boolean = false;
  private chaosTimer: number = 0;
  private chaosDuration: number = 2.0;
  private nextChaosTime: number = 120.0;
  private timeSinceLastChaos: number = 0;
  private chaosVelocities: Map<number, Vector2D> = new Map();
  private explosionCenter: Vector2D | null = null;
  
  update(dt: number, noInputTime: number, boids: Boid[], width: number, height: number): void {
    this.timeSinceLastChaos += dt;
    
    if (!this.isActive && noInputTime > 5) {
      const chaosProbability = this.calculateChaosProbability();
      if (Math.random() < chaosProbability * dt) {
        this.triggerChaos(boids, width, height);
      }
    }
    
    if (this.isActive) {
      this.chaosTimer += dt;
      if (this.chaosTimer >= this.chaosDuration) {
        this.endChaos();
      }
    }
  }
  
  private triggerChaos(boids: Boid[], width: number, height: number): void {
    this.isActive = true;
    this.chaosTimer = 0;
    this.timeSinceLastChaos = 0;
    this.nextChaosTime = MathUtils.randomRange(100, 140);
    
    this.explosionCenter = new Vector2D(
      MathUtils.randomRange(width * 0.2, width * 0.8),
      MathUtils.randomRange(height * 0.2, height * 0.8)
    );
    
    this.chaosVelocities.clear();
    
    for (const boid of boids) {
      const fromCenter = new Vector2D(
        boid.pos.x - this.explosionCenter.x,
        boid.pos.y - this.explosionCenter.y
      );
      
      const dist = fromCenter.mag();
      const explosionForce = Math.max(0, 1 - dist / 500);
      
      const randomAngle = MathUtils.randomRange(-Math.PI / 3, Math.PI / 3);
      const baseAngle = Math.atan2(fromCenter.y, fromCenter.x);
      const finalAngle = baseAngle + randomAngle;
      
      const speed = MathUtils.randomRange(3, 8) * (1 + explosionForce);
      
      const chaosVel = new Vector2D(
        Math.cos(finalAngle) * speed,
        Math.sin(finalAngle) * speed
      );
      
      this.chaosVelocities.set(boid.id, chaosVel);
    }
  }
  
  private calculateChaosProbability(): number {
    const minTime = 90;
    const maxTime = 180;
    
    if (this.timeSinceLastChaos < minTime) return 0;
    
    const timeFactor = (this.timeSinceLastChaos - minTime) / (maxTime - minTime);
    const probability = Math.min(1, timeFactor * timeFactor) * 0.01;
    
    return probability;
  }
  
  private endChaos(): void {
    this.isActive = false;
    this.chaosVelocities.clear();
    this.explosionCenter = null;
  }
  
  isChaosModeActive(): boolean {
    return this.isActive;
  }
  
  getChaosVelocity(boidId: number): Vector2D | null {
    return this.chaosVelocities.get(boidId) || null;
  }
  
  getExplosionCenter(): Vector2D | null {
    return this.explosionCenter;
  }
  
  getChaosProgress(): number {
    if (!this.isActive) return 0;
    return this.chaosTimer / this.chaosDuration;
  }
  
  getTimeToNextChaos(): number {
    if (this.isActive) return 0;
    return Math.max(0, this.nextChaosTime - this.timeSinceLastChaos);
  }
}