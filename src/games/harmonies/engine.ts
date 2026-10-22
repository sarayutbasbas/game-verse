import {SANCTUARIES,SANCTUARY,sanctuaryPrefix,incompleteSlots,sanctuaryScores} from './sanctuaries.js';
import {boardCoords,boardNeighbors,boardCellAt,BOARD_SIDES,isPrintedDry} from './boards.js';
import {ANIMALS,ANIMAL,PULSE,WHISPERS,COORDS,TOKENS,CUBE_COUNT,terrain,neighbors,rotate,cellAt} from './data.js';
import {optionsFor,spiritPool,spiritPoints,soloSuns} from './expansions.js';
import type {HarmoniesState as State,HarmoniesAction as Action,HarmoniesView,Cell,Player,Side,Score,Habitat,Terrain,HarmoniesOptions} from './types.js';
export const emptyPlayer=(id:string,name:string,side:Side='A'):Player=>({id,name,board:boardCoords(side).map(()=>({stack:[]})),cards:[]});
function shuffle<T>(a:T[],random:()=>number){for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function createInitialState(seats:{id:string;name:string}[],random:()=>number,starter?:string,side:Side='A',input?:Partial<HarmoniesOptions>):State{
 const options=optionsFor(input);
 if(seats.length<(options.solo?1:2)||seats.length>(options.solo?1:4)||new Set(seats.map(p=>p.id)).size!==seats.length||!BOARD_SIDES.includes(side))throw Error('Solo สำหรับ 1 คน หรือเล่นร่วมกัน 2–4 คน เลือกกระดาน A, B, C หรือ D');
 const first=starter===undefined?Math.floor(random()*seats.length):seats.findIndex(p=>p.id===starter);if(first<0)throw Error('เลือกผู้เริ่มที่อยู่ในห้อง');
 const bag=shuffle([...TOKENS],random),deck=shuffle([...ANIMALS,...(options.pulse?PULSE:[]),...(options.whispers?WHISPERS:[])].map(c=>c.id),random);
 const sanctuaryDeck=options.sanctuaries?shuffle(SANCTUARIES.map(t=>t.id),random):undefined;
 const spirits=options.natureSpirits?shuffle(spiritPool(options).map(c=>c.id),random):[];
 const spiritDrafts=options.natureSpirits?Object.fromEntries(seats.map(p=>[p.id,spirits.splice(0,2)])):undefined;
 return {options,...sanctuaryDeck?{sanctuaryDeck,sanctuaryMarket:sanctuaryDeck.splice(0,2),sanctuaryTaken:false}:{},discardedTokens:[],discardedCards:[],...(spiritDrafts?{spiritDrafts,spiritUnused:spirits,spiritDiscard:[]}:{}),phase:'playing',side,players:seats.map(p=>emptyPlayer(p.id,p.name,side)),starter:first,turn:first,turnCount:0,bag,groups:Array.from({length:options.solo?3:5},()=>bag.splice(0,3)),deck,market:deck.splice(0,options.solo?3:5),hand:[],picked:false,cardTaken:false,cubeReserve:CUBE_COUNT+(options.pulse?PULSE.reduce((n,c)=>n+c.points.length,0):0),sequence:0,event:{kind:'setup'},winners:[]};
}
export function placementReason(cell:Cell,t:Terrain):string|undefined{
 if(cell.sanctuary)return 'ช่องวิหารสร้างได้เฉพาะกองตามแผ่นที่รับมา';
 if(cell.cube||cell.whisper)return 'ช่องนี้มีคิวบ์อยู่แล้ว เพิ่มชั้นไม่ได้';
 const stack=cell.stack.map(terrain);if(!stack.length)return;
 if(t==='rock'&&stack.length<3&&stack.every(x=>x==='rock'))return;
 if(t==='wood'&&stack.length===1&&stack[0]==='wood')return;
 if(t==='leaf'&&stack.length<=2&&stack.every(x=>x==='wood'))return;
 if(t==='building'&&stack.length===1&&['building','wood','rock'].includes(stack[0]))return;
 return 'ซ้อนได้เฉพาะหินสูง 1–3 ลำต้นไม่เกิน 2 แล้วปิดพุ่มไม้ หรืออาคารสูง 2';
}
export function patternCells(card:string,origin:number,rotation:number,side:Side='A'){const at=boardCoords(side)[origin];if(!at||!Number.isInteger(rotation)||rotation<0||rotation>(ANIMAL[card]?.expansion==='pulse'?11:5)||!ANIMAL[card])return [];return ANIMAL[card].pattern.map(p=>{const q=rotation>=6?-p.q:p.q,r=rotation>=6?p.r+p.q:p.r,v=rotate(q,r,rotation%6);return boardCellAt(side,at.q+v.q,at.r+v.r);});}
function stackMatches(cell:Cell,stack:Terrain[],whisper=false){const own=cell.stack.map(terrain);if(stack[0]==='building'&&!(whisper&&stack.length===1))return own.length===2&&own[1]==='building'&&['building','wood','rock'].includes(own[0]);return own.length===stack.length&&own.every((t,i)=>t===stack[i]);}
export function habitatMatches(p:Player,card:string,origin:number,rotation:number,side:Side='A'):Habitat|undefined{
 const c=ANIMAL[card];if(!c)return;const cells=patternCells(card,origin,rotation,side);if(cells.length!==c.pattern.length||cells.some((i,k)=>i<0||!stackMatches(p.board[i],c.pattern[k].stack,c.kind==='whisper')))return;
 const cell=cells[c.pattern.findIndex(p=>p.cube)];if(p.board[cell].sanctuary)return; if(c.kind==='whisper'?p.board[cell].whisper:p.board[cell].cube)return;return {card,origin,rotation,cell,cells};
}
export function habitats(p:Player,side:Side='A'){return p.cards.filter(c=>c.placed<ANIMAL[c.card].points.length).flatMap(c=>boardCoords(side).flatMap((_,origin)=>Array.from({length:ANIMAL[c.card].expansion==='pulse'?12:6},(_,rotation)=>habitatMatches(p,c.card,origin,rotation,side)).filter((m):m is Habitat=>!!m)));}
export function getLegalActions(s:State,actor:string):Action[]{
 if(s.phase!=='playing'||!s.players.some(p=>p.id===actor))return [];
 const choices=s.spiritDrafts?.[actor];if(choices?.length)return choices.map(card=>({type:'harmonies-spirit',card,...s.matchId?{epoch:s.matchId}:{}}));
 if(Object.values(s.spiritDrafts??{}).some(pair=>pair.length)||s.players[s.turn]?.id!==actor)return [];
 const p=s.players[s.turn],out:Action[]=[];
 if(s.soloDiscarded)return s.picked&&!s.hand.length?[{type:'harmonies-end'}]:[];
 if(!s.picked)s.groups.forEach((g,group)=>{if(g.length===3)out.push({type:'harmonies-group',group});});
 for(const token of s.hand)p.board.forEach((cell,i)=>{if(!placementReason(cell,terrain(token)))out.push({type:'harmonies-place',token,cell:i});});
 if(!s.cardTaken&&incompleteSlots(p)<4)out.push(...s.market.map(card=>({type:'harmonies-card' as const,card})));
 if(s.options?.sanctuaries){
  if(!s.sanctuaryTaken&&incompleteSlots(p)<4)for(const tile of [...(s.sanctuaryMarket??[]),...(s.sanctuaryDeck?.slice(0,1)??[])].filter(Boolean))out.push({type:'harmonies-sanctuary',tile});
  for(const token of s.hand)for(const owned of p.sanctuaries??[])if(!owned.complete)p.board.forEach((cell,i)=>{if((owned.cell===undefined?!cell.sanctuary:owned.cell===i)&&sanctuaryPrefix(cell,owned.tile,terrain(token))&&!!placementReason({...cell,sanctuary:undefined},terrain(token)))out.push({type:'harmonies-place',token,cell:i,sanctuary:owned.tile});else if(owned.cell===i&&sanctuaryPrefix(cell,owned.tile,terrain(token)))out.push({type:'harmonies-place',token,cell:i,sanctuary:owned.tile});});
  for(const owned of p.sanctuaries??[])if(owned.complete&&owned.cell!==undefined)for(const card of p.cards){const animal=ANIMAL[card.card];if(!animal.kind&&animal.points.length-card.placed===1&&SANCTUARY[owned.tile].colors.includes(animal.pattern.find(p=>p.cube)!.stack.at(-1)!))out.push({type:'harmonies-sanctuary-cube',card:card.card,cell:owned.cell});}
 }
 out.push(...habitats(p,s.side).map(m=>({type:'harmonies-cube' as const,card:m.card,origin:m.origin,rotation:m.rotation})));
 if(s.picked&&!s.hand.length){out.push({type:'harmonies-end'});if(s.options?.solo&&!s.cardTaken&&s.deck.length)out.push(...s.market.map(card=>({type:'harmonies-solo-discard' as const,card})));}return out;
}
function components(indices:number[],side:Side='A'){const remaining=new Set(indices),groups:number[][]=[];while(remaining.size){const first=remaining.values().next().value!,todo=[first],group:number[]=[];remaining.delete(first);while(todo.length){const i=todo.pop()!;group.push(i);for(const j of boardNeighbors(side,i))if(remaining.delete(j))todo.push(j);}groups.push(group);}return groups;}
export function scorePlayer(p:Player,side:Side):Score{
 let trees=0,mountains=0,buildings=0;const colors=p.board.map(c=>c.stack.length?terrain(c.stack.at(-1)!):null),top=colors.map((t,i)=>p.board[i].sanctuary?null:t);
 for(let i=0;i<p.board.length;i++){const c=p.board[i],height=c.stack.length;
  if(top[i]==='leaf'&&!(isPrintedDry(side,i)&&!boardNeighbors(side,i).some(j=>top[j]==='water')))trees+=(side==='D'?[0,2,4,9]:[0,1,3,7])[height]??0;
  if(top[i]==='rock'&&boardNeighbors(side,i).some(j=>top[j]==='rock'))mountains+=[0,1,3,7][height]??0;
  if(top[i]==='building'&&height===2&&new Set(boardNeighbors(side,i).map(j=>colors[j]).filter(Boolean)).size>=(side==='C'?4:3))buildings+=side==='C'?8:5;
 }
 const fields=components(top.flatMap((t,i)=>t==='field'?[i]:[]),side).filter(g=>g.length>=2&&(side!=='D'||g.some(i=>!isPrintedDry(side,i)||boardNeighbors(side,i).some(j=>top[j]==='water')))).length*(side==='D'?6:5);
 const blue=top.flatMap((t,i)=>t==='water'?[i]:[]);let riverLength=0;
 for(const start of blue){const distance=new Map([[start,1]]),todo=[start];for(let k=0;k<todo.length;k++){const i=todo[k];riverLength=Math.max(riverLength,distance.get(i)!);for(const j of boardNeighbors(side,i))if(top[j]==='water'&&!distance.has(j)){distance.set(j,distance.get(i)!+1);todo.push(j);}}}
 const islands=components(top.flatMap((t,i)=>t!=='water'?[i]:[]),side).length;
 const water=side==='B'?islands*5:riverLength<=6?[0,0,2,5,8,11,15][riverLength]:15+(riverLength-6)*4;
 const sanctuaries=sanctuaryScores(p,side),sanctuaryTotal=sanctuaries.reduce((n,t)=>n+t.points,0);
 const animals=p.cards.filter(c=>!ANIMAL[c.card].kind).map(c=>({card:c.card,placed:c.placed,points:ANIMAL[c.card].points[c.placed-1]??0})),animalTotal=animals.reduce((n,c)=>n+c.points,0),landscape=trees+mountains+fields+buildings+water;
 const spirits=p.cards.filter(c=>ANIMAL[c.card].kind==='spirit').map(c=>({card:c.card,placed:c.placed,points:c.placed?spiritPoints(p,c.card,side):0})),spiritTotal=spirits.reduce((n,c)=>n+c.points,0);
 const whispers=p.cards.filter(c=>ANIMAL[c.card].kind==='whisper').map(c=>({card:c.card,placed:c.placed,points:p.board.filter(cell=>cell.whisper?.card===c.card).reduce((n,cell)=>n+(cell.cube?5:2),0)})),whisperTotal=whispers.reduce((n,c)=>n+c.points,0);
 return {...sanctuaries.length?{sanctuaries,sanctuaryTotal}:{},trees,mountains,fields,buildings,water,animals,landscape,animalTotal,total:landscape+animalTotal+spiritTotal+whisperTotal+sanctuaryTotal,cubes:p.board.reduce((n,c)=>n+(c.cube&&!ANIMAL[c.cube.card].kind?1:0)+(c.sanctuaryCubes?.length??0),0),riverLength,islands,...spirits.length?{spirits,spiritTotal}:{},...whispers.length?{whispers,whisperTotal}:{}};
}
export function winningScores(scores:Record<string,Score>){const entries=Object.entries(scores),best=Math.max(...entries.map(([,s])=>s.total)),cubes=Math.max(...entries.filter(([,s])=>s.total===best).map(([,s])=>s.cubes));return entries.filter(([,s])=>s.total===best&&s.cubes===cubes).map(([id])=>id);}
function finish(s:State){s.phase='finished';s.scores=Object.fromEntries(s.players.map(p=>[p.id,scorePlayer(p,s.side)]));s.winners=winningScores(s.scores);s.event.kind='finish';}
export function applyAction(state:State,actor:string,action:Action,_random:()=>number):State{
 if(!action||!getLegalActions(state,actor).some(a=>Object.keys(a).sort().join()===Object.keys(action).sort().join()&&Object.entries(a).every(([k,v])=>(action as any)[k]===v)))throw Error('ทำรายการนี้ไม่ได้ ตรวจคิว ชิ้นส่วน และรูปแบบถิ่นอาศัย');
 const s=structuredClone(state),p=s.players.find(p=>p.id===actor)!;s.sequence++;s.event={kind:'turn',actor};
 if(action.type==='harmonies-spirit'){p.cards.push({card:action.card,placed:0});s.spiritDiscard!.push(...s.spiritDrafts![actor].filter(id=>id!==action.card));s.spiritDrafts![actor]=[];s.event={kind:'spirit',actor,card:action.card};}
 else if(action.type==='harmonies-solo-discard'){s.market=s.market.filter(c=>c!==action.card);s.discardedCards!.push(action.card);if(s.deck.length)s.market.push(s.deck.shift()!);s.soloDiscarded=true;s.event={kind:'discard',actor,card:action.card};}
 else if(action.type==='harmonies-group'){s.hand=s.groups[action.group];s.groups[action.group]=[];s.picked=true;s.event.kind='group';}
 else if(action.type==='harmonies-place'){s.hand=s.hand.filter(id=>id!==action.token);p.board[action.cell].stack.push(action.token);if(action.sanctuary){const owned=p.sanctuaries!.find(t=>t.tile===action.sanctuary)!;owned.cell=action.cell;p.board[action.cell].sanctuary=owned.tile;p.board[action.cell].sanctuaryCubes??=[];owned.complete=p.board[action.cell].stack.length===4;}s.event={kind:'place',actor,cell:action.cell,token:action.token};}
 else if(action.type==='harmonies-sanctuary'){(p.sanctuaries??=[]).push({tile:action.tile,complete:false});const index=s.sanctuaryMarket!.indexOf(action.tile);if(index>=0)s.sanctuaryMarket![index]='';else s.sanctuaryDeck!.shift();s.sanctuaryTaken=true;s.event={kind:'sanctuary',actor,card:action.tile};}
 else if(action.type==='harmonies-sanctuary-cube'){const card=p.cards.find(c=>c.card===action.card)!;(p.board[action.cell].sanctuaryCubes??=[]).push({id:`cube-${action.card}-${card.placed}`,card:action.card});card.placed++;s.event={kind:'cube',actor,cell:action.cell,card:action.card};}
 else if(action.type==='harmonies-card'){p.cards.push({card:action.card,placed:0});s.market=s.market.filter(c=>c!==action.card);if(!ANIMAL[action.card].kind)s.cubeReserve-=ANIMAL[action.card].points.length;s.cardTaken=true;s.event={kind:'card',actor,card:action.card};}
 else if(action.type==='harmonies-cube'){const m=habitatMatches(p,action.card,action.origin,action.rotation,s.side)!,c=p.cards.find(c=>c.card===action.card)!;p.board[m.cell][ANIMAL[action.card].kind==='whisper'?'whisper':'cube']={id:`cube-${action.card}-${c.placed}`,card:action.card};c.placed++;s.event={kind:'cube',actor,cell:m.cell,card:action.card};}
 else {
  if(s.sanctuaryMarket)for(let i=0;i<s.sanctuaryMarket.length;i++)if(!s.sanctuaryMarket[i]&&s.sanctuaryDeck?.length)s.sanctuaryMarket[i]=s.sanctuaryDeck.shift()!;if(s.options?.sanctuaries)s.sanctuaryTaken=false;
  s.turnCount++;if(s.endAt===undefined&&(p.board.filter(c=>!c.stack.length).length<=2||s.bag.length<(s.options?.solo?9:3)))s.endAt=Math.ceil(s.turnCount/s.players.length)*s.players.length;
  if(s.options?.solo){s.discardedTokens!.push(...s.groups.flat());s.groups=s.groups.map(()=>s.bag.length>=3?s.bag.splice(0,3):[]);}else{const empty=s.groups.findIndex(g=>g.length===0);if(empty>=0&&s.bag.length>=3)s.groups[empty]=s.bag.splice(0,3);}
  while(s.market.length<(s.options?.solo?3:5)&&s.deck.length)s.market.push(s.deck.shift()!);
  if(s.endAt!==undefined&&s.turnCount>=s.endAt)finish(s);else{s.turn=(s.turn+1)%s.players.length;s.picked=false;s.cardTaken=false;s.soloDiscarded=false;s.hand=[];}
 }
 return s;
}
export function getDisplayView(s:State,code:string,revision:number):HarmoniesView{return {...s.options?.sanctuaries?{sanctuaryMarket:[...(s.sanctuaryMarket??[]),...(s.sanctuaryDeck?.slice(0,1)??[])].filter(Boolean),sanctuaryDeckCount:s.sanctuaryDeck?.length??0}:{},gameId:'harmonies',code,revision,phase:s.phase,side:s.side,options:optionsFor(s.options),spiritSelectionsRemaining:Object.values(s.spiritDrafts??{}).filter(pair=>pair.length).length,...(s.options?.solo&&s.phase==='finished'?{soloSuns:soloSuns(s.players[0],s.side,scorePlayer(s.players[0],s.side).total)}:{}),turn:s.players[s.turn].id,turnCount:s.turnCount,groups:structuredClone(s.groups),market:[...s.market],bagCount:s.bag.length,deckCount:s.deck.length,cubeReserve:s.cubeReserve,hand:[...s.hand],picked:s.picked,cardTaken:s.cardTaken,endAt:s.endAt,sequence:s.sequence,event:{kind:s.event.kind,actor:s.event.actor,cell:s.event.cell,card:s.event.card,token:s.event.token},winners:[...s.winners],players:s.players.map(p=>({id:p.id,name:p.name,...p.sanctuaries?{sanctuaries:p.sanctuaries.map(t=>({tile:t.tile,cell:t.cell,complete:t.complete}))}:{},board:p.board.map(c=>({stack:[...c.stack],...c.sanctuary?{sanctuary:c.sanctuary,sanctuaryCubes:(c.sanctuaryCubes??[]).map(c=>({id:c.id,card:c.card}))}:{},...(c.cube?{cube:{id:c.cube.id,card:c.cube.card}}:{}),...(c.whisper?{whisper:{id:c.whisper.id,card:c.whisper.card}}:{})})),cards:p.cards.map(c=>({card:c.card,placed:c.placed})),score:s.scores?.[p.id]??scorePlayer(p,s.side)}))};}
export function getPlayerView(s:State,actor:string):NonNullable<HarmoniesView['me']>{if(!s.players.some(p=>p.id===actor))throw Error('ไม่พบผู้เล่น');return {id:actor,...s.phase==='playing'&&s.spiritDrafts?.[actor]?.length?{spiritChoices:[...s.spiritDrafts[actor]]}:{},legal:getLegalActions(s,actor),habitats:s.players[s.turn]?.id===actor&&s.phase==='playing'&&!Object.values(s.spiritDrafts??{}).some(pair=>pair.length)?habitats(s.players[s.turn],s.side):[]};}
export const isFinished=(s:State)=>s.phase==='finished';
