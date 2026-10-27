# New York rental research

First publication snapshot covers NY01 IDs throughNY-0028:28 outcomes,21eligible websites,5candidates,1unavailable site and1exclusion. Thirteen entries have distinct importable website identities and checked three-photo card sets: twelve individual direct-platform apartments plus one RadioCity assigned apartment category. Six further photo-ready RadioCity categories share website URLs and remain held for explicit unit-identity integration; two categories await correct private-interior media. These are listing/offer counts, not physical-house counts.

The threeCSV exports use49columns. `approved-import.json` is narrower than the eligible research CSV. Source dates, policies, addresses, real OTA URLs and photographs are retained with precise status. Minimum30-day stays and conflicts remain explicit. Research approval does not establish owner participation.

`verification-publication-20261026.json` and `discovery-publication-20261026.json` are saved publication-source snapshots. The live worker continues in separate owned JSON files; this first publication does not establish comprehensiveNYC/statewide coverage. The other fourNY regional jobs remain separately allocated.

Map locations use opened own building/property/neighborhood sources in `location-sources.json`. No office pins are used. Three entries without supported property map locations remain in Cards, with suppressed town-center geocoding. Approximate areas are labeled publicly. Shared-building locations are not individual entrances.

Normalize this checked snapshot with `python3 tools/prepare-regional-research.py new-york NY --snapshot data/sources/new-york/verification-publication-20261026.json`, exportCSV via ArtifactTool, import through `tools/import.py`, apply card/index preparation and verify. This workflow has been tested for thisNYsnapshot; it does not claim all futurestates/shapes are already tested.
