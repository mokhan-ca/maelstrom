import Play from '../src/scenes/play.js';
import Session from '../src/session.js';
import EventAggregator from '../src/engine/event-aggregator.js';
import Boss from '../src/entities/boss.js';
import { BOSSES, SHIP } from '../src/config.js';

const idle = { axis: { x: 0, y: 0 }, firing: false, takeDrag: () => ({ x: 0, y: 0 }) };

describe('Play', () => {
  let session;
  let play;

  beforeEach(() => {
    session = new Session();
    play = new Play({ session, events: new EventAggregator(), rng: () => 0.5 });
    play.start();
  });

  it('stops scoring once the game is over', () => {
    play.arena.enemies.spawn('drifter', 1);
    const [enemy] = play.arena.enemies;
    play.arena.lasers.fire(enemy.x, enemy.y + 5, 0, 0);
    session.lives = 1;
    session.hitPlayer();

    play.update(1 / 60, idle);

    expect(session.score).toBe(0);
  });

  it('scores a laser hit while playing', () => {
    play.arena.enemies.spawn('drifter', 1);
    const [enemy] = play.arena.enemies;
    play.arena.lasers.fire(enemy.x, enemy.y + 5, 0, 0);

    play.update(1 / 60, idle);

    expect(session.score).toBeGreaterThan(0);
  });
});

describe('Play stakes', () => {
  it('breaks the combo when an enemy escapes', () => {
    const session = new Session();
    const events = new EventAggregator();
    const play = new Play({ session, events, rng: () => 0.5 });
    let broken = false;
    events.subscribe('combo-broken', () => (broken = true));
    play.start();
    session.streak = 10;
    play.arena.enemies.spawn('drifter', 1);
    const [enemy] = play.arena.enemies;
    enemy.y = 2000;

    play.update(1 / 60, idle);

    expect(session.multiplier).toBe(1);
    expect(broken).toBe(true);
  });

  it('guarantees an early power-up', () => {
    const session = new Session();
    const play = new Play({ session, events: new EventAggregator(), rng: () => 0.99 });
    play.start();
    session.kills = 8;
    play.arena.powerups.maybeDrop(100, 100, session.kills);
    expect([...play.arena.powerups]).toHaveLength(1);
  });
});

describe('the maelstrom', () => {
  let session;
  let events;
  let play;
  let enemy;

  const intoTheCore = () => {
    play.arena.vortex.awaken(2);
    play.arena.vortex.update(2);
    play.arena.enemies.spawn('drifter', 1);
    [enemy] = play.arena.enemies;
    Object.assign(enemy, { x: play.arena.vortex.x, y: play.arena.vortex.y, vx: 0, vy: 0 });
  };

  beforeEach(() => {
    session = new Session();
    events = new EventAggregator();
    play = new Play({ session, events, rng: () => 0.5 });
    play.start();
    play.ship.y = 900;
  });

  it('swallows an untouched enemy for nothing but keeps the combo', () => {
    session.streak = 10;
    intoTheCore();
    play.update(1 / 60, idle);
    expect(enemy.active).toBe(false);
    expect(session.score).toBe(0);
    expect(session.streak).toBe(10);
  });

  it('pays double for an enemy you struck before it was swallowed', () => {
    intoTheCore();
    enemy.hp = 2;
    play.arena.enemies.damage(enemy);
    play.update(1 / 60, idle);
    expect(session.score).toBe(200);
  });

  it('announces when it first stirs', () => {
    let stirred = false;
    events.subscribe('maelstrom', () => (stirred = true));
    session.waveKills = 1000;
    play.update(1 / 60, idle);
    expect(stirred).toBe(true);
  });
});

describe('meeting enemies', () => {
  it('introduces each kind once', () => {
    const session = new Session();
    const events = new EventAggregator();
    const play = new Play({ session, events, rng: () => 0.1, met: ['zigzag'] });
    const met = [];
    events.subscribe('meet', (type) => met.push(type));
    play.start();
    for (let i = 0; i < 300; i++) play.update(1 / 60, idle);
    expect(met).toEqual(['drifter']);
  });
});

describe('boss fights', () => {
  const { every } = BOSSES;
  let session;
  let events;
  let play;
  let heard;

  const statue = {
    enter(boss) {
      boss.parts = [
        { active: true, weak: true, x: 270, y: 200, radius: 36 },
        { active: true, weak: false, x: 100, y: 500, radius: 16 },
      ];
    },
    update() {},
    regroup() {},
    underlay() {},
  };

  const [eye, arm] = [0, 1];
  const shoot = (index) => {
    const { x, y } = play.boss.parts[index];
    play.arena.lasers.fire(x, y, 0, 0);
  };

  beforeEach(() => {
    session = new Session();
    events = new EventAggregator();
    heard = [];
    for (const name of ['boss', 'boss-down']) events.subscribe(name, (payload) => heard.push([name, payload]));
    play = new Play({ session, events, rng: () => 0.5, summon: (type, tier) => new Boss(type, tier, statue) });
    play.start(every);
    play.boss.age = BOSSES.entrance;
  });

  it('summons the boss when its wave arrives', () => {
    play.start(every - 1);
    session.waveKills = 999;
    play.update(1 / 60, idle);
    expect(play.boss).toBeInstanceOf(Boss);
    expect(heard).toContainEqual(['boss', { type: BOSSES.roster[0], tier: 0 }]);
  });

  it('sends only drifters as fodder', () => {
    play.spawnIn = 0;
    play.update(1 / 60, idle);
    expect([...play.arena.enemies].map((enemy) => enemy.type)).toEqual(['drifter']);
  });

  it('wounds the boss through its weak spot', () => {
    shoot(eye);
    play.update(1 / 60, idle);
    expect(play.boss.hp).toBe(play.boss.maxHp - 1);
  });

  it('absorbs shots that hit its body', () => {
    shoot(arm);
    play.update(1 / 60, idle);
    expect(play.boss.hp).toBe(play.boss.maxHp);
    expect([...play.arena.lasers]).toHaveLength(0);
  });

  it('hurts a ship that touches it and stays whole', () => {
    Object.assign(play.ship, { x: play.boss.parts[arm].x, y: play.boss.parts[arm].y });
    play.update(1 / 60, idle);
    expect(session.lives).toBe(SHIP.lives - 1);
    expect(play.boss.parts[arm].active).toBe(true);
  });

  it('cannot hurt a shielded ship', () => {
    play.ship.powerUp('shield');
    Object.assign(play.ship, { x: play.boss.parts[arm].x, y: play.boss.parts[arm].y });
    play.update(1 / 60, idle);
    expect(session.lives).toBe(SHIP.lives);
  });

  it('moves on to the next wave once the boss falls', () => {
    play.boss.hp = 1;
    shoot(eye);
    play.update(1 / 60, idle);
    expect(play.boss).toBeNull();
    expect(session.wave).toBe(every + 1);
    expect(session.score).toBe(BOSSES[BOSSES.roster[0]].points);
    expect(heard.map(([name]) => name)).toContain('boss-down');
  });

  it('leaves with a fresh start', () => {
    play.start();
    expect(play.boss).toBeNull();
  });
});
