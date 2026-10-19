import type {Card,Result,TakeTimeAction,TakeTimeState,TakeTimeView} from './types.js';
export const CLOCK_RULES=['ทุกช่องต้องมีการ์ดอย่างน้อย 1 ใบ','ผลรวมเรียงตามเข็มนาฬิกาจากน้อยไปมาก เท่ากันได้','ช่อง 1 มีการ์ดสุริยะ 1 ใบเท่านั้น','ช่อง 6 มีการ์ด 3 ใบพอดี','ด่านนี้ไม่จำกัดผลรวมที่ 24'];
export const SUIT_NAME={solar:'สุริยะ',lunar:'จันทรา'};
export function createInitialState(seats:{id:string;name:string}[],random:()=>number=Math.random,attempt=1,bonus=0):TakeTimeState {
 if(seats.length<2||seats.length>4||new Set(seats.map(p=>p.id)).size!==seats.length)throw Error('Take Time ต้องมีผู้เล่น 2–4 คน');
 const cards:Card[]=(['solar','lunar'] as const).flatMap(suit=>Array.from({length:12},(_,i)=>({id:'',suit,value:i+1})));
 for(let i=cards.length-1;i>0;i--){const r=random();if(!Number.isFinite(r)||r<0||r>=1)throw Error('ค่าสุ่มไม่ถูกต้อง');const j=Math.floor(r*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}
 cards.forEach((c,i)=>c.id=`a${attempt}c${i}`);
 const players=seats.map(p=>{const hand=cards.splice(0,12/seats.length);return {...p,opened:false,hand:seats.length===2?hand.slice(0,4):hand,reserve:seats.length===2?hand.slice(4):[]};});
 return {schema:1,matchId:'',clock:'1-1',attempt,bonus,phase:'discussion',players,unused:cards,placed:[],revealed:0};
}
export function evaluate(s:TakeTimeState):Result {
 const groups=Array.from({length:6},(_,i)=>s.placed.filter(p=>p.segment===i));
 const sums=groups.map(g=>g.reduce((sum,p)=>sum+p.card.value,0));
 const checks=[{label:'ทุกช่องมีการ์ดอย่างน้อย 1 ใบ',ok:groups.every(g=>g.length>0)},{label:'ผลรวมเรียงจากน้อยไปมาก เท่ากันได้',ok:sums.every((n,i)=>i===0||n>=sums[i-1])},{label:'ช่อง 1 มีสุริยะ 1 ใบเท่านั้น',ok:groups[0].length===1&&groups[0][0].card.suit==='solar'},{label:'ช่อง 6 มี 3 ใบพอดี',ok:groups[5].length===3}];
 return {success:checks.every(x=>x.ok),sums,checks};
}
export function getLegalActions(s:TakeTimeState,id:string):TakeTimeAction[]{
 const p=s.players.find(p=>p.id===id);if(!p)return [];
 if(s.phase==='discussion')return p.opened?[]:[{type:'tt-open',attempt:s.attempt}];
 if(s.phase==='resolution')return [{type:'tt-reveal'}];
 if(s.phase!=='placement'||s.turn&&s.turn!==id)return [];
 return p.hand.flatMap(card=>Array.from({length:6},(_,segment)=>[false,true].filter(faceup=>!faceup||s.placed.filter(p=>p.faceup).length<s.players.length+s.bonus).map(faceup=>({type:'tt-place' as const,card:card.id,segment,faceup}))).flat());
}
export function applyAction(state:TakeTimeState,id:string,action:TakeTimeAction,_random?:()=>number):TakeTimeState {
 if(!action||typeof action!=='object'||Array.isArray(action))throw Error('เลือกการกระทำก่อน');
 const legal=getLegalActions(state,id).find(a=>JSON.stringify(Object.entries(a).sort())===JSON.stringify(Object.entries(action).sort()));
 if(!legal)throw Error('ยังทำรายการนี้ไม่ได้ กรุณาตรวจตาและการ์ดของคุณ');
 const s=structuredClone(state),p=s.players.find(p=>p.id===id)!;
 if(legal.type==='tt-open'){p.opened=true;if(s.players.every(p=>p.opened))s.phase='placement';}
 if(legal.type==='tt-place'){
  const i=p.hand.findIndex(c=>c.id===legal.card),card=p.hand.splice(i,1)[0];
  s.placed.push({card,owner:id,segment:legal.segment,faceup:legal.faceup});
  s.turn=s.players[(s.players.findIndex(p=>p.id===id)+1)%s.players.length].id;
  if(s.players.length===2&&s.placed.length===4)for(const player of s.players)player.hand.push(...player.reserve.splice(0));
  if(s.placed.length===12){s.phase='resolution';delete s.turn;}
 }
 if(legal.type==='tt-reveal'){s.revealed++;if(s.revealed===6){s.result=evaluate(s);s.phase='finished';}}
 return s;
}
export function retry(s:TakeTimeState,random:()=>number):TakeTimeState {
 if(s.phase!=='finished')throw Error('เปิดผลให้ครบก่อนเริ่มใหม่');
 const next=createInitialState(s.players,random,s.attempt+1,s.result?.success?0:Math.min(3,s.bonus+1));next.matchId=s.matchId;return next;
}
export function getDisplayView(s:TakeTimeState,code='',revision=0):TakeTimeView {
 const back=(c:Card)=>({id:c.id,suit:c.suit});
 return {gameId:'take-time',code,revision,clock:s.clock,attempt:s.attempt,bonus:s.bonus,phase:s.phase,turn:s.turn,revealed:s.revealed,faceupRemaining:s.players.length+s.bonus-s.placed.filter(p=>p.faceup).length,
 players:s.players.map(p=>({id:p.id,name:p.name,opened:p.opened,cards:p.hand.map(back),reserve:p.reserve.map(back)})),
 placed:s.placed.map(p=>({owner:p.owner,segment:p.segment,faceup:p.faceup,card:p.faceup||p.segment<s.revealed?{...p.card}:back(p.card)})),...(s.phase==='finished'?{result:structuredClone(s.result)}:{})};
}
export function getPlayerView(s:TakeTimeState,id:string):NonNullable<TakeTimeView['me']>{
 const p=s.players.find(p=>p.id===id);if(!p)throw Error('ไม่พบผู้เล่น');
 return {id,hand:p.hand.map(c=>p.opened?{...c}:{id:c.id,suit:c.suit}),placed:s.placed.filter(p=>p.owner===id).map(p=>({...p.card})),legal:getLegalActions(s,id)};
}
export const isFinished=(s:TakeTimeState)=>s.phase==='finished';
