/* THE PLEASANT STREET PREVIEW. Sample homes from listings.json on a map and in a list.
   Typing a city or state filters both; moving the map offers "Search this area".
   A pin or a card opens the home's own website in a new tab. A page with only the map
   (Pleasant Street's own) gets the pins and their cards, without the list and the search. */
(function () {
  var listEl = document.getElementById('ps-list'), countEl = document.getElementById('ps-count');
  var q = document.getElementById('ps-q'), areaBtn = document.getElementById('ps-area');
  var map = L.map('ps-map', { scrollWheelZoom: false }).setView([39.5, -98.5], 4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  var homes = [], area = null;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function card(h) {
    return '<a class="ps-card" href="' + esc(h.url) + '" target="_blank" rel="noopener">' +
      '<img src="' + esc(h.photo) + '" alt="" loading="lazy" decoding="async" width="560" height="350">' +
      '<span class="ps-card__name">' + esc(h.name) + '</span><span class="ps-card__place">' + esc(h.place) + '</span></a>';
  }
  /* A place matches when a word of it starts with what was typed, or the typed word is
     its state's full name: "ca" and "california" both find San Francisco, not Cape Cod. */
  var STATES = { ny: 'new york', fl: 'florida', hi: 'hawaii', va: 'virginia', ma: 'massachusetts', tn: 'tennessee',
                 pa: 'pennsylvania', ca: 'california', il: 'illinois', vt: 'vermont' };
  function matches(place, t) {
    var words = place.toLowerCase().split(/[\s,]+/), state = words[words.length - 1];
    if (STATES[state] && STATES[state].indexOf(t) === 0 && t.length > 2) return true;
    if (t.length <= 2) return state === t;
    return place.toLowerCase().split(/,\s*/)[0].indexOf(t) === 0 || words.some(function (w) { return w.indexOf(t) === 0; });
  }
  function show() {
    var t = q ? q.value.trim().toLowerCase() : '';
    var shown = homes.filter(function (h) {
      if (t && !matches(h.place, t)) return false;
      if (area && !area.contains(h.marker.getLatLng())) return false;
      return true;
    });
    homes.forEach(function (h) { if (shown.indexOf(h) < 0) map.removeLayer(h.marker); else h.marker.addTo(map); });
    if (!listEl) return shown;
    listEl.innerHTML = shown.map(card).join('') || '<p class="ps-none">No homes here yet. Try another place, or zoom out.</p>';
    countEl.textContent = shown.length === 1 ? '1 home' : shown.length + ' homes';
    return shown;
  }
  if (q) q.addEventListener('input', function () {
    area = null;
    var shown = show();
    if (q.value.trim() && shown.length) { map.fitBounds(L.latLngBounds(shown.map(function (h) { return h.marker.getLatLng(); })).pad(0.3), { maxZoom: 10 }); }
  });
  /* Only the guest's own move offers a new area: a drag, or the + and − buttons. */
  function offer() { if (homes.length && areaBtn) areaBtn.hidden = false; }
  map.on('dragend', offer);
  /* The map's box can change size after it is drawn (the list, the window): redraw so no grey is left. */
  if (window.ResizeObserver) new ResizeObserver(function () { map.invalidateSize(); }).observe(map.getContainer());
  window.addEventListener('load', function () { map.invalidateSize(); });
  /* Captured before the map's own controls stop the click from travelling further. */
  map.getContainer().addEventListener('pointerdown', function (e) { if (e.target.closest('.leaflet-control-zoom')) offer(); }, true);
  if (areaBtn) areaBtn.addEventListener('click', function () { area = map.getBounds(); q.value = ''; areaBtn.hidden = true; show(); });
  /* The homes: the map's data-src, else the sample homes (the dev street points it at its own database). */
  fetch(map.getContainer().dataset.src || '/pleasant-street/listings.json').then(function (r) { return r.json(); }).then(function (list) {
    homes = list.map(function (h) {
      h.marker = L.marker([h.lat, h.lng], { title: h.name, alt: h.name })
        .bindPopup('<div class="ps-pop">' + card(h) + '</div>', { minWidth: 220 });
      return h;
    });
    show();
    /* Open on the mainland: Hawaii in the same view zooms the map out past the edge of the tiles. */
    var main = homes.filter(function (h) { return h.lng > -130; });
    map.fitBounds(L.latLngBounds((main.length ? main : homes).map(function (h) { return h.marker.getLatLng(); })).pad(0.1));
  });
})();

/* The counter (Pleasant Street and the walk): once it is in view, each digit rolls up slowly and stops on data-count. */
(function () {
  var c = document.querySelector('.ps-count'), n = c && c.dataset.count;
  if (!c || !/^\d{1,3}$/.test(n)) return;
  var s = ('000' + n).slice(-3), strips = c.querySelectorAll('.ps-count__d > span');
  function roll() { strips.forEach(function (e, i) { e.style.transform = 'translateY(' + (-s[i] * 32) + 'px)'; }); }
  if (!window.IntersectionObserver) return roll();
  var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { roll(); io.disconnect(); } }, { threshold: 0.6 });
  io.observe(c);
})();
