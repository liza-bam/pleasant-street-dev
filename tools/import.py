#!/usr/bin/env python3
"""IMPORT: add or update homes in data/homes.json from a source file, one source at a time.

    python3 tools/import.py <source.json> --source lazy|list|form|found

A source file is a JSON list of homes. Each needs a name and url; the rest is used when given:
    place ("Town, ST") or town + state, lat, lng, photo (a picture URL), type, guests,
    priceFrom, currency, kids, pets. Local photo paths, galleries, descriptions and
    catalog IDs are preserved when provided. Unknown facts use the string "Unknown".
What is missing is found: the picture is the site's own share picture (og:image), the
coordinates are the town's (OpenStreetMap). Homes are matched by their website address,
so importing again updates a home instead of adding it twice. Published addresses are
kept in the database with their evidence; map pins remain town-level. Needs Pillow.
"""
import datetime, io, json, pathlib, re, ssl, sys, time, urllib.parse, urllib.request
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
DB = ROOT / 'data' / 'homes.json'
UA = {'User-Agent': 'PleasantStreetDev/1.0 (sandy@lazy.vacations)'}
FIELDS = ['slug', 'name', 'url', 'place', 'town', 'state', 'lat', 'lng', 'photo', 'type', 'guests',
          'priceFrom', 'currency', 'kids', 'pets', 'source', 'added', 'checked', 'alive', 'misses',
          'id', 'recordType', 'description', 'rooms', 'bedrooms', 'bathrooms', 'capacityDetails',
          'priceDetails', 'kidsDetails', 'petsDetails', 'photos', 'coverPhoto', 'logo', 'photoStatus',
          'address', 'sourceDetails', 'listingStatus', 'locationPrecision', 'locationSource']
FACTS = ['type', 'guests', 'priceFrom', 'currency', 'kids', 'pets', 'rooms', 'bedrooms', 'bathrooms',
         'description', 'capacityDetails', 'priceDetails', 'kidsDetails', 'petsDetails', 'coverPhoto', 'logo']
GEO_CACHE = ROOT / 'data' / 'sources' / 'town-coordinates.json'


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
    # LiveRez identifies individual rentals by PageDataID on a shared ASP path.
    # Ignore tracking/search queries, but retain this actual property identity.
    params=urllib.parse.parse_qs(u.query)
    property_id=params.get('PageDataID')
    unit_id=params.get('reservation_unitId')
    suffix='?PageDataID='+property_id[0] if property_id else ('?reservation_unitId='+unit_id[0] if unit_id else '')
    return (u.netloc.lower().removeprefix('www.') + u.path.rstrip('/')).lower()+suffix


def merge_fields(home, row):
    """Preserve app-owned fields and known facts when a general list has no new fact."""
    for k, value in row.items():
        if k in ['slug','photo','added','checked','alive','lat','lng','source'] or value in (None,''): continue
        if value == 'Unknown' and home.get(k) not in (None,'','Unknown') and not row.get('demo'): continue
        home[k] = value


def share_picture(url):
    html = get(url).decode('utf-8', 'ignore')
    m = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)', html) or \
        re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image', html)
    return urllib.parse.urljoin(url, m.group(1)) if m else None


def coordinates(town, state):
    if not town or town == 'Unknown' or state == 'Unknown': return (None, None)
    cache = json.loads(GEO_CACHE.read_text()) if GEO_CACHE.exists() else {}
    query = f'{town}, {state}, USA'
    if query in cache: return cache[query]['lat'], cache[query]['lng']
    q = urllib.parse.urlencode({'q': f'{town}, {state}, USA', 'format': 'json', 'limit': 1})
    time.sleep(1.1)                                   # OpenStreetMap asks for one lookup a second
    url = 'https://nominatim.openstreetmap.org/search?' + q
    try:
        hits = json.loads(get(url, timeout=12))
        result = (round(float(hits[0]['lat']), 4), round(float(hits[0]['lon']), 4)) if hits else (None, None)
        cache[query] = {'lat': result[0], 'lng': result[1], 'source': url,
                        'label': hits[0].get('display_name', '') if hits else '', 'checked': datetime.date.today().isoformat()}
        GEO_CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=1) + '\n')
        return result
    except Exception as e:
        print('coordinates unknown:', query, '-', e, flush=True)
        return None, None


