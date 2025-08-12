import Hammer from 'hammerjs';
import { Vector2D } from '../core/Vector2D';
import { WaypointSystem } from './WaypointSystem';
import { PlayerAutoAI } from './PlayerAutoAI';
import { VisualFeedbackSystem } from './VisualFeedback';

export class HammerInputSystem {
  private hammer: HammerManager;
  private position: Vector2D;
  private active: boolean = false;
  private waypointSystem: WaypointSystem;
  private autoAI: PlayerAutoAI;
  private visualFeedback: VisualFeedbackSystem;
  private lastInputTime: number = 0;
  private autoAIDelay: number = 3.0;
  private pauseCallback?: () => void;
  private distributionCallback?: () => void;
  private currentScale: number = 1;
  
  constructor(
    canvas: HTMLCanvasElement, 
    width: number, 
    height: number,
    visualFeedback: VisualFeedbackSystem
  ) {
    this.position = new Vector2D(width * 0.25, height * 0.5);
    this.waypointSystem = new WaypointSystem();
    this.autoAI = new PlayerAutoAI();
    this.visualFeedback = visualFeedback;
    
    // Initialize Hammer.js
    this.hammer = new Hammer(canvas);
    this.setupGestures();
  }
  
  private setupGestures(): void {
    // Enable all recognizers
    this.hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });
    this.hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
    this.hammer.get('pinch').set({ enable: true });
    this.hammer.get('rotate').set({ enable: true });
    
    // TAP - Move to position
    this.hammer.on('tap', (e) => {
      this.lastInputTime = performance.now() / 1000;
      this.position.set(e.center.x, e.center.y);
      this.active = true;
      this.visualFeedback.addTapFeedback(e.center.x, e.center.y);
      
      // Add waypoint if shift is held
      if (e.srcEvent.shiftKey) {
        this.waypointSystem.addWaypoint(e.center.x, e.center.y);
        this.visualFeedback.addWaypointFeedback(
          e.center.x, 
          e.center.y, 
          this.waypointSystem.getActiveWaypoints().length - 1
        );
      }
    });
    
    // DOUBLE TAP - Pause/unpause
    this.hammer.on('doubletap', (e) => {
      this.visualFeedback.addDoubleTapFeedback(e.center.x, e.center.y);
      if (this.pauseCallback) {
        this.pauseCallback();
      }
    });
    
    // PRESS (long press) - Distribution event
    this.hammer.on('press', (e) => {
      this.visualFeedback.addExplosionFeedback(e.center.x, e.center.y);
      if (this.distributionCallback) {
        this.distributionCallback();
      }
    });
    
    // PAN - Continuous movement
    this.hammer.on('panstart', (e) => {
      this.active = true;
      this.lastInputTime = performance.now() / 1000;
    });
    
    this.hammer.on('panmove', (e) => {
      this.position.set(e.center.x, e.center.y);
      this.visualFeedback.addTapFeedback(e.center.x, e.center.y);
    });
    
    this.hammer.on('panend', () => {
      this.active = false;
    });
    
    // SWIPE - Quick waypoint chain
    this.hammer.on('swipe', (e) => {
      const start = new Vector2D(e.center.x - e.deltaX, e.center.y - e.deltaY);
      const end = new Vector2D(e.center.x, e.center.y);
      
      this.visualFeedback.addSwipeFeedback(start.x, start.y, end.x, end.y);
      
      // Create waypoints along swipe path
      const steps = 3;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const x = start.x + (end.x - start.x) * t;
        const y = start.y + (end.y - start.y) * t;
        this.waypointSystem.addWaypoint(x, y);
        this.visualFeedback.addWaypointFeedback(
          x, 
          y, 
          this.waypointSystem.getActiveWaypoints().length - 1
        );
      }
    });
    
    // PINCH - Scale/zoom control
    this.hammer.on('pinch', (e) => {
      this.currentScale = e.scale;
      this.visualFeedback.addPinchFeedback(e.center.x, e.center.y, e.scale);
    });
    
    // ROTATE - Formation rotation
    this.hammer.on('rotate', (e) => {
      // Visual feedback for rotation
      const radius = 50;
      const angle = e.rotation * Math.PI / 180;
      const x = e.center.x + Math.cos(angle) * radius;
      const y = e.center.y + Math.sin(angle) * radius;
      this.visualFeedback.addTapFeedback(x, y);
    });
    
    // Handle hold progress
    let pressTimer: any;
    this.hammer.on('pressup', () => {
      if (pressTimer) {
        clearInterval(pressTimer);
        this.visualFeedback.clearHold();
      }
    });
    
    // Keyboard support for Tab (waypoints)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        if (this.waypointSystem.hasWaypoints()) {
          this.waypointSystem.clearWaypoints();
          this.visualFeedback.clearWaypoints();
        } else if (this.active) {
          this.waypointSystem.addWaypoint(this.position.x, this.position.y);
          this.visualFeedback.addWaypointFeedback(
            this.position.x,
            this.position.y,
            this.waypointSystem.getActiveWaypoints().length - 1
          );
        }
      }
    });
  }
  
  onDoubleTap(callback: () => void): void {
    this.pauseCallback = callback;
  }
  
  onDistribution(callback: () => void): void {
    this.distributionCallback = callback;
  }
  
  getGoal(): Vector2D | null {
    return this.active ? this.position.copy() : null;
  }
  
  isActive(): boolean {
    return this.active;
  }
  
  getX(): number {
    return this.position.x;
  }
  
  getY(): number {
    return this.position.y;
  }
  
  getAutoAI(): PlayerAutoAI {
    return this.autoAI;
  }
  
  getWaypointSystem(): WaypointSystem {
    return this.waypointSystem;
  }
  
  shouldUseAutoAI(currentTime: number): boolean {
    return !this.active && 
           !this.waypointSystem.hasWaypoints() && 
           (currentTime - this.lastInputTime) > this.autoAIDelay;
  }
  
  getCurrentScale(): number {
    return this.currentScale;
  }
}