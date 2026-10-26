# Bad websites

Checked: 2026-10-25.

61 Maine records are excluded: 25 failed/mismatched websites and 36 listings without property photos, removed at Sandy’s request. Vermont exclusions are documented below. IDs remain stable; original research is retained.

## Unreachable websites

| ID | Property / operator | Website | Reason |
| --- | --- | --- | --- |
| ME-0004 | Bayview Cottages Vacation Homes | [https://bayviewcottages.com](https://bayviewcottages.com) | DNS resolution failed for the checked hostnames. |
| ME-0017 | Rustic Maine Cottages (Dreaming of Maine alternate) | [https://rusticmainecottages.com/](https://rusticmainecottages.com/) | TLS/certificate connection failed for both checked URLs. |
| ME-0020 | Pocomoonshine Lake Lodges | [https://pocomoonshine.com](https://pocomoonshine.com) | Connection timed out on both checks. |
| ME-0041 | Gardners Sporting Camps | [https://gardnersportingcamps.com/](https://gardnersportingcamps.com/) | DNS resolution failed for the checked hostnames. |
| ME-0084 | Fieldstone Cottages | [https://fieldstonecottagesrangeleymaine.com](https://fieldstonecottagesrangeleymaine.com) | DNS resolution failed for the checked hostnames. |
| ME-0086 | Niboban Sporting Camps | [https://niboban.com](https://niboban.com) | Connection failed on both URL checks. |
| ME-0124 | Acadia Memories Vacation Cottage | [https://acadiamemories.us](https://acadiamemories.us) | TLS/certificate connection failed for both checked URLs. |
| ME-0136 | Moose Pond Maine Escape | [https://moosepondmaineescape.com](https://moosepondmaineescape.com) | TLS/certificate connection failed for both checked URLs. |
| ME-0164 | Guard Point Vacation Rental | [https://guardpointmaine.com](https://guardpointmaine.com) | DNS resolution failed for the checked hostnames. |
| ME-0169 | Coast & Cove Rentals | [https://coastandcove.lodgify.com](https://coastandcove.lodgify.com) | TLS/certificate connection failed for both checked URLs. |
| ME-0171 | Ducktrap Lodge & Retreat | [https://ducktraplodge.com](https://ducktraplodge.com) | HTTP 404; no working page after two URL checks. |
| ME-0184 | Finch Cottage | [https://finchcottage.com](https://finchcottage.com) | DNS resolution failed for the checked hostnames. |
| ME-0188 | Mill Stream House on North Haven | [https://northhavenrental.com](https://northhavenrental.com) | Connection timed out on both checks. |
| ME-0197 | Sunset View Carriage House | [https://zambraskimaine.com](https://zambraskimaine.com) | TLS/certificate connection failed for both checked URLs. |
| ME-0199 | Duckdown Waterfront Vacation | [https://duckdownmaine.com](https://duckdownmaine.com) | DNS resolution failed for the checked hostnames. |
| ME-0210 | MDI Vacation Homes | [https://mdivacationhomes.com](https://mdivacationhomes.com) | Connection timed out on both checks. |
| ME-0211 | Overlook at Mussel Ridge | [https://overlookatmusselridge.com](https://overlookatmusselridge.com) | DNS resolution failed for the checked hostnames. |
| ME-0221 | KC Cottage Rentals | [https://kccottagerentals.com](https://kccottagerentals.com) | TLS/certificate connection failed for both checked URLs. |
| ME-0227 | Acadia Cottage Rentals | [https://acadiarental.com](https://acadiarental.com) | TLS/certificate connection failed for both checked URLs. |
| ME-0235 | Peninsula Property Rentals | [https://peninsulapropertyrentals.com](https://peninsulapropertyrentals.com) | DNS resolution failed for the checked hostnames. |
| ME-0256 | Linda Bean's Maine Vacation Rentals | [https://lindabeansperfectmaine.com/lodging-type/vacation-rentals/](https://lindabeansperfectmaine.com/lodging-type/vacation-rentals/) | TLS/certificate connection failed for both checked URLs. |
| ME-0268 | Jimmy's Coast Real Estate Management | [https://jimmysrentals.com](https://jimmysrentals.com) | Connection timed out on both checks. |
| ME-0272 | Rockport Harbor View Vacation Rentals | [https://delray-camden-home-rentals.com/rockport](https://delray-camden-home-rentals.com/rockport) | HTTP 404; no working page after two URL checks. |
| ME-0282 | Willow Rental Properties | [https://willowrentalproperties.com](https://willowrentalproperties.com) | Wix disconnected-domain placeholder: “This domain isn't connected to a site.” Earlier checks also returned HTTP 404. |

## Other invalid website records

- **ME-0066 — Sky Lodge & Cabins:** https://skylodgecabins.com. Supplied Sky Lodge URL presents an unrelated property in Peru; excluded from Maine recommendations.

## Vermont website weeding

The current 71-record Vermont seed has been reviewed for website access. Neither excluded record below was admitted to the published Vermont batch. Master research rows are retained with their precise status.

| ID | Property / operator | Location | Failed URL | Observed result on 2026-10-25 | Status / replacement |
| --- | --- | --- | --- | --- | --- |
| VT-0021 | Slopeside Okemo Vacation Rentals | Ludlow / Okemo, VT | https://www.slopesideokemo.com/ | Network Solutions expired-domain advertising, confirmed in the rendered page after two navigation attempts. No rental website. | Website unavailable; excluded. No verified replacement found. |
| VT-0044 | Muddy Moose — Log Cabin Lodging | Morrisville, VT | http://www.muddymoosevt.com/ | Redirects to unrelated gambling content on two checks. [Current owner Downstreet](https://downstreet.org/stories/downstreet-celebrates-muddy-moose-grand-opening) separately confirms the former vacation cabins became permanent homes. | Not eligible; retired vacation lodging. No replacement rental site. |

Working replacements are retained as research leads: Humble Heart Homestead explicitly links its rebrand [RadFarm](https://www.radfarm.org/), and [Lake Salem Cottages](https://lakesalemvt.com/) has a working family-owned website with Book and Contact pages. The old Lake Salem link was browser-blocked; it is not labeled a dead business. Both replacements still need remaining eligibility/detail review.

Other Vermont eligibility exclusions are kept separate from bad websites: Roll'en Homes is a tiny-home builder, Crystal Lake State Park is government-operated, and Stayclass is an aggregator to mine for individual property leads. Their websites work.

See [Vermont website audit](data/sources/vermont/website-audit.json) for all 71 access outcomes and [Vermont exclusion evidence](data/sources/vermont/bad-websites.json) for the two failed/invalid URLs.

## Access blocks kept separate

Connected-browser confirmation on 2026-10-25: `bayviewcottages.com` again returned `net::ERR_NAME_NOT_RESOLVED`. `willowrentalproperties.com` displayed Wix's disconnected-domain page instead of rental content. A responding hosting placeholder is not a working property website. Both remain excluded.

HTTP 403/429 and bot challenges are not treated as proof that a property website is dead. Those records are not removed by this check.

Vermont access limitations remain outside approved inventory: Sterling Ridge Resort and Wilburton show security challenges; Pie in the Sky Farm's supplied URL is browser-blocked. These are unverified access failures, not confirmed closures. Two other leads have no identified website yet.

Detailed Maine check URLs and results are retained in [data/sources/maine/bad-websites.json](data/sources/maine/bad-websites.json).

## Maine listings excluded because property photos are missing

Removed from list and map results at Sandy’s request on 2026-10-25. These 36 records have no collected property photos; this does not establish that their websites are down. Full research records are retained in `data/sources/maine/excluded-no-photos.json`.

| ID | Property / operator | Website | Reason |
| --- | --- | --- | --- |
| ME-0036 | Grand Lake Cottages | [https://grandlakecottages.net](https://grandlakecottages.net) | Missing property photos / cover; excluded by request. |
| ME-0045 | Canalside Cabins | [https://canalsidecabins.com](https://canalsidecabins.com) | Missing property photos / cover; excluded by request. |
| ME-0047 | Weatherby's Lodge | [https://weatherbys.com](https://weatherbys.com) | Missing property photos / cover; excluded by request. |
| ME-0057 | Kokadjo Cabins & Trading Post | [https://kokadjo.com](https://kokadjo.com) | Missing property photos / cover; excluded by request. |
| ME-0063 | Katahdin Cabins | [https://katahdincabins.com](https://katahdincabins.com) | Missing property photos / cover; excluded by request. |
| ME-0067 | Mt. Chase Lodge | [https://mtchaselodge.com](https://mtchaselodge.com) | Missing property photos / cover; excluded by request. |
| ME-0078 | Conklin's Lodge and Camps | [https://conklinslodge.com](https://conklinslodge.com) | Missing property photos / cover; excluded by request. |
| ME-0080 | Kendall Farm Cottages | [https://kendallfarmcottages.com](https://kendallfarmcottages.com) | Missing property photos / cover; excluded by request. |
| ME-0082 | Arndt's Aroostook River Lodge | [https://arndtscamp.com](https://arndtscamp.com) | Missing property photos / cover; excluded by request. |
| ME-0085 | Lyons Lakeside Cabins | [https://lyonslakeside.com](https://lyonslakeside.com) | Missing property photos / cover; excluded by request. |
| ME-0092 | Lawrence's Lakeside Cabins | [https://lawrenceslakesidecabins.com](https://lawrenceslakesidecabins.com) | Missing property photos / cover; excluded by request. |
| ME-0107 | Edgewater Cabins | [https://edgewatercabins.com/](https://edgewatercabins.com/) | Missing property photos / cover; excluded by request. |
| ME-0111 | Kennebec Riverside Cabins | [https://krcabins.com](https://krcabins.com) | Missing property photos / cover; excluded by request. |
| ME-0127 | Kebo View at Acadia | [https://barharborweeklyrentals.com](https://barharborweeklyrentals.com) | Missing property photos / cover; excluded by request. |
| ME-0140 | Maine Cottage Rental (LedgeLawn Cottage) | [https://mainecottages.com](https://mainecottages.com) | Missing property photos / cover; excluded by request. |
| ME-0141 | Niftybug Rentals | [https://niftybug.com](https://niftybug.com) | Missing property photos / cover; excluded by request. |
| ME-0142 | Maine Bella Vita Cabins | [https://mainebellavitacabins.com](https://mainebellavitacabins.com) | Missing property photos / cover; excluded by request. |
| ME-0152 | Eagle Lake & Beyond | [https://eaglelakebeyondllc.com](https://eaglelakebeyondllc.com) | Missing property photos / cover; excluded by request. |
| ME-0155 | HAGS Place | [https://hagsplace.com](https://hagsplace.com) | Missing property photos / cover; excluded by request. |
| ME-0173 | Suites by the Sea | [https://suitesbythesea.com](https://suitesbythesea.com) | Missing property photos / cover; excluded by request. |
| ME-0205 | Sebago Rental | [https://sebagorental.com](https://sebagorental.com) | Missing property photos / cover; excluded by request. |
| ME-0212 | In The Trees | [https://inthetreesmaine.lodgify.com](https://inthetreesmaine.lodgify.com) | Missing property photos / cover; excluded by request. |
| ME-0220 | The Heyer House | [https://whereswaldoboro.com](https://whereswaldoboro.com) | Missing property photos / cover; excluded by request. |
| ME-0232 | Connecting Rentals | [https://connectingrentals.com](https://connectingrentals.com) | Missing property photos / cover; excluded by request. |
| ME-0237 | Vacation Cottages | [https://vacationcottages.com](https://vacationcottages.com) | Missing property photos / cover; excluded by request. |
| ME-0239 | Maine Vacation Rentals Inc. | [https://mainevacationrentalsonline.com](https://mainevacationrentalsonline.com) | Missing property photos / cover; excluded by request. |
| ME-0247 | Coastal Maine Vacations | [https://coastalmaine.vacations](https://coastalmaine.vacations) | Missing property photos / cover; excluded by request. |
| ME-0251 | Quoddy Properties Vacation Rentals | [https://quoddyproperties.com/vacation-rentals.html](https://quoddyproperties.com/vacation-rentals.html) | Missing property photos / cover; excluded by request. |
| ME-0263 | Camden Hills Realty & Vacation Rentals | [https://camdenhillsrealty.com](https://camdenhillsrealty.com) | Missing property photos / cover; excluded by request. |
| ME-0267 | Rangeley Vacation Rentals | [https://rangeleyvacationrentals.com](https://rangeleyvacationrentals.com) | Missing property photos / cover; excluded by request. |
| ME-0269 | Kinney Rentals | [https://kinneyrentals.com](https://kinneyrentals.com) | Missing property photos / cover; excluded by request. |
| ME-0271 | On the Water in Maine | [https://onthewaterinmaine.com](https://onthewaterinmaine.com) | Missing property photos / cover; excluded by request. |
| ME-0281 | True Hall Vacation Rentals | [https://truehall.com](https://truehall.com) | Missing property photos / cover; excluded by request. |
| ME-0284 | Vinalhaven Vacation Rentals | [https://vinalhavenvacationrentals.com](https://vinalhavenvacationrentals.com) | Missing property photos / cover; excluded by request. |
| ME-0291 | Green Gables Inn | [https://greengablesinnmaine.com](https://greengablesinnmaine.com) | Missing property photos / cover; excluded by request. |
| ME-0292 | Glenmoor by the Sea | [https://glenmoorbythesea.com](https://glenmoorbythesea.com) | Missing property photos / cover; excluded by request. |
