import Session from '../src/session.js';
import { SHIP, WAVES, COMBO, ENEMIES, BOSSES } from '../src/config.js';

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

  describe('bosses', () => {
    const { every, roster } = BOSSES;
    const returning = every * (roster.length + 1);

    it('appears every few waves', () => {
      session.wave = every - 1;
      expect(session.boss).toBeNull();
      session.wave = every;
      expect(session.boss).toEqual({ type: roster[0], tier: 0 });
    });

    it('returns harder once the roster is through', () => {
      session.wave = returning;
      expect(session.boss).toEqual({ type: roster[0], tier: 1 });
    });

    it('holds the wave until the boss falls', () => {
      session.wave = every;
      session.waveKills = 999;
      expect(session.tick(WAVES.duration * 2)).toBe(false);
      expect(session.wave).toBe(every);
    });

    it('pays a flat reward that grows with the tier', () => {
      session.wave = returning;
      session.streak = 50;
      session.waveKills = 7;
      const { awarded } = session.defeatBoss();
      expect(awarded).toBe(BOSSES[roster[0]].points * 2);
      expect(session.score).toBe(awarded);
      expect(session.streak).toBe(50);
      expect(session.waveKills).toBe(0);
      expect(session.wave).toBe(returning + 1);
    });

    it('lets fodder slip past without breaking the combo', () => {
      session.wave = every;
      session.streak = COMBO.killsPerStep;
      expect(session.escape()).toBe(false);
      expect(session.multiplier).toBe(2);
    });
  });
});
