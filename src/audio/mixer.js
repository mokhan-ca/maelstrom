import pluck from './pluck.js';

export default class Mixer {
  constructor({ muted = false } = {}) {
    this.muted = muted;
    this.context = null;
  }

  unlock() {
    if (!this.context) this.#build();
    this.resume();
  }

  resume() {
    if (this.context?.state !== 'running') this.context?.resume();
  }

  suspend() {
    this.context?.suspend();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.volume;
    return this.muted;
  }

  get volume() {
    return this.muted ? 0 : 0.8;
  }

  get ready() {
    return this.context?.state === 'running';
  }

  get now() {
    return this.context.currentTime;
  }

  string(frequency) {
    this.strings ??= new Map();
    if (!this.strings.has(frequency)) this.strings.set(frequency, this.#buffer(pluck({ sampleRate: this.context.sampleRate, frequency })));
    return this.strings.get(frequency);
  }

  noise(seconds = 1) {
    this.noiseBuffer ??= this.#whiteNoise(seconds);
    return this.noiseBuffer;
  }

  #build() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.context = new AudioContext();
    this.master = this.#gain(this.volume, this.#limiter());
    this.sfx = this.#gain(0.6, this.master);
    this.music = this.#gain(0.35, this.master);
    this.#primeIOS();
  }

  #limiter() {
    const compressor = this.context.createDynamicsCompressor();
    compressor.threshold.value = -12;
    compressor.ratio.value = 6;
    compressor.connect(this.context.destination);
    return compressor;
  }

  #gain(value, destination) {
    const node = this.context.createGain();
    node.gain.value = value;
    node.connect(destination);
    return node;
  }

  #primeIOS() {
    const source = this.context.createBufferSource();
    source.buffer = this.context.createBuffer(1, 1, 22050);
    source.connect(this.context.destination);
    source.start(0);
  }

  #buffer(samples) {
    const buffer = this.context.createBuffer(1, samples.length, this.context.sampleRate);
    buffer.copyToChannel(samples, 0);
    return buffer;
  }

  #whiteNoise(seconds) {
    const { sampleRate } = this.context;
    const buffer = this.context.createBuffer(1, sampleRate * seconds, sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    return buffer;
  }
}
