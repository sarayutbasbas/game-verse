import {createPlanningFixture} from './critter-kitchen-fixtures.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as e from '../src/games/critter-kitchen/engine.js';
import { TOKEN } from '../src/games/critter-kitchen/data.js';
import { expansionOptions } from '../src/games/critter-kitchen/expansions.js';
import { validateCKState } from '../src/games/critter-kitchen/validation.js';
import { validateMeals, emptyMeal, mealQuality } from '../src/games/critter-kitchen/scoring.js';
import { seeded, botAction } from './critter-kitchen-fixtures.js';
import type { CKState } from '../src/games/critter-kitchen/types.js';
const seats = [{id:'a',name:'ครัว A'},{id:'b',name:'ครัว B'}];
function removeSous(s:CKState,id:string){if(s.academySous===id)s.academySous=null;else s.zousDeck.splice(s.zousDeck.indexOf(id),1);}
function moveToken(s:CKState,id:string,loc:string){for(const pool of [s.bag,s.discard,...Object.values(s.locations)]){const at=pool.indexOf(id);if(at>=0)pool.splice(at,1);}s.locations[loc].push(id);}
const advance=(s:CKState)=>{const a=botAction(s,seeded(s.sequence+4));return e.applyAction(s,a.actor,a.action,seeded(s.sequence+9));};

test('verified packs are opt-in, strict, and leave the base seeded setup unchanged',()=>{
 const base=createPlanningFixture(seats,seeded(28)),off=createPlanningFixture(seats,seeded(28),{expansions:{luckyDuck:false,rudy:false}});
 assert.deepEqual(base,off);assert.ok(validateCKState(base));assert.ok(![...base.zousDeck,base.academySous].includes('cosmo'));assert.ok(!base.unusedRestaurateurs.includes('wolfgang-duck'));
 for(const value of [null,[],{rudy:1},{luckyDuck:'true'},{aLaCart:true},{rudy:true,unverified:true}])assert.throws(()=>expansionOptions(value));
 const bad=structuredClone(base);bad.expansions={luckyDuck:true,rudy:false};assert.equal(validateCKState(bad),false);
});

test('Wolfgang: wine substitutes only in Challenge; wine spice still matches wine; no duplicate use',()=>{
 const s=createPlanningFixture(seats,seeded(5));s.round=3;s.challenges=['coastal-fusion',...s.challenges.slice(1)];
 // Use the actual chosen card's requirement instead of assuming a meal name.
 const p=s.players[0];p.restaurateur='wolfgang-duck';p.storage=['i-wine-12','s-wine-0','s-fish-0'];p.soup=10;
 const meal={items:[{token:'i-wine-12',as:'fish' as const,spice:'s-wine-0'}],soup:2,bisque:0};
 // Coastal Fusion is fish/cheese/carrot in the base deck.
 assert.doesNotThrow(()=>validateMeals(s,p,[meal,emptyMeal(),emptyMeal()]));assert.equal(mealQuality(s,p,meal,true),16);
 assert.throws(()=>validateMeals(s,p,[{...meal,items:[{...meal.items[0],spice:'s-fish-0'}]},emptyMeal(),emptyMeal()]));
 assert.throws(()=>validateMeals(s,p,[{...meal,soup:0}],true));
 assert.throws(()=>validateMeals(s,p,[meal,meal,emptyMeal()]));
});

