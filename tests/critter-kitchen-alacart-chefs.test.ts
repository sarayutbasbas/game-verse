import {createPlanningFixture} from './critter-kitchen-fixtures.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../src/games/critter-kitchen/engine.js';
import {validateCKState} from '../src/games/critter-kitchen/validation.js';
import {expansionOptions,selectedZous} from '../src/games/critter-kitchen/expansions.js';
import {seeded,botAction} from './critter-kitchen-fixtures.js';
import type {CKState} from '../src/games/critter-kitchen/types.js';
const seats=[{id:'a',name:'A'},{id:'b',name:'B'}];
function grant(s:CKState,id:string){if(s.academySous===id)s.academySous=null;else s.zousDeck.splice(s.zousDeck.indexOf(id),1);s.players[0].activeSous=id;}
function move(s:CKState,id:string,location:string){for(const pool of [s.bag,s.discard,...Object.values(s.locations),...s.players.map(p=>p.storage)]){const i=pool.indexOf(id);if(i>=0)pool.splice(i,1);}s.locations[location].push(id);}
function fixture(chef:string,stock:string[],opponent=false,priority=['a','b']){let s=createPlanningFixture(seats,seeded(1),{expansions:{aLaCartChefs:true,aLaCartMoreChefs:true}});grant(s,chef);s.priority=priority;for(const id of s.locations.garden.splice(0))s.bag.push(id);for(const id of stock)move(s,id,'garden');
 s=engine.applyAction(s,'a',{type:'ck-plan',epoch:engine.decisionKey(s),plan:{mouse:'soup',lizard:'desert',boar:'academy',[chef]:'garden'}});
 s=engine.applyAction(s,'b',{type:'ck-plan',epoch:engine.decisionKey(s),plan:{mouse:opponent?'garden':'midnight',lizard:'soup',boar:'desert'}});s=engine.applyAction(s,'a',{type:'ck-run'},seeded(3));return s;}
function until(s:CKState,chef:string){for(let i=0;i<60;i++){if(s.pending?.kind==='pick'&&s.visits.find(v=>v.id===s.pending!.visit)?.chef===chef)return s;const {actor,action}=botAction(s,seeded(i+10));s=engine.applyAction(s,actor,action,seeded(i+20));}throw Error('Missing target visit');}

test('À La Cart individual cards: strict opt-in, original seeded setup and legacy settings unchanged',()=>{
 const original=createPlanningFixture(seats,seeded(12));assert.deepEqual(createPlanningFixture(seats,seeded(12),{expansions:{aLaCartChefs:false}}),original);
 assert.deepEqual(expansionOptions({luckyDuck:true,rudy:true}),{luckyDuck:true,rudy:true});assert.throws(()=>expansionOptions({aLaCartChefs:1}));
 assert.equal(selectedZous().length,12);assert.deepEqual(selectedZous(expansionOptions({aLaCartChefs:true})).slice(-2).map(c=>c.id),['alex','peter']);
 assert.deepEqual(selectedZous(expansionOptions({aLaCartMoreChefs:true})).slice(-2).map(c=>c.id),['queenie','shaggy']);assert.throws(()=>expansionOptions({aLaCartMoreChefs:1}));
 assert.deepEqual(createPlanningFixture(seats,seeded(12),{expansions:{aLaCartMoreChefs:false}}),original);
 const legacy=createPlanningFixture(seats,seeded(44),{expansions:{aLaCartChefs:true}});assert.ok(validateCKState(legacy));assert.ok(![...legacy.zousDeck,legacy.academySous].includes('queenie'));
 const forged=structuredClone(original);forged.zousDeck.push('alex');assert.equal(validateCKState(forged),false);
});

test('Alex awards one star for actual bread, once per visit, and ignores bread spice or existing bread',()=>{
 let s=until(fixture('alex',['i-bread-0','i-bread-1','s-bread-0']),'alex');
 s=engine.applyAction(s,'a',{type:'ck-pick',item:'i-bread-0'});assert.equal(s.players[0].chefStars,0);
 s=engine.applyAction(s,'a',{type:'ck-pick',item:'i-bread-1'});assert.equal(s.players[0].chefStars,0);
 s=engine.applyAction(s,'a',{type:'ck-pick',item:'s-bread-0'});assert.equal(s.players[0].chefStars,1);assert.equal(s.players[0].stars,1);assert.ok(validateCKState(s));
 const before=structuredClone(s);assert.throws(()=>engine.applyAction(s,'a',{type:'ck-pick',item:'i-bread-0'}));assert.deepEqual(s,before);
 let spice=until(fixture('alex',['s-bread-0']),'alex');move(spice,'i-bread-5','soup');spice.locations.soup.splice(spice.locations.soup.indexOf('i-bread-5'),1);spice.players[0].storage.push('i-bread-5');spice=engine.applyAction(spice,'a',{type:'ck-pick',item:'s-bread-0'});assert.equal(spice.players[0].chefStars,0);assert.ok(validateCKState(spice));
});

