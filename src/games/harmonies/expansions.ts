import {boardNeighbors} from './boards.js';
import {ANIMAL,SPIRITS,PROMO_SPIRITS,neighbors,terrain} from './data.js';
import type {HarmoniesOptions,Player,Side} from './types.js';
export function optionsFor(input?:Partial<HarmoniesOptions>):HarmoniesOptions{
 if(input!==undefined&&(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['solo','natureSpirits','whispers','promoTrex','sanctuaries','pulse','cardArt'].includes(k))||Object.entries(input).some(([k,v])=>k==='cardArt'?!['illustrated','sculpted','original'].includes(v as string):typeof v!=='boolean')))throw Error('ตัวเลือกโหมด Harmonies ไม่ถูกต้อง');
 return {solo:input?.solo??false,natureSpirits:!!(input?.natureSpirits||input?.promoTrex),whispers:input?.whispers??false,...input?.promoTrex?{promoTrex:true}:{},...input?.sanctuaries?{sanctuaries:true}:{},...input?.pulse?{pulse:true}:{},...input?.cardArt?{cardArt:input.cardArt}:{}};
}
export const spiritPool=(options:HarmoniesOptions)=>[...SPIRITS,...options.promoTrex?PROMO_SPIRITS:[]];
export function connectedGroups(indices:number[],side:Side='A'){const remaining=new Set(indices),out:number[][]=[];while(remaining.size){const todo=[remaining.values().next().value!],group:number[]=[];remaining.delete(todo[0]);while(todo.length){const cell=todo.pop()!;group.push(cell);for(const n of boardNeighbors(side,cell))if(remaining.delete(n))todo.push(n);}out.push(group);}return out;}
export function spiritPoints(p:Player,card:string,side:Side='A'){
 const cells=p.board.map((c,i)=>({index:i,height:c.stack.length,top:c.stack.length&&!c.sanctuary?terrain(c.stack.at(-1)!):null}));
 const count=(color:string,heights:number[])=>cells.filter(c=>c.top===color&&heights.includes(c.height)).length;
 const groups=(color:string)=>connectedGroups(cells.filter(c=>c.top===color&&(color!=='building'||c.height===2)).map(c=>c.index),side);
 switch(ANIMAL[card]?.spiritScoring){
  case 'animal-connected':{
   const origin=p.board.findIndex(c=>c.cube?.card===card);if(origin<0)return 0;
   const seen=new Set([origin]),todo=[origin];let count=0;
   for(let k=0;k<todo.length;k++)for(const i of boardNeighbors(side,todo[k])){
    const cell=p.board[i],animals=(cell.cube&&!ANIMAL[cell.cube.card]?.kind?1:0)+(cell.sanctuaryCubes?.length??0);
    if(!seen.has(i)&&animals){seen.add(i);todo.push(i);count+=animals;}
   }
   return count*2;
  }
  case 'field-large':return groups('field').reduce((n,g)=>n+(g.length>=3?10:2),0);
  case 'field-groups':return groups('field').length*5;
  case 'tree-tall':return count('leaf',[2,3])*4;
  case 'tree-short':return count('leaf',[1,2])*3+count('leaf',[3]);
  case 'building-groups':return groups('building').length*4;
  case 'building-pairs':return groups('building').filter(g=>g.length>=2).length*6;
  case 'rock-tall':return count('rock',[2,3])*4;
  case 'rock-short':return count('rock',[1,2])*3+count('rock',[3]);
  case 'water-groups':return groups('water').filter(g=>g.length>=2).length*7;
  case 'water-count':return count('water',[1])*2;
  default:return 0;
 }
}
export function soloSuns(p:Player,side:Side,total:number){
 if(side!=='A'&&side!=='B')return undefined;
 const base=[40,70,90,110,130,140,150,160].filter(n=>total>=n).length;
 const spirit=p.cards.find(c=>ANIMAL[c.card].kind==='spirit');
 return base+(side==='A'?1:0)+(spirit?ANIMAL[spirit.card].soloSuns??0:2);
}
