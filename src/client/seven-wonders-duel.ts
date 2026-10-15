import {
  CARD,
  CARDS,
  WONDERS,
  TOKENS,
  TOKEN_NAMES,
  LAYOUTS,
  RESOURCES,
  type Effect,
  type Card,
  type Wonder,
  type Resource,
  type Token,
} from "../games/seven-wonders-duel/data.js";
import type { WondersView, Quote } from "../games/seven-wonders-duel/types.js";
import type { RoomAction } from "../shared/types.js";
import { roomCode, bindRoomLinks } from "./ui.js";
import { platform } from "./account.js";
import "./seven-wonders-duel.css";
const esc = (s: unknown) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const names: Record<Resource, string> = {
  wood: "ไม้",
  clay: "ดิน",
  stone: "หิน",
  glass: "แก้ว",
  papyrus: "กระดาษ",
};
const icons: Record<string, string> = {
  wood: "▤",
  clay: "▰",
  stone: "⬡",
  glass: "◇",
  papyrus: "▧",
  wheel: "☸",
  triangle: "△",
  quill: "✒",
  mortar: "♜",
  pendulum: "⚖",
  sundial: "◴",
  law: "§",
};
const resource = (r: Resource, n: number) =>
  `<span class="wd-resource wd-${r}" title="${names[r]}" aria-label="${names[r]} ${n}">${icons[r]}${n > 1 ? n : ""}</span>`;
const resources = (x: Partial<Record<Resource, number>>) =>
  RESOURCES.filter((r) => x[r])
    .map((r) => resource(r, x[r]!))
    .join("");
const tokenText: Record<Token, string> = {
  agriculture: "รับ 6 เหรียญ • 4 คะแนน",
  architecture: "สร้าง Wonder ลดทรัพยากร 2 หน่วย",
  economy: "รับเงินที่คู่แข่งซื้อทรัพยากรจากธนาคาร",
  law: "สัญลักษณ์วิทยาศาสตร์ชนิดที่เจ็ด §",
  masonry: "สร้างอาคารสีน้ำเงินลดทรัพยากร 2 หน่วย",
  mathematics: "3 คะแนนต่อ Progress ของคุณ รวมชิ้นนี้",
  philosophy: "7 คะแนน",
  strategy: "อาคารทหารใหม่เพิ่ม 1 โล่",
  theology: "Wonders ที่สร้างต่อจากนี้ได้เล่นอีกตา",
  urbanism: "รับ 6 เหรียญ • สร้างด้วยโซ่รับเพิ่ม 4 เหรียญ",
};
export function effectText(e: Effect) {
  return [
    e.points ? `${e.points} คะแนน` : "",
    e.coins ? `รับ ${e.coins} เหรียญ` : "",
    e.shields ? `ทหาร ${e.shields} โล่` : "",
    e.science ? `วิทยาศาสตร์ ${icons[e.science]}` : "",
    e.produce
      ? `ผลิต ${RESOURCES.filter((r) => e.produce?.[r])
          .map((r) => `${names[r]} ${e.produce![r]}`)
          .join(" / ")}`
      : "",
    e.flexible
      ? `ผลิต 1 หน่วย เลือก ${e.flexible.map((r) => names[r]).join(" / ")}`
      : "",
    e.discount
      ? `ซื้อ ${e.discount.map((r) => names[r]).join(" / ")} หน่วยละ 1 เหรียญ`
      : "",
    e.extra ? "เล่นอีกตา" : "",
    e.income
      ? `รับ ${e.income.rate} เหรียญต่อ${({ grey: "อาคารเทา", brown: "อาคารน้ำตาล", red: "อาคารแดง", yellow: "อาคารเหลือง", wonder: "Wonder" } as Record<string, string>)[e.income.kind]}`
      : "",
    e.guild
      ? `สมาคม: ${e.guild === "wonder" ? "2 คะแนนต่อ Wonder ของเมืองที่สร้างมากที่สุด" : e.guild === "treasury" ? "1 คะแนนต่อ 3 เหรียญของเมืองที่รวยที่สุด" : `รับเหรียญตอนสร้างและคะแนนตอนจบ ตามเมืองที่มี${({ materials: "อาคารน้ำตาลและเทารวม", blue: "อาคารน้ำเงิน", green: "อาคารเขียว", yellow: "อาคารเหลือง", red: "อาคารแดง" } as Record<string, string>)[e.guild]}มากที่สุด`}`
      : "",
    e.decision
      ? {
          library: "สุ่ม Progress ในกล่อง 3 ชิ้นให้คุณเลือกเป็นความลับ",
          discard: "สร้างอาคารหนึ่งใบจากกองทิ้งฟรี",
          "destroy-brown": "ทำลายอาคารน้ำตาลคู่แข่ง 1 ใบ",
          "destroy-grey": "ทำลายอาคารเทาคู่แข่ง 1 ใบ",
        }[e.decision]
      : "",
  ]
    .filter(Boolean)
    .join(" • ");
}
const art = (id: string) => `/art/seven-wonders-duel/${id}.webp?v=2`;
function face(c: Card | Wonder, large = false) {
  const color = "color" in c ? c.color : "wonder";
  return `<span class="wd-face wd-${color} ${large ? "wd-large" : ""}"><span class="wd-card-top">${c.points ? `<b>❧ ${c.points}</b>` : ""}${c.shields ? `<b>⚔ ${c.shields}</b>` : ""}${c.science ? `<b>${icons[c.science]}</b>` : ""}${c.produce ? resources(c.produce) : ""}${c.flexible ? `<b>${c.flexible.map((r) => icons[r]).join("/")}</b>` : ""}${c.coins ? `<b>◉ ${c.coins}</b>` : ""}${c.guild ? "<b>สมาคม</b>" : ""}${c.decision ? "<b>✦</b>" : ""}${c.extra ? "<b>↻</b>" : ""}${c.discount ? "<b>◉ 1</b>" : ""}</span><img src="${art(c.id)}" alt="" width="240" height="180" loading="eager"><span class="wd-card-name">${esc(c.name)}</span><span class="wd-card-cost">${resources(c.cost)}${"coinCost" in c && c.coinCost ? `<span>◉ ${c.coinCost}</span>` : ""}${"chainFrom" in c && c.chainFrom ? `<span title="สร้างฟรีด้วยโซ่ ${c.chainFrom}">⛓ ${c.chainFrom}</span>` : ""}${"chain" in c && c.chain ? `<span title="ให้โซ่ ${c.chain}">↪ ${c.chain}</span>` : ""}</span></span>`;
}
let selection:
  | {
      code: string;
      revision: number;
      slot?: number;
      inspect?: string;
      mode?: "build" | "discard" | "wonder";
      wonder?: string;
    }
  | undefined;
