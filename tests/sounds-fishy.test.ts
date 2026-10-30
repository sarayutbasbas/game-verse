import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../src/games/sounds-fishy/engine.js';
import {QUESTIONS} from '../src/games/sounds-fishy/questions.js';
import {validateSoundsFishyState as valid} from '../src/games/sounds-fishy/validation.js';
import type {SoundsFishyAction} from '../src/games/sounds-fishy/types.js';
const seats=(n=4)=>Array.from({length:n},(_,i)=>({id:'p'+i,name:'ผู้เล่น '+i}));
function seeded(seed:number){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
test('Sounds Fishy: 200 original Thai questions, unique IDs/text, ten balanced categories, source metadata',()=>{
 assert.equal(QUESTIONS.length,200);assert.equal(new Set(QUESTIONS.map(q=>q.id)).size,200);assert.equal(new Set(QUESTIONS.map(q=>q.text)).size,200);
 const categories=new Map<string,number>();for(const q of QUESTIONS){assert.ok(q.answer.trim()&&q.text.trim());if(q.source)assert.match(q.source,/^https:\/\//);else assert.equal('kind' in q?q.kind:undefined,'wordplay');assert.equal(q.origin,'original-thai');categories.set(q.category,(categories.get(q.category)??0)+1);}assert.equal(categories.size,10);assert.ok([...categories.values()].every(n=>n===20));
});
test('Sounds Fishy: explicit official scoring examples, including blue in flipped count',()=>{
 const p=seats(5);assert.deepEqual(E.scoreRound(p,'p0','p1',[],'bank'),{p0:0,p1:0,p2:0,p3:0,p4:0});
 assert.deepEqual(E.scoreRound(p,'p0','p1',['p2'],'bank'),{p0:1,p1:0,p2:0,p3:1,p4:1});
 assert.deepEqual(E.scoreRound(p,'p0','p1',['p1'],'blue'),{p0:0,p1:3,p2:1,p3:1,p4:1});
 assert.deepEqual(E.scoreRound(p,'p0','p1',['p2','p1'],'blue'),{p0:0,p1:2,p2:0,p3:2,p4:2});
 assert.deepEqual(E.scoreRound(p,'p0','p1',['p2','p3','p4'],'all-red'),{p0:4,p1:0,p2:0,p3:0,p4:0});
});
test('Sounds Fishy: 140 seeded full games, every seat guesses correct count, no repeat and valid persisted scores',()=>{
 for(let n=4;n<=10;n++)for(let seed=1;seed<=20;seed++){
  const rng=seeded(n*100+seed);let s=E.createInitialState(seats(n),rng);assert.ok(valid(s));let count=0;
  while(!E.isFinished(s)){const id=s.players[s.guesser].id,legal=E.getLegalActions(s,id),a=legal[Math.floor(rng()*legal.length)];assert.ok(a);s=E.applyAction(s,id,a,rng,1000);assert.ok(valid(JSON.parse(JSON.stringify(s))));assert.ok(++count<150);}
  assert.equal(s.history.length,n*(n<=5?2:1));assert.equal(new Set(s.history.map(r=>r.question)).size,s.totalRounds);for(const p of s.players)assert.equal(s.history.filter(r=>r.guesser===p.id).length,n<=5?2:1);assert.ok(s.winners.length);
 }
});
test('Sounds Fishy: no answers, future questions or roles on public/guesser projection; own private peek only',()=>{
 let s=E.createInitialState(seats(),()=>.4);for(const v of [E.getDisplayView(s,'ABC',1),E.getPhoneView(s,'p0','ABC',1)]){assert.equal(v.answer,undefined);assert.equal(v.source,undefined);assert.ok(v.players.every(p=>p.fish===undefined));for(const k of ['roles','deck','history','blue'])assert.ok(!(k in v));assert.equal(v.me?.answer,undefined);}
 const privateView=E.getPhoneView(s,'p1','ABC',1);assert.ok(privateView.me?.answer);assert.ok(privateView.me?.fish);assert.ok(privateView.players.every(p=>p.fish===undefined));
 s=E.applyAction(s,'p0',{type:'sf-begin'},()=>.4);const red=Object.keys(s.roles).find(id=>s.roles[id]==='red')!;s=E.applyAction(s,'p0',{type:'sf-flip',player:red},()=>.4);assert.equal(E.getDisplayView(s,'ABC',2).players.find(p=>p.id===red)?.fish,'red');assert.equal(E.getDisplayView(s,'ABC',2).answer,undefined);
 s=E.applyAction(s,'p0',{type:'sf-bank'},()=>.4);assert.ok(E.getDisplayView(s,'ABC',3).answer);assert.ok(valid(s));
});
test('Sounds Fishy: strict commands, stale ready epochs, immutable rejection and corrupted restore',()=>{
 const s=E.createInitialState(seats(),()=>.4),before=JSON.stringify(s);for(const [id,a] of [['p1',{type:'sf-begin'}],['outsider',{type:'sf-bank'}],['p1',{type:'sf-ready',epoch:'old:1'}],['p0',{type:'sf-begin',actor:'p1'}],['p0',{type:'sf-flip',player:'p0'}]] as const)assert.throws(()=>E.applyAction(s,id,a as SoundsFishyAction,()=>.4));assert.equal(JSON.stringify(s),before);
 const ready=E.applyAction(s,'p1',{type:'sf-ready',epoch:E.decisionKey(s)},()=>.4);assert.throws(()=>E.applyAction(ready,'p1',{type:'sf-ready',epoch:E.decisionKey(s)},()=>.4));
 for(const mutate of [(x:typeof s)=>x.players[0].score++,(x:typeof s)=>x.deck.push(x.question),(x:typeof s)=>x.roles.p1='blue',(x:typeof s)=>x.winners.push('p0')]){const bad=structuredClone(s);mutate(bad);if(JSON.stringify(bad)!==before)assert.equal(valid(bad),false);}
 assert.throws(()=>E.createInitialState(seats(3),()=>.4));assert.throws(()=>E.createInitialState(seats(11),()=>.4));
});
