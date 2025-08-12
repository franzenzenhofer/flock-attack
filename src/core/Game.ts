import { Boid } from '../entities/Boid';
import { Base } from '../entities/Base';
import { Dot, DotState } from '../entities/Dot';
import { Storm } from '../entities/Storm';
import { FlockingSystem } from '../systems/FlockingSystem';
import { AIController } from '../systems/AIController';
import { InputSystem } from '../systems/InputSystem';
import { CanvasRenderer } from '../rendering/CanvasRenderer';

export class Game {
  private width: number;
  private height: number;
  private boids: Boid[] = [];
  private bases: Base[] = [];
  private dots: Dot[] = [];
  private storms: Storm[] = [];
  
  private flockingSystem: FlockingSystem;
  private aiController: AIController;
  private inputSystem: InputSystem;
  private renderer: CanvasRenderer;
  
  private paused: boolean = false;
  private lastTime: number = 0;
  private cycleTime: number = 0;
  private cycleDuration: number = 46; // seconds
  
  private boidIdCounter: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    
    // Initialize systems
    this.renderer = new CanvasRenderer(canvas);
    this.inputSystem = new InputSystem(canvas, this.width, this.height);
    this.flockingSystem = new FlockingSystem();
    
    // Setup game entities
    this.initializeBases();
    this.aiController = new AIController(this.bases[1]);
    this.initializeBoids();
    this.initializeDots();
    this.initializeStorms();
    
    // Setup input handlers
    this.inputSystem.onDoubleTap(() => this.togglePause());
    
    // Handle resize
    window.addEventListener('resize', () => this.handleResize(), { passive: true });
    this.handleResize();
    
    // Start game loop
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private initializeBases(): void {
    // Player base (team 0)
    this.bases.push(new Base(0 as const, this.width, this.height));
    // Enemy base (team 1)
    this.bases.push(new Base(1 as const, this.width, this.height));
  }

  private initializeBoids(): void {
    // Calculate boid count based on screen size
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const baseCount = Math.floor((this.width * this.height) / (prefersReduced ? 16000 : 12000));
    const perTeam = Math.max(24, Math.min(120, baseCount));
    
    // Spawn player team
    this.spawnBoids(0, perTeam);
    
    // Spawn enemy team (slightly fewer)
    this.spawnBoids(1, Math.round(perTeam * 0.95));
  }

  private spawnBoids(team: 0 | 1, count: number): void {
    for (let i = 0; i < count; i++) {
      this.boids.push(new Boid(team, this.boidIdCounter++, this.bases[team]));
    }
  }

  private initializeDots(): void {
    // Ensure bases have initial stock
    for (let team = 0; team < 2; team++) {
      const base = this.bases[team];
      const needed = base.desired - base.stock.length;
      
      for (let i = 0; i < needed; i++) {
        const dot = new Dot(team as 0 | 1);
        const dotIndex = this.dots.length;
        this.dots.push(dot);
        base.stock.push(dotIndex);
        dot.rOrb = base.radius * dot.orbFactor;
      }
    }
    
    // Add a couple neutral dots
    this.dots.push(Dot.createNeutral(this.width, this.height));
    this.dots.push(Dot.createNeutral(this.width, this.height));
  }

