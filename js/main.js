/**
 * Celestial Archive — Main JavaScript
 * Handles scroll-triggered animations via Intersection Observer.
 */

(function () {
  'use strict';

  /* ============================================================
     Intersection Observer — 滚动淡入动画
     ============================================================ */
  const fadeEls = document.querySelectorAll('.fade-in');

  if (fadeEls.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry, index) {
          if (!entry.isIntersecting) return;

          /* 卡片从左至右依次淡入：使用元素在 NodeList 中的索引做延迟 */
          var el = entry.target;
          var allFadeEls = Array.from(fadeEls);
          var i = allFadeEls.indexOf(el);
          var delay = (i % 5) * 100; /* 每行最多5张卡片，逐张延迟100ms */

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
    /* 无 Observer 支持时直接显示所有元素 */
    fadeEls.forEach(function (el) {
      el.classList.add('visible');
    });
  }
})();
