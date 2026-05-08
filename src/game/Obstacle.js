import { W, GROUND_Y, COL } from './constants.js';

const CONFIGS = {
  low:  { w: 28, h: 40,  yOff: 0,   color: COL.obs, dark: COL.obsD },
  mid:  { w: 22, h: 70,  yOff: 0,   color: '#a855f7', dark: '#7e22ce' },
  high: { w: 20, h: 32,  yOff: -90, color: '#f97316', dark: '#c2410c' },
  wide: { w: 60, h: 28,  yOff: 0,   color: COL.obs, dark: COL.obsD },
};

export class Obstacle {
  constructor(type, speed) {
    const cfg = CONFIGS[type] || CONFIGS.low;
    this.w = cfg.w + Math.random() * 10 | 0;
    this.h = cfg.h + Math.random() * 14 | 0;
    this.x = W + 40;
    this.y = GROUND_Y - this.h + cfg.yOff;
    this.color = cfg.color;
    this.dark  = cfg.dark;
    this.speed = speed;
    this.passed = false;
    this.spikes = type === 'low' || type === 'wide';
    this.type = type;
  }

  update(dt, speed) {
    this.x -= speed * dt;
  }

  get hitbox() {
    const pad = 4;
    return { x: this.x + pad, y: this.y + pad, w: this.w - pad * 2, h: this.h - pad * 2 };
  }

  get offscreen() { return this.x + this.w < -10; }

  draw(ctx) {
    const { x, y, w, h } = this;

    // Body gradient
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, this.color);
    g.addColorStop(1, this.dark);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, w, h, 5) : ctx.rect(x, y, w, h);
    ctx.fill();

    // Spikes on top
    if (this.spikes) {
      const count = Math.max(2, (w / 14) | 0);
      const sw = w / count;
      ctx.fillStyle = this.color;
      for (let i = 0; i < count; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * sw, y);
        ctx.lineTo(x + i * sw + sw / 2, y - 14);
        ctx.lineTo(x + (i + 1) * sw, y);
        ctx.fill();
      }
    }

    // Glow
    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = 'transparent';
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, w, h, 5) : ctx.rect(x, y, w, h);
    ctx.stroke();
    ctx.restore();
  }
}
