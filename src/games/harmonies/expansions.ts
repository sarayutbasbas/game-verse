import {ANIMAL,neighbors,terrain} from './data.js';
import type {HarmoniesOptions,Player,Side} from './types.js';
export function optionsFor(input?:Partial<HarmoniesOptions>):HarmoniesOptions{
 if(input!==undefined&&(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['solo','natureSpirits','whispers'].includes(k))||Object.values(input).some(v=>typeof v!=='boolean')))throw Error('ตัวเลือกโหมด Harmonies ไม่ถูกต้อง');
 return {solo:input?.solo??false,natureSpirits:input?.natureSpirits??false,whispers:input?.whispers??false};
}
export function connectedGroups(indices:number[]){const remaining=new Set(indices),out:number[][]=[];while(remaining.size){const todo=[remaining.values().next().value!],group:number[]=[];remaining.delete(todo[0]);while(todo.length){const cell=todo.pop()!;group.push(cell);for(const n of neighbors(cell))if(remaining.delete(n))todo.push(n);}out.push(group);}return out;}
export function spiritPoints(p:Player,card:string){
 const cells=p.board.map((c,i)=>({index:i,height:c.stack.length,top:c.stack.length?terrain(c.stack.at(-1)!):null}));
 const count=(color:string,heights:number[])=>cells.filter(c=>c.top===color&&heights.includes(c.height)).length;
 const groups=(color:string)=>connectedGroups(cells.filter(c=>c.top===color&&(color!=='building'||c.height===2)).map(c=>c.index));
 switch(ANIMAL[card]?.spiritScoring){
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
