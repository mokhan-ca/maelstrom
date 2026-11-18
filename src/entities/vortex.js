import { VORTEX, WORLD } from '../config.js';
import { COLORS } from '../render/palette.js';

const NONE = { x: 0, y: 0 };

export default class Vortex {
  constructor() {
    this.reset();
  }

  reset() {
    this.age = 0;
    this.speed = 0;
    this.presence = 0;
    this.#follow();
  }

  awaken(wave) {
    if (wave < VORTEX.fromWave) return (this.speed = 0);
    this.speed = Math.min(VORTEX.maxSpeed, VORTEX.baseSpeed + VORTEX.speedPerWave * (wave - VORTEX.fromWave));
  }

  get active() {
    return this.speed > 0;
  }

  update(dt) {
    this.age += dt;
    this.presence = Math.min(1, this.presence + (this.active ? dt / 1.5 : -dt));
    this.#follow();
  }

  pull(body, dt, weight) {
    const dx = this.x - body.x;
    const dy = this.y - body.y;
    const distance = Math.hypot(dx, dy);
    if (!this.active || distance === 0 || distance >= VORTEX.reach) return NONE;
    const step = this.speed * this.presence * weight * (1 - distance / VORTEX.reach) * dt / distance;
    return { x: (dx - dy * VORTEX.swirl) * step, y: (dy + dx * VORTEX.swirl) * step };
  }

  swallows(body) {
    return this.active && this.presence === 1 && Math.hypot(this.x - body.x, this.y - body.y) < VORTEX.core;
  }

  draw(ctx) {
    if (this.presence === 0) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.age * 2.4);
    ctx.globalAlpha = 0.55 * this.presence;
    ctx.strokeStyle = COLORS.violet;
    ctx.lineCap = 'round';
    for (let arm = 0; arm < 4; arm++) {
      ctx.rotate(Math.PI / 2);
      ctx.lineWidth = 5 - arm;
      ctx.beginPath();
      for (let t = 0; t <= 1; t += 0.05) {
        const radius = VORTEX.core + (VORTEX.reach * 0.8 - VORTEX.core) * t;
        ctx.lineTo(Math.cos(t * 3.5) * radius, Math.sin(t * 3.5) * radius);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  #follow() {
    const { path } = VORTEX;
    this.x = WORLD.width / 2 + Math.sin(this.age * path.speedX) * path.x;
    this.y = path.centerY + Math.sin(this.age * path.speedY + 1) * path.y;
  }
}
