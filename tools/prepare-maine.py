#!/usr/bin/env python3
"""Prepare the reviewed local catalog for the existing JSON importer. No website crawling."""
import csv,datetime,json,pathlib,re,shutil,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
SRC=pathlib.Path(sys.argv[1]).resolve()
DEST=ROOT/'data/sources/maine';DEST.mkdir(parents=True,exist_ok=True)
MEDIA=ROOT/'images';MEDIA.mkdir(parents=True,exist_ok=True)
with (SRC/'Maine_Rental_Websites_updated.csv').open(encoding='utf-8-sig',newline='') as file:rows=list(csv.DictReader(file))
UNKNOWN='Unknown'
def fact(value):return value.strip() or UNKNOWN
def policy(value):
    if not value:return UNKNOWN
    if re.match(r'^no\b',value,re.I):return 'No'
    if re.match(r'^yes\b',value,re.I) and not re.search(r'selected|only|approval|confirm|private cabins|4 of|5–7|motel|may differ|over age|under supervision|age',value,re.I):return 'Yes'
    return 'Conditional'
def kind(name,category):
    if re.search(r'\bcamps?\b|\bcampground\b',name,re.I):return 'Camp'
    if category.startswith('Local rental manager'):return UNKNOWN
    if re.search(r'cabin|yurt|treehouse',name,re.I):return 'Cabin'
    if re.search(r'apartment|condo|suite',name,re.I):return 'Apartment'
    if re.search(r'cottage|vacation home|house',name,re.I):return 'House'
    return UNKNOWN
copied=set();homes=[]
for row in rows:
    ident=row['ID'];photos=[]
    for column in ['Cover image','Photo 000','Photo 001','Photo 002','Logo image']:
        value=row[column]
        if not value:continue
        src=SRC/value;target=MEDIA/src.name
        legacy=ROOT/'images/catalog'/src.name
        if legacy.exists() and not target.exists():legacy.replace(target)
        if not target.exists() or target.stat().st_size!=src.stat().st_size:shutil.copyfile(src,target)
        copied.add(target.name)
        if column!='Logo image':photos.append({'file':'images/'+target.name,'role':'cover' if column=='Cover image' else 'photo'})
    capacity=row['Sleeps / max guests'];guests=int(capacity) if re.fullmatch(r'\d+',capacity) else UNKNOWN
    rate=re.fullmatch(r'\$(\d+(?:,\d{3})*(?:\.\d+)?)/night',row['Published price'].strip())
    price=float(rate.group(1).replace(',','')) if rate else UNKNOWN
    location=row['Maine location'];town=re.split(r'\s*/\s*|\s*\+\s*',location)[0].strip()
    town=re.sub(r'\s*\([^)]*\)','',town).strip()
    if town.lower() in ['maine','statewide','various','unknown','midcoast','southern maine']:town=UNKNOWN
    source_file=SRC/'logs'/f'{ident}.json';report=json.loads(source_file.read_text())
    prior_answer=bool(report.get('pages'))
    checked=datetime.datetime.fromtimestamp(source_file.stat().st_mtime).date().isoformat() if prior_answer else UNKNOWN
    record_type='Rental operator' if row['Candidate category'].startswith('Local rental manager') else ('Property / small operator' if row['Candidate category'].startswith('Cabins') else 'Property')
    address={key:fact(row[col]) for key,col in [('street','Street address'),('city','City'),('state','State'),('postalCode','ZIP code'),('full','Full address'),('type','Address type'),('status','Address status'),('sourceUrl','Address source URL'),('checkedOn','Address checked on'),('notes','Address notes')]}
    homes.append({'id':ident,'name':row['Property / operator'],'url':row['Website URL'],
      'town':town,'state':'ME','place':location+', ME','type':kind(row['Property / operator'],row['Candidate category']),
      'recordType':record_type,'description':fact(row['Description']),'rooms':UNKNOWN,'bedrooms':UNKNOWN,'bathrooms':UNKNOWN,
      'guests':guests,'capacityDetails':fact(capacity),'priceFrom':price,'currency':'USD' if rate else UNKNOWN,
      'priceDetails':fact(' '.join(v for v in [row['Published price'],row['Price details']] if v)),
      'kids':policy(row['Kids OK']),'pets':policy(row['Pets OK']),'kidsDetails':fact(row['Kids OK']),'petsDetails':fact(row['Pets OK']),
      'photo':photos[0]['file'] if photos else UNKNOWN,'coverPhoto':photos[0]['file'] if photos else UNKNOWN,
      'photos':photos,'logo':'images/'+pathlib.Path(row['Logo image']).name if row['Logo image'] else UNKNOWN,
      'photoStatus':row['Photo status'],'address':address,'sourceDetails':row,
      'listingStatus':'Needs review' if row['Photo status']=='Website mismatch' else 'Active',
      'checked':checked,'alive':True if prior_answer else UNKNOWN})
target=DEST/'catalog.json';target.write_text(json.dumps(homes,ensure_ascii=False,indent=1)+'\n')
shutil.copyfile(SRC/'Maine_Rental_Websites_updated.csv',DEST/'catalog.csv')
shutil.copyfile(SRC/'schema.json',DEST/'csv-schema.json')
# Provenance for the selected photos only; no rejected/unused imagery is uploaded.
manifest=json.loads((SRC/'image-manifest.json').read_text())
selected=[{'id':r['id'],'photos':[{k:p.get(k,'') for k in ['file','role','url','page','sha256','width','height']} for p in r['photos']],
 'logo':{k:r['logo'].get(k,'') for k in ['file','url','page','sha256']} if r.get('logo') else None} for r in manifest]
(DEST/'photo-sources.json').write_text(json.dumps(selected,ensure_ascii=False,indent=1)+'\n')
addresses=json.loads((SRC/'address-manifest.json').read_text())
(DEST/'address-sources.json').write_text(json.dumps([{'id':r['id'],'address':{k:v for k,v in r['address'].items() if k!='cache'} if r['address'] else None,'type':r['address_type'],'status':r['status'],'notes':r['notes'],'checkedOn':r['checked_on']} for r in addresses],ensure_ascii=False,indent=1)+'\n')
print(json.dumps({'records':len(homes),'selectedMedia':len(copied),'source':str(target)}))
