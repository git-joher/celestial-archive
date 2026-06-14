# Dragon Palace Treasure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the 龙宫探宝 underwater exploration game — top-down Canvas survival where the White Dragon Horse dives through depth layers collecting treasures and battling sea creatures.

**Architecture:** New game at `games/dragon-palace-treasure/` with 4 files. Reuses audio engine from Havoc in Heaven (copied and adapted for underwater theme). Game engine is a single Canvas 2D loop with depth layer progression, oxygen management, auto-attack combat, and item drops.

**Tech Stack:** Vanilla JS + Canvas 2D + Web Audio API + CSS, zero dependencies.

---

### Task 1: Copy and adapt underwater audio engine

**Files:**
- Create: `games/dragon-palace-treasure/js/audio.js`

Copy `games/havoc-in-heaven/js/audio.js` → `games/dragon-palace-treasure/js/audio.js`, then modify:

- Change BGM config to underwater theme:
  - `calm`: 60 BPM, low ambient drone, bubble pops
  - `tense`: 100 BPM, deeper drone, faster bubbles
  - `boss`: 140 BPM, heavy percussion, alarm tones
- Change SFX to ocean-themed:
  - `attack` → water slash
  - `hurt` → deep thud
  - `kill_*` → bubble burst variants
  - Add `collect` (treasure ding), `bubble` (oxygen refill), `descend` (whirlpool)
  - Keep `levelup`, `death`
  - Remove unused SFX (`jump`, `fiery`, `stun`, `shockwave`)
- Keep all helper functions (`playNoiseHit`, `playToneSweep`, etc.)
- Public API unchanged

Commit: `feat: add underwater-themed audio engine for Dragon Palace Treasure`

---

### Task 2: Create game page HTML

**Files:**
- Create: `games/dragon-palace-treasure/index.html`

Create a complete game page modeled on Havoc in Heaven's `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>龙宫探宝 — Dragon Palace Treasure | Celestial Archive</title>
  <meta name="description" content="Dive into the Dragon King's underwater palace. Navigate the depths, collect treasures, and survive the dangers of the Eastern Sea.">
  <meta name="robots" content="index, follow">
  <link rel="icon" href="../../favicon.svg" type="image/svg+xml">
  <link rel="canonical" href="https://celestial-archive.com/games/dragon-palace-treasure/">
  <meta property="og:title" content="龙宫探宝 — Dragon Palace Treasure | Celestial Archive">
  <meta property="og:description" content="Dive into the Dragon King's underwater palace and claim treasures from the depths.">
  <meta property="og:image" content="https://celestial-archive.com/images/white-dragon-horse/wlh-hero.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://celestial-archive.com/games/dragon-palace-treasure/">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="龙宫探宝 — Dragon Palace Treasure | Celestial Archive">
  <meta name="twitter:description" content="Dive into the Dragon King's underwater palace.">
  <meta name="twitter:image" content="https://celestial-archive.com/images/white-dragon-horse/wlh-hero.jpg">
  <link rel="stylesheet" href="../../css/global.css?v=2">
  <link rel="stylesheet" href="css/game.css?v=2">
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XRWRSLPKTM"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XRWRSLPKTM');
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "name": "Dragon Palace Treasure",
    "description": "Dive into the Dragon King's underwater palace. Navigate the depths, collect treasures, and survive the dangers of the Eastern Sea.",
    "url": "https://celestial-archive.com/games/dragon-palace-treasure/",
    "image": "https://celestial-archive.com/images/white-dragon-horse/wlh-hero.jpg",
    "operatingSystem": "Web Browser",
    "applicationCategory": "GameApplication",
    "author": { "@type": "Organization", "name": "Celestial Archive", "url": "https://celestial-archive.com" },
    "genre": ["Action", "Exploration", "Underwater"],
    "playMode": "SinglePlayer",
    "inLanguage": "en"
  }
  </script>
</head>
<body>

<!-- Canvas -->
<div id="game-wrapper">
  <canvas id="game-canvas"></canvas>
</div>

