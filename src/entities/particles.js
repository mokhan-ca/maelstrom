import Pool from '../engine/pool.js';
import { PARTICLES } from '../config.js';
import { sprites } from '../render/sprites.js';

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
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.97;
      p.vy *= 0.97;
    }
  }

  draw(ctx) {
    const dots = sprites().dots;
    for (const p of this.pool) {
      const sprite = dots[p.color] || dots.white;
      const size = sprite.width * p.size;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.drawImage(sprite.canvas, p.x - size / 2, p.y - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    this.pool.clear();
  }
}
