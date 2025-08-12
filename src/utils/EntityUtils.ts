import { Vector2D } from '../core/Vector2D';
import { Boid } from '../entities/Boid';
import { Base } from '../entities/Base';
import { Dot } from '../entities/Dot';
import { Storm } from '../entities/Storm';

export class EntityUtils {
  static getBoidPosition(boid: Boid): Vector2D {
    return boid.pos.copy();
  }
  
  static getBasePosition(base: Base): Vector2D {
    return base.pos.copy();
  }
  
  static getDotPosition(dot: Dot): Vector2D {
    return dot.pos.copy();
  }
  
  static getStormPosition(storm: Storm): Vector2D {
    return new Vector2D(storm.pos.x, storm.pos.y);
  }
  
  static isBoidCarrying(boid: Boid): boolean {
    return boid.carry !== -1;
  }
  
  static isBoidStunned(boid: Boid): boolean {
    return boid.stun > 0;
  }
  
  static getBoidVelocity(boid: Boid): Vector2D {
    return boid.vel.copy();
  }
}