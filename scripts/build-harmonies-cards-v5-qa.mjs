import sharp from 'sharp';
import {join} from 'node:path';

const root=process.cwd(),dir=join(root,'data/qa-harmonies-cards-v5/screens'),ids=['animal-01','animal-02','animal-03','animal-04','animal-05','spirit-11','spirit-09','whisper-05','animal-22'];
async function sheet(kind,width,height,gap,file){
 const images=await Promise.all(ids.map(id=>sharp(join(dir,`${kind}-${id}.png`)).resize(width,height,{fit:'contain',background:{r:240,g:226,b:188,alpha:1}}).png().toBuffer()));
 const columns=3,rows=Math.ceil(ids.length/columns);
 await sharp({create:{width:gap+columns*(width+gap),height:rows*(height+gap)+gap,channels:4,background:{r:30,g:47,b:43,alpha:1}}}).composite(images.map((input,index)=>({input,left:gap+(index%columns)*(width+gap),top:gap+Math.floor(index/columns)*(height+gap)}))).png().toFile(join(root,`data/qa-harmonies-cards-v5/${file}`));
}
await sheet('small',236,338,16,'assembled-small-cards.png');
await sheet('popup',300,460,16,'assembled-popup-cards.png');
console.log('Built cards-v5 small and popup QA contact sheets.');
