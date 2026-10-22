import {PENS,SPECIES,FACES,type DraftosaurusState} from './types.js';
import {species,PEN} from './data.js';
import {copies,rounds,picksPerRound,scorePlayer,canPlace} from './engine.js';
export function validateDraftosaurusState(s:any):s is DraftosaurusState{try{
 if(!s||!['rolling','drafting','finished'].includes(s.phase)||!Array.isArray(s.players)||s.players.length<2||s.players.length>5||new Set(s.players.map((p:any)=>p.id)).size!==s.players.length)return false;
 const n=s.players.length,per=picksPerRound(n),finished=s.phase==='finished';
 if(!Number.isInteger(s.roller)||s.roller<0||s.roller>=n||!Number.isInteger(s.round)||s.round<1||s.round>rounds(n)||!Number.isInteger(s.pick)||s.pick<1||s.pick>per||!Number.isSafeInteger(s.sequence)||s.sequence<0||!Number.isSafeInteger(s.rollSerial)||s.rollSerial<0||s.matchId!==undefined&&typeof s.matchId!=='string')return false;
 const turns=(s.round-1)*per+s.pick-1;
 if(s.rollSerial!==turns+(s.phase==='rolling'?0:1)||s.phase==='drafting'&&!FACES.includes(s.die)||s.phase==='rolling'&&s.die!==undefined||finished&&(s.round!==rounds(n)||s.pick!==per||!FACES.includes(s.die)))return false;
 if(!Array.isArray(s.bag)||!Array.isArray(s.discarded)||!Array.isArray(s.winners))return false;
 const all=[...s.bag,...s.discarded];const placed=finished?12:turns;
 for(const p of s.players){
 if(!p||typeof p.id!=='string'||!p.id||typeof p.name!=='string'||!p.zoo||Object.keys(p.zoo).sort().join(',')!==[...PENS].sort().join(',')||!Array.isArray(p.hand))return false;
 for(const k of PENS){const z=p.zoo[k];if(!Array.isArray(z)||z.length>PEN[k].capacity||k==='forest'&&new Set(z.map(species)).size>1||k==='meadow'&&new Set(z.map(species)).size!==z.length)return false;all.push(...z);}
 if(Object.values(p.zoo).flat().length!==placed||p.hand.length!==(finished?0:6-(s.pick-1)*(n===2?2:1)))return false;all.push(...p.hand);
 if(p.choice){const a=p.choice;if(s.phase!=='drafting'||typeof a.dinosaur!=='string'||!p.hand.includes(a.dinosaur)||!PENS.includes(a.pen)||!canPlace(s,p.id,a.dinosaur,a.pen)||(n===2?typeof a.discard!=='string'||a.discard===a.dinosaur||!p.hand.includes(a.discard):a.discard!==undefined))return false;}
 }
 const expected=SPECIES.flatMap(k=>Array.from({length:copies(n)},(_,i)=>`${k}-${i}`));
 if(all.length!==expected.length||new Set(all).size!==all.length||all.some(id=>!expected.includes(id)))return false;
 if(s.discarded.length!==(n===2?placed*n:0)||s.bag.length!==expected.length-6*n*s.round||s.players.every((p:any)=>p.choice))return false;
 if(finished){const scores=s.players.map((p:any)=>({id:p.id,...scorePlayer(s,p)})),best=Math.max(...scores.map((p:any)=>p.total)),ties=scores.filter((p:any)=>p.total===best),fewest=Math.min(...ties.map((p:any)=>p.trexCount)),ids=ties.filter((p:any)=>p.trexCount===fewest).map((p:any)=>p.id);if(JSON.stringify(s.winners)!==JSON.stringify(ids))return false;}else if(s.winners.length)return false;
 if(s.lastReveal!==undefined&&(!Array.isArray(s.lastReveal)||s.lastReveal.length!==n||s.lastReveal.some((r:any)=>!s.players.some((p:any)=>p.id===r.id&&PENS.includes(r.pen)&&p.zoo[r.pen].includes(r.dinosaur)))||new Set(s.lastReveal.map((r:any)=>r.id)).size!==n))return false;
 return true;
 }catch{return false;}}
