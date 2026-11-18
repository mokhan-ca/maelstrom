import Pool from '../engine/pool.js';
import { COLORS } from '../render/palette.js';

const easeOut = (t) => 1 - (1 - t) ** 3;

export default class Effects {
  constructor() {
    this.rings = new Pool(() => ({ active: false }), 40);
    this.labels = new Pool(() => ({ active: false }), 40);
  }

  ring(x, y, color, radius = 40) {
    this.rings.spawn((ring) => Object.assign(ring, { x, y, color: COLORS[color], radius, age: 0, life: 0.28 }));
  }

  label(x, y, text, color = 'white') {
    this.labels.spawn((label) => Object.assign(label, { x, y, text, color: COLORS[color], age: 0, life: 0.7 }));
  }

  update(dt) {
    for (const effect of [...this.rings, ...this.labels]) {
      effect.age += dt;
      if (effect.age >= effect.life) effect.active = false;
    }
  }

  draw(ctx) {
    this.#drawRings(ctx);
    this.#drawLabels(ctx);
    ctx.globalAlpha = 1;
  }

  clear() {
    this.rings.clear();
    this.labels.clear();
  }

  #drawRings(ctx) {
    ctx.lineWidth = 3;
    for (const ring of this.rings) {
      const progress = ring.age / ring.life;
      ctx.globalAlpha = 1 - progress;
      ctx.strokeStyle = ring.color;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius * easeOut(progress), 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  #drawLabels(ctx) {
    ctx.font = 'bold 18px ui-rounded, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const label of this.labels) {
      const progress = label.age / label.life;
      ctx.globalAlpha = 1 - progress ** 2;
      ctx.fillStyle = label.color;
      ctx.fillText(label.text, label.x, label.y - 28 * easeOut(progress));
    }
  }
}
