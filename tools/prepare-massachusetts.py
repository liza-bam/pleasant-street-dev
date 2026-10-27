"""Merge the Massachusetts research into the regional source and import package.

CSV authoring remains in the established Artifact Tool workbook export step.
Only verified records with three distinct saved photographs enter the app import.
"""
import argparse
import collections
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'data/sources/massachusetts'
TODAY = '2026-10-26'
VERIFIED = {'Verified independent website', 'Verified platform-hosted website'}
STATUSES = VERIFIED | {'Source found in web research', 'Earlier list, not rechecked', 'Not eligible', 'Website unavailable'}


def read(path, default=None):
    return json.loads(path.read_text()) if path.exists() else default


def save(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=1 if path.parent.name == 'cards' else 2) + '\n')


def values(data):
    return list(data.values()) if isinstance(data, dict) else data


def join(value):
    return '\n'.join(map(str, value)) if isinstance(value, list) else str(value or '')


def platform_data(audit):
    found = collections.defaultdict(list)
    badges = collections.defaultdict(list)
    evidence = []
    sources = []
    links = audit.get('platformLinks', {})
    if isinstance(links, dict):
        entries = [{'platform': brand, 'url': url, 'sourcePage': audit['website'],
                    'verifiedMatchingIdentity': True}
                   for brand, urls in links.items() for url in urls]
    else:
        entries = links + audit.get('platformProfileLinks', [])
    for link in entries:
        url = link.get('url', '')
        brand = link.get('platform', '').lower().replace('.com', '')
        if not brand:
            brand = next((b for b in ['airbnb', 'vrbo', 'booking'] if b in url), '')
        if brand not in ['airbnb', 'vrbo', 'booking'] or not url.startswith(('http://', 'https://')):
            continue
        found[brand].append(url)
        sources.append(link.get('sourceUrl') or link.get('sourcePage') or audit['website'])
        if (link.get('verifiedMatchingIdentity') is True or link.get('matchingIdentityVerified') is True) and link.get('matchingUnitVerified') is not False:
            badges[brand].append(url)
            evidence.append({**link, 'platform': brand,
                             'sourceUrl': link.get('sourceUrl') or link.get('sourcePage') or audit['website']})
    return dict(found), dict(badges), evidence, list(dict.fromkeys(sources))


