import { Vector2D } from '../core/Vector2D';

export class InputSystem {
  public active: boolean = false;
  public position: Vector2D;
  private lastTapTime: number = 0;
  private canvas: HTMLCanvasElement;
  private pauseCallback?: () => void;

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    this.canvas = canvas;
    this.position = new Vector2D(width * 0.25, height * 0.5);
    this.setupEventListeners();
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
    });

    // Pointer move
    this.canvas.addEventListener('pointermove', (e: PointerEvent) => {
      if (!this.active) return;
      this.position.set(e.clientX, e.clientY);
    }, { passive: true });

    // Pointer up/cancel/leave
    const deactivate = () => {
      this.active = false;
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
}