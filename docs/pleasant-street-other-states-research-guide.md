# Pleasant Street vacation rental research for any US state

Use this guide to research **one explicitly assigned US state** for Pleasant Street. It is intended for another LLM working independently of the current New England/New York team. The national scope is all50 states; this guide supplies the method, data contract, evidence requirements and deliverables for any additional state.

The goal is a comprehensive, traceable inventory of independent vacation accommodation with a working own website or operator-controlled direct-booking/inquiry page. Collect genuine property photos, source-based descriptions, actual rental/contact addresses, pet and child policies, booking-platform links and all other supported CSV fields. Work toward geographic and source completeness rather than stopping at a numeric target.

Prototype: https://liza-bam.github.io/pleasant-street-dev/ . Repository: https://github.com/liza-bam/pleasant-street-dev . The coordinator integrates checked results into the existing directory. Research eligibility does not mean an owner has joined or endorsed Pleasant Street.

## Start the outside worker with this prompt

Replace the bracketed assignment values before starting. The coordinator must reserve a nonoverlapping ID block if several workers share a state.

```text
Research independent vacation rental websites in [STATE NAME], USPS code[XX], for Pleasant Street.
Assigned geography:[ENTIRE STATE OR EXPLICIT REGION]. Reserved stable IDs:[XX-START through XX-END].
Research date:[ACTUAL DATE]. Coordinator:[NAME/CHANNEL].

Read this guide, sop/pleasant-street-rental-research/SKILL.md, its relevant references, sop/browser/SKILL.md, and the supplied existing CSV/schema before acting. Follow the actual SOP. Do not replace it with a shorter search-only workflow.
Check us-state-research-registry.json and existing repository records to avoid duplicating another worker.

Carry out statewide/regional/town, aggregator, booking-platform and reverse-name searches in the required sequence; then verify actual opened pages, deduplicate, collect details/address/policies/photos/OTA links, perform gap passes and consolidate.
Search snippets are leads, never verification. Open own property/operator and actual direct-booking/inquiry destinations; do not submit forms or book.

Keep master, candidates and approved research inventories separate. Preserve excluded and unavailable outcomes with reasons. Fill fields only as evidence supports, using Unknown for missing normalized facts. Save source URLs, dates and restrictions. Distinguish operator/office facts from individual-unit facts.
Cover all properties with correctly attributed photos before polishing variety. Never mix private rooms/interiors between properties. Save local assets with source URLs, scope, hashes and dimensions; inspect them. AI-generated illustrations are permitted only with explicit generated labels/provenance and cannot establish property facts.

Return the required CSV/evidence/media bundle and exact source/geography coverage with remaining queues. If a required tool is unavailable, identify that exact step and provide supported staging evidence without claiming the missing deliverable is complete. Do not edit the app, import or publish; the coordinator owns integration. Continue the assigned research passes, saving incremental checkpoints; writing a plan or handoff does not finish the research.
```

## Choose a state without duplicating existing work

At the national registry's creation, existing research covered **Maine, Vermont, New Hampshire, Massachusetts, Rhode Island, New York and Connecticut**. These seven remain in progress; do not independently restart them without coordination. The other **43 states are available for outside assignment**, not already assigned or running.

The older “twelve assignments” were5NewYork,5Connecticut and2RhodeIsland regional jobs. They are not twelve additional states. The operational backlog is documented separately in `pleasant-street-research-handoff.md`; outside researchers starting a new state do not need to inherit those jobs or temporary local paths.

A state with one featured LAZY house is not a completed statewide inventory. California is available despite one real featured property. Before assigning, check the current registry and repo because ownership can change. DC and territories can be separate future scopes; they are not counted in the50 states.

## What qualifies

Include independent vacation houses, cabins, cottages, lake/coastal rentals, apartments, studios, small inns/lodges, sporting camps, glamping, local operators and local vacation managers. Campgrounds qualify through rental lodgings/group accommodation, and vacation condos rented to skiers qualify. Preserve the actual offer scope.

A verified record needs opened-source evidence that:

1. The property/operator is identifiable and offers vacation accommodation in the assigned state.
2. Its own website or operator-controlled platform site opens and represents that offer.
3. Guests can reserve or inquire directly with that operator through an actual published booking page, form, phone or email.
4. It is not an unresolved alias, duplicate or overlapping offer counted as another house.
5. Source URLs support the identity, location, offer and direct path.

A custom domain is not required. A branded Lodgify, Guesty, OwnerRez, Hospitable, Hostaway/holidayfuture or Dtravel site can qualify when controlled by the rental operator. A discovery listing on Houfy or an aggregator is not enough by itself; reverse-search for an independent/direct operator site.

