/**
 * 龙宫探宝 — Dragon Palace Treasure
 * Underwater Depth Survival — Canvas Game Engine
 */

(function () {
  'use strict';
  document.body.classList.add('game-active');

  // Resume AudioContext on first user gesture (browser autoplay policy)
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
    window.addEventListener('deviceorientation', handleOrientation);
    window.addEventListener('deviceorientationabsolute', handleOrientation);

    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(function (state) {
          if (state === 'granted') {
            gyro.indicatorTimer = 3;
          }
        })
        .catch(function () {});
    }
  }

  function handleOrientation(e) {
    if (e.beta === null || e.gamma === null) return;

    if (!gyro.calibrated) {
      gyro.baseBeta = e.beta;
      gyro.baseGamma = e.gamma;
      gyro.calibrated = true;
      gyro.active = true;
      gyro.indicatorTimer = 2;
      return;
    }

    var rawDY = (e.beta - gyro.baseBeta);
    var rawDX = (e.gamma - gyro.baseGamma);

    var sens = 0.1;
    gyro.dy = Math.abs(rawDY) < 1.5 ? 0 : Math.max(-1, Math.min(1, rawDY * sens));
    gyro.dx = Math.abs(rawDX) < 1.5 ? 0 : Math.max(-1, Math.min(1, rawDX * sens));
  }

  document.addEventListener('click', function (e) {
    if (!e.target.closest('#mobile-joystick') && !e.target.closest('#death-overlay') && !e.target.closest('#btn-restart')) {
      if (gyro.active) { gyro.calibrated = false; gyro.indicatorTimer = 1.5; }
    }
  });

  startGyro();

  function getInputX() {
    var x = 0;
    if (keys['a'] || keys['arrowleft']) x -= 1;
    if (keys['d'] || keys['arrowright']) x += 1;
    if (touchMove.active) { x += touchMove.dx; }
    var hasOtherInput = keys['a'] || keys['d'] || keys['arrowleft'] || keys['arrowright'] || touchMove.active;
    if (gyro.active && !hasOtherInput) { x += gyro.dx; }
    return Math.max(-1, Math.min(1, x));
  }
  function getInputY() {
    var y = 0;
    if (keys['w'] || keys['arrowup']) y -= 1;
    if (keys['s'] || keys['arrowdown']) y += 1;
    if (touchMove.active) { y += touchMove.dy; }
    var hasOtherInput = keys['w'] || keys['s'] || keys['arrowup'] || keys['arrowdown'] || touchMove.active;
    if (gyro.active && !hasOtherInput) { y += gyro.dy; }
    return Math.max(-1, Math.min(1, y));
  }

  /* ============================================================
     Pause
     ============================================================ */
  var paused = false;
  function togglePause() { paused = !paused; }

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
  var player, enemies, treasures, particles, items, dmgNumbers, bubbles;
  var depth, gameTime, score, treasureCount, treasureGoal;
  var gameOver, deathData;
  var portalActive, portalX, portalY;
  var spawnTimer = 0;

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
      _descendFlash: 0,
      _slowed: false, _slowTimer: 0,
      skillTimers: {},
      _skillSpeedMult: 1,
      _skillDamageMult: 1,
      waterShieldHits: 0
    };
    enemies = [];
    treasures = [];
    particles = [];
    items = [];
    dmgNumbers = [];
    bubbles = [];
    depth = 1;
    gameTime = 0;
    score = 0;
    treasureCount = 0;
    treasureGoal = 10;
    gameOver = false;
    deathData = null;
    portalActive = false;
    portalX = 0; portalY = 0;
    spawnTimer = 0;
    initDepth(depth);
  }

  /* ============================================================
     Depth Layer Config
     ============================================================ */
  function getDepthConfig(d) {
    return {
      bgTop: ['#0a8', '#048', '#014', '#002', '#000'][Math.min(d - 1, 4)],
      bgBot: ['#048', '#012', '#001', '#000', '#000'][Math.min(d - 1, 4)],
      particleColor: ['#8f8', '#6cf', '#48f', '#c8f', '#f8f'][Math.min(d - 1, 4)],
      treasureGoal: 8 + d * 2,
      oxygenDrain: 2 + d * 1.5,
      enemyCap: 8 + d * 3,
      scoreMultiplier: 1 + (d - 1) * 0.5,
      spInterval: Math.max(0.4, 1.8 - d * 0.15)
    };
  }

  function initDepth(d) {
    var cfg = getDepthConfig(d);
    treasureGoal = cfg.treasureGoal;
    for (var i = 0; i < 12 + d * 2; i++) {
      spawnTreasure();
    }
    var enemyCount = 3 + d * 2;
    for (var j = 0; j < enemyCount; j++) {
      spawnRandomEnemy();
    }
    for (var k = 0; k < 3; k++) {
      spawnBubble();
    }
  }

  /* ============================================================
     Spawning Functions
     ============================================================ */
  function spawnTreasure() {
    var types = getTreasureTypesForDepth(depth);
    var t = types[randInt(0, types.length - 1)];
    treasures.push({
      x: rand(60, W - 60), y: rand(60, H - 60),
      value: t.value,
      radius: t.radius,
      color: t.color,
      name: t.name,
      life: 25, maxLife: 25,
      bobPhase: rand(0, Math.PI * 2)
    });
  }

  var TREASURE_TYPES = {
    pearl:       { value: 10,  radius: 5,  color: '#f0f0e0', name: 'Pearl' },
    silver:      { value: 25,  radius: 6,  color: '#c0c0d0', name: 'Silver' },
    gold:        { value: 50,  radius: 7,  color: '#ffd700', name: 'Gold' },
    dragonPearl: { value: 100, radius: 9,  color: '#40e0ff', name: 'Dragon Pearl' },
    legendary:   { value: 250, radius: 11, color: '#ff40ff', name: 'Legendary Pearl' }
  };

  function getTreasureTypesForDepth(d) {
    if (d >= 5) return [TREASURE_TYPES.gold, TREASURE_TYPES.dragonPearl, TREASURE_TYPES.legendary];
    if (d >= 4) return [TREASURE_TYPES.silver, TREASURE_TYPES.gold, TREASURE_TYPES.dragonPearl];
    if (d >= 3) return [TREASURE_TYPES.silver, TREASURE_TYPES.gold];
    if (d >= 2) return [TREASURE_TYPES.pearl, TREASURE_TYPES.silver];
    return [TREASURE_TYPES.pearl];
  }

  function spawnBubble() {
    bubbles.push({
      x: rand(60, W - 60), y: rand(60, H - 60),
      radius: 8,
      life: 20, maxLife: 20,
      wobble: rand(0, Math.PI * 2)
    });
  }

  function spawnRandomEnemy() {
    var types = [];
    types.push(ENEMY_TYPES.fish);
    if (depth >= 2) { types.push(ENEMY_TYPES.jellyfish); types.push(ENEMY_TYPES.yecha); }
    if (depth >= 3) { types.push(ENEMY_TYPES.seaSnake); types.push(ENEMY_TYPES.eel); }
    if (depth >= 4) { types.push(ENEMY_TYPES.shark); }
    var t = types[randInt(0, types.length - 1)];
    spawnEnemy(t);
  }

  function spawnEnemy(type) {
    var side = randInt(0, 3);
    var margin = 40;
    var x, y;
    if (side === 0) { x = rand(margin, W - margin); y = -margin; }
    else if (side === 1) { x = W + margin; y = rand(margin, H - margin); }
    else if (side === 2) { x = rand(margin, W - margin); y = H + margin; }
    else { x = -margin; y = rand(margin, H - margin); }

    enemies.push({
      x: x, y: y,
      hp: type.hp, maxHp: type.hp,
      speed: rand(type.speed * 0.8, type.speed * 1.2),
      damage: type.damage,
      radius: type.radius,
      color: type.color,
      name: type.name,
      isBoss: type.isBoss || false,
      isRanged: type.isRanged || false,
      shootTimer: type.shootCooldown ? rand(0, type.shootCooldown) : 0,
      shootCooldown: type.shootCooldown || 2,
      spawnTimer: type.spawnTimer || 0,
      stunned: 0,
      dropsBubble: type.dropsBubble !== false,
      _origSpeed: undefined
    });
  }

  var ENEMY_TYPES = {
    fish:       { hp: 10,  speed: 60,  damage: 0,   radius: 8,  color: '#80e0c0', name: 'Fish', isRanged: false, dropsBubble: false },
    jellyfish:  { hp: 20,  speed: 40,  damage: 8,   radius: 12, color: '#e080e0', name: 'Jellyfish', isRanged: false },
    yecha:      { hp: 45,  speed: 80,  damage: 12,  radius: 14, color: '#4080c0', name: 'Yecha Guard', isRanged: false },
    seaSnake:   { hp: 55,  speed: 140, damage: 15,  radius: 12, color: '#40c060', name: 'Sea Snake', isRanged: false },
    eel:        { hp: 35,  speed: 60,  damage: 18,  radius: 11, color: '#e0e040', name: 'Eel', isRanged: true, shootCooldown: 2.5 },
    shark:      { hp: 85,  speed: 160, damage: 22,  radius: 20, color: '#8080a0', name: 'Shark', isRanged: false },
    dragonGen:  { hp: 350, speed: 70,  damage: 25,  radius: 30, color: '#40c0e0', name: 'Dragon General', isBoss: true, spawnTimer: 5 },
    turtleMin:  { hp: 550, speed: 40,  damage: 30,  radius: 35, color: '#608040', name: 'Turtle Minister', isBoss: true }
  };

  /* ============================================================
     Update Loop
     ============================================================ */
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
    updateBubbles(dtC);
    checkPortal();
    spawnTick(dtC);
    updateHUD();
  }

  function updatePlayer(dt) {
    var ix = getInputX();
    var iy = getInputY();
    var mag = Math.sqrt(ix * ix + iy * iy);
    if (mag > 1) { ix /= mag; iy /= mag; }

    var effSpeed = player.speed * (player._skillSpeedMult || 1);
    player.x += ix * effSpeed * dt;
    player.y += iy * effSpeed * dt;

    // Bounds
    player.x = Math.max(20, Math.min(W - 20, player.x));
    player.y = Math.max(20, Math.min(H - 20, player.y));

    // Oxygen drain
    var cfg = getDepthConfig(depth);
    player.oxygen -= cfg.oxygenDrain * dt;
    if (player.oxygen <= 0) {
      player.oxygen = 0;
      player.hp -= 10 * dt;
      if (player.hp <= 0) playerDied();
    }

    // Auto-attack
    player.attackTimer -= dt;
    if (player.attackTimer <= 0) {
      player.attackTimer = player.attackSpeed;
      performAttack();
    }

    // Damage flash tick
    if (player._damageFlash > 0) player._damageFlash -= dt;

    // Skill timers
    var expired = [];
    for (var sk in player.skillTimers) {
      if (!player.skillTimers.hasOwnProperty(sk)) continue;
      player.skillTimers[sk] -= dt;
      if (player.skillTimers[sk] <= 0) {
        expired.push(sk);
      }
    }
    for (var e = 0; e < expired.length; e++) {
      expireSkill(expired[e]);
    }
  }

  function expireSkill(skillId) {
    switch (skillId) {
      case 'speedSwim': player._skillSpeedMult = 1; break;
      case 'waterShield': player.waterShieldHits = 0; break;
      case 'seaPearl': break;
      case 'invincible': break;
    }
    delete player.skillTimers[skillId];
  }

  function performAttack() {
    var target = null;
    var minDist = player.attackRange;
    for (var i = 0; i < enemies.length; i++) {
      var d = dist(player, enemies[i]);
      if (d < minDist) { minDist = d; target = enemies[i]; }
    }
    if (target) {
      var dmg = Math.floor(player.attackDamage * (player._skillDamageMult || 1));
      target.hp -= dmg;
      spawnDmgNumber(target.x, target.y, dmg, '#40e0ff');
      spawnParticles(target.x, target.y, 4, '#80e0ff', 0.3);
      AudioEngine.playSfx('attack');
      if (target.hp <= 0) killEnemy(target);
    }
  }

  function killEnemy(enemy) {
    var idx = enemies.indexOf(enemy);
    if (idx === -1) return;
    spawnParticles(enemy.x, enemy.y, enemy.isBoss ? 25 : 6, enemy.color, 0.6);
    var dropChance = enemy.isBoss ? 1.0 : 0.15;
    if (Math.random() < dropChance) spawnItem(enemy.x, enemy.y);
    if (enemy.isBoss) {
      for (var i = 0; i < 3; i++) spawnItem(enemy.x + rand(-25, 25), enemy.y + rand(-25, 25));
    }
    if (enemy.dropsBubble && Math.random() < 0.12) spawnBubbleAt(enemy.x, enemy.y);
    AudioEngine.playSfx('kill_water');
    enemies.splice(idx, 1);
  }

  function damagePlayer(dmg) {
    // Invincibility check
    if (player.skillTimers.invincible > 0) {
      spawnParticles(player.x, player.y, 4, '#ffd700', 0.2);
      return;
    }
    // Water shield check
    if (player.waterShieldHits > 0) {
      player.waterShieldHits--;
      spawnParticles(player.x, player.y, 8, '#4080ff', 0.3);
      return;
    }
    player.hp -= dmg;
    player._damageFlash = 0.2;
    spawnParticles(player.x, player.y, 3, '#ff4040', 0.3);
    AudioEngine.playSfx('hurt');
    if (player.hp <= 0) playerDied();
  }

  function checkPortal() {
    if (!portalActive && treasureCount >= treasureGoal) {
      portalActive = true;
      portalX = rand(80, W - 80);
      portalY = rand(80, H - 80);
      AudioEngine.playSfx('descend');
    }
    if (portalActive && dist(player, {x: portalX, y: portalY}) < 30) {
      depth++;
      AudioEngine.playSfx('bubble');
      portalActive = false;
      treasureCount = 0;
      enemies = [];
      treasures = [];
      items = [];
      bubbles = [];
      initDepth(depth);
      player._descendFlash = 0.5;
    }
  }

  function spawnTick(dt) {
    var cfg = getDepthConfig(depth);
    spawnTimer -= dt;
    if (spawnTimer <= 0 && enemies.length < cfg.enemyCap) {
      spawnTimer = cfg.spInterval;
      spawnRandomEnemy();
    }
    if (bubbles.length < 5 && Math.random() < 0.01) {
      spawnBubble();
    }
  }

  function playerDied() {
    gameOver = true;
    AudioEngine.playSfx('death');
    deathData = { depth: depth, score: score, treasures: treasureCount, time: gameTime };
    var overlay = document.getElementById('death-overlay');
    document.getElementById('death-depth').textContent = depth;
    document.getElementById('death-score').textContent = score;
    document.getElementById('death-treasures').textContent = treasureCount;
    document.getElementById('death-time').textContent = formatTime(gameTime);
    overlay.classList.add('active');
  }

  function formatTime(t) {
    var m = Math.floor(t / 60);
    var s = Math.floor(t % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function updateHUD() {
    document.getElementById('hp-inner').style.width = Math.max(0, player.hp / player.maxHp * 100) + '%';
    document.getElementById('hp-num').textContent = Math.max(0, Math.floor(player.hp)) + '/' + player.maxHp;
    document.getElementById('o2-inner').style.width = Math.max(0, player.oxygen / player.maxOxygen * 100) + '%';
    document.getElementById('hud-depth').textContent = depth;
    document.getElementById('hud-treasure').textContent = treasureCount;
    document.getElementById('hud-goal').textContent = treasureGoal;
    document.getElementById('hud-score').textContent = score;
    document.getElementById('hud-time').textContent = formatTime(gameTime);
  }

  /* ============================================================
     Update Helpers
     ============================================================ */
  function updateEnemies(dt) {
    for (var i = enemies.length - 1; i >= 0; i--) {
      var e = enemies[i];
      if (e.stunned > 0) { e.stunned -= dt; continue; }
      var a = angle(e, player);
      e.x += Math.cos(a) * e.speed * dt;
      e.y += Math.sin(a) * e.speed * dt;
      if (dist(e, player) < (e.radius + 14) && e.damage > 0) {
        damagePlayer(e.damage);
        var pa = angle(player, e);
        e.x += Math.cos(pa) * 30;
        e.y += Math.sin(pa) * 30;
      }
      if (e.isRanged) {
        e.shootTimer -= dt;
        if (e.shootTimer <= 0) {
          e.shootTimer = e.shootCooldown;
          var pa2 = angle(e, player);
          particles.push({
            x: e.x, y: e.y,
            vx: Math.cos(pa2) * 200, vy: Math.sin(pa2) * 200,
            life: 2, maxLife: 2,
            color: '#e0e040', radius: 4,
            isProjectile: true, damage: e.damage
          });
        }
      }
      if (e.isBoss && e.spawnTimer !== undefined) {
        e.spawnTimer -= dt;
        if (e.spawnTimer <= 0) {
          e.spawnTimer = 5;
          spawnEnemy(ENEMY_TYPES.yecha);
        }
      }
    }

    // Process projectiles (particles with isProjectile flag)
    for (var pi = particles.length - 1; pi >= 0; pi--) {
      var pp = particles[pi];
      if (!pp.isProjectile) continue;
      pp.x += (pp.vx || 0) * dt;
      pp.y += (pp.vy || 0) * dt;
      pp.life -= dt;
      if (pp.life <= 0) { particles.splice(pi, 1); continue; }
      if (dist(pp, player) < 16) {
        damagePlayer(pp.damage);
        particles.splice(pi, 1);
      }
    }
  }

  function updateParticles(dt) {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      if (p.isProjectile) continue;
      p.x += (p.vx || 0) * dt;
      p.y += (p.vy || 0) * dt;
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

  function updateItems(dt) {
    for (var i = items.length - 1; i >= 0; i--) {
      var it = items[i];
      it.life -= dt;
      if (it.life <= 0) { items.splice(i, 1); continue; }
      var d = dist(player, it);
      if (d < 80) {
        var a2 = angle(it, player);
        it.x += Math.cos(a2) * 280 * dt;
        it.y += Math.sin(a2) * 280 * dt;
      }
      if (d < 22) {
        applyItem(it);
        items.splice(i, 1);
      }
    }
  }

  function updateTreasures(dt) {
    for (var i = treasures.length - 1; i >= 0; i--) {
      var tr = treasures[i];
      tr.life -= dt;
      if (tr.life <= 0) { treasures.splice(i, 1); continue; }
      if (player.skillTimers.seaPearl > 0) {
        var d2 = dist(player, tr);
        if (d2 < 150) {
          var a3 = angle(tr, player);
          tr.x += Math.cos(a3) * 250 * dt;
          tr.y += Math.sin(a3) * 250 * dt;
        }
      }
      if (dist(player, tr) < 20) {
        score += Math.floor(tr.value * getDepthConfig(depth).scoreMultiplier);
        treasureCount++;
        spawnParticles(tr.x, tr.y, 6, tr.color, 0.4);
        AudioEngine.playSfx('collect');
        treasures.splice(i, 1);
      }
    }
  }

  function updateBubbles(dt) {
    for (var i = bubbles.length - 1; i >= 0; i--) {
      var b = bubbles[i];
      b.y -= 15 * dt;
      b.life -= dt;
      if (b.life <= 0) { bubbles.splice(i, 1); continue; }
      if (dist(player, b) < 24) {
        player.oxygen = Math.min(player.maxOxygen, player.oxygen + 30);
        spawnParticles(player.x, player.y, 8, '#80e0ff', 0.4);
        AudioEngine.playSfx('bubble');
        bubbles.splice(i, 1);
      }
    }
  }

  var ITEM_TYPES = {
    bubbleItem: { color: '#80e0ff', radius: 6, name: 'Bubble' },
    dragonBreath: { color: '#ff6040', radius: 7, name: 'Dragon Breath' },
    waterShield: { color: '#4080ff', radius: 7, name: 'Water Shield' },
    speedSwim: { color: '#40ff80', radius: 7, name: 'Speed Swim' },
    dragonMight: { color: '#ffd040', radius: 8, name: 'Dragon Might' },
    seaPearl: { color: '#ff80ff', radius: 8, name: 'Sea Spirit Pearl' },
    dragonOrb: { color: '#ffd700', radius: 10, name: 'Dragon Orb' }
  };

  function spawnItem(x, y) {
    var pool = [ITEM_TYPES.bubbleItem, ITEM_TYPES.dragonBreath, ITEM_TYPES.waterShield, ITEM_TYPES.speedSwim];
    if (depth >= 3) pool.push(ITEM_TYPES.dragonMight, ITEM_TYPES.seaPearl);
    if (depth >= 5 && Math.random() < 0.1) pool.push(ITEM_TYPES.dragonOrb);
    var picked = pool[randInt(0, pool.length - 1)];
    items.push({
      x: x, y: y,
      radius: picked.radius,
      color: picked.color,
      name: picked.name,
      life: 12, maxLife: 12
    });
  }

  function spawnBubbleAt(x, y) {
    bubbles.push({
      x: x, y: y,
      radius: 7,
      life: 15, maxLife: 15,
      wobble: rand(0, Math.PI * 2)
    });
  }

  function applyItem(it) {
    if (it.name === 'Bubble') {
      player.oxygen = Math.min(player.maxOxygen, player.oxygen + 30);
    } else if (it.name === 'Dragon Breath') {
      for (var i = enemies.length - 1; i >= 0; i--) {
        var a = angle(player, enemies[i]);
        var diff = a - Math.atan2(getInputY(), getInputX());
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        if (Math.abs(diff) < Math.PI / 3 && dist(player, enemies[i]) < 120) {
          var dmg = Math.floor(player.attackDamage * 2);
          enemies[i].hp -= dmg;
          spawnDmgNumber(enemies[i].x, enemies[i].y, dmg, '#ff6040');
          if (enemies[i].hp <= 0) killEnemy(enemies[i]);
        }
      }
    } else if (it.name === 'Water Shield') {
      player.waterShieldHits = 3;
      player.skillTimers.waterShield = 10;
    } else if (it.name === 'Speed Swim') {
      player._skillSpeedMult = 2;
      player.skillTimers.speedSwim = 5;
    } else if (it.name === 'Dragon Might') {
      for (var i = 0; i < enemies.length; i++) enemies[i].stunned = 3;
    } else if (it.name === 'Sea Spirit Pearl') {
      player.skillTimers.seaPearl = 5;
    } else if (it.name === 'Dragon Orb') {
      player.hp = player.maxHp;
      player.oxygen = player.maxOxygen;
      player.skillTimers.invincible = 10;
    }
    spawnParticles(player.x, player.y, 10, it.color, 0.4);
    AudioEngine.playSfx('collect');
  }

  function spawnParticles(x, y, count, color, life) {
    for (var i = 0; i < count; i++) {
      var a = rand(0, Math.PI * 2);
      var spd = rand(40, 160);
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        life: life,
        maxLife: life,
        color: color,
        radius: rand(1.5, 3.5)
      });
    }
  }

  function spawnDmgNumber(x, y, val, clr) {
    dmgNumbers.push({
      x: x + rand(-12, 12), y: y,
      value: Math.floor(val),
      life: 0.8, maxLife: 0.8,
      color: clr || '#40e0ff'
    });
  }

  /* ============================================================
     Rendering
     ============================================================ */
  function render() {
    ctx.clearRect(0, 0, W, H);

    // Background gradient
    var cfg = getDepthConfig(depth);
    var bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, cfg.bgTop);
    bgGrad.addColorStop(1, cfg.bgBot);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Bubble particles (ambient)
    for (var bi = 0; bi < bubbles.length; bi++) {
      var b = bubbles[bi];
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(b.x + Math.sin(gameTime * 2 + b.wobble) * 3, b.y, b.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Treasures
    for (var ti = 0; ti < treasures.length; ti++) {
      var tr = treasures[ti];
      var bob = Math.sin(gameTime * 1.5 + tr.bobPhase) * 3;
      var alpha = Math.min(1, tr.life / 5);
      ctx.fillStyle = tr.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(tr.x, tr.y + bob, tr.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,' + (0.3 * alpha) + ')';
      ctx.beginPath();
      ctx.arc(tr.x, tr.y + bob, tr.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Enemies (simple circles for now)
    for (var ei = 0; ei < enemies.length; ei++) {
      var en = enemies[ei];
      ctx.fillStyle = en.stunned > 0 ? '#ffffff' : en.color;
      ctx.beginPath();
      ctx.arc(en.x, en.y, en.radius, 0, Math.PI * 2);
      ctx.fill();
      if (en.isBoss) {
        var barW = en.radius * 2;
        var barH = 5;
        var barY = en.y - en.radius - 10;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(en.x - barW / 2, barY, barW, barH);
        ctx.fillStyle = '#c44d34';
        ctx.fillRect(en.x - barW / 2, barY, barW * (en.hp / en.maxHp), barH);
        ctx.fillStyle = '#e8dcc8';
        ctx.font = '10px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.fillText(en.name, en.x, barY - 4);
      }
    }

    // Items
    for (var ii = 0; ii < items.length; ii++) {
      var it = items[ii];
      var pulse = 1 + 0.2 * Math.sin(gameTime * 3 + ii);
      ctx.fillStyle = it.color;
      ctx.beginPath();
      ctx.arc(it.x, it.y, it.radius * pulse, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player
    var px = player.x, py = player.y;
    // Glow
    var glowGrad = ctx.createRadialGradient(px, py, 6, px, py, 30);
    glowGrad.addColorStop(0, 'rgba(64,192,192,0.5)');
    glowGrad.addColorStop(1, 'rgba(64,192,192,0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(px, py, 30, 0, Math.PI * 2);
    ctx.fill();
    // Body
    ctx.fillStyle = '#40c0c0';
    ctx.beginPath();
    ctx.arc(px, py, 14, 0, Math.PI * 2);
    ctx.fill();
    // Inner
    ctx.fillStyle = '#80e8e8';
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fill();

    // Portal
    if (portalActive) {
      var pPulse = 1 + 0.3 * Math.sin(gameTime * 3);
      ctx.strokeStyle = 'rgba(64,224,255,' + (0.5 + 0.3 * Math.sin(gameTime * 4)) + ')';
      ctx.lineWidth = 3;
      for (var pa = 0; pa < 3; pa++) {
        ctx.beginPath();
        ctx.arc(portalX, portalY, 20 * pPulse + pa * 8, pa * Math.PI / 3 + gameTime * 2, pa * Math.PI / 3 + gameTime * 2 + Math.PI * 1.3);
        ctx.stroke();
      }
    }

    // Descend flash
    if (player._descendFlash > 0) {
      ctx.fillStyle = 'rgba(255,255,255,' + (player._descendFlash / 0.5 * 0.7) + ')';
      ctx.fillRect(0, 0, W, H);
      player._descendFlash -= 0.016;
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
      ctx.font = 'bold ' + (13 + (1 - dAlpha) * 6) + 'px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.fillText(dnn.value, dnn.x, dnn.y);
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
    AudioEngine.update(dt);
    render();
    requestAnimationFrame(loop);
  }

  /* ============================================================
     Init & Restart
     ============================================================ */
  function startGame() {
    AudioEngine.init();
    AudioEngine.start();
    AudioEngine.setIntensity('calm');
    initState();
    spawnTimer = 0;
    document.getElementById('death-overlay').classList.remove('active');
    updateHUD();
  }

  document.getElementById('btn-restart').addEventListener('click', startGame);
  startGame();
  requestAnimationFrame(loop);
})();
