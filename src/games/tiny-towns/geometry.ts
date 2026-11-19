import {card,LETTERS} from './data.js';
import type {BuildOption,Cell,TinyPlayer,TinyState} from './types.js';
export const adjacent=(a:number,b:number)=>Math.abs(a%4-b%4)+Math.abs(Math.floor(a/4)-Math.floor(b/4))===1;
export const sameLine=(a:number,b:number)=>a%4===b%4||Math.floor(a/4)===Math.floor(b/4);
export const building=(cell:Cell)=>cell&&'building'in cell?cell:undefined;
export const has=(p:TinyPlayer,id:string)=>p.board.some(c=>building(c)?.building===id);
export function orientations(pattern:string[]){
 const points=pattern.flatMap((row,y)=>[...row].flatMap((r,x)=>r==='.'?[]:[{x,y,r}])),result:{x:number;y:number;r:string}[][]=[];const seen=new Set<string>();
 for(let mirror=0;mirror<2;mirror++)for(let rotation=0;rotation<4;rotation++){
  const ps=points.map(p=>{let x=p.x*(mirror?-1:1),y=p.y;for(let n=0;n<rotation;n++)[x,y]=[-y,x];return {...p,x,y};});
  const minX=Math.min(...ps.map(p=>p.x)),minY=Math.min(...ps.map(p=>p.y));ps.forEach(p=>{p.x-=minX;p.y-=minY;});ps.sort((a,b)=>a.y-b.y||a.x-b.x);const key=JSON.stringify(ps);if(!seen.has(key)){seen.add(key);result.push(ps);}
 }return result;
}
export function getBuilds(s:TinyState,p:TinyPlayer):BuildOption[]{
 const result:BuildOption[]=[],seen=new Set<string>();
 for(const id of [...s.cards,...(p.monument&&!has(p,p.monument)?[p.monument]:[])]){
  if(id==='bank'&&p.board.filter(c=>building(c)?.building==='bank').length>=5)continue;
  for(const shape of orientations(card(id).pattern))for(let oy=0;oy<4;oy++)for(let ox=0;ox<4;ox++){
   if(shape.some(q=>q.x+ox>3||q.y+oy>3))continue;
   const cells=shape.map(q=>(q.y+oy)*4+q.x+ox);
   if(shape.some((q,i)=>{const c=p.board[cells[i]];return !c||!('resource'in c&&c.resource===LETTERS[q.r])&&building(c)?.building!=='trading-post';}))continue;
   const real=cells.filter(i=>p.board[i]&&'resource'in p.board[i]!);if(!real.length)continue;
   const destinations=id==='shed'||has(p,'obelisk')?p.board.flatMap((c,i)=>!c||real.includes(i)?[i]:[]):real;
   const key=id+':'+[...cells].sort((a,b)=>a-b).join(',');if(seen.has(key))continue;seen.add(key);result.push({card:id,cells:[...cells].sort((a,b)=>a-b),destinations});
  }
 }return result;
}
