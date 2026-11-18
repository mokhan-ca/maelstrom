export const WORLD = { width: 540, height: 960 };

export const LOOP = { step: 1 / 60, maxFrame: 0.25 };

export const VIEW = { maxDpr: 2 };

export const SHIP = {
  radius: 14,
  speed: 420,
  touchSensitivity: 1.25,
  startY: 820,
  bottomMargin: 48,
  fireInterval: 0.16,
  rapidFireInterval: 0.08,
  laserSpeed: 900,
  invulnerableFor: 2,
  lives: 3,
  extraLifeEvery: 20000,
};

export const ENEMIES = {
  drifter: { radius: 18, hp: 1, points: 100, speed: 140 },
  zigzag: { radius: 16, hp: 1, points: 150, speed: 170, amplitude: 90, frequency: 2.4 },
  shooter: { radius: 20, hp: 3, points: 300, speed: 110, fireInterval: 1.8, bulletSpeed: 230, lingerFor: 7 },
};

export const BULLET = { radius: 7 };

export const WAVES = {
  duration: 30,
  killsToAdvance: 25,
  firstSpawnInterval: 1.1,
  spawnDecay: 0.88,
  minSpawnInterval: 0.28,
  speedGrowth: 0.08,
  maxSpeedMultiplier: 2.2,
  zigzagFromWave: 2,
  shooterFromWave: 3,
  maxEnemies: 28,
};

export const COMBO = { killsPerStep: 5, maxMultiplier: 8 };

export const POWERUPS = {
  dropChance: 0.08,
  duration: 10,
  fallSpeed: 120,
  radius: 14,
  types: ['spread', 'rapid', 'shield'],
};

export const PARTICLES = { max: 700 };
