# Data handoff

The Map/Cards UI now reads `index.json`; `street.json` remains a compatibility export. Card-owned
fields are `cardDescription`, `cardDescriptionSource`, `cardPhotos`, `cardPhotoLabel` and
`platformLinks`. Preserve these on imports. `data/sources/cards/website-review.json` documents
seven newly held redirects, duplicate operators and sites without a current vacation offering.
They remain in the database/CSV with `listingStatus: "Needs review"` and stay out of both views.
The card export and regional CSVs include actual platform URLs; the UI displays badges only.
Run `tools/prepare-cards.py` after material imports and `tools/verify-cards.py` before publishing.

The catalog import covers data, media, source evidence and sync/index tooling. Claude owns ongoing app/schema development. The additional UI change requested by Sandy marks the 15 LAZY demos Featured, with coral card borders and coral pins; imported entries use the same existing cards and their selected covers.

## Shared contract

`data/homes.json` contains the active Maine catalog plus the 15 existing demo records. The raw original research has 292 stable IDs; excluded websites and superseded operator summary cards remain in local research archives. New individual rentals use further stable ME IDs without renumbering existing entries. Demos have `demo: true` and `recordType: "Demo property"`.

The current active Maine catalog has 472 entries: 227 retained original records, 165 individual rentals from Rocky Coast, Newcastle/Maine Coast Cottages, Lakehurst and Jordan Rentals, and 80 verified operator-controlled properties resolved from aggregator discovery. The 61 excluded Maine records are documented in root `bad-websites.md` and `data/sources/maine/bad-websites.json`: 25 failed/mismatched sites and 36 photo-less listings excluded at Sandy's explicit request. The latter are not classified as unreachable; their full records are retained in `excluded-no-photos.json`. Both source preparation and material sync honor these exclusions so they cannot silently return to results. Four superseded operator summary cards and their individual replacement IDs are in `operator-replacements.json`. The 127-record aggregator research inventory is classified in `aggregator-verification.json`: 80 verified additions, 13 already in the catalog, one duplicate of another verified lead, one location-data conflict held for review and 32 unresolved direct websites. Only the 80 qualified records in `aggregator-approved.json` were added to the active map; discovery alone never grants approval. The seven inaccessible Sheepscot property routes remain among unresolved leads.

URL identity retains LiveRez `PageDataID` and Resort Management System `reservation_unitId`; otherwise all houses on a shared ASP/reservations path would overwrite one another. Search and tracking parameters are not property identity.

Both datasets use the same fields for description, rooms, bedrooms, bathrooms, guests, kids, pets, photos and address. Missing facts are the literal string `Unknown`. Confirmed negatives are `No`; unit-specific or approval-dependent policies are `Conditional`. A studio can have `bedrooms: 0`, which is not Unknown. Total rooms are not inferred from bedroom counts.

The normalized Maine source is `data/sources/maine/catalog.json`; the original collected CSV and source notes are beside it. The demo source is `data/sources/demos/catalog.json`. Evidence and conflicts are retained in the source files and per-record metadata.

`tools/import.py` preserves additional record keys rather than serializing a fixed whitelist. General-list Unknown values do not overwrite known database facts. Demo sync is authoritative for its refreshed facts and explicitly marks internal website contradictions Unknown. If fields are renamed in the app schema, update the import/projection mapping while retaining source evidence and IDs.

## Compatibility projection

`index.json` exposes the richer data. `street.json` is the current app's compatibility projection: numeric map coordinates only, unknown and conditional filter keys omitted, and a labeled no-photo fallback. The canonical database retains Unknown values and unmapped records. The wrong-country website ME-0066 is removed from active data and retained in the excluded-site research.

The richer fields are available for Claude's app controls. The import preserves the current app's state-name search and filter behavior. `featured: true` and `demo: true` identify the 15 existing LAZY demos independently of names or display labels. `contactPagesChecked` and `addressReassessment` retain the mandatory official Contact/About address check and access limitations. Office/camp contact addresses never establish an individual rental entrance or replace a listing's published map location.

