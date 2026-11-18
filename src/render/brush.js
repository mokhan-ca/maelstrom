export const seeded = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export default class Brush {
  constructor(ctx, rng) {
    this.ctx = ctx;
    this.rng = rng;
  }

  wobble(amount) {
    return (this.rng() - 0.5) * amount;
  }

  stroke(points, { color, width, passes = 3, jitter = 1.2, closed = false }) {
    const { ctx } = this;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let pass = 0; pass < passes; pass++) {
      ctx.globalAlpha = pass === 0 ? 0.95 : 0.35;
      ctx.lineWidth = width * (pass === 0 ? 1 : 0.5 + this.rng() * 0.6);
      this.#trace(points.map(([x, y]) => [x + this.wobble(jitter), y + this.wobble(jitter)]), closed);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  fill(points, color, alpha = 0.9) {
    const { ctx } = this;
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    this.#trace(points.map(([x, y]) => [x + this.wobble(0.8), y + this.wobble(0.8)]), true);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  blot(x, y, radius, color, alpha = 0.9) {
    const points = Array.from({ length: 14 }, (_, i) => {
      const angle = (i / 14) * Math.PI * 2;
      const reach = radius * (0.75 + this.rng() * 0.45);
      return [x + Math.cos(angle) * reach, y + Math.sin(angle) * reach];
    });
    this.fill(points, color, alpha);
  }

  circle(x, y, radius, { color, width, gap = 0.12 }) {
    const start = this.rng() * Math.PI * 2;
    const sweep = Math.PI * 2 * (1 - gap);
    const points = Array.from({ length: 33 }, (_, i) => {
      const angle = start + (i / 32) * sweep;
      return [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius];
    });
    this.stroke(points, { color, width, passes: 2, jitter: 0.8 });
  }

  #trace(points, closed) {
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (let i = 1; i < points.length - 1; i++) {
      const [x, y] = points[i];
      const [nx, ny] = points[i + 1];
      ctx.quadraticCurveTo(x, y, (x + nx) / 2, (y + ny) / 2);
    }
    ctx.lineTo(...points[points.length - 1]);
    if (closed) ctx.closePath();
  }
}
