import { test } from "node:test";
import assert from "node:assert/strict";
import { duelDelivery } from "../src/client/dracula-motion.js";
import type { DuelView } from "../src/games/dracula-vs-van-helsing/types.js";
const view = (revision: number, eventRevision = revision): DuelView => ({
  gameId: "dracula-vs-van-helsing",
  code: "ABC234",
  revision,
  phase: "playing",
  players: [],
  event: { revision: eventRevision, round: 1, kind: "playing" },
});
test("Dracula delivery: initial/snapshot snap, duplicate and stale ignore, gaps/missing event resync, contiguous animate", () => {
  assert.equal(duelDelivery(undefined, view(8), false), "snap");
  assert.equal(duelDelivery(view(8), view(8), false), "ignore");
  assert.equal(duelDelivery(view(8), view(7), false), "ignore");
  assert.equal(duelDelivery(view(8), view(9), false), "animate");
  assert.equal(duelDelivery(view(8), view(10), false), "resync");
  assert.equal(duelDelivery(view(8), view(9, 8), false), "resync");
  assert.equal(duelDelivery(view(8), view(40), true), "snap");
  assert.equal(
    duelDelivery(view(8), { ...view(1), code: "DEF567" }, false),
    "snap",
  );
});
