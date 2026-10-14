import {
  COLORS,
  type Action,
  type Camel,
  type Color,
  type PublicPlayer,
  type Settlement,
  type Ticket,
  type Tile,
  type View,
  type MovementTrace,
} from "../../shared/types.js";
interface Player extends Omit<PublicPlayer, "connected"> {
  cards: Color[];
  bets: { color: Color; side: string }[];
}
interface FinalBet {
  playerId: string;
  color: Color;
}
export interface GameState {
  phase: "playing" | "settling" | "finished";
  players: Player[];
  turn: number;
  leg: number;
  stacks: Record<number, Camel[]>;
  tiles: Record<number, Tile>;
  available: Record<Color, number[]>;
  dice: (Color | "grey")[];
  final: { winner: FinalBet[]; loser: FinalBet[] };
  lastRoll?: { camel: Camel; value: number; die: string };
  settlements: Settlement[];
  lastMovement?: MovementTrace;
  pending?: {
    finish: boolean;
    ranking: Color[];
    claims: Record<string, number>;
  };
  winners?: string[];
  finalResults?: {
    side: string;
    playerId: string;
    color: Color;
    amount: number;
  }[];
}
export type Random = () => number;
const pick = (n: number, r: Random) => Math.floor(r() * n);
const racing = (c: Camel): c is Color => COLORS.includes(c as Color);
const available = () =>
  Object.fromEntries(COLORS.map((c) => [c, [5, 3, 2, 2]])) as Record<
    Color,
    number[]
  >;
