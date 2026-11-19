import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../src/games/tiny-towns/engine.js';
import {CARDS,card,DEFAULT_OPTIONS,LETTERS,RESOURCES,TYPES} from '../src/games/tiny-towns/data.js';
import {getBuilds,orientations,has} from '../src/games/tiny-towns/geometry.js';
import {scorePlayer,winners} from '../src/games/tiny-towns/scoring.js';
import {validateTinyState as valid} from '../src/games/tiny-towns/validation.js';
import type {TinyState,TinyAction,Cell} from '../src/games/tiny-towns/types.js';
export const rng=(seed=1)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
const seats=(n=1)=>Array.from({length:n},(_,i)=>({id:'p'+i,name:'เมือง '+i}));
const create=(n=1)=>E.createInitialState(seats(n),rng(4),undefined,{...DEFAULT_OPTIONS,monuments:false});
const act=(s:TinyState,a:TinyAction,id='p0')=>E.applyAction(s,id,a,rng(9));
const built=(id:string):Cell=>({building:id});
function fixture(id='cottage',n=1){const s=create(n),type=card(id).type;s.cards=s.cards.map(c=>card(c).type===type?id:c);s.phase='place';s.resource='wood';s.players.forEach(p=>p.placed=true);return s;}
function monument(id:string){const s=create();s.options.monuments=true;s.players[0].monument=id;s.players[0].offer=[];s.phase='place';s.resource='wood';s.players[0].placed=true;return s;}
const score=(s:TinyState)=>scorePlayer(s,s.players[0]);
test('base counts, 1–6 seats, solo exclusions, per-type draw, hidden monument offers and deck conservation',()=>{
 assert.equal(CARDS.length,40);assert.equal(CARDS.filter(c=>c.type==='monument').length,15);
 for(let n=1;n<=6;n++)for(let seed=0;seed<12;seed++){
  const s=E.createInitialState(seats(n),rng(seed),undefined,{...DEFAULT_OPTIONS,randomBuildings:true});assert.ok(valid(s));assert.equal(s.cards.length,7);assert.equal(new Set(s.cards.map(id=>card(id).type)).size,7);
  const display=JSON.stringify(E.getDisplayView(s));for(const p of s.players){assert.equal((E.getDisplayView(s).players.find(q=>q.id===p.id) as any).offer,undefined);assert.equal(E.getDisplayView(s).players.find(q=>q.id===p.id)!.monument,undefined);const own=E.getPlayerView(s,p.id);assert.equal(own.me!.offer.length,2);assert.equal(own.me!.id,p.id);}
  assert.equal(new Set(s.players.flatMap(p=>p.offer)).size,n*2);
  if(n===1)assert.ok(!s.cards.some(id=>['inn','bank'].includes(id)));
 }
 assert.throws(()=>E.createInitialState(seats(7)));assert.throws(()=>E.createInitialState(seats(0)));assert.throws(()=>E.createInitialState(seats(2),()=>1));
});
test('every printed recipe supports all D4 orientations, strict colors, overlap and destination; not just resource totals',()=>{
 for(const c of CARDS){let s=c.type==='monument'?monument(c.id):fixture(c.id);const p=s.players[0];
  for(const shape of orientations(c.pattern)){
   p.board=Array(16).fill(null);for(const q of shape)p.board[q.y*4+q.x]={resource:LETTERS[q.r]};const b=getBuilds(s,p).find(b=>b.card===c.id);assert.ok(b,c.en);assert.ok(b.cells.length>=2);assert.ok(b.destinations.every(i=>p.board[i]===null||b.cells.includes(i)));
   const next=act(s,{type:'tiny-build',card:c.id,cells:b.cells,at:b.destinations[0]});assert.ok(has(next.players[0],c.id));assert.equal(p.board.filter(Boolean).length,shape.length,'immutable');
   const wrong=structuredClone(s);wrong.players[0].board[b.cells[0]]={resource:RESOURCES.find(r=>r!==LETTERS[shape[0].r])!};assert.ok(!getBuilds(wrong,wrong.players[0]).some(x=>x.card===c.id&&JSON.stringify(x.cells)===JSON.stringify(b.cells)));
   assert.throws(()=>act(s,{type:'tiny-build',card:c.id,cells:[...b.cells,b.cells[0]],at:b.destinations[0]}));
  }
 }
});
test('solo selected card moves to bottom, three face-up slots stay public, future deck never does',()=>{
 let s=create(),before=[...s.deck],chosen=s.offer[1];s=act(s,{type:'tiny-call',resource:chosen,slot:1});assert.equal(s.deck.at(-1),chosen);assert.equal(s.offer[1],before[0]);assert.equal(s.deck.length,12);assert.ok(valid(s));
 assert.equal((E.getDisplayView(s) as any).deck,undefined);assert.equal((E.getPlayerView(s,'p0') as any).deck,undefined);
 assert.throws(()=>act(create(),{type:'tiny-call',resource:chosen,slot:8}));
});
test('simultaneous barrier, cannot build before placing, strict payload and authenticated actor, immutable rejection',()=>{
 let s=create(2);assert.throws(()=>act(s,{type:'tiny-call',resource:'wood'},'p1'));s=act(s,{type:'tiny-call',resource:'wood'});assert.throws(()=>act(s,{type:'tiny-ready'}));s=act(s,{type:'tiny-place',resource:'wood',at:0});s=act(s,{type:'tiny-ready'});assert.equal(s.round,1);
 s=act(s,{type:'tiny-place',resource:'wood',at:1},'p1');s=act(s,{type:'tiny-ready'},'p1');assert.equal(s.round,2);assert.equal(s.master,'p1');assert.equal(s.players[0].masterTurns,1);assert.ok(valid(s));
 const before=JSON.stringify(s);assert.throws(()=>act(s,{type:'tiny-call',resource:'wood',money:100} as any,'p1'));assert.throws(()=>act(s,{type:'tiny-call',resource:'wood'},'fake'));assert.equal(JSON.stringify(s),before);
});
test('Trading Post reusable wildcard needs real cube; Shed and Obelisk can relocate only newly constructed building',()=>{
 let s=fixture('trading-post');s.players[0].board[1]=built('trading-post');s.players[0].board[4]={resource:'brick'};s.players[0].board[5]={resource:'glass'};const b=getBuilds(s,s.players[0]).find(b=>b.card==='cottage');assert.ok(b);assert.ok(!b.destinations.includes(1));s=act(s,{type:'tiny-build',card:'cottage',cells:b.cells,at:b.destinations[0]});assert.equal((s.players[0].board[1] as any).building,'trading-post');
 s=fixture('shed');s.players[0].board[0]={resource:'wood'};s.players[0].board[1]={resource:'stone'};const shed=getBuilds(s,s.players[0]).find(b=>b.card==='shed')!;assert.equal(shed.destinations.length,16);s=act(s,{type:'tiny-build',card:'shed',cells:shed.cells,at:15});assert.equal((s.players[0].board[15] as any).building,'shed');
 s=monument('obelisk');s.players[0].board[15]=built('obelisk');s.players[0].board[1]={resource:'wheat'};s.players[0].board[4]={resource:'brick'};s.players[0].board[5]={resource:'glass'};assert.ok(getBuilds(s,s.players[0]).find(b=>b.card==='cottage')!.destinations.includes(10));
});
test('food coverage, farm feeding optimizes chapel/temple, Castle counts two for scoring, exact grouped tables',()=>{
 let s=fixture('temple');s.players[0].board=[built('farm'),built('temple'),built('cottage'),built('cottage'),built('cottage'),built('cottage'),null,null,built('cottage'),null,null,null,...Array(4).fill(null)];assert.equal(score(s).fed.length,4);assert.ok(score(s).items.find(i=>i.card==='temple')!.points===4);
 s=fixture('orchard');s.players[0].board[5]=built('orchard');[0,1,2,4,6,9,13].forEach(i=>s.players[0].board[i]=built('cottage'));assert.deepEqual(score(s).fed.sort((a,b)=>a-b),[1,4,6,9,13]);
 s=fixture('greenhouse');s.players[0].board[15]=built('greenhouse');[0,1,4,10,11].forEach(i=>s.players[0].board[i]=built('cottage'));assert.equal(score(s).fed.length,3);
 for(const [id,table] of [['tavern',[2,5,9,14,20,20,20]],['almshouse',[-1,5,-3,15,-5,26,26]]] as const)for(let n=1;n<=7;n++){s=fixture(id);for(let i=0;i<n;i++)s.players[0].board[i]=built(id);assert.equal(score(s).items.find(i=>i.card===id)!.points,table[n-1]);}
 s=monument('castle');s.players[0].board[0]=built('castle');s.players[0].board[1]=built('well');s.players[0].board[2]=built('farm');s.players[0].board[4]=built('chapel');assert.equal(score(s).items.find(i=>i.card==='well')!.points,2);assert.equal(score(s).items.find(i=>i.card==='chapel')!.points,2);assert.equal(score(s).items.find(i=>i.card==='castle')!.points,5);
});
test('adjacency versus lines, color uniqueness, corners and central cells',()=>{
 let s=fixture('cloister');[0,3,5].forEach(i=>s.players[0].board[i]=built('cloister'));assert.equal(score(s).items.find(i=>i.card==='cloister')!.points,6);
 s=fixture('tailor');[0,5,6,10].forEach(i=>s.players[0].board[i]=built('tailor'));assert.equal(score(s).items.find(i=>i.card==='tailor')!.points,13);
 s=fixture('market');[0,1,2,4].forEach(i=>s.players[0].board[i]=built('market'));assert.equal(score(s).items.find(i=>i.card==='market')!.points,11);
 s=fixture('theater');s.players[0].board[0]=built('theater');s.players[0].board[1]=built('cottage');s.players[0].board[4]=built('cottage');s.players[0].board[8]=built('well');assert.equal(score(s).items.find(i=>i.card==='theater')!.points,2);
 s=fixture('feast-hall',2);s.players[0].board[0]=built('feast-hall');assert.equal(score(s).items.find(i=>i.card==='feast-hall')!.points,3);s.players[1].board[0]=built('feast-hall');assert.equal(score(s).items.find(i=>i.card==='feast-hall')!.points,2);
});
test('factory only reacts to foreign call; cavern twice; bank selection distinct and self-call banned',()=>{
 let s=fixture('factory',2);s.players[0].board[0]={building:'factory',marker:'wood'};s.players.forEach(p=>p.placed=false);s.master='p1';s.resource='wood';assert.ok(E.getLegalActions(s,'p0').some(a=>a.type==='tiny-place'&&a.resource==='stone'));s.master='p0';assert.ok(!E.getLegalActions(s,'p0').some(a=>a.type==='tiny-place'&&a.resource==='stone'));
 s.options.cavern=true;s.master='p1';s=act(s,{type:'tiny-cavern'});assert.equal(s.players[0].cavern,1);assert.equal(s.players[0].board.filter(Boolean).length,1);
 s=fixture('bank',2);s.phase='call';s.players[0].board[0]={building:'bank',marker:'wood'};assert.ok(!E.getLegalActions(s,'p0').some(a=>a.type==='tiny-call'&&a.resource==='wood'));s.phase='place';s.players[0].board[1]=built('bank');s.players[0].effects=[{kind:'marker',at:1}];assert.throws(()=>act(s,{type:'tiny-marker',resource:'wood'}));s=act(s,{type:'tiny-marker',resource:'glass'});assert.equal((s.players[0].board[1] as any).marker,'glass');
});
test('warehouse capacity, exchange only with new cube, stored cubes cannot build and cost points',()=>{
 let s=fixture('warehouse',2);s.players[0].placed=false;s.master='p1';s.players[0].board[0]={building:'warehouse',stored:['stone','wheat','glass']};assert.ok(!E.getLegalActions(s,'p0').some(a=>a.type==='tiny-place'&&a.warehouse===0&&a.swap===undefined));
 s=act(s,{type:'tiny-place',resource:'wood',warehouse:0,swap:1,at:8});assert.deepEqual((s.players[0].board[0] as any).stored,['stone','wood','glass']);assert.deepEqual(s.players[0].board[8],{resource:'wheat'});assert.equal(score(s).items.find(i=>i.card==='warehouse')!.points,-3);assert.equal(getBuilds(s,s.players[0]).length,0);
});
test('monument immediate effects, neighbor Watch trigger only once, mandatory placement, Guild limit and castle type',()=>{
 let s=monument('university');s.players[0].board[0]=built('university');s.players[0].effects=[{kind:'free'}];s=act(s,{type:'tiny-free',card:'factory',at:10});assert.equal(s.players[0].effects[0].kind,'marker');assert.throws(()=>act(s,{type:'tiny-ready'}));s=act(s,{type:'tiny-marker',resource:'brick'});assert.equal(s.players[0].effects.length,0);
 s=monument('guild');s.players[0].board[0]=built('guild');s.players[0].board[1]=built('cottage');s.players[0].board[2]=built('farm');s.players[0].effects=[{kind:'guild',remaining:2,changed:[]}];s=act(s,{type:'tiny-replace',card:'tavern',at:1});assert.throws(()=>act(s,{type:'tiny-replace',card:'well',at:1}));s=act(s,{type:'tiny-replace',card:'chapel',at:2});assert.equal(s.players[0].effects.length,0);
 s=create(3);s.options.monuments=true;s.players.forEach((p,i)=>p.monument=['watch','archive','baths'][i]);s.players[0].board[0]=built('watch');s.players[0].watch=['cottage','farm','well'];s.phase='place';s.resource='wood';s.players.forEach(p=>p.placed=true);s.players[1].board[1]={resource:'wheat'};s.players[1].board[4]={resource:'brick'};s.players[1].board[5]={resource:'glass'};const b=getBuilds(s,s.players[1]).find(b=>b.card==='cottage')!;s=act(s,{type:'tiny-build',card:'cottage',cells:b.cells,at:1},'p1');assert.deepEqual(s.players[0].watch,['farm','well']);assert.equal(s.players[0].effects[0].kind,'free');s=act(s,{type:'tiny-free',card:'cottage',at:1});assert.ok(has(s.players[0],'cottage'));
});
test('monument scoring, final rank tied by round, score tie sequence and negative scores',()=>{
 let s=monument('cathedral');s.players[0].board[0]=built('cathedral');assert.equal(score(s).total,2);
 s=monument('mausoleum');s.players[0].board[0]=built('mausoleum');s.players[0].board[1]=built('cottage');assert.equal(score(s).items.find(i=>i.card==='cottage')!.points,3);
 s=monument('baths');s.players[0].board[0]=built('baths');assert.equal(score(s).items.find(i=>i.card==='baths')!.points,14);
 s=monument('forum');s.players[0].board[0]=built('forum');[4,5,6,10].forEach(i=>s.players[0].board[i]=built('cottage'));assert.equal(score(s).items.find(i=>i.card==='forum')!.points,5);
 s=create(3);s.players[0].monument='starloom';s.players[0].board[0]=built('starloom');s.players[0].doneRound=4;s.players[1].doneRound=4;assert.equal(score(s).items.find(i=>i.card==='starloom')!.points,6);s.players[1].doneRound=3;assert.equal(score(s).items.find(i=>i.card==='starloom')!.points,3);
 s=create(2);assert.deepEqual(winners(s),['p0','p1']);s.players[0].masterTurns=1;assert.deepEqual(winners(s),['p1']);assert.equal(score(s).total,-16);
});
test('Town Hall two common calls then private choices; hidden five-card discard; solo/full games with invariant each transition',()=>{
 let s=E.createInitialState(seats(2),rng(3),undefined,{...DEFAULT_OPTIONS,monuments:false,mode:'town-hall'});assert.equal(s.phase,'place');assert.equal(s.discard.length,6);assert.equal(s.deck.length,9);assert.ok(valid(s));
 for(let turn=0;turn<2;turn++)for(const id of ['p0','p1']){const r=s.resource!;s=act(s,{type:'tiny-place',resource:r,at:turn},id);s=act(s,{type:'tiny-ready'},id);}assert.equal(s.round,3);assert.equal(s.resource,undefined);assert.ok(E.getLegalActions(s,'p0').some(a=>a.type==='tiny-place'&&a.resource==='glass'));
 for(const n of [1,2,6])for(const mode of ['master','town-hall'] as const){
  let game=E.createInitialState(seats(n),rng(3),undefined,{...DEFAULT_OPTIONS,monuments:false,mode});let steps=0;
  while(game.phase!=='finished'){
   const actor=game.players.find(p=>E.getLegalActions(game,p.id).length)!;assert.ok(actor,'no deadlock');const legal=E.getLegalActions(game,actor.id),a=legal.find(a=>a.type==='tiny-finish')??legal.find(a=>a.type==='tiny-ready')??legal.find(a=>a.type==='tiny-build')??legal[0];game=E.applyAction(game,actor.id,a,rng(5));assert.ok(valid(game),a.type);assert.ok(++steps<1500);
  }assert.equal(game.players.filter(p=>p.doneRound!==undefined).length,n);assert.ok(game.winners.length);
 }
});
test('persistence rejects malformed cells, duplicate secrets, bad deck and illegal phases',()=>{
 const s=create();assert.ok(valid(s));for(const edit of [(x:TinyState)=>x.players[0].board.pop(),(x:TinyState)=>x.deck.push('wood'),(x:TinyState)=>x.cards.push('cottage'),(x:TinyState)=>(x.players[0].board[0]={resource:'pink'} as any),(x:TinyState)=>x.winners.push('unknown')]){const copy=structuredClone(s);edit(copy);assert.ok(!valid(copy));}
});
test('seeded 1–6-player full-game matrix: all randomized buildings/monuments, pending abilities and invariant-preserving final settlement',()=>{
 const seen=new Set<string>();let transitions=0;
 for(let seed=1;seed<=96;seed++){
  const random=rng(seed*517),n=1+seed%6;let s=E.createInitialState(seats(n),random,undefined,{randomBuildings:true,monuments:true,cavern:seed%3===0,mode:seed%2?'master':'town-hall'}),steps=0;
  s.cards.forEach(id=>seen.add(id));
  while(s.phase!=='finished'){
   const candidates=s.players.flatMap(p=>{const legal=E.getLegalActions(s,p.id);if(p.effects[0]?.kind==='watch')return [{id:p.id,actions:[{type:'tiny-watch',cards:s.cards.slice(0,3)} as TinyAction]}];return legal.length?[{id:p.id,actions:legal}]:[];});assert.ok(candidates.length,'deadlock '+seed+JSON.stringify(s));
   const {id,actions}=candidates[Math.floor(random()*candidates.length)],finish=actions.find(a=>a.type==='tiny-finish'),builds=actions.filter(a=>a.type==='tiny-build'),other=actions.filter(a=>a.type!=='tiny-build');
   const a=builds.length&&random()<.9?builds[Math.floor(random()*builds.length)]:finish??other[Math.floor(random()*other.length)]??builds[0];s=E.applyAction(s,id,a,random);assert.ok(valid(s),`seed ${seed} ${a.type}`);if(a.type==='tiny-monument')seen.add(a.card);assert.ok(++steps<4000);transitions++;
  }
  assert.ok(s.winners.length);assert.ok(s.players.every(p=>p.doneRound!==undefined));
 }
 assert.equal(seen.size,40, CARDS.filter(c=>!seen.has(c.id)).map(c=>c.id).join(','));assert.ok(transitions>4000);
});
test('designer five-Bank exception skips calling and settles the last blocked town, retaining empty penalties',()=>{
 let s=fixture('bank',2);s.options.randomBuildings=true;for(let i=0;i<5;i++)s.players[0].board[i]={building:'bank',marker:RESOURCES[i]};s.master='p1';s.players.forEach(p=>{p.placed=true;p.ready=false;});
 s=act(s,{type:'tiny-ready'});s=act(s,{type:'tiny-ready'},'p1');assert.equal(s.master,'p1');assert.equal(s.phase,'call');
 // Last ordinary town finishes; blocked town still gets its current construction window.
 s.phase='place';s.resource='wood';s.players.forEach(p=>{p.placed=true;p.ready=false;});s.players[1].board=Array.from({length:16},()=>({resource:'wood'}));s=act(s,{type:'tiny-finish'},'p1');s=act(s,{type:'tiny-ready'});assert.equal(s.phase,'finished');assert.equal(score(s).items.find(i=>i.card==='bank')!.points,20);assert.equal(score(s).empty,11);assert.ok(valid(s));assert.ok(s.players.every(p=>p.board.every(c=>!c||'building'in c)));
});
