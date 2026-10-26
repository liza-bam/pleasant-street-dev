# Maine aggregator verification — 2026-10-25

Assessed 127 saved Maine leads against opened operator property pages, Contact/About pages, published booking/inquiry links, and the existing catalog. This pass added 80 distinct properties with 320 reviewed property photographs and source-based factual descriptions. Each has four photographs; logos are not included in that count.

Results: 80 verified additions; 13 already cataloged; one duplicate of an approved lead; one conflicting location held; 32 unresolved operator websites. Qualification and per-record evidence are in `aggregator-verification.json`. Only `aggregator-approved.json` is imported. This is a checked batch, not a claim of exhaustive Maine coverage.

Official pages publish 47 rental, shared-estate or shore/homeport addresses. Thirty-three private rental street addresses remain Unknown. Shore/homeport points are labeled separately from houseboat moorings. Bayley’s office address is separate from each rental address. Just Happy Homes’ bathroom count remains Unknown because visible and structured descriptions conflict. The Otis House remains unapproved because its structured state contradicts its Maine locality. Seven Sheepscot property routes returned 404; neither those routes nor unresolved aggregator leads were promoted.

Public operator sitemaps supplied unit pages missing from the first rendered Hostaway catalog page. Exact property identity and Maine locality were checked before matching names; unrelated same-name and out-of-state units were not imported. Promotional image collages found in two fourth-photo selections were replaced with actual photographs of the correct units.

Backend commands: `tools/import.py` for the qualified subset, `tools/prepare-web-media.py`, `tools/build-index.mjs`, and `tools/verify-catalog.mjs`. A before/after comparison confirmed the 451 pre-existing canonical records and pins are unchanged. The 61 exclusions, including the explicitly removed 36 listings without photos, remain excluded. App layout and schema controls were not changed.
