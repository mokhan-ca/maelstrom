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

  describe('tick', () => {
    it('advances the wave after the duration', () => {
      expect(session.tick(WAVES.duration - 1)).toBe(false);
      expect(session.tick(1)).toBe(true);
      expect(session.wave).toBe(2);
    });

    it('advances the wave after enough kills', () => {
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
    it('only sends drifters in the first wave', () => {
      expect(session.pickEnemyType(() => 0.999)).toBe('drifter');
    });

    it('introduces new enemies in later waves', () => {
      session.wave = WAVES.shooterFromWave;
      expect(session.pickEnemyType(() => 0.999)).toBe('shooter');
    });
  });
});
