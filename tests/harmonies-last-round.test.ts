import {test} from 'node:test';
import assert from 'node:assert/strict';
import {lastRoundInfo} from '../src/client/harmonies-last-round.js';
import * as rules from '../src/games/harmonies/engine.js';
const seats=Array.from({length:4},(_,i)=>({id:`p${i}`,name:`สวน ${i}`}));
function view(n=3){return rules.getDisplayView(rules.createInitialState(seats.slice(0,n),()=>.42,'p0'),'ROOM',1);}
test('last-round notice is absent in normal play and after settlement',()=>{
 const v=view();assert.equal(lastRoundInfo(v),undefined);v.phase='finished';v.endAt=3;assert.equal(lastRoundInfo(v),undefined);
});
test('space warning forecasts only the unfinished seats in the current round, without changing server state',()=>{
 const v=view();v.turn='p1';v.turnCount=4;v.players[1].board.slice(0,21).forEach(c=>c.stack=['field-01']);
 const info=lastRoundInfo(v)!;assert.equal(info.end,6);assert.deepEqual(info.remaining.map(p=>p.id),['p1','p2']);assert.equal(info.count,2);assert.equal(v.endAt,undefined);
 v.endAt=6;v.turn='p2';v.turnCount=5;v.me={id:'p2',legal:[],habitats:[]};assert.equal(lastRoundInfo(v)!.ownLastTurn,true);assert.deepEqual(lastRoundInfo(v)!.remaining.map(p=>p.id),['p2']);
});
test('bag warning can precede an immediate last-seat finish and respects a rotated starter',()=>{
 const v=view(4);v.turn='p0';v.turnCount=2;v.bagCount=2;assert.deepEqual(lastRoundInfo(v)!.remaining.map(p=>p.id),['p0','p1']);
 v.turn='p1';v.turnCount=3;assert.equal(lastRoundInfo(v)!.count,1);assert.equal(lastRoundInfo(v)!.end,4);
});
test('every legal game-ending end action has a warning before the server finishes',()=>{
 for(const n of [2,3,4]){
  let seed=23;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/2**32);let state=rules.createInitialState(seats.slice(0,n),random,'p0');let warned=false;
  for(let i=0;state.phase==='playing'&&i<500;i++){
   const actor=state.players[state.turn].id,legal=rules.getLegalActions(state,actor),action=legal.find(a=>a.type==='harmonies-place')??legal.find(a=>a.type==='harmonies-end')??legal.find(a=>a.type==='harmonies-group');assert.ok(action);const before=rules.getDisplayView(state,'ROOM',i),next=rules.applyAction(state,actor,action,random);
   if(next.phase==='finished'){assert.ok(lastRoundInfo(before));assert.equal(lastRoundInfo(before)!.remaining.at(-1)!.id,actor);warned=true;}
   state=next;
  }
  assert.equal(warned,true);
 }
});
