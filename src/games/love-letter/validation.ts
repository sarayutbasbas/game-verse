import {instances,definition,FAVOR_TARGET,THANOS_LIFE} from './data.js';
import type {LoveLetterState as State} from './types.js';
export function validateLoveLetterState(s:any):s is State{try{
 if(!s||!['base','marvel'].includes(s.mode)||!['draw','play','effect','end','round-end','finished'].includes(s.phase)||!Array.isArray(s.players)||s.players.length<2||s.players.length>6)return false;
 const ids=s.players.map((p:any)=>p.id),n=ids.length,integer=(v:any)=>Number.isSafeInteger(v)&&v>=0;
 if(new Set(ids).size!==n||ids.some((id:any)=>typeof id!=='string'||!id)||!integer(s.turn)||s.turn>=n||!integer(s.sequence)||!integer(s.serial)||!integer(s.round)||s.round<1||typeof s.repeat!=='boolean'||s.matchId!==undefined&&typeof s.matchId!=='string')return false;
 if(s.players.some((p:any)=>typeof p.name!=='string'||!integer(p.favor)||!integer(p.power)||typeof p.out!=='boolean'||typeof p.protected!=='boolean'||!Array.isArray(p.hand)||!Array.isArray(p.discard)||p.out&&p.hand.length))return false;
 for(const list of [s.deck,s.thanosDeck,s.burn,s.aside,s.queue,s.events,s.history,s.winners,s.roundWinners])if(!Array.isArray(list))return false;
 if(s.queue.length>3||s.phase==='effect'&&!s.queue.length||s.phase!=='effect'&&s.queue.length||s.winners.some((id:string)=>!ids.includes(id))||new Set(s.winners).size!==s.winners.length)return false;
 if(s.queue.some((q:any)=>!['peek','guess','fight','top','bottom','copy'].includes(q.kind)||!ids.includes(q.actor)||!Array.isArray(q.cards)||q.cards.some((c:string)=>!definition(c))||!Array.isArray(q.targets)||q.targets.some((id:string)=>!ids.includes(id))||!Number.isSafeInteger(q.count)))return false;
 const inventory=[...s.deck,...s.thanosDeck,...s.burn,...s.aside,...s.players.flatMap((p:any)=>[...p.hand,...p.discard]),...s.queue.filter((q:any)=>q.kind==='top').flatMap((q:any)=>q.cards)];
 const expected=s.mode==='base'?instances('base'):[...instances('hero'),...instances('thanos')];
 if(inventory.length!==expected.length||new Set(inventory).size!==expected.length||inventory.some((c:string)=>!expected.includes(c)))return false;
 if(s.mode==='base'){if(s.thanos!==''||s.thanosDeck.length||s.burn.length>1||s.aside.length!==(n===2?3:0)||s.players.some((p:any)=>p.power))return false;const totals=Object.fromEntries(ids.map((id:string)=>[id,0]));for(const h of s.history){if(!integer(h.round)||!Array.isArray(h.winners)||!h.winners.length||!Array.isArray(h.bonus)||h.bonus.length>1||[...h.winners,...h.bonus].some((id:string)=>!ids.includes(id)))return false;for(const id of [...h.winners,...h.bonus])totals[id]++;}if(s.players.some((p:any)=>p.favor!==totals[p.id]))return false;if(s.phase==='finished'&&!s.players.some((p:any)=>p.favor>=FAVOR_TARGET[n]))return false;}
 else{if(!ids.includes(s.thanos)||s.burn.length||s.aside.length||s.history.length||s.players.some((p:any)=>p.out||p.protected||p.favor))return false;if(!integer(s.life.hero)||s.life.hero>6||!integer(s.life.thanos)||s.life.thanos>THANOS_LIFE[n])return false;for(const p of s.players)if([...p.hand,...p.discard].some((c:string)=>definition(c).side!==(p.id===s.thanos?'thanos':'hero')))return false;}
 if(!s.notes||typeof s.notes!=='object'||Object.entries(s.notes).some(([id,notes])=>!ids.includes(id)||!Array.isArray(notes)||(notes as any[]).some(x=>!integer(x.id)||typeof x.text!=='string'||!Array.isArray(x.cards)||x.cards.some((c:string)=>!definition(c)))))return false;
 if(s.events.some((e:any)=>!integer(e.id)||typeof e.text!=='string')||(s.phase==='finished')!==!!s.winners.length)return false;
 return true;
 }catch{return false;}}
