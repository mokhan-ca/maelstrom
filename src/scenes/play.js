import { BULLET, WORLD, WAVES } from '../config.js';
import { eachCollision } from '../engine/collision.js';
import { sprites } from '../render/sprites.js';
import Ship from '../entities/ship.js';
import Enemies from '../entities/enemies.js';
import Projectiles from '../entities/projectiles.js';
import Powerups from '../entities/powerups.js';
import Particles from '../entities/particles.js';

const COLORS_BY_ENEMY = { drifter: 'magenta', zigzag: 'yellow', shooter: 'green' };

export default class Play {
  constructor({ session, events, rng = Math.random }) {
    this.session = session;
    this.events = events;
    this.rng = rng;
    this.ship = new Ship();
    this.enemies = new Enemies(rng);
    this.lasers = new Projectiles(() => sprites().laser, 4, 60);
    this.bullets = new Projectiles(() => sprites().bullet, BULLET.radius, 120);
    this.powerups = new Powerups(rng);
    this.particles = new Particles(rng);
    this.shake = 0;
    this.flash = 0;
    this.ended = 0;
  }

  start() {
    this.session.reset();
    for (const group of [this.enemies, this.lasers, this.bullets, this.powerups, this.particles]) group.clear();
    this.ship.reset();
    this.spawnIn = 1;
    this.ended = 0;
    this.events.publish('start', this.session);
  }

  get finished() {
    return this.ended > 1.6;
  }

  update(dt, input) {
    if (this.session.over) this.ended += dt;
    else this.#play(dt, input);

    this.enemies.update(dt, { ship: this.ship, bullets: this.bullets, speed: this.session.speedMultiplier });
    for (const group of [this.lasers, this.bullets, this.powerups, this.particles]) group.update(dt);
    this.#collide();
    this.shake = Math.max(0, this.shake - dt * 30);
    this.flash = Math.max(0, this.flash - dt * 2.5);
  }

  draw(ctx) {
    ctx.globalCompositeOperation = 'lighter';
    this.particles.draw(ctx);
    this.powerups.draw(ctx);
    this.lasers.draw(ctx);
    this.enemies.draw(ctx);
    if (this.ship.active) this.ship.draw(ctx);
    this.bullets.draw(ctx);
    ctx.globalCompositeOperation = 'source-over';

    if (this.flash) {
      ctx.fillStyle = `rgba(255, 60, 90, ${this.flash * 0.35})`;
      ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    }
  }

  get shakeOffset() {
    const magnitude = this.shake;
    return { x: (this.rng() - 0.5) * magnitude, y: (this.rng() - 0.5) * magnitude };
  }

  #play(dt, input) {
    if (this.session.tick(dt)) this.events.publish('wave', this.session.wave);
    this.ship.update(dt, input);
    if (input.firing && this.ship.canFire) {
      this.ship.fire(this.lasers);
      this.events.publish('laser');
    }
    this.#trail();
    this.#spawn(dt);
  }

  #spawn(dt) {
    this.spawnIn -= dt;
    if (this.spawnIn > 0 || this.enemies.count >= WAVES.maxEnemies) return;
    this.spawnIn = this.session.spawnInterval * (0.7 + this.rng() * 0.6);
    this.enemies.spawn(this.session.pickEnemyType(this.rng), this.session.speedMultiplier);
  }

  #trail() {
    const { x, y } = this.ship;
    for (const side of [-11, 11]) {
      this.particles.emit(x + side, y + 18, (this.rng() - 0.5) * 30, 160 + this.rng() * 80, this.rng() < 0.5 ? 'magenta' : 'violet', 0.25, 0.7);
    }
  }

  #collide() {
    eachCollision(this.lasers, this.enemies, (laser, enemy) => {
      laser.active = false;
      this.particles.burst(laser.x, laser.y, 'cyan', 4, 120, 0.25);
      if (this.enemies.damage(enemy)) this.#destroy(enemy);
      return true;
    });

    if (!this.ship.active || this.session.over) return;

    eachCollision([this.ship], this.powerups, (ship, powerup) => {
      powerup.active = false;
      ship.powerUp(powerup.type);
      this.particles.burst(powerup.x, powerup.y, 'white', 16, 160, 0.4);
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
      this.particles.burst(bullet.x, bullet.y, 'green', 6, 120, 0.3);
    });
    eachCollision([shield], this.enemies, (_, enemy) => {
      enemy.active = false;
      this.#destroy(enemy);
    });
  }

  #destroy(enemy) {
    const result = this.session.registerKill(enemy.type);
    this.particles.burst(enemy.x, enemy.y, COLORS_BY_ENEMY[enemy.type], 28, 260, 0.8);
    this.particles.burst(enemy.x, enemy.y, 'white', 8, 140, 0.4);
    this.powerups.maybeDrop(enemy.x, enemy.y);
    this.shake = Math.max(this.shake, enemy.type === 'shooter' ? 10 : 5);
    this.events.publish('kill', { ...result, enemy });
    if (result.extraLife) this.events.publish('extra-life', this.session.lives);
  }

  #hurt() {
    const over = this.session.hitPlayer();
    const { x, y } = this.ship;
    this.particles.burst(x, y, 'cyan', 40, 320, 1);
    this.particles.burst(x, y, 'pink', 30, 240, 1);
    this.bullets.clear();
    this.shake = 18;
    this.flash = 1;

    if (over) {
      this.ship.active = false;
      this.particles.burst(x, y, 'white', 60, 420, 1.4);
      this.events.publish('game-over', this.session);
    } else {
      this.ship.hit();
      this.events.publish('hit', this.session.lives);
    }
  }
}
