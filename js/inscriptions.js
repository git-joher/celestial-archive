/**
 * Celestial Archive — Golden Inscriptions (Flame Forge)
 * localStorage-backed messaging system with deity response animation.
 *
 * Usage:
 *   <script src="../../js/inscriptions.js"></script>
 *   <script>initInscriptions('deity-slug');</script>
 *
 * Required HTML:
 *   #inscription-input          — textarea
 *   #inscription-submit         — button
 *   #inscription-gallery        — message card container
 *   #inscription-overlay        — full-screen animation overlay
 *   #inscription-overlay-text   — animated text element
 */
(function () {
  'use strict';

  /* ================================================================
     Deity Response Registry
     Each deity has 5 themed blessings (zh + en). Random on each send.
     ================================================================ */
  var DEITY_RESPONSES = {
    'sun-wukong': [
      { zh: '金猴奋起千钧棒，玉宇澄清万里埃。\n愿你扫除一切障碍，好运常伴左右。', en: 'The golden monkey raises his mighty staff — the cosmos clears. May all obstacles fall before you, and fortune walk beside you always.' },
      { zh: '俺老孙来也！\n愿你如筋斗云般一飞冲天，前程似锦。', en: 'Old Sun answers! May you soar like the Somersault Cloud — one leap to a brilliant horizon.' },
      { zh: '七十二变神通广大，\n愿你随机应变，万事顺遂。', en: 'Seventy-two transformations at your command — may you adapt with grace and thrive through every season of life.' },
      { zh: '齐天大圣在此，妖魔鬼怪退散！\n愿你平安喜乐，无忧无惧。', en: 'The Great Sage stands guard — no darkness shall approach. Peace and joy be yours, now and always.' },
      { zh: '花果山上蟠桃熟，\n愿你福寿绵长，心想事成。', en: 'The peaches of Flower-Fruit Mountain are ripe — may your blessings be abundant and your wishes come true.' }
    ],
    'nezha': [
      { zh: '脚踏风火轮，\n愿你勇往直前，无所畏惧。', en: 'Upon the Wind-Fire Wheels — march forward boldly, for courage burns brighter than any fear.' },
      { zh: '乾坤圈护体，混天绫遮风，\n愿你平安健康，邪祟不侵。', en: 'The Universe Ring guards you, the Red Sash shields your path — may health and peace surround you always.' },
      { zh: '三头六臂显神通，\n愿你事事游刃有余，从容应对。', en: 'Three heads, six arms, boundless skill — may you handle all things with ease and confidence.' },
      { zh: '莲花化身净无瑕，\n愿你心如明镜，不为尘染。', en: 'Born anew from the lotus, pure and untarnished — may your heart stay clear and bright.' },
      { zh: '火尖枪破长空，\n愿你冲破一切阻碍，得见光明。', en: 'The Fire-Tipped Spear pierces the heavens — may you break through every barrier and find the light.' }
    ],
    'zhu-bajie': [
      { zh: '俺老猪虽贪吃懒做，\n但愿你吃得好睡得香，天天开心没烦恼！', en: 'I may be lazy and gluttonous, but my wish for you is true — eat well, rest deep, and let no worry trouble your heart!' },
      { zh: '九齿钉耙镇四方，\n愿你五谷丰登，衣食无忧。', en: 'The Nine-Toothed Rake guards all directions — may your table be full and your larder never empty.' },
      { zh: '高老庄的风水好，\n愿你家宅安康，老少平安。', en: 'The good feng shui of Gao Village — may your home be blessed and your family at peace.' },
      { zh: '别看老猪笨，心诚则灵，\n愿你真心换真情，所遇皆良人。', en: 'A sincere heart beats a clever mind — may your kindness be returned tenfold.' },
      { zh: '取经路上虽辛苦，终得正果，\n愿你付出都有回报，苦尽甘来。', en: 'The pilgrimage was hard, but the reward was real — may every effort of yours bear sweet fruit.' }
    ],
    'guanyin': [
      { zh: '净瓶甘露，洒向人间。\n愿你心怀慈悲，平安喜乐。', en: 'Sweet dew from the pure vase sprinkles the world — may compassion fill your heart and peace fill your days.' },
      { zh: '千处祈求千处应，苦海常作渡人舟。\n愿你逢凶化吉，遇难成祥。', en: 'She answers every prayer, a ferry across the sea of suffering — may every misfortune turn to blessing.' },
      { zh: '杨柳枝头一滴水，化作人间万点春。\n愿你心田常润，生机无限。', en: 'One drop from the willow branch becomes ten thousand springs — may your spirit stay nourished and alive.' },
      { zh: '大慈大悲，救苦救难。\n愿你身心安康，无忧无惧。', en: 'Great mercy, great compassion, deliverance from all suffering — may your body and mind know only peace.' },
      { zh: '莲花座下听禅音，\n愿你心静如水，万事从容。', en: 'By the lotus throne, the dharma resounds — may your heart be still as water, meeting all things with grace.' }
    ],
    'buddha': [
      { zh: '一花一世界，一叶一菩提。\n愿你明心见性，福慧双修。', en: 'A flower holds a world, a leaf holds enlightenment — may you see your true nature and cultivate wisdom and blessing.' },
      { zh: '放下即是解脱。\n愿你心无挂碍，自在逍遥。', en: 'Letting go is liberation — may your heart be unburdened and your spirit roam free.' },
      { zh: '万法皆空，因果不空。\n愿你种善因，得善果。', en: 'All phenomena are empty, but cause and effect are real — may you plant good seeds and reap sweet fruit.' },
      { zh: '菩提本无树，明镜亦非台。\n愿你心如明镜，照见真实。', en: 'No tree of wisdom, no stand for the mirror — may your heart be a clear mirror reflecting truth.' },
      { zh: '大千世界，不过一念。\n愿你妄念不起，真心常存。', en: 'The cosmos is but a single thought — may delusions fade and your true mind shine forever.' }
    ],
    'tang-sanzang': [
      { zh: '心诚则灵，路遥知力。\n愿你信念坚定，终达彼岸。', en: 'A sincere heart moves heaven — may your faith be your compass and every step bring you closer to the far shore.' },
      { zh: '九九八十一难皆为空，\n愿你逢凶化吉，平安喜乐。', en: 'Eighty-one trials, each a door to grace — may every hardship you face transform into blessing.' },
      { zh: '若不至天竺，终不东归一步。\n愿你矢志不渝，所愿皆成。', en: '"Not one step east until I reach the Western Heaven" — may your resolve never waver and your destination find you.' },
      { zh: '出家人不打诳语，慈悲为怀。\n愿你心怀善意，所遇皆温柔。', en: 'A monk speaks only truth, a heart holds only compassion — may kindness be your language and gentleness your reward.' },
      { zh: '佛光普照，众生皆渡。\n愿你身心清净，福慧无边。', en: 'The Buddha\'s light shines on all — may your spirit be clear as morning and your wisdom boundless as the sutras.' }
    ],
    'erlang-shen': [
      { zh: '天眼所及，真假立辨。\n愿你明辨是非，不受蒙蔽。', en: 'The Heavenly Eye sees through all falsehood — may you discern truth from deception and walk in clarity.' },
      { zh: '三尖两刃刀镇守四方，\n愿你勇不可挡，所向披靡。', en: 'The three-pointed spear guards all directions — may your courage never falter and your strength never wane.' },
      { zh: '七十二变化，应变无穷。\n愿你随机应变，万难皆克。', en: 'Seventy-two transformations, infinite resource — may you adapt to every challenge and overcome every obstacle.' },
      { zh: '灌江口上，自在为王。\n愿你心无拘束，活出真我。', en: 'At Guanjiangkou, he answers to no one — may you live free from constraint and true to your own nature.' },
      { zh: '啸天犬忠诚不二，\n愿你良友相伴，永不孤单。', en: 'The Sky-Howling Hound, loyal beyond measure — may true companions walk beside you and loyalty never leave your side.' }
    ],
    '_default': [
      { zh: '金石之言已达天听，\n愿你心想事成，福运绵长。', en: 'Your golden words have reached the celestial realm — may every wish find its way home, and fortune flow endlessly.' },
      { zh: '祥云已至，紫气东来，\n愿你万事如意，好运连连。', en: 'Auspicious clouds gather, purple mist rises — may all things go your way, and luck follow every step.' },
      { zh: '天官赐福，百无禁忌，\n愿你心怀光明，前路坦荡。', en: 'The heavenly officials bestow their blessing — may your heart stay bright and your path stay clear.' }
    ]
  };

  function pickResponse(slug) {
    var pool = DEITY_RESPONSES[slug] || DEITY_RESPONSES['_default'];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function getDeityName(slug) {
    if (window.CELESTIAL_DEITIES) {
      for (var i = 0; i < window.CELESTIAL_DEITIES.length; i++) {
        if (window.CELESTIAL_DEITIES[i].slug === slug) return window.CELESTIAL_DEITIES[i].name;
      }
    }
    return slug.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  /* ================================================================
     Main init
     ================================================================ */
  window.initInscriptions = function (deitySlug) {
    var STORAGE_KEY = 'celestial-archive-msgs-' + deitySlug;

    var input = document.getElementById('inscription-input');
    var submitBtn = document.getElementById('inscription-submit');
    var gallery = document.getElementById('inscription-gallery');
    var overlay = document.getElementById('inscription-overlay');
    var overlayText = document.getElementById('inscription-overlay-text');

    if (!input || !submitBtn || !gallery || !overlay || !overlayText) return;

    /* Dynamic elements created once on first send */
    var receptionEl = null;
    var responseEl = null;

    function ensureDynamicElements() {
      if (!receptionEl) {
        receptionEl = document.createElement('div');
        receptionEl.className = 'inscription-reception';
        overlay.appendChild(receptionEl);
      }
      if (!responseEl) {
        responseEl = document.createElement('div');
        responseEl.className = 'inscription-response-text';
        overlay.appendChild(responseEl);
      }
    }

    /* ---- Storage ---- */
    function loadMessages() {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }

    function saveMessages(messages) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch (e) { /* localStorage full */ }
    }

    /* ---- Gallery ---- */
    function renderGallery() {
      var messages = loadMessages();
      if (!gallery) return;

      if (messages.length === 0) {
        gallery.innerHTML = '<p class="inscription-empty">No inscriptions yet. Be the first to leave a message.</p>';
        return;
      }

      var sorted = messages.slice().sort(function (a, b) { return b.timestamp - a.timestamp; });

      var html = '';
      sorted.forEach(function (msg) {
        var date = new Date(msg.timestamp);
        var timeStr = date.toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
        var escapedText = escHtml(msg.text);

        html += '<div class="inscription-card">'
          + '<p class="inscription-card-text">' + escapedText + '</p>';

        if (msg.response) {
          var r = msg.response;
          html += '<div class="inscription-card-response">'
            + '<span class="icr-label">' + escHtml(r.label || '') + '</span>'
            + '<p class="icr-zh">' + escHtml(r.zh).replace(/\n/g, '<br>') + '</p>'
            + '<p class="icr-en">' + escHtml(r.en) + '</p>'
            + '</div>';
        }

        html += '<p class="inscription-card-time">' + timeStr + '</p>'
          + '</div>';
      });
      gallery.innerHTML = html;
    }

    function escHtml(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /* ---- Animation helpers ---- */
    function clearAllParticles() {
      var particles = overlay.querySelectorAll(
        '.cloud-particle, .golden-beam, .ember-particle, .forge-flash, .spark-particle'
      );
      for (var i = 0; i < particles.length; i++) {
        particles[i].parentNode.removeChild(particles[i]);
      }
    }

    function spawnCloudParticles() {
      var count = 8;
      var inputRect = input.getBoundingClientRect();
      var startX = inputRect.left + inputRect.width / 2;
      var startY = inputRect.top;
      for (var i = 0; i < count; i++) {
        var p = document.createElement('div');
        p.className = 'cloud-particle';
        p.style.left = (startX + (Math.random() - 0.5) * 60) + 'px';
        p.style.top = (startY + Math.random() * 20) + 'px';
        p.style.animationDelay = (i * 0.12) + 's';
        p.style.animationDuration = (2 + Math.random() * 1.5) + 's';
        overlay.appendChild(p);
      }
    }

    function spawnBeam() {
      var beam = document.createElement('div');
      beam.className = 'golden-beam';
      overlay.appendChild(beam);
      setTimeout(function () {
        if (beam.parentNode) beam.parentNode.removeChild(beam);
      }, 700);
    }

    /* ---- Phase 3: Ember particles ---- */
    function spawnEmberParticles() {
      var count = 30;
      for (var i = 0; i < count; i++) {
        var ember = document.createElement('div');
        ember.className = 'ember-particle';
        var angle = Math.random() * 360;
        var radius = 60 + Math.random() * 140;
        ember.style.setProperty('--ember-angle', angle + 'deg');
        ember.style.setProperty('--ember-radius', radius + 'px');
        ember.style.animationDelay = (Math.random() * 0.25) + 's';
        ember.style.animationDuration = (1.2 + Math.random() * 0.6) + 's';
        // Vary ember color: gold → orange → amber
        var hue = 30 + Math.random() * 20; // 30-50 (gold to amber)
        var sat = 80 + Math.random() * 20;
        var light = 50 + Math.random() * 25;
        ember.style.background = 'radial-gradient(circle, hsl(' + hue + ',' + sat + '%,' + light + '%) 0%, hsl(' + (hue + 15) + ',90%,35%) 50%, transparent 70%)';
        ember.style.width = (6 + Math.random() * 10) + 'px';
        ember.style.height = ember.style.width;
        overlay.appendChild(ember);
      }
    }

    function triggerForgeFlash() {
      var flash = document.createElement('div');
      flash.className = 'forge-flash';
      overlay.appendChild(flash);
      setTimeout(function () {
        if (flash.parentNode) flash.parentNode.removeChild(flash);
      }, 700);
    }

    /* ---- Phase 4: Blessing sparks ---- */
    function spawnBlessingSparks() {
      var count = 20;
      for (var i = 0; i < count; i++) {
        var spark = document.createElement('div');
        spark.className = 'spark-particle';
        spark.style.left = (40 + Math.random() * 20) + '%';
        spark.style.top = (40 + Math.random() * 10) + '%';
        spark.style.animationDelay = (Math.random() * 1.5) + 's';
        spark.style.animationDuration = (2.5 + Math.random() * 2) + 's';
        spark.style.width = (3 + Math.random() * 6) + 'px';
        spark.style.height = spark.style.width;
        overlay.appendChild(spark);
      }
    }

    /* ---- Send flow ---- */
    function sendMessage() {
      var text = input.value.trim();
      if (!text) return;

      submitBtn.disabled = true;
      input.disabled = true;
      ensureDynamicElements();

      var deityName = getDeityName(deitySlug);
      var response = pickResponse(deitySlug);

      overlay.classList.add('active');

      /* --- Phase 1: Ascent --- */
      overlayText.textContent = text;
      overlayText.classList.remove('golden', 'igniting');
      overlayText.style.cssText = '';
      overlayText.style.position = 'absolute';

      var inputRect = input.getBoundingClientRect();
      overlayText.style.left = inputRect.left + 'px';
      overlayText.style.top = inputRect.top + 'px';
      overlayText.style.width = inputRect.width + 'px';
      overlayText.style.transform = 'none';
      overlayText.style.transition = 'none';
      overlayText.style.color = '#fff';
      overlayText.style.textShadow = 'none';
      overlayText.style.fontSize = '1rem';
      overlayText.style.textAlign = 'left';
      overlayText.style.maxWidth = 'none';
      overlayText.style.opacity = '1';
      overlayText.style.filter = 'none';

      // Hide dynamic elements from previous sends
      receptionEl.style.opacity = '0';
      receptionEl.style.transform = 'translate(-50%, 20px)';
      receptionEl.style.display = 'none';
      responseEl.style.opacity = '0';
      responseEl.style.transform = 'scale(0.3)';
      responseEl.style.display = 'none';

      clearAllParticles();
      spawnCloudParticles();

      overlayText.offsetHeight;
      overlayText.style.transition = 'all 1.8s cubic-bezier(0.25, 0.1, 0.25, 1)';
      overlayText.style.left = '50%';
      overlayText.style.top = '45%';
      overlayText.style.transform = 'translate(-50%, -50%)';
      overlayText.style.width = 'auto';
      overlayText.style.maxWidth = '600px';
      overlayText.style.fontSize = '';
      overlayText.style.textAlign = 'center';

      /* --- Phase 2: Reception --- */
      overlayText.addEventListener('transitionend', function onRise(e) {
        if (e.propertyName !== 'left') return;
        overlayText.removeEventListener('transitionend', onRise);

        overlayText.classList.add('golden');
        spawnBeam();

        // Show reception subtitle
        receptionEl.textContent = deityName + ' has received your inscription';
        receptionEl.style.display = 'block';
        receptionEl.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        receptionEl.offsetHeight;
        receptionEl.style.opacity = '1';
        receptionEl.style.transform = 'translate(-50%, 0)';

        /* --- Phase 3: Flame Forge (after 5s reception pause) --- */
        setTimeout(function () {
          spawnEmberParticles();
          overlayText.classList.add('igniting');

          setTimeout(function () {
            triggerForgeFlash();
            overlayText.style.transition = 'all 0.35s ease-in';
            overlayText.style.opacity = '0';
            overlayText.style.filter = 'blur(6px)';
            overlayText.style.transform = 'translate(-50%, -50%) scale(1.2)';

            // Hide reception subtitle
            receptionEl.style.opacity = '0';
            receptionEl.style.transform = 'translate(-50%, -10px)';

            /* --- Phase 4: Blessing (response appears) --- */
            setTimeout(function () {
              var embers = overlay.querySelectorAll('.ember-particle');
              for (var i = 0; i < embers.length; i++) {
                embers[i].parentNode.removeChild(embers[i]);
              }
              receptionEl.style.display = 'none';

              // English primary, Chinese secondary (decoration)
              responseEl.innerHTML =
                '<p class="ir-en">' + escHtml(response.en) + '</p>'
                + '<p class="ir-zh">' + escHtml(response.zh).replace(/\n/g, ' ') + '</p>'
                + '<p class="ir-from">— ' + escHtml(deityName) + '</p>';
              responseEl.style.display = 'block';
              responseEl.style.transition = 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
              responseEl.offsetHeight;
              responseEl.style.opacity = '1';
              responseEl.style.transform = 'scale(1)';

              spawnBlessingSparks();

              /* --- Phase 5: Archive (after 5s reading pause) --- */
              setTimeout(function () {
                var galleryRect = gallery.getBoundingClientRect();
                var destY = galleryRect.top - window.innerHeight / 2 + 60;

                responseEl.style.transition = 'all 0.9s cubic-bezier(0.55, 0, 0.45, 1)';
                responseEl.style.opacity = '0';
                responseEl.style.transform = 'translateY(' + destY + 'px) scale(0.7)';

                responseEl.addEventListener('transitionend', function onDescend(e2) {
                  if (e2.propertyName !== 'opacity') return;
                  responseEl.removeEventListener('transitionend', onDescend);

                  var messages = loadMessages();
                  response.label = '✦ ' + deityName + ' responds';
                  messages.push({
                    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
                    text: text,
                    response: response,
                    timestamp: Date.now()
                  });
                  saveMessages(messages);

                  overlay.classList.remove('active');
                  overlayText.textContent = '';
                  overlayText.classList.remove('golden', 'igniting');
                  overlayText.style.cssText = '';
                  responseEl.style.cssText = '';
                  responseEl.style.display = 'none';
                  receptionEl.style.cssText = '';
                  receptionEl.style.display = 'none';
                  clearAllParticles();

                  input.value = '';
                  submitBtn.disabled = false;
                  input.disabled = false;
                  input.focus();

                  renderGallery();
                  var firstCard = gallery.querySelector('.inscription-card');
                  if (firstCard) {
                    firstCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                });
              }, 5000);
            }, 450);
          }, 1500);
        }, 5000);
      });
    }

    /* ---- Event binding ---- */
    submitBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    renderGallery();
  };
})();
