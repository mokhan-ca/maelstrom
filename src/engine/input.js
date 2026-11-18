const AXES = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
};
const FIRE = ['Space', 'KeyJ', 'KeyZ'];
const ACTIONS = {
  Enter: 'confirm',
  NumpadEnter: 'confirm',
  KeyP: 'pause',
  Escape: 'pause',
  KeyM: 'mute',
};
const GAME_KEYS = new Set([...Object.values(AXES).flat(), ...FIRE]);
const BUTTON_KEYS = new Set(['Enter', 'NumpadEnter', 'Space']);

const pressingButton = (event) => BUTTON_KEYS.has(event.code) && event.target?.closest?.('button');

export default class Input {
  constructor({ keyTarget = window, pointerTarget, worldScale = () => 1 } = {}) {
    this.keys = new Set();
    this.actions = new Set();
    this.pointerId = null;
    this.lastPointer = null;
    this.dragX = 0;
    this.dragY = 0;
    this.worldScale = worldScale;
    this.usedTouch = false;

    keyTarget.addEventListener('keydown', (event) => this.onKeydown(event));
    keyTarget.addEventListener('keyup', (event) => this.keys.delete(event.code));
    keyTarget.addEventListener('blur', () => this.releaseAll());

    if (pointerTarget) {
      const options = { passive: false };
      pointerTarget.addEventListener('pointerdown', (event) => this.onPointerDown(event), options);
      pointerTarget.addEventListener('pointermove', (event) => this.onPointerMove(event), options);
      pointerTarget.addEventListener('pointerup', (event) => this.onPointerUp(event), options);
      pointerTarget.addEventListener('pointercancel', (event) => this.onPointerUp(event), options);
      pointerTarget.addEventListener('lostpointercapture', (event) => this.onPointerUp(event));
      pointerTarget.addEventListener('contextmenu', (event) => event.preventDefault());
    }
  }

  onKeydown(event) {
    if (pressingButton(event)) return;
    if (GAME_KEYS.has(event.code) || ACTIONS[event.code]) event.preventDefault();
    if (event.repeat) return;
    this.keys.add(event.code);
    const action = ACTIONS[event.code];
    if (action) this.actions.add(action);
  }

  onPointerDown(event) {
    event.preventDefault();
    if (event.pointerType === 'touch') this.usedTouch = true;
    if (this.pointerId !== null) return;
    this.pointerId = event.pointerId;
    this.lastPointer = { x: event.clientX, y: event.clientY };
    event.target.setPointerCapture?.(event.pointerId);
  }

  onPointerMove(event) {
    if (event.pointerId !== this.pointerId) return;
    event.preventDefault();
    const scale = this.worldScale() || 1;
    this.dragX += (event.clientX - this.lastPointer.x) / scale;
    this.dragY += (event.clientY - this.lastPointer.y) / scale;
    this.lastPointer = { x: event.clientX, y: event.clientY };
  }

  onPointerUp(event) {
    if (event.pointerId !== this.pointerId) return;
    this.pointerId = null;
    this.lastPointer = null;
  }

  releaseAll() {
    this.keys.clear();
    this.pointerId = null;
    this.lastPointer = null;
    this.dragX = 0;
    this.dragY = 0;
  }

  isDown(codes) {
    return codes.some((code) => this.keys.has(code));
  }

  get axis() {
    let x = 0;
    let y = 0;
    if (this.isDown(AXES.left)) x -= 1;
    if (this.isDown(AXES.right)) x += 1;
    if (this.isDown(AXES.up)) y -= 1;
    if (this.isDown(AXES.down)) y += 1;
    if (x && y) {
      x *= Math.SQRT1_2;
      y *= Math.SQRT1_2;
    }
    return { x, y };
  }

  get pointerDown() {
    return this.pointerId !== null;
  }

  get firing() {
    return this.isDown(FIRE) || this.pointerDown;
  }

  takeDrag() {
    const drag = { x: this.dragX, y: this.dragY };
    this.dragX = 0;
    this.dragY = 0;
    return drag;
  }

  consume(action) {
    return this.actions.delete(action);
  }

  reset() {
    this.actions.clear();
    this.takeDrag();
  }
}
