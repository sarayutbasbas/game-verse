import {denseLandscape} from './harmonies-fixtures.js';
import {test} from 'node:test';import assert from 'node:assert/strict';
import * as e from '../src/games/harmonies/engine.js';import {ANIMALS,ANIMAL,TOKENS,COUNTS,COORDS,neighbors,terrain,CUBE_COUNT} from '../src/games/harmonies/data.js';import {validateHarmoniesState} from '../src/games/harmonies/validation.js';import type {Cell,Side,HarmoniesAction} from '../src/games/harmonies/types.js';
const rng=(seed:number)=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/2**32),seats=(n:number)=>Array.from({length:n},(_,i)=>({id:`p${i}`,name:`คน ${i}`}));
const stack=(...t:string[]):Cell=>({stack:t.map((x,i)=>`${x}-${String(i+1).padStart(2,'0')}`)});
test('Harmonies catalog:120 terrain identities,32 animals,23 axial cells, complete cube/score metadata',()=>{assert.equal(TOKENS.length,120);assert.equal(new Set(TOKENS).size,120);assert.deepEqual(Object.values(COUNTS),[23,23,21,19,19,15]);assert.equal(ANIMALS.length,32);assert.equal(new Set(ANIMALS.map(c=>c.id)).size,32);assert.equal(COORDS.length,23);for(const c of ANIMALS){assert.ok(c.points.every((x,i)=>Number.isInteger(x)&&x>0&&(!i||x>c.points[i-1])));assert.equal(c.pattern.filter(p=>p.cube).length,1);assert.equal(new Set(c.pattern.map(p=>p.q+','+p.r)).size,c.pattern.length);}assert.ok(CUBE_COUNT>75);for(let i=0;i<23;i++)for(const n of neighbors(i))assert.ok(neighbors(n).includes(i));});
test('Harmonies all legal stack combinations, height caps and occupied cube prohibition',()=>{
 for(const t of Object.keys(COUNTS))assert.equal(e.placementReason(stack(),t as any),undefined);
 for(const [base,next,ok] of [[['rock'],'rock',true],[['rock','rock'],'rock',true],[['rock','rock','rock'],'rock',false],[['wood'],'wood',true],[['wood','wood'],'wood',false],[['wood','wood'],'leaf',true],[['leaf'],'leaf',false],[['wood','leaf'],'leaf',false],[['wood'],'building',true],[['rock'],'building',true],[['building'],'building',true],[['field'],'building',false],[['water'],'building',false],[['building','building'],'building',false]] as const)assert.equal(!e.placementReason(stack(...base),next),ok,base+' '+next);
 assert.ok(e.placementReason({...stack('rock'),cube:{id:'cube',card:'animal-01'}},'rock'));
});
test('Harmonies every animal pattern, six rotations, exact heights, cube positions and building bases',()=>{
 for(const c of ANIMALS)for(let rotation=0;rotation<6;rotation++){
 const origin=COORDS.findIndex((_,i)=>e.patternCells(c.id,i,rotation).every(j=>j>=0));assert.ok(origin>=0);const cells=e.patternCells(c.id,origin,rotation),p=e.emptyPlayer('p','สวน');
 c.pattern.forEach((s,k)=>{p.board[cells[k]]=s.stack[0]==='building'?stack('rock','building'):stack(...s.stack);});
 const m=e.habitatMatches(p,c.id,origin,rotation)!;assert.ok(m,`${c.id} rotation${rotation}`);assert.equal(m.cell,cells[c.pattern.findIndex(p=>p.cube)]);
 p.board[m.cell].cube={id:'occupied',card:c.id};assert.equal(e.habitatMatches(p,c.id,origin,rotation),undefined);delete p.board[m.cell].cube;
 const high=c.pattern.findIndex(v=>v.stack.length>1);if(high>=0){p.board[cells[high]].stack.pop();assert.equal(e.habitatMatches(p,c.id,origin,rotation),undefined);}
 }
 assert.deepEqual(e.patternCells('animal-01',0,6),[]);
});
test('Harmonies terrain scores: heights, isolated mountains, distinct building neighbors, field groups, shortest river and islands',()=>{
 const p=e.emptyPlayer('p','ภูมิประเทศ');p.board[0]=stack('wood','wood','leaf');assert.equal(e.scorePlayer(p,'A').trees,7);p.board[0]=stack('rock','rock','rock');assert.equal(e.scorePlayer(p,'A').mountains,0);p.board[1]=stack('rock');assert.equal(e.scorePlayer(p,'A').mountains,8);
 p.board[0]=stack('field');p.board[1]=stack('field');p.board[2]=stack('field');assert.equal(e.scorePlayer(p,'A').fields,5);
 const b=e.emptyPlayer('b','บ้าน'),center=11,n=neighbors(center);b.board[center]=stack('rock','building');b.board[n[0]]=stack('field');b.board[n[1]]=stack('leaf');assert.equal(e.scorePlayer(b,'A').buildings,0);b.board[n[2]]=stack('wood');assert.equal(e.scorePlayer(b,'A').buildings,5);
 const water=e.emptyPlayer('w','น้ำ');for(let i=0;i<5;i++)water.board[i]=stack('water');assert.equal(e.scorePlayer(water,'A').riverLength,5);assert.equal(e.scorePlayer(water,'A').water,11);assert.equal(e.scorePlayer(e.emptyPlayer('i','เกาะ'),'B').water,5);
 const islands=e.emptyPlayer('i','เกาะ');for(const i of [9,10,11,12,13])islands.board[i]=stack('water');assert.equal(e.scorePlayer(islands,'B').islands,2);assert.equal(e.scorePlayer(islands,'B').water,10);
 const loop=e.emptyPlayer('l','วงน้ำ');for(const i of neighbors(11))loop.board[i]=stack('water');assert.equal(e.scorePlayer(loop,'A').riverLength,4);assert.equal(e.scorePlayer(loop,'A').water,8);
});
test('Harmonies deterministic full games both sides, all counts, conservation, authority, optional timing and final equal turns',()=>{
 for(const side of ['A','B'] as Side[])for(let n=2;n<=4;n++)for(let seed=1;seed<=12;seed++){
 const random=rng(seed);let s=e.createInitialState(seats(n),random,'p0',side),steps=0;assert.ok(validateHarmoniesState(s));assert.equal(s.groups.length,5);
 while(s.phase!=='finished'&&steps++<600){const actor=s.players[s.turn].id,legal=e.getLegalActions(s,actor);const before=structuredClone(s);assert.throws(()=>e.applyAction(s,'outsider',legal[0],random));assert.throws(()=>e.applyAction(s,actor,{...legal[0],score:99} as any,random));assert.deepEqual(s,before);
 const cubes=legal.filter(a=>a.type==='harmonies-cube'),claim=legal.find(a=>a.type==='harmonies-card'),placements=legal.filter(a=>a.type==='harmonies-place'),group=legal.filter(a=>a.type==='harmonies-group');let a:HarmoniesAction;
 if(cubes.length)a=cubes[Math.floor(random()*cubes.length)];else if(claim&&seed%2)a=claim;else if(placements.length)a=placements[Math.floor(random()*placements.length)];else if(group.length)a=group[Math.floor(random()*group.length)];else a=legal.find(a=>a.type==='harmonies-end')!;
 assert.ok(a);s=e.applyAction(s,actor,a,random);assert.ok(validateHarmoniesState(s),`n${n} ${side} seed${seed} step${steps}`);const view=e.getDisplayView(s,'ABCDEF',steps);assert.equal('bag' in view,false);assert.equal('deck' in view,false);assert.deepEqual(view.hand,s.hand);for(const p of view.players)assert.deepEqual(p.board,s.players.find(x=>x.id===p.id)!.board);
 }
 assert.equal(s.phase,'finished');assert.equal(s.turnCount%n,0);assert.ok(s.winners.length);assert.ok(s.players.every(p=>s.scores![p.id].total===e.scorePlayer(p,side).total));assert.equal(e.getLegalActions(s,'p0').length,0);
 }
});
test('Harmonies partial token turn resumes exactly and optional animal draft may precede choosing terrain',()=>{
 const random=rng(7);let s=e.createInitialState(seats(2),random,'p0');const card=s.market[0];s=e.applyAction(s,'p0',{type:'harmonies-card',card},random);assert.equal(s.picked,false);assert.equal(s.cardTaken,true);assert.equal(e.getLegalActions(s,'p0').some(a=>a.type==='harmonies-card'),false);s=e.applyAction(s,'p0',{type:'harmonies-group',group:0},random);const place=e.getLegalActions(s,'p0').find(a=>a.type==='harmonies-place')!;s=e.applyAction(s,'p0',place,random);const restored=JSON.parse(JSON.stringify(s));assert.ok(validateHarmoniesState(restored));assert.equal(restored.hand.length,2);assert.deepEqual(e.getLegalActions(restored,'p0'),e.getLegalActions(s,'p0'));assert.throws(()=>e.applyAction(s,'p0',{type:'harmonies-end'},random));
});

