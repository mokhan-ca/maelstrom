import { WORLD } from '../config.js';

const WOUND = { freeze: 0.12, shake: 18 };

export default class Impact {
  constructor({ rng = Math.random, calm = () => false } = {}) {
    this.rng = rng;
    this.calm = calm;
    this.reset();
  }

  reset() {
    this.freeze = 0;
    this.shake = 0;
    this.flash = 0;
  }

  frozen(dt) {
    if (this.freeze <= 0) return false;
    this.freeze -= dt;
    return true;
  }

  jolt(freeze, shake = 0) {
    this.freeze = Math.max(this.freeze, freeze);
    this.shake = Math.max(this.shake, shake);
  }

  wound() {
    this.freeze = WOUND.freeze;
    this.shake = WOUND.shake;
    this.flash = 1;
  }

  settle(dt) {
    this.shake = Math.max(0, this.shake - dt * 30);
    this.flash = Math.max(0, this.flash - dt * 2.5);
  }

  get offset() {
    return { x: (this.rng() - 0.5) * this.shake, y: (this.rng() - 0.5) * this.shake };
  }

  draw(ctx) {
    if (!this.flash || this.calm()) return;
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(194, 59, 34, ${this.flash * 0.35})`;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    ctx.globalCompositeOperation = 'source-over';
  }
}
