import Boss from '../src/entities/boss.js';
import Octopus from '../src/entities/bosses/octopus.js';
import Ship from '../src/entities/ship.js';
import Projectiles from '../src/entities/projectiles.js';
import Vortex from '../src/entities/vortex.js';
import { BOSSES, SHIP } from '../src/config.js';

const still = { enter() {}, update() {}, regroup() {}, underlay() {} };

const awake = (boss) => {
  boss.age = BOSSES.entrance;
  return boss;
};

describe('Boss', () => {
  it('cannot be hurt while it enters', () => {
    const boss = new Boss('octopus', 0, still);
    expect(boss.damage()).toBeNull();
    expect(boss.hp).toBe(boss.maxHp);
  });

  it('moves through three phases as it weakens', () => {
    const boss = awake(new Boss('octopus', 0, still));
    expect(boss.phase).toBe(1);
    boss.hp = Math.floor(boss.maxHp * 2 / 3) + 1;
    expect(boss.damage()).toEqual({ dead: false, phaseChanged: true });
    expect(boss.phase).toBe(2);
    boss.hp = Math.floor(boss.maxHp / 3);
    expect(boss.phase).toBe(3);
  });

  it('reports its death', () => {
    const boss = awake(new Boss('octopus', 0, still));
    boss.hp = 1;
    expect(boss.damage().dead).toBe(true);
    expect(boss.damage()).toBeNull();
  });

  it('opens in its second phase when it returns', () => {
    expect(new Boss('octopus', 1, still).phase).toBe(2);
  });

  it('caps how tough and quick a returning boss gets', () => {
    const boss = new Boss('octopus', 20, still);
    expect(boss.maxHp).toBe(Math.round(BOSSES.octopus.hp * BOSSES.tier.maxHp));
    expect(boss.pace).toBe(BOSSES.tier.maxPace);
  });

  it('lasts under a minute and a quarter when half your shots land', () => {
    const seconds = new Boss('octopus', 0, still).maxHp / (0.5 / SHIP.fireInterval);
    expect(seconds).toBeGreaterThanOrEqual(45);
    expect(seconds).toBeLessThanOrEqual(75);
  });

  it('crumbles part by part', () => {
    const boss = new Boss('octopus', 0, { ...still, enter: (it) => (it.parts = [1, 2, 3]) });
    expect(boss.crumble(0.07)).toEqual([3]);
    expect(boss.crumble(0.14)).toEqual([2, 1]);
  });
});

describe('the ink octopus', () => {
  const world = () => ({ ship: new Ship(), bullets: new Projectiles(() => null, 7), vortex: new Vortex() });

  const fight = (tier, seconds, each = () => {}) => {
    const boss = new Boss('octopus', tier, new Octopus());
    const arena = world();
    for (let t = 0; t < seconds; t += 1 / 60) {
      boss.update(1 / 60, arena);
      each(boss, arena);
    }
    return { boss, arena };
  };

  it('keeps its eye clear of the HUD and its arms above the ship', () => {
    let lowest = 0;
    let highestEye = Infinity;
    fight(3, 60, (boss) => {
      if (boss.entering) return;
      boss.hp = 1;
      lowest = Math.max(lowest, ...boss.parts.map((part) => part.y));
      highestEye = Math.min(highestEye, ...boss.parts.filter((part) => part.weak).map((part) => part.y));
    });
    expect(lowest).toBeLessThanOrEqual(640);
    expect(highestEye).toBeGreaterThanOrEqual(170);
  });

  it('waits for its entrance before it attacks', () => {
    const { arena } = fight(2, BOSSES.entrance - 0.1);
    expect([...arena.bullets]).toHaveLength(0);
  });

  it('flicks ink at the ship after a sweep', () => {
    const { arena } = fight(0, 8);
    expect([...arena.bullets].length).toBeGreaterThan(0);
  });

  it('warns for the same time at every tier', () => {
    const coiling = ({ move }) => move && move.age < BOSSES.octopus.telegraph;
    const firstWarning = (tier) => {
      const frames = [];
      fight(tier, 8, (boss) => frames.push(boss.behaviour.arms.some(coiling)));
      const start = frames.indexOf(true);
      return frames.indexOf(false, start) - start;
    };
    expect(firstWarning(3)).toBe(firstWarning(0));
  });

  it('calls off its attack when the ship is struck', () => {
    const { boss } = fight(0, 6);
    boss.regroup();
    expect(boss.behaviour.arms.every((arm) => !arm.move)).toBe(true);
  });
});
