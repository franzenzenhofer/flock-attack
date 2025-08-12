import { Vector2D } from './Vector2D';
import { Boid } from '../entities/Boid';
import { Base } from '../entities/Base';
import { Dot, DotState } from '../entities/Dot';
import { Storm } from '../entities/Storm';
import { FlockingSystem } from '../systems/FlockingSystem';
import { AIController } from '../systems/AIController';
import { HammerInputSystem } from '../systems/HammerInput';
import { CanvasRenderer } from '../rendering/CanvasRenderer';
import { ChaosEvent } from '../systems/ChaosEvent';
import { VisualFeedbackSystem } from '../systems/VisualFeedback';

export class Game {
  private width: number;
  private height: number;
  private boids: Boid[] = [];
  private bases: Base[] = [];
  private dots: Dot[] = [];
  private storms: Storm[] = [];
  
  private flockingSystem: FlockingSystem;
  private aiController: AIController;
  private inputSystem: HammerInputSystem;
  private renderer: CanvasRenderer;
  private chaosEvent: ChaosEvent;
  private visualFeedback: VisualFeedbackSystem;
  
  private paused: boolean = false;
  private lastTime: number = 0;
  private cycleTime: number = 0;
  private cycleDuration: number = 46; // seconds
  private noInputTime: number = 0;
  
  private boidIdCounter: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    
    // Initialize systems
    this.renderer = new CanvasRenderer(canvas);
    this.visualFeedback = new VisualFeedbackSystem(canvas);
    this.inputSystem = new HammerInputSystem(canvas, this.width, this.height, this.visualFeedback);
    this.flockingSystem = new FlockingSystem();
    this.chaosEvent = new ChaosEvent();
    
    // Setup game entities
    this.initializeBases();
    this.aiController = new AIController(this.bases[1]);
    this.initializeBoids();
    this.initializeDots();
    this.initializeStorms();
    
    // Setup input handlers
    this.inputSystem.onDoubleTap(() => this.togglePause());
    this.inputSystem.onDistribution(() => this.triggerDistribution());
    
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
  
  private triggerDistribution(): void {
    // Scatter all boids in random directions
    for (const boid of this.boids) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 5;
      boid.vel.set(Math.cos(angle) * speed, Math.sin(angle) * speed);
    }
    
    // Visual feedback at center
    this.visualFeedback.addExplosionFeedback(this.width / 2, this.height / 2);
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
    // Update visual feedback
    this.visualFeedback.update(dtS);
    
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
    
    // Track no-input time
    if (this.inputSystem.isActive()) {
      this.noInputTime = 0;
    } else {
      this.noInputTime += dtS;
    }
    
    // Update chaos event
    this.chaosEvent.update(dtS, this.noInputTime, this.boids, this.width, this.height);
    
    // Get player goal - either from waypoints, input, or auto-AI
    let playerGoal = this.inputSystem.getGoal();
    const currentTime = performance.now() / 1000;
    const waypointSystem = this.inputSystem.getWaypointSystem();
    
    // Check for waypoints first
    if (waypointSystem.hasWaypoints() && !this.chaosEvent.isChaosModeActive()) {
      const playerBoids = this.boids.filter(b => b.team === 0);
      if (playerBoids.length > 0) {
        // Get waypoint for center of swarm
        const swarmCenter = playerBoids.reduce((acc, b) => {
          acc.x += b.pos.x;
          acc.y += b.pos.y;
          return acc;
        }, new Vector2D(0, 0));
        swarmCenter.div(playerBoids.length);
        
        const waypoint = waypointSystem.getNextWaypoint(0, swarmCenter);
        if (waypoint) {
          playerGoal = waypoint.position;
        }
      }
    } else if (!this.chaosEvent.isChaosModeActive() && this.inputSystem.shouldUseAutoAI(currentTime)) {
      const playerBoids = this.boids.filter(b => b.team === 0);
      const enemyBoids = this.boids.filter(b => b.team === 1);
      
      playerGoal = this.inputSystem.getAutoAI().update(
        dtS,
        playerBoids,
        enemyBoids,
        this.bases,
        this.dots,
        this.storms,
        this.width,
        this.height
      );
    }
    
    // Update flocking system
    const chaosVelocities = this.chaosEvent.isChaosModeActive() 
      ? new Map<number, Vector2D>(
          this.boids
            .map(b => [b.id, this.chaosEvent.getChaosVelocity(b.id)] as [number, Vector2D | null])
            .filter((entry): entry is [number, Vector2D] => entry[1] !== null)
        )
      : undefined;
    
    this.flockingSystem.update(
      this.boids,
      this.bases,
      this.dots,
      this.storms,
      this.chaosEvent.isChaosModeActive() ? null : playerGoal,
      this.aiController.getTarget(),
      dtN,
      chaosVelocities
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
    
    // Draw visual feedback on top
    const ctx = this.renderer.getContext();
    if (ctx) {
      this.visualFeedback.render(ctx);
    }
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