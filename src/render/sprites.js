import { COLORS } from './palette.js';
import Brush, { seeded } from './brush.js';

const RESOLUTION = 2;
const PAD = 6;
const VARIANTS = 3;
const BOIL_FPS = 8;

const { paper, ink, wash, vermilion, ochre, moss, indigo } = COLORS;

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
  const body = [[0, 22], [7, 14], [9, 2], [7, -10], [0, -16], [-7, -10], [-9, 2], [-7, 14]];
  brush.fill([[0, -14], [12, -26], [4, -20], [0, -24], [-4, -20], [-12, -26]], indigo, 0.85);
  brush.fill([[7, 8], [17, 14], [8, 14]], indigo, 0.8);
  brush.fill([[-7, 8], [-17, 14], [-8, 14]], indigo, 0.8);
  brush.fill(body, paper, 1);
  brush.blot(-2, 4, 5, indigo, 0.9);
  brush.blot(3, -6, 3.5, ochre, 0.9);
  brush.stroke([...body, body[0]], { color: ink, width: 2 });
  brush.blot(-4, 15, 2, ink, 1);
  brush.blot(4, 15, 2, ink, 1);
  brush.stroke([[-2, 21], [0, 22.5], [2, 21]], { color: ink, width: 1.2, passes: 1 });
};

const lanternGhost = (brush) => {
  const shell = [[-13, -16], [-17, -4], [-17, 8], [-13, 18], [13, 18], [17, 8], [17, -4], [13, -16]];
  brush.fill(shell, paper, 1);
  brush.fill(shell, moss, 0.35);
  for (const y of [-10, -3, 4, 11]) brush.stroke([[-16, y], [0, y + 1.5], [16, y]], { color: ink, width: 0.9, passes: 1, jitter: 0.6 });
  brush.stroke([...shell, shell[0]], { color: ink, width: 2.2 });
  brush.fill([[-9, -21], [9, -21], [7, -16], [-7, -16]], ink);
  brush.fill([[-7, 18], [7, 18], [9, 23], [-9, 23]], ink);
  brush.blot(0, -5, 6.5, paper, 1);
  brush.circle(0, -5, 6.5, { color: ink, width: 1.6, gap: 0 });
  brush.blot(1, -4, 3, ink, 1);
  brush.fill([[-9, 7], [9, 7], [6, 12], [-6, 12]], ink);
  brush.fill([[-2, 10], [3, 10], [4, 20], [0, 24], [-2, 18]], vermilion, 0.95);
};

const eye = (brush, radius) => {
  brush.blot(0, 0, radius, paper, 1);
  brush.blot(0, 0, radius * 0.55, vermilion, 1);
  brush.blot(0, 0, radius * 0.22, ink, 1);
};

const octopusHead = (brush) => {
  const dome = [[-34, 20], [-39, -4], [-30, -28], [0, -38], [30, -28], [39, -4], [34, 20], [0, 28]];
  brush.fill(dome, ink, 0.94);
  brush.stroke([[-26, -20], [-12, -29]], { color: wash, width: 2.4, passes: 2 });
  brush.stroke([[-30, 6], [-16, 12]], { color: wash, width: 1.6, passes: 1 });
  brush.stroke([[30, 6], [16, 12]], { color: wash, width: 1.6, passes: 1 });
  eye(brush, 14);
};

const tentacle = (brush) => {
  brush.blot(0, 0, 15, ink, 0.9);
  brush.blot(-5, 5, 3, paper, 0.75);
  brush.blot(5, 6, 2.4, paper, 0.75);
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
    zigzag: paint(36, 52, koi),
    shooter: paint(36, 48, lanternGhost),
    laser: paint(6, 24, dash(ink)),
    brushLaser: paint(6, 24, dash(vermilion)),
    bullet: paint(20, 20, drop),
    shield: paint(60, 60, enso(moss)),
    spread: paint(30, 30, seal('S')),
    rapid: paint(30, 30, seal('R')),
    shieldPickup: paint(30, 30, seal('+')),
    splatter: paint(56, 56, splatter),
    octopusHead: paint(84, 72, octopusHead),
    tentacle: paint(34, 34, tentacle),
    dots: Object.fromEntries(Object.entries(COLORS).map(([name, color]) => [name, paint(6, 6, droplet(color))])),
  };
  return cache;
}

const boil = () => Math.floor(performance.now() / (1000 / BOIL_FPS)) % VARIANTS;

export function draw(ctx, sprite, x, y, rotation = 0, scale = 1, variant = boil()) {
  const canvas = sprite.variants[variant];
  const width = sprite.width * scale;
  const height = sprite.height * scale;
  if (!rotation) return ctx.drawImage(canvas, x - width / 2, y - height / 2, width, height);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.drawImage(canvas, -width / 2, -height / 2, width, height);
  ctx.restore();
}
