import { SHIP } from '../config.js';
import { eachCollision } from '../engine/collision.js';
import { recentlyStruck } from '../entities/enemies.js';

const HIT_STOP = { kill: 0.03, shooter: 0.07 };
const SHAKE = { kill: 5, shooter: 10 };
const SHIELD = 28;
const COLORS_BY_ENEMY = { drifter: 'ink', zigzag: 'indigo', shooter: 'moss' };

export default class Skirmish {
  constructor(arena, { hurt }) {
    this.arena = arena;
    this.hurt = hurt;
  }

  collide() {
    const { lasers, enemies, ship } = this.arena;
    eachCollision(lasers, enemies, (laser, enemy) => {
      laser.active = false;
      this.arena.particles.burst(laser.x, laser.y, 'ink', 4, 120, 0.25);
      if (enemies.damage(enemy)) this.#destroy(enemy);
      return true;
    });
    this.#gather();
    if (ship.shielded) return this.#deflect();
    if (ship.vulnerable) this.#collide();
  }

  churn() {
    const { enemies, bullets, ship, vortex } = this.arena;
    for (const enemy of enemies) {
      if (vortex.swallows(enemy)) this.#swallow(enemy);
    }
    for (const bullet of bullets) {
      if (vortex.swallows(bullet)) bullet.active = false;
    }
    if (ship.vulnerable && vortex.swallows(ship)) this.hurt();
  }

  #gather() {
    const { ship, powerups, particles, events } = this.arena;
    const reach = { active: true, x: ship.x, y: ship.y, radius: SHIP.pickupRadius };
    eachCollision([reach], powerups, (_, powerup) => {
      powerup.active = false;
      ship.powerUp(powerup.type);
      particles.burst(powerup.x, powerup.y, 'ochre', 16, 160, 0.4);
      events.publish('powerup', powerup.type);
    });
  }

  #collide() {
    const { ship, enemies, bullets } = this.arena;
    eachCollision([ship], [...enemies, ...bullets], (_, threat) => {
      threat.active = false;
      this.hurt();
      return true;
    });
  }

  #deflect() {
    const { ship, bullets, enemies, particles } = this.arena;
    const shield = { active: true, x: ship.x, y: ship.y, radius: SHIELD };
    eachCollision([shield], bullets, (_, bullet) => {
      bullet.active = false;
      particles.burst(bullet.x, bullet.y, 'moss', 6, 120, 0.3);
    });
    eachCollision([shield], enemies, (_, enemy) => {
      enemy.active = false;
      this.#destroy(enemy);
    });
  }

  #destroy(enemy) {
    const { session, particles, effects, powerups, impact, events } = this.arena;
    const { x, y, type, radius } = enemy;
    const result = session.registerKill(type);
    particles.burst(x, y, COLORS_BY_ENEMY[type], 28, 260, 0.8);
    effects.stain(x, y, radius / 18);
    effects.ring(x, y, COLORS_BY_ENEMY[type], radius * 2.4);
    effects.label(x, y, `+${result.awarded}`, result.awarded > 300 ? 'vermilion' : 'ink');
    impact.jolt(HIT_STOP[type] ?? HIT_STOP.kill, SHAKE[type] ?? SHAKE.kill);
    powerups.maybeDrop(x, y, session.kills);
    events.publish('kill', { ...result, enemy });
    this.arena.celebrate(result);
  }

  #swallow(enemy) {
    const { effects, events, session } = this.arena;
    enemy.active = false;
    effects.ring(enemy.x, enemy.y, 'wash', 30);
    events.publish('swallow', enemy);
    if (!recentlyStruck(enemy)) return;
    const result = session.registerKill(enemy.type, { swallowed: true });
    effects.label(enemy.x, enemy.y, `+${result.awarded}`, 'vermilion');
    this.arena.celebrate(result);
  }
}