Exclude Airbnb-only/Vrbo-only entries without a separate qualifying direct site, unrelated websites, national hotel chains, large national aggregators, ordinary hotels without qualifying vacation offerings and confirmed duplicates. Retain uncertain candidates instead of forcing approval. A local manager's catalog is different from a national aggregator; classify it accurately.

Direct inquiry must apply to the represented offer. Email accepted only for groups or multi-cabin occasions does not establish ordinary individual-cabin direct booking. A working own site with valid inquiry can still qualify when an old checkout widget fails; preserve the widget limitation separately.

## Required research sequence

### First pass with statewide and regional sources

Discover and open the assigned state's actual official tourism lodging directories. Use relevant vacation rental, cabin/cottage, condo, inn/lodge, campground and alternative lodging categories. Do not assume a guessed URL works or that all directory categories contain eligible rentals.

Then search regional tourism organizations, chambers, municipalities, counties and local lodging/business directories. Follow each actual operator Website link. Save the originating accommodation/detail URL, not just the tourism homepage. Skip unrelated or strange entries with a precise reason.

Build a county/region checklist that covers the entire assigned geography: major destinations, smaller towns, lakes, rural communities, coast/islands where applicable, ski/mountain areas and less-visited places. A destination-heavy list is not statewide coverage.

### Town and rural searches

Use searches such as:

```text
[State] vacation rental book direct
[Town] vacation rental direct booking
[Town] cabin cottage rental official website
[Lake] lake house rental owner website
[Region] vacation rental property manager
[Property name] official website book direct
```

Retain actual query strings, search/date, relevant opened URLs and remaining towns. Search-result snippets are only discovery leads. A website becomes verified only after its own relevant pages are inspected.

### Aggregator and independent directory pass

Search **Houfy, Staythere, Dtravel, DirectBookingHost**, relevant regional rental aggregators and other independent direct-booking directories discovered during the pass. Record each source separately with actual coverage status. Open catalog/property pages, identify name/location and follow or reverse-search the host/operator site.

Audit candidate sites that are themselves aggregators. Expand their catalogs into real property leads, preserve catalog+detail provenance, and find each property's own direct site. Do not publish the aggregator as an independent home or approve every result because it appears under a state query.

Catalogs may contain nationwide or neighboring-state inventory. Classify by actual accommodation location; an operator office or search filter does not establish every property's state. Preserve out-of-state outcomes and route them to their state owner.

### Booking-platform website pass

Search **Lodgify, Guesty/Guesty Bookings, OwnerRez, Hospitable**, and additional direct-site builders found during discovery. Use platform name/domain, town, operator name and exact property name. Platform sites may use custom domains; no results for one hosted-domain query is not a finished platform pass.

An operator homepage may feature only a few houses while Search/All listings has hundreds. Follow actual controls and finish visible pagination/Load More before claiming a catalog sweep complete. Save exact unit IDs/URLs. A catalog count does not prove that many unique in-state houses.

### Reverse search and eligibility pass

Reverse-search property and operator names to find alternative own sites, working rebrands and manager-controlled pages. Classify URLs as host/operator, local manager or aggregator. Open accommodation detail, About/Contact, direct booking/inquiry and actual policy pages. Save supporting facts and precise status.

Deduplicate by name, domain, location, operator, alternate URLs and true unit identity. Retain separate genuine units in a shared building. Resolve combined estate/buyout offers that overlap individual units. Do not infer physical-house counts from booking IDs or assigned room categories.

### Detail, address, photo, policy and gap passes

Revisit eligible/ready entries to fill supported fields. Open property details and Contact Us; inspect Location/Directions/Getting Here/About/footer/booking as needed. Collect photos, source-based short descriptions, capacity, bedrooms, bathrooms, actual published price/terms and OTA links. Then return to **every ready/approved property** for the mandatory pet/child policy audit. Finish a gap pass for contradictory facts, missing media, unavailable sites and unresolved aliases.

Do not stop after the first batch merely because it is large. Maintain geography and named-source coverage, plus exact next queues, throughout the work.

## Required evidence rules

### Exact status vocabulary

Use only:

- `Verified independent website`
- `Verified platform-hosted website`
- `Source found in web research`
- `Earlier list, not rechecked`
- `Not eligible`
- `Website unavailable`

The first two require opened-site identity/location/accommodation/direct-path verification. Discovery evidence or downloaded photos alone cannot establish them. Approved research, media-ready publication and live deployment are different states.

### Unknowns and descriptions

Fill all supported fields without guessing. Preserve source CSV blank conventions; normalized records use `Unknown`. A confirmed negative is `No`; conditional admission is `Conditional`. Studios can have bedrooms0. Do not infer total rooms from bedrooms or add outdoor showers to bathroom counts.