export function createInitialState(
  players: { id: string; name: string }[],
  random: Random,
  startingPlayerId = players[0]?.id,
): GameState {
  if (players.length < 3 || players.length > 8)
    throw Error("ต้องมีผู้เล่น 3–8 คน");
  const s: GameState = {
    phase: "playing",
    players: players.map((p) => ({
      ...p,
      money: 3,
      tickets: [],
      pyramids: 0,
      cards: [...COLORS],
      bets: [],
    })),
    turn: players.findIndex((p) => p.id === startingPlayerId),
    leg: 1,
    stacks: {},
    tiles: {},
    available: available(),
    dice: [...COLORS, "grey"],
    final: { winner: [], loser: [] },
    settlements: [],
  };
  if (s.turn < 0) throw Error("เลือกผู้เริ่มเกมจากผู้เล่นในห้อง");
  // Setup stacking is arbitrary in the rulebook; shuffle colors uniformly on the server.
  const order: Camel[] = [...COLORS];
  for (let i = order.length - 1; i > 0; i--) {
    const j = pick(i + 1, random);
    [order[i], order[j]] = [order[j], order[i]];
  }
  for (const c of order) {
    const p = 1 + pick(3, random);
    (s.stacks[p] ??= []).push(c);
  }
  for (const c of ["black", "white"] as const) {
    const p = 16 - pick(3, random);
    (s.stacks[p] ??= []).push(c);
  }
  return s;
}
export function ranking(s: GameState): Color[] {
  return Object.entries(s.stacks)
    .sort(([a], [b]) => Number(b) - Number(a))
    .flatMap(([, cs]) => [...cs].reverse().filter(racing));
}
const locate = (s: GameState, c: Camel) => {
  for (const [p, cs] of Object.entries(s.stacks)) {
    const i = cs.indexOf(c);
    if (i >= 0) return { position: Number(p), index: i, stack: cs };
  }
  throw Error("ไม่พบอูฐ");
};
export function crazyCamel(s: GameState, rolled: "black" | "white"): Camel {
  const b = locate(s, "black"),
    w = locate(s, "white");
  if (b.position === w.position && Math.abs(b.index - w.index) === 1)
    return b.index > w.index ? "black" : "white";
  const carries = (x: ReturnType<typeof locate>) =>
    x.stack.slice(x.index + 1).some(racing);
  if (carries(b) !== carries(w)) return carries(b) ? "black" : "white";
  return rolled;
}
export function move(s: GameState, camel: Camel, value: number): boolean {
  const from = locate(s, camel);
  const unit = from.stack.splice(from.index);
  const path = Array.from(
    { length: value },
    (_, i) => from.position + (racing(camel) ? 1 : -1) * (i + 1),
  );
  let tileEffect: MovementTrace["tile"];
  if (!from.stack.length) delete s.stacks[from.position];
  const dir = racing(camel) ? 1 : -1;
  let to = from.position + dir * value;
  // Crossing is immediate; spectator tiles cannot pull a unit back after crossing.
  let finish = to > 16 || to < 1,
    under = false;
  if (!finish && s.tiles[to]) {
    const tile = s.tiles[to];
    tileEffect = { position: to, owner: tile.owner, direction: tile.direction };
    s.players.find((p) => p.id === tile.owner)!.money++;
    to += dir * tile.direction;
    path.push(to);
    under = tile.direction === -1;
    finish = to > 16 || to < 1;
  }
  s.stacks[to] = under
    ? [...unit, ...(s.stacks[to] ?? [])]
    : [...(s.stacks[to] ?? []), ...unit];
  s.lastMovement = {
    camel,
    unit: [...unit],
    from: from.position,
    fromIndex: from.index,
    path,
    to,
    under,
    destinationStack: [...s.stacks[to]],
    tile: tileEffect,
  };
  return finish;
}
export function ticketValue(t: Ticket, rank: Color[]): number {
  return t.color === rank[0] ? t.value : t.color === rank[1] ? 1 : -1;
}
function finishSettlement(s: GameState) {
  const pending = s.pending!;
  const rank = pending.ranking;
  const changes = s.players.map((p) => {
    const amount =
      p.pyramids +
      p.tickets.reduce((sum, t) => sum + ticketValue(t, rank), 0) +
      (pending.claims[p.id] ?? 0);
    const before = p.money;
    p.money = Math.max(0, p.money + amount);
    return { id: p.id, amount: p.money - before };
  });
  s.settlements.push({ leg: s.leg, ranking: rank, changes });
  if (pending.finish) {
    s.finalResults = [];
    for (const side of ["winner", "loser"] as const) {
      let correct = 0;
      const target = side === "winner" ? rank[0] : rank[4];
      for (const bet of s.final[side]) {
        const amount =
          bet.color === target ? ([8, 5, 3, 2][correct++] ?? 1) : -1;
        const p = s.players.find((p) => p.id === bet.playerId)!;
        const before = p.money;
        p.money = Math.max(0, p.money + amount);
        s.finalResults.push({ side, ...bet, amount: p.money - before });
      }
    }
    s.phase = "finished";
    const max = Math.max(...s.players.map((p) => p.money));
    s.winners = s.players.filter((p) => p.money === max).map((p) => p.id);
  } else {
    s.phase = "playing";
    s.leg++;
    s.available = available();
    s.dice = [...COLORS, "grey"];
    s.tiles = {};
  }
  s.players.forEach((p) => {
    p.tickets = [];
    p.pyramids = 0;
    delete p.partner;
  });
  delete s.pending;
}
function beginSettlement(s: GameState, finish: boolean) {
  s.pending = { finish, ranking: ranking(s), claims: {} };
  if (s.players.some((p) => p.partner)) {
    s.phase = "settling";
  } else finishSettlement(s);
}
export function getLegalActions(s: GameState, id: string): Action[] {
  const p = s.players.find((p) => p.id === id);
  if (!p) return [];
  if (s.phase === "settling") {
    if (!p.partner || Object.hasOwn(s.pending!.claims, id)) return [];
    const partner = s.players.find((x) => x.id === p.partner)!;
    return [
      { type: "claim", ticket: -1 },
      ...partner.tickets.map((_, ticket) => ({
        type: "claim" as const,
        ticket,
      })),
      ...(partner.pyramids
        ? [{ type: "claim" as const, ticket: partner.tickets.length }]
        : []),
    ];
  }
  if (s.phase !== "playing" || s.players[s.turn].id !== id) return [];
  const result: Action[] = [{ type: "roll" }];
  for (const c of COLORS)
    if (s.available[c].length) result.push({ type: "leg", color: c });
  for (const c of p.cards)
    for (const side of ["winner", "loser"] as const)
      result.push({ type: "final", color: c, side });
  const others = Object.entries(s.tiles)
    .filter(([, t]) => t.owner !== id)
    .map(([n]) => Number(n));
  for (let position = 2; position <= 16; position++)
    if (
      !s.stacks[position]?.length &&
      !s.tiles[position] &&
      !others.some((n) => Math.abs(n - position) <= 1)
    )
      for (const direction of [1, -1] as const)
        result.push({ type: "tile", position, direction });
  if (s.players.length >= 6 && !p.partner)
    for (const other of s.players)
      if (other.id !== id && !other.partner)
        result.push({ type: "partner", playerId: other.id });
  return result;
}
function actionMatches(a: Action, b: Action): boolean {
  return (
    Object.keys(a).every((k) => (a as any)[k] === (b as any)[k]) &&
    Object.keys(b).every((k) => Object.hasOwn(a, k))
  );
}
export function applyAction(
  state: GameState,
  id: string,
  action: Action,
  random: Random,
): GameState {
  if (!getLegalActions(state, id).some((a) => actionMatches(a, action)))
    throw Error("ทำรายการไม่ได้ ตรวจตาปัจจุบันและตัวเลือกที่ยังเหลือ");
  const s = structuredClone(state),
    p = s.players.find((p) => p.id === id)!;
  if (action.type === "claim") {
    const partner = s.players.find((x) => x.id === p.partner)!;
    s.pending!.claims[id] =
      action.ticket === -1
        ? 0
        : action.ticket === partner.tickets.length
          ? 1
          : ticketValue(partner.tickets[action.ticket], s.pending!.ranking);
    if (
      s.players
        .filter((x) => x.partner)
        .every((x) => Object.hasOwn(s.pending!.claims, x.id))
    )
      finishSettlement(s);
    return s;
  }
  if (action.type === "leg")
    p.tickets.push({
      color: action.color,
      value: s.available[action.color].shift()!,
    });
  if (action.type === "final") {
    p.cards.splice(p.cards.indexOf(action.color), 1);
    p.bets.push({ color: action.color, side: action.side });
    s.final[action.side].push({ playerId: id, color: action.color });
  }
  if (action.type === "tile") {
    for (const [n, t] of Object.entries(s.tiles))
      if (t.owner === id) delete s.tiles[Number(n)];
    s.tiles[action.position] = { owner: id, direction: action.direction };
  }
  if (action.type === "partner") {
    p.partner = action.playerId;
    s.players.find((x) => x.id === action.playerId)!.partner = id;
  }
  let finish = false;
  if (action.type === "roll") {
    const die = s.dice.splice(pick(s.dice.length, random), 1)[0];
    let value: number, camel: Camel;
    if (die === "grey") {
      const face = pick(6, random);
      value = (face % 3) + 1;
      camel = crazyCamel(s, face < 3 ? "white" : "black");
    } else {
      value = pick(3, random) + 1;
      camel = die;
    }
    p.pyramids++;
    s.lastRoll = { die, camel, value };
    finish = move(s, camel, value);
  }
  s.turn = (s.turn + 1) % s.players.length;
  if (finish || s.dice.length === 1) beginSettlement(s, finish);
  return s;
}
export function getDisplayView(
  s: GameState,
  code: string,
  revision: number,
): View {
  return structuredClone({
    gameId: "camel-up",
    code,
    revision,
    phase: s.phase,
    players: s.players.map(({ cards, bets, ...p }) => ({
      ...p,
      connected: false,
    })),
    turn: s.players[s.turn].id,
    leg: s.leg,
    stacks: s.stacks,
    tiles: s.tiles,
    available: s.available,
    dice: s.dice,
    pyramidRemaining: s.phase === "finished" ? 0 : s.dice.length - 1,
    finalCounts: { winner: s.final.winner.length, loser: s.final.loser.length },
    lastRoll: s.lastRoll,
    settlements: s.settlements,
    winners: s.winners,
    finalResults: s.finalResults,
  });
}
export function getPlayerView(
  s: GameState,
  id: string,
): NonNullable<View["me"]> {
  const p = s.players.find((p) => p.id === id)!;
  return structuredClone({
    id,
    cards: p.cards,
    bets: p.bets,
    legal: getLegalActions(s, id),
  });
}
export const isFinished = (s: GameState) => s.phase === "finished";
