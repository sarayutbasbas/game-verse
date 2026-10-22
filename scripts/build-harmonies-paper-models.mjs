import sharp from 'sharp';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
const dir='data/harmonies-habitat-v4/models',out='public/art/harmonies/figurines/paper-v4';await mkdir(out,{recursive:true});
const jobs=[];for(const f of await readdir(dir)){
 const j=JSON.parse(await readFile(dir+'/'+f,'utf8'));if(!j.path)continue;
 if(!(await sharp(j.path).metadata()).hasAlpha)throw Error(`Opaque model: ${j.id}`);
 const trim=await sharp(j.path).trim({threshold:8}).toBuffer();
 const fit=await sharp(trim).resize(144,168,{fit:'inside'}).toBuffer(),m=await sharp(fit).metadata();
 const norm=await sharp({create:{width:160,height:184,channels:4,background:'#00000000'}}).composite([{input:fit,left:Math.floor((160-m.width)/2),top:176-m.height}]).webp({quality:86,alphaQuality:100}).toBuffer();
 await writeFile(`${out}/${j.id}.webp`,norm);await sharp(norm).resize(64,74).webp({quality:75,alphaQuality:100}).toFile(`${out}/${j.id}-tiny.webp`);
 jobs.push({...j,canvas:{width:160,height:184,baseline:176}});
}
await writeFile('docs/games/harmonies/paper-v4-model-jobs.json',JSON.stringify({generator:'built-in image_gen',jobs},null,2)+'\n');console.log(`Built ${jobs.length}/48 paper figurines.`);
if(process.argv.includes('--complete')&&jobs.length!==48)throw Error('Models incomplete');
