import sharp from 'sharp';
import {readdir,readFile,mkdir,writeFile} from 'node:fs/promises';
const root='data/harmonies-habitat-v4',out='public/art/harmonies/habitat-v4';
await mkdir(out,{recursive:true});await mkdir('public/art/harmonies/tokens/painted-v4',{recursive:true});
const files=(await readdir(root+'/jobs')).filter(f=>/^\w+-\d+\.json$/.test(f));
const cards=[];
for(const f of files){
 const j=JSON.parse(await readFile(root+'/jobs/'+f,'utf8'));if(!j.fullPath||!j.miniPath)continue;
 await sharp(j.fullPath).resize(720,1280,{fit:'fill'}).webp({quality:89}).toFile(`${out}/${j.id}.webp`);
 for(const [suffix,w,h] of [['-small',270,480],['-lite',135,240]])await sharp(j.miniPath).resize(w,h,{fit:'fill'}).webp({quality:suffix==='-lite'?75:89}).toFile(`${out}/${j.id}${suffix}.webp`);
 cards.push(j);
}
const extras=[];
for(const f of await readdir(root+'/aux')){
 const j=JSON.parse(await readFile(root+'/aux/'+f,'utf8'));if(!j.path)continue;
 if(j.id==='background')await sharp(j.path).resize(1920,1080,{fit:'cover'}).webp({quality:87}).toFile(`${out}/background.webp`);
 else {
  if(!(await sharp(j.path).metadata()).hasAlpha)throw Error(`${j.id}: transparency required`);
  await sharp(j.path).trim({threshold:8}).resize(256,256,{fit:'contain',background:'#00000000'}).png().toFile(`public/art/harmonies/tokens/painted-v4/${j.id.replace('token-','')}.png`);
 }
 extras.push(j);
}
await writeFile('docs/games/harmonies/habitat-v4-art-jobs.json',JSON.stringify({generator:'built-in image_gen',cards,extras},null,2)+'\n');
// Labelled contact sheets for inspection, including a separate enlarged diagram strip.
for(const type of ['animal','spirit','whisper']){
 const jobs=cards.filter(j=>j.id.startsWith(type+'-'));if(!jobs.length)continue;
 const thumbs=await Promise.all(jobs.map(async(j,i)=>({input:await sharp(`${out}/${j.id}-small.webp`).resize(120,214).extend({top:0,left:0,right:0,bottom:22,background:'#fffbe9'}).composite([{input:Buffer.from(`<svg width="120" height="22"><text x="60" y="15" text-anchor="middle" font-size="12">${j.id}</text></svg>`),left:0,top:214}]).png().toBuffer(),left:i%6*120,top:Math.floor(i/6)*236})));
 await sharp({create:{width:720,height:Math.ceil(jobs.length/6)*236,channels:3,background:'#fffbe9'}}).composite(thumbs).png().toFile(`${root}/${type}-contact.png`);
}
console.log(`Built ${cards.length}/53 full + small + lite cards, ${extras.length}/7 auxiliary assets.`);
if(process.argv.includes('--complete')&&(cards.length!==53||extras.length!==7))throw Error('Production set is incomplete');