Write a source-based description of roughly150 characters, with actual source URL and verification status. Paraphrase concrete features rather than copying full promotional paragraphs. Generated images cannot support description facts.

Save price with currency, per-night/week/month basis, dates/season, minimum stay and material exclusions. An example calendar quote is not a static starting rate. Monthly/seasonal visitor accommodation needs actual vacation/visit-use evidence; do not automatically treat a corporate apartment or annual lease as a vacation home.

### Addresses

For every property/operator, follow the published Contact/Contact Us link and inspect the actual property page. If no separate contact page is linked, record that and inspect its visible contact/footer/booking location fallback. Do not invent a route and treat a guessed404 as a failed Contact check.

Save address components, role, source URL, check date, supporting observation and conflicts. Distinguish individual rental, shared building/campus, operator office, PO box/mail, arrival point and partial location. Preserve rental and contact addresses separately. An office address must not be assigned as every managed house's entrance. Keep an unpublished rental street Unknown; approximate map coordinates cannot reveal a verified street number. Inspect the actual own property-location map before assigning a point. Preserve own-published approximate area centers with their precision and public label; never spread a city-center fallback into pins presented as rental addresses. Keep conflicting/unverified locations in Cards without a map pin until resolved. Save `locationCoordinates` with lat/lng/precision/source URL and supporting observations.

### Pet and child policies

Read actual property house rules, FAQ, rental terms, booking policies and linked agreements/PDFs. Expand relevant accordions and save each answer while visible. Generic children/pets selectors are not admission evidence. Minimum booking guest age is not a ban on children. Silence remains Unknown.

Record approval, species, size/count limits, fees/deposits, ages, unit differences and scope. Shared operator rules apply only when applicability is established. Preserve contradictory official statements and set affected facts Unknown until resolved. Save checked-with-no-policy-found explicitly after actual relevant pages were inspected.

### Unavailable websites

“Bad website” means one that does not open as a rental website, not unattractive design. DNS/connection failures, parked domains, expired-domain advertising, disconnected hosting placeholders and unrelated redirects need recorded outcomes. A responding HTTP status is not enough.

A blank first capture needs fresh state/screenshot. Security challenges, browser disconnections, failed standalone asset downloads and a broken booking widget do not prove the entire property website is dead. Retry plausible transient failures, reverse-search replacements and stop repeated access loops. Save URL/date/observed cause and alternative evidence.

Keep the row in research, exclude it from approved publication, and include a state bad-websites log for coordinator merging into repo-root `bad-websites.md`. Preserve recovery history when a replacement opens.

### Booking-platform links and badges

Scan every property's own pages for attributable **Airbnb, Vrbo and Booking.com** destinations. Save exact URLs, identity/deep-link parameters, source pages, date and checked outcome. Distinguish an actual property listing, operator profile, generic platform link and unrelated recommendation. No found link means no invented badge.

A removed OTA destination does not invalidate a working independent site. Retain its failure and omit that badge. The app later shows icon-only nonclickable badges over the photo; outside workers return actual links in CSV/evidence and do not build UI.

## Photos with strict property identity

Current priority is coverage across every property; later passes improve exterior/interior/bedroom/setting variety. Different views of one authentic room are usable. Never mix separate rentals' private photos or borrow a neighboring property's kitchen to complete a set.

Collect a cover plus up to3additional photos and a separate authentic logo when available. Logos, maps and Coming Soon graphics are not accommodation photos. Use stable names such as `images/XX-0001-cover.webp`, `-000.webp`, `-001.webp`, `-002.webp`; retain original source URL/page, date, role, scope, dimensions and original/published hashes. Inspect saved images or contact sheets.

Scope collection to the actual current-unit gallery/modal. Recommendation cards can contain different houses, while the real gallery may be in CSS backgrounds or a frame. Different platform asset IDs can contain identical private interiors. Compare actual pictures, not URL uniqueness.

Shared building entrances/common spaces and assigned-category representative images are usable only with their actual applicability and explicit public scope labels. A category is not a known individual house. Keep media holds for unresolved private-interior attribution; do not invent a combined category to hide it.

Use bounded web derivatives, preferably at most800px on the long edge for current new collections, preserving original provenance. Card crops are derived separately by the coordinator. Do not return an enormous full-resolution public image tree without labeling originals versus derivatives.

AI-generated images are authorized, but require the configured image-generation skill/tool, generation provenance and visible **AI-generated illustration** labeling. Keep them separate from authentic photos; they cannot verify appearance/amenities/location or inflate authentic-photo counts. Operator-published AI-enhanced/retouched photos are not automatically invented images; retain processing provenance rather than rejecting them for filenames alone.

## CSV and structured deliverables

