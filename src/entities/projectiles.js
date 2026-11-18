import Pool from '../engine/pool.js';
import { WORLD } from '../config.js';
import { draw } from '../render/sprites.js';

export default class Projectiles {
  constructor(sprite, radius, limit = 200) {
    this.sprite = sprite;
    this.radius = radius;
    this.pool = new Pool(() => ({ active: false }), limit);
  }

  fire(x, y, vx, vy, rotation = 0) {
    this.pool.spawn((shot) => Object.assign(shot, { x, y, vx, vy, rotation, radius: this.radius }));
  }

  update(dt) {
    for (const shot of this.pool) {
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      if (offscreen(shot)) shot.active = false;
    }
  }

  drift(vortex, dt, weight) {
    for (const shot of this.pool) {
      const { x, y } = vortex.pull(shot, dt, weight);
      shot.x += x;
      shot.y += y;
    }
  }

  draw(ctx) {
    for (const shot of this.pool) draw(ctx, this.sprite(), shot.x, shot.y, shot.rotation);
  }

  clear() {
    this.pool.clear();
  }

  [Symbol.iterator]() {
    return this.pool[Symbol.iterator]();
  }
}

const offscreen = ({ x, y }) => x < -40 || x > WORLD.width + 40 || y < -40 || y > WORLD.height + 40;
