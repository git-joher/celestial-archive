/**
 * Celestial Archive — Golden Inscriptions
 * localStorage-backed messaging system with send animation.
 * Shared across all deity hub pages.
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

  window.initInscriptions = function (deitySlug) {
    var STORAGE_KEY = 'celestial-archive-msgs-' + deitySlug;

    var input = document.getElementById('inscription-input');
    var submitBtn = document.getElementById('inscription-submit');
    var gallery = document.getElementById('inscription-gallery');
    var overlay = document.getElementById('inscription-overlay');
    var overlayText = document.getElementById('inscription-overlay-text');

    if (!input || !submitBtn || !gallery || !overlay || !overlayText) return;

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
      } catch (e) {
        /* localStorage full — silently ignore */
      }
    }

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
        var escapedText = msg.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        html += '<div class="inscription-card">'
          + '<p class="inscription-card-text">' + escapedText + '</p>'
          + '<p class="inscription-card-time">' + timeStr + '</p>'
          + '</div>';
      });
      gallery.innerHTML = html;
    }

    function sendMessage() {
      var text = input.value.trim();
      if (!text) return;

      submitBtn.disabled = true;
      input.disabled = true;

      overlay.classList.add('active');
      overlayText.textContent = text;
      overlayText.classList.remove('golden');

      var inputRect = input.getBoundingClientRect();
      overlayText.style.position = 'absolute';
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

      spawnCloudParticles();

      overlayText.offsetHeight;
      overlayText.style.transition = 'all 1.8s cubic-bezier(0.25, 0.1, 0.25, 1)';
      overlayText.style.left = '50%';
      overlayText.style.top = '50%';
      overlayText.style.transform = 'translate(-50%, -50%)';
      overlayText.style.width = 'auto';
      overlayText.style.maxWidth = '600px';
      overlayText.style.fontSize = '';
      overlayText.style.textAlign = 'center';

      overlayText.addEventListener('transitionend', function onRiseComplete(e) {
        if (e.propertyName !== 'left') return;
        overlayText.removeEventListener('transitionend', onRiseComplete);

        overlayText.classList.add('golden');
        spawnBeam();

        setTimeout(function () {
          var galleryRect = gallery.getBoundingClientRect();
          overlayText.style.transition = 'all 0.8s cubic-bezier(0.55, 0, 0.45, 1)';
          overlayText.style.top = (galleryRect.top + 40) + 'px';
          overlayText.style.opacity = '0';
          overlayText.style.transform = 'translate(-50%, 0)';

          overlayText.addEventListener('transitionend', function onDescendComplete(e) {
            if (e.propertyName !== 'top') return;
            overlayText.removeEventListener('transitionend', onDescendComplete);

            var messages = loadMessages();
            messages.push({
              id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
              text: text,
              timestamp: Date.now()
            });
            saveMessages(messages);

            overlay.classList.remove('active');
            overlayText.textContent = '';
            overlayText.classList.remove('golden');
            overlayText.style.cssText = '';

            clearParticles();

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
        }, 400);
      });
    }

    function spawnCloudParticles() {
      var count = 8;
      var inputRect = input.getBoundingClientRect();
      var startX = inputRect.left + inputRect.width / 2;
      var startY = inputRect.top;

      for (var i = 0; i < count; i++) {
        var particle = document.createElement('div');
        particle.className = 'cloud-particle';
        particle.style.left = (startX + (Math.random() - 0.5) * 60) + 'px';
        particle.style.top = (startY + Math.random() * 20) + 'px';
        particle.style.animationDelay = (i * 0.12) + 's';
        particle.style.animationDuration = (2 + Math.random() * 1.5) + 's';
        overlay.appendChild(particle);
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

    function clearParticles() {
      var particles = overlay.querySelectorAll('.cloud-particle, .golden-beam');
      particles.forEach(function (p) { p.parentNode.removeChild(p); });
    }

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
