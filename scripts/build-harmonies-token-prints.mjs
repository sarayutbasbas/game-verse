import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
const dir='public/art/harmonies/tokens/printed-v1';
const source=process.argv[2]??join(dir,'atlas.png');
const names=['water','leaf','rock','field','building','wood'];
const {width,height}=await sharp(source).metadata();
await mkdir(dir,{recursive:true});
for(const [i,name]of names.entries()){
 const cell=await sharp(source).extract({left:i%3*width/3,top:Math.floor(i/3)*height/2,width:width/3,height:height/2}).png().toBuffer();
 // Preserve generated alpha, normalize the six print sizes and tint the black ink.
 await sharp(cell).trim().resize(80,80,{fit:'contain',background:'#00000000'}).extend({top:8,bottom:8,left:8,right:8,background:'#00000000'}).negate({alpha:false}).tint('#fff1bd').png().toFile(join(dir,name+'.png'));
}
console.log('Six transparent 96px token prints saved to '+dir);
