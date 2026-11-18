import { COLORS } from './palette.js';
import Brush, { seeded } from './brush.js';

const RESOLUTION = 2;
const PAD = 6;
const VARIANTS = 3;
const BOIL_FPS = 8;

const { paper, ink, vermilion, ochre, moss, indigo } = COLORS;

function paint(width, height, artwork) {
  const variants = Array.from({ length: VARIANTS }, (_, variant) => {
    const canvas = document.createElement('canvas');
    canvas.width = (width + PAD * 2) * RESOLUTION;
    canvas.height = (height + PAD * 2) * RESOLUTION;
    const ctx = canvas.getContext('2d');
    ctx.scale(RESOLUTION, RESOLUTION);
    ctx.translate(PAD + width / 2, PAD + height / 2);
    artwork(new Brush(ctx, seeded(variant * 7919 + width)), ctx);
    return canvas;
  });
  return { variants, width: width + PAD * 2, height: height + PAD * 2 };
}

const plane = (brush) => {
  const wing = [[0, -22], [17, 16], [0, 9], [-17, 16]];
  brush.fill(wing, vermilion, 0.92);
  brush.stroke([...wing, wing[0]], { color: ink, width: 2.2 });
  brush.stroke([[0, -20], [0, 12]], { color: ink, width: 1.4, passes: 2 });
  brush.blot(0, 0, 2.6, paper, 1);
};

const spider = (brush) => {
  for (const side of [-1, 1]) {
    for (const [reach, bend] of [[-14, -18], [-4, -6], [6, 8], [14, 18]]) {
      brush.stroke([[3 * side, reach / 4], [14 * side, bend - 4], [20 * side, bend + 6]], { color: ink, width: 1.8, passes: 2 });
    }
  }
  brush.blot(0, -6, 7, ink);
  brush.blot(0, 5, 9, ink);
  brush.blot(-2.5, -8, 1.3, paper, 1);
  brush.blot(2.5, -8, 1.3, paper, 1);
};

const koi = (brush) => {
  const body = [[0, 16], [8, 6], [7, -8], [0, -14], [-7, -8], [-8, 6]];
  brush.fill(body, indigo, 0.85);
  brush.stroke([...body, body[0]], { color: ink, width: 1.8 });
  brush.fill([[0, -12], [9, -20], [0, -16], [-9, -20]], indigo, 0.8);
  brush.blot(3, 2, 2.5, ochre, 0.9);
  brush.blot(-3, 8, 2, ochre, 0.8);
  brush.blot(-3, 11, 1.4, paper, 1);
  brush.blot(3, 11, 1.4, paper, 1);
};

const lantern = (brush) => {
  const shell = [[-18, -10], [-20, 0], [-18, 10], [18, 10], [20, 0], [18, -10]];
  brush.fill(shell, moss, 0.75);
  brush.stroke([...shell, shell[0]], { color: ink, width: 2 });
  for (const x of [-10, 0, 10]) brush.stroke([[x, -10], [x * 1.1, 0], [x, 10]], { color: ink, width: 1, passes: 1 });
  brush.fill([[-10, -14], [10, -14], [8, -10], [-8, -10]], ink);
  brush.fill([[-8, 10], [8, 10], [10, 14], [-10, 14]], ink);
  brush.blot(0, 0, 5.5, paper, 1);
  brush.blot(0, 0, 3, ink, 1);
};

const dash = (color) => (brush) => {
  brush.stroke([[0, -10], [0.5, 0], [0, 10]], { color, width: 3.4, passes: 2, jitter: 0.6 });
};

const drop = (brush) => {
  brush.blot(0, 0, 9, paper, 0.95);
  brush.blot(0, 0, 6.5, vermilion, 1);
  brush.blot(-1.5, -1.5, 1.6, paper, 0.8);
};

const enso = (color) => (brush) => brush.circle(0, 0, 27, { color, width: 3 });

const seal = (letter) => (brush, ctx) => {
  brush.blot(0, 0, 13, paper, 0.95);
  brush.circle(0, 0, 12, { color: ochre, width: 3, gap: 0.08 });
  ctx.fillStyle = ink;
  ctx.font = 'bold 15px "Iowan Old Style", Palatino, Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, 0, 1);
};

const droplet = (color) => (brush) => brush.blot(0, 0, 3, color, 0.85);

const splatter = (brush) => {
  brush.blot(0, 0, 12, ink, 0.85);
  for (let i = 0; i < 7; i++) {
    const angle = brush.rng() * Math.PI * 2;
    const reach = 14 + brush.rng() * 12;
    brush.blot(Math.cos(angle) * reach, Math.sin(angle) * reach, 1.5 + brush.rng() * 3, ink, 0.8);
  }
};

let cache = null;

export function sprites() {
  cache ??= {
    ship: paint(40, 44, plane),
    drifter: paint(44, 40, spider),
    zigzag: paint(24, 40, koi),
    shooter: paint(44, 32, lantern),
    laser: paint(6, 24, dash(ink)),
    brushLaser: paint(6, 24, dash(vermilion)),
    bullet: paint(20, 20, drop),
    shield: paint(60, 60, enso(moss)),
    spread: paint(30, 30, seal('S')),
    rapid: paint(30, 30, seal('R')),
    shieldPickup: paint(30, 30, seal('+')),
    splatter: paint(56, 56, splatter),
    dots: Object.fromEntries(Object.entries(COLORS).map(([name, color]) => [name, paint(6, 6, droplet(color))])),
  };
  return cache;
}

const boil = () => Math.floor(performance.now() / (1000 / BOIL_FPS)) % VARIANTS;

export function draw(ctx, sprite, x, y, rotation = 0, scale = 1) {
  const canvas = sprite.variants[boil()];
  const width = sprite.width * scale;
  const height = sprite.height * scale;
  if (!rotation) return ctx.drawImage(canvas, x - width / 2, y - height / 2, width, height);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.drawImage(canvas, -width / 2, -height / 2, width, height);
  ctx.restore();
}
