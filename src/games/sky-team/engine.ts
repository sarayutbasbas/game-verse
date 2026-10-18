import {CONTROLS,CONTROL,SCENARIOS} from './data.js';
import type {SkyState,SkyAction,SkyView,Role,Flight} from './types.js';
const roles:Role[]=['pilot','copilot'];
export const decisionKey=(s:SkyState)=>`${s.matchId??'fixture'}:${s.round}:${s.reroll?.serial??0}`;
export const altitude=(s:Flight)=>(7-s.round)*1000;
export const brake=(s:Flight)=>s.brakes.filter(Boolean).length*2;
export const bounds=(s:Flight)=>({blue:4+s.gear.filter(Boolean).length,orange:8+s.flaps.filter(Boolean).length});
export function flight(s:Flight):Flight{return structuredClone({round:s.round,axis:s.axis,position:s.position,speed:s.speed,coffee:s.coffee,rerolls:s.rerolls,gear:s.gear,flaps:s.flaps,brakes:s.brakes,traffic:s.traffic,placements:Object.fromEntries(Object.entries(s.placements).map(([k,v])=>[k,{role:v.role,value:v.value,die:v.die}])),brakeAtEngine:s.brakeAtEngine});}
export function createInitialState(seats:{id:string;name:string}[],_random:()=>number=Math.random):SkyState{
 if(seats.length!==2||new Set(seats.map(p=>p.id)).size!==2)throw Error('Sky Team ใช้ผู้เล่น 2 คน');
 return {scenario:'yul-intro',phase:'planning',players:seats.map((p,i)=>({...p,role:roles[i]})),dice:{pilot:[],copilot:[]},ready:[],turn:0,round:1,axis:0,position:0,speed:null,coffee:0,rerolls:1,gear:[false,false,false],flaps:[false,false,false,false],brakes:[false,false,false],traffic:[...SCENARIOS['yul-intro'].traffic],placements:{},brakeAtEngine:null,sequence:0,event:'setup',history:[]};
}
function roll(random:()=>number){const r=random();if(!Number.isFinite(r)||r<0||r>=1)throw Error('แหล่งสุ่มไม่ถูกต้อง');return 1+Math.floor(r*6);}
function startRound(s:SkyState,random:()=>number){for(const role of roles)s.dice[role]=[0,1,2,3].map(i=>({id:`${role}-${s.round}-${i}`,value:roll(random)}));s.turn=s.players.findIndex(p=>p.role===SCENARIOS[s.scenario].starters[s.round-1]);s.phase='placement';s.ready=[];s.event='roll';}
function failure(s:SkyState,...reasons:string[]){s.phase='finished';s.result={success:false,reasons};s.event='finish';}
function legalPlace(s:SkyState,role:Role,die:string,slot:string,adjust:number){
 const d=s.dice[role].find(d=>d.id===die),c=CONTROL[slot];if(!d||!c||s.placements[slot]||c.role!=='both'&&c.role!==role||!Number.isInteger(adjust)||Math.abs(adjust)>s.coffee||!c.values.includes(d.value+adjust))return false;
 if(c.kind==='flaps'&&s.flaps.slice(0,c.index).some(x=>!x)||c.kind==='brakes'&&s.brakes.slice(0,c.index).some(x=>!x))return false;
 return true;
}
export function getLegalActions(s:SkyState,id:string):SkyAction[]{
 const p=s.players.find(p=>p.id===id);if(!p||s.phase==='finished')return [];
 if(s.phase==='planning')return [{type:'sky-ready',epoch:decisionKey(s),ready:!s.ready.includes(id)}];
 if(s.phase==='resolution')return [{type:'sky-next'}];
 if(s.phase==='reroll'){
  if(s.reroll!.choices[p.role])return [];
  const dice=s.dice[p.role];return Array.from({length:1<<dice.length},(_,mask)=>({type:'sky-reroll-dice' as const,epoch:decisionKey(s),dice:dice.filter((_,i)=>mask&(1<<i)).map(d=>d.id)}));
 }
 const legal:SkyAction[]=s.rerolls>0?[{type:'sky-reroll'}]:[];
 if(s.players[s.turn].id!==id)return legal;
 for(const d of s.dice[p.role])for(const c of CONTROLS)for(let adjust=-s.coffee;adjust<=s.coffee;adjust++)if(legalPlace(s,p.role,d.id,c.id,adjust))legal.push({type:'sky-place',die:d.id,slot:c.id,adjust});
 return legal;
}
function resolve(s:SkyState){
 if(roles.some(r=>!s.placements[`axis-${r}`]||!s.placements[`engine-${r}`])){failure(s,'วางลูกเต๋าแกนและเครื่องยนต์ไม่ครบทั้งสองสี');return;}
 if(s.round===7){
 const reasons:string[]=[];
 if(s.position!==s.traffic.length-1)reasons.push('ความสูงหมดก่อนถึงสนามบิน');
 if(s.traffic.some(n=>n>0))reasons.push('ยังมีเครื่องบินขวางเส้นทาง');
 if(s.gear.some(x=>!x)||s.flaps.some(x=>!x))reasons.push('ล้อหรือแฟลปยังเปิดไม่ครบ');
 if(s.axis!==0)reasons.push('แกนเครื่องบินยังไม่อยู่แนวระดับ');
 if(s.speed===null||s.brakeAtEngine===null||s.speed>s.brakeAtEngine)reasons.push('ความเร็วเกินเบรก ณ ตอนวางเครื่องยนต์ครบคู่');
 s.phase='finished';s.result={success:reasons.length===0,reasons:reasons.length?reasons:['ลงจอดสำเร็จที่ Montréal–Trudeau']};s.event='finish';
 }else {s.phase='resolution';s.event='round';}
}
export function applyAction(state:SkyState,id:string,action:SkyAction,random:()=>number=Math.random):SkyState{
 // Exact intent comparison rejects extra actor/value fields and duplicate dice IDs.
 const legal=getLegalActions(state,id);if(!action||!legal.some(a=>Object.keys(action).sort().join()===Object.keys(a).sort().join()&&Object.entries(a).every(([k,v])=>JSON.stringify((action as any)[k])===JSON.stringify(v))))throw Error('ทำรายการไม่ได้ในขั้นตอนนี้ กรุณาเลือกใหม่จากข้อมูลล่าสุด');
 const s=structuredClone(state),p=s.players.find(p=>p.id===id)!;s.sequence++;
 if(action.type==='sky-ready'){s.ready=action.ready?[...s.ready,id]:s.ready.filter(x=>x!==id);if(s.ready.length===2)startRound(s,random);return s;}
 if(action.type==='sky-next'){s.history.push(flight(s));s.round++;s.phase='planning';s.ready=[];s.placements={};s.dice={pilot:[],copilot:[]};s.speed=null;s.brakeAtEngine=null;s.event='round';if(SCENARIOS[s.scenario].rerollAltitudes.includes(altitude(s) as 6000|2000))s.rerolls++;return s;}
 if(action.type==='sky-reroll'){s.rerolls--;s.reroll={serial:s.sequence,returnTurn:s.turn,choices:{}};s.phase='reroll';s.event='reroll';return s;}
 if(action.type==='sky-reroll-dice'){s.reroll!.choices[p.role]=[...action.dice];if(roles.every(r=>s.reroll!.choices[r])){for(const role of roles)for(const d of s.dice[role])if(s.reroll!.choices[role]!.includes(d.id))d.value=roll(random);s.turn=s.reroll!.returnTurn;delete s.reroll;s.phase='placement';s.event='roll';}return s;}
 const d=s.dice[p.role].find(d=>d.id===action.die)!,c=CONTROL[action.slot],value=d.value+action.adjust;s.dice[p.role]=s.dice[p.role].filter(x=>x.id!==d.id);s.coffee-=Math.abs(action.adjust);s.placements[c.id]={role:p.role,value,die:d.id};s.event='place';
 if(c.kind==='axis'&&roles.every(r=>s.placements[`axis-${r}`])){s.axis+=s.placements['axis-copilot'].value-s.placements['axis-pilot'].value;if(Math.abs(s.axis)>=3)failure(s,'เครื่องเอียงถึงขีดอันตรายและหมุนควง');}
 if(c.kind==='gear'&&!s.gear[c.index])s.gear[c.index]=true;
 if(c.kind==='flaps'&&!s.flaps[c.index])s.flaps[c.index]=true;
 if(c.kind==='brakes'&&!s.brakes[c.index])s.brakes[c.index]=true;
 if(c.kind==='coffee')s.coffee=Math.min(3,s.coffee+1);
 if(c.kind==='radio'){const target=s.position+value-1;if(s.traffic[target]>0)s.traffic[target]--;}
 if(c.kind==='engine'&&roles.every(r=>s.placements[`engine-${r}`])){
 s.speed=s.placements['engine-pilot'].value+s.placements['engine-copilot'].value;
 if(s.round===7&&s.position===s.traffic.length-1)s.brakeAtEngine=brake(s);
 else{const b=bounds(s),distance=s.speed<=b.blue?0:s.speed<=b.orange?1:2;for(let i=0;i<distance;i++){if(s.traffic[s.position]>0){failure(s,'ชนเครื่องบินในช่องปัจจุบันระหว่างเคลื่อน');break;}if(s.position===s.traffic.length-1){failure(s,'บินเลยสนามบิน');break;}s.position++;}}
 }
 if(s.phase!=='finished'){s.turn=1-s.turn;if(!s.dice.pilot.length&&!s.dice.copilot.length)resolve(s);}
 return s;
}
export function getDisplayView(s:SkyState,code:string,revision:number):SkyView{return {gameId:'sky-team',code,revision,scenario:s.scenario,phase:s.phase,players:s.players.map(p=>({id:p.id,name:p.name,role:p.role,ready:s.ready.includes(p.id)})),...flight(s),turn:s.phase==='placement'?s.players[s.turn].id:undefined,sequence:s.sequence,event:s.event,result:structuredClone(s.result),history:s.history.map(flight)};}
export function getPlayerView(s:SkyState,id:string):NonNullable<SkyView['me']>{const p=s.players.find(p=>p.id===id);if(!p)throw Error('ไม่พบผู้เล่น');return {id,role:p.role,dice:s.dice[p.role].map(d=>({id:d.id,value:d.value})),ready:s.ready.includes(id),rerollSubmitted:!!s.reroll?.choices[p.role],legal:getLegalActions(s,id)};}
export const isFinished=(s:SkyState)=>s.phase==='finished';
