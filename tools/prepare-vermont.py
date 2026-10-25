#!/usr/bin/env python3
"""Apply reviewed Vermont facts, collect selected source photos, and prepare approved import."""
import concurrent.futures
import hashlib
import io
import json
import pathlib
import re
import ssl
import urllib.parse
import urllib.request
from PIL import Image, ImageDraw, ImageOps

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEST = ROOT / 'data/sources/vermont'
EVIDENCE = DEST / 'evidence'
TODAY = '2026-10-25'
TLS = ssl.create_default_context(cafile='/etc/ssl/cert.pem')
FACTS = json.loads((DEST / 'reviewed-facts.json').read_text())
ROWS = json.loads((DEST / 'research-records.json').read_text())
TARGETS = {r['id']: r for r in json.loads((DEST / 'operator-targets.json').read_text())}
PRIOR_MEDIA = {(m['id'],m['role']):m for m in json.loads((DEST/'photo-sources.json').read_text())} if (DEST/'photo-sources.json').exists() else {}

def source_image(spec):
    page = json.loads((EVIDENCE / spec[0]).read_text())
    return page['images'][spec[1]], page['url']

def collect(job):
    ident, role, spec = job
    if (EVIDENCE/spec[0]).exists():
        image, page = source_image(spec)
    else:
        previous=PRIOR_MEDIA.get((ident,role))
        if previous is None:
            raise ValueError(f'{ident} {role}: source capture or published photo provenance required')
        image, page = previous, previous['page']
    url = image['url']
    ext = pathlib.Path(urllib.parse.urlsplit(url).path).suffix.lower()
    if ext not in ['.svg', '.png', '.jpg', '.jpeg', '.webp', '.avif']:
        ext = '.jpg'
    target = ROOT / 'images' / f'{ident}-{role}{ext}'
    if not target.exists():
        req = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0', 'Referer':page})
        with urllib.request.urlopen(req, timeout=25, context=TLS) as response:
            data = response.read()
        if ext != '.svg':
            im = Image.open(io.BytesIO(data))
            actual = {'JPEG':'.jpg','PNG':'.png','WEBP':'.webp','AVIF':'.avif'}.get(im.format, ext)
            target = target.with_suffix(actual)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    data = target.read_bytes()
    width = height = None
    if target.suffix != '.svg':
        with Image.open(target) as im:
            width, height = im.size
    return {'id':ident,'role':role,'file':str(target.relative_to(ROOT)), 'url':url, 'page':page,
            'alt':image.get('alt',''),'width':width,'height':height,
            'sha256':hashlib.sha256(data).hexdigest(),'checkedOn':TODAY,'generated':False}

