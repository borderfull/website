/* analytics.js — GA4 custom tracking (shared by every page).
   Requires the gtag snippet in <head> (already present on each page).
   Events sent:
   • section_view        – section ≥50% visible for 2 continuous seconds; once per page load.
                           params: section_name, page_path
   • section_engagement  – total seconds a section was ≥50% visible while the tab was in focus;
                           sent once per section when the visitor leaves/hides the page.
                           params: section_name, page_path, engagement_seconds
   The road game sends game_start / game_end itself (see road-game.js). */
(function () {
  'use strict';
  var DWELL_MS = 2000, THRESHOLD = 0.5;
  function send(name, params) {
    params = params || {}; params.page_path = location.pathname;
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
  }
  window.trackEvent = send;
  if (!('IntersectionObserver' in window)) return;

  var state = new Map(); // el -> {name, timer, fired, visibleSince, total}
  function nameOf(el) { return el.getAttribute('data-track') || el.id; }
  function visibleNow() { return document.visibilityState === 'visible'; }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var s = state.get(e.target);
      if (e.isIntersecting && e.intersectionRatio >= THRESHOLD) {
        if (visibleNow() && s.visibleSince == null) s.visibleSince = performance.now();
        if (!s.fired && !s.timer) {
          s.timer = setTimeout(function () {         // 2s continuous dwell reached
            s.fired = true; s.timer = null;
            send('section_view', { section_name: s.name });
          }, DWELL_MS);
        }
      } else {
        if (s.timer) { clearTimeout(s.timer); s.timer = null; } // scrolled past too fast
        if (s.visibleSince != null) { s.total += performance.now() - s.visibleSince; s.visibleSince = null; }
      }
    });
  }, { threshold: [0, THRESHOLD, 1] });

  document.querySelectorAll('main section[id], footer[id]').forEach(function (el) {
    state.set(el, { name: nameOf(el), timer: null, fired: false, visibleSince: null, total: 0 });
    io.observe(el);
  });

  function flush() {
    var now = performance.now();
    state.forEach(function (s) {
      if (s.visibleSince != null) { s.total += now - s.visibleSince; s.visibleSince = null; }
      if (s.timer) { clearTimeout(s.timer); s.timer = null; }
      var secs = Math.round(s.total / 1000);
      if (secs >= 1) send('section_engagement', { section_name: s.name, engagement_seconds: secs });
      s.total = 0;
    });
  }
  // Tab hidden = flush totals; on return, resume timing for sections still in view.
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') flush();
    else state.forEach(function (s, el) {
      var r = el.getBoundingClientRect(), vh = window.innerHeight;
      var vis = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      if (vis >= r.height * THRESHOLD || vis >= vh * THRESHOLD) s.visibleSince = performance.now();
    });
  });
  window.addEventListener('pagehide', flush);
})();
