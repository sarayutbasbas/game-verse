import {test} from 'node:test';import assert from 'node:assert/strict';
import {CARDS,CARD} from '../src/games/pixies/data.js';
import * as e from '../src/games/pixies/engine.js';import {validatePixiesState} from '../src/games/pixies/validation.js';
const rng=(seed:number)=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/2**32);
const seats=(n:number)=>Array.from({length:n},(_,i)=>({id:`p${i}`,name:`คน ${i}`}));
test('Pixies base catalog:70 unique, per-number counts, four suits16 + six wilds and8 specials',()=>{assert.equal(CARDS.length,70);assert.equal(new Set(CARDS.map(c=>c.id)).size,70);assert.deepEqual(Array.from({length:9},(_,i)=>CARDS.filter(c=>c.number===i+1).length),[5,6,8,10,12,10,8,6,5]);for(const color of ['blue','green','yellow','red'])assert.equal(CARDS.filter(c=>c.colors.length===1&&c.colors[0]===color).length,16);assert.equal(CARDS.filter(c=>c.colors.length===4).length,6);assert.equal(CARDS.filter(c=>c.perColor).length,8);});
test('Pixies placement: matching slot, keep either face, validated forces empty facedown, later cover validates',()=>{
 let s=e.createInitialState(seats(2),rng(2),'p0');s.market=['blue-01'];s.marketSlots=[...s.market];s=e.applyAction(s,'p0',{type:'pixies-pick',card:'blue-01'},rng(1));assert.equal(e.placementOffers(s,'p0')[0].slot,0);s=e.applyAction(s,'p0',{type:'pixies-place',slot:0,keep:'new'},rng(1));
 s.turn=0;s.market=['green-01'];s.marketSlots=[...s.market];s=e.applyAction(s,'p0',{type:'pixies-pick',card:'green-01'},rng(1));assert.deepEqual(e.placementOffers(s,'p0').map(x=>x.keep),['old','new']);s=e.applyAction(s,'p0',{type:'pixies-place',slot:0,keep:'old'},rng(1));assert.deepEqual(s.players[0].grid[0],{up:'blue-01',down:'green-01'});
 s.turn=0;s.market=['yellow-01'];s.marketSlots=[...s.market];s=e.applyAction(s,'p0',{type:'pixies-pick',card:'yellow-01'},rng(1));assert.equal(e.placementOffers(s,'p0').length,8);assert.ok(e.placementOffers(s,'p0').every(x=>x.keep==='down'));const unchanged=structuredClone(s);assert.throws(()=>e.applyAction(s,'p0',{type:'pixies-place',slot:0,keep:'down'},rng(1)));assert.deepEqual(s,unchanged);s=e.applyAction(s,'p0',{type:'pixies-place',slot:1,keep:'down'},rng(1));
 s.turn=0;s.market=['blue-02'];s.marketSlots=[...s.market];s=e.applyAction(s,'p0',{type:'pixies-pick',card:'blue-02'},rng(1));s=e.applyAction(s,'p0',{type:'pixies-place',slot:1,keep:'new'},rng(1));assert.deepEqual(s.players[0].grid[1],{up:'blue-02',down:'yellow-01'});
});
test('Pixies symbols, special includes itself and wild, orthogonal single-color zones, multiplier2/3/4',()=>{const p=e.emptyPlayer('p','คน');p.grid[0]={up:'blue-01',down:'red-01'};p.grid[1]={up:'all-01',down:null};p.grid[2]={up:'blue-03',down:null};p.grid[3]={up:'blue-06',down:null};p.grid[8]={up:'blue-15',down:null};for(let r=1;r<=3;r++){const score=e.scorePlayer(p,r);assert.equal(score.validated,1);assert.equal(score.spirals,9);assert.equal(score.crosses,6);assert.equal(score.special,5);assert.equal(score.zoneSize,4);assert.equal(score.zone,4*(r+1));}const q=e.emptyPlayer('q','คน');q.grid[0].up='blue-01';q.grid[4].up='blue-08';assert.equal(e.scorePlayer(q,1).zoneSize,0);});
test('Pixies all counts: seeded full3 rounds conserve cards, hide all buried IDs, reject wrong actors/shape, shared victory',()=>{for(let n=2;n<=5;n++)for(let seed=1;seed<=100;seed++){const random=rng(seed);let s=e.createInitialState(seats(n),random);assert.equal(s.market.length,n===2?4:n);let steps=0;while(s.phase!=='finished'&&steps++<1000){assert.ok(validatePixiesState(s),`valid n${n} seed${seed}`);const actor=s.players[s.turn].id,legal=e.getLegalActions(s,actor).filter(a=>a.type!=='pixies-cancel');assert.ok(legal.length);const before=JSON.stringify(s);assert.throws(()=>e.applyAction(s,'outsider',legal[0],random));assert.throws(()=>e.applyAction(s,actor,{...legal[0],score:99} as any,random));assert.equal(JSON.stringify(s),before);s=e.applyAction(s,actor,legal[Math.floor(random()*legal.length)],random);const view=e.getDisplayView(s,'ABCDEF',steps);assert.ok(!('deck'in view));for(let i=0;i<n;i++)for(let k=0;k<9;k++){const down=s.players[i].grid[k].down;if(down)assert.equal(view.players[i].grid[k].down,true);} }assert.equal(s.phase,'finished');assert.ok(validatePixiesState(s));assert.ok(s.winners.length);assert.ok(s.players.every(p=>p.scores.length===3));}});
test('Pixies two-player ending waits equal picks and leaves2 cards; last picker starts next round',()=>{let s=e.createInitialState(seats(2),rng(4),'p0');s.players[0].grid=Array.from({length:9},(_,i)=>({up:i===0?null:CARDS.find(c=>c.number===i+1)!.id,down:null}));s.market=['blue-01','green-01','yellow-01','red-01'];s.marketSlots=[...s.market];s=e.applyAction(s,'p0',{type:'pixies-pick',card:'blue-01'},rng(1));s=e.applyAction(s,'p0',{type:'pixies-place',slot:0,keep:'new'},rng(1));assert.equal(s.phase,'playing');s=e.applyAction(s,'p1',{type:'pixies-pick',card:'green-01'},rng(1));s=e.applyAction(s,'p1',{type:'pixies-place',slot:0,keep:'new'},rng(1));assert.equal(s.phase,'results');assert.equal(s.market.length,2);assert.equal(s.starter,1);s=e.applyAction(s,'p0',{type:'pixies-next'},rng(2));assert.equal(s.turn,1);assert.equal(s.round,2);});
test('Pixies final equal totals share victory, buried-card projections remain isolated',()=>{
 let s=e.createInitialState(seats(2),rng(21),'p0');const random=rng(40);while(!(s.round===3&&s.phase==='playing')){const actor=s.players[s.turn].id;s=e.applyAction(s,actor,e.getLegalActions(s,actor).find(a=>a.type!=='pixies-cancel')!,random);}
 // Balance prior-round totals against this deterministic final round without changing any final cards.
 const initial=structuredClone(s);while(s.phase!=='finished'){const actor=s.players[s.turn].id;s=e.applyAction(s,actor,e.getLegalActions(s,actor).find(a=>a.type!=='pixies-cancel')!,random);}
 const totals=s.players.map(p=>p.scores.reduce((a,b)=>a+b.total,0));initial.players[0].scores[0].validated+=totals[1]-totals[0];initial.players[0].scores[0].total+=totals[1]-totals[0];s=initial;
 while(s.phase!=='finished'){const actor=s.players[s.turn].id;s=e.applyAction(s,actor,e.getLegalActions(s,actor).find(a=>a.type!=='pixies-cancel')!,random);}
 assert.deepEqual(s.winners,['p0','p1']);const v=e.getDisplayView(s,'ABCDEF',1);const card=v.players.flatMap(p=>p.grid.flatMap(v=>v.up?[v.up]:[]))[0];const old=CARD[card.id].colors[0];card.colors[0]='red';assert.equal(CARD[card.id].colors[0],old);
});
test('Pixies depletion: valid70-card five-player position ends after equal final picks without a full garden',()=>{
 let s=e.createInitialState(seats(5),rng(1),'p0');const unused=CARDS.map(c=>c.id),take=(number?:number)=>{const i=number===undefined?0:unused.findIndex(id=>CARD[id].number===number);assert.ok(i>=0);return unused.splice(i,1)[0];};
 const missing=[[1,2],[1,3],[2,4],[3,6],[4,7]];
 for(let p=0;p<5;p++)for(let n=1;n<=9;n++)if(!missing[p].includes(n))s.players[p].grid[n-1].up=take(n);
 s.market=Array.from({length:5},()=>take(5));s.marketSlots=[...s.market];s.deck=[];
 for(const p of s.players)for(let i=0;i<9;i++)if(p.grid[i].up&&i!==4)p.grid[i].down=take();assert.equal(unused.length,0);assert.ok(validatePixiesState(s));
 for(let p=0;p<5;p++){s=e.applyAction(s,`p${p}`,{type:'pixies-pick',card:s.market[0]},rng(1));s=e.applyAction(s,`p${p}`,{type:'pixies-place',slot:4,keep:'old'},rng(1));assert.equal(s.phase,p===4?'results':'playing');assert.ok(validatePixiesState(s));}
 assert.ok(s.players.every(p=>p.grid.filter(v=>v.up||v.down).length===7));assert.ok(s.players.every(p=>p.scores.length===1));
});
test('Pixies two-player last two deck cards form a final equal pair',()=>{
 let s=e.createInitialState(seats(2),rng(1),'p0');s.deck=['blue-01','green-01'];s.market=['blue-02','green-02'];s.marketSlots=[...s.market];
 for(let i=0;i<4;i++){const id=s.players[s.turn].id;s=e.applyAction(s,id,{type:'pixies-pick',card:s.market[0]},rng(1));s=e.applyAction(s,id,{type:'pixies-place',slot:i<2?1:0,keep:'new'},rng(1));if(i===1){assert.equal(s.market.length,2);assert.equal(s.deck.length,0);assert.equal(s.turn,1);}}
 assert.equal(s.phase,'results');assert.ok(s.players.every(p=>p.scores.length===1));
});
test('Pixies market positions persist through select/cancel/place and hide removed IDs',()=>{
 const random=rng(7);let s=e.createInitialState(seats(3),random,'p0');const ids=[...s.market],card=ids[1];
 s=e.applyAction(s,'p0',{type:'pixies-pick',card},random);assert.deepEqual(e.getDisplayView(s,'ABCDEF',1).marketLayout!.map(c=>c?.id),ids);
 s=e.applyAction(s,'p0',{type:'pixies-cancel'},random);assert.deepEqual(s.marketSlots,ids);
 s=e.applyAction(s,'p0',{type:'pixies-pick',card},random);s=e.applyAction(s,'p0',e.getLegalActions(s,'p0').find(a=>a.type==='pixies-place')!,random);
 const layout=e.getDisplayView(s,'ABCDEF',4).marketLayout!;assert.equal(layout[1],null);assert.equal(layout[0]?.id,ids[0]);assert.equal(layout[2]?.id,ids[2]);assert.ok(validatePixiesState(s));
 const legacy=structuredClone(s);delete legacy.marketSlots;assert.ok(validatePixiesState(legacy));assert.ok(e.getDisplayView(legacy,'ABCDEF',4).marketLayout!.every(c=>c));
});

