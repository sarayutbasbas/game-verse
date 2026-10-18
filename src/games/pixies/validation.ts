import {CARD,CARDS} from './data.js';
import {scorePlayer} from './engine.js';
import type {PixiesState} from './types.js';
export function validatePixiesState(s:any):s is PixiesState{try{
 if(!s||!['playing','results','finished'].includes(s.phase)||!Array.isArray(s.players)||s.players.length<2||s.players.length>5||new Set(s.players.map((p:any)=>p.id)).size!==s.players.length||!Number.isInteger(s.round)||s.round<1||s.round>3||!Number.isSafeInteger(s.sequence)||s.sequence<0)return false;
 if(!['turn','starter','batchStart'].every(k=>Number.isInteger(s[k])&&s[k]>=0&&s[k]<s.players.length)||!Number.isInteger(s.picks)||s.picks<0||s.picks>(s.players.length===2?4:s.players.length)||!Array.isArray(s.deck)||!Array.isArray(s.market))return false;
 if(s.marketSlots!==undefined&&(!Array.isArray(s.marketSlots)||s.marketSlots.length>5||s.marketSlots.some((id:any)=>id!==null&&!s.market.includes(id))||s.marketSlots.filter(Boolean).length!==s.market.length||new Set(s.marketSlots.filter(Boolean)).size!==s.market.length))return false;
 if(s.pending&&(!CARD[s.pending.card]||!s.market.includes(s.pending.card)||s.phase!=='playing'))return false;
 const ids=[...s.deck,...s.market];
 for(const p of s.players){if(typeof p.id!=='string'||typeof p.name!=='string'||!Array.isArray(p.grid)||p.grid.length!==9||!Array.isArray(p.scores)||p.scores.length!==(s.phase==='playing'?s.round-1:s.round))return false;
 for(let i=0;i<9;i++){const v=p.grid[i];if(!v||!['up','down'].every(k=>v[k]===null||typeof v[k]==='string'&&!!CARD[v[k]]))return false;if(v.up&&CARD[v.up].number!==i+1)return false;for(const k of ['up','down'])if(v[k])ids.push(v[k]);}
 for(const r of p.scores)if(!['validated','spirals','crosses','special','zoneSize','zone','total'].every(k=>Number.isSafeInteger(r[k]))||r.total!==r.validated+r.spirals-r.crosses+r.special+r.zone)return false;
 if(s.phase!=='playing'&&JSON.stringify(p.scores.at(-1))!==JSON.stringify(scorePlayer(p,s.round)))return false;
 }
 if(ids.length!==70||new Set(ids).size!==70||ids.some(id=>!CARD[id]))return false;
 if(s.phase==='finished'&&(s.round!==3||!Array.isArray(s.winners)||!s.winners.length||s.winners.some((id:string)=>!s.players.some((p:any)=>p.id===id))))return false;
 return true;
}catch{return false;}}
