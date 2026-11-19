import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../src/games/friday/engine.js';
import {CARDS,card,PIRATES} from '../src/games/friday/data.js';
import {validateFridayState as valid} from '../src/games/friday/validation.js';
import {battle,choose,rng,seats} from './friday-fixtures.js';
import type {FridayAction,FridayState} from '../src/games/friday/types.js';
const act=(s:FridayState,a:FridayAction)=>E.applyAction(s,'solo',a,rng(8));
test('Friday printed counts, knowledge values, four difficulty setups and actual conservation',()=>{
 assert.equal(CARDS.length,59);assert.equal(CARDS.filter(c=>c.kind==='knowledge').length,30);assert.equal(PIRATES.length,10);
 assert.deepEqual([1,2,3,4,5].map(n=>CARDS.filter(c=>c.hazard?.free===n).length),[10,8,6,4,2]);
 assert.equal(card('h26').value,3);assert.equal(card('h28').value,4);
 for(const level of [1,2,3,4] as const){const s=E.createInitialState(seats,rng(level),undefined,level);assert.ok(valid(s));assert.equal(s.deck.length,level===1?18:19);assert.equal(s.life,level===4?18:20);assert.equal(s.maxLife,level===4?20:22);assert.equal(s.aging.length,level===1?10:level===2?9:10);}
 assert.throws(()=>E.createInitialState([...seats,...seats],rng(1)));assert.throws(()=>E.createInitialState(seats,()=>1));
});
test('life zero is playable, insufficient payment loses, no automatic victory, defeat difference buys trash without a second charge',()=>{
 let s=battle(['s1'],'h28');s.life=1;s=act(s,{type:'fr-finish'});assert.equal(s.life,0);assert.equal(s.phase,'finished');
 s=battle(['s1'],'h18');s.life=1;s=act(s,{type:'fr-finish'});assert.equal(s.life,0);assert.equal(s.phase,'cleanup');assert.equal(s.budget,1);assert.ok(valid(s));
 s=act(s,{type:'fr-trash',target:1});assert.equal(s.life,0);s=act(s,{type:'fr-continue'});assert.ok(s.destroyed.includes('s1'));assert.ok(valid(s));
 s=battle(['s0'],'h0');assert.equal(s.phase,'fight');s.life=0;s=act(s,{type:'fr-finish'});assert.notEqual(s.phase,'finished');assert.ok(s.discard.includes('h0'));
 s=battle(['s0'],'h18');s.life=0;s=act(s,{type:'fr-draw',paid:true});assert.equal(s.outcome,'lost');
});
test('aging penalties mandatory at settlement; destruction cancels stop/tax but still occupies a free position',()=>{
 let s=battle(['a7','h2'],'h18');assert.equal(E.evaluate(s).free,0);s=act(s,{type:'fr-use',source:2});s=act(s,{type:'fr-target',target:1});assert.equal(E.evaluate(s).free,1);assert.equal(s.played.length,2);assert.ok(valid(s));
 s=battle(['s0','a6'],'h0');s.life=1;s=act(s,{type:'fr-finish'});assert.equal(s.life,0);assert.notEqual(s.phase,'finished');
 s=battle(['s0','a10'],'h0');s.life=1;s=act(s,{type:'fr-finish'});assert.equal(s.outcome,'lost');assert.equal(s.budget,0);
});
test('highest printed positive is zeroed before doubling, double does not stack, removed end-of-fight source cancels its modifier',()=>{
 let s=battle(['h21','h20','a4','s0'],'h28'); // 2 draw, 2 destroy, highest, 2 genius
 s.played[3].doubleBy=1;s.played[0].used=true;const e=E.evaluate(s);assert.deepEqual(e.zeroed,[1]);assert.equal(e.power,6);
 s=battle(['h18','s0','s1'],'h28');s=act(s,{type:'fr-use',source:1});s=act(s,{type:'fr-target',target:2});assert.equal(E.evaluate(s).power,7);assert.throws(()=>act(s,{type:'fr-use',source:1}));
 s=battle(['h18','h2','s0'],'h28');s=act(s,{type:'fr-use',source:1});s=act(s,{type:'fr-target',target:3});assert.equal(E.evaluate(s).power,6);s=act(s,{type:'fr-use',source:2});s=act(s,{type:'fr-target',target:1});assert.equal(E.evaluate(s).power,2);assert.ok(valid(s));
});
test('exchange twice holds the ability open and may immediately exchange the replacement, preventing intervening abilities',()=>{
 let s=battle(['h6','s13'],'h20');s=act(s,{type:'fr-use',source:1});s=act(s,{type:'fr-target',target:2});const replacement=s.played[1].uid;assert.equal(s.pending?.remaining,1);assert.throws(()=>act(s,{type:'fr-use',source:replacement}));s=act(s,{type:'fr-target',target:replacement});assert.equal(s.pending,undefined);assert.ok(valid(s));
});
test('bottom free replacement, copy of a used heal, noncumulative reductions and private incremental sorting',()=>{
 let s=battle(['h3','s13'],'h18');s=act(s,{type:'fr-use',source:1});s=act(s,{type:'fr-target',target:2});assert.equal(s.deck[0],'s13');assert.equal(s.played.length,2);assert.ok(valid(s));
 s=battle(['h1','s4'],'h18');s.life=12;s=act(s,{type:'fr-use',source:2});s=act(s,{type:'fr-use',source:1,copy:[2]});assert.equal(s.life,16);assert.ok(valid(s));
 s=battle(['h19'],'h28');s=act(s,{type:'fr-use',source:1});s=act(s,{type:'fr-sort-draw'});s=act(s,{type:'fr-sort-draw'});const peek=[...s.pending!.cards];assert.equal(E.getDisplayView(s).pending?.count,2);assert.equal((E.getDisplayView(s).pending as any).cards,undefined);assert.deepEqual(E.getPlayerView(s,'solo').me?.peek,peek);s=act(s,{type:'fr-sort-finish',order:[peek[1]],discard:peek[0]});assert.equal(s.deck.at(-1),peek[1]);assert.ok(s.discard.includes(peek[0]));assert.ok(valid(s));
});
test('pirate variants use locked aging target, final hazards, mandatory half aging and bonus for facedown destroyed cards',()=>{
 let s=battle(['s0','s1','s13','a2','h28'],'h18');s.hazardDiscard.push(s.current!.id);s.step=3;s.pirates=['p6'];s.current={kind:'pirate',id:'p7',target:52,free:10};s.played[4].destroyed=true;assert.equal(E.evaluate(s).power,5);assert.ok(valid(s));
 s.current={kind:'pirate',id:'p6',target:22,free:9};s.pirates=['p7'];assert.equal(E.evaluate(s).counted.length,3);assert.ok(E.evaluate(s).counted.includes(4));assert.equal(E.evaluate(s).power,1);
 s=E.createInitialState(seats,rng(12));s.hazards.push(...s.offer.splice(0));s.hazardDiscard.push(...s.hazards.splice(0));s.step=3;s.phase='pirates';s.pirates=['p8','p9'];s=act(s,{type:'fr-pirate',card:'p8'});assert.equal(s.current!.target,0);s.discard.push(...s.deck.splice(0));s=act(s,{type:'fr-draw'});assert.equal(E.evaluate(s).target,0);assert.ok(valid(s));
});
test('invalid actors, extra payload fields and mutated snapshots cannot change state or leak hidden piles',()=>{
 const s=E.createInitialState(seats,rng(2)),before=JSON.stringify(s);assert.throws(()=>E.applyAction(s,'other',E.getLegalActions(s,'solo')[0],rng(1)));assert.throws(()=>act(s,{...E.getLegalActions(s,'solo')[0],life:22} as any));assert.equal(JSON.stringify(s),before);
 const publicView=E.getDisplayView(s);assert.equal((publicView as any).deck,undefined);assert.equal((publicView as any).aging,undefined);publicView.offer.pop();assert.equal(s.offer.length,2);
 const broken=structuredClone(s);broken.deck[0]=broken.deck[1];assert.equal(valid(broken),false);
});
test('late lone hazard can be skipped; cumulative phase reductions cancel when their source leaves; level 4 reserve caps at 20',()=>{
 let s=E.createInitialState(seats,rng(3));s.hazardDiscard.push(...s.hazards.splice(0),...s.offer.splice(1));s.step=2;s=act(s,{type:'fr-skip-hazard'});assert.equal(s.phase,'pirates');assert.ok(valid(s));
 s=battle(['h0','h1','h2'],'h28');s.step=2;s=act(s,{type:'fr-use',source:1});s=act(s,{type:'fr-use',source:2,copy:[1]});assert.equal(E.evaluate(s).target,5);s=act(s,{type:'fr-use',source:3});s=act(s,{type:'fr-target',target:1});assert.equal(E.evaluate(s).target,9);
 s=battle(['s4'],'h28',4);s.life=19;s=act(s,{type:'fr-use',source:1});assert.equal(s.life,20);assert.ok(valid(s));
});
test('refill draws aging only on demand, old-age exhaustion loses, and pirate out-of-cards does not add new aging',()=>{
 let s=battle(['s0'],'h28');s.discard.push(...s.deck.splice(0));const ageCount=s.aging.length;s=act(s,{type:'fr-draw'});assert.equal(s.aging.length,ageCount-1);assert.ok(valid(s));
 s=battle(['s0'],'h28',3);s.discard.push(...s.deck.splice(0));s.destroyed.push(...s.aging.splice(0));s.agingAdded=11;assert.ok(valid(s));s=act(s,{type:'fr-draw'});assert.equal(s.outcome,'lost');assert.match(s.reason!,/แก่ตัวหมด/);assert.ok(valid(s));
 s=battle(['s0'],'h28');s.discard.push(...s.deck.splice(0));s.hazardDiscard.push(s.current!.id);s.pirates=['p0'];s.current={kind:'pirate',id:'p4',target:40,free:10};s.step=3;
 // Every owned card is now on the table. The aging stack is not a spare fighting deck.
 for(const id of s.discard.splice(0))s.played.push({uid:++s.sequence,card:id,free:false,used:true,destroyed:false});
 const count=s.aging.length;assert.ok(!E.getLegalActions(s,'solo').some(a=>a.type==='fr-draw'));s=act(s,{type:'fr-finish'});assert.equal(s.outcome,'lost');assert.equal(s.aging.length,count);assert.ok(valid(s));
});
test('complete seeded games preserve all 59 cards at every decision and include actual victories and losses across levels',()=>{
 const outcomes=new Set<string>();let wins=0;
 for(let seed=1;seed<=80;seed++){
  const random=rng(seed),level=(seed%4+1) as 1|2|3|4;let s=E.createInitialState(seats,random,undefined,level),n=0;
  while(!E.isFinished(s)&&n++<1800){const a=choose(E.getPlayerView(s,'solo'));assert.ok(a,'missing choice');s=E.applyAction(s,'solo',a,random);assert.ok(valid(s),`ledger failed seed ${seed}, action ${JSON.stringify(a)}`);}
  assert.equal(s.phase,'finished',`did not finish seed ${seed}`);outcomes.add(s.outcome!);if(s.outcome==='won'){wins++;assert.equal(s.defeated.length,2);assert.equal(E.score(s).life,s.life*5);}else assert.equal(E.score(s).life,0);
 }
 assert.ok(wins>0,'policy must complete at least one real winning game');assert.deepEqual(outcomes,new Set(['won','lost']));
});
