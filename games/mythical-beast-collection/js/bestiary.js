/**
 * Mythical Beast Collection — Bestiary Core Logic
 * Complete game engine: map exploration, riddle challenge, beast revelation,
 * collection gallery, daily limit, share cards, and particle effects.
 *
 * Dependencies:
 *   ../../js/deities.js   — CELESTIAL_DEITIES (site-wide registry)
 *   js/beast-data.js       — MYTHICAL_BEASTS, BEAST_REGIONS, helpers
 *
 * Usage:
 *   <script src="../../js/deities.js"></script>
 *   <script src="js/beast-data.js"></script>
 *   <script src="js/bestiary.js"></script>
 *   <script>initBestiary();</script>
 */
(function () {
  'use strict';

  window.initBestiary = function () {

    /* ================================================================
       DOM refs
       ================================================================ */
    var phaseMap      = document.getElementById('phase-map');
    var phaseExplore  = document.getElementById('phase-explore');
    var phaseRiddle   = document.getElementById('phase-riddle');
    var phaseReveal   = document.getElementById('phase-reveal');
    var phaseCard     = document.getElementById('phase-card');
    var phaseLocked   = document.getElementById('phase-locked');

    var mapContainer       = document.getElementById('map-container');
    var mapRegions         = document.getElementById('map-regions');
    var collectionCounter  = document.getElementById('collection-counter');
    var btnGallery         = document.getElementById('btn-gallery');
    var btnViewCollectionLocked = document.getElementById('btn-view-collection-locked');

    var exploreOverlay   = document.getElementById('explore-overlay');
    var exploreText      = document.getElementById('explore-text');
    var exploreParticles = document.getElementById('explore-particles');

    var riddleParchment = document.getElementById('riddle-parchment');
    var riddleZh        = document.getElementById('riddle-zh');
    var riddleEn        = document.getElementById('riddle-en');
    var silhouetteRow   = document.getElementById('silhouette-row');

    var revealContainer  = document.getElementById('reveal-container');
    var revealShockwave  = document.getElementById('reveal-shockwave');
    var revealBeast      = document.getElementById('reveal-beast');
    var revealResult     = document.getElementById('reveal-result');

    var beastCardContainer = document.getElementById('beast-card-container');
    var btnShare           = document.getElementById('btn-share');
    var btnContinue        = document.getElementById('btn-continue');

    var countdownTimer = document.getElementById('countdown-timer');

    var galleryDrawer     = document.getElementById('gallery-drawer');
    var btnGalleryClose   = document.getElementById('btn-gallery-close');
    var galleryGrid       = document.getElementById('gallery-grid');
    var galleryFilters    = document.querySelectorAll('.gallery-filter');
    var bestiaryOverlay   = document.getElementById('bestiary-overlay');

    /* ================================================================
       localStorage keys
       ================================================================ */
    var STORAGE_DATE    = 'beast-collection-last-date';
    var STORAGE_OWNED   = 'beast-collection-owned';
    var STORAGE_HISTORY = 'beast-collection-history';

    /* ================================================================
       State
       ================================================================ */
    var currentBeast   = null;
    var currentRegion  = null;
    var riddleOptions  = []; // [{beast, isCorrect}, ...] shuffled
    var ownedBeasts    = [];
    var countdownInterval = null;

    /* ================================================================
       Stat label mapping (5 stats from beast-data)
       ================================================================ */
    var STAT_LABELS = {
      power:       { zh: '力量', en: 'Power' },
      wisdom:      { zh: '智慧', en: 'Wisdom' },
      mystery:     { zh: '灵力', en: 'Mystery' },
      ferocity:    { zh: '凶悍', en: 'Ferocity' },
      benevolence: { zh: '仁德', en: 'Benevolence' }
    };

    var STAT_ORDER = ['power', 'wisdom', 'mystery', 'ferocity', 'benevolence'];

    /* ================================================================
       Emoji/icon mapping for beasts (by type string)
       ================================================================ */
    var TYPE_EMOJI = {
      '麒麟': '🦌',
      '兽':   '🐾',
      '精':   '✨',
      '妖':   '👺',
      '凤':   '🕊️',
      '龙':   '🐉'
    };

    function getBeastEmoji(beast) {
      return TYPE_EMOJI[beast.type] || '❓';
    }

    /* ================================================================
       Rarity colors and labels
       ================================================================ */
    var RARITY_META = {
      '凡': { label: '凡品 · Mortal',    color: '#8a9a8a', glow: 'rgba(138,154,138,0.4)' },
      '灵': { label: '灵品 · Spirit',    color: '#5a9ad4', glow: 'rgba(90,154,212,0.4)' },
      '仙': { label: '仙品 · Immortal',  color: '#c4a06e', glow: 'rgba(196,160,110,0.4)' },
      '神': { label: '神品 · Divine',    color: '#d44a3a', glow: 'rgba(212,74,58,0.4)' }
    };

    function getRarityWeight(rarity) {
      switch (rarity) {
        case '凡': return 40;
        case '灵': return 30;
        case '仙': return 20;
        case '神': return 10;
        default:   return 25;
      }
    }

    /* ================================================================
       1. MAP RENDERER
       ================================================================ */
    function renderRegionHotspots() {
      if (!mapRegions) return;

      var html = '';
      for (var i = 0; i < BEAST_REGIONS.length; i++) {
        var region = BEAST_REGIONS[i];
        var collected = countCollectedInRegion(region.id);
        var total = region.beasts.length;

        html += '<div class="region-hotspot"'
          + ' style="left:' + region.mapPosition.x + '%;top:' + region.mapPosition.y + '%;'
          + '--region-color:' + region.color + ';"'
          + ' data-region="' + region.id + '"'
          + ' title="' + escHtml(region.name.en) + ' — ' + collected + '/' + total + '">'
          + '<div class="region-hotspot-pulse"></div>'
          + '<div class="region-hotspot-icon">'
          + '<span class="region-hotspot-name">' + escHtml(region.name.zh) + '</span>'
          + '<span class="region-hotspot-count">' + collected + '/' + total + '</span>'
          + '</div>'
          + '<div class="region-hotspot-tooltip">'
          + '<strong>' + escHtml(region.name.en) + '</strong><br>'
          + '<span class="region-hotspot-tooltip-sub">' + escHtml(region.name.zh) + '</span><br>'
          + '<span class="region-hotspot-tooltip-desc">' + escHtml(region.description.en.substring(0, 60)) + '...</span>'
          + '</div>'
          + '</div>';
      }
      mapRegions.innerHTML = html;

      // Attach click handlers
      var hotspots = mapRegions.querySelectorAll('.region-hotspot');
      for (var j = 0; j < hotspots.length; j++) {
        hotspots[j].addEventListener('click', (function (regionId) {
          return function () {
            var region = getRegionById(regionId);
            if (region) startExploration(region);
          };
        })(hotspots[j].getAttribute('data-region')));
      }
    }

    function countCollectedInRegion(regionId) {
      var regionBeasts = getBeastsByRegion(regionId);
      var count = 0;
      for (var i = 0; i < regionBeasts.length; i++) {
        if (ownedBeasts.indexOf(regionBeasts[i].id) !== -1) {
          count++;
        }
      }
      return count;
    }

    function updateCollectionCounter() {
      if (!collectionCounter) return;
      var total = MYTHICAL_BEASTS.length;
      var owned = ownedBeasts.length;
      collectionCounter.textContent = owned + ' / ' + total;

      // Update individual region counts
      var hotspots = mapRegions ? mapRegions.querySelectorAll('.region-hotspot') : [];
      for (var i = 0; i < hotspots.length; i++) {
        var rid = hotspots[i].getAttribute('data-region');
        if (!rid) continue;
        var collected = countCollectedInRegion(rid);
        var totalInRegion = (getRegionById(rid) || { beasts: [] }).beasts.length;
        var countEl = hotspots[i].querySelector('.region-hotspot-count');
        if (countEl) countEl.textContent = collected + '/' + totalInRegion;
      }
    }

    function initParallax() {
      if (!mapContainer) return;
      mapContainer.addEventListener('mousemove', function (e) {
        var rect = mapContainer.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;

        var layers = mapContainer.querySelectorAll('.parallax-layer');
        for (var i = 0; i < layers.length; i++) {
          var depth = parseFloat(layers[i].getAttribute('data-depth') || '0.02');
          layers[i].style.setProperty('--parallax-x', (x * depth * 100) + 'px');
          layers[i].style.setProperty('--parallax-y', (y * depth * 100) + 'px');
        }
      });
    }

    /* ================================================================
       2. DAILY LIMIT
       ================================================================ */
    function getTodayStr() {
      var d = new Date();
      return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
    }

    function getCountdownToMidnight() {
      var now = new Date();
      var midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      var diff = midnight - now;
      if (diff <= 0) return '00:00:00';
      var h = Math.floor(diff / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      var s = Math.floor((diff % 60000) / 1000);
      return String(h).padStart(2, '0') + ':' +
        String(m).padStart(2, '0') + ':' +
        String(s).padStart(2, '0');
    }

    function updateCountdown() {
      if (!countdownTimer) return;
      countdownTimer.textContent = getCountdownToMidnight();
    }

    function checkDailyLimit() {
      var lastDate = null;
      try {
        lastDate = localStorage.getItem(STORAGE_DATE);
      } catch (e) { /* ignore */ }

      var today = getTodayStr();

      if (lastDate === today) {
        showPhase('phase-locked');
        updateCountdown();
        if (countdownInterval) clearInterval(countdownInterval);
        countdownInterval = setInterval(updateCountdown, 1000);
        return true;
      }
      return false;
    }

    /* ================================================================
       3. EXPLORATION ENGINE
       ================================================================ */
    function startExploration(region) {
      currentRegion = region;
      showPhase('phase-explore');

      // Pick a random beast from this region for the encounter narrative
      var regionBeasts = getBeastsByRegion(region.id);
      var narrativeBeast = regionBeasts.length > 0
        ? regionBeasts[Math.floor(Math.random() * regionBeasts.length)]
        : null;

      var encounterText = narrativeBeast && narrativeBeast.encounterText
        ? narrativeBeast.encounterText.en
        : 'You sense a mythical presence nearby...';

      spawnParticles(region.particles.type, region.particles.count);

      if (exploreText) {
        typewriterEffect(exploreText, encounterText, function () {
          // After text completes, wait 2s then start riddle
          setTimeout(function () {
            var selected = selectBeast(region);
            if (selected) {
              startRiddle(selected);
            }
          }, 2000);
        });
      } else {
        setTimeout(function () {
          var selected = selectBeast(region);
          if (selected) startRiddle(selected);
        }, 2000);
      }
    }

    function selectBeast(region) {
      var regionBeasts = getBeastsByRegion(region.id);
      if (regionBeasts.length === 0) return null;

      // Build weighted pool by rarity
      var pool = [];
      var retries = 0;
      var maxRetries = 3;
      var selected = null;

      while (retries <= maxRetries && !selected) {
        pool = [];
        for (var i = 0; i < regionBeasts.length; i++) {
          var weight = getRarityWeight(regionBeasts[i].rarity);
          for (var w = 0; w < weight; w++) {
            pool.push(regionBeasts[i]);
          }
        }

        var candidate = pool[Math.floor(Math.random() * pool.length)];

        // Prefer unowned beasts (retry up to maxRetries times)
        if (retries < maxRetries && ownedBeasts.indexOf(candidate.id) !== -1) {
          retries++;
          continue;
        }

        selected = candidate;
        break;
      }

      // Fallback: if still null after retries, just pick random
      if (!selected) {
        selected = regionBeasts[Math.floor(Math.random() * regionBeasts.length)];
      }

      return selected;
    }

    /* ================================================================
       Typewriter effect
       ================================================================ */
    function typewriterEffect(element, text, onComplete) {
      if (!element) {
        if (onComplete) onComplete();
        return;
      }

      element.innerHTML = '';
      element.style.visibility = 'visible';

      var chars = text.split('');
      var index = 0;
      var interval = 50;

      function typeNext() {
        if (index >= chars.length) {
          if (onComplete) onComplete();
          return;
        }

        var ch = chars[index];
        if (ch === '\n') {
          element.innerHTML += '<br>';
        } else {
          element.innerHTML += escHtml(ch);
        }
        index++;
        setTimeout(typeNext, interval);
      }

      typeNext();
    }

    /* ================================================================
       4. RIDDLE SYSTEM
       ================================================================ */
    function startRiddle(beast) {
      currentBeast = beast;
      showPhase('phase-riddle');

      if (riddleZh) riddleZh.textContent = beast.riddle.zh;
      if (riddleEn) riddleEn.textContent = beast.riddle.en;
      if (riddleParchment) riddleParchment.classList.remove('glow-complete');

      // Character glow animation on the Chinese riddle
      characterGlowAnimation(riddleZh, beast.riddle.zh);

      // Get distractors
      var distractors = getRiddleDistractors(beast.id, beast.region);
      // Take up to 2 distractors
      var distractorPool = distractors.slice(0, 2);

      riddleOptions = shuffle([
        { beast: beast, isCorrect: true },
        { beast: distractorPool[0], isCorrect: false },
        { beast: distractorPool[1] || distractorPool[0], isCorrect: false }
      ]);

      renderSilhouettes();
    }

    function characterGlowAnimation(element, text) {
      if (!element) return;
      element.innerHTML = '';
      element.style.visibility = 'visible';

      var chars = text.split('');
      for (var i = 0; i < chars.length; i++) {
        var span = document.createElement('span');
        span.textContent = chars[i];
        span.className = 'riddle-char';
        span.style.setProperty('--char-index', i);
        span.style.animationDelay = (i * 0.08) + 's';
        element.appendChild(span);
      }

      // Add glow-complete class after all chars have animated
      var totalDelay = chars.length * 0.08 + 0.6;
      setTimeout(function () {
        if (riddleParchment) riddleParchment.classList.add('glow-complete');
      }, totalDelay * 1000);
    }

    function renderSilhouettes() {
      if (!silhouetteRow) return;

      var html = '';
      for (var i = 0; i < riddleOptions.length; i++) {
        var opt = riddleOptions[i];
        var emoji = getBeastEmoji(opt.beast);
        html += '<div class="silhouette-card" data-opt-index="' + i + '">'
          + '<div class="silhouette-inner">'
          + '<div class="silhouette-icon">' + emoji + '</div>'
          + '<div class="silhouette-shape"></div>'
          + '<div class="silhouette-question">?</div>'
          + '</div>'
          + '<div class="silhouette-label">Identify this beast</div>'
          + '</div>';
      }
      silhouetteRow.innerHTML = html;

      // Click handlers
      var cards = silhouetteRow.querySelectorAll('.silhouette-card');
      for (var j = 0; j < cards.length; j++) {
        cards[j].addEventListener('click', (function (idx) {
          return function () {
            revealBeast(riddleOptions[idx].beast, riddleOptions[idx].isCorrect);
          };
        })(j));
      }
    }

    /* ================================================================
       5. BEAST REVELATION
       ================================================================ */
    function revealBeast(clickedBeast, isCorrect) {
      showPhase('phase-reveal');
      if (!revealBeast || !revealResult) return;

      // Clear previous content
      revealBeast.innerHTML = '';
      revealResult.innerHTML = '';

      var correct = currentBeast;

      if (isCorrect) {
        // CORRECT guess
        if (revealShockwave) {
          revealShockwave.classList.remove('shockwave-active');
          // Force reflow
          void revealShockwave.offsetWidth;
          revealShockwave.classList.add('shockwave-active');
        }

        // Show the beast illustration with emerge animation
        revealBeast.innerHTML = '<div class="beast-emerge">'
          + '<div class="beast-emerge-icon">' + getBeastEmoji(correct) + '</div>'
          + '<div class="beast-emerge-name">' + escHtml(correct.name.en) + '</div>'
          + '<div class="beast-emerge-name-zh">' + escHtml(correct.name.zh) + '</div>'
          + '</div>';

        revealResult.innerHTML = '<div class="reveal-correct">'
          + '<span class="reveal-correct-icon">&#10003;</span>'
          + '<span class="reveal-correct-text">You found ' + escHtml(correct.name.en) + '!</span>'
          + '<span class="reveal-correct-text-zh">你找到了 ' + escHtml(correct.name.zh) + '！</span>'
          + '</div>';
      } else {
        // WRONG guess
        revealBeast.innerHTML = '<div class="beast-smoke-dissolve">'
          + '<div class="beast-smoke-icon">' + getBeastEmoji(clickedBeast) + '</div>'
          + '<div class="beast-smoke-label">' + escHtml(clickedBeast.name.en) + '</div>'
          + '</div>';

        // After smoke animation, reveal the correct beast
        setTimeout(function () {
          revealBeast.innerHTML = '<div class="beast-emerge">'
            + '<div class="beast-emerge-icon">' + getBeastEmoji(correct) + '</div>'
            + '<div class="beast-emerge-name">' + escHtml(correct.name.en) + '</div>'
            + '<div class="beast-emerge-name-zh">' + escHtml(correct.name.zh) + '</div>'
            + '</div>';

          revealResult.innerHTML = '<div class="reveal-wrong">'
            + '<span class="reveal-wrong-text">Near miss! It was ' + escHtml(correct.name.en) + '</span>'
            + '<span class="reveal-wrong-text-zh">差一点！其实是 ' + escHtml(correct.name.zh) + '</span>'
            + '</div>';

          // Record in history (wrong guess)
          recordExploration(correct.id, currentRegion ? currentRegion.id : '', false);
        }, 1500);

        // Early return — the history recording happens in the timeout above
        spawnParticles('stardust', 30);
        setTimeout(function () {
          showBeastCard(correct);
        }, 2500);
        return;
      }

      spawnParticles('stardust', 30);

      // Record in history (correct guess)
      recordExploration(correct.id, currentRegion ? currentRegion.id : '', true);

      setTimeout(function () {
        showBeastCard(correct);
      }, 2500);
    }

    /* ================================================================
       6. BEAST CARD RENDERER
       ================================================================ */
    function showBeastCard(beast) {
      currentBeast = beast;
      showPhase('phase-card');
      if (!beastCardContainer) return;

      var rarityMeta = RARITY_META[beast.rarity] || { label: '未知', color: '#888', glow: 'rgba(136,136,136,0.4)' };
      var region = getRegionById(beast.region);

      var html = '<div class="beast-card rarity-' + beast.rarity + '" style="--rarity-glow:' + rarityMeta.glow + ';--rarity-color:' + rarityMeta.color + ';">'
        + '<div class="beast-card-header">'
        + '<div class="beast-card-icon">' + getBeastEmoji(beast) + '</div>'
        + '<div class="beast-card-title-group">'
        + '<div class="beast-card-name">' + escHtml(beast.name.en) + '</div>'
        + '<div class="beast-card-name-zh">' + escHtml(beast.name.zh) + '</div>'
        + '</div>'
        + '</div>'

        + '<div class="beast-card-meta">'
        + '<span class="beast-card-tag rarity-tag" style="background:' + rarityMeta.color + '">' + escHtml(rarityMeta.label) + '</span>'
        + '<span class="beast-card-tag type-tag">' + escHtml(beast.type) + '</span>'
        + (region ? '<span class="beast-card-tag region-tag">' + escHtml(region.name.en) + '</span>' : '')
        + '</div>'

        + '<div class="beast-card-stats">'
        + renderStatBars(beast.stats)
        + '</div>'

        + '<div class="beast-card-lore">'
        + '<div class="beast-card-lore-zh">' + escHtml(beast.lore.zh) + '</div>'
        + '<div class="beast-card-lore-en">' + escHtml(beast.lore.en) + '</div>'
        + '</div>'
        + '</div>';

      beastCardContainer.innerHTML = html;

      // Animate stat bars with stagger
      animateStatBars();

      // Save to owned list
      addOwnedBeast(beast.id);

      updateCollectionCounter();
      checkMilestones();
    }

    function renderStatBars(stats) {
      var html = '';
      for (var i = 0; i < STAT_ORDER.length; i++) {
        var key = STAT_ORDER[i];
        var label = STAT_LABELS[key] || { zh: key, en: key };
        var val = stats[key] || 0;
        html += '<div class="stat-row" data-stat="' + key + '">'
          + '<div class="stat-label">'
          + '<span class="stat-label-zh">' + escHtml(label.zh) + '</span>'
          + '<span class="stat-label-en">' + escHtml(label.en) + '</span>'
          + '</div>'
          + '<div class="stat-bar">'
          + '<div class="stat-fill" style="width:0%" data-target="' + val + '"></div>'
          + '</div>'
          + '<div class="stat-value">' + val + '</div>'
          + '</div>';
      }
      return html;
    }

    function animateStatBars() {
      var fills = beastCardContainer ? beastCardContainer.querySelectorAll('.stat-fill') : [];
      for (var i = 0; i < fills.length; i++) {
        (function (el, delay) {
          setTimeout(function () {
            var target = parseInt(el.getAttribute('data-target') || '0', 10);
            el.style.width = target + '%';
          }, delay);
        })(fills[i], 100 + i * 100);
      }
    }

    /* ================================================================
       7. BESTIARY GALLERY
       ================================================================ */
    var galleryCurrentFilter = null;

    function openGallery() {
      renderGallery(galleryCurrentFilter);
      if (galleryDrawer) galleryDrawer.classList.add('open');
    }

    function renderGallery(filterValue) {
      if (!galleryGrid) return;

      galleryCurrentFilter = filterValue;

      var html = '';

      for (var i = 0; i < MYTHICAL_BEASTS.length; i++) {
        var beast = MYTHICAL_BEASTS[i];
        var isOwned = ownedBeasts.indexOf(beast.id) !== -1;

        // Apply filter
        if (filterValue && filterValue !== 'all') {
          if (filterValue === 'owned' && !isOwned) continue;
          if (filterValue === 'missing' && isOwned) continue;
          if (filterValue !== 'owned' && filterValue !== 'missing' && beast.region !== filterValue) continue;
        }

        if (isOwned) {
          var rarityMeta = RARITY_META[beast.rarity] || { color: '#888', glow: 'rgba(136,136,136,0.4)' };
          html += '<div class="gallery-slot owned" data-beast-id="' + beast.id + '" style="--slot-glow:' + rarityMeta.glow + '">'
            + '<div class="gallery-slot-glow" style="border-color:' + rarityMeta.color + '"></div>'
            + '<div class="gallery-slot-icon">' + getBeastEmoji(beast) + '</div>'
            + '<div class="gallery-slot-name">' + escHtml(beast.name.en) + '</div>'
            + '<div class="gallery-slot-name-zh">' + escHtml(beast.name.zh) + '</div>'
            + '<div class="gallery-slot-rarity" style="background:' + rarityMeta.color + '">' + escHtml(beast.rarity) + '</div>'
            + '</div>';
        } else {
          html += '<div class="gallery-slot empty" data-beast-id="' + beast.id + '">'
            + '<div class="gallery-slot-pedestal">'
            + '<div class="pedestal-smoke"></div>'
            + '<div class="pedestal-question">?</div>'
            + '</div>'
            + '<div class="gallery-slot-name unknown">???</div>'
            + '</div>';
        }
      }

      galleryGrid.innerHTML = html;

      // Click handlers for owned beasts
      var ownedSlots = galleryGrid.querySelectorAll('.gallery-slot.owned');
      for (var j = 0; j < ownedSlots.length; j++) {
        (function (slot) {
          slot.addEventListener('click', function () {
            var bid = slot.getAttribute('data-beast-id');
            var beast = getBeastById(bid);
            if (beast) {
              // Close gallery and show beast card
              if (galleryDrawer) galleryDrawer.classList.remove('open');
              showBeastCard(beast);
            }
          });
        })(ownedSlots[j]);
      }
    }

    function setupGalleryFilters() {
      if (!galleryFilters || galleryFilters.length === 0) return;

      for (var i = 0; i < galleryFilters.length; i++) {
        (function (btn) {
          btn.addEventListener('click', function () {
            // Deactivate all
            for (var j = 0; j < galleryFilters.length; j++) {
              galleryFilters[j].classList.remove('active');
            }
            btn.classList.add('active');

            var filterValue = btn.getAttribute('data-filter') || 'all';
            renderGallery(filterValue);
          });
        })(galleryFilters[i]);
      }
    }

    /* ================================================================
       8. PERSISTENCE
       ================================================================ */
    function loadOwnedBeasts() {
      try {
        var raw = localStorage.getItem(STORAGE_OWNED);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }

    function saveOwnedBeasts() {
      try {
        localStorage.setItem(STORAGE_OWNED, JSON.stringify(ownedBeasts));
      } catch (e) {
        /* localStorage full or unavailable */
      }
    }

    function addOwnedBeast(beastId) {
      if (ownedBeasts.indexOf(beastId) === -1) {
        ownedBeasts.push(beastId);
        saveOwnedBeasts();
      }
    }

    function loadHistory() {
      try {
        var raw = localStorage.getItem(STORAGE_HISTORY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }

    function saveHistory(history) {
      try {
        localStorage.setItem(STORAGE_HISTORY, JSON.stringify(history));
      } catch (e) {
        /* localStorage full or unavailable */
      }
    }

    function recordExploration(beastId, regionId, correctGuess) {
      var history = loadHistory();
      var today = getTodayStr();
      history.unshift({
        date: today,
        timestamp: Date.now(),
        beastId: beastId,
        regionId: regionId,
        correct: correctGuess
      });
      // Keep last 100 entries
      if (history.length > 100) history = history.slice(0, 100);
      saveHistory(history);

      // Also set the daily limit date
      try {
        localStorage.setItem(STORAGE_DATE, today);
      } catch (e) {
        /* ignore */
      }
    }

    /* ================================================================
       9. SHARE CARD (Canvas)
       ================================================================ */
    function generateShareCard() {
      if (!currentBeast) return;

      var beast = currentBeast;
      var canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 800;
      canvas.className = 'share-canvas';
      document.body.appendChild(canvas);

      var ctx = canvas.getContext('2d');

      // Dark background
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
      ctx.fillText('神兽收集', 300, 80);

      ctx.fillStyle = '#e8dcc8';
      ctx.font = '14px Cinzel, serif';
      ctx.fillText('MYTHICAL BEAST COLLECTION', 300, 110);

      // Divider
      ctx.strokeStyle = '#b8a06e';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(150, 130);
      ctx.lineTo(450, 130);
      ctx.stroke();

      // Beast emoji
      ctx.font = '64px serif';
      ctx.textAlign = 'center';
      ctx.fillText(getBeastEmoji(beast), 300, 230);

      // Beast name
      ctx.fillStyle = '#e8dcc8';
      ctx.font = '28px "Source Serif 4", "Noto Serif SC", serif';
      ctx.fillText(beast.name.en, 300, 290);

      ctx.fillStyle = '#b8a06e';
      ctx.font = '22px "Ma Shan Zheng", "KaiTi", serif';
      ctx.fillText(beast.name.zh, 300, 325);

      // Rarity badge
      var rarityMeta = RARITY_META[beast.rarity] || { label: '未知', color: '#888' };
      ctx.fillStyle = rarityMeta.color;
      ctx.font = '16px Cinzel, serif';
      ctx.fillText(rarityMeta.label, 300, 365);

      // Divider
      ctx.strokeStyle = 'rgba(184,160,110,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(120, 385);
      ctx.lineTo(480, 385);
      ctx.stroke();

      // Stats
      ctx.font = '14px "Source Serif 4", serif';
      ctx.textAlign = 'left';
      var yPos = 420;
      for (var si = 0; si < STAT_ORDER.length; si++) {
        var key = STAT_ORDER[si];
        var label = STAT_LABELS[key] || { en: key };
        var val = beast.stats[key] || 0;
        ctx.fillStyle = 'rgba(232,220,200,0.6)';
        ctx.fillText(label.en, 80, yPos);

        // Stat bar (visual)
        ctx.fillStyle = 'rgba(184,160,110,0.2)';
        ctx.fillRect(200, yPos - 10, 300, 16);
        ctx.fillStyle = rarityMeta.color;
        ctx.fillRect(200, yPos - 10, (val / 100) * 300, 16);

        ctx.fillStyle = '#e8dcc8';
        ctx.textAlign = 'right';
        ctx.fillText(val + '/100', 520, yPos);
        ctx.textAlign = 'left';

        yPos += 32;
      }

      // Lore snippet
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(184,160,110,0.5)';
      ctx.font = '12px "Source Serif 4", serif';
      var loreWords = beast.lore.en.split(' ');
      var line = '';
      var lineY = 610;
      for (var wi = 0; wi < loreWords.length; wi++) {
        var testLine = line + loreWords[wi] + ' ';
        if (ctx.measureText(testLine).width > 480) {
          ctx.fillText(line.trim(), 300, lineY);
          line = loreWords[wi] + ' ';
          lineY += 18;
          if (lineY > 660) break; // Max 3 lines
        } else {
          line = testLine;
        }
      }
      if (line.trim() && lineY <= 660) {
        ctx.fillText(line.trim(), 300, lineY);
      }

      // Divider
      ctx.strokeStyle = 'rgba(184,160,110,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(150, 690);
      ctx.lineTo(450, 690);
      ctx.stroke();

      // URL
      ctx.fillStyle = 'rgba(184,160,110,0.4)';
      ctx.font = '12px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.fillText('celestial-archive.com', 300, 730);
      ctx.fillText('神兽收集 · Mythical Beast Collection', 300, 750);

      // Download
      canvas.toBlob(function (blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'mythical-beast-' + beast.id + '.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        document.body.removeChild(canvas);
      }, 'image/png');
    }

    /* ================================================================
       10. PARTICLE SYSTEM
       ================================================================ */
    function spawnParticles(type, count) {
      if (!bestiaryOverlay) return;

      // Remove old completed particles
      var existing = bestiaryOverlay.querySelectorAll('.particle-' + type);
      for (var e = 0; e < existing.length; e++) {
        if (existing[e].getAttribute('data-done') === 'true') {
          existing[e].parentNode.removeChild(existing[e]);
        }
      }

      for (var i = 0; i < count; i++) {
        var p = document.createElement('div');
        p.className = 'particle particle-' + type;
        p.setAttribute('data-done', 'false');

        var size = 4 + Math.random() * 10;
        var xPos = 10 + Math.random() * 80;
        var yPos = 10 + Math.random() * 80;

        p.style.left = xPos + '%';
        p.style.top = yPos + '%';
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.setProperty('--dx', ((Math.random() - 0.5) * 200) + 'px');
        p.style.setProperty('--dy', (-(Math.random() * 150 + 50)) + 'px');
        p.style.animationDelay = (Math.random() * 1.5) + 's';
        p.style.animationDuration = (2.5 + Math.random() * 3) + 's';
        p.style.opacity = '0';

        // Customize per particle type
        switch (type) {
          case 'petal':
            p.style.background = 'radial-gradient(circle, rgba(255,200,180,0.9), rgba(255,150,120,0.3) 60%, transparent 70%)';
            p.style.borderRadius = '50% 0 50% 0';
            break;
          case 'firefly':
            p.style.background = 'radial-gradient(circle, rgba(200,255,100,0.9), rgba(200,255,100,0.2) 50%, transparent 70%)';
            p.style.borderRadius = '50%';
            p.style.boxShadow = '0 0 6px rgba(200,255,100,0.6)';
            break;
          case 'ember':
            p.style.background = 'radial-gradient(circle, rgba(255,160,50,0.9), rgba(255,80,20,0.3) 60%, transparent 70%)';
            p.style.borderRadius = '50%';
            break;
          case 'snow':
            p.style.background = 'radial-gradient(circle, rgba(220,240,255,0.8), rgba(220,240,255,0.1) 60%, transparent 70%)';
            p.style.borderRadius = '50%';
            p.style.boxShadow = '0 0 4px rgba(220,240,255,0.4)';
            break;
          case 'stardust':
            p.style.background = 'radial-gradient(circle, rgba(255,240,200,0.9), rgba(255,215,0,0.2) 50%, transparent 70%)';
            p.style.borderRadius = '50%';
            p.style.boxShadow = '0 0 8px rgba(255,215,0,0.5)';
            break;
          case 'wisp':
            p.style.background = 'radial-gradient(circle, rgba(180,140,255,0.7), rgba(120,80,200,0.2) 60%, transparent 70%)';
            p.style.borderRadius = '50%';
            p.style.boxShadow = '0 0 10px rgba(120,80,200,0.3)';
            break;
        }

        bestiaryOverlay.appendChild(p);

        // Mark as done after animation completes
        (function (particle) {
          setTimeout(function () {
            particle.setAttribute('data-done', 'true');
            if (particle.parentNode) {
              particle.parentNode.removeChild(particle);
            }
          }, 5000);
        })(p);
      }
    }

    /* ================================================================
       11. MILESTONE CELEBRATIONS
       ================================================================ */
    function checkMilestones() {
      var count = ownedBeasts.length;
      var total = MYTHICAL_BEASTS.length;

      if (count === 0) return;

      // 5 beasts (25%)
      if (count >= 5 && count < 10) {
        spawnMilestoneEffect('subtle-glow');
      }

      // 10 beasts (50%)
      if (count >= 10 && count < 15) {
        spawnMilestoneEffect('gold-particles');
      }

      // 15 beasts (75%)
      if (count >= 15 && count < 20) {
        spawnMilestoneEffect('banner');
      }

      // 20 beasts (100%) — full celebration
      if (count >= total) {
        spawnMilestoneEffect('master-of-beasts');
      }
    }

    function spawnMilestoneEffect(type) {
      if (!bestiaryOverlay) return;

      if (type === 'subtle-glow') {
        var glow = document.createElement('div');
        glow.className = 'milestone-glow';
        glow.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:100;'
          + 'background:radial-gradient(circle at center, rgba(255,215,0,0.08) 0%, transparent 70%);'
          + 'animation:milestone-fade 3s ease-out forwards;';
        bestiaryOverlay.appendChild(glow);
        setTimeout(function () { if (glow.parentNode) glow.parentNode.removeChild(glow); }, 3000);
      }

      if (type === 'gold-particles') {
        spawnParticles('stardust', 40);
      }

      if (type === 'banner') {
        spawnParticles('stardust', 60);
      }

      if (type === 'master-of-beasts') {
        spawnParticles('stardust', 100);
        var banner = document.createElement('div');
        banner.className = 'milestone-master';
        banner.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;'
          + 'flex-direction:column;z-index:200;pointer-events:none;'
          + 'background:radial-gradient(circle at center, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.8) 100%);'
          + 'animation:milestone-fade 5s ease-out forwards;';
        banner.innerHTML = '<div style="font-size:4rem;color:#ffd700;text-shadow:0 0 30px rgba(255,215,0,0.8);">'
          + '&#9733; MASTER OF BEASTS &#9733;</div>'
          + '<div style="font-size:1.4rem;color:#e8dcc8;margin-top:16px;font-family:\'Ma Shan Zheng\',serif;">'
          + '万兽之王 · All Beasts Collected</div>'
          + '<div style="font-size:0.9rem;color:rgba(232,220,200,0.5);margin-top:12px;">'
          + 'You have befriended every mythical creature in the realm.</div>';
        bestiaryOverlay.appendChild(banner);
        setTimeout(function () { if (banner.parentNode) banner.parentNode.removeChild(banner); }, 5000);
      }
    }

    /* ================================================================
       12. EVENT BINDINGS
       ================================================================ */
    function bindEvents() {
      if (btnGallery) {
        btnGallery.addEventListener('click', function () { openGallery(); });
      }

      if (btnViewCollectionLocked) {
        btnViewCollectionLocked.addEventListener('click', function () { openGallery(); });
      }

      if (btnGalleryClose) {
        btnGalleryClose.addEventListener('click', function () {
          if (galleryDrawer) galleryDrawer.classList.remove('open');
        });
      }

      if (btnContinue) {
        btnContinue.addEventListener('click', function () {
          currentBeast = null;
          currentRegion = null;
          showPhase('phase-map');
        });
      }

      if (btnShare) {
        btnShare.addEventListener('click', function () { generateShareCard(); });
      }
    }

    /* ================================================================
       13. HELPERS
       ================================================================ */
    function showPhase(phaseId) {
      var phases = [phaseMap, phaseExplore, phaseRiddle, phaseReveal, phaseCard, phaseLocked];
      for (var i = 0; i < phases.length; i++) {
        if (phases[i]) phases[i].classList.remove('active');
      }

      var target = null;
      switch (phaseId) {
        case 'phase-map':     target = phaseMap;     break;
        case 'phase-explore': target = phaseExplore; break;
        case 'phase-riddle':  target = phaseRiddle;  break;
        case 'phase-reveal':  target = phaseReveal;  break;
        case 'phase-card':    target = phaseCard;    break;
        case 'phase-locked':  target = phaseLocked;  break;
      }
      if (target) target.classList.add('active');
    }

    function escHtml(str) {
      if (typeof str !== 'string') return '';
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function shuffle(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
      }
      return a;
    }

    /* ================================================================
       14. INIT
       ================================================================ */
    function init() {
      ownedBeasts = loadOwnedBeasts();

      renderRegionHotspots();
      updateCollectionCounter();
      setupGalleryFilters();
      bindEvents();

      var locked = checkDailyLimit();
      if (locked) {
        return;
      }

      showPhase('phase-map');
      initParallax();
    }

    init();
  };
})();
