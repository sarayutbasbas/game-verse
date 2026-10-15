import { tiles, scorePlayer, determineWinners, boardTiles } from "./engine.js";
import { PATCH_CELLS, GOALS, CATS, GOAL_CELLS, PATTERNS, key } from "./data.js";
import type { CalicoState } from "./types.js";
export function validateCalicoState(value: unknown): value is CalicoState {
  try {
    const s = value as CalicoState;
    if (
      !s ||
      !["setup", "playing", "finished"].includes(s.phase) ||
      !["place", "draft"].includes(s.step) ||
      !["standard", "first"].includes(s.preset) ||
      !Array.isArray(s.players) ||
      s.players.length < 1 ||
      s.players.length > 4 ||
      new Set(s.players.map((p) => p.id)).size !== s.players.length ||
      new Set(s.players.map((p) => p.board)).size !== s.players.length ||
      !Number.isSafeInteger(s.turn) ||
      s.turn < 0 ||
      s.turn >= s.players.length ||
      !Array.isArray(s.bag) ||
      !Array.isArray(s.market) ||
      s.market.length !== 3 ||
      !Array.isArray(s.cats) ||
      s.cats.length !== 3 ||
      !Number.isSafeInteger(s.placements) ||
      !Number.isSafeInteger(s.sequence) ||
      s.sequence < 0
    )
      return false;
    if (
      s.mode !== undefined &&
      (!["solo", "multiplayer"].includes(s.mode) ||
        (s.mode === "solo") !== (s.players.length === 1))
    )
      return false;
    if (s.mode === undefined && s.players.length !== 2) return false;
    if (s.mode !== undefined && !Array.isArray(s.removed)) return false;
    if (s.mode === "multiplayer" && s.removed!.length) return false;
    if (
      s.mode === "solo" &&
      s.removed!.length !==
        s.placements - (s.phase === "playing" && s.step === "draft" ? 1 : 0)
    )
      return false;
    const all = [...s.bag, ...s.market, ...(s.removed ?? [])],
      patterns = s.cats.flatMap((c) => c.patterns);
    if (
      patterns.length !== 6 ||
      new Set(patterns).size !== 6 ||
      patterns.some((p) => !PATTERNS.includes(p)) ||
      new Set(s.cats.map((c) => c.id)).size !== 3 ||
      s.cats.some(
        (c) =>
          !Object.hasOwn(CATS, c.id) ||
          !Array.isArray(c.patterns) ||
          c.patterns.length !== 2,
      )
    )
      return false;
    for (const p of s.players) {
      if (
        typeof p.id !== "string" ||
        typeof p.name !== "string" ||
        ![0, 1, 2, 3].includes(p.board) ||
        !p.patches ||
        !Array.isArray(p.hand) ||
        !Array.isArray(p.options) ||
        p.options.length < 3 ||
        p.options.length > 4 ||
        new Set(p.options).size !== p.options.length ||
        p.options.some((g) => !Object.hasOwn(GOALS, g)) ||
        !Array.isArray(p.goals) ||
        p.goals.some((g) => !p.options.includes(g)) ||
        new Set(p.goals).size !== p.goals.length ||
        (p.confirmed && p.goals.length !== 3) ||
        !Array.isArray(p.draft) ||
        p.draft.length > 3 ||
        new Set(p.draft).size !== p.draft.length ||
        p.draft.some((g) => !p.options.includes(g)) ||
        typeof p.confirmed !== "boolean" ||
        typeof p.rainbow !== "boolean" ||
        !Array.isArray(p.awards)
      )
        return false;
      const cells = Object.keys(p.patches);
      if (
        cells.length > 22 ||
        cells.some((k) => !PATCH_CELLS.some((h) => key(h) === k))
      )
        return false;
      const expectedHand =
        s.phase === "playing" &&
        s.players[s.turn].id === p.id &&
        s.step === "draft"
          ? 1
          : 2;
      if (p.hand.length !== expectedHand) return false;
      const board = boardTiles(p);
      if (
        new Set(p.awards.filter((a) => a.awardId).map((a) => a.awardId))
          .size !== p.awards.filter((a) => a.awardId).length
      )
        return false;
      for (const a of p.awards) {
        if (
          a.awardId !== undefined &&
          (typeof a.awardId !== "string" ||
            !Number.isSafeInteger(a.sequence) ||
            a.sequence! < 1 ||
            a.sequence! > s.sequence ||
            !Array.isArray(a.cells) ||
            !a.cells.includes(a.at) ||
            new Set(a.cells).size !== a.cells.length ||
            a.cells.some(
              (k) =>
                !board[k] ||
                (a.kind === "button"
                  ? board[k].color !== a.id
                  : board[k].pattern !== a.pattern),
            ))
        )
          return false;
        if (!p.patches[a.at] || !["button", "cat"].includes(a.kind))
          return false;
        if (
          (a.kind === "button" && p.patches[a.at].color !== a.id) ||
          (a.kind === "cat" &&
            (!s.cats.some((c) => c.id === a.id) ||
              p.patches[a.at].pattern !== a.pattern))
        )
          return false;
      }
      if (
        new Set(p.awards.map((a) => a.kind + ":" + a.at)).size !==
        p.awards.length
      )
        return false;
      if (
        p.rainbowAward &&
        (!p.rainbow ||
          !p.patches[p.rainbowAward.at] ||
          p.rainbowAward.awardId !== `${p.id}:rainbow`)
      )
        return false;
      if (s.phase !== "setup" && !p.confirmed) return false;
      all.push(...p.hand, ...Object.values(p.patches));
      scorePlayer(s, p);
    }
    const expected = new Map(tiles().map((t) => [t.id, t]));
    if (
      all.length !== 108 ||
      new Set(all.map((t) => t.id)).size !== 108 ||
      all.some(
        (t) =>
          !expected.has(t.id) ||
          t.color !== expected.get(t.id)!.color ||
          t.pattern !== expected.get(t.id)!.pattern,
      )
    )
      return false;
    if (
      s.placements !==
      s.players.reduce((n, p) => n + Object.keys(p.patches).length, 0)
    )
      return false;
    if (
      !Array.isArray(s.winners) ||
      (s.phase === "finished" &&
        (s.placements !== 22 * s.players.length ||
          s.step !== "place" ||
          JSON.stringify(s.winners) !== JSON.stringify(determineWinners(s))))
    )
      return false;
    if (s.phase !== "finished" && s.winners.length) return false;
    return GOAL_CELLS.length === 3;
  } catch {
    return false;
  }
}
