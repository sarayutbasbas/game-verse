import {
  SEALS,
  CARDS,
  CARD,
  GOODS_TOKENS,
  BONUS_TOKENS,
  GOODS,
} from "./data.js";
import type { JaipurState } from "./types.js";
export function validateJaipurState(value: unknown): value is JaipurState {
  try {
    const s = value as JaipurState,
      int = (x: unknown) => Number.isSafeInteger(x);
    if (
      !s ||
      (s.matchId !== undefined && (typeof s.matchId !== "string" || s.matchId.length > 100 || !s.matchId.length)) ||
      !["playing", "results", "finished"].includes(s.phase) ||
      !int(s.round) ||
      s.round < 1 ||
      ![0, 1].includes(s.turn) ||
      !int(s.sequence) ||
      s.sequence < 0 ||
      !Array.isArray(s.players) ||
      s.players.length !== 2 ||
      s.players[0].id === s.players[1].id ||
      !s.players.every(
        (p) =>
          typeof p.id === "string" &&
          typeof p.name === "string" &&
          Array.isArray(p.hand) &&
          p.hand.length <= 7 &&
          p.hand.every((c) => c.kind !== "camel") &&
          Array.isArray(p.herd) &&
          p.herd.every((c) => c.kind === "camel") &&
          int(p.seals) &&
          p.seals >= 0 &&
          p.seals <= 2,
      )
    )
      return false;
    const cards = [
      ...s.deck,
      ...s.market,
      ...s.discard,
      ...s.players.flatMap((p) => [...p.hand, ...p.herd]),
    ];
    if (
      cards.length !== 55 ||
      new Set(cards.map((c) => c.id)).size !== 55 ||
      cards.some(
        (c) => !Object.hasOwn(CARD, c.id) || c.kind !== CARD[c.id].kind,
      ) ||
      s.market.length > 5 ||
      (s.phase === "playing" && s.market.length !== 5)
    )
      return false;
    const goods = [
        ...Object.values(s.goods).flat(),
        ...s.players.flatMap((p) => p.goods),
      ],
      bonus = [
        ...Object.values(s.bonus).flat(),
        ...s.players.flatMap((p) => p.bonus),
      ];
    if (
      goods.length !== 38 ||
      new Set(goods.map((t) => t.id)).size !== 38 ||
      goods.some(
        (t) =>
          !GOODS_TOKENS.some(
            (x) => x.id === t.id && x.kind === t.kind && x.value === t.value,
          ),
      )
    )
      return false;
    if (
      bonus.length !== 18 ||
      new Set(bonus.map((t) => t.id)).size !== 18 ||
      bonus.some(
        (t) =>
          !BONUS_TOKENS.some(
            (x) => x.id === t.id && x.size === t.size && x.value === t.value,
          ),
      )
    )
      return false;
    for (const kind of GOODS) {
      if (
        !Array.isArray(s.goods[kind]) ||
        s.goods[kind].some(
          (t, i) =>
            t.kind !== kind || (i > 0 && s.goods[kind][i - 1].value < t.value),
        )
      )
        return false;
      const expected = GOODS_TOKENS.filter((t) => t.kind === kind)
        .slice(-s.goods[kind].length || GOODS_TOKENS.length)
        .map((t) => t.id);
      if (
        s.goods[kind].length &&
        JSON.stringify(expected) !==
          JSON.stringify(s.goods[kind].map((t) => t.id))
      )
        return false;
    }
    for (const size of [3, 4, 5] as const)
      if (
        !Array.isArray(s.bonus[size]) ||
        s.bonus[size].some((t) => t.size !== size)
      )
        return false;
    if (
      !Array.isArray(s.history) ||
      s.history.length !== (s.phase === "playing" ? s.round - 1 : s.round) ||
      s.history.some(
        (r, i) =>
          r.round !== i + 1 ||
          !["tokens", "deck"].includes(r.reason) ||
          !["money", "bonus", "goods", "draw"].includes(r.tieBreak) ||
          r.scores.length !== 2 ||
          r.scores.some(
            (x) =>
              !s.players.some((p) => p.id === x.id) ||
              !int(x.total) ||
              x.total !== x.goods + x.bonus + x.camel,
          ),
      )
    )
      return false;
    const awarded = s.history.filter((r) => r.winner);
    if (awarded.some((r, i) => r.sealId !== SEALS[i])) return false;
    if (
      s.players.some(
        (p) => p.seals !== s.history.filter((r) => r.winner === p.id).length,
      )
    )
      return false;
    if (
      !Array.isArray(s.winners) ||
      (s.phase === "finished"
        ? s.winners.length !== 1 ||
          !s.players.some((p) => p.id === s.winners[0] && p.seals === 2)
        : s.winners.length !== 0 || s.players.some((p) => p.seals >= 2))
    )
      return false;
    if (
      s.event &&
      (s.event.sequence !== s.sequence ||
        (!(s.event.actor === "host" && s.event.kind === "jaipur-next") &&
          !s.players.some((p) => p.id === s.event!.actor)))
    )
      return false;
    return CARDS.length === 55;
  } catch {
    return false;
  }
}
