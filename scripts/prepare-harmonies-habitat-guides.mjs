import fs from 'node:fs/promises';import sharp from 'sharp';import {resolve} from 'node:path';
const root='data/harmonies-habitat-v4';await fs.mkdir(root+'/guides',{recursive:true});await fs.mkdir(root+'/jobs',{recursive:true});
const cards=(await Promise.all(['catalog','spirits','promos','whispers'].map(async f=>JSON.parse(await fs.readFile(`src/games/harmonies/${f}.json`,'utf8'))))).flat();
const colors={water:'#228fae',rock:'#858884',wood:'#965e37',leaf:'#819b3e',field:'#e7b834',building:'#c75050'};
const terrainNames={water:'blue water',rock:'grey rock',wood:'brown wood',leaf:'green leaf',field:'yellow field',building:'red building'};
const jobs=[];for(const c of cards){
 const cells=c.pattern.map(p=>({...p,display:p.stack[0]==='building'&&(c.kind!=='whisper'||p.stack.length===2)?['rock','building']:p.stack,x:p.q*150,y:(p.r+p.q/2)*140}));
 const minX=Math.min(...cells.map(p=>p.x))-80,maxX=Math.max(...cells.map(p=>p.x))+80,minY=Math.min(...cells.map(p=>p.y-p.display.length*25))-80,maxY=Math.max(...cells.map(p=>p.y))+130;
 const shape=(t,x,y)=>`<ellipse cx="${x}" cy="${y+24}" rx="58" ry="31" fill="${colors[t]}"/><path d="M${x-58} ${y}v24a58 31 0 0 0 116 0v-24" fill="${colors[t]}" stroke="#0002"/><ellipse cx="${x}" cy="${y}" rx="58" ry="31" fill="${colors[t]}" stroke="#fff5d8" stroke-width="2"/>`;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="${minX} ${minY} ${maxX-minX} ${maxY-minY}"><rect x="${minX}" y="${minY}" width="${maxX-minX}" height="${maxY-minY}" fill="#fffbed"/>${cells.map((p,i)=>`<g><path d="M${p.x-72} ${p.y+36}l36 -39h72l36 39 -36 39h-72Z" fill="#f7df9d" stroke="#c7a465" stroke-width="3"/>${p.display.map((t,k)=>shape(t,p.x,p.y-k*25)).join('')}${p.cube?`<path d="m${p.x} ${p.y-p.display.length*25-26} 21 12v25l-21 12 -21 -12v-25Z" fill="#f5a82c" stroke="#ffe59b" stroke-width="2"/><path d="m${p.x} ${p.y-p.display.length*25-26} 21 12 -21 13 -21 -13Z" fill="#ffca50"/>`:''}<text x="${p.x}" y="${p.y+105}" font-size="19" font-family="sans-serif" text-anchor="middle" fill="#173e3c">${i+1}: ${p.display.join('+')}</text></g>`).join('')}</svg>`;
 await sharp(Buffer.from(svg)).png().toFile(`${root}/guides/${c.id}.png`);
 const xs=cells.map(p=>p.q),ys=cells.map(p=>p.r+p.q/2),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
 const desc=cells.map((p,i)=>`Position ${i+1}: ${p.x/150<cx-.2?'LEFT':p.x/150>cx+.2?'RIGHT':'CENTER'} and ${p.y/140<cy-.2?'UPPER':p.y/140>cy+.2?'LOWER':'MIDDLE'}, ${p.display.length} physical disc(s), exact BOTTOM-TO-TOP colors [${p.display.map(t=>terrainNames[t]).join(', ')}]${p.cube?', with ONE tiny orange animal cube centered on top':', no cube'}`).join('; ');
 jobs.push({...c,displayPattern:cells.map(p=>({q:p.q,r:p.r,stack:p.display,cube:p.cube})),diagramDescription:desc,guide:resolve(root,`guides/${c.id}.png`)});
}
await fs.writeFile(root+'/catalog.json',JSON.stringify(jobs,null,2));console.log(`Prepared ${jobs.length} exact habitat references from game catalog.`);
