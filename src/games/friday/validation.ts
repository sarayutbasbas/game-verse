import {CARDS,card,PIRATES,pirate} from './data.js';
import type {FridayState} from './types.js';

export function validateFridayState(raw:unknown):raw is FridayState {
 try{
  const s=raw as FridayState,integer=(n:unknown,min=0,max=100000)=>Number.isSafeInteger(n)&&Number(n)>=min&&Number(n)<=max;
  if(!s||s.schema!==1||!Array.isArray(s.players)||s.players.length!==1||typeof s.players[0].id!=='string'||!s.players[0].id||typeof s.players[0].name!=='string'||!integer(s.level,1,4)||!integer(s.step,0,3)||!integer(s.round,1)||!integer(s.sequence)||!['choose','fight','cleanup','pirates','finished'].includes(s.phase))return false;
  if(s.maxLife!==(s.level===4?20:22)||!integer(s.life,0,s.maxLife)||!integer(s.budget)||!integer(s.agingAdded,0,s.level>=3?11:10)||typeof s.last!=='string'||typeof s.freeClosed!=='boolean')return false;
  const arrays=[s.deck,s.discard,s.aging,s.hazards,s.hazardDiscard,s.offer,s.destroyed,s.pirates,s.defeated,s.played,s.modifiers];if(arrays.some(a=>!Array.isArray(a)))return false;
  if(s.matchId!==undefined&&typeof s.matchId!=='string')return false;
  for(const p of s.played)if(!integer(p.uid,1,s.sequence)||!['boolean'].includes(typeof p.free)||typeof p.used!=='boolean'||typeof p.destroyed!=='boolean'||p.doubleBy!==undefined&&(!integer(p.doubleBy,1,s.sequence)||p.doubleBy===p.uid))return false;
  if(new Set(s.played.map(p=>p.uid)).size!==s.played.length)return false;
  if(s.modifiers.some(m=>!integer(m.source,1,s.sequence)||!['lower','lose1','lose2','highest','stop'].includes(m.ability)))return false;
  if(s.current){if(!['hazard','pirate'].includes(s.current.kind)||!integer(s.current.target)||!integer(s.current.free))return false;if(s.current.kind==='hazard'&&!card(s.current.id).hazard)return false;}
  if(s.current?.kind==='hazard'){
   const h=card(s.current.id).hazard!;if(s.step>2||s.current.target!==h.values[s.step as 0|1|2]||s.current.free!==h.free)return false;
  }
  if(s.current?.kind==='pirate'){
   const p=pirate(s.current.id),left=s.hazardDiscard.map(card);
   if(p.ability==='aging'){if(s.current.target%2||s.current.target>s.agingAdded*2||s.current.free!==p.free)return false;}
   else if(p.ability==='hazards'){if(s.current.target!==left.reduce((n,c)=>n+c.hazard!.values[2],0)||s.current.free!==left.reduce((n,c)=>n+c.hazard!.free,0))return false;}
   else if(s.current.target!==p.value||s.current.free!==p.free)return false;
  }
  const pirates=[...s.pirates,...s.defeated,...(s.current?.kind==='pirate'?[s.current.id]:[])];
  if(pirates.length!==2||new Set(pirates).size!==2||pirates.some(id=>!PIRATES.some(p=>p.id===id)))return false;
  if(s.pending){const p=s.pending;if(!['draw','sort','destroy','double','exchange','bottom'].includes(p.kind)||!integer(p.source,1,s.sequence)||!s.played.some(q=>q.uid===p.source&&q.used&&!q.destroyed)||!integer(p.remaining,1,3)||!Array.isArray(p.cards)||p.cards.length>3||p.kind!=='sort'&&p.cards.length)return false;}
  const all=[...s.deck,...s.discard,...s.aging,...s.hazards,...s.hazardDiscard,...s.offer,...s.destroyed,...s.played.map(p=>p.card),...(s.current?.kind==='hazard'?[s.current.id]:[]),...s.pending?.cards??[]];
  if(all.length!==CARDS.length||new Set(all).size!==CARDS.length||all.some(id=>!CARDS.some(c=>c.id===id)))return false;
  if([...s.hazards,...s.hazardDiscard,...s.offer].some(id=>card(id).kind!=='knowledge')||s.aging.some(id=>card(id).kind!=='aging'))return false;
  if(s.aging.length!==(s.level>=3?11:10)-s.agingAdded||s.level<3&&!s.destroyed.includes('a3'))return false;
  if(s.phase==='choose'&&(s.current||s.played.length||s.pending||s.step===3||s.offer.length<1||s.offer.length>2))return false;
  if(s.phase==='pirates'&&(s.step!==3||s.current||s.played.length||s.pending||s.offer.length||!s.pirates.length))return false;
  if(['fight','cleanup'].includes(s.phase)&&(!s.current||s.offer.length||(s.current.kind==='pirate')!==(s.step===3)))return false;
  if(s.phase==='cleanup'&&(s.pending||s.current?.kind!=='hazard'))return false;
  if(s.phase!=='finished'&&(s.outcome||s.reason||s.defeated.length===2))return false;
  if(s.phase==='finished'&&(!['won','lost'].includes(s.outcome??'')||s.outcome==='won'&&(s.defeated.length!==2||s.current||s.played.length)||s.outcome==='lost'&&s.life!==0))return false;
  return true;
 }catch{return false;}
}