Use the actual repository CSV and current regional schema. The package supplies an existing Maine CSV and the newer49-column schema; the latter includes platform-link/directory columns added after early Maine collection. Re-read the actual target schema before authoring. Do not reconstruct a reduced table from the original ten-column user prompt.

For a new state, use `ID` and the stable USPS prefix, preserve header order, and replace the regional location column with `[State name] location`. Keep ZIP codes as text. Do not renumber when sorting. Reserve IDs before parallel work; gaps can be owned discovery leads.

Return one authoritative `<state_slug>_independent_rental_websites.csv`, plus derived `<state_slug>_candidates.csv` and `<state_slug>_approved.csv`. Candidate/audit export retains all nonverified outcomes, including unavailable and excluded rows. Approval means researched website eligibility, not owner participation or deployment.

The current49headers are supplied in `templates/csv-schema-template.json`. Details without dedicated CSV columns, such as bedrooms/bathrooms/total rooms, need structured per-ID evidence and retained notes; never discard them.

Author CSV through the configured Artifact Tool workbook method in this project. If the outside environment does not have it, identify the missing capability and return normalized JSON staging plus evidence/media; do not claim finished CSVs or silently substitute a different authoring workflow. The coordinator can complete the required export. Python may parse CSV read-only or create JSON intermediates.

### Suggested state package

```text
state-research-package/
  README.md
  <state_slug>_independent_rental_websites.csv
  <state_slug>_candidates.csv
  <state_slug>_approved.csv
  csv-schema.json
  verification-batch-<assignment>.json
  policy-audit-<assignment>.json
  discovery-<assignment>.json
  address-sources.json
  photo-sources.json
  platform-links.json
  bad-websites.md
  images/
  MANIFEST.sha256
  validation-report.json
```

If a file is pending or a source has no findings, say so precisely; do not fabricate rows or placeholder photos to make the package appear complete. Save raw full-page captures/originals separately from selected web media. Exclude credentials, cookies and signed widget configuration. Keep final evidence concise rather than republishing entire copyrighted source pages.

### Per-record evidence fields

Use the existing project's worker shapes, keeping at least: stableID, name, realwebsite, city/state, actualcheckdate, exactevidencestatus, offerclassification/type, operatoridentity/source, originaldiscoverymethod/sourceURL, additionaldiscoveryURLs, openedURLs, Contactpageschecked, rentalAddress/contactAddress withroles/sources, directbooking/inquirymethod/destination, source-baseddescription, supportedfacts/restrictions/conflicts, policyaudit, platformlinks/status, photoprovenance/scope and remaininggaps.

Store true `unitIdentity` when several actual units share one website URL. Preserve real names/codes/anchors. Do not invent fake website parameters to force unique records. The coordinator must adapt the importer for shared URLs before those units can go live.

## Coverage and validation before returning

Maintain each named source as `Not searched`, `Search attempted`, `Partially reviewed` or `Reviewed for this pass`, with actual queries, opened catalog/detail URLs, page/lead counts and remaining queues. Save every assigned region/county/town cluster's status. A source name in a plan is not completed work.

Check IDs, status allowlist, target-state location, direct-path applicability, duplicates/overlapping offers, actual policy audits, address roles, description lengths, image paths/hashes/scope, actual platform destinations and approved/candidate memberships. Parse/read back saved CSVs, compare schema/order and inspect workbook output. Report actual commands/results; don't replace verification with intentions.

Return a short status distinguishing:

- Directory appearances and unique discovery leads.
- Outcomes by exact evidence status.
- Eligible individual units, assigned categories, grouped offers and operator summaries.
- Properties with usable photos and the exact missing/held IDs.
- Policy/address/OTA checks completed versus pending.
- Geographic/source coverage and exact continuation queues.
- Files saved, tests actually run and missing capabilities.
- No app import or live publication by the outside worker.

Do not call the state finished because a batch reached a target. Date the actual completed pass and retain unresolved gaps. Save incremental checked batches so integration can proceed without waiting for the whole state's discovery to finish.

## Coordinator integration boundary

Outside workers do research and return packages. One coordinator owns national ownership, cross-state deduplication, CSV consolidation, importer changes, app data and deployment. The existing MA prep script is not a generic state importer. New-state adapters must preserve rich evidence, rental-versus-office addresses, true unit identity and public photo labels.

A requested handoff or status update does not stop ongoing authorized research. The current team continues its seven-state work while outside researchers cover additional states. Keep the operational backlog separate from this reusable guide.

The coordinator verifies published changes by opening the live page and checking unique IDs, state filters, photos, labels and exclusions. Until that occurs, results are saved research or imported local data, not live listings.

## National state registry

The following assignment statuses are a dated starting point. Update ownership in the actual registry before starting concurrent work. Available means unstarted by this team, not automatically assigned to an LLM.

