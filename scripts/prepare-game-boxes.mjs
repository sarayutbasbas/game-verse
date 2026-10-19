// Normalize generated transparent box art to one shelf size without changing source files.
import sharp from 'sharp';
import {readFile, mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const {jobs}=JSON.parse(await readFile(new URL('../docs/game-box-art-jobs.json',import.meta.url),'utf8'));
const output=new URL('../public/art/boxes/',import.meta.url);
await mkdir(output,{recursive:true});
for(const {id,source} of jobs){
  const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let left=info.width,top=info.height,right=0,bottom=0;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>128){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  const box=await sharp(source).extract({left,top,width:right-left+1,height:bottom-top+1}).resize(576,728,{fit:'fill'}).png().toBuffer();
  await sharp({create:{width:640,height:800,channels:4,background:'#00000000'}}).composite([{input:box,left:32,top:36}]).png({palette:true,colours:256,quality:100,compressionLevel:9,effort:10}).toFile(fileURLToPath(new URL(id+'.png',output)));
  console.log(id);
}
