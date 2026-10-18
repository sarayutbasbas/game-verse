import { test } from "node:test";
import assert from "node:assert/strict";
import { endedTurn, gameEffects } from "../src/client/turn-sound.js";
test("sound boundaries for all games: no duplicate, snapshot, gap, substep or setup replay", () => {
  for (const gameId of ["camel-up", "dracula-vs-van-helsing", "azul"]) {
    const before: any = {
        gameId,
        code: "ABC123",
        revision: 10,
        phase: "playing",
        turn: "a",
      },
      after: any = { ...before, revision: 11, turn: "b" };
    assert(endedTurn(before, after, false));
    assert(!endedTurn(before, after, true));
    assert(!endedTurn(undefined, after, false));
    assert(!endedTurn(after, after, false));
    assert(!endedTurn(before, { ...after, revision: 12 }, false));
    assert(!endedTurn(before, { ...after, turn: "a" }, false));
    assert(endedTurn(before, { ...after, phase: "finished" }, false));
    assert(!endedTurn({ ...before, phase: "lobby" }, after, false));
    assert(!endedTurn({ ...before, phase: "results" }, after, false));
  }
});
test('Duel extra turn chimes only after accepted action or final decision; pending effect does not chime early',()=>{const a:any={gameId:'seven-wonders-duel',code:'ABC234',revision:1,phase:'playing',turn:'a'};assert(endedTurn(a,{...a,revision:2,event:{kind:'wonder'}},false));assert(!endedTurn(a,{...a,revision:2,pending:{kind:'library'},event:{kind:'wonder'}},false));assert(endedTurn({...a,pending:{kind:'library'}},{...a,revision:2,event:{kind:'wonders-decide'}},false));});
test('Calico Solo emits one end-turn cue after draft even when actor stays the same',()=>{
 const before:any={gameId:'calico',code:'ABC234',revision:4,phase:'playing',turn:'solo',step:'place'};const placed:any={...before,revision:5,step:'draft',event:{kind:'calico-place'}};const drafted:any={...placed,revision:6,step:'place',event:{kind:'calico-draft'}};assert(!endedTurn(before,placed,false));assert(endedTurn(placed,drafted,false));assert(!endedTurn(placed,drafted,true));assert(!endedTurn(drafted,drafted,false));assert(!endedTurn(placed,{...drafted,revision:7},false));
});

test('Dracula audio cues deduplicate draws, replacements, reveals and deal snapshots',()=>{
 const a:any={gameId:'dracula-vs-van-helsing',code:'ABC234',revision:1,phase:'playing',turn:'a',step:'draw',deckCount:20};
 const b:any={...a,revision:2,step:'discard',deckCount:19};
 assert.deepEqual(gameEffects(a,b,false),['draw']);
 assert.deepEqual(gameEffects(a,b,true),[]);assert.deepEqual(gameEffects(b,b,false),[]);assert.deepEqual(gameEffects(a,{...b,revision:3},false),[]);
 assert.deepEqual(gameEffects(b,{...b,revision:3,event:{kind:'replace',serial:1}},false),['swap']);
 assert.deepEqual(gameEffects({...b,event:{kind:'replace',serial:1}},{...b,revision:3,event:{kind:'replace',serial:1}},false),[]);
 const r:any={...b,phase:'results',result:{},revealedCount:2};
 assert.deepEqual(gameEffects(r,{...r,revision:3,revealedCount:3},false),['reveal']);
 assert.deepEqual(gameEffects({...a,phase:'lobby'},{...a,revision:2},false),['deal']);
});
test('Pixies effect cues follow accepted sequence only, skip snapshots and retries',()=>{
 const base:any={gameId:'pixies',code:'ABCDEF',revision:4,phase:'playing',turn:'a',sequence:3,event:{kind:'pick',revision:4},players:[]};
 for(const kind of ['place','validate','round','finish']){const next:any={...base,revision:5,sequence:4,event:{kind,revision:5}};assert.ok(gameEffects(base,next,false).includes(kind as any));assert.deepEqual(gameEffects(next,next,false),[]);assert.deepEqual(gameEffects(base,next,true),[]);assert.deepEqual(gameEffects(base,{...next,sequence:3},false),[]);}
});

test('Pixies every new market batch rustles once; final placements and results have separate cues',()=>{
 const base:any={gameId:'pixies',code:'ABCDEF',revision:20,phase:'playing',turn:'a',sequence:15,deckCount:50,pending:{card:{}},event:{kind:'pick'}};
 const dealt:any={...base,revision:21,sequence:16,deckCount:46,pending:undefined,event:{kind:'place'}};
 assert.deepEqual(gameEffects(base,dealt,false),['deal','place']);assert.deepEqual(gameEffects(dealt,dealt,false),[]);assert.deepEqual(gameEffects(base,dealt,true),[]);
 for(const [phase,kind] of [['results','round'],['finished','finish']])assert.deepEqual(gameEffects(base,{...dealt,phase,deckCount:50,event:{kind}},false),['turn','place',kind]);
 assert.deepEqual(gameEffects(base,{...dealt,deckCount:50,event:{kind:'pick'}},false),[]);
});

test('Harmonies wood, card, cube and score cues follow committed sequence without replay',()=>{
 const before:any={gameId:'harmonies',code:'ABCDEF',revision:4,phase:'playing',turn:'a',sequence:3,event:{kind:'group'}};
 for(const [kind,cue] of [['group','wood'],['place','place'],['card','draw'],['cube','cube'],['finish','finish']]){const next:any={...before,revision:5,sequence:4,event:{kind}};assert.deepEqual(gameEffects(before,next,false),[cue]);assert.deepEqual(gameEffects(before,next,true),[]);assert.deepEqual(gameEffects(next,next,false),[]);}
});

test('Harmonies market refill deals only at accepted end turn and never on recovery',()=>{
 const before:any={gameId:'harmonies',code:'ABCDEF',revision:10,phase:'playing',turn:'a',sequence:9,deckCount:20,event:{kind:'place'}};
 const after:any={...before,revision:11,turn:'b',sequence:10,deckCount:19,event:{kind:'turn'}};
 assert.deepEqual(gameEffects(before,after,false),['turn','deal']);
 assert.deepEqual(gameEffects(before,after,true),[]);assert.deepEqual(gameEffects(after,after,false),[]);
 assert.deepEqual(gameEffects(before,{...after,deckCount:20},false),['turn']);
});

test('Locus paper, coins, combo and final cues only on newly accepted events, no snapshot/presence replay',async()=>{
 const {createInitialState,getDisplayView}=await import('../src/games/locus/engine.js');const s=createInitialState([{id:'a',name:'A'},{id:'b',name:'B'}],()=>.5),before=getDisplayView(s,'ABC234',10),after=structuredClone(before);after.revision++;after.sequence++;after.event={kind:'mark',actor:'a',cells:[{zone:'yellow',x:0,y:5}],gained:1,effects:['bonus']};assert.deepEqual(gameEffects(before,after,false),['pencil','combo','coin']);assert.deepEqual(gameEffects(before,after,true),[]);assert.deepEqual(gameEffects(after,after,false),[]);after.event={kind:'finish'};assert.ok(gameEffects(before,after,false).includes('finish'));
});
