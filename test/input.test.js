import Input from '../src/engine/input.js';

const key = (type, code, extra = {}) => new KeyboardEvent(type, { code, cancelable: true, ...extra });
const pointer = (type, x, y, extra = {}) => Object.assign(new Event(type, { cancelable: true }), { pointerId: 1, pointerType: 'touch', clientX: x, clientY: y, ...extra });

describe('Input', () => {
  let keyTarget;
  let pointerTarget;
  let input;

  beforeEach(() => {
    keyTarget = new EventTarget();
    pointerTarget = new EventTarget();
    input = new Input({ keyTarget, pointerTarget, worldScale: () => 2 });
  });

  it('reads the keyboard as a normalized axis', () => {
    keyTarget.dispatchEvent(key('keydown', 'ArrowRight'));
    keyTarget.dispatchEvent(key('keydown', 'KeyW'));
    expect(input.axis.x).toBeCloseTo(Math.SQRT1_2);
    expect(input.axis.y).toBeCloseTo(-Math.SQRT1_2);
  });

  it('fires while space is held', () => {
    keyTarget.dispatchEvent(key('keydown', 'Space'));
    expect(input.firing).toBe(true);
    keyTarget.dispatchEvent(key('keyup', 'Space'));
    expect(input.firing).toBe(false);
  });

  it('turns key presses into one-shot actions', () => {
    keyTarget.dispatchEvent(key('keydown', 'KeyP'));
    expect(input.consume('pause')).toBe(true);
    expect(input.consume('pause')).toBe(false);
  });

  it('ignores key repeat for actions', () => {
    keyTarget.dispatchEvent(key('keydown', 'Enter', { repeat: true }));
    expect(input.consume('confirm')).toBe(false);
  });

  it('converts a drag into world units and fires while touching', () => {
    pointerTarget.dispatchEvent(pointer('pointerdown', 100, 100));
    pointerTarget.dispatchEvent(pointer('pointermove', 120, 90));
    expect(input.firing).toBe(true);
    expect(input.usedTouch).toBe(true);
    expect(input.takeDrag()).toEqual({ x: 10, y: -5 });
    expect(input.takeDrag()).toEqual({ x: 0, y: 0 });
    pointerTarget.dispatchEvent(pointer('pointerup', 120, 90));
    expect(input.firing).toBe(false);
  });

  it('follows only the first finger', () => {
    pointerTarget.dispatchEvent(pointer('pointerdown', 0, 0));
    pointerTarget.dispatchEvent(pointer('pointermove', 50, 50, { pointerId: 2 }));
    expect(input.takeDrag()).toEqual({ x: 0, y: 0 });
  });

  it('lets focused buttons keep Enter and Space', () => {
    const button = document.createElement('button');
    const event = key('keydown', 'Enter');
    Object.defineProperty(event, 'target', { value: button });
    keyTarget.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(input.consume('confirm')).toBe(false);
  });

  it('stops firing when the pointer capture is lost', () => {
    pointerTarget.dispatchEvent(pointer('pointerdown', 0, 0));
    pointerTarget.dispatchEvent(pointer('lostpointercapture', 0, 0));
    expect(input.firing).toBe(false);
  });

  it('forgets stale drags on reset', () => {
    pointerTarget.dispatchEvent(pointer('pointerdown', 0, 0));
    pointerTarget.dispatchEvent(pointer('pointermove', 80, 0));
    input.reset();
    expect(input.takeDrag()).toEqual({ x: 0, y: 0 });
  });
});
