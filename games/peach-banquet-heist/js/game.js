/**
 * 蟠桃盛会 — Peach Banquet Heist
 * Cinematic Dodge-Run Canvas Game Engine
 */

(function () {
  'use strict';
  document.body.classList.add('game-active');

  /* ============================================================
     AudioContext Resume Pattern (browser autoplay policy)
     ============================================================ */
  var _audioResumed = false;
  function _tryResumeAudio() {
    if (_audioResumed) return;
    _audioResumed = true;
    AudioEngine.init();
    AudioEngine.resume();
    document.removeEventListener('click', _tryResumeAudio);
    document.removeEventListener('keydown', _tryResumeAudio);
    document.removeEventListener('touchstart', _tryResumeAudio);
  }
  document.addEventListener('click', _tryResumeAudio);
  document.addEventListener('keydown', _tryResumeAudio);
  document.addEventListener('touchstart', _tryResumeAudio);

  /* ============================================================
     Image Preloading
     ============================================================ */
  var IMG = {};
  function preloadImages() {
    var images = {
      playerHead: '../../images/sun-wukong/sun-wukong-ice.jpg',
      playerCelebrate: '../../images/sun-wukong/sun-wukong-hero3.jpg',
      playerDeath: '../../images/sun-wukong/sun-wukong-hero2.jpg'
    };
    for (var key in images) {
      if (images.hasOwnProperty(key)) {
        IMG[key] = new Image();
        IMG[key].src = images[key];
      }
    }
  }
  preloadImages();

  /* ============================================================
     Canvas Setup
     ============================================================ */
  var canvas = document.getElementById('game-canvas');
  var ctx = canvas.getContext('2d');
  var W, H;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  /* ============================================================
     State Machine
     ============================================================ */
  var STATE = {
    TITLE: 0,
    PLAYING: 1,
    PAUSED: 2,
    CUTSCENE: 3,
    LEVEL_COMPLETE: 4,
    VICTORY: 5,
    DEATH: 6
  };

  var gameState = STATE.TITLE;
  var currentLevelIndex = 0;
  var levelData = null;
  var levelTimer = 0;
  var levelDuration = 0;
  var collectCount = 0;
  var collectTarget = 0;
  var bossRoundIndex = 0;
  var bossRoundTimer = 0;

  var totalScore = 0;
  var totalPeaches = 0;
  var totalTime = 0;
  var levelsCleared = 0;

  var lastTime = 0;
  var deltaTime = 0;
  var timeScale = 1;
  var timeScaleTarget = 1;

  var fpsHistory = [];
  var currentFPS = 0;

  /* ============================================================
     Input
     ============================================================ */
  var keys = {};

  window.addEventListener('keydown', function (e) {
    var key = e.key;
    keys[key.toLowerCase()] = true;

    if (key === ' ' || key === 'Space') {
      e.preventDefault();
      if (gameState === STATE.TITLE) {
        startGame();
      } else if (gameState === STATE.CUTSCENE) {
        skipCutscene();
      } else if (gameState === STATE.PLAYING) {
        triggerDash();
      }
    } else if (key === 'p' || key === 'P') {
      togglePause();
    } else if (key === 'Escape') {
      togglePause();
    } else if (key === 'Enter') {
      if (gameState === STATE.DEATH || gameState === STATE.VICTORY) {
        restartGame();
      }
    }
  });

  window.addEventListener('keyup', function (e) {
    keys[e.key.toLowerCase()] = false;
  });

  // Touch stubs (filled in by mobile implementation tasks)
  var touchMove = { active: false, dx: 0, dy: 0 };
  var dashTouch = false;
  var lastTouchTime = 0;

  // Auto-pause on tab hide
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && gameState === STATE.PLAYING) {
      gameState = STATE.PAUSED;
    }
  });

  /* ============================================================
     Player State
     ============================================================ */
  var player = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    hp: 100,
    maxHp: 100,
    speed: 280,
    radius: 14,
    invincibleTimer: 0,
    dashCooldownTimer: 0,
    dashTimer: 0,
    isDashing: false,
    dashDx: 0,
    dashDy: 0,
    buffTimer: 0,
    buffType: null
  };

  function resetPlayer() {
    player.x = W / 2;
    player.y = H / 2;
    player.vx = 0;
    player.vy = 0;
    player.hp = GAME_CONSTANTS.PLAYER_HP || 100;
    player.maxHp = GAME_CONSTANTS.PLAYER_HP || 100;
    player.speed = levelData ? (levelData.playerSpeed || 280) : 280;
    player.radius = GAME_CONSTANTS.PLAYER_RADIUS || 14;
    player.invincibleTimer = 0;
    player.dashCooldownTimer = 0;
    player.dashTimer = 0;
    player.isDashing = false;
    player.dashDx = 0;
    player.dashDy = 0;
    player.buffTimer = 0;
    player.buffType = null;
  }

  /* ============================================================
     Entity Arrays
     ============================================================ */
  var enemies = [];
  var projectiles = [];
  var collectibles = [];
  var hazards = [];
  var particles = [];
  var floatingTexts = [];

  // Visual FX state
  var screenShake = { intensity: 0, duration: 0, timer: 0 };
  var screenFlash = { alpha: 0, color: 'rgba(0,0,0,0)', timer: 0 };

  // Background scroll offsets
  var bgScrollX = 0;
  var bgScrollY = 0;
  var bgClouds = [];
  var bgArchElements = [];
  var bgFgParticles = [];

  function initBackground() {
    if (!levelData) return;
    bgClouds = [];
    bgArchElements = [];
    bgFgParticles = [];

    var layerCfg = levelData.bgLayers;
    var cloudCount = layerCfg.cloud.count || 6;
    for (var i = 0; i < cloudCount; i++) {
      bgClouds.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.6,
        radius: 60 + Math.random() * 120,
        alpha: 0.05 + Math.random() * 0.1,
        speedX: 15 + Math.random() * 25,
        speedY: 3 + Math.random() * 6
      });
    }

    var archTypes = layerCfg.arch.elements || [];
    for (var j = 0; j < archTypes.length; j++) {
      bgArchElements.push({
        x: (W / (archTypes.length + 1)) * (j + 1),
        y: H * 0.5 + j * 30,
        type: archTypes[j],
        width: W * 0.25,
        height: H * 0.4
      });
    }

    var fgCount = 30;
    for (var k = 0; k < fgCount; k++) {
      bgFgParticles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: 2 + Math.random() * 6,
        alpha: 0.2 + Math.random() * 0.5,
        speedX: -10 - Math.random() * 20,
        speedY: 15 + Math.random() * 40,
        life: Math.random()
      });
    }
  }

  /* ============================================================
     Random Helpers
     ============================================================ */
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
  function dist(a, b) { var dx = a.x - b.x; var dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }

  /* ============================================================
     Stub: startGame / startLevel / togglePause  (Task 5)
     ============================================================ */
  function startGame() {
    gameState = STATE.PLAYING;
    currentLevelIndex = 0;
    totalScore = 0;
    totalPeaches = 0;
    totalTime = 0;
    levelsCleared = 0;
    startLevel(0);
  }

  function startLevel(index) {
    currentLevelIndex = index;
    levelData = PEACH_BANQUET_LEVELS[index];
    levelTimer = 0;
    levelDuration = levelData.duration || 999;
    collectCount = 0;
    collectTarget = levelData.collectTarget || 0;
    bossRoundIndex = 0;
    bossRoundTimer = 0;

    enemies = [];
    projectiles = [];
    collectibles = [];
    hazards = [];
    floatingTexts = [];

    resetPlayer();
    gameState = STATE.PLAYING;
    AudioEngine.setMusicLevel(index + 1);

    spawnLevelEnemies();
    spawnInitialCollectibles();
    initBackground();
  }

  function togglePause() {
    if (gameState === STATE.PLAYING) {
      gameState = STATE.PAUSED;
      AudioEngine.setMuted(true);
    } else if (gameState === STATE.PAUSED) {
      gameState = STATE.PLAYING;
      AudioEngine.setMuted(false);
      lastTime = performance.now();
    }
  }

  /* ============================================================
     Stub: triggerDash / skipCutscene / restartGame  (Tasks 5-6)
     ============================================================ */
  function triggerDash() {
    if (player.dashCooldownTimer > 0 || player.isDashing) return;
    player.isDashing = true;
    player.dashTimer = GAME_CONSTANTS.DASH_DURATION;
    player.dashCooldownTimer = GAME_CONSTANTS.DASH_COOLDOWN;
    player.invincibleTimer = Math.max(player.invincibleTimer, GAME_CONSTANTS.DASH_INVINCIBILITY);

    var dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy = -1;
    if (keys['s'] || keys['arrowdown']) dy = 1;
    if (keys['a'] || keys['arrowleft']) dx = -1;
    if (keys['d'] || keys['arrowright']) dx = 1;
    if (dx === 0 && dy === 0) { dx = 1; }

    var len = Math.sqrt(dx * dx + dy * dy);
    player.dashDx = dx / len;
    player.dashDy = dy / len;

    AudioEngine.playSfx('dash');
    for (var i = 0; i < 8; i++) {
      spawnParticle(player.x, player.y, -player.dashDx * 100 + (Math.random() - 0.5) * 80,
                    -player.dashDy * 100 + (Math.random() - 0.5) * 80,
                    'gold-dust', 0.5);
    }
  }

  function skipCutscene() {
    gameState = STATE.PLAYING;
  }

  function restartGame() {
    AudioEngine.unmuteMusic();
    gameState = STATE.TITLE;
    currentLevelIndex = 0;
    levelData = null;
    enemies = [];
    projectiles = [];
    collectibles = [];
    hazards = [];
    particles = [];
    floatingTexts = [];
    totalScore = 0;
    totalTime = 0;
    levelsCleared = 0;
    AudioEngine.setMusicLevel(0);
    resetPlayer();
  }

  /* ============================================================
     Stub: Update functions  (Tasks 7-11)
     ============================================================ */
  function updatePlayer(dt) {
    if (player.invincibleTimer > 0) player.invincibleTimer -= dt;
    if (player.dashCooldownTimer > 0) player.dashCooldownTimer -= dt;
    if (player.buffTimer > 0) {
      player.buffTimer -= dt;
      if (player.buffTimer <= 0) {
        player.buffType = null;
        player.speed = levelData ? levelData.playerSpeed : 280;
        timeScaleTarget = 1;
      }
    }

    if (player.isDashing) {
      player.dashTimer -= dt;
      if (player.dashTimer <= 0) { player.isDashing = false; }
      var dashSpeed = player.speed * GAME_CONSTANTS.DASH_SPEED_MULT;
      player.x += player.dashDx * dashSpeed * dt;
      player.y += player.dashDy * dashSpeed * dt;
    } else {
      var mx = 0, my = 0;
      if (keys['w'] || keys['arrowup']) my = -1;
      if (keys['s'] || keys['arrowdown']) my = 1;
      if (keys['a'] || keys['arrowleft']) mx = -1;
      if (keys['d'] || keys['arrowright']) mx = 1;

      if (touchMove.active) { mx = touchMove.dx; my = touchMove.dy; }

      if (mx !== 0 && my !== 0) { var diag = 1 / Math.sqrt(2); mx *= diag; my *= diag; }

      player.vx = mx * player.speed;
      player.vy = my * player.speed;
      player.x += player.vx * dt;
      player.y += player.vy * dt;
    }

    var r = player.radius;
    player.x = Math.max(r, Math.min(W - r, player.x));
    player.y = Math.max(r, Math.min(H - r, player.y));
  }

  function updateEnemies(dt) {
    // Will be implemented in Task 8
  }

  function updateProjectiles(dt) {
    // Will be implemented in Task 9
  }

  function updateCollectibles(dt) {
    // Will be implemented in Task 10
  }

  function updateHazards(dt) {
    // Will be implemented in Task 10
  }

  function spawnParticle(x, y, vx, vy, type, life) {
    if (particles.length >= GAME_CONSTANTS.MAX_PARTICLES) { particles.shift(); }
    particles.push({
      x: x, y: y, vx: vx, vy: vy, type: type,
      life: life, maxLife: life,
      size: 2 + Math.random() * 5, alpha: 1
    });
  }

  function spawnParticleBurst(x, y, count, type, speed, life) {
    for (var i = 0; i < count; i++) {
      var angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
      var spd = speed * (0.5 + Math.random() * 0.5);
      spawnParticle(x, y, Math.cos(angle) * spd, Math.sin(angle) * spd, type, life);
    }
  }

  function updateParticles(dt) {
    if (screenShake.timer > 0) { screenShake.timer -= dt; screenShake.intensity *= 0.9; }
    else { screenShake.intensity = 0; }
    if (screenFlash.timer > 0) { screenFlash.timer -= dt; screenFlash.alpha *= 0.85; }
    else { screenFlash.alpha = 0; }

    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.type === 'petal') { p.vy += 30 * dt; p.vx += Math.sin(p.life * 4) * 20 * dt; }
      else if (p.type === 'ember') { p.vy -= 40 * dt; p.size *= 0.998; }
      else if (p.type === 'gold-dust') { p.vy -= 20 * dt; p.size *= 0.995; }
      else if (p.type === 'ice') { p.vx *= 0.98; p.vy *= 0.98; }
    }

    if (gameState === STATE.TITLE && Math.random() < 0.3) {
      spawnParticle(Math.random() * W, H + 5, (Math.random() - 0.5) * 20, -30 - Math.random() * 40, 'gold-dust', 3 + Math.random() * 4);
    }
  }

  function renderParticles(ctx) {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      ctx.globalAlpha = p.alpha;
      switch (p.type) {
        case 'petal':
          ctx.fillStyle = '#f4a0a0';
          ctx.beginPath(); ctx.ellipse(p.x, p.y, p.size, p.size * 0.5, Math.PI / 4, 0, Math.PI * 2); ctx.fill();
          break;
        case 'gold-dust':
          ctx.fillStyle = '#ffd700'; ctx.shadowColor = 'rgba(255,215,0,0.6)'; ctx.shadowBlur = p.size * 2;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
          break;
        case 'ember':
          var eg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          eg.addColorStop(0, 'rgba(255,200,50,0.8)'); eg.addColorStop(0.5, 'rgba(255,100,20,0.4)'); eg.addColorStop(1, 'rgba(255,30,5,0)');
          ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
          break;
        case 'ice':
          ctx.fillStyle = 'rgba(200,220,255,0.8)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2); ctx.fill();
          break;
        case 'spark':
          ctx.fillStyle = '#ffffff'; ctx.shadowColor = 'rgba(255,255,255,0.8)'; ctx.shadowBlur = 4;
          ctx.fillRect(p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.6, p.size * 0.6); ctx.shadowBlur = 0;
          break;
        default:
          ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function triggerScreenShake(intensity, duration) {
    screenShake.intensity = Math.max(screenShake.intensity, intensity);
    screenShake.duration = duration;
    screenShake.timer = duration;
  }

  function triggerScreenFlash(color, alpha, duration) {
    screenFlash.color = color;
    screenFlash.alpha = alpha;
    screenFlash.timer = duration;
  }

  function checkCollisions() {
    // Will be implemented in Task 11
  }

  function drawArchElement(ctx, x, y, type, w, h, tint) {
    ctx.fillStyle = tint;
    ctx.strokeStyle = tint;
    ctx.lineWidth = 2;
    switch (type) {
      case 'peach-tree':
        ctx.fillRect(x + w * 0.45, y + h * 0.3, w * 0.1, h * 0.7);
        ctx.beginPath(); ctx.arc(x + w * 0.5, y + h * 0.2, w * 0.35, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + w * 0.25, y + h * 0.25, w * 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + w * 0.75, y + h * 0.25, w * 0.2, 0, Math.PI * 2); ctx.fill();
        break;
      case 'garden-wall':
        ctx.fillRect(x, y + h * 0.7, w, h * 0.05);
        ctx.fillRect(x, y + h * 0.7, w * 0.02, h * 0.3);
        ctx.fillRect(x + w * 0.98, y + h * 0.7, w * 0.02, h * 0.3);
        break;
      case 'jade-pavilion':
        ctx.beginPath(); ctx.moveTo(x, y + h * 0.3); ctx.lineTo(x + w * 0.5, y); ctx.lineTo(x + w, y + h * 0.3); ctx.closePath(); ctx.fill();
        ctx.fillRect(x + w * 0.1, y + h * 0.3, w * 0.8, h * 0.5);
        break;
      case 'lotus-terrace':
        ctx.beginPath(); ctx.ellipse(x + w * 0.5, y + h * 0.5, w * 0.4, h * 0.15, 0, 0, Math.PI * 2); ctx.fill();
        break;
      case 'waterfall':
        ctx.fillRect(x + w * 0.45, y, w * 0.1, h);
        break;
      case 'furnace-wall':
        ctx.fillRect(x, y, w, h * 0.8);
        ctx.strokeStyle = 'rgba(255,60,20,0.3)'; ctx.lineWidth = 3;
        for (var v = 0; v < 4; v++) { ctx.beginPath(); ctx.moveTo(x + w * (0.2 + v * 0.2), y); ctx.lineTo(x + w * (0.1 + v * 0.2), y + h * 0.8); ctx.stroke(); }
        ctx.strokeStyle = tint; ctx.lineWidth = 2;
        break;
      case 'magma-vein':
        ctx.strokeStyle = 'rgba(255,80,20,0.4)'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(x, y + h * 0.6); ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.2, x + w, y + h * 0.5); ctx.stroke();
        ctx.strokeStyle = tint; ctx.lineWidth = 2;
        break;
      case 'dragon-pillar':
        ctx.fillRect(x + w * 0.45, y, w * 0.1, h);
        ctx.fillRect(x + w * 0.3, y, w * 0.4, h * 0.08);
        break;
      case 'throne-dais':
        for (var step = 0; step < 3; step++) { var sw = w - step * w * 0.2; ctx.fillRect(x + (w - sw) / 2, y + h * 0.7 + step * h * 0.1, sw, h * 0.08); }
        break;
      default:
        ctx.fillRect(x, y + h * 0.5, w, h * 0.4);
    }
  }

  function renderBackground(ctx) {
    if (!levelData) {
      var titleGrad = ctx.createLinearGradient(0, 0, 0, H);
      titleGrad.addColorStop(0, '#0a0a18');
      titleGrad.addColorStop(1, '#1a1030');
      ctx.fillStyle = titleGrad;
      ctx.fillRect(0, 0, W, H);
      return;
    }

    var colors = levelData.bgColors;

    // Layer 1: Sky gradient
    var skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, colors.skyTop);
    skyGrad.addColorStop(1, colors.skyBot);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (var s = 0; s < 40; s++) {
      var sx = ((s * 137 + 50) % W);
      var sy = ((s * 251 + 30) % (H * 0.5));
      var sr = 0.5 + (s % 3) * 0.5;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Layer 2: Clouds
    var cloudScrollX = bgScrollX * levelData.bgLayers.cloud.speedX;
    var cloudScrollY = bgScrollY * levelData.bgLayers.cloud.speedY;
    for (var c = 0; c < bgClouds.length; c++) {
      var cloud = bgClouds[c];
      var cx = ((cloud.x + cloudScrollX * cloud.speedX) % (W + 400)) - 200;
      var cy = ((cloud.y + cloudScrollY * cloud.speedY) % (H + 200)) - 100;
      var cGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cloud.radius);
      cGrad.addColorStop(0, colors.cloudTint);
      cGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = cGrad;
      ctx.fillRect(cx - cloud.radius, cy - cloud.radius, cloud.radius * 2, cloud.radius * 2);
    }

    // Layer 3: Architecture
    var archScrollX = bgScrollX * levelData.bgLayers.arch.speedX;
    for (var a = 0; a < bgArchElements.length; a++) {
      var arch = bgArchElements[a];
      var ax = ((arch.x + archScrollX * 0.3) % (W + 600)) - 300;
      drawArchElement(ctx, ax, arch.y, arch.type, arch.width, arch.height, colors.archTint);
    }

    // Layer 4: Foreground particles
    var fgCfg = levelData.bgLayers.fg;
    if (Math.random() < fgCfg.particleRate * deltaTime) {
      bgFgParticles.push({
        x: W + 20, y: Math.random() * H,
        size: 2 + Math.random() * 6,
        alpha: 0.2 + Math.random() * 0.5,
        speedX: -20 - Math.random() * 40,
        speedY: -10 + Math.random() * 20,
        life: 0
      });
    }
    for (var fp = bgFgParticles.length - 1; fp >= 0; fp--) {
      var fpData = bgFgParticles[fp];
      fpData.life += deltaTime;
      fpData.x += fpData.speedX * deltaTime;
      fpData.y += fpData.speedY * deltaTime;
      if (fpData.life > 8 || fpData.x < -50 || fpData.y < -50 || fpData.y > H + 50) {
        bgFgParticles.splice(fp, 1); continue;
      }
      ctx.fillStyle = fgCfg.particleColor;
      ctx.beginPath();
      if (fgCfg.particleType === 'petal') {
        ctx.ellipse(fpData.x, fpData.y, fpData.size, fpData.size * 0.5, Math.PI / 4, 0, Math.PI * 2);
      } else {
        ctx.arc(fpData.x, fpData.y, fpData.size, 0, Math.PI * 2);
      }
      ctx.fill();
    }
    while (bgFgParticles.length > 80) { bgFgParticles.shift(); }
  }

  function renderEntities(ctx) {
    // Will be implemented in Task 12
  }

  function renderHUD(ctx) {
    // Will be implemented in Task 12
  }

  function renderCutscene(ctx) {
    // Will be implemented in Task 13
  }

  function renderTitleScreen(ctx) {
    // Will be implemented in Task 13
  }

  function renderDeathScreen(ctx) {
    // Will be implemented in Task 13
  }

  function renderVictoryScreen(ctx) {
    // Will be implemented in Task 13
  }

  /* ============================================================
     Level Progression
     ============================================================ */
  function checkLevelProgress() {
    if (gameState !== STATE.PLAYING) return;

    // Check player death
    if (player.hp <= 0) {
      triggerDeath();
      return;
    }

    var won = false;

    if (levelData.winCondition === 'collect') {
      if (collectCount >= collectTarget) {
        won = true;
      }
    } else if (levelData.winCondition === 'survive') {
      if (levelDuration > 0 && levelTimer >= levelDuration) {
        won = true;
      }
    } else if (levelData.winCondition === 'boss') {
      // Boss round progression — will be fleshed out in Task 13
      if (levelData.bossRounds && bossRoundIndex >= levelData.bossRounds.length) {
        won = true;
      }
    }

    if (won) {
      completeLevel();
    }
  }

  function completeLevel() {
    AudioEngine.playSfx('level-complete');
    totalScore += collectCount * (GAME_CONSTANTS.SCORE_PER_PEACH || 100);
    totalScore += Math.floor(levelTimer) * (GAME_CONSTANTS.SCORE_PER_SECOND_SURVIVED || 5);
    totalScore += GAME_CONSTANTS.SCORE_PER_LEVEL_CLEAR || 500;
    totalTime += levelTimer;
    totalPeaches += collectCount;
    levelsCleared++;

    if (currentLevelIndex < PEACH_BANQUET_LEVELS.length - 1) {
      currentLevelIndex++;
      startLevel();
    } else {
      triggerVictory();
    }
  }

  function triggerDeath() {
    gameState = STATE.DEATH;
    AudioEngine.muteMusic();
    AudioEngine.playSfx('death');
    totalTime += levelTimer;
    saveBestScore();
  }

  function triggerVictory() {
    gameState = STATE.VICTORY;
    AudioEngine.playSfx('victory');
    totalTime += levelTimer;
    saveBestScore();
    saveFirstClear();
  }

  /* ============================================================
     localStorage
     ============================================================ */
  function saveBestScore() {
    try {
      var best = localStorage.getItem(GAME_CONSTANTS.STORAGE_KEY_BEST);
      if (!best || totalScore > parseInt(best, 10)) {
        localStorage.setItem(GAME_CONSTANTS.STORAGE_KEY_BEST, String(totalScore));
      }
    } catch (e) {
      // localStorage unavailable — silently ignore
    }
  }

  function saveFirstClear() {
    try {
      if (!localStorage.getItem(GAME_CONSTANTS.STORAGE_KEY_CLEAR)) {
        localStorage.setItem(GAME_CONSTANTS.STORAGE_KEY_CLEAR, new Date().toISOString());
      }
    } catch (e) {
      // localStorage unavailable — silently ignore
    }
  }

  function calculateStars() {
    if (levelsCleared <= 0) return 1;
    if (levelsCleared >= PEACH_BANQUET_LEVELS.length) return 5;
    return Math.min(5, 1 + levelsCleared);
  }

  /* ============================================================
     Render Helpers
     ============================================================ */
  function renderVignette(ctx) {
    var grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.6);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,' + GAME_CONSTANTS.VIGNETTE_ALPHA + ')');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  function renderPauseOverlay(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#d4b878';
    ctx.font = '48px "Ma Shan Zheng", "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('天机暂停', W / 2, H / 2 - 20);

    ctx.fillStyle = '#8B7355';
    ctx.font = '18px "Source Serif 4", serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('P or Esc to Resume', W / 2, H / 2 + 40);
  }

  /* ============================================================
     Game Loop — Update
     ============================================================ */
  function update(dt) {
    var scaledDt = dt * timeScale;

    switch (gameState) {
      case STATE.PLAYING:
        levelTimer += scaledDt;
        bossRoundTimer += scaledDt;

        updatePlayer(scaledDt);
        updateEnemies(scaledDt);
        updateProjectiles(scaledDt);
        updateCollectibles(scaledDt);
        updateHazards(scaledDt);
        updateParticles(scaledDt);
        checkCollisions();
        checkLevelProgress();

        bgScrollX += player.vx * deltaTime * 0.03;
        bgScrollY += player.vy * deltaTime * 0.03;

        // Smooth timeScale interpolation
        if (timeScale !== timeScaleTarget) {
          timeScale += (timeScaleTarget - timeScale) * 3 * scaledDt;
          if (Math.abs(timeScale - timeScaleTarget) < 0.01) {
            timeScale = timeScaleTarget;
          }
        }
        break;

      case STATE.PAUSED:
      case STATE.CUTSCENE:
      case STATE.LEVEL_COMPLETE:
        // Still update particles for visual effects
        updateParticles(scaledDt);
        break;

      case STATE.TITLE:
      case STATE.VICTORY:
      case STATE.DEATH:
        // Still update particles for visual effects
        updateParticles(scaledDt);
        break;
    }
  }

  /* ============================================================
     Game Loop — Render
     ============================================================ */
  function render() {
    ctx.clearRect(0, 0, W, H);
    renderBackground(ctx);

    if (screenShake.intensity > 0.5) {
      ctx.save();
      ctx.translate((Math.random() - 0.5) * screenShake.intensity, (Math.random() - 0.5) * screenShake.intensity);
    }

    switch (gameState) {
      case STATE.TITLE:
        renderTitleScreen(ctx);
        renderParticles(ctx);
        break;
      case STATE.PLAYING:
      case STATE.PAUSED:
        renderEntities(ctx);
        renderHUD(ctx);
        renderParticles(ctx);
        if (gameState === STATE.PAUSED) renderPauseOverlay(ctx);
        break;
      case STATE.CUTSCENE:
        renderCutscene(ctx);
        renderParticles(ctx);
        break;
      case STATE.LEVEL_COMPLETE:
        renderEntities(ctx);
        renderHUD(ctx);
        renderParticles(ctx);
        break;
      case STATE.DEATH:
        renderEntities(ctx);
        renderParticles(ctx);
        renderDeathScreen(ctx);
        break;
      case STATE.VICTORY:
        renderVictoryScreen(ctx);
        renderParticles(ctx);
        break;
    }

    if (screenFlash.alpha > 0.01) {
      ctx.fillStyle = screenFlash.color;
      ctx.globalAlpha = screenFlash.alpha;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    if (screenShake.intensity > 0.5) { ctx.restore(); }

    renderVignette(ctx);
  }

  /* ============================================================
     Game Loop — RequestAnimationFrame
     ============================================================ */
  function loop(timestamp) {
    var dt = lastTime ? (timestamp - lastTime) / 1000 : 0.016;
    lastTime = timestamp;

    // Clamp dt to 33ms to prevent spiral of death
    if (dt > 0.033) dt = 0.033;

    // FPS tracking — keep last 60 frame durations
    fpsHistory.push(dt);
    if (fpsHistory.length > 60) {
      fpsHistory.shift();
    }
    var totalDt = 0;
    for (var i = 0; i < fpsHistory.length; i++) {
      totalDt += fpsHistory[i];
    }
    currentFPS = Math.round(fpsHistory.length / totalDt);

    deltaTime = dt;

    // Audio engine update with real (unscaled) time
    AudioEngine.update(dt);

    // Game update with scaled time
    update(dt);
    render();

    requestAnimationFrame(loop);
  }

  /* ============================================================
     Window Init
     ============================================================ */
  window.initPeachBanquetHeist = function () {
    gameState = STATE.TITLE;
    AudioEngine.init();
    resetPlayer();
    totalScore = 0;
    totalPeaches = 0;
    totalTime = 0;
    levelsCleared = 0;
    timeScale = 1;
    timeScaleTarget = 1;
    lastTime = 0;
    requestAnimationFrame(loop);
  };

})();
