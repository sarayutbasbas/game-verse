import {instances,definition,tokenTarget} from './data.js';
import {resultFor} from './engine.js';
import type {PowerPetsState as State} from './types.js';
export function validatePowerPetsState(s:any):s is State{try{
 const nat=(v:any)=>Number.isSafeInteger(v)&&v>=0,same=(a:any,b:any)=>JSON.stringify(a)===JSON.stringify(b);
 if(!s||!['draw','play','effect','round-end','finished'].includes(s.phase)||!Array.isArray(s.players)||s.players.length<2||s.players.length>6||!['replay','shared'].includes(s.tieRule))return false;
 const n=s.players.length,ids=s.players.map((p:any)=>p.id);if(new Set(ids).size!==n||ids.some((id:any)=>typeof id!=='string'||!id)||!nat(s.turn)||s.turn>=n||!nat(s.starter)||s.starter>=n||!nat(s.round)||s.round<1||!nat(s.sequence)||!nat(s.serial)||s.matchId!==undefined&&typeof s.matchId!=='string')return false;
 if(s.players.some((p:any)=>typeof p.name!=='string'||!nat(p.score)||typeof p.out!=='boolean'||typeof p.shield!=='boolean'||!Array.isArray(p.hand)||!Array.isArray(p.discard)||p.out&&p.hand.length||p.hand.length>2))return false;
 for(const a of [s.deck,s.reserve,s.aside,s.events,s.history,s.roundWinners,s.winners])if(!Array.isArray(a))return false;
 if(s.reserve.length>1||s.aside.length!==(n===2?2:0)||(s.phase==='effect')!==!!s.pending)return false;
 if(s.pending&&(!['insert','reserve','compare'].includes(s.pending.kind)||s.pending.actor!==ids[s.turn]||!Array.isArray(s.pending.cards)||s.pending.cards.some((c:string)=>!definition(c))||s.pending.cards.length!==(s.pending.kind==='compare'?2:1)))return false;
 if(s.pending?.kind==='reserve'&&!same(s.pending.cards,s.reserve))return false;
 const all=[...s.deck,...s.reserve,...s.aside,...s.players.flatMap((p:any)=>[...p.hand,...p.discard]),...(s.pending?.kind==='insert'?s.pending.cards:[])],expected=instances();if(all.length!==21||new Set(all).size!==21||all.some(c=>!expected.includes(c)))return false;
 const end=s.phase==='round-end'||s.phase==='finished';if(s.history.length!==s.round-(end?0:1))return false;
 const scores=Object.fromEntries(ids.map((id:string)=>[id,0]));for(const [i,h]of s.history.entries()){if(h.round!==i+1||!h.hands||!h.discards||Object.keys(h.discards).length!==n||Object.keys(h.hands).some(id=>!ids.includes(id))||Object.values(h.hands).some(c=>typeof c!=='string'||!definition(c as string)))return false;const past=s.players.map((p:any)=>({id:p.id,hand:h.hands[p.id]?[h.hands[p.id]]:[],discard:h.discards[p.id],out:!h.hands[p.id]}));if(past.some((p:any)=>!Array.isArray(p.discard)||p.discard.some((c:string)=>!definition(c))))return false;const result=resultFor(past,s.tieRule);if(!same(result.winners,h.winners)||result.reason!==h.reason)return false;for(const id of h.winners)scores[id]++;}
 if(s.players.some((p:any)=>p.score!==scores[p.id]))return false;
 const winners=end?s.players.filter((p:any)=>p.score>=tokenTarget(n)).map((p:any)=>p.id):[];if(!same(winners,s.winners)||(s.phase==='finished')!==!!winners.length)return false;
 if(end){const h=s.history.at(-1);if(!same(h.winners,s.roundWinners)||!same(h.hands,Object.fromEntries(s.players.filter((p:any)=>!p.out).map((p:any)=>[p.id,p.hand[0]])))||s.pending)return false;}else if(s.roundWinners.length||s.players.some((p:any)=>p.score>=tokenTarget(n)))return false;
 if(!s.notes||typeof s.notes!=='object'||Object.entries(s.notes).some(([id,a])=>!ids.includes(id)||!Array.isArray(a)||(a as any[]).length>16||(a as any[]).some(x=>!nat(x.id)||typeof x.text!=='string'||!Array.isArray(x.cards)||x.cards.some((c:string)=>!definition(c)))))return false;
 if(s.events.length>50||s.events.some((e:any)=>!nat(e.id)||typeof e.text!=='string'))return false;
 return true;
 }catch{return false;}}
