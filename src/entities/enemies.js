import Pool from '../engine/pool.js';
import { ENEMIES, WORLD } from '../config.js';
import { sprites, draw } from '../render/sprites.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const behaviours = {
  drifter(enemy, dt) {
    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;
    if (enemy.x < enemy.radius || enemy.x > WORLD.width - enemy.radius) enemy.vx *= -1;
  },

  zigzag(enemy, dt) {
    const { amplitude, frequency } = ENEMIES.zigzag;
    enemy.y += enemy.vy * dt;
    enemy.x = enemy.originX + Math.sin(enemy.age * frequency + enemy.phase) * amplitude;
  },

  shooter(enemy, dt, { ship, bullets, speed }) {
    const { lingerFor, fireInterval, bulletSpeed } = ENEMIES.shooter;
    const settled = enemy.y >= enemy.station;
    enemy.y += settled && enemy.age < lingerFor ? 0 : enemy.vy * dt;
    enemy.x = clamp(enemy.x + Math.sin(enemy.age * 0.9 + enemy.phase) * 70 * dt, enemy.radius, WORLD.width - enemy.radius);
    enemy.reload -= dt;
    if (!settled || enemy.reload > 0 || !ship.active) return;
    enemy.reload = fireInterval / speed;
    const angle = Math.atan2(ship.y - enemy.y, ship.x - enemy.x);
    bullets.fire(enemy.x, enemy.y + 10, Math.cos(angle) * bulletSpeed, Math.sin(angle) * bulletSpeed);
  },
};

export default class Enemies {
  constructor(rng = Math.random) {
    this.rng = rng;
    this.pool = new Pool(() => ({ active: false }));
  }

  spawn(type, speed) {
    const { radius, hp, speed: base } = ENEMIES[type];
    const x = radius + this.rng() * (WORLD.width - radius * 2);
    const margin = ENEMIES.zigzag.amplitude + radius;
    this.pool.spawn((enemy) => Object.assign(enemy, {
      type,
      radius,
      hp,
      x,
      y: -radius * 2,
      originX: Math.min(Math.max(x, margin), WORLD.width - margin),
      vx: (this.rng() - 0.5) * 80 * speed,
      vy: base * speed * (0.85 + this.rng() * 0.3),
      age: 0,
      phase: this.rng() * Math.PI * 2,
      station: 120 + this.rng() * 220,
      reload: 1 + this.rng(),
      flash: 0,
    }));
  }

  update(dt, world) {
    for (const enemy of this.pool) {
      enemy.age += dt;
      enemy.flash = Math.max(0, enemy.flash - dt);
      behaviours[enemy.type](enemy, dt, world);
      if (enemy.y > WORLD.height + enemy.radius * 2) enemy.active = false;
    }
  }

  damage(enemy) {
    enemy.hp--;
    enemy.flash = 0.08;
    if (enemy.hp <= 0) enemy.active = false;
    return !enemy.active;
  }

  draw(ctx) {
    for (const enemy of this.pool) {
      ctx.globalAlpha = enemy.flash ? 0.4 : 1;
      draw(ctx, sprites()[enemy.type], enemy.x, enemy.y);
    }
    ctx.globalAlpha = 1;
  }

  get count() {
    return this.pool.count;
  }

  clear() {
    this.pool.clear();
  }

  [Symbol.iterator]() {
    return this.pool[Symbol.iterator]();
  }
}
