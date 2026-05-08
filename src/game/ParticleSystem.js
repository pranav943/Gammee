export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(x, y, count, opts = {}) {
    for (let i = 0; i < count; i++) {
      const angle = (opts.angle ?? Math.random() * Math.PI * 2);
      const spread = opts.spread ?? Math.PI * 2;
      const a = angle - spread / 2 + Math.random() * spread;
      const spd = (opts.speed ?? 80) * (0.5 + Math.random());
      this.particles.push({
        x, y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - (opts.upBias ?? 40),
        life: 1,
        decay: opts.decay ?? (1.8 + Math.random() * 1.2),
        r: opts.r ?? (3 + Math.random() * 4),
        color: opts.color ?? '#7c3aed',
        gravity: opts.gravity ?? 400,
      });
    }
  }

  update(dt) {
    for (const p of this.particles) {
      p.life -= p.decay * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.r *= 0.97;
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }

  draw(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life) * 0.85;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
