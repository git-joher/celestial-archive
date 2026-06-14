# Eight Trigrams Furnace Game — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a cinematic wave-survival dodge game where the player survives 3 waves inside Taishang Laojun's Eight Trigrams Furnace as Sun Wukong.

**Architecture:** Single static page with Canvas-based game rendering (5-layer depth, particle system, cinematic effects). DOM overlays for cover screen, choice modals, and ending screen. Game state machine drives flow through IDLE → INTRO → WAVE_1 → CHOICE_1 → WAVE_2 → CHOICE_2 → WAVE_3 → ENDING. Vanilla JS IIFE pattern matching existing `celestial-divination` game.

**Tech Stack:** HTML5, CSS3, vanilla JS (Canvas 2D API, requestAnimationFrame, localStorage), no frameworks or build tools.

---

### Task 1: Create directory structure and HTML page

**Files:**
- Create: `games/eight-trigrams-furnace/index.html`

- [ ] **Step 1: Create the HTML page with all DOM structure**

Write `games/eight-trigrams-furnace/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>八卦炉 — Eight Trigrams Furnace | Celestial Archive</title>
  <meta name="description" content="Survive Taishang Laojun's cosmic crucible as Sun Wukong. Dodge the Samadhi Fire, master the eight trigrams, and forge the legendary Fiery Golden Eyes — or be consumed by the flames.">
  <meta name="robots" content="index, follow">
  <link rel="icon" href="../../favicon.svg" type="image/svg+xml">
  <link rel="canonical" href="https://celestial-archive.com/games/eight-trigrams-furnace/">
  <meta property="og:title" content="八卦炉 — Eight Trigrams Furnace: Survive the Cosmic Crucible">
  <meta property="og:description" content="Dodge the Samadhi Fire inside Taishang Laojun's furnace. Master the eight trigrams and forge the Fiery Golden Eyes.">
  <meta property="og:image" content="https://celestial-archive.com/images/taishang-laojun/tl-furnace.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Eight Trigrams Furnace — Taishang Laojun's cosmic crucible">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://celestial-archive.com/games/eight-trigrams-furnace/">
  <meta property="og:locale" content="en_US">
  <meta property="og:site_name" content="Celestial Archive">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="八卦炉 — Eight Trigrams Furnace">
  <meta name="twitter:description" content="Dodge the Samadhi Fire, master the eight trigrams, and forge the Fiery Golden Eyes.">
  <meta name="twitter:image" content="https://celestial-archive.com/images/taishang-laojun/tl-furnace.jpg">
  <meta name="twitter:image:alt" content="Eight Trigrams Furnace">
  <link rel="stylesheet" href="../../css/global.css">
  <link rel="stylesheet" href="css/furnace.css">
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
    "name": "Eight Trigrams Furnace",
    "description": "Survive Taishang Laojun's cosmic crucible as Sun Wukong. Dodge the Samadhi Fire and forge the legendary Fiery Golden Eyes.",
    "url": "https://celestial-archive.com/games/eight-trigrams-furnace/",
    "image": "https://celestial-archive.com/images/taishang-laojun/tl-furnace.jpg",
    "operatingSystem": "Web Browser",
    "applicationCategory": "GameApplication",
    "author": { "@type": "Organization", "name": "Celestial Archive", "url": "https://celestial-archive.com" },
    "genre": ["Action", "Survival"],
    "playMode": "SinglePlayer",
    "inLanguage": "en"
  }
  </script>
</head>
<body>

  <!-- ===== Cover Screen ===== -->
  <div id="cover-screen" class="cover-screen">
    <div class="cover-bg"></div>
    <div class="cover-content">
      <div class="cover-sigil">🔥</div>
      <p class="cover-kicker">Taishang Laojun's Cosmic Crucible</p>
      <h1 class="cover-title">八卦炉</h1>
      <p class="cover-title-en">Eight Trigrams Furnace</p>
      <div class="cover-divider"></div>
      <p class="cover-sub">炼就火眼金睛，还是化为灰烬？</p>
      <p class="cover-sub-en">Forge the Fiery Golden Eyes — or be consumed.</p>
      <div class="cover-unlocks" id="cover-unlocks">已解锁 <span id="unlock-count">0</span>/3</div>
      <button id="btn-enter" class="btn-enter">入炉受炼 Enter the Furnace</button>
      <p class="cover-controls-hint">WASD / Arrow Keys to move · Click to choose</p>
    </div>
  </div>

  <!-- ===== Game Canvas ===== -->
  <canvas id="furnace-canvas"></canvas>

  <!-- ===== HUD Overlay ===== -->
  <div id="game-hud" class="game-hud">
    <div class="hud-top">
      <div class="hud-wave" id="hud-wave">第一劫·三昧真火</div>
      <div class="hud-hp-container">
        <div class="hud-hp-bar" id="hud-hp-bar"></div>
        <span class="hud-hp-text" id="hud-hp-text">100</span>
      </div>
    </div>
    <div class="hud-timer" id="hud-timer">60</div>
    <div class="hud-narrative" id="hud-narrative"></div>
  </div>

  <!-- ===== Choice Modal ===== -->
  <div id="choice-modal" class="choice-modal">
    <div class="choice-backdrop"></div>
    <div class="choice-container">
      <p class="choice-prompt" id="choice-prompt"></p>
      <div class="choice-cards">
        <button id="choice-a" class="choice-card choice-card-a">
          <span class="choice-card-emoji"></span>
          <span class="choice-card-label"></span>
          <span class="choice-card-desc"></span>
        </button>
        <button id="choice-b" class="choice-card choice-card-b">
          <span class="choice-card-emoji"></span>
          <span class="choice-card-label"></span>
          <span class="choice-card-desc"></span>
        </button>
      </div>
    </div>
  </div>

  <!-- ===== Damage Pulse Overlay ===== -->
  <div id="damage-pulse" class="damage-pulse"></div>

  <!-- ===== Ending Screen ===== -->
  <div id="ending-screen" class="ending-screen">
    <div class="ending-content">
      <div class="ending-icon" id="ending-icon"></div>
      <h2 class="ending-title" id="ending-title"></h2>
      <p class="ending-title-zh" id="ending-title-zh"></p>
      <div class="ending-divider"></div>
      <p class="ending-text" id="ending-text"></p>
      <p class="ending-quote" id="ending-quote"></p>
      <div class="ending-actions">
        <button id="btn-retry" class="btn-retry">再入炉中 Enter Again</button>
        <button id="btn-exit" class="btn-exit">返回封面 Return to Cover</button>
      </div>
    </div>
  </div>

  <!-- ===== Footer ===== -->
  <footer class="site-footer" role="contentinfo">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col">
          <div class="footer-heading">Explore</div>
          <nav class="footer-nav">
            <a href="../../library.html">Knowledge Base</a>
            <a href="../../deities/taishang-laojun/furnace.html">The Furnace Explained</a>
            <a href="../../deities/sun-wukong/">Sun Wukong</a>
            <a href="../../">Game Hub</a>
          </nav>
        </div>
        <div class="footer-col">
          <div class="footer-heading">Company</div>
          <nav class="footer-nav">
            <a href="../../about.html">About Us</a>
            <a href="../../contact.html">Contact Us</a>
            <a href="../../privacy-policy.html">Privacy Policy</a>
          </nav>
        </div>
      </div>
      <p class="footer-copy">&copy; 2026 Celestial Archive. All rights reserved.</p>
    </div>
  </footer>

  <script src="../../js/deities.js"></script>
  <script src="../../js/main.js"></script>
  <script src="js/furnace.js"></script>
  <script>initFurnace();</script>

</body>
</html>
```