let artworkReady = false;
let artworkLoading: Promise<void> | undefined;
let afterArtwork: (() => void) | undefined;
function preload() {
  return Promise.all(
    [
      ...CARDS.map((c) => c.id),
      ...WONDERS.map((w) => w.id),
      ...TOKENS,
      "pawn",
      "military",
      "coin",
    ].map(
      (id) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = art(id);
        }),
    ),
  ).then(() => {
    artworkReady = true;
    afterArtwork?.();
  });
}
let previous:
  | {
      code: string;
      revision: number;
      sequence: number;
      age?: number;
      military?: number;
      coins: number[];
      progress: string[];
    }
  | undefined;
let capturedFlight:
  { node: HTMLElement; from: DOMRect; to: DOMRect } | undefined;
export function captureWondersMotion(
  root: HTMLElement,
  v: WondersView,
  snapshot: boolean,
) {
  capturedFlight = undefined;
  if (
    snapshot ||
    !previous ||
    previous.code !== v.code ||
    v.revision !== previous.revision + 1 ||
    v.event?.sequence !== previous.sequence + 1 ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  const slot = root.querySelector(`[data-slot="${v.event.slot}"]`),
    destination = root.querySelector(
      v.event.kind === "discard"
        ? ".wd-discard"
        : `[data-citizen="${v.event.actor}"]`,
    );
  if (slot && destination) {
    const from = slot.getBoundingClientRect(),
      to = destination.getBoundingClientRect();
    capturedFlight = { node: slot.cloneNode(true) as HTMLElement, from, to };
  }
}
export function renderWonders(
  root: HTMLElement,
  v: WondersView,
  host: boolean,
  blocked: boolean,
  command: (a: RoomAction) => void,
  snapshot = false,
) {
  if (!artworkReady) {
    afterArtwork = () => renderWonders(root, v, host, blocked, command, true);
    root.innerHTML =
      '<div class="wd-loading" role="status" aria-busy="true">กำลังเตรียมกระดานและภาพการ์ด…</div>';
    artworkLoading ??= preload();
    return;
  }
  if (
    !selection ||
    selection.code !== v.code ||
    selection.revision !== v.revision
  )
    selection = { code: v.code, revision: v.revision };
  const selected = selection,
    own = v.players.find((p) => p.id === v.me?.id),
    turn = v.players.find((p) => p.id === v.turn),
    canAct = !!v.me && v.turn === v.me.id && !blocked;
  const first = previous;
  const captured = capturedFlight;
  capturedFlight = undefined;
  const animate =
    !snapshot &&
    first?.code === v.code &&
    v.revision === first.revision + 1 &&
    v.event?.sequence === first.sequence + 1 &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches;
  previous = {
    code: v.code,
    revision: v.revision,
    sequence: v.sequence ?? 0,
    age: v.age,
    military: v.military,
    coins: v.players.map((p) => p.coins),
    progress: [...(v.progress ?? [])],
  };
  const redraw = () => {
    const active = document.activeElement as HTMLElement | null;
    const field = active?.dataset.mode
      ? "mode"
      : active?.dataset.slot
        ? "slot"
        : undefined;
    const value = field ? active?.dataset[field] : undefined;
    renderWonders(root, v, host, blocked, command, true);
    if (field && value)
      root
        .querySelector<HTMLElement>(`[data-${field}="${CSS.escape(value)}"]`)
        ?.focus({ preventScroll: true });
  };
  const setup = v.phase === "setup",
    finished = v.phase === "finished";
  const status = finished
    ? `จบเกม • ${v.victory === "military" ? "ชัยชนะทางทหาร" : v.victory === "science" ? "ชัยชนะทางวิทยาศาสตร์" : "คะแนนพลเรือน"}`
    : setup
      ? "เลือก Wonders คนละ 4 ใบ"
      : v.pending
        ? {
            starter: "เลือกผู้เริ่มยุค",
            progress: "เลือก Progress",
            library: "กำลังเลือก Progress ลับ",
            discard: "เลือกอาคารจากกองทิ้ง",
            "destroy-brown": "เลือกทำลายอาคารน้ำตาล",
            "destroy-grey": "เลือกทำลายอาคารเทา",
          }[v.pending.kind]
        : `ยุค ${v.age}`;
  const city = (p: (typeof v.players)[number], i: number) =>
    `<section class="wd-city" data-citizen="${p.id}"><h2><span>${esc(p.name)}${p.id === own?.id ? " (คุณ)" : ""}</span><b><img class="wd-coin" src="${art("coin")}" alt="เหรียญ" width="23" height="23"> <span data-coins="${p.id}">${p.coins}</span></b></h2><p class="wd-city-label">${p.id === v.turn && !finished ? "กำลังเล่น • " : ""}${p.connected ? "ออนไลน์" : "รอเชื่อมต่อ"} • ${p.buildings.length} อาคาร</p><div class="wd-production">${resources(
      p.production?.fixed ?? {},
    )}${p.production?.flexible.map((xs) => `<span class="wd-flex-resource" title="ผลิตได้หนึ่งหน่วยต่อชุด">1 × (${xs.map((r) => resource(r, 1)).join("/")})</span>`).join("") ?? ""}${p.buildings
      .filter((id) => CARD[id].science)
      .map(
        (id) =>
          `<span title="${esc(CARD[id].name)}">${icons[CARD[id].science!]}</span>`,
      )
      .join(
        "",
      )}${p.tokens.includes("law") ? "<span>§</span>" : ""}</div><div class="wd-city-wonders">${p.wonders.map((w) => `<button class="wd-wonder ${w.card ? "wd-built" : ""} ${w.removed ? "wd-removed" : ""}" data-inspect="${w.id}">${face(WONDERS.find((x) => x.id === w.id)!)}<strong>${w.card ? "✓ สร้างแล้ว" : w.removed ? "นำออกจากเกม" : "ยังไม่สร้าง"}</strong></button>`).join("")}</div><details ${own?.id === p.id ? "open" : ""}><summary>เมืองและ Progress ของ${esc(p.name)}</summary><div class="wd-city-cards">${p.buildings.map((id) => `<button data-inspect="${id}" title="${esc(CARD[id].name)}">${face(CARD[id])}</button>`).join("") || "<p>ยังไม่มีอาคาร</p>"}</div>${p.tokens.map((id) => `<p class="wd-owned-token"><b>${TOKEN_NAMES[id]}</b> ${tokenText[id]}</p>`).join("")}</details></section>`;
  root.innerHTML = `<div class="wd-root ${v.me ? "wd-controller" : "wd-display"}"><div class="wd-heading"><div><h1 translate="no">7 Wonders <em>Duel</em></h1><p role="status">${esc(status)}</p></div></div>${finished ? `<section class="wd-result"><h2>${v.winners?.length === 2 ? "เสมอกัน" : `ผู้ชนะ: ${esc(v.players.find((p) => p.id === v.winners?.[0])?.name)}`}</h2><p>${v.victory === "military" ? "กองทัพถึงเมืองหลวงคู่แข่ง" : v.victory === "science" ? "รวบรวมวิทยาศาสตร์ 6 ชนิด" : "รวมคะแนนครบสามยุค • เสมอใช้คะแนนอาคารสีน้ำเงินตัดสิน"}</p><div class="wd-score-scroll"><table><thead><tr><th>ผู้เล่น</th><th>อาคาร</th><th>Wonder</th><th>Progress</th><th>ทหาร</th><th>เหรียญ</th><th>สมาคม</th><th>รวม</th></tr></thead><tbody>${v.scores?.map((s) => `<tr><th>${esc(v.players.find((p) => p.id === s.id)?.name)}</th><td>${s.buildings}</td><td>${s.wonders}</td><td>${s.progress}</td><td>${s.military}</td><td>${s.treasury}</td><td>${s.guilds}</td><td><b>${s.total}</b></td></tr>`).join("")}</tbody></table></div>${host ? `<button id="wd-restart" ${blocked ? "disabled" : ""}>เล่นอีกครั้ง</button>` : ""}</section>` : ""}<section class="wd-military" aria-label="แนวรบทหาร"><div class="wd-track">${Array.from({ length: 19 }, (_, i) => `<span class="${i === 9 ? "wd-neutral" : ""}" data-track="${i - 9}" title="${i - 9}">${i === 0 ? "Ⅰ" : i === 18 ? "Ⅱ" : ""}</span>`).join("")}<span class="wd-pawn" style="--position:${(((v.military ?? 0) + 9) / 18) * 100}%" aria-label="ทหาร ${v.military ?? 0}"><img src="${art("pawn")}" alt="" width="48" height="60"></span></div><div class="wd-military-label"><span>${esc(v.players[0]?.name)} ◁</span><span>${[-6, -3, 3, 6].map((n) => `<span class="wd-loot ${v.militaryUsed?.includes(n) ? "wd-used" : ""}">${n < 0 ? "◁" : "▷"} <img src="${art(Math.abs(n) === 3 ? "loot-2" : "loot-5")}" width="22" height="22" alt=""> −${Math.abs(n) === 3 ? 2 : 5}</span>`).join("")}</span><span>▷ ${esc(v.players[1]?.name)}</span></div></section><section class="wd-progress" aria-label="Progress ที่เลือกได้">${v.progress?.map((id) => `<details class="wd-token"><summary><img src="${art(id)}" width="34" height="34" alt="">${TOKEN_NAMES[id]}</summary><p>${tokenText[id]}</p></details>`).join("")}</section><div class="wd-table">${city(v.players[0], 0)}<section class="wd-center">${
    setup
      ? `<h2>เลือก Wonders</h2><p>${esc(turn?.name)} เลือก 1 ใบจากที่เปิดอยู่</p><div class="wd-draft">${v.wonderPool?.map((id) => `<button data-pick="${id}" ${!canAct ? "disabled" : ""}>${face(WONDERS.find((w) => w.id === id)!)}<span>${effectText(WONDERS.find((w) => w.id === id)!)}</span></button>`).join("")}</div><div id="wd-draft-preview"></div>`
      : `<div class="wd-layout wd-age-${v.age}" style="--rows:${v.age === 3 ? 7 : 5}" aria-label="ผังการ์ดยุค ${v.age}">${v.layout
          ?.map((n) => {
            const slot = LAYOUTS[v.age ?? 1][n.slot];
            return `<button class="wd-slot ${n.accessible ? "wd-accessible" : ""} ${selected.slot === n.slot ? "wd-selected" : ""} ${!n.faceUp ? "wd-back" : ""}" data-slot="${n.slot}" style="--x:${slot.x};--y:${slot.y};--back:url('/art/seven-wonders-duel/age-${v.age}-back.svg')" aria-label="${n.card ? `${esc(CARD[n.card].name)}${n.accessible ? " เลือกได้" : " ยังถูกบัง"}` : "การ์ดคว่ำ"}" ${!n.card ? "disabled" : ""}>${n.card ? face(CARD[n.card]) : `<span class="wd-back-art">${["Ⅰ", "Ⅱ", "Ⅲ"][(v.age ?? 1) - 1]}</span>`}</button>`;
          })
          .join(
            "",
          )}</div><p class="wd-board-help">แตะการ์ดเพื่อดูรายละเอียด • กรอบทองคือใบที่หยิบได้</p><div class="wd-resource-legend">${RESOURCES.map((r) => `${resource(r, 1)} ${names[r]}`).join(" ")}</div>`
  }${v.pending ? `<section class="wd-decision"><h2>${esc(status)}</h2><p>${esc(v.players.find((p) => p.id === v.pending?.actor)?.name)} กำลังเลือก</p>${v.me?.decision?.options.map((choice) => `<button data-choice="${choice}" ${!canAct ? "disabled" : ""}>${v.pending?.kind === "starter" ? esc(v.players.find((p) => p.id === choice)?.name) : TOKENS.includes(choice as Token) ? `<img src="${art(choice)}" width="54" height="54" alt=""><b>${TOKEN_NAMES[choice as Token]}</b><small>${tokenText[choice as Token]}</small>` : face(CARD[choice])}</button>`).join("") ?? ""}</section>` : ""}<details class="wd-discard"><summary>กองทิ้ง (${v.discard?.length ?? 0} ใบ) • แตะดูได้</summary><div class="wd-city-cards">${v.discard?.map((id) => `<button data-inspect="${id}">${face(CARD[id])}</button>`).join("")}</div></details></section>${city(v.players[1], 1)}</div><section id="wd-detail" class="wd-detail" aria-label="รายละเอียดและยืนยันการกระทำ"></section><details class="wd-help"><summary>วิธีเล่น</summary><p>เลือกการ์ดที่ไม่มีใบอื่นบัง แล้วสร้างอาคาร ทิ้งรับเงิน หรือใช้สร้าง Wonder ของคุณ ทรัพยากรผลิตใช้ซ้ำได้ทุกตา ซื้อที่ขาดจากธนาคารได้ สร้าง Wonder รวมทั้งเกมไม่เกิน 7 ใบ</p><p>ชนะทันทีเมื่อทหารถึงเมืองหลวง หรือวิทยาศาสตร์ครบ 6 ชนิด หากครบสามยุคคิดคะแนนรวม กรณีเสมอดูคะแนนอาคารสีน้ำเงิน</p><p>ภาพเป็น artwork สร้างใหม่ ข้อมูลและผลทั้งหมดมาจาก server ตามคู่มือ Repos Production 2015 ภาคหลัก</p></details></div>`;
  const detail = root.querySelector<HTMLElement>("#wd-detail")!;
  root
    .querySelector(".wd-center")!
    .insertBefore(detail, root.querySelector(".wd-discard"));
  const node = v.layout?.find((n) => n.slot === selected.slot);
  const id = selected.inspect ?? node?.card;
  const data = id ? (CARD[id] ?? WONDERS.find((w) => w.id === id)) : undefined;
  const offer = node && v.me?.offers.find((o) => o.slot === node.slot);
  const breakdown = (q: Quote) =>
    `<div class="wd-quote"><p>${q.chain ? "⛓ สร้างฟรีด้วยโซ่" : `ค่าการ์ด ${q.printed} + ซื้อทรัพยากร ${q.trade} = <b>${q.total} เหรียญ</b>`}</p><p>ผลิตได้ ${resources(q.produced) || "—"}${q.rebate ? ` • ส่วนลด ${q.rebate} หน่วย` : ""}</p><p>ซื้อเพิ่ม ${resources(q.missing) || "ไม่ต้องซื้อ"} ${RESOURCES.filter(
      (r) => q.missing[r],
    )
      .map((r) => `${names[r]} หน่วยละ ${q.prices[r]}`)
      .join(
        " / ",
      )}</p>${q.reason ? `<p role="status">${esc(q.reason)}</p>` : `<p>เหรียญหลังจ่าย ${(own?.coins ?? 0) - q.total}</p>`}</div>`;
  if (data) {
    detail.innerHTML = `<button id="wd-close" class="wd-close" aria-label="ปิดรายละเอียด">×</button><div class="wd-detail-card">${face(data, true)}<div><h2>${esc(data.name)}</h2><p>${esc(effectText(data))}${data.id === "appian-way" ? " • คู่แข่งเสีย 3 เหรียญ" : ""}</p>${"chain" in data && data.chain ? `<p>ให้โซ่ ${data.chain}</p>` : ""}</div></div>${
      node && offer && !selected.inspect && !v.pending
        ? `<div class="wd-options"><button data-mode="build" aria-pressed="${selected.mode === "build"}">สร้างอาคาร</button><button data-mode="discard" aria-pressed="${selected.mode === "discard"}">ทิ้งรับ ${offer.discard} เหรียญ</button>${offer.wonders.map((w) => `<button data-mode="wonder" data-wonder="${w.id}" aria-pressed="${selected.mode === "wonder" && selected.wonder === w.id}">สร้าง ${esc(WONDERS.find((x) => x.id === w.id)?.name)}</button>`).join("")}</div>${
            selected.mode === "build"
              ? breakdown(offer.build)
              : selected.mode === "wonder"
                ? `${face(
                    WONDERS.find((w) => w.id === selected.wonder)!,
                    true,
                  )}<p>${esc(effectText(WONDERS.find((w) => w.id === selected.wonder)!))}</p>${breakdown(offer.wonders.find((w) => w.id === selected.wonder)!.quote)}`
                : selected.mode === "discard"
                  ? `<p>รับ ${offer.discard} เหรียญ • หลังรับ ${(own?.coins ?? 0) + offer.discard}</p>`
                  : "<p>เลือกวิธีใช้การ์ดก่อนยืนยัน</p>"
          }<div class="wd-confirm-bar"><button id="wd-confirm" ${!canAct || !selected.mode || (selected.mode === "build" && !offer.build.affordable) || (selected.mode === "wonder" && !offer.wonders.find((w) => w.id === selected.wonder)?.quote.affordable) ? "disabled" : ""}>${blocked ? "กำลังส่ง…" : "ยืนยันการกระทำ"}</button></div>`
        : `<p>${node && !node.accessible ? "การ์ดยังถูกบัง หยิบไม่ได้" : !canAct && !finished ? "ดูข้อมูลได้ • รอเจ้าของตาเลือกการกระทำ" : ""}</p>`
    }`;
  }
  root.querySelectorAll<HTMLButtonElement>("[data-slot]").forEach(
    (b) =>
      (b.onclick = () => {
        const n = v.layout?.find((n) => n.slot === Number(b.dataset.slot));
        if (!n?.card) return;
        selection = { code: v.code, revision: v.revision, slot: n.slot };
        redraw();
        root
          .querySelector("#wd-detail")
          ?.scrollIntoView({ block: "nearest", behavior: "instant" });
      }),
  );
  root.querySelectorAll<HTMLButtonElement>("[data-inspect]").forEach(
    (b) =>
      (b.onclick = () => {
        selection = {
          code: v.code,
          revision: v.revision,
          inspect: b.dataset.inspect,
        };
        redraw();
        root
          .querySelector("#wd-detail")
          ?.scrollIntoView({ block: "nearest", behavior: "instant" });
      }),
  );
  root.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach(
    (b) =>
      (b.onclick = () => {
        selected.mode = b.dataset.mode as "build" | "discard" | "wonder";
        selected.wonder = b.dataset.wonder;
        redraw();
      }),
  );
  root.querySelector("#wd-close")?.addEventListener("click", () => {
    selection = { code: v.code, revision: v.revision };
    redraw();
  });
  root.querySelector("#wd-confirm")?.addEventListener("click", () => {
    if (canAct && selected.slot !== undefined && selected.mode)
      command({
        type: "wonders-play",
        slot: selected.slot,
        mode: selected.mode,
        ...(selected.mode === "wonder" ? { wonder: selected.wonder } : {}),
      });
  });
  root.querySelectorAll<HTMLButtonElement>("[data-choice]").forEach(
    (b) =>
      (b.onclick = () => {
        if (canAct)
          command({ type: "wonders-decide", choice: b.dataset.choice! });
      }),
  );
  root.querySelectorAll<HTMLButtonElement>("[data-pick]").forEach(
    (b) =>
      (b.onclick = () => {
        const id = b.dataset.pick!,
          w = WONDERS.find((w) => w.id === id)!;
        const target = root.querySelector("#wd-draft-preview")!;
        target.innerHTML = `<p><b>${esc(w.name)}</b> • ${esc(effectText(w))}</p><button id="wd-pick-confirm" ${!canAct ? "disabled" : ""}>ยืนยันเลือก Wonder</button>`;
        target.querySelector("button")!.onclick = () =>
          canAct && command({ type: "wonders-pick", wonder: id });
      }),
  );
  root
    .querySelector("#wd-restart")
    ?.addEventListener("click", () => command({ type: "restart" }));
  bindRoomLinks(root, platform.joinOrigin ?? location.origin);
  root.querySelectorAll<HTMLImageElement>(".wd-root img").forEach(
    (img) =>
      (img.onerror = () => {
        if (!img.src.endsWith("fallback.svg"))
          img.src = "/art/seven-wonders-duel/fallback.svg";
      }),
  );
  if (animate) {
    const targets: Element[] = [];
    if (first?.military !== v.military) {
      const pawn = root.querySelector(".wd-pawn");
      if (pawn) targets.push(pawn);
    }
    if (first?.progress.join(",") !== (v.progress ?? []).join(",")) {
      const progress = root.querySelector(".wd-progress");
      if (progress) targets.push(progress);
    }
    for (const slot of v.event!.revealed) {
      const element = root.querySelector(`[data-slot="${slot}"]`);
      if (element) targets.push(element);
    }
    v.players.forEach((p, i) => {
      if (first?.coins[i] !== p.coins) {
        const amount = root.querySelector(`[data-coins="${p.id}"]`);
        if (amount) targets.push(amount);
      }
    });
    for (const target of targets)
      target.animate(
        [
          { opacity: 0.4, transform: "translateY(-5px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 380, easing: "ease-out" },
      );
    if (finished || first?.age !== v.age)
      root
        .querySelector(finished ? ".wd-result" : ".wd-center")
        ?.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 500 });
    if (captured && ["build", "discard", "wonder"].includes(v.event!.kind)) {
      const { node: flight, from: fromRect, to } = captured;
      {
        flight.removeAttribute("data-slot");
        flight.setAttribute("aria-hidden", "true");
        flight.inert = true;
        flight.className = "wd-flight";
        Object.assign(flight.style, {
          position: "fixed",
          left: fromRect.left + "px",
          top: fromRect.top + "px",
          width: fromRect.width + "px",
          height: fromRect.height + "px",
          zIndex: "90",
          pointerEvents: "none",
        });
        root.append(flight);
        const animation = flight.animate(
          [
            { transform: "translate(0,0)", opacity: 0.9 },
            {
              transform: `translate(${to.left - fromRect.left}px,${to.top - fromRect.top}px) scale(.35)`,
              opacity: 0,
            },
          ],
          { duration: 450, easing: "ease-in" },
        );
        void animation.finished.then(
          () => flight.remove(),
          () => flight.remove(),
        );
      }
    }
  }
}
