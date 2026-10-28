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

- **Sleeps from beds.** No sleeps count on the page but the beds are listed: count the beds in the bedrooms. Queen, king, full or double bed = 2; twin or single = 1. "2 bedrooms (each with a queen bed)" = sleeps 4. Sofa beds are not counted.
- **Camps and lodges.** A pets or kids policy stated on the operator's own site holds for every unit of that operator.
- **Sleeps is never the bedroom count.** A range keeps its top number; the wording goes into `capacityDetails`.
