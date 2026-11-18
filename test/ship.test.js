import Ship from '../src/entities/ship.js';

const idle = { axis: { x: 0, y: 0 }, takeDrag: () => ({ x: 0, y: 0 }) };

describe('Ship', () => {
  let ship;

  beforeEach(() => {
    ship = new Ship();
  });

  it('reports a power the moment it wears off', () => {
    ship.powerUp('shield');
    expect(ship.update(1, idle)).toEqual([]);
    expect(ship.update(10, idle)).toEqual(['shield']);
    expect(ship.update(1, idle)).toEqual([]);
  });

  it('boosts spread and rapid fire together', () => {
    ship.boost(30);
    expect(ship.powers).toMatchObject({ spread: 30, rapid: 30, shield: 0 });
  });

  it('shrugs off hits while shielded or recovering', () => {
    expect(ship.vulnerable).toBe(true);
    ship.hit();
    expect(ship.vulnerable).toBe(false);
  });
});