- [ ] **Step 2: Verify HTML file exists**

```bash
ls -la games/eight-trigrams-furnace/index.html
```

- [ ] **Step 3: Commit**

```bash
git add games/eight-trigrams-furnace/index.html
git commit -m "feat: add Eight Trigrams Furnace game HTML structure

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Create furnace.css — all DOM UI styles

**Files:**
- Create: `games/eight-trigrams-furnace/css/furnace.css`

- [ ] **Step 1: Write the complete CSS file**

Write `games/eight-trigrams-furnace/css/furnace.css`:

```css
/* ============================================================
   Eight Trigrams Furnace — 八卦炉 Page Styles
   "墨韵敦煌" design system — cinematic furnace interior
   ============================================================ */

/* ---- Page body ---- */
body {
  background: #0d0a14;
  color: var(--text-on-dark);
  margin: 0;
  padding: 0;
  overflow: hidden;
  min-height: 100vh;
  min-height: 100dvh;
  font-family: var(--font-body);
}

/* ---- Canvas ---- */
#furnace-canvas {
  position: fixed;
  inset: 0;
  z-index: 1;
  display: block;
}

/* ---- Cover Screen ---- */
.cover-screen {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0d0a14;
  transition: opacity 0.8s ease-out;
}
.cover-screen.hidden {
  opacity: 0;
  pointer-events: none;
}
.cover-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 60%, rgba(196,77,52,0.12) 0%, transparent 60%),
              radial-gradient(ellipse at 50% 40%, rgba(201,168,76,0.06) 0%, transparent 50%);
  animation: cover-flicker 4s ease-in-out infinite;
}
@keyframes cover-flicker {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}
.cover-content {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 520px;
  padding: var(--space-lg);
}
.cover-sigil {
  font-size: 4rem;
  margin-bottom: var(--space-sm);
  filter: drop-shadow(0 0 30px rgba(196,77,52,0.4));
  animation: sigil-pulse 2s ease-in-out infinite;
}
@keyframes sigil-pulse {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 30px rgba(196,77,52,0.4)); }
  50% { transform: scale(1.08); filter: drop-shadow(0 0 50px rgba(255,170,0,0.6)); }
}
.cover-kicker {
  font-family: var(--font-display);
  font-size: 0.72rem;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: var(--accent-vermillion);
  margin-bottom: var(--space-sm);
}
.cover-title {
  font-family: var(--font-chinese-display);
  font-size: clamp(2.8rem, 7vw, 4rem);
  color: var(--text-on-dark);
  text-shadow: 0 0 60px rgba(196,77,52,0.3), 0 0 120px rgba(201,168,76,0.15);
  margin-bottom: 0;
  line-height: 1.1;
}
.cover-title-en {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--accent-gold);
  letter-spacing: 3px;
  margin-bottom: var(--space-md);
  text-transform: uppercase;
}
.cover-divider {
  width: 60px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent-vermillion), transparent);
  margin: 0 auto var(--space-md);
}
.cover-sub {
  font-family: var(--font-chinese-body);
  font-size: 1.2rem;
  color: var(--text-on-dark);
  font-style: italic;
  margin-bottom: 4px;
}
.cover-sub-en {
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-style: italic;
  margin-bottom: var(--space-lg);
}
.cover-unlocks {
  font-family: var(--font-display);
  font-size: 0.75rem;
  letter-spacing: 2px;
  color: var(--accent-gold);
  margin-bottom: var(--space-md);
}
.cover-unlocks span {
  color: var(--text-on-dark);
  font-size: 1.1rem;
}
.btn-enter {
  display: inline-block;
  font-family: var(--font-display);
  font-size: 1rem;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--text-on-dark);
  background: rgba(196,77,52,0.2);
  border: 1px solid rgba(196,77,52,0.5);
  padding: 14px 40px;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: var(--space-md);
}
.btn-enter:hover {
  background: rgba(196,77,52,0.4);
  border-color: var(--accent-vermillion);
  box-shadow: 0 0 30px rgba(196,77,52,0.3);
  transform: scale(1.03);
}
.cover-controls-hint {
  font-size: 0.7rem;
  color: rgba(232,220,200,0.3);
  letter-spacing: 1px;
}

/* ---- HUD ---- */
.game-hud {
  position: fixed;
  inset: 0;
  z-index: 10;
  pointer-events: none;
  padding: var(--space-sm);
  display: none;
}
.game-hud.active { display: block; }
.hud-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-sm);
}
.hud-wave {
  font-family: var(--font-display);
  font-size: 0.8rem;
  letter-spacing: 2px;
  color: var(--accent-gold);
  text-shadow: 0 0 10px rgba(201,168,76,0.3);
}
.hud-hp-container {
  display: flex;
  align-items: center;
  gap: 8px;
}
.hud-hp-bar {
  width: 120px;
  height: 6px;
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}
.hud-hp-bar::after {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: var(--hp-pct, 100%);
  background: linear-gradient(90deg, #c44d34, #e06040);
  border-radius: 3px;
  transition: width 0.3s;
}
.hud-hp-text {
  font-family: var(--font-display);
  font-size: 0.8rem;
  color: var(--text-on-dark);
  min-width: 24px;
}
.hud-timer {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-display);
  font-size: 1.4rem;
  color: rgba(232,220,200,0.4);
}
.hud-narrative {
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  font-family: var(--font-chinese-body);
  font-size: 1rem;
  color: var(--text-on-dark);
  font-style: italic;
  opacity: 0;
  transition: opacity 1s;
  text-shadow: 0 0 20px rgba(196,77,52,0.4);
  max-width: 400px;
}
.hud-narrative.show { opacity: 1; }