| State | Code | Research assignment status |
| --- | --- | --- |
| Alabama | AL | Available for external assignment |
| Alaska | AK | Available for external assignment |
| Arizona | AZ | Available for external assignment |
| Arkansas | AR | Available for external assignment |
| California | CA | Available for external assignment |
| Colorado | CO | Available for external assignment |
| Connecticut | CT | Existing team work; coordinate |
| Delaware | DE | Available for external assignment |
| Florida | FL | Available for external assignment |
| Georgia | GA | Available for external assignment |
| Hawaii | HI | Available for external assignment |
| Idaho | ID | Available for external assignment |
| Illinois | IL | Available for external assignment |
| Indiana | IN | Available for external assignment |
| Iowa | IA | Available for external assignment |
| Kansas | KS | Available for external assignment |
| Kentucky | KY | Available for external assignment |
| Louisiana | LA | Available for external assignment |
| Maine | ME | Existing team work; coordinate |
| Maryland | MD | Available for external assignment |
| Massachusetts | MA | Existing team work; coordinate |
| Michigan | MI | Available for external assignment |
| Minnesota | MN | Available for external assignment |
| Mississippi | MS | Available for external assignment |
| Missouri | MO | Available for external assignment |
| Montana | MT | Available for external assignment |
| Nebraska | NE | Available for external assignment |
| Nevada | NV | Available for external assignment |
| New Hampshire | NH | Existing team work; coordinate |
| New Jersey | NJ | Available for external assignment |
| New Mexico | NM | Available for external assignment |
| New York | NY | Existing team work; coordinate |
| North Carolina | NC | Available for external assignment |
| North Dakota | ND | Available for external assignment |
| Ohio | OH | Available for external assignment |
| Oklahoma | OK | Available for external assignment |
| Oregon | OR | Available for external assignment |
| Pennsylvania | PA | Available for external assignment |
| Rhode Island | RI | Existing team work; coordinate |
| South Carolina | SC | Available for external assignment |
| South Dakota | SD | Available for external assignment |
| Tennessee | TN | Available for external assignment |
| Texas | TX | Available for external assignment |
| Utah | UT | Available for external assignment |
| Vermont | VT | Existing team work; coordinate |
| Virginia | VA | Available for external assignment |
| Washington | WA | Available for external assignment |
| West Virginia | WV | Available for external assignment |
| Wisconsin | WI | Available for external assignment |
| Wyoming | WY | Available for external assignment |

## Maintained research SOP appendix

The following is the current complete research skill, supplied so a worker can follow the actual method rather than a search-only summary. The regional history is contextual; the method applies to the assigned state. Additional references and browser rules are included in the kit.

### Pleasant Street rental research

Build a comprehensive, traceable inventory of independent vacation accommodation with an operator's own website or direct-booking page. Prioritize individual hosts and small local operators. Apply this method to any of the 50 US states. For external help on additional states, read [nationwide-handoff.md](references/nationwide-handoff.md) and the repository national state registry; keep existing-state backlog separate from the new worker instructions. The current requested expansion is **New York (five regional assignments), Connecticut (five) and Rhode Island (two)**, alongside preserved Massachusetts work. Follow the same source sequence within every state. Record actual active agents separately from queued assignments and respect the runtime concurrency cap; never claim all requested workers are running when they are queued. Preserve the existing Maine, Vermont, New Hampshire and Massachusetts inventories and unfinished research checkpoints.

#### Repository and preparation

- Prototype: https://liza-bam.github.io/pleasant-street-dev/.
- Repo: `/Users/sandy/Documents/GitHub/pleasant-street-dev`, remote `https://github.com/liza-bam/pleasant-street-dev.git`.
- Read applicable `AGENTS.md`, `README.md`, `DATA_SYNC.md`, source schemas and import instructions before editing. Check worktree status and latest remote changes; preserve other ongoing work, using an isolated worktree when necessary.
- Obtain the CSV from the repo. The established template is `data/sources/maine/catalog.csv`, not a new table reconstructed from search results. Preserve existing columns, records, IDs, metadata and sources unless a duplicate or error is confirmed.
- Read [catalog-and-media.md](references/catalog-and-media.md) for fields, inventory files, photos and checks, and [regions-and-findings.md](references/regions-and-findings.md) for geography, sources and maintained findings.
- Load and follow `/Users/sandy/.codex/skills/browser/SKILL.md` for browser work. Use the connected browser/session. Search snippets provide leads, never verification.

#### Eligibility and separate inventories

A record qualifies for the researched Pleasant Street inventory only when opened source pages support all of these:

