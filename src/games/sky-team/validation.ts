import {CONTROL,SCENARIOS} from './data.js';
import type {SkyState} from './types.js';
const int=(v:unknown,a:number,b:number)=>Number.isSafeInteger(v)&&Number(v)>=a&&Number(v)<=b;
export function validateSkyState(s:any):s is SkyState{try{
 if(!s||s.scenario!=='yul-intro'||!['planning','placement','reroll','resolution','finished'].includes(s.phase)||!Array.isArray(s.players)||s.players.length!==2||new Set(s.players.map((p:any)=>p.id)).size!==2||new Set(s.players.map((p:any)=>p.role)).size!==2||s.players.some((p:any)=>typeof p.id!=='string'||typeof p.name!=='string'||!['pilot','copilot'].includes(p.role)))return false;
 if(!int(s.round,1,7)||!int(s.axis,-7,7)||!int(s.position,0,6)||!int(s.coffee,0,3)||!int(s.rerolls,0,2)||!int(s.turn,0,1)||!int(s.sequence,0,10000)||!['setup','roll','place','reroll','round','finish'].includes(s.event))return false;
 if(!(s.speed===null||int(s.speed,2,12))||!(s.brakeAtEngine===null||[0,2,4,6].includes(s.brakeAtEngine)))return false;
 for(const [key,n] of [['gear',3],['flaps',4],['brakes',3]] as const)if(!Array.isArray(s[key])||s[key].length!==n||s[key].some((x:any)=>typeof x!=='boolean'))return false;
 for(const k of ['flaps','brakes'])if(s[k].some((x:boolean,i:number)=>x&&s[k].slice(0,i).some((b:boolean)=>!b)))return false;
 if(!Array.isArray(s.traffic)||s.traffic.length!==7||s.traffic.some((n:any,i:number)=>!int(n,0,SCENARIOS['yul-intro'].traffic[i]))||!Array.isArray(s.ready)||new Set(s.ready).size!==s.ready.length||s.ready.some((id:any)=>!s.players.some((p:any)=>p.id===id)))return false;
 if(!s.placements||typeof s.placements!=='object'||Array.isArray(s.placements)||!s.dice||!Array.isArray(s.history)||s.history.length!==s.round-1)return false;
 const ids:string[]=[];const placed:{pilot:number;copilot:number}={pilot:0,copilot:0};
 for(const [slot,v] of Object.entries(s.placements) as [string,any][]){const c=CONTROL[slot];if(!c||!v||!['pilot','copilot'].includes(v.role)||c.role!=='both'&&c.role!==v.role||!c.values.includes(v.value)||typeof v.die!=='string'||!v.die.startsWith(`${v.role}-${s.round}-`))return false;ids.push(v.die);placed[v.role as 'pilot'|'copilot']++;}
 for(const role of ['pilot','copilot'] as const){if(!Array.isArray(s.dice[role])||s.dice[role].some((d:any)=>!d||!int(d.value,1,6)||typeof d.id!=='string'||!d.id.startsWith(`${role}-${s.round}-`)))return false;for(const d of s.dice[role])ids.push(d.id);const owned=ids.filter(id=>id.startsWith(`${role}-${s.round}-`));if(owned.some(id=>!new RegExp(`^${role}-${s.round}-[0-3]$`).test(id)))return false;if(s.phase==='planning'?(s.dice[role].length||placed[role]):s.dice[role].length+placed[role]!==4)return false;}
 if(new Set(ids).size!==ids.length||ids.some(id=>!new RegExp(`^(pilot|copilot)-${s.round}-[0-3]$`).test(id)))return false;
 if(s.history.some((h:any,i:number)=>!h||h.round!==i+1||!int(h.position,0,6)||!int(h.axis,-2,2)||!Array.isArray(h.traffic)||h.traffic.length!==7||!h.placements||Object.keys(h.placements).length!==8))return false;
 if(s.phase==='reroll'){if(!s.reroll||!int(s.reroll.serial,1,s.sequence)||s.reroll.returnTurn!==s.turn||!s.reroll.choices||Object.keys(s.reroll.choices).some(r=>!['pilot','copilot'].includes(r)))return false;for(const role of ['pilot','copilot']){const a=s.reroll.choices[role];if(a&&(!Array.isArray(a)||new Set(a).size!==a.length||a.some((id:any)=>!s.dice[role].some((d:any)=>d.id===id))))return false;}}else if(s.reroll)return false;
 if(s.phase==='finished'){if(!s.result||typeof s.result.success!=='boolean'||!Array.isArray(s.result.reasons)||!s.result.reasons.length||s.result.reasons.some((r:any)=>typeof r!=='string'))return false;if(s.result.success&&(s.round!==7||s.position!==6||s.axis!==0||s.traffic.some(Boolean)||s.gear.some((x:boolean)=>!x)||s.flaps.some((x:boolean)=>!x)||s.speed===null||s.brakeAtEngine===null||s.speed>s.brakeAtEngine))return false;}else if(s.result||Math.abs(s.axis)>=3)return false;
 if(s.phase==='resolution'&&(Object.keys(s.placements).length!==8||s.round===7))return false;
 return true;
 }catch{return false;}}
