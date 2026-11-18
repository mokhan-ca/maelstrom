const LAYERS = [
  { density: 0.00012, speed: 18, size: 1, alpha: 0.35 },
  { density: 0.00006, speed: 45, size: 1.5, alpha: 0.6 },
  { density: 0.00002, speed: 110, size: 2.2, alpha: 0.95 },
];

export default class Starfield {
  constructor(rng = Math.random) {
    this.rng = rng;
    this.layers = [];
    this.speed = 1;
    this.width = 0;
    this.height = 0;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.layers = LAYERS.map((layer) => {
      const count = Math.max(12, Math.round(width * height * layer.density));
      const stars = Array.from({ length: count }, () => ({
        x: this.rng() * width,
        y: this.rng() * height,
        twinkle: this.rng() * Math.PI * 2,
      }));
      return { ...layer, stars };
    });
    this.background = null;
  }

  update(dt) {
    for (const layer of this.layers) {
      for (const star of layer.stars) {
        star.y += layer.speed * this.speed * dt;
        star.twinkle += dt * 3;
        if (star.y > this.height) {
          star.y -= this.height;
          star.x = this.rng() * this.width;
        }
      }
    }
  }

  draw(ctx) {
    if (!this.background) {
      const gradient = ctx.createRadialGradient(this.width / 2, this.height * 0.3, 0, this.width / 2, this.height * 0.3, Math.max(this.width, this.height) * 0.8);
      gradient.addColorStop(0, '#1a0b3d');
      gradient.addColorStop(0.5, '#0b0420');
      gradient.addColorStop(1, '#03010a');
      this.background = gradient;
    }
    ctx.fillStyle = this.background;
    ctx.fillRect(0, 0, this.width, this.height);
    for (const layer of this.layers) {
      for (const star of layer.stars) {
        ctx.globalAlpha = layer.alpha * (0.75 + 0.25 * Math.sin(star.twinkle));
        ctx.fillStyle = '#cfd8ff';
        ctx.fillRect(star.x, star.y, layer.size, layer.size * (1 + this.speed * 0.6));
      }
    }
    ctx.globalAlpha = 1;
  }
}
