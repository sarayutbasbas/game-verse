import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const file='docs/games/harmonies/special-paper-v1-jobs.json',manifest=JSON.parse(await readFile(file,'utf8'));
const qa='data/qa-harmonies-special-paper-v1';await mkdir(qa,{recursive:true});
const layers=[],cols=7,w=150,h=224;
for(const [i,j]of manifest.jobs.entries()){
 const source=`${j.sourceDir}/${j.id}.png`,outDir=`public/art/harmonies/${j.kind==='card'?'special-paper-v1':'tokens-paper-v1'}`;await mkdir(outDir,{recursive:true});j.source=source;j.outputs=[];
 if(j.kind==='card'){
  for(const [suffix,width,height,quality]of [['',900,1200,85],['-small',300,400,76],['-lite',150,200,68]]){const output=`${outDir}/${j.id}${suffix}.webp`;await sharp(source).resize(width,height,{fit:'cover'}).webp({quality}).toFile(output);j.outputs.push(output);}
 }else{
  // A generated paper print is fitted to the shared cylinder, preserving board anchors.
  const print=(await sharp(source).resize(184,99).png().toBuffer()).toString('base64');
  const color=j.color||({water:'#1689ad',rock:'#62696b',wood:'#a35c32',leaf:'#95a62b',field:'#e6b522',building:'#c44d3e'}[j.id]);
  const svg=`<svg width="256" height="224" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="cap"><ellipse cx="128" cy="85.12" rx="92" ry="49.28"/></clipPath><linearGradient id="side"><stop stop-color="${color}"/><stop offset="1" stop-color="${color}" stop-opacity=".8"/></linearGradient></defs><path d="M36 85.12V143.36A92 49.28 0 0 0 220 143.36V85.12Z" fill="${color}" stroke="#243b32" stroke-opacity=".5" stroke-width="1.5"/><path d="M36 85.12V143.36A92 49.28 0 0 0 220 143.36V85.12Z" fill="#14261f" opacity=".18"/><image href="data:image/png;base64,${print}" x="36" y="35.84" width="184" height="99" clip-path="url(#cap)"/><ellipse cx="128" cy="85.12" rx="92" ry="49.28" fill="none" stroke="#fff1cb" stroke-opacity=".55" stroke-width="1.5"/></svg>`;
  const output=`${outDir}/${j.id}.png`;await sharp(Buffer.from(svg)).png().toFile(output);j.outputs.push(output);
 }
 j.sha256=createHash('sha256').update(await readFile(j.outputs[0])).digest('hex');
 const thumb=await sharp(j.outputs[0]).resize(w,200,{fit:'contain',background:'#f5ead4'}).png().toBuffer();layers.push({input:thumb,left:i%cols*w,top:Math.floor(i/cols)*h});layers.push({input:Buffer.from(`<svg width="150" height="24"><text x="75" y="17" text-anchor="middle" font-family="sans-serif" font-size="12">${j.id}</text></svg>`),left:i%cols*w,top:Math.floor(i/cols)*h+200});
}
await sharp({create:{width:cols*w,height:Math.ceil(manifest.jobs.length/cols)*h,channels:4,background:'#f5ead4'}}).composite(layers).png().toFile(`${qa}/contact-sheet.png`);
await writeFile(file,JSON.stringify(manifest,null,2)+'\n');
console.log(`Exported ${manifest.jobs.length} generated assets; originals retained.`);
