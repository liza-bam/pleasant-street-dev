/* PLEASANT STREET: the homes from street.json on a map and in a list.
   Typing a city or state filters both; moving the map offers "Search this area".
   A pin or a card opens the home's own website in a new tab. */
(function () {
  var listEl = document.getElementById('ps-list'), countEl = document.getElementById('ps-count');
  var q = document.getElementById('ps-q'), areaBtn = document.getElementById('ps-area');
  var sleeps = document.getElementById('ps-sleeps'), sleepsOut = document.getElementById('ps-sleeps-out');
  var pills = document.getElementById('ps-type'), types = [];
  var welcome = document.getElementById('ps-welcome'), needs = [];
  var map = L.map('ps-map', { scrollWheelZoom: false }).setView([39.5, -98.5], 4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  var homes = [], area = null;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function card(h, missing) {
    return '<a class="ps-card" href="' + esc(h.url) + '" target="_blank" rel="noopener">' +
      '<img src="' + esc(h.photo) + '" alt="" loading="lazy" decoding="async" width="560" height="350">' +
      '<span class="ps-card__name">' + esc(h.name) + '</span><span class="ps-card__place">' + esc(h.place) + '</span>' +
      (missing && missing.length ? '<span class="ps-card__missing">Doesn’t say: ' + esc(missing.join(', ')) + '</span>' : '') + '</a>';
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
  /* Each filter sorts a home three ways: it says yes (a match), it says no (left out), or it does not
     say (it may fit). Location and the map area are always known, so they only include or leave out. */
  function show() {
    var t = q ? q.value.trim().toLowerCase() : '';
    var n = sleeps && +sleeps.value > 1 ? +sleeps.value : 0;   /* 1 on the slider is every home */
    var fits = [], maybe = [];
    homes.forEach(function (h) {
      h.missing = [];
      var out = (t && !matches(h.place, t)) || (area && !area.contains(h.marker.getLatLng()));
      if (!out && n) { if (h.guests == null || h.guests === '') h.missing.push('how many it sleeps'); else if (+h.guests < n) out = true; }
      if (!out && types.length) { if (!h.type) h.missing.push('type'); else if (types.indexOf(h.type) < 0) out = true; }
      needs.forEach(function (k) {
        if (out) return;
        if (!h[k]) h.missing.push(k === 'kids' ? 'kids OK' : 'pets OK');
        else if (!/^y/i.test(h[k])) out = true;
      });
      if (out) map.removeLayer(h.marker);
      else { h.marker.addTo(map); h.marker.setOpacity(h.missing.length ? 0.55 : 1); (h.missing.length ? maybe : fits).push(h); }
    });
    var shown = fits.concat(maybe);
    if (!listEl) return shown;
    listEl.innerHTML = (fits.map(function (h) { return card(h); }).join('') ||
        (maybe.length ? '' : '<p class="ps-none">No homes here yet. Try another place, or zoom out.</p>')) +
      (maybe.length ? '<h2 class="ps-group">May fit: not every fact is listed</h2>' + maybe.map(function (h) { return card(h, h.missing); }).join('') : '');
    countEl.textContent = (fits.length === 1 ? '1 home' : fits.length + ' homes') + (maybe.length ? ' · ' + maybe.length + ' may fit' : '');
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
  /* Sleeps: 1 to 8 on the slider; 8 means eight or more. */
  if (sleeps) sleeps.addEventListener('input', function () {
    var v = +sleeps.value;
    sleepsOut.textContent = v === 1 ? 'any' : v === 8 ? '8+' : v + '+';
    show();
  });
  /* Type: pills pressed on and off, any number at once; none pressed is every type. */
  if (pills) pills.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-type]'); if (!b) return;
    b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    types = [].map.call(pills.querySelectorAll('button[aria-pressed="true"]'), function (x) { return x.dataset.type; });
    show();
  });
  /* Kids OK, Pets OK: each pressed on and off; pressed shows only homes that welcome them. */
  if (welcome) welcome.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-need]'); if (!b) return;
    b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    needs = [].map.call(welcome.querySelectorAll('button[aria-pressed="true"]'), function (x) { return x.dataset.need; });
    show();
  });
  if (areaBtn) areaBtn.addEventListener('click', function () { area = map.getBounds(); q.value = ''; areaBtn.hidden = true; show(); });
  /* The homes: street.json, written from the database by tools/build-index.mjs. */
  fetch(map.getContainer().dataset.src || 'street.json').then(function (r) { return r.json(); }).then(function (list) {
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
