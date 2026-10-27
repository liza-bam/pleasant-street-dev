"""Write the "found, not online" lists (data/sources/massachusetts/notonline-*.json) into bad-websites.md.

The section sits before the Massachusetts audit marker, which prepare-massachusetts.py regenerates.
"""
import collections
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'data/sources/massachusetts'
START, END, MA = '<!-- NOT-ONLINE -->', '<!-- /NOT-ONLINE -->', '<!-- MA-VERIFICATION-AUDIT -->'
DEST = {'28': "Martha's Vineyard", '29': 'Nantucket', '30': 'North Shore & Cape Ann', '31': 'The Berkshires',
        '32': 'South Coast & Buzzards Bay', '33': 'Plymouth & South Shore', '34': 'Pioneer Valley', '35': 'Central Massachusetts'}
cell = lambda v: str(v or '').replace('|', '/').replace('\n', ' ')
lines = [START, '## Massachusetts destinations — found, not online', '']
for f in sorted(SRC.glob('notonline-*.json')):
    rows = json.loads(f.read_text())
    batch = f.stem.split('-')[1]
    lines += [f"### {DEST.get(batch, batch)} ({len(rows)})", '']
    by = collections.defaultdict(list)
    for r in rows: by[r.get('reason', 'Unknown')].append(r)
    for reason, group in sorted(by.items(), key=lambda x: -len(x[1])):
        lines += [f"#### {cell(reason)} ({len(group)})", '', '| Property / operator | Town | Website |', '| --- | --- | --- |']
        lines += [f"| {cell(r.get('name') or r.get('operator'))} | {cell(r.get('town'))} | {cell(r.get('url'))} |" for r in group]
        lines.append('')
lines.append(END)
path = ROOT / 'bad-websites.md'
text = path.read_text()
if START in text:
    head, rest = text.split(START, 1)
    text = head + '\n'.join(lines) + rest.split(END, 1)[1]
else:
    head, tail = text.split(MA, 1)
    text = head + '\n'.join(lines) + '\n\n' + MA + tail
path.write_text(text)
print(sum(len(json.loads(f.read_text())) for f in SRC.glob('notonline-*.json')), 'not-online entries written')
