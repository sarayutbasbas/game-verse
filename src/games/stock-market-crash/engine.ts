import type {CrashAction,CrashState,CrashView,CrashRound} from './types.js';
export interface CrashOptions{rounds:number;pot:number;limit:number;roundSeconds?:number}
export const defaults:CrashOptions={rounds:5,pot:200,limit:100,roundSeconds:30};
const validOptions=(o:CrashOptions)=>!!o&&Object.keys(o).every(k=>['rounds','pot','limit','roundSeconds'].includes(k))&&Number.isSafeInteger(o.rounds)&&o.rounds>=1&&o.rounds<=20&&Number.isSafeInteger(o.pot)&&o.pot>=1&&o.pot<=10000&&Number.isSafeInteger(o.limit)&&o.limit>=1&&o.limit<=100&&(o.roundSeconds===undefined||Number.isSafeInteger(o.roundSeconds)&&o.roundSeconds>=0&&o.roundSeconds<=600);
export function createInitialState(seats:{id:string;name:string}[],options:CrashOptions=defaults,now=0):CrashState{
 if(seats.length<2||seats.length>20||new Set(seats.map(p=>p.id)).size!==seats.length)throw Error('วิกฤตหุ้นปั่นรองรับ 2–20 คน');
 if(!validOptions(options)||!Number.isSafeInteger(now)||now<0)throw Error('ตั้งค่า 1–20 รอบ กองกลาง 1–10,000 และเวลา 0–600 วินาที (0 คือไม่จับเวลา)');
 const roundSeconds=options.roundSeconds??30;
 return{schema:1,phase:'playing',players:seats.map(p=>({id:p.id,name:p.name,score:0})),round:1,rounds:options.rounds,pot:options.pot,limit:options.limit,roundSeconds,deadline:roundSeconds>0?now+roundSeconds*1000:undefined,history:[],bids:[],sequence:0,winners:[]};
}
export function revealLive(s:CrashState){return s.round<=2||s.round===s.rounds;}
export const isExpired=(s:CrashState,now:number)=>s.phase==='playing'&&s.deadline!==undefined&&now>=s.deadline;
export function getLegalActions(s:CrashState,id:string,now=0):CrashAction['type'][] {
 if(!s.players.some(p=>p.id===id)||isExpired(s,now))return[];
 if(s.phase==='playing')return s.bids.length===s.players.length?['crash-end']:s.bids.some(b=>b.id===id)?[]:['crash-bid'];
 return s.phase==='round-end'&&s.round<s.rounds?['crash-next']:[];
}
function result(s:CrashState,timedOut:boolean):CrashRound{
 const total=s.bids.reduce((n,b)=>n+b.amount,0),crashed=total>s.pot,sorted=[...s.bids].sort((a,b)=>a.amount-b.amount),cut=sorted[Math.min(4,sorted.length-1)]?.amount??0;
 return{round:s.round,pot:s.pot,limit:s.limit,crashed,total,timedOut,bids:structuredClone(s.bids),changes:s.players.map(p=>{const bid=s.bids.find(b=>b.id===p.id);return{id:p.id,amount:!bid?0:crashed?(bid.amount<=cut?10:0):bid.amount};})};
}
function settle(input:CrashState,timedOut:boolean):CrashState{
 const s=structuredClone(input),r=result(s,timedOut);s.sequence++;s.history.push(r);for(const c of r.changes)s.players.find(p=>p.id===c.id)!.score+=c.amount;
 s.phase=s.round===s.rounds?'finished':'round-end';
 if(s.phase==='finished'){const ranked=[...s.players].sort((a,b)=>b.score-a.score),cut=ranked[Math.min(4,ranked.length-1)].score;s.winners=ranked.filter(p=>p.score>=cut).map(p=>p.id);}
 return s;
}
/** Server clock only: deadline closes the round even when nobody submitted. */
export function expireRound(s:CrashState,now:number):CrashState{return isExpired(s,now)?settle(s,true):s;}
export function applyAction(input:CrashState,id:string,a:CrashAction,now=0):CrashState{
 if(!a||typeof a!=='object'||Array.isArray(a)||!getLegalActions(input,id,now).includes(a.type))throw Error(isExpired(input,now)?'หมดเวลาแล้ว ส่งเลขไม่ได้':'ส่งเลขไม่ได้หรือสถานะเปลี่ยนแล้ว');
 if(a.type==='crash-bid'&&(Object.keys(a).sort().join(',')!=='amount,type'||!Number.isSafeInteger(a.amount)||a.amount<1||a.amount>(input.round===input.rounds?Math.min(input.limit,20):input.limit)))throw Error('เลือกเลขในช่วงที่รอบนี้กำหนด');
 if(a.type!=='crash-bid'&&Object.keys(a).join(',')!=='type')throw Error('คำสั่งไม่ถูกต้อง');
 if(a.type==='crash-end')return settle(input,false);
 const s=structuredClone(input);s.sequence++;
 if(a.type==='crash-next'){s.round++;s.bids=[];s.phase='playing';s.roundSeconds??=0;s.deadline=s.roundSeconds>0?now+s.roundSeconds*1000:undefined;return s;}
 s.bids.push({id,amount:a.amount});return s;
}
export function getDisplayView(s:CrashState,code='',revision=0):CrashView{
 const live=revealLive(s);return{gameId:'stock-market-crash',code,revision,phase:s.phase,round:s.round,rounds:s.rounds,pot:s.pot,limit:s.round===s.rounds?Math.min(s.limit,20):s.limit,roundSeconds:s.roundSeconds,deadline:s.deadline,liveTotal:live||s.phase!=='playing'?s.bids.reduce((n,b)=>n+b.amount,0):0,submitted:s.bids.length,revealLive:live,players:s.players.map(p=>({...p,submitted:s.bids.some(b=>b.id===p.id),...(s.phase!=='playing'?{bid:s.bids.find(b=>b.id===p.id)?.amount}:{})})),history:structuredClone(s.history),winners:[...s.winners]};
}
export function getPlayerView(s:CrashState,id:string,code='',revision=0):CrashView{const v=getDisplayView(s,code,revision);v.me={id,bid:s.bids.find(b=>b.id===id)?.amount};return v;}
export const isFinished=(s:CrashState)=>s.phase==='finished';
export function validateState(s:CrashState):boolean{try{
 if(s?.schema!==1||!validOptions({rounds:s.rounds,pot:s.pot,limit:s.limit,roundSeconds:s.roundSeconds})||!['playing','round-end','finished'].includes(s.phase)||!Array.isArray(s.players)||s.players.length<2||s.players.length>20||new Set(s.players.map(p=>p.id)).size!==s.players.length||!s.players.every(p=>typeof p.id==='string'&&typeof p.name==='string'&&Number.isSafeInteger(p.score)&&p.score>=0)||!Number.isSafeInteger(s.round)||s.round<1||s.round>s.rounds||!Number.isSafeInteger(s.sequence)||s.sequence<0||!Array.isArray(s.history)||!Array.isArray(s.bids)||!Array.isArray(s.winners))return false;
 if((s.deadline!==undefined)!==((s.roundSeconds??0)>0)||s.deadline!==undefined&&(!Number.isSafeInteger(s.deadline)||s.deadline<0))return false;
 const validBids=(b:CrashState['bids'],round:number)=>Array.isArray(b)&&b.length<=s.players.length&&new Set(b.map(x=>x.id)).size===b.length&&b.every(x=>s.players.some(p=>p.id===x.id)&&Number.isSafeInteger(x.amount)&&x.amount>=1&&x.amount<=(round===s.rounds?Math.min(s.limit,20):s.limit));
 if(!validBids(s.bids,s.round)||s.history.length!==s.round-(s.phase==='playing'?1:0)||s.phase==='finished'&&s.round!==s.rounds||s.phase==='round-end'&&s.round>=s.rounds)return false;
 const totals=Object.fromEntries(s.players.map(p=>[p.id,0]));
 for(const [i,h] of s.history.entries()){
  if(h.round!==i+1||h.pot!==s.pot||h.limit!==s.limit||!validBids(h.bids,h.round)||h.timedOut!==undefined&&typeof h.timedOut!=='boolean'||h.bids.length<s.players.length&&!h.timedOut)return false;
  const expected=result({...s,round:h.round,bids:h.bids},!!h.timedOut);
  if(h.total!==expected.total||h.crashed!==expected.crashed||JSON.stringify(h.changes)!==JSON.stringify(expected.changes))return false;
  for(const c of h.changes)totals[c.id]+=c.amount;
 }
 if(s.players.some(p=>p.score!==totals[p.id])||s.phase!=='playing'&&JSON.stringify(s.bids)!==JSON.stringify(s.history.at(-1)?.bids))return false;
 const ranked=[...s.players].sort((a,b)=>b.score-a.score),cut=ranked[Math.min(4,ranked.length-1)].score,expected=s.phase==='finished'?ranked.filter(p=>p.score>=cut).map(p=>p.id):[];return JSON.stringify(s.winners)===JSON.stringify(expected);
 }catch{return false;}}
