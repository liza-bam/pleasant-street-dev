# Pleasant Street (dev)

A web app: vacation homes run by independent hosts, on a map and in a list. Each home opens its
own website. Public, not indexed (robots.txt disallows all, the page says noindex).

## Map and cards views

On phones, a small white header places the coral LAZY L on white at the left and Add your
house / Recent searches at the right. Page backgrounds are white, action buttons use coral, and
active view/size/filter switches use neutral gray. Home clears the place, filters, property selection and view preferences and returns to a simple
welcome/search screen with the LAZY water background, white LAZY logo, Lobster Pleasant Street
heading and direct-booking copy. Desktop reuses the LAZY contour-water component with Sandy’s illustrated island map
in a compact split hero; the same illustration appears below the search on phones. A white, dense Tiny-card grid follows. The homepage shows 100 cards when
available: featured stays first, followed by individual Property records with photos, prioritizing complete guest, bedroom, bathroom, child and pet details. Equal-completeness records are shuffled, so the sample changes on reload and never changes which houses are featured. A URL without a place or view starts on that home screen. Add your
house opens an email inquiry; recent searches are saved on this device and restore their place,
group size and filters. The floating search bar shows the selected group size beside the place,
including when restoring a recent search. A manual map pan or zoom clears the destination and
shows the nearest known town as an approximate area label (for example Portland area), while retaining group size and filters; automatic movements preserve the destination. Area labels use saved town centers in assets/map-areas.json
and never act as destination filters. Map gestures stay inside Leaflet; controls suppress double-tap
smart zoom without globally disabling accessible page pinch zoom. Search and the smaller icon/view/size controls float above the map or cards.
The result count lives in the bottom drawer, not beside search. Search opens a compact floating
Where/Who panel, without dates or history inside it. Filters keep the existing controls.

Map view uses a draggable results tray over a full-height map. Drag down for more map, up for more
results; the full-width handle has at least a 48px touch area, a larger visible grip and
also supports arrow keys and Home/End. A marker, result or card address opens a
floating property card initially showing its top. Pull the handle up to reveal the full card with
swipeable photos and its website link. Fully expanding results covers the map entirely. Close returns to the map with
the results tray collapsed. Cards view retains normal page scrolling, with one Large or two Tiny
cards per row. Desktop keeps its separate map and results panes and standard map popups.

The header switch selects Map or Cards. Both share the place, capacity, type and welcome filters.
Map results follow the visible map; Cards shows all matching locations, including listings without
coordinates. `?view=cards&place=VT` opens Vermont cards directly. The Tiny/Large switch applies
to Cards and the phone map results; `&size=tiny` opens the compact version. Tiny has one photograph, name, location and
website button, a secondary claim badge and compact feature icons, with no description. Large has a cover and two 4:3 extra photos,
a source-based summary of at most 150 characters and available property facts shown as icons and
values. Feature icons also stay visible in both map card sizes. Unknown facts remain in the database and are omitted from these icon rows. Names use smaller single-line titles with ellipses on every screen. Cards show platform-logo badges on the photograph. A small white claim badge at the photo’s
top-right says “Claim your house” beside the existing LAZY L logo and opens a prefilled email draft
to `sandy@lazy.vacations`. Open website is the larger primary action, neutral gray by default and coral on hover, with an independent-host
notice underneath for non-LAZY listings. Featured houses show Made with LAZY instead of a claim
badge, linking to the existing free website request at https://lazy.vacations/start/. On Tiny
cards, claim and Made with LAZY badges show only the LAZY logo; accessible labels and links remain.

Featured, Fit and Potential fit are independent accordions, with live counts. Featured and Fit
start open; Potential fit starts closed. Collapse choices survive filtering and view changes.
Each listing belongs to one group. Within each group, homes with more confirmed card features
(guests, bedrooms, bathrooms, children and pets) sort first, with alphabetical ties. Popular
destinations are hidden until the catalog is ready. Featured follows the same location and hard filters, and
retains an uncertainty note when relevant facts are missing. A confirmed mismatch excludes a
listing; unknown capacity/type or unknown/conditional requested pet/child policies need a host
check. Collapsing a group does not remove map pins or change the result count.

