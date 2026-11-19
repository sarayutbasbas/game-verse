import {card,TYPES} from './data.js';
import {adjacent,building,sameLine,has} from './geometry.js';
import type {BuildingType,Score,TinyPlayer,TinyState} from './types.js';
const cells=(p:TinyPlayer,id:string)=>p.board.flatMap((c,i)=>building(c)?.building===id?[i]:[]);
const typeAt=(p:TinyPlayer,i:number):BuildingType|undefined=>{const b=building(p.board[i]);return b?(b.building==='castle'?'cottage':card(b.building).type):undefined;};
const weight=(p:TinyPlayer,i:number)=>building(p.board[i])?.building==='castle'?2:1;
function groups(p:TinyPlayer,positions:number[]){const left=new Set(positions),out:number[][]=[];while(left.size){const group=[left.values().next().value!];left.delete(group[0]);for(let j=0;j<group.length;j++)for(const q of [...left])if(adjacent(group[j],q)){left.delete(q);group.push(q);}out.push(group);}return out;}
function feedOptions(s:TinyState,p:TinyPlayer):number[][] {
 const homes=p.board.flatMap((_,i)=>typeAt(p,i)==='cottage'?[i]:[]),food=s.cards.find(id=>card(id).type==='food')!,sources=cells(p,food);if(!sources.length)return [[]];
 if(food==='granary')return [homes.filter(i=>sources.some(j=>Math.abs(i%4-j%4)<=1&&Math.abs(Math.floor(i/4)-Math.floor(j/4))<=1))];
 if(food==='orchard')return [homes.filter(i=>sources.some(j=>sameLine(i,j)))];
 if(food==='greenhouse'){
  const gs=groups(p,homes);if(gs.length<=sources.length)return [homes];const result:number[][]=[];const choose=(start:number,selected:number[])=>{if(selected.length===sources.length){result.push(selected.flatMap(j=>gs[j]));return;}for(let i=start;i<gs.length;i++)choose(i+1,[...selected,i]);};choose(0,[]);return result;
 }
 // Feeding is a choice. Enumerate maximal subsets, retaining Castle's two-Cottage capacity.
 const capacity=sources.length*4;if(homes.reduce((n,i)=>n+weight(p,i),0)<=capacity)return [homes];
 const result:number[][]=[];for(let mask=0;mask<2**homes.length;mask++){const fed=homes.filter((_,j)=>mask&(1<<j)),used=fed.reduce((n,i)=>n+weight(p,i),0);if(used<=capacity&&homes.every(i=>fed.includes(i)||used+weight(p,i)>capacity))result.push(fed);}return result;
}
export function scorePlayer(s:TinyState,p:TinyPlayer):Score {
 const count=(id:string)=>cells(p,id).length,counts=(type:BuildingType)=>p.board.filter((_,i)=>typeAt(p,i)===type).length;
 const empty=p.board.filter(c=>!building(c)).length,penalty=has(p,'cathedral')?0:-empty;
 const calculate=(fed:number[]):Score=>{
  const items:Score['items']=[];for(const id of [...s.cards,...(p.monument&&has(p,p.monument)?[p.monument]:[])]){
   const positions=cells(p,id),n=positions.length;if(!n)continue;let points=0;
   const around=(i:number)=>p.board.flatMap((_,j)=>adjacent(i,j)?[j]:[]);
   switch(id){
    case 'cottage':points=positions.filter(i=>fed.includes(i)||has(p,'mausoleum')).length*3;break;
    case 'well':points=positions.reduce((sum,i)=>sum+around(i).filter(j=>typeAt(p,j)==='cottage').reduce((n,j)=>n+weight(p,j),0),0);break;
    case 'shed':case 'trading-post':points=n;break;
    case 'fountain':points=positions.filter(i=>around(i).some(j=>building(p.board[j])?.building===id)).length*2;break;
    case 'millstone':points=positions.filter(i=>around(i).some(j=>['food','yellow'].includes(typeAt(p,j)??''))).length*2;break;
    case 'chapel':points=n*fed.reduce((n,i)=>n+weight(p,i),0);break;
    case 'abbey':points=positions.filter(i=>!around(i).some(j=>['green','yellow','black'].includes(typeAt(p,j)??''))).length*3;break;
    case 'cloister':points=n*positions.filter(i=>[0,3,12,15].includes(i)).length;break;
    case 'temple':points=positions.filter(i=>around(i).filter(j=>fed.includes(j)).reduce((n,j)=>n+weight(p,j),0)>=2).length*4;break;
    case 'tavern':points=[0,2,5,9,14,20][Math.min(5,n)];break;
    case 'almshouse':points=[0,-1,5,-3,15,-5,26][Math.min(6,n)];break;
    case 'feast-hall':{const right=s.players[(s.players.indexOf(p)+s.players.length-1)%s.players.length];points=n*(n>countFor(right,id)?3:2);break;}
    case 'inn':points=positions.filter(i=>!positions.some(j=>j!==i&&sameLine(i,j))).length*3;break;
    case 'theater':points=positions.reduce((n,i)=>n+new Set(p.board.flatMap((_,j)=>sameLine(i,j)&&typeAt(p,j)&&typeAt(p,j)!=='yellow'?[typeAt(p,j)]:[])).size,0);break;
    case 'bakery':points=positions.filter(i=>around(i).some(j=>['food','black'].includes(typeAt(p,j)??''))).length*3;break;
    case 'market':points=positions.reduce((n,i)=>n+Math.max(positions.filter(j=>j%4===i%4).length,positions.filter(j=>Math.floor(j/4)===Math.floor(i/4)).length),0);break;
    case 'tailor':points=positions.reduce((sum,i)=>sum+1+positions.filter(j=>j!==i&&[5,6,9,10].includes(j)).length,0);break;
    case 'bank':points=n*4;break;
    case 'warehouse':points=-positions.reduce((n,i)=>n+(building(p.board[i])?.stored?.length??0),0);break;
    case 'guild':points=1;break;
    case 'archive':points=new Set(p.board.flatMap((_,i)=>typeAt(p,i)&&typeAt(p,i)!=='monument'?[typeAt(p,i)]:[])).size;break;
    case 'castle':points=fed.includes(positions[0])?5:0;break;
    case 'cathedral':points=2;break;
    case 'fort':points=7;break;
    case 'university':points=3;break;
    case 'palace':points=2*new Set(around(positions[0]).map(i=>typeAt(p,i)).filter(Boolean)).size;break;
    case 'shrine':points=p.shrine??0;break;
    case 'forum':points=1+Math.max(0,...TYPES.map(type=>Math.max(0,...groups(p,p.board.flatMap((_,i)=>typeAt(p,i)===type?[i]:[])).map(g=>g.reduce((n,i)=>n+weight(p,i),0)))));break;
    case 'baths':points=2*TYPES.filter(t=>t!=='monument'&&!counts(t)).length;break;
    case 'starloom':{const rank=p.doneRound===undefined?0:1+s.players.filter(o=>o.doneRound!==undefined&&o.doneRound<p.doneRound!).length;points=rank?[0,6,3,2][Math.min(4,rank)]??0:0;break;}
   }items.push({card:id,count:n,points});
  }return {total:items.reduce((n,i)=>n+i.points,penalty),empty,penalty,fed,cottages:counts('cottage')+count('castle'),items};
 };
 let best=calculate([]);for(const fed of feedOptions(s,p)){const value=calculate(fed);if(value.total>best.total||value.total===best.total&&fed.length>best.fed.length)best=value;}return best;
}
const countFor=(p:TinyPlayer,id:string)=>p.board.filter(c=>building(c)?.building===id).length;
export function winners(s:TinyState){const ranked=s.players.map(p=>({p,score:scorePlayer(s,p)})).sort((a,b)=>b.score.total-a.score.total||a.p.masterTurns-b.p.masterTurns||a.score.empty-b.score.empty||b.score.cottages-a.score.cottages);const top=ranked[0];return ranked.filter(x=>x.score.total===top.score.total&&x.p.masterTurns===top.p.masterTurns&&x.score.empty===top.score.empty&&x.score.cottages===top.score.cottages).map(x=>x.p.id);}
