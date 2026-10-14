import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
mkdirSync('public/art/azul',{recursive:true});
const assets=[...['blue','yellow','red','black','white'].map(c=>({name:'tile-'+c,size:256,alpha:true})),{name:'board',output:'board-paper',size:1024},{name:'factory',size:384,alpha:true},{name:'marker',output:'first-player',size:192,alpha:true},{name:'cover',output:'../covers/azul',width:640,height:960}];
const manifest=[];
for(const a of assets){
 let pipeline=sharp('assets/source/azul/'+a.name+'.png');
 if(a.alpha)pipeline=pipeline.trim({threshold:10});
 const output='public/art/azul/'+(a.output??a.name)+'.webp';
 const info=await pipeline.resize(a.width??a.size,a.height??a.size,{fit:a.width?'cover':'contain',background:{r:0,g:0,b:0,alpha:0}}).webp({quality:86,alphaQuality:100}).toFile(output);
 manifest.push({name:a.name,path:output,width:info.width,height:info.height,bytes:info.size,transparent:!!a.alpha});
}
writeFileSync('public/art/azul/manifest.json',JSON.stringify(manifest,null,2));
const thumbs=await Promise.all(manifest.map(a=>sharp(a.path).resize(160,160,{fit:'contain',background:'#fff9e8'}).png().toBuffer()));
await sharp({create:{width:540,height:570,channels:4,background:'#e9dfc9'}}).composite(thumbs.map((input,i)=>({input,left:10+(i%3)*180,top:10+Math.floor(i/3)*190}))).png().toFile('/tmp/azul-art-contact.png');
console.log(JSON.stringify({assets:manifest.length,totalBytes:manifest.reduce((s,a)=>s+a.bytes,0)}));