## Collected material requirements

The Maine CSV and source records retain description source URLs, description status, collection status and explicit missing required fields. A record is Complete only with four property photographs, a physical Maine property/business address verified on its official website, and a collected source description. PO boxes, partial addresses, out-of-state offices and arrival marinas remain labeled and do not pass the physical-address requirement. A collected address is not automatically an independently geocoded rental entrance.

Descriptions retain source website evidence; the latest 80 additions use concise factual summaries with their primary source URLs and explicit summary basis. Missing source descriptions are Unknown rather than generated filler. Photo completeness is a separate field: a photo-complete record can still need an address or description. Logos remain separate from the four property photos. AI processing alone does not disqualify a photograph presented on the property's site; unrelated portraits, logos, screenshots and promotional layouts are excluded.

Sandy explicitly requires AI-processed property photographs to be included in results. Do not exclude a photo solely because of an AI-related filename, enhancement, virtual staging, retouching, or an illustration classifier label. Record its published source and prefer a building exterior for the cover.

To refresh reviewed material from the local package without resetting Claude's address-level coordinates or other app fields:

```
python3 tools/prepare-maine.py /Users/sandy/Documents/GitHub/offline-street-db
python3 tools/import.py data/sources/maine/operator-catalog.json --source found
python3 tools/import.py data/sources/maine/aggregator-approved.json --source found
python3 tools/sync-maine-materials.py
node tools/build-index.mjs
python3 tools/prepare-web-media.py
node tools/build-index.mjs
node tools/verify-catalog.mjs
```

The narrow refresh reuses the existing importer's card-image function and preserves existing app fields/pins. The operator and approved-aggregator imports are restricted to new individual rental records with published listing maps or explicitly approximate town coordinates; do not run a full original-catalog import to refresh media. Source evidence is under `data/sources/maine/`. `data/templates/State_Websites_template.csv` is the blank state-neutral collection format; its Location header replaces Maine location. The Maine preparation script remains specific to the current Maine package.

In the local research package, `scripts/build-csv.mjs`/`scripts/validate.py` first rebuild/check the retained original rows. `aggregator-sweep/build-operator-catalog.py` normalizes reviewed individual rentals and labeled contact addresses before preparation. After the repo refresh, run `node scripts/export-current-catalog.mjs` and `python3 scripts/assemble-current-package.py` from the local package root to export the combined 41-column active CSV, separate candidate CSV, selected media, and reassessment report. The combined active CSV is copied to the repo's authoritative `data/sources/maine/catalog.csv`. The separate aggregator research CSV includes the current eligibility classification, duplicate IDs and verified direct property links. It is not imported automatically. The approved subset is normalized locally in `aggregator-sweep/approved-catalog.json` before using the existing importer. Validate `tools/verify-catalog.mjs` after assembling and verify the actual public domain after deployment.

The newly collected source photos exceeded the GitHub Pages published-size limit when copied at original resolution. After assembling, run `python3 tools/prepare-web-media.py` in the repo, rebuild the index, and verify again. It publishes proportional images within 1600px (no crop or generated content), retaining original files in the local research cache. `web-image-derivatives.json` and photo metadata keep both original and published SHA-256 hashes/dimensions. This is the explicit image-preparation deviation required to fit hosting; the importer/card workflow and all app fields remain unchanged.

## Sync and checks

```
python3 tools/sync-demos.py
python3 tools/import.py data/sources/demos/catalog.json --source lazy
node tools/build-index.mjs
node tools/verify-catalog.mjs
```

The existing Monday/manual GitHub workflow refreshes the demos before its health check and index build. No new schedule was created. Public demo configuration is allowlisted: calendar feeds, booking tokens, widget config and API keys are not copied into the catalog.
