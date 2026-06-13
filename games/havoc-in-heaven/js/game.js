/**
 * 大闹天宫 — Havoc in Heaven
 * Top-Down Survival Roguelike — Canvas Game Engine
 */

(function () {
  'use strict';
  document.body.classList.add('game-active');

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
  var touchSkill = false;
  var joystickEl = document.getElementById('mobile-joystick');
  var knobEl = document.getElementById('mobile-joystick-knob');
  var skillBtn = document.getElementById('mobile-skill-btn');

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
  if (skillBtn) {
    skillBtn.addEventListener('touchstart', function (e) { e.preventDefault(); touchSkill = true; });
    skillBtn.addEventListener('touchend', function (e) { e.preventDefault(); touchSkill = false; });
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

  function getInputX() {
    var x = 0;
    if (keys['a'] || keys['arrowleft']) x -= 1;
    if (keys['d'] || keys['arrowright']) x += 1;
    if (touchMove.active) x = touchMove.dx;
    return x;
  }
  function getInputY() {
    var y = 0;
    if (keys['w'] || keys['arrowup']) y -= 1;
    if (keys['s'] || keys['arrowdown']) y += 1;
    if (touchMove.active) y = touchMove.dy;
    return y;
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
  var player, enemies, particles, xpOrbs, projectiles;
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
      clones: [] // 分身术
    };
    enemies = [];
    particles = [];
    xpOrbs = [];
    projectiles = [];
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
      { id: 'range', nameZh: '金箍棒加长', nameEn: 'Extended Staff', desc: 'Attack range +25%', rarity: 'common', apply: function () { player.attackRange *= 1.25; } },
      { id: 'speed', nameZh: '筋斗云', nameEn: 'Somersault Cloud', desc: 'Move speed +20%', rarity: 'common', apply: function () { player.speed *= 1.2; } },
      { id: 'maxhp', nameZh: '仙桃续命', nameEn: 'Peach of Immortality', desc: 'Max HP +20, fully heal', rarity: 'common', apply: function () { player.maxHp += 20; player.hp = player.maxHp; } },
      { id: 'armor', nameZh: '金刚不坏', nameEn: 'Diamond Body', desc: 'Damage taken -15%', rarity: 'common', apply: function () { player.damageReduction += 0.15; } },
      { id: 'xpboost', nameZh: '蟠桃盛宴', nameEn: 'Peach Feast', desc: 'XP orb value +50%', rarity: 'common', apply: function () { } },
      { id: 'dmgup', nameZh: '八卦炉淬炼', nameEn: 'Furnace Tempered', desc: 'All damage +30%', rarity: 'uncommon', apply: function () { player.attackDamage = Math.floor(player.attackDamage * 1.3); } },
      { id: 'clone', nameZh: '分身术', nameEn: 'Clone Jutsu', desc: 'Summon a decoy clone', rarity: 'uncommon', apply: function () { player.clones.push({ x: player.x + rand(-60, 60), y: player.y + rand(-60, 60), hp: 40 }); } },
      { id: 'fiery', nameZh: '火眼金睛', nameEn: 'Fiery Golden Eyes', desc: 'Every 8s: flame cone forward', rarity: 'uncommon', apply: function () { player.fieryEyesTimer = 4; } },
      { id: 'stun', nameZh: '定身术', nameEn: 'Paralysis Spell', desc: 'Every 10s: freeze all enemies 1.5s', rarity: 'uncommon', apply: function () { player.stunTimer = 5; } },
      { id: 'dodge', nameZh: '七十二变', nameEn: '72 Transformations', desc: '20% chance to dodge any hit', rarity: 'uncommon', apply: function () { player.dodgeChance = Math.min(0.6, player.dodgeChance + 0.2); } },
      { id: 'firetrail', nameZh: '筋斗云进阶', nameEn: 'Cloud Trail', desc: 'Leave a flame trail when moving', rarity: 'rare', apply: function () { player.fireTrail = true; } },
      { id: 'triple', nameZh: '三头六臂', nameEn: 'Three Heads Six Arms', desc: 'Attack speed doubled', rarity: 'rare', apply: function () { player.tripleHead = true; } },
      { id: 'fullcircle', nameZh: '如意金箍棒', nameEn: 'Ruyi Jingu Bang', desc: 'Attack becomes 360° full circle', rarity: 'rare', apply: function () { player.fullCircle = true; } },
      { id: 'revive', nameZh: '不死之身', nameEn: 'Undying Body', desc: 'Revive once at 50% HP on death', rarity: 'rare', apply: function () { player.revive = true; } },
      { id: 'shockwave', nameZh: '大圣归来', nameEn: 'Great Sage Returns', desc: 'Every 20s: screen-clearing shockwave', rarity: 'legendary', apply: function () { player.shockwaveTimer = 10; } }
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
      name: type.name,
      isBoss: type.isBoss || false,
      isRanged: type.isRanged || false,
      shootTimer: type.shootTimer || 0,
      shootCooldown: type.shootCooldown || 2,
      spawnTimer: type.spawnTimer || 0
    };
    enemies.push(e);
  }

  function getWaveConfig(w) {
    var configs = {
      // Wave 1-4
      soldier: { hp: 20, speed: 80, damage: 10, radius: 10, color: '#d4b878', name: '天兵', isRanged: false },
      general: { hp: 50, speed: 100, damage: 15, radius: 14, color: '#e07050', name: '天将', isRanged: false },
      cavalry: { hp: 30, speed: 160, damage: 12, radius: 11, color: '#e8dcc8', name: '天马骑兵', isRanged: false },
      archer: { hp: 25, speed: 60, damage: 20, radius: 11, color: '#5a9ac4', name: '神射手', isRanged: true, shootCooldown: 2.5 },
      king: { hp: 200, speed: 60, damage: 25, radius: 28, color: '#c44d34', name: '四大天王', isBoss: true, spawnTimer: 4 },
      giant: { hp: 150, speed: 90, damage: 30, radius: 24, color: '#8a4aaa', name: '巨灵神', isBoss: false },
      hound: { hp: 60, speed: 200, damage: 18, radius: 12, color: '#a0a0a0', name: '哮天犬', isBoss: false },
      nezha: { hp: 300, speed: 110, damage: 30, radius: 30, color: '#ff4040', name: '哪吒', isBoss: true, isRanged: true, shootCooldown: 1.8 },
      erlang: { hp: 500, speed: 100, damage: 35, radius: 34, color: '#ffd700', name: '二郎神', isBoss: true, isRanged: true, shootCooldown: 1.2 }
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
    if (gameOver || paused || document.getElementById('upgrade-overlay').classList.contains('active')) return;

    // Clamp dt to avoid huge jumps
    var dtClamped = Math.min(dt, 0.1);
    gameTime += dtClamped;
    waveTimer += dtClamped;

    updatePlayer(dtClamped);
    updateEnemies(dtClamped);
    updateProjectiles(dtClamped);
    updateParticles(dtClamped);
    updateXpOrbs(dtClamped);
    checkWave();
    updateHUD();
  }

  /* ---- Player ---- */
  function updatePlayer(dt) {
    var ix = getInputX();
    var iy = getInputY();
    var mag = Math.sqrt(ix * ix + iy * iy);
    if (mag > 1) { ix /= mag; iy /= mag; }

    player.x += ix * player.speed * dt;
    player.y += iy * player.speed * dt;

    // Bounds
    player.x = Math.max(20, Math.min(W - 20, player.x));
    player.y = Math.max(20, Math.min(H - 20, player.y));

    // Fire trail
    if (player.fireTrail && mag > 0.1) {
      if (!player._trailTimer || player._trailTimer <= 0) {
        player._trailTimer = 0.08;
        particles.push({
          x: player.x + rand(-8, 8), y: player.y + rand(-8, 8),
          vx: rand(-30, 30), vy: rand(-30, 30),
          life: 0.5, maxLife: 0.5,
          color: '#ff8c42', radius: rand(3, 6)
        });
      }
      player._trailTimer -= dt;
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
        enemies[i].hp -= player.attackDamage * 2;
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
      enemies[i].hp -= player.attackDamage * 4;
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

  function damagePlayer(dmg) {
    if (player.dodgeChance > 0 && Math.random() < player.dodgeChance) {
      spawnParticles(player.x, player.y, 5, '#a0d8ff', 0.4);
      return; // Dodged
    }
    var actualDmg = Math.max(1, Math.floor(dmg * (1 - player.damageReduction)));
    player.hp -= actualDmg;
    spawnParticles(player.x, player.y, 4, '#ff4040', 0.3);
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
        damagePlayer(e.damage);
        // Push enemy away slightly
        var pushAngle = angle(player, e);
        e.x += Math.cos(pushAngle) * 30;
        e.y += Math.sin(pushAngle) * 30;
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
        damagePlayer(p.damage);
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
        radius: t.radius, color: t.color, name: t.name,
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
      showUpgradeSelection();
    }
  }

  /* ============================================================
     Upgrade Selection UI
     ============================================================ */
  function showUpgradeSelection() {
    setPaused(true);
    var overlay = document.getElementById('upgrade-overlay');
    var cardsEl = document.getElementById('upgrade-cards');
    overlay.classList.add('active');
    var picks = pickUpgrades(3);
    cardsEl.innerHTML = '';
    for (var i = 0; i < picks.length; i++) {
      (function (upgrade) {
        var card = document.createElement('div');
        card.className = 'upgrade-card';
        card.innerHTML = '<div class="uc-rarity ' + upgrade.rarity + '">' + upgrade.rarity.toUpperCase() + '</div>'
          + '<div class="uc-name">' + upgrade.nameZh + '</div>'
          + '<div class="uc-en">' + upgrade.nameEn + '</div>'
          + '<div class="uc-desc">' + upgrade.desc + '</div>';
        card.addEventListener('click', function () {
          upgrade.apply();
          activeUpgrades.push(upgrade.id);
          overlay.classList.remove('active');
          setPaused(false);
          updateUpgradeIcons();
        });
        cardsEl.appendChild(card);
      })(picks[i]);
    }
  }

  function updateUpgradeIcons() {
    var iconsEl = document.getElementById('upgrade-icons');
    iconsEl.innerHTML = '';
    for (var i = 0; i < activeUpgrades.length; i++) {
      var up = null;
      for (var j = 0; j < upgradePool.length; j++) {
        if (upgradePool[j].id === activeUpgrades[i]) { up = upgradePool[j]; break; }
      }
      if (up) {
        var icon = document.createElement('span');
        icon.className = 'upgrade-icon';
        icon.title = up.nameZh + ' / ' + up.nameEn;
        icon.textContent = up.nameZh.charAt(0);
        iconsEl.appendChild(icon);
      }
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
      ctx.fillStyle = e.stunned > 0 ? '#ffffff' : e.color;
      ctx.globalAlpha = e.stunned > 0 ? 0.5 + 0.5 * Math.sin(gameTime * 20) : 1;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();

      // HP bar for bosses
      if (e.isBoss) {
        var barW = e.radius * 2;
        var barH = 5;
        var barY = e.y - e.radius - 10;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(e.x - barW / 2, barY, barW, barH);
        ctx.fillStyle = '#c44d34';
        ctx.fillRect(e.x - barW / 2, barY, barW * (e.hp / e.maxHp), barH);
        // Name
        ctx.fillStyle = '#e8dcc8';
        ctx.font = '10px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.fillText(e.name, e.x, barY - 4);
      }
      ctx.globalAlpha = 1;
    }

    // Player
    var px = player.x, py = player.y;
    // Glow
    var glowGrad = ctx.createRadialGradient(px, py, 8, px, py, 30);
    glowGrad.addColorStop(0, 'rgba(184,160,110,0.5)');
    glowGrad.addColorStop(1, 'rgba(184,160,110,0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(px, py, 30, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = '#d4b878';
    ctx.beginPath();
    ctx.arc(px, py, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8d5b0';
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();

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