<!-- HUD -->
<div id="game-hud">
  <div class="hud-top">
    <div class="hud-left">
      <div class="hp-bar-wrap">
        <span class="hp-label-text">Dragon</span>
        <div class="hp-outer"><div class="hp-inner" id="hp-inner"></div></div>
        <span class="hp-num" id="hp-num">100/100</span>
      </div>
      <div class="o2-bar-wrap">
        <span class="o2-label-text">O2</span>
        <div class="o2-outer"><div class="o2-inner" id="o2-inner"></div></div>
      </div>
      <div class="hud-stat">Depth <span id="hud-depth">1</span></div>
    </div>
    <div class="hud-right">
      <div class="hud-stat">Treasures <span id="hud-treasure">0</span>/<span id="hud-goal">10</span></div>
      <div class="hud-stat">Score <span id="hud-score">0</span></div>
      <div class="hud-stat">Time <span id="hud-time">0:00</span></div>
    </div>
  </div>
</div>

<!-- Death Screen -->
<div id="death-overlay">
  <img id="death-img" src="" alt="White Dragon Horse" class="death-img" />
  <div class="death-title-main">The Depths Claim Another</div>
  <div class="death-title-sub">Dive Again, Brave Dragon</div>
  <div class="death-stats">
    <div class="death-stat"><div class="death-stat-val" id="death-depth">1</div><div class="death-stat-label">Deepest Depth</div></div>
    <div class="death-stat"><div class="death-stat-val" id="death-score">0</div><div class="death-stat-label">Score</div></div>
    <div class="death-stat"><div class="death-stat-val" id="death-treasures">0</div><div class="death-stat-label">Treasures</div></div>
    <div class="death-stat"><div class="death-stat-val" id="death-time">0:00</div><div class="death-stat-label">Survival Time</div></div>
  </div>
  <button class="btn-start" id="btn-restart">Dive Again</button>
</div>

<!-- Mobile Controls -->
<div id="mobile-controls">
  <div class="mobile-joystick" id="mobile-joystick">
    <div class="mobile-joystick-knob" id="mobile-joystick-knob"></div>
  </div>
</div>

<p class="pause-hint">WASD Move · Auto-Attack · Space Pause</p>

<script src="../../js/deities.js?v=2"></script>
<script src="../../js/main.js?v=2"></script>
<script src="../../js/config.js?v=2"></script>
<script src="js/audio.js?v=2"></script>
<script src="js/game.js?v=2"></script>
</body>
</html>
```

Commit: `feat: create Dragon Palace Treasure game page with SEO metadata`

---

### Task 3: Create underwater-themed CSS

**Files:**
- Create: `games/dragon-palace-treasure/css/game.css`

Create CSS based on Havoc in Heaven's `game.css` with underwater color palette:

- Background: deep ocean dark (`#061020`) instead of black
- Accent: teal/cyan (`#3db8b0`) instead of gold
- HP bar: blue gradient (`#2060c0` → `#40a0e0`)
- Oxygen bar: cyan gradient (`#20a0a0` → `#40e0e0`)
- All same layout patterns (fixed overlays, flex HUD, death screen, joystick)
- Joystick knob: use `../../../images/white-dragon-horse/wlh-hero.jpg`
- Pause hint at bottom
- Death screen with teal accent colors

