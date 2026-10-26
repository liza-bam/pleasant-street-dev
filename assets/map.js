/* PLEASANT STREET: the homes from index.json in map and cards views.
   Typing a city or state finds a place; moving the map updates the results automatically.
   A pin or a card opens the home's own website in a new tab. */
(function () {
  var listEl = document.getElementById('ps-list'), countEl = document.getElementById('ps-count');
  var q = document.getElementById('ps-q');
  var sleeps = document.getElementById('ps-sleeps'), sleepsOut = document.getElementById('ps-sleeps-out');
  var pills = document.getElementById('ps-type'), types = [];
  var welcome = document.getElementById('ps-welcome'), needs = [];
  var app = document.querySelector('.app'), viewSwitch = document.querySelector('.app-view-switch');
  var view = new URLSearchParams(location.search).get('view') === 'cards' ? 'cards' : 'map';
  var cardSize = new URLSearchParams(location.search).get('size') === 'tiny' ? 'tiny' : 'large';
  var sizeSwitch = document.querySelector('.app-size-switch');
  var destinationsEl = document.getElementById('ps-destinations');
  var filterToggle = document.getElementById('ps-filter-toggle'), filterCount = document.getElementById('ps-filter-count');
  var headerEl = document.querySelector('.app-header'), resultsEl = document.querySelector('.app-results');
  var bodyEl = document.querySelector('.app-body'), filterPanel = document.getElementById('ps-filter-panel');
  var sheetHandle = document.getElementById('ps-sheet-handle'), sheetRatio = 0.48, sheetDrag = null;
  var sheetCount = document.getElementById('ps-sheet-count');
  var selectedEl = document.getElementById('ps-selected'), selectedBody = document.getElementById('ps-selected-content');
  var selectedTitle = document.getElementById('ps-selected-title'), selectedClose = document.getElementById('ps-selected-close');
  var selectedHome = null, priorSheetRatio = 0.48;
  var searchDialog = document.getElementById('ps-search'), searchWhere = document.getElementById('ps-search-where');
  var guestValue = document.getElementById('ps-guests-value'), guestLess = document.getElementById('ps-guests-less'), guestMore = document.getElementById('ps-guests-more');
  var searchGuests = 1, clearSearchFilters = false;
  function syncSearchGuests() {
    guestValue.textContent = searchGuests === 8 ? '8+' : searchGuests;
    guestLess.disabled = searchGuests <= 1; guestMore.disabled = searchGuests >= 8;
  }
  function openSearch() {
    if (!phoneLayout.matches || searchDialog.open) return;
    searchWhere.value = q.value; searchGuests = +sleeps.value; clearSearchFilters = false;
    syncSearchGuests(); searchDialog.showModal(); searchWhere.focus();
  }
  q.addEventListener('click', openSearch);
  q.addEventListener('keydown', function (e) { if (phoneLayout.matches && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openSearch(); } });
  document.getElementById('ps-search-close').addEventListener('click', function () { searchDialog.close(); });
  guestLess.addEventListener('click', function () { searchGuests = Math.max(1, searchGuests - 1); syncSearchGuests(); });
  guestMore.addEventListener('click', function () { searchGuests = Math.min(8, searchGuests + 1); syncSearchGuests(); });
  document.getElementById('ps-search-clear').addEventListener('click', function () { searchWhere.value = ''; searchGuests = 1; clearSearchFilters = true; syncSearchGuests(); });
  document.getElementById('ps-search-form').addEventListener('submit', function (e) {
    e.preventDefault();
    q.value = searchWhere.value.trim(); sleeps.value = searchGuests;
    sleepsOut.textContent = searchGuests === 1 ? 'any' : searchGuests === 8 ? '8+' : searchGuests + '+';
    if (clearSearchFilters) { types = []; needs = []; [pills, welcome].forEach(function (group) { group.querySelectorAll('button').forEach(function (button) { button.setAttribute('aria-pressed', 'false'); }); }); }
    searchDialog.close();
    app.classList.remove('app--filters-open'); filterToggle.setAttribute('aria-expanded', 'false');
    searchPlace();
    q.focus({ preventScroll: true });
  });
  filterToggle.addEventListener('click', function () {
    var open = filterToggle.getAttribute('aria-expanded') !== 'true';
    filterToggle.setAttribute('aria-expanded', String(open));
    app.classList.toggle('app--filters-open', open);
  });
  var groupState = { featured: true, fit: true, potential: false };
  var POPULAR_MIN_LISTINGS = 10, POPULAR_MAX_DESTINATIONS = 6;
  var initialPlace = new URLSearchParams(location.search).get('place');
  if (q && initialPlace) q.value = initialPlace;
  /* A pinch on the trackpad and the wheel zoom the map itself, like + and -, never the page around it.
     The circles need the top zoom up front. */
  var map = L.map('ps-map', { scrollWheelZoom: true, maxZoom: 18 }).setView([39.5, -98.5], 4);
  // On a phone layout, wheel/trackpad scrolling continues down the page over the map.
  var phoneLayout = window.matchMedia('(max-width: 760px)');
  function syncMapScroll() {
    if (phoneLayout.matches) {
      map.scrollWheelZoom.disable();
      if (filterPanel.parentElement !== headerEl) headerEl.appendChild(filterPanel);
      q.placeholder = 'Where to?';
      q.readOnly = true; q.setAttribute('aria-haspopup', 'dialog');
    } else {
      map.scrollWheelZoom.enable();
      if (filterPanel.parentElement !== resultsEl) resultsEl.insertBefore(filterPanel, listEl);
      q.placeholder = 'Where to? City or state';
      q.readOnly = false; q.removeAttribute('aria-haspopup');
      if (searchDialog.open) searchDialog.close();
      closeSelected(false, false);
    }
    (homes || []).forEach(syncMarkerPopup);
    if (loaded) show();
  }
  phoneLayout.addEventListener('change', syncMapScroll);
  syncMapScroll();
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
  var homes = [], area = null, loaded = false;
  var featuredIcon = L.divIcon({
    className: 'ps-featured-pin', iconSize: [32, 44], iconAnchor: [16, 43], popupAnchor: [0, -37],
    html: '<svg viewBox="0 0 32 44" width="32" height="44" aria-hidden="true"><path class="ps-featured-pin__shape" d="M16 1C7.7 1 1 7.7 1 16c0 11 15 26 15 26s15-15 15-26C31 7.7 24.3 1 16 1Z"/><circle cx="16" cy="16" r="5" fill="white"/></svg>'
  });
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function known(v) { return v !== undefined && v !== null && v !== '' && v !== 'Unknown'; }
  function factIcon(kind) {
    var paths = {
      guests: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-4-5"/>',
      bedrooms: '<path d="M3 18v3M21 18v3M3 18V8h18v10ZM3 14h18M7 8V5h10v3"/>',
      bathrooms: '<path d="M3 12h18v3a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5ZM6 12V5a2 2 0 0 1 4 0M7 20v2M17 20v2"/>',
      pets: '<ellipse cx="6" cy="7" rx="2" ry="3"/><ellipse cx="18" cy="7" rx="2" ry="3"/><ellipse cx="11" cy="4" rx="1.5" ry="2"/><ellipse cx="13" cy="4" rx="1.5" ry="2"/><path d="M6 17c0-3 4-7 6-7s6 4 6 7-3 4-6 2c-3 2-6 1-6-2Z"/>',
      kids: '<circle cx="12" cy="5" r="3"/><path d="m5 11 7 3 7-3M12 8v8M12 16l-4 6M12 16l4 6"/>',
      location: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>'
    };
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + paths[kind] + '</svg>';
  }
  function factRows(h) {
    var fields = [['guests', 'Guests'], ['bedrooms', 'Bedrooms'], ['bathrooms', 'Bathrooms'], ['pets', 'Pets'], ['kids', 'Children']];
    var rows = fields.filter(function (f) { return known(h[f[0]]); }).map(function (f) {
      var value = h[f[0]], isPolicy = f[0] === 'pets' || f[0] === 'kids';
      var display = isPolicy ? value === 'Yes' ? '✓' : value === 'No' ? '×' : '?' : value;
      var label = f[1] + ': ' + (value === 'Conditional' ? 'Ask host' : value);
      return '<div title="' + esc(label) + '" aria-label="' + esc(label) + '"><dt>' + factIcon(f[0]) + '<span class="app-hide">' + f[1] + '</span></dt><dd>' + esc(display) + '</dd></div>';
    }).join('');
    return rows ? '<dl class="ps-home__facts">' + rows + '</dl>' : '';
  }
  function policy(v) { return v === 'Conditional' ? 'Ask host' : known(v) ? v : 'Unknown'; }
  function shortDescription(s) {
    if (!known(s)) return 'Description not yet available.';
    s = String(s).replace(/\s+/g, ' ').trim();
    if (s.length <= 150) return s;
    var cut = s.slice(0, 149).replace(/\s+\S*$/, '');
    return cut.replace(/[.,;:!?\s]+$/, '') + '…';
  }
  function photoSet(h) {
    if (h.cardPhotos && h.cardPhotos.length) return h.cardPhotos.slice(0, 3);
    var files = [h.coverPhoto].concat((h.photos || []).map(function (p) { return typeof p === 'string' ? p : p.file; }));
    return files.filter(function (f, i) { return known(f) && files.indexOf(f) === i; }).slice(0, 3);
  }
  function platformBadges(h) {
    var names = { airbnb: 'Airbnb', vrbo: 'Vrbo', booking: 'Booking.com' };
    return ['airbnb', 'vrbo', 'booking'].filter(function (p) { return h.platformLinks && h.platformLinks[p] && h.platformLinks[p].length; }).map(function (p) {
      return '<span class="ps-platform ps-platform--' + p + '" role="img" aria-label="' + names[p] + ' link found"><img src="assets/platforms/' + p + '.svg" alt="" width="18" height="18"></span>';
    }).join('');
  }
  function fullCard(h, missing, tiny, detail) {
    var images = photoSet(h);
    var slots = tiny ? [0] : detail ? (images.length ? images.map(function (_, i) { return i; }) : [0]) : [0, 1, 2];
    var gallery = slots.map(function (i) {
      return images[i] ? '<img src="' + esc(images[i]) + '" alt="' + esc(h.name) + (i ? ' — additional property photo' : ' — cover photo') + '" loading="lazy" decoding="async">' : '<span class="ps-gallery__pending">Photo unavailable</span>';
    }).join('');
    var claimHref = 'mailto:sandy@lazy.vacations?subject=' + encodeURIComponent('Claim my house: ' + h.name) + '&body=' + encodeURIComponent('I would like to claim this Pleasant Street listing.\n\nProperty: ' + h.name + '\nWebsite: ' + h.url + '\nListing ID: ' + h.id + '\n\nMy name:\nMy relationship to the property:\n');
    return '<article class="ps-home' + (h.featured ? ' ps-home--featured' : '') + (tiny ? ' ps-home--tiny' : '') + (detail ? ' ps-home--detail' : '') + '" data-property="' + esc(h.id) + '">' +
      '<div class="ps-gallery">' + listingBadge(h) + '<div class="ps-photo-platforms">' + platformBadges(h) + '</div>' +
      (detail ? '<div class="ps-photo-strip" tabindex="0" aria-label="Photos of ' + esc(h.name) + '">' + gallery + '</div><span class="ps-photo-count" aria-hidden="true">1 / ' + Math.max(images.length, 1) + '</span>' : gallery) + '</div>' +
      '<div class="ps-home__body">' + (detail ? '<p class="ps-home__place">' + factIcon('location') + esc(h.place) + '</p>' : '<button type="button" class="ps-home__place ps-home__address" data-address-property="' + esc(h.id) + '" aria-label="Show ' + esc(h.name) + ' on map">' + factIcon('location') + esc(h.place) + '</button>') + '<h2 title="' + esc(h.name) + '">' + esc(h.name) + '</h2>' +
      (!tiny && (/operator|manager/i.test(h.recordType || '') || h.cardPhotoLabel) ? '<p class="ps-home__operator">' + esc(h.cardPhotoLabel || 'Rental operator') + '</p>' : '') +
      (tiny ? '' : '<p class="ps-home__description">' + esc(shortDescription(h.cardDescription || h.description)) + '</p>') +
      (tiny ? '' : factRows(h)) +
      (missing && missing.length ? '<p class="ps-home__missing">' + (tiny ? 'Potential fit · check with host' : 'May fit · check ' + esc(missing.join(', '))) + '</p>' : '') +
      '<div class="ps-home__actions"><a class="ps-action ps-action--primary" href="' + esc(h.url) + '" target="_blank" rel="noopener">Open website<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7 M7 7h10v10"/></svg></a>' +
      (detail ? '' : '<a class="ps-action ps-action--claim" href="' + esc(claimHref) + '" aria-label="Claim ' + esc(h.name) + ' by email">Claim my house</a>') + '</div></div></article>';
  }
  function listingBadge(h) {
    if (!h.featured && !h.demo) return '';
    return '<span class="ps-card__featured">' + (h.featured ? 'Featured' : '') + (h.featured && h.demo ? ' · ' : '') + (h.demo ? 'Demo' : '') + '</span>';
  }
  function card(h, missing, selectable) {
    var tag = selectable ? 'button' : 'a';
    return '<' + tag + ' class="ps-card' + (selectable ? ' ps-card--select' : '') + (h.featured === true ? ' ps-card--featured' : '') + '"' +
      (selectable ? ' type="button" data-select-property="' + esc(h.id) + '" aria-label="View ' + esc(h.name) + ' details"' : ' href="' + esc(h.url) + '" target="_blank" rel="noopener"') + '>' +
      listingBadge(h) +
      '<img src="' + esc(h.photo) + '" alt="" loading="lazy" decoding="async" width="560" height="350">' +
      '<span class="ps-card__name" title="' + esc(h.name) + '">' + esc(h.name) + '</span><span class="ps-card__place">' + esc(h.place) + '</span>' +
      (missing && missing.length ? '<span class="ps-card__missing">Doesn’t say: ' + esc(missing.join(', ')) + '</span>' : '') + '</' + tag + '>';
  }
  function syncMarkerPopup(h) {
    if (!h.marker) return;
    if (phoneLayout.matches) h.marker.unbindPopup();
    else if (!h.marker.getPopup()) h.marker.bindPopup('<div class="ps-pop">' + card(h) + '</div>', { minWidth: 220, className: h.featured ? 'ps-popup ps-popup--featured' : 'ps-popup' });
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
    if (p === t) return true;
    if (t.length <= 2) return st === t;
    if (st && STATES[st].indexOf(t) === 0) return true;               /* "mai", "maine", "new y" */
    if (ABBR[t] && ABBR[t] === st) return true;
    return p.split(/,\s*/)[0].indexOf(t) === 0 || p.split(/[\s,]+/).some(function (w) { return w.indexOf(t) === 0; });
  }
  /* Each filter sorts a home three ways: it says yes (a match), it says no (left out), or it does not
     say (it may fit). Location and the map area are always known, so they only include or leave out. */
  function show() {
    if (!loaded) {
      listEl.innerHTML = '<p class="ps-none">Loading homes…</p>';
      countEl.textContent = '';
      return [];
    }
    var t = q ? q.value.trim().toLowerCase() : '';
    var n = sleeps && +sleeps.value > 1 ? +sleeps.value : 0;   /* 1 on the slider is every home */
    var activeFilters = (n ? 1 : 0) + types.length + needs.length;
    filterCount.textContent = activeFilters;
    filterCount.hidden = !activeFilters;
    filterToggle.setAttribute('aria-label', 'Filters' + (activeFilters ? ', ' + activeFilters + ' active' : ''));
    var fits = [], maybe = [];
    homes.forEach(function (h) {
      h.missing = [];
      var out = (t && !matches(h.place, t)) || (view === 'map' && (!h.marker || (area && !area.contains(h.marker.getLatLng()))));
      if (!out && n) { if (!known(h.guests)) h.missing.push('how many it sleeps'); else if (+h.guests < n) out = true; }
      if (!out && types.length) { if (!known(h.type)) h.missing.push('type'); else if (types.indexOf(h.type) < 0) out = true; }
      /* A confirmed No excludes a home; missing or conditional policies need a host check. */
      needs.forEach(function (k) {
        if (out || /^y/i.test(h[k] || '')) return;
        if (h[k] === 'No') out = true; else h.missing.push(k === 'kids' ? 'kids policy' : 'pets policy');
      });
      if (out) { if (h.marker) (h.featured === true ? map : cluster).removeLayer(h.marker); return; }
      if (h.marker) {
        h.marker.setOpacity(h.missing.length ? 0.55 : 1);
        if (h.featured === true) h.marker.addTo(map); else cluster.addLayer(h.marker);
      }
      (h.missing.length ? maybe : fits).push(h);
    });
    var shown = fits.concat(maybe);
    if (selectedHome && shown.indexOf(selectedHome) < 0) closeSelected(false, false);
    if (!listEl) return shown;
    listEl.querySelectorAll('details[data-group]').forEach(function (g) { groupState[g.dataset.group] = g.open; });
    var featured = shown.filter(function (h) { return h.featured; });
    var groups = [
      { key: 'featured', title: 'Featured', homes: featured },
      { key: 'fit', title: 'Fit', homes: fits.filter(function (h) { return !h.featured; }) },
      { key: 'potential', title: 'Potential fit', homes: maybe.filter(function (h) { return !h.featured; }) }
    ];
    listEl.innerHTML = groups.filter(function (g) { return g.homes.length; }).map(function (g) {
      return '<details class="ps-results-group ps-results-group--' + g.key + '" data-group="' + g.key + '"' + (groupState[g.key] ? ' open' : '') + '>' +
        '<summary><span>' + g.title + '</span><span class="ps-results-group__count">' + g.homes.length + '</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary>' +
        (g.key === 'potential' ? '<p class="ps-results-group__note">Some requested details are missing or need host approval. Check with the host.</p>' : '') +
        '<div class="ps-results-grid">' + g.homes.map(function (h) { return view === 'cards' ? fullCard(h, h.missing, cardSize === 'tiny') : card(h, h.missing, phoneLayout.matches); }).join('') + '</div></details>';
    }).join('') || '<p class="ps-none">No homes here yet. Try another place' + (view === 'map' ? ', or zoom out.' : ' or change the filters.') + '</p>';
    countEl.innerHTML = '<span class="app-count__total">' + (shown.length === 1 ? '1 home' : shown.length + ' homes') + '</span>' +
      (maybe.length ? ' <span class="app-count__potential">' + maybe.length + (maybe.length === 1 ? ' potential fit' : ' potential fits') + '</span>' : '');
    sheetCount.textContent = shown.length === 1 ? '1 home' : shown.length + ' homes';
    return shown;
  }
  function setSheetRatio(ratio) {
    sheetRatio = Math.max(0.12, Math.min(0.94, ratio));
    app.style.setProperty('--sheet-height', (sheetRatio * 100) + '%');
    app.classList.toggle('app--sheet-collapsed', sheetRatio < 0.24);
    sheetHandle.setAttribute('aria-valuenow', Math.round(sheetRatio * 100));
    sheetHandle.setAttribute('aria-valuetext', 'Results panel ' + Math.round(sheetRatio * 100) + '% open');
  }
  sheetHandle.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 || !phoneLayout.matches || view !== 'map') return;
    sheetDrag = { id: e.pointerId, y: e.clientY, height: resultsEl.getBoundingClientRect().height, ratio: sheetRatio };
    sheetHandle.setPointerCapture(e.pointerId);
    app.classList.add('app--sheet-dragging');
    e.preventDefault();
  });
  sheetHandle.addEventListener('pointermove', function (e) {
    if (!sheetDrag || e.pointerId !== sheetDrag.id) return;
    setSheetRatio((sheetDrag.height + sheetDrag.y - e.clientY) / bodyEl.clientHeight);
  });
  function endSheetDrag(e) {
    if (!sheetDrag || e.pointerId !== sheetDrag.id) return;
    var delta = e.clientY - sheetDrag.y, start = sheetDrag.ratio;
    var stops = [0.12, 0.48, 0.94];
    var next = stops.reduce(function (best, stop) { return Math.abs(stop - sheetRatio) < Math.abs(best - sheetRatio) ? stop : best; }, stops[0]);
    if (Math.abs(delta) < 4) next = sheetRatio < 0.3 ? 0.48 : sheetRatio < 0.7 ? 0.94 : 0.12;
    else if (Math.abs(delta) > 35 && Math.abs(next - start) < 0.05) next = delta > 0 ? stops.filter(function (s) { return s < start - 0.05; }).pop() || 0.12 : stops.find(function (s) { return s > start + 0.05; }) || 0.94;
    sheetDrag = null;
    app.classList.remove('app--sheet-dragging');
    setSheetRatio(next);
  }
  sheetHandle.addEventListener('pointerup', endSheetDrag);
  sheetHandle.addEventListener('pointercancel', function () { sheetDrag = null; app.classList.remove('app--sheet-dragging'); });
  sheetHandle.addEventListener('keydown', function (e) {
    var next = e.key === 'ArrowUp' ? sheetRatio + 0.1 : e.key === 'ArrowDown' ? sheetRatio - 0.1 : e.key === 'Home' ? 0.12 : e.key === 'End' ? 0.94 : null;
    if (next !== null) { e.preventDefault(); setSheetRatio(next); }
  });
  function closeSelected(collapse, focus) {
    if (!selectedHome) return;
    if (selectedHome.marker) { selectedHome.marker.setZIndexOffset(selectedHome.featured ? 1000 : 0); var icon = selectedHome.marker.getElement(); if (icon) icon.classList.remove('ps-marker--selected'); }
    selectedHome = null;
    selectedEl.hidden = true; listEl.hidden = false;
    app.classList.remove('app--detail-open');
    setSheetRatio(collapse ? 0.12 : priorSheetRatio);
    if (focus !== false && phoneLayout.matches && view === 'map') sheetHandle.focus({ preventScroll: true });
  }
  function openSelected(h) {
    if (!phoneLayout.matches) { setView('map'); if (h.marker) { map.setView(h.marker.getLatLng(), 12); h.marker.openPopup(); } return; }
    if (selectedHome) closeSelected(false, false);
    if (view !== 'map') setView('map');
    priorSheetRatio = sheetRatio;
    selectedHome = h;
    selectedTitle.textContent = h.name;
    selectedEl.setAttribute('aria-label', h.name + ' details');
    selectedBody.innerHTML = fullCard(h, h.missing, false, true);
    selectedBody.scrollTop = 0;
    selectedEl.hidden = false; listEl.hidden = true;
    app.classList.add('app--detail-open');
    map.closePopup();
    if (h.marker) {
      h.marker.setZIndexOffset(2000);
      map.setView(h.marker.getLatLng(), Math.max(map.getZoom(), 11), { animate: false });
      map.panBy([0, resultsEl.getBoundingClientRect().height / 2], { animate: false });
      var icon = h.marker.getElement(); if (icon) icon.classList.add('ps-marker--selected');
    }
    selectedClose.focus({ preventScroll: true });
  }
  document.getElementById('ps-selected-back').addEventListener('click', function () { closeSelected(false); });
  selectedClose.addEventListener('click', function () { closeSelected(true); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (searchDialog.open) return;
    if (selectedHome) closeSelected(false);
    else if (app.classList.contains('app--filters-open')) { app.classList.remove('app--filters-open'); filterToggle.setAttribute('aria-expanded', 'false'); filterToggle.focus(); }
  });
  app.addEventListener('click', function (e) {
    var button = e.target.closest('[data-select-property], [data-address-property]');
    if (!button) return;
    var id = button.dataset.selectProperty || button.dataset.addressProperty;
    var home = homes.find(function (h) { return h.id === id; });
    if (home) openSelected(home);
  });
  selectedBody.addEventListener('scroll', function (e) {
    var strip = e.target;
    if (!strip.classList || !strip.classList.contains('ps-photo-strip')) return;
    var count = strip.parentElement.querySelector('.ps-photo-count');
    if (count && strip.clientWidth) count.textContent = Math.round(strip.scrollLeft / strip.clientWidth + 1) + ' / ' + strip.children.length;
  }, { capture: true, passive: true });
  function syncArea() {
    if (view !== 'map') return;
    area = map.getBounds();
    show();
  }
  map.on('moveend', syncArea);
  function searchPlace() {
    closeSelected(false, false);
    syncDestinations();
    var params = new URLSearchParams(location.search);
    if (q.value.trim()) params.set('place', q.value.trim()); else params.delete('place');
    history.replaceState(null, '', location.pathname + (params.size ? '?' + params.toString() : ''));
    if (view === 'cards') { area = null; show(); return; }
    if (!q.value.trim()) { syncArea(); return; }
    // Search every location before moving the map, including places outside the current view.
    area = null;
    var shown = show().filter(function (h) { return h.marker; });
    if (shown.length) { map.fitBounds(L.latLngBounds(shown.map(function (h) { return h.marker.getLatLng(); })).pad(0.3), { maxZoom: 10, animate: false }); }
    syncArea();
  }
  if (q) q.addEventListener('input', searchPlace);
  function syncDestinations() {
    var value = q.value.trim().toLowerCase();
    destinationsEl.querySelectorAll('button[data-place]').forEach(function (b) {
      var place = b.dataset.place.toLowerCase();
      b.setAttribute('aria-pressed', String(value === place || (place && value === place.split(',')[0].trim())));
    });
  }
  function popularDestinations() {
    var counts = Object.create(null);
    homes.forEach(function (h) {
      if (h.demo || !known(h.town) || !known(h.state)) return;
      counts[h.place] = (counts[h.place] || 0) + 1;
    });
    var places = Object.keys(counts).filter(function (p) { return counts[p] >= POPULAR_MIN_LISTINGS; }).sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b); }).slice(0, POPULAR_MAX_DESTINATIONS);
    destinationsEl.hidden = !places.length;
    destinationsEl.innerHTML = '<span class="app-destinations__label">Popular destinations</span><button type="button" data-place="" aria-pressed="false">All places</button>' + places.map(function (p) {
      return '<button type="button" data-place="' + esc(p) + '" aria-pressed="false" title="' + counts[p] + ' real listings before filters">' + esc(p.split(',')[0]) + '<span>' + counts[p] + '</span></button>';
    }).join('');
    syncDestinations();
  }
  destinationsEl.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-place]'); if (!b) return;
    q.value = b.dataset.place;
    searchPlace();
    if (!q.value && view === 'map') {
      area = null;
      var all = show().filter(function (h) { return h.marker && h.lng > -130; });
      if (all.length) map.fitBounds(L.latLngBounds(all.map(function (h) { return h.marker.getLatLng(); })).pad(0.1), { animate: false });
      syncArea();
    }
    listEl.scrollTop = 0;
  });
  function syncCardSize() {
    app.classList.toggle('app--tiny', cardSize === 'tiny');
    sizeSwitch.querySelectorAll('[data-card-size]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.cardSize === cardSize)); });
  }
  sizeSwitch.addEventListener('click', function (e) {
    var b = e.target.closest('[data-card-size]'); if (!b) return;
    cardSize = b.dataset.cardSize;
    syncCardSize();
    var params = new URLSearchParams(location.search);
    if (cardSize === 'tiny') params.set('size', 'tiny'); else params.delete('size');
    history.replaceState(null, '', location.pathname + (params.size ? '?' + params.toString() : ''));
    show();
    listEl.scrollTop = 0;
  });
  syncCardSize();
  function setView(next) {
    if (next === 'cards') closeSelected(false, false);
    view = next;
    app.classList.toggle('app--cards', view === 'cards');
    viewSwitch.querySelectorAll('[data-view]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.view === view)); });
    var params = new URLSearchParams(location.search);
    if (view === 'cards') params.set('view', 'cards'); else params.delete('view');
    history.replaceState(null, '', location.pathname + (params.size ? '?' + params.toString() : ''));
    if (view === 'map') { map.invalidateSize(); area = null; var shown = show().filter(function (h) { return h.marker; }); if (shown.length) map.fitBounds(L.latLngBounds(shown.map(function (h) { return h.marker.getLatLng(); })).pad(0.1), { animate: false }); syncArea(); }
    else { area = null; show(); }
    listEl.scrollTop = 0;
  }
  viewSwitch.addEventListener('click', function (e) { var b = e.target.closest('[data-view]'); if (b) setView(b.dataset.view); });
  setView(view);
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
  /* Welcome filters exclude confirmed No policies and retain uncertain policies as potential fits. */
  if (welcome) welcome.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-need]'); if (!b) return;
    b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    needs = [].map.call(welcome.querySelectorAll('button[aria-pressed="true"]'), function (x) { return x.dataset.need; });
    show();
  });
  /* The homes: index.json, written from the database by tools/build-index.mjs. */
  fetch(map.getContainer().dataset.src || 'index.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (list) {
    homes = list.slice().sort(function (a, b) {
      return Number(b.featured === true) - Number(a.featured === true) || a.name.localeCompare(b.name);
    }).map(function (h) {
      var markerOptions = { title: h.name, alt: h.name, zIndexOffset: h.featured === true ? 1000 : 0 };
      if (h.featured === true) markerOptions.icon = featuredIcon;
      if (typeof h.lat === 'number' && typeof h.lng === 'number') h.marker = L.marker([h.lat, h.lng], markerOptions)
        .on('click', function () { if (phoneLayout.matches) openSelected(h); });
      syncMarkerPopup(h);
      return h;
    });
    loaded = true;
    popularDestinations();
    /* Open on the mainland: Hawaii in the same view zooms the map out past the edge of the tiles. */
    var mapped = homes.filter(function (h) { return h.marker; });
    var main = mapped.filter(function (h) { return h.lng > -130; });
    if (view === 'map' && mapped.length) {
      var initial = q.value.trim() ? mapped.filter(function (h) { return matches(h.place, q.value.trim().toLowerCase()); }) : (main.length ? main : mapped);
      if (initial.length) map.fitBounds(L.latLngBounds(initial.map(function (h) { return h.marker.getLatLng(); })).pad(0.1), { animate: false });
      syncArea();
    } else show();
  }).catch(function () {
    listEl.innerHTML = '<p class="ps-none">We couldn’t load the homes. Please refresh and try again.</p>';
    countEl.textContent = '';
  });
})();
