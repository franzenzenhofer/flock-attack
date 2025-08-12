import { Vector2D } from '../core/Vector2D';
import { Boid } from '../entities/Boid';

export class FlockDispersion {
  private static readonly MAX_CLUSTER_SIZE = 15;
  private static readonly DISPERSION_RADIUS = 100;
  private static readonly CLUSTER_DETECTION_RADIUS = 60;
  
  static preventMassiveClustering(boids: Boid[]): Map<number, Vector2D> {
    const dispersions = new Map<number, Vector2D>();
    const clusters = this.detectClusters(boids);
    
    for (const cluster of clusters) {
      if (cluster.size > this.MAX_CLUSTER_SIZE) {
        this.disperseCluster(cluster, dispersions);
      }
    }
    
    return dispersions;
  }
  
  private static detectClusters(boids: Boid[]): Set<Set<Boid>> {
    const clusters = new Set<Set<Boid>>();
    const visited = new Set<number>();
    
    for (const boid of boids) {
      if (visited.has(boid.id)) continue;
      
      const cluster = new Set<Boid>();
      this.findClusterMembers(boid, boids, cluster, visited);
      
      if (cluster.size > 1) {
        clusters.add(cluster);
      }
    }
    
    return clusters;
  }
  
  private static findClusterMembers(
    current: Boid,
    allBoids: Boid[],
    cluster: Set<Boid>,
    visited: Set<number>
  ): void {
    if (visited.has(current.id)) return;
    
    visited.add(current.id);
    cluster.add(current);
    
    for (const other of allBoids) {
      if (other.team !== current.team) continue;
      if (visited.has(other.id)) continue;
      
      const dist = Math.hypot(other.pos.x - current.pos.x, other.pos.y - current.pos.y);
      if (dist < this.CLUSTER_DETECTION_RADIUS) {
        this.findClusterMembers(other, allBoids, cluster, visited);
      }
    }
  }
  
  private static disperseCluster(cluster: Set<Boid>, dispersions: Map<number, Vector2D>): void {
    const members = Array.from(cluster);
    const center = this.getClusterCenter(members);
    
    const excess = members.length - this.MAX_CLUSTER_SIZE;
    const toDisperse = members
      .sort((a, b) => {
        const distA = Math.hypot(a.pos.x - center.x, a.pos.y - center.y);
        const distB = Math.hypot(b.pos.x - center.x, b.pos.y - center.y);
        return distB - distA;
      })
      .slice(0, Math.ceil(excess * 1.5));
    
    for (let i = 0; i < toDisperse.length; i++) {
      const boid = toDisperse[i];
      const angle = (i / toDisperse.length) * Math.PI * 2;
      const dispersion = new Vector2D(
        Math.cos(angle) * this.DISPERSION_RADIUS,
        Math.sin(angle) * this.DISPERSION_RADIUS
      );
      dispersions.set(boid.id, dispersion);
    }
  }
  
  private static getClusterCenter(boids: Boid[]): Vector2D {
    let sumX = 0, sumY = 0;
    for (const boid of boids) {
      sumX += boid.pos.x;
      sumY += boid.pos.y;
    }
    return new Vector2D(sumX / boids.length, sumY / boids.length);
  }
  
  static applyEdgeSpread(boids: Boid[], width: number, height: number): Map<number, Vector2D> {
    const spreadForces = new Map<number, Vector2D>();
    const margin = 100;
    const spreadStrength = 50;
    
    for (const boid of boids) {
      const nearbyCount = boids.filter(b => 
        b.team === boid.team && 
        b.id !== boid.id &&
        Math.hypot(b.pos.x - boid.pos.x, b.pos.y - boid.pos.y) < 30
      ).length;
      
      if (nearbyCount > 8) {
        const force = new Vector2D(0, 0);
        
        if (boid.pos.x < margin) {
          force.x = spreadStrength;
        } else if (boid.pos.x > width - margin) {
          force.x = -spreadStrength;
        }
        
        if (boid.pos.y < margin) {
          force.y = spreadStrength;
        } else if (boid.pos.y > height - margin) {
          force.y = -spreadStrength;
        }
        
        if (force.mag() > 0) {
          spreadForces.set(boid.id, force);
        }
      }
    }
    
    return spreadForces;
  }
  
  static formationSplit(boids: Boid[], targetPosition: Vector2D): Map<number, Vector2D> {
    const formations = new Map<number, Vector2D>();
    const teamBoids = new Map<number, Boid[]>();
    
    for (const boid of boids) {
      if (!teamBoids.has(boid.team)) {
        teamBoids.set(boid.team, []);
      }
      teamBoids.get(boid.team)!.push(boid);
    }
    
    for (const [, members] of teamBoids) {
      if (members.length > 20) {
        const squads = Math.ceil(members.length / 12);
        
        for (let i = 0; i < members.length; i++) {
          const squad = i % squads;
          const angle = (squad / squads) * Math.PI * 2 - Math.PI;
          const offset = new Vector2D(
            Math.cos(angle) * 80,
            Math.sin(angle) * 80
          );
          
          const formationTarget = new Vector2D(
            targetPosition.x + offset.x,
            targetPosition.y + offset.y
          );
          
          formations.set(members[i].id, formationTarget);
        }
      }
    }
    
    return formations;
  }
}