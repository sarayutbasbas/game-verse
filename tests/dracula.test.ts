import { test } from "node:test";
import assert from "node:assert/strict";
import * as e from "../src/games/dracula-vs-van-helsing/engine.js";
import {
  SUITS,
  type DuelState,
  type Card,
  type DuelAction,
} from "../src/games/dracula-vs-van-helsing/types.js";
const players = [
  { id: "d", name: "D", character: "dracula" as const },
  { id: "h", name: "H", character: "helsing" as const },
];
const initial = () => e.createInitialState(players, () => 0.42);
const card = (
  value: number,
  suit: Card["suit"] = "red",
  revealed = false,
): Card => ({ value, suit, revealed });
function action(s: DuelState, a: DuelAction, id = s.turn) {
  return e.applyAction(s, id, a, () => 0.42);
}
function discarded(value: number, s = initial()) {
  s.drawn = card(value);
  s.step = "discard";
  return action(s, { type: "discard", slot: -1 });
}
test("Dracula setup: 32 distinct cards, ordered slots, 12 HP, five human districts, valid roles", () => {
  const s = initial();
  assert.equal(s.deck.length, 22);
  assert.equal(s.players[0].cards.length, 5);
  assert.equal(s.hp, 12);
  assert.deepEqual(s.vampires, [0, 0, 0, 0, 0]);
  assert.equal(s.turn, "d");
  const all = [...s.deck, ...s.players.flatMap((p) => p.cards)];
  assert.equal(new Set(all.map((c) => c.suit + c.value)).size, 32);
  assert.equal(new Set(s.ranking).size, 4);
  assert.throws(() =>
    e.createInitialState([players[0], players[0]], () => 0.4),
  );
});
test("comparison: trump beats higher numeral, two trumps, nontrump and equal value suit rank; identical impossible", () => {
  const rank = [...SUITS];
  assert.equal(
    e.compareCards(card(1), card(8, "yellow"), rank).winner,
    "dracula",
  );
  assert.equal(e.compareCards(card(1), card(8), rank).winner, "helsing");
  assert.equal(
    e.compareCards(card(8, "green"), card(7, "yellow"), rank).winner,
    "dracula",
  );
  assert.equal(
    e.compareCards(card(4, "green"), card(4, "yellow"), rank).winner,
    "helsing",
  );
  assert.throws(() => e.compareCards(card(4), card(4), rank));
});
test("invalid turn, forged intent, invalid targets and restricted 8 never mutate", () => {
  const s = initial(),
    before = structuredClone(s);
  assert.throws(() => action(s, { type: "draw" }, "h"));
  assert.throws(() => action(s, { type: "end-round" }));
  assert.throws(() => action(s, { type: "draw", playerId: "h" } as any));
  assert.deepEqual(s, before);
  s.step = "discard";
  s.drawn = card(8);
  assert.throws(() => action(s, { type: "discard", slot: -1 }));
  const a = discarded(4);
  const old = structuredClone(a);
  assert.throws(() => action(a, { type: "effect", targets: [0, 0] }));
  assert.throws(() => action(a, { type: "effect", targets: [0, 5] }));
  assert.deepEqual(a, old);
});
test("all effects: reveal own/opponent/top; revealed identity follows draw and swaps, extra turn and trump swap", () => {
  let s = discarded(1);
  s = action(s, { type: "effect", targets: [0] });
  assert(s.players[0].cards[0].revealed);
  assert.equal(s.turn, "h");
  s = discarded(3);
  s = action(s, { type: "effect", targets: [2] });
  assert(s.players[1].cards[2].revealed);
  s = discarded(2);
  assert(s.deck[0].revealed);
  const top = structuredClone(s.deck[0]);
  s = action(s, { type: "draw" });
  assert.deepEqual(s.drawn, top);
  s = action(s, { type: "discard", slot: 0 });
  assert(s.players[1].cards[0].revealed);
  s = discarded(4);
  s.players[0].cards[0].revealed = true;
  const c = s.players[0].cards[0];
  s = action(s, { type: "effect", targets: [0, 2] });
  assert.deepEqual(s.players[0].cards[2], c);
  s = discarded(6);
  s.players[0].cards[0].revealed = true;
  const d = structuredClone(s.players[0].cards[0]);
  s = action(s, { type: "effect", targets: [0] });
  assert.deepEqual(s.players[1].cards[0], d);
  s = discarded(7);
  const ranking = [...s.ranking];
  s = action(s, { type: "effect", targets: [2] });
  assert.equal(s.ranking[0], ranking[2]);
  assert.equal(s.ranking[2], ranking[0]);
  s = discarded(5);
  assert.equal(s.turn, "d");
  assert.equal(s.step, "draw");
});
test("called final turn supports chained 5; 8 immediately ends; six prior discards required", () => {
  let s = initial();
  s.discard = Array.from({ length: 6 }, () => card(2));
  s = action(s, { type: "end-round" });
  assert.equal(s.turn, "h");
  s.drawn = card(5);
  s.step = "discard";
  s = action(s, { type: "discard", slot: -1 });
  assert.equal(s.phase, "playing");
  assert.equal(s.turn, "h");
  s.drawn = card(2);
  s.step = "discard";
  s = action(s, { type: "discard", slot: -1 });
  assert.equal(s.phase, "results");
  assert.equal(s.result?.cards.dracula.length, 5);
  assert.equal(s.result?.cards.helsing.length, 5);
  s = initial();
  s.discard = Array.from({ length: 6 }, () => card(2));
  s = discarded(8, s);
  assert.equal(s.phase, "results");
  assert.equal(s.result?.districts.length, 5);
  s = initial();
  s.discard = Array.from({ length: 5 }, () => card(2));
  s.drawn = card(8);
  s.step = "discard";
  assert.throws(() => action(s, { type: "discard", slot: -1 }));
});
function resolveFixture(s: DuelState) {
  s.deck = [];
  s.drawn = card(2, "purple");
  s.step = "discard";
  return action(s, { type: "discard", slot: -1 });
}
test("district order stops instantly for either victory; round 5 survival, no resolution twice", () => {
  let s = initial();
  s.ranking = [...SUITS];
  s.players[0].cards = [1, 2, 3, 4, 5].map((v) => card(v, "red"));
  s.players[1].cards = [1, 2, 3, 4, 5].map((v) => card(v, "green"));
  s.vampires[0] = 3;
  s = resolveFixture(s);
  assert.equal(s.winner, "dracula");
  assert.equal(s.result?.districts.length, 1);
  assert.deepEqual(s.vampires, [4, 0, 0, 0, 0]);
  const old = structuredClone(s);
  assert.throws(() => action(s, { type: "next-round" }));
  assert.deepEqual(s, old);
  s = initial();
  s.ranking = [...SUITS];
  s.hp = 1;
  s.players[0].cards = [1, 2, 3, 4, 5].map((v) => card(v, "green"));
  s.players[1].cards = [1, 2, 3, 4, 5].map((v) => card(v, "red"));
  s = resolveFixture(s);
  assert.equal(s.winner, "helsing");
  assert.equal(s.result?.districts.length, 1);
  s = initial();
  s.round = 5;
  s = resolveFixture(s);
  assert.equal(s.phase, "finished");
  assert.equal(s.winner, "dracula");
});
test("round acknowledgement does not redeal until both; reshuffle all cards; retain rank/HP/vampires", () => {
  let s = resolveFixture(initial());
  const hp = s.hp,
    vampires = [...s.vampires],
    rank = [...s.ranking],
    cards = structuredClone(s.players[0].cards);
  s = action(s, { type: "next-round" }, "d");
  assert.equal(s.round, 1);
  assert.deepEqual(s.players[0].cards, cards);
  assert.throws(() => action(s, { type: "next-round" }, "d"));
  s = action(s, { type: "next-round" }, "h");
  assert.equal(s.phase, "playing");
  assert.equal(s.round, 2);
  assert.equal(s.deck.length, 22);
  assert.equal(s.hp, hp);
  assert.deepEqual(s.vampires, vampires);
  assert.deepEqual(s.ranking, rank);
  assert(s.players.every((p) => p.cards.every((c) => !c.revealed)));
});
test("public projection filters hidden cards including draw, owner sees own only; snapshot isolation", () => {
  let s = initial();
  s = action(s, { type: "draw" });
  const v = e.getDisplayView(s, "ABC234", 5);
  assert(v.racks!.dracula.every((c) => c === null));
  assert(v.racks!.helsing.every((c) => c === null));
  assert.equal(v.drawn, undefined);
  assert.equal(v.deckTop, undefined);
  assert.equal(e.getPlayerView(s, "h").drawn, undefined);
  assert.equal(e.getPlayerView(s, "d").drawn?.value, s.drawn?.value);
  assert(!("deck" in v));
  assert(!("cards" in v.players[0]));
  s.players[0].cards[0].revealed = true;
  assert(e.getDisplayView(s, "ABC234", 6).racks!.dracula[0]);
  const result = resolveFixture(initial()),
    pub = e.getDisplayView(result, "ABC234", 10);
  assert(pub.result?.cards.dracula.every((c) => c.revealed));
  assert(pub.racks!.dracula.every((c) => c?.revealed));
  assert(e.getPlayerView(result, "d").cards.every((c) => c.revealed));
  pub.result!.cards.dracula[0].value = 99;
  assert.notEqual(result.result!.cards.dracula[0].value, 99);
});
test("seeded legal play completes full games with conservation, rack identities and no negative resources", () => {
  for (let seed = 1; seed <= 30; seed++) {
    let n = seed;
    const random = () => {
      n = (n * 1664525 + 1013904223) >>> 0;
      return n / 2 ** 32;
    };
    let s = e.createInitialState(players, random),
      steps = 0;
    while (!e.isFinished(s) && steps++ < 500) {
      const id =
        s.phase === "results"
          ? s.players.find((p) => !s.acknowledged.includes(p.id))!.id
          : s.turn;
      const legal = e.getLegalActions(s, id);
      assert(legal.length);
      const a = legal[Math.floor(random() * legal.length)];
      s = e.applyAction(s, id, a, random);
      assert(s.hp >= 0);
      assert(s.vampires.every((v) => v <= 4));
      const all = [
        ...s.deck,
        ...s.discard,
        ...s.players.flatMap((p) => p.cards),
        ...(s.drawn ? [s.drawn] : []),
      ];
      assert.equal(all.length, 32);
      assert.equal(new Set(all.map((c) => c.suit + c.value)).size, 32);
    }
    assert.equal(s.phase, "finished");
    assert(s.winner);
    assert(s.round <= 5);
  }
});