def main():
    jobs=[]
    for ident,fact in FACTS.items():
        for i,spec in enumerate(fact['media']):
            jobs.append((ident, 'cover' if i == 0 else f'{i-1:03d}', spec))
        if fact.get('logo'):
            jobs.append((ident,'logo',fact['logo']))
    manifest=[]; failures=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futures={pool.submit(collect,job):job for job in jobs}
        for future in concurrent.futures.as_completed(futures):
            try: manifest.append(future.result())
            except Exception as exc: failures.append({'job':futures[future],'error':str(exc)})
    manifest.sort(key=lambda m:(m['id'],m['role']))
    (DEST/'photo-sources.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    (DEST/'photo-errors.json').write_text(json.dumps(failures,ensure_ascii=False,indent=2)+'\n')
    normalized=[]
    address_sources=[]
    for row in ROWS:
        ident=row['ID']
        if ident in TARGETS:
            row['Website URL']=TARGETS[ident]['url']
        if ident in ['VT-0016','VT-0044']:
            row['Vermont location']=row['City']='Morrisville'
        if ident not in FACTS:
            continue
        fact=FACTS[ident]
        official_path=EVIDENCE/f'{ident}-official.json'
        url=json.loads(official_path.read_text())['url'] if official_path.exists() else row['Website URL']
        addr=dict(fact['address'])
        addr.update({'checkedOn':TODAY,'status':'Published tourism / chamber listing' if 'tourism' in addr['sourceUrl'] else 'Published on official website'})
        photos=[m for m in manifest if m['id']==ident and m['role']!='logo']
        logos=[m for m in manifest if m['id']==ident and m['role']=='logo']
        cover=next((m['file'] for m in photos if m['role']=='cover'),'Unknown')
        photo_count=len({m['sha256'] for m in photos})
        gaps=[]
        if addr['status']!='Published on official website':gaps.append('Official physical address for each rental')
        if not addr.get('postalCode'):gaps.append('Published ZIP code')
        if photo_count<4:gaps.append('Four genuine property photos')
        if fact.get('guests') is None:gaps.append('Unit-specific numeric capacity')
        if not fact.get('pets'):gaps.append('Pet policy')
        if not fact.get('kids'):gaps.append('Child policy')
        if fact.get('priceFrom') is None:gaps.append('Current published nightly rate')
        status='Complete' if not gaps else 'Incomplete'
        row.update({'Property / operator':fact['name'],'Vermont location':addr['city'],'Website URL':url,
          'Candidate category':'Individual property / host' if fact['recordType']=='Property' else 'Local rental operator' if fact['recordType']=='Rental operator' else 'Cabins / small operator',
          'Evidence status':'Verified independent website','Notes':fact['notes']+' Direct method checked: '+fact['bookingMethod']+'. '+fact['bookingUrl']+' Checked '+TODAY+'. Research eligibility only, not owner participation.',
          'Research inputs':'; '.join(dict.fromkeys(part.strip() for part in (row['Research inputs']+'; official website; property/contact/policy follow-up passes').split(';') if part.strip())),
          'Sleeps / max guests':str(fact.get('guests') or fact.get('capacityDetails','')),
          'Pets OK':fact.get('petsDetails',''),'Kids OK':fact.get('kidsDetails',''),
          'Published price':f"From ${fact['priceFrom']}/night" if fact.get('priceFrom') is not None else '',
          'Price details':fact.get('priceDetails','Date-dependent rates; inquire or choose dates on the operator site.'),
          'Property details source URL':fact['detailsSource'], 'Property data verification':'Opened official website and direct inquiry/booking path; contact and property facts reviewed '+TODAY,
          'Description':fact['description'],'Description basis':'Paraphrase of opened official website facts',
          'Description source URL':url,'Description status':'Paraphrased from verified source website',
          'Cover image':cover if cover!='Unknown' else '', 'Logo image':logos[0]['file'] if logos else '',
          'Property photo count':str(photo_count),'Photo status':'Complete' if photo_count>=4 else 'Partial',
          'Cover selection':'Property photo fallback','Collection status':status,'Missing required fields':'; '.join(gaps),
          'Street address':addr['street'],'City':addr['city'],'State':'VT','ZIP code':addr['postalCode'],
          'Full address':addr['full'],'Address type':addr['type'],'Address status':addr['status'],
          'Address source URL':addr['sourceUrl'],'Address checked on':TODAY,'Address notes':addr['notes']})
        for i in range(3):
            row[f'Photo {i:03d}']=next((m['file'] for m in photos if m['role']==f'{i:03d}'),'')
        normalized.append({'id':ident,'name':fact['name'],'url':url,'town':addr['city'],'state':'VT','place':addr['city']+', VT',
          'type':fact['type'],'recordType':fact['recordType'],'description':fact['description'],
          'rooms':fact.get('rooms','Unknown'),'bedrooms':fact.get('bedrooms','Unknown'),'bathrooms':fact.get('bathrooms','Unknown'),
          'guests':fact.get('guests','Unknown'),'capacityDetails':fact.get('capacityDetails','Unknown'),
          'kids':fact.get('kids','Unknown'),'pets':fact.get('pets','Unknown'),'kidsDetails':fact.get('kidsDetails','Unknown'),'petsDetails':fact.get('petsDetails','Unknown'),
          'priceFrom':fact.get('priceFrom','Unknown'),'currency':fact.get('currency','Unknown'),'priceDetails':row['Price details'],
          'photo':cover,'coverPhoto':cover,'photos':[{'file':m['file'],'role':'cover' if m['role']=='cover' else 'photo'} for m in photos],
          'logo':row['Logo image'] or 'Unknown','photoStatus':row['Photo status'],'address':addr,'sourceDetails':row,
          'descriptionSource':url,'descriptionStatus':row['Description status'],'collectionStatus':status,'missingRequiredFields':gaps,
          'listingStatus':'Active','checked':TODAY,'alive':True,'demo':False,'featured':False})
        address_sources.append({'id':ident,**addr})
    (DEST/'research-records.json').write_text(json.dumps(ROWS,ensure_ascii=False,indent=2)+'\n')
    (DEST/'approved-import.json').write_text(json.dumps(normalized,ensure_ascii=False,indent=2)+'\n')
    (DEST/'address-sources.json').write_text(json.dumps(address_sources,ensure_ascii=False,indent=2)+'\n')
    sheet=Image.new('RGB',(1120,len(FACTS)*190),'white');draw=ImageDraw.Draw(sheet)
    for y,(ident,fact) in enumerate(FACTS.items()):
        draw.text((5,y*190+3),ident+' '+fact['name'],fill='black')
        for x,role in enumerate(['cover','000','001','002']):
            item=next((m for m in manifest if m['id']==ident and m['role']==role),None)
            if item:
                with Image.open(ROOT/item['file']) as image:
                    image=ImageOps.fit(image.convert('RGB'),(270,160))
                sheet.paste(image,(x*280,y*190+23))
    (ROOT/'research-artifacts').mkdir(exist_ok=True)
    sheet.save(ROOT/'research-artifacts/vermont-first-batch-photos.jpg')
    print(json.dumps({'researchRecords':len(ROWS),'approvedImport':len(normalized),'selectedAssets':len(manifest),'downloadFailures':failures},ensure_ascii=False))

if __name__=='__main__':main()
