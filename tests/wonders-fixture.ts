// Test-only late-game fixtures. No application route or debug capability.
import * as engine from "../src/games/seven-wonders-duel/engine.js";
import { WONDERS } from "../src/games/seven-wonders-duel/data.js";
import type { WondersState } from "../src/games/seven-wonders-duel/types.js";
import { validateWondersState } from "../src/games/seven-wonders-duel/validation.js";
function move(s: WondersState, id: string, to: string[]) {
  for (const arr of [
    ...Object.values(s.decks),
    s.removed,
    s.discard,
    ...s.players.map((p) => p.buildings),
  ]) {
    const i = arr.indexOf(id);
    if (i >= 0) arr.splice(i, 1);
  }
  s.layout = s.layout.filter((n) => n.card !== id);
  to.push(id);
}
export function lateFixture(
  seats: { id: string; name: string }[],
  kind: "military" | "science" | "library",
) {
  let s = engine.createInitialState(seats, () => 0.42, seats[0].id);
  while (s.phase === "setup" || s.age < 3 || s.pending) {
    const id = s.players[s.turn].id,
      legal = engine.getLegalActions(s, id);
    s = engine.applyAction(
      s,
      id,
      legal.find((a) => a.type === "wonders-play" && a.mode === "discard") ??
        legal[0],
      () => 0.42,
    );
  }
  s.turn = 0;
  s.players[0].coins = 30;
  const id = kind === "military" ? "arsenal" : "observatory",
    node = s.layout.find((n) => n.slot === 19)!;
  s.layout.splice(s.layout.indexOf(node), 1);
  s.removed.push(node.card);
  move(s, id, []);
  s.layout.push({ slot: 19, card: id, faceUp: true });
  if (kind === "military") s.military = 8;
  else
    for (const id of [
      "workshop",
      "apothecary",
      "scriptorium",
      "pharmacist",
      "academy",
    ])
      move(s, id, s.players[0].buildings);
  if (kind === "library") {
    // Acquire the library by a real engine transition, with Law in the secret box.
    if (s.progress.includes("law")) {
      const replacement = s.boxTokens.find((t) => t !== "law")!;
      s.boxTokens.splice(s.boxTokens.indexOf(replacement), 1);
      s.progress.splice(s.progress.indexOf("law"), 1, replacement);
      s.boxTokens.push("law");
    }
    for (const p of s.players)
      p.wonders = p.wonders.filter((w) => w.id !== "great-library");
    s.wonderDeck = s.wonderDeck.filter((w) => w !== "great-library");
    s.wonderPool = s.wonderPool.filter((w) => w !== "great-library");
    if (s.players[0].wonders.length >= 4) {
      const old = s.players[0].wonders.pop()!;
      s.wonderDeck.push(old.id);
    }
    s.players[0].wonders.push({ id: "great-library" });
    // Fixed RNG puts Law in the offered three, without revealing the rest publicly.
    const expected = s.boxTokens.indexOf("law");
    if (expected >= 3)
      [s.boxTokens[0], s.boxTokens[expected]] = [
        s.boxTokens[expected],
        s.boxTokens[0],
      ];
    s = engine.applyAction(
      s,
      seats[0].id,
      {
        type: "wonders-play",
        slot: 19,
        mode: "wonder",
        wonder: "great-library",
      },
      () => 0.99,
    );
  }
  if (!validateWondersState(s)) throw Error("invalid late-game fixture");
  return s;
}
