"""Normalize a checked regional worker snapshot; CSV authoring remains in Artifact Tool.

Usage: python3 tools/prepare-regional-research.py new-york NY --snapshot path.json
Only explicit checked snapshots are consolidated. Shared-URL unit conflicts remain held.
"""
import argparse, collections, hashlib, importlib.util, json
from pathlib import Path
from urllib.parse import urlparse
ROOT=Path(__file__).resolve().parents[1]
VERIFIED={'Verified independent website','Verified platform-hosted website'}
STATUSES=VERIFIED|{'Source found in web research','Earlier list, not rechecked','Not eligible','Website unavailable'}

def read(p,default=None):return json.loads(p.read_text()) if p.exists() else default

def save(p,v):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('region');p.add_argument('state');p.add_argument('--snapshot',required=True);a=p.parse_args();dest=ROOT/'data/sources'/a.region
 schema=read(dest/'csv-schema.json');headers=schema['headers'];location=headers[2];audits=read(Path(a.snapshot));assert isinstance(audits,list);assert len({x['id'] for x in audits})==len(audits)
 spec=importlib.util.spec_from_file_location('ma_helpers',ROOT/'tools/prepare-massachusetts.py');ma=importlib.util.module_from_spec(spec);spec.loader.exec_module(ma)
 rows=[];imports=[];photos=[];platforms=[];addresses=[];website_audit=[];policy=[];identity=collections.defaultdict(list)
 locations=read(dest/'location-sources.json',{});locations=locations.get('properties',locations.get('locations',locations))
 imp_spec=importlib.util.spec_from_file_location('import_helpers',ROOT/'tools/import.py');imp=importlib.util.module_from_spec(imp_spec);imp_spec.loader.exec_module(imp)
 for x in audits:identity[imp.key(x.get('website',''))].append(x['id'])
 for raw in audits:
  x=dict(raw);ident=x['id'];assert ident.startswith(a.state+'-');status=x['evidenceStatus'];assert status in STATUSES
  date=x['checkedOn'];website=x.get('website','');description=x.get('description','');assert len(description)<=150
  row=dict.fromkeys(headers,'');city=x.get('city') or x.get('town') or 'Unknown';facts=x.get('supportedFacts',{});gaps=list(x.get('remainingGaps',[]));holds=[]
  if status in VERIFIED:assert x.get('state')==a.state and x.get('bookingUrl') and x.get('operatorEvidenceUrl') and x.get('contactPagesChecked') and x.get('policyAudit'),ident
  if len(identity[imp.key(website)])>1:holds.append('Shared website URL requires explicit unit-identity integration')
  if x.get('publicationHoldReason'):holds.append(x['publicationHoldReason'])
  if x.get('integrationHold'):holds.append(str(x['integrationHold']))
  if x.get('integrationDisposition','').lower().startswith('research-only'):holds.append('Research-only operator summary; individual units represented separately')
  own=[website,x.get('bookingUrl',''),x.get('operatorEvidenceUrl',''),*x.get('contactPagesChecked',[])]
  contact=x.get('rentalAddress') or x.get('contactAddress') or {};addr=ma.address_data({**x,'contactAddress':contact}, {'City':city})
  # Preserve distinct addresses and their roles even when the full rental address is withheld.
  addr['notes']='; '.join(v for v in [addr.get('notes',''),contact.get('notes','')] if v);addresses.append({'id':ident,**addr,'rentalAddress':x.get('rentalAddress'),'contactAddress':x.get('contactAddress')})
  links=x.get('platformLinks',{});entries=[]
  if isinstance(links,dict):
   for brand in ['airbnb','vrbo','booking']:
    for url in links.get(brand,[]):entries.append({'platform':brand,'url':url,'sourcePage':next(iter(links.get('sourceUrls',[])),website),'verifiedMatchingIdentity':True})
   link_status=links.get('status') or x.get('platformLinkStatus','Not checked');link_pages=links.get('sourceUrls') or x.get('openedUrls',[])
  else:entries=links;link_status=x.get('platformLinkStatus') or x.get('platformCheckStatus') or 'Not checked';link_pages=x.get('openedUrls',[])
  found,badges,link_evidence,link_sources=ma.platform_data({**x,'platformLinks':entries});platforms.append({'id':ident,'name':x['name'],'website':website,'platformLinks':badges,'evidence':link_evidence,'checkedPages':link_pages,'checkedOn':date,'status':link_status,'foundLinks':found})
  selected=[];seen=set()
  for photo in x.get('photos',[]):
   if photo.get('verifiedForProperty') is False:continue
   f=photo.get('path') or photo.get('file');file=ROOT/f;assert file.is_file(),f;sha=hashlib.sha256(file.read_bytes()).hexdigest();assert sha==(photo.get('publishedSha256') or photo.get('sha256')),f
   normalized={'id':ident,'file':f,'url':photo.get('sourceImageUrl') or photo.get('sourceUrl') or photo.get('url'),'sourcePage':photo['sourcePage'],'sha256':sha,'generated':photo.get('generated',False),'checkedOn':photo.get('checkedOn',date),'unitOrCampus':photo.get('scope') or photo.get('unitOrCampus') or x.get('photoScope',''),'originalSha256':photo.get('originalSha256'),'dimensions':photo.get('publishedDimensions') or photo.get('dimensions')}
   assert normalized['url'].startswith('http') and not normalized['generated'];photos.append(normalized)
   if sha not in seen:selected.append(normalized);seen.add(sha)
  classification=x.get('classification','Unknown');category='category' in classification.lower();record_type='Accommodation category' if category else 'Rental operator' if x.get('recordType','').lower()=='operator' else 'Property'
  label=x.get('requiredPublicPhotoLabel') or x.get('publicPhotoLabel') or ('Representative advertised category; unit assigned by operator' if category else '')
  publish=status in VERIFIED and len(selected)>=3 and description and not holds
  if len(selected)<4:gaps.append(f'Four authentic photos: {len(selected)} saved')
  gaps.extend(holds);required=[]
  if len(selected)<4:required.append('Four authentic property photos')
  if addr['street']=='Unknown' or addr['status']!='Published on official website' or any(t in addr['type'].lower() for t in ['office','mail','box','partial','withheld']):required.append('Official physical rental address, with correct role')
  if not description:required.append('Source-supported description')
  required.extend(holds)
  if status not in VERIFIED:required.append('Website eligibility verification')
  directory='Active' if publish else 'Approved; media/integration pending' if status in VERIFIED else 'Excluded' if status in {'Not eligible','Website unavailable'} else 'Held for verification'
  notes=x.get('eligibilityReason','')+' '+('; '.join(gaps));notes+=' Research eligibility only; no owner participation established.'
  row.update({'ID':ident,'Property / operator':x['name'],location:city,'Website URL':website,'Candidate category':classification,'Evidence status':status,'Discovery method':x.get('discoveryMethod','Opened regional worker evidence'),'Source URL':x.get('sourceUrl',''),'Notes':notes,'Research inputs':'Regional tourism, town, aggregator/platform and reverse-search passes; see discovery evidence','Sleeps / max guests':str(facts.get('guests','Unknown')),'Pets OK':facts.get('petsDetails',facts.get('pets','Unknown')),'Kids OK':facts.get('kidsDetails',facts.get('kids','Unknown')),'Published price':str(facts.get('priceFrom','Unknown')),'Price details':facts.get('priceDetails','Unknown'),'Property details source URL':'\n'.join(x.get('openedUrls',[])),'Property data verification':'Opened-source audit '+date+': '+x.get('eligibilityReason',''),'Description':description,'Description basis':'Source-based factual paraphrase','Description source URL':x.get('descriptionSource',website),'Description status':'Paraphrased from verified website' if status in VERIFIED else 'Source-supported lead; eligibility not approved','Cover image':selected[0]['file'] if selected else '','Property photo count':str(len(selected)),'Photo status':str(len(selected))+' authentic photos saved','Cover selection':selected[0]['unitOrCampus'] if selected else '','Street address':'' if addr['street']=='Unknown' else addr['street'],'City':addr['city'],'State':addr['state'],'ZIP code':'' if addr['postalCode']=='Unknown' else addr['postalCode'],'Full address':'' if addr['full']=='Unknown' else addr['full'],'Address type':addr['type'],'Address status':addr['status'],'Address source URL':addr['sourceUrl'],'Address checked on':date,'Address notes':addr['notes'],'Collection status':'Incomplete' if required else 'Complete','Missing required fields':'; '.join(required),'Airbnb URLs':'\n'.join(found.get('airbnb',[])),'Vrbo URLs':'\n'.join(found.get('vrbo',[])),'Booking.com URLs':'\n'.join(found.get('booking',[])),'Platform link source URLs':'\n'.join(link_sources),'Platform links checked on':date,'Platform link status':link_status,'Directory status':directory,'Directory review notes':notes})
  for i in range(3):row[f'Photo {i:03}']=selected[i+1]['file'] if len(selected)>i+1 else ''
  rows.append(row);website_audit.append({**x,'reviewed':True,'publicationReady':bool(publish),'publicationHolds':holds});
  if x.get('policyAudit'):policy.append(x['policyAudit'])
  if not publish:continue
  typ=x.get('type','Unknown');typ='Apartment' if typ.lower().startswith('apartment') else typ if typ in ['House','Cabin','Camp'] else 'Unknown'
  h={'id':ident,'name':x['name'],'url':website,'town':city,'state':a.state,'place':city+', '+a.state,'type':typ,'recordType':record_type,'description':description,'descriptionSource':x.get('descriptionSource',website),'descriptionStatus':row['Description status'],'capacityDetails':facts.get('capacityDetails','Unknown'),'priceDetails':facts.get('priceDetails','Unknown'),'kidsDetails':facts.get('kidsDetails','Unknown'),'petsDetails':facts.get('petsDetails','Unknown'),'photo':selected[0]['file'],'coverPhoto':selected[0]['file'],'photos':[{'file':z['file'],'role':'cover' if i==0 else 'photo'} for i,z in enumerate(selected)],'logo':'Unknown','photoStatus':row['Photo status'],'address':addr,'rentalAddress':x.get('rentalAddress'),'contactAddress':x.get('contactAddress'),'sourceDetails':row,'contactPagesChecked':x['contactPagesChecked'],'bookingMethod':x.get('bookingMethod',''),'bookingUrl':x['bookingUrl'],'operatorEvidenceUrl':x['operatorEvidenceUrl'],'cardDescription':description,'cardDescriptionSource':x.get('descriptionSource',website),'cardPhotos':[z['file'] for z in selected[:3]],'cardPhotoLabel':label,'platformLinks':badges,'collectionStatus':row['Collection status'],'missingRequiredFields':required,'researchGaps':gaps,'listingStatus':'Active','checked':date,'alive':True,'demo':False,'featured':False}
  for field in ['rooms','bedrooms','bathrooms','guests','kids','pets','priceFrom','currency']:h[field]=facts.get(field,'Unknown')
  loc_entry=locations.get(ident,{})
  loc=loc_entry.get('locationCoordinates',loc_entry) or {}
  if isinstance(loc.get('lat'),(int,float)) and isinstance(loc.get('lng'),(int,float)) and loc.get('sourceUrl'):
   h.update({'lat':loc['lat'],'lng':loc['lng'],'locationPrecision':loc.get('precision','Own-published approximate property area'),'locationSource':loc['sourceUrl'],'locationEvidence':loc_entry,'locationLabel':'Approx. area' if loc.get('precision')=='neighborhood' else 'Building location','suppressTownGeocoding':True})
  else:h.update({'lat':'Unknown','lng':'Unknown','locationPrecision':'Property location not yet verified; available in Cards','locationSource':'Unknown','locationLabel':'Location unverified','suppressTownGeocoding':True})
  imports.append(h)
 for name,data in [('research-records.json',rows),('website-audit.json',website_audit),('approved-import.json',imports),('photo-sources.json',photos),('address-sources.json',addresses),('platform-links.json',platforms),('publication-policy-audit.json',policy)]:save(dest/name,data)
 for name in ['descriptions.json','photo-selections.json']:
  file=ROOT/'data/sources/cards'/name;v=read(file)
  for h in imports:v[h['id']]={'description':h['cardDescription'],'sourceUrl':h['cardDescriptionSource'],'checkedOn':h['checked'],'status':'Factual summary of opened official website'} if name=='descriptions.json' else {'files':h['cardPhotos'],'label':h['cardPhotoLabel']}
  save(file,v)
 file=ROOT/'data/sources/cards/platform-links.json';v={x['id']:x for x in read(file)}
 for x in platforms:
  if x['id'] in {h['id'] for h in imports}:v[x['id']]=x
 save(file,list(v.values()));save(dest/'publication-progress.json',{'snapshot':a.snapshot,'reviewed':len(rows),'eligible':sum(x['Evidence status'] in VERIFIED for x in rows),'ready':len(imports),'pendingIds':[x['id'] for x in website_audit if not x['publicationReady']],'status':'Prepared locally; not yet deployed'})
 print(json.dumps({'region':a.region,'reviewed':len(rows),'ready':len(imports),'statuses':dict(collections.Counter(x['Evidence status'] for x in rows))}))
if __name__=='__main__':main()
