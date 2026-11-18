import { BULLET, WORLD, WAVES, SHIP, VORTEX } from '../config.js';
import { eachCollision } from '../engine/collision.js';
import { sprites } from '../render/sprites.js';
import Ship from '../entities/ship.js';
import Enemies from '../entities/enemies.js';
import Projectiles from '../entities/projectiles.js';
import Powerups from '../entities/powerups.js';
import Particles from '../entities/particles.js';
import Effects from '../entities/effects.js';
import Vortex from '../entities/vortex.js';
import { recentlyStruck } from '../entities/enemies.js';

const HIT_STOP = { kill: 0.03, shooter: 0.07, hurt: 0.12 };
const DEATH_SLOWDOWN = 0.35;

const COLORS_BY_ENEMY = { drifter: 'ink', zigzag: 'indigo', shooter: 'moss' };

export default class Play {
  constructor({ session, events, rng = Math.random, calm = () => false, met = [] }) {
    this.met = new Set(met);
    this.calm = calm;
    this.session = session;
    this.events = events;
    this.rng = rng;
    this.ship = new Ship();
    this.enemies = new Enemies(rng);
    this.lasers = new Projectiles(() => (this.ship.brushed ? sprites().brushLaser : sprites().laser), 4, 60);
    this.bullets = new Projectiles(() => sprites().bullet, BULLET.radius, 120);
    this.powerups = new Powerups(rng);
    this.particles = new Particles(rng);
    this.effects = new Effects(rng);
    this.vortex = new Vortex();
    this.freeze = 0;
    this.shake = 0;
    this.flash = 0;
    this.ended = 0;
  }

  start() {
    this.session.reset();
    for (const group of [this.enemies, this.lasers, this.bullets, this.particles, this.effects]) group.clear();
    this.powerups.reset();
    this.ship.reset();
    this.vortex.reset();
    this.spawnIn = 1;
    this.ended = 0;
    this.events.publish('start', this.session);
  }

  get finished() {
    return this.ended > 1.6;
  }

  update(dt, input) {
    if (this.#frozen(dt)) return;
    if (this.session.over) {
      this.ended += dt;
      dt *= DEATH_SLOWDOWN;
    } else {
      this.#play(dt, input);
    }

    this.vortex.update(dt);
    this.enemies.update(dt, this.#world);
    this.bullets.drift(this.vortex, dt, VORTEX.weights.bullet);
    for (const group of [this.lasers, this.bullets, this.powerups, this.particles, this.effects]) group.update(dt);
    if (!this.session.over) this.#collide();
    if (!this.session.over) this.#churn();
    this.shake = Math.max(0, this.shake - dt * 30);
    this.flash = Math.max(0, this.flash - dt * 2.5);
  }

  draw(ctx) {
    this.effects.drawStains(ctx);
    this.vortex.draw(ctx);
    this.particles.draw(ctx);
    this.powerups.draw(ctx);
    this.lasers.draw(ctx);
    this.enemies.draw(ctx);
    if (this.ship.active) this.ship.draw(ctx);
    this.bullets.draw(ctx);
    this.effects.draw(ctx);

    if (this.flash && !this.calm()) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = `rgba(194, 59, 34, ${this.flash * 0.35})`;
      ctx.fillRect(0, 0, WORLD.width, WORLD.height);
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  get shakeOffset() {
    const magnitude = this.shake;
    return { x: (this.rng() - 0.5) * magnitude, y: (this.rng() - 0.5) * magnitude };
  }

  #play(dt, input) {
    if (this.session.tick(dt)) this.#nextWave();
    for (const power of this.ship.update(dt, input)) this.events.publish('expire', power);
    this.ship.nudge(this.vortex.pull(this.ship, dt, VORTEX.weights.ship));
    if (input.firing && this.ship.canFire) this.#fire();
    this.#trail();
    this.#spawn(dt);
  }

  get #world() {
    return {
      ship: this.ship,
      bullets: this.bullets,
      vortex: this.vortex,
      speed: this.session.speedMultiplier,
      escaped: () => this.#escaped(),
      charging: () => this.events.publish('charge'),
    };
  }

  #nextWave() {
    const { wave } = this.session;
    const stirring = !this.vortex.active;
    this.vortex.awaken(wave);
    this.events.publish('wave', wave);
    if (stirring && this.vortex.active) this.events.publish('maelstrom');
  }

