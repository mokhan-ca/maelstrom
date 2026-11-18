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
  zigzag: { radius: 17, hp: 1, points: 150, speed: 170, amplitude: 90, frequency: 2.4 },
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

export const BOSSES = {
  every: 5,
  roster: ['octopus', 'skeleton', 'dragon'],
  entrance: 2,
  fodderInterval: 3,
  tier: { hp: 0.25, maxHp: 1.75, pace: 0.15, maxPace: 1.45 },
  octopus: {
    hp: 150,
    points: 15000,
    gap: 2.2,
    telegraph: 0.7,
    sweep: 1.1,
    recover: 0.5,
    head: { y: 200, radius: 36, roam: 120, bob: 10 },
    arm: { segments: 7, rest: 150, coil: 110, reach: 380 },
    ring: { drops: 14, speed: 150 },
    flick: { drops: 3, speed: 210, spread: 0.22 },
  },
  skeleton: {
    hp: 170,
    points: 20000,
    gap: 2.6,
    telegraph: 0.8,
    warn: 0.2,
    slam: 0.25,
    hold: 0.3,
    recover: 0.6,
    flinch: 1,
    grip: 8,
    skull: { y: 200, radius: 36, roam: 90, bob: 8 },
    hand: { radius: 30, reach: 150, rest: 300, raised: 260, floor: 620, column: 70, apart: 170 },
    shards: { drops: 5, speed: 300 },
    jaw: { drops: 5, speed: 200, spread: 0.18 },
  },
  dragon: {
    hp: 160,
    points: 25000,
    gap: 1.8,
    telegraph: 0.6,
    speed: 160,
    head: { radius: 34 },
    body: { segments: 12, radius: 18, tail: 14, spacing: 30 },
    orbit: { radius: 170, tight: 120 },
    fence: { top: 200, bottom: 600, side: 60 },
    breath: { drops: [1, 3, 5], speed: 220, spread: 0.2 },
  },
};
