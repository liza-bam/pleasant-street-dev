#!/usr/bin/env python3
"""ONE PASS PER PAGE. Every home's own page is read once, its text is kept in data/sources/pages/<id>.txt, and every
field still Unknown is filled from that text in the same pass: pets, kids, sleeps, bedrooms, bathrooms, price.
A later field never costs the pages again: run with --cached to work from the saved text only.
Only explicit statements are written; the matched words are kept as evidence (petsDetails, kidsDetails,
capacityDetails, priceDetails). The gaps that remain are listed in data/sources/scout-report.json.
Usage: python3 tools/scout.py [--apply] [--cached] [--only ID,ID]"""
import concurrent.futures as cf, datetime, html, json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGES = ROOT / 'data/sources/pages'; PAGES.mkdir(parents=True, exist_ok=True)
TODAY = datetime.date.today().isoformat()
APPLY, CACHED = '--apply' in sys.argv, '--cached' in sys.argv
ONLY = set(sys.argv[sys.argv.index('--only') + 1].split(',')) if '--only' in sys.argv else None
homes = json.loads((ROOT / 'data/homes.json').read_text())
unknown = lambda v: v in (None, '', 'Unknown')

PETS = [
    ('No', r'\b(?:no pets?|pets? (?:are )?not (?:allowed|permitted|accepted)|pets?:\s*(?:no|not allowed|none)|pet[- ]free|not pet[- ]friendly|sorry,? no (?:dogs|pets)|we do not (?:allow|accept) pets|no animals|no dogs)\b'),
    ('Conditional', r'\b(?:pets? (?:considered|negotiable|on request|upon request|by approval|with (?:prior )?approval|with permission|case[- ]by[- ]case)|pets?:\s*(?:considered|on request|ask|inquire|with approval)|(?:small|one|1|certain) (?:dogs?|pets?) (?:only|considered|allowed|welcome)|pet fee|pets? (?:allowed|welcome) with (?:a )?(?:fee|deposit|approval)|dogs? (?:considered|on approval|by approval|with approval))\b'),
    ('Yes', r'\b(?:pet[- ]friendly|pets? (?:are )?(?:allowed|welcome|permitted|accepted|ok|okay)|pets?:\s*(?:yes|allowed|welcome|ok)|dogs? (?:are )?(?:welcome|allowed|ok|okay)|dog[- ]friendly|bring your (?:dog|pet)|welcomes? (?:your )?(?:dogs?|pets?))\b'),
]
KIDS = [
    ('No', r'\b(?:adults?[- ]only|no children|children (?:are )?not (?:allowed|permitted|accepted)|not suitable for (?:children|kids|infants)|no kids|children:\s*(?:no|not allowed)|no guests under \d+|guests must be (?:over|at least) (?:18|21)|minimum age (?:of )?(?:18|21|25))\b'),
    ('Conditional', r'\b(?:children (?:over|aged?|ages?) \d+(?:\+| and (?:up|over|older))?(?: (?:only|welcome))?|no children under \d+|kids? (?:over|aged?) \d+|children (?:by|with) (?:prior )?(?:approval|arrangement)|not suitable for (?:infants|children under \d+|toddlers))\b'),
    ('Yes', r'\b(?:child[- ]friendly|kid[- ]friendly|family[- ]friendly|children (?:are )?(?:welcome|allowed|permitted)|kids (?:are )?(?:welcome|allowed|ok|okay)|families (?:are )?welcome|great for (?:families|kids|children)|perfect for families|children:\s*(?:yes|welcome|allowed)|suitable for (?:children|kids|families)|welcomes? (?:children|kids|families)|(?:pack ?n ?play|crib|high ?chair|travel cot)s? (?:available|provided|on request|included))\b'),
]
SLEEPS = r'\b(?:sleeps|accommodates|occupancy|max(?:imum)? (?:of )?|up to)\D{0,12}?(\d{1,2})(?:\s*(?:-|–|to)\s*(\d{1,2}))?(?:\s*(?:guests|people|persons))?\b|\b(\d{1,2})(?:\s*(?:-|–|to)\s*(\d{1,2}))?\s*(?:guests|people|persons)\b'
BEDS = r'\b(\d{1,2}|one|two|three|four|five|six|seven|eight)[- ]?(?:bed(?:room)?s?|BR)\b(?! (?:lofts?|suites?))'
BATHS = r'\b(\d{1,2}(?:\.5)?|one|two|three|four|five|six|half|1/2)[- ]?(?:bath(?:room)?s?|BA)\b'
PRICE = r'(?:from |starting at |starts at |rates? (?:from|start(?:ing)? at)?:?\s*)?\$\s?(\d{1,3}(?:,\d{3})*|\d+)(?:\.\d\d)?\s*(?:/|per|a|each)?\s*(night|nt|week|wk|weekly|nightly|month|day)\b'
WORDS = {'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'half': 0.5, '1/2': 0.5}


def fetch(u):
    r = subprocess.run(['curl', '-sL', '--max-time', '30', '-A', 'Mozilla/5.0 (Macintosh) PleasantStreet/1.0', u], capture_output=True)
    return r.stdout.decode('utf-8', 'ignore') if r.returncode == 0 else ''


def clean(page):
    page = re.sub(r'<(script|style|noscript)[^>]*>.*?</\1>', ' ', page, flags=re.S | re.I)
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', page))).strip()


def page_text(h):
    f = PAGES / (h['id'] + '.txt')
    if f.exists() and (CACHED or f.stat().st_size > 200): return f.read_text()
    if CACHED: return ''
    t = clean(fetch(h['url'])); f.write_text(t); return t


def around(text, m, n=40): return text[max(0, m.start() - n):min(len(text), m.end() + n)].strip()


def decide(text, rules):
    for verdict, pat in rules:
        m = re.search(pat, text, re.I)
        if m: return verdict, around(text, m)
    return None, ''


def number(v): return WORDS.get(v.lower(), None) if v.lower() in WORDS else (float(v) if '.' in v else int(v))


BED = r'\b(\d{1,2}|one|two|three|four|five|six|a|an)?\s*(queen|king|full|double|twin|single|bunk)(?:[- ]size[d]?)? beds?\b'
EACH = r'\b(\d{1,2}|one|two|three|four|five|six)[- ]?bed(?:room)?s? \(?each with (?:a |an )?(queen|king|full|double|twin|single)'
def beds_sleep(text):
    m = re.search(EACH, text, re.I)
    if m:
        rooms = WORDS.get(m.group(1).lower(), None) or int(m.group(1)); per = 1 if m.group(2).lower() in ('twin', 'single') else 2
        return rooms * per, around(text, m)
    total, bits = 0, []
    for m in re.finditer(BED, text, re.I):
        count = m.group(1); count = 1 if not count or count.lower() in ('a', 'an') else (WORDS.get(count.lower()) or int(count))
        kind = m.group(2).lower(); per = 1 if kind in ('twin', 'single') else 2
        total += count * per; bits.append(m.group(0))
        if len(bits) >= 8: break
    return (total, '; '.join(bits)) if 0 < total <= 40 else (0, '')
def scout(h):
    text = page_text(h)
    out = {'id': h['id'], 'state': 'read' if len(text) >= 200 else 'unreadable', 'found': {}}
    if out['state'] != 'read': return out
    if unknown(h.get('pets')):
        v, e = decide(text, PETS)
        if v: out['found']['pets'] = (v, e)
    if unknown(h.get('kids')):
        v, e = decide(text, KIDS)
        if v: out['found']['kids'] = (v, e)
    if unknown(h.get('guests')):
        m = re.search(SLEEPS, text, re.I)
        if m:
            a = m.group(1) or m.group(3); b = m.group(2) or m.group(4); n = int(b) if b else int(a)
            if 1 <= n <= 40: out['found']['guests'] = (n, around(text, m))
        else:   # her rule: no sleeps stated → count the beds in the bedrooms (queen/king/full/double 2, twin/single 1)
            n, ev = beds_sleep(text)
            if n: out['found']['guests'] = (n, 'Counted from beds: ' + ev)
    if unknown(h.get('bedrooms')):
        m = re.search(BEDS, text, re.I)
        if m and number(m.group(1)) is not None and 0 < number(m.group(1)) <= 20: out['found']['bedrooms'] = (number(m.group(1)), around(text, m))
    if unknown(h.get('bathrooms')):
        m = re.search(BATHS, text, re.I)
        if m and number(m.group(1)) is not None and 0 < number(m.group(1)) <= 20: out['found']['bathrooms'] = (number(m.group(1)), around(text, m))
    if unknown(h.get('priceFrom')):
        m = re.search(PRICE, text, re.I)
        if m:
            amount = int(m.group(1).replace(',', '')); unit = m.group(2).lower()
            basis = 'night' if unit in ('night', 'nt', 'nightly', 'day') else 'week' if unit in ('week', 'wk', 'weekly') else 'month'
            if 20 <= amount <= 100000: out['found']['price'] = ((amount, basis), around(text, m))
    return out


todo = [h for h in homes if (ONLY is None or h['id'] in ONLY) and any(unknown(h.get(k)) for k in ('pets', 'kids', 'guests', 'bedrooms', 'bathrooms', 'priceFrom'))]
print(f'scout: {len(todo)} homes with a gap; {"cached text only" if CACHED else "reading pages, caching text"}', flush=True)
byid = {h['id']: h for h in homes}
report = {'checkedOn': TODAY, 'read': 0, 'unreadable': [], 'filled': {k: 0 for k in ('pets', 'kids', 'guests', 'bedrooms', 'bathrooms', 'price')}, 'stillUnknown': {}}
with cf.ThreadPoolExecutor(16) as ex:
    for n, out in enumerate(ex.map(scout, todo), 1):
        h = byid[out['id']]
        if out['state'] != 'read': report['unreadable'].append(out['id']); continue
        report['read'] += 1
        for k, (v, e) in out['found'].items():
            report['filled'][k] += 1
            if not APPLY: continue
            note = f'Page says: “{e}” (read {TODAY})'
            if k == 'pets': h['pets'] = v; h['petsDetails'] = note
            elif k == 'kids': h['kids'] = v; h['kidsDetails'] = note
            elif k == 'guests': h['guests'] = v; h['capacityDetails'] = note
            elif k == 'bedrooms': h['bedrooms'] = v
            elif k == 'bathrooms': h['bathrooms'] = v
            elif k == 'price': h['priceFrom'] = v[0]; h['currency'] = h.get('currency') if not unknown(h.get('currency')) else 'USD'; h['priceDetails'] = f'From ${v[0]} per {v[1]}. ' + note
        gaps = [k for k in ('pets', 'kids', 'guests', 'bedrooms', 'bathrooms') if unknown(h.get(k)) and k not in out['found']]
        if gaps: report['stillUnknown'][out['id']] = gaps
        if n % 500 == 0: print(f'  {n}/{len(todo)} read; filled so far {report["filled"]}', flush=True)
# Camps, lodges and cottage colonies: a policy stated on the operator's own site holds for every unit of that
# operator. Her 2026-10-28 rule extends this to agencies: any host's stated policy holds for all its listings. A page is fetched once per host.
import urllib.parse, collections
byhost = collections.defaultdict(list)
for h in homes:
    if unknown(h.get('pets')) or unknown(h.get('kids')): byhost[urllib.parse.urlparse(h['url']).netloc].append(h)
report['operatorPolicy'] = {'pets': 0, 'kids': 0, 'hosts': 0}
def host_policy(host):
    root = 'https://' + host + '/'
    text = ''
    for path in ('', 'policies', 'policy', 'rental-policies', 'faq', 'faqs', 'rates', 'about', 'house-rules', 'terms'):
        f = PAGES / ('host-' + host.replace('/', '_') + '-' + (path or 'root') + '.txt')
        if f.exists(): t = f.read_text()
        elif CACHED: t = ''
        else: t = clean(fetch(root + path)); f.write_text(t)
        text += ' ' + t
    return host, decide(text, PETS), decide(text, KIDS)
small = list(byhost.keys())
with cf.ThreadPoolExecutor(8) as ex:
    for host, (pv, pe), (kv, ke) in ex.map(host_policy, small):
        if not pv and not kv: continue
        report['operatorPolicy']['hosts'] += 1
        for h in byhost[host]:
            if pv and unknown(h.get('pets')):
                report['operatorPolicy']['pets'] += 1
                if APPLY: h['pets'] = pv; h['petsDetails'] = f'Operator site ({host}) says: “{pe}” (read {TODAY})'
                report['stillUnknown'].get(h['id'], []) and h['id'] in report['stillUnknown'] and 'pets' in report['stillUnknown'][h['id']] and report['stillUnknown'][h['id']].remove('pets')
            if kv and unknown(h.get('kids')):
                report['operatorPolicy']['kids'] += 1
                if APPLY: h['kids'] = kv; h['kidsDetails'] = f'Operator site ({host}) says: “{ke}” (read {TODAY})'
                report['stillUnknown'].get(h['id'], []) and h['id'] in report['stillUnknown'] and 'kids' in report['stillUnknown'][h['id']] and report['stillUnknown'][h['id']].remove('kids')
report['stillUnknown'] = {k: v for k, v in report['stillUnknown'].items() if v}
print('operator policies:', report['operatorPolicy'], flush=True)
(ROOT / 'data/sources/scout-report.json').write_text(json.dumps(report, indent=1) + '\n')
if APPLY: (ROOT / 'data/homes.json').write_text(json.dumps(homes, ensure_ascii=False, indent=1) + '\n')
print(f'read {report["read"]}, unreadable {len(report["unreadable"])}, filled {report["filled"]}, homes still missing a policy or a count: {len(report["stillUnknown"])}', flush=True)
