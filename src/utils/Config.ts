export const Colors = {
  bg0: '#071017',
  bg1: '#0a141c',
  player: '#7ae4ff',
  enemy: '#ff7adf',
  free: '#f2f7ff',
  auraPlayer: 'rgba(122,228,255,.16)',
  auraEnemy: 'rgba(255,122,223,.16)',
} as const;

export const GameConfig = {
  teams: {
    player: 0,
    enemy: 1,
  },
  boids: {
    basePerception: 52,
    baseSeparation: 22,
    baseMaxSpeed: 2.0,
    baseMaxForce: 0.06,
  },
  bases: {
    radiusRatio: 0.11, // of min(width, height)
    playerPosX: 0.18, // percentage of width
    enemyPosX: 0.82,
    initialDesired: 14,
    levelUpBonus: 3,
  },
  dots: {
    orbitSpeed: 1.0, // rad/sec
    pickupRadius: 24,
    dropRadius: 4.2,
  },
  storms: {
    baseRadius: 0.05, // of min(width, height)
    driftSpeed: 16, // px/sec
    repelForce: 0.9,
  },
  ai: {
    updateInterval: 2.5, // seconds
    modes: ['defend', 'raid', 'intercept'] as const,
  },
  performance: {
    spatialHashCell: 48,
    maxDeltaTime: 100, // ms
    targetFPS: 60,
  },
} as const;

export type Team = 0 | 1;
export type AIMode = typeof GameConfig.ai.modes[number];