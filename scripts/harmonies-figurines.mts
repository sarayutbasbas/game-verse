import {mkdir,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
import {ANIMAL} from '../src/games/harmonies/data.js';
import {animalDiagramModel} from '../src/client/harmonies-animals.js';
// Bake the existing voxel geometry into one transparent image per species.
const out='public/art/harmonies/figurines';await mkdir(out,{recursive:true});
for(const id of Object.keys(ANIMAL)){
 let geometry=animalDiagramModel(id,150,30).replace(/fill="(#[0-9a-f]{6})" style="filter:brightness\(([\d.]+)\)"/gi,(_,hex,factor)=>'fill="#'+[1,3,5].map(i=>Math.min(255,Math.round(parseInt(hex.slice(i,i+2),16)*Number(factor))).toString(16).padStart(2,'0')).join('')+'"');
 const points=[...geometry.matchAll(/points="([^"]+)"/g)].flatMap(m=>m[1].split(' ').map(p=>p.split(',').map(Number)));
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);const x=Math.min(...xs)-2,y=Math.min(...ys)-2,w=Math.max(...xs)-x+2,h=Math.max(...ys)-y+2;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="144" height="168">${geometry}</svg>`;
 await writeFile(`${out}/${id}.webp`,await sharp(Buffer.from(svg)).trim().webp({quality:88}).toBuffer());
}