test('Peter checks remaining spice on first pick, retains capacity-one queue and alternates before extra pick',()=>{
 let s=until(fixture('peter',['i-meat-0','s-bread-0','i-fish-0'],true),'peter');assert.equal(s.pending?.actor,'a');const v=s.visits.find(v=>v.chef==='peter')!;assert.equal(v.capacity,1);assert.equal(v.limit,2);
 s=engine.applyAction(s,'a',{type:'ck-pick',item:'i-meat-0'});assert.equal(s.pending?.actor,'b');s=engine.applyAction(s,'b',{type:'ck-pick',item:'s-bread-0'});assert.equal(s.pending?.actor,'a');
 s=engine.applyAction(s,'a',{type:'ck-pick',item:'i-fish-0'});assert.equal(s.visits.find(v=>v.chef==='peter')!.used,2);assert.ok(validateCKState(s));
 // A higher-priority mouse removes the only spice before Peter's first pick.
 let no=fixture('peter',['s-bread-0','i-meat-0','i-fish-0'],true,['b','a']);
 while(!(no.pending?.kind==='pick'&&no.pending.loc==='garden'&&no.pending.actor==='b')){const a=botAction(no,seeded(no.sequence));no=engine.applyAction(no,a.actor,a.action,seeded(3));}
 no=engine.applyAction(no,'b',{type:'ck-pick',item:'s-bread-0'});assert.equal(no.visits.find(v=>v.chef==='peter')!.limit,1);no=engine.applyAction(no,'a',{type:'ck-pick',item:'i-meat-0'});assert.ok(no.visits.find(v=>v.chef==='peter')!.done);assert.ok(validateCKState(no));
});


function topBag(s:CKState,id:string){move(s,id,'midnight');s.locations.midnight.splice(s.locations.midnight.indexOf(id),1);s.bag.push(id);}
function giveRumors(s:CKState,n:number){for(let i=0;i<n;i++){const id=`r-${i}-0`;move(s,id,'midnight');s.locations.midnight.splice(s.locations.midnight.indexOf(id),1);s.players[0].known[i]=id;}}

test('Queenie rewards actual first pick after a hat change; later pick and empty return get no gift',()=>{
 let s=until(fixture('queenie',['i-meat-0','i-carrot-0'],true),'queenie');topBag(s,'i-cheese-12');s=engine.applyAction(s,'a',{type:'ck-pick',item:'i-meat-0'});
 assert.equal(s.firstPick,'a:queenie');assert.equal(s.priority.at(-1),'a');assert.ok(s.players[0].storage.includes('i-cheese-12'));assert.equal(s.visits.find(v=>v.chef==='queenie')!.gained,2);assert.ok(validateCKState(s));
 let later=until(fixture('queenie',['i-meat-0','i-carrot-0'],true,['b','a']),'queenie');topBag(later,'i-cheese-12');assert.equal(later.firstPick,'b:mouse');const choice=engine.getLegalActions(later,'a').find(a=>a.type==='ck-pick')!;later=engine.applyAction(later,'a',choice);
 assert.ok(!later.players[0].storage.includes('i-cheese-12'));assert.equal(later.visits.find(v=>v.chef==='queenie')!.gained,1);assert.ok(validateCKState(later));
 let empty=until(fixture('queenie',['i-meat-0']),'queenie');topBag(empty,'i-cheese-12');empty=engine.applyAction(empty,'a',{type:'ck-leave'});assert.equal(empty.pending?.kind,'consolation');assert.ok(!empty.players[0].storage.includes('i-cheese-12'));assert.ok(validateCKState(empty));
});

