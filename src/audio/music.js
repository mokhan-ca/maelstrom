const BPM = 112;
const STEP = 60 / BPM / 4;
const LOOKAHEAD = 0.12;

const A = 55;
const PROGRESSION = [
  { root: A, chord: [0, 3, 7, 12] },
  { root: A * 2 ** (8 / 12), chord: [0, 4, 7, 12] },
  { root: A * 2 ** (3 / 12), chord: [0, 4, 7, 12] },
  { root: A * 2 ** (10 / 12), chord: [0, 4, 7, 12] },
];
const BASS = [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0];
const ARP = [0, 1, 2, 3, 2, 1, 2, 3, 0, 1, 2, 3, 3, 2, 1, 2];

const semitones = (frequency, steps) => frequency * 2 ** (steps / 12);

export default class Music {
  constructor(mixer) {
    this.mixer = mixer;
    this.timer = null;
  }

  start() {
    if (this.timer || !this.mixer.context) return;
    this.step = 0;
    this.nextNote = this.mixer.now + 0.05;
    this.timer = setInterval(() => this.#schedule(), 25);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
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
    const intro = step < 64;

    if (BASS[beat]) this.#voice({ type: 'sawtooth', frequency: root, time, length: STEP * 0.9, volume: 0.35, cutoff: 600 });
    if (!intro || beat % 2 === 0) this.#voice({ type: 'square', frequency: semitones(root * 4, chord[ARP[beat]]), time, length: STEP * 0.8, volume: 0.09, cutoff: 3200 });
    if (beat % 4 === 0) this.#kick(time);
    if (!intro && beat % 8 === 4) this.#snare(time);
    if (beat % 2 === 0) this.#hat(time, beat % 4 === 2 ? 0.08 : 0.04);
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
    oscillator.connect(filter).connect(this.#envelope(volume, time, length)).connect(music);
    oscillator.start(time);
    oscillator.stop(time + length);
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
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
    return gain;
  }
}
