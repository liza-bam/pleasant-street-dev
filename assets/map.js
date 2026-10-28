/* PLEASANT STREET: the homes from index.json in map and cards views.
   Typing a city or state finds a place; moving the map updates the results automatically.
   A pin or a card opens the home's own website in a new tab. */
(function () {
  var listEl = document.getElementById('ps-list'), countEl = document.getElementById('ps-count');
  var mapAreaMode = false, mapAreaPoints = [];
  function leaveMapAreaMode() { mapAreaMode = false; delete q.dataset.mapArea; }
  var q = document.getElementById('ps-q'), searchGuestsLabel = document.getElementById('ps-search-guests');
  function syncSearchSummary() {
    var guests = +sleeps.value;
    searchGuestsLabel.textContent = guests > 1 ? (guests === 8 ? '8+' : guests) + ' guests' : '';
    searchGuestsLabel.hidden = guests <= 1;
  }
  var landing = document.getElementById('ps-landing'), landingFeatured = document.getElementById('ps-home-featured');
  // A destination page (/cape_cod/ …) shows only that destination's homes and opens on the map.
  var pageDestination = document.documentElement.dataset.destination || '';
  var startOnHome = !pageDestination && !new URLSearchParams(location.search).has('place') && !new URLSearchParams(location.search).has('view');
  function syncHomeWater() {
    var host = document.getElementById('ps-home-water'), existing = host.querySelector('water-surface');
    var active = app.classList.contains('app--home') && !phoneLayout.matches;
    if (active && !existing) {
      var water = document.createElement('water-surface');
      var attrs = { water: '#74e3d1', light: '#74e3d1', line: '#8eeddf', scale: '6.5', density: '26', weight: '1.4', speed: '0.035' };
      Object.keys(attrs).forEach(function (key) { water.setAttribute(key, attrs[key]); }); host.appendChild(water);
    } else if (!active && existing) existing.remove();
  }
  function setHomeMode(home) {
    app.classList.toggle('app--home', home); landing.hidden = !home; syncHomeWater();
    if (!home && map) map.invalidateSize();
  }
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
  var headerActions = document.querySelector('.app-header-actions'), searchRow = document.querySelector('.app-search-row'), viewSwitch = document.querySelector('.app-view-switch');
  var cardControls = document.querySelector('.app-card-controls'), appBar = document.querySelector('.app-bar');
  var bodyEl = document.querySelector('.app-body'), filterPanel = document.getElementById('ps-filter-panel');
  var sheetHandle = document.getElementById('ps-sheet-handle'), sheetRatio = 0.48, sheetDrag = null;
  var sheetCount = document.getElementById('ps-sheet-count');
  var selectedEl = document.getElementById('ps-selected'), selectedBody = document.getElementById('ps-selected-content');
  var selectedTitle = document.getElementById('ps-selected-title'), selectedClose = document.getElementById('ps-selected-close');
  var selectedHome = null, priorSheetRatio = 0.48;
  var mapHeaderCompact = false;
  var floatingControls = document.querySelector('.app-floating-controls');
  var recentDialog = document.getElementById('ps-recents'), recentList = document.getElementById('ps-recents-list');
  var recentSearches = [];
  try { var savedSearches = JSON.parse(localStorage.getItem('pleasant-street-recent-searches') || '[]'); if (Array.isArray(savedSearches)) recentSearches = savedSearches.filter(function (s) { return s && typeof s.place === 'string'; }).slice(0, 6); } catch (_) {}
  function rememberSearch() {
    var place = q.value.trim(); if (!place || mapAreaMode) return;
    var entry = { place: place, guests: +sleeps.value, types: types.slice(), needs: needs.slice() };
    recentSearches = [entry].concat(recentSearches.filter(function (s) { return s.place.toLowerCase() !== place.toLowerCase() || s.guests !== entry.guests; })).slice(0, 6);
    try { localStorage.setItem('pleasant-street-recent-searches', JSON.stringify(recentSearches)); } catch (_) {}
  }
  function syncFilterPills() {
    pills.querySelectorAll('[data-type]').forEach(function (b) { b.setAttribute('aria-pressed', String(types.indexOf(b.dataset.type) >= 0)); });
    welcome.querySelectorAll('[data-need]').forEach(function (b) { b.setAttribute('aria-pressed', String(needs.indexOf(b.dataset.need) >= 0)); });
  }
  document.getElementById('ps-recents-open').addEventListener('click', function () {
    recentList.innerHTML = recentSearches.length ? recentSearches.map(function (s, i) { return '<button class="ps-recent-item" type="button" data-recent="' + i + '"><span>' + esc(s.place) + '</span><small>' + (+s.guests > 1 ? esc(+s.guests === 8 ? '8+' : s.guests) + ' guests' : 'Any group size') + '</small></button>'; }).join('') : '<p class="ps-recents-empty">Your recent searches will appear here.</p>';
    recentDialog.showModal();
  });
  document.getElementById('ps-recents-close').addEventListener('click', function () { recentDialog.close(); });
  recentList.addEventListener('click', function (e) {
    var button = e.target.closest('[data-recent]'); if (!button) return;
    var item = recentSearches[+button.dataset.recent]; if (!item) return;
    leaveMapAreaMode(); q.value = item.place; sleeps.value = Math.max(1, Math.min(8, +item.guests || 1));
    sleepsOut.textContent = +sleeps.value === 1 ? 'any' : sleeps.value + '+';
    types = Array.isArray(item.types) ? item.types.filter(function (v) { return ['House', 'Cabin', 'Camp', 'Apartment'].indexOf(v) >= 0; }) : [];
    needs = Array.isArray(item.needs) ? item.needs.filter(function (v) { return ['kids', 'pets'].indexOf(v) >= 0; }) : [];
    syncFilterPills(); recentDialog.close(); searchPlace(); rememberSearch();
  });
  document.getElementById('ps-home').addEventListener('click', function (e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault(); closeSelected(false, false);
    if (searchDialog.open) searchDialog.close(); if (recentDialog.open) recentDialog.close();
    leaveMapAreaMode(); q.value = ''; sleeps.value = 1; sleepsOut.textContent = 'any'; types = []; needs = []; syncFilterPills();
    cardSize = 'large'; syncCardSize(); app.classList.remove('app--filters-open'); filterToggle.setAttribute('aria-expanded', 'false');
    mapHeaderCompact = false; setSheetRatio(0.48); groupState = { featured: true, fit: true, potential: true };
    history.replaceState(null, '', location.pathname); setView('map');
    var mainland = homes.filter(function (h) { return h.marker && h.lng > -130; });
    fitHomes(mainland, 0.1);
    syncArea(); setHomeMode(true);
  });
  var searchDialog = document.getElementById('ps-search'), searchWhere = document.getElementById('ps-search-where');
  var guestValue = document.getElementById('ps-guests-value'), guestLess = document.getElementById('ps-guests-less'), guestMore = document.getElementById('ps-guests-more');
  var searchGuests = 1, clearSearchFilters = false;
  function syncSearchGuests() {
    guestValue.textContent = searchGuests === 8 ? '8+' : searchGuests;
    guestLess.disabled = searchGuests <= 1; guestMore.disabled = searchGuests >= 8;
  }
  function openSearch() {
    if ((!phoneLayout.matches && !app.classList.contains('app--home')) || searchDialog.open) return;
    searchWhere.value = mapAreaMode ? '' : q.value; searchGuests = +sleeps.value; clearSearchFilters = false;
    syncSearchGuests(); searchDialog.showModal(); searchWhere.focus();
  }
  document.getElementById('ps-home-search').addEventListener('click', openSearch);
  q.addEventListener('click', openSearch);
  q.addEventListener('keydown', function (e) { if (phoneLayout.matches && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openSearch(); } });
  document.getElementById('ps-search-close').addEventListener('click', function () { searchDialog.close(); });
  guestLess.addEventListener('click', function () { searchGuests = Math.max(1, searchGuests - 1); syncSearchGuests(); });
  guestMore.addEventListener('click', function () { searchGuests = Math.min(8, searchGuests + 1); syncSearchGuests(); });
  document.getElementById('ps-search-clear').addEventListener('click', function () { searchWhere.value = ''; searchGuests = 1; clearSearchFilters = true; syncSearchGuests(); });
  document.getElementById('ps-search-form').addEventListener('submit', function (e) {
    e.preventDefault();
    leaveMapAreaMode(); q.value = searchWhere.value.trim(); sleeps.value = searchGuests;
    sleepsOut.textContent = searchGuests === 1 ? 'any' : searchGuests === 8 ? '8+' : searchGuests + '+';
    if (clearSearchFilters) { types = []; needs = []; [pills, welcome].forEach(function (group) { group.querySelectorAll('button').forEach(function (button) { button.setAttribute('aria-pressed', 'false'); }); }); }
    searchDialog.close();
    app.classList.remove('app--filters-open'); filterToggle.setAttribute('aria-expanded', 'false');
    searchPlace(); rememberSearch();
    q.focus({ preventScroll: true });
  });
  /* A tap anywhere else closes what is open: the filter panel, a suggestion list, the phone search dialog (its backdrop). */
  document.addEventListener('pointerdown', function (e) {
    if (app.classList.contains('app--filters-open') && !e.target.closest('#ps-filter-panel, #ps-filter-toggle')) {
      app.classList.remove('app--filters-open'); filterToggle.setAttribute('aria-expanded', 'false');
    }
    document.querySelectorAll('.ps-dest-suggest:not([hidden])').forEach(function (ul) {
      if (!e.target.closest('.ps-dest-suggest, #ps-q, #ps-search-where')) ul.hidden = true;
    });
  }, true);
  searchDialog.addEventListener('click', function (e) { if (e.target === searchDialog) searchDialog.close(); });
  /* The phone keyboard shrinks the visible viewport but not 100dvh: size and place the dialog from the visual viewport. */
  function fitSearchToViewport() {
    var vv = window.visualViewport; if (!vv) return;
    searchDialog.style.setProperty('--vv-h', Math.round(vv.height) + 'px');
    searchDialog.style.setProperty('--vv-top', Math.round(vv.offsetTop) + 'px');
    searchDialog.classList.toggle('ps-search--tight', vv.height < 620);
  }
  if (window.visualViewport) { window.visualViewport.addEventListener('resize', fitSearchToViewport); window.visualViewport.addEventListener('scroll', fitSearchToViewport); }
  fitSearchToViewport();
  /* Phone: a swipe up on the open filter panel folds it away (its scroll must already be at the end). */
  var panelTouch = null;
  filterPanel.addEventListener('touchstart', function (e) { if (e.touches.length === 1) panelTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: true });
  filterPanel.addEventListener('touchend', function (e) {
    if (!panelTouch || !app.classList.contains('app--filters-open') || !phoneLayout.matches) { panelTouch = null; return; }
    var t = e.changedTouches[0], dx = t.clientX - panelTouch.x, dy = t.clientY - panelTouch.y; panelTouch = null;
    var atEnd = filterPanel.scrollHeight - filterPanel.scrollTop - filterPanel.clientHeight < 2;
    if (dy < -50 && Math.abs(dx) < Math.abs(dy) && atEnd && e.target.tagName !== 'INPUT') { app.classList.remove('app--filters-open'); filterToggle.setAttribute('aria-expanded', 'false'); }
  }, { passive: true });
  filterToggle.addEventListener('click', function () {
    var open = filterToggle.getAttribute('aria-expanded') !== 'true';
    filterToggle.setAttribute('aria-expanded', String(open));
    app.classList.toggle('app--filters-open', open);
  });
  var groupState = { featured: true, fit: true, potential: true };
  var POPULAR_MIN_LISTINGS = 10, POPULAR_MAX_DESTINATIONS = 6;
  var initialPlace = new URLSearchParams(location.search).get('place');
  if (q && initialPlace) q.value = initialPlace;
  /* A pinch on the trackpad and the wheel zoom the map itself, like + and -, never the page around it.
     The circles need the top zoom up front. */
  /* This directory is US-only: the map never shows, or lets a guest pan to, anywhere else. */
  var US_BOUNDS = L.latLngBounds([17, -180], [72, -64]);
  // A hardcoded initial view, not fitBounds: before the container has a measured size, fitBounds can compute a wrong zoom.
  var map = L.map('ps-map', { scrollWheelZoom: true, maxZoom: 18, minZoom: 3, maxBounds: US_BOUNDS.pad(0.15), maxBoundsViscosity: 1 }).setView([39.5, -98.5], 4);
  // On a phone layout, wheel/trackpad scrolling continues down the page over the map.
  var phoneLayout = window.matchMedia('(max-width: 760px)');
  function syncMapScroll() {
    if (phoneLayout.matches) {
      map.scrollWheelZoom.disable();
      // Phone: the filter icon sits in the search pill; the view and card-size switches live inside the filter panel.
      if (filterToggle.parentElement !== searchRow) searchRow.appendChild(filterToggle);
      if (viewSwitch.parentElement !== filterPanel) filterPanel.appendChild(viewSwitch);
      if (cardControls.parentElement !== filterPanel) filterPanel.appendChild(cardControls);
      if (filterPanel.parentElement !== floatingControls) floatingControls.appendChild(filterPanel);
      q.placeholder = 'Where to?';
      q.readOnly = true; q.setAttribute('aria-haspopup', 'dialog');
    } else {
      map.scrollWheelZoom.enable();
      if (filterToggle.parentElement !== headerActions) headerActions.insertBefore(filterToggle, headerActions.firstChild);
      if (viewSwitch.parentElement !== headerActions) headerActions.appendChild(viewSwitch);
      if (cardControls.parentElement !== headerActions) headerActions.insertBefore(cardControls, viewSwitch);
      if (filterPanel.parentElement !== resultsEl) resultsEl.insertBefore(filterPanel, listEl);
      q.placeholder = 'Where to? City or state';
      q.readOnly = false; q.removeAttribute('aria-haspopup');
      if (searchDialog.open) searchDialog.close();
      closeSelected(false, false);
    }
    (homes || []).forEach(syncMarkerPopup);
    if (loaded) show();
    syncHomeWater();
  }
  phoneLayout.addEventListener('change', syncMapScroll);
  syncMapScroll();
  function syncCompactHeader() {
    app.classList.toggle('app--map-compact', phoneLayout.matches && view === 'map' && (sheetRatio >= 0.99 || mapHeaderCompact));
  }
  listEl.addEventListener('scroll', function () {
    if (phoneLayout.matches && view === 'map' && listEl.scrollTop > 16 && !selectedHome) { mapHeaderCompact = true; syncCompactHeader(); }
  }, { passive: true });
  /* Every home but the featured ones gathers into a circle with its count; a circle splits as the map
     zooms in, and homes on one spot fan out when it is clicked. Featured homes stay pins, on the map itself,
     so pins and circles always add up to the homes in the list. */
  var cluster = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 48, chunkedLoading: true,
    iconCreateFunction: function (c) {
      var n = c.getChildCount(), size = n < 10 ? 34 : n < 100 ? 42 : 50;
      return L.divIcon({ html: '<span>' + n + '</span>', className: 'app-cluster', iconSize: L.point(size, size) });
    } }).addTo(map);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  var homes = [], area = null, loaded = false;
  var destCenters = {}, destCounts = {}; // per destination: {lat,lng} centroid and home count, for the Where-to suggestions
  var featuredIcon = L.divIcon({
    className: 'ps-featured-pin', iconSize: [32, 44], iconAnchor: [16, 43], popupAnchor: [0, -37],
    html: '<svg viewBox="0 0 32 44" width="32" height="44" aria-hidden="true"><path class="ps-featured-pin__shape" d="M16 1C7.7 1 1 7.7 1 16c0 11 15 26 15 26s15-15 15-26C31 7.7 24.3 1 16 1Z"/><circle cx="16" cy="16" r="5" fill="white"/></svg>'
  });
  /* Photos live where <html data-image-base> says (one host, the LAZY bucket). While that is empty, the stopgap
     shards in data-image-shards apply: a JSON map from ID prefix to host (the four pleasant-street-images repos).
     Neither set: the repo's own images/ folder. Moving to the bucket is setting data-image-base and nothing else. */
  var root = document.documentElement, IMAGE_BASE = (root.dataset.imageBase || '').replace(/\/$/, '');
  var SHARDS = {}; try { SHARDS = JSON.parse(root.dataset.imageShards || '{}'); } catch (e) {}
  var SHARD_KEYS = Object.keys(SHARDS).sort(function (a, b) { return b.length - a.length; });
  function src(path) {
    if (!/^images\//.test(path)) return path;
    if (IMAGE_BASE) return IMAGE_BASE + '/' + path;
    var file = path.slice(7);
    for (var i = 0; i < SHARD_KEYS.length; i++) if (file.indexOf(SHARD_KEYS[i]) === 0) return SHARDS[SHARD_KEYS[i]].replace(/\/$/, '') + '/' + path;
    return SHARDS['*'] ? SHARDS['*'].replace(/\/$/, '') + '/' + path : path;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function known(v) { return v !== undefined && v !== null && v !== '' && v !== 'Unknown'; }
  function altFor(h, file, i) { return (h.photoAlts && h.photoAlts[file]) || (h.name + (i ? ', photo ' + (i + 1) : '') + (h.place ? ', ' + h.place : '')); }
  /* The page loads only each home's location and facts. Its photos, text and link (data/homes/<id>.json)
     arrive when its card is on screen, and the card is redrawn in place. */
  var byId = {};
  function detailsOf(h) {
    if (h.loaded) return Promise.resolve(h);
    if (!h.loading) h.loading = fetch('data/homes/' + encodeURIComponent(h.id) + '.json').then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (d) { Object.assign(h, d); h.loaded = true; return h; }).catch(function () { h.loading = null; return h; });
    return h.loading;
  }
  function refreshCards(h) {
    if (!h.loaded) return;
    document.querySelectorAll('[data-property="' + h.id + '"]').forEach(function (el) {
      var html = el.classList.contains('ps-card') ? card(h, h.missing, !!el.querySelector('[data-select-property]'))
        : fullCard(h, h.missing, el.classList.contains('ps-home--tiny'), el.classList.contains('ps-home--detail'));
      var tmp = document.createElement('div'); tmp.innerHTML = html;
      el.replaceWith(tmp.firstElementChild);
    });
  }
  function hydrate(container) {
    container.querySelectorAll('[data-property]').forEach(function (el) {
      var h = byId[el.dataset.property];
      if (h && !h.loaded) detailsOf(h).then(refreshCards);
    });
  }
  // Count confirmed card features; conditional policies remain incomplete.
  function featureCompleteness(h) {
    return ['guests', 'bedrooms', 'bathrooms', 'pets', 'kids'].filter(function (key) { return known(h[key]) && h[key] !== 'Conditional'; }).length;
  }
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
  /* Large and opened cards: every fact as a pill with words, unknowns spelled out. */
  function factPills(h) {
    function plural(n, one, many) { return n + ' ' + (String(n) === '1' ? one : many); }
    function policy(v, noun) { return v === 'Yes' ? noun + ' OK' : v === 'No' ? 'No ' + noun.toLowerCase() : v === 'Conditional' ? noun + ': ask host' : noun + ' unknown'; }
    var pills = [
      ['guests', known(h.guests) ? 'Sleeps ' + h.guests : 'Sleeps unknown', known(h.guests)],
      ['bedrooms', known(h.bedrooms) ? plural(h.bedrooms, 'bedroom', 'bedrooms') : 'Bedrooms unknown', known(h.bedrooms)],
      ['bathrooms', known(h.bathrooms) ? plural(h.bathrooms, 'bathroom', 'bathrooms') : 'Bathrooms unknown', known(h.bathrooms)],
      ['pets', policy(h.pets, 'Pets'), known(h.pets)],
      ['kids', policy(h.kids, 'Kids'), known(h.kids)]
    ];
    return '<ul class="ps-home__facts ps-home__facts--pills" aria-label="Facts">' + pills.map(function (p) {
      var policy = p[0] === 'pets' || p[0] === 'kids';   // only the policies get a colour: yellow unknown, pink no; everything else stays grey
      var tone = policy && !p[2] ? ' ps-pill--unknown' : policy && h[p[0]] === 'No' ? ' ps-pill--no' : '';
      return '<li class="ps-pill' + tone + '">' + factIcon(p[0]) + '<span>' + esc(p[1]) + '</span></li>';
    }).join('') + '</ul>';
  }
  function factRows(h, inline, detail) {   // bedrooms only on the opened card
    var fields = [['guests', 'Sleeps']].concat(detail ? [['bedrooms', 'Bedrooms']] : []).concat([['bathrooms', 'Bathrooms'], ['pets', 'Pets'], ['kids', 'Children']]);
    var rows = fields.filter(function (f) { return known(h[f[0]]); }).map(function (f) {
      var value = h[f[0]], isPolicy = f[0] === 'pets' || f[0] === 'kids';
      var display = isPolicy ? value === 'Yes' ? '✓' : value === 'No' ? '×' : '?' : value;
      var label = f[1] + ': ' + (value === 'Conditional' ? 'Ask host' : value);
      if (inline) return '<span class="ps-fact" title="' + esc(label) + '" aria-label="' + esc(label) + '">' + factIcon(f[0]) + '<span class="app-hide">' + f[1] + '</span><span class="ps-fact__value">' + esc(display) + '</span></span>';
      return '<div title="' + esc(label) + '" aria-label="' + esc(label) + '"><dt>' + factIcon(f[0]) + '<span class="app-hide">' + f[1] + '</span></dt><dd>' + esc(display) + '</dd></div>';
    }).join('');
    return rows ? inline ? '<span class="ps-home__facts ps-home__facts--inline">' + rows + '</span>' : '<dl class="ps-home__facts">' + rows + '</dl>' : '';
  }
  function policy(v) { return v === 'Conditional' ? 'Ask host' : known(v) ? v : 'Unknown'; }
  function shortDescription(s) {
    if (!known(s)) return 'Description not yet available.';
    s = String(s).replace(/\s+/g, ' ').trim();
    if (s.length <= 150) return s;
    var cut = s.slice(0, 149).replace(/\s+\S*$/, '');
    return cut.replace(/[.,;:!?\s]+$/, '') + '…';
  }
  function photoSet(h, all) {
    if (all && h.allPhotos && h.allPhotos.length) {   // the opened card: every photo, cover first
      var every = [h.coverPhoto].concat(h.cardPhotos || [], h.allPhotos);
      return every.filter(function (f, i) { return known(f) && every.indexOf(f) === i; });
    }
    if (h.cardPhotos && h.cardPhotos.length) return h.cardPhotos.slice(0, 3);
    var files = [h.coverPhoto].concat((h.photos || []).map(function (p) { return typeof p === 'string' ? p : p.file; }));
    var set = files.filter(function (f, i) { return known(f) && files.indexOf(f) === i; }).slice(0, 3);
    return set.length || !known(h.photo) ? set : [h.photo];   // no gallery: the opened card shows the row's photo
  }
  function platformBadges(h) {
    var names = { airbnb: 'Airbnb', vrbo: 'Vrbo', booking: 'Booking.com' };
    return ['airbnb', 'vrbo', 'booking'].filter(function (p) { return h.platformLinks && h.platformLinks[p] && h.platformLinks[p].length; }).map(function (p) {
      return '<span class="ps-platform ps-platform--' + p + '" role="img" aria-label="' + names[p] + ' link found"><img src="assets/platforms/' + p + '.svg" alt="" width="18" height="18"></span>';
    }).join('');
  }
  function madeBadge() { return '<a class="ps-claim-badge ps-made-badge" href="https://lazy.vacations/start/" target="_blank" rel="noopener" aria-label="Made with LAZY — get your free website"><img class="ps-claim-badge__logo" src="favicon.ico" alt="" width="20" height="20"><span>Made with LAZY</span></a>'; }
  /* The opened card: what the host's site does not say, named, so the guest knows to ask. */
  function unknownsLine(h) {
    var gaps = [['guests', 'how many it sleeps'], ['bedrooms', 'bedrooms'], ['bathrooms', 'bathrooms'], ['pets', 'pets'], ['kids', 'children'], ['type', 'the type of home']]
      .filter(function (f) { return !known(h[f[0]]); }).map(function (f) { return f[1]; });
    var ask = ['pets', 'kids'].filter(function (k) { return h[k] === 'Conditional'; }).map(function (k) { return k === 'kids' ? 'children' : k; });
    if (!gaps.length && !ask.length) return '';
    return '<p class="ps-home__unknown">' + (gaps.length ? 'The host’s website doesn’t say: ' + esc(gaps.join(', ')) + '. ' : '') + (ask.length ? 'Ask the host about ' + esc(ask.join(' and ')) + '. ' : '') + 'Check with them before you book.</p>';
  }
  function fullDescription(h) {
    var s = known(h.description) ? h.description : h.cardDescription;
    return known(s) ? String(s).replace(/\s+/g, ' ').trim() : 'Description not yet available.';
  }
  function fullCard(h, missing, tiny, detail) {
    var images = photoSet(h, detail);
    var displayPlace = h.place + (h.locationLabel ? ' · ' + h.locationLabel : '');
    var slots = tiny || detail ? [0] : [0, 1, 2];   // the opened card: the cover on top, the rest under the button
    var gallery = slots.map(function (i) {   // every photo is a link to the home's website, like the arrow and the button
      return images[i] ? '<a class="ps-gallery-link' + (i ? '' : ' ps-gallery-link--cover') + '" href="' + esc(h.url || '#') + '" target="_blank" rel="noopener" aria-label="Open ' + esc(h.name) + '’s website"><img src="' + esc(src(images[i])) + '" alt="' + esc(altFor(h, images[i], i)) + '" loading="lazy" decoding="async"></a>' : '<span class="ps-gallery__pending">' + (h.loaded ? 'Photo unavailable' : '') + '</span>';
    }).join('');
    var actions = '<div class="ps-home__actions"><a class="ps-action ps-action--primary" href="' + esc(h.url || '#') + '" target="_blank" rel="noopener">Open website<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7 M7 7h10v10"/></svg></a>' +
      (h.demo || h.featured ? '' : '<p class="ps-home__independent">Not affiliated with LAZY.</p>') + '</div>';
    var claimHref = 'mailto:sandy@lazy.vacations?subject=' + encodeURIComponent('Claim my house: ' + h.name) + '&body=' + encodeURIComponent('I would like to claim this Pleasant Street listing.\n\nProperty: ' + h.name + '\nWebsite: ' + h.url + '\nListing ID: ' + h.id + '\n\nMy name:\nMy relationship to the property:\n');
    return '<article class="ps-home' + (h.featured ? ' ps-home--featured' : '') + (tiny ? ' ps-home--tiny' : '') + (detail ? ' ps-home--detail' : '') + '" data-property="' + esc(h.id) + '">' +
      '<div class="ps-gallery">' + listingBadge(h) + (h.featured ? madeBadge() : detail ? '' : '<a class="ps-claim-badge" href="' + esc(claimHref) + '" aria-label="Claim ' + esc(h.name) + ' on Pleasant Street by email"><img class="ps-claim-badge__logo" src="favicon.ico" alt="LAZY" width="20" height="20"><span>Claim your house</span></a>') + '<div class="ps-photo-platforms">' + platformBadges(h) + '</div>' +
      gallery + '</div>' +
      (tiny ? '' : actions) +   // large and opened cards: Open website right under the cover
      '<div class="ps-home__body">' + (detail ? '<p class="ps-home__place">' + factIcon('location') + esc(displayPlace) + '</p>' : '<button type="button" class="ps-home__place ps-home__address" data-address-property="' + esc(h.id) + '" aria-label="Show ' + esc(h.name) + ' on map">' + factIcon('location') + esc(displayPlace) + '</button>') + '<h2 title="' + esc(h.name) + '">' + esc(h.name) + '</h2>' +
      (tiny ? '' : '<p class="ps-home__description">' + (h.loaded ? esc(detail ? fullDescription(h) : shortDescription(h.cardDescription || h.description)) : '') + '</p>') +
      (tiny ? (factRows(h, false, detail) || '<div class="ps-home__facts ps-home__facts--empty" aria-hidden="true"></div>') : factPills(h)) +
      (missing && missing.length ? '<p class="ps-home__missing">' + (tiny ? 'Potential fit · check with host' : 'May fit · check ' + esc(missing.join(', '))) + '</p>' : '') +
      (tiny ? actions : '') + '</div>' +
      (detail && images.length > 1 ? '<div class="ps-home__more-photos" aria-label="More photos of ' + esc(h.name) + '">' + images.slice(1).map(function (file, i) {
        return '<a class="ps-gallery-link" href="' + esc(h.url || '#') + '" target="_blank" rel="noopener" aria-label="Open ' + esc(h.name) + '’s website"><img src="' + esc(src(file)) + '" alt="' + esc(altFor(h, file, i + 1)) + '" loading="lazy" decoding="async"></a>';
      }).join('') + '</div>' : '') + '</article>';
  }
  function listingBadge(h) {
    if (!h.featured && !h.demo) return '';
    return '<span class="ps-card__featured">' + (h.featured ? 'Featured' : '') + (h.featured && h.demo ? ' · ' : '') + (h.demo ? 'Demo' : '') + '</span>';
  }
  function cardOpenOverlay(h) {
    return '<a class="ps-card__open" href="' + esc(h.url || '#') + '" target="_blank" rel="noopener" aria-label="Open ' + esc(h.name) + '’s website"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7 M7 7h10v10"/></svg></a>';
  }
  /* One home: its picture, name and place, selectable to open its pin on the map; Open website sits over the photo. */
  function card(h, missing, selectable) {
    var tag = selectable ? 'button' : 'div';
    return '<article class="ps-card' + (h.featured === true ? ' ps-card--featured' : '') + '" data-property="' + esc(h.id) + '"><' + tag + ' class="ps-card__select-body"' +
      (selectable ? ' type="button" data-select-property="' + esc(h.id) + '" aria-label="Show ' + esc(h.name) + ' on the map"' : '') + '>' +
      '<div class="ps-card__photo">' + listingBadge(h) +
      '<a class="ps-card__photo-link" href="' + esc(h.url || '#') + '" target="_blank" rel="noopener" aria-label="Open ' + esc(h.name) + '’s website">' +
      (h.photo ? '<img src="' + esc(src(h.photo)) + '" alt="' + esc(altFor(h, h.photo, 0)) + '" loading="lazy" decoding="async" width="560" height="350">' : '<span class="ps-gallery__pending" aria-hidden="true"></span>') + '</a>' + cardOpenOverlay(h) + '</div>' +
      '<span class="ps-card__name" title="' + esc(h.name) + '">' + esc(h.name) + '</span><span class="ps-card__place">' + esc(h.place) + '</span>' + factRows(h, true) +
      (missing && missing.length ? '<span class="ps-card__missing">Doesn’t say: ' + esc(missing.join(', ')) + '</span>' : '') + '</' + tag + '>' + (h.featured ? madeBadge() : '') + '</article>';
  }
  /* The map pin (or, when its marker is clustered, the circle standing in for it) for one home: coral while
     its card is hovered, and while it is the open popup from a card click. */
  function highlightTarget(h) {
    return (h && h.marker) ? (cluster.getVisibleParent(h.marker) || null) : null;
  }
  function setHighlight(h, kind, on) {
    var target = highlightTarget(h), el = target && target.getElement && target.getElement();
    if (el) el.classList.toggle((target === h.marker ? 'ps-marker--' : 'app-cluster--') + kind, on);
  }
  function syncMarkerPopup(h) {
    if (!h.marker) return;
    if (phoneLayout.matches) h.marker.unbindPopup();
    else if (!h.marker.getPopup()) h.marker.bindPopup(function () { return '<div class="ps-pop">' + card(h) + '</div>'; }, { minWidth: 220, className: h.featured ? 'ps-popup ps-popup--featured' : 'ps-popup' })
      .on('popupopen', function (e) { if (!h.loaded) detailsOf(h).then(function () { if (e.popup.isOpen()) e.popup.setContent('<div class="ps-pop">' + card(h) + '</div>'); }); });
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
  /* The tourist destination counts as a place too: "catskills" and "hamptons" find the homes labelled so. */
  function matchesHome(h, t) {
    if (matches(h.place, t)) return true;
    var d = (h.destination || '').toLowerCase();
    return !!d && (d.indexOf(t) === 0 || d.split(/[\s,]+/).some(function (w) { return w.indexOf(t) === 0; }));
  }
  /* Each filter sorts a home three ways: it says yes (a match), it says no (left out), or it does not
     say (it may fit). Location and the map area are always known, so they only include or leave out. */
  /* The list draws twenty cards at a time; the rest come as you scroll near the end of a group. */
  var PAGE = 20, pageHomes = {};
  function renderOne(h) { return view === 'cards' ? fullCard(h, h.missing, cardSize === 'tiny') : card(h, h.missing, true); }
  function loadMore(btn) {
    var key = btn.dataset.more, grid = btn.previousElementSibling, all = pageHomes[key] || [], have = grid.children.length;
    var tmp = document.createElement('div'); tmp.innerHTML = all.slice(have, have + PAGE).map(renderOne).join('');
    while (tmp.firstChild) grid.appendChild(tmp.firstChild);
    hydrate(grid);
    if (grid.children.length >= all.length) { if (moreWatcher) moreWatcher.unobserve(btn); btn.remove(); }
  }
  var moreWatcher = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) loadMore(en.target); });
  }, { rootMargin: '600px 0px' }) : null;
  listEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-more]'); if (b) loadMore(b);
    var fix = e.target.closest('.ps-none__fix'); if (fix) chooseDestSuggest(fix.dataset.place);
  });
  function show() {
    syncSearchSummary();
    if (!loaded) {
      listEl.innerHTML = '<div class="ps-loading" role="status"><img src="assets/lazy-cat-loading.gif" alt="" width="192" height="192"><span>Loading homes…</span></div>';
      countEl.textContent = '';
      return [];
    }
    var t = q && !mapAreaMode ? q.value.trim().toLowerCase() : '';
    var n = sleeps && +sleeps.value > 1 ? +sleeps.value : 0;   /* 1 on the slider is every home */
    var activeFilters = (n ? 1 : 0) + types.length + needs.length;
    filterCount.textContent = activeFilters;
    filterCount.hidden = !activeFilters;
    filterToggle.setAttribute('aria-label', 'Filters' + (activeFilters ? ', ' + activeFilters + ' active' : ''));
    var fits = [], maybe = [];
    homes.forEach(function (h) {
      h.missing = [];
      var out = (t && !matchesHome(h, t)) || ((view === 'map' || mapAreaMode) && (!h.marker || (area && !area.contains(h.marker.getLatLng()))));
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
      pageHomes[g.key] = g.homes;
      return '<details class="ps-results-group ps-results-group--' + g.key + '" data-group="' + g.key + '"' + (groupState[g.key] ? ' open' : '') + '>' +
        '<summary><span>' + g.title + '</span><span class="ps-results-group__count">' + g.homes.length + '</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary>' +
        (g.key === 'potential' ? '<p class="ps-results-group__note">Some requested details are missing or need host approval. Check with the host.</p>' : '') +
        '<div class="ps-results-grid">' + g.homes.slice(0, PAGE).map(renderOne).join('') + '</div>' +
        (g.homes.length > PAGE ? '<button class="ps-more" type="button" data-more="' + g.key + '">More homes</button>' : '') + '</details>';
    }).join('') || '<p class="ps-none">' + (t && placeMatches(t).close.length
        ? 'No homes for “' + esc(q.value.trim()) + '”. Did you mean <button type="button" class="ps-none__fix" data-place="' + esc(placeMatches(t).close[0].name) + '">' + esc(placeMatches(t).close[0].name) + '</button>?'
        : 'No homes here yet. Try another place' + (view === 'map' ? ', or zoom out.' : ' or change the filters.')) + '</p>';
    hydrate(listEl);
    listEl.querySelectorAll('[data-more]').forEach(function (b) { if (moreWatcher) moreWatcher.observe(b); });
    countEl.innerHTML = '<span class="app-count__total">' + (shown.length === 1 ? '1 home' : shown.length + ' homes') + '</span>' +
      (maybe.length ? ' <span class="app-count__potential">' + maybe.length + (maybe.length === 1 ? ' potential fit' : ' potential fits') + '</span>' : '');
    sheetCount.textContent = shown.length === 1 ? '1 home' : shown.length + ' homes';
    return shown;
  }
  function setSheetRatio(ratio) {
    var minimum = selectedHome ? 0.28 : 0.12;
    sheetRatio = Math.max(minimum, Math.min(1, ratio));
    app.style.setProperty('--sheet-height', (sheetRatio * 100) + '%');
    app.classList.toggle('app--sheet-collapsed', sheetRatio < 0.24);
    app.classList.toggle('app--sheet-expanded', sheetRatio >= 0.99);
    app.classList.toggle('app--detail-peek', !!selectedHome && sheetRatio < 0.99);
    if (sheetRatio < 0.8) mapHeaderCompact = false;
    syncCompactHeader();
    sheetHandle.setAttribute('aria-label', selectedHome ? 'Property card height' : 'Results panel height');
    sheetHandle.setAttribute('aria-valuemin', Math.round(minimum * 100));
    sheetHandle.setAttribute('aria-valuenow', Math.round(sheetRatio * 100));
    sheetHandle.setAttribute('aria-valuetext', (selectedHome ? 'Property card ' : 'Results panel ') + Math.round(sheetRatio * 100) + '% open');
  }
  /* The featured line: the set is repeated until it is wider than two screens, then it drifts at a crawl and
     wraps seamlessly. A finger, the mouse or keyboard focus pauses it; it resumes a few seconds after they leave. */
  var landingStrip = document.getElementById('ps-home-strip');
  function startFeaturedStrip(list) {
    if (!landingStrip || !list.length) { if (landingStrip) landingStrip.closest('section').hidden = true; return; }
    var one = list.map(function (h) { return fullCard(h, [], true); }).join('');
    landingStrip.innerHTML = one;
    hydrate(landingStrip);
    var setWidth = landingStrip.scrollWidth, copies = Math.max(2, Math.ceil((landingStrip.clientWidth * 2) / Math.max(1, setWidth)) + 1);
    landingStrip.innerHTML = new Array(copies + 1).join(one);
    hydrate(landingStrip);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var paused = false, resumeAt = 0, last = 0, SPEED = 12;   // pixels per second
    function rest(ms) { paused = true; resumeAt = Date.now() + ms; }
    ['pointerdown', 'touchstart', 'wheel'].forEach(function (ev) { landingStrip.addEventListener(ev, function () { rest(4000); }, { passive: true }); });
    landingStrip.addEventListener('pointerenter', function () { rest(60000); });
    landingStrip.addEventListener('pointerleave', function () { rest(2000); });
    landingStrip.addEventListener('focusin', function () { rest(60000); });
    landingStrip.addEventListener('focusout', function () { rest(2000); });
    landingStrip.addEventListener('scroll', function () {   // wrap: the copies make the line endless
      var w = landingStrip.scrollWidth / copies;
      if (landingStrip.scrollLeft >= w * (copies - 1)) landingStrip.scrollLeft -= w * (copies - 2);
      else if (landingStrip.scrollLeft <= 0) landingStrip.scrollLeft += w * (copies - 2);
    }, { passive: true });
    function tick(now) {
      if (paused && Date.now() >= resumeAt) paused = false;
      if (!paused && document.visibilityState === 'visible') landingStrip.scrollLeft += SPEED * Math.min(50, now - last) / 1000;
      last = now;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(function (t) { last = t; landingStrip.scrollLeft = 1; tick(t); });
  }
  function startSheetDrag(e, el) {
    if (e.button !== 0 || !phoneLayout.matches || view !== 'map') return;
    sheetDrag = { id: e.pointerId, y: e.clientY, height: resultsEl.getBoundingClientRect().height, ratio: sheetRatio };
    el.setPointerCapture(e.pointerId);
    app.classList.add('app--sheet-dragging');
    e.preventDefault();
  }
  function moveSheetDrag(e) {
    if (!sheetDrag || e.pointerId !== sheetDrag.id) return;
    setSheetRatio((sheetDrag.height + sheetDrag.y - e.clientY) / bodyEl.clientHeight);
  }
  sheetHandle.addEventListener('pointerdown', function (e) { startSheetDrag(e, sheetHandle); });
  sheetHandle.addEventListener('pointermove', moveSheetDrag);
  // A selected home's card: until it fills the screen, dragging anywhere on it grows it instead of scrolling it.
  // Full card scrolled to its top: a swipe down on it brings it back down (touch-action pan-up leaves that gesture to us).
  selectedBody.addEventListener('pointerdown', function (e) { if (selectedHome && (sheetRatio < 0.99 || selectedBody.scrollTop === 0) && !e.target.closest('a, button')) startSheetDrag(e, selectedBody); });
  selectedBody.addEventListener('scroll', function () { selectedBody.classList.toggle('is-at-top', selectedBody.scrollTop === 0); }, { passive: true });
  selectedBody.addEventListener('pointermove', moveSheetDrag);
  selectedBody.addEventListener('pointerup', endSheetDrag);
  selectedBody.addEventListener('pointercancel', function () { sheetDrag = null; app.classList.remove('app--sheet-dragging'); });
  function endSheetDrag(e) {
    if (!sheetDrag || e.pointerId !== sheetDrag.id) return;
    var delta = e.clientY - sheetDrag.y, start = sheetDrag.ratio;
    var stops = selectedHome ? [0.28, 0.5, 1] : [0.12, 0.48, 1];
    var next = stops.reduce(function (best, stop) { return Math.abs(stop - sheetRatio) < Math.abs(best - sheetRatio) ? stop : best; }, stops[0]);
    if (Math.abs(delta) < 4) next = sheetRatio < stops[1] - 0.05 ? stops[1] : sheetRatio < 0.95 ? 1 : stops[0];
    else if (Math.abs(delta) > 8 && Math.abs(next - start) < 0.05) next = delta > 0 ? stops.filter(function (s) { return s < start - 0.05; }).pop() || stops[0] : stops.find(function (s) { return s > start + 0.05; }) || 1;
    sheetDrag = null;
    app.classList.remove('app--sheet-dragging');
    setSheetRatio(next);
    frameSelected();
  }
  sheetHandle.addEventListener('pointerup', endSheetDrag);
  sheetHandle.addEventListener('pointercancel', function () { sheetDrag = null; app.classList.remove('app--sheet-dragging'); });
  sheetHandle.addEventListener('keydown', function (e) {
    var next = e.key === 'ArrowUp' ? sheetRatio + 0.1 : e.key === 'ArrowDown' ? sheetRatio - 0.1 : e.key === 'Home' ? (selectedHome ? 0.28 : 0.12) : e.key === 'End' ? 1 : null;
    if (next !== null) { e.preventDefault(); setSheetRatio(next); frameSelected(); }
  });
  function closeSelected(collapse, focus) {
    if (!selectedHome) return;
    if (selectedHome.marker) { selectedHome.marker.setZIndexOffset(selectedHome.featured ? 1000 : 0); setHighlight(selectedHome, 'selected', false); }
    selectedHome = null;
    selectedEl.hidden = true; listEl.hidden = false;
    app.classList.remove('app--detail-open');
    setSheetRatio(collapse ? 0.12 : priorSheetRatio);
    if (focus !== false && phoneLayout.matches && view === 'map') sheetHandle.focus({ preventScroll: true });
  }
  function openSelected(h) {
    if (!phoneLayout.matches) {
      setView('map');
      if (!h.marker) return;
      selectedHome = h;
      cluster.zoomToShowLayer(h.marker, function () { h.marker.openPopup(); setHighlight(h, 'selected', true); });
      return;
    }
    if (selectedHome) closeSelected(false, false);
    if (view !== 'map') setView('map');
    priorSheetRatio = sheetRatio;
    selectedHome = h;
    selectedTitle.textContent = h.name;
    selectedEl.setAttribute('aria-label', h.name + ' details');
    selectedBody.innerHTML = fullCard(h, h.missing, false, true);
    hydrate(selectedBody);
    selectedBody.scrollTop = 0; selectedBody.classList.add('is-at-top');
    selectedEl.hidden = false; listEl.hidden = true;
    app.classList.add('app--detail-open');
    setSheetRatio(0.5);
    map.closePopup();
    frameSelected();
    selectedClose.focus({ preventScroll: true });
  }
  function frameSelected() {
    manualMapMove = false;
    var h = selectedHome;
    if (!h || !h.marker || sheetRatio >= 0.99) return;
    h.marker.setZIndexOffset(2000);
    map.setView(h.marker.getLatLng(), Math.max(map.getZoom(), 11), { animate: false });
    map.panBy([0, bodyEl.clientHeight * sheetRatio / 2], { animate: false });
    setHighlight(h, 'selected', true);
  }
  document.getElementById('ps-selected-back').addEventListener('click', function () { closeSelected(false); });
  document.getElementById('ps-selected-share').addEventListener('click', function () {
    if (!selectedHome) return;
    var data = { title: selectedHome.name, text: selectedHome.name + ' — ' + selectedHome.place, url: selectedHome.url };
    if (navigator.share) navigator.share(data).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(selectedHome.url);
  });
  selectedClose.addEventListener('click', function () { closeSelected(true); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (searchDialog.open || recentDialog.open) return;
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
  /* Hovering a home's card highlights its pin (or its circle, if the pin is clustered) on the map, coral. */
  var hoveredHome = null;
  listEl.addEventListener('mouseover', function (e) {
    var el = e.target.closest('.ps-card[data-property], .ps-home[data-property]');
    if (!el || (hoveredHome && hoveredHome.id === el.dataset.property)) return;
    if (hoveredHome) setHighlight(hoveredHome, 'hover', false);
    hoveredHome = homes.find(function (h) { return h.id === el.dataset.property; }) || null;
    if (hoveredHome) setHighlight(hoveredHome, 'hover', true);
  });
  listEl.addEventListener('mouseout', function (e) {
    var el = e.target.closest('.ps-card[data-property], .ps-home[data-property]');
    var to = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.ps-card[data-property], .ps-home[data-property]');
    if (!el || to === el || !hoveredHome) return;
    setHighlight(hoveredHome, 'hover', false); hoveredHome = null;
  });
  selectedBody.addEventListener('scroll', function (e) {
    var strip = e.target;
    if (!strip.classList || !strip.classList.contains('ps-photo-strip')) return;
    var count = strip.parentElement.querySelector('.ps-photo-count');
    if (count && strip.clientWidth) {
      var index = Math.round(strip.scrollLeft / strip.clientWidth);
      Array.from(count.children).forEach(function (dot, i) { dot.classList.toggle('is-active', i === index); });
    }
  }, { capture: true, passive: true });
  function updateMapAreaLabel() {
    if (!mapAreaMode) return;
    var center = map.getCenter(), nearest = null, distance = Infinity;
    mapAreaPoints.forEach(function (p) { var d = center.distanceTo([p.lat, p.lng]); if (d < distance) { distance = d; nearest = p; } });
    q.value = nearest && distance <= 50000 && map.getZoom() >= 7 ? nearest.name + ' area' : '';
    q.placeholder = 'Map area'; q.dataset.mapArea = 'true';
  }
  fetch('assets/map-areas.json').then(function (r) { return r.json(); }).then(function (rows) { mapAreaPoints = rows.concat(mapAreaPoints); updateMapAreaLabel(); }).catch(function () {});
  var manualMapMove = false;
  // Phone: touching the map puts the results away — the sheet drops to its count strip (a selected home's card goes with it).
  function tuckSheet() { if (!phoneLayout.matches || view !== 'map') return; if (selectedHome) closeSelected(true, false); else if (sheetRatio > 0.12) setSheetRatio(0.12); }
  map.on('dragstart', function () { manualMapMove = true; tuckSheet(); });
  map.getContainer().addEventListener('click', function (e) { if (e.target.closest('.leaflet-control-zoom')) manualMapMove = true; }, true);
  map.getContainer().addEventListener('wheel', function () { if (map.scrollWheelZoom.enabled()) manualMapMove = true; }, { passive: true });
  map.getContainer().addEventListener('touchstart', function (e) { if (e.touches.length > 1) { manualMapMove = true; tuckSheet(); } }, { passive: true });
  map.getContainer().addEventListener('keydown', function (e) { if (['+', '-', '=', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.key) >= 0) manualMapMove = true; }, true);
  function syncArea() {
    if (view !== 'map') return;
    area = map.getBounds();
    show();
  }
  map.on('moveend', function () {
    if (manualMapMove && view === 'map') {
      manualMapMove = false;
      mapAreaMode = true; q.value = ''; q.placeholder = phoneLayout.matches ? 'Map area' : 'Map area — city or state';
      var params = new URLSearchParams(location.search); params.delete('place'); params.set('view', 'map');
      history.replaceState(null, '', location.pathname + (params.size ? '?' + params.toString() : ''));
      syncDestinations(); closeSelected(false, false);
    }
    updateMapAreaLabel(); syncArea();
  });
  /* Fit the map to homes: the map takes its real size first (it is hidden, 0×0, on the home page), and on phone
     the results sheet's height is left free so the homes sit in the visible part of the map. */
  function fitHomes(list, pad, maxZoom) {
    if (!list.length) return;
    map.invalidateSize();
    var bottom = phoneLayout.matches && view === 'map' && !app.classList.contains('app--cards') ? Math.round(resultsEl.getBoundingClientRect().height) : 0;
    var opts = { animate: false, paddingTopLeft: [0, phoneLayout.matches ? 70 : 0], paddingBottomRight: [0, bottom] };
    if (maxZoom) opts.maxZoom = maxZoom;
    map.fitBounds(L.latLngBounds(list.map(function (h) { return h.marker.getLatLng(); })).pad(pad), opts);
  }
  function searchPlace() {
    leaveMapAreaMode(); manualMapMove = false;
    setHomeMode(false);
    q.placeholder = phoneLayout.matches ? 'Where to?' : 'Where to? City or state';
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
    fitHomes(shown, 0.3, 10);
    syncArea();
  }
  if (q) q.addEventListener('input', searchPlace);
  q.addEventListener('keydown', function (e) { if (!phoneLayout.matches && e.key === 'Enter') rememberSearch(); });
  q.addEventListener('focus', function () { if (!phoneLayout.matches && mapAreaMode) { q.value = ''; leaveMapAreaMode(); } });
  q.addEventListener('blur', function () { if (!phoneLayout.matches) rememberSearch(); });
  /* Where to?, with nothing typed yet: destinations near you, or, without a precise fix, the best-known ones.
     Search stays to this catalog's own destinations only — never a world gazetteer, so "Cape" is Cape Cod,
     never Cape Town, and "Paris" never resolves to Paris, France. */
  var userLoc = null, locateTried = false;
  function haversineKm(a, b) {
    var R = 6371, toRad = function (d) { return d * Math.PI / 180; };
    var dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
    var s = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  }
  /* A destination is suggested only once it is filled: POPULAR_MIN_LISTINGS homes or more. Thinner ones stay searchable. */
  function filledDestinations() { return Object.keys(destCounts).filter(function (d) { return destCounts[d] >= POPULAR_MIN_LISTINGS; }); }
  function coolestDestinations() {
    return filledDestinations().sort(function (a, b) { return destCounts[b] - destCounts[a] || a.localeCompare(b); });
  }
  function suggestedDestinations() {
    var names = userLoc
      ? filledDestinations().filter(function (d) { return destCenters[d]; }).sort(function (a, b) { return haversineKm(userLoc, destCenters[a]) - haversineKm(userLoc, destCenters[b]); })
      : coolestDestinations();
    return names.slice(0, 8);
  }
  /* Typed text: places whose name starts with it; failing that, the closest names by edit distance ("chatam" → Chatham, MA).
     Only this catalog's own destination and town names, never a world gazetteer. */
  var placeIndex = [];
  function buildPlaceIndex() {
    var counts = Object.create(null);
    homes.forEach(function (h) { if (known(h.place) && !h.demo) counts[h.place] = (counts[h.place] || 0) + 1; });
    placeIndex = filledDestinations().map(function (d) { return { name: d, key: d.toLowerCase(), count: destCounts[d], destination: true }; })
      .concat(Object.keys(counts).map(function (p) { return { name: p, key: p.toLowerCase(), town: p.split(',')[0].trim().toLowerCase(), count: counts[p] }; }));
  }
  function editDistance(a, b) {   // edits to turn a into b; a swapped pair ("teh") counts as one
    var rows = [[]], i, j;
    for (j = 0; j <= b.length; j++) rows[0][j] = j;
    for (i = 1; i <= a.length; i++) {
      rows[i] = [i];
      for (j = 1; j <= b.length; j++) {
        var cost = a[i - 1] === b[j - 1] ? 0 : 1;
        rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
      }
    }
    return rows[a.length][b.length];
  }
  function placeMatches(text) {
    var t = text.toLowerCase().replace(/\s+/g, ' ').trim();
    if (t.length < 3) return { exact: [], close: [] };
    var exact = placeIndex.filter(function (p) { return p.key.indexOf(t) === 0 || (p.town && p.town.indexOf(t) === 0); });
    var close = exact.length ? [] : placeIndex.map(function (p) {
      var keys = p.town ? [p.key, p.town] : [p.key];
      var best = Math.min.apply(null, keys.map(function (k) { return editDistance(t, k.slice(0, Math.max(t.length, Math.min(k.length, t.length + 1)))); }));
      return { p: p, score: best / t.length };
    }).filter(function (m) { return m.score <= 0.34; }).sort(function (a, b) { return a.score - b.score || b.p.count - a.p.count; }).map(function (m) { return m.p; });
    var byCount = function (a, b) { return Number(!!b.destination) - Number(!!a.destination) || b.count - a.count; };
    return { exact: exact.sort(byCount).slice(0, 6), close: close.slice(0, 5) };
  }
  function renderTypedSuggest(ul, text) {
    var m = placeMatches(text), names = m.exact.length ? m.exact : m.close;
    ul.innerHTML = (names.length ? '<li class="ps-dest-suggest__label">' + (m.exact.length ? 'Places' : 'Did you mean') + '</li>' : '') +
      names.map(function (p) { return '<li><button type="button" data-place="' + esc(p.name) + '">' + esc(p.name) + '<span>' + p.count + ' homes</span></button></li>'; }).join('');
    ul.hidden = !names.length;
  }
  function renderDestSuggest(ul) {
    if (!ul) return;
    var names = suggestedDestinations();
    ul.innerHTML = (userLoc ? '<li class="ps-dest-suggest__label">Closest to you</li>' : '<li class="ps-dest-suggest__label">Popular destinations</li>') +
      names.map(function (d) { return '<li><button type="button" data-place="' + esc(d) + '">' + esc(d) + '<span>' + destCounts[d] + ' homes</span></button></li>'; }).join('');
    ul.hidden = !names.length;
  }
  function showDestSuggest(ul, input) {
    if (input.value.trim()) { ul.hidden = true; return; }
    renderDestSuggest(ul);
    if (!locateTried) {
      locateTried = true;
      if (navigator.geolocation) navigator.geolocation.getCurrentPosition(function (pos) {
        // A coarse, metro/region-scale fix (a big open location, not a precise one) is treated as no fix: show the coolest destinations instead.
        if (pos.coords.accuracy && pos.coords.accuracy > 50000) return;
        userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        renderDestSuggest(document.getElementById('ps-dest-suggest'));
        renderDestSuggest(document.getElementById('ps-search-dest-suggest'));
      }, function () {}, { timeout: 4000, maximumAge: 600000 });
    }
  }
  function chooseDestSuggest(name) {
    document.getElementById('ps-dest-suggest').hidden = true;
    document.getElementById('ps-search-dest-suggest').hidden = true;
    leaveMapAreaMode(); q.value = name;
    if (searchDialog.open) searchDialog.close();
    searchPlace(); rememberSearch();
  }
  [['ps-q', 'ps-dest-suggest'], ['ps-search-where', 'ps-search-dest-suggest']].forEach(function (pair) {
    var input = document.getElementById(pair[0]), ul = document.getElementById(pair[1]);
    if (!input || !ul) return;
    input.addEventListener('focus', function () { showDestSuggest(ul, input); });
    input.addEventListener('input', function () { if (input.value.trim()) renderTypedSuggest(ul, input.value); else showDestSuggest(ul, input); });
    input.addEventListener('blur', function () { setTimeout(function () { ul.hidden = true; }, 150); });
    ul.addEventListener('click', function (e) { var b = e.target.closest('button[data-place]'); if (b) chooseDestSuggest(b.dataset.place); });
  });
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
    var places = Object.keys(counts).filter(function (p) { return counts[p] >= (pageDestination ? 2 : POPULAR_MIN_LISTINGS); }).sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b); }).slice(0, pageDestination ? 12 : POPULAR_MAX_DESTINATIONS);
    destinationsEl.hidden = true; // Popular destinations are deferred until the catalog is ready.
    destinationsEl.innerHTML = '<span class="app-destinations__label">' + (pageDestination ? 'Towns' : 'Popular destinations') + '</span><button type="button" data-place="" aria-pressed="false">' + (pageDestination ? 'All of ' + esc(pageDestination) : 'All places') + '</button>' + places.map(function (p) {
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
      fitHomes(all, 0.1);
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
    manualMapMove = false;
    setHomeMode(false);
    var currentMapBounds = mapAreaMode ? (view === 'map' ? map.getBounds() : area) : null;
    if (next === 'cards') closeSelected(false, false);
    view = next;
    syncCompactHeader();
    app.classList.toggle('app--cards', view === 'cards');
    viewSwitch.querySelectorAll('[data-view]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.view === view)); });
    var params = new URLSearchParams(location.search);
    if (view === 'cards') params.set('view', 'cards'); else params.delete('view');
    history.replaceState(null, '', location.pathname + (params.size ? '?' + params.toString() : ''));
    if (view === 'map') { map.invalidateSize(); area = currentMapBounds; var shown = show().filter(function (h) { return h.marker; }); if (!mapAreaMode && shown.length) map.fitBounds(L.latLngBounds(shown.map(function (h) { return h.marker.getLatLng(); })).pad(0.1), { animate: false }); syncArea(); }
    else { area = currentMapBounds; show(); }
    listEl.scrollTop = 0;
  }
  viewSwitch.addEventListener('click', function (e) { var b = e.target.closest('[data-view]'); if (b) setView(b.dataset.view); });
  setView(view);
  setHomeMode(startOnHome);
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
  /* The homes: index.json, written from the database by tools/build-index.mjs. GitHub Pages sends a
     10-minute max-age and an ETag; the default fetch cache mode uses that instead of revalidating on
     every navigation (a reload, or returning after 10 minutes, still gets the current file). */
  // The locations file is fetched with the same version stamp as this script, so a release never reads a cached older shape.
  var assetVersion = (Array.prototype.slice.call(document.scripts).map(function (x) { return x.src; }).find(function (u) { return /map\.js\?v=/.test(u); }) || '').split('v=')[1] || '';
  fetch((map.getContainer().dataset.src || 'data/pins.json') + '?v=' + assetVersion).then(function (r) { return r.json(); }).then(function (list) {
    homes = list.filter(function (h) { return !pageDestination || h.destination === pageDestination; }).sort(function (a, b) {
      return Number(b.featured === true) - Number(a.featured === true) || featureCompleteness(b) - featureCompleteness(a) || a.name.localeCompare(b.name);
    }).map(function (h) {
      var markerOptions = { title: h.name, alt: h.name, zIndexOffset: h.featured === true ? 1000 : 0 };
      if (h.featured === true) markerOptions.icon = featuredIcon;
      if (typeof h.lat === 'number' && typeof h.lng === 'number') h.marker = L.marker([h.lat, h.lng], markerOptions)
        .on('click', function () { if (phoneLayout.matches) openSelected(h); })
        .on('popupclose', function () { if (selectedHome === h) { setHighlight(h, 'selected', false); selectedHome = null; } });
      syncMarkerPopup(h);
      byId[h.id] = h;
      return h;
    });
    loaded = true;
    var destSums = {};
    homes.forEach(function (h) {
      var d = h.destination; if (!d || d === 'Unknown') return;
      destCounts[d] = (destCounts[d] || 0) + 1;
      if (typeof h.lat === 'number' && typeof h.lng === 'number') {
        var sum = destSums[d] || (destSums[d] = { lat: 0, lng: 0, n: 0 });
        sum.lat += h.lat; sum.lng += h.lng; sum.n++;
      }
    });
    Object.keys(destSums).forEach(function (d) { var s = destSums[d]; destCenters[d] = { lat: s.lat / s.n, lng: s.lng / s.n }; });
    buildPlaceIndex();
    homes.forEach(function (h) { var town = h.town || h.place.split(',')[0]; if (h.marker && known(town) && town.length <= 40 && town.indexOf('/') < 0 && town.toLowerCase() !== 'other') mapAreaPoints.push({ name: town, lat: h.lat, lng: h.lng }); });
    var featuredHomes = homes.filter(function (h) { return h.featured; });
    var homePool = homes.filter(function (h) { return !h.featured && h.recordType === 'Property' && (h.loaded ? photoSet(h).length : h.hasPhoto); });
    for (var i = homePool.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), temp = homePool[i]; homePool[i] = homePool[j]; homePool[j] = temp; }
    // Keep complete facts first; the shuffle above only randomizes equal-score homes.
    homePool.sort(function (a, b) { return featureCompleteness(b) - featureCompleteness(a); });
    landingFeatured.innerHTML = homePool.slice(0, 100).map(function (h) { return fullCard(h, [], true); }).join('') || '<p class="ps-none">Stays are coming soon.</p>';
    hydrate(landingFeatured);
    startFeaturedStrip(featuredHomes);
    if (initialPlace) rememberSearch();
    popularDestinations();
    /* Open on the mainland: Hawaii in the same view zooms the map out past the edge of the tiles. */
    var mapped = homes.filter(function (h) { return h.marker; });
    var main = mapped.filter(function (h) { return h.lng > -130; });
    if (view === 'map' && mapped.length) {
      var initial = q.value.trim() ? mapped.filter(function (h) { return matchesHome(h, q.value.trim().toLowerCase()); }) : (main.length ? main : mapped);
      fitHomes(initial, 0.1);
      syncArea();
    } else show();
  }).catch(function () {
    listEl.innerHTML = '<p class="ps-none">We couldn’t load the homes. Please refresh and try again.</p>';
    countEl.textContent = '';
  });
})();
