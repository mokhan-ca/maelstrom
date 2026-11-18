import { BOSSES } from '../config.js';
import { sprites, draw } from '../render/sprites.js';

const PHASES = [2 / 3, 1 / 3];
const RECOIL = 0.2;
const CRUMBLE_EVERY = 0.06;

export default class Boss {
  constructor(type, tier, behaviour) {
    const scaling = BOSSES.tier;
    this.type = type;
    this.tier = tier;
    this.behaviour = behaviour;
    this.maxHp = Math.round(BOSSES[type].hp * Math.min(scaling.maxHp, 1 + scaling.hp * tier));
    this.hp = this.maxHp;
    this.pace = Math.min(scaling.maxPace, 1 + scaling.pace * tier);
    this.age = 0;
    this.flash = 0;
    this.recoil = 0;
    this.rubble = 0;
    this.parts = [];
    behaviour.enter(this);
  }

  get entering() {
    return this.age < BOSSES.entrance;
  }

  get dead() {
    return this.hp === 0;
  }

  get fraction() {
    return this.hp / this.maxHp;
  }

  get phase() {
    const opening = this.tier > 0 ? 2 : 1;
    const reached = 1 + PHASES.filter((threshold) => this.fraction <= threshold).length;
    return Math.max(opening, reached);
  }

  get startled() {
    return this.recoil / RECOIL;
  }

  ready({ ship }) {
    return !this.entering && !this.dead && ship.active;
  }

  update(dt, world) {
    this.age += dt;
    this.flash = Math.max(0, this.flash - dt);
    this.recoil = Math.max(0, this.recoil - dt);
    this.behaviour.update(this, dt, world);
  }

  damage() {
    if (this.entering || this.dead) return null;
    const before = this.phase;
    this.hp--;
    this.flash = 0.06;
    return { dead: this.dead, phaseChanged: this.phase > before };
  }

  startle() {
    this.recoil = RECOIL;
  }

  regroup() {
    this.behaviour.regroup(this);
  }

  crumble(dt) {
    this.flash = 0;
    this.rubble += dt;
    const fallen = [];
    while (this.rubble >= CRUMBLE_EVERY && this.parts.length) {
      this.rubble -= CRUMBLE_EVERY;
      fallen.push(this.parts.pop());
    }
    return fallen;
  }

  draw(ctx, still) {
    if (!this.dead) this.behaviour.underlay(this, ctx);
    ctx.globalAlpha = this.#ink;
    const variant = still ? 0 : undefined;
    for (const part of [...this.parts].reverse()) {
      draw(ctx, sprites()[part.sprite], part.x, part.y, part.rotation, part.scale, variant);
    }
    ctx.globalAlpha = 1;
  }

  get #ink() {
    const wet = 0.3 + 0.7 * Math.min(1, this.age / BOSSES.entrance);
    return this.flash ? wet * 0.6 : wet;
  }
}
