/* PLEASANT STREET: the homes from street.json on a map and in a list.
   Typing a city or state finds a place; moving the map updates the results automatically.
   A pin or a card opens the home's own website in a new tab. */
(function () {
  var listEl = document.getElementById('ps-list'), countEl = document.getElementById('ps-count');
  var q = document.getElementById('ps-q');
  var sleeps = document.getElementById('ps-sleeps'), sleepsOut = document.getElementById('ps-sleeps-out');
  var pills = document.getElementById('ps-type'), types = [];
  var welcome = document.getElementById('ps-welcome'), needs = [];
  var map = L.map('ps-map', { scrollWheelZoom: false, maxZoom: 18 }).setView([39.5, -98.5], 4);   /* the circles need the top zoom up front */
  /* Every home but the featured ones gathers into a circle with its count; a circle splits as the map
     zooms in, and homes on one spot fan out when it is clicked. Featured homes stay pins, on the map itself,
     so pins and circles always add up to the homes in the list. */
  var cluster = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 48,
    iconCreateFunction: function (c) {
      var n = c.getChildCount(), size = n < 10 ? 34 : n < 100 ? 42 : 50;
      return L.divIcon({ html: '<span>' + n + '</span>', className: 'app-cluster', iconSize: L.point(size, size) });
    } }).addTo(map);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  var homes = [], area = null;
  var featuredIcon = L.divIcon({
    className: 'ps-featured-pin', iconSize: [32, 44], iconAnchor: [16, 43], popupAnchor: [0, -37],
    html: '<svg viewBox="0 0 32 44" width="32" height="44" aria-hidden="true"><path class="ps-featured-pin__shape" d="M16 1C7.7 1 1 7.7 1 16c0 11 15 26 15 26s15-15 15-26C31 7.7 24.3 1 16 1Z"/><circle cx="16" cy="16" r="5" fill="white"/></svg>'
  });
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function card(h, missing) {
    return '<a class="ps-card' + (h.featured === true ? ' ps-card--featured' : '') + '" href="' + esc(h.url) + '" target="_blank" rel="noopener">' +
      (h.featured === true ? '<span class="ps-card__featured">Featured</span>' : '') +
      '<img src="' + esc(h.photo) + '" alt="" loading="lazy" decoding="async" width="560" height="350">' +
      '<span class="ps-card__name">' + esc(h.name) + '</span><span class="ps-card__place">' + esc(h.place) + '</span>' +
      (missing && missing.length ? '<span class="ps-card__missing">Doesn’t say: ' + esc(missing.join(', ')) + '</span>' : '') + '</a>';
  }
  /* A place matches when a word of it starts with what was typed, or the typed word is
     its state's full name: "ca" and "california" both find San Francisco, not Cape Cod. */
  /* The states, both ways: "me" and "maine" find the same homes, whichever form a place is written in. */
  var STATES = { al: 'alabama', ak: 'alaska', az: 'arizona', ar: 'arkansas', ca: 'california', co: 'colorado',
    ct: 'connecticut', de: 'delaware', dc: 'district of columbia', fl: 'florida', ga: 'georgia', hi: 'hawaii',
    id: 'idaho', il: 'illinois', in: 'indiana', ia: 'iowa', ks: 'kansas', ky: 'kentucky', la: 'louisiana',
    me: 'maine', md: 'maryland', ma: 'massachusetts', mi: 'michigan', mn: 'minnesota', ms: 'mississippi',
    mo: 'missouri', mt: 'montana', ne: 'nebraska', nv: 'nevada', nh: 'new hampshire', nj: 'new jersey',
    nm: 'new mexico', ny: 'new york', nc: 'north carolina', nd: 'north dakota', oh: 'ohio', ok: 'oklahoma',
    or: 'oregon', pa: 'pennsylvania', ri: 'rhode island', sc: 'south carolina', sd: 'south dakota',
    tn: 'tennessee', tx: 'texas', ut: 'utah', vt: 'vermont', va: 'virginia', wa: 'washington',
    wv: 'west virginia', wi: 'wisconsin', wy: 'wyoming' };
  var ABBR = {};
  Object.keys(STATES).forEach(function (k) { ABBR[STATES[k]] = k; });
  /* A place's state as its two letters: "Portland, ME" and "Portland, Maine" both give "me". */
  function stateOf(place) {
    var last = place.toLowerCase().split(',').pop().trim();
    return STATES[last] ? last : ABBR[last] || '';
  }
  function matches(place, t) {
    var st = stateOf(place), p = place.toLowerCase();
    if (t.length <= 2) return st === t;
    if (st && STATES[st].indexOf(t) === 0) return true;               /* "mai", "maine", "new y" */
    if (ABBR[t] && ABBR[t] === st) return true;
    return p.split(/,\s*/)[0].indexOf(t) === 0 || p.split(/[\s,]+/).some(function (w) { return w.indexOf(t) === 0; });
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
      /* Kids and pets are yes or no: a home that does not say counts as no. */
      needs.forEach(function (k) { if (!out && !/^y/i.test(h[k] || '')) out = true; });
      if (out) { (h.featured === true ? map : cluster).removeLayer(h.marker); return; }
      h.marker.setOpacity(h.missing.length ? 0.55 : 1);
      if (h.featured === true) h.marker.addTo(map); else cluster.addLayer(h.marker);
      (h.missing.length ? maybe : fits).push(h);
    });
    var shown = fits.concat(maybe);
    if (!listEl) return shown;
    listEl.innerHTML = (fits.map(function (h) { return card(h); }).join('') ||
        (maybe.length ? '' : '<p class="ps-none">No homes here yet. Try another place, or zoom out.</p>')) +
      (maybe.length ? '<h2 class="ps-group">May fit: not every fact is listed</h2>' + maybe.map(function (h) { return card(h, h.missing); }).join('') : '');
    countEl.textContent = (fits.length === 1 ? '1 home' : fits.length + ' homes') + (maybe.length ? ' · ' + maybe.length + ' may fit' : '');
    return shown;
  }
  function syncArea() {
    area = map.getBounds();
    show();
  }
  map.on('moveend', syncArea);
  if (q) q.addEventListener('input', function () {
    if (!q.value.trim()) { syncArea(); return; }
    // Search every location before moving the map, including places outside the current view.
    area = null;
    var shown = show();
    if (shown.length) { map.fitBounds(L.latLngBounds(shown.map(function (h) { return h.marker.getLatLng(); })).pad(0.3), { maxZoom: 10, animate: false }); }
    syncArea();
  });
  /* The map's box can change size after it is drawn (the list, the window): redraw so no grey is left. */
  if (window.ResizeObserver) new ResizeObserver(function () { map.invalidateSize(); }).observe(map.getContainer());
  window.addEventListener('load', function () { map.invalidateSize(); });
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
  /* The homes: street.json, written from the database by tools/build-index.mjs. */
  fetch(map.getContainer().dataset.src || 'street.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (list) {
    homes = list.slice().sort(function (a, b) {
      return Number(b.featured === true) - Number(a.featured === true) || a.name.localeCompare(b.name);
    }).map(function (h) {
      var markerOptions = { title: h.name, alt: h.name, zIndexOffset: h.featured === true ? 1000 : 0 };
      if (h.featured === true) markerOptions.icon = featuredIcon;
      h.marker = L.marker([h.lat, h.lng], markerOptions)
        .bindPopup('<div class="ps-pop">' + card(h) + '</div>', { minWidth: 220 });
      return h;
    });
    /* Open on the mainland: Hawaii in the same view zooms the map out past the edge of the tiles. */
    var main = homes.filter(function (h) { return h.lng > -130; });
    map.fitBounds(L.latLngBounds((main.length ? main : homes).map(function (h) { return h.marker.getLatLng(); })).pad(0.1), { animate: false });
    syncArea();
  });
})();
