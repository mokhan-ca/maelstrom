import Boss from '../src/entities/boss.js';
import Octopus from '../src/entities/bosses/octopus.js';
import Skeleton from '../src/entities/bosses/skeleton.js';
import Dragon from '../src/entities/bosses/dragon.js';
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

describe('the gashadokuro', () => {
  const { telegraph, slam, hand: HAND } = BOSSES.skeleton;

  const fight = (tier, seconds, each = () => {}) => {
    const boss = new Boss('skeleton', tier, new Skeleton());
    const arena = { ship: new Ship(), bullets: new Projectiles(() => null, 7), vortex: new Vortex() };
    for (let t = 0; t < seconds; t += 1 / 60) {
      boss.update(1 / 60, arena);
      each(boss, arena);
    }
    return { boss, arena };
  };

  const shadowed = (boss) => boss.behaviour.hands.filter(({ move }) => move && move.age < telegraph + slam);

  it('keeps its eye clear of the HUD and its hands above the ship', () => {
    let lowest = 0;
    let highestEye = Infinity;
    fight(3, 60, (boss) => {
      if (boss.entering) return;
      boss.hp = 1;
      lowest = Math.max(lowest, ...boss.parts.map((part) => part.y));
      highestEye = Math.min(highestEye, boss.parts.find((part) => part.weak).y);
    });
    expect(lowest).toBeLessThanOrEqual(640);
    expect(highestEye).toBeGreaterThanOrEqual(170);
  });

  it('leaves room between two slams', () => {
    let narrowest = Infinity;
    fight(0, 60, (boss) => {
      boss.hp = 1;
      const columns = shadowed(boss).map(({ move }) => move.x);
      if (columns.length === 2) narrowest = Math.min(narrowest, Math.abs(columns[0] - columns[1]) - HAND.column);
    });
    expect(narrowest).toBeGreaterThanOrEqual(40);
  });

  it('rains bone down the column it slams', () => {
    let target = null;
    const { arena } = fight(0, 8, (boss) => {
      target ??= shadowed(boss)[0]?.move.x ?? null;
    });
    const shards = [...arena.bullets];
    expect(shards.length).toBeGreaterThan(0);
    for (const shard of shards) expect(Math.abs(shard.x - target)).toBeLessThan(HAND.column / 2);
  });

  it('shrugs off a few stray shots to its hand', () => {
    let hand = null;
    fight(0, 8, (current) => {
      if (hand?.move?.hits === 0) current.glance(hand.part);
      hand ??= shadowed(current)[0] ?? null;
    });
    expect(hand.flinch).toBe(0);
  });

  it('flinches and calls off a slam when its hand is pounded', () => {
    let hand = null;
    const firstLanding = BOSSES.entrance + BOSSES.skeleton.gap + telegraph + slam;
    const { boss, arena } = fight(0, firstLanding + 0.2, (current) => {
      hand ??= shadowed(current)[0] ?? null;
      if (hand?.move) current.glance(hand.part);
    });
    expect(hand.move).toBeNull();
    expect([...arena.bullets]).toHaveLength(0);
    expect(boss.hp).toBe(boss.maxHp);
  });

  it('warns for the same time at every tier', () => {
    const firstWarning = (tier) => {
      const frames = [];
      fight(tier, 8, (boss) => frames.push(shadowed(boss).length > 0));
      const start = frames.indexOf(true);
      return frames.indexOf(false, start) - start;
    };
    expect(firstWarning(3)).toBe(firstWarning(0));
  });
});

describe('the ink dragon', () => {
  const { telegraph, breath } = BOSSES.dragon;

  const fight = (tier, seconds, each = () => {}) => {
    const boss = new Boss('dragon', tier, new Dragon());
    const arena = { ship: new Ship(), bullets: new Projectiles(() => null, 7), vortex: new Vortex() };
    for (let t = 0; t < seconds; t += 1 / 60) {
      boss.update(1 / 60, arena);
      each(boss, arena);
    }
    return { boss, arena };
  };

  const coiledAround = ({ behaviour: { head } }, { vortex }) => Math.hypot(head.x - vortex.x, head.y - vortex.y);

  it('keeps its eye clear of the HUD and its body above the ship', () => {
    let lowest = 0;
    let highestEye = Infinity;
    fight(3, 60, (boss) => {
      if (boss.entering) return;
      boss.hp = 1;
      lowest = Math.max(lowest, ...boss.parts.map((part) => part.y));
      highestEye = Math.min(highestEye, boss.parts.find((part) => part.weak).y);
    });
    expect(lowest).toBeLessThanOrEqual(640);
    expect(highestEye).toBeGreaterThanOrEqual(170);
  });

  it('waits for its entrance before it breathes', () => {
    const { arena } = fight(2, BOSSES.entrance - 0.1);
    expect([...arena.bullets]).toHaveLength(0);
  });

  it('breathes more fire as it weakens', () => {
    const volley = (hp) => {
      const firstBreath = BOSSES.entrance + BOSSES.dragon.gap + telegraph + 0.05;
      const { arena } = fight(0, firstBreath, (boss) => (boss.hp = Math.ceil(boss.maxHp * hp)));
      return [...arena.bullets].length;
    };
    expect([volley(1), volley(0.5), volley(0.2)]).toEqual(breath.drops);
  });

  it('coils tighter in its last phase', () => {
    let calm = 0;
    let cornered = 0;
    fight(0, 20, (boss, arena) => (calm = coiledAround(boss, arena)));
    fight(0, 20, (boss, arena) => {
      boss.hp = 1;
      cornered = coiledAround(boss, arena);
    });
    expect(cornered).toBeLessThan(calm);
  });

  it('warns for the same time at every tier', () => {
    const firstWarning = (tier) => {
      const frames = [];
      fight(tier, 8, (boss) => frames.push(boss.behaviour.breath !== null));
      const start = frames.indexOf(true);
      return frames.indexOf(false, start) - start;
    };
    expect(firstWarning(3)).toBe(firstWarning(0));
  });

  it('holds its fire when the ship is struck', () => {
    const { boss } = fight(0, BOSSES.entrance + BOSSES.dragon.gap + 0.1);
    boss.regroup();
    expect(boss.behaviour.breath).toBeNull();
  });
});
