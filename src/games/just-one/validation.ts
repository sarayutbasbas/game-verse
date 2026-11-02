import {CARD,normalize} from './data.js';
import {clues,clueCount} from './engine.js';
import type {JustOneState as State} from './types.js';
const int=(n:unknown,min:number,max:number)=>Number.isInteger(n)&&Number(n)>=min&&Number(n)<=max;
const text=(x:unknown)=>typeof x==='string'&&x.length>0&&x.length<=40&&!/[\s\p{C}\p{Z}]/u.test(x)&&/[\p{L}\p{N}\p{S}\p{P}]/u.test(x);
export function validateJustOneState(value:unknown):boolean{try{
 const s=value as State;
 if(!s||s.schema!==1||!Array.isArray(s.players)||s.players.length<3||s.players.length>7||s.players.some(p=>typeof p.id!=='string'||!p.id||typeof p.name!=='string'||!p.name)||new Set(s.players.map(p=>p.id)).size!==s.players.length||!Array.isArray(s.pack)||s.pack.length!==13||new Set(s.pack).size!==13||s.pack.some(id=>typeof id!=='string'||!Object.hasOwn(CARD,id))||!int(s.cursor,0,12)||!int(s.round,1,13)||!int(s.turn,0,s.players.length-1)||!int(s.starter,0,s.players.length-1)||s.turn!==(s.starter+s.round-1)%s.players.length||!['choose','writing','review','guess','judge','result','finished'].includes(s.phase)||!Array.isArray(s.history)||s.history.length>13)return false;
 if(s.prompt!==undefined&&!int(s.prompt,0,1000000)||s.replaced!==undefined&&(!Array.isArray(s.replaced)||s.replaced.length>100||new Set(s.replaced).size!==s.replaced.length||s.replaced.some(id=>typeof id!=='string'||!Object.hasOwn(CARD,id)||s.pack.includes(id))))return false;
 let cursor=0,score=0;for(const r of s.history){if(r.index!==cursor||!int(r.number,1,5)||!['correct','wrong','pass','cancelled'].includes(r.outcome)||r.spent!==(r.outcome==='wrong'&&cursor<12?2:1)||r.lostPoint!==(r.outcome==='wrong'&&cursor===12&&score>0)||(['correct','wrong'].includes(r.outcome)?!text(r.guess):r.guess!==undefined))return false;score+=Number(r.outcome==='correct')-Number(r.lostPoint);cursor+=r.spent;if(cursor>13)return false;}
 const resolved=['result','finished'].includes(s.phase),last=s.history.at(-1);
 if(s.round!==s.history.length+(resolved?0:1)||s.cursor!==(resolved?last!.index:cursor)||s.phase==='finished'!==(cursor===13)||resolved&&(!last||last.number!==s.number||last.guess!==s.guess)||s.phase==='result'&&cursor>=13)return false;
 if(s.phase==='choose'?s.number!==undefined:!int(s.number,1,5))return false;
 if(!s.clues||typeof s.clues!=='object'||Array.isArray(s.clues)||!s.votes||typeof s.votes!=='object'||Array.isArray(s.votes)||!Array.isArray(s.manual)||!Array.isArray(s.approved))return false;
 const ids=s.players.filter((_,i)=>i!==s.turn).map(p=>p.id),entries=Object.entries(s.clues);
 if(entries.some(([id,a])=>!ids.includes(id)||!Array.isArray(a)||a.length!==clueCount(s)||a.some(c=>!text(c))))return false;
 const all=clues(s);if(new Set(s.manual).size!==s.manual.length||s.manual.some(k=>!all.some(c=>c.key===k&&!c.automatic))||new Set(s.approved).size!==s.approved.length||s.approved.some(id=>!ids.includes(id))||Object.entries(s.votes).some(([id,v])=>!ids.includes(id)||typeof v!=='boolean'))return false;
 if(s.phase==='choose'&&(entries.length||s.manual.length||s.approved.length)||s.phase==='writing'&&(entries.length===ids.length||s.manual.length||s.approved.length))return false;
 if(['review','guess','judge'].includes(s.phase)&&entries.length!==ids.length)return false;
 if(s.phase==='review'&&s.approved.length===ids.length||['guess','judge'].includes(s.phase)&&(s.approved.length!==ids.length||!all.some(c=>!c.cancelled)))return false;
 if(!['judge','result','finished'].includes(s.phase)&&(s.guess!==undefined||Object.keys(s.votes).length))return false;
 if(s.phase==='judge'&&(!text(s.guess)||normalize(s.guess!)===normalize(CARD[s.pack[s.cursor]].words[s.number!-1])||ids.every(id=>s.votes[id]===true)||ids.every(id=>s.votes[id]===false)))return false;
 if(resolved&&(entries.length!==ids.length||s.approved.length!==ids.length||last!.outcome==='cancelled'&&all.some(c=>!c.cancelled)))return false;
 if(resolved){
  const exact=s.guess!==undefined&&normalize(s.guess)===normalize(CARD[s.pack[s.cursor]].words[s.number!-1]);
  if(last!.outcome==='correct'&&!exact&&!ids.every(id=>s.votes[id]===true)||last!.outcome==='wrong'&&(exact||!ids.every(id=>s.votes[id]===false))||['pass','cancelled'].includes(last!.outcome)&&Object.keys(s.votes).length||last!.outcome!=='cancelled'&&!all.some(c=>!c.cancelled))return false;
 }
 return true;
 }catch{return false;}}
