#!/usr/bin/env python3
"""Turn verified rows of a regional research CSV into an import package for tools/import.py.

Usage: python3 tools/csv-to-import.py data/sources/<state>/<state>_independent_rental_websites.csv ID [ID ...] > out.json
A row needs a website URL; a cover photo is used when saved, otherwise the card shows the no-photo placeholder.
"""
import csv, io, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
U = 'Unknown'

def known(v): return v not in (None, '', U)
def num(v):
    m = re.match(r'^\s*(\d+(?:\.\d+)?)\s*$', v or '')
    return (float(m.group(1)) if '.' in m.group(1) else int(m.group(1))) if m else U
def yn(v):
    v = (v or '').strip().lower()
    return 'Yes' if v.startswith('y') else 'No' if v.startswith('n') and v != 'not stated' else 'Conditional' if v.startswith('cond') else U
def typ(cat, name):
    s = (cat + ' ' + name).lower()
    return 'Cabin' if re.search(r'cabin|camp|lodge|glamp|yurt', s) else 'Apartment' if re.search(r'apartment|studio|condo|suite|loft', s) else 'House'

def record(r):
    loc = next(v for k, v in r.items() if k.endswith(' location'))
    st = r['ID'][:2]; town = (r.get('City') or loc or '').split(',')[0].strip() or U
    photos = [(r.get('Cover image'), 'cover')] + [(r.get(f'Photo {i:03d}'), 'photo') for i in range(3)]
    photos = [{'file': f, 'role': role} for f, role in photos if known(f) and (ROOT / f).exists()]
    cover = next((p['file'] for p in photos if p['role'] == 'cover'), U)
    logo = r.get('Logo image') if known(r.get('Logo image')) and (ROOT / r['Logo image']).exists() else U
    addr = {k: (r.get(c) or U) for k, c in [('street', 'Street address'), ('city', 'City'), ('state', 'State'), ('postalCode', 'ZIP code'), ('full', 'Full address'),
            ('sourceUrl', 'Address source URL'), ('type', 'Address type'), ('status', 'Address status'), ('checkedOn', 'Address checked on'), ('notes', 'Address notes')]}
    links = {p: [u for u in (r.get(c) or '').split('\n') if u.strip()] for p, c in [('airbnb', 'Airbnb URLs'), ('vrbo', 'Vrbo URLs'), ('booking', 'Booking.com URLs')]}
    return {
        'id': r['ID'], 'name': r['Property / operator'].strip(), 'url': r['Website URL'].strip(), 'town': town, 'state': st, 'place': f'{town}, {st}',
        'type': typ(r.get('Candidate category', ''), r['Property / operator']), 'recordType': 'Rental operator' if 'operator' in r.get('Candidate category', '').lower() or 'manager' in r.get('Candidate category', '').lower() else 'Property',
        'description': r.get('Description') or U, 'descriptionSource': r.get('Description source URL') or r.get('Property details source URL') or U, 'descriptionStatus': r.get('Description status') or U,
        'rooms': U, 'bedrooms': U, 'bathrooms': U, 'guests': num(r.get('Sleeps / max guests')), 'capacityDetails': r.get('Sleeps / max guests') or U,
        'kids': yn(r.get('Kids OK')), 'pets': yn(r.get('Pets OK')), 'kidsDetails': r.get('Kids OK') or U, 'petsDetails': r.get('Pets OK') or U,
        'priceFrom': num(r.get('Published price')), 'currency': 'USD' if known(r.get('Published price')) else U, 'priceDetails': r.get('Price details') or U,
        'photo': cover, 'coverPhoto': cover, 'photos': photos, 'logo': logo, 'photoStatus': r.get('Photo status') or ('No photo saved' if not photos else U),
        'address': addr, 'contactPagesChecked': r.get('Address source URL') or U,
        'sourceDetails': {'evidenceStatus': r['Evidence status'], 'discovery': r.get('Discovery method') or U, 'sourceUrl': r.get('Source URL') or U, 'verification': r.get('Property data verification') or U, 'notes': r.get('Notes') or U},
        'listingStatus': 'Active', 'collectionStatus': r.get('Collection status') or 'Incomplete', 'missingRequiredFields': [m.strip() for m in (r.get('Missing required fields') or '').split(';') if m.strip()],
        'platformLinks': {k: v for k, v in links.items() if v}, 'demo': False, 'featured': False,
    }

if __name__ == '__main__':
    path, ids = sys.argv[1], set(sys.argv[2:])
    rows = list(csv.DictReader(io.StringIO(open(path, encoding='utf-8-sig', newline='').read())))
    out = [record(r) for r in rows if r['ID'] in ids and known(r['Website URL'])]
    missing = ids - {o['id'] for o in out}
    if missing: print('skipped (no row or no URL):', sorted(missing), file=sys.stderr)
    print(json.dumps(out, indent=1, ensure_ascii=False))
