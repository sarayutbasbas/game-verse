import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as e from '../src/games/harmonies/engine.js';
import {ANIMAL,COORDS,cellAt} from '../src/games/harmonies/data.js';
import {optionsFor,spiritPool,spiritPoints,soloSuns} from '../src/games/harmonies/expansions.js';
import {validateHarmoniesState} from '../src/games/harmonies/validation.js';
const rng=(seed:number)=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/2**32);
const seats=(n:number)=>Array.from({length:n},(_,i)=>({id:`p${i}`,name:`Garden ${i}`}));
test('T-rex promo is opt-in, enables Spirits and conserves the correct 10/11-card pools',()=>{
 assert.equal(spiritPool(optionsFor({natureSpirits:true})).length,10);assert.equal(spiritPool(optionsFor({promoTrex:true})).length,11);assert.equal(optionsFor({promoTrex:true}).natureSpirits,true);
 assert.throws(()=>optionsFor({promoTrex:'yes'} as any));
 for(const promoTrex of [false,true])for(const n of [1,2,4]){
  const s=e.createInitialState(seats(n),rng(n),'p0','A',{solo:n===1,natureSpirits:true,promoTrex});
  const pool=[...Object.values(s.spiritDrafts!).flat(),...s.spiritUnused!];assert.equal(pool.length,promoTrex?11:10);assert.equal(new Set(pool).size,pool.length);assert.equal(pool.includes('spirit-11'),promoTrex);assert.ok(validateHarmoniesState(s));
  const bad=structuredClone(s);bad.options!.promoTrex=!promoTrex;assert.equal(validateHarmoniesState(bad),false);
 }
});
test('T-rex habitat is a straight rock3/field/tree3, six rotations, exact height and a free destination',()=>{
 const card=ANIMAL['spirit-11'];assert.deepEqual(card.pattern.map(p=>p.stack),[['rock','rock','rock'],['field'],['wood','wood','leaf']]);
 for(let rotation=0;rotation<6;rotation++){
  const p=e.emptyPlayer('p','Garden'),origin=COORDS.findIndex((_,i)=>e.patternCells(card.id,i,rotation).every(j=>j>=0)),cells=e.patternCells(card.id,origin,rotation);
  card.pattern.forEach((v,k)=>{p.board[cells[k]].stack=v.stack.map((t,i)=>`${t}-${i+1}`)});assert.ok(e.habitatMatches(p,card.id,origin,rotation));
  p.board[cells[0]].stack.pop();assert.equal(e.habitatMatches(p,card.id,origin,rotation),undefined);p.board[cells[0]].stack.push('rock-3');
  p.board[cells[1]].cube={id:'occupied',card:'animal-01'};assert.equal(e.habitatMatches(p,card.id,origin,rotation),undefined);
 }
});
test('T-rex scores connected animals across chains/branches/cycles once, not gaps, itself or lone Whispers',()=>{
 const p=e.emptyPlayer('p','Garden'),origin=cellAt(2,0);p.cards=[{card:'spirit-11',placed:0}];
 const animals=[[1,0],[1,1],[2,1],[3,0],[3,-1],[2,-1]].map(([q,r])=>cellAt(q,r));
 for(const [k,i]of animals.entries()){p.board[i].stack=['field-1'];p.board[i].cube={id:`a${k}`,card:'animal-01'};}
 p.board[origin].stack=['field-2'];assert.equal(spiritPoints(p,'spirit-11'),0);assert.equal(e.scorePlayer(p,'A').spiritTotal,0);
 p.board[origin].cube={id:'trex',card:'spirit-11'};p.cards[0].placed=1;assert.equal(e.scorePlayer(p,'A').spiritTotal,12);
 const tail=cellAt(4,0),isolated=cellAt(0,4);for(const i of [tail,isolated]){p.board[i].stack=['field-3'];p.board[i].cube={id:`a${i}`,card:'animal-01'};}assert.equal(spiritPoints(p,'spirit-11'),14);
 delete p.board[cellAt(3,0)].cube;p.board[cellAt(3,0)].whisper={id:'w',card:'whisper-03'};assert.equal(spiritPoints(p,'spirit-11'),10);
 p.board[animals[0]].whisper={id:'w2',card:'whisper-03'};assert.equal(spiritPoints(p,'spirit-11'),10);assert.equal(soloSuns(p,'A',70),3);assert.equal(soloSuns(p,'B',70),2);
});
test('Complete promo Solo/multiplayer games persist all cards, tokens and bonus totals with/without Whispers',()=>{
 let trexChosen=0;
 for(const n of [1,2,4])for(const whispers of [false,true])for(const side of ['A','B'] as const){
  const random=rng(n*31+(whispers?7:0)+(side==='B'?3:0));let s=e.createInitialState(seats(n),random,'p0',side,{solo:n===1,promoTrex:true,whispers}),steps=0;
  while(s.phase==='playing'&&steps++<800){
   assert.ok(validateHarmoniesState(s));const actor=s.players.find(p=>s.spiritDrafts?.[p.id]?.length)?.id??s.players[s.turn].id,legal=e.getLegalActions(s,actor);
   const action=legal.find(a=>a.type==='harmonies-spirit'&&a.card==='spirit-11')??legal.find(a=>a.type==='harmonies-spirit')??legal.find(a=>a.type==='harmonies-cube')??legal.find(a=>a.type==='harmonies-card')??legal.find(a=>a.type==='harmonies-place')??legal.find(a=>a.type==='harmonies-group')??legal.find(a=>a.type==='harmonies-end');
   assert.ok(action);if(action.type==='harmonies-spirit'&&action.card==='spirit-11')trexChosen++;s=e.applyAction(s,actor,action,random);
  }
  assert.equal(s.phase,'finished');assert.ok(validateHarmoniesState(JSON.parse(JSON.stringify(s))));for(const p of s.players){const score=e.scorePlayer(p,side);assert.equal(score.total,score.landscape+score.animalTotal+(score.spiritTotal??0)+(score.whisperTotal??0));}
 }
 assert.ok(trexChosen>0);
});
