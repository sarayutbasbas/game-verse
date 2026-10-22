import fs from 'node:fs/promises';
import sharp from 'sharp';
async function cleanCell(cell){
 // Strip clipped fragments from the neighboring sprite cell; retain the main
 // connected silhouette and export genuine alpha without a painted backdrop.
 const {data,info}=await sharp(cell).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const n=info.width*info.height,labels=new Int32Array(n),queue=new Int32Array(n);let label=0,best=0,bestSize=0;
 for(let pos=0;pos<n;pos++)if(!labels[pos]&&data[pos*4+3]>=16){
 label++;let head=0,tail=1;queue[0]=pos;labels[pos]=label;
 while(head<tail){const x=queue[head++],col=x%info.width;for(const next of [col?x-1:-1,col<info.width-1?x+1:-1,x>=info.width?x-info.width:-1,x<n-info.width?x+info.width:-1])if(next>=0&&!labels[next]&&data[next*4+3]>=16){labels[next]=label;queue[tail++]=next;}}
 if(tail>bestSize){bestSize=tail;best=label;}
 }
 for(let i=0;i<n;i++)if(labels[i]!==best)data[i*4+3]=0;
 return sharp(data,{raw:info}).png().toBuffer();
}
const manifest=JSON.parse(await fs.readFile('docs/games/draftosaurus/assets.json','utf8'));
for(const job of manifest.jobs){
 const source=`assets/source/draftosaurus/${job.id}.png`;await fs.copyFile(job.source,source);job.workspaceSource=source;
 if(job.id==='cover'||job.id==='board'){await sharp(source).resize(job.id==='board'?1536:900).webp({quality:90}).toFile(job.output);}
 else{
 const meta=await sharp(source).metadata(),half=Math.floor(meta.width/2),frames=[];
 for(let i=0;i<2;i++){
 const cell=await sharp(source).extract({left:i*half,top:0,width:half,height:meta.height}).toBuffer();
 const b=await sharp(await cleanCell(cell)).trim({threshold:10}).toBuffer();
 const png=await sharp(b).resize(240,212,{fit:'inside'}).toBuffer();const m=await sharp(png).metadata();
 frames.push({input:png,left:i*256+Math.round((256-m.width)/2),top:230-m.height});
 }
 await sharp({create:{width:512,height:256,channels:4,background:'#00000000'}}).composite(frames).webp({quality:92,alphaQuality:100}).toFile(job.output);
 await sharp(job.output).extract({left:0,top:0,width:256,height:256}).webp({quality:90}).toFile(`public/art/draftosaurus/${job.id}-still.webp`);
 }
}
await fs.writeFile('docs/games/draftosaurus/assets.json',JSON.stringify(manifest,null,2)+'\n');
