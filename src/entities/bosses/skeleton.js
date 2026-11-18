import { BOSSES, WORLD } from '../../config.js';
import { COLORS } from '../../render/palette.js';
import { part } from '../boss.js';
import { lerp, ease, clamp, clearOf, fan } from './motion.js';

const SKELETON = BOSSES.skeleton;
const { skull: SKULL, hand: HAND, telegraph: TELEGRAPH, slam: SLAM, hold: HOLD, recover: RECOVER } = SKELETON;
const LANDED = TELEGRAPH + SLAM;
const RECOIL = 18;
const SETTLE_RATE = 10;

const raised = (move) => ({ x: move.x, y: HAND.raised });

const pose = (hand, rest) => {
  const { move } = hand;
  if (move.age < TELEGRAPH) return blend(rest, raised(move), ease(move.age / TELEGRAPH));
  if (move.age < LANDED) return { x: move.x, y: lerp(HAND.raised, HAND.floor, ((move.age - TELEGRAPH) / SLAM) ** 2) };
  if (move.age < LANDED + HOLD) return { x: move.x, y: HAND.floor };
  return blend({ x: move.x, y: HAND.floor }, rest, ease((move.age - LANDED - HOLD) / RECOVER));
};

const blend = (from, to, t) => ({ x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t) });

const shadowed = ({ move }) => move && move.age < LANDED;

const column = (x) => clamp(x, HAND.column, WORLD.width - HAND.column);

const neighbour = (x) => x + (x < WORLD.width / 2 ? HAND.apart : -HAND.apart);

const rain = (x, bullets) => {
  const { drops, speed } = SKELETON.shards;
  for (let i = 0; i < drops; i++) {
    bullets.fire(x + (i - (drops - 1) / 2) * 8, HAND.floor + 20, 0, speed * (0.8 + i * 0.1));
  }
};

export default class Skeleton {
  enter(boss) {
    this.skull = part({ sprite: 'skull', radius: SKULL.radius, weak: true, x: WORLD.width / 2, y: -90 });
    this.hands = [-1, 1].map((side) => ({
      side,
      move: null,
      flinch: 0,
      part: part({ sprite: 'hand', radius: HAND.radius, x: WORLD.width / 2 + side * HAND.reach, y: -90 }),
    }));
    this.turn = 0;
    this.regroup(boss);
    boss.parts = [this.skull, ...this.hands.map((hand) => hand.part)];
  }

  regroup(boss) {
    this.cooldown = SKELETON.gap / boss.pace;
    for (const hand of this.hands) hand.move = null;
  }

  glance(boss, part) {
    const hand = this.hands.find((candidate) => candidate.part === part);
    if (!hand || !shadowed(hand)) return;
    hand.move.hits++;
    if (hand.move.hits < SKELETON.grip) return;
    hand.flinch = SKELETON.flinch;
    hand.move = null;
  }

  update(boss, dt, world) {
    this.#hover(boss);
    for (const hand of this.hands) this.#tend(hand, boss, dt, world);
    if (this.#idle && boss.poised) this.cooldown -= dt;
    if (this.cooldown <= 0 && boss.ready(world)) this.#attack(boss, world);
  }

  underlay(boss, ctx) {
    for (const hand of this.hands.filter(shadowed)) this.#shadow(ctx, hand.move);
    ctx.lineCap = 'round';
    for (const { part } of this.hands) {
      this.#bone(ctx, part, COLORS.ink, 14);
      this.#bone(ctx, part, COLORS.paper, 8);
    }
    ctx.globalAlpha = 1;
  }

  get #idle() {
    return this.hands.every((hand) => !hand.move);
  }

  #hover(boss) {
    const settled = ease(Math.min(1, boss.age / BOSSES.entrance));
    this.skull.x = WORLD.width / 2 + Math.sin(boss.age * 0.35) * SKULL.roam;
    this.skull.y = lerp(-90, SKULL.y + Math.sin(boss.age * 0.8) * SKULL.bob, settled) - RECOIL * boss.startled;
  }

  #rest(hand, boss) {
    return {
      x: column(this.skull.x + hand.side * HAND.reach),
      y: lerp(-60, HAND.rest + Math.sin(boss.age * 1.3 + hand.side) * 10, ease(Math.min(1, boss.age / BOSSES.entrance))) - 70 * (hand.flinch / SKELETON.flinch),
    };
  }

  #tend(hand, boss, dt, world) {
    hand.flinch = Math.max(0, hand.flinch - dt);
    const rest = this.#rest(hand, boss);
    if (!hand.move) return this.#settle(hand.part, rest, dt);
    hand.move.age += dt;
    if (!hand.move.landed && hand.move.age >= LANDED) this.#land(hand.move, boss, world);
    Object.assign(hand.part, pose(hand, rest));
    if (hand.move.age >= LANDED + HOLD + RECOVER) hand.move = null;
  }

  #settle(part, { x, y }, dt) {
    const pull = Math.min(1, dt * SETTLE_RATE);
    part.x = lerp(part.x, x, pull);
    part.y = lerp(part.y, y, pull);
  }

  #land(move, boss, world) {
    move.landed = true;
    if (boss.ready(world)) rain(move.x, world.bullets);
  }

  #attack(boss, world) {
    const target = column(world.ship.x);
    if (boss.phase === 3) this.#slamBoth(target);
    else this.#slam(this.hands[this.turn++ % 2], target);
    if (boss.phase >= 2 && clearOf(this.skull, world.vortex)) fan({ x: this.skull.x, y: this.skull.y + 30 }, world, SKELETON.jaw);
    this.cooldown = SKELETON.gap / boss.pace;
  }

  #slamBoth(target) {
    const [left, right] = [target, neighbour(target)].sort((a, b) => a - b);
    this.#slam(this.hands[0], left);
    this.#slam(this.hands[1], right);
  }

  #slam(hand, x) {
    hand.move = { age: 0, x, landed: false, hits: 0 };
  }

  #shadow(ctx, { age, x }) {
    const progress = Math.min(1, age / TELEGRAPH);
    const width = HAND.column * (0.4 + 0.6 * progress);
    ctx.globalAlpha = 0.18 + 0.32 * progress;
    ctx.fillStyle = COLORS.wash;
    ctx.fillRect(x - width / 2, 0, width, WORLD.height);
    if (age < TELEGRAPH - SKELETON.warn) return;
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = COLORS.vermilion;
    for (const edge of [x - width / 2, x + width / 2 - 3]) ctx.fillRect(edge, 0, 3, WORLD.height);
  }

  #bone(ctx, part, color, width) {
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(this.skull.x, this.skull.y + 10);
    ctx.lineTo(part.x, part.y - 10);
    ctx.stroke();
  }
}
