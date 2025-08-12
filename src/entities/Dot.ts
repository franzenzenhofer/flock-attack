import { Vector2D } from '../core/Vector2D';
import { Team, GameConfig } from '../utils/Config';
import { Base } from './Base';
import { Boid } from './Boid';

export enum DotState {
  Orbit = 0,   // Orbiting a base
  Free = 1,    // Free floating
  Carried = 2, // Being carried by a boid
}

export class Dot {
  public owner: Team | -1; // -1 for neutral
  public state: DotState;
  public angle: number;
  public orbFactor: number;
  public rOrb: number = 0;
  public pos: Vector2D;
  public vel: Vector2D;
  public carrier: number = -1; // Boid index carrying this dot

  constructor(owner: Team | -1 = -1) {
    this.owner = owner;
    this.state = owner === -1 ? DotState.Free : DotState.Orbit;
    this.angle = Math.random() * Math.PI * 2;
    this.orbFactor = 0.66 + (Math.random() * 0.1 - 0.05);
    this.pos = new Vector2D();
    this.vel = new Vector2D();
    
    if (owner !== -1) {
      this.state = DotState.Orbit;
    }
  }

  static createNeutral(width: number, height: number): Dot {
    const dot = new Dot(-1);
    dot.pos.set(
      width * 0.5 + (Math.random() - 0.5) * width * 0.3,
      height * 0.5 + (Math.random() - 0.5) * height * 0.4
    );
    dot.vel.set(
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 1.5
    );
    return dot;
  }

  update(dtN: number, dtS: number, bases: Base[], boids: Boid[], width: number, height: number): void {
    switch (this.state) {
      case DotState.Orbit:
        this.updateOrbit(dtS, bases);
        break;
      
      case DotState.Free:
        this.updateFree(dtN, width, height);
        break;
      
      case DotState.Carried:
        this.updateCarried(boids);
        break;
    }
  }

  private updateOrbit(dtS: number, bases: Base[]): void {
    if (this.owner === -1 || this.owner >= bases.length) return;
    
    const base = bases[this.owner];
    const direction = this.owner === 0 ? 1 : -1;
    this.angle += GameConfig.dots.orbitSpeed * dtS * direction;
    
    const radius = this.rOrb || (base.radius * this.orbFactor);
    this.pos.x = base.pos.x + Math.cos(this.angle) * radius;
    this.pos.y = base.pos.y + Math.sin(this.angle) * radius;
  }

  private updateFree(dtN: number, width: number, height: number): void {
    // Apply friction
    const friction = Math.pow(0.985, dtN);
    this.vel.mult(friction);
    
    // Update position
    this.pos.add(this.vel.copy().mult(dtN));
    
    // Bounce off edges
    const margin = 8;
    if (this.pos.x < margin) {
      this.pos.x = margin;
      this.vel.x = Math.abs(this.vel.x);
    } else if (this.pos.x > width - margin) {
      this.pos.x = width - margin;
      this.vel.x = -Math.abs(this.vel.x);
    }
    
    if (this.pos.y < margin) {
      this.pos.y = margin;
      this.vel.y = Math.abs(this.vel.y);
    } else if (this.pos.y > height - margin) {
      this.pos.y = height - margin;
      this.vel.y = -Math.abs(this.vel.y);
    }
  }

  private updateCarried(boids: Boid[]): void {
    if (this.carrier < 0 || this.carrier >= boids.length) {
      this.state = DotState.Free;
      this.carrier = -1;
      return;
    }
    
    const boid = boids[this.carrier];
    const offset = boid.vel.copy();
    if (offset.mag() < 0.01) {
      offset.set(1, 0);
    }
    offset.setMag(-6);
    
    this.pos.x = boid.pos.x + offset.x;
    this.pos.y = boid.pos.y + offset.y;
  }

  pickUp(boidIndex: number): void {
    this.state = DotState.Carried;
    this.carrier = boidIndex;
  }

  drop(pushVelocity?: Vector2D): void {
    this.state = DotState.Free;
    this.carrier = -1;
    
    if (pushVelocity) {
      this.vel = pushVelocity.copy().setMag(2 + Math.random() * 2);
      this.vel.x += (Math.random() - 0.5) * 1.2;
      this.vel.y += (Math.random() - 0.5) * 1.2;
    }
  }

  deposit(team: Team, base: Base): void {
    this.state = DotState.Orbit;
    this.owner = team;
    this.carrier = -1;
    this.orbFactor = 0.66 + (Math.random() * 0.1 - 0.05);
    this.rOrb = base.radius * this.orbFactor;
    this.angle = Math.random() * Math.PI * 2;
  }
}