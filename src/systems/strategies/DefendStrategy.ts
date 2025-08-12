import { Vector2D } from '../../core/Vector2D';
import { BaseStrategy, StrategyContext } from '../BaseStrategy';
import { GAME_CONSTANTS } from '../../utils/Constants';

export class DefendStrategy extends BaseStrategy {
  protected priority = 3;
  
  execute(context: StrategyContext): Vector2D | null {
    const base = context.bases[context.team];
    const basePos = new Vector2D(base.pos.x, base.pos.y);
    
    const nearbyEnemies = this.countNearbyUnits(
      basePos,
      context.enemyBoids,
      base.radius * GAME_CONSTANTS.AI.BASE_DEFEND_RADIUS
    );
    
    if (nearbyEnemies > 0) {
      const enemyPositions = context.enemyBoids
        .filter(e => basePos.distanceTo(new Vector2D(e.pos.x, e.pos.y)) < base.radius * 3)
        .map(e => new Vector2D(e.pos.x, e.pos.y));
      
      return this.findSafePosition(basePos, enemyPositions, base.radius * 1.5);
    }
    
    return basePos;
  }
  
  protected calculateScore(context: StrategyContext): number {
    const base = context.bases[context.team];
    const basePos = new Vector2D(base.pos.x, base.pos.y);
    
    const threatLevel = this.countNearbyUnits(
      basePos,
      context.enemyBoids,
      base.radius * GAME_CONSTANTS.AI.BASE_DEFEND_RADIUS
    );
    
    const stockRisk = Math.max(0, 10 - base.stock.length) / 10;
    
    return (threatLevel / 10) + stockRisk;
  }
}