test('Queenie wild-rumor gift remains private, survives restore, and resolves only once',()=>{
 let s=until(fixture('queenie',['i-meat-0'],true),'queenie');topBag(s,'r-3-0');s=engine.applyAction(s,'a',{type:'ck-pick',item:'i-meat-0'});
 assert.equal(s.pending?.kind,'rumor');assert.ok(validateCKState(s));s=structuredClone(s);assert.ok(validateCKState(s));assert.equal(engine.getPlayerView(s,'b').rumorChoices.length,0);
 s=engine.applyAction(s,'a',{type:'ck-rumor',index:1});assert.equal(s.players[0].known[1],'r-3-0');assert.ok(validateCKState(s));const before=structuredClone(s);assert.throws(()=>engine.applyAction(s,'a',{type:'ck-rumor',index:1}));assert.deepEqual(s,before);
});

test('Shaggy grants one extra pick per physical rumor after normal picks, without increasing printed capacity',()=>{
 let s=until(fixture('shaggy',['i-meat-0','i-carrot-0','i-fish-0','i-bread-0','i-cheese-0']),'shaggy');giveRumors(s,3);assert.ok(validateCKState(s));
 s=engine.applyAction(s,'a',{type:'ck-pick',item:'i-meat-0'});s=engine.applyAction(s,'a',{type:'ck-pick',item:'i-carrot-0'});assert.equal(s.pending?.kind,'pick');assert.equal(s.pending?.kind==='pick'&&s.pending.extra,true);
 for(const item of ['i-fish-0','i-bread-0','i-cheese-0']){s=engine.applyAction(s,'a',{type:'ck-pick',item});assert.ok(validateCKState(s));}
 const v=s.visits.find(v=>v.chef==='shaggy')!;assert.equal(v.capacity,2);assert.equal(v.used,2);assert.equal(v.gained,5);assert.equal(s.players[0].storage.length,5);
});

test('Shaggy counts rumors learned during normal picks once; bonus rumors do not recurse; private cards are excluded',()=>{
 let s=until(fixture('shaggy',['i-meat-0','r-0-0','r-1-0','i-fish-0']),'shaggy');
 s=engine.applyAction(s,'a',{type:'ck-pick',item:'i-meat-0'});s=engine.applyAction(s,'a',{type:'ck-pick',item:'r-0-0'});s=engine.applyAction(s,'a',{type:'ck-pick',item:'r-1-0'});
 assert.equal(s.players[0].known.filter(Boolean).length,2);assert.equal(s.visits.find(v=>v.chef==='shaggy')!.gained,3);assert.ok(validateCKState(s));
 let no=until(fixture('shaggy',['i-meat-0','i-carrot-0','i-fish-0']),'shaggy');no.players[0].extraRumor=no.unusedRumors.pop()!;assert.ok(validateCKState(no));no=engine.applyAction(no,'a',{type:'ck-pick',item:'i-meat-0'});no=engine.applyAction(no,'a',{type:'ck-pick',item:'i-carrot-0'});assert.equal(no.visits.find(v=>v.chef==='shaggy')!.gained,2);assert.ok(validateCKState(no));
});

test('Shaggy stops when no eligible stock remains without a bag fallback or extra consolation',()=>{
 let s=until(fixture('shaggy',['i-meat-0']),'shaggy');giveRumors(s,3);topBag(s,'i-cheese-12');s=engine.applyAction(s,'a',{type:'ck-pick',item:'i-meat-0'});
 assert.equal(s.visits.find(v=>v.chef==='shaggy')!.gained,1);assert.ok(!s.players[0].storage.includes('i-cheese-12'));assert.ok(validateCKState(s));
});

for(const count of [2,3,4,5])test(`À La Cart chefs plus Promo: ${count} players complete seven rounds with conservation`,()=>{
 for(let seed=1;seed<=8;seed++){const r=seeded(1000+count*10+seed);let s=createPlanningFixture(Array.from({length:count},(_,i)=>({id:'p'+i,name:'ครัว '+i})),r,{restaurateurs:true,expansions:{aLaCartChefs:true,aLaCartMoreChefs:true,luckyDuck:true,rudy:true}});let steps=0;
 while(s.phase!=='finished'&&steps++<2000){const {actor,action}=botAction(s,r);s=engine.applyAction(s,actor,action,r);assert.ok(validateCKState(s),JSON.stringify({count,seed,steps,phase:s.phase,action}));}
 assert.equal(s.phase,'finished');assert.ok(s.players.every(p=>Number.isFinite(p.score?.total)));assert.equal(s.winners.length,1);
 }
});
