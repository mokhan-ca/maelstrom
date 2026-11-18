import { WAVES, VORTEX, BOSSES } from '../config.js';
import { summon as summonBoss } from '../entities/bosses/index.js';
import Arena from './arena.js';
import BossFight from './boss-fight.js';
import Skirmish from './skirmish.js';

const DEATH_SLOWDOWN = 0.35;

export default class Play {
  constructor({ session, events, rng = Math.random, calm = () => false, met = [], summon = summonBoss }) {
    Object.assign(this, { session, events, rng });
    this.met = new Set(met);
    this.arena = new Arena({ session, events, rng, calm });
    const hurt = () => this.#hurt();
    this.fight = new BossFight(this.arena, { summon, hurt, conquered: () => this.#nextWave() });
    this.skirmish = new Skirmish(this.arena, { hurt });
    this.ended = 0;
  }

  start(wave = 1) {
    this.session.reset(wave);
    this.arena.clear(wave);
    this.fight.reset();
    this.spawnIn = 1;
    this.ended = 0;
    this.events.publish('start', this.session);
    this.#challenge();
  }

  get ship() {
    return this.arena.ship;
  }

  get boss() {
    return this.fight.boss;
  }

  get finished() {
    return this.ended > 1.6;
  }

  get shakeOffset() {
    return this.arena.impact.offset;
  }

  update(dt, input) {
    if (this.arena.impact.frozen(dt)) return;
    if (this.session.over) {
      this.ended += dt;
      dt *= DEATH_SLOWDOWN;
    } else {
      this.#play(dt, input);
    }

    this.arena.vortex.update(dt);
    this.arena.enemies.update(dt, this.#world);
    this.fight.update(dt, this.#world);
    this.arena.update(dt);
    if (!this.session.over) this.fight.collide();
    if (!this.session.over) this.skirmish.collide();
    if (!this.session.over) this.skirmish.churn();
    this.arena.impact.settle(dt);
  }

  draw(ctx) {
    this.arena.drawGround(ctx);
    this.fight.draw(ctx);
    this.arena.drawFigures(ctx);
  }

  #play(dt, input) {
    const { ship, vortex } = this.arena;
    if (this.session.tick(dt)) this.#nextWave();
    for (const power of ship.update(dt, input)) this.events.publish('expire', power);
    ship.nudge(vortex.pull(ship, dt, VORTEX.weights.ship));
    if (input.firing && ship.canFire) this.#fire();
    this.#trail();
    this.#spawn(dt);
  }

  get #world() {
    const { ship, bullets, vortex } = this.arena;
    return {
      ship,
      bullets,
      vortex,
      speed: this.session.speedMultiplier,
      escaped: () => this.#escaped(),
      charging: () => this.events.publish('charge'),
    };
  }

  #nextWave() {
    const { wave } = this.session;
    const { vortex } = this.arena;
    const stirring = !vortex.active;
    vortex.awaken(wave);
    this.events.publish('wave', wave);
    if (stirring && vortex.active) this.events.publish('maelstrom');
    this.#challenge();
  }

  #challenge() {
    const { boss } = this.session;
    if (!boss) return;
    this.fight.begin(boss);
    this.spawnIn = BOSSES.entrance * 2;
  }

  #fire() {
    const { ship, lasers, particles } = this.arena;
    ship.fire(lasers);
    particles.emit(ship.x, ship.y - 24, 0, -40, 'ink', 0.06, 1.6);
    this.events.publish('laser');
  }

  #trail() {
    const { ship: { x, y }, particles } = this.arena;
    for (const side of [-11, 11]) {
      particles.emit(x + side, y + 18, (this.rng() - 0.5) * 30, 120 + this.rng() * 60, 'wash', 0.3, 0.6);
    }
  }

  #spawn(dt) {
    const { enemies } = this.arena;
    this.spawnIn -= dt;
    if (this.spawnIn > 0 || enemies.count >= WAVES.maxEnemies) return;
    this.spawnIn = this.session.spawnInterval * (0.7 + this.rng() * 0.6) * (this.boss ? BOSSES.fodderInterval : 1);
    const type = this.boss ? 'drifter' : this.session.pickEnemyType(this.rng);
    enemies.spawn(type, this.session.speedMultiplier);
    this.#meet(type);
  }

  #meet(type) {
    if (this.met.has(type)) return;
    this.met.add(type);
    this.events.publish('meet', type);
  }

  #escaped() {
    if (this.session.over) return;
    if (this.session.escape()) this.events.publish('combo-broken');
  }

  #hurt() {
    const over = this.session.hitPlayer();
    this.fight.regroup();
    this.arena.bullets.clear();
    this.arena.splash(this.ship);
    this.arena.impact.wound();
    if (over) return this.#perish();
    this.ship.hit();
    this.events.publish('hit', this.session.lives);
  }

  #perish() {
    const { x, y } = this.ship;
    this.ship.active = false;
    this.arena.particles.burst(x, y, 'vermilion', 60, 420, 1.4);
    this.events.publish('game-over', this.session);
  }
}
