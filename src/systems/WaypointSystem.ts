import { Vector2D } from '../core/Vector2D';

export interface Waypoint {
  id: number;
  position: Vector2D;
  radius: number;
  visited: Set<number>; // Track which boids have visited
  isActive: boolean;
  order: number;
}

export class WaypointSystem {
  private waypoints: Waypoint[] = [];
  private nextId: number = 0;
  private maxWaypoints: number = 10;
  private waypointRadius: number = 40;
  
  addWaypoint(x: number, y: number): void {
    if (this.waypoints.length >= this.maxWaypoints) {
      this.waypoints.shift(); // Remove oldest
    }
    
    const waypoint: Waypoint = {
      id: this.nextId++,
      position: new Vector2D(x, y),
      radius: this.waypointRadius,
      visited: new Set(),
      isActive: true,
      order: this.waypoints.length
    };
    
    this.waypoints.push(waypoint);
  }
  
  clearWaypoints(): void {
    this.waypoints = [];
  }
  
  getNextWaypoint(boidId: number, currentPosition: Vector2D): Waypoint | null {
    // Find the first unvisited waypoint for this boid
    for (const waypoint of this.waypoints) {
      if (!waypoint.visited.has(boidId) && waypoint.isActive) {
        // Check if boid reached the waypoint
        const dist = currentPosition.distanceTo(waypoint.position);
        if (dist < waypoint.radius) {
          waypoint.visited.add(boidId);
          
          // If all boids visited this waypoint, mark for removal
          if (waypoint.visited.size > 50) {
            waypoint.isActive = false;
          }
        }
        
        return waypoint;
      }
    }
    
    // All waypoints visited, clear and return null
    if (this.waypoints.length > 0 && this.waypoints.every(w => !w.isActive)) {
      this.clearWaypoints();
    }
    
    return null;
  }
  
  getActiveWaypoints(): Waypoint[] {
    return this.waypoints.filter(w => w.isActive);
  }
  
  toggleWaypoints(): void {
    if (this.waypoints.length > 0) {
      this.clearWaypoints();
    }
  }
  
  hasWaypoints(): boolean {
    return this.waypoints.length > 0;
  }
  
  getWaypointForTeam(team: number, boidId: number, position: Vector2D): Vector2D | null {
    if (team !== 0) return null; // Only player team uses waypoints
    
    const waypoint = this.getNextWaypoint(boidId, position);
    return waypoint ? waypoint.position : null;
  }
}