const SEQUENCE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'].join();

export default class Konami {
  constructor(onUnlock) {
    this.onUnlock = onUnlock;
    this.recent = [];
  }

  press(code) {
    this.recent = [...this.recent, code].slice(-10);
    if (this.recent.join() !== SEQUENCE) return;
    this.recent = [];
    this.onUnlock();
  }
}
