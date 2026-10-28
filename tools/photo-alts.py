"""Give every photo in data/homes.json an alt text, kept with the photo (ADA). Idempotent: an alt already
written is left alone. Cover: "<name>, <type> in <place>"; others: "<name>, <place>, photo 2 of 5";
the card picture: "<name>, <place>". Run after an import, before node tools/build-index.mjs."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
path = ROOT / 'data/homes.json'
homes = json.loads(path.read_text())
TYPES = {'House': 'house', 'Apartment': 'apartment', 'Cabin': 'cabin', 'Camp': 'camp', 'Houseboat': 'houseboat'}
added = 0
for h in homes:
    name, place, kind = h.get('name', '').strip(), h.get('place', '').strip(), TYPES.get(h.get('type'))
    where = f'{kind} in {place}' if kind and place else place
    photos = [p for p in (h.get('photos') or []) if isinstance(p, dict) and p.get('file')]
    total = len(photos)
    for i, p in enumerate(photos):
        if p.get('alt'): continue
        p['alt'] = f'{name}, {where}' if p.get('role') == 'cover' or i == 0 else f'{name}, {place}, photo {i + 1} of {total}'
        added += 1
    if h.get('photo') and not h.get('photoAlt'):
        h['photoAlt'] = f'{name}, {where}'
        added += 1
path.write_text(json.dumps(homes, ensure_ascii=False, indent=1) + '\n')
print(f'photo-alts: {added} alt texts added across {len(homes)} homes')
