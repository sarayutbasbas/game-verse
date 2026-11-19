import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../src/games/high-low-scoreboard/engine.js';
import {QUESTIONS} from '../src/games/high-low-scoreboard/questions.js';

test('200 sourced prompts are unique and a match samples without repeating a prompt',()=>{
  assert.equal(QUESTIONS.length,200);
  assert.equal(new Set(QUESTIONS.map(q=>q.text)).size,200);
  assert.ok(QUESTIONS.every(q=>q.source.startsWith('https://')&&typeof q.answer==='boolean'));
  const s=E.createInitialState([{id:'a',name:'เอ'},{id:'b',name:'บี'}],()=>0.37,{rounds:200});
  assert.equal(s.deck.length,199);
  assert.equal(new Set([s.questionId,...s.deck]).size,200);
  assert.ok(E.validateState(s));
});

test('wagers stay private until both submit, then correct and incorrect stakes update scores',()=>{
  const s=E.createInitialState([{id:'a',name:'เอ'},{id:'b',name:'บี'}],()=>0.37,{rounds:2});
  const answer=QUESTIONS.find(q=>q.id===s.questionId)!.answer;
  const one=E.applyAction(s,'a',{type:'hl-bet',answer,stake:4});
  assert.equal(E.getDisplayView(one).answer,undefined);
  assert.equal(E.getDisplayView(one).players[0].stake,undefined);
  assert.deepEqual(E.getPlayerView(one,'a').me,{id:'a',answer,stake:4,allIn:false});
  assert.equal(E.getPlayerView(one,'b').me?.stake,undefined);
  let done=E.applyAction(one,'b',{type:'hl-bet',answer:!answer,stake:3});
  assert.equal(done.phase,'betting');assert.equal(E.getDisplayView(done).answer,undefined);assert.ok(E.validateState(done));done=E.applyAction(done,'b',{type:'hl-end'});
  assert.equal(done.phase,'round-end');
  assert.deepEqual(done.players.map(p=>p.score),[4,-3]);
  assert.equal(E.getDisplayView(done).answer,answer);
  assert.ok(E.validateState(done));
});

test('final all-in is only available to positive score and is capped at the existing score',()=>{
  let s=E.createInitialState([{id:'a',name:'เอ'},{id:'b',name:'บี'}],()=>0.37,{rounds:2});
  const first=QUESTIONS.find(q=>q.id===s.questionId)!.answer;
  s=E.applyAction(s,'a',{type:'hl-bet',answer:first,stake:5});
  s=E.applyAction(s,'b',{type:'hl-bet',answer:!first,stake:1});
  s=E.applyAction(s,'b',{type:'hl-end'});
  s=E.applyAction(s,'a',{type:'hl-next'});
  const finalAnswer=QUESTIONS.find(q=>q.id===s.questionId)!.answer;
  assert.throws(()=>E.applyAction(s,'b',{type:'hl-bet',answer:finalAnswer,stake:1,allIn:true}));
  assert.throws(()=>E.applyAction(s,'a',{type:'hl-bet',answer:finalAnswer,stake:6,allIn:true}));
  s=E.applyAction(s,'a',{type:'hl-bet',answer:finalAnswer,stake:5,allIn:true});
  s=E.applyAction(s,'b',{type:'hl-bet',answer:!finalAnswer,stake:1});
  s=E.applyAction(s,'b',{type:'hl-end'});
  assert.equal(s.phase,'finished');
  assert.equal(s.players.find(p=>p.id==='a')!.score,10);
  assert.ok(s.winners.includes('a'));
  assert.ok(E.validateState(s));
});

test('host selected packs each contain 40 distinct questions and reject unknown or oversized packs',()=>{
 const seats=[{id:'a',name:'เอ'},{id:'b',name:'บี'}];
 for(const packId of ['nature','science','world','daily','culture'] as const){const s=E.createInitialState(seats,()=>.33,{rounds:40,packId});assert.equal(s.deck.length,39);assert.ok([s.questionId,...s.deck].every(id=>QUESTIONS.find(q=>q.id===id)?.packId===packId));assert.ok(E.validateState(s));assert.throws(()=>E.createInitialState(seats,()=>.3,{rounds:41,packId}));}
 assert.throws(()=>E.createInitialState(seats,()=>.3,{rounds:10,packId:'forged' as any}));
});

test('final all-in accepts the full score even when greater than five',()=>{
 let s=E.createInitialState([{id:'a',name:'เอ'},{id:'b',name:'บี'}],()=>.3,{rounds:3});
 for(let round=1;round<=3;round++){const answer=QUESTIONS.find(q=>q.id===s.questionId)!.answer;for(const id of ['a','b'])s=E.applyAction(s,id,{type:'hl-bet',answer,stake:round===3?10:5,...round===3?{allIn:true}:{}});assert.ok(E.validateState(s));s=E.applyAction(s,'b',{type:'hl-end'});if(round<3)s=E.applyAction(s,'a',{type:'hl-next'});}
 assert.deepEqual(s.players.map(p=>p.score),[20,20]);
});

test('legacy rooms restore against the old bank; new games only select new IDs',async()=>{
 const {LEGACY_QUESTIONS}=await import('../src/games/high-low-scoreboard/questions.js');
 const [first,...rest]=LEGACY_QUESTIONS;
 let s:import('../src/games/high-low-scoreboard/types.js').HighLowState={schema:1,phase:'betting',players:[{id:'a',name:'เอ',score:0},{id:'b',name:'บี',score:0}],round:1,rounds:500,questionId:first.id,deck:rest.map(q=>q.id),wagers:[],history:[],winners:[],sequence:0};
 assert.ok(E.validateState(s));s=E.applyAction(s,'a',{type:'hl-bet',answer:first.answer,stake:2});s=E.applyAction(s,'b',{type:'hl-bet',answer:!first.answer,stake:1});assert.ok(E.validateState(s));s=E.applyAction(s,'b',{type:'hl-end'});assert.equal(E.getDisplayView(s).answer,first.answer);
 const fresh=E.createInitialState(s.players,()=>.3,{rounds:200});assert.ok([fresh.questionId,...fresh.deck].every(id=>id.startsWith('hl2-')));
});
