# Massachusetts rental research

The master is `massachusetts_independent_rental_websites.csv`, using the repository's existing 49-column structure with Massachusetts location. `massachusetts_candidates.csv` and `massachusetts_approved.csv` derive from that master. Approval means researched eligibility, not owner participation.

The consolidated research through batch16 contains 362 outcomes: 274 eligible websites, 61 candidates, 21 exclusions (including superseded operator summaries), and six unavailable sites. The current import package has 268 distinct photo-ready listing records. Three previously published operator summaries have been archived and replaced with their verified individual rentals/categories. Every eligible record has a separate pet/child policy audit; missing and conflicting policies remain Unknown with checked sources. Six eligible records await correctly attributed additional photos; shared-building-only photo sets are explicitly labeled.

The listings include individual rentals, small operators and seven explicitly identified accommodation categories. A listing count is not a claim of that many distinct physical houses.

Boston discovery remains in progress. Dedicated workers are expanding MassLiving, Furnished Quarters and Stayloom/Heirloom catalogs into distinct Massachusetts unit records. These counts are not an exhaustive statewide inventory. Original tourism, regional directory, aggregator and builder sources, actual queries, pagination outcomes and unreviewed queues are in `research-progress.json` and the discovery files. Earlier ME/VT/NH platform-discovery gaps are recorded there too.

`verification-batch-*.json` holds source-backed individual outcomes; `policy-audit-*.json` holds the mandatory policy pass; `photo-sources.json` records actual image URLs, source pages, hashes and dimensions. Exact rental addresses remain distinct from offices, mailing addresses and arrival points. Unavailable websites remain in research and `bad-websites.md` but are excluded from public imports.

CSV authoring uses Artifact Tool. The Python adapter normalizes JSON and media metadata; it does not author CSVs. Rebuild with `python3 tools/prepare-massachusetts.py`, export the three CSVs through Artifact Tool, import `approved-import.json`, and run the existing cards/index preparation and catalog/card verification commands. Preserve newer remote application changes before publishing, then verify the live page.
