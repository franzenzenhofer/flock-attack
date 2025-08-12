import { Vector2D } from '../core/Vector2D';
import { Boid } from '../entities/Boid';

export enum PatternType {
  VFormation = 'v-formation',
  Line = 'line',
  Circle = 'circle',
  Diamond = 'diamond',
  Swarm = 'swarm',
  Split = 'split',
  Pincer = 'pincer'
}

export class FlightPattern {
  private type: PatternType;
  private leader: Boid | null = null;
  private members: Set<number> = new Set();
  private targetPosition: Vector2D;
  private spacing: number = 30;

  constructor(type: PatternType, target: Vector2D) {
    this.type = type;
    this.targetPosition = target;
  }

  assignBoids(boids: Boid[], count: number): void {
    this.members.clear();
    const available = boids.filter(b => b.stun === 0 && b.carry === -1);
    
    for (let i = 0; i < Math.min(count, available.length); i++) {
      this.members.add(available[i].id);
      if (i === 0) this.leader = available[i];
    }
  }

  getFormationPosition(_boid: Boid, index: number): Vector2D {
    if (!this.leader) return this.targetPosition;

    switch (this.type) {
      case PatternType.VFormation:
        return this.getVFormationPos(index);
      case PatternType.Line:
        return this.getLineFormationPos(index);
      case PatternType.Circle:
        return this.getCircleFormationPos(index);
      case PatternType.Diamond:
        return this.getDiamondFormationPos(index);
      case PatternType.Split:
        return this.getSplitFormationPos(index);
      case PatternType.Pincer:
        return this.getPincerFormationPos(index);
      default:
        return this.targetPosition;
    }
  }

  private getVFormationPos(index: number): Vector2D {
    if (index === 0) return this.targetPosition;
    
    const side = index % 2 === 0 ? 1 : -1;
    const row = Math.floor((index + 1) / 2);
    const offset = new Vector2D(
      side * row * this.spacing,
      row * this.spacing * 0.7
    );
    
    return this.targetPosition.add(offset);
  }

  private getLineFormationPos(index: number): Vector2D {
    const offset = new Vector2D(index * this.spacing, 0);
    return this.targetPosition.add(offset);
  }

  private getCircleFormationPos(index: number): Vector2D {
    const total = this.members.size;
    const angle = (index / total) * Math.PI * 2;
    const radius = this.spacing * Math.max(3, total / 4);
    
    return new Vector2D(
      this.targetPosition.x + Math.cos(angle) * radius,
      this.targetPosition.y + Math.sin(angle) * radius
    );
  }

  private getDiamondFormationPos(index: number): Vector2D {
    const positions = [
      new Vector2D(0, -this.spacing),
      new Vector2D(this.spacing, 0),
      new Vector2D(0, this.spacing),
      new Vector2D(-this.spacing, 0)
    ];
    
    const pos = positions[index % 4];
    const layer = Math.floor(index / 4);
    const scale = 1 + layer * 0.5;
    
    return this.targetPosition.add(pos.scale(scale));
  }

  private getSplitFormationPos(index: number): Vector2D {
    const group = index % 2;
    const groupIndex = Math.floor(index / 2);
    const offset = group === 0 ? -this.spacing * 2 : this.spacing * 2;
    
    return new Vector2D(
      this.targetPosition.x + offset,
      this.targetPosition.y + groupIndex * this.spacing
    );
  }

  private getPincerFormationPos(index: number): Vector2D {
    const group = index % 2;
    const groupIndex = Math.floor(index / 2);
    const angle = group === 0 ? -Math.PI / 4 : Math.PI / 4;
    const dist = this.spacing * (2 + groupIndex);
    
    return new Vector2D(
      this.targetPosition.x + Math.cos(angle) * dist,
      this.targetPosition.y + Math.sin(angle) * dist
    );
  }

  updateTarget(target: Vector2D): void {
    this.targetPosition = target;
  }

  hasMember(boidId: number): boolean {
    return this.members.has(boidId);
  }

  getMemberCount(): number {
    return this.members.size;
  }
}