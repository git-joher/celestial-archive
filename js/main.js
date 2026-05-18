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
     Site structure config for nav + breadcrumbs
     ============================================================ */
  var SITE_STRUCTURE = {
    nav: [
      { name: 'Home',       href: 'index.html' },
      { name: 'Gods',       href: 'gods.html' },
      { name: 'Characters', href: 'characters.html' },
      { name: 'Stories',    href: 'stories.html' },
      { name: 'Top Lists',  href: 'top-lists.html' }
    ],
    categoryForTopic: {
      'chinese-gods': 'gods',
      'jade-emperor': 'gods',
      'journey-west-characters': 'characters',
      'nezha-vs-sun-wukong': 'top-lists',
      'sun-wukong-vs-erlang-shen': 'top-lists',
      'chinese-mythology-vs-greek-mythology': 'top-lists'
    },
    pageName: {
      'origins':'Origins','battle':'Battles','arsenal':'Arsenal','legacy':'Legacy',
      'journey':'The Journey','legend':'Legend','folk':'Folk Lore',
      'mercy':'Acts of Mercy','teachings':'Teachings','court':'Celestial Court',
      'worship':'Worship','creation':'Creation','sky-repair':'The Sky Repair',
      'stones':'Five-Colored Stones','flame-mountain':'Flaming Mountain',
      'family':'The Demon Family','elixir':'Elixir of Immortality',
      'furnace':'Eight Trigrams Furnace','redemption':'Redemption',
      'symbolism':'Symbolism'
    },
    rootPageName: {
      'about':'About Us','contact':'Contact Us','privacy-policy':'Privacy Policy',
      'three-realms-hierarchy':'Three Realms Hierarchy',
      'gods':'Gods','characters':'Characters','stories':'Stories','top-lists':'Top Lists'
    }
  };

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

  /* ============================================================
     Global Nav injection
     ============================================================ */
  function injectGlobalNav() {
    if (document.getElementById('global-nav')) return;

    // Remove old body-level navs (custom per-deity navs, old nav-bar, tp-nav)
    var oldNavs = document.querySelectorAll('body > nav:not(.breadcrumb)');
    for (var i = 0; i < oldNavs.length; i++) { oldNavs[i].remove(); }

    // Detect current path category for active state
    var path = window.location.pathname;
    var pathLower = path.toLowerCase();
    var activeHref = '';

    if (pathLower.indexOf('/deities/') !== -1) activeHref = 'gods.html';
    else if (pathLower.indexOf('/topics/') !== -1) {
      var topicFile = pathLower.split('/').pop().replace('.html','');
      var cat = SITE_STRUCTURE.categoryForTopic[topicFile] || 'stories';
      activeHref = cat + '.html';
    }
    var activeFile = activeHref.split('/').pop();

    var linksHtml = '';
    SITE_STRUCTURE.nav.forEach(function(item) {
      var itemFile = item.href.split('/').pop();
      var cls = itemFile === activeFile ? ' class="active"' : '';
      linksHtml += '<a href="' + rootPrefix + item.href + '"' + cls + '>' + item.name + '</a>';
    });

    var html =
      '<nav class="global-nav" id="global-nav" aria-label="Site navigation">'
      + '<div class="global-nav-inner">'
      + '<a href="' + rootPrefix + 'index.html" class="global-nav-brand">Celestial Archive</a>'
      + '<div class="global-nav-links">' + linksHtml + '</div>'
      + '</div>'
      + '</nav>';

    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    document.body.insertBefore(wrapper.firstElementChild, document.body.firstChild);
  }

  /* ============================================================
     Breadcrumb generation from URL path
     ============================================================ */
  function generateBreadcrumbs() {
    if (document.getElementById('site-breadcrumb')) return;

    var path = window.location.pathname;
    var relPath = path.replace(/^\//, '').replace(/\/+$/, '') || 'index.html';

    var segments = relPath.split('/').filter(Boolean);
    var crumbs = [{ name: 'Home', url: rootPrefix + 'index.html' }];

    if (segments.length === 0 || (segments.length === 1 && segments[0] === 'index.html')) {
      // Homepage — no breadcrumb needed
      return;
    } else if (segments[0] === 'deities' && segments.length >= 2) {
      crumbs.push({ name: 'Gods', url: rootPrefix + 'gods.html' });
      var deitySlug = segments[1];
      var deity = (typeof CELESTIAL_DEITIES !== 'undefined') ?
        CELESTIAL_DEITIES.find(function(d) { return d.slug === deitySlug; }) : null;
      var deityName = deity ? deity.name : deitySlug.replace(/-/g, ' ').replace(/\b\w/g, function(l){ return l.toUpperCase(); });
      crumbs.push({ name: deityName, url: rootPrefix + 'deities/' + deitySlug + '/index.html' });

      if (segments.length >= 3) {
        var subFile = segments[2].replace(/\.html$/, '');
        if (subFile !== 'index') {
          var pageName = SITE_STRUCTURE.pageName[subFile] || subFile.charAt(0).toUpperCase() + subFile.slice(1);
          crumbs.push({ name: pageName, url: '' });
        }
      }
    } else if (segments[0] === 'topics') {
      var topicFile = segments[segments.length - 1].replace(/\.html$/, '');
      var catKey = SITE_STRUCTURE.categoryForTopic[topicFile] || 'stories';
      var catNames = { 'gods': 'Gods', 'characters': 'Characters', 'top-lists': 'Top Lists', 'stories': 'Stories' };
      crumbs.push({ name: catNames[catKey] || 'Stories', url: rootPrefix + catKey + '.html' });
      var title = document.title.replace(/\s*\|\s*Celestial Archive\s*$/i, '').trim();
      crumbs.push({ name: title, url: '' });
    } else {
      var rootFile = segments[segments.length - 1].replace(/\.html$/, '');
      var name = SITE_STRUCTURE.rootPageName[rootFile] || rootFile.charAt(0).toUpperCase() + rootFile.slice(1);
      crumbs.push({ name: name, url: '' });
    }

    // Build HTML
    var html = '<nav class="breadcrumb" id="site-breadcrumb" aria-label="Breadcrumb"><ol class="breadcrumb-list">';
    crumbs.forEach(function(crumb, i) {
      html += '<li class="breadcrumb-item">';
      if (crumb.url) {
        html += '<a href="' + crumb.url + '">' + crumb.name + '</a>';
      } else {
        html += '<span class="breadcrumb-current">' + crumb.name + '</span>';
      }
      html += '</li>';
    });
    html += '</ol></nav>';

    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    var target = document.getElementById('global-nav') || document.body.firstChild;
    if (target.nextSibling) {
      document.body.insertBefore(wrapper.firstElementChild, target.nextSibling);
    } else {
      document.body.appendChild(wrapper.firstElementChild);
    }
  }

  injectGlobalNav();
  generateBreadcrumbs();
})();
