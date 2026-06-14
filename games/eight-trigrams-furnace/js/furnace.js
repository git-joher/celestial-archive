/**
 * Eight Trigrams Furnace — Core Logic
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
  document.body.classList.add('game-active');

  window.initFurnace = function () {
    /* ================================================================
       DOM refs
       ================================================================ */
    var canvas = document.getElementById('furnace-canvas');
    if (!canvas) return;
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
    var readyGoOverlay = document.getElementById('ready-go-overlay');
    var btnReadyGo = document.getElementById('btn-ready-go');
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

    /* ================================================================
       localStorage keys
       ================================================================ */
    var STORAGE_ENDINGS = 'eight-trigrams-furnace-endings';
    var STORAGE_BEST = 'eight-trigrams-furnace-best';
    var STORAGE_FIRE_EYES = 'eight-trigrams-fire-eyes-unlocked';

    /* ================================================================
       Trigram ring layout — 8 positions on a circle
       ================================================================ */
    var TRIGRAMS = [
      { symbol: '☰', angle: -Math.PI / 2 },
      { symbol: '☷', angle: -Math.PI / 2 + Math.PI / 4 },
      { symbol: '☲', angle: -Math.PI / 2 + 2 * Math.PI / 4 },
      { symbol: '☵', angle: -Math.PI / 2 + 3 * Math.PI / 4 },
      { symbol: '☳', angle: -Math.PI / 2 + 4 * Math.PI / 4 },
      { symbol: '☴', angle: -Math.PI / 2 + 5 * Math.PI / 4 },
      { symbol: '☶', angle: -Math.PI / 2 + 6 * Math.PI / 4 },
      { symbol: '☱', angle: -Math.PI / 2 + 7 * Math.PI / 4 }
    ];

    /* ================================================================
       Wave configuration
       ================================================================ */
    var WAVE_CONFIG = {
      1: { spawners: 3, speed: 1.2, interval: 1800, damage: 8, smoke: 0, title: 'Wave I · Samadhi Fire', narZh: 'The Samadhi Fire surges forth — there is no escape from the Eight Trigrams Furnace...' },
      2: { spawners: 5, speed: 1.8, interval: 1200, damage: 12, smoke: 3, title: 'Wave II · Trigram Wheel', narZh: 'The eight trigrams spin and churn — wind and fire clash, blinding smoke fills the crucible...' },
      3: { spawners: 7, speed: 2.4, interval: 800, damage: 16, smoke: 5, title: 'Wave III · Furnace Breaks', narZh: 'The furnace walls crack — golden light pours in. Hold on, you are almost out!' }
    };

    /* ================================================================
       Game state
       ================================================================ */
    var state = {
      phase: 'IDLE',
      wave: 1,
      hp: 100,
      maxHp: 100,
      waveTimeLeft: 60,
      choice1: null,
      choice2: null,
      playerX: 0.5,
      playerY: 0.5,
      playerRadius: 0.02,
      furnaceRadius: 0.42,
      shakeX: 0,
      shakeY: 0,
      shakeDecay: 0,
      ending: null
    };

    /* ================================================================
       Particle & projectile pools
       ================================================================ */
    var particles = [];
    var projectiles = [];
    var smokeClouds = [];
    var cracks = [];
    var MAX_PARTICLES = 300;
    var MAX_PROJECTILES = 25;
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
    var gyroEnabled = false;
    var gyroGamma = 0;  // left/right tilt (-90 to 90)
    var gyroBeta = 0;   // front/back tilt (-180 to 180)

    /* ================================================================
       Timing
       ================================================================ */
    var lastFrameTime = 0;
    var animFrameId = null;
    var frameCount = 0;

    /* ================================================================
       Canvas sizing
       ================================================================ */
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    /* ================================================================
       Helpers
       ================================================================ */
    function furnaceCenter() {
      return {
        x: canvas.width / 2,
        y: canvas.height / 2,
        size: Math.min(canvas.width, canvas.height)
      };
    }

    function dist(x1, y1, x2, y2) {
      var dx = x1 - x2;
      var dy = y1 - y2;
      return Math.sqrt(dx * dx + dy * dy);
    }

    /* ================================================================
       Particle system
       ================================================================ */
    function spawnParticle(x, y, vx, vy, life, r, color, glowColor) {
      if (particles.length >= MAX_PARTICLES) return;
      particles.push({
        x: x, y: y, vx: vx, vy: vy,
        life: life, maxLife: life,
        r: r, maxR: r,
        color: color,
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
        p.r = p.maxR * Math.max(0, p.life / p.maxLife);
        if (p.life <= 0) particles.splice(i, 1);
      }
    }

    function drawParticles() {
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var alpha = Math.max(0, p.life / p.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        var glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        glow.addColorStop(0, p.glowColor);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fill();
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
      var ppx = cx + (state.playerX - 0.5) * size;
      var ppy = cy + (state.playerY - 0.5) * size;
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
        color: '#ff4400',
        glowColor: 'rgba(255,80,0,0.6)'
      });
    }

    function updateProjectiles(dt) {
      for (var i = projectiles.length - 1; i >= 0; i--) {
        var p = projectiles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (frameCount % 2 === 0) {
          spawnParticle(p.x, p.y, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, 0.25, 3, '#ff6600', 'rgba(255,100,0,0.4)');
        }
        var center = furnaceCenter();
        var d = dist(p.x, p.y, center.x, center.y);
        if (d > center.size * 0.7) projectiles.splice(i, 1);
      }
    }

    function drawProjectiles() {
      for (var i = 0; i < projectiles.length; i++) {
        var p = projectiles[i];
        ctx.save();
        var glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        glow.addColorStop(0, p.glowColor);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fill();
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
      var distFromCenter = size * (0.15 + Math.random() * 0.3);
      smokeClouds.push({
        x: center.x + Math.cos(angle) * distFromCenter,
        y: center.y + Math.sin(angle) * distFromCenter,
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
        if (s.life <= 0) smokeClouds.splice(i, 1);
      }
    }

    function drawSmokeClouds() {
      for (var i = 0; i < smokeClouds.length; i++) {
        var s = smokeClouds[i];
        var fadeIn = Math.min(1, s.life / (s.maxLife * 0.3));
        var fadeOut = Math.min(1, (s.maxLife - s.life) / (s.maxLife * 0.3));
        var alpha = s.alpha * fadeIn * fadeOut;
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

    function drawCracks() {
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
          var midX = (c.points[j - 1].x + c.points[j].x) / 2;
          var midY = (c.points[j - 1].y + c.points[j].y) / 2;
          ctx.quadraticCurveTo(c.points[j - 1].x, c.points[j - 1].y, midX, midY);
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    /* ================================================================
       Rendering: furnace walls
       ================================================================ */
    function drawFurnaceWalls() {
      var center = furnaceCenter();
      var cx = center.x;
      var cy = center.y;
      var size = center.size;
      var r = size * state.furnaceRadius;

      // Outer dark background
      var outerGrad = ctx.createRadialGradient(cx, cy, r * 0.85, cx, cy, size * 0.75);
      outerGrad.addColorStop(0, '#1a1010');
      outerGrad.addColorStop(0.7, '#0d0a14');
      outerGrad.addColorStop(1, '#060408');
      ctx.fillStyle = outerGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

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
    function drawTrigramRing() {
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

        var glowAlpha = 0.1 + Math.sin(t * 3 + i) * 0.15;
        var glow = ctx.createRadialGradient(tx, ty, 0, tx, ty, size * 0.06);
        glow.addColorStop(0, 'rgba(255,215,0,' + glowAlpha + ')');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(tx, ty, size * 0.06, 0, Math.PI * 2);
        ctx.fill();

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
       Rendering: player — Sun Wukong
       ================================================================ */
    function drawPlayer() {
      var center = furnaceCenter();
      var size = center.size;
      var px = center.x + (state.playerX - 0.5) * size;
      var py = center.y + (state.playerY - 0.5) * size;
      var r = size * state.playerRadius;
      var t = performance.now() * 0.001;

      // Scale factor: r is the base unit (~15px mobile, ~38px desktop)
      // All proportions relative to r

      // 1. Qi halo — protective golden aura
      var haloAlpha = 0.20 + Math.sin(t * 2) * 0.06;
      var haloGrad = ctx.createRadialGradient(px, py, r * 0.6, px, py, r * 3.0);
      haloGrad.addColorStop(0, 'rgba(255,200,100,' + (haloAlpha + 0.05) + ')');
      haloGrad.addColorStop(0.5, 'rgba(255,180,60,' + haloAlpha + ')');
      haloGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(px, py, r * 3.0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Red cape — flowing behind
      ctx.save();
      ctx.fillStyle = 'rgba(180,40,30,0.7)';
      ctx.beginPath();
      ctx.moveTo(px - r * 1.0, py + r * 0.4);
      ctx.quadraticCurveTo(px - r * 1.8, py - r * 0.6, px - r * 0.8, py - r * 1.6);
      ctx.quadraticCurveTo(px, py - r * 0.8, px + r * 0.8, py - r * 1.6);
      ctx.quadraticCurveTo(px + r * 1.8, py - r * 0.6, px + r * 1.0, py + r * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 3. Golden staff (Ruyi Jingu Bang) — diagonal behind body
      ctx.save();
      ctx.strokeStyle = '#daa520';
      ctx.lineWidth = r * 0.15;
      ctx.shadowColor = 'rgba(255,215,0,0.4)';
      ctx.shadowBlur = r * 0.3;
      ctx.beginPath();
      ctx.moveTo(px - r * 1.8, py + r * 1.0);
      ctx.lineTo(px + r * 1.5, py - r * 1.3);
      ctx.stroke();
      // Staff ends (gold caps)
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(px - r * 1.8, py + r * 1.0, r * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px + r * 1.5, py - r * 1.3, r * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 4. Body — red and gold robe
      ctx.save();
      // Main robe
      var robeGrad = ctx.createLinearGradient(px, py + r * 0.2, px, py + r * 1.6);
      robeGrad.addColorStop(0, '#c44d34');
      robeGrad.addColorStop(1, '#8b1a1a');
      ctx.fillStyle = robeGrad;
      ctx.beginPath();
      ctx.moveTo(px - r * 1.0, py - r * 0.3);
      ctx.quadraticCurveTo(px - r * 1.1, py + r * 0.3, px - r * 1.05, py + r * 1.5);
      ctx.lineTo(px + r * 1.05, py + r * 1.5);
      ctx.quadraticCurveTo(px + r * 1.1, py + r * 0.3, px + r * 1.0, py - r * 0.3);
      ctx.closePath();
      ctx.fill();
      // Gold sash
      ctx.fillStyle = '#daa520';
      ctx.fillRect(px - r * 1.0, py + r * 0.5, r * 2.0, r * 0.15);
      ctx.restore();

      // 5. Arms
      ctx.save();
      ctx.strokeStyle = '#d4956b';
      ctx.lineWidth = r * 0.35;
      ctx.lineCap = 'round';
      // Left arm
      ctx.beginPath();
      ctx.moveTo(px - r * 0.85, py + r * 0.3);
      ctx.quadraticCurveTo(px - r * 1.3, py - r * 0.2, px - r * 1.0, py - r * 0.8);
      ctx.stroke();
      // Right arm
      ctx.beginPath();
      ctx.moveTo(px + r * 0.85, py + r * 0.3);
      ctx.quadraticCurveTo(px + r * 1.3, py - r * 0.2, px + r * 1.0, py - r * 0.8);
      ctx.stroke();
      ctx.restore();

      // 6. Head — brown monkey head
      var headCY = py - r * 0.5;
      ctx.save();
      // Head base
      var headGrad = ctx.createRadialGradient(px, headCY - r * 0.1, r * 0.1, px, headCY, r * 1.05);
      headGrad.addColorStop(0, '#e8b88a');
      headGrad.addColorStop(0.7, '#c4956b');
      headGrad.addColorStop(1, '#8b6040');
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.arc(px, headCY, r * 0.95, 0, Math.PI * 2);
      ctx.fill();

      // Monkey face — heart-shaped lighter area
      var faceCY = headCY + r * 0.15;
      ctx.fillStyle = '#f5d5b8';
      ctx.beginPath();
      ctx.moveTo(px, faceCY + r * 0.75);
      ctx.quadraticCurveTo(px - r * 0.55, faceCY + r * 0.2, px - r * 0.6, faceCY - r * 0.25);
      ctx.quadraticCurveTo(px - r * 0.15, faceCY - r * 0.6, px, faceCY - r * 0.15);
      ctx.quadraticCurveTo(px + r * 0.15, faceCY - r * 0.6, px + r * 0.6, faceCY - r * 0.25);
      ctx.quadraticCurveTo(px + r * 0.55, faceCY + r * 0.2, px, faceCY + r * 0.75);
      ctx.fill();
      ctx.restore();

      // 7. Eyes — golden burning pupils (火眼金睛)
      ctx.save();
      var eyeY = headCY - r * 0.05;
      var eyeGlow = ctx.createRadialGradient(px, eyeY, 0, px, eyeY, r * 0.55);
      eyeGlow.addColorStop(0, 'rgba(255,240,100,0.9)');
      eyeGlow.addColorStop(0.3, 'rgba(255,180,30,0.5)');
      eyeGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = eyeGlow;
      ctx.beginPath();
      ctx.arc(px, eyeY, r * 0.55, 0, Math.PI * 2);
      ctx.fill();

      // Left eye
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = 'rgba(255,200,30,0.8)';
      ctx.shadowBlur = r * 0.25;
      ctx.beginPath();
      ctx.ellipse(px - r * 0.2, eyeY, r * 0.15, r * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Pupil
      ctx.fillStyle = '#1a0800';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(px - r * 0.2, eyeY, r * 0.07, 0, Math.PI * 2);
      ctx.fill();

      // Right eye
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = 'rgba(255,200,30,0.8)';
      ctx.shadowBlur = r * 0.25;
      ctx.beginPath();
      ctx.ellipse(px + r * 0.2, eyeY, r * 0.15, r * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Pupil
      ctx.fillStyle = '#1a0800';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(px + r * 0.2, eyeY, r * 0.07, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 8. Golden circlet (紧箍咒) — thin gold band across forehead
      ctx.save();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = r * 0.1;
      ctx.shadowColor = 'rgba(255,215,0,0.6)';
      ctx.shadowBlur = r * 0.2;
      ctx.beginPath();
      ctx.arc(px, headCY - r * 0.35, r * 0.82, Math.PI * 0.85, Math.PI * 0.15, true);
      ctx.stroke();
      // Small jewel at center of circlet
      ctx.fillStyle = '#ff4444';
      ctx.shadowBlur = r * 0.3;
      ctx.beginPath();
      ctx.arc(px, headCY - r * 1.1, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 9. Mouth — confident smirk
      ctx.save();
      ctx.strokeStyle = '#6b3020';
      ctx.lineWidth = r * 0.06;
      ctx.beginPath();
      ctx.arc(px, headCY + r * 0.35, r * 0.18, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
      ctx.restore();
    }

    /* ================================================================
       Rendering: vignette
       ================================================================ */
    function drawVignette() {
      var w = canvas.width;
      var h = canvas.height;
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
          applyDamage(WAVE_CONFIG[state.wave].damage);
          spawnFireTail(proj.x, proj.y, 8);
          projectiles.splice(i, 1);
        }
      }
    }

    function applyDamage(amount) {
      var actualDamage = amount;
      if (state.choice1 === 'wind') actualDamage = Math.floor(amount * 0.8);
      state.hp = Math.max(0, state.hp - actualDamage);
      state.shakeDecay = Math.max(state.shakeDecay, 8);
      damagePulse.classList.add('active');
      setTimeout(function () { damagePulse.classList.remove('active'); }, 100);
      updateHud();
      if (state.hp <= 0) endGame('nirvana');
    }

    /* ================================================================
       Update HUD
       ================================================================ */
    function updateHud() {
      var pct = Math.round(state.hp / state.maxHp * 100);
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
      var intervalMs = config.interval;
      var intervalFrames = Math.max(1, Math.floor(intervalMs / (1000 / 60)));

      if (frameCount % intervalFrames === 0) {
        var numSpawners = config.spawners;
        var ringRotation = (state.wave >= 2) ? now * 0.001 * 0.15 : 0;
        var allAngles = TRIGRAMS.map(function (t) { return t.angle + ringRotation; });
        // Shuffle and pick
        for (var s = allAngles.length - 1; s > 0; s--) {
          var j = Math.floor(Math.random() * (s + 1));
          var tmp = allAngles[s]; allAngles[s] = allAngles[j]; allAngles[j] = tmp;
        }
        for (var k = 0; k < numSpawners && k < allAngles.length; k++) {
          spawnProjectile(allAngles[k], WAVE_CONFIG[state.wave].speed);
        }
      }

      if (config.smoke > 0 && smokeClouds.length < config.smoke && frameCount % 120 === 0) {
        spawnSmokeCloud();
      }
    }

    /* ================================================================
       Player movement
       ================================================================ */
    function updatePlayerMovement(dt) {
      if (state.phase !== 'WAVE') return;

      var speed = 0.35;
      if (state.choice2 === 'qi') speed *= 1.3;

      var dx = 0, dy = 0;
      if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

      var hasKeyboardInput = (dx !== 0 || dy !== 0);

      if (!hasKeyboardInput && touchActive) {
        dx = touchDeltaX * 0.02;
        dy = touchDeltaY * 0.02;
        touchDeltaX *= 0.9;
        touchDeltaY *= 0.9;
      } else if (!hasKeyboardInput && !touchActive && gyroEnabled) {
        // Tilt device to move: gamma = left/right, beta = forward/back
        dx = gyroGamma / 30;
        dy = gyroBeta / 45;
        if (dx > 1) dx = 1; else if (dx < -1) dx = -1;
        if (dy > 1) dy = 1; else if (dy < -1) dy = -1;
      }

      if (dx !== 0 && dy !== 0) {
        var mag = Math.sqrt(dx * dx + dy * dy);
        dx /= mag;
        dy /= mag;
      }

      state.playerX += dx * speed * dt;
      state.playerY += dy * speed * dt;

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
        choicePrompt.textContent = 'The flames close in — what do you do?';
        choiceA.querySelector('.choice-card-emoji').textContent = '🌬️';
        choiceA.querySelector('.choice-card-label').textContent = 'Hide in Wind\'s Eye';
        choiceA.querySelector('.choice-card-desc').textContent = 'Xun is Wind — where wind flows, fire cannot reach. 20% damage reduction next wave, but consumes Qi.';
        choiceB.querySelector('.choice-card-emoji').textContent = '💊';
        choiceB.querySelector('.choice-card-label').textContent = 'Swallow the Golden Pill';
        choiceB.querySelector('.choice-card-desc').textContent = 'Consume a remnant elixir pill in the furnace. Restores 30% HP, but the fire burns fiercer next wave.';
      } else if (choiceNum === 2) {
        choicePrompt.textContent = 'The trigrams spin — what\'s your move?';
        choiceA.querySelector('.choice-card-emoji').textContent = '🌀';
        choiceA.querySelector('.choice-card-label').textContent = 'Circulate Inner Qi';
        choiceA.querySelector('.choice-card-desc').textContent = 'Channel Qi through your entire body. Movement speed +30% for the final wave.';
        choiceB.querySelector('.choice-card-emoji').textContent = '💥';
        choiceB.querySelector('.choice-card-label').textContent = 'Shake the Furnace';
        choiceB.querySelector('.choice-card-desc').textContent = 'Strike the furnace walls with the Ruyi Jingu Bang. Final wave shortened by 15 seconds, but fire is denser.';
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
      } else if (choiceNum === 2) {
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

      hudNarrative.textContent = config.narZh;
      hudNarrative.classList.add('show');
      setTimeout(function () {
        hudNarrative.classList.remove('show');
      }, 4000);

      if (waveNum === 3) spawnCracks();
      projectiles = [];
      updateHud();
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
      saveEnding(state.ending);

      var endings = {
        'fire-eyes': {
          icon: '🔥👁️',
          title: 'Fiery Golden Eyes',
          zh: 'Fire-Forged Sight',
          text: 'The furnace walls shatter — golden light floods the chamber. Wukong\'s eyes blaze like molten gold as he pushes aside the thousand-pound lid with one palm. The Samadhi Fire did not destroy him — it forged his body into an indestructible vajra form. Those eyes can now see through all illusions, discern demons from gods, and pierce the veils of the Three Realms.',
          quote: '"I\'m out! This furnace was nothing!"'
        },
        'cloud-escape': {
          icon: '☁️',
          title: 'Cloud Escape',
          zh: 'Survivor Against the Odds',
          text: 'Wukong held on until the furnace walls cracked, then somersaulted out on his cloud through the sea of fire. Though he did not forge the Fiery Golden Eyes, surviving the Eight Trigrams Furnace at all is a feat few in the celestial realm can claim. From afar, he gazes back at the Tushita Palace, grinding his teeth.',
          quote: '"I\'ll settle this score another day."'
        },
        'nirvana': {
          icon: '🕯️',
          title: 'Nirvana in Furnace',
          zh: 'Reborn from the Ashes',
          text: 'The flames consumed Wukong\'s body... but the Stone Monkey was never mere flesh. Amidst the ashes, a single golden spark still glows. The Eight Trigrams Furnace can refine all things in creation — but it cannot refine an unbreakable monkey\'s heart. Next time, he will rise stronger.',
          quote: '"This old monkey... isn\'t done yet."'
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
      } catch (e) { return []; }
    }

    function saveEnding(endingKey) {
      try {
        var endings = getStoredEndings();
        if (endings.indexOf(endingKey) === -1) {
          endings.push(endingKey);
          localStorage.setItem(STORAGE_ENDINGS, JSON.stringify(endings));
          if (endingKey === 'fire-eyes') {
            localStorage.setItem(STORAGE_FIRE_EYES, '1');
          }
        }
        var best = { ending: endingKey, hp: state.hp, date: new Date().toISOString().split('T')[0] };
        var prevBest = null;
        try {
          var raw = localStorage.getItem(STORAGE_BEST);
          prevBest = raw ? JSON.parse(raw) : null;
        } catch (e) {}
        if (!prevBest || state.hp > prevBest.hp ||
            (state.hp === prevBest.hp && endingKey === 'fire-eyes' && prevBest.ending !== 'fire-eyes')) {
          localStorage.setItem(STORAGE_BEST, JSON.stringify(best));
        }
      } catch (e) { /* localStorage unavailable — silent degradation */ }
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
      readyGoOverlay.classList.remove('active');
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
      var dt = Math.min(rawDt, 0.1);
      lastFrameTime = timestamp;
      frameCount++;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

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
          if (state.wave === 1) showChoice(1);
          else if (state.wave === 2) showChoice(2);
          else if (state.wave === 3) endGame();
        }
        updateHud();
      }

      checkCollisions();

      ctx.save();
      ctx.translate(state.shakeX, state.shakeY);
      drawFurnaceWalls();
      drawTrigramRing();
      drawCracks();
      drawSmokeClouds();
      drawProjectiles();
      drawParticles();
      drawPlayer();
      drawVignette();
      ctx.restore();
    }

    /* ================================================================
       Intro animation
       ================================================================ */
    function startIntro() {
      coverScreen.classList.add('hidden');
      state.phase = 'INTRO';
      gameHud.classList.add('active');
      hudWave.textContent = 'Eight Trigrams Furnace';
      updateHud();
      // Show Ready? Go! immediately
      readyGoOverlay.classList.add('active');
    }

    function startGame() {
      readyGoOverlay.classList.remove('active');
      startWave(1);
    }

    /* ================================================================
       Event listeners
       ================================================================ */
    window.addEventListener('keydown', function (e) {
      keys[e.code] = true;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown' ||
          e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', function (e) { keys[e.code] = false; });

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

    btnEnter.addEventListener('click', startIntro);
    btnReadyGo.addEventListener('click', startGame);
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
      if (state.wave === 1) makeChoice(1, 'wind');
      else if (state.wave === 2) makeChoice(2, 'qi');
    });

    choiceB.addEventListener('click', function () {
      if (state.phase !== 'CHOICE') return;
      if (state.wave === 1) makeChoice(1, 'pill');
      else if (state.wave === 2) makeChoice(2, 'shake');
    });

    // Gyroscope / device orientation
    if (window.DeviceOrientationEvent) {
      // iOS 13+ requires permission
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        // Show a prompt only on first touch
        document.addEventListener('touchstart', function requestGyro() {
          DeviceOrientationEvent.requestPermission()
            .then(function (state) {
              if (state === 'granted') {
                window.addEventListener('deviceorientation', handleOrientation);
                gyroEnabled = true;
              }
            })
            .catch(function () { /* denied */ });
          document.removeEventListener('touchstart', requestGyro);
        }, { once: false });
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
        gyroEnabled = true;
      }
    }

    function handleOrientation(e) {
      gyroGamma = e.gamma || 0;
      gyroBeta = e.beta || 0;
    }

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
