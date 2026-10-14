import { avatar } from "./account.js";
import { AZUL_TILES, AZUL_ART } from "./azul-assets.js";
import { TILE_COLORS, TILE_NAMES, TILE_SYMBOL, WALL, FLOOR_PENALTIES, type TileColor, type AzulView, type AzulSettlement } from "../games/azul/types.js";
export const esc = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
export const sourceName = (source: number) => source === -1 ? "กลางโต๊ะ" : `โรงงาน ${source + 1}`;
export function Tile(color?: TileColor | "first", ghost = false, preview = false) {
  const label = color === "first" ? "ผู้เริ่มรอบถัดไป" : color ? TILE_NAMES[color] : "ช่องว่าง";
  return `<span class="az-tile ${color ?? "empty"} ${ghost ? "ghost" : ""} ${preview ? "preview" : ""}" role="img" aria-label="${label}${ghost ? " • ยังไม่วาง" : ""}${preview ? " • ยังไม่ยืนยัน" : ""}">${color ? `<img src="${color === "first" ? AZUL_ART.marker : AZUL_TILES[color]}" width="256" height="256" alt="" aria-hidden="true" draggable="false"><span class="az-tile-symbol" aria-hidden="true">${color === "first" ? "1" : TILE_SYMBOL[color]}</span>` : '<span aria-hidden="true">·</span>'}</span>`;
}
export function ScoreTrack(score: number) {
  const start = Math.floor(score / 10) * 10;
  return `<div class="az-score-track" aria-label="คะแนนจริง ${score} แทร็กช่วง ${start} ถึง ${start + 10}"><span class="az-track-label">แทร็ก ${start}–${start + 10}</span><div>${Array.from({ length: 11 }, (_, i) => `<span class="${score === start + i ? "score-marker" : ""}" ${score === start + i ? 'aria-current="true"' : ""}>${start + i}</span>`).join("")}</div></div>`;
}
export function PatternLines(p: AzulView["players"][number], interactive: boolean) {
  return `<div class="az-pattern">${p.pattern.map((line, row) => `<div class="az-pattern-row" data-row="${row}">${interactive ? `<button class="az-row-target" data-target="${row}" disabled aria-label="แถว ${row + 1}"><span class="az-row-label">${row + 1}</span><span class="az-spaces">` : `<span class="az-row-label">${row + 1}</span><span class="az-spaces">`}${Array.from({ length: row + 1 }, (_, i) => `<span class="az-slot" data-empty="${i < row + 1 - line.count}">${Tile(i >= row + 1 - line.count ? line.color! : undefined)}</span>`).join("")}</span>${interactive ? "</button>" : ""}</div>`).join("")}</div>`;
}
export function WallGrid(p: AzulView["players"][number]) {
  return `<div class="az-wall" aria-label="ผนังของ ${esc(p.name)}">${WALL.map((row, r) => row.map((color, c) => `<span data-wall="${r}-${c}" data-filled="${p.wall[r][c]}">${Tile(color, !p.wall[r][c])}</span>`).join("")).join("")}</div>`;
}
export function FloorLine(p: AzulView["players"][number], view: AzulView, interactive: boolean) {
  return `<div class="az-floor"><div class="az-floor-heading"><h3>พื้น • ค่าปรับ</h3>${interactive ? '<button class="az-floor-target" data-target="-1" disabled>ลงพื้นทั้งหมด</button>' : ""}</div><div class="az-floor-slots">${FLOOR_PENALTIES.map((penalty, i) => `<span class="az-floor-cell"><small>−${penalty}</small><span class="az-slot" data-empty="${!p.floor[i]}">${Tile(p.floor[i])}</span></span>`).join("")}</div>${view.firstPlayer === p.id && !p.floor.includes("first") ? `<p class="az-held-marker">${Tile("first")}ถือ marker • เริ่มรอบถัดไป</p>` : ""}</div>`;
}
export function PlayerBoard(p: AzulView["players"][number], v: AzulView) {
  const own = p.id === v.me?.id, active = v.phase === "playing" && p.id === v.turn;
  const interactive = own && v.phase === "playing";
  return `<article class="az-player ${active ? "current" : ""}" data-player="${p.id}"><header>${avatar(p)}<div><h2>${esc(p.name)}${own ? " (คุณ)" : ""}</h2><p>${p.connected ? "เชื่อมต่อแล้ว" : "หลุด • รอกลับเข้าห้อง"}${v.firstPlayer === p.id ? " • เริ่มรอบหน้า" : ""}</p>${active ? '<span class="az-turn-flag">ถึงตาผู้เล่นนี้</span>' : ""}</div><strong class="az-score">${p.score}<small>คะแนน</small></strong></header>${ScoreTrack(p.score)}<div class="az-board-head"><span>แถวเตรียม 1–5</span><span>ผนัง • ช่องจางยังว่าง</span></div><div class="az-board">${PatternLines(p, interactive)}${WallGrid(p)}</div>${FloorLine(p, v, interactive)}</article>`;
}
export function OfferGroups(tiles: TileColor[], source: number, grouped = false) {
  return TILE_COLORS.map(color => {
    const count = tiles.filter(c => c === color).length;
    if (!count) return "";
    return `<button class="az-offer" data-source="${source}" data-color="${color}" aria-pressed="false" disabled aria-label="${sourceName(source)} ${TILE_NAMES[color]} ${count} ชิ้น"><span class="az-offer-tiles">${Array.from({ length: grouped ? 1 : count }, () => Tile(color)).join("")}</span>${count > 1 || grouped ? `<strong class="az-tile-count">×${count}</strong>` : ""}</button>`;
  }).join("") || '<span class="az-empty">หมดแล้ว</span>';
}
export function FactoryDisplay(tiles: TileColor[], index: number) {
  return `<section class="az-factory"><h3>โรงงาน ${index + 1}<small>${tiles.length}/4</small></h3><div class="az-factory-disc">${OfferGroups(tiles, index)}</div></section>`;
}
export function RoundSummary(view: AzulView, result: AzulSettlement) {
  return `<section class="az-round-summary"><h3>รอบ ${result.round}</h3>${result.players.map(p => `<article><h4>${esc(view.players.find(player => player.id === p.id)?.name)}</h4><div class="az-round-placements">${p.placements.map(t => `<div>${Tile(t.color)}<span>แถว ${t.row + 1} → ผนัง ${t.row + 1},${t.column + 1}</span><strong>+${t.points}</strong></div>`).join("") || "<p>ไม่มีแถวที่เต็มในรอบนี้</p>"}</div><p class="az-round-total">ก่อนปู <b>${p.before}</b><span>พื้น −${p.penalty}</span><strong>หลังรอบ ${p.after}</strong></p></article>`).join("")}</section>`;
}
export function FinalResults(v: AzulView, host: boolean, blocked: boolean) {
  const winner = v.bonus!.find(b => v.winners!.includes(b.id))!;
  const tied = v.bonus!.some(b => !v.winners!.includes(b.id) && b.total === winner.total);
  const reason = v.winners!.length > 1 ? "ชนะร่วม • คะแนนรวมและจำนวนแถวครบเท่ากัน" : tied ? "คะแนนรวมเท่ากัน • ตัดสินด้วยจำนวนแถวแนวนอนที่ครบ" : "ตัดสินด้วยคะแนนรวมสูงสุด";
  return `<section class="az-results"><h2>โบนัสท้ายเกม</h2><p>${reason}</p><div class="az-final-grid">${v.bonus!.map(b => `<article class="${v.winners!.includes(b.id) ? "az-final-winner" : ""}"><h3>${esc(v.players.find(p => p.id === b.id)?.name)}${v.winners!.includes(b.id) ? " • ผู้ชนะ" : ""}</h3><dl><div><dt>ก่อนโบนัส</dt><dd>${v.settlements!.at(-1)!.players.find(p => p.id === b.id)!.after}</dd></div><div><dt>แถวครบ</dt><dd>${b.rows} × 2</dd></div><div><dt>คอลัมน์ครบ</dt><dd>${b.columns} × 7</dd></div><div><dt>สีครบ</dt><dd>${b.colors} × 10</dd></div><div><dt>โบนัสรวม</dt><dd>+${b.points}</dd></div><div class="az-final-total"><dt>คะแนนรวม</dt><dd>${b.total}</dd></div></dl></article>`).join("")}</div>${host ? `<button id="az-restart" ${blocked || v.players.some(p => !p.connected) ? "disabled" : ""}>เล่นอีกครั้ง</button>` : "<p>รอผู้สร้างห้องกดเล่นอีกครั้ง</p>"}</section>`;
}
