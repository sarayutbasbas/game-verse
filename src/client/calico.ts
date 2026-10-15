import {
  COLORS,
  PATTERNS,
  CATS,
  GOALS,
  CELLS,
  BORDER_CELLS,
  GOAL_CELLS,
  printedBorder,
  key,
  toOffset,
  type Patch,
  type Hex,
  type GoalId,
  type CatId,
} from "../games/calico/data.js";
import type { CalicoView, QuiltPlayer } from "../games/calico/types.js";
import type { RoomAction } from "../shared/types.js";
import { bindRoomLinks } from "./ui.js";
import { avatar, platform } from "./account.js";
import "./calico.css";
const esc = (s: unknown) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const colorNames = {
  blue: "น้ำเงิน",
  cyan: "ฟ้า",
  green: "เขียว",
  yellow: "เหลือง",
  magenta: "ชมพู",
  purple: "ม่วง",
};
const patternNames = {
  dots: "จุด",
  stripes: "เส้น",
  flowers: "ดอกไม้",
  vines: "ใบเฟิร์น",
  quatrefoil: "สี่กลีบ",
  swirls: "เถาวัลย์",
};
const colorHex = {
  blue: "#294d83",
  cyan: "#248d9b",
  green: "#6c8a4d",
  yellow: "#e3af38",
  magenta: "#b74672",
  purple: "#775c91",
};
let draft:
  | {
      code: string;
      revision: number;
      tile?: string;
      hex?: Hex;
      market?: number;
    }
  | undefined;
let mutedTokens = false,
  expandedPlayer: string | undefined,
  tokenDetail: { player: string; index: number } | undefined;
let presented = { code: "", revision: -1, sequence: -1 };
let ready = false,
  loading: Promise<void> | undefined;
const art = Object.keys(CATS)
  .map((id) => `/art/calico/${id}.webp`)
  .concat(
    COLORS.map((c) => `/art/calico/${c}-button.webp`),
    ["/art/calico/rainbow-button.webp", "/art/calico/cloth.webp"],
  );
export function preloadCalicoArt() {
  return (loading ??= Promise.all(
    art.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = img.onerror = () => resolve();
          img.src = src;
        }),
    ),
  ).then(() => {
    ready = true;
  }));
}
const defs = () =>
  `<svg class="calico-defs" aria-hidden="true" width="0" height="0"><defs>${PATTERNS.map((p) => `<pattern id="calico-${p}" width="24" height="24" patternUnits="userSpaceOnUse" fill="#fff4e2" stroke="#fff4e2">${{ dots: '<circle cx="6" cy="6" r="2.7"/><circle cx="18" cy="18" r="2.7"/>', stripes: '<path d="M5 0V24M17 0V24" stroke-width="2.7"/>', flowers: '<path d="M12 5C2 -2 0 10 7 12C0 17 5 27 12 19C20 27 26 17 18 12C26 5 19 -2 12 5Z"/>', vines: '<path d="M12 0V24M12 8L5 3M12 14L3 9M12 20L3 15M12 11L21 5M12 17L22 11M12 23L21 17" stroke-width="1.8" fill="none"/>', quatrefoil: '<path d="M12 3C5 -3 0 5 5 10C-3 15 3 24 10 19C15 27 24 21 19 14C27 9 20 0 14 5Z" fill="none" stroke-width="2"/>', swirls: '<path d="M1 12C1 1 23 1 23 12S1 23 1 12M7 12C7 5 18 6 17 12S7 17 7 12" fill="none" stroke-width="1.6"/>' }[p]}</pattern>`).join("")}</defs></svg>`;
export const patchLabel = (t: Patch) =>
  `${colorNames[t.color]} ลาย${patternNames[t.pattern]}`;
