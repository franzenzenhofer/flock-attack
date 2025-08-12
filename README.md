# Flock Attack 🦅 - Zero-UI Boid War

**LIVE GAME:** [https://flock.franzai.com](https://flock.franzai.com)

A mesmerizing real-time strategy game where you control swarms of boids with a single touch. Watch as cyan and magenta armies clash in an endless war for resources!

## 🎮 How to Play

**It's simple:** Click/touch anywhere to direct your cyan swarm!

- **Your swarm** (cyan) follows your pointer
- **Enemy swarm** (magenta) has its own AI strategy  
- **Collect white dots** and bring them to your base
- **Steal from enemy base** when they're not looking
- **Level up** by depositing resources
- **Avoid storms** that repel your units

**Double-tap to pause** (hidden feature)

## 🚀 Features

- **Zero UI** - Pure visual gameplay, no buttons or text
- **Flocking AI** - Reynolds' boids algorithm with alignment, cohesion, separation
- **Dynamic Combat** - Units drop resources when outnumbered
- **Base Mechanics** - Growing aura fields that push enemies away
- **Environmental Hazards** - Roaming storm systems
- **Adaptive AI** - Enemy switches between defend, raid, and intercept modes
- **Performance Optimized** - Spatial hashing for 100+ units at 60fps
- **Fully Responsive** - Works on any screen size

## 🛠️ Tech Stack

- **TypeScript** - 100% type-safe code
- **Vite** - Lightning-fast builds
- **Canvas API** - Hardware-accelerated rendering
- **Cloudflare Workers** - Edge deployment
- **No frameworks** - Pure vanilla JS for maximum performance

## 🏗️ Architecture

```
src/
├── core/          # Game loop, main logic
├── entities/      # Boid, Base, Dot, Storm classes
├── systems/       # Flocking, AI, Input, Spatial Hash
├── rendering/     # Canvas renderer with DPR support
└── utils/         # Configuration and constants
```

## 🎯 Game Mechanics

### Boid Behavior
- Follow Reynolds' flocking rules
- Seek goals (player pointer or AI target)
- Pick up and carry resources
- Drop when outnumbered (2v1)
- Get stunned briefly after dropping

### Base System
- Level up with deposited resources
- Growing defensive aura
- Stock management
- Progress tracking

### AI Strategy
- **Defend**: Protect home base
- **Raid**: Attack player base
- **Intercept**: Control mid-field

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare
npm run deploy
```

## 📊 Performance

- **60 FPS** on modern devices
- **Spatial hashing** for O(1) neighbor lookups
- **Object pooling** ready (for future enhancement)
- **WebGL** ready architecture

## 🎨 Visual Design

- **Cyan (#7ae4ff)** - Player team
- **Magenta (#ff7adf)** - Enemy team  
- **White (#f2f7ff)** - Neutral resources
- **Dark gradient** - Atmospheric background
- **Glow effects** - Enhanced visibility

## 📝 License

MIT - Feel free to fork and modify!

## 🔗 Links

- **Play Now:** [flock.franzai.com](https://flock.franzai.com)
- **GitHub:** [github.com/franzenzenhofer/flock-attack](https://github.com/franzenzenhofer/flock-attack)

---

Built with focus on pure gameplay, zero interface, maximum immersion.