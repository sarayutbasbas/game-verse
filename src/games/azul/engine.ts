import { TILE_COLORS, TILE_NAMES, WALL, FLOOR_PENALTIES, type TileColor, type AzulState, type AzulAction, type AzulPlayer, type DraftOffer, type AzulBonus, type AzulView } from "./types.js";
export function emptyBoard(id: string, name: string): AzulPlayer {
  return { id, name, score: 0, pattern: Array.from({ length: 5 }, () => ({ color: null, count: 0 })), wall: Array.from({ length: 5 }, () => Array<boolean>(5).fill(false)), floor: [] };
}
function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const r = random();
    if (!Number.isFinite(r) || r < 0 || r >= 1) throw Error("Invalid random source");
    const j = Math.floor(r * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function refill(s: AzulState, random: () => number) {
  s.factories = Array.from({ length: s.players.length * 2 + 1 }, () => [] as TileColor[]);
  for (const factory of s.factories) for (let i = 0; i < 4; i++) {
    if (!s.bag.length && s.discard.length) {
      s.bag = shuffle(s.discard, random); s.discard = [];
    }
    if (s.bag.length) factory.push(s.bag.pop()!);
  }
  s.center = []; s.firstPlayer = undefined; s.turn = s.starter; s.phase = "playing";
  // Even an entirely empty offer ends drafting; never leave a turn with no actions.
  if (s.factories.every(f => !f.length)) settle(s);
}
export function createInitialState(seats: { id: string; name: string }[], random: () => number, starter?: string): AzulState {
  if (seats.length < 2 || seats.length > 4 || new Set(seats.map(p => p.id)).size !== seats.length) throw Error("Azul ต้องมีผู้เล่น 2–4 คน");
  if (starter && !seats.some(p => p.id === starter)) throw Error("ผู้เริ่มต้องอยู่ในห้อง");
  if (!starter) {
    const r = random(); if (!Number.isFinite(r) || r < 0 || r >= 1) throw Error("Invalid random source");
    starter = seats[Math.floor(r * seats.length)].id;
  }
  const s: AzulState = { phase: "playing", round: 1, players: seats.map(p => emptyBoard(p.id, p.name)), turn: starter, starter, factories: [], center: [], bag: shuffle(TILE_COLORS.flatMap(c => Array<TileColor>(20).fill(c)), random), discard: [], settlements: [] };
  refill(s, random); return s;
}
export function targetReason(p: AzulPlayer, color: TileColor, target: number): string {
  if (target === -1) return "";
  if (!Number.isInteger(target) || target < 0 || target > 4) return "เลือกแถว 1–5 หรือพื้น";
  const line = p.pattern[target];
  if (p.wall[target][WALL[target].indexOf(color)]) return "ผนังแถวนี้มีสีนี้แล้ว";
  if (line.color && line.color !== color) return "แถวนี้รับได้เฉพาะสีเดิม";
  if (line.count >= target + 1) return "แถวนี้เต็มแล้ว เลือกแถวอื่นหรือพื้น";
  return "";
}
export function getOffers(s: AzulState, actor: string): DraftOffer[] {
  const p = s.players.find(p => p.id === actor);
  if (!p || s.phase !== "playing" || s.turn !== actor) return [];
  return [...s.factories, s.center].flatMap((tiles, index) => TILE_COLORS.flatMap(color => {
    const count = tiles.filter(c => c === color).length;
    if (!count) return [];
    const source = index === s.factories.length ? -1 : index;
    return [{ source, color, count, targets: [-1, 0, 1, 2, 3, 4].map(target => {
      const reason = targetReason(p, color, target);
      const placed = reason || target === -1 ? 0 : Math.min(count, target + 1 - p.pattern[target].count);
      const marker = source === -1 && !s.firstPlayer;
      const space = Math.max(0, 7 - p.floor.length - (marker && p.floor.length < 7 ? 1 : 0));
      const floor = Math.min(count - placed, space);
      return { target, valid: !reason, reason, placed, floor, discarded: count - placed - floor, marker };
    }) }];
  }));
}
export function getLegalActions(s: AzulState, actor: string): AzulAction[] {
  if (!s.players.some(p => p.id === actor) || s.phase === "finished") return [];
  if (s.phase === "results") return [{ type: "next-round" }];
  return getOffers(s, actor).flatMap(o => o.targets.filter(t => t.valid).map(t => ({ type: "draft" as const, source: o.source, color: o.color, target: t.target })));
}
export function placementPoints(wall: boolean[][], row: number, column: number): number {
  const length = (dr: number, dc: number) => {
    let n = 1;
    for (const direction of [-1, 1]) {
      let r = row + dr * direction, c = column + dc * direction;
      while (r >= 0 && r < 5 && c >= 0 && c < 5 && wall[r][c]) { n++; r += dr * direction; c += dc * direction; }
    }
    return n;
  };
  const h = length(0, 1), v = length(1, 0);
  return h === 1 && v === 1 ? 1 : (h > 1 ? h : 0) + (v > 1 ? v : 0);
}
export function bonuses(p: AzulPlayer): AzulBonus {
  const rows = p.wall.filter(r => r.every(Boolean)).length;
  const columns = Array.from({ length: 5 }, (_, c) => p.wall.every(r => r[c])).filter(Boolean).length;
  const colors = TILE_COLORS.filter(color => p.wall.every((r, i) => r[WALL[i].indexOf(color)])).length;
  const points = rows * 2 + columns * 7 + colors * 10;
  return { id: p.id, rows, columns, colors, points, total: p.score + points };
}
export function settle(s: AzulState) {
  const result = { round: s.round, players: s.players.map(p => {
    const before = p.score, placements = [] as { row: number; column: number; color: TileColor; points: number }[];
    for (let row = 0; row < 5; row++) {
      const line = p.pattern[row];
      if (line.count !== row + 1) continue;
      const color = line.color!, column = WALL[row].indexOf(color);
      p.wall[row][column] = true;
      const points = placementPoints(p.wall, row, column); p.score += points;
      placements.push({ row, column, color, points });
      s.discard.push(...Array<TileColor>(row).fill(color));
      p.pattern[row] = { color: null, count: 0 };
    }
    const penalty = p.floor.reduce((sum, _, i) => sum + FLOOR_PENALTIES[i], 0);
    p.score = Math.max(0, p.score - penalty);
    s.discard.push(...p.floor.filter((c): c is TileColor => c !== "first")); p.floor = [];
    return { id: p.id, before, placements, penalty, after: p.score };
  }) };
  s.settlements.push(result); s.starter = s.firstPlayer ?? s.starter;
  if (s.players.some(p => p.wall.some(r => r.every(Boolean)))) {
    s.phase = "finished"; s.bonus = s.players.map(bonuses);
    for (const p of s.players) p.score = s.bonus.find(b => b.id === p.id)!.total;
    const max = Math.max(...s.players.map(p => p.score));
    const candidates = s.bonus.filter(b => b.total === max), rows = Math.max(...candidates.map(b => b.rows));
    s.winners = candidates.filter(b => b.rows === rows).map(b => b.id);
  } else s.phase = "results";
}
export function nextRound(state: AzulState, random: () => number): AzulState {
  if (state.phase !== "results") throw Error("ไปต่อได้เฉพาะช่วงผลรอบ");
  const s = structuredClone(state); s.round++; refill(s, random); s.lastAction = s.phase === "playing" ? "เริ่มรอบใหม่" : "ไม่มีสีกระเบื้องเหลือให้หยิบ คิดผลรอบแล้ว"; return s;
}
export function applyAction(state: AzulState, actor: string, action: AzulAction, random: () => number): AzulState {
  if (!action || !getLegalActions(state, actor).some(a => Object.keys(a).length === Object.keys(action).length && Object.entries(a).every(([k, v]) => (action as any)[k] === v))) throw Error("ทำรายการไม่ได้: ตรวจตา แหล่ง สี และแถวที่เลือก");
  if (action.type === "next-round") return nextRound(state, random);
  const s = structuredClone(state), p = s.players.find(p => p.id === actor)!;
  const tiles = action.source === -1 ? s.center : s.factories[action.source];
  const taken = tiles.filter(c => c === action.color), rest = tiles.filter(c => c !== action.color);
  if (action.source === -1) {
    s.center = rest;
    if (!s.firstPlayer) {
      s.firstPlayer = actor;
      if (p.floor.length < 7) p.floor.push("first");
      // User-approved web ruling: when full, firstPlayer holds it beside the board.
    }
  } else { s.factories[action.source] = []; s.center.push(...rest); }
  const count = taken.length;
  if (action.target !== -1) {
    const line = p.pattern[action.target], n = Math.min(taken.length, action.target + 1 - line.count);
    line.color = action.color; line.count += n; taken.splice(0, n);
  }
  for (const color of taken) { if (p.floor.length < 7) p.floor.push(color); else s.discard.push(color); }
  s.lastAction = `${p.name} หยิบ${TILE_NAMES[action.color]} ${count} ชิ้นจาก${action.source === -1 ? "กลางโต๊ะ" : `โรงงาน ${action.source + 1}`} ลง${action.target === -1 ? "พื้น" : `แถว ${action.target + 1}`}`;
  if (!s.center.length && s.factories.every(f => !f.length)) settle(s);
  else s.turn = s.players[(s.players.findIndex(p => p.id === actor) + 1) % s.players.length].id;
  return s;
}
export function getDisplayView(s: AzulState, code: string, revision: number): AzulView {
  return { gameId: "azul", code, revision, phase: s.phase, players: structuredClone(s.players).map(p => ({ ...p, connected: false, ready: true })), round: s.round, turn: s.turn, starter: s.starter, firstPlayer: s.firstPlayer, markerInCenter: s.phase === "playing" && !s.firstPlayer, factories: structuredClone(s.factories), center: [...s.center], bagCount: s.bag.length, discardCount: s.discard.length, settlements: structuredClone(s.settlements), bonus: s.bonus ? structuredClone(s.bonus) : undefined, winners: s.winners ? [...s.winners] : undefined, lastAction: s.lastAction };
}
export function getPlayerView(s: AzulState, id: string): NonNullable<AzulView["me"]> {
  if (!s.players.some(p => p.id === id)) throw Error("ไม่พบผู้เล่น");
  return { id, legal: getLegalActions(s, id), offers: getOffers(s, id) };
}
export const isFinished = (s: AzulState) => s.phase === "finished";