Popular destination pills count real published listings with an identifiable town, excluding
demos and vague locations. The default threshold is 10 listings and the maximum is six pills;
`POPULAR_MIN_LISTINGS` and `POPULAR_MAX_DESTINATIONS` in `assets/map.js` control these values.
Counts are catalog totals before guest/type/policy filters. Clicking a pill applies the exact
published destination in any view. Coastal-region groupings require explicit regional metadata;
the app does not infer those from approximate town coordinates.

`data/sources/cards/cards_inventory.csv` is a derived export of all retained records, including
the seven explicitly held records. The existing Maine and Vermont CSVs also retain actual Airbnb,
Vrbo and Booking.com URLs, source pages, check date and result. Badges are nonclickable and only
appear for attributable listing or operator-profile links. No Booking.com listing link was found
in this pass. Two websites could not be checked for platform links; the CSV identifies them.

Reviewed card descriptions, photo selections, new image provenance, platform-link evidence and
website review decisions are in `data/sources/cards/`. Imported core facts and original photo
sets remain intact. An operator card can identify the named rental or campus shown in its photos;
its unit facts are not assigned to the operator as a whole. To reapply reviewed card material,
run `python3 tools/prepare-cards.py`, `node tools/build-index.mjs`, then
`python3 tools/verify-cards.py` and `node tools/verify-catalog.mjs`. New records require their own
card descriptions, three photos and explicit platform-link review status before claiming coverage.

- `index.html`, `assets/` — the app: `app.css`, `map.js` (Leaflet), the two fonts.
- `data/homes.json` — the database: one record per website, including individual properties and rental operators. `data/schema.json` describes its fields.
- `data/sources/maine/` — the reviewed Maine source CSV, normalized import JSON, CSV schema and selected photo/address provenance. Original source notes remain intact.
- `images/` — optimized 560×350 WebP card covers and the collected property photo sets. Property originals retain their `ME-0001-cover.ext`, `ME-0001-000.ext` etc. names; optional logos are separate `ME-0001-logo.ext` files.
- `index.md`, `index.json`, `street.json` — written from the database by `node tools/build-index.mjs`.
  `index.md` is what the street assistant reads; `street.json` is what the map reads.

Add homes: `python3 tools/import.py <source.json> --source list|form|found|lazy` (needs Pillow), then `node tools/build-index.mjs` and push.
The workflow rebuilds the index on every push to the database, and every Monday checks that each
website still answers (`tools/check.mjs`); a site down two weeks running leaves the street until it answers again.

## Maine catalog import

Prepare the reviewed local package with `python3 tools/prepare-maine.py ../offline-street-db`, then run:

```
python3 tools/import.py data/sources/maine/catalog.json --source list
node tools/build-index.mjs
node tools/verify-catalog.mjs
```

The import is repeatable: URL matching updates an existing entry rather than duplicating it. Catalog IDs remain `ME-0001` through `ME-0292`. The 15 existing LAZY records are preserved with stable `LAZY-<slug>` IDs.

Unknown facts are explicitly `Unknown`, including rooms, bedrooms, bathrooms, children and pets. `No` is a confirmed negative. `Conditional` means the published policy varies by unit or needs approval; original wording is retained. Numeric guest capacity is populated only when unambiguous; ranges and operator-wide totals remain in `capacityDetails`. The current `street.json` adapter omits unknown/conditional filter values for compatibility with the existing app's “May fit” behavior. The canonical database keeps them explicit.

The database retains all selected photos, a separate logo, descriptions, published address components, address type, status and source URLs. Read address types carefully: an office, PO box, arrival marina or out-of-state contact is not a Maine house location. Third-party-only addresses remain marked unverified. Missing image sets show a text placeholder; the importer does not substitute logos or fetch new share images for catalog records without photos.

Map positions remain approximate town/area locations. Town-coordinate lookups are cached in `data/sources/town-coordinates.json`; entries without reliable coordinates remain in the full database and index. The current map adapter includes only numeric coordinates. Exact street-address pins are not shown. A record with a known wrong-country website stays in the database as `Needs review` and is omitted from public recommendations.

Direct downloads after deployment:

- `data/homes.json` — full database
- `data/schema.json` — database format
- `data/sources/maine/catalog.csv` — collected CSV, including address research
- `data/sources/maine/catalog.json` — normalized input for reimport
- `data/sources/maine/photo-sources.json` and `address-sources.json` — provenance

