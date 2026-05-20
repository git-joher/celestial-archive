/**
 * Celestial Archive — Main JavaScript
 * Handles scroll-triggered animations, footer deity links,
 * site-wide navigation, and breadcrumb generation.
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
        + '<span class="pantheon-card-status ' + (d.status === 'live' ? 'live' : '') + '">' + (d.status === 'live' ? 'Explore the Archive' : 'Coming Soon') + '</span>'
        + '</div>'
        + '</a>';
    });
    pantheonGrid.innerHTML = cardsHtml;
  }

  /* ============================================================
     Site Navigation — injected once, shared across all pages
     ============================================================ */
  function injectSiteNav() {
    if (document.getElementById('site-nav')) return;


    var path = window.location.pathname;

	// Remove old body-level navs (custom per-deity navs)
    var oldNavs = document.querySelectorAll('body > nav:not(.breadcrumb)');
    for (var i = 0; i < oldNavs.length; i++) { oldNavs[i].remove(); }

    // Determine active link
    var pathLower = path.toLowerCase();
    var active = '';
    if (pathLower.indexOf('/deities/') !== -1 || pathLower.indexOf('/pantheon/') !== -1) active = 'gods.html';
    else if (pathLower.indexOf('/topics/') !== -1) {
      var topicFile = pathLower.split('/').pop().replace('.html', '');
      var topicMap = {
        'chinese-gods': 'gods.html',
        'jade-emperor': 'gods.html',
        'journey-west-characters': 'characters.html',
        'nezha-vs-sun-wukong': 'top-lists.html',
        'sun-wukong-vs-erlang-shen': 'top-lists.html',
        'chinese-mythology-vs-greek-mythology': 'top-lists.html'
      };
      active = topicMap[topicFile] || 'stories.html';
    }

    var navItems = [
      { name: 'Home', href: 'index.html' },
      { name: 'Gods', href: 'gods.html' },
      { name: 'Characters', href: 'characters.html' },
      { name: 'Stories', href: 'stories.html' },
      { name: 'Top Lists', href: 'top-lists.html' }
    ];

    var linksHtml = '';
    navItems.forEach(function (item) {
      var cls = item.href === active ? ' class="active"' : '';
      linksHtml += '<a href="' + rootPrefix + item.href + '"' + cls + '>' + item.name + '</a>';
    });

    var html =
      '<nav class="site-nav" id="site-nav" aria-label="Site navigation">'
      + '<div class="site-nav-inner">'
      + '<a href="' + rootPrefix + 'index.html" class="site-nav-brand">Celestial Archive</a>'
      + '<div class="site-nav-links">' + linksHtml + '</div>'
      + '</div>'
      + '</nav>';

    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    document.body.insertBefore(wrapper.firstElementChild, document.body.firstChild);
  }

  /* ============================================================
     Breadcrumb — generated from URL path
     ============================================================ */
  function injectBreadcrumb() {
    if (document.getElementById('site-breadcrumb')) return;

    var path = window.location.pathname;
    var pathLower = path.toLowerCase();
    var relPath = path.replace(/^\//, '').replace(/\/+$/, '') || 'index.html';
    var segments = relPath.split('/').filter(Boolean);
    var crumbs = [{ name: 'Home', url: rootPrefix + 'index.html' }];

    var isDeities = pathLower.indexOf('/deities/') !== -1;
    var isTopics = pathLower.indexOf('/topics/') !== -1;
    var isPantheon = pathLower.indexOf('/pantheon/') !== -1;

    // Homepage — no breadcrumb
    var lastSeg = segments[segments.length - 1];
    if (lastSeg === 'index.html' && !isDeities && !isTopics && !isPantheon) return;

    if (isDeities && segments.length >= 2) {
      var deityIdx = -1;
      for (var d = 0; d < segments.length; d++) {
        if (segments[d].toLowerCase() === 'deities') { deityIdx = d; break; }
      }
      var deitySlug = segments[deityIdx + 1];
      var deity = (typeof CELESTIAL_DEITIES !== 'undefined') ?
        CELESTIAL_DEITIES.find(function (d) { return d.slug === deitySlug; }) : null;
      var deityName = deity ? deity.name : deitySlug.replace(/-/g, ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); });

      var remaining = segments.slice(deityIdx + 2).filter(function (s) { return s !== 'index.html'; });
      if (remaining.length === 0) {
        crumbs.push({ name: deityName, url: '' });
      } else {
        crumbs.push({ name: deityName, url: rootPrefix + 'deities/' + deitySlug + '/index.html' });
        var subFile = remaining[0].replace(/\.html$/, '');
        var pageNames = {
          'origins': 'Origins', 'battle': 'Battles', 'arsenal': 'Arsenal', 'legacy': 'Legacy',
          'journey': 'The Journey', 'legend': 'Legend', 'folk': 'Folk Lore',
          'mercy': 'Acts of Mercy', 'teachings': 'Teachings', 'court': 'Celestial Court',
          'worship': 'Worship', 'creation': 'Creation', 'sky-repair': 'The Sky Repair',
          'stones': 'Five-Colored Stones', 'flame-mountain': 'Flaming Mountain',
          'family': 'The Demon Family', 'elixir': 'Elixir of Immortality',
          'furnace': 'Eight Trigrams Furnace', 'redemption': 'Redemption', 'symbolism': 'Symbolism'
        };
        var pageName = pageNames[subFile] || subFile.charAt(0).toUpperCase() + subFile.slice(1);
        crumbs.push({ name: pageName, url: '' });
      }
    } else if (isTopics) {
      var title = document.title.replace(/\s*\|\s*Celestial Archive\s*$/i, '').trim();
      crumbs.push({ name: title, url: '' });
    } else {
      var rootFile = segments[segments.length - 1].replace(/\.html$/, '');
      if (rootFile === 'index' && segments.length >= 2) {
        rootFile = segments[segments.length - 2];
      }
      var rootNames = {
        'about': 'About Us', 'contact': 'Contact Us', 'privacy-policy': 'Privacy Policy',
        'three-realms-hierarchy': 'Three Realms Hierarchy',
        'gods': 'Gods', 'characters': 'Characters', 'stories': 'Stories',
        'top-lists': 'Top Lists', 'pantheon': 'Pantheon'
      };
      var name = rootNames[rootFile] || rootFile.charAt(0).toUpperCase() + rootFile.slice(1);
      crumbs.push({ name: name, url: '' });
    }

    // Build breadcrumb HTML
    var html = '<nav class="breadcrumb" id="site-breadcrumb" aria-label="Breadcrumb"><ol class="breadcrumb-list">';
    crumbs.forEach(function (crumb) {
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
    var target = document.getElementById('site-nav') || document.body.firstChild;
    if (target.nextSibling) {
      document.body.insertBefore(wrapper.firstElementChild, target.nextSibling);
    } else {
      document.body.appendChild(wrapper.firstElementChild);
    }

    // Inject JSON-LD BreadcrumbList
    var origin = window.location.origin;
    var items = crumbs.map(function (crumb, i) {
      var name = i === 0 ? 'Celestial Archive' : crumb.name;
      var itemUrl;
      if (i === 0) {
        itemUrl = origin + '/';
      } else if (crumb.url) {
        itemUrl = new URL(crumb.url, origin + window.location.pathname).href;
      } else {
        itemUrl = window.location.href;
      }
      return { '@type': 'ListItem', position: i + 1, name: name, item: itemUrl };
    });

    var ldJson = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items
    };

    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'jsonld-breadcrumb';
    script.textContent = JSON.stringify(ldJson);
    document.head.appendChild(script);
  }

  injectSiteNav();
  injectBreadcrumb();
})();
