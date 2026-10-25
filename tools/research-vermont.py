#!/usr/bin/env python3
"""Maintain Vermont research records from saved, opened source evidence."""
import csv
import json
import pathlib
import re
from urllib.parse import urlsplit, urlunsplit

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEST = ROOT / 'data/sources/vermont'
EVIDENCE = DEST / 'evidence'
DATE = '2026-10-25'

def read(name):
    return json.loads((EVIDENCE / name).read_text())

def canonical(url):
    parts = urlsplit(url)
    return urlunsplit((parts.scheme, parts.netloc, parts.path, '', ''))

def seed():
    existing_path = DEST / 'research-records.json'
    existing = json.loads(existing_path.read_text()) if existing_path.exists() else []
    by_source = {r['Source URL']: r for r in existing}
    source = read('directory-state-cabins-all.json')
    links = list({canonical(l['url']): l for l in source['links'] if re.search(r'/listings/\d+', l['url'])}.values())
    town_text = source['text'].split('Select Town...\n', 1)[1].split('\nSERVICES', 1)[0]
    towns = set(town_text.splitlines()) | {'West Dover', 'Manchester Center', 'Eden Mills', 'West Addison', 'Lake Elmore', 'Gaysville', 'Waterbury Center', 'Enosburg Falls', 'Lake Fairlee', 'North Hero', 'St. Johnsbury'}
    raw = []
    for link in links:
        chunk = source['text'].split(link['text'], 1)[-1]
        address = next((line.strip() for line in chunk.splitlines() if line.strip().endswith(', VT')), '')
        raw.append({'name': link['text'], 'sourceUrl': canonical(link['url']), 'address': address})
    for page in (4, 5, 6):
        raw.extend(read(f'directory-state-page{page}-rows.json'))
    headers = next(csv.reader((ROOT / 'data/sources/maine/catalog.csv').open(encoding='utf-8-sig', newline='')))
    headers = ['Vermont location' if h == 'Maine location' else h for h in headers]
    for item in raw:
        src = canonical(item['sourceUrl'])
        if src in by_source:
            continue
        address = item.get('address', '')
        place = address.removesuffix(', VT').strip()
        city = next((t for t in sorted(towns, key=len, reverse=True) if place.lower().endswith(t.lower())), '')
        street = place[:-len(city)].strip() if city else ''
        if street and not re.match(r'\d', street):
            street = ''
        name = item['name'].title()
        row = {h: '' for h in headers}
        row.update({'ID': f'VT-{len(existing)+1:04d}', 'Property / operator': name,
                    'Vermont location': city or place, 'State': 'VT',
                    'Candidate category': 'Property / operator — review',
                    'Evidence status': 'Source found in web research',
                    'Discovery method': 'Official statewide tourism directory',
                    'Source URL': src,
                    'Notes': 'Directory page opened. Operator website, direct booking/inquiry and independence need checking. Not a confirmed Pleasant Street participant.',
                    'Research inputs': 'Official Vermont Tourism cabins and cottages directory; six directory result pages',
                    'Property data verification': 'Tourism listing only; direct property facts not yet verified',
                    'City': city, 'Street address': street, 'Full address': address,
                    'Address type': 'Tourism listing address; property or office not yet established',
                    'Address status': 'Published tourism / chamber listing',
                    'Address source URL': src, 'Address checked on': DATE,
                    'Address notes': 'Published by state tourism directory; no ZIP shown. Official property address not yet checked.',
                    'Photo status': 'No property photos', 'Property photo count': '0',
                    'Cover selection': 'Missing', 'Collection status': 'Incomplete',
                    'Missing required fields': 'Independent website and direct-booking verification; property details; genuine photos; official address'})
        existing.append(row)
        by_source[src] = row
    DEST.mkdir(parents=True, exist_ok=True)
    existing_path.write_text(json.dumps(existing, ensure_ascii=False, indent=2) + '\n')
    (DEST / 'csv-schema.json').write_text(json.dumps({'template': 'data/sources/maine/catalog.csv', 'primary_key': 'ID', 'headers': headers, 'header_mapping': {'Maine location': 'Vermont location'}, 'missing_values': 'Empty source cells; Unknown in normalized records', 'master': 'vermont_independent_rental_websites.csv', 'candidate_export': 'vermont_candidates.csv', 'approved_export': 'vermont_approved.csv', 'approval': 'Verified researched eligibility, not owner participation'}, indent=2) + '\n')
    print(json.dumps({'seeded_records': len(existing), 'unique_sources': len(by_source), 'columns': len(headers)}))

if __name__ == '__main__':
    seed()
