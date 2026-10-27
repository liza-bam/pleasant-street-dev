"""Give every home a tourist destination from data/sources/destinations.json (State|Town, or ID|<id> for operators without a town).

Homes with no known town take the destination of the nearest mapped home.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / 'data/homes.json'
towns = json.loads((ROOT / 'data/sources/destinations.json').read_text())
homes = json.loads(DB.read_text())
num = lambda v: isinstance(v, (int, float))
for h in homes:
    h['destination'] = towns.get(f"ID|{h['id']}") or towns.get(f"{h.get('state')}|{h.get('town')}", '')
known = [h for h in homes if h['destination'] and num(h.get('lat')) and num(h.get('lng'))]
for h in homes:
    if h['destination']: continue
    if num(h.get('lat')) and num(h.get('lng')):
        near = min(known, key=lambda k: (k['lat'] - h['lat']) ** 2 + (k['lng'] - h['lng']) ** 2)
        h['destination'] = near['destination']
    else:
        h['destination'] = 'Unknown'
DB.write_text(json.dumps(homes, ensure_ascii=False, indent=1) + '\n')
print(sum(h['destination'] != 'Unknown' for h in homes), 'of', len(homes), 'homes have a destination')
