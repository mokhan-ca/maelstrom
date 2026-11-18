import { COLORS } from './palette.js';

const RESOLUTION = 2;
const GLOW = 10;

function makeSprite(width, height, glowColor, draw) {
  const pad = GLOW * 2;
  const canvas = document.createElement('canvas');
  canvas.width = (width + pad * 2) * RESOLUTION;
  canvas.height = (height + pad * 2) * RESOLUTION;
  const ctx = canvas.getContext('2d');
  ctx.scale(RESOLUTION, RESOLUTION);
  ctx.translate(pad + width / 2, pad + height / 2);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.shadowColor = glowColor;
  for (const blur of [GLOW * 1.6, GLOW * 0.6]) {
    ctx.shadowBlur = blur;
    ctx.save();
    draw(ctx);
    ctx.restore();
  }
  ctx.shadowBlur = 0;
  draw(ctx);
  return { canvas, width: width + pad * 2, height: height + pad * 2 };
}

function path(ctx, points) {
  ctx.beginPath();
  points.forEach(([x, y], index) => (index ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}

function ship(ctx) {
  path(ctx, [[0, -22], [7, -6], [18, 10], [18, 18], [6, 12], [0, 16], [-6, 12], [-18, 18], [-18, 10], [-7, -6]]);
  ctx.fillStyle = 'rgba(61,245,255,0.18)';
  ctx.fill();
  ctx.strokeStyle = COLORS.cyan;
  ctx.lineWidth = 2.2;
  ctx.stroke();
  path(ctx, [[0, -12], [4, -2], [0, 2], [-4, -2]]);
  ctx.fillStyle = COLORS.white;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.magenta;
  ctx.fillRect(-14, 14, 5, 4);
  ctx.fillRect(9, 14, 5, 4);
}

function drifter(ctx) {
  ctx.strokeStyle = COLORS.magenta;
  ctx.lineWidth = 2;
  for (const side of [-1, 1]) {
    for (const [a, b] of [[-8, -16], [0, -6], [8, 6]]) {
      ctx.beginPath();
      ctx.moveTo(6 * side, a / 2);
      ctx.lineTo(16 * side, b);
      ctx.lineTo(20 * side, b + 10);
      ctx.stroke();
    }
  }
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,61,242,0.3)';
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COLORS.white;
  ctx.fillRect(-4, 2, 2.5, 2.5);
  ctx.fillRect(1.5, 2, 2.5, 2.5);
}

function zigzag(ctx) {
  path(ctx, [[0, 16], [14, 0], [0, -16], [-14, 0]]);
  ctx.fillStyle = 'rgba(255,210,61,0.2)';
  ctx.fill();
  ctx.strokeStyle = COLORS.yellow;
  ctx.lineWidth = 2.2;
  ctx.stroke();
  path(ctx, [[0, 7], [6, 0], [0, -7], [-6, 0]]);
  ctx.fillStyle = COLORS.orange;
  ctx.fill();
}

function shooter(ctx) {
  ctx.beginPath();
  ctx.ellipse(0, 2, 22, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(93,255,122,0.2)';
  ctx.fill();
  ctx.strokeStyle = COLORS.green;
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -2, 9, Math.PI, 0);
  ctx.stroke();
  for (const x of [-12, 0, 12]) {
    ctx.beginPath();
    ctx.arc(x, 3, 2, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.white;
    ctx.fill();
  }
}

function laser(ctx) {
  ctx.fillStyle = COLORS.cyan;
  ctx.fillRect(-2.5, -11, 5, 22);
  ctx.fillStyle = COLORS.white;
  ctx.fillRect(-1, -9, 2, 18);
}

function bullet(ctx) {
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.pink;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.white;
  ctx.fill();
}

function powerup(color, letter) {
  return (ctx) => {
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = COLORS.white;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, 0, 1);
  };
}

function shield(ctx) {
  ctx.beginPath();
  ctx.arc(0, 0, 28, 0, Math.PI * 2);
  ctx.strokeStyle = COLORS.green;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function dot(color) {
  return (ctx) => {
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  };
}

let cache = null;

export function sprites() {
  if (cache) return cache;
  cache = {
    ship: makeSprite(40, 44, COLORS.cyan, ship),
    drifter: makeSprite(44, 40, COLORS.magenta, drifter),
    zigzag: makeSprite(32, 36, COLORS.yellow, zigzag),
    shooter: makeSprite(48, 28, COLORS.green, shooter),
    laser: makeSprite(6, 24, COLORS.cyan, laser),
    bullet: makeSprite(16, 16, COLORS.pink, bullet),
    shield: makeSprite(60, 60, COLORS.green, shield),
    spread: makeSprite(30, 30, COLORS.yellow, powerup(COLORS.yellow, 'S')),
    rapid: makeSprite(30, 30, COLORS.cyan, powerup(COLORS.cyan, 'R')),
    shieldPickup: makeSprite(30, 30, COLORS.green, powerup(COLORS.green, '+')),
    dots: Object.fromEntries(Object.entries(COLORS).map(([name, color]) => [name, makeSprite(6, 6, color, dot(color))])),
  };
  return cache;
}

export function draw(ctx, sprite, x, y, rotation = 0) {
  if (rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.drawImage(sprite.canvas, -sprite.width / 2, -sprite.height / 2, sprite.width, sprite.height);
    ctx.restore();
  } else {
    ctx.drawImage(sprite.canvas, x - sprite.width / 2, y - sprite.height / 2, sprite.width, sprite.height);
  }
}
