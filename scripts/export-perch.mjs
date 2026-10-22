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
const manifest=JSON.parse(await fs.readFile('docs/games/perch/assets.json','utf8'));
const dest='public/art/perch';await fs.mkdir(dest,{recursive:true});
async function sprite(input,cols,rows,names,twoFrames=false){
 const m=await sharp(input).metadata(),w=Math.floor(m.width/cols),h=Math.floor(m.height/rows),frames=[];
 for(let i=0;i<cols*rows;i++){
  const cell=await sharp(input).extract({left:i%cols*w,top:Math.floor(i/cols)*h,width:w,height:h}).toBuffer();
  const trim=await sharp(await cleanCell(cell)).trim({threshold:8}).toBuffer();
  const b=await sharp(trim).resize(236,216,{fit:'inside'}).toBuffer(),meta=await sharp(b).metadata();
  const frame=await sharp({create:{width:256,height:256,channels:4,background:'#00000000'}}).composite([{input:b,left:Math.round((256-meta.width)/2),top:234-meta.height}]).png().toBuffer();frames.push(frame);
  if(!twoFrames)await sharp(frame).webp({quality:92,alphaQuality:100}).toFile(dest+'/'+names[i]+'.webp');
 }
 if(twoFrames){await sharp({create:{width:512,height:256,channels:4,background:'#00000000'}}).composite(frames.map((input,i)=>({input,left:i*256,top:0}))).webp({quality:92,alphaQuality:100}).toFile(dest+'/'+names[0]+'.webp');await sharp(frames[0]).webp({quality:90,alphaQuality:100}).toFile(dest+'/'+names[0]+'-still.webp');}
}
for(const job of manifest.jobs){
 const source=job.workspaceSource;job.outputs=[];
 if(['cover','garden','fountain'].includes(job.id)){const out=dest+'/'+job.id+'.webp';await sharp(source).resize(job.id==='cover'?900:1536).webp({quality:90}).toFile(out);job.outputs=[out];}
 else if(job.id.startsWith('bird-')){await sprite(source,2,1,[job.id],true);job.outputs=[dest+'/'+job.id+'.webp',dest+'/'+job.id+'-still.webp'];}
 else if(job.id.startsWith('locations-')){const start=(Number(job.id.at(-1))-1)*8,m=await sharp(source).metadata(),w=Math.floor(m.width/4),h=Math.floor(m.height/2);for(let i=0;i<8;i++){const out=dest+'/location-'+String(start+i).padStart(2,'0')+'.webp';await sharp(source).extract({left:i%4*w,top:Math.floor(i/4)*h,width:w,height:h}).resize(512,512,{fit:'cover'}).webp({quality:88}).toFile(out);job.outputs.push(out);}}
 else if(job.id==='creatures'){const names=['dog','cat','hawk','fox','bee','scarecrow','cuckoo','owl','squirrel'].map(x=>'creature-'+x);await sprite(source,3,3,names);job.outputs=names.map(n=>dest+'/'+n+'.webp');}
 else if(job.id==='objects'){const names=['nest','house','zap'];await sprite(source,3,1,names);job.outputs=names.map(n=>dest+'/'+n+'.webp');}
}
await fs.writeFile('docs/games/perch/assets.json',JSON.stringify(manifest,null,2)+'\n');
