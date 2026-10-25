/* THE CHAT BUBBLE PULSES. Elfsight draws its launcher inside its own shadow root, which page
   CSS cannot reach, so the pulse is a style placed inside that root. A coral ring swells
   out of the bubble and fades; off for visitors who ask for reduced motion. */
(function () {
  var CSS = '[class^="launcher-floating-container__Container"]::after {' +
    ' content: ""; position: absolute; inset: 0; border-radius: 50%; pointer-events: none;' +
    ' animation: lazy-pulse 2.4s ease-out infinite; }' +
    '@keyframes lazy-pulse { 0% { box-shadow: 0 0 0 0 rgba(249,66,111,.55); }' +
    ' 70% { box-shadow: 0 0 0 18px rgba(249,66,111,0); } 100% { box-shadow: 0 0 0 0 rgba(249,66,111,0); } }' +
    '@media (prefers-reduced-motion: reduce) { [class^="launcher-floating-container__Container"]::after { animation: none; } }';
  function dress() {
    var done = false;
    Array.prototype.forEach.call(document.querySelectorAll('*'), function (el) {
      var root = el.shadowRoot;
      if (!root || !root.querySelector('[class^="launcher-floating-container__Container"]')) return;
      done = true;
      if (!root.__lazyNamed) {   /* their panel is role="dialog" with no name; Elfsight redraws it, so keep watching */
        root.__lazyNamed = true;
        var name = function () {
          Array.prototype.forEach.call(root.querySelectorAll('[role="dialog"], [role="alertdialog"]'), function (d) {
            if (!d.hasAttribute('aria-label') && !d.hasAttribute('aria-labelledby')) d.setAttribute('aria-label', 'LAZY chat');
          });
        };
        name();
        new MutationObserver(name).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['role'] });
      }
      if (root.querySelector('style[data-lazy-pulse]')) return;
      var s = document.createElement('style');
      s.setAttribute('data-lazy-pulse', '');
      s.textContent = CSS;
      root.appendChild(s);
    });
    return done;
  }
  /* THE CHATBOT LOADS LATER. Its script is about 1 MB; it is asked for on the visitor's
     first move, once. Their script fails now and then, more often in
     Safari: two retries, spaced, then it stops. */
  var SRC = 'https://elfsightcdn.com/platform.js';
  var EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
  var OPTS = { passive: true, capture: true };
  var asked = false;
  function inject() {
    var s = document.createElement('script');
    s.src = SRC;
    s.async = true;
    document.head.appendChild(s);
  }
  function revive() {
    var hosts = document.querySelectorAll("[class*='elfsight-app-']");
    if (Array.prototype.some.call(hosts, function (h) { return !h.querySelector('.es-embed-root'); })) inject();
  }
  function load() {
    if (asked) return;
    asked = true;
    EVENTS.forEach(function (e) { window.removeEventListener(e, load, OPTS); });
    inject();
    setTimeout(revive, 5000);
    setTimeout(revive, 12000);
    /* The launcher arrives a few seconds after the script; keep looking until it does. */
    var tries = 0, timer = setInterval(function () { if (dress() || ++tries > 60) clearInterval(timer); }, 500);
  }
  EVENTS.forEach(function (e) { window.addEventListener(e, load, OPTS); });

  /* OPEN THE CHAT from a page button: load it if it has not loaded, then press its launcher. */
  window.lazyOpenChat = function () {
    load();
    var tries = 0;
    (function press() {
      var hit = null;
      Array.prototype.some.call(document.querySelectorAll('*'), function (el) {
        var c = el.shadowRoot && el.shadowRoot.querySelector('[class^="launcher-floating-container__Container"]');
        if (c) hit = c.querySelector('button') || c;
        return !!hit;
      });
      if (hit) hit.click(); else if (++tries < 60) setTimeout(press, 250);
    })();
  };
})();
