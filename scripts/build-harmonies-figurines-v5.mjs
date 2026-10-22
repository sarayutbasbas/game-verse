import sharp from 'sharp';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const file='docs/games/harmonies/animated-v5-art-jobs.json',manifest=JSON.parse(await readFile(file,'utf8'));
await mkdir('public/art/harmonies/figurines/animated-v5',{recursive:true});
for(const e of manifest.entries){
 const image=sharp(e.source).ensureAlpha(),trimmed=await image.trim({threshold:12}).toBuffer();
 const fitted=await sharp(trimmed).resize({width:144,height:168,fit:'inside'}).toBuffer(),meta=await sharp(fitted).metadata();
 await sharp({create:{width:160,height:184,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:fitted,left:Math.floor((160-meta.width)/2),top:176-meta.height}]).webp({quality:78,alphaQuality:100}).toFile(e.path);
 e.canvas={width:160,height:184,baseline:176};
}
await writeFile(file,JSON.stringify(manifest,null,2)+'\n');console.log(`Normalized ${manifest.entries.length} figures to160x184 with identical baseline.`);
