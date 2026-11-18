const BPM = 128;
const STEP = 60 / BPM / 4;
const LOOKAHEAD = 0.12;
const VOLUME = 0.35;

const A = 55;
const PROGRESSION = [
  { root: A, chord: [0, 3, 7, 12] },
  { root: A * 2 ** (8 / 12), chord: [0, 4, 7, 12] },
  { root: A * 2 ** (3 / 12), chord: [0, 4, 7, 12] },
  { root: A * 2 ** (10 / 12), chord: [0, 4, 7, 12] },
];
const BASS = [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0];
const ARP = [0, 1, 2, 3, 2, 1, 2, 3, 0, 1, 2, 3, 3, 2, 1, 2];
const LEAD = [12, null, null, 10, null, 7, null, null, 12, null, 15, null, 14, null, 10, null];

const semitones = (frequency, steps) => frequency * 2 ** (steps / 12);

export default class Music {
  constructor(mixer) {
    this.mixer = mixer;
    this.timer = null;
    this.intensity = 1;
  }

  start() {
    if (!this.mixer.context) return;
    this.stop();
    this.#routing();
    this.mixer.music.gain.cancelScheduledValues(this.mixer.now);
    this.mixer.music.gain.setValueAtTime(VOLUME, this.mixer.now);
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

  fadeOut(seconds = 1.4) {
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
    const now = this.mixer.now;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(VOLUME * 0.3, now);
    gain.linearRampToValueAtTime(VOLUME, now + 0.8);
  }

  intensify(wave) {
    this.intensity = wave;
  }

  #routing() {
    if (this.echo) return;
    const { context, music } = this.mixer;
    this.echo = context.createDelay();
    this.echo.delayTime.value = STEP * 3;
    const feedback = context.createGain();
    feedback.gain.value = 0.3;
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
    const { root, chord } = PROGRESSION[Math.floor(step / 16) % PROGRESSION.length];
    const warm = step >= 64;
    const busy = this.intensity >= 3;
    const soaring = this.intensity >= 5;

    if (BASS[beat]) this.#voice({ type: 'sawtooth', frequency: root, time, length: STEP * 0.9, volume: 0.35, cutoff: 600 });
    if (warm || beat % 2 === 0) this.#arp(semitones(root * 4, chord[ARP[beat]]), time);
    if (soaring && LEAD[beat] !== null) this.#voice({ type: 'triangle', frequency: semitones(root * 8, LEAD[beat]), time, length: STEP * 1.8, volume: 0.12, cutoff: 5000 });
    if (beat % 4 === 0) this.#kick(time);
    if (warm && beat % 8 === 4) this.#snare(time);
    if (busy || beat % 2 === 0) this.#hat(time, beat % 4 === 2 ? 0.08 : 0.04);
  }

  #arp(frequency, time) {
    const voice = this.#voice({ type: 'square', frequency, time, length: STEP * 0.8, volume: 0.09, cutoff: 3200 });
    voice.connect(this.echo);
  }

  #voice({ type, frequency, time, length, volume, cutoff }) {
    const { context, music } = this.mixer;
    const oscillator = context.createOscillator();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, time);
    filter.frequency.exponentialRampToValueAtTime(cutoff / 4, time + length);
    const output = oscillator.connect(filter).connect(this.#envelope(volume, time, length));
    output.connect(music);
    oscillator.start(time);
    oscillator.stop(time + length);
    return output;
  }

  #kick(time) {
    const { context, music } = this.mixer;
    const oscillator = context.createOscillator();
    oscillator.frequency.setValueAtTime(150, time);
    oscillator.frequency.exponentialRampToValueAtTime(40, time + 0.15);
    oscillator.connect(this.#envelope(0.8, time, 0.2)).connect(music);
    oscillator.start(time);
    oscillator.stop(time + 0.2);
  }

  #snare(time) {
    this.#noise(time, 0.18, 0.35, 'bandpass', 1800);
  }

  #hat(time, volume) {
    this.#noise(time, 0.04, volume, 'highpass', 7000);
  }

  #noise(time, length, volume, type, frequency) {
    const { context, music } = this.mixer;
    const source = context.createBufferSource();
    source.buffer = this.mixer.noise();
    const filter = context.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    source.connect(filter).connect(this.#envelope(volume, time, length)).connect(music);
    source.start(time);
    source.stop(time + length);
  }

  #envelope(volume, time, length) {
    const gain = this.mixer.context.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
    return gain;
  }
}
