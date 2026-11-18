import Voices from './voices.js';
import { note } from './scale.js';

export default class Sfx {
  constructor(mixer, rng = Math.random) {
    this.mixer = mixer;
    this.rng = rng;
    this.voices = new Voices(mixer, () => mixer.sfx);
    this.splats = [];
  }

  laser() {
    const sweep = 1 + (this.rng() - 0.5) * 0.15;
    this.#play((voices, time) => voices.noise({ type: 'bandpass', from: 1800 * sweep, to: 5200 * sweep, time, length: 0.07, volume: 0.22, q: 2 }));
  }

  explosion() {
    if (!this.#roomForSplat()) return;
    this.#play((voices, time) => {
      voices.tone({ from: 130, to: 48, time, length: 0.22, volume: 0.6 });
      voices.noise({ from: 2200, to: 300, time, length: 0.09, volume: 0.35 });
    });
  }

  hit() {
    this.#gong(98, 0.45, 1.6);
  }

  swallow() {
    this.#play((voices, time) => voices.noise({ type: 'bandpass', from: 2600, to: 160, time, length: 0.6, volume: 0.35, q: 3 }));
  }

  charge() {
    this.#play((voices, time) => voices.tone({ type: 'sawtooth', from: 180, to: 520, time, length: 0.25, volume: 0.12, cutoff: 1400 }));
  }

  powerup() {
    this.#strum([0, 2, 3, 5], 1, 0.07);
  }

  extraLife() {
    this.#strum([0, 2, 3, 5, 7], 2, 0.09);
  }

  expire() {
    this.#strum([3, 1], 1, 0.12);
  }

  combo(multiplier) {
    this.#play((voices, time) => {
      voices.tone({ type: 'triangle', from: 700 + multiplier * 60, time, length: 0.06, volume: 0.3 });
      voices.noise({ type: 'bandpass', from: 2400, time, length: 0.02, volume: 0.2, q: 4 });
    });
  }

  comboBroken() {
    this.#play((voices, time) => voices.tone({ type: 'triangle', from: 260, to: 180, time, length: 0.12, volume: 0.3 }));
  }

  gameOver() {
    this.#gong(73, 0.5, 3);
    this.#strum([4, 3, 1, 0], -1, 0.35);
  }

  #gong(fundamental, volume, length) {
    this.#play((voices, time) => {
      for (const [ratio, share] of [[1, 1], [2.76, 0.5], [5.4, 0.25], [8.93, 0.12]]) {
        voices.tone({ from: fundamental * ratio, to: fundamental * ratio * 0.99, time, length: length / ratio ** 0.3, volume: volume * share });
      }
    });
  }

  #strum(degrees, octave, gap) {
    this.#play((voices, time) => degrees.forEach((degree, index) =>
      voices.pluck({ frequency: note(degree, octave), time: time + index * gap, volume: 0.5 })));
  }

  #play(sound) {
    if (this.mixer.ready) sound(this.voices, this.mixer.now);
  }

  #roomForSplat() {
    const now = this.mixer.ready ? this.mixer.now : 0;
    this.splats = this.splats.filter((end) => end > now);
    if (this.splats.length >= 3) return false;
    this.splats.push(now + 0.25);
    return true;
  }
}
