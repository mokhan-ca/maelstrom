import { BOSSES, WORLD } from '../../config.js';
import { COLORS } from '../../render/palette.js';
import { lerp, ease, clamp, fan } from './motion.js';

const DRAGON = BOSSES.dragon;
const { body: BODY, orbit: ORBIT, fence: FENCE, telegraph: TELEGRAPH } = DRAGON;
const RECOIL = 18;
const LAIR = { x: WORLD.width / 2, y: -120 };

const fenced = ({ x, y }) => ({
  x: clamp(x, FENCE.side, WORLD.width - FENCE.side),
  y: clamp(y, FENCE.top, FENCE.bottom),
});

const scale = (index) => {
  const tail = index === BODY.segments - 1;
  return {
    active: true,
    weak: false,
    sprite: tail ? 'dragonTail' : 'dragonScale',
    radius: tail ? BODY.tail : BODY.radius,
    scale: 1,
    rotation: 0,
    x: LAIR.x,
    y: LAIR.y - (index + 1) * BODY.spacing,
  };
};

const facing = (from, to) => -Math.atan2(to.x - from.x, to.y - from.y);

export default class Dragon {
  enter(boss) {
    this.head = { active: true, weak: true, sprite: 'dragonHead', radius: DRAGON.head.radius, scale: 1, rotation: 0, ...LAIR };
    this.body = Array.from({ length: BODY.segments }, (_, index) => scale(index));
    this.angle = -Math.PI / 2;
    this.orbit = ORBIT.radius;
    this.regroup(boss);
    boss.parts = [this.head, ...this.body];
  }

  regroup(boss) {
    this.cooldown = DRAGON.gap / boss.pace;
    this.breath = null;
  }

  update(boss, dt, world) {
    this.#coil(boss, dt, world.vortex);
    this.#follow();
    this.#breathe(boss, dt, world);
  }

  underlay(boss, ctx) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(this.head.x, this.head.y);
    for (const { x, y } of this.body) ctx.lineTo(x, y);
    ctx.stroke();
    if (this.breath !== null) this.#glow(ctx, this.breath / TELEGRAPH);
    ctx.globalAlpha = 1;
  }

  #coil(boss, dt, vortex) {
    const goal = boss.phase === 3 ? ORBIT.tight : ORBIT.radius;
    this.orbit = lerp(this.orbit, goal, Math.min(1, dt * 2));
    this.angle += (DRAGON.speed / this.orbit) * dt;
    const target = fenced({ x: vortex.x + Math.cos(this.angle) * this.orbit, y: vortex.y + Math.sin(this.angle) * this.orbit });
    const settled = ease(Math.min(1, boss.age / BOSSES.entrance));
    const next = { x: lerp(LAIR.x, target.x, settled), y: lerp(LAIR.y, target.y, settled) - RECOIL * boss.startled };
    if (Math.hypot(next.x - this.head.x, next.y - this.head.y) > 0.01) this.head.rotation = facing(this.head, next);
    Object.assign(this.head, next);
  }

  #follow() {
    let leader = this.head;
    for (const part of this.body) {
      const dx = leader.x - part.x;
      const dy = leader.y - part.y;
      const distance = Math.hypot(dx, dy);
      if (distance > BODY.spacing) {
        const pull = (distance - BODY.spacing) / distance;
        part.x += dx * pull;
        part.y += dy * pull;
      }
      part.rotation = facing(part, leader) + Math.PI;
      leader = part;
    }
  }

  #breathe(boss, dt, world) {
    if (this.breath === null) return this.#wait(boss, dt, world);
    this.breath += dt;
    if (this.breath < TELEGRAPH) return;
    this.breath = null;
    this.cooldown = DRAGON.gap / boss.pace;
    if (boss.ready(world)) fan(this.head, world, { ...DRAGON.breath, drops: DRAGON.breath.drops[boss.phase - 1] });
  }

  #wait(boss, dt, world) {
    this.cooldown -= dt;
    if (this.cooldown <= 0 && boss.ready(world)) this.breath = 0;
  }

  #glow(ctx, progress) {
    ctx.globalAlpha = 0.3 + 0.6 * progress;
    ctx.strokeStyle = COLORS.vermilion;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(this.head.x, this.head.y, DRAGON.head.radius + 14 * progress, 0, Math.PI * 2);
    ctx.stroke();
  }
}
