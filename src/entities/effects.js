import Pool from '../engine/pool.js';
import { COLORS } from '../render/palette.js';
import { sprites } from '../render/sprites.js';

const easeOut = (t) => 1 - (1 - t) ** 3;

export default class Effects {
  constructor(rng = Math.random) {
    this.rng = rng;
    this.rings = new Pool(() => ({ active: false }), 40);
    this.labels = new Pool(() => ({ active: false }), 40);
    this.stains = new Pool(() => ({ active: false }), 24);
  }

  ring(x, y, color, radius = 40) {
    const start = this.rng() * Math.PI * 2;
    this.rings.spawn((ring) => Object.assign(ring, { x, y, color: COLORS[color], radius, start, age: 0, life: 0.35 }));
  }

  label(x, y, text, color = 'ink', size = 20) {
    this.labels.spawn((label) => Object.assign(label, { x, y, text, size, color: COLORS[color], age: 0, life: size > 20 ? 1.6 : 0.8 }));
  }

  stain(x, y, scale = 1) {
    if (this.stains.count >= this.stains.limit) this.#oldestStain().active = false;
    this.stains.spawn((stain) => Object.assign(stain, { x, y, scale, rotation: this.rng() * Math.PI * 2, age: 0, life: 6 }));
  }

  update(dt) {
    for (const effect of [...this.rings, ...this.labels, ...this.stains]) {
      effect.age += dt;
      if (effect.age >= effect.life) effect.active = false;
    }
  }

  drawStains(ctx) {
    const { splatter } = sprites();
    for (const stain of this.stains) {
      const size = splatter.width * stain.scale;
      ctx.globalAlpha = 0.35 * (1 - stain.age / stain.life);
      ctx.save();
      ctx.translate(stain.x, stain.y);
      ctx.rotate(stain.rotation);
      ctx.drawImage(splatter.variants[0], -size / 2, -size / 2, size, size);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  draw(ctx) {
    this.#drawRings(ctx);
    this.#drawLabels(ctx);
    ctx.globalAlpha = 1;
  }

  clear() {
    for (const pool of [this.rings, this.labels, this.stains]) pool.clear();
  }

  #oldestStain() {
    return [...this.stains].reduce((oldest, stain) => (stain.age > oldest.age ? stain : oldest));
  }

  #drawRings(ctx) {
    ctx.lineCap = 'round';
    for (const ring of this.rings) {
      const progress = ring.age / ring.life;
      ctx.globalAlpha = 1 - progress;
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = 5 * (1 - progress) + 1;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius * easeOut(progress), ring.start, ring.start + Math.PI * 1.8 * easeOut(Math.min(1, progress * 2)));
      ctx.stroke();
    }
  }

  #drawLabels(ctx) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const label of this.labels) {
      const progress = label.age / label.life;
      ctx.globalAlpha = 1 - progress ** 2;
      ctx.font = `bold ${label.size}px "Iowan Old Style", Palatino, Georgia, serif`;
      ctx.fillStyle = label.color;
      ctx.fillText(label.text, label.x, label.y - 28 * easeOut(progress));
    }
  }
}
