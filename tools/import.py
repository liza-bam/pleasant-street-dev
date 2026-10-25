#!/usr/bin/env python3
"""IMPORT: add or update homes in data/homes.json from a source file, one source at a time.

    python3 tools/import.py <source.json> --source lazy|list|form|found

A source file is a JSON list of homes. Each needs a name and url; the rest is used when given:
    place ("Town, ST") or town + state, lat, lng, photo (a picture URL), type, guests,
    priceFrom, currency, kids, pets.
What is missing is found: the picture is the site's own share picture (og:image), the
coordinates are the town's (OpenStreetMap). Homes are matched by their website address,
so importing again updates a home instead of adding it twice. Only the town is kept,
never a street address. Needs Pillow (pip install pillow).
"""
import datetime, io, json, pathlib, re, ssl, sys, time, urllib.parse, urllib.request
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
DB = ROOT / 'data' / 'homes.json'
UA = {'User-Agent': 'PleasantStreetDev/1.0 (sandy@lazy.vacations)'}
FIELDS = ['slug', 'name', 'url', 'place', 'town', 'state', 'lat', 'lng', 'photo', 'type', 'guests',
          'priceFrom', 'currency', 'kids', 'pets', 'source', 'added', 'checked', 'alive']


# Certificates: certifi's list when installed, else the system's (some Python installs ship none).
try:
    import certifi; TLS = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    TLS = ssl.create_default_context(cafile='/etc/ssl/cert.pem')


def get(url, timeout=20):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout, context=TLS).read()


def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')[:60]


def key(url):
    """One home per website: scheme, www and trailing slash do not matter."""
    u = urllib.parse.urlparse(url.strip())
    return (u.netloc.lower().removeprefix('www.') + u.path.rstrip('/')).lower()


def share_picture(url):
    html = get(url).decode('utf-8', 'ignore')
    m = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)', html) or \
        re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image', html)
    return urllib.parse.urljoin(url, m.group(1)) if m else None


def coordinates(town, state):
    q = urllib.parse.urlencode({'q': f'{town}, {state}, USA', 'format': 'json', 'limit': 1})
    time.sleep(1.1)                                   # OpenStreetMap asks for one lookup a second
    hits = json.loads(get('https://nominatim.openstreetmap.org/search?' + q))
    return (round(float(hits[0]['lat']), 4), round(float(hits[0]['lon']), 4)) if hits else (None, None)


def save_picture(src, name):
    """The card's shape: 16:10, 560 wide, webp."""
    im = Image.open(io.BytesIO(get(src))).convert('RGB')
    w, h = im.size
    if w / h > 1.6: nw = round(h * 1.6); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else: nh = round(w / 1.6); im = im.crop((0, 0, w, nh))   # keep the top: a site's name sits there
    im = im.resize((560, 350), Image.LANCZOS)
    out = ROOT / 'images' / f'{name}.webp'
    im.save(out, 'WEBP', quality=82, method=6)
    return f'images/{name}.webp'


def main():
    if len(sys.argv) < 4 or sys.argv[2] != '--source':
        sys.exit(__doc__)
    src, source = pathlib.Path(sys.argv[1]), sys.argv[3]
    homes = json.loads(DB.read_text()) if DB.exists() else []
    by_key = {key(h['url']): h for h in homes}
    today = datetime.date.today().isoformat()
    added = updated = failed = 0
    for row in json.loads(src.read_text()):
        try:
            name, url = row['name'].strip(), row['url'].strip()
            h = by_key.get(key(url))
            new = h is None
            if new:
                h = {'slug': slug(name), 'added': today, 'source': source}
                taken = {x['slug'] for x in homes}
                while h['slug'] in taken: h['slug'] += '-2'
            if row.get('place') and not row.get('town'):          # "Town, ST"
                town, _, state = row['place'].rpartition(',')
                row['town'], row['state'] = (town.strip(), state.strip()) if town else (state.strip(), '')
            h.update({k: row[k] for k in ['type', 'guests', 'priceFrom', 'currency', 'kids', 'pets', 'town', 'state'] if row.get(k) not in (None, '')})
            h['name'], h['url'] = name, url
            h['place'] = ', '.join(x for x in [h.get('town'), h.get('state')] if x)
            if row.get('lat') is not None: h['lat'], h['lng'] = row['lat'], row['lng']
            elif h.get('lat') is None: h['lat'], h['lng'] = coordinates(h.get('town', ''), h.get('state', ''))
            if new or row.get('photo'):
                pic = row.get('photo') or share_picture(url)
                if pic: h['photo'] = save_picture(pic, h['slug'])
            h['checked'], h['alive'] = today, True
            if new: homes.append(h); by_key[key(url)] = h; added += 1
            else: updated += 1
        except Exception as e:
            failed += 1
            print('skipped', row.get('name') or row.get('url'), '-', e)
    homes = [{k: h[k] for k in FIELDS if k in h} for h in sorted(homes, key=lambda x: x['name'].lower())]
    DB.write_text(json.dumps(homes, ensure_ascii=False, indent=1) + '\n')
    print(f'{source}: {added} added, {updated} updated, {failed} skipped; {len(homes)} homes in data/homes.json')


main()
