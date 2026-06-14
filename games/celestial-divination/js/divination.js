/**
 * Celestial Divination — 天庭求签 Core Logic
 * Handles shake detection, 筊杯 confirmation, fortune reveal,
 * localStorage history, share card generation, and daily limit.
 *
 * Usage:
 *   <script src="../../js/deities.js"></script>
 *   <script src="../../js/main.js"></script>
 *   <script src="js/divination-data.js"></script>
 *   <script src="js/divination.js"></script>
 *   <script>initDivination();</script>
 */
(function () {
  'use strict';
  document.body.classList.add('game-active');

  window.initDivination = function () {
    /* ================================================================
       DOM refs
       ================================================================ */
    var phaseCylinder = document.getElementById('phase-cylinder');
    var phaseJiaobei = document.getElementById('phase-jiaobei');
    var phaseDeity = document.getElementById('phase-deity');
    var phaseFortune = document.getElementById('phase-fortune');
    var phaseLocked = document.getElementById('phase-locked');
    var cylinder = document.getElementById('cylinder');
    var cylinderSticks = document.getElementById('cylinder-sticks');
    var fortuneContainer = document.getElementById('fortune-container');
    var fortuneActions = document.getElementById('fortune-actions');
    var jiaobeiContainer = document.getElementById('jiaobei-blocks');
    var jiaobeiResult = document.getElementById('jiaobei-result');
    var deityReveal = document.getElementById('deity-reveal');
    var countdownTimer = document.getElementById('countdown-timer');
    var historyDrawer = document.getElementById('history-drawer');
    var historyList = document.getElementById('history-list');
    var btnShare = document.getElementById('btn-share');
    var btnHistory = document.getElementById('btn-history');
    var btnReturn = document.getElementById('btn-return');
    var btnViewLast = document.getElementById('btn-view-last');
    var btnHistoryClose = document.getElementById('btn-history-close');
    var overlay = document.getElementById('divination-overlay');

    if (!phaseCylinder || !cylinder) return;

    /* ================================================================
       localStorage keys
       ================================================================ */
    var STORAGE_DATE = 'celestial-divination-last-date';
    var STORAGE_LAST = 'celestial-divination-last-fortune';
    var STORAGE_HISTORY = 'celestial-divination-history';

    /* ================================================================
       State
       ================================================================ */
    var currentLot = null;
    var currentDeity = null;
    var jiaobeiRetries = 0;
    var MAX_JIAOBEI_RETRIES = 3;

    /* ================================================================
       Helper: show a phase, hide others
       ================================================================ */
    function showPhase(phase) {
      var phases = [phaseCylinder, phaseJiaobei, phaseDeity, phaseFortune, phaseLocked];
      phases.forEach(function (p) {
        if (p) p.classList.remove('active');
      });
      if (phase) phase.classList.add('active');
    }

    /* ================================================================
       Helper: get today's date string (YYYY-MM-DD in local timezone)
       ================================================================ */
    function getTodayStr() {
      var d = new Date();
      return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
    }

    /* ================================================================
       Helper: get countdown to midnight (HH:MM:SS)
       ================================================================ */
    function getCountdownToMidnight() {
      var now = new Date();
      var midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      var diff = midnight - now;
      var h = Math.floor(diff / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      var s = Math.floor((diff % 60000) / 1000);
      return String(h).padStart(2, '0') + ':' +
        String(m).padStart(2, '0') + ':' +
        String(s).padStart(2, '0');
    }

    /* ================================================================
       Daily limit check
       ================================================================ */
    function checkDailyLimit() {
      var lastDate = localStorage.getItem(STORAGE_DATE);
      var today = getTodayStr();

      if (lastDate === today) {
        showPhase(phaseLocked);
        updateCountdown();
        renderLastFortune();
        return true;
      }
      return false;
    }

    function updateCountdown() {
      if (!countdownTimer) return;
      countdownTimer.textContent = getCountdownToMidnight();
    }

    function renderLastFortune() {
      var lastRaw = localStorage.getItem(STORAGE_LAST);
      if (!lastRaw) return;
      try {
        var last = JSON.parse(lastRaw);
        if (last) {
          currentLot = last.lot;
          currentDeity = {
            slug: last.deity.slug,
            name: last.deity.name,
            nameZh: last.deity.nameZh,
            avatarBg: '#b8a06e',
            avatarInitial: last.deity.name.charAt(0),
            title: ''
          };
          showPhase(phaseFortune);
          renderFortune(currentLot, currentDeity);
        }
      } catch (e) { /* ignore */ }
    }

    /* ================================================================
       Stick tips rendering (100 tiny sticks in cylinder)
       ================================================================ */
    function renderStickTips() {
      if (!cylinderSticks) return;
      var html = '';
      for (var i = 0; i < 100; i++) {
        html += '<div class="cylinder-stick-tip" style="animation-delay:' + (i * 0.01) + 's"></div>';
      }
      cylinderSticks.innerHTML = html;
    }

    /* ================================================================
       Shake detection
       ================================================================ */
    var shakeCount = 0;
    var shakeThreshold = 8;
    var shakeTimeout = null;
    var shakeActive = false;
    var lastAccel = { x: 0, y: 0, z: 0 };

    function resetShake() {
      shakeCount = 0;
      shakeActive = false;
      if (cylinder) cylinder.classList.remove('shaking');
      if (shakeTimeout) clearTimeout(shakeTimeout);
    }

    function onShakeDetected() {
      if (!shakeActive) return;
      shakeCount++;
      if (cylinder) cylinder.classList.add('shaking');

      if (shakeTimeout) clearTimeout(shakeTimeout);
      shakeTimeout = setTimeout(function () {
        resetShake();
      }, 1500);

      if (shakeCount >= shakeThreshold) {
        resetShake();
        triggerStickRelease();
      }
    }

    /* ---- Gyroscope (mobile) ---- */
    function initGyroShake() {
      window.addEventListener('deviceorientation', function (e) {
        if (!shakeActive) return;
        var x = e.beta || 0;
        var y = e.gamma || 0;
        var z = e.alpha || 0;

        var dx = Math.abs(x - lastAccel.x);
        var dy = Math.abs(y - lastAccel.y);
        var dz = Math.abs(z - lastAccel.z);

        if (dx + dy + dz > 25) {
          onShakeDetected();
        }

        lastAccel.x = x;
        lastAccel.y = y;
        lastAccel.z = z;
      });
    }

    /* ---- Mouse shake (desktop) ---- */
    function initMouseShake() {
      if (!cylinder) return;
      var isDragging = false;

      cylinder.addEventListener('mousedown', function (e) {
        e.preventDefault();
        isDragging = true;
        shakeActive = true;
        cylinder.style.cursor = 'grabbing';
        lastAccel = { x: e.clientX, y: e.clientY, z: 0 };
      });

      window.addEventListener('mousemove', function (e) {
        if (!isDragging || !shakeActive) return;
        var dx = Math.abs(e.clientX - lastAccel.x);
        if (dx > 8) {
          onShakeDetected();
          lastAccel.x = e.clientX;
        }
      });

      window.addEventListener('mouseup', function () {
        if (isDragging) {
          isDragging = false;
          if (cylinder) cylinder.style.cursor = 'grab';
          resetShake();
        }
      });

      /* ---- Touch (mobile fallback) ---- */
      cylinder.addEventListener('touchstart', function (e) {
        e.preventDefault();
        isDragging = true;
        shakeActive = true;
        lastAccel = { x: e.touches[0].clientX, y: e.touches[0].clientY, z: 0 };
      }, { passive: false });

      window.addEventListener('touchmove', function (e) {
        if (!isDragging || !shakeActive) return;
        var dx = Math.abs(e.touches[0].clientX - lastAccel.x);
        if (dx > 8) {
          onShakeDetected();
          lastAccel.x = e.touches[0].clientX;
        }
      }, { passive: false });

      window.addEventListener('touchend', function () {
        if (isDragging) {
          isDragging = false;
          resetShake();
        }
      });
    }

    /* ---- Keyboard fallback (Space bar) ---- */
    function initKeyboardShake() {
      window.addEventListener('keydown', function (e) {
        if (e.code === 'Space' && shakeActive) {
          e.preventDefault();
          onShakeDetected();
        }
      });
    }

    /* ================================================================
       Stick release — pick random lot, show stick number
       ================================================================ */
    function triggerStickRelease() {
      shakeActive = false;

      var lotId = Math.floor(Math.random() * 100) + 1;
      currentLot = getFortuneById(lotId);
      if (!currentLot) currentLot = getFortuneById(1);

      spawnGoldParticles(20);

      setTimeout(function () {
        showPhase(phaseJiaobei);
        renderJiaobeiBlocks();
      }, 1200);
    }

    /* ================================================================
       筊杯 (Moon Blocks)
       ================================================================ */
    function renderJiaobeiBlocks() {
      if (!jiaobeiContainer) return;
      jiaobeiContainer.innerHTML =
        '<div class="jiaobei-block" id="jiaobei-block-1" title="Click to throw"></div>'
        + '<div class="jiaobei-block" id="jiaobei-block-2" title="Click to throw"></div>';

      if (jiaobeiResult) jiaobeiResult.innerHTML = '';
      jiaobeiRetries = 0;

      var block1 = document.getElementById('jiaobei-block-1');
      var block2 = document.getElementById('jiaobei-block-2');

      function throwJiaobei() {
        if (!block1 || !block2) return;
        block1.classList.add('throwing');
        block2.classList.add('throwing');
        block1.style.pointerEvents = 'none';
        block2.style.pointerEvents = 'none';

        setTimeout(function () {
          var result = rollJiaobei();
          block1.classList.remove('throwing');
          block2.classList.remove('throwing');
          showJiaobeiResult(result, block1, block2);
        }, 800);
      }

      if (block1) block1.addEventListener('click', throwJiaobei);
      if (block2) block2.addEventListener('click', throwJiaobei);
    }

    function rollJiaobei() {
      var rand = Math.random();
      if (rand < 0.5) return 'sheng';
      if (rand < 0.8) return 'xiao';
      return 'nu';
    }

    function showJiaobeiResult(result, block1, block2) {
      if (result === 'sheng') {
        block1.classList.add('result-sheng');
        block2.classList.add('result-sheng');
        block2.style.transform = 'rotate(180deg)';
      } else if (result === 'xiao') {
        block1.classList.add('result-xiao');
        block2.classList.add('result-xiao');
      } else {
        block1.classList.add('result-nu');
        block2.classList.add('result-nu');
        block2.style.transform = 'rotate(180deg)';
      }

      if (jiaobeiResult) {
        var texts = {
          sheng: { zh: '圣杯 — 神明应允', en: 'The deity accepts your lot.' },
          xiao: { zh: '笑杯 — 神明微笑，请再求', en: 'The deity smiles. Try again.' },
          nu: { zh: '怒杯 — 神明不悦，请再求', en: 'The deity is displeased. Try again.' }
        };
        var t = texts[result];
        jiaobeiResult.innerHTML =
          '<p class="jiaobei-result-text ' + result + '">' + t.zh + '</p>'
          + '<p style="color:rgba(232,220,200,0.4);font-size:0.82rem;margin-top:4px">' + t.en + '</p>';
      }

      if (result === 'sheng') {
        setTimeout(function () {
          pickDeityAndReveal();
        }, 1800);
      } else {
        jiaobeiRetries++;
        if (jiaobeiRetries >= MAX_JIAOBEI_RETRIES) {
          setTimeout(function () {
            if (jiaobeiResult) {
              jiaobeiResult.innerHTML =
                '<p class="jiaobei-result-text sheng">天道酬勤 — 神明终允</p>'
                + '<p style="color:rgba(232,220,200,0.4);font-size:0.82rem;margin-top:4px">Heaven rewards persistence. The deity relents.</p>';
            }
            setTimeout(function () { pickDeityAndReveal(); }, 1800);
          }, 1000);
        } else {
          setTimeout(function () {
            renderJiaobeiBlocks();
          }, 2000);
        }
      }
    }

    /* ================================================================
       Deity selection
       ================================================================ */
    function pickDeityAndReveal() {
      if (typeof CELESTIAL_DEITIES === 'undefined') {
        currentDeity = { slug: '_default', name: 'The Celestial Court', nameZh: '天庭', avatarBg: '#b8a06e', avatarInitial: '天', title: 'Heavenly Court' };
      } else {
        var idx = Math.floor(Math.random() * CELESTIAL_DEITIES.length);
        currentDeity = CELESTIAL_DEITIES[idx];
      }

      showPhase(phaseDeity);

      if (deityReveal) {
        deityReveal.innerHTML =
          '<div class="deity-reveal-avatar" style="background:' + (currentDeity.avatarBg || '#b8a06e') + '">'
          + (currentDeity.avatarInitial || '?')
          + '</div>'
          + '<div class="deity-reveal-name">' + currentDeity.name + ' · ' + currentDeity.nameZh + '</div>'
          + '<div class="deity-reveal-title">' + (currentDeity.title || '') + '</div>';
      }

      spawnGoldParticles(15);

      setTimeout(function () {
        showPhase(phaseFortune);
        renderFortune(currentLot, currentDeity);
        spawnGoldParticles(10);
        saveFortune();
      }, 2500);
    }

    /* ================================================================
       Fortune rendering
       ================================================================ */
    function renderFortune(lot, deity) {
      if (!fortuneContainer) return;

      var tierClass = '';
      switch (lot.tier) {
        case '上上': tierClass = 'supreme'; break;
        case '上':   tierClass = 'good'; break;
        case '中':   tierClass = 'neutral'; break;
        case '下':   tierClass = 'cautionary'; break;
        case '下下': tierClass = 'ill'; break;
      }

      var divMsg = pickDeityMessage(deity.slug, lot.tier);
      var domainNames = {
        career: '事业 · Career',
        love: '姻缘 · Love',
        health: '健康 · Health',
        wealth: '财运 · Wealth',
        general: '综合 · General'
      };
      var domainLabel = domainNames[lot.domain] || '综合 · General';

      var html =
        '<div class="stick-reveal">'
        + '<div class="stick-reveal-label">SACRED LOT</div>'
        + '<div class="stick-reveal-number">第 ' + lot.id + ' 签</div>'
        + '</div>'

        + '<div class="fortune-scroll">'

        + '<div class="fortune-tier">'
        + '<span class="fortune-tier-badge ' + tierClass + '">' + lot.tier + '签 · ' + lot.tierEn + '</span>'
        + '</div>'

        + '<div class="fortune-poem">'
        + '<div class="fortune-poem-zh">' + escHtml(lot.poem.zh).replace(/\n/g, '<br>') + '</div>'
        + '<div class="fortune-poem-en">' + escHtml(lot.poem.en).replace(/\n/g, '<br>') + '</div>'
        + '</div>'

        + '<div class="fortune-interpretation">'
        + '<div class="fortune-interpretation-label">解签 · Interpretation</div>'
        + '<div class="fortune-interpretation-zh">' + escHtml(lot.interpretation.zh) + '</div>'
        + '<div class="fortune-interpretation-en">' + escHtml(lot.interpretation.en) + '</div>'
        + '</div>'

        + '<div class="fortune-deity-message">'
        + '<div class="fortune-deity-label">' + escHtml(deity.name) + ' · ' + escHtml(deity.nameZh) + ' 寄语</div>'
        + '<div class="fortune-deity-zh">' + escHtml(divMsg.zh) + '</div>'
        + '<div class="fortune-deity-en">' + escHtml(divMsg.en) + '</div>'
        + '</div>'

        + '<div class="fortune-domain">'
        + '<div class="fortune-domain-label">' + domainLabel + '</div>'
        + '<div class="fortune-domain-zh">' + escHtml(lot.domainGuidance.zh) + '</div>'
        + '<div class="fortune-domain-en">' + escHtml(lot.domainGuidance.en) + '</div>'
        + '</div>'

        + '</div>';

      fortuneContainer.innerHTML = html;

      if (fortuneActions) fortuneActions.style.display = 'flex';
    }

    function escHtml(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /* ================================================================
       Save fortune
       ================================================================ */
    function saveFortune() {
      var today = getTodayStr();
      try {
        localStorage.setItem(STORAGE_DATE, today);
      } catch (e) { /* localStorage full or unavailable */ }

      var fortuneRecord = {
        date: today,
        lot: currentLot,
        deity: { slug: currentDeity.slug, name: currentDeity.name, nameZh: currentDeity.nameZh }
      };
      try {
        localStorage.setItem(STORAGE_LAST, JSON.stringify(fortuneRecord));
      } catch (e) { /* localStorage full or unavailable */ }

      var history = loadHistory();
      history.unshift({
        date: today,
        timestamp: Date.now(),
        lotId: currentLot.id,
        tier: currentLot.tier,
        tierEn: currentLot.tierEn,
        poemFirstLine: (currentLot.poem.zh || '').split('\n')[0],
        deitySlug: currentDeity.slug,
        deityName: currentDeity.name,
        deityNameZh: currentDeity.nameZh
      });
      if (history.length > 50) history = history.slice(0, 50);
      saveHistory(history);
    }

    /* ================================================================
       History management
       ================================================================ */
    function loadHistory() {
      try {
        var raw = localStorage.getItem(STORAGE_HISTORY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) { return []; }
    }

    function saveHistory(history) {
      try {
        localStorage.setItem(STORAGE_HISTORY, JSON.stringify(history));
      } catch (e) { /* localStorage full */ }
    }

    function renderHistory() {
      if (!historyList) return;
      var history = loadHistory();
      if (history.length === 0) {
        historyList.innerHTML = '<p class="history-empty">No fortunes drawn yet.<br>天庭求签，静候有缘人。</p>';
        return;
      }
      var html = '';
      history.forEach(function (h) {
        html +=
          '<div class="history-item">'
          + '<div class="history-item-date">' + h.date + '</div>'
          + '<span class="history-item-tier" style="color:'
          + (h.tier === '上上' ? 'var(--accent-vermillion)' :
             h.tier === '上' ? 'var(--accent-gold)' :
             h.tier === '中' ? 'var(--accent-stone)' : '#888')
          + '">' + h.tier + '签</span>'
          + '<span class="history-item-deity">' + h.deityName + ' · ' + h.deityNameZh + '</span>'
          + '<div class="history-item-poem">' + escHtml(h.poemFirstLine) + '...</div>'
          + '</div>';
      });
      historyList.innerHTML = html;
    }

    /* ================================================================
       Share card
       ================================================================ */
    function generateShareCard() {
      var canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 800;
      canvas.className = 'share-canvas';
      document.body.appendChild(canvas);

      var ctx = canvas.getContext('2d');

      // Background
      ctx.fillStyle = '#1a120a';
      ctx.fillRect(0, 0, 600, 800);

      // Gold border
      ctx.strokeStyle = '#b8a06e';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 560, 760);

      // Inner border
      ctx.strokeStyle = 'rgba(184,160,110,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(34, 34, 532, 732);

      // Title
      ctx.fillStyle = '#b8a06e';
      ctx.font = '28px "Ma Shan Zheng", "KaiTi", serif';
      ctx.textAlign = 'center';
      ctx.fillText('天庭求签', 300, 80);

      ctx.fillStyle = '#e8dcc8';
      ctx.font = '14px Cinzel, serif';
      ctx.fillText('CELESTIAL DIVINATION', 300, 110);

      // Divider
      ctx.strokeStyle = '#b8a06e';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(150, 130);
      ctx.lineTo(450, 130);
      ctx.stroke();

      // Tier badge
      var tierColors = {
        '上上': '#c44d34', '上': '#b8a06e', '中': '#3d7a8c', '下': '#8b7355', '下下': '#555'
      };
      ctx.fillStyle = tierColors[currentLot.tier] || '#b8a06e';
      ctx.font = '36px "Ma Shan Zheng", "KaiTi", serif';
      ctx.fillText(currentLot.tier + '签', 300, 190);

      ctx.fillStyle = '#e8dcc8';
      ctx.font = '14px Cinzel, serif';
      ctx.fillText(currentLot.tierEn, 300, 220);

      // Stick number
      ctx.fillStyle = 'rgba(184,160,110,0.6)';
      ctx.font = '16px Cinzel, serif';
      ctx.fillText('LOT #' + currentLot.id, 300, 255);

      // Poem
      ctx.fillStyle = '#e8dcc8';
      ctx.font = '22px "Ma Shan Zheng", "KaiTi", serif';
      var poemLines = currentLot.poem.zh.split('\n');
      poemLines.forEach(function (line, i) {
        ctx.fillText(line, 300, 310 + i * 40);
      });

      // Poem English
      ctx.fillStyle = 'rgba(184,160,110,0.5)';
      ctx.font = '12px "Source Serif 4", serif';
      ctx.textAlign = 'center';
      var enLines = currentLot.poem.en.split('\n');
      enLines.forEach(function (line, i) {
        ctx.fillText(line.trim(), 300, 490 + i * 20);
      });
      ctx.textAlign = 'center';

      // Deity
      ctx.fillStyle = '#b8a06e';
      ctx.font = '18px Cinzel, serif';
      ctx.fillText('— ' + currentDeity.name + ' · ' + currentDeity.nameZh, 300, 570);

      // Divider
      ctx.strokeStyle = 'rgba(184,160,110,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(150, 600);
      ctx.lineTo(450, 600);
      ctx.stroke();

      // URL
      ctx.fillStyle = 'rgba(184,160,110,0.4)';
      ctx.font = '12px Cinzel, serif';
      ctx.fillText('celestial-archive.com', 300, 640);
      ctx.fillText('天庭求签 · Celestial Divination', 300, 660);

      // Download
      canvas.toBlob(function (blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'celestial-divination-lot-' + currentLot.id + '.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        document.body.removeChild(canvas);
      }, 'image/png');
    }

    /* ================================================================
       Particle effects
       ================================================================ */
    function spawnGoldParticles(count) {
      if (!overlay) return;
      for (var i = 0; i < count; i++) {
        var p = document.createElement('div');
        p.className = 'divination-particle';
        p.style.left = (40 + Math.random() * 20) + '%';
        p.style.top = (40 + Math.random() * 10) + '%';
        p.style.setProperty('--px', ((Math.random() - 0.5) * 200) + 'px');
        p.style.setProperty('--py', (-(Math.random() * 200 + 50)) + 'px');
        p.style.animationDelay = (Math.random() * 0.5) + 's';
        p.style.animationDuration = (2 + Math.random() * 2) + 's';
        p.style.width = (4 + Math.random() * 8) + 'px';
        p.style.height = p.style.width;
        p.style.background = 'radial-gradient(circle, rgba(255,220,140,0.9), rgba(184,160,110,0.3) 60%, transparent 70%)';
        overlay.appendChild(p);
        setTimeout(function () {
          if (p.parentNode) p.parentNode.removeChild(p);
        }, 3500);
      }
    }

    /* ================================================================
       Event bindings
       ================================================================ */
    function bindEvents() {
      if (btnShare) {
        btnShare.addEventListener('click', function () { generateShareCard(); });
      }

      if (btnHistory) {
        btnHistory.addEventListener('click', function () {
          renderHistory();
          if (historyDrawer) historyDrawer.classList.add('open');
        });
      }
      if (btnHistoryClose) {
        btnHistoryClose.addEventListener('click', function () {
          if (historyDrawer) historyDrawer.classList.remove('open');
        });
      }

      if (btnReturn) {
        btnReturn.addEventListener('click', function () {
          checkDailyLimit();
        });
      }

      var btnReturnLocked = document.getElementById('btn-return-locked');
      if (btnReturnLocked) {
        btnReturnLocked.addEventListener('click', function () {
          if (historyDrawer) historyDrawer.classList.remove('open');
          showPhase(phaseCylinder);
          shakeActive = true;
        });
      }

      if (btnViewLast) {
        btnViewLast.addEventListener('click', function () {
          renderLastFortune();
        });
      }
    }

    /* ================================================================
       Init sequence
       ================================================================ */
    function init() {
      renderStickTips();
      bindEvents();

      var locked = checkDailyLimit();
      if (locked) {
        setInterval(updateCountdown, 1000);
        return;
      }

      showPhase(phaseCylinder);
      shakeActive = true;

      initGyroShake();
      initMouseShake();
      initKeyboardShake();
    }

    init();
  };
})();
