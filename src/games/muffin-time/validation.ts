import {instances,definition} from './data.js';
export function validateMuffinState(s:any):boolean{try{
 const int=(x:any,min=0)=>Number.isSafeInteger(x)&&x>=min,ids=s.players.map((p:any)=>p.id),known=(id:any)=>typeof id==='string'&&ids.includes(id);
 if(s.schema!==1||!Array.isArray(s.players)||s.players.length<2||s.players.length>8||new Set(ids).size!==ids.length||ids.some((id:any)=>typeof id!=='string'||!id)||!int(s.turn)||s.turn>=ids.length||![1,-1].includes(s.direction)||!['start','main','reaction','end','duel','finished'].includes(s.phase)||!int(s.sequence)||!int(s.serial)||!int(s.turnNumber,1)||typeof s.trapSet!=='boolean'||!['start','main','end'].includes(s.resume))return false;
 const all=[...s.deck,...s.discard,...s.players.flatMap((p:any)=>[...p.hand,...p.traps.map((t:any)=>t.card)]),...s.stack.map((q:any)=>q.card)],pack=instances();if(all.length!==pack.length||new Set(all).size!==pack.length||all.some((c:any)=>!pack.includes(c)))return false;
 const slots=s.players.flatMap((p:any)=>p.traps.map((t:any)=>t.slot));if(new Set(slots).size!==slots.length||slots.some((x:any)=>!/^t\d+$/.test(x)||Number(x.slice(1))>s.serial))return false;
 if(s.players.some((p:any)=>typeof p.name!=='string'||!Array.isArray(p.hand)||p.traps.length>3||typeof p.declared!=='boolean'||p.declared&&p.hand.length!==10||!int(p.skip)||p.traps.some((t:any)=>definition(t.card).kind!=='trap')))return false;
 if(!Array.isArray(s.passed)||new Set(s.passed).size!==s.passed.length||s.passed.length>=ids.length||s.passed.some((id:any)=>!known(id))||!['reaction','end'].includes(s.phase)&&s.passed.length)return false;
 if((s.phase==='reaction')!==(s.stack.length>0)||s.stack.some((q:any,i:number)=>!known(q.actor)||q.target!==undefined&&(!known(q.target)||q.target===q.actor)||typeof q.cancelled!=='boolean'||i>0&&definition(q.card).kind!=='counter'||i===0&&definition(q.card).kind==='counter'||definition(q.card).target&&!known(q.target)||definition(q.card).effect==='duel'))return false;
 if(s.last&&(!int(s.last.id,1)||s.last.id>s.serial||!['draw','play','claim','end'].includes(s.last.kind)||!known(s.last.actor)))return false;
 if(!Array.isArray(s.fired)||s.fired.some((x:any)=>typeof x!=='string')||!Array.isArray(s.events)||s.events.length>40||s.events.some((e:any,i:number)=>!int(e.id,1)||e.id>s.serial||i>0&&e.id<=s.events[i-1].id||typeof e.text!=='string'))return false;
 if((s.phase==='duel')!==!!s.duel)return false;if(s.duel){const q=s.duel;if(!known(q.actor)||!known(q.target)||q.actor===q.target||!q.choices||Object.keys(q.choices).length>1||Object.entries(q.choices).some(([id,c])=>![q.actor,q.target].includes(id)||!['rock','paper','scissors'].includes(c as string)))return false;}
 if(!Array.isArray(s.winners))return false;
 if(s.phase==='finished'){if(s.winners.length!==1||s.winners[0]!==s.players[s.turn].id||!s.players[s.turn].declared||s.players[s.turn].hand.length!==10)return false;}else if(s.winners.length)return false;
 return true;
 }catch{return false;}}
