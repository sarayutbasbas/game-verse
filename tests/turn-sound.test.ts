import { test } from "node:test";
import assert from "node:assert/strict";
import { endedTurn } from "../src/client/turn-sound.js";
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
