import { SHIP, WAVES, COMBO, ENEMIES } from './config.js';

export default class Session {
  constructor({ best = 0 } = {}) {
    this.best = best;
    this.reset();
  }

  reset() {
    this.score = 0;
    this.lives = SHIP.lives;
    this.wave = 1;
    this.waveTime = 0;
    this.waveKills = 0;
    this.streak = 0;
    this.kills = 0;
    this.nextExtraLife = SHIP.extraLifeEvery;
    this.over = false;
  }

  get multiplier() {
    return Math.min(COMBO.maxMultiplier, 1 + Math.floor(this.streak / COMBO.killsPerStep));
  }

  registerKill(type) {
    const awarded = ENEMIES[type].points * this.multiplier;
    this.streak++;
    this.kills++;
    this.waveKills++;
    this.score += awarded;
    let extraLife = false;
    if (this.score >= this.nextExtraLife) {
      this.lives++;
      this.nextExtraLife += SHIP.extraLifeEvery;
      extraLife = true;
    }
    if (this.score > this.best) this.best = this.score;
    return { awarded, extraLife };
  }

  hitPlayer() {
    if (this.over) return true;
    this.lives = Math.max(0, this.lives - 1);
    this.streak = 0;
    this.over = this.lives === 0;
    return this.over;
  }

  tick(dt) {
    this.waveTime += dt;
    if (this.waveTime >= WAVES.duration || this.waveKills >= WAVES.killsToAdvance) {
      this.wave++;
      this.waveTime = 0;
      this.waveKills = 0;
      return true;
    }
    return false;
  }

  get spawnInterval() {
    return Math.max(WAVES.minSpawnInterval, WAVES.firstSpawnInterval * WAVES.spawnDecay ** (this.wave - 1));
  }

  get speedMultiplier() {
    return Math.min(WAVES.maxSpeedMultiplier, 1 + WAVES.speedGrowth * (this.wave - 1));
  }

  pickEnemyType(rng = Math.random) {
    const options = [['drifter', 6]];
    if (this.wave >= WAVES.zigzagFromWave) options.push(['zigzag', 3 + this.wave * 0.3]);
    if (this.wave >= WAVES.shooterFromWave) options.push(['shooter', 1 + this.wave * 0.25]);
    const total = options.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = rng() * total;
    for (const [type, weight] of options) {
      roll -= weight;
      if (roll < 0) return type;
    }
    return options[options.length - 1][0];
  }
}
