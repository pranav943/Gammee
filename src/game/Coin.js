import { W, GROUND_Y, COIN_R, COL } from './constants.js';

export class Coin {
  constructor(x, y) {
    this.x = x;
    this.y = y ?? (GROUND_Y - COIN_R * 2 - 20 - Math.random() * 80);
    this.r = COIN_R;
    this.collected = false;
    this.animT = Math.random() * Math.PI * 2;
    this.sparkles = [];
  }

  update(dt, speed) {
    this.x -= speed * dt;
    this.animT += dt * 3;

    for (const s of this.sparkles) {
      s.age += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
    }
    this.sparkles = this.sparkles.filter(s => s.age < 0.4);
  }

  collect() {
    this.collected = true;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      this.sparkles.push({ x: this.x, y: this.y, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60, age: 0 });
    }
  }

  get hitbox() {
    return { x: this.x - this.r, y: this.y - this.r, w: this.r * 2, h: this.r * 2 };
  }

  get offscreen() { return this.x + this.r < -10; }

  draw(ctx) {
    // Sparkles
    for (const s of this.sparkles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - s.age / 0.4);
      ctx.fillStyle = COL.coin;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (this.collected && this.sparkles.length === 0) return;
    if (this.collected) return;

    const bob = Math.sin(this.animT) * 4;
    const cx = this.x;
    const cy = this.y + bob;

    ctx.save();
    ctx.shadowColor = COL.coin;
    ctx.shadowBlur = 14;

    const g = ctx.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, this.r);
    g.addColorStop(0, '#fde68a');
    g.addColorStop(1, COL.coinG);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, this.r, 0, Math.PI * 2);
    ctx.fill();

    // Inner shine
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 3, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