  #churn() {
    for (const enemy of this.enemies) {
      if (this.vortex.swallows(enemy)) this.#swallow(enemy);
    }
    for (const bullet of this.bullets) {
      if (this.vortex.swallows(bullet)) bullet.active = false;
    }
    if (this.ship.vulnerable && this.vortex.swallows(this.ship)) this.#hurt();
  }

  #swallow(enemy) {
    enemy.active = false;
    this.effects.ring(enemy.x, enemy.y, 'wash', 30);
    this.events.publish('swallow', enemy);
    if (!recentlyStruck(enemy)) return;
    const result = this.session.registerKill(enemy.type, { swallowed: true });
    this.effects.label(enemy.x, enemy.y, `+${result.awarded}`, 'vermilion');
    this.#celebrate(result);
  }

  #celebrate({ extraLife, comboUp }) {
    if (extraLife) this.events.publish('extra-life', this.session.lives);
    if (comboUp) this.events.publish('combo', this.session.multiplier);
  }

  #frozen(dt) {
    if (this.freeze <= 0) return false;
    this.freeze -= dt;
    return true;
  }

  #fire() {
    this.ship.fire(this.lasers);
    this.particles.emit(this.ship.x, this.ship.y - 24, 0, -40, 'ink', 0.06, 1.6);
    this.events.publish('laser');
  }

  #spawn(dt) {
    this.spawnIn -= dt;
    if (this.spawnIn > 0 || this.enemies.count >= WAVES.maxEnemies) return;
    this.spawnIn = this.session.spawnInterval * (0.7 + this.rng() * 0.6);
    const type = this.session.pickEnemyType(this.rng);
    this.enemies.spawn(type, this.session.speedMultiplier);
    this.#meet(type);
  }

  #meet(type) {
    if (this.met.has(type)) return;
    this.met.add(type);
    this.events.publish('meet', type);
  }

  #trail() {
    const { x, y } = this.ship;
    for (const side of [-11, 11]) {
      this.particles.emit(x + side, y + 18, (this.rng() - 0.5) * 30, 120 + this.rng() * 60, 'wash', 0.3, 0.6);
    }
  }

  #collide() {
    eachCollision(this.lasers, this.enemies, (laser, enemy) => {
      laser.active = false;
      this.particles.burst(laser.x, laser.y, 'ink', 4, 120, 0.25);
      if (this.enemies.damage(enemy)) this.#destroy(enemy);
      return true;
    });

    const reach = { active: true, x: this.ship.x, y: this.ship.y, radius: SHIP.pickupRadius };
    eachCollision([reach], this.powerups, (_, powerup) => {
      powerup.active = false;
      this.ship.powerUp(powerup.type);
      this.particles.burst(powerup.x, powerup.y, 'ochre', 16, 160, 0.4);
      this.events.publish('powerup', powerup.type);
    });

    if (this.ship.shielded) return this.#deflect();
    if (!this.ship.vulnerable) return;

    eachCollision([this.ship], [...this.enemies, ...this.bullets], (ship, threat) => {
      threat.active = false;
      this.#hurt();
      return true;
    });
  }

  #deflect() {
    const shield = { active: true, x: this.ship.x, y: this.ship.y, radius: 28 };
    eachCollision([shield], this.bullets, (_, bullet) => {
      bullet.active = false;
      this.particles.burst(bullet.x, bullet.y, 'moss', 6, 120, 0.3);
    });
    eachCollision([shield], this.enemies, (_, enemy) => {
      enemy.active = false;
      this.#destroy(enemy);
    });
  }

  #destroy(enemy) {
    const result = this.session.registerKill(enemy.type);
    this.particles.burst(enemy.x, enemy.y, COLORS_BY_ENEMY[enemy.type], 28, 260, 0.8);
    this.effects.stain(enemy.x, enemy.y, enemy.radius / 18);
    this.effects.ring(enemy.x, enemy.y, COLORS_BY_ENEMY[enemy.type], enemy.radius * 2.4);
    this.effects.label(enemy.x, enemy.y, `+${result.awarded}`, result.awarded > 300 ? 'vermilion' : 'ink');
    this.freeze = Math.max(this.freeze, enemy.type === 'shooter' ? HIT_STOP.shooter : HIT_STOP.kill);
    this.powerups.maybeDrop(enemy.x, enemy.y, this.session.kills);
    this.shake = Math.max(this.shake, enemy.type === 'shooter' ? 10 : 5);
    this.events.publish('kill', { ...result, enemy });
    this.#celebrate(result);
  }

  #escaped() {
    if (this.session.over) return;
    if (this.session.escape()) this.events.publish('combo-broken');
  }

  #hurt() {
    const over = this.session.hitPlayer();
    const { x, y } = this.ship;
    this.particles.burst(x, y, 'vermilion', 40, 320, 1);
    this.particles.burst(x, y, 'ink', 30, 240, 1);
    this.bullets.clear();
    this.effects.stain(x, y, 1.6);
    this.effects.ring(x, y, 'vermilion', 90);
    this.shake = 18;
    this.flash = 1;
    this.freeze = HIT_STOP.hurt;

    if (over) {
      this.ship.active = false;
      this.particles.burst(x, y, 'vermilion', 60, 420, 1.4);
      this.events.publish('game-over', this.session);
    } else {
      this.ship.hit();
      this.events.publish('hit', this.session.lives);
    }
  }
}
