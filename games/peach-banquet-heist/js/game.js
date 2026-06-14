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
  function dist(x1, y1, x2, y2) {
    var dx = x1 - x2, dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }

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

  function spawnLevelEnemies() {
    if (!levelData || !levelData.enemies) return;
    enemies = [];
    for (var i = 0; i < levelData.enemies.length; i++) {
      var cfg = levelData.enemies[i];
      for (var j = 0; j < cfg.count; j++) { spawnEnemy(cfg); }
    }
  }

  function spawnEnemy(cfg) {
    var margin = cfg.territoryMargin || 0.1;
    var enemy = {
      x: W * (margin + Math.random() * (1 - margin * 2)),
      y: H * (margin + Math.random() * (1 - margin * 2)),
      type: cfg.type, speed: cfg.speed, size: cfg.size, hp: cfg.hp || 1,
      patrolPattern: cfg.patrolPattern,
      patrolDir: Math.random() > 0.5 ? 1 : -1,
      patrolTimer: 0,
      special: cfg.special || null, specialCooldown: 0,
      attack: cfg.attack || null, attackCooldown: 0,
      render: cfg.render, territoryMargin: margin
    };
    enemies.push(enemy);
  }

  function spawnHazard(type, cfg) {
    var hazard = {
      type: type, x: 0, y: 0,
      warningTime: cfg.warningTime, warningTimer: cfg.warningTime,
      active: false, damage: cfg.damage, radius: cfg.radius || 30,
      color: cfg.color || '#ff0000', warningColor: cfg.warningColor || 'rgba(255,0,0,0.4)',
      pattern: cfg.pattern || 'point', timer: 0, duration: cfg.duration || 1500, data: {}
    };
    switch (cfg.pattern) {
      case 'cross':
        var wall = Math.floor(Math.random() * 4);
        if (wall === 0) { hazard.x = W / 2; hazard.y = 0; }
        else if (wall === 1) { hazard.x = W / 2; hazard.y = H; }
        else if (wall === 2) { hazard.x = 0; hazard.y = H / 2; }
        else { hazard.x = W; hazard.y = H / 2; }
        hazard.data.wall = wall;
        break;
      case 'random-line':
        hazard.x = Math.random() * W; hazard.y = Math.random() * H;
        hazard.data.angle = Math.random() * Math.PI;
        hazard.data.length = 100 + Math.random() * 200;
        break;
      case 'fullscreen':
        hazard.x = W / 2; hazard.y = H / 2;
        hazard.radius = Math.max(W, H);
        break;
      default:
        do { hazard.x = W * 0.1 + Math.random() * W * 0.8; hazard.y = H * 0.1 + Math.random() * H * 0.8; }
        while (dist(hazard.x, hazard.y, player.x, player.y) < 150);
        break;
    }
    hazards.push(hazard);
  }

  function updateEnemies(dt) {
    if (!levelData) return;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      var margin = e.territoryMargin;
      switch (e.patrolPattern) {
        case 'horizontal':
          e.x += e.speed * e.patrolDir * dt;
          if (e.x < W * margin || e.x > W * (1 - margin)) e.patrolDir *= -1;
          break;
        case 'vertical':
          e.y += e.speed * e.patrolDir * dt;
          if (e.y < H * margin || e.y > H * (1 - margin)) e.patrolDir *= -1;
          break;
        case 'random':
          e.patrolTimer -= dt;
          if (e.patrolTimer <= 0) { e.patrolTimer = 1.5 + Math.random() * 2; e.patrolDir = Math.random() * Math.PI * 2; }
          e.x += Math.cos(e.patrolDir) * e.speed * 0.6 * dt;
          e.y += Math.sin(e.patrolDir) * e.speed * 0.6 * dt;
          e.x = Math.max(W * margin, Math.min(W * (1 - margin), e.x));
          e.y = Math.max(H * margin, Math.min(H * (1 - margin), e.y));
          break;
      }
      if (e.specialCooldown > 0) e.specialCooldown -= dt;
      if (e.attackCooldown > 0) e.attackCooldown -= dt;

      // Tu Di Gong root snare
      if (e.type === 'tu-di-gong' && e.special && e.specialCooldown <= 0) {
        e.specialCooldown = e.special.cooldown;
        hazards.push({
          type: 'root-snare', x: player.x, y: player.y,
          warningTime: e.special.warningTime, warningTimer: e.special.warningTime,
          active: false, damage: 0, radius: e.special.snareRadius,
          color: '#5a3a1a', warningColor: 'rgba(100,180,80,0.3)',
          pattern: 'point', timer: e.special.snareDuration, duration: e.special.snareDuration,
          data: { snareActive: false, slowFactor: 0.4 }
        });
        AudioEngine.playSfx('snare');
      }

      // Seven Fairies fan wave
      if (e.type === 'seven-fairies' && e.attack && e.attackCooldown <= 0) {
        e.attackCooldown = e.attack.fireRate;
        var atk = e.attack;
        var adx = player.x - e.x, ady = player.y - e.y;
        var angleToPlayer = Math.atan2(ady, adx);
        var startAngle = angleToPlayer - atk.spreadAngle / 2;
        for (var p = 0; p < atk.projectiles; p++) {
          var pAngle = startAngle + (atk.spreadAngle / (atk.projectiles - 1)) * p;
          projectiles.push({
            x: e.x, y: e.y,
            vx: Math.cos(pAngle) * atk.projectileSpeed,
            vy: Math.sin(pAngle) * atk.projectileSpeed,
            size: atk.projectileSize, color: atk.projectileColor, damage: 10, life: 3
          });
        }
      }
    }

    // Xiwangmu boss (Level 2)
    if (levelData && levelData.boss && levelData.winCondition === 'collect') {
      var boss = levelData.boss;
      if (levelTimer >= boss.triggerTime && !levelData._bossActive) {
        levelData._bossActive = true; levelData._bossAttackTimer = 0;
        AudioEngine.playSfx('boss-appear');
        triggerScreenShake(15, 0.8);
        spawnParticleBurst(W / 2, H / 2, 40, 'spark', 200, 1.5);
      }
      if (levelData._bossActive) {
        levelData._bossAttackTimer += dt;
        if (levelData._bossAttackTimer >= boss.attackInterval) {
          levelData._bossAttackTimer = 0;
          hazards.push({ type: 'water-burst', x: player.x, y: player.y, warningTime: 500, warningTimer: 500, active: false, damage: boss.attacks[0].damage, radius: boss.attacks[0].radius, color: 'rgba(100,180,220,0.6)', warningColor: 'rgba(100,180,220,0.3)', pattern: 'point', timer: 1000, duration: 1000, data: {} });
          setTimeout(function () { if (gameState !== STATE.PLAYING) return; hazards.push({ type: 'water-burst', x: player.x + (Math.random()-0.5)*120, y: player.y + (Math.random()-0.5)*120, warningTime: 400, warningTimer: 400, active: false, damage: boss.attacks[0].damage*0.7, radius: boss.attacks[0].radius*0.8, color: 'rgba(100,180,220,0.5)', warningColor: 'rgba(100,180,220,0.25)', pattern: 'point', timer: 800, duration: 800, data: {} }); }, 600);
          setTimeout(function () { if (gameState !== STATE.PLAYING) return; hazards.push({ type: 'water-burst', x: player.x + (Math.random()-0.5)*120, y: player.y + (Math.random()-0.5)*120, warningTime: 400, warningTimer: 400, active: false, damage: boss.attacks[0].damage*0.7, radius: boss.attacks[0].radius*0.8, color: 'rgba(100,180,220,0.5)', warningColor: 'rgba(100,180,220,0.25)', pattern: 'point', timer: 800, duration: 800, data: {} }); }, 1200);
        }
      }
    }

    // Bagua safe zone (Level 3)
    if (levelData && levelData.mechanics) {
      for (var m = 0; m < levelData.mechanics.length; m++) {
        var mech = levelData.mechanics[m];
        if (mech.type === 'bagua-safe-zone') {
          levelData._baguaTimer = (levelData._baguaTimer || 0) + dt;
          if (levelData._baguaTimer >= mech.cycleTime / 1000) { levelData._baguaTimer = 0; levelData._baguaSafeIndex = Math.floor(Math.random() * 8); }
          if (levelData._baguaSafeIndex !== undefined) {
            var safeAngle = (levelData._baguaSafeIndex / 8) * Math.PI * 2;
            var safeX = W / 2 + Math.cos(safeAngle) * W * 0.25;
            var safeY = H / 2 + Math.sin(safeAngle) * H * 0.25;
            if (dist(player.x, player.y, safeX, safeY) > mech.safeRadius) {
              if (player.buffType !== 'invincible' && player.invincibleTimer <= 0) { player.hp -= mech.burnDPS * dt; if (player.hp <= 0) { player.hp = 0; triggerDeath(); } }
            }
          }
        }
      }
    }

    // Furnace hazards (Level 3)
    if (levelData && levelData.winCondition === 'survive') {
      levelData._hazardTimer = (levelData._hazardTimer || 0) + dt;
      if (levelData._hazardTimer > 2.5) { levelData._hazardTimer = 0; var hCfg = levelData.hazards[Math.floor(Math.random() * levelData.hazards.length)]; spawnHazard(hCfg.type, hCfg); }
    }

    // Boss rounds (Level 4)
    if (levelData && levelData.winCondition === 'boss' && gameState === STATE.PLAYING) {
      if (bossRoundIndex < levelData.bossRounds.length) {
        bossRoundTimer += dt;
        var round = levelData.bossRounds[bossRoundIndex];
        levelData._roundSpawnTimer = (levelData._roundSpawnTimer || 0) + dt;
        var spawnInterval = round.duration / (round.attacks[0].count || 10);
        if (levelData._roundSpawnTimer >= spawnInterval) { levelData._roundSpawnTimer = 0; spawnBossRoundAttack(round); }
        if (bossRoundTimer >= round.duration) { bossRoundIndex++; bossRoundTimer = 0; levelData._roundSpawnTimer = 0; triggerScreenShake(8, 0.5); AudioEngine.playSfx('level-complete'); }
      }
    }
  }

  function spawnBossRoundAttack(round) {
    var atk = round.attacks[0];
    switch (atk.type) {
      case 'lightning-strike':
        hazards.push({ type: 'lightning', x: W*0.1+Math.random()*W*0.8, y: H*0.1+Math.random()*H*0.6, warningTime: atk.warningTime, warningTimer: atk.warningTime, active: false, damage: atk.damage, radius: atk.boltRadius, color: '#ffffff', warningColor: atk.warningColor, pattern: 'point', timer: 400, duration: 400, data: {} });
        break;
      case 'fire-rain':
        var fx = Math.random() * W;
        hazards.push({ type: 'fireball', x: fx, y: -10, warningTime: atk.warningTime, warningTimer: atk.warningTime, active: false, damage: atk.damage, radius: atk.fireballRadius, color: atk.fireballColor, warningColor: 'rgba(255,100,30,0.4)', pattern: 'point', timer: 2000, duration: 2000, data: { residualFire: atk.residualFire, residualRadius: atk.residualRadius, residualDuration: atk.residualDuration } });
        break;
      case 'wind-push':
        var windAngle = Math.random() * Math.PI * 2;
        player.x += Math.cos(windAngle) * (atk.force || 150) * (1/60);
        player.y += Math.sin(windAngle) * (atk.force || 150) * (1/60);
        player.x = Math.max(player.radius, Math.min(W - player.radius, player.x));
        player.y = Math.max(player.radius, Math.min(H - player.radius, player.y));
        spawnParticleBurst(player.x - Math.cos(windAngle)*50, player.y - Math.sin(windAngle)*50, 5, 'ice', 100, 0.6);
        if (Math.random() < 0.3) AudioEngine.playSfx('wind-gust');
        break;
      case 'ice-shard':
        var iAngle = Math.random() * Math.PI * 2;
        projectiles.push({ x: player.x + Math.cos(iAngle+Math.PI)*300, y: player.y + Math.sin(iAngle+Math.PI)*300, vx: Math.cos(iAngle)*atk.speed, vy: Math.sin(iAngle)*atk.speed, size: atk.radius, color: atk.color, damage: atk.damage, life: 4 });
        break;
    }
  }

  function updateProjectiles(dt) {
    for (var i = projectiles.length - 1; i >= 0; i--) {
      var p = projectiles[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0 || p.x < -50 || p.x > W+50 || p.y < -50 || p.y > H+50) { projectiles.splice(i, 1); }
    }
  }

  function spawnInitialCollectibles() {
    if (!levelData || !levelData.collectibles) return;
    for (var i = 0; i < 5; i++) { spawnCollectible(); }
  }

  function spawnCollectible() {
    if (!levelData || !levelData.collectibles || levelData.collectibles.length === 0) return;
    var totalWeight = 0;
    for (var i = 0; i < levelData.collectibles.length; i++) { totalWeight += levelData.collectibles[i].spawnWeight || 100; }
    var roll = Math.random() * totalWeight;
    var cumulative = 0; var cfg = levelData.collectibles[0];
    for (var j = 0; j < levelData.collectibles.length; j++) { cumulative += levelData.collectibles[j].spawnWeight || 100; if (roll <= cumulative) { cfg = levelData.collectibles[j]; break; } }
    collectibles.push({
      x: W * 0.05 + Math.random() * W * 0.9,
      y: H * 0.15 + Math.random() * H * 0.7,
      type: cfg.type, label: cfg.label, points: cfg.points, radius: cfg.radius,
      color: cfg.color, glowColor: cfg.glowColor, effect: cfg.effect,
      effectDuration: cfg.effectDuration || 3000, bobOffset: Math.random() * Math.PI * 2, life: 15
    });
  }

  function updateCollectibles(dt) {
    if (!levelData) return;
    levelData._collectibleTimer = (levelData._collectibleTimer || 0) + dt;
    if (levelData._collectibleTimer >= 3 && collectibles.length < 12) { levelData._collectibleTimer = 0; spawnCollectible(); }
    for (var i = collectibles.length - 1; i >= 0; i--) {
      var c = collectibles[i]; c.bobOffset += dt * 2; c.life -= dt;
      if (c.life <= 0) { collectibles.splice(i, 1); continue; }
      if (dist(player.x, player.y, c.x, c.y + Math.sin(c.bobOffset) * 5) < player.radius + c.radius) { collectItem(c); collectibles.splice(i, 1); }
    }
  }

  function collectItem(c) {
    collectCount++; totalScore += c.points * GAME_CONSTANTS.SCORE_PER_PEACH; totalPeaches += c.points;
    floatingTexts.push({ x: c.x, y: c.y, text: c.label + ' +' + c.points, life: 1.5, maxLife: 1.5, color: c.color });
    if (c.type === 'small-peach') AudioEngine.playSfx('peach-small');
    else if (c.type === 'medium-peach') AudioEngine.playSfx('peach-medium');
    else if (c.type === 'large-peach') AudioEngine.playSfx('peach-large');
    else if (c.type === 'dew-drop') AudioEngine.playSfx('dew-collect');
    else if (c.type === 'elixir-shard') AudioEngine.playSfx('elixir-collect');
    if (c.effect === 'speed-boost') { player.buffType = 'speed-boost'; player.buffTimer = c.effectDuration / 1000; player.speed = (levelData.playerSpeed || 280) * 1.4; }
    else if (c.effect === 'slow-motion') { timeScaleTarget = 0.3; setTimeout(function () { timeScaleTarget = 1; }, c.effectDuration); }
    else if (c.effect === 'invincible') { player.buffType = 'invincible'; player.buffTimer = c.effectDuration / 1000; }
    spawnParticleBurst(c.x, c.y, 8, 'gold-dust', 50, 0.8);
  }

  function updateFloatingTexts(dt) {
    for (var i = floatingTexts.length - 1; i >= 0; i--) { var ft = floatingTexts[i]; ft.life -= dt; ft.y -= 40 * dt; if (ft.life <= 0) { floatingTexts.splice(i, 1); } }
  }

  function updateHazards(dt) {
    for (var i = hazards.length - 1; i >= 0; i--) {
      var h = hazards[i];
      if (!h.active) { h.warningTimer -= dt; if (h.warningTimer <= 0) { h.active = true; if (h.type === 'flame-jet' || h.type === 'fireball') AudioEngine.playSfx('fire-jet'); if (h.type === 'lightning') AudioEngine.playSfx('lightning'); if (h.type === 'pressure-blast') AudioEngine.playSfx('pressure-blast'); } }
      else { h.timer -= dt; if (h.timer <= 0) { if (h.data && h.data.residualFire) { hazards.push({ type: 'residual-fire', x: h.x, y: h.y, warningTime: 0, warningTimer: 0, active: true, damage: 8, radius: h.data.residualRadius, color: 'rgba(255,80,20,0.4)', pattern: 'point', timer: h.data.residualDuration, duration: h.data.residualDuration, data: {} }); } hazards.splice(i, 1); } }
    }
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
    for (var i = 0; i < enemies.length; i++) { var e = enemies[i]; if (dist(player.x, player.y, e.x, e.y) < player.radius + e.size) { hurtPlayer(15); } }
    for (var j = projectiles.length - 1; j >= 0; j--) { var proj = projectiles[j]; if (dist(player.x, player.y, proj.x, proj.y) < player.radius + proj.size) { hurtPlayer(proj.damage || 10); projectiles.splice(j, 1); } }
    for (var k = 0; k < hazards.length; k++) { var haz = hazards[k]; if (!haz.active) continue; var d = dist(player.x, player.y, haz.x, haz.y); if (d < haz.radius) { if (haz.type === 'root-snare' && !haz.data.snareActive) { haz.data.snareActive = true; player.speed *= haz.data.slowFactor; } if (haz.damage > 0) { hurtPlayer(haz.damage); } } }
  }

  function hurtPlayer(damage) {
    if (player.invincibleTimer > 0 || player.buffType === 'invincible') return;
    player.hp -= damage;
    player.invincibleTimer = GAME_CONSTANTS.INVINCIBILITY_MS / 1000;
    AudioEngine.playSfx('hurt');
    triggerScreenShake(6, 0.3);
    triggerScreenFlash('rgba(255,0,0,0.3)', 0.3, 0.15);
    spawnParticleBurst(player.x, player.y, 10, 'spark', 60, 0.4);
    if (player.hp <= 0) { player.hp = 0; triggerDeath(); }
    else if (player.hp <= 30) { AudioEngine.setLowHealth(true); }
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
    // Enemies
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i]; var r = e.render; if (!r) continue;
      ctx.fillStyle = r.glowColor; ctx.beginPath(); ctx.arc(e.x, e.y, e.size+6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = r.bodyColor; ctx.beginPath(); ctx.arc(e.x, e.y, e.size, 0, Math.PI*2); ctx.fill();
      if (r.hatColor) { ctx.fillStyle = r.hatColor; ctx.fillRect(e.x - e.size*0.5, e.y - e.size*1.2, e.size, e.size*0.4); }
      if (r.ribbonColor && e.type === 'seven-fairies') { ctx.strokeStyle = r.ribbonColor; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(e.x-e.size, e.y-e.size*0.3); ctx.quadraticCurveTo(e.x, e.y-e.size, e.x+e.size, e.y-e.size*0.3); ctx.stroke(); }
    }
    // Projectiles
    for (var j = 0; j < projectiles.length; j++) { var p = projectiles[j]; ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 6; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; }
    // Hazards
    for (var k = 0; k < hazards.length; k++) {
      var h = hazards[k];
      if (!h.active) {
        ctx.fillStyle = h.warningColor; ctx.strokeStyle = h.warningColor; ctx.lineWidth = 2;
        var pulse = 0.6 + 0.4 * Math.sin(h.warningTimer * 15); ctx.globalAlpha = pulse;
        ctx.beginPath();
        if (h.pattern === 'cross') { var chx = h.x, chy = h.y; ctx.fillRect(chx-4, chy-80, 8, 160); ctx.fillRect(chx-80, chy-4, 160, 8); }
        else if (h.pattern === 'random-line') { ctx.beginPath(); ctx.moveTo(h.x-Math.cos(h.data.angle)*h.data.length/2, h.y-Math.sin(h.data.angle)*h.data.length/2); ctx.lineTo(h.x+Math.cos(h.data.angle)*h.data.length/2, h.y+Math.sin(h.data.angle)*h.data.length/2); ctx.stroke(); }
        else { ctx.arc(h.x, h.y, h.radius*0.4, 0, Math.PI*2); ctx.fill(); }
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = h.color; ctx.shadowColor = h.color; ctx.shadowBlur = 15; ctx.beginPath();
        if (h.type === 'lightning') { ctx.moveTo(h.x, h.y-h.radius); ctx.lineTo(h.x+10, h.y-h.radius*0.3); ctx.lineTo(h.x-8, h.y); ctx.lineTo(h.x+5, h.y+h.radius*0.4); ctx.lineTo(h.x, h.y+h.radius); ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff'; ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = '#ffd700'; ctx.stroke(); }
        else if (h.pattern === 'cross') { ctx.fillRect(h.x-6, h.y-100, 12, 200); ctx.fillRect(h.x-100, h.y-6, 200, 12); }
        else if (h.pattern === 'fullscreen') { ctx.fillStyle = 'rgba(255,80,20,0.2)'; ctx.fillRect(0, 0, W, H); }
        else { ctx.arc(h.x, h.y, h.radius, 0, Math.PI*2); ctx.fill(); }
        ctx.shadowBlur = 0;
      }
    }
    // Bagua safe zone
    if (levelData && levelData.mechanics) {
      for (var m2 = 0; m2 < levelData.mechanics.length; m2++) { var mech2 = levelData.mechanics[m2]; if (mech2.type === 'bagua-safe-zone' && levelData._baguaSafeIndex !== undefined) { var safeAngle2 = (levelData._baguaSafeIndex / 8) * Math.PI * 2; var safeX2 = W / 2 + Math.cos(safeAngle2) * W * 0.25; var safeY2 = H / 2 + Math.sin(safeAngle2) * H * 0.25; ctx.fillStyle = mech2.safeColor; ctx.strokeStyle = 'rgba(255,215,0,0.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(safeX2, safeY2, mech2.safeRadius, 0, Math.PI*2); ctx.fill(); ctx.stroke(); } }
    }
    // Collectibles
    for (var ci = 0; ci < collectibles.length; ci++) { var col = collectibles[ci]; var bobY = Math.sin(col.bobOffset) * 5; ctx.fillStyle = col.glowColor; ctx.shadowColor = col.glowColor; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(col.x, col.y + bobY, col.radius, 0, Math.PI*2); ctx.fill(); var colGrad = ctx.createRadialGradient(col.x, col.y+bobY, 0, col.x, col.y+bobY, col.radius); colGrad.addColorStop(0, '#ffffff'); colGrad.addColorStop(0.3, col.color); colGrad.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = colGrad; ctx.beginPath(); ctx.arc(col.x, col.y+bobY, col.radius, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; if (col.type.indexOf('peach') !== -1) { ctx.fillStyle = '#5a8a4a'; ctx.beginPath(); ctx.ellipse(col.x, col.y + bobY - col.radius - 2, 5, 3, 0.3, 0, Math.PI*2); ctx.fill(); } }
    // Floating texts
    for (var fti = 0; fti < floatingTexts.length; fti++) { var ft = floatingTexts[fti]; var fta = ft.life / ft.maxLife; ctx.fillStyle = ft.color; ctx.globalAlpha = fta; ctx.font = 'bold 0.9rem "Source Serif 4", serif'; ctx.textAlign = 'center'; ctx.fillText(ft.text, ft.x, ft.y); ctx.textAlign = 'start'; ctx.globalAlpha = 1; }
    // Player
    renderPlayer(ctx);
  }

  function renderPlayer(ctx) {
    if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer * 20) % 2 === 0) { ctx.globalAlpha = 0.5; }
    if (player.buffType === 'speed-boost') { ctx.fillStyle = 'rgba(100,200,255,0.2)'; ctx.beginPath(); ctx.arc(player.x, player.y, player.radius+8, 0, Math.PI*2); ctx.fill(); }
    if (player.buffType === 'invincible') { ctx.fillStyle = 'rgba(255,215,0,0.25)'; ctx.beginPath(); ctx.arc(player.x, player.y, player.radius+12, 0, Math.PI*2); ctx.fill(); }
    if (player.isDashing) { ctx.fillStyle = 'rgba(255,215,0,0.3)'; for (var t = 0; t < 3; t++) { ctx.beginPath(); ctx.arc(player.x - player.dashDx*(t+1)*12, player.y - player.dashDy*(t+1)*12, player.radius*(1-t*0.2), 0, Math.PI*2); ctx.fill(); } }
    if (IMG.playerHead && IMG.playerHead.complete) { ctx.save(); ctx.beginPath(); ctx.arc(player.x, player.y, player.radius, 0, Math.PI*2); ctx.clip(); ctx.drawImage(IMG.playerHead, player.x-player.radius, player.y-player.radius, player.radius*2, player.radius*2); ctx.restore(); ctx.strokeStyle = '#d4b878'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(player.x, player.y, player.radius, 0, Math.PI*2); ctx.stroke(); }
    else { ctx.fillStyle = '#d4b878'; ctx.beginPath(); ctx.arc(player.x, player.y, player.radius, 0, Math.PI*2); ctx.fill(); }
    ctx.globalAlpha = 1;
  }

  function renderHUD(ctx) {
    if (!levelData) return;
    var padding = 18, barWidth = 200, barHeight = 14;

    // Level name (Chinese)
    ctx.fillStyle = '#e8dcc8'; ctx.font = '1.1rem "Ma Shan Zheng", serif'; ctx.textAlign = 'left';
    ctx.fillText(levelData.name, padding, padding + 20);
    // English
    ctx.fillStyle = 'rgba(200,180,140,0.5)'; ctx.font = '0.65rem "Cinzel", serif';
    ctx.fillText(levelData.nameEn.toUpperCase(), padding, padding + 40);

    // Objective + timer (right side)
    ctx.textAlign = 'right'; ctx.font = '0.85rem "Source Serif 4", serif';
    if (levelData.winCondition === 'collect') { ctx.fillStyle = '#d4b878'; ctx.fillText((levelData.id <= 2 ? '🍑 ' : '💧 ') + collectCount + '/' + collectTarget, W - padding, padding + 25); }
    else if (levelData.winCondition === 'survive') { ctx.fillStyle = '#d4b878'; ctx.fillText('SURVIVE', W - padding, padding + 25); }
    else if (levelData.winCondition === 'boss') { ctx.fillStyle = '#c44d34'; var rn = levelData.bossRounds && bossRoundIndex < levelData.bossRounds.length ? levelData.bossRounds[bossRoundIndex].name : ''; ctx.fillText('BOSS: ' + rn, W - padding, padding + 25); }
    var remaining = levelData.duration ? Math.max(0, Math.ceil(levelData.duration - levelTimer)) : 0;
    var timerText = levelData.winCondition === 'boss' ? 'BOSS' : Math.floor(remaining / 60) + ':' + ('0' + (remaining % 60)).slice(-2);
    ctx.fillStyle = remaining <= 10 && levelData.winCondition !== 'boss' ? '#c44d34' : '#e8dcc8'; ctx.font = '1.4rem "Cinzel", serif';
    ctx.fillText(timerText, W - padding, padding + 55);
    if (remaining <= 10 && remaining > 0 && levelData.winCondition !== 'boss') { var pulseAlpha = 0.3 + 0.3 * Math.sin(levelTimer * 8); ctx.fillStyle = 'rgba(196,77,52,' + pulseAlpha + ')'; ctx.fillRect(W - padding - 60, padding + 30, 70, 35); }
    ctx.textAlign = 'left';

    // Bottom HP bar
    var bottomY = H - padding - 30;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.strokeStyle = 'rgba(196,77,52,0.4)'; ctx.lineWidth = 1;
    roundRect(ctx, padding, bottomY, barWidth, barHeight, 7); ctx.fill(); ctx.stroke();
    var hpRatio = player.hp / player.maxHp;
    var hpColor = hpRatio > 0.5 ? '#b8a06e' : hpRatio > 0.25 ? '#e8a040' : '#c44d34';
    var hpGrad = ctx.createLinearGradient(padding, 0, padding + barWidth, 0); hpGrad.addColorStop(0, hpColor); hpGrad.addColorStop(1, hpRatio > 0.5 ? '#d4c090' : '#e06040');
    ctx.fillStyle = hpGrad; roundRect(ctx, padding + 2, bottomY + 2, (barWidth - 4) * hpRatio, barHeight - 4, 5); ctx.fill();
    ctx.fillStyle = '#e8dcc8'; ctx.font = '0.7rem monospace'; ctx.fillText('HP ' + Math.ceil(player.hp) + '/' + player.maxHp, padding + 8, bottomY + 11);

    // Dash cooldown
    var dashX = padding + barWidth + 24, dashY = bottomY + barHeight / 2, dashRadius = 12;
    ctx.strokeStyle = 'rgba(184,160,110,0.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(dashX, dashY, dashRadius, 0, Math.PI*2); ctx.stroke();
    if (player.dashCooldownTimer <= 0) { ctx.fillStyle = '#d4b878'; ctx.beginPath(); ctx.arc(dashX, dashY, dashRadius-3, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = 'rgba(200,180,140,0.5)'; ctx.font = '0.55rem monospace'; ctx.textAlign = 'center'; ctx.fillText('DASH', dashX, dashY - 18); ctx.textAlign = 'left'; }
    else { var cdRatio = player.dashCooldownTimer / GAME_CONSTANTS.DASH_COOLDOWN; ctx.strokeStyle = 'rgba(184,160,110,0.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(dashX, dashY, dashRadius-2, -Math.PI/2, -Math.PI/2 + Math.PI*2*(1-cdRatio)); ctx.stroke(); ctx.fillStyle = 'rgba(200,180,140,0.4)'; ctx.font = '0.55rem monospace'; ctx.textAlign = 'center'; ctx.fillText((Math.ceil(player.dashCooldownTimer*10)/10).toFixed(1)+'s', dashX, dashY-18); ctx.textAlign = 'left'; }

    // Progress bar
    var progWidth = 120, progX = W / 2 - progWidth / 2, progY = 8;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(progX, progY, progWidth, 3);
    var progress = levelData.duration ? Math.min(1, levelTimer / levelData.duration) : 0;
    if (levelData.winCondition === 'boss') { progress = bossRoundIndex / levelData.bossRounds.length; }
    var progGrad = ctx.createLinearGradient(progX, 0, progX + progWidth, 0); progGrad.addColorStop(0, '#c44d34'); progGrad.addColorStop(1, '#d4b878');
    ctx.fillStyle = progGrad; ctx.fillRect(progX, progY, progWidth * progress, 3);

    // Boss round dots
    if (levelData.winCondition === 'boss' && levelData.bossRounds) { for (var br = 0; br < levelData.bossRounds.length; br++) { var rx = W/2 - (levelData.bossRounds.length*20)/2 + br*20 + 10; ctx.fillStyle = br < bossRoundIndex ? '#d4b878' : br === bossRoundIndex ? '#c44d34' : 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.arc(rx, progY + 12, 5, 0, Math.PI*2); ctx.fill(); } }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
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
        updateFloatingTexts(dt);
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
