import Pool from '../engine/pool.js';
import { POWERUPS, WORLD } from '../config.js';
import { sprites, draw } from '../render/sprites.js';

const icons = { spread: 'spread', rapid: 'rapid', shield: 'shieldPickup' };

export default class Powerups {
  constructor(rng = Math.random) {
    this.rng = rng;
    this.pool = new Pool(() => ({ active: false }));
    this.reset();
  }

  reset() {
    this.clear();
    this.sinceDrop = 0;
    this.dropped = 0;
  }

  maybeDrop(x, y, kills) {
    if (this.#lucky(kills)) this.#drop(x, y);
  }

  #lucky(kills) {
    if (this.dropped === 0 && kills >= POWERUPS.guaranteedAtKill) return true;
    return this.sinceDrop >= POWERUPS.dropCooldown && this.rng() < POWERUPS.dropChance;
  }

  #drop(x, y) {
    this.dropped++;
    this.sinceDrop = 0;
    const type = POWERUPS.types[Math.floor(this.rng() * POWERUPS.types.length)];
    this.pool.spawn((powerup) => Object.assign(powerup, { x, y, type, radius: POWERUPS.radius, age: 0 }));
  }

  update(dt) {
    this.sinceDrop += dt;
    for (const powerup of this.pool) {
      powerup.age += dt;
      powerup.y += POWERUPS.fallSpeed * dt;
      if (powerup.y > WORLD.height + 30) powerup.active = false;
    }
  }

  draw(ctx) {
    for (const powerup of this.pool) {
      draw(ctx, sprites()[icons[powerup.type]], powerup.x, powerup.y + Math.sin(powerup.age * 5) * 3);
    }
  }

  clear() {
    this.pool.clear();
  }

  [Symbol.iterator]() {
    return this.pool[Symbol.iterator]();
  }
}
