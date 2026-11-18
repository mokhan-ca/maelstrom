import { SHIP, WORLD, POWERUPS } from '../config.js';
import { sprites, draw } from '../render/sprites.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export default class Ship {
  constructor() {
    this.radius = SHIP.radius;
    this.reset();
  }

  reset() {
    this.x = WORLD.width / 2;
    this.y = SHIP.startY;
    this.active = true;
    this.cooldown = 0;
    this.invulnerable = 0;
    this.powers = { spread: 0, rapid: 0, shield: 0 };
    this.age = 0;
  }

  update(dt, input) {
    this.age += dt;
    this.cooldown -= dt;
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    for (const power in this.powers) this.powers[power] = Math.max(0, this.powers[power] - dt);
    this.#move(dt, input);
  }

  get canFire() {
    return this.cooldown <= 0;
  }

  get shielded() {
    return this.powers.shield > 0;
  }

  get vulnerable() {
    return this.invulnerable === 0 && !this.shielded;
  }

  get visible() {
    return this.invulnerable === 0 || Math.floor(this.invulnerable * 12) % 2 === 0;
  }

  fire(lasers) {
    this.cooldown = this.powers.rapid ? SHIP.rapidFireInterval : SHIP.fireInterval;
    const angles = this.powers.spread ? [-0.22, 0, 0.22] : [0];
    for (const angle of angles) {
      lasers.fire(this.x, this.y - 22, Math.sin(angle) * SHIP.laserSpeed, -Math.cos(angle) * SHIP.laserSpeed, angle);
    }
  }

  hit() {
    this.invulnerable = SHIP.invulnerableFor;
  }

  powerUp(type) {
    this.powers[type] = POWERUPS.duration;
  }

  draw(ctx) {
    if (this.shielded) draw(ctx, sprites().shield, this.x, this.y);
    if (this.visible) draw(ctx, sprites().ship, this.x, this.y);
  }

  #move(dt, input) {
    const { x, y } = input.axis;
    const drag = input.takeDrag();
    this.x = clamp(this.x + x * SHIP.speed * dt + drag.x * SHIP.touchSensitivity, this.radius, WORLD.width - this.radius);
    this.y = clamp(this.y + y * SHIP.speed * dt + drag.y * SHIP.touchSensitivity, this.radius * 3, WORLD.height - SHIP.bottomMargin);
  }
}
