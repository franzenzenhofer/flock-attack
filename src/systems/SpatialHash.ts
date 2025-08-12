import { Boid } from '../entities/Boid';
import { BoidStats } from '../entities/Boid';

export class SpatialHash {
  private grid: Map<number, number[]> = new Map();
  private cellSize: number;

  constructor(cellSize: number = 48) {
    this.cellSize = cellSize;
  }

  clear(): void {
    this.grid.clear();
  }

  updateCellSize(averagePerception: number): void {
    this.cellSize = Math.max(32, Math.floor(averagePerception * 0.9));
  }

  rebuild(boids: Boid[]): void {
    this.clear();
    
    for (let i = 0; i < boids.length; i++) {
      const boid = boids[i];
      const ix = Math.floor(boid.pos.x / this.cellSize);
      const iy = Math.floor(boid.pos.y / this.cellSize);
      const key = this.getKey(ix, iy);
      
      let arr = this.grid.get(key);
      if (!arr) {
        arr = [];
        this.grid.set(key, arr);
      }
      arr.push(i);
    }
  }

  private getKey(ix: number, iy: number): number {
    return (ix << 16) ^ (iy & 0xffff);
  }

  getNeighbors(boid: Boid, boids: Boid[], stats: BoidStats): number[] {
    const neighbors: number[] = [];
    const ix = Math.floor(boid.pos.x / this.cellSize);
    const iy = Math.floor(boid.pos.y / this.cellSize);
    const per2 = stats.perception * stats.perception;
    
    // Check 3x3 grid around boid
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        const key = this.getKey(ix + ox, iy + oy);
        const arr = this.grid.get(key);
        
        if (!arr) continue;
        
        for (const j of arr) {
          const other = boids[j];
          if (other === boid) continue;
          
          const dx = other.pos.x - boid.pos.x;
          const dy = other.pos.y - boid.pos.y;
          const d2 = dx * dx + dy * dy;
          
          if (d2 <= per2 && d2 > 0) {
            neighbors.push(j);
          }
        }
      }
    }
    
    return neighbors;
  }
}