def address_data(audit, row):
    contact = audit.get('contactAddress') or {}
    full = contact.get('fullAddress') or contact.get('full') or ''
    if full == 'Unknown': full = ''
    street = contact.get('street', '')
    city = contact.get('city') or row['City']
    postal = contact.get('postalCode') or contact.get('zip') or ''
    if postal == 'Unknown': postal = ''
    # Separate components only when the source already supplies an explicit full address.
    if full and not street:
        street = full.split(',')[0].strip()
    if full and not postal:
        match = re.search(r'\b(0\d{4})(?:-\d{4})?\b', full)
        postal = match[1] if match else ''
    source = contact.get('source') or contact.get('sourceUrl') or ''
    official = source in audit.get('contactPagesChecked', []) and 'visitma.com' not in source and 'facebook.com' not in source
    if not full and street and street != 'Unknown':
        full = ', '.join(x for x in [street, city, 'MA ' + postal if postal else 'MA'] if x)
    return {'street': street or 'Unknown', 'city': city or 'Unknown', 'state': contact.get('state', 'MA'),
            'postalCode': postal or 'Unknown', 'full': full or 'Unknown',
            'type': contact.get('role') or 'Unknown',
            'status': 'Published on official website' if official else 'Not verified on official operator Contact page',
            'sourceUrl': source or 'Unknown', 'checkedOn': audit.get('checkedOn', TODAY),
            'notes': contact.get('notes') or ('Address is not publicly established; retain directory address separately.' if not street else '')}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--through-batch', type=int, help='Publish a checked cohort while later batches are still being researched')
    args = parser.parse_args()
    schema = read(DEST / 'csv-schema.json')
    audits = {}
    for path in sorted(DEST.glob('verification-batch-*.json')):
        if args.through_batch is not None and int(path.stem.rsplit('-', 1)[1]) > args.through_batch:
            continue
        for audit in read(path):
            assert audit['id'] not in audits, audit['id']
            audits[audit['id']] = dict(audit)
    seeds = {r['id']: r for r in read(DEST / 'discovery-records.json')}
    source_map = read(DEST / 'discovery-source-map.json', {})
    rows = []
    by_id = {}
    for ident, audit in sorted(audits.items()):
        provenance = source_map.get(ident, {})
        row = dict.fromkeys(schema['headers'], '')
        city = next((v for v in [audit.get('city'), audit.get('contactAddress', {}).get('city'), audit.get('town')] if v and v != 'Unknown'), 'Unknown')
        if city == 'Unknown':
            city = seeds.get(ident, {}).get('location', 'Unknown')
        row.update({'ID': ident, 'City': city, 'Massachusetts location': city,
            'Candidate category': audit.get('classification', 'Unknown'),
            'Discovery method': audit.get('discoveryMethod') or provenance.get('method') or 'Regional/operator catalog discovery; opened sources retained',
            'Source URL': audit.get('sourceUrl') or seeds.get(ident, {}).get('sourceUrl') or provenance.get('sourceUrl') or next(iter(audit.get('openedUrls', [])), ''),
            'Research inputs': join(audit.get('researchInputs') or ['Massachusetts regional, directory and operator-catalog research'])})
        rows.append(row)
        by_id[ident] = row
    manifests = {}
    for audit in audits.values():
        for photo in audit.get('photos', []):
            manifests[photo['file']] = {**photo, 'id': audit['id']}
    for filename in ['root-media-sources.json','stayspace-media-sources.json','extra-media-sources.json','mermaid-media-sources.json','vineyard-media-sources.json']:
        for photo in read(DEST / filename, []):
            manifests[photo['file']] = photo
    for photo in manifests.values():
        file = ROOT / photo['file']
        assert file.exists(), file
        assert hashlib.sha256(file.read_bytes()).hexdigest() == photo['sha256'], file
        assert not photo.get('generated')
    imports = []
    address_sources = {}
    platform_reviews = {}
    for ident, audit in audits.items():
        row = by_id[ident]
        status = audit['evidenceStatus']
        assert status in STATUSES
        website = audit.get('website', '')
        if website == 'Unknown':
            website = ''
        if status in VERIFIED:
            assert website.startswith(('http://', 'https://')) and audit.get('bookingUrl')
            assert audit.get('contactPagesChecked') and audit.get('operatorEvidenceUrl'), ident
        address = address_data(audit, row)
        found, badges, link_evidence, link_sources = platform_data(audit)
        platform_status = audit.get('platformCheckStatus', 'Not checked')
        platform_reviews[ident] = {'id': ident, 'name': audit['name'], 'website': website,
            'platformLinks': badges, 'evidence': link_evidence, 'checkedPages': audit.get('openedUrls', []),
            'checkedOn': audit.get('checkedOn', TODAY), 'status': platform_status, 'foundLinks': found}
        photos = sorted([p for p in manifests.values() if p['id'] == ident],
                        key=lambda p: (not Path(p['file']).stem.endswith('-cover'), p['file']))
        unique = list({p['sha256']: p for p in photos}.values())
        facts = {key: (value.strip() or 'Unknown') if isinstance(value, str) else value for key, value in audit.get('supportedFacts', {}).items()}
        gaps = list(audit.get('remainingGaps', []))
        if len(unique) < 4:
            gaps.append(f'Four authentic property photos: {len(unique)} saved')
        description = audit.get('description', '')
        if description == 'Unknown': description = ''
        assert len(description) <= 150, ident
        publish = status in VERIFIED and len(unique) >= 3 and bool(description) and not audit.get('directoryDisposition', '').lower().startswith('superseded')
        notes = join(audit.get('notes', ''))
        if audit.get('contactEmail'): notes += ' Contact email: ' + audit['contactEmail'] + '.'
        if audit.get('contactPhone'): notes += ' Contact phone: ' + audit['contactPhone'] + '.'
        failures = audit.get('accessFailures', []) + audit.get('failedUrls', [])
        if failures:
            notes += ' Access/retired URL observations: ' + json.dumps(failures, ensure_ascii=False)
        row.update({'Property / operator': audit['name'], 'Website URL': website,
            'Candidate category': audit.get('classification', row['Candidate category']), 'Evidence status': status,
            'Notes': audit['eligibilityReason'] + ' ' + notes + ' Research eligibility only; no owner participation established.',
            'Research inputs': row['Research inputs'].split('; own-website verification audit')[0] + '; own-website verification audit and contact/address follow-up ' + TODAY,
            'Sleeps / max guests': str(facts.get('guests')) if isinstance(facts.get('guests'), (int, float)) else facts.get('capacityDetails', ''),
            'Pets OK': facts.get('petsDetails', facts.get('pets', 'Unknown')),
            'Kids OK': facts.get('kidsDetails', facts.get('kids', 'Unknown')),
            'Published price': str(facts.get('priceFrom', 'Unknown')), 'Price details': facts.get('priceDetails', 'Unknown'),
            'Property details source URL': '\n'.join(audit.get('openedUrls', [])),
            'Property data verification': 'Opened-page audit ' + TODAY + ': ' + audit['eligibilityReason'],
            'Description': description, 'Description basis': 'Factual paraphrase of opened sources' if description else '',
            'Description source URL': audit.get('descriptionSource', ''),
            'Description status': 'Paraphrased from verified website' if status in VERIFIED else 'Source-supported lead; eligibility not approved',
            'Cover image': unique[0]['file'] if unique else '', 'Property photo count': str(len(unique)),
            'Photo status': 'Four authentic photos saved' if len(unique) >= 4 else f'{len(unique)} authentic photos saved; incomplete',
            'Cover selection': unique[0].get('unitOrCampus', '') if unique else '',
            'Street address': '' if address['street'] == 'Unknown' else address['street'],
            'City': address['city'], 'State': 'MA', 'ZIP code': '' if address['postalCode'] == 'Unknown' else address['postalCode'],
            'Full address': '' if address['full'] == 'Unknown' else address['full'], 'Address type': address['type'],
            'Address status': address['status'], 'Address source URL': address['sourceUrl'], 'Address checked on': TODAY,
            'Address notes': address['notes'], 'Collection status': 'Incomplete', 'Missing required fields': '; '.join(dict.fromkeys(gaps)),
            'Airbnb URLs': '\n'.join(found.get('airbnb', [])), 'Vrbo URLs': '\n'.join(found.get('vrbo', [])),
            'Booking.com URLs': '\n'.join(found.get('booking', [])),
            'Platform link source URLs': '\n'.join(link_sources),
            'Platform links checked on': TODAY, 'Platform link status': platform_status,
            'Directory status': audit.get('directoryDisposition') if audit.get('directoryDisposition', '').lower().startswith('superseded') else ('Active' if publish else 'Approved; media pending' if status in VERIFIED else 'Excluded' if status == 'Not eligible' else 'Held for verification'),
            'Directory review notes': audit['eligibilityReason'] + (' Publication waits for three correctly attributed photographs.' if status in VERIFIED and not publish else '')})
        for index in range(3):
            row[f'Photo {index:03}'] = unique[index + 1]['file'] if len(unique) > index + 1 else ''
        address_sources[ident] = {'id': ident, **address}
        audit['reviewed'] = True
        audit['eligibilityStatus'] = status
        if not publish:
            continue
        kind = audit.get('recordType', '').lower()
        record_type = 'Rental operator' if 'operator' in kind or 'manager' in audit.get('classification', '').lower() else 'Cabins / small operator' if 'campus' in kind else 'Property'
        typ = audit.get('type', 'Unknown')
        if typ == 'vacation rental' and 'apartment' in audit.get('classification', '').lower(): typ = 'Apartment'
        if typ not in ['House', 'Cabin', 'Camp', 'Apartment']:
            typ = 'Cabin' if 'cabin' in typ.lower() and 'candidate' not in typ.lower() else 'Unknown'
        labels = list(dict.fromkeys(p.get('unitOrCampus', '') for p in unique if p.get('unitOrCampus')))
        label = 'Photos: ' + '; '.join(re.sub(r';.*$|,?\s*single named rental|\s*only$', '', item).strip() for item in labels) if record_type != 'Property' else ''
        home = {'id': ident, 'name': audit['name'], 'url': website, 'town': row['Massachusetts location'], 'state': 'MA',
            'place': row['Massachusetts location'] + ', MA', 'type': typ, 'recordType': record_type,
            'description': description, 'descriptionSource': audit.get('descriptionSource') or website,
            'descriptionStatus': row['Description status'], 'capacityDetails': facts.get('capacityDetails', 'Unknown'),
            'priceDetails': facts.get('priceDetails', 'Unknown'), 'kidsDetails': facts.get('kidsDetails', 'Unknown'),
            'petsDetails': facts.get('petsDetails', 'Unknown'), 'photo': unique[0]['file'], 'coverPhoto': unique[0]['file'],
            'photos': [{'file': p['file'], 'role': 'cover' if i == 0 else 'photo'} for i, p in enumerate(unique)],
            'logo': row['Logo image'] or 'Unknown', 'photoStatus': row['Photo status'], 'address': address, 'sourceDetails': row,
            'contactPagesChecked': audit['contactPagesChecked'], 'bookingMethod': audit.get('bookingMethod', ''),
            'bookingUrl': audit['bookingUrl'], 'operatorEvidenceUrl': audit['operatorEvidenceUrl'],
            'cardDescription': description, 'cardDescriptionSource': audit.get('descriptionSource') or website,
            'cardPhotos': [p['file'] for p in unique[:3]], 'cardPhotoLabel': audit.get('publicPhotoLabel') or (label if record_type != 'Property' else ''), 'platformLinks': badges,
            'collectionStatus': 'Incomplete', 'missingRequiredFields': list(dict.fromkeys(gaps)),
            'listingStatus': 'Active', 'checked': TODAY, 'alive': True, 'demo': False, 'featured': False}
        for field in ['rooms', 'bedrooms', 'bathrooms', 'guests', 'kids', 'pets', 'priceFrom', 'currency']:
            home[field] = facts.get(field, 'Unknown')
        imports.append(home)
    assert set(seeds) <= set(audits), 'Unreviewed statewide directory seeds'
    for name, data in [('research-records.json', rows), ('website-audit.json', list(audits.values())),
                       ('approved-import.json', sorted(imports, key=lambda h: h['id'])),
                       ('address-sources.json', list(address_sources.values())),
                       ('platform-links.json', list(platform_reviews.values())), ('photo-sources.json', list(manifests.values())),
                       ('eligibility-evidence.json', audits)]:
        save(DEST / name, data)
    for filename, field in [('descriptions.json', 'description'), ('photo-selections.json', 'photo')]:
        path = ROOT / 'data/sources/cards' / filename
        data = read(path)
        for home in imports:
            data[home['id']] = ({'description': home['cardDescription'], 'sourceUrl': home['cardDescriptionSource'], 'checkedOn': TODAY, 'status': 'Factual summary of opened official website'}
                                if field == 'description' else {'files': home['cardPhotos'], 'label': home['cardPhotoLabel']})
        save(path, data)
    path = ROOT / 'data/sources/cards/platform-links.json'
    shared = {x['id']: x for x in read(path)}
    for home in imports: shared[home['id']] = platform_reviews[home['id']]
    save(path, list(shared.values()))
    counts = dict(collections.Counter(a['evidenceStatus'] for a in audits.values()))
    progress = read(DEST / 'research-progress.json')
    progress['verificationAudit'] = {'reviewed': len(audits), 'statuses': counts,
        'eligible': sum(r['Evidence status'] in VERIFIED for r in rows), 'photoReadyImport': len(imports),
        'unresolvedIds': [a['id'] for a in audits.values() if a['evidenceStatus'] == 'Source found in web research'],
        'unavailableIds': [a['id'] for a in audits.values() if a['evidenceStatus'] == 'Website unavailable'],
        'checkedOn': TODAY, 'publication': 'Prepared locally; not yet deployed'}
    progress['policyReview'] = {'status': 'In progress: mandatory per-ready-listing audit',
        'completedAuditFiles': [f.name for f in DEST.glob('policy-audit-*.json')],
        'olderInventoriesNext': ['Maine','Vermont','New Hampshire']}
    save(DEST / 'research-progress.json', progress)
    bad = [{'id': a['id'], 'name': a['name'], 'state': 'MA', 'town': by_id[a['id']]['Massachusetts location'],
            'url': a.get('website',''), 'checkedOn': TODAY, 'reason': a['eligibilityReason'],
            'observations': a.get('accessFailures', []), 'evidence': a.get('openedUrls', []),
            'excludedFromDirectory': True, 'alternateUrl': ''}
           for a in audits.values() if a['evidenceStatus'] == 'Website unavailable']
    save(DEST / 'bad-websites.json', bad)
    path = ROOT / 'bad-websites.md'
    marker = '<!-- MA-VERIFICATION-AUDIT -->'
    prefix = path.read_text().split(marker)[0].rstrip()
    lines = [marker, '## Massachusetts website audit — 2026-10-26', '',
        'Client blocking and browser security warnings are retained as research limitations; business closure is not inferred.', '']
    for site in bad:
        lines += [f"### {site['id']} — {site['name']} ({site['town']}, MA)", '',
            f"- URL: {site['url']}", f"- Checked: {TODAY}", f"- Observation: {site['reason']}",
            '- Access detail: ' + json.dumps(site['observations'], ensure_ascii=False),
            '- Evidence: ' + '; '.join(site['evidence']), '- Directory state: Excluded; no working replacement verified.', '']
    path.write_text((prefix + '\n\n' + '\n'.join(lines)).rstrip() + '\n')
    print(json.dumps(progress['verificationAudit'], indent=2))

if __name__ == '__main__':
    main()
