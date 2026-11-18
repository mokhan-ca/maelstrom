export const WORLD = { width: 540, height: 960 };

export const LOOP = { step: 1 / 60, maxFrame: 0.25 };

export const VIEW = { maxDpr: 2 };

export const SHIP = {
  radius: 7,
  halfWidth: 18,
  pickupRadius: 24,
  speed: 420,
  touchSensitivity: 1.25,
  startY: 820,
  bottomMargin: 48,
  fireInterval: 0.16,
  rapidFireInterval: 0.08,
  laserSpeed: 900,
  invulnerableFor: 2,
  lives: 3,
  maxLives: 5,
  extraLifeEvery: 20000,
};

export const ENEMIES = {
  drifter: { radius: 18, hp: 1, points: 100, speed: 140 },
  zigzag: { radius: 16, hp: 1, points: 150, speed: 170, amplitude: 90, frequency: 2.4 },
  shooter: { radius: 20, hp: 4, points: 300, speed: 110, fireInterval: 1.8, bulletSpeed: 230, lingerFor: 5 },
};

export const BULLET = { radius: 7 };

export const WAVES = {
  duration: 30,
  killsToAdvance: 25,
  firstWaveKills: 15,
  firstSpawnInterval: 0.85,
  spawnDecay: 0.92,
  minSpawnInterval: 0.28,
  speedGrowth: 0.06,
  maxSpeedMultiplier: 2.2,
  zigzagFromWave: 1,
  shooterFromWave: 3,
  maxEnemies: 28,
};

export const COMBO = { killsPerStep: 5, maxMultiplier: 8 };

export const POWERUPS = {
  dropChance: 0.05,
  dropCooldown: 8,
  guaranteedAtKill: 8,
  durations: { spread: 10, rapid: 10, shield: 4 },
  fallSpeed: 120,
  radius: 14,
  types: ['spread', 'rapid', 'shield'],
};

export const PARTICLES = { max: 700 };

export const VORTEX = {
  fromWave: 2,
  reach: 150,
  core: 22,
  baseSpeed: 60,
  speedPerWave: 8,
  maxSpeed: 110,
  swirl: 0.6,
  bonusWindow: 1.5,
  bonusMultiplier: 2,
  path: { x: 165, y: 210, centerY: 350, speedX: 0.13, speedY: 0.21 },
  weights: { ship: 0.35, enemy: 1, bullet: 0.8 },
};
