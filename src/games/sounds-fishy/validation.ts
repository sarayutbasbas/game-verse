import type {SoundsFishyState as State} from './types.js';
import {QUESTION,QUESTIONS} from './questions.js';
import {scoreRound} from './engine.js';
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
export function validateSoundsFishyState(s:any):s is State{try{
 if(!s||!['thinking','guessing','round-end','finished'].includes(s.phase)||!Array.isArray(s.players)||s.players.length<4||s.players.length>10)return false;
 const n=s.players.length,ids=s.players.map((p:any)=>p.id);if(new Set(ids).size!==n||s.players.some((p:any)=>typeof p.id!=='string'||!p.id||typeof p.name!=='string'||!Number.isSafeInteger(p.score)||p.score<0))return false;
 if(!Number.isInteger(s.round)||s.round<1||s.round>s.totalRounds||s.totalRounds!==n*(n<=5?2:1)||!Number.isInteger(s.starter)||s.starter<0||s.starter>=n||s.guesser!==(s.starter+s.round-1)%n||!Number.isSafeInteger(s.sequence)||s.sequence<0||!Number.isSafeInteger(s.openedAt)||s.openedAt<0||s.matchId!==undefined&&typeof s.matchId!=='string')return false;
 const end=s.phase==='round-end'||s.phase==='finished',guesser=ids[s.guesser];if(!s.roles||Object.keys(s.roles).length!==n-1||ids.some((id:string)=>id===guesser?s.roles[id]!==undefined:!['red','blue'].includes(s.roles[id]))||Object.values(s.roles).filter(v=>v==='blue').length!==1)return false;
 for(const list of [s.ready,s.flips])if(!Array.isArray(list)||new Set(list).size!==list.length||list.some((id:string)=>!ids.includes(id)||id===guesser))return false;
 if(s.phase==='thinking'&&s.flips.length||!end&&(s.flips.some((id:string)=>s.roles[id]==='blue')||s.flips.length>=n-2))return false;
 if(!Array.isArray(s.history)||s.history.length!==s.round-(end?0:1)||!Array.isArray(s.deck)||s.deck.length!==QUESTIONS.length-s.round)return false;
 const used=s.history.map((r:any)=>r.question);if(!end)used.push(s.question);else if(s.history.at(-1)?.question!==s.question)return false;
 if([...used,...s.deck].length!==QUESTIONS.length||new Set([...used,...s.deck]).size!==QUESTIONS.length||[...used,...s.deck].some(id=>!QUESTION[id]))return false;
 const scores=Object.fromEntries(ids.map((id:string)=>[id,0]));
 for(const [i,r]of s.history.entries()){
  if(r.guesser!==ids[(s.starter+i)%n]||!ids.includes(r.blue)||r.blue===r.guesser||!Array.isArray(r.flips)||new Set(r.flips).size!==r.flips.length||r.flips.some((id:string)=>!ids.includes(id)||id===r.guesser)||!['blue','bank','all-red'].includes(r.outcome))return false;
  if(r.outcome==='blue'?(r.flips.at(-1)!==r.blue||r.flips.length>n-2):r.flips.includes(r.blue)||r.outcome==='all-red'&&r.flips.length!==n-2||r.outcome==='bank'&&r.flips.length>=n-2)return false;
  const points=scoreRound(s.players,r.guesser,r.blue,r.flips,r.outcome);if(Object.keys(r.points??{}).length!==n||ids.some((id:string)=>r.points[id]!==points[id]))return false;for(const id of ids)scores[id]+=points[id];
 }
 if(s.players.some((p:any)=>p.score!==scores[p.id]))return false;
 if(end){const last=s.history.at(-1);if(!same(last.flips,s.flips)||last.blue!==Object.keys(s.roles).find(id=>s.roles[id]==='blue'))return false;}
 if((s.phase==='finished')!==(end&&s.round===s.totalRounds))return false;
 const best=Math.max(...s.players.map((p:any)=>p.score)),winners=s.phase==='finished'?s.players.filter((p:any)=>p.score===best).map((p:any)=>p.id):[];if(!same(s.winners,winners))return false;
 return true;
}catch{return false;}}
