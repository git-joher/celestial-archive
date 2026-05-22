// Celestial Archive — Ezoic Ad Placeholder Loader
// Placeholders only activate when CELESTIAL_ADS_ENABLED === 1 (set in config.js)

function initEzoicAds(pageConfig) {
  if (typeof CELESTIAL_ADS_ENABLED === 'undefined' || CELESTIAL_ADS_ENABLED !== 1) return;
  if (!pageConfig || !pageConfig.placements) return;

  pageConfig.placements.forEach(function (p) {
    var target = document.querySelector(p.selector);
    if (!target) return;
    var div = document.createElement('div');
    div.id = 'ezoic-pub-ad-placeholder-' + p.id;
    target.insertAdjacentElement(p.position || 'beforebegin', div);
    ezstandalone.cmd.push(function () {
      ezstandalone.showAds(p.id);
    });
  });
}
