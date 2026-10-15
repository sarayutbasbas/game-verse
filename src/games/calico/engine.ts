import {
  COLORS,
  PATTERNS,
  GOALS,
  CATS,
  CAT_PAIRS,
  PATCH_CELLS,
  GOAL_CELLS,
  printedBorder,
  neighbors,
  key,
  hasShape,
  type Patch,
  type Hex,
  type GoalId,
  type CatId,
} from "./data.js";
import type {
  CalicoState,
  CalicoAction,
  QuiltPlayer,
  CalicoView,
  Breakdown,
} from "./types.js";
export const shuffle = <T>(values: readonly T[], random: () => number): T[] => {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
export const tiles = (): Patch[] =>
  COLORS.flatMap((color) =>
    PATTERNS.flatMap((pattern) =>
      Array.from({ length: 3 }, (_, i) => ({
        id: `${color}-${pattern}-${i}`,
        color,
        pattern,
      })),
    ),
  );
export function emptyPlayer(id: string, name: string, board = 0): QuiltPlayer {
  return {
    id,
    name,
    board,
    patches: {},
    hand: [],
    goals: [],
    options: [],
    draft: [],
    confirmed: false,
    awards: [],
    rainbow: false,
  };
}
export function createInitialState(
  seats: { id: string; name: string }[],
  random: () => number,
  starter?: string,
  preset: "standard" | "first" = "standard",
): CalicoState {
  if (
    seats.length < 1 ||
    seats.length > 4 ||
    new Set(seats.map((p) => p.id)).size !== seats.length
  )
    throw Error("Calico ต้องมีผู้เล่น 1–4 คน");
  if (starter !== undefined && !seats.some((p) => p.id === starter))
    throw Error("ผู้เริ่มต้องอยู่ในห้อง");
  const bag = shuffle(tiles(), random),
    patterns = shuffle(PATTERNS, random);
  const selected: CatId[] =
    preset === "first"
      ? ["millie", "tibbit", "coconut"]
      : [1, 2, 3].map((group) => {
          const pairs = CAT_PAIRS.filter(
            (pair) => CATS[pair[0]].group === group,
          );
          const pair = pairs[Math.floor(random() * pairs.length)];
          return pair[Math.floor(random() * 2)];
        });
  const boards = shuffle([0, 1, 2, 3], random);
  const players = seats.map((p, i) => {
    const player = emptyPlayer(p.id, p.name, boards[i]);
    player.hand = bag.splice(0, 2);
    player.options =
      preset === "first"
        ? ["triples", "different", "pairs"]
        : shuffle(Object.keys(GOALS) as GoalId[], random).slice(0, 4);
    if (preset === "first") {
      player.goals = [...player.options];
      player.draft = [...player.goals];
      player.confirmed = true;
    }
    return player;
  });
  return {
    mode: seats.length === 1 ? "solo" : "multiplayer",
    removed: [],
    phase: preset === "first" ? "playing" : "setup",
    preset,
    step: "place",
    turn: starter ? seats.findIndex((p) => p.id === starter) : 0,
    players,
    bag,
    market: bag.splice(0, 3),
    cats: selected.map((id, i) => ({
      id,
      patterns: patterns.slice(i * 2, i * 2 + 2),
    })),
    placements: 0,
    winners: [],
    sequence: 0,
  };
}
export function boardTiles(p: QuiltPlayer): Record<string, Patch> {
  return { ...printedBorder(p.board), ...p.patches };
}
export function components(
  board: Record<string, Patch>,
  field: "color" | "pattern",
): { value: string; cells: Hex[]; keys: Set<string> }[] {
  const seen = new Set<string>(),
    result = [];
  for (const [start, tile] of Object.entries(board)) {
    if (seen.has(start)) continue;
    const queue = [start];
    const keys = new Set<string>();
    seen.add(start);
    for (let i = 0; i < queue.length; i++) {
      const here = queue[i];
      keys.add(here);
      const [q, r] = here.split(",").map(Number);
      for (const h of neighbors({ q, r })) {
        const k = key(h);
        if (!seen.has(k) && board[k]?.[field] === tile[field]) {
          seen.add(k);
          queue.push(k);
        }
      }
    }
    result.push({
      value: tile[field],
      keys,
      cells: [...keys].map((k) => {
        const [q, r] = k.split(",").map(Number);
        return { q, r };
      }),
    });
  }
  return result;
}
export function grantAwards(s: CalicoState, p: QuiltPlayer, placed: string) {
  const board = boardTiles(p),
    before = p.awards.length;
  for (const component of components(board, "color")) {
    if (
      !component.keys.has(placed) ||
      component.cells.length < 3 ||
      p.awards.some((a) => a.kind === "button" && component.keys.has(a.at))
    )
      continue;
    p.awards.push({
      kind: "button",
      id: board[placed].color,
      at: placed,
      awardId: `${p.id}:button:${s.sequence + 1}`,
      cells: [...component.keys].sort(),
      sequence: s.sequence + 1,
    });
  }
  for (const component of components(board, "pattern")) {
    if (
      !component.keys.has(placed) ||
      p.awards.some((a) => a.kind === "cat" && component.keys.has(a.at))
    )
      continue;
    const cat = s.cats.find((c) => c.patterns.includes(board[placed].pattern));
    if (!cat) continue;
    const spec = CATS[cat.id];
    const matches =
      "size" in spec
        ? component.cells.length >= spec.size
        : hasShape(component.cells, spec.shape);
    if (matches)
      p.awards.push({
        kind: "cat",
        id: cat.id,
        at: placed,
        pattern: board[placed].pattern,
        awardId: `${p.id}:cat:${s.sequence + 1}`,
        cells: [...component.keys].sort(),
        sequence: s.sequence + 1,
      });
  }
  if (
    !p.rainbow &&
    COLORS.every((color) =>
      p.awards.some((a) => a.kind === "button" && a.id === color),
    )
  ) {
    p.rainbow = true;
    p.rainbowAward = {
      awardId: `${p.id}:rainbow`,
      at: placed,
      cells: [placed],
      sequence: s.sequence + 1,
    };
  }
  return p.awards.slice(before);
}
export function scorePlayer(s: CalicoState, p: QuiltPlayer): Breakdown {
  const board = boardTiles(p);
  const cats = s.cats.map((c) => {
    const count = p.awards.filter(
      (a) => a.kind === "cat" && a.id === c.id,
    ).length;
    return { id: c.id, count, points: count * CATS[c.id].points };
  });
  const buttons = [...COLORS, "rainbow" as const].map((id) => {
    const count =
      id === "rainbow"
        ? Number(p.rainbow)
        : p.awards.filter((a) => a.kind === "button" && a.id === id).length;
    return { id, count, points: count * 3 };
  });
  const goals = p.goals.map((id, i) => {
    const adjacent = neighbors(GOAL_CELLS[i]).map((h) => board[key(h)]);
    const complete = adjacent.every(Boolean);
    const matches = (field: "color" | "pattern") => {
      if (!complete) return false;
      const counts = new Map<string, number>();
      for (const tile of adjacent)
        counts.set(tile[field], (counts.get(tile[field]) ?? 0) + 1);
      return (
        [...counts.values()].sort((a, b) => b - a).join(",") ===
        GOALS[id].counts.join(",")
      );
    };
    const color = matches("color"),
      pattern = matches("pattern");
    return {
      id,
      color,
      pattern,
      complete,
      points:
        color && pattern
          ? GOALS[id].both
          : color || pattern
            ? GOALS[id].one
            : 0,
    };
  });
  const earned =
    cats.reduce((n, c) => n + c.points, 0) +
    buttons.reduce((n, b) => n + b.points, 0);
  return {
    cats,
    buttons,
    goals,
    earned,
    total: earned + goals.reduce((n, g) => n + g.points, 0),
    catCount: cats.reduce((n, c) => n + c.count, 0),
    buttonCount: buttons.reduce((n, b) => n + b.count, 0),
  };
}
export function determineWinners(s: CalicoState) {
  const ranked = s.players
    .map((p) => ({ id: p.id, ...scorePlayer(s, p) }))
    .sort(
      (a, b) =>
        b.total - a.total ||
        b.catCount - a.catCount ||
        b.buttonCount - a.buttonCount,
    );
  return ranked
    .filter(
      (p) =>
        p.total === ranked[0].total &&
        p.catCount === ranked[0].catCount &&
        p.buttonCount === ranked[0].buttonCount,
    )
    .map((p) => p.id);
}
export function getLegalActions(s: CalicoState, id: string): CalicoAction[] {
  const p = s.players.find((p) => p.id === id);
  if (!p || s.phase === "finished") return [];
  if (s.phase === "setup")
    return p.confirmed
      ? []
      : [{ type: "calico-goals", goals: p.draft, confirm: false }];
  if (s.players[s.turn].id !== id) return [];
  return s.step === "draft"
    ? s.market.map((_, index) => ({ type: "calico-draft", index }))
    : p.hand.flatMap((tile) =>
        PATCH_CELLS.filter((h) => !p.patches[key(h)]).map((hex) => ({
          type: "calico-place" as const,
          tileId: tile.id,
          hex,
        })),
      );
}
export function applyAction(
  state: CalicoState,
  id: string,
  action: CalicoAction,
  _random?: () => number,
): CalicoState {
  const p0 = state.players.find((p) => p.id === id);
  if (!p0) throw Error("ไม่ได้อยู่ในเกมนี้");
  const keys = Object.keys(action).sort().join(",");
  if (action.type === "calico-goals") {
    if (
      state.phase !== "setup" ||
      p0.confirmed ||
      keys !== "confirm,goals,type" ||
      typeof action.confirm !== "boolean" ||
      !Array.isArray(action.goals) ||
      action.goals.length > 3 ||
      new Set(action.goals).size !== action.goals.length ||
      action.goals.some((g) => !p0.options.includes(g)) ||
      (action.confirm && action.goals.length !== 3)
    )
      throw Error("เลือกเป้าหมาย 3 ชิ้นจากตัวเลือกของคุณ");
    const s = structuredClone(state),
      p = s.players.find((p) => p.id === id)!;
    p.draft = [...action.goals];
    if (action.confirm) {
      p.goals = [...p.draft];
      p.confirmed = true;
    }
    if (s.players.every((p) => p.confirmed)) s.phase = "playing";
    s.sequence++;
    s.event = { sequence: s.sequence, kind: action.type, actor: id };
    return s;
  }
  if (state.phase !== "playing" || state.players[state.turn].id !== id)
    throw Error("ยังไม่ใช่ตาของคุณ");
  const s = structuredClone(state),
    p = s.players[s.turn];
  let at: string | undefined, awards;
  let marketCycle: NonNullable<CalicoState["event"]>["marketCycle"];
  if (action.type === "calico-place") {
    if (
      keys !== "hex,tileId,type" ||
      s.step !== "place" ||
      !action.hex ||
      Object.keys(action.hex).sort().join(",") !== "q,r" ||
      !Number.isSafeInteger(action.hex.q) ||
      !Number.isSafeInteger(action.hex.r) ||
      !PATCH_CELLS.some((h) => key(h) === key(action.hex))
    )
      throw Error("เลือกช่องว่างบนผ้าห่มที่วางได้");
    at = key(action.hex);
    const i = p.hand.findIndex((t) => t.id === action.tileId);
    if (i < 0 || p.patches[at])
      throw Error("ช่องนี้มีผ้าแล้ว หรือไม่มีชิ้นนี้ในมือ");
    p.patches[at] = p.hand.splice(i, 1)[0];
    awards = grantAwards(s, p, at);
    s.placements++;
    s.step = "draft";
  } else if (action.type === "calico-draft") {
    if (
      keys !== "index,type" ||
      s.step !== "draft" ||
      !Number.isInteger(action.index) ||
      action.index < 0 ||
      action.index >= 3
    )
      throw Error("เลือกผ้าจากตลาด 1 ชิ้น");
    const taken = s.market[action.index];
    p.hand.push(taken);
    if (s.mode === "solo") {
      const remaining = s.market.filter((_, i) => i !== action.index);
      const discarded = remaining.shift()!;
      const refilled = s.bag.splice(0, 2);
      if (refilled.length !== 2) throw Error("ถุงผ้าไม่ครบตามองค์ประกอบ");
      s.removed!.push(discarded);
      s.market = [...remaining, ...refilled];
      marketCycle = { taken, removed: [discarded], kept: remaining, refilled };
    } else {
      s.market[action.index] = s.bag.shift()!;
    }
    s.step = "place";
    if (s.players.every((p) => Object.keys(p.patches).length === 22)) {
      s.phase = "finished";
      s.winners = determineWinners(s);
    } else s.turn = (s.turn + 1) % s.players.length;
  } else throw Error("ไม่รองรับคำสั่งนี้");
  s.sequence++;
  s.event = {
    sequence: s.sequence,
    kind: action.type,
    actor: id,
    ...(at ? { at } : {}),
    ...(awards ? { awards } : {}),
    ...(marketCycle ? { marketCycle } : {}),
  };
  return s;
}
export const isFinished = (s: CalicoState) => s.phase === "finished";
export function getDisplayView(
  s: CalicoState,
  code: string,
  revision: number,
): CalicoView {
  return {
    gameId: "calico",
    code,
    revision,
    mode: s.mode ?? "multiplayer",
    removedCount: s.removed?.length ?? 0,
    phase: s.phase,
    step: s.step,
    preset: s.preset,
    turn: s.players[s.turn].id,
    players: s.players.map((p) => {
      const { options: _, draft: __, ...publicPlayer } = p;
      return { ...structuredClone(publicPlayer), score: scorePlayer(s, p) };
    }),
    cats: structuredClone(s.cats),
    market: structuredClone(s.market),
    bagCount: s.bag.length,
    round: Math.min(
      22,
      Math.floor(
        (s.placements - (s.phase === "playing" && s.step === "draft" ? 1 : 0)) /
          s.players.length,
      ) + 1,
    ),
    placements: s.placements,
    winners: [...s.winners],
    event: structuredClone(s.event),
  };
}
export function getPlayerView(s: CalicoState, id: string) {
  const p = s.players.find((p) => p.id === id)!;
  return {
    id,
    options: [...p.options],
    draft: [...p.draft],
    hand: structuredClone(p.hand),
    legal: getLegalActions(s, id),
  };
}
