import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyAction,
  createInitialState,
  crazyCamel,
  getDisplayView,
  getLegalActions,
  getPlayerView,
  move,
  ranking,
  type GameState,
} from "../src/games/camel-up/engine.js";
const ids = Array.from({ length: 8 }, (_, i) => ({
  id: String(i),
  name: `คน ${i}`,
}));
function state(n = 3) {
  const s = createInitialState(ids.slice(0, n), () => 0.1);
  s.stacks = {
    1: ["blue"],
    2: ["green"],
    3: ["yellow"],
    4: ["purple"],
    5: ["red"],
    14: ["black"],
    15: ["white"],
  };
  return s;
}
function rolls(...values: number[]) {
  return () => values.shift() ?? 0;
}
test("setup has all seven camels, correct tickets, cards and money", () => {
  const s = createInitialState(ids.slice(0, 3), () => 0.5);
  assert.equal(Object.values(s.stacks).flat().length, 7);
  assert.deepEqual(s.available.blue, [5, 3, 2, 2]);
  assert.equal(s.players[0].money, 3);
  assert.equal(s.players[0].cards.length, 5);
  assert.throws(() => createInitialState(ids.slice(0, 2), () => 0));
});
test("middle moves with everything above, landing on top; bottom and top units", () => {
  const s = state();
  s.stacks = {
    2: ["blue", "green", "yellow"],
    4: ["red", "purple"],
    14: ["black"],
    15: ["white"],
  };
  move(s, "green", 2);
  assert.deepEqual(s.stacks[2], ["blue"]);
  assert.deepEqual(s.stacks[4], ["red", "purple", "green", "yellow"]);
  move(s, "yellow", 1);
  assert.deepEqual(s.stacks[5], ["yellow"]);
  move(s, "red", 1);
  assert.deepEqual(s.stacks[5], ["yellow", "red", "purple", "green"]);
});
test("boo tile pays owner, reverses unit under destination", () => {
  const s = state();
  s.tiles[6] = { owner: "1", direction: -1 };
  move(s, "purple", 2);
  assert.deepEqual(s.stacks[5], ["purple", "red"]);
  assert.equal(s.players[1].money, 4);
  assert.deepEqual(s.tiles[6], { owner: "1", direction: -1 });
});
test("cheer tile moves on top and crazy tile has opposite direction", () => {
  const s = state();
  s.tiles[6] = { owner: "1", direction: 1 };
  move(s, "red", 1);
  assert.deepEqual(s.stacks[7], ["red"]);
  s.tiles[13] = { owner: "1", direction: 1 };
  move(s, "black", 1);
  assert.deepEqual(s.stacks[12], ["black"]);
  assert.equal(s.players[1].money, 5);
});
test("crazy selector prioritizes racing carrier, adjacent top, otherwise rolled", () => {
  const s = state();
  s.stacks = {
    1: ["blue", "green", "yellow", "purple"],
    12: ["black", "red"],
    14: ["white"],
  };
  assert.equal(crazyCamel(s, "white"), "black");
  s.stacks = {
    1: ["blue", "green", "yellow", "purple", "red"],
    12: ["white", "black"],
  };
  assert.equal(crazyCamel(s, "white"), "black");
  s.stacks = {
    1: ["blue", "green", "yellow"],
    12: ["black", "purple", "white", "red"],
  };
  assert.equal(crazyCamel(s, "white"), "white");
  assert.equal(crazyCamel(s, "black"), "black");
});
test("invalid actions preserve exact state; no extra actor/random fields trusted", () => {
  const s = state(),
    before = structuredClone(s);
  assert.throws(() => applyAction(s, "1", { type: "roll" }, () => 0));
  assert.throws(() =>
    applyAction(s, "0", { type: "roll", value: 3 } as any, () => 0),
  );
  assert.throws(() =>
    applyAction(s, "0", { type: "tile", position: 1, direction: 1 }, () => 0),
  );
  assert.deepEqual(s, before);
});
test("tile cannot touch other tile or stay on its old space, can move beside old tile", () => {
  const s = state();
  s.tiles = {
    8: { owner: "0", direction: 1 },
    12: { owner: "1", direction: 1 },
  };
  const actions = getLegalActions(s, "0");
  assert(
    !actions.some(
      (a) => a.type === "tile" && [8, 11, 12, 13].includes(a.position),
    ),
  );
  assert(actions.some((a) => a.type === "tile" && a.position === 9));
});
test("final card consumed across both piles and remains private", () => {
  const s = applyAction(
    state(),
    "0",
    { type: "final", color: "blue", side: "winner" },
    () => 0,
  );
  assert(!s.players[0].cards.includes("blue"));
  const display = JSON.stringify(getDisplayView(s, "ABC234", 1));
  assert(!display.includes("bets"));
  assert(!display.includes("cards"));
  assert(!display.includes("playerId"));
  assert.deepEqual(getPlayerView(s, "1").bets, []);
  assert.equal(getPlayerView(s, "0").bets.length, 1);
});
test("five of six dice ends leg, payouts net before floor and reset; next player starts", () => {
  let s = state();
  s.stacks = {
    1: ["blue"],
    4: ["green"],
    7: ["yellow"],
    10: ["purple"],
    13: ["red"],
    14: ["black"],
    15: ["white"],
  };
  s.players[0].money = 0;
  s.players[0].tickets = [
    { color: "red", value: 5 },
    { color: "yellow", value: 3 },
  ];
  s.players[1].tickets = [{ color: "purple", value: 5 }];
  s.players[2].tickets = [{ color: "blue", value: 5 }];
  for (let i = 0; i < 5; i++)
    s = applyAction(s, s.players[s.turn].id, { type: "roll" }, () => 0);
  assert.equal(s.leg, 2);
  assert.equal(s.turn, 2);
  assert.equal(s.players[0].money, 6);
  assert.equal(s.players[1].money, 6);
  assert.equal(s.players[2].money, 3);
  assert.equal(s.dice.length, 6);
  assert(s.players.every((p) => p.tickets.length === 0 && p.pyramids === 0));
});
test("grey selected once and then excluded from pool", () => {
  let s = state();
  s = applyAction(s, "0", { type: "roll" }, rolls(0.99, 0.99));
  assert.equal(s.lastRoll?.die, "grey");
  assert.equal(s.lastRoll?.camel, "black");
  assert.equal(s.lastRoll?.value, 3);
  assert(!s.dice.includes("grey"));
});
test("partnership selects ticket independently, blocks repeat claim and pays once", () => {
  let s = state(6);
  s = applyAction(s, "0", { type: "partner", playerId: "1" }, () => 0);
  assert.equal(s.players[1].partner, "0");
  assert.throws(() =>
    applyAction(s, "1", { type: "partner", playerId: "2" }, () => 0),
  );
  s.players[0].tickets = [{ color: "red", value: 5 }];
  s.players[1].tickets = [{ color: "blue", value: 3 }];
  s.dice = ["blue", "green"];
  s.turn = 2;
  s = applyAction(s, "2", { type: "roll" }, () => 0);
  assert.equal(s.phase, "settling");
  s = applyAction(s, "0", { type: "claim", ticket: -1 }, () => 0);
  assert.throws(() =>
    applyAction(s, "0", { type: "claim", ticket: -1 }, () => 0),
  );
  assert.throws(() =>
    applyAction(s, "1", { type: "claim", ticket: 20 }, () => 0),
  );
  s = applyAction(s, "1", { type: "claim", ticket: 0 }, () => 0);
  assert.equal(s.phase, "playing");
  assert.equal(s.players[0].money, 8);
  assert.equal(s.players[1].money, 7);
  assert.equal(s.settlements.length, 1);
  assert(s.players.every((p) => !p.partner));
});
test("finish immediately settles last leg + ordered final payouts and shared wins", () => {
  let s = state();
  s.stacks = {
    16: ["red", "blue"],
    10: ["green"],
    9: ["yellow"],
    8: ["purple"],
    14: ["black"],
    15: ["white"],
  };
  s.final.winner = [
    { playerId: "0", color: "green" },
    { playerId: "1", color: "blue" },
    { playerId: "2", color: "blue" },
  ];
  s.final.loser = [{ playerId: "0", color: "purple" }];
  s.players[0].money = 0;
  s.players[0].tickets = [{ color: "blue", value: 3 }];
  s.players[1].money = 0;
  s.players[2].money = 3;
  s.dice = ["red", "grey"];
  s = applyAction(s, "0", { type: "roll" }, () => 0);
  assert.equal(s.phase, "finished");
  assert.deepEqual(s.settlements[0].ranking, [
    "blue",
    "red",
    "green",
    "yellow",
    "purple",
  ]);
  assert.deepEqual(
    s.finalResults?.map((b) => b.amount),
    [-1, 8, 5, 8],
  );
  assert.deepEqual(s.winners, ["0"]);
  assert.equal(s.players[0].money, 11);
});
test("backward finish with racing passengers makes them last, stack top ahead", () => {
  let s = state();
  s.stacks = {
    1: ["black", "blue", "green"],
    5: ["yellow"],
    6: ["purple"],
    7: ["red"],
    14: ["white"],
  };
  s.dice = ["grey", "yellow"];
  s = applyAction(s, "0", { type: "roll" }, () => 0);
  assert.equal(s.phase, "finished");
  assert.deepEqual(ranking(s), ["red", "purple", "yellow", "green", "blue"]);
});
test("floor 0 per final card; tied players share victory", () => {
  let s = state();
  s.players.forEach((p) => (p.money = 0));
  s.final.winner = [
    { playerId: "1", color: "green" },
    { playerId: "1", color: "blue" },
  ];
  s.players[2].money = 8;
  s.stacks = {
    16: ["blue"],
    5: ["green"],
    6: ["yellow"],
    7: ["purple"],
    8: ["red"],
    14: ["black"],
    15: ["white"],
  };
  s.dice = ["blue", "grey"];
  s = applyAction(s, "0", { type: "roll" }, () => 0);
  assert.deepEqual(s.winners, ["1", "2"]);
  assert.deepEqual(
    s.finalResults?.map((x) => x.amount),
    [0, 8],
  );
});
test("repeated games complete with invariant conservation and deterministic input", () => {
  for (let seed = 1; seed <= 30; seed++) {
    let x = seed;
    const random = () => {
      x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
      return x / 2 ** 32;
    };
    let s = createInitialState(ids.slice(0, 3), random);
    let count = 0;
    while (s.phase !== "finished" && count++ < 1000) {
      s = applyAction(s, s.players[s.turn].id, { type: "roll" }, random);
      assert.equal(new Set(Object.values(s.stacks).flat()).size, 7);
      assert(s.players.every((p) => p.money >= 0));
    }
    assert.equal(s.phase, "finished");
  }
});
