import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as game from '../src/games/take-time/engine.js';
import {validateTakeTimeState as valid} from '../src/games/take-time/validation.js';
import {sequence,successFixture} from './take-time-fixtures.js';
import type {TakeTimeState,TakeTimeAction} from '../src/games/take-time/types.js';
function step(s:TakeTimeState,id:string,a:TakeTimeAction){const next=game.applyAction(s,id,a);assert.ok(valid(next),JSON.stringify(a));return next;}
for(const n of [2,3,4])test(`Take Time ${n} players: full successful official clock, concealed deals, reserves, gradual reveal and replay`,()=>{
 let s=successFixture(n);assert.ok(valid(s));
 for(const p of s.players){assert.ok(game.getPlayerView(s,p.id).hand.every(c=>c.value===undefined));s=step(s,p.id,{type:'tt-open',attempt:s.attempt});assert.ok(game.getPlayerView(s,p.id).hand.every(c=>c.value!==undefined));}
 assert.equal(s.phase,'placement');
 for(let k=0;k<12;k++){
  const [suit,value,segment]=sequence[k],p=s.players[k%n],card=p.hand.find(c=>c.value===value&&c.suit===suit)!;
  assert.ok(card);const before=structuredClone(s);assert.throws(()=>game.applyAction(s,'outsider',{type:'tt-place',card:card.id,segment,faceup:false}));assert.deepEqual(s,before);
  s=step(s,p.id,{type:'tt-place',card:card.id,segment,faceup:false});
  if(n===2)assert.equal(s.players[0].reserve.length,k<3?2:0);
  const pub=game.getDisplayView(s);assert.ok(pub.placed.every(p=>p.card.value===undefined));assert.equal(pub.result,undefined);assert.equal((pub as any).unused,undefined);
  for(const player of s.players)assert.equal(game.getPlayerView(s,player.id).placed.length,s.placed.filter(x=>x.owner===player.id).length);
 }
 assert.equal(s.phase,'resolution');
 for(let i=0;i<6;i++){s=step(s,s.players[0].id,{type:'tt-reveal'});assert.ok(game.getDisplayView(s).placed.filter(p=>p.segment<i+1).every(p=>p.card.value!==undefined));assert.ok(game.getDisplayView(s).placed.filter(p=>p.segment>=i+1).every(p=>p.card.value===undefined));}
 assert.equal(s.phase,'finished');assert.equal(s.result?.success,true);assert.deepEqual(s.result?.sums,[3,8,11,11,20,24]);assert.deepEqual(game.getLegalActions(s,'p0'),[]);
 const replay=game.retry(s,()=>.2);assert.ok(valid(replay));assert.equal(replay.bonus,0);assert.equal(replay.attempt,2);assert.ok(game.getPlayerView(replay,'p0').hand.every(c=>c.value===undefined));
});
test('Take Time quota shared across players, extra failure bonuses capped at three, wrong turns and malformed commands stay atomic',()=>{
 let s=successFixture();for(const p of s.players)s=step(s,p.id,{type:'tt-open',attempt:s.attempt});
 for(let i=0;i<12;i++){const p=s.players[i%2],card=p.hand[0],a:TakeTimeAction={type:'tt-place',card:card.id,segment:0,faceup:i<2};
  const old=structuredClone(s);
  if(i===2)assert.throws(()=>game.applyAction(s,p.id,{...a,faceup:true}));
  assert.throws(()=>game.applyAction(s,p.id,{...a,actor:'p1'} as any));assert.throws(()=>game.applyAction(s,p.id,{...a,segment:6}));
  if(i>0)assert.throws(()=>game.applyAction(s,s.players[(i+1)%2].id,a));
  assert.deepEqual(s,old);s=step(s,p.id,a);
 }
 assert.throws(()=>game.retry(s,()=>.4));for(let i=0;i<6;i++)s=step(s,'p0',{type:'tt-reveal'});
 assert.equal(s.result?.success,false);assert.ok(s.result!.checks.some(c=>!c.ok));
 const next=game.retry(s,()=>.4);assert.equal(next.bonus,1);assert.equal(game.getDisplayView(next).faceupRemaining,3);
 for(const bonus of [0,1,2,3]){s.bonus=bonus;const next=game.retry(s,()=>.4);assert.equal(next.bonus,Math.min(3,bonus+1));assert.ok(valid(next));}
});
test('Take Time independent opening exposes only that authenticated hand, never reserves or other players values',()=>{
 let s=successFixture();s=step(s,'p0',{type:'tt-open',attempt:s.attempt});
 assert.equal(s.phase,'discussion');assert.equal(game.getLegalActions(s,'p0').length,0);
 assert.ok(game.getPlayerView(s,'p0').hand.every(c=>c.value!==undefined));assert.ok(game.getPlayerView(s,'p1').hand.every(c=>c.value===undefined));
 const view=game.getDisplayView(s);assert.ok(view.players.every(p=>[...p.cards,...p.reserve].every(c=>c.value===undefined)));
 assert.equal((game.getPlayerView(s,'p0') as any).reserve,undefined);
});
test('Take Time clock constraints and unlimited first-clock sums: equality accepted, empty/wrong-color/count/descending fail',()=>{
 const s=successFixture();s.placed=sequence.map(([suit,value,segment],i)=>({card:{id:'c'+i,suit,value},segment,owner:'p'+i%2,faceup:false}));
 assert.equal(game.evaluate(s).success,true);
 s.placed[10].card.value=12;assert.ok(game.evaluate(s).sums[5]>24);assert.equal(game.evaluate(s).success,true);
 s.placed[0].card.suit='lunar';assert.equal(game.evaluate(s).success,false);
 s.placed[0].card.suit='solar';s.placed[1].segment=5;assert.equal(game.evaluate(s).success,false);
});
test('Take Time durable validation rejects card duplication, hidden forged results, turn/reserve corruption and unknown clocks',()=>{
 const s=successFixture();for(const mutate of [(x:any)=>x.unused[0]=x.players[0].hand[0],(x:any)=>x.players[0].hand[0].value=99,(x:any)=>x.clock='1-2',(x:any)=>x.result={success:true},(x:any)=>x.revealed=1,(x:any)=>x.turn='p0',(x:any)=>x.players[0].opened='true',(x:any)=>x.bonus=4]){const c=structuredClone(s);mutate(c);assert.equal(valid(c),false);}
});
test('Take Time shuffled 2–4 player games preserve all 24 physical cards through final settlement',()=>{
 let seed=42;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
 for(let k=0;k<45;k++){let s=game.createInitialState(Array.from({length:2+k%3},(_,i)=>({id:'p'+i,name:'P'+i})),rnd);assert.ok(valid(s));for(const p of s.players)s=step(s,p.id,{type:'tt-open',attempt:s.attempt});while(s.phase==='placement'){const p=s.players.find(p=>p.id===s.turn)??s.players[0];const actions=game.getLegalActions(s,p.id);s=step(s,p.id,actions[Math.floor(rnd()*actions.length)]);}while(s.phase==='resolution')s=step(s,'p0',{type:'tt-reveal'});assert.ok(s.result);assert.equal(s.result.sums.length,6);}
});
