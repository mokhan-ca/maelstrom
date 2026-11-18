export default class Sfx {
  constructor(mixer) {
    this.mixer = mixer;
  }

  laser() {
    this.#tone({ type: 'square', from: 1400, to: 300, seconds: 0.09, volume: 0.12 });
  }

  explosion() {
    this.#noise({ from: 2400, to: 80, seconds: 0.45, volume: 0.5 });
    this.#tone({ type: 'sine', from: 160, to: 40, seconds: 0.3, volume: 0.4 });
  }

  hit() {
    this.#tone({ type: 'sawtooth', from: 420, to: 40, seconds: 0.6, volume: 0.35 });
    this.#noise({ from: 1200, to: 60, seconds: 0.6, volume: 0.5 });
  }

  powerup() {
    [523, 659, 784, 1047].forEach((note, index) =>
      this.#tone({ type: 'triangle', from: note, to: note, seconds: 0.09, volume: 0.25, delay: index * 0.06 }));
  }

  extraLife() {
    [784, 988, 1175, 1568].forEach((note, index) =>
      this.#tone({ type: 'square', from: note, to: note, seconds: 0.1, volume: 0.12, delay: index * 0.08 }));
  }

  gameOver() {
    [392, 330, 262, 196].forEach((note, index) =>
      this.#tone({ type: 'sawtooth', from: note, to: note * 0.97, seconds: 0.28, volume: 0.2, delay: index * 0.22 }));
  }

  get #live() {
    return this.mixer.ready;
  }

  #tone({ type, from, to, seconds, volume, delay = 0 }) {
    if (!this.#live) return;
    const { context, sfx } = this.mixer;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, start);
    oscillator.frequency.exponentialRampToValueAtTime(to, start + seconds);
    oscillator.connect(this.#envelope(volume, start, seconds)).connect(sfx);
    oscillator.start(start);
    oscillator.stop(start + seconds);
  }

  #noise({ from, to, seconds, volume }) {
    if (!this.#live) return;
    const { context, sfx } = this.mixer;
    const start = context.currentTime;
    const source = context.createBufferSource();
    source.buffer = this.mixer.noise();
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(from, start);
    filter.frequency.exponentialRampToValueAtTime(to, start + seconds);
    source.connect(filter).connect(this.#envelope(volume, start, seconds)).connect(sfx);
    source.start(start);
    source.stop(start + seconds);
  }

  #envelope(volume, start, seconds) {
    const gain = this.mixer.context.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    return gain;
  }
}
