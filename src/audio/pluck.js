export default function pluck({ sampleRate, frequency, seconds = 1.2, decay = 0.996, rng = Math.random }) {
  const period = Math.max(2, Math.round(sampleRate / frequency));
  const string = Float32Array.from({ length: period }, () => (rng() + rng() - 1) * 0.8);
  const samples = new Float32Array(Math.round(sampleRate * seconds));
  for (let i = 0; i < samples.length; i++) {
    const here = i % period;
    const next = (i + 1) % period;
    samples[i] = string[here];
    string[here] = decay * 0.5 * (string[here] + string[next]);
  }
  return samples;
}
