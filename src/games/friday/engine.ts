import {AGING,STARTING,KNOWLEDGE,PIRATES,card,pirate} from './data.js';
import type {Ability,Evaluation,FridayAction,FridayState,FridayView,Played} from './types.js';

const optional = new Set<Ability>(['life1','life2','draw1','draw2','destroy','double','copy','lower','sort','exchange1','exchange2','bottom']);
function shuffle<T>(a:T[],random:()=>number):T[]{for(let i=a.length-1;i>0;i--){const r=random();if(!Number.isFinite(r)||r<0||r>=1)throw Error('ค่าสุ่มไม่ถูกต้อง');const j=Math.floor(r*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const active=(s:FridayState,uid:number)=>s.played.find(p=>p.uid===uid&&!p.destroyed);
const live=(s:FridayState)=>s.played.filter(p=>!p.destroyed);
const effects=(s:FridayState)=>[...live(s).map(p=>({source:p.uid,ability:card(p.card).ability})),...s.modifiers.filter(m=>active(s,m.source))];
const currentPirate=(s:FridayState)=>s.current?.kind==='pirate'?pirate(s.current.id):undefined;

export function evaluate(s:FridayState):Evaluation {
 const es=effects(s),zeros=new Set<number>(),doubled=s.played.filter(p=>!p.destroyed&&p.doubleBy!==undefined&&active(s,p.doubleBy)).map(p=>p.uid);
 for(let i=0;i<es.filter(e=>e.ability==='highest').length;i++){
  const candidates=live(s).filter(p=>!zeros.has(p.uid)&&card(p.card).value>0).sort((a,b)=>card(b.card).value-card(a.card).value||Number(doubled.includes(a.uid))-Number(doubled.includes(b.uid))||a.uid-b.uid);
  if(candidates.length)zeros.add(candidates[0].uid);
 }
 const value=(p:Played)=>p.destroyed||zeros.has(p.uid)?0:card(p.card).value*(doubled.includes(p.uid)?2:1);
 let counted=[...s.played];
 if(currentPirate(s)?.ability==='half'){
  const ages=live(s).filter(p=>card(p.card).kind==='aging'),others=s.played.filter(p=>!ages.includes(p)).sort((a,b)=>value(b)-value(a)||a.uid-b.uid);
  counted=[...ages,...others.slice(0,Math.max(0,Math.ceil(s.played.length/2)-ages.length))];
 }
 const power=counted.reduce((n,p)=>n+value(p),0)+(currentPirate(s)?.ability==='bonus'?s.played.length:0);
 const target=s.current?.kind==='hazard'?card(s.current.id).hazard!.values[Math.max(0,s.step-es.filter(e=>e.ability==='lower').length) as 0|1|2]:s.current?.target??0;
 const stopped=es.some(e=>e.ability==='stop'&&active(s,e.source)?.free);
 return {power,target,free:stopped||s.freeClosed?0:Math.max(0,(s.current?.free??0)-s.played.filter(p=>p.free).length),cost:currentPirate(s)?.ability==='cost2'?2:1,tax:es.reduce((n,e)=>n+(e.ability==='lose1'?1:e.ability==='lose2'?2:0),0),zeroed:[...zeros],counted:counted.map(p=>p.uid),doubled};
}
function lose(s:FridayState,reason:string){s.life=0;s.phase='finished';s.outcome='lost';s.reason=reason;s.last=reason;}
function pay(s:FridayState,n:number):boolean {if(s.life<n){lose(s,'ชีวิตไม่พอจ่าย การผจญภัยจบลง');return false;}s.life-=n;return true;}
function ensureDeck(s:FridayState,random:()=>number):boolean {
 if(s.deck.length)return true;
 if(s.current?.kind==='pirate'&&!s.discard.length&&!s.pending?.cards.length){lose(s,'จั่วการ์ดต่อสู้ที่มีทั้งหมดแล้ว แต่ยังเอาชนะโจรสลัดไม่ได้');return false;}
 if(!s.aging.length){lose(s,'ต้องสับสำรับใหม่ แต่การ์ดแก่ตัวหมดแล้ว');return false;}
 const age=s.aging.pop()!;s.agingAdded++;s.deck=shuffle([...s.discard.splice(0),age],random);s.last='สับกองทิ้งใหม่พร้อมการ์ดแก่ตัว 1 ใบ';return true;
}
function draw(s:FridayState,free:boolean,random:()=>number,index?:number){
 if(!ensureDeck(s,random))return;
 const p:Played={uid:++s.sequence,card:s.deck.pop()!,free,used:false,destroyed:false};
 if(index===undefined)s.played.push(p);else s.played.splice(index,0,p);
 s.last=`เปิด ${card(p.card).name} · พลัง ${card(p.card).value}`;
}
function offer(s:FridayState,random:()=>number){
 while(!s.hazards.length&&s.step<3){
  if(s.step===2){s.step=3;s.phase='pirates';s.last='ผ่านครบสามสีแล้ว เลือกโจรสลัดลำแรก';return;}
  s.step=(s.step+1) as 1|2;s.hazards=shuffle(s.hazardDiscard.splice(0),random);
 }
 if(s.step===3){s.phase='pirates';return;}
 s.phase='choose';s.offer=s.hazards.splice(Math.max(0,s.hazards.length-2));s.last='เลือกความเสี่ยงที่จะเผชิญหนึ่งใบ';
}
export function createInitialState(seats:{id:string;name:string}[],random:()=>number=Math.random,_starter?:string,level:1|2|3|4=1):FridayState {
 if(seats.length!==1||!seats[0].id||![1,2,3,4].includes(level))throw Error('Friday เป็นเกมเดี่ยว ต้องมีผู้เล่น 1 คน');
 const normal=AGING.filter(id=>!card(id).difficult&&(level>=3||id!=='a3')),hard=AGING.filter(id=>card(id).difficult);
 const aging=[...shuffle(hard,random),...shuffle(normal,random)],deck=[...STARTING];
 let added=0;if(level>=2){deck.push(aging.pop()!);added++;}
 const s:FridayState={schema:1,players:structuredClone(seats),level,phase:'choose',step:0,life:level===4?18:20,maxLife:level===4?20:22,sequence:0,round:1,deck:shuffle(deck,random),discard:[],aging,hazards:shuffle([...KNOWLEDGE],random),hazardDiscard:[],offer:[],destroyed:level<3?['a3']:[],pirates:shuffle(PIRATES.map(p=>p.id),random).slice(0,2),defeated:[],played:[],modifiers:[],freeClosed:false,budget:0,agingAdded:added,last:''};
 offer(s,random);return s;
}
function clearFight(s:FridayState){
 for(const p of s.played)(p.destroyed?s.destroyed:s.discard).push(p.card);
 s.played=[];s.modifiers=[];delete s.pending;delete s.current;s.freeClosed=false;s.budget=0;s.round++;
}
function finish(s:FridayState,random:()=>number){
 const e=evaluate(s),won=e.power>=e.target;
 if(!won&&s.current?.kind==='pirate'){lose(s,'การ์ดต่อสู้หมดแล้วและพลังยังไม่พอเอาชนะโจรสลัด');return;}
 if(!pay(s,e.tax))return;
 if(won){
  const c=s.current!;
  if(c.kind==='hazard'){s.discard.push(c.id);clearFight(s);offer(s,random);}
  else {s.defeated.push(c.id);clearFight(s);if(s.defeated.length===2){s.phase='finished';s.outcome='won';s.last='ชนะโจรสลัดทั้งสองลำ! โรบินสันออกจากเกาะได้แล้ว';}else{s.phase='pirates';s.last='เลือกโจรสลัดอีกลำเพื่อสู้ต่อ';}}
 }else{
  const diff=e.target-e.power;if(!pay(s,diff))return;
  s.budget=diff;s.phase='cleanup';s.last=`เสียชีวิต ${diff+e.tax} ใช้ส่วนต่าง ${diff} เป็นงบทำลายการ์ดที่เปิดอยู่`;
 }
}
function permutations<T>(xs:T[]):T[][]{return xs.length?xs.flatMap((x,i)=>permutations(xs.filter((_,j)=>j!==i)).map(rest=>[x,...rest])):[[]];}
export function getLegalActions(s:FridayState,id:string):FridayAction[]{
 if(s.players[0]?.id!==id||s.phase==='finished')return [];
 if(s.phase==='choose')return [...s.offer.map(card=>({type:'fr-choose' as const,card})),...(s.offer.length===1?[{type:'fr-skip-hazard' as const}]:[])];
 if(s.phase==='pirates')return s.pirates.map(card=>({type:'fr-pirate',card}));
 if(s.phase==='cleanup')return [{type:'fr-continue'},...live(s).filter(p=>(card(p.card).kind==='aging'?2:1)<=s.budget).map(p=>({type:'fr-trash' as const,target:p.uid}))];
 const drawable=s.deck.length>0||s.discard.length>0||s.current?.kind!=='pirate';
 const pending=s.pending;
 if(pending){
  if(pending.kind==='sort'){
   const done:FridayAction[]=[...permutations(pending.cards).map(order=>({type:'fr-sort-finish' as const,order})),...pending.cards.flatMap(discard=>permutations(pending.cards.filter(id=>id!==discard)).map(order=>({type:'fr-sort-finish' as const,order,discard})))];
   return [...done,...(pending.cards.length<3&&drawable?[{type:'fr-sort-draw' as const}]:[])];
  }
  if(pending.kind==='draw')return [...(drawable?[{type:'fr-effect-draw' as const}]:[]),{type:'fr-skip-effect'}];
  const targets=live(s).filter(p=>p.uid!==pending.source&&(pending.kind!=='double'||p.doubleBy===undefined));
  return [{type:'fr-skip-effect'},...targets.flatMap(p=>pending.kind==='bottom'&&p.free?[{type:'fr-target' as const,target:p.uid},{type:'fr-target' as const,target:p.uid,draw:false}]:[{type:'fr-target' as const,target:p.uid}])];
 }
 const actions:FridayAction[]=drawable?[{type:'fr-draw'}]:[],e=evaluate(s);
 if(e.free>0&&drawable)actions.push({type:'fr-draw',paid:true});
 if(s.played.length&&(s.current?.kind==='hazard'||e.power>=e.target)||!drawable)actions.push({type:'fr-finish'});
 for(const p of live(s)){
  const a=card(p.card).ability;if(p.used||!optional.has(a))continue;
  if(a!=='copy'){actions.push({type:'fr-use',source:p.uid});continue;}
  const copies=(chain:number[])=>{for(const q of live(s)){const ability=card(q.card).ability;if(q.uid===p.uid||chain.includes(q.uid)||ability==='none')continue;const next=[...chain,q.uid];if(ability==='copy')copies(next);else actions.push({type:'fr-use',source:p.uid,copy:next});}};copies([]);
 }
 return actions;
}
const key=(x:unknown):string=>JSON.stringify(x,(_k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
export function applyAction(state:FridayState,id:string,action:FridayAction,random:()=>number=Math.random):FridayState {
 const legal=getLegalActions(state,id).find(a=>key(a)===key(action));if(!legal)throw Error('ยังทำรายการนี้ไม่ได้ ตรวจการ์ดหรือทำความสามารถที่ค้างให้เสร็จก่อน');
 const s=structuredClone(state),a=legal;
 if(a.type==='fr-choose'){
  s.offer.splice(s.offer.indexOf(a.card),1);s.hazardDiscard.push(...s.offer.splice(0));const h=card(a.card).hazard!;s.current={kind:'hazard',id:a.card,target:h.values[s.step as 0|1|2],free:h.free};s.phase='fight';s.last='เปิดการ์ดต่อสู้ทีละใบ แล้วค่อยตัดสินใจจบ';
 }else if(a.type==='fr-skip-hazard'){s.hazardDiscard.push(...s.offer.splice(0));offer(s,random);
 }else if(a.type==='fr-pirate'){
  s.pirates.splice(s.pirates.indexOf(a.card),1);const p=pirate(a.card),left=s.hazardDiscard.map(card);s.current={kind:'pirate',id:p.id,target:p.ability==='aging'?s.agingAdded*2:p.ability==='hazards'?left.reduce((n,c)=>n+c.hazard!.values[2],0):p.value,free:p.ability==='hazards'?left.reduce((n,c)=>n+c.hazard!.free,0):p.free};s.phase='fight';s.last='ต้องชนะโจรสลัด ไม่มีการยอมแพ้เฉพาะการต่อสู้นี้';
 }else if(a.type==='fr-draw'){
  const e=evaluate(s),free=e.free>0&&!a.paid;if(a.paid)s.freeClosed=true;if(free||pay(s,e.cost))draw(s,free,random);
 }else if(a.type==='fr-use'){
  const source=active(s,a.source)!;source.used=true;const ability=card(a.copy?.length?active(s,a.copy.at(-1)!)!.card:source.card).ability;
  if(ability==='life1'||ability==='life2'){s.life=Math.min(s.maxLife,s.life+(ability==='life1'?1:2));s.last='รับชีวิตจากกองสำรองแล้ว';}
  else if(['lower','lose1','lose2','highest','stop'].includes(ability))s.modifiers.push({source:source.uid,ability});
  else if(ability==='draw1'||ability==='draw2')s.pending={kind:'draw',source:source.uid,remaining:ability==='draw1'?1:2,cards:[]};
  else if(ability==='sort')s.pending={kind:'sort',source:source.uid,remaining:3,cards:[]};
  else s.pending={kind:ability==='exchange1'||ability==='exchange2'?'exchange':ability as 'destroy'|'double'|'bottom',source:source.uid,remaining:ability==='exchange2'?2:1,cards:[]};
 }else if(a.type==='fr-effect-draw'){
  draw(s,false,random);if(--s.pending!.remaining===0)delete s.pending;
 }else if(a.type==='fr-skip-effect')delete s.pending;
 else if(a.type==='fr-sort-draw'){
  if(ensureDeck(s,random))s.pending!.cards.push(s.deck.pop()!);
 }else if(a.type==='fr-sort-finish'){
  if(a.discard)s.discard.push(a.discard);s.deck.push(...[...a.order].reverse());delete s.pending;s.last='เรียงการ์ดกลับบนกองแล้ว';
 }else if(a.type==='fr-target'){
  const p=active(s,a.target)!,pending=s.pending!,idx=s.played.indexOf(p);
  if(pending.kind==='destroy'){p.destroyed=true;s.last='คว่ำการ์ดไว้ นำออกจากเกมตอนจบการต่อสู้';}
  if(pending.kind==='double'){p.doubleBy=pending.source;s.last='กำหนดใบที่จะคูณสองตอนสรุปผลแล้ว';}
  if(pending.kind==='exchange'){s.played.splice(idx,1);s.discard.push(p.card);draw(s,p.free,random,idx);}
  if(pending.kind==='bottom'&&ensureDeck(s,random)){
   s.played.splice(idx,1);s.deck.unshift(p.card);if(p.free&&a.draw!==false)draw(s,true,random,idx);
  }
  if(--pending.remaining===0)delete s.pending;
 }else if(a.type==='fr-finish')finish(s,random);
 else if(a.type==='fr-trash'){const p=active(s,a.target)!;s.budget-=card(p.card).kind==='aging'?2:1;p.destroyed=true;s.last='เลือกทำลายแล้ว กดไปต่อเมื่อจัดสำรับเสร็จ';}
 else if(a.type==='fr-continue'){s.hazardDiscard.push(s.current!.id);clearFight(s);offer(s,random);}
 return s;
}
export function score(s:FridayState){
 const owned=[...s.deck,...s.discard,...s.played.filter(p=>!p.destroyed).map(p=>p.card),...s.pending?.cards??[]];
 const cards=owned.reduce((n,id)=>n+(card(id).kind==='aging'?-5:card(id).value),0),pirates=s.defeated.length*15,life=s.outcome==='won'?s.life*5:0,hazards=-3*(s.hazards.length+s.hazardDiscard.length+s.offer.length+(s.current?.kind==='hazard'?1:0));
 return {cards,pirates,life,hazards,total:cards+pirates+life+hazards};
}
export function getDisplayView(s:FridayState,code='',revision=0):FridayView {
 return {gameId:'friday',code,revision,turn:s.players[0].id,matchId:s.matchId,players:structuredClone(s.players),phase:s.phase,level:s.level,step:s.step,life:s.life,maxLife:s.maxLife,round:s.round,deckCount:s.deck.length,agingCount:s.aging.length,hazardCount:s.hazards.length,discard:[...s.discard],hazardDiscard:[...s.hazardDiscard],destroyed:s.destroyed.filter(id=>s.level>=3||id!=='a3'),offer:[...s.offer],pirates:[...s.pirates],defeated:[...s.defeated],current:s.current?{...s.current}:undefined,played:structuredClone(s.played),evaluation:evaluate(s),budget:s.budget,pending:s.pending?{kind:s.pending.kind,remaining:s.pending.remaining,count:s.pending.cards.length}:undefined,last:s.last,outcome:s.outcome,reason:s.reason,...(isFinished(s)?{score:score(s)}:{})};
}
export function getPlayerView(s:FridayState,id:string,code='',revision=0):FridayView {
 if(s.players[0].id!==id)throw Error('ไม่พบผู้เล่น');return {...getDisplayView(s,code,revision),me:{id,legal:getLegalActions(s,id),peek:[...s.pending?.cards??[]]}};
}
export const isFinished=(s:FridayState)=>s.phase==='finished';
