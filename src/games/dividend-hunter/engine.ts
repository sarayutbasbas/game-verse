import type {HunterOptions,HunterState,HunterAction,HunterView,HunterBid} from './types.js';
export const defaults:HunterOptions={rounds:5,limit:120};
function validOptions(o:HunterOptions){return o&&Number.isSafeInteger(o.rounds)&&o.rounds>=1&&o.rounds<=50&&Number.isSafeInteger(o.limit)&&o.limit>=2&&o.limit<=10000;}
export function createInitialState(seats:{id:string;name:string}[],o:HunterOptions=defaults):HunterState{
 if(seats.length<2||seats.length>120||new Set(seats.map(p=>p.id)).size!==seats.length)throw Error('ปันผลมรณะรองรับผู้เล่น 2–120 คน');
 if(!validOptions(o))throw Error('เลือกรอบ 1–50 รอบ และเลขสูงสุด 2–10,000');
 return{schema:1,...o,phase:'playing',round:1,players:seats.map(p=>({id:p.id,name:p.name,score:0})),bids:[],history:[],winners:[],sequence:0};
}
const changes=(bids:HunterBid[])=>bids.map(b=>({id:b.id,amount:bids.filter(x=>x.amount===b.amount).length===1?b.amount:0}));
export function getLegalActions(s:HunterState,id:string):HunterAction['type'][] {return !s.players.some(p=>p.id===id)?[]:s.phase==='playing'&&s.bids.length===s.players.length?['hunter-end']:s.phase==='playing'&&!s.bids.some(b=>b.id===id)?['hunter-bid']:s.phase==='round-end'?['hunter-next']:[];}
export function applyAction(input:HunterState,id:string,a:HunterAction):HunterState{
 if(!a||typeof a!=='object'||!getLegalActions(input,id).includes(a.type))throw Error('รอสถานะห้องล่าสุดก่อนส่งอีกครั้ง');
 if(a.type==='hunter-bid'&&(Object.keys(a).sort().join(',')!=='amount,type'||!Number.isSafeInteger(a.amount)||a.amount<1||a.amount>input.limit))throw Error(`เลือกเลขจำนวนเต็ม 1–${input.limit}`);
 if(['hunter-next','hunter-end'].includes(a.type)&&Object.keys(a).join(',')!=='type')throw Error('คำสั่งรอบถัดไปไม่ถูกต้อง');
 const s=structuredClone(input);s.sequence++;
 if(a.type==='hunter-next'){s.round++;s.bids=[];s.phase='playing';return s;}
 if(a.type==='hunter-bid'){s.bids.push({id,amount:a.amount});return s;}
 if(a.type==='hunter-end'){const delta=changes(s.bids);for(const c of delta)s.players.find(p=>p.id===c.id)!.score+=c.amount;s.history.push({round:s.round,bids:structuredClone(s.bids),changes:delta});s.phase=s.round===s.rounds?'finished':'round-end';if(s.phase==='finished'){const best=Math.max(...s.players.map(p=>p.score));s.winners=s.players.filter(p=>p.score===best).map(p=>p.id);}}
 return s;
}
export function getDisplayView(s:HunterState,code='',revision=0):HunterView{return{gameId:'dividend-hunter',code,revision,phase:s.phase,round:s.round,rounds:s.rounds,limit:s.limit,submitted:s.bids.length,players:s.players.map(p=>({...p,submitted:s.bids.some(b=>b.id===p.id),...(s.phase!=='playing'?{bid:s.bids.find(b=>b.id===p.id)?.amount}:{})})),history:structuredClone(s.history),winners:[...s.winners]};}
export function getPlayerView(s:HunterState,id:string,code='',revision=0):HunterView{const v=getDisplayView(s,code,revision);v.me={id,bid:s.bids.find(b=>b.id===id)?.amount};return v;}
export const isFinished=(s:HunterState)=>s.phase==='finished';
export function validateState(s:HunterState):boolean{try{
 if(s.schema!==1||!validOptions(s)||!['playing','round-end','finished'].includes(s.phase)||!Array.isArray(s.players)||s.players.length<2||s.players.length>120||new Set(s.players.map(p=>p.id)).size!==s.players.length||!s.players.every(p=>typeof p.id==='string'&&typeof p.name==='string'&&Number.isSafeInteger(p.score)&&p.score>=0)||!Number.isSafeInteger(s.round)||s.round<1||s.round>s.rounds||!Number.isSafeInteger(s.sequence)||s.sequence<0||!Array.isArray(s.bids)||!Array.isArray(s.history)||!Array.isArray(s.winners))return false;
 const validBids=(b:HunterBid[])=>Array.isArray(b)&&b.length<=s.players.length&&new Set(b.map(x=>x.id)).size===b.length&&b.every(x=>s.players.some(p=>p.id===x.id)&&Number.isSafeInteger(x.amount)&&x.amount>=1&&x.amount<=s.limit);
 if(!validBids(s.bids)||s.history.length!==s.round-(s.phase==='playing'?1:0)||s.phase!=='playing'&&s.bids.length!==s.players.length||s.phase==='finished'&&s.round!==s.rounds||s.phase==='round-end'&&s.round>=s.rounds)return false;
 const totals=Object.fromEntries(s.players.map(p=>[p.id,0]));for(const [i,h] of s.history.entries()){if(h.round!==i+1||!validBids(h.bids)||h.bids.length!==s.players.length||JSON.stringify(changes(h.bids))!==JSON.stringify(h.changes))return false;for(const c of h.changes)totals[c.id]+=c.amount;}
 if(s.players.some(p=>p.score!==totals[p.id])||s.phase!=='playing'&&JSON.stringify(s.bids)!==JSON.stringify(s.history.at(-1)?.bids))return false;
 const expected=s.phase==='finished'?s.players.filter(p=>p.score===Math.max(...s.players.map(x=>x.score))).map(p=>p.id):[];return JSON.stringify(expected)===JSON.stringify(s.winners);
 }catch{return false;}}
