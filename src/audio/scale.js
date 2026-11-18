const D = 146.83;
const IN_SCALE = [0, 1, 5, 7, 8];

export const note = (degree, octave = 0) => {
  const steps = IN_SCALE[((degree % 5) + 5) % 5] + 12 * (octave + Math.floor(degree / 5));
  return Math.round(D * 2 ** (steps / 12) * 100) / 100;
};
