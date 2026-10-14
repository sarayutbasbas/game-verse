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
