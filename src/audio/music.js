import Voices from './voices.js';
import { note } from './scale.js';

const BPM = 92;
const STEP = 60 / BPM / 4;
const LOOKAHEAD = 0.15;
const VOLUME = 0.4;

const ODAIKO = [1, 0, 0, 0, 0, 0, 0.6, 0, 0.8, 0, 0, 0.5, 0, 0, 0, 0];
const SHIME = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0.6, 0];
const SHIME_FAST = [0.5, 0, 0.4, 0, 1, 0, 0.4, 0.3, 0.5, 0, 0.4, 0, 1, 0.3, 0.6, 0.4];
const STRINGS = [0, null, null, 2, null, null, 1, null, 0, null, null, 3, null, 2, null, null];
const MELODY = [
  [5, null, null, null, 7, null, 6, null, 5, null, null, null, 3, null, null, null],
  [4, null, null, 5, null, null, 3, null, 2, null, null, null, 1, null, 0, null],
];

export default class Music {
  constructor(mixer) {
    this.mixer = mixer;
    this.voices = new Voices(mixer, () => mixer.music);
    this.timer = null;
    this.intensity = 1;
  }

  start() {
    if (!this.mixer.context) return;
    this.stop();
    this.#routing();
    this.#volume(VOLUME);
    this.intensity = 1;
    this.step = 0;
    this.nextNote = this.mixer.now + 0.05;
    this.timer = setInterval(() => this.#schedule(), 25);
  }

  stop() {
    clearTimeout(this.fading);
    clearInterval(this.timer);
    this.timer = null;
  }

  fadeOut(seconds = 2) {
    if (!this.timer) return;
    const { gain } = this.mixer.music;
    gain.cancelScheduledValues(this.mixer.now);
    gain.setValueAtTime(gain.value, this.mixer.now);
    gain.linearRampToValueAtTime(0, this.mixer.now + seconds);
    this.fading = setTimeout(() => this.stop(), seconds * 1000);
  }

  duck() {
    if (!this.timer) return;
    const { gain } = this.mixer.music;
    gain.cancelScheduledValues(this.mixer.now);
    gain.setValueAtTime(VOLUME * 0.3, this.mixer.now);
    gain.linearRampToValueAtTime(VOLUME, this.mixer.now + 0.8);
  }

  intensify(wave) {
    this.intensity = wave;
  }

  #volume(value) {
    const { gain } = this.mixer.music;
    gain.cancelScheduledValues(this.mixer.now);
    gain.setValueAtTime(value, this.mixer.now);
  }

  #routing() {
    if (this.echo) return;
    const { context, music } = this.mixer;
    this.echo = context.createDelay();
    this.echo.delayTime.value = STEP * 3;
    const feedback = context.createGain();
    feedback.gain.value = 0.28;
    this.echo.connect(feedback).connect(this.echo);
    this.echo.connect(music);
  }

  #schedule() {
    while (this.nextNote < this.mixer.now + LOOKAHEAD) {
      this.#play(this.step, this.nextNote);
      this.nextNote += STEP;
      this.step++;
    }
  }

  #play(step, time) {
    const beat = step % 16;
    const bar = Math.floor(step / 16);
    const stirring = this.intensity >= 2;
    const restless = this.intensity >= 3;
    const soaring = this.intensity >= 5;

    if (ODAIKO[beat]) this.#odaiko(time, ODAIKO[beat]);
    const shime = restless ? SHIME_FAST : SHIME;
    if (shime[beat]) this.#shime(time, shime[beat]);
    if (stirring && beat === 0 && bar % 2 === 0) this.#drone(time);
    if (stirring && STRINGS[beat] !== null) this.voices.pluck({ frequency: note(STRINGS[beat], -1), time, volume: 0.4, echo: this.echo });
    const phrase = MELODY[bar % MELODY.length][beat];
    if (soaring && phrase !== null) this.voices.pluck({ frequency: note(phrase, 1), time, volume: 0.35, echo: this.echo });
  }

  #odaiko(time, accent) {
    this.voices.tone({ from: 72, to: 42, time, length: 0.5, volume: 0.9 * accent });
    this.voices.noise({ from: 900, to: 120, time, length: 0.08, volume: 0.25 * accent });
  }

  #shime(time, accent) {
    this.voices.tone({ type: 'triangle', from: 420, to: 300, time, length: 0.06, volume: 0.18 * accent });
    this.voices.noise({ type: 'bandpass', from: 2600, time, length: 0.03, volume: 0.15 * accent, q: 3 });
  }

  #drone(time) {
    const length = STEP * 32;
    for (const [frequency, volume] of [[note(0, -2), 0.07], [note(3, -2), 0.04]]) {
      this.voices.tone({ type: 'sawtooth', from: frequency, time, length, volume, cutoff: 500 });
    }
  }
}
