import { GRAVITY, JUMP_VEL, GROUND_Y, PLAYER_W, PLAYER_H, PLAYER_X, COL } from './constants.js';

export class Player {
  constructor() {
    this.x = PLAYER_X;
    this.y = GROUND_Y - PLAYER_H;
    this.vy = 0;
    this.jumpsLeft = 2;
    this.onGround = true;
    this.trail = [];
    this.frame = 0;         // walk animation counter
    this.dead = false;
    this.deathTimer = 0;
    this.squash = 1;        // landing squash/stretch
    this.stretch = 1;
  }

  jump() {
    if (this.dead) return;
    if (this.jumpsLeft > 0) {
      this.vy = JUMP_VEL * (this.jumpsLeft < 2 ? 0.82 : 1);
      this.jumpsLeft--;
      this.onGround = false;
      this.stretch = 1.35;
      this.squash = 0.75;
    }
  }

  update(dt) {
    if (this.dead) {
      this.deathTimer += dt;
      this.vy += GRAVITY * dt;
      this.y += this.vy * dt;
      return;
    }

    // Gravity
    this.vy += GRAVITY * dt;
    this.y += this.vy * dt;

    // Land
    if (this.y >= GROUND_Y - PLAYER_H) {
      this.y = GROUND_Y - PLAYER_H;
      this.vy = 0;
      this.jumpsLeft = 2;
      if (!this.onGround) {
        this.squash = 0.7;
        this.stretch = 1.3;
      }
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    // Animate squash / stretch towards 1
    this.squash += (1 - this.squash) * Math.min(1, dt * 12);
    this.stretch += (1 - this.stretch) * Math.min(1, dt * 12);

    // Walk cycle
    this.frame += dt * (this.onGround ? 12 : 4);

    // Trail
    this.trail.push({ x: this.x + PLAYER_W / 2, y: this.y + PLAYER_H / 2, age: 0 });
    if (this.trail.length > 10) this.trail.shift();
    for (const t of this.trail) t.age += dt;
  }

  get hitbox() {
    const pad = 6;
    return {
      x: this.x + pad,
      y: this.y + pad,
      w: PLAYER_W - pad * 2,
      h: PLAYER_H - pad * 2,
    };
  }

  draw(ctx) {
    // Trail
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      const a = (i / this.trail.length) * 0.35;
      const r = (PLAYER_W / 2) * (i / this.trail.length) * 0.8;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = COL.player;
      ctx.beginPath();
      ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const cx = this.x + PLAYER_W / 2;
    const cy = this.y + PLAYER_H / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(this.squash, this.stretch);

    // Body gradient
    const grad = ctx.createLinearGradient(-PLAYER_W / 2, -PLAYER_H / 2, PLAYER_W / 2, PLAYER_H / 2);
    grad.addColorStop(0, COL.player);
    grad.addColorStop(1, COL.playerG);

    // Body
    ctx.fillStyle = grad;
    ctx.beginPath();
    roundRect(ctx, -PLAYER_W / 2, -PLAYER_H / 2, PLAYER_W, PLAYER_H, 10);
    ctx.fill();

    // Visor
    ctx.fillStyle = 'rgba(6,182,212,.85)';
    ctx.beginPath();
    roundRect(ctx, -PLAYER_W / 2 + 5, -PLAYER_H / 2 + 8, PLAYER_W - 10, 16, 5);
    ctx.fill();

    // Legs (walk animation)
    if (this.onGround && !this.dead) {
      const swing = Math.sin(this.frame) * 8;
      ctx.fillStyle = COL.playerG;
      // left leg
      ctx.beginPath();
      roundRect(ctx, -PLAYER_W / 2 + 3, PLAYER_H / 2 - 14, 11, 14 + swing, 4);
      ctx.fill();
      // right leg
      ctx.beginPath();
      roundRect(ctx, PLAYER_W / 2 - 14, PLAYER_H / 2 - 14, 11, 14 - swing, 4);
      ctx.fill();
    }

    // Shine
    ctx.fillStyle = 'rgba(255,255,255,.15)';
    ctx.beginPath();
    roundRect(ctx, -PLAYER_W / 2 + 4, -PLAYER_H / 2 + 4, PLAYER_W / 2 - 2, PLAYER_H - 8, 6);
    ctx.fill();

    ctx.restore();

    // Shadow
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(cx, GROUND_Y - 2, PLAYER_W * 0.55 * this.squash, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
}
