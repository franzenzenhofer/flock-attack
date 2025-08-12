# FLOCK ATTACK - Zero-UI Boid War

## 🎮 GAME OVERVIEW
**Flock Attack** is a zero-UI swarm control game where two armies of boids (flocking agents) compete to collect and secure resources. The player controls their cyan swarm with a single touch/click, while battling against an aggressive magenta AI opponent.

## 🎯 CORE MECHANICS

### Flocking Behavior
- **Reynolds' Rules**: All boids follow alignment, cohesion, and separation
- **Spatial Hashing**: Optimized neighbor detection for 100+ boids
- **Team Dynamics**: Allied boids cooperate, enemy boids repel

### Resource System
- **Dots**: Collectible resources that orbit bases when secured
- **Three States**: Orbit (secured), Free (available), Carried (in transit)
- **Stealing**: Boids can raid enemy bases to steal orbiting resources

### Base Mechanics
- **Leveling**: Bases level up as resources are deposited
- **Aura System**: Growing defensive field that pushes enemy boids
- **Progress Tracking**: Visual arc shows progress to next level

### Combat & Strategy
- **Drop Mechanics**: Outnumbered carriers drop resources
- **Stun System**: Brief immobilization after dropping
- **AI Modes**: Defend, Raid, and Intercept strategies

### Environmental Hazards
- **Storm Systems**: Roaming repulsion fields
- **Adaptive Spawning**: Increases with game progression
- **Strategic Avoidance**: Forces dynamic path planning

## 🏗️ TECHNICAL ARCHITECTURE

### TypeScript Modules
```
src/
├── core/
│   ├── Vector2D.ts       # 2D math utilities
│   ├── Entity.ts         # Base entity class
│   └── Game.ts           # Main game loop
├── entities/
│   ├── Boid.ts          # Individual swarm unit
│   ├── Base.ts          # Team base structure
│   ├── Dot.ts           # Resource entity
│   └── Storm.ts         # Hazard system
├── systems/
│   ├── FlockingSystem.ts    # Reynolds' algorithm
│   ├── SpatialHash.ts       # Performance optimization
│   ├── InputSystem.ts       # Pointer event handling
│   └── AIController.ts      # Enemy decision making
├── rendering/
│   ├── CanvasRenderer.ts    # 2D rendering pipeline
│   ├── DPRHandler.ts        # Device pixel ratio
│   └── Effects.ts           # Visual effects
└── utils/
    ├── Performance.ts        # FPS monitoring
    └── Config.ts            # Game constants
```

### Build Process
- **Vite**: Lightning-fast HMR development
- **TypeScript**: Strict mode, zero warnings
- **Vitest**: Unit and integration testing
- **Playwright**: E2E testing
- **Cloudflare Workers**: Edge deployment

## 🚀 DEPLOYMENT

### Cloudflare Configuration
```toml
# wrangler.toml
name = "flock-attack"
main = "_worker.js"
compatibility_date = "2025-07-26"

[assets]
directory = "./dist"

[[routes]]
pattern = "flock.franzai.com/*"
zone_name = "franzai.com"
```

### One-Command Deploy
```bash
npm run deploy  # Tests, builds, and deploys
```

## 📊 PERFORMANCE TARGETS
- **60 FPS**: Smooth gameplay on modern devices
- **100+ Boids**: Per team without lag
- **<100ms**: Input response time
- **<3s**: Initial load time
- **Zero UI**: No buttons, menus, or text

## 🎨 VISUAL DESIGN
- **Cyan (#7ae4ff)**: Player team color
- **Magenta (#ff7adf)**: Enemy team color
- **White (#f2f7ff)**: Neutral resources
- **Dark gradient**: Atmospheric background
- **Glow effects**: Enhanced visibility

## 🧪 TESTING REQUIREMENTS
- **100% Coverage**: Core game logic
- **E2E Tests**: Full gameplay scenarios
- **Performance Tests**: Frame rate benchmarks
- **Mobile Tests**: Touch responsiveness
- **AI Tests**: Decision-making validation

## 📱 ACCESSIBILITY
- **Reduced Motion**: Respects system preference
- **High Contrast**: Clear team differentiation
- **Responsive**: Adapts to any screen size
- **Offline Support**: Service worker caching

## 🏆 VICTORY CONDITIONS
- **Domination**: Control 75% of resources
- **Elimination**: Destroy enemy base
- **Survival**: Highest level after time limit

## 🔧 DEVELOPMENT COMMANDS
```bash
npm run dev          # Start development server
npm run test         # Run all tests
npm run lint         # Check code quality
npm run typecheck    # Verify TypeScript
npm run deploy       # Production deployment
```

## 📈 FUTURE ENHANCEMENTS
- Power-up system (speed, shield, multi-carry)
- Particle effects for impacts
- Multiplayer support
- Replay system
- Leaderboards

---

**Flock Attack** - Where strategy meets swarm intelligence.
Built for maximum engagement, minimal interface.