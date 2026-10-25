// Verify the imported catalog, assets and the app's unknown/conditional filters without a browser.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const homes=read('data/homes.json'),source=read('data/sources/maine/catalog.json');
const street=read('street.json'),index=read('index.json');
assert.equal(source.length,292);
assert.equal(homes.length,307);
assert.equal(new Set(homes.map(h=>h.id)).size,307);
const key=url=>new URL(url).host.replace(/^www\./,'')+new URL(url).pathname.replace(/\/$/,'');
assert.equal(new Set(homes.map(h=>key(h.url))).size,307);
const original=read('data/sources/lazy.json');
for(const h of original)assert(homes.some(x=>key(x.url)===key(h.url)),'Existing entry lost: '+h.name);
for(const s of source){
 const h=homes.find(x=>x.id===s.id);assert(h,'Missing '+s.id);
 for(const field of ['name','url','description','descriptionSource','descriptionStatus','collectionStatus','missingRequiredFields','rooms','bedrooms','bathrooms','guests','kids','pets','capacityDetails','priceDetails','address','photos','logo','sourceDetails','listingStatus'])assert.deepEqual(h[field],s[field],s.id+' '+field);
 if(h.collectionStatus==='Complete'){
  assert.equal(h.photos.length,4);assert.equal(h.descriptionStatus,'Collected from source website');
  assert.equal(h.missingRequiredFields.length,0);assert.notEqual(h.address.full,'Unknown');assert.match(h.descriptionSource,/^https?:\/\//);
 }
 for(const field of ['rooms','bedrooms','bathrooms','guests','kids','pets','type','description'])assert(h[field]!=='' && h[field]!=null,h.id+' empty '+field);
 for(const field of ['kids','pets'])assert(['Yes','No','Conditional','Unknown'].includes(h[field]));
}
const active=homes.filter(h=>h.alive!==false && h.listingStatus!=='Needs review');
assert.deepEqual(street.map(h=>h.id),active.filter(h=>typeof h.lat==='number' && typeof h.lng==='number').map(h=>h.id));
assert.deepEqual(index.map(h=>h.id),active.map(h=>h.id));
assert(!street.some(h=>h.id==='ME-0066'),'Wrong-country website must stay out of public recommendations');
let media=0,photos=0,logos=0;
for(const h of homes){
 const files=[h.photo,h.coverPhoto,h.logo,...(h.photos||[]).map(p=>p.file)].filter(f=>f && f!=='Unknown');
 for(const f of files)assert(fs.existsSync(path.join(root,f)),h.id+' missing '+f);
}
for(const record of read('data/sources/maine/photo-sources.json')){
 for(const p of [...record.photos,...(record.logo?[record.logo]:[])]){
  const file=path.join(root,'images',path.basename(p.file));
  assert(fs.existsSync(file),file);
  if(p.sha256)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),p.sha256,file);
  media++;p.role?photos++:logos++;
 }
}
assert.equal(photos,source.reduce((n,h)=>n+h.photos.length,0));
assert.equal(logos,source.filter(h=>h.logo && h.logo!=='Unknown').length);
assert.equal(media,photos+logos);
for(const h of homes.filter(h=>h.id.startsWith('ME-') && typeof h.lat==='number')){
 assert(h.lat>42.9 && h.lat<47.6 && h.lng>-71.2 && h.lng<-66.8,h.id+' coordinates outside Maine');
}
const demos=read('data/sources/demos/catalog.json');assert.equal(demos.length,15);
for(const s of demos){
 const h=homes.find(h=>h.id===s.id);assert(h);
 for(const k of ['name','url','place','bedrooms','bathrooms','guests','kids','pets','description','syncStatus','demo'])assert.deepEqual(h[k],s[k],s.id+' '+k);
 assert.equal(h.demo,true);assert.equal(h.recordType,'Demo property');
}
for(const h of street){
 assert(Number.isFinite(h.lat) && Number.isFinite(h.lng));
 for(const k of ['kids','pets','type','guests'])assert(!['Unknown','Conditional'].includes(h[k]),'Legacy adapter leaked unsupported '+k);
 assert(fs.existsSync(path.join(root,h.photo)),h.id+' card image missing');
 const db=homes.find(x=>x.id===h.id);
 for(const k of ['kids','pets'])if(db[k]==='No')assert.equal(h[k],'No','Confirmed No was lost');
}
execFileSync('python3',['-c',`import importlib.util
s=importlib.util.spec_from_file_location('i','tools/import.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
h={'appOwnedField':{'keep':True},'rooms':7,'kids':'No'}
m.merge_fields(h,{'name':'New name','rooms':'Unknown','kids':'Unknown','newSchemaField':42})
assert h['appOwnedField']=={'keep':True} and h['rooms']==7 and h['kids']=='No' and h['newSchemaField']==42
`],{cwd:root});
console.log(JSON.stringify({records:homes.length,imported:source.length,demosSynced:demos.length,mappedListings:street.length,photos,logos,mediaHashes:'passed',unknownHandling:'passed',schemaFieldPreservation:'passed'},null,2));
