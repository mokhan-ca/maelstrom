import Session from '../src/session.js';
import { SHIP, WAVES, COMBO, ENEMIES } from '../src/config.js';

describe('Session', () => {
  let session;

  beforeEach(() => {
    session = new Session({ best: 500 });
  });

  it('starts fresh', () => {
    expect(session).toMatchObject({ score: 0, lives: SHIP.lives, wave: 1, best: 500, over: false });
  });

  describe('registerKill', () => {
    it('awards the enemy points', () => {
      expect(session.registerKill('drifter').awarded).toBe(ENEMIES.drifter.points);
      expect(session.score).toBe(ENEMIES.drifter.points);
    });

    it('grows the multiplier with a streak', () => {
      for (let i = 0; i < COMBO.killsPerStep; i++) session.registerKill('drifter');
      expect(session.multiplier).toBe(2);
      expect(session.registerKill('drifter').awarded).toBe(ENEMIES.drifter.points * 2);
    });

    it('caps the multiplier', () => {
      session.streak = 1000;
      expect(session.multiplier).toBe(COMBO.maxMultiplier);
    });

    it('raises the best score', () => {
      for (let i = 0; i < 6; i++) session.registerKill('drifter');
      expect(session.best).toBe(session.score);
    });

    it('grants an extra life at the threshold', () => {
      session.score = SHIP.extraLifeEvery - 1;
      expect(session.registerKill('drifter').extraLife).toBe(true);
      expect(session.lives).toBe(SHIP.lives + 1);
    });

    it('spaces extra lives further apart each time', () => {
      session.score = SHIP.extraLifeEvery;
      session.registerKill('drifter');
      expect(session.nextExtraLife).toBe(SHIP.extraLifeEvery * 3);
    });

    it('never exceeds the maximum lives', () => {
      session.lives = SHIP.maxLives;
      session.score = SHIP.extraLifeEvery;
      expect(session.registerKill('drifter').extraLife).toBe(false);
      expect(session.lives).toBe(SHIP.maxLives);
    });

    it('announces a multiplier step', () => {
      session.streak = COMBO.killsPerStep - 1;
      expect(session.registerKill('drifter').comboUp).toBe(true);
    });
  });

  describe('hitPlayer', () => {
    it('costs a life and breaks the streak', () => {
      session.streak = 12;
      expect(session.hitPlayer()).toBe(false);
      expect(session.lives).toBe(SHIP.lives - 1);
      expect(session.multiplier).toBe(1);
    });

    it('ends the game on the last life', () => {
      session.lives = 1;
      expect(session.hitPlayer()).toBe(true);
      expect(session.over).toBe(true);
    });
  });

  describe('escape', () => {
    it('breaks the streak', () => {
      session.streak = COMBO.killsPerStep;
      expect(session.escape()).toBe(true);
      expect(session.multiplier).toBe(1);
    });

    it('says nothing when there was no combo', () => {
      expect(session.escape()).toBe(false);
    });
  });

  describe('tick', () => {
    it('advances the wave after the duration', () => {
      expect(session.tick(WAVES.duration - 1)).toBe(false);
      expect(session.tick(1)).toBe(true);
      expect(session.wave).toBe(2);
    });

    it('advances the first wave sooner', () => {
      session.waveKills = WAVES.firstWaveKills;
      expect(session.tick(0)).toBe(true);
    });

    it('advances later waves after enough kills', () => {
      session.wave = 2;
      session.waveKills = WAVES.killsToAdvance - 1;
      expect(session.tick(0)).toBe(false);
      session.waveKills = WAVES.killsToAdvance;
      expect(session.tick(0)).toBe(true);
    });

    it('spawns faster and moves quicker each wave', () => {
      const { spawnInterval, speedMultiplier } = session;
      session.wave = 5;
      expect(session.spawnInterval).toBeLessThan(spawnInterval);
      expect(session.speedMultiplier).toBeGreaterThan(speedMultiplier);
    });

    it('never spawns faster than the minimum', () => {
      session.wave = 999;
      expect(session.spawnInterval).toBe(WAVES.minSpawnInterval);
      expect(session.speedMultiplier).toBe(WAVES.maxSpeedMultiplier);
    });
  });

  describe('pickEnemyType', () => {
    it('mostly sends drifters in the first wave', () => {
      expect(session.pickEnemyType(() => 0.5)).toBe('drifter');
      expect(session.pickEnemyType(() => 0.999)).toBe('zigzag');
    });

    it('introduces new enemies in later waves', () => {
      session.wave = WAVES.shooterFromWave;
      expect(session.pickEnemyType(() => 0.999)).toBe('shooter');
    });
  });
});
