import sharp from 'sharp';
import {writeFile,readFile,mkdir} from 'node:fs/promises';
const dir='public/art/harmonies/baked-cards-v1',src='assets/source/harmonies/baked-cards-v1',qa='data/qa-harmonies-baked-v1';
await mkdir(qa,{recursive:true});
const files=[];
for(const small of [false,true]){
 const name=small?'spirit-11-small-r2':'spirit-11-large-r2',source=`${src}/${small?'spirit-11-small-r2-final':'spirit-11-large-r2-final'}.png`,w=small?300:900,h=small?430:1290;
 const mask=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${w*.035}" fill="white"/></svg>`);
 const image=await sharp(source).resize(w,h,{fit:'fill'}).ensureAlpha().png().toBuffer();
 await sharp(image).composite([{input:mask,blend:'dest-in'}]).webp({quality:small?76:86,alphaQuality:100}).toFile(`${dir}/${name}.webp`);
 const meta=await sharp(`${dir}/${name}.webp`).metadata();
 const stat=(await import('node:fs/promises')).stat;files.push({file:`${dir}/${name}.webp`,width:meta.width,height:meta.height,alpha:meta.hasAlpha,bytes:(await stat(`${dir}/${name}.webp`)).size});
}
const labels=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="660" height="490"><text x="170" y="27" text-anchor="middle" fill="#fff3d4" font-family="sans-serif" font-size="17">Large — 900×1290</text><text x="490" y="27" text-anchor="middle" fill="#fff3d4" font-family="sans-serif" font-size="17">Small — 300×430</text></svg>');
await sharp({create:{width:660,height:490,channels:4,background:'#193b34'}}).composite([{input:await sharp(`${dir}/spirit-11-large-r2.webp`).resize(300,430).toBuffer(),left:20,top:45},{input:await readFile(`${dir}/spirit-11-small-r2.webp`),left:340,top:45},{input:labels,left:0,top:0}]).png().toFile(`${qa}/trex-r2-pair.png`);
await writeFile(`${qa}/review.html`,`<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>ทีเร็กซ์ Large / Small</title><style>body{margin:24px;background:#193b34;color:#fff3d4;font:18px sans-serif}section{display:flex;gap:24px;flex-wrap:wrap}img{display:block;width:300px;height:430px;object-fit:contain}a{color:#fff3d4}</style><h1>ทีเร็กซ์ — ตัวอย่างรอบ 2</h1><p>ฐานบางแยกช่อง • กองหิน 3 ชั้น • กองต้นไม้ 3 ชั้น • คริสตัลกลางโทเคน • แถบเหลืองลายดอกไม้</p><section><div><h2>Large</h2><a href="../../${dir}/spirit-11-large-r2.webp"><img src="../../${dir}/spirit-11-large-r2.webp"></a></div><div><h2>Small (ขนาดจริง 300×430)</h2><a href="../../${dir}/spirit-11-small-r2.webp"><img src="../../${dir}/spirit-11-small-r2.webp"></a></div></section></html>`);
await writeFile(`${src}/trex-r2-exports.json`,JSON.stringify({scope:['spirit-11'],method:'built-in image_gen, independent Large and Small generation; WebP encoding and rounded alpha clip only',files},null,2));
console.log(files);
