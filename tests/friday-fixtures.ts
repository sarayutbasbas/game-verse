import * as E from '../src/games/friday/engine.js';
import {card} from '../src/games/friday/data.js';
import type {FridayAction,FridayState,FridayView} from '../src/games/friday/types.js';
export const rng=(seed:number)=>()=>{seed|=0;seed=seed+0x6d2b79f5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
export const seats=[{id:'solo',name:'นักผจญภัย'}];
export function battle(ids:string[],hazard='h18',level:1|2|3|4=1):FridayState {
 const s=E.createInitialState(seats,rng(17),undefined,level);
 s.hazards.push(...s.offer.splice(0));
 const pull=(id:string)=>{for(const list of [s.deck,s.discard,s.hazards,s.hazardDiscard,s.aging,s.destroyed]){const i=list.indexOf(id);if(i>=0){list.splice(i,1);break;}}};
 pull(hazard);s.current={kind:'hazard',id:hazard,target:card(hazard).hazard!.values[0],free:card(hazard).hazard!.free};
 for(const id of ids){pull(id);s.played.push({uid:++s.sequence,card:id,free:true,used:false,destroyed:false});}
 s.agingAdded=(level>=3?11:10)-s.aging.length;s.phase='fight';return s;
}
/** Play only from the authorized projection; no deck order or undisclosed aging identity. */
export function choose(v:FridayView):FridayAction {
 const aa=v.me!.legal,e=v.evaluation,find=(t:FridayAction['type'])=>aa.find(a=>a.type===t),worth=(id:string)=>{const c=card(id);return c.value+(c.ability==='destroy'?3:c.ability==='life1'?3:c.ability==='draw2'?2:0);};
 if(v.phase==='choose')return aa.filter(a=>a.type==='fr-choose').sort((a,b)=>{
  const rate=(a:FridayAction)=>a.type==='fr-choose'?worth(a.card)*2-card(a.card).hazard!.values[v.step]*.7+card(a.card).hazard!.free*.3:0;return rate(b)-rate(a);
 })[0];
 if(v.phase==='pirates')return aa.filter(a=>a.type==='fr-pirate')[0];
 if(v.phase==='cleanup'){
  const trash=aa.filter(a=>a.type==='fr-trash').sort((a,b)=>{const rate=(a:FridayAction)=>a.type==='fr-trash'?card(v.played.find(p=>p.uid===a.target)!.card).kind==='aging'?-10:card(v.played.find(p=>p.uid===a.target)!.card).value:99;return rate(a)-rate(b);});
  const a=trash[0];if(a?.type==='fr-trash'){const c=card(v.played.find(p=>p.uid===a.target)!.card);if(c.kind==='aging'||c.value<=0&&c.ability==='none')return a;}return find('fr-continue')!;
 }
 if(v.pending){
  if(v.pending.kind==='sort'){
   if(find('fr-sort-draw')&&v.pending.count<3)return find('fr-sort-draw')!;
   const peek=v.me!.peek,discard=peek.filter(id=>card(id).kind==='aging'||card(id).value<0).sort((a,b)=>card(a).value-card(b).value)[0];
   const order=peek.filter(id=>id!==discard).sort((a,b)=>worth(b)-worth(a));return aa.find(a=>a.type==='fr-sort-finish'&&a.discard===discard&&JSON.stringify(a.order)===JSON.stringify(order))!;
  }
  if(v.pending.kind==='draw')return find('fr-effect-draw')??find('fr-skip-effect')!;
  const targets=aa.filter(a=>a.type==='fr-target'),rate=(a:FridayAction)=>{if(a.type!=='fr-target')return 0;const c=card(v.played.find(p=>p.uid===a.target)!.card);return v.pending?.kind==='double'?c.value:(c.kind==='aging'?-12:worth(c.id));};
  targets.sort((a,b)=>v.pending!.kind==='double'?rate(b)-rate(a):rate(a)-rate(b));return targets[0]??find('fr-skip-effect')!;
 }
 const uses=aa.filter(a=>a.type==='fr-use'),ability=(a:FridayAction)=>{if(a.type!=='fr-use')return 'none';const uid=a.copy?.at(-1)??a.source;return card(v.played.find(p=>p.uid===uid)!.card).ability;};
 const good=(a:FridayAction)=>{const skill=ability(a),bad=v.played.some(p=>!p.destroyed&&(card(p.card).kind==='aging'||card(p.card).value<0)),positive=v.played.some(p=>!p.destroyed&&card(p.card).value>0&&p.doubleBy===undefined);if(skill==='life1'||skill==='life2')return v.life<v.maxLife;if(skill==='destroy')return bad;if(skill==='double')return positive&&e.power<e.target;if(skill==='lower')return v.step>0&&v.step<3&&e.power<e.target;if(skill==='exchange1'||skill==='exchange2'||skill==='bottom')return bad;if(skill==='sort'||skill==='draw1'||skill==='draw2')return e.power<e.target;return false;};
 const use=uses.filter(good).sort((a,b)=>{const pr=(a:FridayAction)=>ability(a).startsWith('life')?0:ability(a)==='destroy'?1:ability(a)==='double'?2:3;return pr(a)-pr(b);})[0];
 if(use)return use;
 const finish=find('fr-finish');if(finish&&e.power>=e.target)return finish;
 if(e.free>0)return aa.find(a=>a.type==='fr-draw'&&!a.paid)!;
 if(finish&&v.step===0&&(v.life<13||e.target-e.power>=2))return finish;
 if(finish&&v.life<e.target-e.power+2)return finish;
 return find('fr-draw')??finish!;
}
