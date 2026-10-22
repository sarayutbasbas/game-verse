"""Extract user-provided art without generative changes or upscaling.
Run with a Python environment containing PyMuPDF.
"""
import fitz, json, hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[1]
source=root/'assets/source/harmonies/original-v1';out=root/'public/art/harmonies/original-v1'
source.mkdir(parents=True,exist_ok=True);out.mkdir(parents=True,exist_ok=True)
files={n:Path.home()/'Downloads'/f'{n}.pdf' for n in ['bgg387027','bgg454647','bgg440017']}
docs={n:fitz.open(p) for n,p in files.items()}
# Group xrefs in Melodies contain three front faces, left to right.
groups={35:['animal-25','animal-19',None],36:['animal-27','animal-06','animal-10'],37:['animal-18','animal-32',None],38:['animal-28','animal-22','animal-11'],42:[None,'animal-16','animal-05'],43:[None,'animal-24','animal-14'],44:[None,'animal-30','animal-07'],45:[None,'animal-12','animal-17'],46:[None,'animal-15','animal-04'],50:[None,'animal-23','animal-26'],51:[None,'animal-13','animal-31'],52:[None,'animal-01','animal-20'],53:[None,'animal-02','animal-21'],54:['animal-29','animal-09','animal-08']}
manifest={"method":"Direct lossless extraction/cropping; no generation, retouching or upscaling. The same image is used at every card size.","sources":[{"file":p.name,"sha256":hashlib.sha256(p.read_bytes()).hexdigest()}for p in files.values()],"cards":[]}
def export(id,pdf,xref,col=None,flip_y=False):
 im=docs[pdf].extract_image(xref);raw=im['image'];(source/f'{pdf}-{xref}.{im["ext"]}').write_bytes(raw)
 px=fitz.Pixmap(raw);crop=None
 if col is not None:
  x1=round(col*px.width/3);x2=round((col+1)*px.width/3);crop=[x1,0,x2,px.height]
  # MuPDF page clipping preserves every source pixel and correctly translates the crop.
  d=fitz.open();p=d.new_page(width=px.width,height=px.height);p.insert_image(p.rect,stream=raw);px=p.get_pixmap(clip=fitz.Rect(*crop),alpha=False)
 if flip_y:
  # This PDF places its embedded JPEGs using a negative Y scale (not a 180-degree rotation).
  rows=px.samples;stride=px.stride;rows=b''.join(rows[y*stride:(y+1)*stride]for y in range(px.height-1,-1,-1));px=fitz.Pixmap(px.colorspace,px.width,px.height,rows,px.alpha)
 dest=out/f'{id}.png';px.save(dest)
 pages=[i+1 for i,p in enumerate(docs[pdf]) if p.get_image_rects(xref)]
 manifest['cards'].append(dict(id=id,source=files[pdf].name,xref=xref,pages=pages,crop=crop,verticalFlip=flip_y,width=px.width,height=px.height,asset=f'/art/harmonies/original-v1/{id}.png'))
for xref,ids in groups.items():
 for col,id in enumerate(ids):
  if id and id!='animal-23':export(id,'bgg387027',xref,col)
# These two matching live cards have higher-resolution standalone art.
export('animal-03','bgg454647',26);export('animal-23','bgg454647',7)
for n,xref in enumerate([32,33,19,20,36,34,17,18,35,21],1):export(f'spirit-{n:02}','bgg440017',xref,flip_y=True)
photo=Path.home()/'Downloads/pic8162737.jpg';(source/photo.name).write_bytes(photo.read_bytes());px=fitz.Pixmap(photo.read_bytes());px.save(out/'spirit-11.png');manifest['cards'].append(dict(id='spirit-11',source=photo.name,width=px.width,height=px.height,asset='/art/harmonies/original-v1/spirit-11.png'))
(root/'docs/games/harmonies/original-art-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(root/'src/client/harmonies-original-reference-art.json').write_text(json.dumps({c['id']:{k:c[k]for k in ['asset','width','height']}for c in manifest['cards']},indent=2)+'\n')
print(f"Extracted {len(manifest['cards'])} native-resolution cards")
