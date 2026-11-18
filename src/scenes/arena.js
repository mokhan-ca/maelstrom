import { BULLET, VORTEX } from '../config.js';
import { sprites } from '../render/sprites.js';
import Ship from '../entities/ship.js';
import Enemies from '../entities/enemies.js';
import Projectiles from '../entities/projectiles.js';
import Powerups from '../entities/powerups.js';
import Particles from '../entities/particles.js';
import Effects from '../entities/effects.js';
import Vortex from '../entities/vortex.js';
import Impact from './impact.js';

export default class Arena {
  constructor({ session, events, rng = Math.random, calm = () => false }) {
    Object.assign(this, { session, events, rng, calm });
    this.ship = new Ship();
    this.enemies = new Enemies(rng);
    this.lasers = new Projectiles(() => (this.ship.brushed ? sprites().brushLaser : sprites().laser), 4, 60);
    this.bullets = new Projectiles(() => sprites().bullet, BULLET.radius, 120);
    this.powerups = new Powerups(rng);
    this.particles = new Particles(rng);
    this.effects = new Effects(rng);
    this.vortex = new Vortex();
    this.impact = new Impact({ rng, calm });
  }

  clear(wave) {
    for (const group of [this.enemies, this.lasers, this.bullets, this.particles, this.effects]) group.clear();
    this.powerups.reset();
    this.ship.reset();
    this.vortex.reset();
    this.vortex.awaken(wave);
    this.impact.reset();
  }

  update(dt) {
    this.bullets.drift(this.vortex, dt, VORTEX.weights.bullet);
    for (const group of [this.lasers, this.bullets, this.powerups, this.particles, this.effects]) group.update(dt);
  }

  celebrate({ extraLife, comboUp }) {
    if (extraLife) this.events.publish('extra-life', this.session.lives);
    if (comboUp) this.events.publish('combo', this.session.multiplier);
  }

  splash({ x, y }) {
    this.particles.burst(x, y, 'vermilion', 40, 320, 1);
    this.particles.burst(x, y, 'ink', 30, 240, 1);
    this.effects.stain(x, y, 1.6);
    this.effects.ring(x, y, 'vermilion', 90);
  }

  drawGround(ctx) {
    this.effects.drawStains(ctx);
    this.vortex.draw(ctx);
  }

  drawFigures(ctx) {
    this.particles.draw(ctx);
    this.powerups.draw(ctx);
    this.lasers.draw(ctx);
    this.enemies.draw(ctx);
    if (this.ship.active) this.ship.draw(ctx);
    this.bullets.draw(ctx);
    this.effects.draw(ctx);
    this.impact.draw(ctx);
  }
}
