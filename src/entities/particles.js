import Pool from '../engine/pool.js';
import { PARTICLES } from '../config.js';
import { sprites } from '../render/sprites.js';

const GRAVITY = 260;

export default class Particles {
  constructor(rng = Math.random) {
    this.rng = rng;
    this.pool = new Pool(() => ({ active: false }), PARTICLES.max);
  }

  burst(x, y, color, count = 24, speed = 220, life = 0.7) {
    for (let i = 0; i < count; i++) {
      const angle = this.rng() * Math.PI * 2;
      const velocity = speed * (0.3 + this.rng() * 0.7);
      this.emit(x, y, Math.cos(angle) * velocity, Math.sin(angle) * velocity, color, life * (0.6 + this.rng() * 0.6), 0.6 + this.rng() * 1.2);
    }
  }

  emit(x, y, vx, vy, color, life, size = 1) {
    this.pool.spawn((p) => {
      p.x = x;
      p.y = y;
      p.vx = vx;
      p.vy = vy;
      p.color = color;
      p.life = life;
      p.maxLife = life;
      p.size = size;
    });
  }

  update(dt) {
    for (const p of this.pool) {
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      const drag = 0.97 ** (dt * 60);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= drag;
      p.vy = p.vy * drag + GRAVITY * dt;
    }
  }

  draw(ctx) {
    const dots = sprites().dots;
    for (const p of this.pool) {
      const sprite = dots[p.color] || dots.ink;
      const remaining = Math.max(0, p.life / p.maxLife);
      const size = sprite.width * p.size * (0.4 + 0.6 * remaining);
      ctx.globalAlpha = remaining;
      ctx.drawImage(sprite.variants[0], p.x - size / 2, p.y - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    this.pool.clear();
  }
}
