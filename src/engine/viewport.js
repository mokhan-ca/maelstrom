import { WORLD, VIEW } from '../config.js';

export const HUD_HEIGHT = 44;

export default class Viewport {
  constructor(canvas, win = window) {
    this.canvas = canvas;
    this.window = win;
    this.ctx = canvas.getContext('2d');
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.dpr = 1;
    this.width = 0;
    this.height = 0;
    this.resize = this.resize.bind(this);
    win.addEventListener('resize', this.resize);
    win.visualViewport?.addEventListener('resize', this.resize);
    this.resize();
  }

  safeInsets() {
    const style = this.window.getComputedStyle(this.window.document.documentElement);
    const read = (name) => parseFloat(style.getPropertyValue(name)) || 0;
    return { top: read('--safe-top'), right: read('--safe-right'), bottom: read('--safe-bottom'), left: read('--safe-left') };
  }

  resize() {
    const win = this.window;
    this.width = win.innerWidth;
    this.height = win.innerHeight;
    this.dpr = Math.min(win.devicePixelRatio || 1, VIEW.maxDpr);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    const insets = this.safeInsets();
    const hud = HUD_HEIGHT;
    const availableW = this.width - insets.left - insets.right;
    const availableH = this.height - insets.top - insets.bottom - hud;
    this.scale = Math.max(0.1, Math.min(availableW / WORLD.width, availableH / WORLD.height));
    this.offsetX = insets.left + (availableW - WORLD.width * this.scale) / 2;
    this.offsetY = insets.top + hud + (availableH - WORLD.height * this.scale) / 2;
    this.onResize?.(this);
  }

  screenSpace() {
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  worldSpace(shakeX = 0, shakeY = 0) {
    const s = this.scale * this.dpr;
    this.ctx.setTransform(s, 0, 0, s, (this.offsetX + shakeX) * this.dpr, (this.offsetY + shakeY) * this.dpr);
  }
}
