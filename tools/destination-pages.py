"""Write one page per tourist destination into the published site: <site>/<slug>/index.html (e.g. /martha_vineyard/),
plus sitemap.xml and llms.txt so search engines and AI crawlers can find all of them. The site is public and
crawlable on purpose (robots.txt allows everything): Sandy wants people to see it and see it growing.

Each page is the app's index.html, pointed at its own slim data/destinations/<slug>.json (written by
tools/build-index.mjs) instead of the full index.json, so a visitor only downloads that destination's homes.
Run by .github/workflows/pages.yml.
"""
import datetime
import json
import re
import sys
from pathlib import Path

SITE = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
BASE = 'https://liza-bam.github.io/pleasant-street-dev'
slug = lambda name: re.sub(r'[^a-z0-9]+', '_', re.sub(r"'s\b", '', name.lower())).strip('_')
page = (SITE / 'index.html').read_text()
homes = json.loads((SITE / 'index.json').read_text())

# The page downloads only each home's location and facts (data/pins.json, data/destinations/<slug>.json);
# a home's photos, text and link live in data/homes/<id>.json and load when its card is on screen.
LIGHT = ['id', 'name', 'place', 'town', 'state', 'destination', 'type', 'recordType', 'guests', 'bedrooms', 'bathrooms',
         'kids', 'pets', 'lat', 'lng', 'featured', 'demo', 'locationLabel']
light = lambda h: {k: h[k] for k in LIGHT if k in h}
detail = lambda h: {k: v for k, v in h.items() if k not in LIGHT}
compact = lambda rows: json.dumps(rows, ensure_ascii=False, separators=(',', ':'))
(SITE / 'data' / 'homes').mkdir(parents=True, exist_ok=True)
for h in homes:
    (SITE / 'data' / 'homes' / f"{h['id']}.json").write_text(compact(detail(h)))
(SITE / 'data' / 'pins.json').write_text(compact([light(h) for h in homes]))
(SITE / 'data' / 'destinations').mkdir(parents=True, exist_ok=True)
counts = {}
for h in homes:
    if h.get('destination') and h['destination'] != 'Unknown': counts[h['destination']] = counts.get(h['destination'], 0) + 1
today = datetime.date.today().isoformat()
urls = [f'{BASE}/']
for name, n in sorted(counts.items()):
    html = page.replace('<html lang="en"', f'<html lang="en" data-destination="{name}"', 1)
    html = html.replace('<head>', '<head>\n<base href="../">', 1)
    band = (f'<div class="ps-dest"><h2 class="ps-dest__name">{name}</h2>'
            f'<p class="ps-dest__count">{n:,} homes. Book each one on its owner’s website.</p></div>')
    html = html.replace('    <div class="app-floating-controls">', band + '\n    <div class="app-floating-controls">', 1)
    page_url = f'{BASE}/{slug(name)}/'
    page_title = f'{name} \u2014 Pleasant Street'
    page_desc = f'{n:,} independent vacation rentals in {name}, each linking to its own owner\u2019s website. Book directly.'
    html = html.replace('<title>Pleasant Street</title>', f'<title>{page_title}</title>', 1)
    html = html.replace('content="Vacation homes run by independent hosts, on a map. Open a home to visit its own website and book there."', f'content="{page_desc}"', 1)
    html = html.replace('href="https://liza-bam.github.io/pleasant-street-dev/"', f'href="{page_url}"', 1)
    html = html.replace('content="Pleasant Street \u2014 Independent stays. Direct bookings."', f'content="{page_title}"')  # og:title and twitter:title share this text
    html = html.replace('content="Find independent vacation rentals on the map. Explore each home, then book directly through the host\u2019s own website."', f'content="{page_desc}"', 1)
    html = html.replace('content="https://liza-bam.github.io/pleasant-street-dev/"', f'content="{page_url}"', 1)
    html = html.replace('content="Find your place. Book directly. Vacation rentals by independent hosts."', f'content="{page_desc}"', 1)
    html = html.replace('data-src="data/pins.json"', f'data-src="data/destinations/{slug(name)}.json"', 1)
    (SITE / 'data' / 'destinations' / f'{slug(name)}.json').write_text(compact([light(h) for h in homes if h.get('destination') == name]))
    (SITE / slug(name)).mkdir(exist_ok=True)
    (SITE / slug(name) / 'index.html').write_text(html)
    urls.append(f'{BASE}/{slug(name)}/')
    print(f'/{slug(name)}/  {name}  {n} homes')

sitemap = ('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + ''.join(f'<url><loc>{u}</loc><lastmod>{today}</lastmod></url>\n' for u in urls) + '</urlset>\n')
(SITE / 'sitemap.xml').write_text(sitemap)

llms = (f"# Pleasant Street\n\n> A directory of US vacation rentals run by independent hosts. Each listing "
    f"links to the owner\u2019s own website \u2014 Pleasant Street never takes a booking or a commission.\n\n"
    f"Pleasant Street is a map and card directory of {len(homes):,} homes across {len(counts)} tourist "
    f"destinations, growing as more independent hosts are added.\n\n"
    f"## Site\n- [Pleasant Street]({BASE}/): the map and search, every home linking to its own website.\n"
    f"- [Full listing]({BASE}/index.md): every home, with its facts and a link to its own website.\n\n"
    f"## Destinations\n" + ''.join(f'- [{name}]({BASE}/{slug(name)}/): {n:,} homes.\n' for name, n in sorted(counts.items(), key=lambda x: -x[1])))
(SITE / 'llms.txt').write_text(llms)
print(f'sitemap.xml: {len(urls)} pages. llms.txt: {len(counts)} destinations.')
