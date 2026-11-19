import {test} from 'node:test';import assert from 'node:assert/strict';import * as E from '../src/games/stock-market-crash/engine.js';
const seats=Array.from({length:7},(_,i)=>({id:'p'+i,name:'คน '+i}));
test('deadline is exact, late bids rejected, partial crash excludes non-submitters from consolation',()=>{
 let s=E.createInitialState(seats,{rounds:2,pot:20,limit:100,roundSeconds:10},1000);assert.equal(s.deadline,11000);
 for(const [i,amount] of [1,2,3,4,5,100].entries())s=E.applyAction(s,'p'+i,{type:'crash-bid',amount},10999);
 assert.equal(E.expireRound(s,10999),s);assert.throws(()=>E.applyAction(s,'p6',{type:'crash-bid',amount:1},11000));
 s=E.expireRound(s,11000);assert.equal(s.phase,'round-end');assert.deepEqual(s.players.map(p=>p.score),[10,10,10,10,10,0,0]);assert.equal(s.history[0].timedOut,true);assert.equal(s.history[0].bids.length,6);assert.ok(E.validateState(s));assert.equal(E.expireRound(s,12000),s);
 s=E.applyAction(s,'p0',{type:'crash-next'},20000);assert.equal(s.deadline,30000);s=E.expireRound(s,30000);assert.equal(s.phase,'finished');assert.ok(E.validateState(s));assert.deepEqual(s.history[1].changes.map(c=>c.amount),[0,0,0,0,0,0,0]);
});
test('partial safe market awards only actual submissions, including final round and all-missing tie',()=>{
 let s=E.createInitialState(seats,{rounds:1,pot:200,limit:100,roundSeconds:1},0);s=E.applyAction(s,'p0',{type:'crash-bid',amount:20},999);s=E.expireRound(s,1000);assert.deepEqual(s.players.map(p=>p.score),[20,0,0,0,0,0,0]);assert.ok(E.validateState(s));
 let empty=E.createInitialState(seats,{rounds:1,pot:200,limit:100,roundSeconds:1});empty=E.expireRound(empty,1000);assert.equal(empty.winners.length,7);assert.ok(E.validateState(empty));
 assert.throws(()=>E.createInitialState(seats,{rounds:1,pot:200,limit:100,roundSeconds:-1}));assert.throws(()=>E.createInitialState(seats,{rounds:1,pot:200,limit:100,roundSeconds:601}));
});

test('timed mode cannot close early even when all submit; manual mode keeps close button available',()=>{
 const two=seats.slice(0,2);let timed=E.createInitialState(two,{rounds:1,pot:200,limit:100,roundSeconds:3},1000);
 for(const p of two)timed=E.applyAction(timed,p.id,{type:'crash-bid',amount:10},1001);
 assert.deepEqual(E.getLegalActions(timed,'p0',2000),[]);assert.throws(()=>E.applyAction(timed,'p0',{type:'crash-end'},2000));assert.equal(E.expireRound(timed,3999),timed);assert.equal(E.expireRound(timed,4000).phase,'finished');
 let manual=E.createInitialState(two,{rounds:2,pot:200,limit:100,roundSeconds:0},1000);assert.equal(manual.deadline,undefined);
 for(const p of two)manual=E.applyAction(manual,p.id,{type:'crash-bid',amount:10},999999);assert.equal(E.expireRound(manual,999999),manual);assert.ok(E.getLegalActions(manual,'p1').includes('crash-end'));assert.ok(E.validateState(manual));manual=E.applyAction(manual,'p1',{type:'crash-end'});manual=E.applyAction(manual,'p0',{type:'crash-next'},1000000);assert.equal(manual.deadline,undefined);assert.equal(manual.roundSeconds,0);assert.ok(E.validateState(manual));
});
