import test from "node:test";
import assert from "node:assert/strict";
import * as e from "../src/games/jaipur/engine.js";
import {
  CARDS,
  CARD,
  COUNTS,
  GOODS,
  GOODS_TOKENS,
  BONUS_TOKENS,
  minimum,
  type Good,
} from "../src/games/jaipur/data.js";
import { validateJaipurState } from "../src/games/jaipur/validation.js";
import type {
  JaipurState as State,
  JaipurAction as Action,
} from "../src/games/jaipur/types.js";
const seats = [
    { id: "a", name: "หนึ่ง" },
    { id: "b", name: "สอง" },
  ],
  rng =
    (seed = 1) =>
    () =>
      (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32,
  start = () => e.createInitialState(seats, rng(), "a");
const play = (s: State, a: Action) =>
  e.applyAction(s, s.players[s.turn].id, a, rng());
function remove(s: State, id: string) {
  for (const arr of [
    s.deck,
    s.market,
    s.discard,
    ...s.players.flatMap((p) => [p.hand, p.herd]),
  ]) {
    const i = arr.findIndex((c) => c.id === id);
    if (i >= 0) arr.splice(i, 1);
  }
  return { ...CARD[id] };
}
function hand(s: State, good: Good, n: number) {
  for (const c of s.players[0].hand) s.discard.push(c);
  s.players[0].hand = [];
  for (const c of CARDS.filter((c) => c.kind === good).slice(0, n))
    s.players[0].hand.push(remove(s, c.id));
  while (s.market.length < 5) s.market.push(s.deck.shift()!);
}
function market(s: State, kinds: string[]) {
  s.discard.push(...s.market);
  s.market = [];
  for (const kind of kinds) {
    const c = CARDS.find(
      (c) =>
        c.kind === kind && [...s.deck, ...s.discard].some((x) => x.id === c.id),
    )!;
    s.market.push(remove(s, c.id));
  }
}
test("Jaipur edition catalog and setup: finite55 cards,38 goods,18 bonus, 3 forced camels, 10 cards dealt and40 in deck", () => {
  const s = start();
  assert.equal(CARDS.length, 55);
  assert.equal(GOODS_TOKENS.length, 38);
  assert.equal(BONUS_TOKENS.length, 18);
  assert.deepEqual(
    Object.fromEntries(
      Object.keys(COUNTS).map((k) => [
        k,
        CARDS.filter((c) => c.kind === k).length,
      ]),
    ),
    COUNTS,
  );
  assert.equal(s.market.length, 5);
  assert.ok(s.market.filter((c) => c.kind === "camel").length >= 3);
  assert.equal(s.deck.length, 40);
  assert.equal(s.players.flatMap((p) => [...p.hand, ...p.herd]).length, 10);
  assert.ok(s.players.every((p) => p.hand.every((c) => c.kind !== "camel")));
  assert.ok(validateJaipurState(s));
});
test("Jaipur single take, seven-card limit, all camels do not count toward hand limit, no partial camel take", () => {
  let s = start();
  market(s, ["cloth", "spice", "camel", "camel", "camel"]);
  const n = s.players[0].hand.length,
    deckBefore = s.deck.length;
  s = play(s, { type: "jaipur-take", cardId: s.market[0].id });
  assert.equal(s.players[0].hand.length, n + 1);
  assert.equal(s.market.length, 5);
  assert.equal(s.deck.length, deckBefore - 1);
  assert.ok(validateJaipurState(s));
  s = start();
  hand(s, "leather", 7);
  market(s, ["camel", "camel", "camel", "cloth", "spice"]);
  const saved = structuredClone(s);
  assert.throws(() => play(s, { type: "jaipur-take", cardId: s.market[3].id }));
  assert.deepEqual(s, saved);
  const herd = s.players[0].herd.length;
  s = play(s, { type: "jaipur-camels" });
  assert.equal(s.players[0].herd.length, herd + 3);
  assert.equal(s.players[0].hand.length, 7);
  assert.equal(s.market.length, 5);
  assert.ok(validateJaipurState(s));
});
test("Jaipur exchanges are atomic, 2+ goods, equal counts, disjoint types, own hand+herd only and post-exchange cap", () => {
  let s = start();
  hand(s, "leather", 3);
  market(s, ["cloth", "spice", "camel", "gold", "silver"]);
  s.players[0].herd.push(remove(s, "camel-10"));
  const incoming = s.market.slice(0, 2).map((c) => c.id),
    giving = [s.players[0].hand[0].id];
  const a: Action = {
    type: "jaipur-exchange",
    marketIds: incoming,
    handIds: giving,
    camels: 1,
  };
  const old = structuredClone(s);
  s = play(s, a);
  assert.equal(s.deck.length, old.deck.length);
  assert.equal(s.market.length, 5);
  assert.equal(s.players[0].hand.length, 4);
  assert.ok(validateJaipurState(s));
  for (const action of [
    { ...a, marketIds: [incoming[0]], handIds: [], camels: 1 },
    { ...a, marketIds: [old.market[2].id, incoming[0]] },
    { ...a, handIds: [...giving, ...giving] },
    { ...a, camels: 99 },
    { ...a, marketIds: ["fake", incoming[0]] },
  ]) {
    const saved = structuredClone(old);
    assert.throws(() => play(old, action));
    assert.deepEqual(old, saved);
  }
  const same = start();
  hand(same, "cloth", 3);
  market(same, ["cloth", "gold", "camel", "silver", "leather"]);
  assert.throws(() =>
    play(same, {
      type: "jaipur-exchange",
      marketIds: same.market.slice(0, 2).map((c) => c.id),
      handIds: same.players[0].hand.slice(0, 2).map((c) => c.id),
      camels: 0,
    }),
  );
});
test("Jaipur every server compact exchange offer commits and matches preview, wrong actor cannot request it", () => {
  const s = start(),
    p = s.players[0];
  hand(s, "leather", 5);
  market(s, ["cloth", "spice", "gold", "silver", "camel"]);
  p.herd.push(remove(s, "camel-10"));
  const offers = e.exchangeOffers(s, p);
  assert.ok(offers.length);
  for (const [take, give, camels] of offers) {
    const a: Action = {
      type: "jaipur-exchange",
      marketIds: s.market.filter((_, i) => take & (1 << i)).map((c) => c.id),
      handIds: p.hand.filter((_, i) => give & (1 << i)).map((c) => c.id),
      camels,
    };
    const result = play(s, a);
    assert.ok(validateJaipurState(result));
    assert.equal(
      result.players[0].hand.length,
      p.hand.length - a.handIds.length + a.marketIds.length,
    );
    assert.throws(() => e.applyAction(s, "b", a, rng()));
  }
});
test("Jaipur sales: expensive minimum2, highest tokens first, short pile still earns3/4/5+ bonus, finite bonus piles", () => {
  for (const good of GOODS) {
    let s = start();
    hand(s, good, Math.min(6, COUNTS[good]));
    if (minimum(good) === 2)
      assert.throws(() => play(s, { type: "jaipur-sell", good, count: 1 }));
    const expected = s.goods[good].slice(0, 2).map((t) => t.value);
    s = play(s, { type: "jaipur-sell", good, count: 2 });
    assert.deepEqual(
      s.players[0].goods.map((t) => t.value),
      expected,
    );
    assert.equal(s.players[0].bonus.length, 0);
    assert.ok(validateJaipurState(s));
  }
  for (const count of [3, 4, 5, 6, 7]) {
    let s = start();
    hand(s, "leather", count);
    s.players[1].goods.push(...s.goods.leather.splice(0, 8));
    const offer = e.sellOffer(s, s.players[0], "leather", count)!;
    assert.deepEqual(offer.values, [1]);
    s = play(s, { type: "jaipur-sell", good: "leather", count });
    assert.equal(s.players[0].goods.length, 1);
    assert.equal(s.players[0].bonus[0].size, Math.min(5, count));
    assert.equal(
      s.discard.filter((c) => c.kind === "leather").length >= count,
      true,
    );
    assert.ok(validateJaipurState(s));
  }
  let s = start();
  hand(s, "cloth", 3);
  s.players[1].bonus.push(...s.bonus[3].splice(0));
  s = play(s, { type: "jaipur-sell", good: "cloth", count: 3 });
  assert.equal(s.players[0].bonus.length, 0);
  assert.ok(validateJaipurState(s));
});
test("Jaipur empty deck only ends on insufficient refill, never recycles discard; exact refill stays playing", () => {
  let s = start();
  market(s, ["cloth", "spice", "gold", "silver", "leather"]);
  s.discard.push(...s.deck.splice(1));
  s = play(s, { type: "jaipur-take", cardId: s.market[0].id });
  assert.equal(s.phase, "playing");
  assert.equal(s.deck.length, 0);
  s = play(s, { type: "jaipur-take", cardId: s.market[0].id });
  assert.equal(s.phase, "results");
  assert.equal(s.market.length, 4);
  assert.equal(s.history[0].reason, "deck");
  assert.ok(validateJaipurState(s));
});
test("Jaipur third goods stack ends after full sale/bonus, no unsold hand money; camel ties award none", () => {
  let s = start();
  hand(s, "cloth", 3);
  for (const g of ["diamond", "gold"] as const)
    s.players[1].goods.push(...s.goods[g].splice(0));
  s.players[1].goods.push(...s.goods.cloth.splice(0, 5));
  s = play(s, { type: "jaipur-sell", good: "cloth", count: 3 });
  assert.notEqual(s.phase, "playing");
  assert.equal(s.players[0].bonus.length, 1);
  assert.equal(s.history[0].reason, "tokens");
  assert.ok(validateJaipurState(s));
  s = start();
  for (const p of s.players) {
    s.discard.push(...p.herd);
    p.herd = [];
  }
  e.settleRound(s, "deck");
  assert.equal(s.history[0].camelWinner, undefined);
  assert.equal(s.history[0].scores[0].total, 0);
  assert.equal(s.history[0].winner, undefined);
  assert.equal(s.history[0].tieBreak, "draw");
  assert.ok(validateJaipurState(s));
});
test("Jaipur tie breakers: money, bonus count, goods count; true tie grants no seal and needs explicit starter", () => {
  let s = start();
  for (const p of s.players) p.herd = [];
  s.players[0].goods = [{ id: "x", kind: "leather", value: 2 }];
  s.players[1].goods = [
    { id: "y", kind: "leather", value: 1 },
    { id: "z", kind: "leather", value: 1 },
  ];
  e.settleRound(s, "tokens");
  assert.equal(s.history[0].winner, "b");
  assert.equal(s.history[0].tieBreak, "goods");
  s = start();
  for (const p of s.players) p.herd = [];
  s.players[0].bonus = [{ id: "x", size: 3, value: 1 }];
  s.players[1].goods = [{ id: "y", kind: "leather", value: 1 }];
  e.settleRound(s, "tokens");
  assert.equal(s.history[0].winner, "a");
  assert.equal(s.history[0].tieBreak, "bonus");
  s = start();
  for (const p of s.players) {
    s.discard.push(...p.herd);
    p.herd = [];
  }
  e.settleRound(s, "deck");
  assert.deepEqual(
    s.players.map((p) => p.seals),
    [0, 0],
  );
  assert.throws(() => e.applyAction(s, "a", { type: "jaipur-next" }, rng()));
  s = e.applyAction(
    s,
    "b",
    { type: "jaipur-next", startingPlayerId: "b" },
    rng(),
  );
  assert.equal(s.turn, 1);
  assert.equal(s.round, 2);
  assert.ok(validateJaipurState(s));
});
test("Jaipur privacy: hand/herd identities/earned bonus/subtotal/future values owner only; herd counts public, public round scoring reveals exactly after end", () => {
  const s = start();
  s.players[0].bonus.push(s.bonus[3].shift()!);
  const v = e.getDisplayView(s, "ABC234", 1),
    privateA = e.getPlayerView(s, "a"),
    privateB = e.getPlayerView(s, "b");
  for (const p of v.players) {
    assert.equal("herd" in p, false);
    assert.equal(p.herdCount, s.players.find(x=>x.id===p.id)!.herd.length);
    assert.equal("hand" in p, false);
    assert.equal("subtotal" in p, false);
    assert.equal("bonus" in p, false);
  }
  assert.equal("deck" in v, false);
  assert.equal("bonus" in v, false);
  assert.equal(v.result, undefined);
  assert.equal(privateA.bonus.length, 1);
  assert.equal(privateB.bonus.length, 0);
  assert.equal("exchanges" in v, false);
  assert.equal(privateA.hand.length, s.players[0].hand.length);
  e.settleRound(s, "deck");
  const result = e.getDisplayView(s, "ABC234", 2).result!;
  assert.equal(result.scores[0].bonus, s.players[0].bonus[0].value);
  assert.equal(result.scores[0].herd, s.players[0].herd.length);
});
test("Jaipur malformed, forged actor/score/duplicates and camel-as-single actions never mutate state", () => {
  const s = start();
  for (const a of [
    { type: "jaipur-camels", coins: 99 },
    { type: "jaipur-take", cardId: s.market[0].id },
    { type: "jaipur-sell", good: "camel", count: 1 },
    { type: "jaipur-sell", good: "cloth", count: -1 },
    { type: "jaipur-exchange", marketIds: [], handIds: [], camels: 0 },
    { type: "jaipur-next" },
  ] as any[]) {
    const saved = JSON.stringify(s);
    assert.throws(() => play(s, a));
    assert.equal(JSON.stringify(s), saved);
  }
  assert.throws(() =>
    e.applyAction(s, "outsider", { type: "jaipur-camels" }, rng()),
  );
});
test("Jaipur 256 complete seeded matches: conserved55cards/38goods/18bonus, prior loser starts, first2 seals, private projections", () => {
  let draws = 0;
  for (let seed = 1; seed <= 256; seed++) {
    const random = rng(seed);
    let s = e.createInitialState(seats, random, "a"),
      actions = 0;
    while (s.phase !== "finished") {
      if (s.phase === "results") {
        const expected = s.history.at(-1)!.nextStarter;
        const last = s.players.map((p) => p.seals);
        if (!expected) draws++;
        s = e.applyAction(
          s,
          "a",
          {
            type: "jaipur-next",
            ...(expected ? {} : { startingPlayerId: "a" }),
          },
          random,
        );
        assert.equal(s.players[s.turn].id, expected ?? "a");
        assert.deepEqual(
          s.players.map((p) => p.seals),
          last,
        );
      } else {
        const p = s.players[s.turn],
          legal = e.getLegalActions(s, p.id, false),
          sales = legal
            .filter(
              (a): a is Extract<Action, { type: "jaipur-sell" }> =>
                a.type === "jaipur-sell",
            )
            .sort((a, b) => b.count - a.count);
        const action =
          (sales[0]?.count >= 3 || p.hand.length >= 6 ? sales[0] : undefined) ??
          legal.find((a) => a.type === "jaipur-take") ??
          legal.find((a) => a.type === "jaipur-camels") ??
          sales[0];
        assert.ok(action);
        s = e.applyAction(s, p.id, action, random);
      }
      assert.ok(validateJaipurState(s), `seed${seed} action${actions}`);
      assert.ok(++actions < 500);
      assert.ok(s.players.every((p) => p.hand.length <= 7));
    }
    assert.equal(s.players.find((p) => p.id === s.winners[0])!.seals, 2);
    assert.throws(() => play(s, { type: "jaipur-camels" }));
  }
  assert.ok(draws >= 0);
});
test("Jaipur restore rejects token value/order edits, missing or duplicated cards and invalid currency-like state", () => {
  const s = start();
  for (const mutate of [
    (x: State) => x.deck.pop(),
    (x: State) => x.players[0].hand.push(x.deck[0]),
    (x: State) => (x.goods.diamond[0].value = 100),
    (x: State) => (x.bonus[3][0].value = 9),
    (x: State) => x.goods.cloth.reverse(),
    (x: State) => (x.players[0].seals = 2),
  ]) {
    const copy = structuredClone(s);
    mutate(copy);
    assert.equal(validateJaipurState(copy), false);
  }
  assert.ok(validateJaipurState(s));
});
