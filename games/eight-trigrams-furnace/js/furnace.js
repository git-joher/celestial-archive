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
      1: { spawners: 3, speed: 1.2, interval: 1800, damage: 8, smoke: 0, title: '第一劫·三昧真火', narZh: '三昧真火扑面而来，八卦炉中无处可逃…' },
      2: { spawners: 5, speed: 1.8, interval: 1200, damage: 12, smoke: 3, title: '第二劫·八卦轮转', narZh: '炉中八卦运转，风火相激，浓烟蔽目…' },
      3: { spawners: 7, speed: 2.4, interval: 800, damage: 16, smoke: 5, title: '第三劫·炉破天惊', narZh: '炉壁崩裂，金光透入——撑住，就快出去了！' }
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
      playerRadius: 0.04,
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
          ctx.lineTo(c.points[j].x, c.points[j].y);
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
       Rendering: player
       ================================================================ */
    function drawPlayer() {
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

      // Eye glow
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
    function drawVignette() {
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

      if (touchActive) {
        dx = touchDeltaX * 0.02;
        dy = touchDeltaY * 0.02;
        touchDeltaX *= 0.9;
        touchDeltaY *= 0.9;
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
        choicePrompt.textContent = '烈火焚身，如何应对？ The flames close in — what do you do?';
        choiceA.querySelector('.choice-card-emoji').textContent = '🌬️';
        choiceA.querySelector('.choice-card-label').textContent = '躲进嵿位风眼';
        choiceA.querySelector('.choice-card-desc').textContent = 'Hide in Wind\'s Eye — 嵿为风，风眼无火。下一劫减伤20%，但消耗真气。';
        choiceB.querySelector('.choice-card-emoji').textContent = '💊';
        choiceB.querySelector('.choice-card-label').textContent = '硬抗烈火吞金丹';
        choiceB.querySelector('.choice-card-desc').textContent = 'Swallow the Golden Pill — 吞下炉中残丹，恢复30%生命，但下一劫火势更烈。';
      } else if (choiceNum === 2) {
        choicePrompt.textContent = '炉中八卦轮转，如何破局？ The trigrams spin — what\'s your move?';
        choiceA.querySelector('.choice-card-emoji').textContent = '🌀';
        choiceA.querySelector('.choice-card-label').textContent = '运转内息';
        choiceA.querySelector('.choice-card-desc').textContent = 'Circulate Inner Qi — 真气贯通全身，移动速度+30%。';
        choiceB.querySelector('.choice-card-emoji').textContent = '💥';
        choiceB.querySelector('.choice-card-label').textContent = '撼动炉壁';
        choiceB.querySelector('.choice-card-desc').textContent = 'Shake the Furnace — 用金箠棒砸炉壁，下一劫缩短15秒，但火焰更密集。';
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
          icon: '🔥👁‍🗨',
          title: 'Fiery Golden Eyes',
          zh: '火眼金睛',
          text: '炉壁崩裂，金光万丈。悟空双眼灼灼如熔金，一掌推开千斤炉盖——三昧真火非但未伤他分毫，反将肉身炼成了不坏金身。那双眼睛，从此可辨妖邪、识变化、看穿三界一切幻象。',
          quote: '“老孙出来了！这炉子，不过如此！”'
        },
        'cloud-escape': {
          icon: '☁️',
          title: 'Cloud Escape',
          zh: '劫后余生',
          text: '悟空撑到了炉壁裂开的一刻，翻一个筋斗云冲出火海。虽然没有炼成火眼金睛，但能活着从八卦炉里出来，已是万中无一。他远远望着离恨天兜率宫，咬牙暗自发誓。',
          quote: '“这笔账，改日再算。”'
        },
        'nirvana': {
          icon: '🕯️',
          title: 'Nirvana in Furnace',
          zh: '炉中涅槃',
          text: '火焰吞没了悟空的身躯……但石猴本非凡胎。炉灰之中，一点金光不灭。八卦炉能炼化万物，却炼不化一颗不屈的猴心。下一次，他会更强。',
          quote: '“俺老孙……还没完。”'
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

      var w = canvas.width / (window.devicePixelRatio || 2);
      var h = canvas.height / (window.devicePixelRatio || 2);
      ctx.clearRect(0, 0, w, h);

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
      hudWave.textContent = '入炉... Entering the Furnace';
      updateHud();
      setTimeout(function () { startWave(1); }, 3000);
    }

    /* ================================================================
       Event listeners
       ================================================================ */
    window.addEventListener('keydown', function (e) {
      keys[e.code] = true;
      if (e.code === 'Space') e.preventDefault();
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
