import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createInitialState,
  move,
  applyAction,
} from "../src/games/camel-up/engine.js";
// Motion metadata is produced at the exact authoritative transition, never inferred on clients.
test("server trace records unit, steps, boo landing order and reward without changing rule outcomes", () => {
  const s = createInitialState(
    [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
      { id: "c", name: "C" },
    ],
    () => 0,
  );
  s.stacks = {
    2: ["blue", "green", "yellow"],
    5: ["red", "purple"],
    14: ["black"],
    15: ["white"],
  };
  s.tiles = { 6: { owner: "b", direction: -1 } };
  move(s, "green", 4);
  assert.deepEqual(s.lastMovement, {
    camel: "green",
    unit: ["green", "yellow"],
    from: 2,
    fromIndex: 1,
    path: [3, 4, 5, 6, 5],
    to: 5,
    under: true,
    destinationStack: ["green", "yellow", "red", "purple"],
    tile: { position: 6, owner: "b", direction: -1 },
  });
  assert.equal(s.players[1].money, 4);
  assert.deepEqual(s.stacks[2], ["blue"]);
});
test("crazy move trace follows decreasing steps and forward tile in crazy orientation", () => {
  const s = createInitialState(
    [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
      { id: "c", name: "C" },
    ],
    () => 0,
  );
  s.stacks = {
    14: ["black", "red"],
    13: ["white"],
    1: ["blue", "green", "yellow", "purple"],
  };
  s.tiles = { 11: { owner: "b", direction: 1 } };
  s.dice = ["grey", "blue"];
  const next = applyAction(s, "a", { type: "roll" }, () => 0.4);
  assert.equal(next.lastMovement?.camel, "black");
  assert.deepEqual(next.lastMovement?.path, [13, 12, 11, 10]);
  assert.deepEqual(next.lastMovement?.unit, ["black", "red"]);
});
import { delivery, TRACK, pointFor } from "../src/client/board.js";
import type { View } from "../src/shared/types.js";
test("motion delivery skips repeats, snaps reconnects and detects event/revision gaps", () => {
  const view: View = {
    gameId: "camel-up",
    code: "ABC234",
    phase: "playing",
    revision: 5,
    players: [],
    event: {
      revision: 5,
      actorId: "a",
      kind: "partner",
      money: [],
      legEnded: false,
      finished: false,
    },
  };
  assert.equal(delivery(undefined, view, false), "snap");
  assert.equal(delivery(4, view, false), "animate");
  assert.equal(delivery(5, view, false), "duplicate");
  assert.equal(delivery(8, view, false), "duplicate");
  assert.equal(delivery(3, view, false), "gap");
  assert.equal(delivery(4, { ...view, event: undefined }, false), "gap");
  assert.equal(delivery(4, view, true), "snap");
  assert.equal(
    delivery(4, { ...view, event: { ...view.event!, kind: "roll" } }, false),
    "gap",
  );
  assert.equal(Object.keys(TRACK).length, 16);
  assert.deepEqual(pointFor(7), TRACK[7]);
  assert.notDeepEqual(pointFor(17), TRACK[1]);
});
