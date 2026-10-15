import test from "node:test";
import assert from "node:assert/strict";
import {
  CARDS,
  CARD,
  WONDERS,
  TOKENS,
  LAYOUTS,
} from "../src/games/seven-wonders-duel/data.js";
import * as e from "../src/games/seven-wonders-duel/engine.js";
import { validateWondersState } from "../src/games/seven-wonders-duel/validation.js";
import type {
  WondersState,
  WondersAction,
} from "../src/games/seven-wonders-duel/types.js";
const seats = [
  { id: "a", name: "เอ" },
  { id: "b", name: "บี" },
];
const rng =
  (seed = 1) =>
  () =>
    (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
const start = (random = rng()) => e.createInitialState(seats, random, "a");
function drafted(seed = 1) {
  let s = start(rng(seed));
  for (let i = 0; i < 8; i++)
    s = e.applyAction(
      s,
      s.players[s.turn].id,
      e.getLegalActions(s, s.players[s.turn].id)[0],
      rng(),
    );
  return s;
}
function play(s: WondersState, a: WondersAction) {
  return e.applyAction(s, s.players[s.turn].id, a, rng());
}
test("Duel catalog: exact 73 distinct buildings, 12 Wonders, 10 tokens, each Age 20 with 3 unseen guilds", () => {
  assert.equal(CARDS.length, 73);
  assert.equal(new Set(CARDS.map((c) => c.id)).size, 73);
  assert.deepEqual(
    [1, 2, 3].map(
      (a) => CARDS.filter((c) => c.age === a && c.color !== "purple").length,
    ),
    [23, 23, 20],
  );
  assert.equal(WONDERS.length, 12);
  assert.equal(TOKENS.length, 10);
  const s = start();
  assert.ok(validateWondersState(s));
  assert.deepEqual(
    Object.values(s.decks).map((x) => x.length),
    [20, 20, 20],
  );
  assert.equal(
    s.decks[3].filter((id) => CARD[id].color === "purple").length,
    3,
  );
  assert.equal(s.removed.length, 13);
  assert.equal(s.progress.length, 5);
});
test("Duel draft sequence 1/2/1 then reverse, exact four each, preserves hidden box", () => {
  let s = start();
  const order = [];
  while (s.phase === "setup") {
    order.push(s.players[s.turn].id);
    s = play(s, { type: "wonders-pick", wonder: s.wonderPool[0] });
    assert.ok(validateWondersState(s));
  }
  assert.deepEqual(order, ["a", "b", "b", "a", "b", "a", "a", "b"]);
  assert.equal(s.players[0].wonders.length, 4);
  assert.equal(s.players[1].wonders.length, 4);
  assert.equal(s.turn, 0);
  assert.equal(s.layout.length, 20);
  const v = e.getDisplayView(s, "ABC234", 8);
  assert.ok(v.layout!.some((n) => !n.faceUp && !("card" in n)));
  assert.equal("decks" in v, false);
  assert.equal("removed" in v, false);
  assert.equal("wonderDeck" in v, false);
});
test("Duel all graph slots unblock exactly from children in all three layouts", () => {
  for (const age of [1, 2, 3] as const) {
    const s = drafted();
    s.age = age;
    s.layout = LAYOUTS[age].map((x, i) => ({
      slot: i,
      card: "lumber-yard",
      faceUp: x.faceUp,
    }));
    assert.equal(s.layout.length, 20);
    for (const slot of LAYOUTS[age]) {
      assert.equal(e.accessible(s, slot.id), slot.coveredBy.length === 0);
      const copy = structuredClone(s);
      copy.layout = copy.layout.filter((x) => !slot.coveredBy.includes(x.slot));
      assert.equal(e.accessible(copy, slot.id), true);
    }
  }
});
test("Duel costs: reusable production, brown/grey opponent tariffs, discounts, flexible optimal assignment, coins and chains", () => {
  const s = drafted(),
    p = s.players[0],
    q = s.players[1];
  p.buildings = ["lumber-yard"];
  q.buildings = ["sawmill", "port"];
  const cost = { ...CARD["palace"], cost: { wood: 2, clay: 1 }, coinCost: 2 };
  assert.equal(e.quote(s, p, cost).total, 8);
  p.buildings.push("caravansery");
  assert.equal(e.quote(s, p, cost).total, 4);
  p.buildings.push("wood-reserve");
  assert.equal(e.quote(s, p, cost).total, 3);
  p.tokens.push("masonry");
  assert.equal(e.quote(s, p, { ...cost, color: "blue" }).total, 2);
  p.buildings.push("baths");
  assert.equal(e.quote(s, p, CARD["aqueduct"]).total, 0);
  assert.equal(e.quote(s, p, CARD["aqueduct"]).chain, true);
  assert.equal(e.quote(s, p, CARD["lumber-yard"]).affordable, false);
  assert.equal(p.coins, 7);
});
test("Duel invalid actions are atomic, blocked card, wrong actor, malformed extra fields and insufficient coins", () => {
  const s = drafted();
  const saved = JSON.stringify(s);
  assert.throws(() =>
    e.applyAction(
      s,
      "b",
      { type: "wonders-play", slot: 19, mode: "discard" },
      rng(),
    ),
  );
  assert.throws(() =>
    play(s, { type: "wonders-play", slot: 0, mode: "discard" }),
  );
  assert.throws(() =>
    play(s, {
      type: "wonders-play",
      slot: 19,
      mode: "discard",
      coins: 100,
    } as any),
  );
  s.players[0].coins = 0;
  const n = s.layout.find(
    (n) =>
      e.accessible(s, n.slot) &&
      Object.keys(CARD[n.card].cost).length + CARD[n.card].coinCost > 0,
  );
  if (n)
    assert.throws(() =>
      play(s, { type: "wonders-play", slot: n.slot, mode: "build" }),
    );
  s.players[0].coins = 7;
  assert.equal(JSON.stringify(s), saved);
});
test("Duel 256 deterministic complete games, card conservation and no leaked face-down identities after every action", () => {
  const victories = new Set<string>();
  for (let seed = 1; seed <= 256; seed++) {
    const random = rng(seed);
    let s = e.createInitialState(seats, random, "a");
    let turns = 0;
    while (s.phase !== "finished") {
      const legal = e.getLegalActions(s, s.players[s.turn].id);
      assert.ok(legal.length);
      const builds = legal.filter(
        (a) => a.type === "wonders-play" && a.mode !== "discard",
      );
      const a =
        builds.length && random() > 0.15
          ? builds[Math.floor(random() * builds.length)]
          : legal[Math.floor(random() * legal.length)];
      s = e.applyAction(s, s.players[s.turn].id, a, random);
      assert.ok(
        validateWondersState(s),
        `invalid seed ${seed} sequence ${s.sequence}`,
      );
      assert.ok(++turns < 100);
      const v = e.getDisplayView(s, "ABC234", turns);
      for (const n of v.layout!) if (!n.faceUp) assert.equal(n.card, undefined);
      assert.ok(s.players.every((p) => p.coins >= 0));
    }
    victories.add(s.victory!);
    assert.ok(s.winners.length);
  }
  assert.ok(victories.has("civilian"));
  assert.ok(victories.has("military"));
});
function relocate(s: WondersState, id: string, to: string[]) {
  for (const deck of Object.values(s.decks)) {
    const i = deck.indexOf(id);
    if (i >= 0) deck.splice(i, 1);
  }
  for (const list of [
    s.removed,
    s.discard,
    ...s.players.map((p) => p.buildings),
  ]) {
    const i = list.indexOf(id);
    if (i >= 0) list.splice(i, 1);
  }
  s.layout = s.layout.filter((n) => n.card !== id);
  to.push(id);
}
function at(s: WondersState, id: string, slot = 19) {
  const old = s.layout.find((n) => n.slot === slot);
  if (old) {
    s.layout.splice(s.layout.indexOf(old), 1);
    s.removed.push(old.card);
  }
  const stash: string[] = [];
  relocate(s, id, stash);
  s.layout.push({ slot, card: id, faceUp: true });
}
function ownedWonder(s: WondersState, id: string) {
  for (const p of s.players) p.wonders = p.wonders.filter((w) => w.id !== id);
  s.wonderDeck = s.wonderDeck.filter((w) => w !== id);
  s.wonderPool = s.wonderPool.filter((w) => w !== id);
  s.players[0].wonders.push({ id });
  s.players[0].coins = 100;
}
test("Duel all ten Progress effects, Economy real trade only, Urbanism chain only, Strategy future red only", () => {
  let s = drafted();
  const p = s.players[0],
    q = s.players[1];
  p.coins = 100;
  p.tokens = ["urbanism"];
  q.tokens = ["economy"];
  relocate(s, "baths", p.buildings);
  at(s, "aqueduct");
  s = play(s, { type: "wonders-play", slot: 19, mode: "build" });
  assert.equal(s.players[0].coins, 104);
  assert.equal(s.players[1].coins, 7);
  s = drafted();
  s.players[0].coins = 100;
  s.players[1].tokens = ["economy"];
  at(s, "baths");
  s = play(s, { type: "wonders-play", slot: 19, mode: "build" });
  assert.equal(s.players[1].coins, 9);
  for (const id of TOKENS) {
    let t = drafted();
    t.players[0].tokens = [];
    t.boxTokens = t.boxTokens.filter((x) => x !== id);
    t.progress = t.progress.filter((x) => x !== id);
    t.progress.push(id);
    t.pending = { kind: "progress", actor: "a", options: [id] };
    const coins = t.players[0].coins;
    t = play(t, { type: "wonders-decide", choice: id });
    assert.ok(t.players[0].tokens.includes(id));
    assert.equal(
      t.players[0].coins,
      coins + (["agriculture", "urbanism"].includes(id) ? 6 : 0),
    );
    if (id === "philosophy")
      assert.equal(e.scorePlayer(t, t.players[0]).progress, 7);
    if (id === "agriculture")
      assert.equal(e.scorePlayer(t, t.players[0]).progress, 4);
    if (id === "mathematics")
      assert.equal(e.scorePlayer(t, t.players[0]).progress, 3);
    if (id === "law") assert.ok(e.science(t.players[0]).includes("law"));
  }
  s = drafted();
  s.players[0].tokens = ["strategy"];
  s.players[0].coins = 100;
  at(s, "stable");
  s = play(s, { type: "wonders-play", slot: 19, mode: "build" });
  assert.equal(s.military, 2);
  s = drafted();
  ownedWonder(s, "colossus");
  s.players[0].tokens = ["strategy"];
  s = play(s, {
    type: "wonders-play",
    slot: 19,
    mode: "wonder",
    wonder: "colossus",
  });
  assert.equal(s.military, 2);
});
test("Duel science pair -> persisted decision; Law sixth distinct wins immediately without another turn", () => {
  let s = drafted();
  s.players[0].coins = 100;
  relocate(s, "scriptorium", s.players[0].buildings);
  at(s, "library");
  s = play(s, { type: "wonders-play", slot: 19, mode: "build" });
  assert.equal(s.turn, 0);
  assert.equal(s.pending?.kind, "progress");
  assert.equal(
    JSON.stringify(e.getDisplayView(s, "ABC234", 1)).includes("boxTokens"),
    false,
  );
  s = play(s, { type: "wonders-decide", choice: s.pending!.options[0] });
  assert.equal(s.turn, 1);
  s = drafted();
  for (const id of [
    "workshop",
    "apothecary",
    "scriptorium",
    "pharmacist",
    "academy",
  ])
    relocate(s, id, s.players[0].buildings);
  s.pending = { kind: "progress", actor: "a", options: ["law"] };
  s.progress = s.progress.filter((id) => id !== "law");
  s.progress.push("law");
  s.boxTokens = s.boxTokens.filter((id) => id !== "law");
  s = play(s, { type: "wonders-decide", choice: "law" });
  assert.equal(s.victory, "science");
  assert.deepEqual(s.winners, ["a"]);
  assert.throws(() =>
    play(s, { type: "wonders-play", slot: 19, mode: "discard" }),
  );
});
test("Duel military tokens crossed once, affordable loss clamp, victory interrupts remaining effects", () => {
  let s = drafted();
  s.military = 2;
  s.players[1].coins = 1;
  at(s, "guard-tower");
  s = play(s, { type: "wonders-play", slot: 19, mode: "build" });
  assert.equal(s.military, 3);
  assert.equal(s.players[1].coins, 0);
  assert.deepEqual(s.militaryUsed, [3]);
  s.turn = 0;
  s.military = 8;
  s.players[0].coins = 100;
  at(s, "stable");
  s = play(s, { type: "wonders-play", slot: 19, mode: "build" });
  assert.equal(s.phase, "finished");
  assert.equal(s.victory, "military");
  assert.equal(s.military, 9);
  assert.deepEqual(s.winners, ["a"]);
});
test("Duel twelve Wonders: effects, private Great Library, destroy, free discard construction, extra and Theology", () => {
  for (const w of WONDERS) {
    let s = drafted();
    ownedWonder(s, w.id);
    relocate(s, "glassworks", s.players[1].buildings);
    relocate(s, "lumber-yard", s.players[1].buildings);
    relocate(s, "altar", s.discard);
    const before = s.players[0].coins,
      q = e.quote(s, s.players[0], w);
    s = play(s, {
      type: "wonders-play",
      slot: 19,
      mode: "wonder",
      wonder: w.id,
    });
    assert.equal(s.players[0].coins, before - q.total + (w.coins ?? 0));
    assert.equal(
      s.players[0].wonders.find((x) => x.id === w.id)!.card !== undefined,
      true,
    );
    assert.equal(e.scorePlayer(s, s.players[0]).wonders, w.points ?? 0);
    if (w.decision) {
      assert.equal(s.pending!.kind, w.decision);
      assert.equal(s.turn, 0);
      if (w.decision === "library") {
        assert.equal(
          e.getDisplayView(s, "ABC234", 0).pending!.options,
          undefined,
        );
        assert.equal(e.getPlayerView(s, "b").decision, undefined);
        assert.equal(e.getPlayerView(s, "a").decision!.options.length, 3);
      }
      const choice = s.pending!.options[0];
      s = play(s, { type: "wonders-decide", choice });
      if (w.decision === "discard")
        assert.ok(s.players[0].buildings.includes("altar"));
      if (w.decision === "destroy-brown")
        assert.ok(s.discard.includes("lumber-yard"));
      if (w.decision === "destroy-grey")
        assert.ok(s.discard.includes("glassworks"));
    } else assert.equal(s.turn, w.extra ? 0 : 1);
  }
  let s = drafted();
  ownedWonder(s, "pyramids");
  s.players[0].tokens = ["theology"];
  s = play(s, {
    type: "wonders-play",
    slot: 19,
    mode: "wonder",
    wonder: "pyramids",
  });
  assert.equal(s.turn, 0);
});
test("Duel last-card replay expires, neutral last actor and weaker side choose next Age, final civilian tie", () => {
  for (const military of [-1, 0, 1]) {
    let s = drafted();
    s.military = military;
    for (const n of s.layout.filter((n) => n.slot !== 19))
      s.removed.push(n.card);
    s.layout = s.layout.filter((n) => n.slot === 19);
    ownedWonder(s, "sphinx");
    s = play(s, {
      type: "wonders-play",
      slot: 19,
      mode: "wonder",
      wonder: "sphinx",
    });
    assert.equal(s.age, 2);
    assert.equal(s.extra, false);
    assert.equal(s.pending?.kind, "starter");
    assert.equal(s.turn, military > 0 ? 1 : 0);
    s = play(s, { type: "wonders-decide", choice: "b" });
    assert.equal(s.turn, 1);
    assert.equal(s.layout.length, 20);
  }
  const s = drafted();
  for (const p of s.players) {
    p.coins = 8;
    p.buildings = [];
  }
  assert.equal(e.scorePlayer(s, s.players[0]).treasury, 2);
});
test("Duel Guilds use one richest city, combined brown/grey and built Wonder maximum, scores independent of ownership", () => {
  const s = drafted();
  s.players[0].buildings = [
    "shipowners-guild",
    "builders-guild",
    "moneylenders-guild",
  ];
  s.players[1].buildings = ["sawmill", "brickyard", "glassworks"];
  s.players[1].coins = 14;
  s.players[0].wonders = [{ id: "pyramids", card: "baths" }];
  s.players[1].wonders = [
    { id: "sphinx", card: "altar" },
    { id: "colossus", card: "theater" },
  ];
  const score = e.scorePlayer(s, s.players[0]);
  assert.equal(score.guilds, 3 + 4 + 4);
  assert.equal(score.wonders, 9);
  s.players[0].tokens = ["mathematics", "law", "philosophy"];
  assert.equal(e.scorePlayer(s, s.players[0]).progress, 16);
});
test("Duel seventh Wonder removes eighth, unaffordable construction cannot use immediate income to pay", () => {
  let s = drafted();
  const all = [...s.players[0].wonders, ...s.players[1].wonders];
  const unused = all[6],
    eighth = all[7];
  const owner = s.players.find((p) =>
    p.wonders.some((w) => w.id === unused.id),
  )!;
  s.turn = s.players.indexOf(owner);
  for (let i = 0; i < 6; i++) {
    const node = s.layout.pop()!;
    all[i].card = node.card;
  }
  owner.coins = 100;
  const node = s.layout.find((n) => e.accessible(s, n.slot))!;
  node.faceUp = true;
  s = play(s, {
    type: "wonders-play",
    slot: node.slot,
    mode: "wonder",
    wonder: unused.id,
  });
  assert.equal(
    s.players.flatMap((p) => p.wonders).filter((w) => w.card).length,
    7,
  );
  assert.equal(
    s.players.flatMap((p) => p.wonders).find((w) => w.id === eighth.id)!
      .removed,
    true,
  );
  s = drafted();
  ownedWonder(s, "temple-of-artemis");
  s.players[0].coins = 0;
  assert.throws(() =>
    play(s, {
      type: "wonders-play",
      slot: 19,
      mode: "wonder",
      wonder: "temple-of-artemis",
    }),
  );
  assert.equal(s.players[0].coins, 0);
});
test("Duel final scoring: all Guild income effects and civilian blue tie breaker", () => {
  for (const card of CARDS.filter((c) => c.guild)) {
    let s = drafted();
    s.players[1].buildings = [
      "lumber-yard",
      "glassworks",
      "theater",
      "scriptorium",
      "tavern",
      "guard-tower",
    ];
    s.players[0].coins = 100;
    at(s, card.id);
    const before = s.players[0].coins,
      q = e.quote(s, s.players[0], card);
    s = play(s, { type: "wonders-play", slot: 19, mode: "build" });
    assert.equal(
      s.players[0].coins,
      before -
        q.total +
        (["wonder", "treasury"].includes(card.guild!)
          ? 0
          : card.guild === "materials"
            ? 2
            : 1),
    );
  }
  let s = drafted();
  s.age = 3;
  s.layout = [{ slot: 19, card: "tavern", faceUp: true }];
  s.players[0].buildings = ["theater"];
  s.players[0].coins = 0;
  s.players[1].coins = 9;
  s = play(s, { type: "wonders-play", slot: 19, mode: "discard" });
  assert.equal(s.phase, "finished");
  assert.deepEqual(s.winners, ["a"]);
  s = drafted();
  s.age = 3;
  s.layout = [{ slot: 19, card: "tavern", faceUp: true }];
  s.players[0].coins = 1;
  s.players[1].coins = 3;
  s = play(s, { type: "wonders-play", slot: 19, mode: "discard" });
  assert.deepEqual(s.winners, ["a", "b"]);
});
test("Duel restore rejects duplicate/missing cards, hidden accessible cards, corrupt choice or currency", () => {
  const s = drafted();
  for (const corrupt of [
    (x: WondersState) => (x.players[0].coins = -1),
    (x: WondersState) => x.removed.pop(),
    (x: WondersState) => x.removed.push(x.removed[0]),
    (x: WondersState) =>
      (x.layout.find((n) => e.accessible(x, n.slot))!.faceUp = false),
    (x: WondersState) =>
      (x.pending = { kind: "progress", actor: "a", options: ["fake-token"] }),
  ]) {
    const copy = structuredClone(s);
    corrupt(copy);
    assert.equal(validateWondersState(copy), false);
  }
  assert.ok(validateWondersState(s));
});
