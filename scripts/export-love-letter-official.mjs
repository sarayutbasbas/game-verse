// Document/product illustration extraction; no AI redraw or invented missing portraits.
import fs from 'node:fs/promises';
import sharp from 'sharp';
const folder='data/infinity-gauntlet/',out='public/art/love-letter/';
const crops=[
 ['h-scarletwitch',2,160,245,160,235],['h-thor',2,426,294,110,235],['h-ironman',2,630,207,160,260],['h-spiderman',2,850,325,220,220],
 ['t-thanos',4,370,233,260,355],['t-outrider',4,650,175,225,365],
 ['t-soul',5,360,173,170,65],['t-space',5,810,170,80,180],['t-power',5,540,330,190,220],
 ['h-hulk',6,330,285,160,210],['h-blackpanther',6,620,180,260,280],
 ['h-vision',7,320,370,190,240],['h-gamora',8,310,313,170,265],
 ['t-ebonymaw',9,330,450,90,190],['t-corvus',9,525,440,145,220],['t-proxima',9,760,450,160,250],['t-blackdwarf',9,400,160,160,200],
 ['t-reality',1,480,190,150,230],
];
const records=[];
for(const[id,file,left,top,width,height]of crops){await sharp(folder+`component-${file}.webp`).extract({left,top,width,height}).resize(700,1000,{fit:'cover',position:'top'}).webp({quality:90}).toFile(out+id+'.webp');records.push({id,source:`https://cdn.svc.asmodee.net/production-zman/uploads/image-converter/2024/08/IG_Component-${file}.webp`,crop:{left,top,width,height},output:out+id+'.webp'});}
await sharp(folder+'page-1.png').extract({left:485,top:421,width:140,height:180}).resize(700,1000,{fit:'cover'}).webp({quality:90}).toFile(out+'h-captainmarvel.webp');
records.push({id:'h-captainmarvel',source:'https://cdn.svc.asmodee.net/production-zman/uploads/2024/09/Infinity-Gauntlet-Rulebook.pdf',page:2,crop:{left:485,top:421,width:140,height:180},output:out+'h-captainmarvel.webp'});
await sharp(folder+'prev1.png').resize(700,1000,{fit:'cover'}).webp({quality:90}).toFile(out+'back-hero.webp');
await sharp(folder+'prev2.png').resize(700,1000,{fit:'cover'}).webp({quality:90}).toFile(out+'back-thanos.webp');
records.push(...[1,2].map((i)=>({id:i===1?'back-hero':'back-thanos',source:`https://cdn.svc.asmodee.net/production-zman/uploads/2024/09/mz01en_prev${i}_sq.png`,output:out+(i===1?'back-hero':'back-thanos')+'.webp'})));
await fs.writeFile('docs/games/love-letter/official-art.json',JSON.stringify({copyright:'Marvel © 2020; Z-Man Games / Asmodee. Official preview and rulebook illustrations, used as requested reference assets. Not newly generated art.',availablePortraits:records.filter(r=>!r.id.startsWith('back')).map(r=>r.id),missingPortraits:['h-nebula','h-starlord','h-blackwidow','h-antman-wasp','h-captainamerica','h-falcon','h-doctorstrange','t-mind','t-time'],records},null,2)+'\n');
