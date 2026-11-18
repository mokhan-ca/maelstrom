import { overlaps, eachCollision } from '../src/engine/collision.js';
import Pool from '../src/engine/pool.js';
import Loop from '../src/engine/loop.js';
import { load, save } from '../src/storage.js';

const circle = (x, y, radius = 10) => ({ active: true, x, y, radius });

describe('collision', () => {
  it('detects overlapping circles', () => {
    expect(overlaps(circle(0, 0), circle(15, 0))).toBe(true);
    expect(overlaps(circle(0, 0), circle(25, 0))).toBe(false);
  });

  it('visits each pair once', () => {
    const hits = [];
    eachCollision([circle(0, 0)], [circle(5, 0), circle(100, 0)], (a, b) => hits.push(b.x));
    expect(hits).toEqual([5]);
  });

  it('skips inactive things', () => {
    const ghost = { ...circle(0, 0), active: false };
    const hits = [];
    eachCollision([ghost], [circle(0, 0)], () => hits.push(1));
    expect(hits).toEqual([]);
  });

  it('stops checking a shot that was consumed', () => {
    const hits = [];
    eachCollision([circle(0, 0)], [circle(1, 0), circle(2, 0)], (a, b) => hits.push(b.x) && true);
    expect(hits).toEqual([1]);
  });
});

describe('Pool', () => {
  it('reuses released objects', () => {
    const pool = new Pool(() => ({}));
    const first = pool.spawn((item) => (item.name = 'first'));
    first.active = false;
    const second = pool.spawn((item) => (item.name = 'second'));
    expect(second).toBe(first);
    expect([...pool]).toEqual([second]);
  });

  it('respects its limit', () => {
    const pool = new Pool(() => ({}), 1);
    pool.spawn(() => {});
    expect(pool.spawn(() => {})).toBeNull();
    expect(pool.count).toBe(1);
  });
});

describe('Loop', () => {
  it('updates in fixed steps regardless of frame rate', () => {
    const steps = [];
    const loop = new Loop({ update: (dt) => steps.push(dt), render: () => {}, step: 0.01, raf: () => {}, now: () => 0 });
    loop.start();
    loop.tick(0.035);
    expect(steps).toEqual([0.01, 0.01, 0.01]);
  });

  it('caps long frames so a background tab does not explode', () => {
    let updates = 0;
    const loop = new Loop({ update: () => updates++, render: () => {}, step: 0.25, maxFrame: 1, raf: () => {}, now: () => 0 });
    loop.start();
    loop.tick(10);
    expect(updates).toBe(4);
  });
});

describe('storage', () => {
  const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };

  it('round trips values', () => {
    const memory = new Map();
    const store = { getItem: (key) => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };
    save('best', 42, store);
    expect(load('best', 0, store)).toBe(42);
  });

  it('falls back when storage is unavailable', () => {
    expect(load('best', 7, broken)).toBe(7);
    expect(save('best', 1, broken)).toBe(false);
  });
});
