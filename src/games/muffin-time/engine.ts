import {definition,instances} from './data.js';
import type {MuffinState as S,MuffinAction as A,MuffinView as V,Player,Trigger,Pending} from './types.js';
export function shuffle<T>(input:T[],r:()=>number){const a=[...input];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const active=(s:S)=>s.players[s.turn];const person=(s:S,id:string)=>s.players.find(p=>p.id===id)!;
const log=(s:S,text:string)=>{s.events.push({id:++s.serial,text});s.events=s.events.slice(-40);};
function event(s:S,kind:Trigger,actor:string){s.last={id:++s.serial,kind,actor};s.fired=[];}
function check(s:S){for(const p of s.players)if(p.hand.length!==10)p.declared=false;}
function draw(s:S,p:Player,n:number,r:()=>number){for(let i=0;i<n;i++){if(!s.deck.length&&s.discard.length)s.deck=shuffle(s.discard.splice(0),r);const c=s.deck.shift();if(!c)break;p.hand.push(c);}check(s);}
function steal(s:S,to:Player,from:Player,n:number,r:()=>number){for(let i=0;i<n&&from.hand.length;i++)to.hand.push(...from.hand.splice(Math.floor(r()*from.hand.length),1));check(s);}
function discard(s:S,p:Player,n:number,r:()=>number){for(let i=0;i<n&&p.hand.length;i++)s.discard.push(...p.hand.splice(Math.floor(r()*p.hand.length),1));check(s);}
export function createInitialState(seats:{id:string;name:string}[],r:()=>number,starter?:string):S{
 if(seats.length<2||seats.length>8||new Set(seats.map(p=>p.id)).size!==seats.length||seats.some(p=>typeof p.id!=='string'||!p.id||typeof p.name!=='string')||starter!==undefined&&!seats.some(p=>p.id===starter))throw Error('ต้องมีผู้เล่น 2–8 คน');
 const s:S={schema:1,players:seats.map(p=>({...p,hand:[],traps:[],declared:false,skip:0})),deck:shuffle(instances(),r),discard:[],turn:Math.max(0,seats.findIndex(p=>p.id===starter)),direction:1,phase:'start',sequence:0,serial:0,turnNumber:1,trapSet:false,passed:[],stack:[],resume:'main',fired:[],winners:[],events:[]};for(const p of s.players)draw(s,p,3,r);log(s,'แจกคนละ 3 ใบ · รักษา 10 ใบไว้จนถึงตาของคุณ');return s;
}
const canonical=(a:object)=>JSON.stringify(a,Object.keys(a).sort());
export function getLegalActions(s:S,id:string):A[]{const p=s.players.find(p=>p.id===id);if(!p||s.phase==='finished')return[];const a:A[]=[];
 if(p.hand.length===10&&!p.declared)a.push({type:'mt-claim'});
 if(s.phase==='duel'){if(s.duel&&(s.duel.actor===id||s.duel.target===id)&&!s.duel.choices[id])for(const choice of ['rock','paper','scissors'] as const)a.push({type:'mt-duel',choice});return a;}
 if(s.phase==='reaction'){
  if(!s.passed.includes(id))a.push({type:'mt-pass'});
  const top=s.stack.at(-1)!;if(top.actor!==id)for(const card of p.hand)if(definition(card).kind==='counter')a.push({type:'mt-play',card});
 }else if(s.phase==='end'){if(!s.passed.includes(id))a.push({type:'mt-pass'});}
 else if(active(s).id===id){if(s.phase==='start'){a.push({type:'mt-skip-trap'});for(const card of p.hand)if(definition(card).kind==='trap'){if(p.traps.length<3)a.push({type:'mt-set',card});else for(const t of p.traps)a.push({type:'mt-set',card,replace:t.slot});}}
  else{a.push({type:'mt-draw'});for(const card of p.hand){const d=definition(card);if(d.kind!=='action')continue;if(d.target)for(const other of s.players.filter(x=>x.id!==id))a.push({type:'mt-play',card,target:other.id});else a.push({type:'mt-play',card});}}
 }
 if(s.last&&s.phase!=='reaction')for(const t of p.traps){const d=definition(t.card);if(d.trigger===s.last.kind&&s.last.actor!==id&&!s.fired.includes(t.slot))a.push({type:'mt-trigger',slot:t.slot,event:s.last.id});}
 return a;
}
function advance(s:S){s.passed=[];s.stack=[];delete s.last;s.fired=[];s.trapSet=false;let safety=0;do{s.turn=(s.turn+s.direction+s.players.length)%s.players.length;s.turnNumber++;const p=active(s);if(p.hand.length===10&&p.declared){s.winners=[p.id];s.phase='finished';log(s,`${p.name} รักษา 10 ใบจนถึงตาตัวเอง · ชนะ!`);return;}if(!p.skip)break;p.skip--;log(s,`${p.name} ข้ามตานี้`);}while(++safety<32);s.phase='start';}
function effect(s:S,q:Pending,r:()=>number){const d=definition(q.card),p=person(s,q.actor),t=q.target?person(s,q.target):p;
 switch(d.effect){case'draw':draw(s,p,d.amount,r);break;case'steal':steal(s,p,t,d.amount,r);break;case'swap':{const hand=p.hand;p.hand=t.hand;t.hand=hand;break;}case'discard':discard(s,t,d.amount,r);break;case'clear':discard(s,t,t.hand.length,r);break;
 case'rotate':{const hands=s.players.map(p=>p.hand);s.players.forEach((p,i)=>p.hand=hands[(i-s.direction+s.players.length)%s.players.length]);break;}
 case'allDraw':for(const p of s.players)draw(s,p,d.amount,r);break;case'allDiscard':for(const p of s.players)discard(s,p,d.amount,r);break;case'refill':draw(s,p,Math.max(0,d.amount-p.hand.length),r);break;case'half':discard(s,t,Math.floor(t.hand.length/2),r);break;case'skip':t.skip++;break;case'reverse':s.direction=s.direction===1?-1:1;break;
 case'mix':{const counts=s.players.map(p=>p.hand.length),pool=shuffle(s.players.flatMap(p=>p.hand),r);s.players.forEach((p,i)=>p.hand=pool.splice(0,counts[i]));break;}
 case'duel':s.duel={actor:p.id,target:t.id,choices:{}};s.phase='duel';break;case'counter':break;}
 check(s);log(s,`${p.name} ใช้ ${d.name}${q.target?' → '+t.name:''}`);
}
function settle(s:S,r:()=>number){while(s.stack.length){const q=s.stack.pop()!;if(!q.cancelled){if(definition(q.card).kind==='counter'){if(s.stack.length)s.stack.at(-1)!.cancelled=true;log(s,`${person(s,q.actor).name} สวนสำเร็จ`);}else effect(s,q,r);}else log(s,`${definition(q.card).name} ถูกหยุด`);s.discard.push(q.card);}
 s.passed=[];if(s.phase!=='duel')s.phase=s.resume;
}
export function applyAction(input:S,id:string,a:A,r:()=>number):S{
 if(!a||typeof a!=='object'||Array.isArray(a)||!getLegalActions(input,id).some(x=>canonical(x)===canonical(a)))throw Error('คำสั่งไม่ถูกต้อง ไม่ใช่ตาคุณ หรือการ์ดนี้ยังใช้ไม่ได้');
 const s=structuredClone(input),p=person(s,id);s.sequence++;
 if(a.type==='mt-claim'){p.declared=true;event(s,'claim',id);if(s.phase==='end')s.passed=[];log(s,`${p.name}: มัฟฟินไทม์! มี 10 ใบแล้ว`);return s;}
 if(a.type==='mt-skip-trap'){s.phase='main';return s;}
 if(a.type==='mt-set'){if(a.replace){const i=p.traps.findIndex(t=>t.slot===a.replace);s.discard.push(p.traps.splice(i,1)[0].card);}p.hand.splice(p.hand.indexOf(a.card),1);p.traps.push({slot:'t'+(++s.serial),card:a.card});s.trapSet=true;s.phase='main';check(s);log(s,`${p.name} วางกับดักคว่ำหน้า`);return s;}
 if(a.type==='mt-draw'){draw(s,p,1,r);s.phase='end';s.passed=[];event(s,'draw',id);log(s,`${p.name} จั่ว 1 ใบ`);return s;}
 if(a.type==='mt-trigger'){const t=p.traps.splice(p.traps.findIndex(t=>t.slot===a.slot),1)[0],d=definition(t.card);s.fired.push(t.slot);s.resume=s.phase==='end'?'end':s.phase==='start'?'start':'main';s.stack=[{card:t.card,actor:id,target:d.target?s.last!.actor:undefined,cancelled:false}];s.phase='reaction';s.passed=[];log(s,`${p.name} เปิดกับดัก ${d.name}`);return s;}
 if(a.type==='mt-play'){p.hand.splice(p.hand.indexOf(a.card),1);check(s);if(s.phase!=='reaction'){s.resume='end';s.stack=[];event(s,'play',id);}s.stack.push({card:a.card,actor:id,...('target'in a&&a.target?{target:a.target}:{}),cancelled:false});s.phase='reaction';s.passed=[];if(definition(a.card).effect==='duel'){const q=s.stack.pop()!;effect(s,q,r);s.discard.push(q.card);}else log(s,`${p.name} เล่น ${definition(a.card).name} · รอสวน`);return s;}
 if(a.type==='mt-pass'){s.passed.push(id);if(s.passed.length===s.players.length){if(s.phase==='reaction')settle(s,r);else advance(s);}return s;}
 if(a.type==='mt-duel'){const q=s.duel!;q.choices[id]=a.choice;if(Object.keys(q.choices).length===2){const x=q.choices[q.actor],y=q.choices[q.target],beats={rock:'scissors',paper:'rock',scissors:'paper'},winner=x===y?undefined:beats[x]===y?q.actor:q.target;log(s,`เป่ายิ้งฉุบ ${person(s,q.actor).name}: ${x} / ${person(s,q.target).name}: ${y}${winner?' · ผู้ชนะจั่ว 2 ใบ':' · เสมอ ทั้งคู่จั่ว 1 ใบ'}`);if(winner)draw(s,person(s,winner),2,r);else{draw(s,person(s,q.actor),1,r);draw(s,person(s,q.target),1,r);}delete s.duel;s.phase=s.resume;s.passed=[];}return s;}
 return s;
}
export function getDisplayView(s:S,code='',revision=0):V{return{gameId:'muffin-time',code,revision,phase:s.phase,sequence:s.sequence,turn:active(s).id,turnNumber:s.turnNumber,direction:s.direction,deckCount:s.deck.length,discardCount:s.discard.length,discardTop:s.discard.at(-1)?definition(s.discard.at(-1)!).id:undefined,players:s.players.map(p=>({id:p.id,name:p.name,handCount:p.hand.length,traps:p.traps.map(t=>({slot:t.slot})),declared:p.declared,skip:p.skip})),passed:[...s.passed],stack:s.stack.map(q=>({...q,card:definition(q.card).id})),events:s.events.map(e=>({...e})),last:s.last?{...s.last}:undefined,winners:[...s.winners],duel:s.duel?{actor:s.duel.actor,target:s.duel.target,submitted:Object.keys(s.duel.choices)}:undefined};}
export function getPlayerView(s:S,id:string,code='',revision=0):V{const v=getDisplayView(s,code,revision),p=s.players.find(p=>p.id===id);if(p)v.me={id,hand:[...p.hand],traps:p.traps.map(t=>({...t})),legal:getLegalActions(s,id),duelChoice:s.duel?.choices[id]};return v;}
export const isFinished=(s:S)=>s.phase==='finished';
