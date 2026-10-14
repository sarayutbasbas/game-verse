import { TILE_COLORS, WALL, type AzulState } from "./types.js";
// Restore guard: reject malformed state before projecting or accepting actions.
export function validateAzulState(value: unknown): value is AzulState {
  try {
    const s = value as AzulState;
    const integer = (n: number) => Number.isSafeInteger(n) && n >= 0;
    if (!s || !["playing", "results", "finished"].includes(s.phase) || !integer(s.round) || s.round < 1 ||
        !Array.isArray(s.players) || s.players.length < 2 || s.players.length > 4 || new Set(s.players.map(p => p.id)).size !== s.players.length ||
        !s.players.some(p => p.id === s.turn) || !s.players.some(p => p.id === s.starter) ||
        (s.firstPlayer !== undefined && !s.players.some(p => p.id === s.firstPlayer)) ||
        !Array.isArray(s.factories) || s.factories.length !== 2 * s.players.length + 1 ||
        s.factories.some(f => !Array.isArray(f) || f.length > 4) ||
        !Array.isArray(s.center) || !Array.isArray(s.bag) || !Array.isArray(s.discard) ||
        !Array.isArray(s.settlements) || s.settlements.length !== s.round - (s.phase === "playing" ? 1 : 0)) return false;
    const tiles = [...s.bag, ...s.discard, ...s.factories.flat(), ...s.center];
    let markers = 0;
    for (const p of s.players) {
      if (typeof p.id !== "string" || typeof p.name !== "string" || !integer(p.score) ||
          !Array.isArray(p.pattern) || p.pattern.length !== 5 || !Array.isArray(p.wall) || p.wall.length !== 5 ||
          p.wall.some(r => !Array.isArray(r) || r.length !== 5 || r.some(x => typeof x !== "boolean")) ||
          !Array.isArray(p.floor) || p.floor.length > 7) return false;
      for (let row = 0; row < 5; row++) {
        const line = p.pattern[row];
        if (!line || !integer(line.count) || line.count > row + 1 ||
            (line.count === 0 ? line.color !== null : !TILE_COLORS.includes(line.color!)) ||
            (line.color && p.wall[row][WALL[row].indexOf(line.color)])) return false;
        if (line.color) tiles.push(...Array(line.count).fill(line.color));
        for (let col = 0; col < 5; col++) if (p.wall[row][col]) tiles.push(WALL[row][col]);
      }
      for (const tile of p.floor) {
        if (tile === "first") { markers++; if (s.firstPlayer !== p.id) return false; }
        else tiles.push(tile);
      }
      if (s.phase !== "playing" && p.floor.length) return false;
    }
    if (markers > 1 || tiles.length !== 100 || tiles.some(c => !TILE_COLORS.includes(c)) ||
        TILE_COLORS.some(c => tiles.filter(t => t === c).length !== 20)) return false;
    if (s.phase !== "playing" && (s.center.length || s.factories.some(f => f.length))) return false;
    if (s.phase === "finished" && (!s.players.some(p => p.wall.some(r => r.every(Boolean))) ||
        !s.winners?.length || !s.winners.every(id => s.players.some(p => p.id === id)) || !s.bonus || s.bonus.length !== s.players.length)) return false;
    return true;
  } catch { return false; }
}
