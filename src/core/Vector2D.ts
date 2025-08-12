export class Vector2D {
  constructor(public x: number = 0, public y: number = 0) {}

  add(v: Vector2D): Vector2D {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v: Vector2D): Vector2D {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  mult(n: number): Vector2D {
    this.x *= n;
    this.y *= n;
    return this;
  }

  div(n: number): Vector2D {
    if (n !== 0) {
      this.x /= n;
      this.y /= n;
    }
    return this;
  }

  set(x: number, y: number): Vector2D {
    this.x = x;
    this.y = y;
    return this;
  }

  copy(): Vector2D {
    return new Vector2D(this.x, this.y);
  }

  mag(): number {
    return Math.hypot(this.x, this.y);
  }

  mag2(): number {
    return this.x * this.x + this.y * this.y;
  }

  setMag(n: number): Vector2D {
    const m = this.mag();
    if (m !== 0) {
      this.x = (this.x / m) * n;
      this.y = (this.y / m) * n;
    }
    return this;
  }

  limit(n: number): Vector2D {
    const m2 = this.mag2();
    const n2 = n * n;
    if (m2 > n2) {
      const m = Math.sqrt(m2);
      this.x = (this.x / m) * n;
      this.y = (this.y / m) * n;
    }
    return this;
  }

  normalize(): Vector2D {
    const m = this.mag();
    if (m !== 0) {
      this.div(m);
    }
    return this;
  }

  static from(angle: number): Vector2D {
    return new Vector2D(Math.cos(angle), Math.sin(angle));
  }

  static dist(a: Vector2D, b: Vector2D): number {
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  static dist2(a: Vector2D, b: Vector2D): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return dx * dx + dy * dy;
  }
}