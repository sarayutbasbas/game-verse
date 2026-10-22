import {FACES,PENS,SPECIES,type DraftosaurusState as State,type DraftosaurusAction as Action,type DraftosaurusView,type PrivateView,type Zoo,type Pen,type Species,type Score,type Choice} from './types.js';
import {PEN,emptyZoo,species} from './data.js';
export {emptyZoo} from './data.js';
const count=(z:Zoo,k:Species)=>Object.values(z).flat().filter(d=>species(d)===k).length;
export const decisionKey=(s:State)=>`${s.matchId??'draft'}:${s.round}:${s.pick}`;
export const copies=(n:number)=>n===2?8:2*n;
export const rounds=(n:number)=>n===2?4:2;
export const picksPerRound=(n:number)=>n===2?3:6;
function randomIndex(random:()=>number,n:number){const r=random();if(!Number.isFinite(r)||r<0||r>=1)throw Error('แหล่งสุ่มไม่ถูกต้อง');return Math.floor(r*n);}
function deal(s:State){for(const p of s.players)p.hand=s.bag.splice(0,6);}
export function createInitialState(seats:{id:string;name:string}[],random:()=>number=Math.random,starter?:string):State{
 if(seats.length<2||seats.length>5||new Set(seats.map(p=>p.id)).size!==seats.length||seats.some(p=>!p.id||typeof p.name!=='string'))throw Error('Draftosaurus ใช้ผู้เล่น 2–5 คน');
 const bag=SPECIES.flatMap(k=>Array.from({length:copies(seats.length)},(_,i)=>`${k}-${i}`));for(let i=bag.length-1;i>0;i--){const j=randomIndex(random,i+1);[bag[i],bag[j]]=[bag[j],bag[i]];}
 const roller=starter===undefined?0:seats.findIndex(p=>p.id===starter);if(roller<0)throw Error('ไม่พบผู้เริ่มเกม');
 const s:State={phase:'rolling',players:seats.map(p=>({...p,zoo:emptyZoo(),hand:[]})),bag,discarded:[],round:1,pick:1,roller,rollSerial:0,sequence:0,winners:[]};deal(s);return s;
}
export function scorePlayer(s:State,p:State['players'][number]):Score{
 const z=p.zoo,pens:Record<Pen,number>={forest:[0,2,4,8,12,18,24][z.forest.length]??0,meadow:[0,1,3,6,10,15,21][z.meadow.length]??0,love:SPECIES.reduce((a,k)=>a+Math.floor(z.love.filter(d=>species(d)===k).length/2)*5,0),trio:z.trio.length===3?7:0,king:0,solitary:0,river:z.river.length};
 if(z.king.length&&s.players.every(other=>count(other.zoo,species(z.king[0]))<=count(z,species(z.king[0]))))pens.king=7;
 if(z.solitary.length&&count(z,species(z.solitary[0]))===1)pens.solitary=7;
 const trex=PENS.filter(k=>k!=='river'&&z[k].some(d=>species(d)==='trex')).length;
 return {pens,trex,trexCount:count(z,'trex'),total:Object.values(pens).reduce((a,b)=>a+b,0)+trex};
}
/** Intrinsic pen restrictions plus the public die; river is always a legal escape. */
export function canPlace(s:State,id:string,dinosaur:string,pen:Pen){
 const p=s.players.find(p=>p.id===id);if(!p||!PENS.includes(pen))return false;const z=p.zoo,slot=z[pen];
 if(slot.length>=PEN[pen].capacity)return false;if(pen==='river')return true;
 const k=species(dinosaur);if(pen==='forest'&&slot.some(d=>species(d)!==k)||pen==='meadow'&&slot.some(d=>species(d)===k))return false;
 if(s.players[s.roller].id===id)return true;
 switch(s.die){case 'woodlands':case 'grasslands':return PEN[pen].area===s.die;case 'left':case 'right':return PEN[pen].side===s.die;case 'empty':return slot.length===0;case 'no-trex':return !slot.some(d=>species(d)==='trex');default:return false;}
}
export function getLegalActions(s:State,id:string):Action[]{
 const p=s.players.find(p=>p.id===id);if(!p||s.phase==='finished')return [];
 if(s.phase==='rolling')return s.players[s.roller].id===id?[{type:'draftosaurus-roll'}]:[];
 if(p.choice)return [];
 return p.hand.flatMap(dinosaur=>PENS.filter(pen=>canPlace(s,id,dinosaur,pen)).flatMap(pen=>s.players.length===2?p.hand.filter(d=>d!==dinosaur).map(discard=>({type:'draftosaurus-place' as const,epoch:decisionKey(s),dinosaur,pen,discard})):[{type:'draftosaurus-place' as const,epoch:decisionKey(s),dinosaur,pen}]));
}
function validChoice(s:State,p:State['players'][number],a:Choice){return p.hand.includes(a.dinosaur)&&PENS.includes(a.pen)&&canPlace(s,p.id,a.dinosaur,a.pen)&&(s.players.length===2?typeof a.discard==='string'&&a.discard!==a.dinosaur&&p.hand.includes(a.discard):a.discard===undefined);}
export function getWinners(s:State){const scores=s.players.map(p=>({id:p.id,...scorePlayer(s,p)}));const best=Math.max(...scores.map(p=>p.total)),tie=scores.filter(p=>p.total===best),fewest=Math.min(...tie.map(p=>p.trexCount));return tie.filter(p=>p.trexCount===fewest).map(p=>p.id);}
export function applyAction(state:State,id:string,action:Action,random:()=>number=Math.random):State{
 const p=state.players.find(p=>p.id===id);if(!p||!action||typeof action!=='object'||Array.isArray(action))throw Error('ไม่พบผู้เล่นหรือคำสั่งไม่ถูกต้อง');
 const keys=Object.keys(action).sort().join(',');
 if(action.type==='draftosaurus-roll'){
 if(keys!=='type'||state.phase!=='rolling'||state.players[state.roller].id!==id)throw Error('รอผู้ถือเต๋าทอยก่อน');const s=structuredClone(state);s.die=FACES[randomIndex(random,6)];s.rollSerial++;s.sequence++;s.phase='drafting';return s;
 }
 if(action.type!=='draftosaurus-place'||keys!==(state.players.length===2?'dinosaur,discard,epoch,pen,type':'dinosaur,epoch,pen,type')||state.phase!=='drafting'||p.choice||action.epoch!==decisionKey(state)||!validChoice(state,p,action))throw Error('เลือกไดโนเสาร์และคอกให้ตรงกติกาในตาปัจจุบัน');
 const s=structuredClone(state),own=s.players.find(p=>p.id===id)!;own.choice={dinosaur:action.dinosaur,pen:action.pen,...action.discard?{discard:action.discard}:{}};s.sequence++;
 if(s.players.every(p=>p.choice)){
 s.lastReveal=s.players.map(p=>({id:p.id,dinosaur:p.choice!.dinosaur,pen:p.choice!.pen}));
 for(const p of s.players){const a=p.choice!;p.zoo[a.pen].push(a.dinosaur);p.hand=p.hand.filter(d=>d!==a.dinosaur&&d!==a.discard);if(a.discard)s.discarded.push(a.discard);delete p.choice;}
 s.roller=(s.roller+1)%s.players.length;
 if(s.pick===picksPerRound(s.players.length)){
 if(s.round===rounds(s.players.length)){s.phase='finished';s.winners=getWinners(s);return s;}
 s.round++;s.pick=1;deal(s);
 }else{const hands=s.players.map(p=>p.hand);s.players.forEach((p,i)=>p.hand=hands[(i+s.players.length-1)%s.players.length]);s.pick++;}
 s.phase='rolling';delete s.die;
 }
 return s;
}
export function getDisplayView(s:State,code:string,revision:number):DraftosaurusView{return {gameId:'draftosaurus',code,revision,phase:s.phase,turn:s.phase==='rolling'?s.players[s.roller].id:undefined,round:s.round,pick:s.pick,rounds:rounds(s.players.length),picksPerRound:picksPerRound(s.players.length),roller:s.players[s.roller].id,die:s.die,rollSerial:s.rollSerial,sequence:s.sequence,players:s.players.map(p=>({id:p.id,name:p.name,zoo:structuredClone(p.zoo),score:scorePlayer(s,p),chosen:!!p.choice})),winners:[...s.winners],lastReveal:structuredClone(s.lastReveal)};}
export function getPlayerView(s:State,id:string):PrivateView{const p=s.players.find(p=>p.id===id);if(!p)throw Error('ไม่พบผู้เล่น');return {id,hand:[...p.hand],zoo:structuredClone(p.zoo),choice:p.choice?{...p.choice}:undefined,epoch:decisionKey(s),canRoll:s.phase==='rolling'&&s.players[s.roller].id===id,legal:s.phase==='drafting'&&!p.choice?p.hand.map(dinosaur=>({dinosaur,pens:PENS.filter(pen=>canPlace(s,id,dinosaur,pen))})):[]};}
/** A phone receives only its own zoo. Public display keeps every revealed zoo. */
export function getPhoneView(s:State,id:string,code:string,revision:number):DraftosaurusView{const v=getDisplayView(s,code,revision);v.players=v.players.map(p=>p.id===id?p:{id:p.id,name:p.name,chosen:p.chosen});v.me=getPlayerView(s,id);v.lastReveal=v.lastReveal?.filter(r=>r.id===id);return v;}
export const isFinished=(s:State)=>s.phase==='finished';
