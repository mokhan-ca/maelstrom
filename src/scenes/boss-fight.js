import { eachCollision } from '../engine/collision.js';

const HIT_STOP = { phase: 0.12, defeat: 0.25 };
const SHIELD = 28;

export default class BossFight {
  constructor({ summon, calm, session, events, ship, lasers, particles, effects, powerups, hurt, jolt, conquered }) {
    Object.assign(this, { summon, calm, session, events, ship, lasers, particles, effects, powerups, hurt, jolt, conquered });
    this.reset();
  }

  reset() {
    this.boss = null;
    this.wreck = null;
  }

  begin({ type, tier }) {
    this.boss = this.summon(type, tier);
    this.events.publish('boss', { type, tier });
  }

  update(dt, world) {
    this.boss?.update(dt, world);
    this.#crumble(dt);
  }

  collide() {
    const { boss } = this;
    if (!boss) return;
    eachCollision(this.lasers, boss.parts, (laser, part) => {
      laser.active = false;
      this.#strike(boss, part, laser);
      return true;
    });
    if (this.boss !== boss) return;
    if (this.ship.shielded) return this.#brace(boss);
    if (!this.ship.vulnerable) return;
    eachCollision([this.ship], boss.parts, () => {
      this.hurt();
      return true;
    });
  }

  regroup() {
    this.boss?.regroup();
  }

  draw(ctx) {
    for (const boss of [this.wreck, this.boss]) boss?.draw(ctx, this.calm());
  }

  #strike(boss, part, laser) {
    const wound = part.weak && boss.damage();
    if (!wound) return this.#glance(boss, part, laser);
    this.particles.burst(laser.x, laser.y, 'vermilion', 5, 140, 0.3);
    this.events.publish('boss-hit', true);
    if (wound.dead) return this.#slay(boss, part);
    if (wound.phaseChanged) this.#shudder(boss, part);
  }

  #glance(boss, part, laser) {
    boss.glance(part);
    this.particles.burst(laser.x, laser.y, 'wash', 3, 90, 0.2);
    this.events.publish('boss-hit', false);
  }

  #shudder(boss, { x, y }) {
    this.jolt(HIT_STOP.phase, 0);
    this.effects.ring(x, y, 'vermilion', 90);
    this.effects.stain(x, y, 1.4);
    this.powerups.drop(this.ship.x, y + 80);
    if (!this.calm()) boss.startle();
  }

  #brace(boss) {
    const shield = { active: true, x: this.ship.x, y: this.ship.y, radius: SHIELD };
    eachCollision([shield], boss.parts, (_, part) => {
      const dx = shield.x - part.x;
      const dy = shield.y - part.y;
      const distance = Math.hypot(dx, dy) || 1;
      const push = (shield.radius + part.radius - distance) / distance;
      this.ship.nudge({ x: dx * push, y: dy * push });
    });
  }

  #slay(boss, { x, y }) {
    const result = this.session.defeatBoss();
    for (const part of boss.parts) part.active = false;
    this.boss = null;
    this.wreck = boss;
    this.jolt(HIT_STOP.defeat, 20);
    this.powerups.drop(x, y + 60);
    this.effects.label(x, y + 70, `+${result.awarded.toLocaleString()}`, 'vermilion', 34);
    this.events.publish('boss-down', boss);
    this.conquered(result);
  }

  #crumble(dt) {
    if (!this.wreck) return;
    for (const part of this.wreck.crumble(dt)) this.#splatter(part, this.wreck.parts.length);
    if (!this.wreck.parts.length) this.wreck = null;
  }

  #splatter(part, remaining) {
    this.particles.burst(part.x, part.y, 'ink', 10, 200, 0.6);
    if (remaining % 3 === 0) this.effects.stain(part.x, part.y, part.radius / 18);
    if (part.weak) this.effects.ring(part.x, part.y, 'ink', 120);
  }
}
