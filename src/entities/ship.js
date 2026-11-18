import { SHIP, WORLD, POWERUPS } from '../config.js';
import { sprites, draw } from '../render/sprites.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const fading = (remaining) => remaining < 2 && Math.floor(remaining * 8) % 2 === 0;

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
    this.vx = 0;
    this.vy = 0;
    this.age = 0;
  }

  update(dt, input) {
    this.age += dt;
    this.cooldown -= dt;
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.#move(dt, input);
    return this.#wearOff(dt);
  }

  boost(seconds) {
    this.powers.spread = seconds;
    this.powers.rapid = seconds;
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
    this.powers[type] = POWERUPS.durations[type];
  }

  draw(ctx) {
    if (this.shielded && !fading(this.powers.shield)) draw(ctx, sprites().shield, this.x, this.y);
    if (this.visible) draw(ctx, sprites().ship, this.x, this.y);
  }

  nudge({ x, y }) {
    this.x = clamp(this.x + x, SHIP.halfWidth, WORLD.width - SHIP.halfWidth);
    this.y = clamp(this.y + y, SHIP.halfWidth * 3, WORLD.height - SHIP.bottomMargin);
  }

  #wearOff(dt) {
    const expired = [];
    for (const [power, remaining] of Object.entries(this.powers)) {
      this.powers[power] = Math.max(0, remaining - dt);
      if (remaining > 0 && this.powers[power] === 0) expired.push(power);
    }
    return expired;
  }

  #move(dt, input) {
    const { x, y } = input.axis;
    const drag = input.takeDrag();
    const [lastX, lastY] = [this.x, this.y];
    this.nudge({
      x: x * SHIP.speed * dt + drag.x * SHIP.touchSensitivity,
      y: y * SHIP.speed * dt + drag.y * SHIP.touchSensitivity,
    });
    this.vx = (this.x - lastX) / dt;
    this.vy = (this.y - lastY) / dt;
  }
}
