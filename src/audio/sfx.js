export default class Sfx {
  constructor(mixer, rng = Math.random) {
    this.mixer = mixer;
    this.rng = rng;
    this.explosions = [];
  }

  laser() {
    const pitch = 1 + (this.rng() - 0.5) * 0.12;
    this.#tone({ type: 'square', from: 1400 * pitch, to: 300 * pitch, seconds: 0.09, volume: 0.1 });
  }

  explosion() {
    if (!this.#roomForExplosion()) return;
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

  swallow() {
    this.#noise({ from: 3000, to: 120, seconds: 0.5, volume: 0.3 });
  }

  charge() {
    this.#tone({ type: 'sine', from: 200, to: 800, seconds: 0.25, volume: 0.12 });
  }

  expire() {
    this.#tone({ type: 'triangle', from: 660, to: 220, seconds: 0.3, volume: 0.18 });
  }

  combo(multiplier) {
    const note = 440 * 2 ** (multiplier / 6);
    this.#tone({ type: 'triangle', from: note, to: note * 1.5, seconds: 0.18, volume: 0.2 });
  }

  comboBroken() {
    this.#tone({ type: 'square', from: 330, to: 110, seconds: 0.25, volume: 0.12 });
  }

  gameOver() {
    [392, 330, 262, 196].forEach((note, index) =>
      this.#tone({ type: 'sawtooth', from: note, to: note * 0.97, seconds: 0.28, volume: 0.2, delay: index * 0.22 }));
  }

  #roomForExplosion() {
    if (!this.#live) return false;
    const now = this.mixer.now;
    this.explosions = this.explosions.filter((end) => end > now);
    if (this.explosions.length >= 3) return false;
    this.explosions.push(now + 0.45);
    return true;
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
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    return gain;
  }
}