  private initializeStorms(): void {
    // Start with one storm if not reduced motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReduced) {
      this.storms.push(new Storm(this.width, this.height));
    }
  }

  private handleResize(): void {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    
    // Resize renderer
    this.renderer.resize(this.width, this.height);
    
    // Update base positions
    for (const base of this.bases) {
      base.resize(this.width, this.height);
    }
    
    // Update dot orbit radii
    for (const dot of this.dots) {
      if (dot.state === DotState.Orbit && dot.owner !== -1) {
        dot.rOrb = this.bases[dot.owner].radius * dot.orbFactor;
      }
    }
  }

  private togglePause(): void {
    this.paused = !this.paused;
  }

  private gameLoop = (): void => {
    const now = performance.now();
    let deltaMs = now - this.lastTime;
    this.lastTime = now;
    
    // Clamp delta time
    deltaMs = Math.max(2, Math.min(100, deltaMs));
    const dtN = Math.min(1.8, deltaMs / 16.6667); // Normalized to 60fps
    const dtS = deltaMs / 1000; // In seconds
    
    if (!this.paused) {
      this.update(dtN, dtS);
    }
    
    this.render();
    requestAnimationFrame(this.gameLoop);
  };

  private update(dtN: number, dtS: number): void {
    // Update cycle timer
    this.cycleTime += dtS;
    if (this.cycleTime >= this.cycleDuration) {
      this.cycleTime = 0;
      this.handleWaveCycle();
    }
    
    // Update AI
    this.aiController.update(
      dtS,
      this.bases,
      this.boids,
      this.inputSystem.isActive(),
      this.inputSystem.getX(),
      this.width,
      this.height
    );
    
    // Update flocking system
    this.flockingSystem.update(
      this.boids,
      this.bases,
      this.dots,
      this.storms,
      this.inputSystem.getGoal(),
      this.aiController.getTarget(),
      dtN
    );
    
    // Update boids physics
    for (const boid of this.boids) {
      const stats = Boid.calculateStats(this.bases[boid.team].level);
      boid.step(dtN, stats, this.width, this.height);
    }
    
    // Update dots
    for (const dot of this.dots) {
      dot.update(dtN, dtS, this.bases, this.boids, this.width, this.height);
    }
    
    // Update storms
    for (const storm of this.storms) {
      storm.update(dtS, this.width, this.height);
    }
    
    // Update base flash
    for (const base of this.bases) {
      base.updateFlash(dtS);
    }
  }

  private handleWaveCycle(): void {
    // Soft wave bump - add resources and units
    const stockDiff = this.bases[0].stock.length - this.bases[1].stock.length;
    
    if (stockDiff > 4) {
      // Player is winning, help enemy
      this.bases[1].desired += 2;
      this.spawnBoids(1, 2);
    } else {
      // Balanced growth
      this.bases[0].desired += 1;
      this.bases[1].desired += 1;
      this.spawnBoids(0, 1);
      this.spawnBoids(1, 1);
    }
    
    // Flash bases
    this.bases[0].flash = 0.5;
    this.bases[1].flash = 0.5;
    
    // Spawn new neutral dot
    this.dots.push(Dot.createNeutral(this.width, this.height));
    
    // Maybe spawn storm
    if (this.storms.length < 6 && Math.random() < 0.3) {
      this.storms.push(new Storm(this.width, this.height));
    }
  }

  private render(): void {
    // Clear and draw background
    this.renderer.clear();
    const stockDiff = this.bases[0].stock.length - this.bases[1].stock.length;
    this.renderer.drawBackground(stockDiff);
    
    // Draw game entities
    this.renderer.drawBase(this.bases[0], 0);
    this.renderer.drawBase(this.bases[1], 1);
    this.renderer.drawStorms(this.storms);
    this.renderer.drawDots(this.dots);
    this.renderer.drawBoids(this.boids, this.bases);
  }

  public levelUpBase(team: 0 | 1): void {
    const base = this.bases[team];
    base.levelUp();
    
    // Spawn reinforcements
    this.spawnBoids(team, 4 + Math.floor(base.level / 2));
    
    // Catch-up mechanic
    if (team === 0 && Math.random() < 0.7) {
      this.bases[1].desired += 2;
      this.spawnBoids(1, 3);
    }
    
    // Maybe add storm
    const totalLevel = this.bases[0].level + this.bases[1].level;
    const maxStorms = Math.min(8, 2 + Math.floor(totalLevel / 3));
    if (this.storms.length < maxStorms) {
      this.storms.push(new Storm(this.width, this.height));
    }
    
    // Add neutral dots
    for (let i = 0; i < 2; i++) {
      this.dots.push(Dot.createNeutral(this.width, this.height));
    }
  }
}