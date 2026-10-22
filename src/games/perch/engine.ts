import {COLORS,type Color,type Tile,type PerchState as State,type PerchAction as Action,type PerchView,type Creature,type LocationId,type Task,type Target,type Breakdown} from './types.js';
import {LOCATION,ANIMAL,zero,makeTiles,adjacent,DIRECTIONS,fountainLayout} from './data.js';
const clone=<T>(x:T):T=>structuredClone(x);
const tile=(s:State,id:LocationId)=>s.tiles.find(t=>t.id===id)!;
export const size=(t:Tile,c:Color)=>t.birds[c]+(t.nests.includes(c)?1:0)+(t.houses.includes(c)?1:0);
export const total=(t:Tile)=>COLORS.reduce((a,c)=>a+size(t,c),0);
export function rankings(t:Tile){return COLORS.filter(c=>size(t,c)>0).map(color=>({color,count:size(t,color),rank:COLORS.filter(c=>size(t,c)>size(t,color)).length,tied:COLORS.some(c=>c!==color&&size(t,c)===size(t,color))})).sort((a,b)=>a.rank-b.rank);}
export const controller=(t:Tile)=>rankings(t).find(r=>r.rank===0&&!r.tied)?.color;
const playerColor=(s:State,c:Color)=>s.players.find(p=>p.color===c);
export const turnPlayer=(s:State)=>s.queue.length&&'actor' in s.queue[0]?s.queue[0].actor:s.order[s.active];
function rand(rng:()=>number,n:number){const r=rng();if(!Number.isFinite(r)||r<0||r>=1)throw Error('แหล่งสุ่มไม่ถูกต้อง');return Math.floor(r*n);}
function shuffle<T>(a:T[],rng:()=>number){for(let i=a.length-1;i>0;i--){const j=rand(rng,i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
export function createInitialState(seats:{id:string;name:string}[],rng:()=>number=Math.random,starter?:string):State{
 if(seats.length<2||seats.length>5||new Set(seats.map(p=>p.id)).size!==seats.length||seats.some(p=>!p.id||typeof p.name!=='string'))throw Error('Perch ใช้ผู้เล่น 2–5 คน');
 const players=seats.map((p,i)=>({...p,color:COLORS[i],hand:[],score:0,arrived:i,house:false,zap:false})),start=starter===undefined?0:players.findIndex(p=>p.id===starter);if(start<0)throw Error('ไม่พบผู้เริ่มเกม');
 const order=players.map(p=>p.id);order.push(...order.splice(0,start));order.forEach((id,i)=>players.find(p=>p.id===id)!.arrived=i);
 const tiles=makeTiles(seats.length),roost=zero();for(const p of players)roost[p.color]=28;const neutral=players.length===2?'yellow':undefined;if(neutral)roost[neutral]=28;
 const s:State={phase:'perch',players,neutral,roost,bag:[],tiles,animals:tiles.filter(t=>LOCATION[t.id].creature).map(t=>({id:LOCATION[t.id].creature!,home:t.id,at:null,owner:null,used:false})),fountain:fountainLayout(players.length).map(()=>null),plaza:zero(),order,active:0,round:1,placed:false,bonusUsed:false,queue:[],sequence:0,clock:players.length,history:[],winners:[]};beginRound(s,rng);stabilize(s,rng);return s;
}
function take(s:State,c:Color,n:number){const got=Math.min(n,s.roost[c]);s.roost[c]-=got;return Array<Color>(got).fill(c);}
function beginRound(s:State,rng:()=>number){
 s.placed=false;s.bonusUsed=false;s.active=0;
 for(const p of s.players){if(p.hand.length)throw Error('มือรอบก่อนยังไม่หมด');if(s.round===4)p.house=true;if(s.round===5)p.zap=true;s.bag.push(...take(s,p.color,2));}
 if(s.neutral)s.bag.push(...take(s,s.neutral,s.round===1?4:2));
 const early=s.tiles.find(t=>t.id==='early'),owner=early&&playerColor(s,controller(early)!);if(owner)s.bag.push(...take(s,owner.color,1));shuffle(s.bag,rng);
 const bath=s.tiles.find(t=>t.id==='birdbath'),first=bath&&playerColor(s,controller(bath)!);
 s.queue=[{kind:'recruit',ids:first?[first.id,...s.order.filter(id=>id!==first.id)]:[...s.order]}];
}
function nestOptions(t:Tile,c:Color){if(t.nests.includes(c))return [t.nests.indexOf(c)];return [null,...t.nests.flatMap((n,i)=>n===null?[i]:[])];}
function add(s:State,id:LocationId,c:Color,nest:number|null){const t=tile(s,id);t.birds[c]++;if(nest!==null)t.nests[nest]=c;}
function remove(s:State,t:Tile,c:Color){t.birds[c]--;if(!t.birds[c]){t.nests=t.nests.map(n=>n===c?null:n);}}
function eligible(t:Tile){return COLORS.filter(c=>t.birds[c]>0&&!t.houses.includes(c));}
function actorFor(s:State,c:Color,causer:string){return playerColor(s,c)?.id??causer;}
function sendFountain(s:State,t:Tile,c:Color,causer:string,cause:string){remove(s,t,c);s.queue.push({kind:'fountain',color:c,actor:actorFor(s,c,causer),cause});}
function sendMove(s:State,t:Tile,c:Color,to:LocationId,causer:string){remove(s,t,c);const dest=tile(s,to);if(dest.nests.some(n=>n===null)&&!dest.nests.includes(c))s.queue.push({kind:'nest',color:c,tile:to,actor:actorFor(s,c,causer),cause:'เลือกวางนกที่ถูกย้ายลงรังหรือพื้น'});else add(s,to,c,dest.nests.includes(c)?dest.nests.indexOf(c):null);}
export function junctions(s:State):LocationId[][]{const out:LocationId[][]=[];for(let i=0;i<s.tiles.length;i++)for(let j=i+1;j<s.tiles.length;j++)for(let k=j+1;k<s.tiles.length;k++){const [a,b,c]=[s.tiles[i],s.tiles[j],s.tiles[k]];if(adjacent(a,b)&&adjacent(a,c)&&adjacent(b,c))out.push([a.id,b.id,c.id]);}return out;}
function moves(s:State,id:Creature):LocationId[][]{const a=s.animals.find(a=>a.id===id)!;if(!a.at)return [];const from=tile(s,a.at),near=s.tiles.filter(t=>adjacent(from,t));if(id==='scarecrow')return a.junction?[[]]:[];if(id==='hawk')return s.tiles.filter(t=>t.id!==a.at).map(t=>[t.id]);if(id==='fox')return near.flatMap(t=>s.tiles.filter(u=>u.id!==a.at&&adjacent(t,u)).map(u=>[t.id,u.id]));if(id==='cat'){const max=Math.max(...near.map(total));return near.filter(t=>total(t)===max).map(t=>[t.id]);}return near.map(t=>[t.id]);}
export function fountainLegal(s:State){return fountainLayout(s.players.length).filter(c=>s.fountain[c.id]===null&&c.needs.every(i=>s.fountain[i]!==null)).map(c=>c.id);}
function bonusActions(s:State,id:string):Action[]{const p=s.players.find(p=>p.id===id)!;if(s.bonusUsed)return [];const out:Action[]=[];for(const t of s.tiles){if(p.house)out.push(...COLORS.filter(c=>t.birds[c]>0&&!t.houses.includes(c)).map(color=>({type:'perch-house' as const,tile:t.id,color})));if(p.zap){out.push(...eligible(t).map(color=>({type:'perch-zap' as const,tile:t.id,color})));out.push(...t.nests.flatMap((n,nest)=>n===null?[{type:'perch-zap-nest' as const,tile:t.id,nest}]:[]));}}
 for(const a of s.animals.filter(a=>a.owner===id&&!a.used))out.push(...moves(s,a.id).map(path=>({type:'perch-activate' as const,creature:a.id,path})));return out;
}
function combinations(groups:Target[][]):Target[][]{return groups.reduce<Target[][]>((a,b)=>a.flatMap(xs=>b.map(x=>[...xs,x])),[[]]);}
function effectActions(s:State,q:Extract<Task,{kind:'effect'}>):Action[]{const a=s.animals.find(a=>a.id===q.creature)!,at=tile(s,a.at!),targets=eligible(at).map(color=>({tile:at.id,color})),out:Action[]=[];
 if(q.creature==='fox'){const groups=q.path.map(id=>eligible(tile(s,id)).map(color=>({tile:id,color}))).filter(xs=>xs.length);if(groups.length)out.push(...combinations(groups).map(targets=>({type:'perch-effect' as const,targets})));}
 else if(q.creature==='scarecrow'){const ts=s.tiles.filter(t=>a.junction?.includes(t.id));for(let i=0;i<ts.length;i++)for(let j=i+1;j<ts.length;j++)for(const c of eligible(ts[i]))for(const d of eligible(ts[j]))out.push({type:'perch-effect',targets:[{tile:ts[i].id,color:c},{tile:ts[j].id,color:d}]});}
 else if(q.creature==='cat'&&q.path.length===0){for(const target of targets)for(const to of s.tiles.filter(t=>adjacent(at,t)&&!t.houses.includes(target.color)))out.push({type:'perch-effect',targets:[target],to:to.id});}
 else if(q.creature==='dog'){for(const target of targets){for(const to of s.tiles.filter(t=>adjacent(at,t)&&!t.houses.includes(target.color)))out.push({type:'perch-effect',targets:[target],to:to.id});if(DIRECTIONS.some(([x,y])=>!s.tiles.some(t=>t.x===at.x+x&&t.y===at.y+y)))out.push({type:'perch-effect',targets:[target],to:'fountain'});}}
 else out.push(...targets.map(target=>({type:'perch-effect' as const,targets:[target],to:'fountain' as const})));
 return q.creature==='cat'&&q.path.length===0&&out.length?out:[...out,{type:'perch-skip'}];
}
export function getLegalActions(s:State,id:string):Action[]{if(s.phase==='finished'||!s.players.some(p=>p.id===id)||turnPlayer(s)!==id)return [];const q=s.queue[0];if(q){switch(q.kind){case 'fountain':return fountainLegal(s).map(cell=>({type:'perch-fountain',cell}));case 'nest':return nestOptions(tile(s,q.tile),q.color).map(nest=>({type:'perch-nest',nest}));case 'scarecrow':return junctions(s).map(tiles=>({type:'perch-scarecrow',tiles}));case 'return':return [...new Set(q.colors)].map(color=>({type:'perch-return',color}));case 'effect':return effectActions(s,q);default:return [];}}
 const p=s.players.find(p=>p.id===id)!,out=bonusActions(s,id);if(s.placed)out.push({type:'perch-end'});else for(const color of new Set(p.hand))for(const t of s.tiles)if(!t.houses.includes(color))for(const nest of nestOptions(t,color))out.push({type:'perch-place',color,tile:t.id,nest});return out;
}
function award(s:State,id:string,points:number){if(!points)return;const p=s.players.find(p=>p.id===id)!;p.score+=points;p.arrived=s.clock++;}
function upkeep(s:State){const round={round:s.round,tiles:{} as Record<string,Record<string,number>>,totals:Object.fromEntries(s.players.map(p=>[p.id,0]))};for(const t of s.tiles){const awards:Record<string,number>={};for(const r of rankings(t))if(!r.tied&&r.rank<3){const p=playerColor(s,r.color);if(p){const pts=LOCATION[t.id].points[r.rank];award(s,p.id,pts);awards[p.id]=pts;round.totals[p.id]+=pts;}}round.tiles[t.id]=awards;}s.history.push(round);s.order.sort((a,b)=>{const p=s.players.find(p=>p.id===a)!,q=s.players.find(p=>p.id===b)!;return q.score-p.score||p.arrived-q.arrived;});s.animals.forEach(a=>a.used=false);s.queue=[{kind:'upkeep',index:0}];}
export function largest(s:State,c:Color){return Math.max(0,...s.tiles.map(t=>size(t,c)));}
function finish(s:State){for(const c of s.bag)s.plaza[c]++;s.bag=[];const allColors=[...s.players.map(p=>p.color),...s.neutral?[s.neutral]:[]],best=Math.max(...allColors.map(c=>largest(s,c))),leaders=allColors.filter(c=>largest(s,c)===best);const final:Record<string,Breakdown>={};for(const p of s.players){const result:Breakdown={rounds:p.score,largest:leaders.length===1&&leaders[0]===p.color?10:0,creatures:s.animals.filter(a=>a.owner===p.id).length*3,fountain:fountainLayout(s.players.length).filter(c=>s.fountain[c.id]===p.color).reduce((a,c)=>a+c.points,0),plaza:s.plaza[p.color],total:0};result.total=result.rounds+result.largest+result.creatures+result.fountain+result.plaza;p.score=result.total;final[p.id]=result;}s.final=final;const top=Math.max(...s.players.map(p=>p.score)),ties=s.players.filter(p=>p.score===top),flock=Math.max(...ties.map(p=>largest(s,p.color))),ties2=ties.filter(p=>largest(s,p.color)===flock),birds=Math.max(...ties2.map(p=>s.fountain.filter(c=>c===p.color).length));s.winners=ties2.filter(p=>s.fountain.filter(c=>c===p.color).length===birds).map(p=>p.id);s.phase='finished';}
function stabilize(s:State,rng:()=>number){for(let guard=0;guard<200;guard++){
 const q=s.queue[0];if(q){s.phase='decision';
 if(q.kind==='recruit'){s.queue.shift();const [id,...remaining]=q.ids;if(!id){s.phase='perch';continue;}const p=s.players.find(p=>p.id===id)!,bath=s.tiles.find(t=>t.id==='birdbath'),bonus=bath&&controller(bath)===p.color;const drawn=s.bag.splice(0,bonus?3:2);p.hand.push(...take(s,p.color,2),...drawn);s.queue.push(...bonus&&drawn.length>2?[{kind:'return' as const,actor:id,colors:drawn}]:[],{kind:'recruit',ids:remaining});continue;}
 if(q.kind==='fountain'&&!fountainLegal(s).length){s.queue.shift();s.plaza[q.color]++;continue;}
 if(q.kind==='upkeep'){s.queue.shift();const t=s.tiles[q.index];if(!t){s.queue.push({kind:'next-round'});continue;}const c=controller(t),p=c&&playerColor(s,c),a=s.animals.find(a=>a.home===t.id);if(a){const old=a.owner;a.owner=p?.id??null;if(a.owner&&!a.at)a.at=a.home;if(a.id==='scarecrow'&&a.owner&&a.owner!==old)s.queue.push({kind:'scarecrow',actor:a.owner});}if(t.id==='hanging'&&total(t)>=4)for(const c of COLORS.filter(c=>!t.houses.includes(c))){if(c===s.neutral)s.roost[c]+=t.birds[c];else s.plaza[c]+=t.birds[c];t.birds[c]=0;t.nests=t.nests.map(n=>n===c?null:n);}s.queue.push({kind:'upkeep',index:q.index+1});continue;}
 if(q.kind==='next-round'){s.queue.shift();if(s.round===5){finish(s);return;}s.round++;beginRound(s,rng);continue;}
 return;
 }
 s.phase='perch';const id=s.order[s.active];if(s.players.every(p=>!p.hand.length)){if(s.placed&&!s.bonusUsed&&bonusActions(s,id).length)return;upkeep(s);continue;}
 const p=s.players.find(p=>p.id===id)!;if(!p.hand.length&&!s.placed){s.active=(s.active+1)%s.order.length;continue;}
 if(s.placed&&(s.bonusUsed||bonusActions(s,id).length===0)){s.active=(s.active+1)%s.order.length;s.placed=false;s.bonusUsed=false;continue;}return;
 }throw Error('ไม่สามารถจัดคิวการเล่นได้');}
const signature=(x:unknown):string=>Array.isArray(x)?'['+x.map(signature).join(',')+']':x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+signature((x as Record<string,unknown>)[k])).join(',')+'}':JSON.stringify(x);
export function applyAction(state:State,id:string,action:Action,rng:()=>number=Math.random):State{
 if(!action||typeof action!=='object'||Array.isArray(action)||!getLegalActions(state,id).some(a=>signature(a)===signature(action)))throw Error('เลือกการกระทำที่ทำได้ในตาปัจจุบันของคุณ');
 const s=clone(state),p=s.players.find(p=>p.id===id)!,q=s.queue[0];s.sequence++;s.last={kind:action.type,actor:id};
 switch(action.type){
 case 'perch-place':p.hand.splice(p.hand.indexOf(action.color),1);add(s,action.tile,action.color,action.nest);s.placed=true;s.last={kind:action.type,actor:id,tile:action.tile,color:action.color};break;
 case 'perch-end':s.bonusUsed=true;break;
 case 'perch-house':p.house=false;tile(s,action.tile).houses.push(action.color);s.bonusUsed=true;break;
 case 'perch-zap':p.zap=false;s.bonusUsed=true;sendFountain(s,tile(s,action.tile),action.color,id,'ถูกสายฟ้าส่งไปน้ำพุ');break;
 case 'perch-zap-nest':p.zap=false;s.bonusUsed=true;tile(s,action.tile).nests[action.nest]='removed';break;
 case 'perch-activate':{s.bonusUsed=true;const a=s.animals.find(a=>a.id===action.creature)!;a.used=true;if(action.path.length)a.at=action.path.at(-1)!;s.queue.push({kind:'effect',creature:a.id,actor:id,path:action.path});break;}
 case 'perch-skip':s.queue.shift();break;
 case 'perch-effect':{if(q.kind!=='effect')throw Error('คิวไม่ถูกต้อง');s.queue.shift();for(const target of action.targets){const t=tile(s,target.tile);if(action.to&&action.to!=='fountain')sendMove(s,t,target.color,action.to,id);else sendFountain(s,t,target.color,id,'ผลจาก '+ANIMAL[q.creature].name);}if(q.creature==='cat'&&q.path.length)s.queue.push({kind:'effect',creature:'cat',actor:id,path:[]});break;}
 case 'perch-fountain':if(q.kind!=='fountain')throw Error('คิวไม่ถูกต้อง');s.queue.shift();s.fountain[action.cell]=q.color;break;
 case 'perch-nest':if(q.kind!=='nest')throw Error('คิวไม่ถูกต้อง');s.queue.shift();add(s,q.tile,q.color,action.nest);break;
 case 'perch-scarecrow':s.queue.shift();s.animals.find(a=>a.id==='scarecrow')!.junction=action.tiles;break;
 case 'perch-return':s.queue.shift();p.hand.splice(p.hand.indexOf(action.color),1);s.bag.push(action.color);shuffle(s.bag,rng);break;
 }
 stabilize(s,rng);return s;
}
const prompt=(s:State):PerchView['prompt']=>{const q=s.queue[0];if(!q||!('actor' in q))return undefined;return {actor:q.actor,kind:q.kind,text:q.kind==='fountain'?q.cause:q.kind==='nest'?q.cause:q.kind==='scarecrow'?'เลือกจุดยืนหุ่นไล่กา':q.kind==='return'?'เลือกนก 1 ตัวคืนถุงอพยพ':'เลือกผลของ '+ANIMAL[q.creature].name};};
export function getDisplayView(s:State,code:string,revision:number):PerchView{return {gameId:'perch',code,revision,phase:s.phase,round:s.round,turn:s.phase==='finished'?undefined:turnPlayer(s),active:s.order[s.active],sequence:s.sequence,order:[...s.order],players:s.players.map(p=>({id:p.id,name:p.name,color:p.color,score:p.score,handCount:p.hand.length})),tiles:clone(s.tiles),animals:clone(s.animals),fountain:[...s.fountain],plaza:{...s.plaza},neutral:s.neutral,winners:[...s.winners],final:clone(s.final),prompt:prompt(s),last:clone(s.last)};}
export function getPlayerView(s:State,id:string){const p=s.players.find(p=>p.id===id);if(!p)throw Error('ไม่พบผู้เล่น');return {id,color:p.color,hand:[...p.hand],roost:s.roost[p.color],house:p.house,zap:p.zap,placed:s.placed&&s.order[s.active]===id,bonusUsed:s.bonusUsed&&s.order[s.active]===id,legal:getLegalActions(s,id)};}
export function getPhoneView(s:State,id:string,code:string,revision:number):PerchView{const p=s.players.find(p=>p.id===id);if(!p)throw Error('ไม่พบผู้เล่น');const v=getDisplayView(s,code,revision);v.me=getPlayerView(s,id);v.players=v.players.map(other=>other.id===id?other:{id:other.id,name:other.name,color:other.color});v.tiles=v.tiles.map(t=>({...t,birds:{...zero(),[p.color]:t.birds[p.color]},nests:t.nests.map(c=>c===p.color?c:c==='removed'?'removed':null),houses:t.houses.filter(c=>c===p.color)}));v.fountain=v.fountain.map(c=>c===null||c===p.color?c:'occupied');v.plaza={[p.color]:s.plaza[p.color]};if(v.final)v.final={[id]:v.final[id]};if(v.last?.actor!==id)delete v.last;return v;}
export const isFinished=(s:State)=>s.phase==='finished';

export function calculateFinal(state:State){const s=clone(state);for(const p of s.players)p.score=s.history.reduce((a,h)=>a+(h.totals[p.id]??0),0);finish(s);return {final:s.final!,winners:s.winners};}
