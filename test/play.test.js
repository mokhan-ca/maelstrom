import Play from '../src/scenes/play.js';
import Session from '../src/session.js';
import EventAggregator from '../src/engine/event-aggregator.js';

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
    play.enemies.spawn('drifter', 1);
    const [enemy] = play.enemies;
    play.lasers.fire(enemy.x, enemy.y + 5, 0, 0);
    session.lives = 1;
    session.hitPlayer();

    play.update(1 / 60, idle);

    expect(session.score).toBe(0);
  });

  it('scores a laser hit while playing', () => {
    play.enemies.spawn('drifter', 1);
    const [enemy] = play.enemies;
    play.lasers.fire(enemy.x, enemy.y + 5, 0, 0);

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
    play.enemies.spawn('drifter', 1);
    const [enemy] = play.enemies;
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
    play.powerups.maybeDrop(100, 100, session.kills);
    expect([...play.powerups]).toHaveLength(1);
  });
});
