import type {Catalog,Card,Context,NameState,LocalPlayer,Intent,Proposal,LocalView} from './types.js';
const fail=(message:string):never=>{throw Error(message);};
const string=(x:unknown,max=30):x is string=>typeof x==='string'&&!!x.trim()&&Array.from(x.trim()).length<=max;
const normal=(s:string)=>s.normalize('NFC').trim().replace(/\s+/gu,' ');
const finite=(n:unknown)=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
export function validateCatalog(c:any):c is Catalog{return !!c&&typeof c==='object'&&string(c.id,80)&&string(c.rulesVersion,80)&&['development','user-approved-web','official'].includes(c.provenance)&&Array.isArray(c.breeds)&&c.breeds.length<=20&&new Set(c.breeds.map((b:any)=>b.id)).size===c.breeds.length&&c.breeds.every((b:any)=>b&&string(b.id,50)&&string(b.name,50)&&/^c\d{2,3}$/.test(b.art)&&/^c\d{2,3}$/.test(b.leashArt)&&Number.isSafeInteger(b.ordinary)&&b.ordinary>=0&&b.ordinary<=10&&Number.isSafeInteger(b.leashed)&&b.leashed>=0&&b.leashed<=10)&&['cat','gluta','gollum'].every(k=>Number.isSafeInteger(c[k])&&c[k]>=0&&c[k]<=20&&/^c\d{2,3}$/.test(c.specialArt?.[k]))&&finite(c.nearMs)&&c.nearMs<=250;}
export function catalogCards(c:Catalog):Card[]{let n=0;return [...c.breeds.flatMap(b=>[...Array.from({length:b.ordinary},()=>({id:`k${++n}`,kind:'dog' as const,breed:b.id,art:b.art})),...Array.from({length:b.leashed},()=>({id:`k${++n}`,kind:'leash' as const,breed:b.id,art:b.leashArt}))]),...(['cat','gluta','gollum'] as const).flatMap(kind=>Array.from({length:c[kind]},()=>({id:`k${++n}`,kind,art:c.specialArt[kind]})))];}
function randomIndex(n:number,random:()=>number){const x=random();if(!Number.isFinite(x)||x<0||x>=1)fail('แหล่งสุ่มไม่ถูกต้อง');return Math.floor(x*n);}
function shuffle<T>(a:T[],random:()=>number){for(let i=a.length-1;i>0;i--){const j=randomIndex(i+1,random);[a[i],a[j]]=[a[j],a[i]];}return a;}
export function createInitialState(catalog:Catalog,seats:Pick<LocalPlayer,'id'|'name'|'avatar'>[],random:()=>number,matchId:string,first=0):NameState{
 if(!validateCatalog(catalog)||!string(matchId,100))fail('ข้อมูลชุดการ์ดไม่ถูกต้อง');if(seats.length<2||seats.length>6||new Set(seats.map(p=>p.id)).size!==seats.length||seats.some(p=>!string(p.id,100)||!string(p.name,24)||!Number.isInteger(p.avatar)||p.avatar<0||p.avatar>5)||!Number.isInteger(first)||first<0||first>=seats.length)fail('จัดผู้เล่น 2–6 คน พร้อมชื่อและที่นั่งก่อนเริ่ม');
 const cards=catalogCards(catalog),nonG=cards.filter(c=>c.kind!=='gollum');if(!nonG.length||cards.length>300)fail('ต้องมีการ์ดที่ไม่ใช่กอลลั่มอย่างน้อยหนึ่งใบ');
 // Equivalent to conditioning repeated shuffles on a non-Gollum first card, without an unbounded loop.
 const opener=nonG[randomIndex(nonG.length,random)].id,deck=shuffle(cards.filter(c=>c.id!==opener).map(c=>c.id),random);deck.push(opener);
 return {gameId:'name-it',schema:1,matchId,rulesVersion:catalog.rulesVersion,catalog:structuredClone(catalog),cards,players:seats.map(p=>({...p,name:normal(p.name),cards:[]})),deck,current:null,turn:first,round:0,revision:0,phase:'ready',memory:{},lastContext:null,context:null,taps:[],armedAt:null,forceManual:false,inspected:false,pendingWinner:null,history:[],winners:[],event:'setup'};
}
const card=(s:NameState,id=s.current)=>s.cards.find(c=>c.id===id)!;
export function contextFor(s:NameState,c:Card):Context{
 if(c.kind==='gollum'){if(!s.lastContext)fail('กอลลั่มต้องมี action ก่อนหน้า');return {...s.lastContext!,criterion:'first'};}
 if(c.kind==='cat'||c.kind==='gluta')return {mode:'tap',criterion:c.kind==='cat'?'last':'first'};
 const memory=s.memory[c.breed!];if(!memory)return {mode:'breed',breed:c.breed,answer:s.catalog.breeds.find(b=>b.id===c.breed)!.name,criterion:'first'};
 return c.kind==='leash'?{mode:'owner',breed:c.breed,owner:memory.owner,criterion:'first'}:{mode:'nickname',breed:c.breed,answer:memory.nickname,owner:memory.owner,criterion:'first'};
}
export const scorePlayer=(s:NameState,p:LocalPlayer)=>p.cards.reduce((n,id)=>n+(card(s,id).kind==='cat'?-1:1),0);
export function proposal(s:NameState):Proposal{
 if(s.forceManual)return {candidate:null,uncertain:true,reason:'กลับเข้าเกมระหว่างเปิดการ์ด ให้ตกลงผลในวงอีกครั้ง'};
 if(s.context?.mode!=='tap')return {candidate:null,uncertain:true,reason:'คนในวงเลือกผู้ที่พูดถูกต้องก่อน ระบบไม่ได้ฟังหรือบันทึกเสียง'};
 const sorted=[...s.taps].sort((a,b)=>a.at-b.at),last=s.context.criterion==='last';
 if(!sorted.length||last&&sorted.length<s.players.length)return {candidate:null,uncertain:true,reason:'ข้อมูลการแตะยังไม่ครบ ให้ผู้เล่นตกลงผลด้วยตนเอง ไม่มีการแจกการ์ดอัตโนมัติ'};
 const target=last?sorted.at(-1)!:sorted[0],other=last?sorted.at(-2):sorted[1];if(other&&Math.abs(target.at-other.at)<=s.catalog.nearMs)return {candidate:null,uncertain:true,reason:'การแตะใกล้กัน อุปกรณ์อาจแยกไม่ได้ ให้คนในวงตกลงผู้รับ'};
 return {candidate:target.seat,uncertain:false,reason:last?'ผู้แตะช้าที่สุดจากข้อมูลที่เครื่องบันทึก':'ผู้แตะก่อนจากข้อมูลที่เครื่องบันทึก'};
}
function needsName(s:NameState){const c=card(s);return !!c&&['dog','leash'].includes(c.kind)&&!s.memory[c.breed!];}
function settle(s:NameState,recipient:string,manualOverride:boolean){const c=card(s),p=s.players.find(p=>p.id===recipient)!;p.cards.push(c.id);s.history.push({card:c.id,recipient,points:c.kind==='cat'?-1:1,round:s.round,opener:s.players[s.turn].id,context:structuredClone(s.context!),manualOverride,inspected:s.inspected});s.lastContext=structuredClone(s.context);s.current=null;s.pendingWinner=null;s.turn=(s.turn+1)%s.players.length;s.phase=s.deck.length?'settled':'finished';s.event=s.phase==='finished'?'finish':'award';if(s.phase==='finished'){const high=Math.max(...s.players.map(p=>scorePlayer(s,p)));s.winners=s.players.filter(p=>scorePlayer(s,p)===high).map(p=>p.id);}}
export function applyAction(state:NameState,a:Intent,clock=0):NameState{
 const shapes:Record<string,string[]>={draw:['type'],arm:['type','round'],touch:['type','round','seat','at'],judge:['type','round'],inspect:['type','round'],confirm:['type','round','recipient','override'],name:['type','round','nickname']};
 if(!a||typeof a!=='object'||!shapes[a.type]||Object.keys(a).sort().join()!==shapes[a.type].sort().join())fail('รูปแบบคำสั่งไม่ถูกต้อง');
 if('round'in a&&a.round!==state.round)fail('การ์ดเปลี่ยนไปแล้ว กรุณาเลือกจากใบปัจจุบัน');if(state.phase==='finished')fail('จบเกมแล้ว');
 if(a.type==='touch'&&state.phase==='answer'&&state.taps.some(t=>t.seat===a.seat))return state;
 const s=structuredClone(state);
 switch(a.type){
 case 'draw':if(!['ready','settled'].includes(s.phase)||!s.deck.length)fail('ตัดสินการ์ดใบนี้ให้เสร็จก่อน');s.current=s.deck.pop()!;s.round++;s.context=contextFor(s,card(s));s.phase='revealing';s.taps=[];s.armedAt=null;s.forceManual=false;s.inspected=false;s.event='draw';break;
 case 'arm':if(s.phase!=='revealing'||!finite(clock))fail('ยังเปิดการ์ดไม่เสร็จ');s.phase='answer';s.armedAt=clock;s.event='arm';break;
 case 'touch':if(s.phase!=='answer'||!s.players.some(p=>p.id===a.seat)||!finite(a.at)||s.armedAt===null||a.at<s.armedAt||!finite(clock)||a.at>clock+1)fail('แตะได้หลังภาพเปิดครบเท่านั้น');s.taps.push({seat:a.seat,at:a.at});s.event='touch';break;
 case 'judge':if(s.phase!=='answer')fail('ยังไม่ถึงขั้นตัดสิน');s.phase='judge';s.event='judge';break;
 case 'inspect':if(s.phase!=='judge')fail('ตรวจคำตอบได้หลังจบการตอบใบนี้แล้ว');s.inspected=true;s.event='inspect';break;
 case 'confirm':{if(s.phase!=='judge'||!s.players.some(p=>p.id===a.recipient)||typeof a.override!=='boolean')fail('เลือกผู้รับและยืนยันในขั้นตัดสิน');const p=proposal(s);if((p.uncertain||p.candidate!==a.recipient)&&!a.override)fail('ผลนี้ต้องให้คนในวงยืนยันการตัดสินเอง');if(needsName(s)){s.pendingWinner=a.recipient;s.phase='naming';s.event='naming';}else settle(s,a.recipient,a.override);break;}
 case 'name':{if(s.phase!=='naming'||!s.pendingWinner||!string(a.nickname,30))fail('ตั้งชื่อให้น้อง 1–30 ตัวอักษร');const nickname=normal(a.nickname);if(Object.values(s.memory).some(m=>m.nickname.toLowerCase()===nickname.toLowerCase()))fail('ชื่อนี้ใช้กับน้องอีกสายพันธุ์แล้ว กรุณาตั้งชื่อใหม่');const winner=s.pendingWinner!;s.memory[card(s).breed!]={nickname,owner:winner};settle(s,winner,true);break;}
 }
 s.revision++;return s;
}
/** A recovered race is incomplete, regardless of saved times. Never infer a winner after reload. */
export function recoverState(state:NameState):NameState{const s=structuredClone(state);if(['revealing','answer'].includes(s.phase)){s.phase='judge';s.taps=[];s.armedAt=null;s.forceManual=true;s.pendingWinner=null;s.revision++;s.event='judge';}return s;}
export function getDisplayView(s:NameState):LocalView{
 const reveal=['judge','naming'].includes(s.phase),c=card(s),expected=s.context?.mode==='owner'?s.players.find(p=>p.id===s.context!.owner)?.name:s.context?.answer;
 return {matchId:s.matchId,phase:s.phase,revision:s.revision,round:s.round,remaining:s.deck.length,opener:s.players[s.turn].id,current:c?{id:c.id,art:c.art}:null,players:s.players.map(p=>({id:p.id,name:p.name,avatar:p.avatar,score:scorePlayer(s,p),positive:p.cards.filter(id=>card(s,id).kind!=='cat').length,negative:p.cards.filter(id=>card(s,id).kind==='cat').length,tapped:s.taps.some(t=>t.seat===p.id)})),event:s.event,winners:[...s.winners],lastRecipient:s.history.at(-1)?.recipient,pendingWinner:s.pendingWinner,...reveal?{judgement:{proposal:proposal(s),...s.inspected?{expected,mode:s.context!.mode,criterion:s.context!.criterion,...s.context!.mode==='owner'?{ownerSeat:s.players.findIndex(p=>p.id===s.context!.owner)+1}:{}}:{},taps:s.taps.map(t=>({...t})),needsName:needsName(s)}}:{},...s.phase==='finished'?{memory:Object.entries(s.memory).map(([id,m])=>({breed:s.catalog.breeds.find(b=>b.id===id)!.name,nickname:m.nickname,owner:s.players.find(p=>p.id===m.owner)!.name}))}:{}};
}
export const getPlayerView=getDisplayView;
export const isFinished=(s:NameState)=>s.phase==='finished';
