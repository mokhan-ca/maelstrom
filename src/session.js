import { SHIP, WAVES, COMBO, ENEMIES, VORTEX, BOSSES } from './config.js';

export default class Session {
  constructor({ best = 0 } = {}) {
    this.best = best;
    this.reset();
  }

  reset(wave = 1) {
    this.score = 0;
    this.lives = SHIP.lives;
    this.wave = wave;
    this.waveTime = 0;
    this.waveKills = 0;
    this.streak = 0;
    this.kills = 0;
    this.extraLives = 0;
    this.nextExtraLife = SHIP.extraLifeEvery;
    this.over = false;
  }

  get multiplier() {
    return Math.min(COMBO.maxMultiplier, 1 + Math.floor(this.streak / COMBO.killsPerStep));
  }

  registerKill(type, { swallowed = false } = {}) {
    const before = this.multiplier;
    const awarded = ENEMIES[type].points * before * (swallowed ? VORTEX.bonusMultiplier : 1);
    this.streak++;
    this.kills++;
    this.waveKills++;
    this.score += awarded;
    this.best = Math.max(this.best, this.score);
    return { awarded, extraLife: this.#earnExtraLife(), comboUp: this.multiplier > before };
  }

  escape() {
    if (this.boss) return false;
    const broken = this.multiplier > 1;
    this.streak = 0;
    return broken;
  }

  hitPlayer() {
    if (this.over) return true;
    this.lives = Math.max(0, this.lives - 1);
    this.streak = 0;
    this.over = this.lives === 0;
    return this.over;
  }

  get killsToAdvance() {
    return this.wave === 1 ? WAVES.firstWaveKills : WAVES.killsToAdvance;
  }

  get boss() {
    if (this.wave % BOSSES.every !== 0) return null;
    const { roster } = BOSSES;
    const index = this.wave / BOSSES.every - 1;
    return { type: roster[index % roster.length], tier: Math.floor(index / roster.length) };
  }

  tick(dt) {
    if (this.boss) return false;
    this.waveTime += dt;
    if (this.waveTime < WAVES.duration && this.waveKills < this.killsToAdvance) return false;
    return this.#advance();
  }

  defeatBoss() {
    const { type, tier } = this.boss;
    const awarded = BOSSES[type].points * (tier + 1);
    this.score += awarded;
    this.best = Math.max(this.best, this.score);
    const extraLife = this.#earnExtraLife();
    this.#advance();
    return { awarded, extraLife, comboUp: false };
  }

  get spawnInterval() {
    return Math.max(WAVES.minSpawnInterval, WAVES.firstSpawnInterval * WAVES.spawnDecay ** (this.wave - 1));
  }

  get speedMultiplier() {
    return Math.min(WAVES.maxSpeedMultiplier, 1 + WAVES.speedGrowth * (this.wave - 1));
  }

  pickEnemyType(rng = Math.random) {
    const options = [['drifter', 6]];
    if (this.wave >= WAVES.zigzagFromWave) options.push(['zigzag', this.wave * 1.5]);
    if (this.wave >= WAVES.shooterFromWave) options.push(['shooter', 1 + this.wave * 0.25]);
    const total = options.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = rng() * total;
    for (const [type, weight] of options) {
      roll -= weight;
      if (roll < 0) return type;
    }
    return options[options.length - 1][0];
  }

  #advance() {
    this.wave++;
    this.waveTime = 0;
    this.waveKills = 0;
    return true;
  }

  #earnExtraLife() {
    if (this.score < this.nextExtraLife) return false;
    this.extraLives++;
    this.nextExtraLife += SHIP.extraLifeEvery * (this.extraLives + 1);
    if (this.lives >= SHIP.maxLives) return false;
    this.lives++;
    return true;
  }
}