def save_picture(src, name):
    """The card's shape: 16:10, 560 wide, webp."""
    data = get(src) if urllib.parse.urlparse(src).scheme in ('http', 'https') else (ROOT / src).read_bytes()
    im = Image.open(io.BytesIO(data)).convert('RGB')
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
            merge_fields(h, row)
            h['name'], h['url'] = name, url
            h['place'] = row.get('place') or ', '.join(x for x in [h.get('town'), h.get('state')] if x)
            if isinstance(row.get('lat'), (float, int)) and isinstance(row.get('lng'), (float, int)): h['lat'], h['lng'] = row['lat'], row['lng']
            elif not isinstance(h.get('lat'), (float, int)): h['lat'], h['lng'] = coordinates(h.get('town', ''), h.get('state', ''))
            h['locationPrecision'] = row.get('locationPrecision') or ('Town / area approximate' if h.get('lat') is not None else 'Unknown')
            if GEO_CACHE.exists():
                geo = json.loads(GEO_CACHE.read_text()).get(f"{h.get('town')}, {h.get('state')}, USA", {})
                h['locationSource'] = row.get('locationSource') or geo.get('source', 'Unknown')
            if (new or row.get('photo')) and row.get('photo') != 'Unknown':
                pic = row.get('photo') or share_picture(url)
                if pic: h['photo'] = save_picture(pic, (h.get('id') + '-card') if h.get('id') else h['slug'])
            if row.get('photo') == 'Unknown': h['photo'] = 'Unknown'
            h['checked'], h['alive'] = row.get('checked', 'Unknown'), row.get('alive', h.get('alive', 'Unknown'))
            h.setdefault('id', 'LAZY-' + h['slug'])
            for field in FACTS:
                if h.get(field) in (None, ''): h[field] = 'Unknown'
            if h.get('lat') is None: h['lat'], h['lng'] = 'Unknown', 'Unknown'
            if new: homes.append(h); by_key[key(url)] = h; added += 1
            else: updated += 1
            print('imported', h.get('id'), name, flush=True)
        except Exception as e:
            failed += 1
            print('skipped', row.get('name') or row.get('url'), '-', e)
    for h in homes:
        h.setdefault('id', 'LAZY-' + h['slug'])
        h.setdefault('photos', [{'file': h['photo'], 'role': 'cover'}] if h.get('photo') not in (None, '', 'Unknown') else [])
        if h.get('coverPhoto') in (None, '', 'Unknown'): h['coverPhoto'] = h.get('photo', 'Unknown')
        for field in FACTS:
            if h.get(field) in (None, ''): h[field] = 'Unknown'
        h.setdefault('listingStatus', 'Active')
        h.setdefault('recordType', 'Property')
        h.setdefault('demo', h.get('source') == 'lazy')
        h.setdefault('featured', h.get('demo') is True)
        h.setdefault('address', {k: 'Unknown' for k in ['street','city','state','postalCode','full','type','status','sourceUrl','checkedOn','notes']})
        h.setdefault('rooms', 'Unknown'); h.setdefault('bedrooms', 'Unknown'); h.setdefault('bathrooms', 'Unknown')
    # Preserve fields added by the app/schema owner instead of silently dropping them.
    homes = [dict(h) for h in sorted(homes, key=lambda x: x['name'].lower())]
    DB.write_text(json.dumps(homes, ensure_ascii=False, indent=1) + '\n')
    print(f'{source}: {added} added, {updated} updated, {failed} skipped; {len(homes)} homes in data/homes.json')


if __name__ == '__main__': main()
