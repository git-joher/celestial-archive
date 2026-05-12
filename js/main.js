/**
 * Celestial Archive — Main JavaScript
 * Handles scroll-triggered animations and footer deity links.
 */

(function () {
  'use strict';

  /* ============================================================
     Intersection Observer — scroll fade-in animations
     ============================================================ */
  var fadeEls = document.querySelectorAll('.fade-in');

  if (fadeEls.length && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry, index) {
          if (!entry.isIntersecting) return;

          var el = entry.target;
          var allFadeEls = Array.from(fadeEls);
          var i = allFadeEls.indexOf(el);
          var delay = (i % 5) * 100;

          setTimeout(function () {
            el.classList.add('visible');
          }, delay);

          observer.unobserve(el);
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    fadeEls.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    fadeEls.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* ============================================================
     Derive site root from main.js script src
     e.g. "js/main.js" → "", "../../js/main.js" → "../../"
     Works regardless of file:// or HTTP hosting.
     ============================================================ */
  var rootPrefix = '';
  var scripts = document.getElementsByTagName('script');
  for (var s = 0; s < scripts.length; s++) {
    var src = scripts[s].getAttribute('src') || '';
    var idx = src.indexOf('js/main.js');
    if (idx !== -1) {
      rootPrefix = src.substring(0, idx);
      break;
    }
  }

  /* ============================================================
     Footer — populate deity links from registry
     ============================================================ */
  var deityNavs = document.querySelectorAll('[data-footer="deities"]');
  if (deityNavs.length && typeof CELESTIAL_DEITIES !== 'undefined') {
    var linksHtml = '';
    CELESTIAL_DEITIES.forEach(function (d) {
      var href = d.status === 'live' ? rootPrefix + 'deities/' + d.slug + '/index.html' : '#';
      var label = d.name + (d.status === 'coming' ? ' (Coming Soon)' : '');
      linksHtml += '<a href="' + href + '">' + label + '</a>';
    });
    deityNavs.forEach(function (nav) {
      nav.innerHTML = linksHtml;
    });
  }

  /* ============================================================
     Pantheon grid — populate landing page deity cards
     ============================================================ */
  var pantheonGrid = document.getElementById('pantheon-grid');
  if (pantheonGrid && typeof CELESTIAL_DEITIES !== 'undefined') {
    var cardsHtml = '';
    CELESTIAL_DEITIES.forEach(function (d) {
      var href = d.status === 'live' ? rootPrefix + 'deities/' + d.slug + '/index.html' : '#';
      var statusClass = d.status === 'live' ? 'live' : '';
      var statusLabel = d.status === 'live' ? 'Explore the Archive' : 'Coming Soon';
      cardsHtml +=
        '<a href="' + href + '" class="pantheon-card' + (d.status !== 'live' ? '" aria-disabled="true"' : '"') + '>'
        + '<div class="pantheon-card-art" style="background:' + d.avatarBg + ';">'
        + '<div class="pantheon-card-avatar">' + d.avatarInitial + '</div>'
        + '</div>'
        + '<div class="pantheon-card-body">'
        + '<div class="pantheon-card-name">' + d.name + '</div>'
        + '<div class="pantheon-card-name-zh">' + d.nameZh + '</div>'
        + '<div class="pantheon-card-title">' + d.title + '</div>'
        + '<p class="pantheon-card-desc">' + d.description + '</p>'
        + '<span class="pantheon-card-status ' + statusClass + '">' + statusLabel + '</span>'
        + '</div>'
        + '</a>';
    });
    pantheonGrid.innerHTML = cardsHtml;
  }
})();
