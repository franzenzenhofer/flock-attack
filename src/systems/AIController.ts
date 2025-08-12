import { Vector2D } from '../core/Vector2D';
import { Base } from '../entities/Base';
import { Boid } from '../entities/Boid';
import { GameConfig, AIMode } from '../utils/Config';

export class AIController {
  public target: Vector2D;
  public mode: AIMode = 'raid';
  private timer: number = 0;

  constructor(enemyBase: Base) {
    this.target = new Vector2D(
      enemyBase.pos.x - enemyBase.radius * 0.8,
      enemyBase.pos.y
    );
  }

  update(
    dtS: number,
    bases: Base[],
    boids: Boid[],
    playerInputActive: boolean,
    playerInputX: number,
    width: number,
    height: number
  ): void {
    this.timer -= dtS;
    if (this.timer > 0) return;
    
    this.timer = GameConfig.ai.updateInterval + Math.random() * 2.0;
    
    // Analyze game state
    const threatAtEnemy = this.countNearCarriers(0, bases[1].pos, bases[1].radius * 1.4, boids) > 0;
    const threatAtPlayer = this.countNearCarriers(1, bases[0].pos, bases[0].radius * 1.4, boids) > 0;
    const playerPushingRight = playerInputActive && playerInputX > width * 0.55;
    
    // Decide strategy
    if (threatAtEnemy) {
      this.mode = 'defend';
    } else if (playerPushingRight) {
      this.mode = 'intercept';
    } else if (threatAtPlayer && Math.random() < 0.5) {
      this.mode = 'raid';
    } else {
      this.mode = Math.random() < 0.55 ? 'raid' : 'defend';
    }
    
    // Set target based on mode
    this.setTargetForMode(bases, width, height);
  }

  private setTargetForMode(bases: Base[], width: number, height: number): void {
    const jitter = (k: number) => (Math.random() - 0.5) * k;
    const playerBase = bases[0];
    const enemyBase = bases[1];
    
    switch (this.mode) {
      case 'defend':
        this.target.set(
          enemyBase.pos.x - enemyBase.radius * 0.2 + jitter(enemyBase.radius * 0.3),
          enemyBase.pos.y + jitter(enemyBase.radius * 0.3)
        );
        break;
      
      case 'intercept':
        this.target.set(
          width * 0.5 + jitter(width * 0.1),
          height * 0.5 + jitter(height * 0.2)
        );
        break;
      
      case 'raid':
      default:
        this.target.set(
          playerBase.pos.x + playerBase.radius * 0.1 + jitter(playerBase.radius * 0.3),
          playerBase.pos.y + jitter(playerBase.radius * 0.3)
        );
        break;
    }
  }

  private countNearCarriers(team: number, pos: Vector2D, radius: number, boids: Boid[]): number {
    const r2 = radius * radius;
    let count = 0;
    
    for (const boid of boids) {
      if (boid.team !== team || !boid.isCarrying()) continue;
      
      const dx = boid.pos.x - pos.x;
      const dy = boid.pos.y - pos.y;
      
      if (dx * dx + dy * dy < r2) {
        count++;
      }
    }
    
    return count;
  }

  getTarget(): Vector2D {
    return this.target;
  }

  getMode(): AIMode {
    return this.mode;
  }
}