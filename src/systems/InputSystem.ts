import { Vector2D } from '../core/Vector2D';
import { PlayerAutoAI } from './PlayerAutoAI';
import { WaypointSystem } from './WaypointSystem';

export class InputSystem {
  public active: boolean = false;
  public position: Vector2D;
  private lastTapTime: number = 0;
  private canvas: HTMLCanvasElement;
  private pauseCallback?: () => void;
  private autoAI: PlayerAutoAI;
  private waypointSystem: WaypointSystem;
  private lastInputTime: number = 0;
  private autoAIDelay: number = 3.0;
  private holdStartTime: number = 0;
  private isHolding: boolean = false;
  private distributionTriggered: boolean = false;

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    this.canvas = canvas;
    this.position = new Vector2D(width * 0.25, height * 0.5);
    this.autoAI = new PlayerAutoAI();
    this.waypointSystem = new WaypointSystem();
    this.setupEventListeners();
    this.setupKeyboardListeners();
  }

  private setupEventListeners(): void {
    // Pointer down
    this.canvas.addEventListener('pointerdown', (e: PointerEvent) => {
      const now = performance.now();
      
      // Check for double tap (pause)
      if (now - this.lastTapTime < 280 && this.pauseCallback) {
        this.pauseCallback();
      }
      
      this.lastTapTime = now;
      this.active = true;
      this.position.set(e.clientX, e.clientY);
      this.canvas.setPointerCapture(e.pointerId);
      this.lastInputTime = now / 1000;
      
      // Start tracking hold time
      this.holdStartTime = now;
      this.isHolding = true;
      this.distributionTriggered = false;
    });

    // Pointer move
    this.canvas.addEventListener('pointermove', (e: PointerEvent) => {
      if (!this.active) return;
      this.position.set(e.clientX, e.clientY);
    }, { passive: true });

    // Pointer up/cancel/leave
    const deactivate = () => {
      this.active = false;
      this.isHolding = false;
      this.distributionTriggered = false;
    };
    
    this.canvas.addEventListener('pointerup', deactivate);
    this.canvas.addEventListener('pointercancel', deactivate);
    this.canvas.addEventListener('pointerleave', deactivate);
  }

  onDoubleTap(callback: () => void): void {
    this.pauseCallback = callback;
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

  shouldUseAutoAI(currentTime: number): boolean {
    return !this.active && !this.waypointSystem.hasWaypoints() && (currentTime - this.lastInputTime) > this.autoAIDelay;
  }
  
  private setupKeyboardListeners(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        
        if (this.waypointSystem.hasWaypoints()) {
          // Clear waypoints on second tab
          this.waypointSystem.clearWaypoints();
        } else if (this.active) {
          // Add waypoint at current pointer position
          this.waypointSystem.addWaypoint(this.position.x, this.position.y);
        }
      }
    });
  }
  
  getWaypointSystem(): WaypointSystem {
    return this.waypointSystem;
  }
  
  checkLongHold(): boolean {
    if (!this.isHolding || this.distributionTriggered) return false;
    
    const now = performance.now();
    const holdDuration = now - this.holdStartTime;
    
    if (holdDuration > 800) { // 0.8 seconds for long hold
      this.distributionTriggered = true;
      return true;
    }
    
    return false;
  }
  
  getHoldProgress(): number {
    if (!this.isHolding) return 0;
    const now = performance.now();
    const holdDuration = now - this.holdStartTime;
    return Math.min(1, holdDuration / 800);
  }
}