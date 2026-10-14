import { metadata, supportsPlayers } from "../shared/catalog.js";
import { validateAzulState } from "../games/azul/validation.js";
export function validateRoomRecord(r: any): boolean {
  const g = metadata(r?.gameId);
  if (
    !g ||
    !/^[A-Z2-9]{6}$/.test(r.code) ||
    !Number.isSafeInteger(r.revision) ||
    r.revision < 0 ||
    !Number.isFinite(r.updated) ||
    !Array.isArray(r.players) ||
    r.players.length > g.maxPlayers ||
    new Set(r.players.map((p: any) => p.id)).size !== r.players.length ||
    !r.players.every(
      (p: any) => typeof p.id === "string" && typeof p.name === "string",
    )
  )
    return false;
  if (
    !Array.isArray(r.sessions) ||
    !r.sessions.every(
      (s: any) =>
        /^[a-f0-9]{64}$/.test(s.token) &&
        ["host", "player"].includes(s.role) &&
        Array.isArray(s.receipts) &&
        s.receipts.length <= 512 &&
        (s.role === "host" || r.players.some((p: any) => p.id === s.playerId)),
    )
  )
    return false;
  if ([r.game, r.duel, r.azul].filter(Boolean).length > 1) return false;
  const s = r.game ?? r.duel ?? r.azul;
  if (!s) return true;
  if (
    !supportsPlayers(g, r.players.length) ||
    !Array.isArray(s.players) ||
    s.players.length !== r.players.length ||
    new Set(s.players.map((p: any) => p.id)).size !== s.players.length ||
    !s.players.every((p: any) =>
      r.players.some((seat: any) => seat.id === p.id),
    )
  )
    return false;
  if (r.azul) return r.gameId === "azul" && validateAzulState(s);
  if (r.game) {
    if (
      r.gameId !== "camel-up" ||
      !["playing", "settling", "finished"].includes(s.phase) ||
      !s.stacks ||
      !Number.isSafeInteger(s.turn) ||
      s.turn < 0 ||
      s.turn >= s.players.length
    )
      return false;
    const camels = Object.values(s.stacks).flat();
    if (
      camels.length !== 7 ||
      new Set(camels).size !== 7 ||
      !["blue", "green", "yellow", "purple", "red", "black", "white"].every(
        (c) => camels.includes(c),
      )
    )
      return false;
    return (
      s.players.every(
        (p: any) =>
          Number.isSafeInteger(p.money) &&
          p.money >= 0 &&
          Array.isArray(p.cards) &&
          Array.isArray(p.bets) &&
          Array.isArray(p.tickets),
      ) &&
      Array.isArray(s.dice) &&
      s.final &&
      Array.isArray(s.final.winner) &&
      Array.isArray(s.final.loser) &&
      Array.isArray(s.settlements)
    );
  }
  if (
    r.gameId !== "dracula-vs-van-helsing" ||
    !["playing", "results", "finished"].includes(s.phase) ||
    !Number.isSafeInteger(s.hp) ||
    s.hp < 0 ||
    s.hp > 12 ||
    !Number.isSafeInteger(s.round) ||
    s.round < 1 ||
    s.round > 5 ||
    !s.players.some((p: any) => p.id === s.turn) ||
    !["draw", "discard", "effect"].includes(s.step) ||
    !Array.isArray(s.ranking) ||
    s.ranking.length !== 4 ||
    new Set(s.ranking).size !== 4 ||
    !["red", "yellow", "green", "purple"].every((c) => s.ranking.includes(c)) ||
    !s.players.every(
      (p: any) => Array.isArray(p.cards) && p.cards.length === 5,
    ) ||
    !["dracula", "helsing"].every((c) =>
      s.players.some((p: any) => p.character === c),
    ) ||
    !Array.isArray(s.deck) ||
    !Array.isArray(s.discard) ||
    !Array.isArray(s.vampires) ||
    s.vampires.length !== 5 ||
    s.vampires.some((n: any) => !Number.isSafeInteger(n) || n < 0 || n > 4)
  )
    return false;
  const cards = [
    ...s.deck,
    ...s.discard,
    ...s.players.flatMap((p: any) => p.cards),
    ...(s.drawn ? [s.drawn] : []),
  ];
  return (
    cards.length === 32 &&
    cards.every(
      (c) =>
        ["red", "yellow", "green", "purple"].includes(c.suit) &&
        Number.isSafeInteger(c.value) &&
        c.value >= 1 &&
        c.value <= 8 &&
        typeof c.revealed === "boolean",
    ) &&
    new Set(cards.map((c) => `${c.suit}:${c.value}`)).size === 32
  );
}
