export const GAME_CONSTANTS = {
  // Flocking parameters
  FLOCKING: {
    MAX_CLUSTER_SIZE: 15,
    DISPERSION_RADIUS: 100,
    CLUSTER_DETECTION_RADIUS: 60,
    PERCEPTION_RADIUS: 50,
    SEPARATION_RADIUS: 25,
    ALIGNMENT_WEIGHT: 1.0,
    COHESION_WEIGHT: 0.8,
    SEPARATION_WEIGHT: 1.5
  },
  
  // Formation parameters
  FORMATION: {
    DEFAULT_SPACING: 30,
    MAX_FORMATION_SIZE: 20,
    SQUAD_SIZE: 12,
    SPLIT_ANGLE_OFFSET: 80
  },
  
  // AI parameters
  AI: {
    DECISION_INTERVAL: 2.0,
    AUTO_AI_DELAY: 3.0,
    THREAT_RADIUS: 50,
    OPPORTUNITY_RADIUS: 100,
    BASE_DEFEND_RADIUS: 2.5,
    BASE_ATTACK_THRESHOLD: 5
  },
  
  // Game balance
  BALANCE: {
    WAVE_CYCLE_DURATION: 46,
    STORM_SPAWN_CHANCE: 0.3,
    MAX_STORMS: 8,
    CATCH_UP_THRESHOLD: 4,
    REINFORCEMENT_BASE: 4
  },
  
  // Physics
  PHYSICS: {
    MAX_DELTA_TIME: 100,
    NORMAL_DELTA: 16.6667,
    EDGE_MARGIN: 100,
    WRAP_MARGIN: 50
  },
  
  // Team colors (hex)
  COLORS: {
    PLAYER: '#7ae4ff',
    ENEMY: '#ff7adf',
    NEUTRAL: '#f2f7ff'
  }
} as const;

export type GameConstants = typeof GAME_CONSTANTS;