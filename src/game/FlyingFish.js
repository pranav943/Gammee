import { W, H, GROUND_Y, COL } from './constants.js';

export class FlyingFish {
  constructor(speed) {
    this.x = W + 60;
    this.y = 80 + Math.random() * (GROUND_Y - 180);
    this.speed = speed;
    this.vx = -(speed * 0.55);
    this.vy = 0;
    this.t = 0;
    this.phase = 'approach';   // approach → dive → recover
    this.diveTriggered = false;
    this.targetY = 0;
    this.finFlap = 0;
    this.bubbles = [];
    this.bubbleTimer = 0;
    this.scaleX = -1;          // faces left
  }

  get offscreen() { return this.x + 60 < -20 || this.y > H + 60; }

  get hitbox() {
    return { x: this.x - 22, y: this.y - 14, w: 44, h: 28 };
  }

  triggerDive(playerX, playerY) {
    if (this.diveTriggered) return;
    this.diveTriggered = true;
    this.phase = 'dive';
    const dx = (playerX + 15) - this.x;
    const dy = (playerY + 20) - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const spd = this.speed * 0.9;
    this.vx = (dx / dist) * spd;
    this.vy = (dy / dist) * spd;
  }

  update(dt, speed, playerX, playerY) {
    this.t += dt;
    this.finFlap += dt * 8;
    this.bubbleTimer += dt;

    if (this.phase === 'approach') {
      this.x += this.vx * dt;
      this.y += Math.sin(this.t * 2.5) * 55 * dt;  // wavy approach

      // Trigger dive when close enough horizontally
      if (this.x < playerX + 280 && !this.diveTriggered) {
        this.triggerDive(playerX, playerY);
      }
    } else if (this.phase === 'dive') {
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // Recover if past player or near ground
      if (this.y > GROUND_Y - 30 || this.x < playerX - 100) {
        this.phase = 'recover';
        this.vy = -this.speed * 0.7;
        this.vx = -speed * 0.5;
      }
    } else { // recover
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vy += 200 * dt; // gravity pull down slowly
    }

    // Bubble trail
    if (this.bubbleTimer > 0.08) {
      this.bubbleTimer = 0;
      this.bubbles.push({ x: this.x + 20, y: this.y, r: 2 + Math.random() * 3, age: 0 });
    }
    for (const b of this.bubbles) { b.age += dt; b.y -= 18 * dt; b.x += 5 * dt; }
    this.bubbles = this.bubbles.filter(b => b.age < 0.6);
  }

  draw(ctx) {
    // Bubbles
    for (const b of this.bubbles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - b.age / 0.6) * 0.4;
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    const { x, y } = this;
    const angle = Math.atan2(this.vy, this.vx);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Glow
    ctx.shadowColor = COL.fish;
    ctx.shadowBlur = 20;

    // Body
    ctx.fillStyle = COL.fish;
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly
    ctx.fillStyle = COL.fishBelly;
    ctx.beginPath();
    ctx.ellipse(2, 4, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tail fin
    const flapY = Math.sin(this.finFlap) * 6;
    ctx.fillStyle = COL.fishD;
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(36, -10 + flapY);
    ctx.lineTo(36, 10 - flapY);
    ctx.closePath();
    ctx.fill();

    // Dorsal fin
    ctx.fillStyle = COL.fishD;
    ctx.beginPath();
    ctx.moveTo(-4, -13);
    ctx.lineTo(6,  -22 + Math.sin(this.finFlap * 1.3) * 4);
    ctx.lineTo(14, -13);
    ctx.closePath();
    ctx.fill();

    // Pectoral fin
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.lineTo(-6, 14 + Math.sin(this.finFlap * 1.5) * 5);
    ctx.lineTo(10, 10);
    ctx.closePath();
    ctx.fill();

    // Scales pattern
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 0.8;
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(-8 + i * 10, 0, 7, 0.3, Math.PI - 0.3);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Eye
    ctx.shadowBlur = 0;
    ctx.fillStyle = COL.fishEye;
    ctx.beginPath(); ctx.arc(-14, -3, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(-15, -3, 2.5, 0, Math.PI * 2); ctx.fill();
    // Eye shine
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-16, -4.5, 1.2, 0, Math.PI * 2); ctx.fill();

    // Teeth!
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(-24, 0);
    for (let i = 0; i < 4; i++) {
      ctx.lineTo(-24 + i * 4, -8);
      ctx.lineTo(-22 + i * 4, 0);
    }
    ctx.fill();

    ctx.restore();

    // Warning indicator when off-screen top
    if (this.y < 10 && this.phase !== 'recover') {
      ctx.save();
      ctx.fillStyle = '#f43f5e';
      ctx.globalAlpha = 0.7 + Math.sin(this.t * 10) * 0.3;
      ctx.font = 'bold 14px monospace';
      ctx.fillText('▼ FISH', Math.max(20, Math.min(W - 80, x)), 18);
      ctx.restore();
    }
  }
}
