import sharp from 'sharp';
const path='assets/source/harmonies/baked-cards-v1/crystal-atlas.png';
const {width,height}=await sharp(path).metadata();
for(const [i,kind] of ['animal-gold','whisper-purple','spirit-rainbow','dinosaur-white'].entries()){
 const w=Math.floor(width/2),h=Math.floor(height/2),part=await sharp(path).extract({left:(i%2)*w,top:Math.floor(i/2)*h,width:w,height:h}).png().toBuffer();
 const {data,info}=await sharp(part).ensureAlpha().raw().toBuffer({resolveWithObject:true});let x1=w,y1=h,x2=0,y2=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>16){x1=Math.min(x1,x);x2=Math.max(x2,x);y1=Math.min(y1,y);y2=Math.max(y2,y);}
 const content=await sharp(part).extract({left:x1,top:y1,width:x2-x1+1,height:y2-y1+1}).resize(184,208,{fit:'fill'}).png().toBuffer();
 await sharp({create:{width:256,height:288,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:content,left:36,top:40}]).webp({quality:90}).toFile(`public/art/harmonies/baked-cards-v1/crystal-${kind}.webp`);
}