The source CSV retains original blank cells and verification notes. The normalized database uses explicit Unknown values. Importing local evidence does not count as a fresh live website-health check.

## Vermont research and first publication batch

The Vermont research starts from the Maine CSV's 41-column structure, with `Vermont location` replacing `Maine location` in the separate regional file. See `data/sources/vermont/vermont_independent_rental_websites.csv` for the master and the adjacent `vermont_candidates.csv` and `vermont_approved.csv` for separate inventories. Approval means checked website/direct-inquiry eligibility, not owner participation. Research, aggregator expansion, address checking and detail/photo follow-up passes are ongoing.

`data/sources/vermont/approved-import.json` contains the first eight verified operator/property websites published for prototype testing. The existing Vermont LAZY demo remains separate. Source URLs, reviewed facts, address provenance and photo provenance are retained beside the CSVs. Raw page captures are local research material and are not published. New map positions are explicitly approximate town locations; an operator's office is not a verified address for every managed rental.

Reapply reviewed facts/media with `python3 tools/prepare-vermont.py`, then import with `python3 tools/import.py data/sources/vermont/approved-import.json --source found`, rebuild with `node tools/build-index.mjs`, and check with `node tools/verify-catalog.mjs`. The existing Maine and demo records are preserved.

## New Hampshire research — 77-record verification audit

`data/sources/new-hampshire/new_hampshire_independent_rental_websites.csv` retains 76 statewide
directory records and one regional addition in the existing 49-column format. All 77 have
opened-source review outcomes in `website-audit.json`: 58 verified eligible websites, 11
exclusions (including one duplicate), six unavailable sites and two unverified candidates (Trailhead deferred by the user; Lakes Region unresolved).
The approved export contains all 58 eligible records. The candidate/audit export retains the
other 19 with precise statuses; review is not the same as verified eligibility.

The publication package contains 42 eligible records with three distinct saved card photos;
16 additional verified records await sufficient attributable media. Contact/property address
reviews distinguish actual rentals, shared campuses, offices, PO boxes and undisclosed addresses.
Source-based descriptions, unit/operator fact distinctions, disagreements and actual platform
links are preserved. Badges require matching destination identity. `bad-websites.md` and the
regional `bad-websites.json` retain failed URLs and Robie's recovered replacement domain.

User-reviewed decisions are retained separately from website evidence in
`verification-followup-user-decisions.json`; acceptance does not imply owner participation.
Trailhead is deferred and Lakes Region remains unresolved; neither is imported.
`happy-grounds-expansion.json` retains all 18 operator campuses and their scope decisions. This completes review of the existing
77-record inventory, not comprehensive statewide discovery: regional, town, aggregator and
platform expansion remain in `research-progress.json`. Massachusetts and Rhode Island follow.

Merge reviewed evidence with `python3 tools/prepare-new-hampshire.py`, then rebuild the three
regional CSV exports using the existing Artifact Tool workbook workflow. Reimport with
`python3 tools/import.py data/sources/new-hampshire/approved-import.json --source found`,
then `python3 tools/prepare-cards.py`, `node tools/build-index.mjs`, `node tools/verify-catalog.mjs`
and `python3 tools/verify-cards.py`. Preserve the reviewed card CSV export when adding records.
The map uses approximate town coordinates, not individual cottage entrances.

## Keeping the demos in sync

`python3 tools/sync-demos.py` reads the 15 existing public demo websites and writes an allowlisted import under `data/sources/demos/`. Import it with `python3 tools/import.py data/sources/demos/catalog.json --source lazy`, then rebuild the index. The existing Monday/manual workflow runs this sync before its website-health check.

Names, descriptions, location labels, bedroom/bathroom facts, policies and selected property photos are refreshed. Conflicting published facts become Unknown with evidence in `syncNotes` and `data/sources/demos/sync-report.json`. A hidden welcome badge is not a confirmed No policy. Demo addresses are labeled fictional demo content, never verified rental addresses.

The importer preserves additional fields owned by the app/schema and keeps stable IDs and URLs across both sources. A general-list Unknown does not erase an already known database fact. See `DATA_SYNC.md` for the handoff to app development.
