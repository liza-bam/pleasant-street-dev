# Every home record: the fields to scout, no exceptions

A home is not published until every field below is filled from the home's own website. "Unknown" is a gap to
close, not an answer. Where the page is silent, the record says so with the date it was read, and the home
is listed in `data/sources/policy-scan.json` so the gap stays visible. (Her rule, 2026-10-28: "every single
house needs pets and kids policy"; "every property has a description, no exceptions".)

| Field | What to find on the site | Where it goes |
|---|---|---|
| name | The home's own name as the host writes it | `name` |
| website | The host's own site or operator-controlled direct-booking page, opened and verified | `url`, `sourceDetails.evidenceStatus` |
| town, state, place | From the page, address, directions or map | `town`, `state`, `place` |
| map pin | Coordinates from the page's address or map; never the office | `lat`, `lng`, `locationPrecision`, `locationSource` |
| type | House, Apartment, Cabin, Camp, Houseboat | `type` |
| sleeps | The stated guest count; a range keeps its top number and the wording | `guests`, `capacityDetails` |
| bedrooms | Count as stated; never inferred from beds | `bedrooms` |
| bathrooms | Count as stated; outdoor showers do not count | `bathrooms` |
| pets policy | Yes / No / Conditional, with the page's words as evidence | `pets`, `petsDetails` |
| kids policy | Yes / No / Conditional, with the page's words as evidence | `kids`, `kidsDetails` |
| description | ~150 characters, the host's concrete features paraphrased, no promotion | `cardDescription`, `cardDescriptionSource` (in `data/sources/cards/descriptions.json`) |
| photos | Four real photos of this home, cover first, each with an alt text | `photos[]`, `coverPhoto`, `cardPhotos`, `photoAlts` |
| card picture | The 560×350 WebP crop | `photo`, `photoAlt` |
| price | Amount, currency, basis, season, minimum stay | `priceFrom`, `currency`, `priceDetails` |
| platforms | Airbnb / Vrbo / Booking links found on the site | `platformLinks` |
| checked | The date the page was read | `checked`, `locationCheckedOn` |

Tools that fill them: `tools/photo-alts.py` (alt texts), `tools/prepare-cards.py` (descriptions, photos, platforms),
`tools/scout.py` (pets, kids, sleeps, bedrooms, bathrooms and price from the page, one pass, text cached in data/sources/pages/), then `node tools/build-index.mjs`.

## Counting rules she set (2026-10-28)

- **Sleeps.** The stated count is the count. No count stated but beds listed: the beds give a minimum, stored as `guests` with `guestsMinimum: true` and shown as "Sleeps 4+" (queen/king/full/double/sofa/sleeper/pull-out/futon/Murphy = 2, twin/single/day bed/trundle = 1), the beds quoted in `capacityDetails`. Nothing stated at all: Unknown.
- **Camps and lodges.** A pets or kids policy stated on the operator's own site holds for every unit of that operator.
- **Sleeps is never the bedroom count.** A range keeps its top number; the wording goes into `capacityDetails`.
- **Kids default to Yes (2026-11-02).** Children are welcome unless the page says otherwise; only an explicit "no children", "adults only" or an age limit sets No or Conditional. The default is recorded in `kidsDetails` with the date.
