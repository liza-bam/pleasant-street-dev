# Pleasant Street (dev)

A web app: vacation homes run by independent hosts, on a map and in a list. Each home opens its
own website. Public, not indexed (robots.txt disallows all, the page says noindex).

- `index.html`, `assets/` — the app: `app.css`, `map.js` (Leaflet), the two fonts.
- `data/homes.json` — the database: one record per home. `data/sources/` — what each import read.
- `images/` — one picture per home, 560×350 webp, named by the home's slug.
- `index.md`, `index.json`, `street.json` — written from the database by `node tools/build-index.mjs`.
  `index.md` is what the street assistant reads; `street.json` is what the map reads.

Add homes: `python3 tools/import.py <source.json> --source list|form|found|lazy` (needs Pillow), then push.
The workflow rebuilds the index on every push to the database, and every Monday checks that each
website still answers (`tools/check.mjs`); a site down two weeks running leaves the street until it answers again.
