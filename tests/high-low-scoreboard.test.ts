import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../src/games/high-low-scoreboard/engine.js';
import {QUESTIONS} from '../src/games/high-low-scoreboard/questions.js';

test('500 sourced prompts are unique and a match samples without repeating a prompt',()=>{
  assert.equal(QUESTIONS.length,500);
  assert.equal(new Set(QUESTIONS.map(q=>q.text)).size,500);
  assert.ok(QUESTIONS.every(q=>q.source.startsWith('https://')&&typeof q.answer==='boolean'));
  const s=E.createInitialState([{id:'a',name:'เอ'},{id:'b',name:'บี'}],()=>0.37,{rounds:500});
  assert.equal(s.deck.length,499);
  assert.equal(new Set([s.questionId,...s.deck]).size,500);
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
  const done=E.applyAction(one,'b',{type:'hl-bet',answer:!answer,stake:3});
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
  s=E.applyAction(s,'a',{type:'hl-next'});
  const finalAnswer=QUESTIONS.find(q=>q.id===s.questionId)!.answer;
  assert.throws(()=>E.applyAction(s,'b',{type:'hl-bet',answer:finalAnswer,stake:1,allIn:true}));
  assert.throws(()=>E.applyAction(s,'a',{type:'hl-bet',answer:finalAnswer,stake:6,allIn:true}));
  s=E.applyAction(s,'a',{type:'hl-bet',answer:finalAnswer,stake:5,allIn:true});
  s=E.applyAction(s,'b',{type:'hl-bet',answer:!finalAnswer,stake:1});
  assert.equal(s.phase,'finished');
  assert.equal(s.players.find(p=>p.id==='a')!.score,10);
  assert.ok(s.winners.includes('a'));
  assert.ok(E.validateState(s));
});
