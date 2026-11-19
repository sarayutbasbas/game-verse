import {test} from 'node:test';import assert from 'node:assert/strict';
import * as crash from '../src/games/stock-market-crash/engine.js';import * as quiz from '../src/games/high-low-scoreboard/engine.js';import * as hunter from '../src/games/dividend-hunter/engine.js';
const seats=[{id:'a',name:'เอ'},{id:'b',name:'บี'}];
for(const [name,E,start,bid,end,phase] of [
 ['Crash',crash,()=>crash.createInitialState(seats,{rounds:1,pot:200,limit:100,roundSeconds:0}),{type:'crash-bid',amount:10},'crash-end','playing'],
 ['High-Low',quiz,()=>quiz.createInitialState(seats,()=>.3,{rounds:1}),{type:'hl-bet',answer:true,stake:2},'hl-end','betting'],
 ['Hunter',hunter,()=>hunter.createInitialState(seats,{rounds:1,limit:120}),{type:'hunter-bid',amount:10},'hunter-end','playing'],
] as const)test(name+': closing requires all submissions, remains secret and restorable, final reveal only once',()=>{
 const engine=E as any;let s:any=start();assert.throws(()=>engine.applyAction(s,'a',{type:end}));s=engine.applyAction(s,'a',bid);assert.throws(()=>engine.applyAction(s,'b',{type:end}));s=engine.applyAction(s,'b',bid);
 assert.equal(s.phase,phase);assert.ok(s.players.every((p:any)=>p.score===0));assert.equal(s.history.length,0);assert.equal(s.winners.length,0);assert.ok(engine.validateState(JSON.parse(JSON.stringify(s))));
 const view=engine.getDisplayView(s);assert.equal(view.answer,undefined);assert.ok(view.players.every((p:any)=>p.bid===undefined&&p.answer===undefined&&p.stake===undefined));assert.ok(engine.getLegalActions(s,'b').includes(end));assert.throws(()=>engine.applyAction(s,'outsider',{type:end}));assert.throws(()=>engine.applyAction(s,'a',{type:end,score:999}));
 s=engine.applyAction(s,'b',{type:end});assert.equal(s.phase,'finished');assert.equal(s.history.length,1);assert.ok(engine.validateState(s));assert.throws(()=>engine.applyAction(s,'a',{type:end}));
});
