import sharp from 'sharp';
import {mkdir,readFile} from 'node:fs/promises';
const id=process.argv[2];
const manifest=JSON.parse(await readFile('docs/games/harmonies/sanctuaries-v2-jobs.json','utf8'));
const jobs=manifest.jobs.filter(job=>job.id===id);
if(jobs.length!==2||!jobs.some(j=>j.kind==='art')||!jobs.some(j=>j.kind==='model'))throw Error('Specify one complete Sanctuary art/model pair');
await mkdir('public/art/harmonies/sanctuaries-v2',{recursive:true});
for(const job of jobs){
 if(job.kind==='art'){
  for(const [index,width,height] of [[0,900,1200],[1,300,400]])await sharp(job.source).resize(width,height,{fit:'cover'}).webp({quality:90}).toFile(job.exports[index]);
 }else{
  const {data,info}=await sharp(job.source).ensureAlpha().raw().toBuffer({resolveWithObject:true});let left=info.width,top=info.height,right=-1,bottom=-1;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>16){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
  if(right<left)throw Error('Empty miniature');
  const crop=await sharp(job.source).extract({left,top,width:right-left+1,height:bottom-top+1}).resize(220,178,{fit:'inside'}).png().toBuffer(),size=await sharp(crop).metadata();
  await sharp({create:{width:256,height:224,channels:4,background:'#0000'}}).composite([{input:crop,left:Math.floor((256-size.width)/2),top:(job.baseline??({'sanctuary-01':200,'sanctuary-02':197,'sanctuary-04':203,'sanctuary-05':198}[job.id]??205))-size.height}]).webp({quality:94}).toFile(job.exports[0]);
 }
}
console.log('Exported '+id+' full/small cards and transparent miniature');
