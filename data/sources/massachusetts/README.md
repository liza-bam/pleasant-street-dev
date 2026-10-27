# Massachusetts rental research

The master is `massachusetts_independent_rental_websites.csv`, using the repository's existing 49-column structure with Massachusetts location. `massachusetts_candidates.csv` and `massachusetts_approved.csv` derive from that master. Approval means researched eligibility, not owner participation.

The first consolidated pass contains 191 research outcomes: 146 eligible websites, 34 candidates, seven exclusions and four unavailable sites. Two eligible operator summaries are superseded by individual rentals, and two other eligible records await additional safely attributed photos. The first import package contains 142 distinct photo-ready records. All 146 eligible first-pass records have a separate pet/child policy audit; missing and conflicting policies remain Unknown with checked sources.

Boston discovery remains in progress. Dedicated workers are expanding MassLiving, Furnished Quarters and Stayloom/Heirloom catalogs into distinct Massachusetts unit records. These counts are not an exhaustive statewide inventory. Original tourism, regional directory, aggregator and builder sources, actual queries, pagination outcomes and unreviewed queues are in `research-progress.json` and the discovery files. Earlier ME/VT/NH platform-discovery gaps are recorded there too.

`verification-batch-*.json` holds source-backed individual outcomes; `policy-audit-*.json` holds the mandatory policy pass; `photo-sources.json` records actual image URLs, source pages, hashes and dimensions. Exact rental addresses remain distinct from offices, mailing addresses and arrival points. Unavailable websites remain in research and `bad-websites.md` but are excluded from public imports.

CSV authoring uses Artifact Tool. The Python adapter normalizes JSON and media metadata; it does not author CSVs. Rebuild with `python3 tools/prepare-massachusetts.py`, export the three CSVs through Artifact Tool, import `approved-import.json`, and run the existing cards/index preparation and catalog/card verification commands. Preserve newer remote application changes before publishing, then verify the live page.
