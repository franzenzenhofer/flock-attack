import { Vector2D } from '../core/Vector2D';
import { Team, GameConfig, Colors } from '../utils/Config';

export class Base {
  public pos: Vector2D;
  public radius: number;
  public color: string;
  public aura: number = 1;
  public level: number = 1;
  public progress: number = 0;
  public stock: number[] = []; // Indices of orbiting dots
  public desired: number;
  public flash: number = 0;

  constructor(
    public team: Team,
    width: number,
    height: number
  ) {
    const minDimension = Math.min(width, height);
    this.radius = minDimension * GameConfig.bases.radiusRatio;
    this.desired = GameConfig.bases.initialDesired;
    
    // Position based on team
    if (team === GameConfig.teams.player) {
      this.pos = new Vector2D(width * GameConfig.bases.playerPosX, height * 0.5);
      this.color = Colors.player;
    } else {
      this.pos = new Vector2D(width * GameConfig.bases.enemyPosX, height * 0.5);
      this.color = Colors.enemy;
    }
  }

  levelUp(): void {
    this.level++;
    this.aura = 1 + this.level * 0.22;
    this.desired += GameConfig.bases.levelUpBonus;
    this.flash = 0.6;
  }

  addProgress(amount: number): boolean {
    this.progress += amount;
    if (this.progress >= 1) {
      this.progress -= 1;
      return true; // Level up!
    }
    return false;
  }

  depositDot(dotIndex: number): void {
    this.stock.push(dotIndex);
    this.flash = Math.min(0.45, this.flash + 0.35);
    
    // Progress toward level up
    const progressAmount = 1 / Math.max(6, 8 - Math.min(5, this.level));
    if (this.addProgress(progressAmount)) {
      this.levelUp();
    }
  }

  stealDot(): number | null {
    if (this.stock.length > 0) {
      return this.stock.pop() ?? null;
    }
    return null;
  }

  updateFlash(dtS: number): void {
    this.flash = Math.max(0, this.flash - dtS * 0.9);
  }

  getAuraRadius(): number {
    return this.radius * (1 + 0.2 * this.aura);
  }

  resize(width: number, height: number): void {
    const minDimension = Math.min(width, height);
    this.radius = minDimension * GameConfig.bases.radiusRatio;
    
    // Reposition
    if (this.team === GameConfig.teams.player) {
      this.pos.set(width * GameConfig.bases.playerPosX, height * 0.5);
    } else {
      this.pos.set(width * GameConfig.bases.enemyPosX, height * 0.5);
    }
  }
}