test('Cosmo reserves a private real card, survives restore, and reveals ability/capacity before Shopping',()=>{
 let s=createPlanningFixture(seats,seeded(7),{expansions:{luckyDuck:true}});
 removeSous(s,'cosmo');s.zousDeck.push(s.academySous!);s.academySous='cosmo';removeSous(s,'ming');s.zousDeck.push('ming');
 s=e.applyAction(s,'a',{type:'ck-plan',epoch:e.decisionKey(s),plan:{mouse:'academy',lizard:'soup',boar:'desert'}});
 s=e.applyAction(s,'b',{type:'ck-plan',epoch:e.decisionKey(s),plan:{mouse:'garden',lizard:'desert',boar:'midnight'}});s=e.applyAction(s,'a',{type:'ck-run'},seeded(9));
 for(let n=0;n<100&&!(s.pending?.actor==='a'&&s.pending.kind==='pick'&&s.pending.loc==='academy');n++)s=advance(s);
 s=e.applyAction(s,'a',{type:'ck-pick',item:'zous:cosmo'},seeded(4));assert.equal(s.players[0].cosmoSous,'ming');assert.ok(validateCKState(s));
 assert.equal(e.getPlayerView(s,'a').cosmoSous,'ming');assert.equal(e.getPlayerView(s,'b').cosmoSous,undefined);assert.ok(!JSON.stringify(e.getDisplayView(s,'ROOM',1)).includes('cosmoSous'));
 s=structuredClone(s);assert.ok(validateCKState(s));for(let n=0;n<100&&s.phase!=='planning';n++)s=advance(s);s=e.applyAction(s,'a',{type:'ck-continue-planning',round:s.round,challenge:s.challengeReveal!});
 assert.equal(s.players[0].activeSous,'cosmo');assert.equal(e.getDisplayView(s,'ROOM',2).players[0].activeSous,'cosmo');
 s=e.applyAction(s,'a',{type:'ck-plan',epoch:e.decisionKey(s),plan:{mouse:'academy',lizard:'soup',boar:'desert',cosmo:'garden'}});
 s=e.applyAction(s,'b',{type:'ck-plan',epoch:e.decisionKey(s),plan:{mouse:'garden',lizard:'desert',boar:'midnight'}});
 assert.equal(s.phase,'running');assert.equal(s.players[0].activeSous,'cosmo');s=e.applyAction(s,'a',{type:'ck-run'},seeded(3));
 assert.equal(s.players[0].activeSous,'ming');assert.equal(s.players[0].cosmoSous,undefined);assert.ok(s.usedZous.includes('cosmo'));assert.equal(s.players[0].plan!.ming,'garden');assert.ok(s.visits.some(v=>v.actor==='a'&&v.chef==='ming'&&v.capacity===1));assert.ok(validateCKState(s));
});

test('Rudy decides per carrot; only another player can receive it; retries cannot score twice',()=>{
 let s=createPlanningFixture(seats,seeded(11),{expansions:{rudy:true}});removeSous(s,'rudy');s.players[0].activeSous='rudy';
 for(const id of s.locations.garden.splice(0))s.bag.push(id);for(const id of ['i-carrot-0','i-carrot-1','i-carrot-2'])moveToken(s,id,'garden');
 s=e.applyAction(s,'a',{type:'ck-plan',epoch:e.decisionKey(s),plan:{mouse:'desert',lizard:'midnight',boar:'academy',rudy:'garden'}});s=e.applyAction(s,'b',{type:'ck-plan',epoch:e.decisionKey(s),plan:{mouse:'desert',lizard:'midnight',boar:'academy'}});s=e.applyAction(s,'a',{type:'ck-run'});
 s=e.applyAction(s,'a',{type:'ck-pick',item:'i-carrot-0'});assert.equal(s.pending?.kind,'rudy-gift');assert.ok(validateCKState(s));const before=structuredClone(s);
 for(const [actor,recipient]of [['a','a'],['a','forged'],['b','b']])assert.throws(()=>e.applyAction(s,actor,{type:'ck-rudy-gift',token:'i-carrot-0',recipient}));assert.deepEqual(s,before);
 s=e.applyAction(s,'a',{type:'ck-rudy-gift',token:'i-carrot-0',recipient:'b'});assert.equal(s.players[0].chefStars,1);assert.ok(!s.players[0].storage.includes('i-carrot-0'));assert.ok(s.players[1].storage.includes('i-carrot-0'));assert.ok(validateCKState(s));
 assert.throws(()=>e.applyAction(s,'a',{type:'ck-rudy-gift',token:'i-carrot-0',recipient:'b'}));s=e.applyAction(s,'a',{type:'ck-pick',item:'i-carrot-1'});assert.throws(()=>e.applyAction(s,'a',{type:'ck-rudy-gift',token:'i-carrot-0',recipient:'b'}));s=e.applyAction(s,'a',{type:'ck-rudy-gift',token:'i-carrot-1',recipient:null});assert.equal(s.players[0].chefStars,1);assert.ok(s.players[0].storage.includes('i-carrot-1'));assert.ok(validateCKState(s));
});

for(const count of [2,3,4,5])test(`both verified packs: ${count} players complete seven rounds with all invariants`,()=>{
 for(let seed=1;seed<=8;seed++){
 const r=seeded(count*100+seed);let s=createPlanningFixture(Array.from({length:count},(_,i)=>({id:'p'+i,name:'ครัว '+i})),r,{restaurateurs:true,expansions:{luckyDuck:true,rudy:true}});assert.ok(validateCKState(s));
 let steps=0;while(s.phase!=='finished'&&steps++<1800){const {actor,action}=botAction(s,r);s=e.applyAction(s,actor,action,r);assert.ok(validateCKState(s),JSON.stringify({count,seed,steps,action,phase:s.phase,round:s.round,pending:s.pending}));}
 assert.equal(s.phase,'finished');assert.equal(s.winners.length,1);assert.ok(s.players.every(p=>p.score&&Number.isFinite(p.score.total)));
 }
});
