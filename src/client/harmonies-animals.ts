import {ANIMAL} from '../games/harmonies/data.js';
// Small solid wooden figurines: each part has six independently shaded faces.
// Geometry stays decorative; the server's card/cell ownership determines every model.
type Species={color:string;head?:string;shape?:'bird'|'longbird'|'fish'|'insect'|'bat'|'long'|'upright';ears?:'long'|'round'|'point';tail?:'long'|'bush';beak?:string;mark?:string};
export const SPECIES:Record<string,Species>={
 crocodile:{color:'#527742',shape:'long',tail:'long'},stingray:{color:'#59848b',shape:'fish',tail:'long'},hippopotamus:{color:'#9e8c9e',ears:'round'},otter:{color:'#90633f',head:'#d4b187',shape:'long',tail:'long'},frog:{color:'#70a03c'},duck:{color:'#c4ab68',head:'#387660',shape:'bird',beak:'#e5ad39'},flamingo:{color:'#f27499',shape:'longbird',beak:'#3b3638'},lizard:{color:'#80a04b',shape:'long',tail:'long'},mouse:{color:'#a39c93',ears:'round',tail:'long'},peacock:{color:'#327d97',shape:'bird',tail:'bush',mark:'#45975b'},squirrel:{color:'#ba7238',ears:'point',tail:'bush'},hedgehog:{color:'#715b45',head:'#c4a77c',mark:'#493e32'},bee:{color:'#e4b73c',shape:'insect',mark:'#39362d'},bear:{color:'#865f3b',ears:'round'},hare:{color:'#b49e7f',ears:'long'},macaw:{color:'#c94e43',shape:'bird',beak:'#e7b64c',mark:'#3c88ad'},boar:{color:'#736052',head:'#9a7963',ears:'point'},koala:{color:'#9baba8',ears:'round',head:'#bec6bd'},wolf:{color:'#8c969b',head:'#c1c6bf',ears:'point',tail:'long'},kingfisher:{color:'#378da6',shape:'bird',beak:'#72513b',mark:'#d78b42'},penguin:{color:'#374750',head:'#38434a',shape:'bird',beak:'#e6b345',mark:'#f0e9d4'},bat:{color:'#655360',shape:'bat',ears:'point'},'fennec fox':{color:'#d68b38',head:'#f4d59a',ears:'long',tail:'bush'},'snow monkey':{color:'#c3c4bc',head:'#cf9288',ears:'round',tail:'long'},vulture:{color:'#6f5b4b',head:'#d8c6aa',shape:'bird',beak:'#b88d53'},meerkat:{color:'#bd9c6c',shape:'upright',ears:'round',tail:'long'},crow:{color:'#35434a',shape:'bird',beak:'#56616a'},llama:{color:'#d9ccad',shape:'longbird',ears:'long'},heron:{color:'#a7c2c3',shape:'longbird',beak:'#e0ad44'},raccoon:{color:'#96968a',head:'#535a58',ears:'round',tail:'bush',mark:'#414949'},ladybug:{color:'#c24f48',shape:'insect',head:'#38433c',mark:'#34443b'},'black panther':{color:'#354648',head:'#425558',ears:'round',tail:'long'},
};
function block(x:number,y:number,z:number,w:number,d:number,h:number,color:string){return `<span class="hm-animal-part" style="--w:${w}px;--d:${d}px;--h:${h}px;--fur:${color};transform:translate3d(${x}px,${y}px,${z}px)">${['top','bottom','front','back','left','right'].map(face=>`<b class="hm-animal-face ${face}"></b>`).join('')}</span>`;}
type Part={x:number;y:number;z:number;w:number;d:number;h:number;color:string};
function animalParts(card:string){
 const animal=ANIMAL[card],s=SPECIES[animal.animal],parts:Part[]=[],add=(x:number,y:number,z:number,w:number,d:number,h:number,color=s.color)=>parts.push({x,y,z,w,d,h,color});
 if(s.shape==='fish'){add(0,0,4,25,15,4);add(-13,2,3,9,8,2);add(13,2,3,9,8,2);add(0,14,2,3,20,2);}
 else if(s.shape==='insect'){add(0,1,7,16,18,10);add(0,-10,6,10,7,7,s.head??'#3c4338');for(const x of [-9,9])for(const y of [-5,1,7])add(x,y,2,5,2,2,'#42443b');if(animal.animal==='bee'){add(-10,0,12,11,12,2,'#d9e8dc');add(10,0,12,11,12,2,'#d9e8dc');for(const y of [-3,4])add(0,y,12.5,16,3,1,s.mark!);}else for(const x of [-4,4])for(const y of [-3,5])add(x,y,12.5,3,3,1,s.mark!);}
 else if(s.shape==='bird'||s.shape==='longbird'||s.shape==='bat'){
  const tall=s.shape==='longbird';add(0,2,tall?14:10,14,15,13);add(0,-6,tall?23:19,7,6,tall?16:5);add(0,-9,tall?32:22,10,9,9,s.head??s.color);
  add(0,-16,tall?31:21,5,s.beak?9:5,3,s.beak??'#d3ac65');
  for(const x of [-5,5]){add(x,2,tall?5:3,3,4,tall?12:6,'#9d774b');add(x,-1,1,5,9,2,'#b58b4c');}
  for(const x of [-10,10])add(x,3,12,s.shape==='bat'?20:5,15,s.shape==='bat'?3:10,s.mark??s.color);
  if(s.tail==='bush')for(const x of [-8,0,8])add(x,12,19,8,4,24,s.mark??s.color);
  if(animal.animal==='penguin')add(0,-6,10,10,2,12,s.mark!);
  if(animal.animal==='llama')for(const x of [-4,4])add(x,-8,40,3,3,10);
 }else{
  const long=s.shape==='long',upright=s.shape==='upright';add(0,2,upright?15:10,long?12:17,long?24:18,upright?24:12);
  add(0,long?-14:-8,upright?29:20,animal.animal==='hippopotamus'?18:12,11,10,s.head??s.color);
  if(long)add(0,-22,16,10,12,5,s.head??s.color);else add(0,-15,upright?27:18,8,5,5,s.head??s.color);
  for(const x of [-6,6])for(const y of [-4,9])add(x,y,3,4,5,7);
  if(s.ears)for(const x of [-5,5])add(x,-8,(upright?29:20)+(s.ears==='long'?10:6),s.ears==='round'?6:4,4,s.ears==='long'?15:6,s.color);
  if(s.tail)add(0,s.tail==='bush'?14:20,s.tail==='bush'?17:4,s.tail==='bush'?9:3,s.tail==='bush'?8:20,s.tail==='bush'?23:3,s.mark??s.color);
  if(animal.animal==='frog'){for(const x of [-9,9]){add(x,8,3,9,10,5);add(x/2,-9,24,5,5,5);}}
  if(animal.animal==='hedgehog')for(const x of [-5,0,5])for(const y of [-1,6])add(x,y,18,3,3,6,s.mark!);
 }
 const eyeZ=s.shape==='longbird'?34:s.shape==='bird'||s.shape==='bat'?24:s.shape==='fish'?7:s.shape==='insect'?9:s.shape==='upright'?31:22;
 const eyeY=s.shape==='long'?-20:s.shape==='insect'?-14:s.shape==='fish'?-6:-14;
 for(const x of [-3.5,3.5])add(x,eyeY,eyeZ,2,1.5,2,'#202e2c');
 return parts;
}
const modelGeometry = new Map<string,string>();
export function animalModel(card:string,height:number,preview=false,display:'board'|'tray'='board'){
 const animal=ANIMAL[card];
 let parts=modelGeometry.get(card);
 if(!parts){parts=animalParts(card).map(p=>block(p.x,p.y,p.z,p.w,p.d,p.h,p.color)).join('');modelGeometry.set(card,parts);}
 return `<span class="hm-animal-model ${display==='tray'?'hm-animal-option':preview?'hm-cube-preview is-preview':'hm-cube'}" data-animal="${animal.animal}" data-cube-card="${card}" style="--height:${height}" title="${animal.name}" aria-hidden="true">${parts}</span>`;
}

