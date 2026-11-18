import Arena from '../src/scenes/arena.js';
import Skirmish from '../src/scenes/skirmish.js';
import Session from '../src/session.js';
import EventAggregator from '../src/engine/event-aggregator.js';
import { ENEMIES } from '../src/config.js';

describe('Skirmish', () => {
  let arena;
  let skirmish;
  let hurts;

  const enemyAt = (x, y) => {
    arena.enemies.spawn('drifter', 1);
    const [enemy] = arena.enemies;
    Object.assign(enemy, { x, y });
    return enemy;
  };

  beforeEach(() => {
    arena = new Arena({ session: new Session(), events: new EventAggregator(), rng: () => 0.5 });
    arena.clear(1);
    hurts = 0;
    skirmish = new Skirmish(arena, { hurt: () => hurts++ });
  });

  it('scores a laser that finds an enemy and jolts the screen', () => {
    const enemy = enemyAt(100, 100);
    arena.lasers.fire(enemy.x, enemy.y, 0, 0);
    skirmish.collide();
    expect(arena.session.score).toBe(ENEMIES.drifter.points);
    expect(arena.impact.freeze).toBeGreaterThan(0);
  });

  it('hurts a ship that runs into an enemy', () => {
    enemyAt(arena.ship.x, arena.ship.y);
    skirmish.collide();
    expect(hurts).toBe(1);
  });

  it('lets the shield destroy what it touches', () => {
    arena.ship.powerUp('shield');
    const enemy = enemyAt(arena.ship.x, arena.ship.y);
    skirmish.collide();
    expect(hurts).toBe(0);
    expect(enemy.active).toBe(false);
    expect(arena.session.kills).toBe(1);
  });
});
