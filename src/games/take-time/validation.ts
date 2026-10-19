import {evaluate} from './engine.js';
import type {TakeTimeState} from './types.js';
export function validateTakeTimeState(value:unknown):value is TakeTimeState {
 try {
 const s=value as TakeTimeState;
 if(!s||s.schema!==1||typeof s.matchId!=='string'||s.clock!=='1-1'||!Number.isSafeInteger(s.attempt)||s.attempt<1||!Number.isInteger(s.bonus)||s.bonus<0||s.bonus>3||!['discussion','placement','resolution','finished'].includes(s.phase))return false;
 if(!Array.isArray(s.players)||s.players.length<2||s.players.length>4||new Set(s.players.map(p=>p.id)).size!==s.players.length||!s.players.every(p=>typeof p.id==='string'&&typeof p.name==='string'&&typeof p.opened==='boolean'&&Array.isArray(p.hand)&&Array.isArray(p.reserve)))return false;
 if(!Array.isArray(s.unused)||s.unused.length!==12||!Array.isArray(s.placed)||s.placed.length>12||!Number.isInteger(s.revealed)||s.revealed<0||s.revealed>6)return false;
 const all=[...s.unused,...s.players.flatMap(p=>[...p.hand,...p.reserve]),...s.placed.map(p=>p.card)];
 if(all.length!==24||new Set(all.map(c=>c.id)).size!==24||new Set(all.map(c=>`${c.suit}:${c.value}`)).size!==24||!all.every(c=>typeof c.id==='string'&&new RegExp(`^a${s.attempt}c(?:[0-9]|1[0-9]|2[0-3])$`).test(c.id)&&['solar','lunar'].includes(c.suit)&&Number.isInteger(c.value)&&c.value>=1&&c.value<=12))return false;
 if(!s.placed.every(p=>s.players.some(x=>x.id===p.owner)&&Number.isInteger(p.segment)&&p.segment>=0&&p.segment<6&&typeof p.faceup==='boolean')||s.placed.filter(p=>p.faceup).length>s.players.length+s.bonus)return false;
 const deal=12/s.players.length;
 for(const p of s.players){const used=s.placed.filter(c=>c.owner===p.id).length;if(p.hand.length+p.reserve.length+used!==deal)return false;
  if(p.reserve.length!==(s.players.length===2&&s.placed.length<4?2:0))return false;
 }
 if(s.placed.length){const first=s.players.findIndex(p=>p.id===s.placed[0].owner);if(!s.placed.every((p,i)=>p.owner===s.players[(first+i)%s.players.length].id))return false;}
 if(s.phase==='discussion')return s.placed.length===0&&s.revealed===0&&s.turn===undefined&&s.result===undefined&&!s.players.every(p=>p.opened);
 if(!s.players.every(p=>p.opened))return false;
 if(s.phase==='placement')return s.placed.length<12&&s.revealed===0&&s.result===undefined&&(s.placed.length===0?s.turn===undefined:s.turn===s.players[(s.players.findIndex(p=>p.id===s.placed.at(-1)!.owner)+1)%s.players.length].id);
 if(s.placed.length!==12||s.turn!==undefined)return false;
 if(s.phase==='resolution')return s.revealed<6&&s.result===undefined;
 const expected=evaluate(s);return s.revealed===6&&s.result?.success===expected.success&&JSON.stringify(s.result.sums)===JSON.stringify(expected.sums)&&s.result.checks.length===expected.checks.length&&s.result.checks.every((c,i)=>c.ok===expected.checks[i].ok&&c.label===expected.checks[i].label);
 }catch{return false;}
}
