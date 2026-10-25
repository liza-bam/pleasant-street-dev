# Data handoff

The catalog import covers data, media, source evidence and sync/index tooling. Claude owns ongoing app/schema development. The additional UI change requested by Sandy marks the 15 LAZY demos Featured, with coral card borders and coral pins; imported entries use the same existing cards and their selected covers.

## Shared contract

`data/homes.json` contains the 292 Maine website records plus the 15 existing demo records, matched by normalized URL. Stable IDs are `ME-0001`…`ME-0292` and the existing `LAZY-<slug>` IDs. Demos have `demo: true` and `recordType: "Demo property"`.

Both datasets use the same fields for description, rooms, bedrooms, bathrooms, guests, kids, pets, photos and address. Missing facts are the literal string `Unknown`. Confirmed negatives are `No`; unit-specific or approval-dependent policies are `Conditional`. A studio can have `bedrooms: 0`, which is not Unknown. Total rooms are not inferred from bedroom counts.

The normalized Maine source is `data/sources/maine/catalog.json`; the original collected CSV and source notes are beside it. The demo source is `data/sources/demos/catalog.json`. Evidence and conflicts are retained in the source files and per-record metadata.

`tools/import.py` preserves additional record keys rather than serializing a fixed whitelist. General-list Unknown values do not overwrite known database facts. Demo sync is authoritative for its refreshed facts and explicitly marks internal website contradictions Unknown. If fields are renamed in the app schema, update the import/projection mapping while retaining source evidence and IDs.

## Compatibility projection

`index.json` exposes the richer data. `street.json` is the current app's compatibility projection: numeric map coordinates only, unknown and conditional filter keys omitted, and a labeled no-photo fallback. The canonical database retains Unknown values and unmapped records. The known wrong-country website ME-0066 remains in the database as Needs review and is excluded from recommendations.

The richer fields are available for Claude's app controls. The import preserves the current app's state-name search and filter behavior. `featured: true` and `demo: true` identify the 15 existing LAZY demos independently of names or display labels.

## Sync and checks

```
python3 tools/sync-demos.py
python3 tools/import.py data/sources/demos/catalog.json --source lazy
node tools/build-index.mjs
node tools/verify-catalog.mjs
```

The existing Monday/manual GitHub workflow refreshes the demos before its health check and index build. No new schedule was created. Public demo configuration is allowlisted: calendar feeds, booking tokens, widget config and API keys are not copied into the catalog.
