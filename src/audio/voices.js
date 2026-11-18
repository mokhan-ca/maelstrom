export default class Voices {
  constructor(mixer, output) {
    this.mixer = mixer;
    this.output = output;
  }

  get context() {
    return this.mixer.context;
  }

  tone({ type = 'sine', from, to = from, time, length, volume, cutoff }) {
    const oscillator = this.context.createOscillator();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, time);
    oscillator.frequency.exponentialRampToValueAtTime(to, time + length);
    const chain = cutoff ? oscillator.connect(this.#lowpass(cutoff, time, length)) : oscillator;
    chain.connect(this.envelope(volume, time, length)).connect(this.output());
    oscillator.start(time);
    oscillator.stop(time + length);
  }

  noise({ type = 'lowpass', from, to = from, time, length, volume, q = 1 }) {
    const source = this.context.createBufferSource();
    source.buffer = this.mixer.noise();
    const filter = this.context.createBiquadFilter();
    filter.type = type;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(from, time);
    filter.frequency.exponentialRampToValueAtTime(to, time + length);
    source.connect(filter).connect(this.envelope(volume, time, length)).connect(this.output());
    source.start(time);
    source.stop(time + length);
  }

  pluck({ frequency, time, volume, length = 1.2, echo }) {
    const source = this.context.createBufferSource();
    source.buffer = this.mixer.string(frequency);
    const gain = this.context.createGain();
    gain.gain.value = volume;
    source.connect(gain).connect(this.output());
    if (echo) gain.connect(echo);
    source.start(time);
    source.stop(time + length);
  }

  envelope(volume, time, length) {
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
    return gain;
  }

  #lowpass(cutoff, time, length) {
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, time);
    filter.frequency.exponentialRampToValueAtTime(cutoff / 3, time + length);
    return filter;
  }
}
