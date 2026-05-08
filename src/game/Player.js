import { GRAVITY, JUMP_VEL, GROUND_Y, PLAYER_W, PLAYER_H, PLAYER_X, COL } from './constants.js';

export class Player {
  constructor() {
    this.x = PLAYER_X;
    this.y = GROUND_Y - PLAYER_H;
    this.vy = 0;
    this.jumpsLeft = 2;
    this.onGround = true;
    this.trail = [];
    this.frame = 0;
    this.dead = false;
    this.squash = 1;
    this.stretch = 1;
    this.armSwing = 0;
    this.panic = 0; // animates when enemies are near
  }

  jump() {
    if (this.dead) return;
    if (this.jumpsLeft > 0) {
      this.vy = JUMP_VEL * (this.jumpsLeft < 2 ? 0.80 : 1);
      this.jumpsLeft--;
      this.onGround = false;
      this.stretch = 1.3;
      this.squash = 0.78;
    }
  }

  setPanic(val) { this.panic = Math.min(1, val); }

  update(dt) {
    if (this.dead) {
      this.vy += GRAVITY * dt;
      this.y += this.vy * dt;
      return;
    }

    this.vy += GRAVITY * dt;
    this.y += this.vy * dt;

    if (this.y >= GROUND_Y - PLAYER_H) {
      this.y = GROUND_Y - PLAYER_H;
      this.vy = 0;
      this.jumpsLeft = 2;
      if (!this.onGround) { this.squash = 0.68; this.stretch = 1.28; }
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    this.squash  += (1 - this.squash)  * Math.min(1, dt * 14);
    this.stretch += (1 - this.stretch) * Math.min(1, dt * 14);

    const runSpeed = this.onGround ? 14 : 5;
    this.frame    += dt * runSpeed;
    this.armSwing += dt * runSpeed;

    this.trail.push({ x: this.x + PLAYER_W / 2, y: this.y + PLAYER_H / 2, age: 0 });
    if (this.trail.length > 8) this.trail.shift();
    for (const t of this.trail) t.age += dt;
  }

  get hitbox() {
    const pad = 6;
    return { x: this.x + pad, y: this.y + pad, w: PLAYER_W - pad * 2, h: PLAYER_H - pad * 2 };
  }

  draw(ctx) {
    // Speed trail
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      const a = (i / this.trail.length) * 0.25;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(t.x, t.y, 6 * (i / this.trail.length), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const cx = this.x + PLAYER_W / 2;
    const topY = this.y;

    ctx.save();
    ctx.translate(cx, topY + PLAYER_H / 2);
    ctx.scale(this.squash, this.stretch);

    const hy = -PLAYER_H / 2; // head top offset from center

    // --- Legs ---
    const legSwing = Math.sin(this.frame) * (this.onGround ? 12 : 4);
    const legW = 9, legH = 18;
    const legY = PLAYER_H / 2 - legH - 2;

    // Left leg
    ctx.save();
    ctx.translate(-6, legY);
    ctx.rotate(legSwing * 0.05);
    ctx.fillStyle = COL.pants;
    ctx.fillRect(-legW / 2, 0, legW, legH);
    // Shoe
    ctx.fillStyle = COL.shoes;
    ctx.fillRect(-legW / 2 - 2, legH - 4, legW + 6, 6);
    ctx.restore();

    // Right leg
    ctx.save();
    ctx.translate(6, legY);
    ctx.rotate(-legSwing * 0.05);
    ctx.fillStyle = COL.pants;
    ctx.fillRect(-legW / 2, 0, legW, legH);
    ctx.fillStyle = COL.shoes;
    ctx.fillRect(-legW / 2 - 2, legH - 4, legW + 6, 6);
    ctx.restore();

    // --- Torso (shirt) ---
    const torsoH = 22, torsoW = PLAYER_W - 2;
    const torsoY = hy + 18;
    ctx.fillStyle = COL.shirt;
    ctx.beginPath();
    rr(ctx, -torsoW / 2, torsoY, torsoW, torsoH, 4);
    ctx.fill();

    // Shirt stripe
    ctx.fillStyle = '#60a5fa';
    ctx.fillRect(-torsoW / 2 + 4, torsoY + 6, torsoW - 8, 4);

    // --- Arms ---
    const armSwing = Math.sin(this.armSwing) * (this.onGround ? 14 : 5);
    const panicWave = this.panic > 0.3 ? Math.sin(this.frame * 3) * 20 : 0;
    const armW = 7, armH = 16;

    // Left arm
    ctx.save();
    ctx.translate(-torsoW / 2 - 1, torsoY + 2);
    ctx.rotate((-armSwing + panicWave) * 0.06);
    ctx.fillStyle = COL.shirt;
    ctx.fillRect(-armW / 2, 0, armW, armH);
    // Hand
    ctx.fillStyle = COL.skin;
    ctx.beginPath();
    ctx.arc(0, armH + 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Right arm
    ctx.save();
    ctx.translate(torsoW / 2 + 1, torsoY + 2);
    ctx.rotate((armSwing + panicWave) * 0.06);
    ctx.fillStyle = COL.shirt;
    ctx.fillRect(-armW / 2, 0, armW, armH);
    ctx.fillStyle = COL.skin;
    ctx.beginPath();
    ctx.arc(0, armH + 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- Neck ---
    ctx.fillStyle = COL.skin;
    ctx.fillRect(-4, hy + 12, 8, 8);

    // --- Head ---
    const headR = 14;
    const headCY = hy + headR;
    ctx.fillStyle = COL.skin;
    ctx.beginPath();
    ctx.arc(0, headCY, headR, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.arc(0, headCY, headR, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, headCY - headR + 4, headR * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Eyes — panic makes them wide
    const eyeSize = 2.5 + this.panic * 2;
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath(); ctx.arc(-5, headCY - 1, eyeSize, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5,  headCY - 1, eyeSize, 0, Math.PI * 2); ctx.fill();

    // White part (panic)
    if (this.panic > 0.4) {
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = this.panic * 0.8;
      ctx.beginPath(); ctx.arc(-5, headCY - 1, eyeSize + 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1e1b4b';
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(-5, headCY - 1, eyeSize, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(5,  headCY - 1, eyeSize, 0, Math.PI * 2); ctx.fill();
    }

    // Mouth — scared open mouth when panicking
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (this.panic > 0.5) {
      ctx.arc(0, headCY + 5, 4, 0, Math.PI);
    } else {
      ctx.arc(0, headCY + 6, 4, 0, Math.PI);
    }
    ctx.stroke();

    ctx.restore();

    // Shadow
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(cx, GROUND_Y - 2, PLAYER_W * 0.55 * this.squash, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function rr(ctx, x, y, w, h, r) {
  ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
}
