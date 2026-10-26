#!/usr/bin/env python3
"""Read the LAZY websites (data/sources/lazy.json) into the same import contract as the Maine catalog.
They are real properties, featured on the street; a site not yet in the database is added.

Only allowlisted public facts are retained. Never save widget config, calendar feeds,
API keys or booking tokens. Unknown and conflicting facts remain Unknown.
"""
import concurrent.futures as cf,datetime,hashlib,importlib.util,json,pathlib,re,sys,urllib.parse
from bs4 import BeautifulSoup
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('ps_import',ROOT/'tools/import.py');imp=importlib.util.module_from_spec(spec);spec.loader.exec_module(imp)
UNKNOWN='Unknown';TODAY=datetime.date.today().isoformat()
out=ROOT/'data/sources/demos';out.mkdir(parents=True,exist_ok=True)
media=ROOT/'images/demos';media.mkdir(exist_ok=True)
current=json.loads((ROOT/'data/homes.json').read_text());bykey={imp.key(h['url']):h for h in current}
sources=json.loads((ROOT/'data/sources/lazy.json').read_text())
NUM={'one':1,'two':2,'three':3,'four':4,'five':5,'six':6,'seven':7,'eight':8,'nine':9,'ten':10}
def number(value):
    if isinstance(value,(float,int)) and not isinstance(value,bool):return value
    return NUM.get(str(value).lower(),int(value) if str(value).isdigit() else None)
