"""Deterministic layout/encoding of the shipped original generated PNGs.
Requires Pillow only when rebuilding artwork, never at application runtime.
"""
from pathlib import Path
import json
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = root / 'assets/source/presentation'
art = root / 'public/art'
assets = {
    'camel-cover': ('covers/camel-up.webp', (640, 960)),
    'dracula-cover': ('covers/dracula.webp', (640, 960)),
    'roles': ('dracula/roles.webp', (1280, 960)),
    'city': ('dracula/city.webp', (1536, 1024)),
    'card-back': ('dracula/card-back.webp', (400, 600)),
    'markers': ('dracula/markers.webp', (900, 900)),
    'card-portraits': ('dracula/card-portraits.webp', (1020, 680)),
}
manifest = {'tool': 'built-in image_gen', 'generated': '2026-10-14', 'assets': []}
for name, (output, bounds) in assets.items():
    im = Image.open(source / f'{name}.png')
    original_size = im.size
    if name == 'markers':
        edge = max(im.size)
        padded = Image.new('RGBA', (edge, edge), (0, 0, 0, 0))
        padded.paste(im, ((edge-im.width)//2, (edge-im.height)//2))
        im = padded
    elif name == 'card-portraits':
        sheet = Image.new('RGB', bounds)
        for i in range(8):
            x = round((i % 4)*im.width/4)+8
            y = round((i // 4)*im.height/2)+90
            tile = im.crop((x, y, x+255, y+340))
            sheet.paste(tile, ((i % 4)*255, (i // 4)*340))
        im = sheet
    im.thumbnail(bounds)
    dest = art / output
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, 'WEBP', quality=90 if name in ('markers', 'card-portraits') else 87, method=6)
    manifest['assets'].append({'id': name, 'source': f'assets/source/presentation/{name}.png', 'url': f'/art/{output}', 'sourceSize': original_size, 'size': im.size, 'alpha': im.mode == 'RGBA', 'bytes': dest.stat().st_size})
(art/'presentation-manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
print('Prepared', len(assets), 'assets;', sum(a['bytes'] for a in manifest['assets']), 'runtime bytes')
