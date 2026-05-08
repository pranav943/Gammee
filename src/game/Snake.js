import { W, GROUND_Y, COL } from './constants.js';

const SEG = 14;   // segments
const SEG_R = 9;  // radius of each segment

export class Snake {
  constructor(speed) {
    this.segments = [];
    const startX = W + 60;
    const startY = GROUND_Y - SEG_R;
    for (let i = 0; i < SEG; i++) {
      this.segments.push({ x: startX + i * SEG_R * 1.4, y: startY });
    }
    this.speed = speed;
    this.chaseSpeed = speed * 0.28;   // extra chase velocity toward player
    this.t = 0;
    this.tongueTimer = 0;
    this.tongueFull = false;
    this.dead = false;
  }

  get head() { return this.segments[0]; }

  get offscreen() { return this.head.x + SEG_R * SEG < -20; }

  get hitbox() {
    const h = this.head;
    return { x: h.x - SEG_R, y: h.y - SEG_R, w: SEG_R * 2.2, h: SEG_R * 2.2 };
  }

  update(dt, speed, playerX, playerY) {
    this.t += dt;
    this.tongueTimer += dt;
    if (this.tongueTimer > 0.6) { this.tongueFull = !this.tongueFull; this.tongueTimer = 0; }

    const head = this.head;

    // Chase player: accelerate toward player position
    const dx = playerX - head.x;
    const dy = (playerY + 20) - head.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const chaseX = dist > 5 ? (dx / dist) * this.chaseSpeed : 0;
    const chaseY = dist > 5 ? (dy / dist) * this.chaseSpeed * 0.4 : 0;

    // Move head
    head.x -= speed * dt;
    head.x += chaseX * dt * 60;
    head.y = (GROUND_Y - SEG_R) + Math.sin(this.t * 4) * 6 + chaseY * dt * 60;
    head.y = Math.min(GROUND_Y - SEG_R, head.y);

    // Tail follows head via chain
    for (let i = 1; i < this.segments.length; i++) {
      const prev = this.segments[i - 1];
      const curr = this.segments[i];
      const ddx = curr.x - prev.x;
      const ddy = curr.y - prev.y;
      const len = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
      const targetDist = SEG_R * 1.35;
      if (len > targetDist) {
        curr.x = prev.x + (ddx / len) * targetDist;
        curr.y = prev.y + (ddy / len) * targetDist;
      }
    }
  }

  draw(ctx) {
    if (this.segments.length < 2) return;

    // Body segments back to front
    for (let i = this.segments.length - 1; i >= 0; i--) {
      const s = this.segments[i];
      const t = i / (this.segments.length - 1);   // 0=head, 1=tail
      const r = SEG_R * (0.55 + 0.45 * t);        // taper toward tail

      const g = ctx.createRadialGradient(s.x - r * 0.3, s.y - r * 0.3, r * 0.1, s.x, s.y, r);
      g.addColorStop(0, '#4ade80');
      g.addColorStop(1, COL.snakeD);
      ctx.fillStyle = g;

      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.fill();

      // Scale pattern on body
      if (i > 0 && i % 2 === 0) {
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 0.8;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r * 0.7, 0.3, Math.PI - 0.3);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    // Head details
    const head = this.segments[0];
    // Eyes
    ctx.fillStyle = COL.snakeEye;
    ctx.beginPath(); ctx.arc(head.x - 4, head.y - 4, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(head.x + 4, head.y - 4, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(head.x - 4, head.y - 4, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(head.x + 4, head.y - 4, 1.8, 0, Math.PI * 2); ctx.fill();

    // Tongue
    const tlen = this.tongueFull ? 14 : 8;
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(head.x, head.y + 3);
    ctx.lineTo(head.x - 3, head.y + 3 + tlen);
    ctx.moveTo(head.x, head.y + 3);
    ctx.lineTo(head.x + 3, head.y + 3 + tlen);
    ctx.stroke();

    // Glow aura (danger)
    ctx.save();
    ctx.shadowColor = '#16a34a';
    ctx.shadowBlur = 18;
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.arc(head.x, head.y, SEG_R * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
