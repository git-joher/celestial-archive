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
    AudioEngine.start();
    AudioEngine.unmuteMusic();
    AudioEngine.setMusicLevel(1);
    currentLevelIndex = 0;
    totalScore = 0;
    totalPeaches = 0;
    totalTime = 0;
    levelsCleared = 0;
    startLevel();
  }

  function startLevel() {
    if (currentLevelIndex >= PEACH_BANQUET_LEVELS.length) {
      triggerVictory();
      return;
    }

    levelData = PEACH_BANQUET_LEVELS[currentLevelIndex];
    levelDuration = levelData.duration || 0;
    levelTimer = 0;
    collectCount = 0;
    collectTarget = levelData.collectTarget || 0;
    bossRoundIndex = 0;
    bossRoundTimer = 0;

    // Clear entity arrays
    enemies = [];
    projectiles = [];
    collectibles = [];
    hazards = [];
    particles = [];
    floatingTexts = [];

    resetPlayer();
    AudioEngine.setMusicLevel(currentLevelIndex + 1);
    gameState = STATE.CUTSCENE;
  }

  function togglePause() {
    if (gameState === STATE.PLAYING) {
      gameState = STATE.PAUSED;
    } else if (gameState === STATE.PAUSED) {
      gameState = STATE.PLAYING;
    }
  }

  /* ============================================================
     Stub: triggerDash / skipCutscene / restartGame  (Tasks 5-6)
     ============================================================ */
  function triggerDash() {
    // Will be implemented in Task 6
  }

  function skipCutscene() {
    gameState = STATE.PLAYING;
  }

  function restartGame() {
    gameState = STATE.TITLE;
    totalScore = 0;
    totalPeaches = 0;
    totalTime = 0;
    levelsCleared = 0;
  }

  /* ============================================================
     Stub: Update functions  (Tasks 7-11)
     ============================================================ */
  function updatePlayer(dt) {
    // Will be implemented in Task 7
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

  function updateParticles(dt) {
    // Will be implemented in Task 11
  }

  function checkCollisions() {
    // Will be implemented in Task 11
  }

  /* ============================================================
     Stub: Render functions  (Tasks 5-13)
     ============================================================ */
  function renderBackground(ctx) {
    // Will be implemented in Task 12
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

    switch (gameState) {
      case STATE.TITLE:
        renderTitleScreen(ctx);
        break;

      case STATE.PLAYING:
        renderEntities(ctx);
        renderHUD(ctx);
        break;

      case STATE.PAUSED:
        renderEntities(ctx);
        renderHUD(ctx);
        renderPauseOverlay(ctx);
        break;

      case STATE.CUTSCENE:
        renderCutscene(ctx);
        break;

      case STATE.LEVEL_COMPLETE:
        renderEntities(ctx);
        renderHUD(ctx);
        break;

      case STATE.VICTORY:
        renderVictoryScreen(ctx);
        break;

      case STATE.DEATH:
        renderDeathScreen(ctx);
        break;
    }

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
