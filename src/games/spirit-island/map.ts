import {BOARDS} from './board-facts.js';
import type {Land,Piece,SpiritPlayer,SpiritState} from './types.js';
export const health=(kind:Piece)=>kind==='city'?3:kind==='explorer'?1:2;
export const isInvader=(kind:Piece)=>kind!=='dahan';
export const land=(s:SpiritState,id:string)=>{const l=s.lands.find(l=>l.id===id);if(!l)throw Error('ไม่พบพื้นที่');return l;};
export const player=(s:SpiritState,id:string)=>{const p=s.players.find(p=>p.id===id);if(!p)throw Error('ไม่ใช่ผู้เล่น');return p;};
export const count=(l:Land,filter:Piece|'invader'|'building'|'small')=>l.units.filter(u=>filter==='invader'?u.kind!=='dahan':filter==='building'?u.kind==='town'||u.kind==='city':filter==='small'?u.kind==='explorer'||u.kind==='town':u.kind===filter).length;
export function activeOcean(s:SpiritState,l:Land){return l.terrain==='ocean'&&s.players.some(p=>p.spirit==='ocean'&&s.lands.some(q=>q.board===l.board&&(q.presence[p.id]??0)>0));}
export function neighbors(s:SpiritState,id:string,powers=true){return land(s,id).neighbors.filter(id=>land(s,id).terrain!=='ocean'||powers&&activeOcean(s,land(s,id)));}
export function distance(s:SpiritState,from:string,to:string,powers=true,oceanGrowth=false){
 if(from===to)return 0;const seen=new Set([from]),queue=[{id:from,d:0}];for(let i=0;i<queue.length;i++)for(const next of land(s,queue[i].id).neighbors){if(seen.has(next))continue;const l=land(s,next);if(l.terrain==='ocean'&&!(powers&&activeOcean(s,l)||oceanGrowth))continue;if(next===to)return queue[i].d+1;seen.add(next);queue.push({id:next,d:queue[i].d+1});}return Infinity;
}
export function presence(s:SpiritState,p:SpiritPlayer,l:Land,targeting=false){return (l.presence[p.id]??0)+(targeting?[...new Set(p.sharedPresence)].reduce((n,id)=>n+(id===p.id?0:l.presence[id]??0),0):0);}
export function sacred(s:SpiritState,p:SpiritPlayer,l:Land,targeting=false){const n=presence(s,p,l,targeting);return n>=2||p.spirit==='river'&&n>=1&&(l.terrain==='wetland'||l.terrain==='ocean'&&activeOcean(s,l));}
export function addUnit(s:SpiritState,l:Land,kind:Piece,damage=0){if(kind==='dahan'&&s.lands.reduce((n,l)=>n+count(l,'dahan'),0)>=36)return undefined;const unit={id:++s.sequence,kind,damage};l.units.push(unit);return unit;}
export function makeMap(boards:string[]):Land[]{
 const lands:Land[]=[];
 for(const board of boards){const b=BOARDS[board as keyof typeof BOARDS];for(const x of b.lands)lands.push({id:board+x.n,board,number:x.n,terrain:x.terrain,coastal:x.n<=3&&x.n!==0,neighbors:x.neighbors.map(n=>board+n),units:[],blight:x.blight,presence:{},defend:0,skip:{ravage:false,build:false,explore:false},dahanHealth:2,dahanSafe:false,ravageSafe:false,warning:false,vitality:false,apparitions:0});}
 // A valid long-island arrangement: alternating top-to-top and bottom-to-bottom joins.
 // Edge marks come from the physical balanced boards. Equal endpoints count as corner adjacency.
 for(let i=0;i<boards.length-1;i++){
  const side=i%2===0?0:2,a=BOARDS[boards[i] as keyof typeof BOARDS].edges.filter(e=>e.side===side),b=BOARDS[boards[i+1] as keyof typeof BOARDS].edges.filter(e=>e.side===side);
  for(const x of a)for(const y of b)if(Math.max(x.start,7-y.end)<=Math.min(x.end,7-y.start)){
   const left=lands.find(l=>l.id===boards[i]+x.land)!,right=lands.find(l=>l.id===boards[i+1]+y.land)!;if(!left.neighbors.includes(right.id))left.neighbors.push(right.id);if(!right.neighbors.includes(left.id))right.neighbors.push(left.id);
  }
 }return lands;
}
export function populate(s:SpiritState){for(const l of s.lands){const facts=BOARDS[l.board as keyof typeof BOARDS].lands.find(x=>x.n===l.number)!;for(const kind of ['dahan','town','city'] as const)for(let i=0;i<facts[kind];i++)addUnit(s,l,kind);}}
