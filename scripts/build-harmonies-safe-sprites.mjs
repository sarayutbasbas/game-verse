import sharp from 'sharp';
import {writeFile} from 'node:fs/promises';
const dir='public/art/harmonies/tokens-v5',source='assets/source/harmonies/cards-v5';

async function normalize(input,output,w,h,cw,ch){
 const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});let x1=info.width,y1=info.height,x2=0,y2=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>16){x1=Math.min(x1,x);x2=Math.max(x2,x);y1=Math.min(y1,y);y2=Math.max(y2,y);}
 const content=await sharp(input).extract({left:x1,top:y1,width:x2-x1+1,height:y2-y1+1}).resize(cw,ch,{fit:'fill'}).png().toBuffer();
 await sharp({create:{width:w,height:h,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:content,left:Math.floor((w-cw)/2),top:Math.floor((h-ch)/2)}]).toFile(output);
 return {input,output,canvas:[w,h],content:[cw,ch],padding:[(w-cw)/2,(h-ch)/2]};
}
const jobs=[];
for(const t of ['water','rock','wood','leaf','field','building'])jobs.push(await normalize(`${source}/token-${t}-v2.png`,`${dir}/${t}.png`,256,224,184,160));
jobs.push(await normalize(`${source}/token-neutral-base-v2.png`,`${dir}/neutral-base.png`,256,224,184,160));
for(const [color,name] of [['gold','animal-gold'],['purple','spirit-purple'],['white','dinosaur-white']])jobs.push(await normalize(`${source}/crystal-${color}.png`,`${dir}/crystal-${name}.webp`,256,288,184,208));
await writeFile(`${source}/safe-sprites.json`,JSON.stringify({version:'geometry-3',jobs,purplePrompt:'Amethyst transparent beveled cube, three faces, 2–3 static corner glints, no glow, same isometric camera, transparent padding.'},null,2));