/* ---- Choice Modal ---- */
.choice-modal {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: none;
  align-items: center;
  justify-content: center;
}
.choice-modal.active { display: flex; }
.choice-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(4px);
}
.choice-container {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 560px;
  width: 90%;
}
.choice-prompt {
  font-family: var(--font-chinese-body);
  font-size: 1.1rem;
  color: var(--text-on-dark);
  margin-bottom: var(--space-lg);
  font-style: italic;
}
.choice-cards {
  display: flex;
  gap: var(--space-md);
  justify-content: center;
  flex-wrap: wrap;
}
.choice-card {
  flex: 1;
  min-width: 200px;
  max-width: 250px;
  padding: var(--space-lg) var(--space-md);
  background: rgba(26,16,10,0.9);
  border: 1px solid rgba(201,168,76,0.2);
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}
.choice-card:hover {
  border-color: var(--accent-gold);
  box-shadow: 0 0 30px rgba(201,168,76,0.15);
  transform: translateY(-2px);
}
.choice-card-emoji {
  font-size: 2rem;
  margin-bottom: 4px;
}
.choice-card-label {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--text-on-dark);
}
.choice-card-desc {
  font-family: var(--font-body);
  font-size: 0.78rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* ---- Damage Pulse ---- */
.damage-pulse {
  position: fixed;
  inset: 0;
  z-index: 15;
  pointer-events: none;
  background: transparent;
  transition: background 0.1s;
}
.damage-pulse.active {
  background: rgba(196,77,52,0.2);
  transition: background 0s;
}

/* ---- Ending Screen ---- */
.ending-screen {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: none;
  align-items: center;
  justify-content: center;
  background: rgba(13,10,20,0.95);
  backdrop-filter: blur(8px);
}
.ending-screen.active { display: flex; }
.ending-content {
  text-align: center;
  max-width: 520px;
  padding: var(--space-lg);
}
.ending-icon {
  font-size: 4rem;
  margin-bottom: var(--space-sm);
}
.ending-title {
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 4vw, 2.2rem);
  color: var(--text-on-dark);
  margin-bottom: 4px;
}
.ending-title-zh {
  font-family: var(--font-chinese-display);
  font-size: 1.1rem;
  color: var(--accent-gold);
  margin-bottom: var(--space-sm);
}
.ending-divider {
  width: 40px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent-gold), transparent);
  margin: 0 auto var(--space-md);
}
.ending-text {
  font-family: var(--font-body);
  font-size: 0.95rem;
  color: rgba(232,220,200,0.8);
  line-height: 1.7;
  margin-bottom: var(--space-sm);
}
.ending-quote {
  font-family: var(--font-chinese-body);
  font-size: 1rem;
  color: var(--accent-gold);
  font-style: italic;
  margin-bottom: var(--space-lg);
}
.ending-actions {
  display: flex;
  gap: var(--space-sm);
  justify-content: center;
  flex-wrap: wrap;
}
.btn-retry, .btn-exit {
  font-family: var(--font-display);
  font-size: 0.8rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  padding: 12px 28px;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-retry {
  color: var(--text-on-dark);
  background: rgba(196,77,52,0.2);
  border: 1px solid rgba(196,77,52,0.5);
}
.btn-retry:hover {
  background: rgba(196,77,52,0.4);
  border-color: var(--accent-vermillion);
  box-shadow: 0 0 25px rgba(196,77,52,0.25);
}
.btn-exit {
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid rgba(232,220,200,0.15);
}
.btn-exit:hover {
  color: var(--text-on-dark);
  border-color: rgba(232,220,200,0.4);
}

/* ---- Keyboard hint ---- */
.cover-controls-hint {
  font-size: 0.65rem;
  color: rgba(232,220,200,0.25);
  letter-spacing: 1px;
  margin-top: var(--space-xs);
}

/* ---- Mobile adjustments ---- */
@media (max-width: 640px) {
  .choice-cards {
    flex-direction: column;
    align-items: center;
  }
  .choice-card {
    max-width: 100%;
    min-width: unset;
    width: 100%;
  }
  .hud-hp-bar {
    width: 80px;
  }
  .hud-wave {
    font-size: 0.65rem;
    letter-spacing: 1px;
  }
  .cover-title {
    font-size: 2.2rem;
  }
  .btn-enter {
    padding: 12px 30px;
    font-size: 0.85rem;
  }
}
```

- [ ] **Step 2: Verify CSS file exists**

```bash
ls -la games/eight-trigrams-furnace/css/furnace.css
```

- [ ] **Step 3: Commit**

```bash
git add games/eight-trigrams-furnace/css/furnace.css
git commit -m "feat: add furnace game CSS — cover, HUD, modals, endings

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Create furnace.js — canvas, game loop, state, particle system, rendering, controls, waves, choices, endings

**Files:**
- Create: `games/eight-trigrams-furnace/js/furnace.js`

This is the complete game engine in one IIFE module (~650 lines). It follows the `divination.js` pattern.

- [ ] **Step 1: Write the complete furnace.js**

Write `games/eight-trigrams-furnace/js/furnace.js`:

```js
/**
 * Eight Trigrams Furnace — 八卦炉 Core Logic
 * Wave-survival dodge game inside Taishang Laojun's cosmic crucible.
 * Cinematic 5-layer Canvas rendering with particle system.
 *
 * Usage:
 *   <script src="../../js/deities.js"></script>
 *   <script src="../../js/main.js"></script>
 *   <script src="js/furnace.js"></script>
 *   <script>initFurnace();</script>
 */
(function () {
  'use strict';

  window.initFurnace = function () {
    /* ================================================================
       DOM refs
       ================================================================ */
    var canvas = document.getElementById('furnace-canvas');
    var ctx = canvas.getContext('2d');
    var coverScreen = document.getElementById('cover-screen');
    var btnEnter = document.getElementById('btn-enter');
    var unlockCount = document.getElementById('unlock-count');
    var gameHud = document.getElementById('game-hud');
    var hudWave = document.getElementById('hud-wave');
    var hudHpBar = document.getElementById('hud-hp-bar');
    var hudHpText = document.getElementById('hud-hp-text');
    var hudTimer = document.getElementById('hud-timer');
    var hudNarrative = document.getElementById('hud-narrative');
    var choiceModal = document.getElementById('choice-modal');
    var choicePrompt = document.getElementById('choice-prompt');
    var choiceA = document.getElementById('choice-a');
    var choiceB = document.getElementById('choice-b');
    var damagePulse = document.getElementById('damage-pulse');
    var endingScreen = document.getElementById('ending-screen');
    var endingIcon = document.getElementById('ending-icon');
    var endingTitle = document.getElementById('ending-title');
    var endingTitleZh = document.getElementById('ending-title-zh');
    var endingText = document.getElementById('ending-text');
    var endingQuote = document.getElementById('ending-quote');
    var btnRetry = document.getElementById('btn-retry');
    var btnExit = document.getElementById('btn-exit');

    if (!canvas) return;

    /* ================================================================
       localStorage keys
       ================================================================ */
    var STORAGE_ENDINGS = 'eight-trigrams-furnace-endings';
    var STORAGE_BEST = 'eight-trigrams-furnace-best';
    var STORAGE_FIRE_EYES = 'eight-trigrams-fire-eyes-unlocked'; // cross-page easter egg

    /* ================================================================
       Trigram ring layout — 8 positions on a circle
       ================================================================ */
    var TRIGRAMS = [
      { symbol: '☰', name: 'Qian', force: 'Heaven', angle: -Math.PI / 2 },
      { symbol: '☷', name: 'Kun', force: 'Earth', angle: -Math.PI / 2 + Math.PI / 4 },
      { symbol: '☲', name: 'Li', force: 'Fire', angle: -Math.PI / 2 + 2 * Math.PI / 4 },
      { symbol: '☵', name: 'Kan', force: 'Water', angle: -Math.PI / 2 + 3 * Math.PI / 4 },
      { symbol: '☳', name: 'Zhen', force: 'Thunder', angle: -Math.PI / 2 + 4 * Math.PI / 4 },
      { symbol: '☴', name: 'Xun', force: 'Wind', angle: -Math.PI / 2 + 5 * Math.PI / 4 },
      { symbol: '☶', name: 'Gen', force: 'Mountain', angle: -Math.PI / 2 + 6 * Math.PI / 4 },
      { symbol: '☱', name: 'Dui', force: 'Lake', angle: -Math.PI / 2 + 7 * Math.PI / 4 }
    ];

    /* ================================================================
       Wave configuration
       ================================================================ */
    var WAVE_CONFIG = {
      1: { spawners: 3, speed: 1.2, interval: 1800, damage: 8, smoke: 0, title: '第一劫·三昧真火', narEn: 'Samadhi Fire', narZh: '三昧真火扑面而来，八卦炉中无处可逃…' },
      2: { spawners: 5, speed: 1.8, interval: 1200, damage: 12, smoke: 3, title: '第二劫·八卦轮转', narEn: 'Trigram Wheel', narZh: '炉中八卦运转，风火相激，浓烟蔽目…' },
      3: { spawners: 7, speed: 2.4, interval: 800, damage: 16, smoke: 5, title: '第三劫·炉破天惊', narEn: 'Furnace Breaks', narZh: '炉壁崩裂，金光透入——撑住，就快出去了！' }
    };

    /* ================================================================
       Game state
       ================================================================ */
    var state = {
      phase: 'IDLE',       // IDLE | INTRO | WAVE | CHOICE | ENDING
      wave: 1,
      hp: 100,
      maxHp: 100,
      waveTimer: 60,
      waveTimeLeft: 60,
      choice1: null,       // 'wind' | 'pill'
      choice2: null,       // 'qi' | 'shake'
      playerX: 0.5,        // normalized [0,1] within furnace circle
      playerY: 0.5,
      playerRadius: 0.04,  // normalized
      furnaceRadius: 0.42, // normalized
      shakeX: 0,
      shakeY: 0,
      shakeDecay: 0,
      ending: null         // 'fire-eyes' | 'cloud-escape' | 'nirvana'
    };

    /* ================================================================
       Particle & projectile pools
       ================================================================ */
    var particles = [];
    var projectiles = [];
    var smokeClouds = [];
    var cracks = [];
    var spawnTimers = [];
    var MAX_PARTICLES = 300;
    var MAX_PROJECTILES = 30;
    var MAX_SMOKE = 8;

    /* ================================================================
       Input state
       ================================================================ */
    var keys = {};
    var touchActive = false;
    var touchDeltaX = 0;
    var touchDeltaY = 0;
    var lastTouchX = 0;
    var lastTouchY = 0;

    /* ================================================================
       Timing
       ================================================================ */
    var lastFrameTime = 0;
    var waveStartTime = 0;
    var introStartTime = 0;
    var animFrameId = null;
    var frameCount = 0;

    /* ================================================================
       Canvas sizing
       ================================================================ */
    function resizeCanvas() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = window.innerWidth;
      var h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }

    /* ================================================================
       Helpers
       ================================================================ */
    function normToPixel(nx, ny) {
      var size = Math.min(canvas.width, canvas.height) / (window.devicePixelRatio || 2);
      var cx = canvas.width / (window.devicePixelRatio || 2) / 2;
      var cy = canvas.height / (window.devicePixelRatio || 2) / 2;
      return { x: cx + (nx - 0.5) * size, y: cy + (ny - 0.5) * size };
    }

    function furnaceCenter() {
      return {
        x: canvas.width / (window.devicePixelRatio || 2) / 2,
        y: canvas.height / (window.devicePixelRatio || 2) / 2,
        size: Math.min(canvas.width, canvas.height) / (window.devicePixelRatio || 2)
      };
    }

    function dist(x1, y1, x2, y2) {
      var dx = x1 - x2;
      var dy = y1 - y2;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function lerp(a, b, t) { return a + (b - a) * t; }

    /* ================================================================
       Particle system
       ================================================================ */
    function spawnParticle(x, y, vx, vy, life, r, color, glowColor) {
      if (particles.length >= MAX_PARTICLES) return;
      particles.push({
        x: x, y: y, vx: vx, vy: vy,
        life: life, maxLife: life,
        r: r, maxR: r,
        color: color || '#ff6600',
        glowColor: glowColor || 'rgba(255,100,0,0.5)'
      });
    }

    function spawnFireTail(x, y, count) {
      for (var i = 0; i < count; i++) {
        var angle = Math.random() * Math.PI * 2;
        var speed = Math.random() * 40 + 10;
        var life = 0.3 + Math.random() * 0.5;
        var r = 2 + Math.random() * 4;
        var colors = ['#ff4400', '#ff8800', '#ffaa00', '#cc2200'];
        var c = colors[Math.floor(Math.random() * colors.length)];
        spawnParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, life, r, c, 'rgba(255,80,0,0.4)');
      }
    }

    function updateParticles(dt) {
      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        p.r = p.maxR * (p.life / p.maxLife);
        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }
    }

    function drawParticles(ctx, center) {
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var alpha = Math.max(0, p.life / p.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        // Glow
        var glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        glow.addColorStop(0, p.glowColor);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fill();
        // Core
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    /* ================================================================
       Projectile system
       ================================================================ */
    function spawnProjectile(fromAngle, speed) {
      if (projectiles.length >= MAX_PROJECTILES) return;
      var center = furnaceCenter();
      var cx = center.x;
      var cy = center.y;
      var size = center.size;
      var r = size * state.furnaceRadius;
      var sx = cx + Math.cos(fromAngle) * r;
      var sy = cy + Math.sin(fromAngle) * r;
      var px = state.playerX;
      var py = state.playerY;
      var ppx = cx + (px - 0.5) * size;
      var ppy = cy + (py - 0.5) * size;
      var dx = ppx - sx;
      var dy = ppy - sy;
      var len = Math.sqrt(dx * dx + dy * dy);
      if (len < 1) { dx = (Math.random() - 0.5) * 2; dy = (Math.random() - 0.5) * 2; len = 1; }
      var baseSpeed = size * speed * 0.35;
      projectiles.push({
        x: sx, y: sy,
        vx: (dx / len) * baseSpeed,
        vy: (dy / len) * baseSpeed,
        r: size * 0.012,
        life: 3.0,
        color: '#ff4400',
        glowColor: 'rgba(255,80,0,0.6)'
      });
    }

    function updateProjectiles(dt) {
      for (var i = projectiles.length - 1; i >= 0; i--) {
        var p = projectiles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        // Fade as it travels
        p.life -= dt;
        // Trail
        if (frameCount % 2 === 0) {
          spawnParticle(p.x, p.y, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, 0.25, 3, '#ff6600', 'rgba(255,100,0,0.4)');
        }
        // Remove if too far from center or expired
        var center = furnaceCenter();
        var d = dist(p.x, p.y, center.x, center.y);
        if (d > center.size * 0.7 || p.life <= 0) {
          projectiles.splice(i, 1);
        }
      }
    }

    function drawProjectiles(ctx) {
      for (var i = 0; i < projectiles.length; i++) {
        var p = projectiles[i];
        ctx.save();
        // Outer glow
        var glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        glow.addColorStop(0, p.glowColor);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fill();
        // Core
        var core = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        core.addColorStop(0, '#ffdd88');
        core.addColorStop(0.5, p.color);
        core.addColorStop(1, '#881100');
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    /* ================================================================
       Smoke clouds
       ================================================================ */
    function spawnSmokeCloud() {
      if (smokeClouds.length >= MAX_SMOKE) return;
      var center = furnaceCenter();
      var size = center.size;
      var angle = Math.random() * Math.PI * 2;
      var dist = size * (0.15 + Math.random() * 0.3);
      smokeClouds.push({
        x: center.x + Math.cos(angle) * dist,
        y: center.y + Math.sin(angle) * dist,
        r: size * (0.06 + Math.random() * 0.1),
        maxR: size * (0.1 + Math.random() * 0.15),
        life: 3 + Math.random() * 4,
        maxLife: 7,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 10 - 15,
        alpha: 0.15 + Math.random() * 0.25
      });
    }

    function updateSmokeClouds(dt) {
      for (var i = smokeClouds.length - 1; i >= 0; i--) {
        var s = smokeClouds[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life -= dt;
        if (s.life <= 0) {
          smokeClouds.splice(i, 1);
        }
      }
    }

    function drawSmokeClouds(ctx) {
      for (var i = 0; i < smokeClouds.length; i++) {
        var s = smokeClouds[i];
        var alpha = s.alpha * Math.min(1, s.life / (s.maxLife * 0.3)) * Math.min(1, (s.maxLife - s.life) / (s.maxLife * 0.3));
        var grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
        grad.addColorStop(0, 'rgba(60,40,70,' + alpha + ')');
        grad.addColorStop(0.5, 'rgba(40,25,50,' + (alpha * 0.6) + ')');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    /* ================================================================
       Cracks (Wave 3)
       ================================================================ */
    function spawnCracks() {
      cracks = [];
      var center = furnaceCenter();
      var size = center.size;
      var r = size * state.furnaceRadius;
      for (var i = 0; i < 6; i++) {
        var angle = (i / 6) * Math.PI * 2 + Math.random() * 0.3;
        var cx = center.x + Math.cos(angle) * r * 0.7;
        var cy = center.y + Math.sin(angle) * r * 0.7;
        var points = [];
        var len = r * (0.3 + Math.random() * 0.5);
        var a = angle + (Math.random() - 0.5) * 0.6;
        var sx = cx;
        var sy = cy;
        for (var j = 0; j < 4; j++) {
          sx += Math.cos(a) * len * 0.25;
          sy += Math.sin(a) * len * 0.25;
          a += (Math.random() - 0.5) * 0.8;
          points.push({ x: sx, y: sy });
        }
        cracks.push({ points: points, alpha: 0.3 + Math.random() * 0.5, pulse: Math.random() * Math.PI * 2 });
      }
    }

    function drawCracks(ctx) {
      if (state.wave !== 3) return;
      var t = performance.now() * 0.001;
      for (var i = 0; i < cracks.length; i++) {
        var c = cracks[i];
        var alpha = c.alpha + Math.sin(t * 2 + c.pulse) * 0.2;
        ctx.save();
        ctx.globalAlpha = Math.max(0.1, Math.min(1, alpha));
        ctx.strokeStyle = '#ffeebb';
        ctx.lineWidth = 2 + Math.sin(t * 3 + i) * 1;
        ctx.shadowColor = 'rgba(255,200,100,0.6)';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(c.points[0].x, c.points[0].y);
        for (var j = 1; j < c.points.length; j++) {
          ctx.lineTo(c.points[j].x, c.points[j].y);
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    /* ================================================================
       Rendering: furnace walls
       ================================================================ */
    function drawFurnaceWalls(ctx) {
      var center = furnaceCenter();
      var cx = center.x;
      var cy = center.y;
      var size = center.size;
      var r = size * state.furnaceRadius;

      // Outer dark
      var outerGrad = ctx.createRadialGradient(cx, cy, r * 0.85, cx, cy, size * 0.75);
      outerGrad.addColorStop(0, '#1a1010');
      outerGrad.addColorStop(0.7, '#0d0a14');
      outerGrad.addColorStop(1, '#060408');
      ctx.fillStyle = outerGrad;
      ctx.fillRect(0, 0, canvas.width / (window.devicePixelRatio || 2), canvas.height / (window.devicePixelRatio || 2));

      // Furnace floor — warm copper disc
      var floorGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      floorGrad.addColorStop(0, '#2a1a0a');
      floorGrad.addColorStop(0.6, '#1a1010');
      floorGrad.addColorStop(0.9, '#0d0a14');
      floorGrad.addColorStop(1, '#0d0a14');
      ctx.fillStyle = floorGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Furnace wall ring
      ctx.strokeStyle = 'rgba(201,168,76,0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Inner ring
      ctx.strokeStyle = 'rgba(201,168,76,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    }

    /* ================================================================
       Rendering: trigram ring
       ================================================================ */
    function drawTrigramRing(ctx) {
      var center = furnaceCenter();
      var cx = center.x;
      var cy = center.y;
      var size = center.size;
      var r = size * state.furnaceRadius * 0.88;
      var t = performance.now() * 0.001;
      var ringRotation = (state.wave >= 2) ? t * 0.15 : 0;

      for (var i = 0; i < TRIGRAMS.length; i++) {
        var tri = TRIGRAMS[i];
        var angle = tri.angle + ringRotation;
        var tx = cx + Math.cos(angle) * r;
        var ty = cy + Math.sin(angle) * r;

        // Golden glow on active spawners
        var isActive = state.phase === 'WAVE';
        var glowAlpha = isActive ? 0.3 + Math.sin(t * 3 + i) * 0.2 : 0.1;
        var glow = ctx.createRadialGradient(tx, ty, 0, tx, ty, size * 0.06);
        glow.addColorStop(0, 'rgba(255,215,0,' + glowAlpha + ')');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(tx, ty, size * 0.06, 0, Math.PI * 2);
        ctx.fill();

        // Trigram symbol
        ctx.fillStyle = 'rgba(201,168,76,' + (0.5 + Math.sin(t * 2 + i * 0.8) * 0.2) + ')';
        ctx.font = (size * 0.05) + 'px "Noto Serif SC", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(255,215,0,0.3)';
        ctx.shadowBlur = 6;
        ctx.fillText(tri.symbol, tx, ty);
        ctx.shadowBlur = 0;
      }
    }

    /* ================================================================
       Rendering: player
       ================================================================ */
    function drawPlayer(ctx) {
      var center = furnaceCenter();
      var size = center.size;
      var px = center.x + (state.playerX - 0.5) * size;
      var py = center.y + (state.playerY - 0.5) * size;
      var r = size * state.playerRadius;
      var t = performance.now() * 0.001;

      // Qi halo
      var haloAlpha = 0.25 + Math.sin(t * 2) * 0.08;
      var haloGrad = ctx.createRadialGradient(px, py, r * 0.8, px, py, r * 2.5);
      haloGrad.addColorStop(0, 'rgba(255,200,100,' + haloAlpha + ')');
      haloGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(px, py, r * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Body — golden silhouette
      var bodyGrad = ctx.createRadialGradient(px, py, 0, px, py, r);
      bodyGrad.addColorStop(0, 'rgba(255,220,150,0.9)');
      bodyGrad.addColorStop(0.6, 'rgba(200,150,80,0.7)');
      bodyGrad.addColorStop(1, 'rgba(150,100,40,0)');
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();

      // Eye glow (Fiery Golden Eyes hint)
      var eyeGlow = ctx.createRadialGradient(px, py - r * 0.2, 0, px, py - r * 0.2, r * 0.6);
      eyeGlow.addColorStop(0, 'rgba(255,200,50,0.7)');
      eyeGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = eyeGlow;
      ctx.beginPath();
      ctx.arc(px, py - r * 0.2, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    /* ================================================================
       Rendering: vignette
       ================================================================ */
    function drawVignette(ctx) {
      var w = canvas.width / (window.devicePixelRatio || 2);
      var h = canvas.height / (window.devicePixelRatio || 2);
      var cx = w / 2;
      var cy = h / 2;
      var r = Math.max(w, h) * 0.7;
      var grad = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    /* ================================================================
       Collision detection
       ================================================================ */
    function checkCollisions() {
      var center = furnaceCenter();
      var size = center.size;
      var px = center.x + (state.playerX - 0.5) * size;
      var py = center.y + (state.playerY - 0.5) * size;
      var pr = size * state.playerRadius * 0.7;

      for (var i = projectiles.length - 1; i >= 0; i--) {
        var proj = projectiles[i];
        var d = dist(px, py, proj.x, proj.y);
        if (d < pr + proj.r) {
          // Hit!
          applyDamage(WAVE_CONFIG[state.wave].damage);
          spawnFireTail(proj.x, proj.y, 8);
          projectiles.splice(i, 1);
        }
      }
    }

    function applyDamage(amount) {
      var actualDamage = amount;
      if (state.choice1 === 'wind') {
        actualDamage = Math.floor(amount * 0.8);
      }
      state.hp = Math.max(0, state.hp - actualDamage);
      // Screen shake
      state.shakeDecay = Math.max(state.shakeDecay, 8);
      // Damage pulse
      damagePulse.classList.add('active');
      setTimeout(function () { damagePulse.classList.remove('active'); }, 100);
      // Update HUD
      updateHud();

      if (state.hp <= 0) {
        endGame('nirvana');
      }
    }

    /* ================================================================
       Update HUD
       ================================================================ */
    function updateHud() {
      var pct = (state.hp / state.maxHp * 100).toFixed(0);
      hudHpBar.style.setProperty('--hp-pct', pct + '%');
      hudHpText.textContent = pct;
      hudTimer.textContent = Math.ceil(state.waveTimeLeft);
    }

    /* ================================================================
       Spawn management
       ================================================================ */
    function updateSpawning(now) {
      if (state.phase !== 'WAVE') return;
      var config = WAVE_CONFIG[state.wave];
      var interval = config.interval;

      // Choose which spawners to fire from
      var numSpawners = config.spawners;
      var allAngles = TRIGRAMS.map(function (t) { return t.angle + (state.wave >= 2 ? performance.now() * 0.001 * 0.15 : 0); });

      // Shuffle and pick spawners
      var activeCount = Math.min(numSpawners, allAngles.length);
      // Use frame-based staggering
      var cycleLength = Math.max(1, Math.floor(interval / 200));
      var cycleIndex = Math.floor(frameCount / 3) % cycleLength;
      var spawnCount = Math.ceil(activeCount / cycleLength);

      if (frameCount % Math.max(1, Math.floor(interval / (1000 / 60))) === 0) {
        // Pick which spawners fire this round
        var shuffled = allAngles.slice();
        for (var s = shuffled.length - 1; s > 0; s--) {
          var j = Math.floor(Math.random() * (s + 1));
          var tmp = shuffled[s]; shuffled[s] = shuffled[j]; shuffled[j] = tmp;
        }
        for (var k = 0; k < spawnCount && k < shuffled.length; k++) {
          spawnProjectile(shuffled[k], WAVE_CONFIG[state.wave].speed);
        }
      }

      // Smoke spawning
      if (config.smoke > 0 && smokeClouds.length < config.smoke && frameCount % 120 === 0) {
        spawnSmokeCloud();
      }
    }

    /* ================================================================
       Player movement
       ================================================================ */
    function updatePlayerMovement(dt) {
      if (state.phase !== 'WAVE') return;

      var speed = 0.35; // normalized units per second
      if (state.choice2 === 'qi') {
        speed *= 1.3;
      }

      var dx = 0, dy = 0;
      if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

      // Touch input
      if (touchActive) {
        dx = touchDeltaX * 0.02;
        dy = touchDeltaY * 0.02;
        touchDeltaX *= 0.9;
        touchDeltaY *= 0.9;
      }

      // Normalize diagonal
      if (dx !== 0 && dy !== 0) {
        var mag = Math.sqrt(dx * dx + dy * dy);
        dx /= mag;
        dy /= mag;
      }

      state.playerX += dx * speed * dt;
      state.playerY += dy * speed * dt;

      // Clamp to furnace circle
      var dFromCenter = dist(state.playerX, state.playerY, 0.5, 0.5);
      var maxDist = state.furnaceRadius - state.playerRadius * 2;
      if (dFromCenter > maxDist) {
        var angle = Math.atan2(state.playerY - 0.5, state.playerX - 0.5);
        state.playerX = 0.5 + Math.cos(angle) * maxDist;
        state.playerY = 0.5 + Math.sin(angle) * maxDist;
      }
    }

    /* ================================================================
       Screen shake
       ================================================================ */
    function updateShake(dt) {
      if (state.shakeDecay > 0.01) {
        state.shakeX = (Math.random() - 0.5) * state.shakeDecay;
        state.shakeY = (Math.random() - 0.5) * state.shakeDecay;
        state.shakeDecay *= Math.pow(0.05, dt);
      } else {
        state.shakeX = 0;
        state.shakeY = 0;
      }
    }

    /* ================================================================
       Choices
       ================================================================ */
    function showChoice(choiceNum) {
      state.phase = 'CHOICE';
      choiceModal.classList.add('active');

      if (choiceNum === 1) {
        choicePrompt.textContent = '烈火焚身，如何应对？ The flames close in — what do you do?';

        choiceA.querySelector('.choice-card-emoji').textContent = '🌬️';
        choiceA.querySelector('.choice-card-label').textContent = '躲进巽位风眼';
        choiceA.querySelector('.choice-card-desc').textContent = 'Hide in Wind\'s Eye — 巽为风，风眼无火。下一劫减伤20%，但消耗真气。';

        choiceB.querySelector('.choice-card-emoji').textContent = '💊';
        choiceB.querySelector('.choice-card-label').textContent = '硬抗烈火吞金丹';
        choiceB.querySelector('.choice-card-desc').textContent = 'Swallow the Golden Pill — 吞下炉中残丹，恢复30%生命，但下一劫火势更烈。';
      } else {
        choicePrompt.textContent = '炉中八卦轮转，如何破局？ The trigrams spin — what\'s your move?';

        choiceA.querySelector('.choice-card-emoji').textContent = '🌀';
        choiceA.querySelector('.choice-card-label').textContent = '运转内息';
        choiceA.querySelector('.choice-card-desc').textContent = 'Circulate Inner Qi — 真气贯通全身，移动速度+30%。';

        choiceB.querySelector('.choice-card-emoji').textContent = '💥';
        choiceB.querySelector('.choice-card-label').textContent = '撼动炉壁';
        choiceB.querySelector('.choice-card-desc').textContent = 'Shake the Furnace — 用金箍棒砸炉壁，下一劫缩短15秒，但火焰更密集。';
      }
    }

    function hideChoice() {
      choiceModal.classList.remove('active');
    }

    function makeChoice(choiceNum, value) {
      if (choiceNum === 1) {
        state.choice1 = value;
        if (value === 'pill') {
          state.hp = Math.min(state.maxHp, state.hp + 30);
          updateHud();
        }
        hideChoice();
        startWave(2);
      } else {
        state.choice2 = value;
        hideChoice();
        startWave(3);
      }
    }

    /* ================================================================
       Wave management
       ================================================================ */
    function startWave(waveNum) {
      state.wave = waveNum;
      state.phase = 'WAVE';
      state.waveTimeLeft = (waveNum === 3 && state.choice2 === 'shake') ? 45 : 60;
      var config = WAVE_CONFIG[waveNum];
      hudWave.textContent = config.title;

      // Show narrative
      hudNarrative.textContent = config.narZh;
      hudNarrative.classList.add('show');
      setTimeout(function () {
        hudNarrative.classList.remove('show');
      }, 4000);

      // Wave 3: spawn cracks
      if (waveNum === 3) {
        spawnCracks();
      }

      // Clear some projectiles between waves
      projectiles = [];
      waveStartTime = performance.now();
    }

    /* ================================================================
       Ending system
       ================================================================ */
    function determineEnding() {
      if (state.hp <= 0) return 'nirvana';
      if (state.hp > 40 && state.choice1 === 'pill' && state.choice2 === 'qi') return 'fire-eyes';
      return 'cloud-escape';
    }

    function endGame(forcedEnding) {
      state.phase = 'ENDING';
      state.ending = forcedEnding || determineEnding();
      gameHud.classList.remove('active');

      // Save to localStorage
      saveEnding(state.ending);

      // Show ending screen
      var endings = {
        'fire-eyes': {
          icon: '🔥👁️',
          title: 'Fiery Golden Eyes',
          zh: '火眼金睛',
          text: '炉壁崩裂，金光万丈。悟空双眼灼灼如熔金，一掌推开千斤炉盖——三昧真火非但未伤他分毫，反将肉身炼成了不坏金身。那双眼睛，从此可辨妖邪、识变化、看穿三界一切幻象。',
          quote: '"老孙出来了！这炉子，不过如此！"'
        },
        'cloud-escape': {
          icon: '☁️',
          title: 'Cloud Escape',
          zh: '劫后余生',
          text: '悟空撑到了炉壁裂开的一刻，翻一个筋斗云冲出火海。虽然没有炼成火眼金睛，但能活着从八卦炉里出来，已是万中无一。他远远望着离恨天兜率宫，咬牙暗自发誓。',
          quote: '"这笔账，改日再算。"'
        },
        'nirvana': {
          icon: '🕯️',
          title: 'Nirvana in Furnace',
          zh: '炉中涅槃',
          text: '火焰吞没了悟空的身躯……但石猴本非凡胎。炉灰之中，一点金光不灭。八卦炉能炼化万物，却炼不化一颗不屈的猴心。下一次，他会更强。',
          quote: '"俺老孙……还没完。"'
        }
      };

      var e = endings[state.ending];
      endingIcon.textContent = e.icon;
      endingTitle.textContent = e.title;
      endingTitleZh.textContent = e.zh;
      endingText.textContent = e.text;
      endingQuote.textContent = e.quote;
      endingScreen.classList.add('active');
    }

    /* ================================================================
       localStorage
       ================================================================ */
    function getStoredEndings() {
      try {
        var raw = localStorage.getItem(STORAGE_ENDINGS);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }

    function saveEnding(endingKey) {
      try {
        var endings = getStoredEndings();
        if (endings.indexOf(endingKey) === -1) {
          endings.push(endingKey);
          localStorage.setItem(STORAGE_ENDINGS, JSON.stringify(endings));
          // Set cross-page easter egg flag
          if (endingKey === 'fire-eyes') {
            localStorage.setItem(STORAGE_FIRE_EYES, '1');
          }
        }
        // Save best
        var best = { ending: endingKey, hp: state.hp, date: new Date().toISOString().split('T')[0] };
        var prevBest = null;
        try {
          var raw = localStorage.getItem(STORAGE_BEST);
          prevBest = raw ? JSON.parse(raw) : null;
        } catch (e) {}
        if (!prevBest || state.hp > prevBest.hp || (state.hp === prevBest.hp && endingKey === 'fire-eyes' && prevBest.ending !== 'fire-eyes')) {
          localStorage.setItem(STORAGE_BEST, JSON.stringify(best));
        }
      } catch (e) {
        // localStorage unavailable — silent degradation
      }
    }

    function updateCoverUnlocks() {
      var endings = getStoredEndings();
      unlockCount.textContent = endings.length;
    }

    /* ================================================================
       Reset state
       ================================================================ */
    function resetGame() {
      state.phase = 'IDLE';
      state.wave = 1;
      state.hp = state.maxHp;
      state.waveTimeLeft = 60;
      state.choice1 = null;
      state.choice2 = null;
      state.playerX = 0.5;
      state.playerY = 0.5;
      state.shakeX = 0;
      state.shakeY = 0;
      state.shakeDecay = 0;
      state.ending = null;
      particles = [];
      projectiles = [];
      smokeClouds = [];
      cracks = [];
      frameCount = 0;

      endingScreen.classList.remove('active');
      gameHud.classList.remove('active');
      hideChoice();
      updateCoverUnlocks();
      coverScreen.classList.remove('hidden');
      updateHud();
    }

    /* ================================================================
       Main game loop
       ================================================================ */
    function gameLoop(timestamp) {
      animFrameId = requestAnimationFrame(gameLoop);

      if (lastFrameTime === 0) lastFrameTime = timestamp;
      var rawDt = (timestamp - lastFrameTime) / 1000;
      var dt = Math.min(rawDt, 0.1); // Cap to avoid spiral of death
      lastFrameTime = timestamp;
      frameCount++;

      var w = canvas.width / (window.devicePixelRatio || 2);
      var h = canvas.height / (window.devicePixelRatio || 2);
      ctx.clearRect(0, 0, w, h);

      // Update
      updateShake(dt);
      updatePlayerMovement(dt);
      updateParticles(dt);
      updateProjectiles(dt);
      updateSmokeClouds(dt);
      updateSpawning(timestamp);

      if (state.phase === 'WAVE') {
        state.waveTimeLeft -= dt;
        if (state.waveTimeLeft <= 0) {
          state.waveTimeLeft = 0;
          updateHud();
          if (state.wave === 1) {
            showChoice(1);
          } else if (state.wave === 2) {
            showChoice(2);
          } else if (state.wave === 3) {
            endGame();
          }
        }
        updateHud();
      }

      checkCollisions();

      // Render with shake
      ctx.save();
      ctx.translate(state.shakeX, state.shakeY);

      drawFurnaceWalls(ctx);
      drawTrigramRing(ctx);
      drawCracks(ctx);
      drawSmokeClouds(ctx);
      drawProjectiles(ctx);
      drawParticles(ctx, furnaceCenter());
      drawPlayer(ctx);
      drawVignette(ctx);

      ctx.restore();
    }

    /* ================================================================
       Intro animation
       ================================================================ */
    function startIntro() {
      coverScreen.classList.add('hidden');
      state.phase = 'INTRO';
      introStartTime = performance.now();
      gameHud.classList.add('active');
      hudWave.textContent = '入炉... Entering the Furnace';
      updateHud();

      // Start first wave after 3s
      setTimeout(function () {
        startWave(1);
      }, 3000);
    }

    /* ================================================================
       Event listeners
       ================================================================ */
    // Keyboard
    window.addEventListener('keydown', function (e) {
      keys[e.code] = true;
      if (e.code === 'Space' || e.code === 'KeyE') {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', function (e) {
      keys[e.code] = false;
    });

    // Touch
    canvas.addEventListener('touchstart', function (e) {
      e.preventDefault();
      touchActive = true;
      var t = e.touches[0];
      lastTouchX = t.clientX;
      lastTouchY = t.clientY;
      touchDeltaX = 0;
      touchDeltaY = 0;
    }, { passive: false });

    canvas.addEventListener('touchmove', function (e) {
      e.preventDefault();
      if (!touchActive) return;
      var t = e.touches[0];
      touchDeltaX = t.clientX - lastTouchX;
      touchDeltaY = t.clientY - lastTouchY;
      lastTouchX = t.clientX;
      lastTouchY = t.clientY;
    }, { passive: false });

    canvas.addEventListener('touchend', function () {
      touchActive = false;
      touchDeltaX = 0;
      touchDeltaY = 0;
    });

    // Buttons
    btnEnter.addEventListener('click', startIntro);
    btnRetry.addEventListener('click', function () {
      endingScreen.classList.remove('active');
      resetGame();
      startIntro();
    });
    btnExit.addEventListener('click', function () {
      endingScreen.classList.remove('active');
      resetGame();
    });

    choiceA.addEventListener('click', function () {
      if (state.phase !== 'CHOICE') return;
      if (state.wave === 1) {
        makeChoice(1, 'wind');
      } else if (state.wave === 2) {
        makeChoice(2, 'qi');
      }
    });

    choiceB.addEventListener('click', function () {
      if (state.phase !== 'CHOICE') return;
      if (state.wave === 1) {
        makeChoice(1, 'pill');
      } else if (state.wave === 2) {
        makeChoice(2, 'shake');
      }
    });

    // Resize
    window.addEventListener('resize', resizeCanvas);

    /* ================================================================
       Init
       ================================================================ */
    resizeCanvas();
    updateCoverUnlocks();
    updateHud();
    lastFrameTime = performance.now();
    animFrameId = requestAnimationFrame(gameLoop);
  };
})();
```

- [ ] **Step 2: Verify JS file exists**

```bash
ls -la games/eight-trigrams-furnace/js/furnace.js
```

- [ ] **Step 3: Commit**

```bash
git add games/eight-trigrams-furnace/js/furnace.js
git commit -m "feat: add furnace game engine — Canvas rendering, particles, waves, endings

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Update game registration in deities.js

**Files:**
- Modify: `js/deities.js:251-257`

- [ ] **Step 1: Change status from 'coming' to 'live' and update description**

Find the `eight-trigrams-furnace` entry in `js/deities.js` (lines 251-257) and change:

```js
  {
    slug: 'eight-trigrams-furnace',
    nameZh: '八卦炉',
    nameEn: 'Eight Trigrams Furnace',
    description: 'Master the alchemical arts inside Taishang Laojun\'s cosmic furnace. Refine elixirs, concoct potions, and unlock the secrets of immortality.',
    status: 'coming',
    image: 'images/taishang-laojun/tl-furnace.jpg'
  }
```

To:

```js
  {
    slug: 'eight-trigrams-furnace',
    nameZh: '八卦炉',
    nameEn: 'Eight Trigrams Furnace',
    description: 'Survive the Samadhi Fire inside Taishang Laojun\'s cosmic crucible. Dodge the flames, master the eight trigrams, and forge the legendary Fiery Golden Eyes.',
    status: 'live',
    image: 'images/taishang-laojun/tl-furnace.jpg'
  }
```

- [ ] **Step 2: Verify the edit**

```bash
grep -A 7 "eight-trigrams-furnace" js/deities.js | head -8
```

Expected: `status: 'live'` and updated description.

- [ ] **Step 3: Commit**

```bash
git add js/deities.js
git commit -m "feat: activate Eight Trigrams Furnace game (coming → live)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: Add game URL to sitemap.xml

**Files:**
- Modify: `sitemap.xml`

- [ ] **Step 1: Add furnace game URL entry**

Find the Games section in `sitemap.xml` (after the `celestial-divination` entry around line 1001) and add:

```xml
  <url>
    <loc>https://celestial-archive.com/games/eight-trigrams-furnace/</loc>
    <lastmod>2026-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
```

- [ ] **Step 2: Verify the edit**

```bash
grep "eight-trigrams-furnace" sitemap.xml
```

- [ ] **Step 3: Commit**

```bash
git add sitemap.xml
git commit -m "feat: add Eight Trigrams Furnace to sitemap

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: Cross-page easter egg in Sun Wukong arsenal page

**Files:**
- Modify: `deities/sun-wukong/arsenal.html`

- [ ] **Step 1: Add the easter egg paragraph**

Find the Dive Deeper section near the bottom of `deities/sun-wukong/arsenal.html`. Add before the closing `</section>` of `.dive-deeper`:

```html
  <p id="fire-eyes-easter-egg" style="display:none;font-family:var(--font-chinese-body);font-size:0.9rem;color:var(--accent-gold);font-style:italic;margin-top:var(--space-sm);text-align:center;">
    "那双眼睛，曾在<a href="../../games/eight-trigrams-furnace/" style="color:var(--accent-vermillion);text-decoration:none;border-bottom:1px dashed var(--accent-vermillion);">八卦炉</a>中炼就。"
  </p>
```

- [ ] **Step 2: Add the visibility script**

Find the script block at the bottom of the page (after `main.js` loads). Add:

```html
  <script>
    (function() {
      try {
        if (localStorage.getItem('eight-trigrams-fire-eyes-unlocked') === '1') {
          var el = document.getElementById('fire-eyes-easter-egg');
          if (el) el.style.display = 'block';
        }
      } catch(e) {}
    })();
  </script>
```

- [ ] **Step 3: Verify**

```bash
grep -n "fire-eyes" deities/sun-wukong/arsenal.html
```

- [ ] **Step 4: Commit**

```bash
git add deities/sun-wukong/arsenal.html
git commit -m "feat: add Fiery Golden Eyes easter egg to Sun Wukong arsenal page

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: Final verification

- [ ] **Step 1: List all created files**

```bash
find games/eight-trigrams-furnace -type f
```

Expected:
```
games/eight-trigrams-furnace/index.html
games/eight-trigrams-furnace/css/furnace.css
games/eight-trigrams-furnace/js/furnace.js
```

- [ ] **Step 2: Verify game appears on homepage**

The `CELESTIAL_GAMES` registry now has `eight-trigrams-furnace` with `status: 'live'` — `main.js` auto-populates `#game-grid` from this. No manual homepage edit needed.

- [ ] **Step 3: Check for any broken references**

```bash
grep -rn "eight-trigrams-furnace" --include="*.html" --include="*.js" --include="*.xml" --include="*.css"
```

- [ ] **Step 4: Start a local server and test**

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/games/eight-trigrams-furnace/` and verify:
- Cover screen shows with 🔥 animation and "入炉受炼" button
- Clicking button starts the game — canvas renders furnace interior
- WASD moves the monkey silhouette
- Fire projectiles spawn from trigram positions
- Getting hit shows red pulse + screen shake
- Wave timer counts down
- Choice modal appears between waves
- Endings show based on HP and choices
- localStorage persists endings across sessions

- [ ] **Step 5: Commit any verification-related fixes**

```bash
git status
```
