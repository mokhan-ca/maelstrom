import { LOOP } from '../config.js';

export default class Loop {
  constructor({ update, render, step = LOOP.step, maxFrame = LOOP.maxFrame, raf, now } = {}) {
    this.update = update;
    this.render = render;
    this.step = step;
    this.maxFrame = maxFrame;
    this.raf = raf || ((fn) => requestAnimationFrame(fn));
    this.now = now || (() => performance.now() / 1000);
    this.accumulator = 0;
    this.last = null;
    this.running = false;
    this.frame = this.frame.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = this.now();
    this.raf(this.frame);
  }

  stop() {
    this.running = false;
  }

  frame() {
    if (!this.running) return;
    this.tick(this.now());
    this.raf(this.frame);
  }

  tick(time) {
    const elapsed = Math.min(Math.max(time - this.last, 0), this.maxFrame);
    this.last = time;
    this.accumulator += elapsed;
    while (this.accumulator >= this.step) {
      this.update(this.step);
      this.accumulator -= this.step;
    }
    this.render(elapsed);
  }
}
