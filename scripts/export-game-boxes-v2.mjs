import fs from 'node:fs/promises';
import sharp from 'sharp';

// Match the transparent 640×800 catalog frames; never stretch printed artwork.
const manifest=JSON.parse(await fs.readFile('docs/game-boxes-v2.json','utf8'));
for(const job of manifest.jobs){
 const input=await sharp(job.workspaceSource).trim({threshold:10}).resize(612,756,{fit:'inside'}).png().toBuffer();
 const {width,height}=await sharp(input).metadata();
 await sharp({create:{width:640,height:800,channels:4,background:'#00000000'}})
  .composite([{input,left:Math.round((640-width)/2),top:Math.round((800-height)/2)}])
  .webp({quality:92,alphaQuality:100}).toFile(job.outputs[0]);
}