1. An identifiable property or operator offers accommodation in the target state.
2. Short-term vacation accommodation is offered: houses, apartments, studios, cabins, cottages, lake/coastal rentals, small inns/lodges, sporting camps or glamping. Local rental managers can qualify as operator records. Campgrounds with rental lodgings and vacation condominium rentals (including skier condos) are in scope; keep campus/operator facts separate from individual unit facts.
3. The website opens and represents the host or operator. A platform-hosted site qualifies when it is that operator's direct site.
4. Direct reservation or direct inquiry by form, email or phone is available. Inspect the destination and record the method; do not submit inquiries or book as a test. Respect the published scope: if direct inquiries apply only to groups, multi-cabin stays or special occasions while ordinary individual bookings require Airbnb, represent that actual operator/group offer. Do not imply each individual cabin is generally bookable direct.
5. Verify an identifiable rental operator through its own accommodation, About/Contact and direct booking/inquiry pages. A named individual owner or corporate-family investigation is not mandatory for a clear rental operator. Record explicit user confirmations of scope or independence with conversation/date provenance, separately from website evidence. Exclude national hotel chains, large national aggregators and hotels without qualifying vacation accommodation; retain genuinely unclear operator identity as a candidate.
6. The record is not a duplicate. Do not merge distinct properties solely because they share a manager.

Report individual apartments, assigned accommodation categories, combined offers and operator summaries with their actual scope. A booking-platform ID or a host-wide result count is not proof of a distinct physical house. Preserve genuine units in a shared building; resolve overlapping buyouts and aliases before counting. Label category photos as representative of the advertised category when the operator assigns the unit. Expand legacy booking-site Home links to the current operator catalog and finish visible Load More/scroll pagination before claiming a catalog pass complete.

Maintain one authoritative regional master plus separately derived **candidate** and **approved** inventories. Approved means researched eligibility, not that an owner has joined, consented to or endorsed Pleasant Street. Research does not establish participation.

Use exactly these evidence statuses:

- `Verified independent website`: identity, state, accommodation and direct-booking/inquiry path checked on opened pages.
- `Verified platform-hosted website`: the same checks on the operator's platform-provided direct site.
- `Source found in web research`: relevant lead with incomplete verification.
- `Earlier list, not rechecked`: inherited evidence not freshly checked.
- `Not eligible`: confirmed exclusion, with the precise reason.
- `Website unavailable`: site could not be accessed or verified, with observed cause.

Do not promote old records merely because other columns have older verification notes. Houfy or other aggregator discovery alone does not prove eligibility.

#### Research workflow and several passes

Follow this order for each state/region, retaining queries, geographic coverage, dates and gaps in the regional progress file:

1. Search statewide tourism accommodation directories.
2. Search regional tourism directories, chambers, municipal tourism pages and county/town business directories. Follow operator Website links; save the exact discovery page URL. Skip strange, unrelated or unusable directory leads with a brief reason instead of prolonging an ownership investigation.
3. Search individual towns, lakes, vacation destinations and rural communities, including smaller and less-visited places throughout the state.
4. Search Houfy, Staythere, Dtravel, DirectBookingHost, independent direct-booking directories and relevant regional aggregators. Preserve original discovery sources.
5. Search platform-hosted sites: Lodgify, Guesty/Guesty Bookings, OwnerRez, Hospitable and other builders discovered during research. Search names, towns, booking domains and platform names.
6. Reverse-search property names to find alternative independent websites. Classify URLs as host-, manager- or aggregator-controlled. Audit existing candidates for aggregators too: inspect their property catalogs and extract the individual rental leads, preserving both catalog and property-detail discovery URLs. Then find and verify each property's operator-controlled direct site. An aggregator record is a discovery source, not an approved independent property.
7. Open websites; verify location, operator, accommodation and direct-booking/inquiry paths.
8. Deduplicate by property name, domain, location, operator and alternate URLs.
9. Record sources, precise status, qualifications and retained alternate domains/discovery sources.
10. Consolidate into the regional master and derive candidate/approved inventories.

Do several passes:

- **Discovery:** steps 1–6 across all planned regions and source categories.
- **Eligibility:** steps 7–9, including failures, alternative domains and ownership checks.
- **Property details:** revisit accommodation, policy, rates, FAQ, booking and contact pages to fill every CSV field as closely as evidence permits.
- **Photos and addresses:** collect cover, additional photos, logo and published address components with provenance; include clearly identified AI-generated imagery under the rules below. For every property, explicitly review its property-detail and Contact Us pages for the address. Check footer, location/directions pages and the operator's direct-booking page when needed. Distinguish rental addresses from offices and mailing addresses; record not publicly disclosed when an exact address cannot be established.
- **Mandatory contact-page address check:** for every property and operator, open its own website and follow the published Contact Us/Contact link; inspect About, Directions, Location or Getting Here pages when needed. A homepage-only pass, a booking card, or existing address data does not satisfy this check. Save the checked page URLs, date and supporting address text. Reassess inherited records too when auditing the inventory. If access fails twice, record the failure and use another public official source rather than looping.
- Classify each found address: individual rental, shared camp/campus, operator office, mailing address or arrival point. Preserve useful office/contact addresses without presenting them as the rental entrance or assigning the same office pin to every managed house. Keep the rental street address Unknown when it is not published; retain a separately labeled contact address and source.
- **Gaps and final review:** revisit missing/contradictory fields, uncertain access failures and alternative sources, deduplicate again and rebuild inventories. Record unresolved gaps.

