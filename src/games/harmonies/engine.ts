import {ANIMALS,ANIMAL,SPIRITS,WHISPERS,COORDS,TOKENS,CUBE_COUNT,terrain,neighbors,rotate,cellAt} from './data.js';
import {optionsFor,spiritPoints,soloSuns} from './expansions.js';
import type {HarmoniesState as State,HarmoniesAction as Action,HarmoniesView,Cell,Player,Side,Score,Habitat,Terrain,HarmoniesOptions} from './types.js';
export const emptyPlayer=(id:string,name:string):Player=>({id,name,board:COORDS.map(()=>({stack:[]})),cards:[]});
function shuffle<T>(a:T[],random:()=>number){for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function createInitialState(seats:{id:string;name:string}[],random:()=>number,starter?:string,side:Side='A',input?:Partial<HarmoniesOptions>):State{
 const options=optionsFor(input);
 if(seats.length<(options.solo?1:2)||seats.length>(options.solo?1:4)||new Set(seats.map(p=>p.id)).size!==seats.length||!['A','B'].includes(side))throw Error('Solo สำหรับ 1 คน หรือเล่นร่วมกัน 2–4 คน เลือกกระดาน A หรือ B');
 const first=starter===undefined?Math.floor(random()*seats.length):seats.findIndex(p=>p.id===starter);if(first<0)throw Error('เลือกผู้เริ่มที่อยู่ในห้อง');
 const bag=shuffle([...TOKENS],random),deck=shuffle([...ANIMALS,...(options.whispers?WHISPERS:[])].map(c=>c.id),random);
 const spirits=options.natureSpirits?shuffle(SPIRITS.map(c=>c.id),random):[];
 const spiritDrafts=options.natureSpirits?Object.fromEntries(seats.map(p=>[p.id,spirits.splice(0,2)])):undefined;
 return {options,discardedTokens:[],discardedCards:[],...(spiritDrafts?{spiritDrafts,spiritUnused:spirits,spiritDiscard:[]}:{}),phase:'playing',side,players:seats.map(p=>emptyPlayer(p.id,p.name)),starter:first,turn:first,turnCount:0,bag,groups:Array.from({length:options.solo?3:5},()=>bag.splice(0,3)),deck,market:deck.splice(0,options.solo?3:5),hand:[],picked:false,cardTaken:false,cubeReserve:CUBE_COUNT,sequence:0,event:{kind:'setup'},winners:[]};
}
export function placementReason(cell:Cell,t:Terrain):string|undefined{
 if(cell.cube||cell.whisper)return 'ช่องนี้มีคิวบ์อยู่แล้ว เพิ่มชั้นไม่ได้';
 const stack=cell.stack.map(terrain);if(!stack.length)return;
 if(t==='rock'&&stack.length<3&&stack.every(x=>x==='rock'))return;
 if(t==='wood'&&stack.length===1&&stack[0]==='wood')return;
 if(t==='leaf'&&stack.length<=2&&stack.every(x=>x==='wood'))return;
 if(t==='building'&&stack.length===1&&['building','wood','rock'].includes(stack[0]))return;
 return 'ซ้อนได้เฉพาะหินสูง 1–3 ลำต้นไม่เกิน 2 แล้วปิดพุ่มไม้ หรืออาคารสูง 2';
}
export function patternCells(card:string,origin:number,rotation:number){const at=COORDS[origin];if(!at||!Number.isInteger(rotation)||rotation<0||rotation>5||!ANIMAL[card])return [];return ANIMAL[card].pattern.map(p=>{const v=rotate(p.q,p.r,rotation);return cellAt(at.q+v.q,at.r+v.r);});}
function stackMatches(cell:Cell,stack:Terrain[],whisper=false){const own=cell.stack.map(terrain);if(stack[0]==='building'&&!(whisper&&stack.length===1))return own.length===2&&own[1]==='building'&&['building','wood','rock'].includes(own[0]);return own.length===stack.length&&own.every((t,i)=>t===stack[i]);}
export function habitatMatches(p:Player,card:string,origin:number,rotation:number):Habitat|undefined{
 const c=ANIMAL[card];if(!c)return;const cells=patternCells(card,origin,rotation);if(cells.length!==c.pattern.length||cells.some((i,k)=>i<0||!stackMatches(p.board[i],c.pattern[k].stack,c.kind==='whisper')))return;
 const cell=cells[c.pattern.findIndex(p=>p.cube)];if(c.kind==='whisper'?p.board[cell].whisper:p.board[cell].cube)return;return {card,origin,rotation,cell,cells};
}
export function habitats(p:Player){return p.cards.filter(c=>c.placed<ANIMAL[c.card].points.length).flatMap(c=>COORDS.flatMap((_,origin)=>Array.from({length:6},(_,rotation)=>habitatMatches(p,c.card,origin,rotation)).filter((m):m is Habitat=>!!m)));}
export function getLegalActions(s:State,actor:string):Action[]{
 if(s.phase!=='playing'||s.players[s.turn]?.id!==actor)return [];const p=s.players[s.turn],out:Action[]=[];
 const choices=s.spiritDrafts?.[actor];if(choices?.length)return choices.map(card=>({type:'harmonies-spirit',card}));
 if(s.soloDiscarded)return s.picked&&!s.hand.length?[{type:'harmonies-end'}]:[];
 if(!s.picked)s.groups.forEach((g,group)=>{if(g.length===3)out.push({type:'harmonies-group',group});});
 for(const token of s.hand)p.board.forEach((cell,i)=>{if(!placementReason(cell,terrain(token)))out.push({type:'harmonies-place',token,cell:i});});
 if(!s.cardTaken&&p.cards.filter(c=>c.placed<ANIMAL[c.card].points.length).length<4)out.push(...s.market.map(card=>({type:'harmonies-card' as const,card})));
 out.push(...habitats(p).map(m=>({type:'harmonies-cube' as const,card:m.card,origin:m.origin,rotation:m.rotation})));
 if(s.picked&&!s.hand.length){out.push({type:'harmonies-end'});if(s.options?.solo&&!s.cardTaken&&s.deck.length)out.push(...s.market.map(card=>({type:'harmonies-solo-discard' as const,card})));}return out;
}
function components(indices:number[]){const remaining=new Set(indices),groups:number[][]=[];while(remaining.size){const first=remaining.values().next().value!,todo=[first],group:number[]=[];remaining.delete(first);while(todo.length){const i=todo.pop()!;group.push(i);for(const j of neighbors(i))if(remaining.delete(j))todo.push(j);}groups.push(group);}return groups;}
export function scorePlayer(p:Player,side:Side):Score{
 let trees=0,mountains=0,buildings=0;const top=p.board.map(c=>c.stack.length?terrain(c.stack.at(-1)!):null);
 for(let i=0;i<p.board.length;i++){const c=p.board[i],height=c.stack.length;
  if(top[i]==='leaf')trees+=[0,1,3,7][height]??0;
  if(top[i]==='rock'&&neighbors(i).some(j=>top[j]==='rock'))mountains+=[0,1,3,7][height]??0;
  if(top[i]==='building'&&height===2&&new Set(neighbors(i).map(j=>top[j]).filter(Boolean)).size>=3)buildings+=5;
 }
 const fields=components(top.flatMap((t,i)=>t==='field'?[i]:[])).filter(g=>g.length>=2).length*5;
 const blue=top.flatMap((t,i)=>t==='water'?[i]:[]);let riverLength=0;
 for(const start of blue){const distance=new Map([[start,1]]),todo=[start];for(let k=0;k<todo.length;k++){const i=todo[k];riverLength=Math.max(riverLength,distance.get(i)!);for(const j of neighbors(i))if(top[j]==='water'&&!distance.has(j)){distance.set(j,distance.get(i)!+1);todo.push(j);}}}
 const islands=components(top.flatMap((t,i)=>t!=='water'?[i]:[])).length;
 const water=side==='B'?islands*5:riverLength<=6?[0,0,2,5,8,11,15][riverLength]:15+(riverLength-6)*4;
 const animals=p.cards.filter(c=>!ANIMAL[c.card].kind).map(c=>({card:c.card,placed:c.placed,points:ANIMAL[c.card].points[c.placed-1]??0})),animalTotal=animals.reduce((n,c)=>n+c.points,0),landscape=trees+mountains+fields+buildings+water;
 const spirits=p.cards.filter(c=>ANIMAL[c.card].kind==='spirit').map(c=>({card:c.card,placed:c.placed,points:c.placed?spiritPoints(p,c.card):0})),spiritTotal=spirits.reduce((n,c)=>n+c.points,0);
 const whispers=p.cards.filter(c=>ANIMAL[c.card].kind==='whisper').map(c=>({card:c.card,placed:c.placed,points:p.board.filter(cell=>cell.whisper?.card===c.card).reduce((n,cell)=>n+(cell.cube?5:2),0)})),whisperTotal=whispers.reduce((n,c)=>n+c.points,0);
 return {trees,mountains,fields,buildings,water,animals,landscape,animalTotal,total:landscape+animalTotal+spiritTotal+whisperTotal,cubes:p.board.filter(c=>c.cube&&!ANIMAL[c.cube.card].kind).length,riverLength,islands,...spirits.length?{spirits,spiritTotal}:{},...whispers.length?{whispers,whisperTotal}:{}};
}
export function winningScores(scores:Record<string,Score>){const entries=Object.entries(scores),best=Math.max(...entries.map(([,s])=>s.total)),cubes=Math.max(...entries.filter(([,s])=>s.total===best).map(([,s])=>s.cubes));return entries.filter(([,s])=>s.total===best&&s.cubes===cubes).map(([id])=>id);}
function finish(s:State){s.phase='finished';s.scores=Object.fromEntries(s.players.map(p=>[p.id,scorePlayer(p,s.side)]));s.winners=winningScores(s.scores);s.event.kind='finish';}
export function applyAction(state:State,actor:string,action:Action,_random:()=>number):State{
 if(!action||!getLegalActions(state,actor).some(a=>Object.keys(a).sort().join()===Object.keys(action).sort().join()&&Object.entries(a).every(([k,v])=>(action as any)[k]===v)))throw Error('ทำรายการนี้ไม่ได้ ตรวจคิว ชิ้นส่วน และรูปแบบถิ่นอาศัย');
 const s=structuredClone(state),p=s.players[s.turn];s.sequence++;s.event={kind:'turn',actor};
 if(action.type==='harmonies-spirit'){p.cards.push({card:action.card,placed:0});s.spiritDiscard!.push(...s.spiritDrafts![actor].filter(id=>id!==action.card));s.spiritDrafts![actor]=[];s.event={kind:'spirit',actor,card:action.card};}
 else if(action.type==='harmonies-solo-discard'){s.market=s.market.filter(c=>c!==action.card);s.discardedCards!.push(action.card);if(s.deck.length)s.market.push(s.deck.shift()!);s.soloDiscarded=true;s.event={kind:'discard',actor,card:action.card};}
 else if(action.type==='harmonies-group'){s.hand=s.groups[action.group];s.groups[action.group]=[];s.picked=true;s.event.kind='group';}
 else if(action.type==='harmonies-place'){s.hand=s.hand.filter(id=>id!==action.token);p.board[action.cell].stack.push(action.token);s.event={kind:'place',actor,cell:action.cell,token:action.token};}
 else if(action.type==='harmonies-card'){p.cards.push({card:action.card,placed:0});s.market=s.market.filter(c=>c!==action.card);if(!ANIMAL[action.card].kind)s.cubeReserve-=ANIMAL[action.card].points.length;s.cardTaken=true;s.event={kind:'card',actor,card:action.card};}
 else if(action.type==='harmonies-cube'){const m=habitatMatches(p,action.card,action.origin,action.rotation)!,c=p.cards.find(c=>c.card===action.card)!;p.board[m.cell][ANIMAL[action.card].kind==='whisper'?'whisper':'cube']={id:`cube-${action.card}-${c.placed}`,card:action.card};c.placed++;s.event={kind:'cube',actor,cell:m.cell,card:action.card};}
 else {
  s.turnCount++;if(s.endAt===undefined&&(p.board.filter(c=>!c.stack.length).length<=2||s.bag.length<(s.options?.solo?9:3)))s.endAt=Math.ceil(s.turnCount/s.players.length)*s.players.length;
  if(s.options?.solo){s.discardedTokens!.push(...s.groups.flat());s.groups=s.groups.map(()=>s.bag.length>=3?s.bag.splice(0,3):[]);}else{const empty=s.groups.findIndex(g=>g.length===0);if(empty>=0&&s.bag.length>=3)s.groups[empty]=s.bag.splice(0,3);}
  while(s.market.length<(s.options?.solo?3:5)&&s.deck.length)s.market.push(s.deck.shift()!);
  if(s.endAt!==undefined&&s.turnCount>=s.endAt)finish(s);else{s.turn=(s.turn+1)%s.players.length;s.picked=false;s.cardTaken=false;s.soloDiscarded=false;s.hand=[];}
 }
 return s;
}
export function getDisplayView(s:State,code:string,revision:number):HarmoniesView{return {gameId:'harmonies',code,revision,phase:s.phase,side:s.side,options:optionsFor(s.options),...(s.options?.solo&&s.phase==='finished'?{soloSuns:soloSuns(s.players[0],s.side,scorePlayer(s.players[0],s.side).total)}:{}),turn:s.players[s.turn].id,turnCount:s.turnCount,groups:structuredClone(s.groups),market:[...s.market],bagCount:s.bag.length,deckCount:s.deck.length,cubeReserve:s.cubeReserve,hand:[...s.hand],picked:s.picked,cardTaken:s.cardTaken,endAt:s.endAt,sequence:s.sequence,event:{kind:s.event.kind,actor:s.event.actor,cell:s.event.cell,card:s.event.card,token:s.event.token},winners:[...s.winners],players:s.players.map(p=>({id:p.id,name:p.name,board:p.board.map(c=>({stack:[...c.stack],...(c.cube?{cube:{id:c.cube.id,card:c.cube.card}}:{}),...(c.whisper?{whisper:{id:c.whisper.id,card:c.whisper.card}}:{})})),cards:p.cards.map(c=>({card:c.card,placed:c.placed})),score:s.scores?.[p.id]??scorePlayer(p,s.side)}))};}
export function getPlayerView(s:State,actor:string):NonNullable<HarmoniesView['me']>{if(!s.players.some(p=>p.id===actor))throw Error('ไม่พบผู้เล่น');return {id:actor,...s.players[s.turn]?.id===actor&&s.spiritDrafts?.[actor]?.length?{spiritChoices:[...s.spiritDrafts[actor]]}:{},legal:getLegalActions(s,actor),habitats:s.players[s.turn]?.id===actor&&s.phase==='playing'?habitats(s.players[s.turn]):[]};}
export const isFinished=(s:State)=>s.phase==='finished';
