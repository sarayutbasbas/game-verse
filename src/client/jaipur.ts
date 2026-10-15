import { crown, seatLabel } from "./jaipur-identity.js";
import { patchHTML } from "./dom-patch.js";
import { syncJaipurResult, reopenJaipurResult } from "./jaipur-results.js";
import {
  GOODS,
  CAMEL_TOKEN,
  NAMES,
  minimum,
  type Good,
  type Kind,
} from "../games/jaipur/data.js";
import type {
  JaipurView,
  JaipurAction,
  ExchangeOffer,
} from "../games/jaipur/types.js";
import type { RoomAction } from "../shared/types.js";
import { bindRoomLinks, showToast } from "./ui.js";
import { avatar, platform } from "./account.js";
import "./jaipur.css";
const esc = (s: unknown) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const art = (id: string) => `/art/jaipur/${id}.webp?v=1`;
const symbols: Record<Kind, string> = {
  diamond: "A",
  gold: "B",
  silver: "C",
  cloth: "D",
  spice: "E",
  leather: "F",
  camel: "อูฐ",
};
const card = (kind: Kind, large = false) =>
  `<span class="jp-card jp-${kind} ${large ? "jp-large" : ""}"><span class="jp-card-label"><b>${symbols[kind]}</b>${NAMES[kind]}</span><img src="${art(kind)}" width="240" height="320" alt="" loading="eager"></span>`;
const back = () =>
  `<span class="jp-card jp-back"><img src="${art("card-back")}" width="240" height="320" alt="ไพ่คว่ำ"></span>`;
const token = (id: string, value: number | string, kind?: string) =>
  `<span class="jp-token ${kind ? "jp-" + kind : ""}"><img src="${art(id)}" width="72" height="72" alt=""><b>${value}</b></span>`;
interface Draft {
  code: string;
  revision: number;
  mode: "take" | "camels" | "exchange" | "sell";
  market: string[];
  hand: string[];
  camels: number;
  good?: Good;
  committed?: boolean;
}

let draft: Draft | undefined,
  previous:
    | {
        code: string;
        revision: number;
        sequence: number;
        round?: number;
        phase: string;
      }
    | undefined;
let motion:
  { from: DOMRect; to: DOMRect; front?: Kind; actor: string } | undefined;
let ready = false,
  loading: Promise<void> | undefined,
  afterLoad: (() => void) | undefined;