test('Pixies pending card can switch directly; old selection stays available and wrong actor cannot switch',()=>{
 let s=e.createInitialState(seats(2),rng(18),'p0');const [one,two]=s.market;const before=[...s.market];
 s=e.applyAction(s,'p0',{type:'pixies-pick',card:one},rng(1));const old=s;
 assert.throws(()=>e.applyAction(s,'p1',{type:'pixies-pick',card:two},rng(1)));assert.deepEqual(s,old);
 s=e.applyAction(s,'p0',{type:'pixies-pick',card:two},rng(1));assert.equal(s.pending!.card,two);assert.deepEqual(s.market,before);assert.equal(s.turn,0);assert.equal(s.picks,0);assert.ok(validatePixiesState(s));
});
test('Pixies score contributors use only visible slots and the single largest same-color connected zone',()=>{
 const p=e.emptyPlayer('p','สวน');p.grid[0]={up:'blue-01',down:'red-01'};p.grid[1].up='all-01';p.grid[2].up='blue-03';p.grid[3].up='blue-06';p.grid[8].up='blue-15';
 const detail=e.scoreGarden(p,2);assert.deepEqual(detail.score,e.scorePlayer(p,2));assert.deepEqual(detail.contributors.validated,[0]);assert.deepEqual([...detail.contributors.zone].sort(),[0,1,2,3]);
 for(const key of ['spirals','crosses','special'] as const)assert.deepEqual(detail.contributors[key],p.grid.flatMap((v,i)=>v.up&&(key==='special'?CARD[v.up].perColor:CARD[v.up][key])?[i]:[]));
 const empty=e.emptyPlayer('e','ว่าง');empty.grid[0].down='blue-01';assert.deepEqual(e.scoreGarden(empty,1).contributors,{validated:[],spirals:[],crosses:[],special:[],zone:[]});
});
