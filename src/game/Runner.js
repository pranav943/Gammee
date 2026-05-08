import { W, H, GROUND_Y, BASE_SPEED, SPEED_INCREMENT, MAX_SPEED, OBS_TYPES } from './constants.js';
import { Player } from './Player.js';
import { Obstacle } from './Obstacle.js';
import { Coin } from './Coin.js';
import { Background } from './Background.js';
import { ParticleSystem } from './ParticleSystem.js';

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

export class Runner {
  constructor(canvas, onTick, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onTick = onTick;
    this.onGameOver = onGameOver;

    // Logical resolution
    canvas.width  = W;
    canvas.height = H;

    this.player = null;
    this.obstacles = [];
    this.coins = [];
    this.bg = null;
    this.particles = null;

    this.speed = BASE_SPEED;
    this.score = 0;
    this.meters = 0;
    this.scoreAcc = 0;
    this.metersAcc = 0;
    this.nextObs = 0;
    this.nextCoin = 0;
    this.minGap = 900;   // ms
    this.running = false;

    this._raf = null;
    this._lastTime = 0;

    this._bindInput();
  }

  start() {
    this.player = new Player();
    this.obstacles = [];
    this.coins = [];
    this.bg = new Background();
    this.particles = new ParticleSystem();
    this.speed = BASE_SPEED;
    this.score = 0;
    this.meters = 0;
    this.scoreAcc = 0;
    this.metersAcc = 0;
    this.nextObs = 1200;
    this.nextCoin = 600;
    this.running = true;
    this._lastTime = performance.now();
    this._raf = requestAnimationFrame(this._loop.bind(this));
  }

  destroy() {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._removeInput();
  }

  _bindInput() {
    this._onKey = e => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        this.player?.jump();
      }
    };
    this._onTouch = () => this.player?.jump();
    window.addEventListener('keydown', this._onKey);
    this.canvas.addEventListener('pointerdown', this._onTouch);
  }

  _removeInput() {
    window.removeEventListener('keydown', this._onKey);
    this.canvas.removeEventListener('pointerdown', this._onTouch);
  }

  _loop(now) {
    if (!this.running) return;
    const dt = Math.min((now - this._lastTime) / 1000, 0.05);
    this._lastTime = now;

    this._update(dt);
    this._draw();

    this._raf = requestAnimationFrame(this._loop.bind(this));
  }

  _update(dt) {
    const { player, particles } = this;

    // Speed ramp
    this.speed = Math.min(MAX_SPEED, BASE_SPEED + Math.floor(this.score / 100) * SPEED_INCREMENT);

    // Score / distance
    this.scoreAcc += this.speed * dt * 0.04;
    this.metersAcc += this.speed * dt * 0.05;
    const newScore = Math.floor(this.scoreAcc);
    if (newScore !== this.score) {
      this.score = newScore;
      this.onTick(this.score, Math.floor(this.metersAcc));
    }
    this.meters = Math.floor(this.metersAcc);

    this.bg.update(dt, this.speed);
    player.update(dt);
    particles.update(dt);

    // Ground run particles
    if (player.onGround && !player.dead && Math.random() < 0.4) {
      particles.emit(player.x + 4, GROUND_Y - 2, 1, {
        color: '#7c3aed',
        speed: 30,
        angle: Math.PI,
        spread: 0.6,
        r: 2,
        decay: 4,
        gravity: 100,
        upBias: 0,
      });
    }

    // Spawn obstacles
    this.nextObs -= dt * 1000;
    if (this.nextObs <= 0) {
      const type = OBS_TYPES[Math.floor(Math.random() * OBS_TYPES.length)];
      this.obstacles.push(new Obstacle(type, this.speed));
      this.minGap = Math.max(480, 1100 - this.score * 0.8);
      this.nextObs = this.minGap + Math.random() * 600;
    }

    // Spawn coins
    this.nextCoin -= dt * 1000;
    if (this.nextCoin <= 0) {
      const cols = 1 + (Math.random() < 0.4 ? 2 : 0);
      for (let i = 0; i < cols; i++) {
        this.coins.push(new Coin(W + 40 + i * 30));
      }
      this.nextCoin = 700 + Math.random() * 900;
    }

    // Update obstacles
    for (const o of this.obstacles) o.update(dt, this.speed);
    this.obstacles = this.obstacles.filter(o => !o.offscreen);

    // Update coins
    for (const c of this.coins) c.update(dt, this.speed);
    this.coins = this.coins.filter(c => !(c.offscreen && c.collected) && !c.offscreen);

    if (player.dead) return;

    // Collide obstacles
    const ph = player.hitbox;
    for (const o of this.obstacles) {
      if (rectsOverlap(ph, o.hitbox)) {
        this._triggerDeath();
        return;
      }
    }

    // Collect coins
    for (const c of this.coins) {
      if (!c.collected && rectsOverlap(ph, c.hitbox)) {
        c.collect();
        this.scoreAcc += 10;
        particles.emit(c.x, c.y, 8, { color: '#fbbf24', speed: 80, r: 3, decay: 3, gravity: 200, upBias: 60 });
      }
    }
  }

  _triggerDeath() {
    const p = this.player;
    p.dead = true;
    p.vy = -500;
    this.particles.emit(p.x + 18, p.y + 26, 30, {
      color: '#f43f5e', speed: 140, r: 5, decay: 1.4, gravity: 500, upBias: 80,
    });
    this.particles.emit(p.x + 18, p.y + 26, 20, {
      color: '#7c3aed', speed: 100, r: 4, decay: 1.8, gravity: 400, upBias: 60,
    });
    setTimeout(() => {
      if (this.running) {
        this.running = false;
        this.onGameOver(this.score, this.meters);
      }
    }, 900);
  }

  _draw() {
    const { ctx } = this;
    ctx.clearRect(0, 0, W, H);

    this.bg.draw(ctx);
    this.particles.draw(ctx);

    for (const c of this.coins) c.draw(ctx);
    for (const o of this.obstacles) o.draw(ctx);

    this.player.draw(ctx);

    // Speed indicator strip at top
    const frac = (this.speed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED);
    ctx.save();
    ctx.globalAlpha = 0.55;
    const sg = ctx.createLinearGradient(0, 0, W * frac, 0);
    sg.addColorStop(0, '#7c3aed');
    sg.addColorStop(1, '#06b6d4');
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, W * frac, 3);
    ctx.restore();
  }
}
