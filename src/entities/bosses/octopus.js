import { BOSSES, VORTEX, WORLD } from '../../config.js';
import { COLORS } from '../../render/palette.js';

const OCTOPUS = BOSSES.octopus;
const { head: HEAD, arm: ARM, telegraph: TELEGRAPH, sweep: SWEEP, recover: RECOVER } = OCTOPUS;
const ROOTS = [-26, -9, 9, 26];
const SINGLES = [[1], [2], [0], [3]];
const PAIRS = [[1, 2], [0, 3]];
const RECOIL = 18;
const SHOULDER = 24;

const lerp = (from, to, t) => from + (to - from) * t;
const ease = (t) => 1 - (1 - t) ** 3;

const blend = (from, to, t) => ({
  angle: lerp(from.angle, to.angle, t),
  length: lerp(from.length, to.length, t),
  curl: lerp(from.curl, to.curl, t),
});

const resting = (arm, age) => ({ angle: arm.side * (arm.lift + Math.sin(age * 1.6 + arm.sway) * 0.12), length: ARM.rest, curl: 0.6 });

const coiled = (arm) => ({ angle: arm.side * 1.9, length: ARM.coil, curl: 1.4 });

const swept = (arm, t) => ({
  angle: arm.side * (1.9 - 2.8 * t),
  length: lerp(ARM.coil, ARM.reach, Math.sin(Math.PI * t)),
  curl: lerp(1.4, 0.2, Math.min(1, t * 3)),
});

const pose = (arm, age) => {
  const rest = resting(arm, age);
  if (!arm.move) return rest;
  const { age: moving } = arm.move;
  if (moving < TELEGRAPH) return blend(rest, coiled(arm), ease(moving / TELEGRAPH));
  if (moving < TELEGRAPH + SWEEP) return swept(arm, (moving - TELEGRAPH) / SWEEP);
  return blend(swept(arm, 1), rest, ease((moving - TELEGRAPH - SWEEP) / RECOVER));
};

const coiling = ({ move }) => (move && move.age < TELEGRAPH ? move.age / TELEGRAPH : 0);

const lashed = ({ move }) => move && !move.lashed && move.age >= TELEGRAPH + SWEEP;

const fan = ({ x, y }, { ship, bullets }) => {
  const { drops, speed, spread } = OCTOPUS.flick;
  const aim = Math.atan2(ship.y - y, ship.x - x);
  for (let i = 0; i < drops; i++) {
    const angle = aim + (i - (drops - 1) / 2) * spread;
    bullets.fire(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed);
  }
};

const tip = ({ segments }) => segments[segments.length - 1];

const segment = (index) => {
  const radius = 18 - index * 0.6;
  return { active: true, weak: false, sprite: 'tentacle', radius, scale: radius / 16, rotation: 0, x: 0, y: 0 };
};

export default class Octopus {
  enter(boss) {
    this.head = { active: true, weak: true, sprite: 'octopusHead', radius: HEAD.radius, scale: 1, rotation: 0, x: WORLD.width / 2, y: -90 };
    this.arms = ROOTS.map((offset, index) => ({
      offset,
      side: Math.sign(offset),
      lift: Math.abs(offset) > 15 ? 2 : 1.7,
      sway: index,
      move: null,
      segments: Array.from({ length: ARM.segments }, (_, i) => segment(i)),
    }));
    this.turn = 0;
    this.regroup(boss);
    boss.parts = [this.head, ...this.arms.flatMap((arm) => arm.segments)];
    this.#lay(boss);
  }

  regroup(boss) {
    this.cooldown = OCTOPUS.gap / boss.pace;
    for (const arm of this.arms) arm.move = null;
  }

  update(boss, dt, world) {
    this.#hover(boss);
    for (const arm of this.arms) this.#swing(arm, dt);
    this.#lay(boss);
    for (const arm of this.arms.filter(lashed)) this.#lash(arm, boss, world);
    if (this.#idle) this.cooldown -= dt;
    if (this.cooldown <= 0 && boss.ready(world)) this.#attack(boss, world);
  }

  underlay(boss, ctx) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const arm of this.arms) {
      const progress = coiling(arm);
      if (progress) this.#trace(ctx, arm, COLORS.vermilion, 34 + 12 * progress, 0.25 + 0.6 * progress);
      this.#trace(ctx, arm, COLORS.ink, 14, 0.85);
    }
    ctx.globalAlpha = 1;
  }

  #trace(ctx, arm, color, width, alpha) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(this.head.x + arm.offset, this.head.y + SHOULDER);
    for (const { x, y } of arm.segments) ctx.lineTo(x, y);
    ctx.stroke();
  }

  get #idle() {
    return this.arms.every((arm) => !arm.move);
  }

  #hover(boss) {
    const settled = ease(Math.min(1, boss.age / BOSSES.entrance));
    this.head.x = WORLD.width / 2 + Math.sin(boss.age * 0.45) * HEAD.roam;
    this.head.y = lerp(-90, HEAD.y + Math.sin(boss.age * 0.9) * HEAD.bob, settled) - RECOIL * boss.startled;
  }

  #swing(arm, dt) {
    if (!arm.move) return;
    arm.move.age += dt;
    if (arm.move.age >= TELEGRAPH + SWEEP + RECOVER) arm.move = null;
  }

  #lay(boss) {
    for (const arm of this.arms) {
      const { angle, length, curl } = pose(arm, boss.age);
      let x = this.head.x + arm.offset;
      let y = this.head.y + SHOULDER;
      for (const [index, part] of arm.segments.entries()) {
        const heading = angle + arm.side * curl * (index / ARM.segments);
        x += Math.sin(heading) * (length / ARM.segments);
        y += Math.cos(heading) * (length / ARM.segments);
        Object.assign(part, { x, y, rotation: -heading });
      }
    }
  }

  #lash(arm, boss, world) {
    arm.move.lashed = true;
    if (boss.ready(world)) fan(tip(arm), world);
  }

  #attack(boss, world) {
    const groups = boss.phase === 3 ? PAIRS : SINGLES;
    for (const index of groups[this.turn++ % groups.length]) this.arms[index].move = { age: 0, lashed: false };
    if (boss.phase >= 2 && this.#clearOf(world.vortex)) this.#ring(world.bullets);
    this.cooldown = OCTOPUS.gap / boss.pace;
  }

  #clearOf(vortex) {
    return !vortex.active || Math.hypot(this.head.x - vortex.x, this.head.y - vortex.y) > VORTEX.reach;
  }

  #ring(bullets) {
    const { drops, speed } = OCTOPUS.ring;
    const { x, y } = this.head;
    const start = this.turn * 0.9;
    for (let i = 2; i < drops; i++) {
      const angle = start + (i / drops) * Math.PI * 2;
      bullets.fire(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed);
    }
  }
}
