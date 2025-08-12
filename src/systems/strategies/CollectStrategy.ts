import { Vector2D } from '../../core/Vector2D';
import { BaseStrategy, StrategyContext } from '../BaseStrategy';
import { Dot, DotState } from '../../entities/Dot';
import { Storm } from '../../entities/Storm';

export class CollectStrategy extends BaseStrategy {
  protected priority = 2;
  
  execute(context: StrategyContext): Vector2D | null {
    const freeDots = context.dots.filter(d => d.state === DotState.Free);
    if (freeDots.length === 0) return null;
    
    const swarmCenter = this.getSwarmCenter(
      context.team === 0 ? context.playerBoids : context.enemyBoids
    );
    
    const safeDots = this.filterSafeDots(freeDots, context.storms);
    const targetDots = safeDots.length > 0 ? safeDots : freeDots;
    
    const nearest = this.findNearestDot(swarmCenter, targetDots);
    return nearest ? new Vector2D(nearest.pos.x, nearest.pos.y) : null;
  }
  
  protected calculateScore(context: StrategyContext): number {
    const freeDots = context.dots.filter(d => d.state === DotState.Free);
    const base = context.bases[context.team];
    
    const resourceNeed = Math.max(0, base.desired - base.stock.length) / base.desired;
    const availability = Math.min(1, freeDots.length / 5);
    
    return resourceNeed * availability;
  }
  
  private filterSafeDots(dots: Dot[], storms: Storm[]): Dot[] {
    return dots.filter(dot => {
      for (const storm of storms) {
        const dist = Math.hypot(dot.pos.x - storm.pos.x, dot.pos.y - storm.pos.y);
        if (dist < storm.radius * 1.5) return false;
      }
      return true;
    });
  }
  
  private findNearestDot(position: Vector2D, dots: Dot[]): Dot | null {
    let nearest = null;
    let minDist = Infinity;
    
    for (const dot of dots) {
      const dist = position.distanceTo(new Vector2D(dot.pos.x, dot.pos.y));
      if (dist < minDist) {
        minDist = dist;
        nearest = dot;
      }
    }
    
    return nearest;
  }
}