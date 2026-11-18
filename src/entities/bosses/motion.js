import { VORTEX } from '../../config.js';

export const lerp = (from, to, t) => from + (to - from) * t;

export const ease = (t) => 1 - (1 - t) ** 3;

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const clearOf = ({ x, y }, vortex) => !vortex.active || Math.hypot(x - vortex.x, y - vortex.y) > VORTEX.reach;

export const fan = ({ x, y }, { ship, bullets }, { drops, speed, spread }) => {
  const aim = Math.atan2(ship.y - y, ship.x - x);
  for (let i = 0; i < drops; i++) {
    const angle = aim + (i - (drops - 1) / 2) * spread;
    bullets.fire(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed);
  }
};
