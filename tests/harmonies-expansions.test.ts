import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as e from '../src/games/harmonies/engine.js';
import {SPIRITS,WHISPERS,ANIMAL,COORDS,neighbors,terrain} from '../src/games/harmonies/data.js';
import {spiritPoints,soloSuns} from '../src/games/harmonies/expansions.js';
import {validateHarmoniesState} from '../src/games/harmonies/validation.js';
import type {HarmoniesAction,Player,Terrain} from '../src/games/harmonies/types.js';
const rng=(seed:number)=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/2**32);
const seats=(n:number)=>Array.from({length:n},(_,i)=>({id:`p${i}`,name:`สวน ${i}`}));
function pattern(p:Player,card:string){const c=ANIMAL[card],origin=COORDS.findIndex((_,i)=>e.patternCells(card,i,0).every(j=>j>=0)),cells=e.patternCells(card,origin,0);c.pattern.forEach((v,k)=>{p.board[cells[k]].stack=v.stack.map((t,i)=>`${t}-${String(i+1).padStart(2,'0')}`);});return {origin,cells};}
test('Whispers: all 10 printed patterns, two-token forms and exact red ground/building heights',()=>{
 assert.equal(WHISPERS.length,10);assert.equal(SPIRITS.length,10);assert.deepEqual(ANIMAL['whisper-10'].pattern.map(p=>p.stack),[['water'],['field']]);for(const t of ['rock','leaf','water','field','building'])assert.equal(WHISPERS.filter(c=>c.pattern.find(p=>p.cube)!.stack.at(-1)===t).length,2);
 for(const c of WHISPERS){assert.equal(c.pattern.length,2);assert.equal(c.points.length,2);const p=e.emptyPlayer('p','สวน'),{origin}=pattern(p,c.id);assert.ok(e.habitatMatches(p,c.id,origin,0),c.id);}
 assert.equal(ANIMAL['whisper-03'].pattern.reduce((n,p)=>n+p.stack.length,0),2);
 assert.equal(ANIMAL['whisper-04'].pattern.reduce((n,p)=>n+p.stack.length,0),2);
 const p=e.emptyPlayer('p','สวน'),{origin,cells}=pattern(p,'whisper-06');assert.ok(e.habitatMatches(p,'whisper-06',origin,0));p.board[cells[1]].stack.push('building-02');assert.equal(e.habitatMatches(p,'whisper-06',origin,0),undefined);
 const b=e.emptyPlayer('p','สวน'),m=pattern(b,'whisper-07');b.board[m.cells[0]].stack=['rock-01','building-01'];assert.ok(e.habitatMatches(b,'whisper-07',m.origin,0));b.board[m.cells[0]].stack=['building-01'];assert.equal(e.habitatMatches(b,'whisper-07',m.origin,0),undefined);
});
test('Whisper coexistence: either order, one Whisper per cell, 2 vs 5 points and no terrain above cubes',()=>{
 for(const whisperFirst of [true,false]){const p=e.emptyPlayer('p','สวน'),{origin,cells}=pattern(p,'whisper-03'),cell=p.board[cells[0]];p.cards=[{card:'whisper-03',placed:1},{card:'animal-01',placed:1}];
 if(whisperFirst){cell.whisper={id:'cube-whisper-03-0',card:'whisper-03'};assert.ok(e.placementReason(cell,'rock'));assert.equal(e.scorePlayer(p,'A').whisperTotal,2);cell.cube={id:'cube-animal-01-0',card:'animal-01'};}
 else {cell.cube={id:'cube-animal-01-0',card:'animal-01'};assert.ok(e.habitatMatches(p,'whisper-03',origin,0));cell.whisper={id:'cube-whisper-03-0',card:'whisper-03'};}
 assert.equal(e.scorePlayer(p,'A').whisperTotal,5);assert.equal(e.scorePlayer(p,'A').cubes,1);assert.equal(e.habitatMatches(p,'whisper-03',origin,0),undefined);assert.ok(e.placementReason(cell,'building'));
 }
});
test('Spirits: first-turn private choice, other players/public never receive draft pairs; forged choice is atomic',()=>{
 let s=e.createInitialState(seats(3),rng(7),'p0','A',{natureSpirits:true});const choices=s.spiritDrafts!.p0;assert.equal(e.getLegalActions(s,'p0').length,2);assert.deepEqual(e.getPlayerView(s,'p0').spiritChoices,choices);assert.equal(e.getPlayerView(s,'p1').spiritChoices,undefined);assert.equal('spiritDrafts' in e.getDisplayView(s,'ABCDEF',0),false);assert.equal(JSON.stringify(e.getDisplayView(s,'ABCDEF',0)).includes(choices[0]),false);
 assert.throws(()=>e.applyAction(s,'p0',{type:'harmonies-spirit',card:s.spiritDrafts!.p1[0]},rng(1)));assert.equal(s.sequence,0);
 s=e.applyAction(s,'p0',{type:'harmonies-spirit',card:choices[0]},rng(1));assert.ok(validateHarmoniesState(s));assert.equal(s.players[0].cards.length,1);assert.equal(e.scorePlayer(s.players[0],'A').spiritTotal,0);assert.equal(e.getPlayerView(s,'p0').spiritChoices,undefined);assert.equal(s.cardTaken,false);assert.equal(e.getLegalActions(s,'p1').length,0);
});
test('Spirit bonuses follow final terrain groups, include lone mountains, current crane 6 points, and require activation',()=>{
 const p=e.emptyPlayer('p','สวน');p.board[0].stack=['rock-01','rock-02'];assert.equal(spiritPoints(p,'spirit-07'),4);p.cards=[{card:'spirit-07',placed:0}];assert.equal(e.scorePlayer(p,'A').spiritTotal,0);p.cards[0].placed=1;assert.equal(e.scorePlayer(p,'A').spiritTotal,4);
 const b=e.emptyPlayer('p','สวน');b.board[0].stack=['rock-01','building-01'];b.board[1].stack=['wood-01','building-02'];assert.equal(spiritPoints(b,'spirit-06'),6);assert.equal(spiritPoints(b,'spirit-05'),4);
 const f=e.emptyPlayer('p','สวน');f.board[0].stack=['field-01'];f.board[1].stack=['field-02'];assert.equal(spiritPoints(f,'spirit-01'),2);f.board[2].stack=['field-03'];assert.equal(spiritPoints(f,'spirit-01'),10);assert.equal(spiritPoints(f,'spirit-02'),5);
});
test('Solo: unused tokens leave play, optional discard locks to end, normal mode cannot start with one',()=>{
 assert.throws(()=>e.createInitialState(seats(1),rng(1)));assert.throws(()=>e.createInitialState(seats(2),rng(1),undefined,'A',{solo:true}));assert.throws(()=>e.createInitialState(seats(2),rng(1),undefined,'A',{whispers:'yes'} as any));
 let s=e.createInitialState(seats(1),rng(5),'p0','A',{solo:true});assert.equal(s.groups.length,3);assert.equal(s.market.length,3);s=e.applyAction(s,'p0',{type:'harmonies-group',group:0},rng(1));while(s.hand.length)s=e.applyAction(s,'p0',e.getLegalActions(s,'p0').find(a=>a.type==='harmonies-place')!,rng(1));
 const unused=s.groups.flat(),bag=s.bag.length,card=s.market[0];s=e.applyAction(s,'p0',{type:'harmonies-solo-discard',card},rng(1));assert.deepEqual(e.getLegalActions(s,'p0'),[{type:'harmonies-end'}]);assert.ok(validateHarmoniesState(s));s=e.applyAction(s,'p0',{type:'harmonies-end'},rng(1));assert.deepEqual(s.discardedTokens,unused);assert.equal(s.bag.length,bag-9);assert.ok(s.groups.flat().every(id=>!unused.includes(id)));assert.ok(validateHarmoniesState(s));
 const p=e.emptyPlayer('p','สวน');assert.equal(soloSuns(p,'A',160),11);assert.equal(soloSuns(p,'B',39),2);p.cards=[{card:'spirit-01',placed:0}];assert.equal(soloSuns(p,'A',70),3);p.cards=[{card:'spirit-03',placed:0}];assert.equal(soloSuns(p,'A',70),4);
});
test('Complete Solo and multiplayer games with module combinations persist and conserve all cards/cubes/tokens',()=>{
 for(const n of [1,2,4])for(const natureSpirits of [false,true])for(const whispers of [false,true])for(const side of ['A','B'] as const){const random=rng(n*88+7);let s=e.createInitialState(seats(n),random,'p0',side,{solo:n===1,natureSpirits,whispers}),steps=0;
 while(s.phase==='playing'&&steps++<800){assert.ok(validateHarmoniesState(s),`invalid n${n} spirit${natureSpirits} whisper${whispers} ${side} step${steps}`);const actor=s.players[s.turn].id,legal=e.getLegalActions(s,actor),pick=(t:string)=>legal.filter(a=>a.type===t);const candidates=pick('harmonies-spirit').length?pick('harmonies-spirit'):pick('harmonies-cube').length?pick('harmonies-cube'):pick('harmonies-card').length?pick('harmonies-card'):pick('harmonies-place').length?pick('harmonies-place'):pick('harmonies-group').length?pick('harmonies-group'):pick('harmonies-end');assert.ok(candidates.length);s=e.applyAction(s,actor,candidates[Math.floor(random()*candidates.length)],random);}
 assert.equal(s.phase,'finished');assert.ok(validateHarmoniesState(JSON.parse(JSON.stringify(s))));assert.equal(s.turnCount%n,0);for(const p of s.players){const score=e.scorePlayer(p,side);assert.equal(score.total,score.landscape+score.animalTotal+(score.spiritTotal??0)+(score.whisperTotal??0));}if(n===1)assert.equal(typeof e.getDisplayView(s,'ABCDEF',s.sequence).soloSuns,'number');
 const corrupt=structuredClone(s);corrupt.discardedTokens?.push(corrupt.bag[0]??'water-01');assert.equal(validateHarmoniesState(corrupt),false);
 }
});
test('All Spirit habitats fit with six rotations and the generic game adapter can start a Solo session',async()=>{
 for(const card of SPIRITS)for(let rotation=0;rotation<6;rotation++){const p=e.emptyPlayer('p','สวน'),origin=COORDS.findIndex((_,i)=>e.patternCells(card.id,i,rotation).every(j=>j>=0)),cells=e.patternCells(card.id,origin,rotation);assert.ok(origin>=0);card.pattern.forEach((v,k)=>{p.board[cells[k]].stack=(v.stack[0]==='building'?['rock','building']:v.stack).map((t,i)=>`${t}-${String(i+1).padStart(2,'0')}`);});assert.ok(e.habitatMatches(p,card.id,origin,rotation),`${card.id} rotation ${rotation}`);}
 const {gameAdapters}=await import('../src/games/registry.js');const solo=gameAdapters.harmonies.start(seats(1),rng(2),'p0');assert.equal(solo.options!.solo,true);assert.ok(validateHarmoniesState(solo));
});
