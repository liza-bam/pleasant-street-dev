#!/usr/bin/env python3
"""Every home gets a card description; no exceptions. For each record in data/homes.json without one, read the home's
own page and take the host's words: the meta/og description, else the first substantial paragraph, cut at a sentence
or word boundary to 150 characters. A page that cannot be read gets a factual line from the record's own facts.
Writes data/sources/cards/descriptions.json, then tools/prepare-cards.py applies it. Idempotent."""
import concurrent.futures as cf, datetime, html, json, re, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TODAY = datetime.date.today().isoformat()
LIMIT = 150
homes = json.loads((ROOT / 'data/homes.json').read_text())
path = ROOT / 'data/sources/cards/descriptions.json'
descriptions = json.loads(path.read_text())
known = lambda v: v not in (None, '', 'Unknown')


def clean(s):
    s = html.unescape(re.sub(r'<[^>]+>', ' ', s or ''))
    return re.sub(r'\s+', ' ', s).strip()


def cut(s):
    s = clean(s)
    if len(s) <= LIMIT: return s
    head = s[:LIMIT]
    for stop in ('. ', '! ', '? '):
        i = head.rfind(stop)
        if i >= 60: return head[:i + 1]
    i = head.rfind(' ')
    return (head[:i] if i >= 60 else head[:LIMIT - 1]).rstrip(',;:–- ') + '…'


def fetch(url):
    r = subprocess.run(['curl', '-sL', '--max-time', '30', '-A', 'Mozilla/5.0 (Macintosh) PleasantStreet/1.0', url], capture_output=True)
    return r.stdout.decode('utf-8', 'ignore') if r.returncode == 0 else ''


BOILER = re.compile(r'cookie|javascript|browser|sign in|log in|subscribe|newsletter|all rights reserved|privacy policy|skip to', re.I)


def from_page(page, name):
    for pat in (r'<meta[^>]+property=["\']og:description["\'][^>]+content=["\']([^"\']{25,})["\']',
                r'<meta[^>]+content=["\']([^"\']{25,})["\'][^>]+property=["\']og:description["\']',
                r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']{25,})["\']',
                r'<meta[^>]+content=["\']([^"\']{25,})["\'][^>]+name=["\']description["\']'):
        m = re.search(pat, page, re.I)
        if m and not BOILER.search(m.group(1)): return cut(m.group(1))
    body = re.sub(r'<(script|style|nav|header|footer)[^>]*>.*?</\1>', ' ', page, flags=re.S | re.I)
    for m in re.finditer(r'<p[^>]*>(.*?)</p>', body, re.S | re.I):
        t = clean(m.group(1))
        if len(t) >= 60 and not BOILER.search(t) and re.search(r'[a-z]{3,}', t): return cut(t)
    return ''


def from_facts(h):
    kind = {'House': 'House', 'Apartment': 'Apartment', 'Cabin': 'Cabin', 'Camp': 'Camp', 'Houseboat': 'Houseboat'}.get(h.get('type'), 'Vacation rental')
    bits = [f'{kind} in {h["place"]}']
    if known(h.get('guests')): bits.append(f'sleeps {h["guests"]}')
    if known(h.get('bedrooms')): bits.append(f'{h["bedrooms"]} bedroom' + ('' if str(h['bedrooms']) == '1' else 's'))
    if known(h.get('bathrooms')): bits.append(f'{h["bathrooms"]} bathroom' + ('' if str(h['bathrooms']) == '1' else 's'))
    if h.get('pets') == 'Yes': bits.append('pets welcome')
    return cut(', '.join(bits) + '. Booked on the owner’s own website.')


todo = [h for h in homes if not known(h.get('cardDescription'))]
print(f'fill-descriptions: {len(todo)} homes without a description')


def work(h):
    text = from_page(fetch(h['url']), h['name'])
    status = 'Factual summary of opened official website' if text else 'Factual line from the record (page unreadable)'
    return h['id'], (text or from_facts(h)), status


with cf.ThreadPoolExecutor(8) as ex:
    for ident, text, status in ex.map(work, todo):
        home = next(x for x in homes if x['id'] == ident)
        descriptions[ident] = {'description': text, 'sourceUrl': home['url'], 'checkedOn': TODAY, 'status': status}
        print(f'{ident} [{status[:7]}] {text}')
path.write_text(json.dumps(descriptions, ensure_ascii=False, indent=1) + '\n')
print('written', path)
