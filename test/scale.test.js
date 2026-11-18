import { note } from '../src/audio/scale.js';

describe('note', () => {
  it('starts the scale on D', () => {
    expect(note(0)).toBeCloseTo(146.83);
  });

  it('wraps into the next octave after five degrees', () => {
    expect(note(5)).toBeCloseTo(note(0) * 2, 1);
    expect(note(0, 1)).toBeCloseTo(note(0) * 2, 1);
  });

  it('walks the in scale', () => {
    expect(note(1) / note(0)).toBeCloseTo(2 ** (1 / 12), 3);
    expect(note(2) / note(0)).toBeCloseTo(2 ** (5 / 12), 3);
  });
});
