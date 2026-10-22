import sharp from 'sharp';
import {mkdir,readFile,writeFile,stat} from 'node:fs/promises';
const ids=['spirit-11','spirit-09','animal-01','whisper-05'];
const source='assets/source/harmonies/baked-cards-v1/revision-3',out='public/art/harmonies/baked-cards-v1/revision-3',qa='data/qa-harmonies-baked-v1/revision-3';
await Promise.all([source,out,qa].map(d=>mkdir(d,{recursive:true})));
const files=[],composite=[],labels=[];
for(const [i,id]of ids.entries())for(const [j,size]of ['large','small'].entries()){
 const w=j?300:900,h=j?430:1290,filename=`${id}${j?'-small':''}.webp`;
 const input=await sharp(`${source}/${id}-${size}.png`).resize(w,h,{fit:'fill'}).ensureAlpha().png().toBuffer();
 const mask=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${w*.035}" fill="white"/></svg>`);
 await sharp(input).composite([{input:mask,blend:'dest-in'}]).webp({quality:j?77:86,alphaQuality:100}).toFile(`${out}/${filename}`);
 const {data,info}=await sharp(`${out}/${filename}`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(info.width*430!==info.height*300)throw Error('Ratio');
 for(const [x,y]of [[0,0],[w-1,0],[0,h-1],[w-1,h-1]])if(data[(y*w+x)*4+3]!==0)throw Error('Corner alpha');
 files.push({id,size,path:`${out}/${filename}`,width:w,height:h,bytes:(await stat(`${out}/${filename}`)).size});
 composite.push({input:await sharp(`${out}/${filename}`).resize(300,430).png().toBuffer(),left:20+i*320,top:45+j*480});
 labels.push(`<text x="${170+i*320}" y="${28+j*480}" text-anchor="middle" fill="#fff1cf" font-family="sans-serif" font-size="17">${id} · ${size}</text>`);
}
composite.push({input:Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1300" height="980">${labels.join('')}</svg>`),left:0,top:0});
await sharp({create:{width:1300,height:980,channels:4,background:'#193b34'}}).composite(composite).png().toFile(`${qa}/four-card-pairs.png`);
await writeFile(`${source}/exports.json`,JSON.stringify({scope:ids,method:'built-in image_gen; separate compositions; WebP export and rounded alpha clipping',files},null,2));
const names={'spirit-11':'ทีเร็กซ์','spirit-09':'แมลงปอสายน้ำ','animal-01':'จระเข้','whisper-05':'เห็ดริมน้ำ'};
await writeFile(`${qa}/review.html`,`<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Harmonies original token review</title><style>body{margin:24px;background:#193b34;color:#fff1cf;font:18px sans-serif}section{display:flex;gap:20px;flex-wrap:wrap;margin-bottom:32px}img{display:block;width:300px;height:430px;object-fit:contain}a{color:inherit}h2{font-size:22px}</style><h1>ตัวอย่างการ์ด 4 ประเภท — โทเคนแบบต้นฉบับ</h1><p>Large: คะแนนด้านบน · Small: คะแนนด้านล่าง ไม่มีลายขอบล่าง และตัวคูณใหญ่ขึ้น</p>${ids.map(id=>`<h2>${names[id]}</h2><section>${['large','small'].map(size=>{const file=`${id}${size==='small'?'-small':''}.webp`;return `<div><p>${size}</p><a href="../../../${out}/${file}"><img src="../../../${out}/${file}"></a></div>`}).join('')}</section>`).join('')}</html>`);
console.log(JSON.stringify(files,null,2));
