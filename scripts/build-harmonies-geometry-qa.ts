import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
const dir='data/qa-harmonies-cards-v5',ids=['animal-01','animal-02','animal-03','animal-04','animal-05'];
async function row(files:string[],out:string,w=240,h=370){const images=await Promise.all(files.map(f=>sharp(f).resize(w,h,{fit:'contain',background:'#20372f'}).png().toBuffer()));await sharp({create:{width:w*files.length,height:h,channels:4,background:'#20372f'}}).composite(images.map((input,i)=>({input,left:i*w,top:0}))).png().toFile(`${dir}/${out}`);}
await row(ids.map(id=>`${dir}/screens/debug-${id}.png`),'debug-five.png');
await row(ids.map(id=>`${dir}/screens/small-${id}.png`),'batch-five-comparison.png',300,497);
const reference='/var/folders/47/86r1t3_d19z20h482pkxw6dw0000gn/T/codex-clipboard-17b52836-116a-4bad-9ce5-4ea8b664fcea.png';
await sharp({create:{width:1500,height:994,channels:4,background:'#20372f'}}).composite([{input:await sharp(reference).resize(1500,497,{fit:'contain'}).toBuffer(),top:0,left:0},{input:await sharp(`${dir}/batch-five-comparison.png`).toBuffer(),top:497,left:0}]).png().toFile(`${dir}/reference-comparison.png`);
const uri=async(path:string)=>`data:image/png;base64,${(await readFile(path)).toString('base64')}`;
const token=await uri('public/art/harmonies/tokens-v5/water.png');
const labels=['Gold / normal','Amethyst / Spirit','Opal / T-Rex'];
const crystals=await Promise.all(['animal-gold','spirit-purple','dinosaur-white'].map(n=>uri(`public/art/harmonies/tokens-v5/crystal-${n}.webp`)));
let panels='';for(let i=0;i<3;i++)panels+=`<g transform="translate(${i*240} 0)"><text x="120" y="28" text-anchor="middle" fill="#fff4d7" font-family="sans-serif">${labels[i]}</text><image href="${token}" x="40" y="100" width="160" height="140"/><image href="${crystals[i]}" x="82" y="65" width="77" height="86"/></g>`;
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="260"><rect width="720" height="260" fill="#20372f"/>${panels}</svg>`)).png().toFile(`${dir}/crystal-comparison.png`);
let stacks='';for(let n=1;n<=3;n++){stacks+=`<g transform="translate(${(n-1)*240} 0)"><text x="120" y="28" text-anchor="middle" fill="#fff4d7" font-family="sans-serif">${n} layer${n>1?'s':''}</text><polygon points="22,210 71,168 169,168 218,210 169,252 71,252" fill="#f5e9c9"/>`;for(let i=0;i<n;i++)stacks+=`<image href="${token}" x="12" y="${120-i*51}" width="216" height="192"/>`;stacks+='</g>';}
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="320"><rect width="720" height="320" fill="#20372f"/>${stacks}</svg>`)).png().toFile(`${dir}/stack-comparison.png`);
await row([`${dir}/screens/docker-image-tokens-illustrated.png`,`${dir}/screens/small-animal-01.png`,`${dir}/screens/popup-animal-01.png`],'shared-token-views.png',300,500);
const files=['shared-token-views.png','assembled-small-cards.png','assembled-popup-cards.png','debug-five.png','reference-comparison.png','crystal-comparison.png','stack-comparison.png','screens/docker-image-tokens-illustrated.png'];
await writeFile(`${dir}/geometry-review.html`,`<!doctype html><html lang="th"><meta charset="utf-8"><title>Harmonies — Geometry review</title><style>body{background:#20372f;color:#fff4d7;font:18px sans-serif;margin:32px}img{display:block;max-width:100%;margin:16px 0 48px}a{color:#b7edf0}</style><h1>Harmonies — ตรวจการ์ด 9 ใบ</h1><p>พิกัด catalog เดิม • flat-top 66×56 • STEP_X 49.5 • STEP_Y 56 • คะแนนสูงอยู่บนทั้งสองขนาด</p>${files.map(f=>`<h2>${f}</h2><a href="${f}"><img src="${f}"></a>`).join('')}</html>`);
console.log('Geometry review sheets ready');