test('Harmonies shared terrain, immutable earned animal and conservation validation',()=>{
 let s=denseLandscape(seats(2));assert.ok(validateHarmoniesState(s));assert.ok(e.habitatMatches(s.players[0],'animal-01',11,3));
 const legal=e.getLegalActions(s,'p0'),cube=legal.find(a=>a.type==='harmonies-cube'&&a.origin===11&&a.rotation===3)!;assert.ok(cube);s=e.applyAction(s,'p0',cube,rng(1));assert.equal(s.players[0].cards[0].placed,2);assert.equal(s.players[0].board.filter(c=>c.cube).length,2);assert.ok(validateHarmoniesState(s));
 assert.throws(()=>e.applyAction(s,'p0',cube,rng(1)));const cell=11;const oldScore=e.scorePlayer(s.players[0],'A').animalTotal;s.players[0].board[cell].stack=[];assert.equal(e.scorePlayer(s.players[0],'A').animalTotal,oldScore);assert.equal(validateHarmoniesState(s),false);
});

test('Harmonies card limit counts only incomplete cards; scores tie on cubes and share equal victory',()=>{
 const s=e.createInitialState(seats(2),rng(2),'p0');s.players[0].cards=ANIMALS.slice(0,4).map(c=>({card:c.id,placed:0}));assert.equal(e.getLegalActions(s,'p0').some(a=>a.type==='harmonies-card'),false);s.players[0].cards[0].placed=ANIMALS[0].points.length;assert.ok(e.getLegalActions(s,'p0').some(a=>a.type==='harmonies-card'));
 const score=e.scorePlayer(e.emptyPlayer('p','คะแนน'),'A');assert.deepEqual(e.winningScores({a:{...score,total:12,cubes:1},b:{...score,total:12,cubes:2},c:{...score,total:11,cubes:20}}),['b']);assert.deepEqual(e.winningScores({a:{...score,total:12,cubes:2},b:{...score,total:12,cubes:2}}),['a','b']);
});
test('Harmonies bag exhaustion starts the final equal-turn round without inventing replacement tokens',()=>{
 let found=false;for(let seed=1;seed<=20&&!found;seed++){
 const random=rng(seed);let s=e.createInitialState(seats(4),random,'p0');for(let k=0;k<400&&s.phase==='playing';k++){
 const actor=s.players[s.turn].id,legal=e.getLegalActions(s,actor),places=legal.filter(a=>a.type==='harmonies-place'),groups=legal.filter(a=>a.type==='harmonies-group');
 const place=places.find(a=>s.players[s.turn].board[a.cell].stack.length)??places.at(0),group=groups.sort((a,b)=>s.groups[b.group].filter(t=>['wood','rock','leaf','building'].includes(terrain(t))).length-s.groups[a.group].filter(t=>['wood','rock','leaf','building'].includes(terrain(t))).length)[0];const action=place??legal.find(a=>a.type==='harmonies-end')??group!;
 const wasEmpty=s.bag.length===0&&s.players[s.turn].board.filter(c=>!c.stack.length).length>2&&action.type==='harmonies-end';s=e.applyAction(s,actor,action,random);if(wasEmpty){found=true;assert.ok(s.endAt);assert.ok(validateHarmoniesState(s));assert.ok(s.endAt!%4===0);}
 }
 if(found){assert.equal(s.phase,'finished');assert.equal(s.turnCount%4,0);assert.ok(validateHarmoniesState(s));}
 }assert.ok(found,'controlled dense stacking reaches bag exhaustion');
});

test('Harmonies projections whitelist public fields even if internal records later acquire private metadata',()=>{
 const s:any=denseLandscape(seats(2));s.players[0].reconnectToken='private-fixture';s.players[0].board[0].secret='private-fixture';s.players[0].cards[0].secret='private-fixture';s.event.secret='private-fixture';
 const view=e.getDisplayView(s,'ABCDEF',1);assert.equal(JSON.stringify(view).includes('private-fixture'),false);assert.equal('bag' in view,false);assert.equal('deck' in view,false);assert.equal('me' in view,false);
});
