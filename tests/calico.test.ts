import test from "node:test";
import assert from "node:assert/strict";
import * as engine from "../src/games/calico/engine.js";
import {
  COLORS,
  PATTERNS,
  CATS,
  GOALS,
  PATCH_CELLS,
  GOAL_CELLS,
  printedBorder,
  neighbors,
  key,
  rotate,
  hasShape,
  fromOffset,
  toOffset,
  type Hex,
  type Patch,
  type CatId,
} from "../src/games/calico/data.js";
import { validateCalicoState } from "../src/games/calico/validation.js";
const seats = [
  { id: "a", name: "หนึ่ง" },
  { id: "b", name: "สอง" },
];
const rng =
  (seed = 1) =>
  () =>
    (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
const start = () => engine.createInitialState(seats, rng(), "a", "first");
const patch = (
  id: string,
  color: (typeof COLORS)[number] = "blue",
  pattern: (typeof PATTERNS)[number] = "dots",
): Patch => ({ id, color, pattern });
test("Calico setup: finite 108 tiles, 3 copies, two hands, 3 market, standard dot groups, persisted private draft", () => {
  const s = engine.createInitialState(seats, rng());
  assert.equal(s.bag.length, 101);
  assert.equal(s.market.length, 3);
  assert.deepEqual(
    s.players.map((p) => p.hand.length),
    [2, 2],
  );
  assert.equal(new Set(engine.tiles().map((t) => t.id)).size, 108);
  for (const color of COLORS)
    for (const pattern of PATTERNS)
      assert.equal(
        engine.tiles().filter((t) => t.color === color && t.pattern === pattern)
          .length,
        3,
      );
  assert.deepEqual(
    s.cats.map((c) => CATS[c.id].group),
    [1, 2, 3],
  );
  assert.equal(new Set(s.cats.flatMap((c) => c.patterns)).size, 6);
  assert.ok(validateCalicoState(s));
  let next = engine.applyAction(s, "a", {
    type: "calico-goals",
    goals: s.players[0].options.slice(0, 2),
    confirm: false,
  });
  assert.equal(next.phase, "setup");
  assert.deepEqual(next.players[0].draft, s.players[0].options.slice(0, 2));
  assert.deepEqual(s.players[0].draft, []);
  for (const id of ["a", "b"]) {
    const p = next.players.find((p) => p.id === id)!;
    next = engine.applyAction(next, id, {
      type: "calico-goals",
      goals: p.options.slice(0, 3),
      confirm: true,
    });
  }
  assert.equal(next.phase, "playing");
  assert.ok(validateCalicoState(next));
  assert.throws(() =>
    engine.applyAction(next, "a", {
      type: "calico-goals",
      goals: [],
      confirm: false,
    }),
  );
});
test("Calico axial neighbors, 22 empty cells, goals, 24 fixed printed tiles and rotated second board", () => {
  assert.equal(PATCH_CELLS.length, 22);
  assert.equal(GOAL_CELLS.length, 3);
  for (const h of [...PATCH_CELLS, ...GOAL_CELLS])
    assert.deepEqual(fromOffset(toOffset(h).q, toOffset(h).row), h);
  for (const h of PATCH_CELLS) {
    assert.equal(new Set(neighbors(h).map(key)).size, 6);
    for (const n of neighbors(h))
      assert.ok(neighbors(n).some((x) => key(x) === key(h)));
  }
  for (const board of [0, 1]) {
    const printed = printedBorder(board);
    assert.equal(Object.keys(printed).length, 24);
    assert.ok(
      Object.keys(printed).every((k) => !PATCH_CELLS.some((h) => key(h) === k)),
    );
  }
  const s = start();
  for (const hex of [GOAL_CELLS[0], { q: 999, r: 0 }])
    assert.throws(() =>
      engine.applyAction(s, "a", {
        type: "calico-place",
        tileId: s.players[0].hand[0].id,
        hex,
      }),
    );
});
test("Calico complete 44 placements + market choices, conservation each step, bad actions atomic and final tie-break", () => {
  let s = start();
  const before = structuredClone(s);
  assert.throws(() =>
    engine.applyAction(s, "b", {
      type: "calico-place",
      tileId: s.players[1].hand[0].id,
      hex: PATCH_CELLS[0],
    }),
  );
  assert.deepEqual(s, before);
  let actions = 0;
  while (s.phase !== "finished") {
    const id = s.players[s.turn].id;
    const legal = engine.getLegalActions(s, id);
    assert.ok(legal.length);
    s = engine.applyAction(s, id, legal[0]);
    actions++;
    assert.ok(validateCalicoState(s), `invalid after ${actions}`);
    const all = [
      ...s.bag,
      ...s.market,
      ...s.players.flatMap((p) => [...p.hand, ...Object.values(p.patches)]),
    ];
    assert.equal(all.length, 108);
    assert.equal(new Set(all.map((t) => t.id)).size, 108);
  }
  assert.equal(actions, 88);
  assert.equal(s.placements, 44);
  assert.equal(s.bag.length, 57);
  assert.deepEqual(
    s.players.map((p) => p.hand.length),
    [2, 2],
  );
  assert.equal(engine.getLegalActions(s, "a").length, 0);
  assert.deepEqual(s.winners, engine.determineWinners(s));
  const view = engine.getDisplayView(s, "ABCDEF", 100);
  assert.equal((view as any).bag, undefined);
  assert.equal(JSON.stringify(view).includes("options"), false);
  assert.equal((view as any).players[0].draft, undefined);
});
test("Calico each size/shape cat, all rotations, incorrect counts/shape and mixed pattern cannot substitute", () => {
  for (const [id, cat] of Object.entries(CATS)) {
    let cells: Hex[] =
      "shape" in cat
        ? cat.shape
        : Array.from({ length: cat.size }, (_, q) => ({ q, r: 0 }));
    for (let rotation = 0; rotation < 6; rotation++) {
      const s = start(),
        p = s.players[0];
      s.cats = [{ id: id as CatId, patterns: ["dots", "stripes"] }];
      p.board = 0;
      // Shift far from printed border, then call scoring primitives directly on the fixture.
      const translated = cells.map((h) => ({ q: h.q + 30, r: h.r + 30 }));
      for (const h of translated) p.patches[key(h)] = patch(key(h));
      engine.grantAwards(s, p, key(translated[0]));
      assert.equal(
        p.awards.filter((a) => a.kind === "cat").length,
        1,
        `${id} rotation ${rotation}`,
      );
      engine.grantAwards(s, p, key(translated.at(-1)!));
      assert.equal(p.awards.filter((a) => a.kind === "cat").length, 1);
      cells = cells.map(rotate);
    }
    if ("shape" in cat)
      assert.equal(hasShape([{ q: 0, r: 0 }], cat.shape), false);
  }
  const s = start(),
    p = s.players[0];
  s.cats = [{ id: "callie", patterns: ["dots", "stripes"] }];
  for (let q = 30; q < 33; q++) p.patches[key({ q, r: 30 })] = patch(String(q));
  engine.grantAwards(s, p, "31,30");
  assert.equal(p.awards.filter((a) => a.kind === "cat").length, 0);
});
test("Calico buttons, rainbow once, expansion and merge retain tokens without granting another", () => {
  const s = start(),
    p = s.players[0];
  for (const [i, color] of COLORS.entries()) {
    for (let q = 0; q < 3; q++)
      p.patches[key({ q: 30 + q, r: 30 + i * 4 })] = patch(`${i}-${q}`, color);
    engine.grantAwards(s, p, key({ q: 31, r: 30 + i * 4 }));
  }
  assert.equal(p.awards.filter((a) => a.kind === "button").length, 6);
  assert.equal(p.rainbow, true);
  assert.equal(engine.scorePlayer(s, p).buttons.at(-1)!.points, 3);
  for (let q = 33; q < 36; q++)
    p.patches[key({ q, r: 30 })] = patch(`extra${q}`);
  engine.grantAwards(s, p, "35,30");
  assert.equal(
    p.awards.filter((a) => a.kind === "button" && a.id === "blue").length,
    1,
  );
  for (let q = 38; q < 41; q++) p.patches[key({ q, r: 30 })] = patch(`new${q}`);
  engine.grantAwards(s, p, "38,30");
  assert.equal(
    p.awards.filter((a) => a.kind === "button" && a.id === "blue").length,
    2,
  );
  for (let q = 36; q < 38; q++)
    p.patches[key({ q, r: 30 })] = patch(`bridge${q}`);
  engine.grantAwards(s, p, "36,30");
  assert.equal(
    p.awards.filter((a) => a.kind === "button" && a.id === "blue").length,
    2,
  );
});
test("Calico all six design distributions: color/pattern/both, incomplete, nonadjacent pairs", () => {
  for (const [id, goal] of Object.entries(GOALS))
    for (const both of [false, true]) {
      const s = start(),
        p = s.players[0];
      p.goals = [id as keyof typeof GOALS];
      p.patches = {};
      const values = goal.counts.flatMap((count, i) => Array(count).fill(i));
      neighbors(GOAL_CELLS[0]).forEach(
        (h, i) =>
          (p.patches[key(h)] = patch(
            `g${i}`,
            COLORS[values[i]],
            both ? PATTERNS[values[i]] : "dots",
          )),
      );
      const score = engine.scorePlayer(s, p).goals[0];
      assert.equal(score.color, true);
      assert.equal(score.pattern, both);
      assert.equal(score.points, both ? goal.both : goal.one);
      delete p.patches[key(neighbors(GOAL_CELLS[0])[0])];
      assert.equal(engine.scorePlayer(s, p).goals[0].points, 0);
    }
});
test("Calico printed border counts toward awards; restore rejects lost/duplicated tiles and wrong private phase", () => {
  const s = start(),
    p = s.players[0];
  const border = printedBorder(p.board);
  const h = PATCH_CELLS.find((h) => neighbors(h).some((n) => border[key(n)]));
  assert.ok(h);
  const n = neighbors(h!).find((n) => border[key(n)])!;
  p.patches[key(h!)] = patch(
    "test",
    border[key(n)].color,
    border[key(n)].pattern,
  );
  assert.ok(
    engine
      .components(engine.boardTiles(p), "color")
      .some((c) => c.keys.has(key(h!)) && c.keys.has(key(n))),
  );
  const base = start();
  assert.ok(validateCalicoState(base));
  const bad = structuredClone(base);
  bad.bag.pop();
  assert.equal(validateCalicoState(bad), false);
  const dup = structuredClone(base);
  dup.bag[0] = dup.market[0];
  assert.equal(validateCalicoState(dup), false);
});
test("Calico awards count printed tiles; one placement can earn both tokens", () => {
  const s = start(),
    p = s.players[0],
    border = printedBorder(p.board);
  const h = PATCH_CELLS.find(
    (h) =>
      neighbors(h).some((n) => border[key(n)]) &&
      neighbors(h).some((n) => PATCH_CELLS.some((c) => key(c) === key(n))),
  )!;
  const edge = neighbors(h).find((n) => border[key(n)])!,
    inner = neighbors(h).find((n) =>
      PATCH_CELLS.some((c) => key(c) === key(n)),
    )!;
  const tile = border[key(edge)];
  s.cats = [
    {
      id: "millie",
      patterns: [
        tile.pattern,
        ...PATTERNS.filter((p) => p !== tile.pattern).slice(0, 1),
      ],
    },
  ];
  p.patches[key(inner)] = patch("near-edge", tile.color, tile.pattern);
  p.patches[key(h)] = patch("placed-edge", tile.color, tile.pattern);
  engine.grantAwards(s, p, key(h));
  assert.equal(p.awards.filter((a) => a.kind === "button").length, 1);
  assert.equal(p.awards.filter((a) => a.kind === "cat").length, 1);
});
test("Calico tie-break uses cat tokens, then all button tokens including rainbow, then shared victory", () => {
  const s = start();
  for (const p of s.players) {
    p.goals = [];
    p.awards = [];
    p.rainbow = false;
  }
  s.cats = [{ id: "millie", patterns: ["dots", "stripes"] }];
  s.players[0].awards = [{ kind: "cat", id: "millie", at: "0,0" }];
  s.players[1].awards = [{ kind: "button", id: "blue", at: "0,0" }];
  assert.deepEqual(engine.determineWinners(s), ["a"]);
  s.cats = [{ id: "tibbit", patterns: ["dots", "stripes"] }];
  s.players[0].awards = [{ kind: "cat", id: "tibbit", at: "0,0" }];
  s.players[0].goals = ["different"];
  s.players[1].awards = [{ kind: "cat", id: "tibbit", at: "0,0" }];
  s.players[1].goals = [];
  assert.deepEqual(engine.determineWinners(s), ["a", "b"]);
  s.players[0].awards = [];
  s.players[1].awards = [];
  s.players[0].goals = [];
  s.players[0].rainbow = true;
  s.players[1].awards = [{ kind: "button", id: "blue", at: "0,0" }];
  assert.deepEqual(engine.determineWinners(s), ["a", "b"]);
});

test("Calico equal totals and equal cat counts resolve on button count", () => {
  const s = start();
  s.cats = [];
  for (let player = 0; player < 2; player++) {
    const p = s.players[player];
    p.goals = ["four"];
    p.awards = [];
    p.rainbow = false;
    p.patches = {};
    neighbors(GOAL_CELLS[0]).forEach(
      (h, i) =>
        (p.patches[key(h)] = patch(
          "tie" + i,
          i < 4 ? "blue" : "cyan",
          player === 0 ? (i < 4 ? "dots" : "stripes") : "dots",
        )),
    );
  }
  s.players[1].awards = [
    { kind: "button", id: "blue", at: "0,0" },
    { kind: "button", id: "cyan", at: "0,1" },
  ];
  assert.equal(engine.scorePlayer(s, s.players[0]).total, 14);
  assert.equal(engine.scorePlayer(s, s.players[1]).total, 14);
  assert.deepEqual(engine.determineWinners(s), ["b"]);
});
test("Calico seeded standard games cover all cats and preserve invariants with varied goals/market/hand choices", () => {
  const seen = new Set<string>();
  let scoredGoal = false;
  for (let seed = 1; seed <= 128; seed++) {
    const random = rng(Math.imul(seed, 2654435761) >>> 0);
    let s = engine.createInitialState(seats, random, "b");
    s.cats.forEach((c) => seen.add(c.id));
    for (const id of ["b", "a"]) {
      const p = s.players.find((p) => p.id === id)!;
      s = engine.applyAction(s, id, {
        type: "calico-goals",
        goals: engine.shuffle(p.options, random).slice(0, 3),
        confirm: true,
      });
    }
    while (s.phase !== "finished") {
      const id = s.players[s.turn].id,
        legal = engine.getLegalActions(s, id);
      s = engine.applyAction(s, id, legal[Math.floor(random() * legal.length)]);
      assert.ok(validateCalicoState(s));
    }
    assert.equal(s.placements, 44);
    assert.equal(s.bag.length, 57);
    assert.equal(s.winners.length > 0, true);
    for (const p of s.players)
      if (engine.scorePlayer(s, p).goals.some((g) => g.points > 0))
        scoredGoal = true;
  }
  assert.deepEqual([...seen].sort(), Object.keys(CATS).sort());
  assert.equal(scoredGoal, true);
});
test("Calico every shape cat rejects a connected same-pattern group of the right size with the wrong shape", () => {
  for (const [id, spec] of Object.entries(CATS))
    if ("shape" in spec) {
      const s = start(),
        p = s.players[0];
      s.cats = [{ id: id as CatId, patterns: ["dots", "stripes"] }];
      const cells =
        id === "tecolote" || id === "leo"
          ? [{ q: 0, r: 0 }, ...neighbors({ q: 0, r: 0 })].slice(
              0,
              spec.shape.length,
            )
          : Array.from({ length: spec.shape.length }, (_, q) => ({ q, r: 0 }));
      assert.equal(hasShape(cells, spec.shape), false, id);
      for (const h of cells)
        p.patches[key({ q: h.q + 30, r: h.r + 30 })] = patch(key(h));
      engine.grantAwards(s, p, key({ q: cells[0].q + 30, r: cells[0].r + 30 }));
      assert.equal(p.awards.filter((a) => a.kind === "cat").length, 0, id);
    }
});
test("Calico 1–4: setup, complete games, shared finite market and exact Solo conveyor for every pick index", () => {
  for (let count = 1; count <= 4; count++)
    for (let seed = 1; seed <= 24; seed++) {
      const people = Array.from({ length: count }, (_, i) => ({
        id: "p" + i,
        name: "P" + i,
      }));
      let s = engine.createInitialState(
        people,
        rng(seed),
        people[count - 1].id,
        "first",
      );
      assert.equal(s.mode, count === 1 ? "solo" : "multiplayer");
      assert.equal(new Set(s.players.map((p) => p.board)).size, count);
      assert.equal(s.bag.length, 105 - count * 2);
      let drafts = 0;
      while (s.phase !== "finished") {
        const actor = s.players[s.turn].id,
          old = structuredClone(s),
          legal = engine.getLegalActions(s, actor),
          action =
            s.step === "draft"
              ? { type: "calico-draft" as const, index: (drafts++ + seed) % 3 }
              : legal[(seed + drafts) % legal.length];
        s = engine.applyAction(s, actor, action);
        if (action.type === "calico-draft") {
          assert.equal(
            s.players.find((p) => p.id === actor)!.hand.at(-1)!.id,
            old.market[action.index].id,
          );
          if (count === 1) {
            const remaining = old.market.filter((_, i) => i !== action.index);
            assert.deepEqual(s.removed, old.removed!.concat(remaining[0]));
            assert.deepEqual(s.market, [remaining[1], ...old.bag.slice(0, 2)]);
            assert.deepEqual(s.bag, old.bag.slice(2));
            assert.equal(s.event!.marketCycle!.removed.length, 1);
          } else {
            assert.deepEqual(s.removed, []);
            assert.equal(s.bag.length, old.bag.length - 1);
            for (let i = 0; i < 3; i++)
              assert.deepEqual(
                s.market[i],
                i === action.index ? old.bag[0] : old.market[i],
              );
          }
        }
        assert.ok(
          validateCalicoState(s),
          `count${count} seed${seed} seq${s.sequence}`,
        );
      }
      assert.equal(s.placements, count * 22);
      assert.equal(drafts, count * 22);
      assert.equal(s.removed!.length, count === 1 ? 22 : 0);
      assert.equal(s.bag.length, count === 1 ? 59 : 105 - count * 24);
      assert.ok(
        s.players.every(
          (p) => Object.keys(p.patches).length === 22 && p.hand.length === 2,
        ),
      );
    }
  for (const n of [0, 5])
    assert.throws(() =>
      engine.createInitialState(
        Array.from({ length: n }, (_, i) => ({ id: String(i), name: "N" })),
        rng(),
      ),
    );
});
test("Calico new border catalog: four fixed unique 24-cell layouts; new boards preserve 4 of each color", () => {
  const fingerprints = [];
  for (let b = 0; b < 4; b++) {
    const border = printedBorder(b);
    assert.equal(Object.keys(border).length, 24);
    fingerprints.push(
      JSON.stringify(Object.values(border).map((t) => [t.color, t.pattern])),
    );
    for (const color of COLORS)
      assert.equal(
        Object.values(border).filter((t) => t.color === color).length,
        4,
      );
    assert.ok(GOAL_CELLS.every((h) => !border[key(h)]));
  }
  assert.equal(new Set(fingerprints).size, 4);
});
test("Calico legacy two-player states keep original components and scores; new awards have stable IDs/cells without duplicate scoring", () => {
  let s = start();
  s.players[0].board = 0;
  s.players[1].board = 1;
  delete s.mode;
  delete s.removed;
  for (let i = 0; i < 28; i++)
    s = engine.applyAction(
      s,
      s.players[s.turn].id,
      engine.getLegalActions(s, s.players[s.turn].id)[0],
    );
  for (const p of s.players)
    for (const a of p.awards) {
      delete a.awardId;
      delete a.cells;
      delete a.sequence;
    }
  assert.ok(validateCalicoState(s));
  const scores = s.players.map((p) => engine.scorePlayer(s, p));
  const restored = JSON.parse(JSON.stringify(s));
  assert.deepEqual(
    restored.players.map((p: any) => engine.scorePlayer(restored, p)),
    scores,
  );
  assert.equal(restored.mode, undefined);
  assert.equal(restored.players.length, 2);
  const after = engine.applyAction(
    restored,
    restored.players[restored.turn].id,
    engine.getLegalActions(restored, restored.players[restored.turn].id)[0],
  );
  assert.ok(validateCalicoState(after));
  assert.equal(after.mode, undefined);
  const state = start(),
    p = state.players[0];
  for (let q = 30; q < 33; q++) p.patches[`${q},30`] = patch(String(q));
  engine.grantAwards(state, p, "32,30");
  const awards = structuredClone(p.awards),
    points = engine.scorePlayer(state, p);
  engine.grantAwards(state, p, "31,30");
  assert.deepEqual(p.awards, awards);
  assert.deepEqual(engine.scorePlayer(state, p), points);
  assert.ok(
    awards.every(
      (a) => a.awardId && a.cells?.includes(a.at) && a.sequence === 1,
    ),
  );
});
test("Calico v1 persisted room is loaded unchanged; fresh v2 metadata persists without destructive migration", async () => {
  const { PlatformStore } = await import("../src/server/store.js");
  const store = new PlatformStore(":memory:");
  try {
    const legacy = start();
    legacy.players[0].board = 0;
    legacy.players[1].board = 1;
    delete legacy.mode;
    delete legacy.removed;
    const room = {
      code: "ABCDEF",
      gameId: "calico",
      rulesVersion: "base-2020-two-player-v1",
      schemaVersion: 1,
      revision: 0,
      updated: Date.now(),
      players: seats,
      sessions: [],
      calico: legacy,
    };
    store.saveRooms([room]);
    const saved = store.loadRooms();
    assert.equal(store.quarantined.length, 0);
    assert.deepEqual(saved[0].calico, legacy);
    assert.equal(saved[0].rulesVersion, room.rulesVersion);
    room.rulesVersion = "base-2020-one-to-four-v2";
    room.schemaVersion = 2;
    room.calico = start();
    store.saveRooms([room]);
    assert.equal(store.loadRooms()[0].schemaVersion, 2);
    assert.equal(store.quarantined.length, 0);
  } finally {
    store.close();
  }
});
