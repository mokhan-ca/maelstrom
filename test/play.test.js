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
