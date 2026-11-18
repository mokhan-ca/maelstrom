import Konami from '../src/konami.js';

const CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];

describe('Konami', () => {
  let unlocks;
  let konami;

  beforeEach(() => {
    unlocks = 0;
    konami = new Konami(() => unlocks++);
  });

  it('unlocks on the full sequence', () => {
    CODE.forEach((code) => konami.press(code));
    expect(unlocks).toBe(1);
  });

  it('starts over after a wrong key', () => {
    [...CODE.slice(0, 5), 'KeyX', ...CODE.slice(5)].forEach((code) => konami.press(code));
    expect(unlocks).toBe(0);
  });

  it('forgives an extra up at the start', () => {
    ['ArrowUp', ...CODE].forEach((code) => konami.press(code));
    expect(unlocks).toBe(1);
  });
});
