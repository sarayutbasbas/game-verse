import {CARDS,CARD,normalize} from './data.js';
import type {JustOneState as State,JustOneAction as Action,JustOneView as View,Clue,Result} from './types.js';
export const clueCount=(s:State)=>s.players.length===3?2:1;
export const answer=(s:State)=>s.number?CARD[s.pack[s.cursor]].words[s.number-1]:undefined;
export const score=(s:State)=>s.history.reduce((n,r)=>n+(r.outcome==='correct'?1:0)-(r.lostPoint?1:0),0);
export function clues(s:State):Clue[]{const all=s.players.flatMap((p,i)=>(s.clues[p.id]??[]).map((text,j)=>({key:`${i}:${j}`,owner:p.id,text})));return all.map(c=>{const automatic=normalize(c.text)===normalize(answer(s)??'')||all.filter(x=>normalize(x.text)===normalize(c.text)).length>1;return {...c,automatic,cancelled:automatic||s.manual.includes(c.key)};});}
export function createInitialState(seats:{id:string;name:string}[],random:()=>number=Math.random,starter?:string):State{
 if(seats.length<3||seats.length>7||new Set(seats.map(p=>p.id)).size!==seats.length||seats.some(p=>!p.id||!p.name))throw Error('Just One ใช้ผู้เล่น 3–7 คน');
 if(starter!==undefined&&!seats.some(p=>p.id===starter))throw Error('ไม่พบผู้เล่นเริ่มต้น');
 const pack=CARDS.map(c=>c.id);for(let i=pack.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pack[i],pack[j]]=[pack[j],pack[i]];}
 const first=starter?seats.findIndex(p=>p.id===starter):Math.floor(random()*seats.length);
 return {schema:1,prompt:0,replaced:[],starter:first,players:seats.map(p=>({id:p.id,name:p.name})),pack:pack.slice(0,13),cursor:0,turn:first,round:1,phase:'choose',clues:{},manual:[],approved:[],votes:{},history:[]};
}
export const replacementPool=(s:State)=>CARDS.filter(c=>!s.pack.includes(c.id)&&!(s.replaced??[]).includes(c.id));
function clearPrompt(s:State){delete s.number;delete s.guess;s.clues={};s.manual=[];s.approved=[];s.votes={};s.phase='choose';s.prompt=(s.prompt??0)+1;}
export function getLegalActions(s:State,id:string):Action['type'][] {
 if(!s.players.some(p=>p.id===id))return [];const active=s.players[s.turn].id===id,replace=replacementPool(s).length?['jo-replace' as const]:[];
 switch(s.phase){case'choose':return active?['jo-number',...replace]:[];case'writing':return !active?[...s.clues[id]?[]:['jo-clues' as const],...Object.keys(s.clues).length?[]:['jo-repick' as const],...replace]:[];case'review':return !active?['jo-cancel',...s.approved.includes(id)?[]:['jo-review' as const],...replace]:[];case'guess':return active?['jo-guess','jo-pass']:[];case'judge':return !active?['jo-vote']:[];case'result':return active?['jo-next']:[];default:return [];}
}
function finish(s:State,outcome:Result['outcome']){
 const spent=outcome==='wrong'&&s.cursor<12?2:1,lostPoint=outcome==='wrong'&&s.cursor===12&&score(s)>0;
 s.history.push({index:s.cursor,number:s.number!,outcome,...s.guess?{guess:s.guess}:{},spent,lostPoint});s.phase=s.cursor+spent>=13?'finished':'result';
}
const fields:Record<Action['type'],string>={'jo-number':'number,round,type','jo-clues':'clues,round,type','jo-cancel':'cancelled,key,round,type','jo-review':'round,type','jo-guess':'round,text,type','jo-pass':'round,type','jo-vote':'correct,round,type','jo-next':'round,type','jo-repick':'round,type','jo-replace':'round,type'};
function word(value:unknown){return typeof value==='string'&&normalize(value).length>0&&value.length<=40&&!/[\s\p{C}\p{Z}]/u.test(value)&&/[\p{L}\p{N}\p{S}\p{P}]/u.test(value);}
export function applyAction(state:State,id:string,a:Action,random:()=>number=Math.random):State{
 if(!a||typeof a!=='object'||Object.keys(a).sort().join(',')!==fields[a.type]||a.round!==state.round||!getLegalActions(state,id).includes(a.type))throw Error('การกระทำนี้ยังใช้ไม่ได้ หรือรอบเปลี่ยนไปแล้ว');
 if(a.type==='jo-number'&&(!Number.isInteger(a.number)||a.number<1||a.number>5)||a.type==='jo-clues'&&(!Array.isArray(a.clues)||a.clues.length!==clueCount(state)||a.clues.some(c=>!word(c)))||a.type==='jo-guess'&&(!word(a.text))||a.type==='jo-vote'&&typeof a.correct!=='boolean'||a.type==='jo-cancel'&&(typeof a.cancelled!=='boolean'||!clues(state).some(c=>c.key===a.key&&!c.automatic)))throw Error('ตรวจข้อความและตัวเลือกอีกครั้ง ใช้คำเดียวไม่เกิน 40 ตัวอักษร');
 const s=structuredClone(state);
 switch(a.type){
 case'jo-number':s.number=a.number;s.phase='writing';break;
 case'jo-repick':clearPrompt(s);break;
 case'jo-replace':{const pool=replacementPool(s),chosen=pool[Math.floor(random()*pool.length)];s.replaced=[...s.replaced??[],s.pack[s.cursor]];s.pack[s.cursor]=chosen.id;clearPrompt(s);break;}
 case'jo-clues':s.clues[id]=a.clues.map(c=>c.normalize('NFC').trim());if(s.players.filter(p=>p.id!==s.players[s.turn].id).every(p=>s.clues[p.id]))s.phase='review';break;
 case'jo-cancel':s.manual=s.manual.filter(k=>k!==a.key);if(a.cancelled)s.manual.push(a.key);s.approved=[];break;
 case'jo-review':s.approved.push(id);if(s.approved.length===s.players.length-1){if(clues(s).some(c=>!c.cancelled))s.phase='guess';else finish(s,'cancelled');}break;
 case'jo-guess':s.guess=a.text.normalize('NFC').trim();if(normalize(s.guess)===normalize(answer(s)!))finish(s,'correct');else s.phase='judge';break;
 case'jo-pass':finish(s,'pass');break;
 case'jo-vote':s.votes[id]=a.correct;{const values=s.players.filter(p=>p.id!==s.players[s.turn].id).map(p=>s.votes[p.id]);if(values.every(v=>v===true))finish(s,'correct');else if(values.every(v=>v===false))finish(s,'wrong');}break;
 case'jo-next':s.cursor+=s.history.at(-1)!.spent;s.turn=(s.turn+1)%s.players.length;s.round++;s.prompt=0;s.phase='choose';delete s.number;delete s.guess;s.clues={};s.manual=[];s.approved=[];s.votes={};break;
 }
 return s;
}
export function getDisplayView(s:State,code='',revision=0):View {
 const revealed=s.phase==='result'||s.phase==='finished',hintPhase=['guess','judge','result','finished'].includes(s.phase);
 return {gameId:'just-one',matchId:s.matchId,code,revision,phase:s.phase,prompt:s.prompt??0,replacementCount:(s.replaced??[]).length,round:s.round,turn:s.players[s.turn].id,number:s.number,score:score(s),remaining:13-s.cursor-(revealed?s.history.at(-1)!.spent:1),clueCount:clueCount(s),players:s.players.map(p=>({id:p.id,name:p.name,submitted:!!s.clues[p.id],approved:s.approved.includes(p.id),voted:p.id in s.votes})),hints:hintPhase?clues(s).filter(c=>!c.cancelled).map(c=>c.text):[],...s.guess?{guess:s.guess}:{},...revealed?{result:{word:answer(s)!,outcome:s.history.at(-1)!.outcome,lostPoint:s.history.at(-1)!.lostPoint,spent:s.history.at(-1)!.spent}}:{},history:s.history.map(r=>({word:CARD[s.pack[r.index]].words[r.number-1],outcome:r.outcome,guess:r.guess,lostPoint:r.lostPoint}))};
}
export function getPlayerView(s:State,id:string,code='',revision=0):View {
 const v=getDisplayView(s,code,revision);if(!s.players.some(p=>p.id===id))return v;const giver=id!==s.players[s.turn].id;
 return {...v,me:{id,ownClues:[...s.clues[id]??[]],legal:getLegalActions(s,id),...giver&&s.number?{word:answer(s)}:{},...giver&&['review','guess','judge','result','finished'].includes(s.phase)?{review:clues(s)}:{},...id in s.votes?{vote:s.votes[id]}:{}}};
}
export const isFinished=(s:State)=>s.phase==='finished';