test("effect 2 stays public through draw, rack placement and swaps; ordinary draws remain secret", () => {
  let s = discarded(2);
  const top = structuredClone(s.deck[0]);
  assert.deepEqual(e.getDisplayView(s, "ABC234", 1).deckTop, top);
  s = action(s, { type: "draw" });
  assert.deepEqual(e.getDisplayView(s, "ABC234", 2).drawn, top);
  assert.equal(e.getPlayerView(s, "d").drawn, undefined);
  assert.deepEqual(e.getPlayerView(s, "h").drawn, top);
  s = action(s, { type: "discard", slot: 3 });
  assert.deepEqual(e.getDisplayView(s, "ABC234", 3).racks!.helsing[3], top);
  assert.match(s.lastAction!, /วางไพ่เปิดเผย.*ที่เขต 4/);
  assert.equal(e.getDisplayView(s, "ABC234", 3).drawn, undefined);
  s.turn = "h";
  s.effect = 4;
  s.step = "effect";
  s = action(s, { type: "effect", targets: [1, 3] });
  assert.deepEqual(e.getDisplayView(s, "ABC234", 4).racks!.helsing[1], top);
  assert.equal(e.getDisplayView(s, "ABC234", 4).racks!.helsing[3], null);

  const hidden = action(initial(), { type: "draw" });
  assert.equal(e.getDisplayView(hidden, "ABC234", 5).drawn, undefined);
  assert.equal(e.getPlayerView(hidden, "h").drawn, undefined);
  const placed = action(hidden, { type: "discard", slot: 3 });
  assert(!placed.lastAction!.includes("วางไพ่เปิดเผย"));
  assert.equal(e.getDisplayView(placed, "ABC234", 6).racks!.dracula[3], null);
});