function fabric(t: Patch, small = false) {
  return `<span class="fabric ${small ? "fabric-small" : ""}" style="--patch:${colorHex[t.color]}" data-pattern="${t.pattern}" data-color="${t.color}"><svg viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" fill="url(#calico-${t.pattern})"/></svg><span class="fabric-code">${COLORS.indexOf(t.color) + 1}${String.fromCharCode(65 + PATTERNS.indexOf(t.pattern))}</span></span>`;
}
const position = (h: Hex) => {
  const { q, row } = toOffset(h);
  return `left:${(40 + (q + 1) * 52.5) / 4}%;top:${(42 + (row + 1 + (q % 2 === 0 ? 0.5 : 0)) * 60.62) / 4.8}%`;
};
function goal(id: GoalId) {
  const g = GOALS[id];
  return `<span class="goal-letter goal-${id}">${g.label}</span><span class="goal-values">${g.one} / <b>${g.both}</b></span>`;
}
function quilt(
  p: CalicoView["players"][number],
  interactive: boolean,
  blocked: boolean,
) {
  const border = printedBorder(p.board);
  return `<div class="quilt" aria-label="ผ้าห่มของ ${esc(p.name)}"><div class="quilt-stitch"></div>${Object.entries(
    border,
  )
    .map(([k, t]) => {
      const [q, r] = k.split(",").map(Number);
      return `<div class="quilt-cell printed" style="${position({ q, r })}" title="ขอบพิมพ์ ${patchLabel(t)}">${fabric(t, true)}</div>`;
    })
    .join("")}${CELLS.map((h) => {
    const k = key(h),
      gi = GOAL_CELLS.findIndex((g) => key(g) === k),
      t = p.patches[k];
    const preview = interactive && draft?.hex && key(draft.hex) === k;
    const previewTile = preview
      ? p.hand.find((t) => t.id === draft?.tile)
      : undefined;
    if (gi >= 0)
      return `<div class="quilt-cell goal-cell" data-goal-slot="${gi}" style="${position(h)}">${p.goals[gi] ? goal(p.goals[gi]) : `<span>${gi + 1}</span>`}</div>`;
    const label = t
      ? patchLabel(t)
      : `ช่อง ${toOffset(h).q + 1},${toOffset(h).row + 1}`;
    return `<button type="button" class="quilt-cell patch-cell ${t ? "placed" : ""} ${preview ? "preview" : ""}" style="${position(h)}" data-hex="${k}" aria-label="${esc(label)}" ${!interactive || !!t || blocked || !draft?.tile ? "disabled" : ""}>${t ? fabric(t) : previewTile ? fabric(previewTile) : '<span class="empty-stitch">+</span>'}</button>`;
  }).join(
    "",
  )}<div class="quilt-awards ${mutedTokens ? "tokens-muted" : ""}">${awardsFor(
    p,
  )
    .map((a, i) => {
      const [q, r] = a.at.split(",").map(Number);
      return `<span class="quilt-award-group" style="${position({ q, r })}"><button class="quilt-award award-slot-${a.kind === "cat" ? 1 : a.id === "rainbow" ? 2 : 0}" data-award="${i}" data-award-at="${a.at}" data-award-player="${p.id}" aria-label="ดูรางวัล ${awardName(a)}"><img class="award-${a.kind === "cat" ? "cat" : "button"}" src="/art/calico/${a.id}${a.kind === "cat" ? "" : "-button"}.webp" width="44" height="44" alt=""></button></span>`;
    })
    .join("")}</div></div>`;
}
function awardsFor(p: CalicoView["players"][number]) {
  return [
    ...p.awards,
    ...(p.rainbowAward
      ? [{ kind: "button" as const, id: "rainbow" as const, ...p.rainbowAward }]
      : []),
  ];
}
function awardName(a: ReturnType<typeof awardsFor>[number]) {
  return a.kind === "cat"
    ? CATS[a.id as CatId].name
    : a.id === "rainbow"
      ? "กระดุมรุ้ง"
      : "กระดุม" + colorNames[a.id as keyof typeof colorNames];
}
function catShape(id: CatId) {
  const spec = CATS[id];
  if ("size" in spec)
    return `<strong class="cat-size">${spec.size}+</strong><span>ชิ้นลายเดียวเชื่อมกัน</span>`;
  const coords = spec.shape.map((h) => ({
    x: 22 + (h.q + h.r / 2) * 28,
    y: 22 + h.r * 25,
  }));
  const minX = Math.min(...coords.map((c) => c.x)) - 16,
    minY = Math.min(...coords.map((c) => c.y)) - 16;
  return `<svg class="cat-shape" viewBox="${minX} ${minY} ${Math.max(...coords.map((c) => c.x)) - minX + 16} ${Math.max(...coords.map((c) => c.y)) - minY + 16}" role="img" aria-label="รูปทรง ${spec.name} หมุนได้">${coords.map((c) => `<path d="M${c.x},${c.y - 15}l13,7.5v15l-13,7.5l-13,-7.5v-15Z"/>`).join("")}</svg><span>รูปนี้ หมุนได้</span>`;
}
function catCards(v: CalicoView) {
  return `<section class="cat-contracts" aria-label="เงื่อนไขแมว">${v.cats?.map((c) => `<details class="cat-contract"><summary><img src="/art/calico/${c.id}.webp" width="110" height="84" alt="แมว ${CATS[c.id].name}"><span><b>${CATS[c.id].name}</b><strong>${CATS[c.id].points} คะแนน</strong></span><span class="cat-mini-rule">${catShape(c.id)}</span><span class="cat-mini-patterns">${c.patterns.map((pattern) => `<span title="${patternNames[pattern]}">${fabric({ id: "pattern", color: "blue", pattern }, true)}</span>`).join("")}</span></summary><div class="cat-requirement">${catShape(c.id)}<div class="cat-patterns">${c.patterns.map((pattern) => `<span title="${patternNames[pattern]}">${fabric({ id: "pattern", color: "blue", pattern }, true)}<small>${patternNames[pattern]}</small></span>`).join("")}</div><p>ใช้ลายใดลายหนึ่ง พื้นที่เดิมรับแมวได้ครั้งเดียว รวมขอบพิมพ์ได้</p></div></details>`).join("")}</section>`;
}
function breakdown(p: CalicoView["players"][number], final: boolean) {
  const s = p.score;
  if (!s) return "";
  return `<div class="score-breakdown"><h3>${final ? "คะแนนรวม" : "รับจากแมวและปุ่มแล้ว"} <b>${final ? s.total : s.earned}</b></h3><div class="token-line">${s.cats.map((c) => `<span><img src="/art/calico/${c.id}.webp" alt="${CATS[c.id].name}" width="50" height="38">${c.count} × ${CATS[c.id].points}</span>`).join("")}${s.buttons
    .filter((b) => b.count)
    .map(
      (b) =>
        `<span><img src="/art/calico/${b.id}-button.webp" alt="${b.id}" width="30" height="30">${b.count} × 3</span>`,
    )
    .join(
      "",
    )}</div><details ${final ? "open" : ""}><summary>${final ? "เป้าหมายที่คิดคะแนนแล้ว" : "ประเมินเป้าหมาย • คิดคะแนนเมื่อจบเกม"}</summary><ul>${s.goals.map((g) => `<li><b>${GOALS[g.id].label}</b> ${!g.complete ? "ยังไม่ครบ 6 ช่อง" : `${g.color ? "✓" : "✕"} สี / ${g.pattern ? "✓" : "✕"} ลาย`} <strong>${g.points}</strong></li>`).join("")}</ul></details>${final ? `<table class="calico-score-table"><caption>รายละเอียดคะแนนแมวและปุ่ม</caption><thead><tr><th>ประเภท</th><th>จำนวน</th><th>คะแนน</th></tr></thead><tbody>${s.cats.map((c) => `<tr><th>${CATS[c.id].name}</th><td>${c.count}</td><td>${c.points}</td></tr>`).join("")}${s.buttons.map((b) => `<tr><th>ปุ่ม${b.id === "rainbow" ? "รุ้ง" : colorNames[b.id]}</th><td>${b.count}</td><td>${b.points}</td></tr>`).join("")}</tbody></table>` : ""}</div>`;
}
export function renderCalico(
  root: HTMLElement,
  v: CalicoView,
  host: boolean,
  blocked: boolean,
  command: (a: RoomAction) => void,
  snapshot = false,
) {
  if (!ready) {
    root.innerHTML = '<p role="status">กำลังเตรียมผ้าและแมว…</p>';
    void preloadCalicoArt().then(() => {
      if (root.isConnected && document.body.classList.contains("calico-theme"))
        renderCalico(root, v, host, blocked, command, true);
    });
    return;
  }
  if (draft?.code !== v.code) {
    expandedPlayer = undefined;
    tokenDetail = undefined;
  }
  if (draft?.code !== v.code || draft.revision !== v.revision)
    draft = { code: v.code, revision: v.revision };
  const own = v.players.find((p) => p.id === v.me?.id),
    isTurn = v.phase === "playing" && v.turn === own?.id,
    canPlace = isTurn && v.step === "place";
  const control =
    v.phase === "setup"
      ? own
        ? own.confirmed
          ? '<p class="setup-wait">ยืนยันเป้าหมายแล้ว รอผู้เล่นที่เหลือ</p>'
          : `<section class="goal-setup"><h2>จัดเป้าหมายผ้าห่ม</h2><p>เลือก 3 จาก 4 • ลำดับที่เลือกคือตำแหน่ง 1, 2, 3 บนผ้าห่ม</p><div class="goal-options">${v.me!.options.map((id) => `<button data-goal="${id}" aria-pressed="${v.me!.draft.includes(id)}" ${blocked ? "disabled" : ""}>${goal(id)}<small>${v.me!.draft.includes(id) ? "ตำแหน่ง " + (v.me!.draft.indexOf(id) + 1) : "เลือกเป้าหมาย"}</small></button>`).join("")}</div><button id="calico-confirm-goals" ${blocked || v.me!.draft.length !== 3 ? "disabled" : ""}>ยืนยันเป้าหมาย</button><p>ยืนยันแล้วเปลี่ยนไม่ได้</p></section>`
        : '<p class="setup-wait">ผู้เล่นกำลังจัดเป้าหมายของตนเอง</p>'
      : v.phase === "finished"
        ? `<section class="calico-finish"><h2>${v.mode === "solo" ? "จบผืนผ้าของคุณ · คะแนน Solo" : "ผู้ชนะ:"} ${v.mode === "solo" ? v.players[0].score?.total : v.winners?.map((id) => esc(v.players.find((p) => p.id === id)?.name)).join(" และ ")}</h2><p>รวมเป้าหมาย แมว และปุ่ม ${v.mode === "solo" ? "• Solo พื้นฐานบันทึกคะแนน ไม่ใช้ระดับผ่าน/ไม่ผ่าน" : "• เสมอดูจำนวนแมว แล้วจำนวนปุ่ม"}</p>${host ? `<label>ผู้เริ่มเกม (คนลูบแมวล่าสุด)<select id="calico-starter" name="calico-starter">${v.players.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select></label><button id="calico-restart" ${blocked || v.players.some((p) => !p.connected) ? "disabled" : ""}>เล่นอีกครั้ง</button>` : ""}</section>`
        : own
          ? `<section id="calico-controls"><div class="calico-turn"><h2>ขั้นตอนของคุณ</h2><p>${blocked ? "กำลังเชื่อมต่อหรือตรวจรายการ…" : isTurn ? (v.step === "place" ? "เลือกผ้าจากมือเพื่อวาง" : "เลือกผ้าจากตลาดเข้ามือ") : "กำลังเล่น: " + esc(v.players.find((p) => p.id === v.turn)?.name)}</p></div><div class="calico-hand" aria-label="มือของคุณ">${own.hand.map((t) => `<button data-hand="${t.id}" aria-label="เลือกผ้า ${patchLabel(t)}" aria-pressed="${draft?.tile === t.id}" ${!canPlace || blocked ? "disabled" : ""}>${fabric(t)}<span>${patchLabel(t)}</span></button>`).join("")}</div></section>`
          : "";
  const selectedPatch =
    own?.hand.find((t) => t.id === draft?.tile) ??
    v.market?.[draft?.market ?? -1];
  root.innerHTML = `<div class="calico-room ${own ? "" : "public-table"} calico-count-${v.players.length}">${defs()}<div class="calico-heading"><div><h1>Calico <span>ผืนผ้าของเรา</span></h1><p>${v.preset === "first" ? "เกมแรกตามคู่มือ" : "มาตรฐาน"} • ${v.mode === "solo" ? "Solo" : `${v.players.length} คน`} • รอบ ${v.round ?? 1}/22 • วางแล้ว ${v.placements ?? 0}/${22 * v.players.length} ชิ้น</p></div></div><div class="calico-market-dock">${v.phase === "playing" ? `<section class="market-tray"><h2>ตลาดผ้า <em class="market-phase">${isTurn ? (v.step === "place" ? "เลือกผ้าจากมือเพื่อวาง" : "เลือกผ้าจากตลาดเข้ามือ") : "รอเจ้าของตา"}</em><small>${v.bagCount ?? 0} ในถุง${v.mode === "solo" ? ` · นำออก ${v.removedCount ?? 0}` : ""}</small></h2><div class="calico-market">${v.market?.map((t, i) => `<button data-market="${i}" aria-label="เลือกตลาด ${i + 1} ${patchLabel(t)}" aria-pressed="${draft?.market === i}" ${blocked || !isTurn || v.step !== "draft" ? "disabled" : ""}>${fabric(t)}<span>${v.mode === "solo" ? `${i + 1} · ` : ""}${patchLabel(t)}</span></button>`).join("")}</div><p>${v.mode === "solo" ? "1 ไกลถุงที่สุด → 3 ใกล้ถุง · หยิบ 1 ทิ้งชิ้นไกลสุด 1 เลื่อนและเติม 2" : isTurn ? (v.step === "place" ? "เลือกผ้าจากมือเพื่อวางก่อน ตลาดจะเปิดให้หยิบหลังวาง" : "เลือกผ้าจากตลาดเข้ามือ") : "ตลาดร่วม · รอเจ้าของตา"}</p></section>` : ""}</div>${control}${v.event?.marketCycle ? `<p class="calico-cycle-note" role="status">ตลาดหมุนแล้ว: นำ${patchLabel(v.event.marketCycle.removed[0])}ออก เก็บผ้าที่เหลือไว้ช่อง 1 และเติมจากถุง 2 ชิ้นตามลำดับ</p>` : ""}${selectedPatch ? `<details class="tile-detail"><summary>ดูผ้าที่เลือกแบบขยาย</summary>${fabric(selectedPatch)}<strong>${patchLabel(selectedPatch)}</strong></details>` : ""}<div class="calico-table ${own ? "phone-quilts" : ""}"><aside class="sewing-tray">${catCards(v)}<button id="calico-token-opacity" aria-pressed="${mutedTokens}">ลดความทึบโทเคน</button></aside><div class="quilt-players ${expandedPlayer ? "has-expanded" : ""}">${[
    ...v.players,
  ]
    .sort((a, b) => Number(b.id === own?.id) - Number(a.id === own?.id))
    .map(
      (p) =>
        `<section class="quilt-player ${p.id === v.turn ? "active-quilter" : ""} ${expandedPlayer === p.id ? "expanded" : ""}" data-quilter="${p.id}"><div class="quilter-name">${avatar(p)}<div><h2>${esc(p.name)} ${p.id === own?.id ? "<small>ผ้าห่มของคุณ</small>" : ""}</h2><p>${p.connected ? "ออนไลน์" : "หลุด • รอกลับเข้า"} • ${Object.keys(p.patches).length}/22 ชิ้น</p></div><button data-expand="${p.id}" aria-pressed="${expandedPlayer === p.id}">${expandedPlayer === p.id ? "ย่อกระดาน" : "ขยายกระดาน"}</button></div>${quilt(v.phase === "setup" && p.id === own?.id && !p.confirmed ? { ...p, goals: v.me!.draft } : p, canPlace && p.id === own?.id, blocked)}${v.phase === "setup" ? `<p>${p.confirmed ? "ยืนยันเป้าหมายแล้ว" : "กำลังเลือกเป้าหมาย"}</p>` : ""}${!own || p.id !== own.id ? `<div class="public-hand"><span>มือเปิด</span>${p.hand.map((t) => `<span title="${patchLabel(t)}">${fabric(t, true)}</span>`).join("")}</div>` : ""}${breakdown(p, v.phase === "finished")}</section>`,
    )
    .join(
      "",
    )}</div></div>${draft.hex && draft.tile && canPlace ? `<div class="calico-confirm"><span>ตัวอย่าง • ยังไม่วางจริง</span><button id="calico-place" ${blocked ? "disabled" : ""}>ยืนยันวางผ้า</button><button id="calico-cancel" ${blocked ? "disabled" : ""}>ยกเลิก</button></div>` : draft.market !== undefined && isTurn && v.step === "draft" ? `<div class="calico-confirm"><span>เลือกตลาดช่อง ${draft.market + 1}</span><button id="calico-draft" ${blocked ? "disabled" : ""}>ยืนยันเลือกผ้า</button><button id="calico-cancel">ยกเลิก</button></div>` : ""}</div>`;
  root
    .querySelectorAll<HTMLImageElement>('img[src^="/art/calico/"]')
    .forEach((img) =>
      img.addEventListener(
        "error",
        () => {
          img.src = img.src.includes("-button.webp")
            ? "/art/calico/button-fallback.svg"
            : "/art/calico/cat-fallback.svg";
        },
        { once: true },
      ),
    );
  const confirmation = root.querySelector(".calico-confirm");
  if (confirmation)
    root.querySelector(".calico-market-dock")?.append(confirmation);
  const detailPlayer = v.players.find((p) => p.id === tokenDetail?.player),
    detailAward = detailPlayer
      ? [
          ...detailPlayer.awards,
          ...(detailPlayer.rainbowAward
            ? [
                {
                  kind: "button" as const,
                  id: "rainbow",
                  ...detailPlayer.rainbowAward,
                },
              ]
            : []),
        ][tokenDetail!.index]
      : undefined;
  if (detailAward) {
    const name =
      detailAward.kind === "cat"
        ? CATS[detailAward.id as CatId].name
        : detailAward.id === "rainbow"
          ? "กระดุมรุ้ง"
          : "กระดุม" + colorNames[detailAward.id as keyof typeof colorNames];
    const panel = document.createElement("section");
    panel.className = "calico-token-detail";
    panel.setAttribute("role", "status");
    panel.innerHTML = `<b>${esc(name)}</b><p>${detailAward.kind === "cat" ? "ได้จากกลุ่มลายเดียวตามเงื่อนไขแมว" : detailAward.id === "rainbow" ? "ได้กระดุมครบทั้ง 6 สี" : "ได้จากผ้าสีเดียวอย่างน้อย 3 ชิ้นติดกัน"}${detailAward.cells ? ` · กลุ่ม ${detailAward.cells.length} ช่อง` : ""} · ตำแหน่ง ${esc(detailAward.at)}</p><button id="calico-close-token">ปิดรายละเอียด</button>`;
    root.append(panel);
  }
  bindRoomLinks(root, platform.joinOrigin ?? location.origin);
  const rerender = () => {
    const active = document.activeElement as HTMLElement;
    const id = active?.id,
      hand = active?.dataset.hand,
      market = active?.dataset.market,
      expand = active?.dataset.expand,
      hex = active?.dataset.hex;
    renderCalico(root, v, host, blocked, command, true);
    const target = id
      ? root.querySelector<HTMLElement>("#" + CSS.escape(id))
      : hand
        ? root.querySelector<HTMLElement>(`[data-hand="${hand}"]`)
        : market
          ? root.querySelector<HTMLElement>(`[data-market="${market}"]`)
          : expand
            ? root.querySelector<HTMLElement>(`[data-expand="${expand}"]`)
            : hex
              ? root.querySelector<HTMLElement>(
                  `[data-hex="${hex}"]:not([disabled])`,
                )
              : null;
    target?.focus({ preventScroll: true });
  };
  root.querySelectorAll<HTMLButtonElement>("[data-award]").forEach(
    (b) =>
      (b.onclick = () => {
        tokenDetail = {
          player: b.dataset.awardPlayer!,
          index: Number(b.dataset.award),
        };
        rerender();
        root.querySelector<HTMLElement>("#calico-close-token")?.focus();
      }),
  );
  root.querySelector("#calico-close-token")?.addEventListener("click", () => {
    const prior = tokenDetail;
    tokenDetail = undefined;
    rerender();
    if (prior)
      root
        .querySelector<HTMLElement>(
          `[data-award-player="${prior.player}"][data-award="${prior.index}"]`,
        )
        ?.focus({ preventScroll: true });
  });
  root.querySelector("#calico-token-opacity")?.addEventListener("click", () => {
    mutedTokens = !mutedTokens;
    rerender();
  });
  root.querySelectorAll<HTMLButtonElement>("[data-expand]").forEach(
    (b) =>
      (b.onclick = () => {
        expandedPlayer =
          expandedPlayer === b.dataset.expand ? undefined : b.dataset.expand;
        rerender();
      }),
  );
  root.querySelectorAll<HTMLButtonElement>("[data-hand]").forEach(
    (b) =>
      (b.onclick = () => {
        draft!.tile = b.dataset.hand;
        draft!.hex = undefined;
        rerender();
      }),
  );
  root.querySelectorAll<HTMLButtonElement>("[data-hex]").forEach(
    (b) =>
      (b.onclick = () => {
        const [q, r] = b.dataset.hex!.split(",").map(Number);
        draft!.hex = { q, r };
        rerender();
      }),
  );
  root.querySelectorAll<HTMLButtonElement>("[data-market]").forEach(
    (b) =>
      (b.onclick = () => {
        draft!.market = Number(b.dataset.market);
        rerender();
      }),
  );
  root.querySelectorAll<HTMLButtonElement>("[data-goal]").forEach(
    (b) =>
      (b.onclick = () => {
        const id = b.dataset.goal as GoalId;
        const ids = [...v.me!.draft];
        const i = ids.indexOf(id);
        if (i >= 0) ids.splice(i, 1);
        else if (ids.length < 3) ids.push(id);
        command({ type: "calico-goals", goals: ids, confirm: false });
      }),
  );
  root
    .querySelector<HTMLButtonElement>("#calico-confirm-goals")
    ?.addEventListener("click", () =>
      command({ type: "calico-goals", goals: v.me!.draft, confirm: true }),
    );
  root
    .querySelector<HTMLButtonElement>("#calico-place")
    ?.addEventListener("click", () =>
      command({ type: "calico-place", tileId: draft!.tile!, hex: draft!.hex! }),
    );
  root
    .querySelector<HTMLButtonElement>("#calico-draft")
    ?.addEventListener("click", () =>
      command({ type: "calico-draft", index: draft!.market! }),
    );
  root
    .querySelector<HTMLButtonElement>("#calico-cancel")
    ?.addEventListener("click", () => {
      draft!.hex = undefined;
      draft!.market = undefined;
      rerender();
    });
  root.querySelector("#calico-restart")?.addEventListener("click", () =>
    command({
      type: "restart",
      startingPlayerId:
        root.querySelector<HTMLSelectElement>("#calico-starter")!.value,
    }),
  );
  if (
    !snapshot &&
    presented.code === v.code &&
    v.revision === presented.revision + 1 &&
    v.event &&
    v.event.sequence === presented.sequence + 1 &&
    ["calico-place", "calico-draft"].includes(v.event.kind) &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    const target =
      v.event.kind === "calico-place"
        ? root.querySelector(
            `[data-quilter="${v.event.actor}"] [data-hex="${v.event.at}"]`,
          )
        : root.querySelector(".market-tray");
    target?.animate(
      [
        { opacity: 0.45, transform: "scale(.94)" },
        { opacity: 1, transform: "scale(1)" },
      ],
      { duration: 240, easing: "ease-out" },
    );
    for (const award of v.event.awards ?? []) {
      const el = root.querySelector(
        `[data-quilter="${v.event.actor}"] [data-award-player="${v.event.actor}"][data-award-at="${award.at}"] .award-${award.kind === "cat" ? "cat" : "button"}`,
      );
      el?.animate(
        [
          { opacity: 0, transform: "scale(.6)" },
          { opacity: 1, transform: "scale(1)" },
        ],
        { duration: 300 },
      );
    }
    if (v.phase === "finished")
      root.querySelector(".calico-finish")?.animate(
        [
          { opacity: 0, transform: "translateY(8px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 320 },
      );
  }
  if (
    !snapshot &&
    own &&
    v.event &&
    presented.code === v.code &&
    v.revision === presented.revision + 1 &&
    v.event.sequence === presented.sequence + 1 &&
    isTurn
  ) {
    const target =
      v.step === "draft"
        ? root.querySelector(".market-tray")
        : root.querySelector("#calico-controls");
    requestAnimationFrame(() => {
      if (root.isConnected && innerWidth <= 700 && v.step !== "draft")
        target?.scrollIntoView({
          block: "start",
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        });
    });
  }
  if (
    !snapshot ||
    presented.code !== v.code ||
    v.revision !== presented.revision
  )
    presented = {
      code: v.code,
      revision: v.revision,
      sequence: v.event?.sequence ?? 0,
    };
}
