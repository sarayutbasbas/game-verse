import { CARDS, CARD, WONDERS, TOKENS, LAYOUTS } from "./data.js";
import type { WondersState } from "./types.js";
export function validateWondersState(value: unknown): value is WondersState {
  try {
    const s = value as WondersState;
    const integer = (n: unknown) => Number.isSafeInteger(n);
    if (
      !s ||
      !["setup", "playing", "finished"].includes(s.phase) ||
      ![1, 2, 3].includes(s.age) ||
      ![0, 1].includes(s.turn) ||
      ![0, 1].includes(s.starter) ||
      !integer(s.sequence) ||
      s.sequence < 0 ||
      !integer(s.draftStep) ||
      s.draftStep < 0 ||
      s.draftStep > 8 ||
      !integer(s.military) ||
      Math.abs(s.military) > 9 ||
      !Array.isArray(s.players) ||
      s.players.length !== 2
    )
      return false;
    if (
      !s.players.every(
        (p) =>
          typeof p.id === "string" &&
          typeof p.name === "string" &&
          integer(p.coins) &&
          p.coins >= 0 &&
          Array.isArray(p.buildings) &&
          Array.isArray(p.wonders) &&
          Array.isArray(p.tokens),
      ) ||
      s.players[0].id === s.players[1].id
    )
      return false;
    const cards = [
      ...s.removed,
      ...s.discard,
      ...s.layout.map((n) => n.card),
      ...Object.values(s.decks).flat(),
      ...s.players.flatMap((p) => [
        ...p.buildings,
        ...p.wonders.flatMap((w) => (w.card ? [w.card] : [])),
      ]),
    ];
    if (
      cards.length !== 73 ||
      new Set(cards).size !== 73 ||
      cards.some((id) => !Object.hasOwn(CARD, id))
    )
      return false;
    const ws = [
      ...s.wonderDeck,
      ...s.wonderPool,
      ...s.players.flatMap((p) => p.wonders.map((w) => w.id)),
    ];
    if (
      ws.length !== 12 ||
      new Set(ws).size !== 12 ||
      ws.some((id) => !WONDERS.some((w) => w.id === id))
    )
      return false;
    const ts = [
      ...s.boxTokens,
      ...s.progress,
      ...s.players.flatMap((p) => p.tokens),
    ];
    if (
      ts.length !== 10 ||
      new Set(ts).size !== 10 ||
      ts.some((id) => !TOKENS.includes(id))
    )
      return false;
    if (
      s.players.some(
        (p) =>
          p.wonders.length > 4 ||
          p.buildings.some((id) => !CARD[id]) ||
          p.wonders.some((w) => w.card && w.removed),
      ) ||
      s.players.flatMap((p) => p.wonders).filter((w) => w.card).length > 7
    )
      return false;
    if (
      new Set(s.layout.map((n) => n.slot)).size !== s.layout.length ||
      s.layout.some(
        (n) =>
          !LAYOUTS[s.age][n.slot] ||
          typeof n.faceUp !== "boolean" ||
          CARD[n.card].age !== s.age,
      )
    )
      return false;
    if (
      !Array.isArray(s.militaryUsed) ||
      new Set(s.militaryUsed).size !== s.militaryUsed.length ||
      s.militaryUsed.some((n) => ![-6, -3, 3, 6].includes(n)) ||
      typeof s.extra !== "boolean"
    )
      return false;
    if (
      s.pending &&
      (![
        "progress",
        "library",
        "discard",
        "destroy-brown",
        "destroy-grey",
        "starter",
      ].includes(s.pending.kind) ||
        s.pending.actor !== s.players[s.turn].id ||
        !Array.isArray(s.pending.options) ||
        !s.pending.options.length ||
        s.pending.options.some((x) => typeof x !== "string"))
    )
      return false;
    if (
      (s.phase === "setup" && (s.layout.length !== 0 || s.draftStep >= 8)) ||
      (s.phase !== "setup" && s.draftStep !== 8)
    )
      return false;
    for (const n of s.layout) {
      const slot = LAYOUTS[s.age][n.slot];
      const accessible = !slot.coveredBy.some((id) =>
        s.layout.some((x) => x.slot === id),
      );
      if ((slot.faceUp || accessible) && !n.faceUp) return false;
    }
    if (s.pending) {
      const d = s.pending,
        p = s.players[s.turn],
        other = s.players[1 - s.turn];
      if (new Set(d.options).size !== d.options.length) return false;
      const valid =
        d.kind === "starter"
          ? s.players.map((p) => p.id)
          : d.kind === "progress"
            ? s.progress
            : d.kind === "library"
              ? s.boxTokens
              : d.kind === "discard"
                ? s.discard.filter((id) => !p.buildings.includes(id))
                : other.buildings.filter(
                    (id) =>
                      CARD[id].color ===
                      (d.kind === "destroy-brown" ? "brown" : "grey"),
                  );
      if (
        d.options.some((id) => !(valid as readonly string[]).includes(id)) ||
        (d.kind === "library" && d.options.length !== 3)
      )
        return false;
    }
    if (
      !Array.isArray(s.winners) ||
      s.winners.some((id) => !s.players.some((p) => p.id === id)) ||
      (s.phase === "finished" &&
        (!s.winners.length ||
          !["military", "science", "civilian"].includes(s.victory!)))
    )
      return false;
    return CARDS.length === 73;
  } catch {
    return false;
  }
}
