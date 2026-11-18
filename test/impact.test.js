import Impact from '../src/scenes/impact.js';

describe('Impact', () => {
  let impact;

  beforeEach(() => {
    impact = new Impact({ rng: () => 1 });
  });

  it('freezes the game for the longest jolt', () => {
    impact.jolt(0.25, 20);
    impact.jolt(0.03, 5);
    expect(impact).toMatchObject({ freeze: 0.25, shake: 20 });
  });

  it('lets a wound cut a longer freeze short', () => {
    impact.jolt(0.25, 20);
    impact.wound();
    expect(impact).toMatchObject({ freeze: 0.12, shake: 18, flash: 1 });
  });

  it('holds still until the freeze thaws', () => {
    impact.jolt(0.1);
    expect(impact.frozen(0.06)).toBe(true);
    expect(impact.frozen(0.06)).toBe(true);
    expect(impact.frozen(0.06)).toBe(false);
  });

  it('settles the shake and flash over time', () => {
    impact.wound();
    impact.settle(1);
    expect(impact).toMatchObject({ shake: 0, flash: 0 });
    expect(impact.offset).toEqual({ x: 0, y: 0 });
  });
});
