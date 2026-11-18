import Pool from '../engine/pool.js';
import { ENEMIES, WORLD, VORTEX } from '../config.js';
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

  shooter(enemy, dt, world) {
    hover(enemy, dt);
    if (!settled(enemy) || !world.ship.active) return;
    enemy.reload -= dt;
    if (enemy.reload <= WIND_UP && !enemy.winding) windUp(enemy, world);
    if (enemy.reload <= 0) fireAt(enemy, world);
  },
};

const WIND_UP = 0.25;

const settled = (enemy) => enemy.y >= enemy.station;

const lingering = (enemy) => settled(enemy) && enemy.age < ENEMIES.shooter.lingerFor;

const hover = (enemy, dt) => {
  if (!lingering(enemy)) enemy.y += enemy.vy * dt;
  enemy.x = clamp(enemy.x + Math.sin(enemy.age * 0.9 + enemy.phase) * 70 * dt, enemy.radius, WORLD.width - enemy.radius);
};

const windUp = (enemy, world) => {
  enemy.winding = true;
  world.charging();
};

const fireAt = (enemy, { ship, bullets, speed }) => {
  const { fireInterval, bulletSpeed } = ENEMIES.shooter;
  const velocity = bulletSpeed * Math.sqrt(speed);
  const lead = Math.hypot(ship.x - enemy.x, ship.y - enemy.y) / velocity;
  const angle = Math.atan2(ship.y + ship.vy * lead - enemy.y, ship.x + ship.vx * lead - enemy.x);
  bullets.fire(enemy.x, enemy.y + 10, Math.cos(angle) * velocity, Math.sin(angle) * velocity);
  enemy.reload = fireInterval / speed;
  enemy.winding = false;
};

const drift = (enemy, { x, y }) => {
  if (enemy.type === 'zigzag') enemy.originX += x;
  else enemy.x += x;
  enemy.y += y;
};

const escaped = (enemy) => enemy.y > WORLD.height + enemy.radius * 2;

const lost = (enemy) => enemy.y < -200 || enemy.x < -100 || enemy.x > WORLD.width + 100;

export const recentlyStruck = (enemy) => enemy.age - enemy.struckAt < VORTEX.bonusWindow;

const heading = (enemy) => (enemy.type === 'zigzag' ? -Math.atan2(enemy.x - enemy.lastX, enemy.y - enemy.lastY) : 0);

const growth = (enemy) => (enemy.winding ? 1 + 0.4 * (1 - Math.max(0, enemy.reload) / WIND_UP) : 1);

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
      lastX: x,
      lastY: -radius * 2 - 1,
      originX: Math.min(Math.max(x, margin), WORLD.width - margin),
      vx: (this.rng() - 0.5) * 80 * speed,
      vy: base * speed * (0.85 + this.rng() * 0.3),
      age: 0,
      phase: this.rng() * Math.PI * 2,
      station: 120 + this.rng() * 220,
      reload: 1 + this.rng(),
      winding: false,
      struckAt: -Infinity,
      flash: 0,
    }));
  }

  update(dt, world) {
    for (const enemy of this.pool) {
      enemy.age += dt;
      enemy.flash = Math.max(0, enemy.flash - dt);
      enemy.lastX = enemy.x;
      enemy.lastY = enemy.y;
      behaviours[enemy.type](enemy, dt, world);
      drift(enemy, world.vortex.pull(enemy, dt, VORTEX.weights.enemy));
      if (escaped(enemy)) this.#escape(enemy, world);
      if (lost(enemy)) enemy.active = false;
    }
  }

  #escape(enemy, world) {
    enemy.active = false;
    world.escaped(enemy);
  }

  damage(enemy) {
    enemy.struckAt = enemy.age;
    enemy.hp--;
    enemy.flash = 0.08;
    if (enemy.hp <= 0) enemy.active = false;
    return !enemy.active;
  }

  draw(ctx) {
    for (const enemy of this.pool) {
      ctx.globalAlpha = enemy.flash ? 0.4 : 1;
      draw(ctx, sprites()[enemy.type], enemy.x, enemy.y, heading(enemy), growth(enemy));
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
