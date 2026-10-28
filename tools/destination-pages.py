"""Write one page per tourist destination into the published site: <site>/<slug>/index.html (e.g. /martha_vineyard/).

Each page is the app's index.html showing only that destination's homes. Run by .github/workflows/pages.yml.
"""
import json
import re
import sys
from pathlib import Path

SITE = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
slug = lambda name: re.sub(r'[^a-z0-9]+', '_', re.sub(r"'s\b", '', name.lower())).strip('_')
page = (SITE / 'index.html').read_text()
counts = {}
for h in json.loads((SITE / 'index.json').read_text()):
    if h.get('destination') and h['destination'] != 'Unknown': counts[h['destination']] = counts.get(h['destination'], 0) + 1
for name, n in sorted(counts.items()):
    html = page.replace('<html lang="en"', f'<html lang="en" data-destination="{name}"', 1)
    html = html.replace('<head>', '<head>\n<base href="../">', 1)
    band = (f'<div class="ps-dest"><h2 class="ps-dest__name">{name}</h2>'
            f'<p class="ps-dest__count">{n:,} homes. Book each one on its owner’s website.</p></div>')
    html = html.replace('    <div class="app-floating-controls">', band + '\n    <div class="app-floating-controls">', 1)
    html = html.replace('<title>Pleasant Street</title>', f'<title>{name} — Pleasant Street</title>', 1)
    html = html.replace('href="https://liza-bam.github.io/pleasant-street-dev/"', f'href="https://liza-bam.github.io/pleasant-street-dev/{slug(name)}/"', 1)
    (SITE / slug(name)).mkdir(exist_ok=True)
    (SITE / slug(name) / 'index.html').write_text(html)
    print(f'/{slug(name)}/  {name}  {n} homes')
