import Vortex from '../src/entities/vortex.js';
import { VORTEX } from '../src/config.js';

describe('Vortex', () => {
  let vortex;

  const awake = () => {
    vortex.awaken(VORTEX.fromWave);
    vortex.update(2);
    vortex.x = 100;
    vortex.y = 100;
  };

  beforeEach(() => {
    vortex = new Vortex();
  });

  it('sleeps through the first wave', () => {
    vortex.awaken(1);
    expect(vortex.active).toBe(false);
    expect(vortex.pull({ x: 110, y: 100 }, 1, 1)).toEqual({ x: 0, y: 0 });
  });

  it('pulls nearby bodies toward its centre', () => {
    awake();
    const nudge = vortex.pull({ x: 200, y: 100 }, 0.1, 1);
    expect(nudge.x).toBeLessThan(0);
  });

  it('swirls in one direction', () => {
    awake();
    const fromRight = vortex.pull({ x: 200, y: 100 }, 0.1, 1);
    const fromLeft = vortex.pull({ x: 0, y: 100 }, 0.1, 1);
    expect(Math.sign(fromRight.y)).toBe(-Math.sign(fromLeft.y));
  });

  it('ignores bodies beyond its reach', () => {
    awake();
    expect(vortex.pull({ x: 100 + VORTEX.reach + 1, y: 100 }, 1, 1)).toEqual({ x: 0, y: 0 });
  });

  it('pulls lighter bodies less', () => {
    awake();
    const heavy = vortex.pull({ x: 200, y: 100 }, 0.1, 1);
    const light = vortex.pull({ x: 200, y: 100 }, 0.1, 0.35);
    expect(Math.abs(light.x)).toBeLessThan(Math.abs(heavy.x));
  });

  it('grows stronger each wave up to a limit', () => {
    vortex.awaken(VORTEX.fromWave);
    const early = vortex.speed;
    vortex.awaken(99);
    expect(vortex.speed).toBeGreaterThan(early);
    expect(vortex.speed).toBe(VORTEX.maxSpeed);
  });

  it('swallows what reaches its core', () => {
    awake();
    expect(vortex.swallows({ x: 105, y: 100 })).toBe(true);
    expect(vortex.swallows({ x: 140, y: 100 })).toBe(false);
  });

  it('stays hidden while asleep', () => {
    vortex.update(5);
    expect(vortex.presence).toBe(0);
  });
});
