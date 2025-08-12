import { Vector2D } from '../core/Vector2D';

export class MathUtils {
  static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
  
  static lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }
  
  static smoothStep(edge0: number, edge1: number, x: number): number {
    const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }
  
  static randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }
  
  static randomInt(min: number, max: number): number {
    return Math.floor(this.randomRange(min, max + 1));
  }
  
  static angleToVector(angle: number): Vector2D {
    return new Vector2D(Math.cos(angle), Math.sin(angle));
  }
  
  static vectorToAngle(v: Vector2D): number {
    return Math.atan2(v.y, v.x);
  }
  
  static normalizeAngle(angle: number): number {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
  }
  
  static distanceSquared(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
  }
  
  static getCirclePoints(center: Vector2D, radius: number, count: number): Vector2D[] {
    const points: Vector2D[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      points.push(new Vector2D(
        center.x + Math.cos(angle) * radius,
        center.y + Math.sin(angle) * radius
      ));
    }
    return points;
  }
  
  static getSpiralPoints(center: Vector2D, startRadius: number, endRadius: number, count: number): Vector2D[] {
    const points: Vector2D[] = [];
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const angle = t * Math.PI * 4;
      const radius = this.lerp(startRadius, endRadius, t);
      points.push(new Vector2D(
        center.x + Math.cos(angle) * radius,
        center.y + Math.sin(angle) * radius
      ));
    }
    return points;
  }
}