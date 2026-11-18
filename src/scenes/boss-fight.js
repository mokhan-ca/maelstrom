import { eachCollision } from '../engine/collision.js';

const HIT_STOP = { phase: 0.12, defeat: 0.25 };
const SHIELD = 28;

export default class BossFight {
  constructor(arena, { summon, hurt, conquered }) {
    Object.assign(this, { arena, summon, hurt, conquered });
    this.reset();
  }

  reset() {
    this.boss = null;
    this.wreck = null;
  }

  begin({ type, tier }) {
    this.boss = this.summon(type, tier);
    this.arena.events.publish('boss', { type, tier });
  }

  update(dt, world) {
    this.boss?.update(dt, world);
    this.#crumble(dt);
  }

  collide() {
    const { boss } = this;
    const { lasers, ship } = this.arena;
    if (!boss) return;
    eachCollision(lasers, boss.parts, (laser, part) => {
      laser.active = false;
      this.#strike(boss, part, laser);
      return true;
    });
    if (this.boss !== boss) return;
    if (ship.shielded) return this.#brace(boss);
    if (!ship.vulnerable) return;
    eachCollision([ship], boss.parts, () => {
      this.hurt();
      return true;
    });
  }

  regroup() {
    this.boss?.regroup();
  }

  draw(ctx) {
    for (const boss of [this.wreck, this.boss]) boss?.draw(ctx, this.arena.calm());
  }

  #strike(boss, part, laser) {
    const wound = part.weak && boss.damage();
    if (!wound) return this.#glance(boss, part, laser);
    this.arena.particles.burst(laser.x, laser.y, 'vermilion', 5, 140, 0.3);
    this.arena.events.publish('boss-hit', true);
    if (wound.dead) return this.#slay(boss, part);
    if (wound.phaseChanged) this.#shudder(boss, part);
  }

  #glance(boss, part, laser) {
    boss.glance(part);
    this.arena.particles.burst(laser.x, laser.y, 'wash', 3, 90, 0.2);
    this.arena.events.publish('boss-hit', false);
  }

  #shudder(boss, { x, y }) {
    const { impact, effects, powerups, ship, calm } = this.arena;
    impact.jolt(HIT_STOP.phase);
    effects.ring(x, y, 'vermilion', 90);
    effects.stain(x, y, 1.4);
    powerups.drop(ship.x, y + 80);
    if (!calm()) boss.startle();
  }

  #brace(boss) {
    const { ship } = this.arena;
    const shield = { active: true, x: ship.x, y: ship.y, radius: SHIELD };
    eachCollision([shield], boss.parts, (_, part) => {
      const dx = shield.x - part.x;
      const dy = shield.y - part.y;
      const distance = Math.hypot(dx, dy) || 1;
      const push = (shield.radius + part.radius - distance) / distance;
      ship.nudge({ x: dx * push, y: dy * push });
    });
  }

  #slay(boss, { x, y }) {
    const { session, impact, powerups, effects, events } = this.arena;
    const result = session.defeatBoss();
    for (const part of boss.parts) part.active = false;
    this.boss = null;
    this.wreck = boss;
    impact.jolt(HIT_STOP.defeat, 20);
    powerups.drop(x, y + 60);
    effects.label(x, y + 70, `+${result.awarded.toLocaleString()}`, 'vermilion', 34);
    events.publish('boss-down', boss);
    this.arena.celebrate(result);
    this.conquered();
  }

  #crumble(dt) {
    if (!this.wreck) return;
    for (const part of this.wreck.crumble(dt)) this.#splatter(part, this.wreck.parts.length);
    if (!this.wreck.parts.length) this.wreck = null;
  }

  #splatter(part, remaining) {
    const { particles, effects } = this.arena;
    particles.burst(part.x, part.y, 'ink', 10, 200, 0.6);
    if (remaining % 3 === 0) effects.stain(part.x, part.y, part.radius / 18);
    if (part.weak) effects.ring(part.x, part.y, 'ink', 120);
  }
}