Maintain a per-state source and geography coverage checklist with actual queries, opened URLs, leads reviewed and remaining queues. Track every named aggregator/platform separately as Not searched, Search attempted, Partially reviewed or Reviewed for this pass. A source name in a planning or searched list is not evidence of a completed catalog sweep. Work toward as exhaustive an inventory as possible; do not treat a numeric batch target or verification of existing seeds as completion of statewide discovery.

Work can overlap, but track passes and revisit incomplete records. A large first batch is not proof of statewide coverage. Missing information calls for a targeted follow-up, never an invented value.

Publish a checked batch through the existing importer when the user asks for live listings. An eligible website with one correctly attributed cover need not wait for four photos, optional details, or a publicly undisclosed street address; retain those as explicit collection gaps. Reuse saved evidence and the established workflow rather than building new tooling during a requested publication deadline.

#### Mandatory ready-list policy pass

After the research/detail passes, return to the complete ready/approved list and review **every website's pet and child policies**, including existing listings being audited. Do not treat previously verified eligibility or a completed photo pass as a completed policy review.

- Open the official property detail, house rules, policies, FAQ, rental agreement and booking terms as available. Expand relevant FAQ/accordion controls; a heading alone is not policy evidence. Follow published policy links before leaving fields Unknown.
- Booking engines may show generic children/pets selectors even when a particular property prohibits them. A selector or family-suite label alone does not establish admission; read actual property restrictions. For accordions that collapse prior answers, capture each answer immediately after expanding it.
- Save a per-property audit with stable ID, checked URLs, date, supporting policy text, normalized pets/kids values, restrictions and remaining gaps. Record checked-with-no-policy-found explicitly. Apply shared operator policies to units only when their applicability is established; retain unit exceptions.
- Distinguish pets allowed, prohibited and conditional (approval, species, size, count or fee). Record child restrictions and ages accurately. A minimum booking guest's age is not a ban on children. Silence is not Yes or No. Resolve conflicting official statements or preserve Unknown with the conflict explained.
- Update the CSV and derived listing facts from the audit, preserving evidence and conditions in notes. Do not leave a field empty merely because only the homepage was checked, and do not invent a policy to fill a field.
- Track policy-reviewed and pending IDs separately from eligibility and photo coverage. When instructed to finish the current state first, queue the older ready inventories for this same audit immediately afterward.

#### Booking-platform badge pass

After the requested cards view is finished, scan every published property's own website for Airbnb, Vrbo and Booking.com listing links. Save each discovered URL, source page and check date in the existing regional CSV as well as structured evidence. Preserve the actual URL, including identity or deep-link query parameters. Keep separate Airbnb URLs, Vrbo URLs, Booking.com URLs, source-page URLs, check date and status columns. Multiple URLs use line breaks within a quoted CSV cell. Distinguish an individual listing from a host profile or a generic platform/social link; only show a badge when the destination is attributable to that property or operator. Do not transfer links among managed properties. Reject outgoing links to unrelated rentals or another state even when the anchor contains the platform name; retain the excluded URL and reason in the audit. Record checked-with-none-found and access failures explicitly. In both Tiny and Large cards, use icon-only platform-logo badges over the photograph, with accessible platform labels but no visible platform-name text or outgoing badge link. Retain the actual URLs in the CSV. Missing links never justify inventing a listing or displaying an unverified badge.

#### Websites that do not open

The user defines “really bad” **only as a website that does not open at all**. Appearance and dated design are not this exclusion.

