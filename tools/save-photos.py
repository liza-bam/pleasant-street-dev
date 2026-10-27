#!/usr/bin/env python3
"""Save a home's photo set from its own page: images/<ID>-cover.webp, -000, -001, -002 (long edge ≤ 1600 px).

Usage: python3 tools/save-photos.py <ID> <source page URL> <image URL> [<image URL> ...]
Prints one JSON line with the saved files, their sizes and sha256 hashes; images narrower than 600 px are skipped.
"""
import hashlib, io, json, ssl, sys, urllib.request
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
ctx = ssl.create_default_context()

def fetch(u):
    return urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': UA, 'Referer': page}), timeout=30, context=ctx).read()

home, page, urls = sys.argv[1], sys.argv[2], sys.argv[3:]
roles = ['cover', '000', '001', '002']
saved = []
for u in urls:
    if len(saved) == len(roles): break
    try:
        raw = fetch(u); im = Image.open(io.BytesIO(raw)).convert('RGB')
    except Exception as e:
        saved.append({'url': u, 'error': str(e)[:80]}); continue
    if im.width < 600: continue
    im.thumbnail((1600, 1600), Image.LANCZOS)
    role = roles[len([s for s in saved if 'file' in s])]
    out = ROOT / 'images' / f'{home}-{role}.webp'
    im.save(out, 'WEBP', quality=82, method=6)
    saved.append({'url': u, 'file': f'images/{home}-{role}.webp', 'role': 'cover' if role == 'cover' else 'photo', 'width': im.width, 'height': im.height,
                  'originalSha256': hashlib.sha256(raw).hexdigest(), 'publishedSha256': hashlib.sha256(out.read_bytes()).hexdigest(), 'sourcePage': page})
print(json.dumps({'id': home, 'saved': saved}, ensure_ascii=False))
