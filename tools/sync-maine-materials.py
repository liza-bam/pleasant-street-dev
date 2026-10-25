#!/usr/bin/env python3
"""Update collected material only, preserving app fields and address-level pins.

Run prepare-maine.py first. The general importer also assigns town coordinates;
this refresh deliberately reuses its picture function without resetting pins.
"""
import importlib.util,json,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('catalog_import',ROOT/'tools/import.py')
imp=importlib.util.module_from_spec(spec);spec.loader.exec_module(imp)
db=ROOT/'data/homes.json';homes=json.loads(db.read_text())
sources=json.loads((ROOT/'data/sources/maine/catalog.json').read_text())
by_id={h['id']:h for h in homes}
fields=['description','descriptionSource','descriptionStatus','collectionStatus','missingRequiredFields',
        'coverPhoto','photos','logo','photoStatus','address','sourceDetails']
changed=[]
for row in sources:
    h=by_id[row['id']];before=json.loads(json.dumps(h))
    old_cover=h.get('coverPhoto')
    for field in fields:h[field]=row[field]
    if row['coverPhoto']!='Unknown':
        if old_cover!=row['coverPhoto'] or h.get('photo') in (None,'','Unknown'):
            h['photo']=imp.save_picture(row['coverPhoto'],row['id']+'-card')
        else:
            # The path can stay the same while a newly reviewed cover replaces it.
            imp.save_picture(row['coverPhoto'],row['id']+'-card')
    else:h['photo']='Unknown'
    for field,value in before.items():
        if field not in fields+['photo']:assert h[field]==value,(row['id'],field,'Unrelated app field changed')
    if h!=before:changed.append(row['id'])
db.write_text(json.dumps(homes,ensure_ascii=False,indent=1)+'\n')
print(json.dumps({'records':len(homes),'materialUpdates':len(changed),'appFieldsAndPins':'preserved','ids':changed}))
