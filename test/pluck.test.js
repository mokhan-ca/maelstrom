import pluck from '../src/audio/pluck.js';
import { seeded } from '../src/render/brush.js';

const loudness = (samples) => Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);

describe('pluck', () => {
  const settings = { sampleRate: 8000, frequency: 400, seconds: 1, rng: seeded(1) };

  it('renders the requested length', () => {
    expect(pluck(settings)).toHaveLength(8000);
  });

  it('rings out and fades', () => {
    const samples = pluck(settings);
    expect(loudness(samples.subarray(0, 800))).toBeGreaterThan(loudness(samples.subarray(7200)) * 4);
  });

  it('repeats at the pitch of the string', () => {
    const samples = pluck(settings);
    const period = 8000 / 400;
    let difference = 0;
    for (let i = 100; i < 200; i++) difference += Math.abs(samples[i] - samples[i + period]);
    expect(difference / 100).toBeLessThan(0.05);
  });

  it('can be reproduced exactly', () => {
    expect(pluck({ ...settings, rng: seeded(7) })).toEqual(pluck({ ...settings, rng: seeded(7) }));
  });
});
