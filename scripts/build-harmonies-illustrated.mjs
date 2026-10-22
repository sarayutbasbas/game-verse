import sharp from 'sharp';
import {readFile,mkdir} from 'node:fs/promises';
const manifest=JSON.parse(await readFile('docs/games/harmonies/illustrated-v1-art-jobs.json','utf8'));
const out='public/art/harmonies/illustrated-v1';
await mkdir(out,{recursive:true});
for(const job of manifest.jobs){
 if(!job.path)throw Error(`Missing generated source: ${job.id}`);
 if(/^(animal|spirit|whisper)-/.test(job.id)){
  for(const [suffix,w,h] of [['',720,1040],['-small',240,347],['-lite',120,173]])await sharp(job.path).resize(w,h,{fit:'cover'}).webp({quality:suffix==='-lite'?70:85}).toFile(`${out}/${job.id}${suffix}.webp`);
 }else if(job.id==='back')await sharp(job.path).resize(720,1040,{fit:'cover'}).webp({quality:85}).toFile(`${out}/back.webp`);
 else if(job.id==='background')await sharp(job.path).resize(1920,1080,{fit:'cover'}).webp({quality:84}).toFile(`${out}/background.webp`);
 else {
  if(!(await sharp(job.path).metadata()).hasAlpha)throw Error(`${job.id} must have alpha`);
  await sharp(job.path).trim({threshold:8}).resize(job.id==='logo'?600:256,job.id==='logo'?200:256,{fit:'contain',background:'#00000000'}).webp({quality:88,alphaQuality:100}).toFile(`${out}/${job.id}.webp`);
 }
}
// A labelled contact sheet for visual QA; not served to players.
await mkdir('data/hm-flat-review',{recursive:true});
for(const kind of ['animal','spirit','whisper']){
 const jobs=manifest.jobs.filter(j=>j.id.startsWith(kind+'-')),width=720,cellW=120,cellH=196;
 const cells=await Promise.all(jobs.map(async(j,i)=>({input:await sharp(`${out}/${j.id}-small.webp`).resize(120,174).extend({bottom:22,top:0,left:0,right:0,background:'#fff4d5'}).composite([{input:Buffer.from(`<svg width="120" height="22"><text x="60" y="15" text-anchor="middle" font-size="12">${j.id}</text></svg>`),left:0,top:174}]).png().toBuffer(),left:(i%6)*cellW,top:Math.floor(i/6)*cellH})));
 await sharp({create:{width,height:Math.ceil(jobs.length/6)*cellH,channels:3,background:'#fff4d5'}}).composite(cells).png().toFile(`data/hm-flat-review/${kind}.png`);
}
console.log(`Built ${manifest.jobs.length} illustrated assets with responsive card sizes; existing art retained.`);
