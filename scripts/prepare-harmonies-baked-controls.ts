import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {ANIMAL} from '../src/games/harmonies/data.js';
import palette from '../src/client/harmonies-card-palette.json' with {type:'json'};
export const BATCH=['spirit-11','animal-22','animal-01','whisper-05','spirit-09'];
const dir='assets/source/harmonies/baked-cards-v1';
const dataUri=async(p:string)=>`data:image/png;base64,${(await sharp(p).png().toBuffer()).toString('base64')}`;
export const crystalKind=(c:{id:string;kind?:string})=>c.id==='spirit-11'?'dinosaur-white':c.kind==='whisper'?'whisper-purple':c.kind==='spirit'?'spirit-rainbow':'animal-gold';
export async function controls(){
 const jobs=[];
 for(const id of BATCH){const card=ANIMAL[id],kind=crystalKind(card),color=(palette as Record<string,string>)[id];
 for(const small of [false,true]){
  const cells=card.pattern.map(c=>({...c,x:c.q*49,y:(c.r+c.q/2)*56})).sort((a,b)=>a.y-b.y||a.x-b.x);
  const minX=Math.min(...cells.map(c=>c.x-34)),maxX=Math.max(...cells.map(c=>c.x+34));
  const minY=Math.min(...cells.map(c=>c.y-30-(c.stack.length-1)*17-(c.cube?28:0))),maxY=Math.max(...cells.map(c=>c.y+34));
  const box={x:small?18:26,y:small?288:299,w:small?224:212,h:small?119:105};
  const scale=Math.min(box.w/(maxX-minX),box.h/(maxY-minY));
  const tx=box.x+box.w/2-(minX+maxX)/2*scale,ty=box.y+box.h-(maxY)*scale;
  let habitat='',labels='';
  for(const c of cells){const points='-32.6667,0 -16.3333,-28 16.3333,-28 32.6667,0 16.3333,28 -16.3333,28';habitat+=`<g transform="translate(${c.x} ${c.y})"><polygon points="${points}" transform="translate(0 5)" fill="#152d2b" opacity=".22"/><polygon points="${points}" transform="translate(0 3)" fill="#b8a078"/><polygon points="${points}" fill="#f6e6bf" stroke="#c9b38c" stroke-width=".6"/>`;
   for(const [i,t] of c.stack.entries())habitat+=`<image href="${await dataUri(`public/art/harmonies/tokens-v5/${t}.png`)}" x="${-52/.72/2}" y="${-30-46/.72*.14-i*17}" width="${52/.72}" height="${46/.72}"/>`;
   if(c.cube)habitat+=`<image href="${await dataUri(`public/art/harmonies/baked-cards-v1/crystal-${kind}.webp`)}" x="${-25/.72/2}" y="${-12-(c.stack.length-1)*17-28/.72*.86}" width="${25/.72}" height="${28/.72}"/>`;
   if(small&&c.stack.length>1)labels+=`<text x="${c.x+25}" y="${c.y+28}" font-family="sans-serif" font-size="12" font-weight="900" text-anchor="middle" fill="#fff5d7" stroke="#173f35" stroke-width="2" paint-order="stroke">×${c.stack.length}</text>`;
   habitat+='</g>';
  }
  habitat+=labels;
  const scores=card.kind==='whisper'?['2/5','2/5']:card.kind==='spirit'?[card.spiritScoring==='water-groups'?'7':'2']:[...card.points].reverse().map(String);
  const row=small?35:39,scoreY=small?430-25-row*scores.length-(card.kind==='spirit'?40:0):20;
  let track='';
  for(let i=0;i<scores.length;i++){
   const special=!!card.kind,y=scoreY+i*row;
   track+=`<g transform="translate(259 ${y})">${special?`<path d="M4 0H31L37 7V${row-9}L30 ${row-3}H5L0 ${row-10}V7Z" fill="${color}" stroke="#f0dfa8" stroke-width=".9"/>`:`<rect width="39" height="${row-4}" fill="${color}"/>`}<text x="19" y="${row*.71}" text-anchor="middle" font-family="sans-serif" font-size="${scores[i].length>2?19:24}" font-weight="900" fill="#fff5cf">${scores[i]}</text></g>`;
  }
  if(card.kind==='spirit'){
   const y=scoreY+row+5;
   track+=card.spiritScoring==='water-groups'?`<g fill="none" stroke="#fff3d1" stroke-width="1.5"><path d="M264 ${y+5}q5-5 10 0t10 0M264 ${y+12}q5-5 10 0t10 0"/><path d="M266 ${y+22}h18"/></g><text x="277" y="${y+33}" text-anchor="middle" fill="#fff3d1" font-family="sans-serif" font-size="12" font-weight="bold">≥2</text>`:`<g stroke="#fff3d1" stroke-width="1.5" fill="none"><path d="m264 ${y+4} 6-4 6 4v8l-6 4-6-4Zm14 18 6-4 6 4v8l-6 4-6-4ZM272 ${y+17}l9 3"/></g>`;
  }
  const bg=await dataUri(`public/art/harmonies/cards-v5/${id}.webp`),rail=await dataUri(`public/art/harmonies/rails-v5/${id}.png`);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1290" viewBox="0 0 300 430"><defs><clipPath id="card"><rect width="300" height="430" rx="12"/></clipPath><linearGradient id="shade" x2="0" y2="1"><stop offset="0" stop-color="#073e3b" stop-opacity="0"/><stop offset="1" stop-color="#102d2b" stop-opacity=".75"/></linearGradient></defs><g clip-path="url(#card)"><image href="${bg}" width="260" height="430" preserveAspectRatio="none"/><rect y="280" width="260" height="150" fill="url(#shade)"/><image href="${rail}" x="260" width="40" height="430" preserveAspectRatio="none"/><g transform="translate(${tx} ${ty}) scale(${scale})">${habitat}</g>${track}</g></svg>`;
  const name=`${id}${small?'-small':''}-control`;
  await writeFile(`${dir}/${name}.svg`,svg);await sharp(Buffer.from(svg)).png().toFile(`${dir}/${name}.png`);
  jobs.push({id,size:small?'small':'large',kind,pattern:card.pattern,points:scores,control:`${name}.png`,projection:{stepX:49,stepY:56},group:{...box,scale,tx,ty}});
 }
 }
 await writeFile(`${dir}/control-manifest.json`,JSON.stringify(jobs,null,2));
}
if(process.argv[1]?.includes('prepare-harmonies-baked-controls'))await controls();
