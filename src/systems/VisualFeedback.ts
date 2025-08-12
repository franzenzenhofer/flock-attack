import { Vector2D } from '../core/Vector2D';

export interface VisualEffect {
  id: number;
  type: 'ripple' | 'pulse' | 'trail' | 'explosion' | 'waypoint' | 'hold' | 'swipe' | 'pinch';
  position: Vector2D;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
  lifetime: number;
  elapsed: number;
  data?: Record<string, unknown>;
}

export class VisualFeedbackSystem {
  private effects: VisualEffect[] = [];
  private nextId: number = 0;
  
  constructor(_canvas: HTMLCanvasElement) {
    // Canvas is passed but not stored as we get context from renderer
  }
  
  // TAP - Creates expanding ripple
  addTapFeedback(x: number, y: number): void {
    this.effects.push({
      id: this.nextId++,
      type: 'ripple',
      position: new Vector2D(x, y),
      radius: 10,
      maxRadius: 60,
      opacity: 0.8,
      color: '#7ae4ff',
      lifetime: 0.5,
      elapsed: 0
    });
  }
  
  // DOUBLE TAP - Creates double pulse
  addDoubleTapFeedback(x: number, y: number): void {
    this.effects.push({
      id: this.nextId++,
      type: 'pulse',
      position: new Vector2D(x, y),
      radius: 15,
      maxRadius: 80,
      opacity: 1.0,
      color: '#ffffff',
      lifetime: 0.6,
      elapsed: 0
    });
    
    // Second pulse delayed
    setTimeout(() => {
      this.effects.push({
        id: this.nextId++,
        type: 'pulse',
        position: new Vector2D(x, y),
        radius: 15,
        maxRadius: 80,
        opacity: 1.0,
        color: '#ffffff',
        lifetime: 0.6,
        elapsed: 0
      });
    }, 100);
  }
  
  // HOLD - Growing circle with progress
  addHoldFeedback(x: number, y: number, progress: number): void {
    // Remove existing hold effect
    this.effects = this.effects.filter(e => e.type !== 'hold');
    
    this.effects.push({
      id: this.nextId++,
      type: 'hold',
      position: new Vector2D(x, y),
      radius: 20 + progress * 40,
      maxRadius: 60,
      opacity: 0.3 + progress * 0.5,
      color: '#ff7adf',
      lifetime: Infinity,
      elapsed: 0,
      data: { progress }
    });
  }
  
  // SWIPE - Directional trail
  addSwipeFeedback(startX: number, startY: number, endX: number, endY: number): void {
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = startX + (endX - startX) * t;
      const y = startY + (endY - startY) * t;
      
      setTimeout(() => {
        this.effects.push({
          id: this.nextId++,
          type: 'trail',
          position: new Vector2D(x, y),
          radius: 8,
          maxRadius: 20,
          opacity: 0.8 - t * 0.4,
          color: '#7ae4ff',
          lifetime: 0.5,
          elapsed: 0
        });
      }, i * 20);
    }
  }
  
  // PINCH - Zoom indicator
  addPinchFeedback(centerX: number, centerY: number, scale: number): void {
    this.effects = this.effects.filter(e => e.type !== 'pinch');
    
    const baseRadius = 50;
    this.effects.push({
      id: this.nextId++,
      type: 'pinch',
      position: new Vector2D(centerX, centerY),
      radius: baseRadius * scale,
      maxRadius: baseRadius * 2,
      opacity: 0.5,
      color: scale > 1 ? '#00ff00' : '#ff0000',
      lifetime: 0.3,
      elapsed: 0,
      data: { scale }
    });
  }
  
  // WAYPOINT - Persistent marker
  addWaypointFeedback(x: number, y: number, order: number): void {
    this.effects.push({
      id: this.nextId++,
      type: 'waypoint',
      position: new Vector2D(x, y),
      radius: 30,
      maxRadius: 35,
      opacity: 0.8,
      color: '#ffff00',
      lifetime: Infinity,
      elapsed: 0,
      data: { order }
    });
  }
  
  // EXPLOSION - Chaos event
  addExplosionFeedback(x: number, y: number): void {
    // Multiple expanding rings
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.effects.push({
          id: this.nextId++,
          type: 'explosion',
          position: new Vector2D(x, y),
          radius: 0,
          maxRadius: 200 + i * 50,
          opacity: 0.8,
          color: '#ff4444',
          lifetime: 1.5,
          elapsed: 0
        });
      }, i * 150);
    }
  }
  
  update(dt: number): void {
    this.effects = this.effects.filter(effect => {
      effect.elapsed += dt;
      
      if (effect.lifetime !== Infinity && effect.elapsed >= effect.lifetime) {
        return false;
      }
      
      // Update effect based on type
      switch (effect.type) {
        case 'ripple':
        case 'pulse':
        case 'trail':
        case 'explosion': {
          const t = effect.elapsed / effect.lifetime;
          effect.radius = effect.radius + (effect.maxRadius - effect.radius) * t;
          effect.opacity = (1 - t) * 0.8;
          break;
        }
          
        case 'waypoint':
          // Pulsing effect
          effect.radius = 30 + Math.sin(effect.elapsed * 4) * 5;
          break;
          
        case 'pinch':
          // Fade out
          effect.opacity = (1 - effect.elapsed / effect.lifetime) * 0.5;
          break;
      }
      
      return true;
    });
  }
  
  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    for (const effect of this.effects) {
      ctx.globalAlpha = effect.opacity;
      
      switch (effect.type) {
        case 'ripple':
        case 'pulse':
        case 'explosion':
          // Expanding circle
          ctx.strokeStyle = effect.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(effect.position.x, effect.position.y, effect.radius, 0, Math.PI * 2);
          ctx.stroke();
          break;
          
        case 'trail':
          // Filled circle
          ctx.fillStyle = effect.color;
          ctx.beginPath();
          ctx.arc(effect.position.x, effect.position.y, effect.radius, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'hold':
          // Growing filled circle with border
          ctx.fillStyle = effect.color;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(effect.position.x, effect.position.y, effect.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          // Progress arc
          if (effect.data?.progress && typeof effect.data.progress === 'number') {
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(
              effect.position.x, 
              effect.position.y, 
              effect.radius + 10, 
              -Math.PI / 2, 
              -Math.PI / 2 + Math.PI * 2 * effect.data.progress
            );
            ctx.stroke();
          }
          break;
          
        case 'waypoint':
          // Waypoint marker with number
          ctx.fillStyle = effect.color;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(effect.position.x, effect.position.y, effect.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          // Draw order number
          if (effect.data?.order !== undefined && typeof effect.data.order === 'number') {
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 20px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
              (effect.data.order + 1).toString(), 
              effect.position.x, 
              effect.position.y
            );
          }
          break;
          
        case 'pinch':
          // Zoom indicator
          ctx.strokeStyle = effect.color;
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.arc(effect.position.x, effect.position.y, effect.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          
          // Scale text
          if (effect.data?.scale && typeof effect.data.scale === 'number') {
            ctx.fillStyle = effect.color;
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(
              `${Math.round(effect.data.scale * 100)}%`,
              effect.position.x,
              effect.position.y - effect.radius - 10
            );
          }
          break;
      }
    }
    
    ctx.restore();
  }
  
  clearWaypoints(): void {
    this.effects = this.effects.filter(e => e.type !== 'waypoint');
  }
  
  clearHold(): void {
    this.effects = this.effects.filter(e => e.type !== 'hold');
  }
}