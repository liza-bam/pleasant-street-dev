---
name: search-homes
description: Find independent vacation rentals on Pleasant Street by place, group size, type and pets or kids policy, and hand the guest the owner's own website.
---

# Search Pleasant Street homes

Pleasant Street lists US vacation rentals run by independent hosts. Every home links to the owner's own website; book there.

1. Fetch `https://liza-bam.github.io/pleasant-street-dev/index.json` (one JSON array, one object per home).
2. Filter on `place` or `destination` (e.g. "Cape Cod"), `guests` (sleeps, a number), `type` (House, Cabin, Camp, Apartment), `pets` and `kids` ("Yes", "No", "Conditional", "Unknown").
3. Show `name`, `place`, `cardDescription`, the facts, and send the guest to `url`, the owner's website.

A destination page exists at `https://liza-bam.github.io/pleasant-street-dev/<slug>/` (e.g. `/cape_cod/`); the list of destinations is in `llms.txt`.
