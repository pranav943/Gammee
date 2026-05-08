import { W, H, GROUND_Y, BASE_SPEED, SPEED_INCREMENT, MAX_SPEED, OBS_TYPES } from './constants.js';
import { Player } from './Player.js';
import { Obstacle } from './Obstacle.js';
import { Coin } from './Coin.js';
import { Snake } from './Snake.js';
import { FlyingFish } from './FlyingFish.js';
import { Background } from './Background.js';
import { ParticleSystem } from './ParticleSystem.js';

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

export class Runner {
  constructor(canvas, onTick, onGameOver) {
    this.canvas   = canvas;
    this.ctx      = canvas.getContext('2d');
    this.onTick   = onTick;
    this.onGameOver = onGameOver;

    canvas.width  = W;
    canvas.height = H;

    this.reset();
    this._bindInput();
  }

  reset() {
    this.player    = new Player();
    this.obstacles = [];
    this.coins     = [];
    this.snakes    = [];
    this.fish      = [];
    this.bg        = new Background();
    this.particles = new ParticleSystem();

    this.speed      = BASE_SPEED;
    this.score      = 0;
    this.meters     = 0;
    this.scoreAcc   = 0;
    this.metersAcc  = 0;

    this.nextObs    = 1400;
    this.nextCoin   = 700;
    this.nextSnake  = 4000;
    this.nextFish   = 5500;

    this.running    = false;
    this._raf       = null;
    this._lastTime  = 0;
  }

  start() {
    this.reset();
    this.running   = true;
    this._lastTime = performance.now();
    this._raf      = requestAnimationFrame(this._loop.bind(this));
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
    this.speed = Math.min(MAX_SPEED, BASE_SPEED + Math.floor(this.score / 80) * SPEED_INCREMENT);

    // Score / distance
    this.scoreAcc  += this.speed * dt * 0.045;
    this.metersAcc += this.speed * dt * 0.055;
    const newScore = Math.floor(this.scoreAcc);
    if (newScore !== this.score) {
      this.score = newScore;
      this.onTick(this.score, Math.floor(this.metersAcc));
    }
    this.meters = Math.floor(this.metersAcc);

    this.bg.update(dt, this.speed);
    particles.update(dt);

    if (!player.dead) {
      // Compute panic: how close is the nearest enemy
      let minDist = Infinity;
      for (const s of this.snakes)  minDist = Math.min(minDist, Math.abs(s.head.x - player.x));
      for (const f of this.fish)    minDist = Math.min(minDist, Math.hypot(f.x - player.x, f.y - player.y));
      player.setPanic(minDist < 250 ? 1 - minDist / 250 : 0);
    }

    player.update(dt);

    // Ground run particles
    if (player.onGround && !player.dead && Math.random() < 0.35) {
      particles.emit(player.x + 4, GROUND_Y - 2, 1, {
        color: '#3b82f6', speed: 25, angle: Math.PI, spread: 0.5,
        r: 2, decay: 4, gravity: 80, upBias: 0,
      });
    }

    // --- Spawn obstacles ---
    this.nextObs -= dt * 1000;
    if (this.nextObs <= 0) {
      const type = OBS_TYPES[Math.floor(Math.random() * OBS_TYPES.length)];
      this.obstacles.push(new Obstacle(type, this.speed));
      const minGap = Math.max(420, 1000 - this.score * 0.7);
      this.nextObs = minGap + Math.random() * 500;
    }

    // --- Spawn snakes (after score 50) ---
    if (this.score > 50) {
      this.nextSnake -= dt * 1000;
      if (this.nextSnake <= 0) {
        this.snakes.push(new Snake(this.speed));
        const gap = Math.max(3000, 7000 - this.score * 4);
        this.nextSnake = gap + Math.random() * 2000;
      }
    }

    // --- Spawn flying fish (after score 120) ---
    if (this.score > 120) {
      this.nextFish -= dt * 1000;
      if (this.nextFish <= 0) {
        this.fish.push(new FlyingFish(this.speed));
        const gap = Math.max(2800, 7000 - this.score * 3.5);
        this.nextFish = gap + Math.random() * 2000;
      }
    }

    // --- Spawn coins ---
    this.nextCoin -= dt * 1000;
    if (this.nextCoin <= 0) {
      const cols = 1 + (Math.random() < 0.4 ? 2 : 0);
      for (let i = 0; i < cols; i++) this.coins.push(new Coin(W + 40 + i * 30));
      this.nextCoin = 600 + Math.random() * 800;
    }

    // Update obstacles
    for (const o of this.obstacles) o.update(dt, this.speed);
    this.obstacles = this.obstacles.filter(o => !o.offscreen);

    // Update coins
    for (const c of this.coins) c.update(dt, this.speed);
    this.coins = this.coins.filter(c => !c.offscreen);

    // Update snakes
    for (const s of this.snakes) s.update(dt, this.speed, player.x, player.y);
    this.snakes = this.snakes.filter(s => !s.offscreen);

    // Update fish
    for (const f of this.fish) f.update(dt, this.speed, player.x, player.y);
    this.fish = this.fish.filter(f => !f.offscreen);

    if (player.dead) return;

    const ph = player.hitbox;

    // Collide obstacles
    for (const o of this.obstacles) {
      if (rectsOverlap(ph, o.hitbox)) { this._die('obs'); return; }
    }

    // Collide snakes (head only)
    for (const s of this.snakes) {
      if (rectsOverlap(ph, s.hitbox)) { this._die('snake'); return; }
    }

    // Collide fish
    for (const f of this.fish) {
      if (rectsOverlap(ph, f.hitbox)) { this._die('fish'); return; }
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

  _die(cause) {
    const p = this.player;
    p.dead = true;
    p.vy = -520;

    const colors = { obs: ['#f43f5e','#7c3aed'], snake: ['#4ade80','#f43f5e'], fish: ['#0ea5e9','#f43f5e'] };
    const [c1, c2] = colors[cause] || colors.obs;
    this.particles.emit(p.x + 15, p.y + 28, 28, { color: c1, speed: 140, r: 6, decay: 1.3, gravity: 500, upBias: 90 });
    this.particles.emit(p.x + 15, p.y + 28, 18, { color: c2, speed: 100, r: 4, decay: 1.9, gravity: 380, upBias: 60 });

    this._causeOfDeath = cause;
    setTimeout(() => {
      if (this.running) {
        this.running = false;
        this.onGameOver(this.score, this.meters, cause);
      }
    }, 950);
  }

  _draw() {
    const { ctx } = this;
    ctx.clearRect(0, 0, W, H);

    this.bg.draw(ctx);
    this.particles.draw(ctx);

    for (const c of this.coins) c.draw(ctx);
    for (const o of this.obstacles) o.draw(ctx);
    for (const s of this.snakes) s.draw(ctx);
    for (const f of this.fish) f.draw(ctx);

    this.player.draw(ctx);

    // Speed bar
    const frac = (this.speed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED);
    ctx.save();
    ctx.globalAlpha = 0.55;
    const sg = ctx.createLinearGradient(0, 0, W * frac, 0);
    sg.addColorStop(0, '#3b82f6');
    sg.addColorStop(1, '#06b6d4');
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, W * frac, 3);
    ctx.restore();

    // Enemy count warning overlay (subtle red tint when many enemies)
    const enemyCount = this.snakes.length + this.fish.length;
    if (enemyCount >= 2) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.12, enemyCount * 0.04);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }
}
