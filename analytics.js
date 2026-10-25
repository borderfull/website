/* CONSENT BANNER (bottom of file): GA starts with analytics_storage 'denied' (set inline in <head>);
   choice is saved in localStorage 'pt-consent' and sent via gtag('consent','update').
   analytics.js — GA4 custom tracking (shared by every page).
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

  /* ---- Cookie consent banner (Consent Mode v2) ---- */
  var KEY='pt-consent';
  function saved(){try{return localStorage.getItem(KEY);}catch(e){return null;}}
  function choose(v){
    try{localStorage.setItem(KEY,v);}catch(e){}
    if(typeof window.gtag==='function')window.gtag('consent','update',{analytics_storage:v==='granted'?'granted':'denied'});
    var b=document.getElementById('pt-consent');if(b)b.remove();
  }
  var TXT={en:{p:'This site uses Google Analytics cookies to learn which sections are read. No ads, no personal data. Allow?',y:'Accept',n:'Decline',c:'Cookie settings'},hi:{p:'यह साइट यह जानने के लिए Google Analytics कुकीज़ का उपयोग करती है कि कौन-से अनुभाग पढ़े जाते हैं। कोई विज्ञापन नहीं, कोई व्यक्तिगत डेटा नहीं। अनुमति दें?',y:'स्वीकार करें',n:'अस्वीकार करें',c:'कुकी सेटिंग'}};
  function L(){return document.documentElement.lang==='hi'?TXT.hi:TXT.en;}
  function relabel(){
    var d=document.getElementById('pt-consent'),t=L();
    if(d){d.querySelector('p').textContent=t.p;d.querySelector('.y').textContent=t.y;d.querySelector('.n').textContent=t.n;}
    var c=document.getElementById('pt-cookie-link');if(c)c.textContent=t.c;
  }
  new MutationObserver(relabel).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  function banner(){
    if(document.getElementById('pt-consent'))return;
    var st=document.createElement('style');
    st.textContent='#pt-consent{position:fixed;left:20px;bottom:20px;z-index:9999;max-width:380px;background:#f7f3ea;color:#1c1814;border:1px solid #c9bda5;padding:18px 20px;font:400 14px/1.55 Spectral,Georgia,serif;box-shadow:0 8px 30px rgba(0,0,0,.12)}#pt-consent p{margin:0 0 14px}#pt-consent a{color:#9a4f33}#pt-consent .r{display:flex;gap:10px}#pt-consent button{font:400 12px/1 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase;padding:11px 16px;min-height:44px;cursor:pointer;border:1px solid #1c1814;background:#1c1814;color:#f7f3ea}#pt-consent button.n{background:transparent;color:#1c1814}#pt-consent button:hover{opacity:.8}@media(max-width:480px){#pt-consent{left:12px;right:12px;bottom:12px;max-width:none}}';
    document.head.appendChild(st);
    var d=document.createElement('div');d.id='pt-consent';d.setAttribute('role','dialog');d.setAttribute('aria-label','Cookie consent');
    d.innerHTML='<p></p><div class="r"><button type="button" class="y"></button><button type="button" class="n"></button></div>';
    d.querySelector('.y').onclick=function(){choose('granted');};
    d.querySelector('.n').onclick=function(){choose('denied');};
    document.body.appendChild(d);relabel();
  }
  function footerLink(){
    var f=document.querySelector('footer');if(!f)return;
    var b=document.createElement('button');b.type='button';b.id='pt-cookie-link';b.textContent=L().c;
    b.style.cssText='background:none;border:0;padding:8px 0;margin:0;font:inherit;color:inherit;opacity:.6;cursor:pointer;text-decoration:underline;text-underline-offset:3px';
    b.onclick=banner;f.appendChild(b);
  }
  function initConsent(){footerLink();if(!saved()){var show=function(){setTimeout(banner,3500);};if(document.readyState==='complete')show();else window.addEventListener('load',show,{once:true});}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initConsent);else initConsent();
})();
