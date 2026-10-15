import type { RoomView } from "../shared/types.js";
/** Text is derived solely from the authorized projection, including non-turn phases. */
export function turnStatus(v: RoomView) {
  if (v.phase === "lobby") return { text: "รอผู้เล่น", own: false };
  if (v.phase === "finished") return { text: "จบเกม", own: false };
  if (v.phase === "results") return { text: "สรุปผลรอบ", own: false };
  if (v.phase === "settling" || (v.gameId === "calico" && v.phase === "setup"))
    return { text: "เลือกพร้อมกัน", own: false };
  const actor =
    v.gameId === "seven-wonders-duel" ? (v.pending?.actor ?? v.turn) : v.turn;
  const own = !!actor && actor === v.me?.id;
  const name = v.players.find((p) => p.id === actor)?.name;
  return { text: own ? "ตาคุณ" : name ? "ตา " + name : "รอผู้เล่น", own };
}
