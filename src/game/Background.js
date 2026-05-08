import { W, H, GROUND_Y, COL } from './constants.js';

export class Background {
  constructor() {
    this.stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * W,
      y: Math.random() * (GROUND_Y - 60),
      r: Math.random() * 1.5 + 0.3,
      twinkle: Math.random() * Math.PI * 2,
      speed: 0.15 + Math.random() * 0.15,
    }));

    this.mountains = Array.from({ length: 6 }, (_, i) => ({
      x: i * (W / 5),
      h: 60 + Math.random() * 80,
      w: 180 + Math.random() * 140,
      speed: 0.06,
    }));

    this.hills = Array.from({ length: 8 }, (_, i) => ({
      x: i * (W / 7),
      h: 30 + Math.random() * 40,
      w: 140 + Math.random() * 100,
      speed: 0.2,
    }));

    this.groundTiles = Array.from({ length: 20 }, (_, i) => ({
      x: i * (W / 18),
    }));

    this.t = 0;
  }

  update(dt, speed) {
    this.t += dt;

    for (const s of this.stars) {
      s.twinkle += dt * 1.8;
      s.x -= speed * s.speed * dt;
      if (s.x < -4) s.x = W + 4;
    }

    for (const m of this.mountains) {
      m.x -= speed * m.speed * dt;
      if (m.x + m.w < -10) m.x = W + Math.random() * 80;
    }

    for (const h of this.hills) {
      h.x -= speed * h.speed * dt;
      if (h.x + h.w < -10) h.x = W + Math.random() * 60;
    }

    for (const t of this.groundTiles) {
      t.x -= speed * dt;
      if (t.x < -W / 18) t.x += W + W / 18;
    }
  }

  draw(ctx) {
    // Sky gradient
    const skyG = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    skyG.addColorStop(0, '#050510');
    skyG.addColorStop(1, '#1a0a2e');
    ctx.fillStyle = skyG;
    ctx.fillRect(0, 0, W, H);

    // Stars
    for (const s of this.stars) {
      const a = 0.5 + Math.sin(s.twinkle) * 0.45;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = COL.star;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Far mountains
    for (const m of this.mountains) {
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = '#7c3aed';
      ctx.beginPath();
      ctx.moveTo(m.x, GROUND_Y);
      ctx.lineTo(m.x + m.w / 2, GROUND_Y - m.h);
      ctx.lineTo(m.x + m.w, GROUND_Y);
      ctx.fill();
      ctx.restore();
    }

    // Near hills
    for (const h of this.hills) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#312e81';
      ctx.beginPath();
      ctx.moveTo(h.x, GROUND_Y);
      ctx.bezierCurveTo(h.x + h.w * 0.25, GROUND_Y - h.h * 1.2, h.x + h.w * 0.75, GROUND_Y - h.h * 1.2, h.x + h.w, GROUND_Y);
      ctx.fill();
      ctx.restore();
    }

    // Ground
    ctx.fillStyle = COL.ground;
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

    // Ground top line
    const lineG = ctx.createLinearGradient(0, GROUND_Y, W, GROUND_Y);
    lineG.addColorStop(0, '#7c3aed');
    lineG.addColorStop(0.5, '#06b6d4');
    lineG.addColorStop(1, '#7c3aed');
    ctx.fillStyle = lineG;
    ctx.fillRect(0, GROUND_Y, W, 3);

    // Ground tiles / lines
    ctx.strokeStyle = '#ffffff0d';
    ctx.lineWidth = 1;
    for (const t of this.groundTiles) {
      ctx.beginPath();
      ctx.moveTo(t.x, GROUND_Y);
      ctx.lineTo(t.x, H);
      ctx.stroke();
    }

    // Horizon glow
    ctx.save();
    const hg = ctx.createLinearGradient(0, GROUND_Y - 30, 0, GROUND_Y + 10);
    hg.addColorStop(0, 'rgba(124,58,237,0)');
    hg.addColorStop(0.6, 'rgba(124,58,237,0.12)');
    hg.addColorStop(1, 'rgba(124,58,237,0)');
    ctx.fillStyle = hg;
    ctx.fillRect(0, GROUND_Y - 30, W, 40);
    ctx.restore();
  }
}