Include all the same sections as Havoc in Heaven CSS:
- Canvas container (#game-wrapper)
- HUD (#game-hud, .hud-top, .hp-bar-wrap, .o2-bar-wrap)
- Death overlay (#death-overlay, .death-stats, .death-img)
- Mobile controls (#mobile-controls, .mobile-joystick, .mobile-joystick-knob)
- Pause hint (.pause-hint)
- Body override (.game-active)

Commit: `feat: add underwater-themed CSS for Dragon Palace Treasure`

---

### Task 4: Create game engine — setup + player + depth system

**Files:**
- Create: `games/dragon-palace-treasure/js/game.js`

Create the complete game engine (~1200 lines). This file follows the same IIFE pattern as Havoc in Heaven. Build in this task:

**4a. Canvas setup, input, helpers:**
```js
(function () {
  'use strict';
  document.body.classList.add('game-active');

  // AudioContext resume on user gesture
  var _audioResumed = false;
  function _tryResumeAudio() { ... }
  document.addEventListener('click', _tryResumeAudio);
  document.addEventListener('keydown', _tryResumeAudio);
  document.addEventListener('touchstart', _tryResumeAudio);

  var canvas = document.getElementById('game-canvas');
  var ctx = canvas.getContext('2d');
  var W, H;
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  // Input (WASD, arrows, touch joystick, gyro — identical to Havoc in Heaven)
  var keys = {};
  window.addEventListener('keydown', function (e) { keys[e.key.toLowerCase()] = true; if (e.key === ' ') { e.preventDefault(); togglePause(); } });
  window.addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });
  // ... joystick and gyro code (copy from Havoc in Heaven)
  // ... getInputX(), getInputY() functions

  // Helpers
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
  function dist(a, b) { var dx = a.x - b.x; var dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }
  function angle(a, b) { return Math.atan2(b.y - a.y, b.x - a.x); }

  // Pause
  var paused = false;
  function togglePause() { paused = !paused; }
```

**4b. Game state (initState):**
```js
  var player, enemies, treasures, particles, items, dmgNumbers;
  var depth, gameTime, score, treasureCount, treasureGoal;
  var gameOver, deathData;

  function initState() {
    player = {
      x: W / 2, y: H / 2,
      hp: 100, maxHp: 100,
      oxygen: 100, maxOxygen: 100,
      speed: 180,
      attackRange: 55,
      attackSpeed: 0.6,
      attackTimer: 0,
      attackDamage: 18,
      _damageFlash: 0,
      _burnTimer: 0, _burnTick: 0,
      _slowed: false, _slowTimer: 0,
      skillTimers: {},
      _skillSpeedMult: 1,
      _skillDamageMult: 1
    };
    enemies = [];
    treasures = [];
    particles = [];
    items = [];
    dmgNumbers = [];
    depth = 1;
    gameTime = 0;
    score = 0;
    treasureCount = 0;
    treasureGoal = 10;
    gameOver = false;
    deathData = null;
  }
```

**4c. Depth layer configuration:**
```js
  function getDepthConfig(d) {
    return {
      bgTop: ['#0a8', '#048', '#014', '#002', '#000'][Math.min(d - 1, 4)],
      bgBot: ['#048', '#012', '#001', '#000', '#000'][Math.min(d - 1, 4)],
      particleColor: ['#8f8', '#6cf', '#48f', '#c8f', '#f8f'][Math.min(d - 1, 4)],
      treasureGoal: 8 + d * 2,
      oxygenDrain: 2 + d * 1.5, // per second
      enemySpawnInterval: Math.max(0.4, 1.8 - d * 0.15),
      enemyCap: 8 + d * 3,
      scoreMultiplier: 1 + (d - 1) * 0.5,
      treasureTypes: getTreasureTypes(d),
      enemyTypes: getEnemyTypes(d)
    };
  }

  function getEnemyTypes(d) {
    var types = [ENEMY_TYPES.fish]; // fish always present
    if (d >= 2) { types.push(ENEMY_TYPES.jellyfish); types.push(ENEMY_TYPES.yecha); }
    if (d >= 3) { types.push(ENEMY_TYPES.seaSnake); types.push(ENEMY_TYPES.eel); }
    if (d >= 4) { types.push(ENEMY_TYPES.shark); }
    return types;
  }

  function getTreasureTypes(d) {
    var types = TREASURE_TYPES.pearl;
    if (d >= 2) types = TREASURE_TYPES.silver;
    if (d >= 3) types = TREASURE_TYPES.gold;
    if (d >= 4) types = TREASURE_TYPES.dragonPearl;
    if (d >= 5) types = TREASURE_TYPES.legendary;
    return types;
  }
```

**4d. Spawning (treasures + enemies + bubbles):**
- `spawnTreasure()`: random position, assigned type/value from depth config. Push to `treasures[]`.
- `spawnEnemy(type)`: from random edge, with randomized stats
- `spawnBubble(x, y)`: oxygen refill orb (appears randomly or on enemy kill, 10% chance)
- `spawnPortal(x, y)`: appears when treasure goal met — swirling vortex at random edge
- Initial spawn: 12 treasures, 5 enemies, 3 bubbles

**4e. Update loop:**
```js
  function update(dt) {
    if (gameOver || paused) return;
    var dtC = Math.min(dt, 0.1);
    gameTime += dtC;
    updatePlayer(dtC);
    updateEnemies(dtC);
    updateParticles(dtC);
    updateDmgNumbers(dtC);
    updateItems(dtC);
    updateTreasures(dtC);
    checkDepthProgress();
    spawnTick(dtC);
    updateHUD();
  }
```

Commit: `feat: create Dragon Palace Treasure game engine — setup, state, depth system`

---

### Task 5: Create game engine — player + enemy + treasure logic

**Files:**
- Modify: `games/dragon-palace-treasure/js/game.js`

Add to the game engine file:

**5a. Player update (underwater movement):**
- 8-directional swimming with slight drift (inertia)
- Oxygen drain: `player.oxygen -= cfg.oxygenDrain * dt`
- HP drain when oxygen = 0: `player.hp -= 10 * dt`
- Auto-attack: target nearest enemy in range, deal damage
- Bubble collection: `player.oxygen = Math.min(player.maxOxygen, player.oxygen + 30)`
- Speed/attack multipliers from items

**5b. Enemy AI:**
- Fish: random wandering, harmless
- Jellyfish: slow drift, contact paralyzes player (speed -50% for 2s)
- Yecha (巡海夜叉): patrols then chases player when close
- Sea Snake: dashes in straight line at player
- Eel: keeps distance, shoots electric projectiles
- Shark: fast pursuit
- Boss (Dragon General): slow but tanky, spawns minions, charges at player periodically
- Boss (Turtle Minister): very tanky, spin attack (damage all around)

**5c. Enemy type definitions:**
```js
  var ENEMY_TYPES = {
    fish:       { hp: 10,  speed: 60,  damage: 0,   radius: 8,  color: '#80e0c0', name: 'Fish', xpValue: 1, isRanged: false, dropsBubble: false },
    jellyfish:  { hp: 20,  speed: 40,  damage: 8,   radius: 12, color: '#e080e0', name: 'Jellyfish', xpValue: 3, isRanged: false, dropsBubble: true },
    yecha:      { hp: 40,  speed: 80,  damage: 12,  radius: 14, color: '#4080c0', name: 'Yecha', xpValue: 5, isRanged: false, dropsBubble: true },
    seaSnake:   { hp: 50,  speed: 140, damage: 15,  radius: 12, color: '#40c060', name: 'Sea Snake', xpValue: 8, isRanged: false, dropsBubble: true },
    eel:        { hp: 35,  speed: 60,  damage: 18,  radius: 11, color: '#e0e040', name: 'Eel', xpValue: 7, isRanged: true, shootCooldown: 2.5, dropsBubble: true },
    shark:      { hp: 80,  speed: 160, damage: 22,  radius: 20, color: '#8080a0', name: 'Shark', xpValue: 12, isRanged: false, dropsBubble: true },
    dragonGen:  { hp: 300, speed: 70,  damage: 25,  radius: 30, color: '#40c0e0', name: 'Dragon General', isBoss: true, spawnTimer: 5, dropsBubble: true },
    turtleMin:  { hp: 500, speed: 40,  damage: 30,  radius: 35, color: '#608040', name: 'Turtle Minister', isBoss: true, dropsBubble: true }
  };
```

**5d. Treasure system:**
```js
  var TREASURE_TYPES = {
    pearl:       { value: 10,  radius: 5,  color: '#f0f0e0', name: 'Pearl' },
    silver:      { value: 25,  radius: 6,  color: '#c0c0d0', name: 'Silver' },
    gold:        { value: 50,  radius: 7,  color: '#ffd700', name: 'Gold' },
    dragonPearl: { value: 100, radius: 9,  color: '#40e0ff', name: 'Dragon Pearl' },
    legendary:   { value: 250, radius: 11, color: '#ff40ff', name: 'Legendary' }
  };
```
- Treasures float with slight bob animation
- Magnet range 60 (pull toward player when close)
- Collect on contact (dist < 20): add score, increment treasureCount

**5e. Item drops (from enemy kills):**
```js
  var ITEM_TYPES = {
    bubble:    { color: '#80e0ff', radius: 6, name: 'Bubble', desc: '+30% Oxygen', apply: function() { player.oxygen = Math.min(player.maxOxygen, player.oxygen + 30); } },
    dragonBreath: { color: '#ff6040', radius: 7, name: 'Dragon Breath', desc: 'Cone damage 2x', apply: fireConeAttack },
    waterShield:  { color: '#4080ff', radius: 7, name: 'Water Shield', desc: 'Block 3 hits', apply: function() { player.waterShieldHits = 3; player.skillTimers.waterShield = 10; } },
    speedSwim:    { color: '#40ff80', radius: 7, name: 'Speed Swim', desc: '2x speed 5s', apply: function() { player._skillSpeedMult = 2; player.skillTimers.speedSwim = 5; } },
    dragonMight:  { color: '#ffd040', radius: 8, name: 'Dragon Might', desc: 'Stun all 3s', apply: function() { for (var i = 0; i < enemies.length; i++) enemies[i].stunned = 3; } },
    seaPearl:     { color: '#ff80ff', radius: 8, name: 'Sea Spirit Pearl', desc: 'Magnet treasures 5s', apply: function() { player.skillTimers.seaPearl = 5; } },
    dragonOrb:    { color: '#ffd700', radius: 10, name: 'Dragon Orb', desc: 'Full heal + 10s invincible', apply: function() { player.hp = player.maxHp; player.oxygen = player.maxOxygen; player.skillTimers.invincible = 10; } }
  };
```
- Drop rate: 15% from normal enemies, 100% from bosses (3 items)

Commit: `feat: add player, enemy, treasure, and item systems to Dragon Palace Treasure`

---

### Task 6: Create game engine — rendering + HUD

**Files:**
- Modify: `games/dragon-palace-treasure/js/game.js`

Add the complete rendering system:

**6a. Background rendering:**
- Vertical gradient from depth's bgTop to bgBot
- Floating bubble particles (random upward drift)
- Seaweed/kelp swaying at edges (drawn as wavy lines)
- Coral formations at bottom (random polygon clusters)

**6b. Entity rendering:**
- Player: White Dragon Horse image (`wlh-hero.jpg`) with circular clip + teal glow
- Treasures: pulsing colored circles with glow
- Enemies: Drawn as ocean shapes:
  - Fish: simple fish silhouette (oval + triangle tail)
  - Jellyfish: dome + trailing tentacles
  - Yecha: humanoid warrior with trident
  - Sea Snake: wavy line body
  - Eel: similar to snake but with electric sparks
  - Shark: larger fish shape with fin
  - Bosses: large distinct shapes with HP bar
- Items: small glowing geometric shapes (diamond for shield, triangle for breath, etc.)
- Bubbles: transparent circles with white rim
- Portal: swirling vortex animation (rotating arcs)

**6c. HUD rendering (canvas overlay):**
- Top-left: HP bar (blue), Oxygen bar (cyan), Depth number
- Top-right: Treasure count / goal, Score, Time
- Bottom: Active item icons with timers

**6d. Death screen:**
- Show deep ocean background
- Death stats from `deathData`
- Image: `wlh-hero.jpg` with teal glow

**6e. Depth transition:**
- When portal is collected (player touches it): 
  - Screen fades to black
  - depth++, reinitialize level (new treasures, enemies, cfg)
  - Screen fades in
  - Play descend SFX

Commit: `feat: add rendering, HUD, and depth transition to Dragon Palace Treasure`

---

### Task 7: Update game registry + SEO

**Files:**
- Modify: `js/deities.js`
- Modify: `sitemap.xml`

Update `CELESTIAL_GAMES` entry for `dragon-palace-treasure`:
- Change `status: 'coming'` → `status: 'live'`

Add to `sitemap.xml`:
```xml
  <!-- Games -->
  <url>
    <loc>https://celestial-archive.com/games/dragon-palace-treasure/</loc>
    <lastmod>2026-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
```

Commit: `feat: activate Dragon Palace Treasure in registry and sitemap`

---

### Task 8: Integration test + verification

**Files:**
- Verify all: `games/dragon-palace-treasure/`

Checklist:
1. All 4 files exist (index.html, css/game.css, js/audio.js, js/game.js)
2. Syntax check both JS files: `node --check`
3. Image references correct (wlh-hero.jpg exists)
4. Start server, open game, verify:
   - Underwater background renders with bubbles
   - Player moves with WASD
   - Treasures can be collected
   - Enemies spawn and can be killed
   - Oxygen drains and bubbles refill
   - Portal appears when goal met
   - Depth transition works
   - Death screen shows stats
   - Audio plays on interaction
5. Fix any issues found

Commit: `chore: final integration fixes for Dragon Palace Treasure`

---
