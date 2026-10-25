# Pleasant Street (dev)

The street with real homes: a hidden copy of the walk on lazy.vacations. Public, not indexed
(robots.txt disallows all, every page says noindex).

- `index.html`, `assets/` — the app, copied from rentals-marketing by `node tools/pull-app.mjs`. Do not edit here.
- `data/homes.json` — the database: one record per home. `data/sources/` — what each import read.
- `images/` — one picture per home, 560×350 webp, named by the home's slug.
- `index.md`, `index.json`, `street.json` — written from the database by `node tools/build-index.mjs`.
  `index.md` is what the street assistant (Elfsight chat) reads; `street.json` is what the map reads.

Add homes: `python3 tools/import.py <source.json> --source lazy|list|form|found` (needs Pillow), then push.
The workflow rebuilds the index on every push to the database, and every Monday checks that each
website still answers (`tools/check.mjs`); a site down two weeks running leaves the street until it answers again.
