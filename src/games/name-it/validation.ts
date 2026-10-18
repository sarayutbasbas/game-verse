import {catalogCards,contextFor,validateCatalog,scorePlayer} from './engine.js';
import type {NameState} from './types.js';
const int=(v:any,min=0,max=100000)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
const equal=(a:any,b:any):boolean=>a===b||!!a&&!!b&&typeof a==='object'&&typeof b==='object'&&Array.isArray(a)===Array.isArray(b)&&Object.keys(a).length===Object.keys(b).length&&Object.keys(a).every(k=>Object.prototype.hasOwnProperty.call(b,k)&&equal(a[k],b[k]));
export function validateState(s:any):s is NameState{try{
 if(!s||s.gameId!=='name-it'||s.schema!==1||typeof s.matchId!=='string'||!s.matchId||!validateCatalog(s.catalog)||s.rulesVersion!==s.catalog.rulesVersion||!Array.isArray(s.players)||s.players.length<2||s.players.length>6||new Set(s.players.map((p:any)=>p.id)).size!==s.players.length)return false;
 if(!['ready','revealing','answer','judge','naming','settled','finished'].includes(s.phase)||!int(s.turn,0,s.players.length-1)||!int(s.round,0,300)||!int(s.revision)||!['setup','draw','arm','touch','judge','inspect','naming','award','finish'].includes(s.event))return false;
 if(s.players.some((p:any)=>typeof p.id!=='string'||!p.id||typeof p.name!=='string'||!p.name.trim()||Array.from(p.name).length>24||!int(p.avatar,0,5)||!Array.isArray(p.cards)||p.cards.some((id:any)=>typeof id!=='string')))return false;
 const cards=catalogCards(s.catalog);if(!equal(cards,s.cards)||!Array.isArray(s.deck)||!Array.isArray(s.history)||!s.memory||typeof s.memory!=='object'||Array.isArray(s.memory))return false;
 const ids=[...s.deck,...s.current?[s.current]:[],...s.players.flatMap((p:any)=>p.cards)];if(ids.length!==cards.length||new Set(ids).size!==cards.length||!ids.every(id=>cards.some(c=>c.id===id)))return false;
 const has=['revealing','answer','judge','naming'].includes(s.phase);if(has!==!!s.current||s.round!==s.history.length+Number(has))return false;
 if(s.phase==='ready'&&(s.round||!s.deck.length)||s.phase==='settled'&&(!s.history.length||!s.deck.length)||s.phase==='finished'&&(s.deck.length||s.current)||s.phase==='naming'&&!s.players.some((p:any)=>p.id===s.pendingWinner)||s.phase!=='naming'&&s.pendingWinner!==null)return false;
 if(!Array.isArray(s.taps)||new Set(s.taps.map((t:any)=>t.seat)).size!==s.taps.length||s.taps.some((t:any)=>!s.players.some((p:any)=>p.id===t.seat)||typeof t.at!=='number'||!Number.isFinite(t.at)||t.at<0)||s.armedAt!==null&&(typeof s.armedAt!=='number'||!Number.isFinite(s.armedAt)||s.armedAt<0)||s.phase==='answer'&&s.armedAt===null||typeof s.forceManual!=='boolean'||typeof s.inspected!=='boolean')return false;
 const shadow:NameState={...s,memory:{},lastContext:null};const awarded:string[]=[];
 for(const [i,h] of s.history.entries()){
  const c=cards.find(c=>c.id===h.card);if(!c||h.round!==i+1||!s.players.some((p:any)=>p.id===h.recipient&&p.cards.includes(c.id))||h.points!==(c.kind==='cat'?-1:1)||typeof h.manualOverride!=='boolean'||typeof h.inspected!=='boolean'||!s.players.some((p:any)=>p.id===h.opener))return false;
  if(i&&s.players[(s.players.findIndex((p:any)=>p.id===s.history[i-1].opener)+1)%s.players.length].id!==h.opener)return false;
  const expected=contextFor(shadow,c);if(!equal(expected,h.context))return false;
  if(['dog','leash'].includes(c.kind)&&!shadow.memory[c.breed!]){const m=s.memory[c.breed!];if(!m||typeof m.nickname!=='string'||!m.nickname.trim()||Array.from(m.nickname).length>30||m.owner!==h.recipient)return false;shadow.memory[c.breed!]={nickname:m.nickname,owner:m.owner};}
  shadow.lastContext=expected;awarded.push(c.id);
 }
 if(new Set(awarded).size!==awarded.length||awarded.length!==s.players.reduce((n:number,p:any)=>n+p.cards.length,0)||!equal(shadow.memory,s.memory)||new Set(Object.values(s.memory).map((m:any)=>m.nickname.toLowerCase())).size!==Object.keys(s.memory).length||!equal(shadow.lastContext,s.lastContext))return false;
 if(s.history.length&&s.turn!==(s.players.findIndex((p:any)=>p.id===s.history.at(-1).opener)+1)%s.players.length)return false;
 if(has&&!equal(contextFor(shadow,cards.find(c=>c.id===s.current)!),s.context)||!has&&!equal(s.context,s.lastContext))return false;
 if(!Array.isArray(s.winners))return false;if(s.phase==='finished'){const high=Math.max(...s.players.map((p:any)=>scorePlayer(s,p))),w=s.players.filter((p:any)=>scorePlayer(s,p)===high).map((p:any)=>p.id);if(!equal(w,s.winners))return false;}else if(s.winners.length)return false;
 return true;
 }catch{return false;}}