def text(value):return BeautifulSoup(str(value or ''),'html.parser').get_text(' ',strip=True)
def fact(value):return value if value not in (None,'') else UNKNOWN
def sync(seed):
    previous=bykey.get(imp.key(seed['url']),{});notes=[]
    ident=previous.get('id') or 'LAZY-'+re.sub(r'[^a-z0-9]+','-',seed['name'].lower()).strip('-')
    raw=imp.get(seed['url']);soup=BeautifulSoup(raw,'html.parser')
    match=re.search(r'window\.LV_CONFIG\s*=\s*',raw.decode('utf-8'))
    if not match:raise ValueError('No public LV_CONFIG snapshot for '+seed['url'])
    cfg,_=json.JSONDecoder().raw_decode(raw.decode('utf-8')[match.end():]);content=cfg.get('preload',{}).get('config',{})
    hero=content.get('hero',{});facts=hero.get('facts',{});extra=content.get('facts') or {}
    enabled=extra.get('enabled') is True
    prop=cfg.get('property',{});visible=soup.get_text(' ',strip=True)
    # Limit the capacity comparison to rendered text; never search raw configuration.
    for node in soup(['script','style','noscript','svg']):node.decompose()
    visible=soup.get_text(' ',strip=True)
    capacities={number(m.group(1)) for m in re.finditer(r'\b(?:sleeps?|room for|space for)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b',visible,re.I)}-{None}
    if number(facts.get('guests')) is not None:capacities.add(number(facts['guests']))
    if len(capacities)>1:
        guests=UNKNOWN;capacity='Conflicting published capacities: '+', '.join(map(str,sorted(capacities)))
        notes.append(capacity)
    else:
        guests=next(iter(capacities),UNKNOWN);capacity=str(guests)
    bedrooms=number(facts.get('bedrooms'));bathrooms=number(facts.get('bathrooms'))
    if enabled and number(extra.get('bedrooms')) is not None and bedrooms is not None and bedrooms!=number(extra['bedrooms']):
        notes.append(f'Conflicting bedroom facts: hero {bedrooms}, enabled facts section {extra["bedrooms"]}.');bedrooms=UNKNOWN
    if bathrooms in (None,0) and enabled and number(extra.get('bathrooms')):bathrooms=extra['bathrooms']
    if bathrooms in (None,0) and re.search(r'one (?:full |private )?bathroom',visible,re.I):bathrooms=1
    if bathrooms==0:bathrooms=UNKNOWN
    kids='Yes' if facts.get('kids') is True or enabled and extra.get('kids') is True or re.search(r'baby friendly|small guests welcome',visible,re.I) else UNKNOWN
    pets='Yes' if facts.get('pets') is True or enabled and extra.get('pets') is True else UNKNOWN
    if re.search(r'\b(?:no pets|pets (?:are )?not (?:allowed|permitted))\b',visible,re.I):pets='No'
    if re.search(r'\b(?:adults only|no children|children (?:are )?not (?:allowed|permitted))\b',visible,re.I):kids='No'
    if any(facts.get(k) is False for k in ['kids','pets']):notes.append('Unshown welcome badges are not treated as confirmed No policies.')
    name=cfg.get('propertyName') or hero.get('name') or previous['name']
    seedtown,_,seedstate=seed.get('place','').partition(', ')
    city=prop.get('city') or previous.get('town') or seedtown or UNKNOWN
    if city=='Sn Francisco':notes.append('Normalized published city typo Sn Francisco to San Francisco.');city='San Francisco'
    state=prop.get('state') or previous.get('state') or seedstate or UNKNOWN
    lat=prop.get('lat') if isinstance(prop.get('lat'),(int,float)) else previous.get('lat',seed.get('lat',UNKNOWN))
    lng=prop.get('lng') if isinstance(prop.get('lng'),(int,float)) else previous.get('lng',seed.get('lng',UNKNOWN))
    if isinstance(lat,(int,float)):lat=round(lat,2)
    if isinstance(lng,(int,float)):lng=round(lng,2)
    meta=soup.find('meta',attrs={'name':'description'})
    description=meta.get('content','') if meta else ''
    if not description:
        for key in ['houseTour','sleeping','yourStay']:
            section=content.get(key) or {};candidate=text(section.get('body') or section.get('text'))
            if len(candidate)>40:description=candidate;break
    if not description:description=previous.get('description',UNKNOWN)
    if notes and any('Conflicting' in n for n in notes):syncstatus='Checked; source facts conflict'
    else:syncstatus='Synced from the property website'
    street=prop.get('address');postal=prop.get('zip');full=', '.join(str(v) for v in [street,city if city!=UNKNOWN else None,' '.join(str(v) for v in [state if state!=UNKNOWN else None,postal] if v)] if v)
    address={'street':fact(street),'city':city,'state':state,'postalCode':fact(postal),'full':full or UNKNOWN,
      'type':'Published property address' if street else UNKNOWN,'status':'Published on the property website' if street else 'Unknown',
      'sourceUrl':seed['url'],'checkedOn':TODAY,'notes':'Map position is approximate; the address is never shown.'}
    # Property sections only, not guidebook attraction photographs.
    candidates=[]
    def photo(p):
        if not isinstance(p,dict):return
        url=p.get('url') or p.get('src')
        if not url:return
        label=' '.join(str(p.get(k,'')) for k in ['alt','caption','label'])
        if re.search(r'cafe|caf[eé]|restaurant|museum|skyline|theat[er]|pedestrian|city street|landmark|bakery|coffee cup|sandcastle|beach day',label,re.I):return
        score=10 if re.search(r'exterior|facade|cottage|brownstone|cabin|entrance|front door|house',label,re.I) else 5 if re.search(r'bedroom|living|kitchen|bathroom|pool|terrace|patio|dining|sofa|hallway',label,re.I) else 0
        candidates.append((score,urllib.parse.urljoin(seed['url'],url),label))
    photo(hero.get('photo'))
    for p in hero.get('gallery',[]):photo(p)
    for key in ['sleeping','houseTour','yourStay']:
        section=content.get(key) or {};pics=section.get('photos',[])
        if isinstance(pics,dict):pics=pics.get('items',[])
        for p in pics:photo(p)
    if len(candidates)<4:
        for p in (content.get('photos') or {}).get('items',[]):photo(p)
    unique={u:(score,u,label) for score,u,label in candidates};chosen=sorted(unique.values(),key=lambda p:-p[0])[:4]
    photos=[];evidence=[];seen_images=set()
    for n,(_,url,label) in enumerate(chosen):
        try:
            data=imp.get(url);extension=pathlib.Path(urllib.parse.urlsplit(url).path).suffix.lower()
            if extension not in ['.jpg','.jpeg','.png','.webp','.avif']:continue
            digest=hashlib.sha256(data).hexdigest()
            if digest in seen_images:continue
            seen_images.add(digest)
            role='cover' if n==0 else f'{n-1:03d}';target=media/f'{ident}-{role}{extension}';target.write_bytes(data)
            path=str(target.relative_to(ROOT));photos.append({'file':path,'role':'cover' if not photos else 'photo'})
            evidence.append({'file':path,'sourceUrl':url,'sourcePage':seed['url'],'label':label,'sha256':hashlib.sha256(data).hexdigest()})
        except Exception as e:notes.append('Photo unavailable: '+str(e)[:100])
    published_type=facts.get('type','')
    kind='House' if re.search(r'rowhome|house|cottage',published_type,re.I) else 'Apartment' if re.search(r'apartment|loft|studio',published_type,re.I) else previous.get('type',UNKNOWN)
    result={'id':ident,'name':name,'url':seed['url'],'town':city,'state':state,'place':f'{city}, {state}',
      'lat':lat,'lng':lng,'locationSource':seed['url'],'description':fact(description),'type':kind,'rooms':UNKNOWN,'bedrooms':fact(bedrooms),'bathrooms':fact(bathrooms),
      'guests':guests,'capacityDetails':capacity,'kids':kids,'pets':pets,'kidsDetails':'Published policy: '+kids,'petsDetails':'Published policy: '+pets,
      'address':address,'demo':False,'featured':True,'recordType':'LAZY property','listingStatus':'Active','checked':TODAY,'alive':True,
      'sourceFacts':{'sourceUrl':seed['url'],'checkedOn':TODAY,'heroFacts':{k:v for k,v in facts.items() if k in ['bedrooms','bathrooms','guests','kids','pets','type']},'notes':notes},
      'syncStatus':syncstatus,'syncNotes':' '.join(notes)}
    if photos:result.update(photo=photos[0]['file'],coverPhoto=photos[0]['file'],photos=photos,photoStatus='Complete' if len(photos)==4 else 'Partial')
    return result,evidence

results=[];images=[];errors=[]
with cf.ThreadPoolExecutor(max_workers=5) as executor:
    futures={executor.submit(sync,s):s for s in sources}
    for future in cf.as_completed(futures):
        try:
            row,pics=future.result();results.append(row);images+=pics
            print(row['id'],row['name'],row['syncStatus'],flush=True)
        except Exception as error:errors.append({'url':futures[future]['url'],'error':str(error)});print('ERROR',str(error),flush=True)
(out/'catalog.json').write_text(json.dumps(sorted(results,key=lambda h:h['id']),ensure_ascii=False,indent=1)+'\n')
(out/'photo-sources.json').write_text(json.dumps(images,ensure_ascii=False,indent=1)+'\n')
(out/'sync-report.json').write_text(json.dumps({'checkedOn':TODAY,'checked':len(results),'errors':errors,'conflicts':[{'id':r['id'],'notes':r['syncNotes']} for r in results if 'conflict' in r['syncStatus']]},ensure_ascii=False,indent=1)+'\n')
if errors:sys.exit(1)
print(json.dumps({'checked':len(results),'photos':len(images),'conflicts':sum('conflict' in r['syncStatus'] for r in results)}),flush=True)
