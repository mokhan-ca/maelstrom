import { COLORS } from './palette.js';

const GRAIN_SIZE = 256;
const CLOUD_LAYERS = [
  { count: 4, speed: 8, size: 0.6, alpha: 0.07 },
  { count: 3, speed: 22, size: 0.9, alpha: 0.05 },
];

export default class Paper {
  constructor(rng = Math.random) {
    this.rng = rng;
    this.speed = 1;
    this.grain = this.#grain();
    this.cloud = this.#cloud();
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.clouds = CLOUD_LAYERS.flatMap((layer) =>
      Array.from({ length: layer.count }, () => ({ ...layer, x: this.rng() * width, y: this.rng() * height })));
    this.vignette = null;
  }

  update(dt) {
    for (const cloud of this.clouds) {
      cloud.y += cloud.speed * this.speed * dt;
      if (cloud.y - this.#cloudSize(cloud) > this.height) {
        cloud.y = -this.#cloudSize(cloud);
        cloud.x = this.rng() * this.width;
      }
    }
  }

  draw(ctx) {
    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = (this.pattern ??= ctx.createPattern(this.grain, 'repeat'));
    ctx.fillRect(0, 0, this.width, this.height);
    for (const cloud of this.clouds) {
      const size = this.#cloudSize(cloud);
      ctx.globalAlpha = cloud.alpha;
      ctx.drawImage(this.cloud, cloud.x - size / 2, cloud.y - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = (this.vignette ??= this.#vignette(ctx));
    ctx.fillRect(0, 0, this.width, this.height);
  }

  #cloudSize(cloud) {
    return Math.max(this.width, this.height) * cloud.size;
  }

  #vignette(ctx) {
    const reach = Math.max(this.width, this.height) * 0.75;
    const gradient = ctx.createRadialGradient(this.width / 2, this.height / 2, reach * 0.4, this.width / 2, this.height / 2, reach);
    gradient.addColorStop(0, 'rgba(90, 60, 30, 0)');
    gradient.addColorStop(1, 'rgba(90, 60, 30, 0.22)');
    return gradient;
  }

  #grain() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = GRAIN_SIZE;
    const ctx = canvas.getContext('2d');
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = `rgba(80, 60, 30, ${this.rng() * 0.06})`;
      ctx.fillRect(this.rng() * GRAIN_SIZE, this.rng() * GRAIN_SIZE, 1 + this.rng() * 1.5, 1 + this.rng() * 1.5);
    }
    ctx.strokeStyle = 'rgba(120, 95, 60, 0.07)';
    for (let i = 0; i < 40; i++) {
      const x = this.rng() * GRAIN_SIZE;
      const y = this.rng() * GRAIN_SIZE;
      ctx.lineWidth = 0.5 + this.rng();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + this.rng() * 20 - 10, y + this.rng() * 20 - 10, x + this.rng() * 40 - 20, y + this.rng() * 40 - 20);
      ctx.stroke();
    }
    return canvas;
  }

  #cloud() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, COLORS.wash);
    gradient.addColorStop(1, 'rgba(91, 100, 112, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    return canvas;
  }
}
