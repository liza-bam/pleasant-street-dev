#!/usr/bin/env python3
"""Publish bounded web images; preserve local source originals and their hashes.

Run after preparing/importing a local package and before final hash checks.
Only newly collected individual rentals and separate research leads are resized.
Existing images, card crops, app code and map coordinates are not changed.
"""
import concurrent.futures as cf,hashlib,io,json,pathlib
from PIL import Image,ImageOps
ROOT=pathlib.Path(__file__).resolve().parents[1];SOURCE=ROOT/'data/sources/maine'
manifest=SOURCE/'web-image-derivatives.json'
old=json.loads(manifest.read_text()) if manifest.exists() else {}
paths=[p for p in (ROOT/'images').glob('ME-*') if p.name[3:7].isdigit() and int(p.name[3:7])>=293 and '-card.' not in p.name and '-logo.' not in p.name]
def resize(path):
    raw=path.read_bytes();before=hashlib.sha256(raw).hexdigest()
    with Image.open(io.BytesIO(raw)) as img:
        img=ImageOps.exif_transpose(img);w,h=img.size
        if len(raw)<=400_000 and max(w,h)<=1800:return None
        img.thumbnail((1600,1600),Image.Resampling.LANCZOS)
        buf=io.BytesIO();ext=path.suffix.lower()
        if ext in ['.jpg','.jpeg']:img.convert('RGB').save(buf,'JPEG',quality=84,optimize=True,progressive=True)
        elif ext=='.webp':img.save(buf,'WEBP',quality=84,method=4)
        elif ext=='.png':img.save(buf,'PNG',optimize=True)
        elif ext=='.avif':img.save(buf,'AVIF',quality=80)
        else:return None
        result=buf.getvalue()
        if len(result)>=len(raw):return None
        path.write_bytes(result)
        return path.name,{'file':'images/'+path.name,'originalSha256':old.get(path.name,{}).get('originalSha256',before),'sha256':hashlib.sha256(result).hexdigest(),'originalWidth':old.get(path.name,{}).get('originalWidth',w),'originalHeight':old.get(path.name,{}).get('originalHeight',h),'width':img.width,'height':img.height,'originalBytes':old.get(path.name,{}).get('originalBytes',len(raw)),'publishedBytes':len(result),'method':'Proportional fit within 1600px; no crop or generated content'}
before=sum(p.stat().st_size for p in paths)
with cf.ThreadPoolExecutor(max_workers=4) as e:
    for value in e.map(resize,paths):
        if value:old[value[0]]=value[1]
def update_photo(p):
    value=old.get(pathlib.Path(p.get('file','')).name)
    if value:
        for k in ['originalSha256','originalWidth','originalHeight','sha256','width','height']:p[k]=value[k]
for name in ['catalog.json','operator-catalog.json','photo-sources.json','aggregator-research.json']:
    target=SOURCE/name;records=json.loads(target.read_text())
    for record in records:
        for p in record.get('photos',[]):update_photo(p)
    target.write_text(json.dumps(records,ensure_ascii=False,indent=1)+'\n')
target=ROOT/'data/homes.json';records=json.loads(target.read_text())
for record in records:
    for p in record.get('photos',[]):update_photo(p)
target.write_text(json.dumps(records,ensure_ascii=False,indent=1)+'\n')
manifest.write_text(json.dumps(old,indent=1)+'\n')
after=sum(p.stat().st_size for p in paths)
print(json.dumps({'sourceImageFiles':len(paths),'webCopiesResized':len(old),'beforeMB':round(before/1e6,1),'afterMB':round(after/1e6,1),'localOriginals':'retained in offline research cache'}))