const assetIds = [
  ...GOODS,
  "camel",
  "card-back",
  "cover",
  "table",
  ...GOODS.map((g) => "token-" + g),
  "token-bonus-back",
  "token-bonus-front",
  "token-camel",
  "seal",
];
function preload() {
  return Promise.all(
    assetIds.map(
      (id) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = art(id);
        }),
    ),
  ).then(() => {
    ready = true;
    afterLoad?.();
  });
}
export function captureJaipurMotion(
  root: HTMLElement,
  v: JaipurView,
  snapshot: boolean,
) {
  motion = undefined;
  if (
    snapshot ||
    !previous ||
    previous.code !== v.code ||
    v.revision !== previous.revision + 1 ||
    v.event?.sequence !== previous.sequence + 1 ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  const event = v.event,
    source = event.take?.length
      ? root.querySelector(`[data-market="${event.take[0].id}"]`)
      : event.sold
        ? root.querySelector(
            event.actor === v.me?.id
              ? ".jp-hand [data-hand]"
              : `[data-trader="${event.actor}"] .jp-handbacks`,
          )
        : null;
  const target = root.querySelector(
    event.sold ? ".jp-prices" : `[data-trader="${event.actor}"] .jp-handbacks`,
  );
  if (source && target)
    motion = {
      from: source.getBoundingClientRect(),
      to: target.getBoundingClientRect(),
      actor: event.actor,
      ...(event.actor === v.me?.id && event.take?.[0]
        ? { front: event.take[0].kind }
        : {}),
    };
}
export function renderJaipur(
  root: HTMLElement,
  v: JaipurView,
  host: boolean,
  blocked: boolean,
  command: (a: RoomAction) => void,
  snapshot = false,
) {
  if (!ready) {
    afterLoad = () => {
      if (root.isConnected && document.body.classList.contains("jaipur-theme"))
        renderJaipur(root, v, host, blocked, command, true);
    };
    root.innerHTML =
      '<div class="jp-loading" role="status">กำลังเตรียมโต๊ะตลาด…</div>';
    loading ??= preload();
    return;
  }
  if (!draft || draft.code !== v.code || draft.revision !== v.revision) {
    if (
      draft?.code === v.code &&
      draft.revision !== v.revision &&
      !draft.committed &&
      (draft.market.length || draft.hand.length || draft.camels)
    )
      showToast("สถานะเปลี่ยนแล้ว ยกเลิกตัวเลือกเดิม กรุณาเลือกใหม่");
    draft = {
      code: v.code,
      revision: v.revision,
      mode: "take",
      market: [],
      hand: [],
      camels: 0,
    };
  }
  const d = draft,
    me = v.me,
    active = v.phase === "playing" && v.turn === me?.id && !blocked,
    turn = v.players.find((p) => p.id === v.turn),
    captured = motion;
  motion = undefined;
  const animate =
    !snapshot &&
    previous?.code === v.code &&
    v.revision === previous.revision + 1 &&
    v.event?.sequence === previous.sequence + 1 &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const prior = previous;
  previous = {
    code: v.code,
    revision: v.revision,
    sequence: v.sequence ?? 0,
    round: v.round,
    phase: v.phase,
  };
  const redraw = () => {
    const focused = document.activeElement as HTMLElement | null,
      field = focused?.dataset.mode
        ? "mode"
        : focused?.dataset.market
          ? "market"
          : focused?.dataset.hand
            ? "hand"
            : undefined,
      value = field ? focused?.dataset[field] : undefined,
      focusedId = focused?.id;
    renderJaipur(root, v, host, blocked, command, true);
    if (field && value)
      root
        .querySelector<HTMLElement>(`[data-${field}="${CSS.escape(value)}"]`)
        ?.focus({ preventScroll: true });
    else if (focusedId)
      root
        .querySelector<HTMLElement>(`#${CSS.escape(focusedId)}`)
        ?.focus({ preventScroll: true });
  };
  const submit = (a: JaipurAction) => {
    if (blocked) return;
    d.committed = true;
    command(a);
  };
  const mask = (ids: string[], cards: { id: string }[]) =>
    cards.reduce((n, c, i) => n | (ids.includes(c.id) ? 1 << i : 0), 0);
  const takeMask = mask(d.market, v.market ?? []),
    giveMask = mask(d.hand, me?.hand ?? []),
    exchange = me?.exchanges.find(
      (x) => x[0] === takeMask && x[1] === giveMask && x[2] === d.camels,
    );
  const count = d.hand.length,
    sale = me?.sell.find((x) => x.good === d.good && x.count === count);
  const selectedCard = v.market?.find((c) => d.market.includes(c.id));
  let action: JaipurAction | undefined,
    reason = "เลือกการ์ดบนโต๊ะก่อน";
  if (d.mode === "take" && selectedCard) {
    const offer = me?.take.find((o) => o.cardId === selectedCard.id);
    if (offer?.allowed)
      action = { type: "jaipur-take", cardId: selectedCard.id };
    else reason = offer?.reason ?? "รอเจ้าของตา";
  }
  if (d.mode === "camels") {
    if (me?.legal.some((a) => a.type === "jaipur-camels"))
      action = { type: "jaipur-camels" };
    else reason = "ตลาดไม่มีอูฐ หรือยังไม่ถึงตาของคุณ";
  }
  if (d.mode === "exchange") {
    if (exchange)
      action = {
        type: "jaipur-exchange",
        marketIds: d.market,
        handIds: d.hand,
        camels: d.camels,
      };
    else if (d.market.length < 2)
      reason = "เลือกรับสินค้าอย่างน้อย 2 ใบ ไม่รวมอูฐ";
    else if (d.market.length !== d.hand.length + d.camels)
      reason = "จำนวนรับและคืนต้องเท่ากัน";
    else if (
      me?.hand.some(
        (c) =>
          d.hand.includes(c.id) &&
          v.market?.some((x) => d.market.includes(x.id) && x.kind === c.kind),
      )
    )
      reason = "สินค้าชนิดเดียวกันอยู่ทั้งฝั่งรับและคืนไม่ได้";
    else reason = "ชุดนี้แลกไม่ได้ ตรวจว่ามือหลังแลกไม่เกิน 7 ใบ";
  }
  if (d.mode === "sell") {
    if (sale)
      action = { type: "jaipur-sell", good: sale.good, count: sale.count };
    else
      reason = !d.good
        ? "เลือกสินค้าจากมือที่จะขาย"
        : `เลือก${NAMES[d.good]}อย่างน้อย ${minimum(d.good)} ใบ`;
  }
  const seal = (p: (typeof v.players)[number]) =>
    `<div class="jp-seat-stat jp-seat-wins" aria-label="ชนะ ${p.seals} จาก 2 รอบ"><small>ชนะ</small><b><img src="${art("seal")}" width="16" height="16" alt="" class="${p.seals ? "jp-earned-seal" : "jp-empty-seal"}">${p.seals}/2</b></div>`;
  const herd = (p: (typeof v.players)[number], own: boolean) => {
    const count = p.herdCount;
    return `<div data-herd-player="${p.id}" data-herd-count="${count}"><span class="jp-herd-stack ${count ? "" : "jp-herd-empty"}" style="--herd-size:${count || 1}">${Array.from({ length: count }, (_, i) => card("camel").replace("<span class=", `<span style="--herd-index:${i}" class=`)).join("") || "<span>0 ใบ</span>"}</span><span>อูฐ <b>${count}</b> ใบ</span></div>`;
  };
  const modes = `<nav class="jp-modes" aria-label="เลือกการกระทำ">${(["take", "exchange", "sell"] as const).map((m) => `<button data-mode="${m}" aria-pressed="${d.mode === m || (m === "take" && d.mode === "camels")}" ${blocked ? "disabled" : ""}>${{ take: "หยิบ", exchange: "แลก", sell: "ขาย" }[m]}</button>`).join("")}</nav>`;
  const modeTitle = {
    take: "หยิบสินค้า",
    camels: "หยิบอูฐ",
    exchange: "แลกสินค้า",
    sell: "ขายสินค้า",
  }[d.mode];
  const player = (p: (typeof v.players)[number]) =>
    `<section class="jp-public-player ${p.id === v.turn ? "jp-current" : ""}" data-trader="${p.id}" ${p.id === v.turn ? 'aria-label="' + esc(p.name) + ' กำลังเล่น"' : ""}><div class="jp-player-name">${avatar(p)}<div class="jp-identity-copy"><h2 title="${esc(p.name)}">${esc(p.name)}</h2><div class="jp-seat-meta"><small>${seatLabel(v, p.id)}</small><small class="jp-seat-connection" data-online="${!!p.connected}"><i aria-hidden="true"></i>${p.connected ? "ออนไลน์" : "หลุด"}</small></div></div></div><div class="jp-seat-stats" aria-label="ข้อมูลผู้เล่น"><div class="jp-seat-stat jp-handbacks" aria-label="ไพ่ในมือ ${p.handCount} จาก 7 ใบ"><span class="jp-stat-label"><span class="jp-stat-art">${back()}</span><small>ไพ่</small></span><b>${p.handCount}/7</b></div><div class="jp-seat-stat"><small>สินค้า</small><b>${p.goodsCount}</b></div><div class="jp-seat-stat"><small>โบนัส</small><b>${p.bonusCount}</b></div>${seal(p)}</div></section>`;
  const seat = (p: (typeof v.players)[number], bottom: boolean) =>
    `<section class="jp-seat-strip ${bottom ? "jp-seat-bottom" : "jp-seat-top"} ${p.id === v.turn ? "jp-current" : ""}" data-ui-key="seat-${p.id}" aria-label="${esc(seatLabel(v, p.id))}${p.id === v.turn ? " กำลังเล่น" : ""}">${bottom ? herd(p, !!me) : ""}${player(p)}${!bottom ? herd(p, false) : ""}</section>`;
  const winnerIds =
    v.phase === "finished"
      ? (v.winners ?? [])
      : v.result?.winner
        ? [v.result.winner]
        : [];
  patchHTML(
    root,
    `<div class="jp-root ${me ? "jp-controller" : "jp-display"} ${me && v.phase === "playing" && v.turn !== me.id ? "jp-waiting" : ""}"><div class="jp-heading"><div><h1 translate="no">Jaipur</h1><p>รอบ ${v.round} · ชนะ 2 รอบ</p></div></div>${v.phase !== "playing" ? `<section class="jp-results" id="jp-results"><button id="jp-reopen">ดูการนับคะแนนอีกครั้ง</button><h2>${v.phase === "finished" ? `ผู้ชนะการแข่งขัน: ${esc(v.players.find((p) => p.id === v.winners?.[0])?.name)}` : v.result?.winner ? `ผู้ชนะรอบ: ${esc(v.players.find((p) => p.id === v.result!.winner)?.name)}` : "รอบนี้เสมอ · ไม่แจกตราชนะ"}</h2><p>${v.result?.reason === "deck" ? "กองจั่วไม่พอเติมตลาด" : "โทเคนสินค้าหมด 3 กอง"}${v.result?.tieBreak === "bonus" ? " · ตัดสินด้วยจำนวนโบนัส" : v.result?.tieBreak === "goods" ? " · ตัดสินด้วยจำนวนโทเคนสินค้า" : ""}</p><div class="jp-score-scroll"><table><thead><tr><th>ผู้เล่น</th><th>สินค้า</th><th>โบนัส</th><th>อูฐ</th><th>รวม</th></tr></thead><tbody>${v.result?.scores.map((s) => `<tr data-result-row="${s.id}" class="${winnerIds.includes(s.id) ? "jp-winner" : ""}"><th>${winnerIds.includes(s.id) ? crown() : ""}${avatar(v.players.find((p) => p.id === s.id)!)}${esc(v.players.find((p) => p.id === s.id)?.name)}<small>${seatLabel(v, s.id)}</small><small>อูฐ ${s.herd} · โบนัส ${s.bonusCount} ชิ้น · สินค้า ${s.goodsCount} ชิ้น</small></th><td>${s.goods}</td><td>${s.bonus}</td><td>${s.camel}</td><td><b>${s.total}</b></td></tr>`).join("")}</tbody></table></div>${v.phase === "results" && (host || me) ? `${!v.result?.nextStarter ? `<label for="jp-next-starter">รอบเสมอ: ตกลงเลือกผู้เริ่มใหม่</label><select id="jp-next-starter"><option value="">เลือกผู้เริ่ม</option>${v.players.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select>` : `<p>รอบถัดไปเริ่มโดย ${esc(v.players.find((p) => p.id === v.result!.nextStarter)?.name)} (ผู้แพ้รอบก่อน)</p>`}<button id="jp-next" ${blocked || !v.result?.nextStarter ? "disabled" : ""}>เริ่มรอบถัดไป</button>` : ""}${v.phase === "finished" && host ? `<button id="jp-restart" ${blocked ? "disabled" : ""}>เริ่มเกมใหม่</button>` : ""}</section>` : ""}<section class="jp-bank" id="jp-bank" aria-label="กองโทเคนกลาง"><section class="jp-prices" aria-label="ราคาและจำนวนโทเคนสินค้าที่เหลือ">${GOODS.map((g) => `<button class="jp-price jp-${g}" data-inspect-good="${g}" aria-label="${NAMES[g]} ขั้นต่ำ ${minimum(g)} ใบ เหลือ ${v.goods?.[g].length ?? 0}"><small class="jp-remaining">เหลือ ${v.goods?.[g].length ?? 0}</small>${v.goods?.[g].length ? `<span class="jp-token-stack" style="--token-count:${me ? 1 : v.goods[g].length}">${(me ? v.goods[g].slice(0, 1) : v.goods[g]).map((t, i) => `<span style="--token-index:${i}">${token("token-" + g, t.value, g)}</span>`).join("")}</span>` : '<span class="jp-token jp-token-empty">หมด</span>'}<span class="jp-good-name">${NAMES[g]}</span><small class="jp-minimum">ขั้นต่ำ ${minimum(g)} ใบ</small></button>`).join("")}</section><section class="jp-bonus-bank" aria-label="กองโบนัสและรางวัลอูฐ">${([3, 4, 5] as const).map((n) => `<div>${token("token-bonus-back", n === 5 ? "5+" : n)}<p>ขาย ${n === 5 ? "5+" : n} ใบ<small>เหลือ ${v.bonusCounts?.[n] ?? 0}</small></p></div>`).join("")}<div>${token("token-camel", CAMEL_TOKEN.value)}<p>อูฐมากกว่า<small>เสมอไม่ได้</small></p></div></section></section><section class="jp-table-herds jp-opponent-herd" id="jp-opponent-herd" aria-label="ฝูงอูฐผู้เล่น">${(me ? v.players.filter((p) => p.id !== me.id) : v.players.slice(0, 1)).map((p) => seat(p, false)).join("")}</section><section class="jp-market-table" id="jp-market-table"><div class="jp-deck">${back()}<span>กองจั่ว ${v.deckCount} ใบ</span></div><div class="jp-market" aria-label="ตลาด">${v.market?.map((c) => `<button data-market="${c.id}" data-kind="${c.kind}" aria-label="${NAMES[c.kind]}ในตลาด" aria-pressed="${d.mode === "camels" ? c.kind === "camel" : d.market.includes(c.id)}" ${blocked ? "disabled" : ""}>${card(c.kind)}</button>`).join("")}</div></section><section class="jp-table-herds jp-own-herd" id="jp-own-herd" aria-label="ผู้เล่นด้านล่าง">${v.players
      .filter((p) => (me ? p.id === me.id : p.id === v.players[1]?.id))
      .map((p) => seat(p, true))
      .join("")}</section>${
      me && v.phase === "playing"
        ? `<section class="jp-controller-area" id="jp-controller"><div class="jp-own-heading"><h2>${modeTitle} <small>มือ ${me.hand.length}/7</small></h2>${modes}</div><p class="jp-action-help">${!active ? `รอ ${esc(turn?.name)} · เลือกดูและเตรียมรายการได้` : d.mode === "exchange" ? "เลือกสินค้าที่จะรับจากตลาด แล้วเลือกไพ่/อูฐที่จะคืน" : d.mode === "sell" ? "แตะไพ่ชนิดเดียวกันในมือ แล้วตรวจราคาก่อนยืนยัน" : "เลือกสินค้าเพิ่มเพื่อแลก · แตะอูฐเพื่อหยิบทั้งหมด"}</p><div class="jp-hand" aria-label="ไพ่ในมือของคุณ">${
            [...me.hand]
              .sort(
                (a, b) =>
                  GOODS.indexOf(a.kind as Good) - GOODS.indexOf(b.kind as Good),
              )
              .map(
                (c) =>
                  `<button data-hand="${c.id}" data-kind="${c.kind}" aria-label="${NAMES[c.kind]}ในมือ" aria-pressed="${d.hand.includes(c.id)}" ${blocked ? "disabled" : ""}>${card(c.kind)}</button>`,
              )
              .join("") || "<p>มือว่าง · เลือกหยิบสินค้าจากตลาด</p>"
          }</div><section class="jp-preview ${action && active ? "jp-has-confirm" : ""}" aria-label="ตัวอย่างรายการก่อนยืนยัน"><h3 class="sr-only">${modeTitle}</h3>${
            d.mode === "exchange"
              ? `<div class="jp-exchange-pair"><div><h4>รับ ${d.market.length} ใบ</h4><div>${
                  v.market
                    ?.filter((c) => d.market.includes(c.id))
                    .map((c) => card(c.kind))
                    .join("") || "เลือกจากตลาด"
                }</div></div><div><h4>คืน ${d.hand.length + d.camels} ใบ</h4><div>${me.hand
                  .filter((c) => d.hand.includes(c.id))
                  .map((c) => card(c.kind))
                  .join(
                    "",
                  )}${d.camels ? `<span class="jp-camel-return">${card("camel")}<b>× ${d.camels}</b></span>` : ""}</div></div></div><div class="jp-stepper"><span>อูฐที่คืน</span><button id="jp-camel-minus" aria-label="ลดอูฐที่คืน" ${blocked || d.camels === 0 ? "disabled" : ""}>−</button><b>${d.camels}</b><button id="jp-camel-plus" aria-label="เพิ่มอูฐที่คืน" ${blocked || d.camels >= me.herd.length ? "disabled" : ""}>+</button></div><p>มือหลังแลก ${me.hand.length - d.hand.length + d.market.length}/7 ใบ</p>`
              : d.mode === "sell"
                ? `${d.good ? `<div class="jp-sale-detail">${card(d.good, true)}<div><h4>${NAMES[d.good]}</h4><div class="jp-stepper"><button id="jp-sell-minus" aria-label="ลดจำนวนขาย" ${blocked || count === 0 ? "disabled" : ""}>−</button><b>${count} ใบ</b><button id="jp-sell-plus" aria-label="เพิ่มจำนวนขาย" ${blocked || count >= me.hand.filter((c) => c.kind === d.good).length ? "disabled" : ""}>+</button></div><p>โทเคนสินค้า ${sale ? sale.values.join(" + ") || "หมดกองนี้แล้ว" : "เลือกให้ถึงขั้นต่ำ"}${sale ? ` = <b>${sale.goodsTotal} รูปี</b>` : ""}</p>${sale?.bonus ? `<p>${sale.bonusAvailable ? `ได้โบนัสขาย ${sale.bonus === 5 ? "5+" : sale.bonus} ใบ · เปิดมูลค่าให้คุณหลังยืนยัน` : "โบนัสหมวดนี้หมดแล้ว ไม่มีชิ้นทดแทน"}</p>${sale.bonusAvailable ? token("token-bonus-back", sale.bonus === 5 ? "5+" : sale.bonus) : ""}` : ""}</div></div>` : "<p>เลือกสินค้าชนิดเดียวจากมือของคุณ</p>"}`
                : d.mode === "camels"
                  ? `<div class="jp-take-detail">${card("camel", true)}<p>รับอูฐ ${v.market?.filter((c) => c.kind === "camel").length ?? 0} ใบเข้าฝูง<br>ไม่เพิ่มจำนวนไพ่ในมือ</p></div>`
                  : selectedCard
                    ? `<div class="jp-take-detail">${card(selectedCard.kind, true)}<p>รับ${NAMES[selectedCard.kind]} 1 ใบ<br>มือหลังหยิบ ${me.hand.length + 1}/7 ใบ<br>เติมตลาดจากกองจั่วหลังยืนยัน</p></div>`
                    : "<p>เลือกสินค้าจากตลาดด้านบน</p>"
          }<p class="jp-preview-reason" role="status">${action ? "ตรวจรายการพร้อมแล้ว · ยังไม่ส่งจนกดยืนยัน" : esc(reason)}</p><div class="jp-confirm-bar ${action && active ? "jp-confirm-ready" : ""}"><button id="jp-clear" ${blocked ? "disabled" : ""}>ยกเลิก</button><button id="jp-confirm" ${!active || !action ? "disabled" : ""}>${blocked ? "กำลังส่ง…" : "ยืนยัน"}</button></div></section><details class="jp-private-tokens"><summary>เงินของคุณ ${me.subtotal} รูปี · ยังไม่รวมรางวัลอูฐ</summary><p>ข้อมูลนี้แสดงเฉพาะคุณ</p><div>${me.goods.map((t) => token("token-" + t.kind, t.value, t.kind)).join("")}${me.bonus.map((t) => token("token-bonus-front", t.value)).join("")}</div></details></section>`
        : ""
    }<p class="jp-last-action" role="status">${v.event?.sold ? `${esc(v.players.find((p) => p.id === v.event?.actor)?.name)} ขาย${NAMES[v.event.sold.kind]} ${v.event.sold.count} ใบ${v.event.sold.bonus ? " และรับโบนัส" : ""}` : v.event?.kind === "jaipur-exchange" ? "แลกสินค้าและเติมตำแหน่งในตลาดแล้ว" : v.event?.take?.length ? `${esc(v.players.find((p) => p.id === v.event?.actor)?.name)} หยิบ${v.event.kind === "jaipur-camels" ? "อูฐทั้งหมด" : "สินค้า"}จากตลาด` : ""}</p><details class="jp-history"><summary>ผลรอบที่ผ่านมา (${v.history?.length ?? 0})</summary>${v.history?.map((r) => `<p>รอบ ${r.round}: ${r.scores.map((s) => `${esc(v.players.find((p) => p.id === s.id)?.name)} ${s.total}`).join(" / ")} · ${r.winner ? `ชนะโดย ${esc(v.players.find((p) => p.id === r.winner)?.name)}` : "เสมอ ไม่แจกตราชนะ"}</p>`).join("")}</details><details class="jp-help"><summary>วิธีเล่นและข้อมูลที่เปิดเผย</summary><p>แต่ละตาหยิบหรือขายอย่างใดอย่างหนึ่ง มือไม่เกิน 7 ใบ อูฐอยู่ในฝูงแยกจากมือ แลกรับสินค้าอย่างน้อย 2 ใบและคืนเท่ากัน ห้ามรับกับคืนสินค้าชนิดเดียวกัน</p><p>เพชร ทอง เงิน ขายขั้นต่ำ 2 ใบ ขาย 3/4/5+ ใบรับโบนัสตามกองที่ยังเหลือ จบรอบเมื่อโทเคนสินค้าหมด 3 ชนิด หรือเติมตลาดไม่ครบ 5 ใบ อูฐมากกว่าได้ 5 รูปี เสมอไม่ได้รางวัล</p><p>จำนวนอูฐทั้งสองฝ่ายเปิดเผยตามรูปแบบเว็บที่ผู้ใช้เลือก ส่วนไพ่ในมือ โบนัส และเงินระหว่างรอบเป็นข้อมูลส่วนตัว เปิดคะแนนตอนสรุปรอบ ชนะ 2 รอบจึงชนะการแข่งขัน หากคะแนน/จำนวนโบนัส/จำนวนโทเคนเท่ากันทั้งหมด เว็บใช้รอบเสมอไม่แจกตราชนะ และให้ตกลงเลือกผู้เริ่มใหม่ ตามข้อวินิจฉัยที่ผู้ใช้ยืนยัน</p></details></div>`,
  );
  root.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach(
    (b) =>
      (b.onclick = () => {
        d.mode = b.dataset.mode as Draft["mode"];
        d.market = [];
        d.hand = [];
        d.camels = 0;
        d.good = undefined;
        redraw();
      }),
  );
  root.querySelectorAll<HTMLButtonElement>("[data-market]").forEach(
    (b) =>
      (b.onclick = () => {
        if (!me || v.phase !== "playing" || blocked) return;
        const c = v.market!.find((c) => c.id === b.dataset.market)!;
        if (c.kind === "camel") {
          d.market =
            d.mode === "camels"
              ? []
              : v.market!.filter((x) => x.kind === "camel").map((x) => x.id);
          d.mode = d.market.length ? "camels" : "take";
          d.hand = [];
          d.camels = 0;
        } else {
          if (d.mode === "camels" || d.mode === "sell") d.market = [];
          d.market = d.market.includes(c.id)
            ? d.market.filter((id) => id !== c.id)
            : [...d.market, c.id];
          d.mode = d.market.length >= 2 ? "exchange" : "take";
          if (d.mode === "exchange") {
            // A local default only: exact legality still comes from server offers.
            d.camels = Math.min(
              me.herd.length,
              Math.max(0, d.market.length - d.hand.length),
            );
          }
          if (d.mode === "take") {
            d.hand = [];
            d.camels = 0;
          }
        }
        redraw();
      }),
  );
  root.querySelectorAll<HTMLButtonElement>("[data-hand]").forEach(
    (b) =>
      (b.onclick = () => {
        if (!me || blocked) return;
        const c = me.hand.find((c) => c.id === b.dataset.hand)!;
        if (d.mode === "exchange")
          d.hand = d.hand.includes(c.id)
            ? d.hand.filter((id) => id !== c.id)
            : [...d.hand, c.id];
        else {
          if (d.mode !== "sell" || d.good !== c.kind) {
            d.hand = [];
            d.mode = "sell";
            d.good = c.kind as Good;
            d.market = [];
          }
          d.hand = d.hand.includes(c.id)
            ? d.hand.filter((id) => id !== c.id)
            : [...d.hand, c.id];
        }
        redraw();
      }),
  );
  {
    const button = root.querySelector<HTMLButtonElement>("#jp-camel-minus");
    if (button)
      button.onclick = () => {
        d.camels = Math.max(0, d.camels - 1);
        redraw();
      };
  }
  {
    const button = root.querySelector<HTMLButtonElement>("#jp-camel-plus");
    if (button)
      button.onclick = () => {
        d.camels = Math.min(me!.herd.length, d.camels + 1);
        redraw();
      };
  }
  for (const [id, delta] of [
    ["jp-sell-minus", -1],
    ["jp-sell-plus", 1],
  ] as const) {
    const button = root.querySelector<HTMLButtonElement>("#" + id);
    if (button)
      button.onclick = () => {
        const cards = me!.hand.filter((c) => c.kind === d.good);
        d.hand = cards
          .slice(0, Math.max(0, Math.min(cards.length, d.hand.length + delta)))
          .map((c) => c.id);
        redraw();
      };
  }
  {
    const button = root.querySelector<HTMLButtonElement>("#jp-clear");
    if (button)
      button.onclick = () => {
        draft = undefined;
        redraw();
      };
  }
  {
    const button = root.querySelector<HTMLButtonElement>("#jp-confirm");
    if (button)
      button.onclick = () => {
        if (active && action) submit(action);
      };
  }
  const starter = root.querySelector<HTMLSelectElement>("#jp-next-starter");
  if (starter)
    starter.onchange = () => {
      root.querySelector<HTMLButtonElement>("#jp-next")!.disabled =
        blocked || !starter.value;
    };
  const next = root.querySelector<HTMLButtonElement>("#jp-next");
  if (next)
    next.onclick = () =>
      submit({
        type: "jaipur-next",
        ...(!v.result?.nextStarter ? { startingPlayerId: starter!.value } : {}),
      });
  const restart = root.querySelector<HTMLButtonElement>("#jp-restart");
  if (restart) restart.onclick = () => command({ type: "restart" });
  const reopen = root.querySelector<HTMLButtonElement>("#jp-reopen");
  if (reopen) reopen.onclick = () => reopenJaipurResult(v);
  root.querySelectorAll<HTMLButtonElement>("[data-inspect-good]").forEach(
    (b) =>
      (b.onclick = () => {
        const g = b.dataset.inspectGood as Good;
        showToast(
          `${NAMES[g]} · ขายขั้นต่ำ ${minimum(g)} ใบ · คะแนนที่เหลือ ${v.goods?.[g].map((t) => t.value).join(" / ") || "หมด"}`,
        );
      }),
  );
  syncJaipurResult(
    v,
    snapshot,
    prior?.code === v.code && prior.phase === "playing",
  );
  bindRoomLinks(root, platform.joinOrigin ?? location.origin);
  root.querySelectorAll<HTMLImageElement>(".jp-root img").forEach(
    (img) =>
      (img.onerror = () => {
        if (!img.src.endsWith("fallback.svg"))
          img.src = "/art/jaipur/fallback.svg";
      }),
  );
  if (animate) {
    const targets: Element[] = [];
    if (v.event?.refill?.length || v.event?.kind === "jaipur-exchange") {
      const table = root.querySelector(".jp-market");
      if (table) targets.push(table);
    }
    if (v.event?.sold) {
      const bank = root.querySelector(".jp-prices"),
        stash = root.querySelector(`[data-trader="${v.event.actor}"]`);
      if (bank) targets.push(bank);
      if (stash) targets.push(stash);
    }
    if (v.phase !== "playing" && prior?.phase === "playing") {
      const result = root.querySelector(".jp-results");
      if (result) targets.push(result);
      root.querySelector(".jp-earned-seal")?.animate(
        [
          { transform: "scale(.5)", opacity: 0 },
          { transform: "scale(1)", opacity: 1 },
        ],
        { duration: 450 },
      );
    }
    if (prior?.round !== v.round) {
      const table = root.querySelector(".jp-market-table");
      if (table) targets.push(table);
    }
    for (const t of targets)
      t.animate(
        [
          { opacity: 0.3, transform: "translateY(-5px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 350, easing: "ease-out" },
      );
    if (captured) {
      const flight = document.createElement("div");
      flight.className = "jp-flight";
      flight.setAttribute("aria-hidden", "true");
      flight.inert = true;
      flight.innerHTML = captured.front ? card(captured.front) : back();
      Object.assign(flight.style, {
        position: "fixed",
        left: captured.from.left + "px",
        top: captured.from.top + "px",
        width: captured.from.width + "px",
        height: captured.from.height + "px",
        zIndex: "90",
        pointerEvents: "none",
      });
      root.append(flight);
      const anim = flight.animate(
        [
          { transform: "translate(0,0)", opacity: 0.95 },
          {
            transform: `translate(${captured.to.left - captured.from.left}px,${captured.to.top - captured.from.top}px) scale(.45)`,
            opacity: 0,
          },
        ],
        { duration: 420, easing: "ease-in" },
      );
      void anim.finished.then(
        () => flight.remove(),
        () => flight.remove(),
      );
    }
  }
}