const diagramModels=new Map<string,string>();
/** Orthographic faces of the same solid model used on the board, for SVG cards. */
export function animalDiagramModel(card:string,heading=150,viewTilt=32){
 const key=`${card}-${heading}-${viewTilt}`,cached=diagramModels.get(key);if(cached)return cached;
 const angle=heading*Math.PI/180,tilt=viewTilt*Math.PI/180;
 const project=([x,y,z]:number[])=>{const rx=x*Math.cos(angle)-y*Math.sin(angle),ry=x*Math.sin(angle)+y*Math.cos(angle);return [rx,ry*Math.cos(tilt)-z*Math.sin(tilt),ry*Math.sin(tilt)+z*Math.cos(tilt)];};
 const faces:{points:string;depth:number;color:string;light:number}[]=[];
 for(const p of animalParts(card)){
  const vertices=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(([x,y,z])=>project([p.x+x*p.w/2,p.y+y*p.d/2,p.z+z*p.h/2]));
  for(const [indices,normal,light] of [ [[4,5,6,7],[0,0,1],1.12],[[0,1,2,3],[0,0,-1],.65],[[0,1,5,4],[0,-1,0],.94],[[3,2,6,7],[0,1,0],.8],[[0,3,7,4],[-1,0,0],.76],[[1,2,6,5],[1,0,0],.88] ] as [number[],number[],number][]){
   if(project(normal)[2]<=0)continue;const points=indices.map(i=>vertices[i]);faces.push({points:points.map(v=>`${v[0].toFixed(2)},${v[1].toFixed(2)}`).join(' '),depth:points.reduce((n,v)=>n+v[2],0)/4,color:p.color,light});
  }
 }
 const html=`<g class="hm-pattern-animal" data-animal="${ANIMAL[card].animal}">${faces.sort((a,b)=>a.depth-b.depth).map(f=>`<polygon points="${f.points}" fill="${f.color}" style="filter:brightness(${f.light})"/>`).join('')}</g>`;
 diagramModels.set(key,html);return html;
}
