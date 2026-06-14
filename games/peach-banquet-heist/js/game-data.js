/**
 * 蟠桃盛会 — Peach Banquet Heist
 * Level Configuration Data
 */
var PEACH_BANQUET_LEVELS = [
  {
    id: 1,
    name: '蟠桃园',
    nameEn: 'Peach Garden',
    duration: 90,
    winCondition: 'collect',
    collectTarget: 12,
    playerSpeed: 280,
    bgTheme: 'garden',
    bgColors: {
      skyTop: '#0d1020',
      skyBot: '#1a1030',
      cloudTint: 'rgba(255,200,150,0.12)',
      archTint: 'rgba(20,40,20,0.7)',
      fgParticle: 'petal'
    },
    enemies: [
      {
        type: 'tu-di-gong',
        count: 2,
        speed: 80,
        size: 22,
        hp: 1,
        patrolPattern: 'horizontal',
        territoryMargin: 0.15,
        special: {
          type: 'root-snare',
          cooldown: 6000,
          warningTime: 800,
          snareDuration: 3000,
          snareRadius: 55
        },
        render: {
          bodyColor: '#8B7355',
          robeColor: '#6B5B3A',
          hatColor: '#5A4A2A',
          glowColor: 'rgba(180,140,80,0.3)'
        }
      }
    ],
    collectibles: [
      { type: 'small-peach', label: '三千年桃', points: 1, radius: 10, color: '#f4a0a0', glowColor: 'rgba(244,160,160,0.5)', effect: null, spawnWeight: 50 },
      { type: 'medium-peach', label: '六千年桃', points: 3, radius: 14, color: '#f08080', glowColor: 'rgba(240,128,128,0.6)', effect: 'speed-boost', effectDuration: 3000, spawnWeight: 30 },
      { type: 'large-peach', label: '九千年桃', points: 5, radius: 18, color: '#e06060', glowColor: 'rgba(224,96,96,0.7)', effect: 'slow-motion', effectDuration: 1000, spawnWeight: 20 }
    ],
    hazards: [
      {
        type: 'root-spike',
        warningTime: 500,
        damage: 20,
        radius: 30,
        color: '#5a3a1a',
        warningColor: 'rgba(255,100,50,0.4)'
      }
    ],
    cutscenePoem: { zh: '夭夭桃林，灼灼其华。\n窃入仙园，初尝长生。' },
    bgLayers: {
      sky: { speedX: 0, speedY: 0 },
      cloud: { speedX: 0.3, speedY: 0.05, count: 8 },
      arch: { speedX: 0.5, speedY: 0, elements: ['peach-tree', 'peach-tree', 'garden-wall'] },
      fg: { speedX: 0.8, speedY: 0.2, particleType: 'petal', particleColor: '#f4a0a0', particleRate: 3 }
    }
  },
  {
    id: 2,
    name: '瑶池',
    nameEn: 'Jade Pool',
    duration: 120,
    winCondition: 'collect',
    collectTarget: 8,
    playerSpeed: 280,
    bgTheme: 'pool',
    bgColors: {
      skyTop: '#0a1420',
      skyBot: '#102030',
      cloudTint: 'rgba(180,210,240,0.10)',
      archTint: 'rgba(20,50,50,0.7)',
      fgParticle: 'mist'
    },
    enemies: [
      {
        type: 'seven-fairies',
        count: 3,
        speed: 100,
        size: 18,
        hp: 1,
        patrolPattern: 'random',
        territoryMargin: 0.1,
        attack: {
          type: 'fan-wave',
          projectiles: 7,
          spreadAngle: 1.047197551,
          projectileSpeed: 220,
          projectileSize: 6,
          projectileColor: 'rgba(180,210,240,0.8)',
          fireRate: 2500,
          warningTime: 400
        },
        render: {
          bodyColor: '#c8dce8',
          robeColor: '#a8c8e0',
          ribbonColor: '#e0d8f0',
          glowColor: 'rgba(180,210,240,0.3)'
        }
      }
    ],
    collectibles: [
      { type: 'dew-drop', label: '仙露', points: 1, radius: 8, color: '#c8e8f8', glowColor: 'rgba(200,232,248,0.7)', effect: null, spawnWeight: 100 }
    ],
    hazards: [
      { type: 'whirlpool', damage: 10, radius: 50, color: 'rgba(80,160,200,0.3)', effect: 'pull-slow', pullForce: 120 },
      { type: 'drunken-mist', damage: 0, radius: 60, color: 'rgba(200,180,220,0.15)', effect: 'vision-obscure', effectDuration: 2000 }
    ],
    boss: {
      triggerTime: 60,
      type: 'xiwangmu-wave',
      attacks: [
        { type: 'water-burst-triple', damage: 25, burstCount: 3, burstDelay: 600, radius: 80, warningTime: 500 }
      ],
      attackInterval: 4000
    },
    cutscenePoem: { zh: '瑶池潋滟，琼浆玉液。\n仙女怒目，金母降威。' },
    bgLayers: {
      sky: { speedX: 0, speedY: 0 },
      cloud: { speedX: 0.2, speedY: 0.08, count: 6 },
      arch: { speedX: 0.4, speedY: 0, elements: ['jade-pavilion', 'lotus-terrace', 'waterfall'] },
      fg: { speedX: 0.6, speedY: 0.3, particleType: 'mist', particleColor: 'rgba(200,220,240,0.3)', particleRate: 2 }
    }
  },
  {
    id: 3,
    name: '炼丹房',
    nameEn: 'Furnace',
    duration: 100,
    winCondition: 'survive',
    collectTarget: 0,
    playerSpeed: 280,
    bgTheme: 'furnace',
    bgColors: {
      skyTop: '#1a0808',
      skyBot: '#2a0a0a',
      cloudTint: 'rgba(255,100,30,0.08)',
      archTint: 'rgba(40,15,10,0.8)',
      fgParticle: 'ember'
    },
    enemies: [],
    collectibles: [
      { type: 'elixir-shard', label: '金丹碎片', points: 0, radius: 10, color: '#ffd700', glowColor: 'rgba(255,215,0,0.8)', effect: 'invincible', effectDuration: 3000, spawnWeight: 100 }
    ],
    hazards: [
      { type: 'flame-jet', warningTime: 600, damage: 25, pattern: 'cross', color: '#ff6030', warningColor: 'rgba(255,100,50,0.5)' },
      { type: 'lava-crack', warningTime: 800, damage: 30, pattern: 'random-line', color: '#ff4020', warningColor: 'rgba(255,80,30,0.5)' },
      { type: 'pressure-blast', warningTime: 1000, damage: 15, pattern: 'fullscreen', warningColor: 'rgba(255,60,20,0.3)' }
    ],
    mechanics: [
      {
        type: 'bagua-safe-zone',
        cycleTime: 4000,
        burnDPS: 8,
        safeRadius: 70,
        safeColor: 'rgba(255,215,0,0.25)',
        burnColor: 'rgba(255,40,10,0.12)'
      }
    ],
    cutscenePoem: { zh: '八卦炉中，真火炼心。\n金丹碎而重生，\n不死之身已成。' },
    bgLayers: {
      sky: { speedX: 0, speedY: 0 },
      cloud: { speedX: 0.4, speedY: 0.1, count: 5 },
      arch: { speedX: 0.6, speedY: 0, elements: ['furnace-wall', 'furnace-wall', 'magma-vein'] },
      fg: { speedX: 0.7, speedY: -0.4, particleType: 'ember', particleColor: '#ff6030', particleRate: 5 }
    }
  },
  {
    id: 4,
    name: '凌霄殿',
    nameEn: 'Throne Room',
    duration: null,
    winCondition: 'boss',
    collectTarget: 0,
    playerSpeed: 300,
    bgTheme: 'throne',
    bgColors: {
      skyTop: '#0a0a18',
      skyBot: '#0d0d28',
      cloudTint: 'rgba(255,215,100,0.10)',
      archTint: 'rgba(30,25,15,0.8)',
      fgParticle: 'gold-dust'
    },
    enemies: [],
    collectibles: [],
    hazards: [],
    bossRounds: [
      {
        name: '雷霆',
        nameEn: 'Divine Lightning',
        duration: 15000,
        attacks: [
          { type: 'lightning-strike', count: 30, damage: 25, warningTime: 300, acceleration: 1.3, boltRadius: 20, boltColor: '#ffffff', warningColor: 'rgba(255,255,200,0.6)' }
        ]
      },
      {
        name: '天火',
        nameEn: 'Sky Fire',
        duration: 15000,
        attacks: [
          { type: 'fire-rain', pattern: 'sweep', damage: 25, fireballRadius: 14, fireballColor: '#ff5020', residualFire: true, residualDuration: 2000, residualRadius: 35, warningTime: 400 }
        ]
      },
      {
        name: '罡风',
        nameEn: 'Divine Wind',
        duration: 15000,
        attacks: [
          { type: 'wind-push', force: 150, direction: 'random', changeInterval: 2000 },
          { type: 'ice-shard', count: 15, speed: 350, radius: 8, color: '#c8e8ff', damage: 15 }
        ]
      }
    ],
    cutscenePoem: { zh: '凌霄殿上，天威浩荡。\n俺老孙偏不信命，\n踏碎这凌霄！' },
    bgLayers: {
      sky: { speedX: 0, speedY: 0 },
      cloud: { speedX: 0.15, speedY: 0.03, count: 4 },
      arch: { speedX: 0.3, speedY: 0, elements: ['dragon-pillar', 'dragon-pillar', 'throne-dais'] },
      fg: { speedX: 0.5, speedY: -0.2, particleType: 'gold-dust', particleColor: '#ffd700', particleRate: 4 }
    }
  }
];

var GAME_CONSTANTS = {
  PLAYER_RADIUS: 14,
  PLAYER_HP: 100,
  DAMAGE_PER_HIT: 20,
  INVINCIBILITY_MS: 500,
  DASH_DURATION: 0.3,
  DASH_SPEED_MULT: 1.5,
  DASH_COOLDOWN: 2,
  DASH_INVINCIBILITY: 0.3,
  MAX_PARTICLES: 250,
  LOW_FPS_THRESHOLD: 30,
  VERY_LOW_FPS_THRESHOLD: 20,
  VIGNETTE_ALPHA: 0.25,
  SCORE_PER_PEACH: 100,
  SCORE_PER_SECOND_SURVIVED: 5,
  SCORE_PER_LEVEL_CLEAR: 500,
  STORAGE_KEY_BEST: 'peach-banquet-best',
  STORAGE_KEY_CLEAR: 'peach-banquet-first-clear'
};
