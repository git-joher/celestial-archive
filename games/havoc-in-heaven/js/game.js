/**
 * 大闹天宫 — Havoc in Heaven
 * Top-Down Survival Roguelike — Canvas Game Engine
 */

(function () {
  'use strict';
  document.body.classList.add('game-active');

  /* ============================================================
     Image Preloading
     ============================================================ */
  var IMG = {};
  function preloadImages() {
    var images = {
      playerHead: '../../images/sun-wukong/sun-wukong-ice.jpg',
      celebrate: '../../images/sun-wukong/sun-wukong-hero3.jpg',
      death: '../../images/sun-wukong/sun-wukong-hero2.jpg'
    };
    for (var key in images) {
      IMG[key] = new Image();
      IMG[key].src = images[key];
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
     Input
     ============================================================ */
  var keys = {};
  window.addEventListener('keydown', function (e) { keys[e.key.toLowerCase()] = true; if (e.key === ' ') { e.preventDefault(); togglePause(); } });
  window.addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });

  // Touch joystick
  var touchMove = { active: false, dx: 0, dy: 0 };
  var joystickEl = document.getElementById('mobile-joystick');
  var knobEl = document.getElementById('mobile-joystick-knob');

  if (joystickEl) {
    var jRect, jCx, jCy, jR;
    joystickEl.addEventListener('touchstart', function (e) {
      e.preventDefault();
      jRect = joystickEl.getBoundingClientRect();
      jCx = jRect.left + jRect.width / 2;
      jCy = jRect.top + jRect.height / 2;
      jR = jRect.width / 2;
      touchMove.active = true;
      updateJoystick(e.touches[0]);
    });
    joystickEl.addEventListener('touchmove', function (e) {
      e.preventDefault();
      if (touchMove.active) updateJoystick(e.touches[0]);
    });
    joystickEl.addEventListener('touchend', function (e) {
      e.preventDefault();
      touchMove.active = false;
      touchMove.dx = 0;
      touchMove.dy = 0;
      knobEl.style.transform = 'translate(-50%, -50%)';
    });
  }
  function updateJoystick(touch) {
    var dx = touch.clientX - jCx;
    var dy = touch.clientY - jCy;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var maxDist = jR - 22;
    if (dist > maxDist) { dx = dx / dist * maxDist; dy = dy / dist * maxDist; dist = maxDist; }
    knobEl.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
    touchMove.dx = dist > 8 ? dx / maxDist : 0;
    touchMove.dy = dist > 8 ? dy / maxDist : 0;
  }

  // Gyroscope / tilt control (mobile)
  var gyro = { active: false, dx: 0, dy: 0, calibrated: false, baseBeta: 0, baseGamma: 0, indicatorTimer: 0 };

  function startGyro() {
    // Try both event types for max compatibility
    window.addEventListener('deviceorientation', handleOrientation);
    window.addEventListener('deviceorientationabsolute', handleOrientation);

    // iOS 13+ explicit permission
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(function (state) {
          if (state === 'granted') {
            gyro.indicatorTimer = 3; // show "GYRO ON" briefly
          }
        })
        .catch(function () {});
    }
  }

  function handleOrientation(e) {
    if (e.beta === null || e.gamma === null) return;

    // Calibrate neutral on first valid reading
    if (!gyro.calibrated) {
      gyro.baseBeta = e.beta;
      gyro.baseGamma = e.gamma;
      gyro.calibrated = true;
      gyro.active = true;
      gyro.indicatorTimer = 2;
      return;
    }

    // beta: front-to-back tilt (-180..180). Positive = forward
    // gamma: left-to-right tilt (-90..90). Positive = right
    var rawDY = (e.beta - gyro.baseBeta);
    var rawDX = (e.gamma - gyro.baseGamma);

    // 1 degree tilt = 10% input. Deadzone at <1.5 degrees.
    var sens = 0.1;
    gyro.dy = Math.abs(rawDY) < 1.5 ? 0 : Math.max(-1, Math.min(1, rawDY * sens));
    gyro.dx = Math.abs(rawDX) < 1.5 ? 0 : Math.max(-1, Math.min(1, rawDX * sens));
  }

  // Re-calibrate on screen tap
  document.addEventListener('click', function (e) {
    if (!e.target.closest('#mobile-joystick') && !e.target.closest('#upgrade-overlay') && !e.target.closest('#death-overlay') && !e.target.closest('#btn-restart')) {
      if (gyro.active) { gyro.calibrated = false; gyro.indicatorTimer = 1.5; }
    }
  });

  // Start gyro immediately (don't wait for touch)
  startGyro();

  function getInputX() {
    var x = 0;
    if (keys['a'] || keys['arrowleft']) x -= 1;
    if (keys['d'] || keys['arrowright']) x += 1;
    if (touchMove.active) { x += touchMove.dx; }
    if (gyro.active && !(keys['a'] || keys['d'] || keys['arrowleft'] || keys['arrowright'])) { x += gyro.dx; }
    return Math.max(-1, Math.min(1, x));
  }
  function getInputY() {
    var y = 0;
    if (keys['w'] || keys['arrowup']) y -= 1;
    if (keys['s'] || keys['arrowdown']) y += 1;
    if (touchMove.active) { y += touchMove.dy; }
    if (gyro.active && !(keys['w'] || keys['s'] || keys['arrowup'] || keys['arrowdown'])) { y += gyro.dy; }
    return Math.max(-1, Math.min(1, y));
  }

  // Double-tap jump detection
  var jumpTriggered = false;
  var forwardPressed = keys['w'] || keys['arrowup'];

  if (forwardPressed) {
    var now = performance.now() / 1000;
    if (player._lastForwardPress > 0 && (now - player._lastForwardPress) < 0.3 && player.jumpCooldown <= 0 && player.jumpAirTimer <= 0) {
      jumpTriggered = true;
      player._lastForwardPress = 0;
    } else if (player._lastForwardPress <= 0) {
      player._lastForwardPress = now;
    }
  } else {
    player._lastForwardPress = 0;
  }

  /* ============================================================
     Pause
     ============================================================ */
  var paused = false;
  function togglePause() { paused = !paused; }
  function setPaused(v) { paused = v; }

  /* ============================================================
     Random Helpers
     ============================================================ */
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
  function dist(a, b) { var dx = a.x - b.x; var dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }
  function angle(a, b) { return Math.atan2(b.y - a.y, b.x - a.x); }

  /* ============================================================
     Game State
     ============================================================ */
  var player, enemies, particles, xpOrbs, projectiles, dmgNumbers;
  var wave, waveTimer, gameTime, kills, xp, level, xpToNext;
  var upgradePool, activeUpgrades;
  var gameOver, deathData;

  function initState() {
    player = {
      x: W / 2, y: H / 2,
      hp: 100, maxHp: 100,
      speed: 200, // pixels per second
      attackRange: 60,
      attackSpeed: 0.6, // seconds between attacks
      attackTimer: 0,
      attackDamage: 15,
      damageReduction: 0,
      dodgeChance: 0,
      revive: false,
      reviveUsed: false,
      tripleHead: false, // 三头六臂: double attack speed
      fullCircle: false, // 如意金箍棒: 360 attack
      fieryEyesTimer: 0, // 火眼金睛 cooldown
      stunTimer: 0, // 定身术 cooldown
      shockwaveTimer: 0, // 大圣归来 cooldown
      clones: [], // 分身术
      _burnTimer: 0,
      _burnTick: 0,
      _slowed: false,
      _slowTimer: 0,
      jumpCooldown: 0,
      jumpAirTimer: 0,
      jumpVx: 0,
      jumpVy: 0,
      _lastForwardPress: 0,
      _isJumping: false,
      _damageFlash: 0
    };
    enemies = [];
    particles = [];
    xpOrbs = [];
    projectiles = [];
    dmgNumbers = [];
    wave = 1;
    waveTimer = 0;
    gameTime = 0;
    kills = 0;
    xp = 0;
    level = 1;
    xpToNext = 30;
    activeUpgrades = [];
    gameOver = false;
    deathData = null;
    initUpgradePool();
  }

  /* ============================================================
     Upgrade Pool (15 upgrades)
     ============================================================ */
  function initUpgradePool() {
    upgradePool = [
      { id: 'range', nameZh: '金箍棒加长', nameEn: 'Extended Staff', desc: 'Attack range +40%', rarity: 'common', apply: function () { player.attackRange *= 1.4; } },
      { id: 'speed', nameZh: '筋斗云', nameEn: 'Somersault Cloud', desc: 'Move speed +30%', rarity: 'common', apply: function () { player.speed *= 1.3; } },
      { id: 'maxhp', nameZh: '仙桃续命', nameEn: 'Peach of Immortality', desc: 'Max HP +20, fully heal', rarity: 'common', apply: function () { player.maxHp += 20; player.hp = player.maxHp; } },
      { id: 'armor', nameZh: '金刚不坏', nameEn: 'Diamond Body', desc: 'Damage taken -15%', rarity: 'common', apply: function () { player.damageReduction += 0.15; } },
      { id: 'xpboost', nameZh: '蟠桃盛宴', nameEn: 'Peach Feast', desc: 'XP orb value +50%', rarity: 'common', apply: function () { } },
      { id: 'dmgup', nameZh: '八卦炉淬炼', nameEn: 'Furnace Tempered', desc: 'All damage +30%', rarity: 'uncommon', apply: function () { player.attackDamage = Math.floor(player.attackDamage * 1.3); } },
      { id: 'clone', nameZh: '分身术', nameEn: 'Clone Jutsu', desc: 'Summon a decoy clone', rarity: 'uncommon', apply: function () { player.clones.push({ x: player.x + rand(-60, 60), y: player.y + rand(-60, 60), hp: 40 }); } },
      { id: 'fiery', nameZh: '火眼金睛', nameEn: 'Fiery Golden Eyes', desc: 'Every 8s: flame cone forward', rarity: 'uncommon', apply: function () { player.fieryEyesTimer = 1; } },
      { id: 'stun', nameZh: '定身术', nameEn: 'Paralysis Spell', desc: 'Every 10s: freeze all enemies 1.5s', rarity: 'uncommon', apply: function () { player.stunTimer = 1.5; } },
      { id: 'dodge', nameZh: '七十二变', nameEn: '72 Transformations', desc: '20% chance to dodge any hit', rarity: 'uncommon', apply: function () { player.dodgeChance = Math.min(0.6, player.dodgeChance + 0.2); } },
      { id: 'firetrail', nameZh: '筋斗云进阶', nameEn: 'Cloud Trail', desc: 'Leave a flame trail when moving', rarity: 'rare', apply: function () { player.fireTrail = true; } },
      { id: 'triple', nameZh: '三头六臂', nameEn: 'Three Heads Six Arms', desc: 'Attack speed doubled', rarity: 'rare', apply: function () { player.tripleHead = true; } },
      { id: 'fullcircle', nameZh: '如意金箍棒', nameEn: 'Ruyi Jingu Bang', desc: 'Attack becomes 360° full circle', rarity: 'rare', apply: function () { player.fullCircle = true; } },
      { id: 'revive', nameZh: '不死之身', nameEn: 'Undying Body', desc: 'Revive once at 50% HP on death', rarity: 'rare', apply: function () { player.revive = true; } },
      { id: 'shockwave', nameZh: '大圣归来', nameEn: 'Great Sage Returns', desc: 'Every 20s: screen-clearing shockwave', rarity: 'legendary', apply: function () { player.shockwaveTimer = 2; } }
    ];
  }

  function pickUpgrades(count) {
    // Pick 'count' upgrades from the pool the player doesn't already have
    var available = upgradePool.filter(function (u) { return activeUpgrades.indexOf(u.id) === -1; });
    // Shuffle
    var shuffled = available.sort(function () { return Math.random() - 0.5; });
    // Ensure at least 1 non-common among first 3
    var picks = shuffled.slice(0, count);
    var hasNonCommon = picks.some(function (p) { return p.rarity !== 'common'; });
    if (!hasNonCommon && shuffled.length > count) {
      // Swap in a non-common
      for (var i = count; i < shuffled.length; i++) {
        if (shuffled[i].rarity !== 'common') {
          picks[picks.length - 1] = shuffled[i];
          break;
        }
      }
    }
    return picks;
  }

  /* ============================================================
     Spawning
     ============================================================ */
  function spawnEnemy(type) {
    // Spawn from a random edge
    var side = randInt(0, 3);
    var x, y;
    var margin = 40;
    if (side === 0) { x = rand(margin, W - margin); y = -margin; }
    else if (side === 1) { x = W + margin; y = rand(margin, H - margin); }
    else if (side === 2) { x = rand(margin, W - margin); y = H + margin; }
    else { x = -margin; y = rand(margin, H - margin); }

    var e = {
      x: x, y: y,
      type: type,
      hp: type.hp, maxHp: type.hp,
      speed: rand(type.speed * 0.85, type.speed * 1.15),
      damage: type.damage,
      radius: type.radius,
      color: type.color,
      element: type.element || 'metal',
      name: type.name,
      isBoss: type.isBoss || false,
      isRanged: type.isRanged || false,
      shootTimer: type.shootTimer || 0,
      shootCooldown: type.shootCooldown || 2,
      spawnTimer: type.spawnTimer || 0,
      burnTimer: 0
    };
    enemies.push(e);
  }

  function getWaveConfig(w) {
    var configs = {
      soldier: { hp: 20, speed: 80, damage: 10, radius: 10, color: '#d4b878', element: 'metal', name: '天兵', isRanged: false },
      general: { hp: 50, speed: 100, damage: 15, radius: 14, color: '#e8c860', element: 'metal', name: '天将', isRanged: false },
      cavalry: { hp: 30, speed: 170, damage: 12, radius: 11, color: '#ff6040', element: 'fire', name: '火骑兵', isRanged: false },
      archer: { hp: 25, speed: 55, damage: 18, radius: 11, color: '#5ab8e0', element: 'water', name: '冰弓手', isRanged: true, shootCooldown: 2.5 },
      giant: { hp: 180, speed: 80, damage: 28, radius: 25, color: '#c8a850', element: 'earth', name: '巨灵神', isBoss: false },
      hound: { hp: 60, speed: 210, damage: 16, radius: 12, color: '#5a9a4a', element: 'wood', name: '藤甲兽', isBoss: false },
      king: { hp: 250, speed: 55, damage: 25, radius: 28, color: '#e0c040', element: 'metal', name: '四大天王', isBoss: true, spawnTimer: 4 },
      nezha: { hp: 350, speed: 110, damage: 30, radius: 30, color: '#ff4040', element: 'fire', name: '哪吒', isBoss: true, isRanged: true, shootCooldown: 1.8 },
      erlang: { hp: 550, speed: 100, damage: 38, radius: 34, color: '#ffd700', element: 'all', name: '二郎神', isBoss: true, isRanged: true, shootCooldown: 1.2 }
    };
    return configs;
  }

  function spawnWave(waveNum) {
    var cfg = getWaveConfig();
    var types = [];
    types.push(cfg.soldier);
    if (waveNum >= 2) types.push(cfg.general);
    if (waveNum >= 3) types.push(cfg.cavalry);
    if (waveNum >= 4) types.push(cfg.archer);
    if (waveNum >= 6) types.push(cfg.giant);
    if (waveNum >= 7) types.push(cfg.hound);

    var baseCount = 8 + waveNum * 3;
    for (var i = 0; i < baseCount; i++) {
      var t = types[randInt(0, types.length - 1)];
      spawnEnemy(t);
    }

    // Boss every 5 waves
    if (waveNum % 5 === 0) {
      if (waveNum >= 15) spawnEnemy(cfg.erlang);
      else if (waveNum >= 10) spawnEnemy(cfg.nezha);
      else spawnEnemy(cfg.king);
    }
  }

  /* ============================================================
     Particles & XP Orbs
     ============================================================ */
  function spawnParticles(x, y, count, color, life) {
    for (var i = 0; i < count; i++) {
      var a = rand(0, Math.PI * 2);
      var spd = rand(60, 200);
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        life: life || 0.6,
        maxLife: life || 0.6,
        color: color || '#d4b878',
        radius: rand(1.5, 3.5)
      });
    }
  }

  function spawnXpOrb(x, y) {
    xpOrbs.push({
      x: x, y: y,
      value: 5 + (activeUpgrades.indexOf('xpboost') !== -1 ? 3 : 0),
      life: 15, // seconds before disappearing
      radius: 5,
      color: '#7ab86e'
    });
  }

  function spawnDmgNumber(x, y, val, clr) {
    dmgNumbers.push({
      x: x + rand(-12, 12), y: y,
      value: Math.floor(val),
      life: 0.8, maxLife: 0.8,
      color: clr || '#ffd700'
    });
  }

  function spawnProjectile(fromX, fromY, toX, toY, color) {
    var a = Math.atan2(toY - fromY, toX - fromX);
    projectiles.push({
      x: fromX, y: fromY,
      vx: Math.cos(a) * 220,
      vy: Math.sin(a) * 220,
      life: 3,
      radius: 4,
      color: color || '#ff6040',
      damage: 20
    });
  }

  /* ============================================================
     Update
     ============================================================ */
  function update(dt) {
    if (gameOver || paused) return;

    // Clamp dt to avoid huge jumps
    var dtClamped = Math.min(dt, 0.1);
    gameTime += dtClamped;
    waveTimer += dtClamped;

    updatePlayer(dtClamped);
    updateEnemies(dtClamped);
    updateProjectiles(dtClamped);
    updateParticles(dtClamped);
    updateDmgNumbers(dtClamped);
    updateXpOrbs(dtClamped);
    updateToast(dtClamped);
    checkWave();
    updateHUD();
  }

  /* ---- Player ---- */
  function updatePlayer(dt) {
    var ix = getInputX();
    var iy = getInputY();

    // Burn DOT from fire enemies
    if (player._burnTimer > 0) {
      player._burnTimer -= dt;
      if (!player._burnTick || player._burnTick <= 0) {
        player._burnTick = 0.3;
        player.hp -= 3;
        spawnDmgNumber(player.x, player.y - 16, 3, '#ff6040');
        spawnParticles(player.x, player.y, 2, '#ff6040', 0.3);
        if (player.hp <= 0) playerDied();
      }
      player._burnTick -= dt;
    }

    // Slow recovery from water/ice
    if (player._slowed) {
      player._slowTimer -= dt;
      if (player._slowTimer <= 0) {
        player._slowed = false;
        player.speed = 200;
        if (activeUpgrades.indexOf('speed') !== -1) player.speed *= 1.3;
      }
    }

    // Jump state handling
    if (player.jumpAirTimer > 0) {
      // In air — apply jump velocity
      player.x += player.jumpVx * dt;
      player.y += player.jumpVy * dt;
      player.jumpAirTimer -= dt;

      // Jump trail particles
      if (Math.random() < 0.7) {
        particles.push({
          x: player.x + rand(-4, 4), y: player.y + rand(-4, 4),
          vx: rand(-15, 15), vy: rand(-10, 5),
          life: 0.3, maxLife: 0.3,
          color: 'rgba(184,160,110,0.6)', radius: rand(2, 4)
        });
      }

      // Bounds during jump
      player.x = Math.max(20, Math.min(W - 20, player.x));
      player.y = Math.max(20, Math.min(H - 20, player.y));

      if (player.jumpAirTimer <= 0) {
        player._isJumping = false;
      }
    } else {
      // Normal movement
      var mag = Math.sqrt(ix * ix + iy * iy);
      if (mag > 1) { ix /= mag; iy /= mag; }
      player.x += ix * player.speed * dt;
      player.y += iy * player.speed * dt;

      // Bounds
      player.x = Math.max(20, Math.min(W - 20, player.x));
      player.y = Math.max(20, Math.min(H - 20, player.y));
    }

    // Jump trigger
    if (jumpTriggered && player.jumpCooldown <= 0 && player.jumpAirTimer <= 0) {
      player._isJumping = true;
      player.jumpAirTimer = 0.15;
      player.jumpCooldown = 0.6;
      var jumpDir = { x: ix, y: iy };
      var jmag = Math.sqrt(jumpDir.x * jumpDir.x + jumpDir.y * jumpDir.y);
      if (jmag < 0.1) { jumpDir.x = 0; jumpDir.y = -1; jmag = 1; }
      player.jumpVx = (jumpDir.x / jmag) * 80 / 0.15;
      player.jumpVy = (jumpDir.y / jmag) * 80 / 0.15;
      spawnParticles(player.x, player.y, 6, 'rgba(184,160,110,0.8)', 0.2);
      // AudioEngine.playSfx('jump'); -- will be added in Task 8
    }

    // Jump cooldown tick
    if (player.jumpCooldown > 0) {
      player.jumpCooldown -= dt;
    }

    // Fire trail
    if (player.fireTrail && mag > 0.1) {
      if (!player._trailTimer || player._trailTimer <= 0) {
        player._trailTimer = 0.06;
        particles.push({
          x: player.x + rand(-6, 6), y: player.y + rand(-6, 6),
          vx: rand(-20, 20), vy: rand(-20, 20),
          life: 0.6, maxLife: 0.6,
          color: '#ff6a20', radius: rand(4, 8)
        });
        // Damage enemies near the trail
        for (var fi = enemies.length - 1; fi >= 0; fi--) {
          if (dist(player, enemies[fi]) < 40) {
            var trailDmg = Math.floor(player.attackDamage * 0.3);
            enemies[fi].hp -= trailDmg;
            spawnDmgNumber(enemies[fi].x, enemies[fi].y, trailDmg, '#ff6a20');
            if (enemies[fi].hp <= 0) killEnemy(enemies[fi]);
          }
        }
      }
      player._trailTimer -= dt;
    }

    // Clone follow
    for (var ci = 0; ci < player.clones.length; ci++) {
      var clone = player.clones[ci];
      if (clone.hp <= 0) continue;
      // Follow player with delay — orbit at distance 60
      var targetX = player.x + Math.cos(gameTime * 1.5 + ci * 2) * 60;
      var targetY = player.y + Math.sin(gameTime * 1.5 + ci * 2) * 60;
      clone.x += (targetX - clone.x) * 3 * dt;
      clone.y += (targetY - clone.y) * 3 * dt;
    }

    // Attack
    var aspd = player.tripleHead ? player.attackSpeed / 2 : player.attackSpeed;
    player.attackTimer -= dt;
    if (player.attackTimer <= 0) {
      player.attackTimer = aspd;
      performAttack();
    }

    // Fiery Eyes
    if (player.fieryEyesTimer !== undefined) {
      player.fieryEyesTimer -= dt;
      if (player.fieryEyesTimer <= 0) {
        player.fieryEyesTimer = 8;
        fieryEyesBurst();
      }
    }

    // Stun
    if (player.stunTimer !== undefined) {
      player.stunTimer -= dt;
      if (player.stunTimer <= 0) {
        player.stunTimer = 10;
        stunAll();
      }
    }

    // Shockwave
    if (player.shockwaveTimer !== undefined) {
      player.shockwaveTimer -= dt;
      if (player.shockwaveTimer <= 0) {
        player.shockwaveTimer = 20;
        shockwave();
      }
    }
  }

  function performAttack() {
    var range = player.attackRange;
    // Find nearest enemy in range
    var target = null;
    var minDist = range;
    for (var i = 0; i < enemies.length; i++) {
      var d = dist(player, enemies[i]);
      if (d < minDist) { minDist = d; target = enemies[i]; }
    }

    if (target) {
      var dmg = player.attackDamage;
      target.hp -= dmg;
      spawnDmgNumber(target.x, target.y, dmg, '#ffd700');
      spawnParticles(target.x, target.y, 5, '#d4b878', 0.4);
      if (target.hp <= 0) {
        killEnemy(target);
      }
    }

    // 360° attack hits all in range
    if (player.fullCircle) {
      for (var j = enemies.length - 1; j >= 0; j--) {
        if (enemies[j] === target) continue;
        if (dist(player, enemies[j]) < range) {
          enemies[j].hp -= player.attackDamage;
          spawnDmgNumber(enemies[j].x, enemies[j].y, player.attackDamage, '#ffd700');
          spawnParticles(enemies[j].x, enemies[j].y, 3, '#d4b878', 0.3);
          if (enemies[j].hp <= 0) killEnemy(enemies[j]);
        }
      }
    }

    // Attack arc visual
    player._attackFlash = 0.15;
  }

  function fieryEyesBurst() {
    // Damage all enemies in a cone in front of the player
    var mx = getInputX() || 0;
    var my = getInputY() || 0;
    var facingAngle = (mx === 0 && my === 0) ? -Math.PI / 2 : Math.atan2(my, mx);
    for (var i = enemies.length - 1; i >= 0; i--) {
      var a = angle(player, enemies[i]);
      var diff = a - facingAngle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) < Math.PI / 3 && dist(player, enemies[i]) < player.attackRange * 2.5) {
        var fieryDmg = player.attackDamage * 2;
        enemies[i].hp -= fieryDmg;
        spawnDmgNumber(enemies[i].x, enemies[i].y, fieryDmg, '#ff8c42');
        spawnParticles(enemies[i].x, enemies[i].y, 10, '#ff8c42', 0.6);
        if (enemies[i].hp <= 0) killEnemy(enemies[i]);
      }
    }
    player._fieryFlash = 0.3;
  }

  function stunAll() {
    for (var i = 0; i < enemies.length; i++) {
      enemies[i].stunned = 1.5;
    }
    player._stunFlash = 0.3;
  }

  function shockwave() {
    for (var i = enemies.length - 1; i >= 0; i--) {
      var shockDmg = player.attackDamage * 4;
      enemies[i].hp -= shockDmg;
      spawnDmgNumber(enemies[i].x, enemies[i].y, shockDmg, '#ffe040');
      spawnParticles(enemies[i].x, enemies[i].y, 15, '#ffd700', 0.8);
      if (enemies[i].hp <= 0) killEnemy(enemies[i]);
    }
    player._shockwaveFlash = 0.5;
  }

  function killEnemy(enemy) {
    var idx = enemies.indexOf(enemy);
    if (idx === -1) return;
    kills++;
    spawnParticles(enemy.x, enemy.y, enemy.isBoss ? 30 : 8, enemy.color, 0.8);
    spawnXpOrb(enemy.x, enemy.y);
    if (enemy.isBoss) {
      for (var i = 0; i < 3; i++) spawnXpOrb(enemy.x + rand(-30, 30), enemy.y + rand(-30, 30));
    }
    enemies.splice(idx, 1);
  }

  function damagePlayer(dmg, element) {
    // Water element slow
    if (element === 'water' && !player._slowed) {
      player._slowed = true;
      player._slowTimer = 2;
      player.speed *= 0.7;
    }

    if (player.dodgeChance > 0 && Math.random() < player.dodgeChance) {
      spawnParticles(player.x, player.y, 5, '#a0d8ff', 0.4);
      return; // Dodged
    }
    var actualDmg = Math.max(1, Math.floor(dmg * (1 - player.damageReduction)));
    player.hp -= actualDmg;
    spawnParticles(player.x, player.y, 4, '#ff4040', 0.3);
    player._damageFlash = 0.2;
    if (player.hp <= 0) {
      if (player.revive && !player.reviveUsed) {
        player.reviveUsed = true;
        player.hp = Math.floor(player.maxHp * 0.5);
        spawnParticles(player.x, player.y, 30, '#ffd700', 1.2);
      } else {
        playerDied();
      }
    }
  }

  /* ---- Enemies ---- */
  function updateEnemies(dt) {
    for (var i = enemies.length - 1; i >= 0; i--) {
      var e = enemies[i];
      if (e.stunned > 0) { e.stunned -= dt; continue; }

      // Move toward player
      var a = angle(e, player);
      e.x += Math.cos(a) * e.speed * dt;
      e.y += Math.sin(a) * e.speed * dt;

      // Collision with player
      if (dist(e, player) < (e.radius + 12)) {
        damagePlayer(e.damage, e.element);
        var pushAngle = angle(player, e);
        e.x += Math.cos(pushAngle) * 30;
        e.y += Math.sin(pushAngle) * 30;
      }

      // Fire element: apply burn DOT on contact
      if (e.element === 'fire' && dist(e, player) < (e.radius + 16)) {
        if (!player._burnTimer) player._burnTimer = 0;
        player._burnTimer = 2;
      }

      // Clone collision
      for (var c = 0; c < player.clones.length; c++) {
        var cl = player.clones[c];
        if (cl.hp > 0 && dist(e, cl) < (e.radius + 10)) {
          cl.hp -= e.damage;
          if (cl.hp <= 0) { spawnParticles(cl.x, cl.y, 10, '#a0d8ff', 0.5); }
          // Push enemy toward clone instead
          var ca = angle(cl, e);
          e.x -= Math.cos(ca) * 20;
          e.y -= Math.sin(ca) * 20;
        }
      }

      // Wood element: regenerate HP over time
      if (e.element === 'wood' && e.hp < e.maxHp) {
        if (!e._regenTimer) e._regenTimer = 0;
        e._regenTimer -= dt;
        if (e._regenTimer <= 0) {
          e._regenTimer = 0.5;
          e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.02);
        }
      }

      // Ranged attack
      if (e.isRanged) {
        e.shootTimer -= dt;
        if (e.shootTimer <= 0) {
          e.shootTimer = e.shootCooldown || 2;
          spawnProjectile(e.x, e.y, player.x, player.y, e.color);
        }
      }

      // Boss spawning minions
      if (e.isBoss && e.spawnTimer !== undefined) {
        e.spawnTimer -= dt;
        if (e.spawnTimer <= 0) {
          e.spawnTimer = 4;
          var cfg = getWaveConfig();
          var minion = cfg.soldier;
          minion.hp = 15; minion.speed = 100; minion.damage = 8; minion.radius = 8; minion.color = e.color;
          spawnEnemy(minion);
        }
      }
    }
  }

  /* ---- Projectiles ---- */
  function updateProjectiles(dt) {
    for (var i = projectiles.length - 1; i >= 0; i--) {
      var p = projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) { projectiles.splice(i, 1); continue; }
      // Hit player
      if (dist(p, player) < (p.radius + 12)) {
        damagePlayer(p.damage, 'water');
        projectiles.splice(i, 1);
        continue;
      }
      // Out of bounds
      if (p.x < -50 || p.x > W + 50 || p.y < -50 || p.y > H + 50) {
        projectiles.splice(i, 1);
      }
    }
  }

  /* ---- Particles ---- */
  function updateParticles(dt) {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function updateDmgNumbers(dt) {
    for (var i = dmgNumbers.length - 1; i >= 0; i--) {
      var dn = dmgNumbers[i];
      dn.y -= 50 * dt;
      dn.life -= dt;
      if (dn.life <= 0) dmgNumbers.splice(i, 1);
    }
  }

  /* ---- XP Orbs ---- */
  function updateXpOrbs(dt) {
    for (var i = xpOrbs.length - 1; i >= 0; i--) {
      var o = xpOrbs[i];
      o.life -= dt;
      if (o.life <= 0) { xpOrbs.splice(i, 1); continue; }
      // Magnet toward player
      var d = dist(player, o);
      if (d < 80) {
        var a = angle(o, player);
        var magnetSpeed = 300;
        o.x += Math.cos(a) * magnetSpeed * dt;
        o.y += Math.sin(a) * magnetSpeed * dt;
      }
      // Collect
      if (d < 18) {
        xp += o.value;
        xpOrbs.splice(i, 1);
        checkLevelUp();
      }
    }
  }

  /* ---- Wave System ---- */
  var trickleTimer = 0;
  function checkWave() {
    if (waveTimer >= 30) {
      waveTimer = 0;
      wave++;
      spawnWave(wave);
    }
    // Continuous trickle spawn (every 1.2 seconds if below cap)
    trickleTimer -= 0.016;
    if (trickleTimer <= 0 && enemies.length < 15 + wave * 2) {
      trickleTimer = 1.2;
      var cfg = getWaveConfig();
      var types = [cfg.soldier];
      if (wave >= 2) types.push(cfg.general);
      if (wave >= 3) types.push(cfg.cavalry);
      var t = types[randInt(0, types.length - 1)];
      // Clone to avoid mutating config reference
      spawnEnemy({
        hp: t.hp, speed: t.speed, damage: t.damage,
        radius: t.radius, color: t.color, element: t.element,
        name: t.name,
        isBoss: t.isBoss || false, isRanged: t.isRanged || false,
        shootCooldown: t.shootCooldown, spawnTimer: t.spawnTimer
      });
    }
  }

  /* ---- Level Up ---- */
  function checkLevelUp() {
    if (xp >= xpToNext) {
      xp -= xpToNext;
      level++;
      xpToNext = Math.floor(xpToNext * 1.4);
      autoUpgrade();
    }
  }

  /* ============================================================
     Auto Upgrade + Toast + Update
     ============================================================ */
  var toastMsg = '';
  var toastTimer = 0;

  function autoUpgrade() {
    var picks = pickUpgrades(3);
    var chosen = picks[randInt(0, picks.length - 1)];
    chosen.apply();
    activeUpgrades.push(chosen.id);
    updateUpgradeIcons();
    toastMsg = chosen.nameEn + ' — ' + chosen.desc;
    toastTimer = 2.5;
  }

  function updateUpgradeIcons() {
    var iconsEl = document.getElementById('upgrade-icons');
    if (!iconsEl) return;
    iconsEl.innerHTML = '';
    for (var i = 0; i < activeUpgrades.length; i++) {
      var up = null;
      for (var j = 0; j < upgradePool.length; j++) {
        if (upgradePool[j].id === activeUpgrades[i]) { up = upgradePool[j]; break; }
      }
      if (up) {
        var icon = document.createElement('span');
        icon.className = 'upgrade-icon';
        icon.title = up.nameEn + ' — ' + up.desc;
        icon.textContent = up.nameZh.charAt(0);
        iconsEl.appendChild(icon);
      }
    }
  }

  function updateToast(dt) {
    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) toastMsg = '';
    }
    if (gyro.indicatorTimer > 0) {
      gyro.indicatorTimer -= dt;
    }
  }

  /* ============================================================
     Death
     ============================================================ */
  function playerDied() {
    gameOver = true;
    deathData = { time: gameTime, wave: wave, kills: kills };
    var overlay = document.getElementById('death-overlay');
    document.getElementById('death-time').textContent = formatTime(gameTime);
    document.getElementById('death-wave').textContent = wave;
    document.getElementById('death-kills').textContent = kills;
    document.getElementById('death-score').textContent = Math.floor(kills * 10 + wave * 200 + gameTime * 5);
    overlay.classList.add('active');
  }

  function formatTime(t) {
    var m = Math.floor(t / 60);
    var s = Math.floor(t % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  /* ============================================================
     HUD Update
     ============================================================ */
  function updateHUD() {
    document.getElementById('hp-inner').style.width = Math.max(0, player.hp / player.maxHp * 100) + '%';
    document.getElementById('hp-num').textContent = Math.max(0, Math.floor(player.hp)) + '/' + player.maxHp;
    document.getElementById('xp-inner').style.width = (xp / xpToNext * 100) + '%';
    document.getElementById('hud-lv').textContent = level;
    document.getElementById('hud-wave').textContent = wave;
    document.getElementById('hud-time').textContent = formatTime(gameTime);
    document.getElementById('hud-kills').textContent = kills;
  }

  /* ============================================================
     Enemy Drawing Functions
     ============================================================ */

  function drawElementParticles(e) {
    var t = gameTime;
    if (e.element === 'fire') {
      for (var fi = 0; fi < 2; fi++) {
        var fx = e.x + rand(-e.radius, e.radius);
        var fy = e.y + rand(-e.radius, e.radius) - 4;
        ctx.fillStyle = 'rgba(255,140,20,' + (0.4 + Math.sin(t * 10 + fi) * 0.3) + ')';
        ctx.beginPath();
        ctx.arc(fx, fy, rand(1, 3), 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (e.element === 'water') {
      ctx.strokeStyle = 'rgba(150,210,255,0.3)';
      ctx.lineWidth = 1;
      var iceAngle = t * 2;
      for (var wi = 0; wi < 3; wi++) {
        var wx = e.x + Math.cos(iceAngle + wi * 2.1) * e.radius * 0.8;
        var wy = e.y + Math.sin(iceAngle + wi * 2.1) * e.radius * 0.8;
        ctx.beginPath();
        ctx.moveTo(wx - 3, wy);
        ctx.lineTo(wx + 3, wy);
        ctx.moveTo(wx, wy - 3);
        ctx.lineTo(wx, wy + 3);
        ctx.stroke();
      }
    } else if (e.element === 'wood') {
      if (e.hp < e.maxHp && Math.random() < 0.5) {
        ctx.fillStyle = 'rgba(120,220,80,0.5)';
        ctx.beginPath();
        ctx.arc(e.x + rand(-e.radius, e.radius), e.y - e.radius + rand(-4, 2), 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (e.element === 'earth') {
      ctx.fillStyle = 'rgba(200,170,100,0.3)';
      var dustOff = Math.sin(t * 3 + e.x * 0.1) * 3;
      ctx.beginPath();
      ctx.arc(e.x + dustOff, e.y - e.radius + dustOff, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.element === 'all') {
      var cycle = Math.floor(t * 2) % 5;
      var colors = ['rgba(212,184,120,0.5)', 'rgba(120,220,80,0.5)', 'rgba(100,180,240,0.5)', 'rgba(255,100,30,0.5)', 'rgba(200,170,80,0.5)'];
      ctx.fillStyle = colors[cycle];
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius + 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawEnemyShape(e) {
    var r = e.radius;
    var x = e.x, y = e.y;

    if (e.element === 'metal') {
      ctx.fillStyle = e.color;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(gameTime * 0.5 + (e.x * 0.01));
      ctx.fillRect(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6);
      ctx.fillStyle = 'rgba(255,240,200,0.4)';
      ctx.fillRect(-r * 0.4, -r * 0.7, r * 0.8, r * 0.5);
      ctx.restore();
      ctx.fillStyle = '#c44d34';
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r * 0.5, y - r * 1.6);
      ctx.lineTo(x - r * 0.5, y - r * 1.6);
      ctx.closePath();
      ctx.fill();
    } else if (e.element === 'fire') {
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.moveTo(x, y - r * 1.2);
      ctx.lineTo(x + r * 0.9, y + r * 0.6);
      ctx.lineTo(x - r * 0.9, y + r * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,200,100,0.5)';
      ctx.beginPath();
      ctx.moveTo(x, y - r * 0.7);
      ctx.lineTo(x + r * 0.5, y + r * 0.3);
      ctx.lineTo(x - r * 0.5, y + r * 0.3);
      ctx.closePath();
      ctx.fill();
    } else if (e.element === 'water') {
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.moveTo(x, y - r * 1.1);
      ctx.lineTo(x + r * 0.9, y);
      ctx.lineTo(x, y + r * 1.1);
      ctx.lineTo(x - r * 0.9, y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(200,230,255,0.4)';
      ctx.beginPath();
      ctx.moveTo(x, y - r * 0.5);
      ctx.lineTo(x + r * 0.4, y);
      ctx.lineTo(x, y + r * 0.5);
      ctx.lineTo(x - r * 0.4, y);
      ctx.closePath();
      ctx.fill();
    } else if (e.element === 'wood') {
      ctx.fillStyle = e.color;
      ctx.beginPath();
      for (var h = 0; h < 6; h++) {
        var hx = x + Math.cos(h * Math.PI / 3 - Math.PI / 6) * r;
        var hy = y + Math.sin(h * Math.PI / 3 - Math.PI / 6) * r;
        if (h === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(40,100,20,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var v = 0; v < 3; v++) {
        ctx.moveTo(x, y);
        var vx = x + Math.cos(v * 2.1) * r * 0.7;
        var vy = y + Math.sin(v * 2.1) * r * 0.7;
        ctx.lineTo(vx, vy);
      }
      ctx.stroke();
    } else if (e.element === 'earth') {
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(100,70,20,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.4, y - r * 0.3);
      ctx.lineTo(x + r * 0.1, y + r * 0.1);
      ctx.lineTo(x + r * 0.5, y - r * 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + r * 0.2, y + r * 0.4);
      ctx.lineTo(x - r * 0.3, y - r * 0.1);
      ctx.stroke();
    } else {
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Common: bright center dot
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ============================================================
     Rendering
     ============================================================ */
  function render() {
    ctx.clearRect(0, 0, W, H);

    // Background
    var bgGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
    bgGrad.addColorStop(0, '#1a1410');
    bgGrad.addColorStop(1, '#0a0604');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Floor grid (subtle)
    ctx.strokeStyle = 'rgba(184,160,110,0.04)';
    ctx.lineWidth = 1;
    var gridSize = 60;
    for (var gx = 0; gx < W; gx += gridSize) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (var gy = 0; gy < H; gy += gridSize) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

    // XP orbs
    for (var oi = 0; oi < xpOrbs.length; oi++) {
      var o = xpOrbs[oi];
      var alpha = Math.min(1, o.life / 3);
      ctx.fillStyle = 'rgba(122,184,110,' + alpha + ')';
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(160,220,140,' + alpha * 0.6 + ')';
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Projectiles
    for (var pi = 0; pi < projectiles.length; pi++) {
      var pr = projectiles[pi];
      ctx.fillStyle = pr.color;
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, pr.radius, 0, Math.PI * 2);
      ctx.fill();
      // Trail
      ctx.strokeStyle = pr.color;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(pr.x, pr.y);
      ctx.lineTo(pr.x - pr.vx * 0.02, pr.y - pr.vy * 0.02);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Clones
    for (var ci = 0; ci < player.clones.length; ci++) {
      var cl = player.clones[ci];
      if (cl.hp <= 0) continue;
      ctx.fillStyle = 'rgba(184,160,110,0.5)';
      ctx.beginPath();
      ctx.arc(cl.x, cl.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(184,160,110,0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Enemies
    for (var ei = 0; ei < enemies.length; ei++) {
      var e = enemies[ei];
      ctx.save();
      ctx.globalAlpha = e.stunned > 0 ? 0.5 + 0.5 * Math.sin(gameTime * 20) : 1;

      drawEnemyShape(e);
      drawElementParticles(e);

      // Burn effect visual
      if (e.burnTimer > 0) {
        ctx.fillStyle = 'rgba(255,100,20,0.4)';
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // HP bar for bosses
      if (e.isBoss) {
        var barW = e.radius * 2;
        var barH = 6;
        var barY = e.y - e.radius - 12;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(e.x - barW / 2, barY, barW, barH);
        ctx.fillStyle = '#c44d34';
        ctx.fillRect(e.x - barW / 2, barY, barW * (e.hp / e.maxHp), barH);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(e.x - barW / 2, barY, barW, barH);
        ctx.fillStyle = '#e8dcc8';
        ctx.font = 'bold 11px Cinzel, "Noto Serif SC", serif';
        ctx.textAlign = 'center';
        ctx.fillText(e.name, e.x, barY - 5);
      }
      ctx.restore();
    }

    // Player
    var px = player.x, py = player.y;

    // Glow behind player
    var glowGrad = ctx.createRadialGradient(px, py, 8, px, py, 34);
    glowGrad.addColorStop(0, 'rgba(184,160,110,0.6)');
    glowGrad.addColorStop(1, 'rgba(184,160,110,0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(px, py, 34, 0, Math.PI * 2);
    ctx.fill();

    // Player head image (circular clip)
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, 16, 0, Math.PI * 2);
    ctx.clip();

    // Rotate slightly toward movement direction
    var ix = getInputX();
    var iy = getInputY();
    var moveAngle = 0;
    if (ix !== 0 || iy !== 0) {
      moveAngle = Math.atan2(iy, ix) * 0.25;
    }
    ctx.translate(px, py);
    ctx.rotate(moveAngle);
    if (IMG.playerHead && IMG.playerHead.complete && IMG.playerHead.naturalWidth > 0) {
      ctx.drawImage(IMG.playerHead, -16, -16, 32, 32);
    } else {
      // Fallback: gold circle
      ctx.fillStyle = '#d4b878';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Golden ring border
    ctx.strokeStyle = 'rgba(184,160,110,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, 16, 0, Math.PI * 2);
    ctx.stroke();

    // Damage flash (white overlay when recently hit)
    if (player._damageFlash > 0) {
      ctx.fillStyle = 'rgba(255,255,255,' + (player._damageFlash / 0.2 * 0.5) + ')';
      ctx.beginPath();
      ctx.arc(px, py, 16, 0, Math.PI * 2);
      ctx.fill();
      player._damageFlash -= 0.016;
    }

    // Attack arc flash
    if (player._attackFlash > 0) {
      ctx.strokeStyle = 'rgba(255,220,140,' + (player._attackFlash / 0.15) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px, py, player.attackRange, 0, player.fullCircle ? Math.PI * 2 : Math.PI * 1.5);
      ctx.stroke();
      player._attackFlash -= 0.016;
    }

    // Fiery eyes flash
    if (player._fieryFlash > 0) {
      ctx.fillStyle = 'rgba(255,140,40,' + (player._fieryFlash / 0.3 * 0.4) + ')';
      ctx.beginPath();
      var fa = getInputX() === 0 && getInputY() === 0 ? -Math.PI / 2 : Math.atan2(getInputY(), getInputX());
      ctx.moveTo(px, py);
      ctx.arc(px, py, player.attackRange * 2.5, fa - Math.PI / 3, fa + Math.PI / 3);
      ctx.fill();
      player._fieryFlash -= 0.016;
    }

    // Shockwave flash
    if (player._shockwaveFlash > 0) {
      var sr = (1 - player._shockwaveFlash / 0.5) * Math.max(W, H);
      ctx.strokeStyle = 'rgba(255,215,0,' + (player._shockwaveFlash / 0.5 * 0.8) + ')';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(px, py, sr, 0, Math.PI * 2);
      ctx.stroke();
      player._shockwaveFlash -= 0.016;
    }

    // Particles
    for (var pt = 0; pt < particles.length; pt++) {
      var pp = particles[pt];
      var alpha = pp.life / pp.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pp.color;
      ctx.beginPath();
      ctx.arc(pp.x, pp.y, pp.radius * alpha, 0, Math.PI * 2);
      ctx.fill();
    }

    // Damage numbers
    for (var dn = 0; dn < dmgNumbers.length; dn++) {
      var dnn = dmgNumbers[dn];
      var dAlpha = dnn.life / dnn.maxLife;
      ctx.globalAlpha = dAlpha;
      ctx.fillStyle = dnn.color;
      ctx.font = 'bold ' + (14 + (1 - dAlpha) * 6) + 'px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.fillText(dnn.value, dnn.x, dnn.y);
    }

    // Jump cooldown indicator
    var jumpReady = player.jumpCooldown <= 0;
    var jumpAlpha = jumpReady ? 0.8 : 0.4;
    var jx = W - 50, jy = H - 50;
    ctx.fillStyle = 'rgba(10,6,4,' + (jumpReady ? 0.6 : 0.3) + ')';
    ctx.beginPath();
    ctx.arc(jx, jy, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(184,160,110,' + jumpAlpha + ')';
    ctx.lineWidth = 2;
    if (jumpReady) {
      ctx.setLineDash([]);
      ctx.shadowColor = 'rgba(184,160,110,0.4)';
      ctx.shadowBlur = 8;
    }
    ctx.beginPath();
    ctx.arc(jx, jy, 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Cooldown fill
    if (!jumpReady) {
      var cdRatio = player.jumpCooldown / 0.6;
      ctx.fillStyle = 'rgba(184,160,110,0.3)';
      ctx.beginPath();
      ctx.moveTo(jx, jy);
      ctx.arc(jx, jy, 18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - cdRatio));
      ctx.closePath();
      ctx.fill();
    }

    // Jump icon
    ctx.fillStyle = 'rgba(184,160,110,' + jumpAlpha + ')';
    ctx.font = 'bold 14px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('跳', jx, jy);
    ctx.setLineDash([]);

    ctx.globalAlpha = 1;

    // Toast notification (upgrade / gyro indicator)
    if (toastMsg && toastTimer > 0) {
      var toastAlpha = Math.min(1, toastTimer / 0.5);
      ctx.globalAlpha = toastAlpha;
      ctx.fillStyle = '#1a1209';
      var tw = ctx.measureText(toastMsg).width + 40;
      ctx.fillRect(W / 2 - tw / 2, 52, tw, 32);
      ctx.strokeStyle = 'rgba(184,160,110,0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(W / 2 - tw / 2, 52, tw, 32);
      ctx.fillStyle = '#d4b878';
      ctx.font = '13px "Source Serif 4", serif';
      ctx.textAlign = 'center';
      ctx.fillText(toastMsg, W / 2, 73);
    }

    // Gyro indicator
    if (gyro.active && gyro.indicatorTimer > 0 && !(keys['a'] || keys['d'] || keys['w'] || keys['s'] || keys['arrowleft'] || keys['arrowright'] || keys['arrowup'] || keys['arrowdown'] || touchMove.active)) {
      ctx.globalAlpha = Math.min(1, gyro.indicatorTimer / 0.5);
      ctx.fillStyle = 'rgba(160,220,140,0.8)';
      ctx.font = '11px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.fillText('GYRO ON • TILT TO MOVE', W / 2, H - 80);
    }

    ctx.globalAlpha = 1;
  }

  /* ============================================================
     Game Loop
     ============================================================ */
  var lastTime = 0;
  function loop(timestamp) {
    var dt = lastTime ? (timestamp - lastTime) / 1000 : 0.016;
    lastTime = timestamp;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  /* ============================================================
     Init & Restart
     ============================================================ */
  function startGame() {
    initState();
    document.getElementById('death-overlay').classList.remove('active');
    document.getElementById('upgrade-overlay').classList.remove('active');
    document.getElementById('upgrade-icons').innerHTML = '';
    updateHUD();
    spawnWave(1);
    setPaused(false);
  }

  document.getElementById('btn-restart').addEventListener('click', startGame);

  // Start!
  startGame();
  requestAnimationFrame(loop);
})();