- Confirm through direct access; record exact URL, date and observed DNS, connection, timeout or unavailable-site failure. Distinguish automation blocking or an inaccessible booking widget from the whole site being unavailable.
- A domain that only serves a disconnected-domain/hosting-placeholder page has no accessible rental website, even when the HTTP request succeeds. Exclude and log it; do not count a successful HTTP status alone as website verification.
- Weed these during each eligibility pass without waiting for the user to flag them. Inspect the rendered destination: expired-domain advertising, parked domains and unrelated redirects are exclusions too. A blank first capture needs a fresh state or screenshot before deciding; a parking page can finish loading after navigation returns.
- Confirmed closure or conversion to permanent housing is a separate eligibility exclusion. Preserve the evidence and do not revive a retired rental merely because a tourism directory still lists it.
- Revisit plausible transient failures in a later pass. Reverse-search for a working operator website; preserve failed and replacement URLs.
- Exclude unavailable sites from the directory/approved inventory, preserving master research rows as `Website unavailable`.
- Add/update repo-root `bad-websites.md`: stable ID, operator/property, state/town, failed URL, date, observed failure, evidence, alternate URL and exclusion state. Deduplicate by URL/record; retain history if a site later recovers.
- If public dataset editing is in scope, use its inactive/review mechanism and rebuild indexes. Verify exclusion in generated output and, after deployment, on the live site. Never claim live removal from a local edit.

User example: `https://bayviewcottages.com/` (Maine). On 2026-10-25 a direct connected-browser check returned `net::ERR_NAME_NOT_RESOLVED`. Recheck before later status decisions; this does not prove permanent closure.

#### Photos and AI-generated imagery

**Current priority: coverage across every property.** Get usable, correctly attributed photos for all records before spending time improving variety for a small subset. Track the number of distinct properties with photos and the exact IDs still missing them; extra images for an already covered property do not improve coverage. Never mix different properties' identities, facts, addresses or photos.

Photo variety is a **later-scan requirement**: revisit repetitive sets for exterior, interior, bedroom and setting views when available. Different angles of one room are usable current-pass photos and are not duplicates merely because they show the same room. Do not delay the coverage pass to curate them.

On property-detail pages, scope image collection to the current property gallery. Recommended/More properties cards can contain other rentals’ images: a broad document.images collection is not a safe current-property photo set. Dtravel detail pages may keep the current gallery in CSS backgrounds while ordinary image elements are recommendation thumbnails. Inspect the gallery or its Photos modal and retain the current property/asset identity.

Different platform asset IDs can still contain identical private-interior photographs. Check the saved pictures, not just URL uniqueness. For separately numbered units with unresolved reused private interiors, keep website eligibility separate from image attribution; publish only correctly scoped unit or shared-building photographs, with a public scope label, or retain a media hold. Do not invent an assigned category to combine separately bookable units.

For operators with multiple rentals, keep individual units identifiable. Do not assemble photos from different rentals into a set presented as one property. Keep operator-level metadata separate from unit-level facts, addresses and images.

In the three-photo cards layout, use a large cover plus two useful 4:3 extra thumbnails. Do not squeeze the extras into panoramic strips. Verify their rendered dimensions and crop in the actual preview.

If an observed image loads in the connected browser but an ordinary asset download returns a security page, use the documented pageAssets capability to save that loaded asset. Do not classify the rental website as unavailable because a standalone image download was blocked.

Check lazy-loaded image attributes and the visible gallery after it finishes loading. Some Wix galleries render in an iframe; use the connected browser’s documented frame locators to inspect those actual images. A zero-image first capture is not proof that no gallery exists.

Collect real property photos first: cover, up to three additional numbered photos, and a separate logo when available. Save assets and original image/source-page URLs; inspect saved images and local paths. Revisit missing photos in later passes.

An AI-related filename, enhancement, retouching or virtual-staging label on an operator-published property photograph does not by itself establish an invented property or disqualify the photo. Preserve its published source and processing provenance; choose a clearer original when useful, but do not reject authentic property photos solely because they were AI-processed. Distinguish these from newly generated illustrations.

The user explicitly authorizes **AI-generated photos too**. Load the imagegen skill and use its tool when creating/editing them. Keep generation provenance and identify images visibly as `AI-generated illustration` wherever displayed. Distinguish generated imagery from authentic property photos in filenames, metadata and counts. Illustrations cannot establish property appearance, amenities, address or eligibility. Do not replace verified photos or present invented property features as photographed facts. If the current presentation cannot retain that distinction, keep generated assets separately until it can.

#### Maintain this skill while researching and writing

After each pass, user correction or demonstrated workflow issue, update the relevant skill/reference with reusable lessons: effective sources, verified directory entry points, platform patterns, field mappings and recurring access limitations. Inspect saved changes. Keep individual leads, source evidence, failures and pass progress in repo research files; this skill is not the rental database or a session transcript. Preserve explicit user requirements when improving it. Creating a handoff, answering a status question or checkpointing an agent does not cancel ongoing authorized research; resume the active work afterward unless the user asks to stop.

Before reporting completion, inspect saved CSVs/diffs, evidence and image paths, derived inventory membership and applicable repo checks. Distinguish researched, saved, tested and deployed. Report actual commands/results, coverage and remaining gaps. Verify published changes on the live prototype.
