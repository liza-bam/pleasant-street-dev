# Pleasant Street (dev)

A web app: vacation homes run by independent hosts, on a map and in a list. Each home opens its
own website. Public, not indexed (robots.txt disallows all, the page says noindex).

## Map and cards views

The header switch selects Map or Cards. Both share the place, capacity, type and welcome filters.
Map results follow the visible map; Cards shows all matching locations, including listings without
coordinates. `?view=cards&place=VT` opens Vermont cards directly. The Tiny/Large switch applies
inside Cards; `&size=tiny` opens the compact version. Tiny has one photograph, name, location and
website/claim buttons, with no fact grid or description. Large has a cover and two 4:3 extra photos,
a source-based summary of at most 150 characters and five property facts. Both use one-line names
with ellipses and show platform-logo badges on the photograph. Claim opens a prefilled email draft
to `sandy@lazy.vacations`.

Featured, Fit and Potential fit are independent accordions, with live counts. Featured and Fit
start open; Potential fit starts closed. Collapse choices survive filtering and view changes.
Each listing belongs to one group. Featured follows the same location and hard filters, and
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

## Keeping the demos in sync

`python3 tools/sync-demos.py` reads the 15 existing public demo websites and writes an allowlisted import under `data/sources/demos/`. Import it with `python3 tools/import.py data/sources/demos/catalog.json --source lazy`, then rebuild the index. The existing Monday/manual workflow runs this sync before its website-health check.

Names, descriptions, location labels, bedroom/bathroom facts, policies and selected property photos are refreshed. Conflicting published facts become Unknown with evidence in `syncNotes` and `data/sources/demos/sync-report.json`. A hidden welcome badge is not a confirmed No policy. Demo addresses are labeled fictional demo content, never verified rental addresses.

The importer preserves additional fields owned by the app/schema and keeps stable IDs and URLs across both sources. A general-list Unknown does not erase an already known database fact. See `DATA_SYNC.md` for the handoff to app development.
