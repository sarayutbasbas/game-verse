import { test } from "node:test";
import assert from "node:assert/strict";
import { turnStatus } from "../src/client/turn-status.js";
import type { RoomView } from "../src/shared/types.js";
const v = (gameId: string, phase: string, turn?: string, extra: object = {}) =>
  ({
    gameId,
    phase,
    turn,
    players: [
      { id: "a", name: "ชื่อยาวของผู้เล่นคนแรก" },
      { id: "b", name: "เพื่อน" },
    ],
    me: { id: "a" },
    ...extra,
  }) as RoomView;
test("shared header: all six games identify the authorized actor and public display uses names", () => {
  for (const game of [
    "camel-up",
    "dracula-vs-van-helsing",
    "azul",
    "calico",
    "seven-wonders-duel",
    "jaipur",
  ]) {
    assert.deepEqual(turnStatus(v(game, "playing", "a")), {
      text: "ตาคุณ",
      own: true,
    });
    assert.deepEqual(turnStatus(v(game, "playing", "b")), {
      text: "ตา เพื่อน",
      own: false,
    });
    assert.deepEqual(turnStatus(v(game, "playing", "a", { me: undefined })), {
      text: "ตา ชื่อยาวของผู้เล่นคนแรก",
      own: false,
    });
  }
});
test("shared header: simultaneous setup/settlement, directed draft/decision and non-turn phases", () => {
  assert.equal(turnStatus(v("calico", "setup", "a")).text, "เลือกพร้อมกัน");
  assert.equal(
    turnStatus(v("camel-up", "settling", "a")).text,
    "เลือกพร้อมกัน",
  );
  assert.equal(
    turnStatus(v("seven-wonders-duel", "setup", "b")).text,
    "ตา เพื่อน",
  );
  assert.equal(
    turnStatus(
      v("seven-wonders-duel", "playing", "a", { pending: { actor: "b" } }),
    ).text,
    "ตา เพื่อน",
  );
  assert.equal(turnStatus(v("jaipur", "results", "a")).text, "สรุปผลรอบ");
  assert.equal(turnStatus(v("jaipur", "finished", "a")).text, "จบเกม");
  assert.equal(turnStatus(v("jaipur", "lobby", "a")).text, "รอผู้เล่น");
  assert.equal(turnStatus(v("jaipur", "playing")).text, "รอผู้เล่น");
});
