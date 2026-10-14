import { roomCode } from "./ui.js";
import {
  EFFECTS,
  ROLE_NAME,
  SUIT_NAME,
  ROLES,
  type Card,
  type DuelView,
  type DuelAction,
  type LobbyAction,
} from "../games/dracula-vs-van-helsing/types.js";
import type { HostAction } from "../shared/types.js";
import "./dracula.css";
import {
  portrait,
  rolePortrait,
  marker,
  effectIcon,
} from "./dracula-assets.js";
import { DraculaMotion } from "./dracula-motion.js";
const esc = (x: unknown) =>
  String(x ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const card = (c: Card | null, caption = "") =>
  c
    ? `<span class="duel-card suit-${c.suit}" data-card="revealed"><span class="duel-card-size" aria-hidden="true"></span><span class="card-ink">${SUIT_NAME[c.suit]}</span><strong class="duel-value">${c.value}</strong>${effectIcon(c.value)}${portrait(c.value)}<small class="duel-effect">${EFFECTS[c.value]}</small><span class="visibility">${caption || (c.revealed ? "เปิดเผยแล้ว" : "เฉพาะคุณ")}</span></span>`
    : `<span class="duel-card card-back" data-card="hidden"><span class="duel-card-size" aria-hidden="true"></span><span>การ์ดปิด</span></span>`;
let selected: number[] = [];
let selectionKey = "";
export function renderDracula(
  root: HTMLElement,
  v: DuelView,
  host: boolean,
  blocked: boolean,
  command: (a: DuelAction | LobbyAction | HostAction) => void,
  motion: DraculaMotion,
  snapshot = false,
) {
  const mine = v.me,
    player = v.players.find((p) => p.id === mine?.id),
    own = player?.character;
  const name = (id?: string) => v.players.find((p) => p.id === id)?.name ?? "";
  const selection = `${v.code}:${v.revision}:${v.step}`;
  if (selectionKey !== selection) {
    selectionKey = selection;
    selected = [];
  }
  const legal = mine?.legal ?? [];
  const can = (a: DuelAction | LobbyAction) =>
    !blocked && legal.some((l) => JSON.stringify(l) === JSON.stringify(a));
  const phase =
    v.phase === "lobby"
      ? "เลือกบทบาทและเตรียมพร้อม"
      : v.phase === "results"
        ? "เปิดการ์ดและสรุปรอบ"
        : v.phase === "finished"
          ? "จบการดวล"
          : v.step === "discard"
            ? "เลือกการ์ดที่จะทิ้ง"
            : v.step === "effect"
              ? "เลือกเป้าหมายความสามารถ"
              : "จั่วการ์ดหรือขอจบรอบ";
  root.innerHTML = `<div class="duel-room room-heading"><div><h1>Dracula <span>vs</span> Van Helsing</h1><p>${v.round ? `รอบ ${v.round}/5 • ` : ""}${phase}</p></div>${roomCode(v.code)}</div>
  <div class="duel-status">${v.players.map((p) => `<div class="duel-person ${p.id === v.turn && v.phase === "playing" ? "active" : ""} ${p.id === mine?.id ? "is-you" : ""}">${p.character ? rolePortrait(p.character) : ""}<strong>${p.character ? ROLE_NAME[p.character] : "ยังไม่เลือกบทบาท"}</strong>${p.id === mine?.id ? '<b class="role-you">คุณ</b>' : ""}<span class="duel-player-name">${esc(p.name)}</span><small>${!p.connected ? "หลุด • รอกลับเข้าห้อง" : v.phase === "lobby" ? (p.ready ? "พร้อมแล้ว" : "ยังไม่พร้อม") : p.id === v.turn && v.phase === "playing" ? "กำลังเล่น" : "เชื่อมต่อแล้ว"}</small></div>`).join("")}${v.phase !== "lobby" ? `<div class="duel-health"><strong>${v.hp}/12</strong><span>พลังชีวิต Dracula</span></div>` : ""}</div>
  <section id="duel-controls" class="duel-controls"></section><section id="duel-board"></section>
  <details class="duel-help"><summary>วิธีเล่นและความสามารถการ์ด</summary><p>วางการ์ดตรงเขต 1–5 ห้ามจัดใหม่เอง ในตาของคุณจั่วหนึ่งใบ แล้วทิ้งใบที่จั่วหรือเปลี่ยนกับใบในเขต ความสามารถมาจากใบที่ทิ้ง และต้องทำถ้าทำได้</p><p>ทรัมป์ชนะสีอื่น ถ้าเหมือนกันใช้เลข เลขเท่ากันใช้ลำดับสี เปิดการ์ดคงเปิดแม้สลับตำแหน่ง</p><ol>${Object.entries(
    EFFECTS,
  )
    .map(([n, e]) => `<li value="${n}">${e}</li>`)
    .join(
      "",
    )}</ol><p>กองทิ้งครบ 6 ใบจึงขอจบรอบได้ คู่แข่งได้ตาสุดท้าย การ์ด 5 เล่นต่อได้ การ์ด 8 จบโดยไม่ให้ตาสุดท้าย กองจั่วหมดก็จบรอบ</p><p>ตัดสินเขต 1 → 5: Dracula ชนะเปลี่ยนคนเป็นแวมไพร์ Helsing ชนะลด HP หนึ่ง ตรวจผู้ชนะทุกเขตและหยุดทันทีเมื่อ HP 0 หรือเขตใดมีแวมไพร์ 4 ถ้ารอดครบ 5 รอบ Dracula ชนะ</p><p>เกม Mandoo Games ©2023 ดู <a href="https://cdn.svc.asmodee.net/production-asmodeeit/uploads/2024/09/DraculaVSVanHelsing_ITA.pdf" target="_blank" rel="noreferrer">คู่มือทางการ</a> เวอร์ชันเว็บเพิ่มช่วงรอทั้งสองกดพร้อมเพื่อดูผลรอบ</p></details>`;
  const controls = root.querySelector<HTMLElement>("#duel-controls")!,
    board = root.querySelector<HTMLElement>("#duel-board")!;
  const bind = (selector: string, a: DuelAction | LobbyAction | HostAction) =>
    controls
      .querySelector(selector)
      ?.addEventListener("click", () => command(a));
  const showRack = (character: "dracula" | "helsing", i: number) =>
    own === character && mine
      ? mine.cards[i]
      : (v.racks?.[character][i] ?? null);
  const boardHTML = `<div class="board-public"><div class="board-turn"><span>${marker("ship")}รอบ ${v.round}/5</span><strong>${v.phase === "playing" ? `ตาของ ${esc(name(v.turn))}` : v.phase === "finished" ? "จบการดวล" : "ผลรอบ"}</strong><small>${esc(v.lastAction)}</small></div><div class="board-health">${marker("heart")}<strong>${v.hp}/12</strong><span>HP Dracula</span></div></div><div class="duel-ranking"><span>สีทรัมป์ → อันดับต่ำสุด</span>${v.ranking!.map((s, i) => `<b class="suit-${s}">${i === 0 ? "ทรัมป์ " : ""}${SUIT_NAME[s]}</b>`).join("")}</div>
  <div class="city-map"><div class="district-map" aria-label="เขต 1 ถึง 5 ตัดสินจากซ้ายไปขวา">${[
    0, 1, 2, 3, 4,
  ]
    .map((i) => {
      const result = v.result?.districts.find((r) => r.district === i);
      return `<section class="district" data-district="${i}"><h2>เขต ${i + 1}</h2><div class="district-side" data-side="dracula"><span>Dracula</span>${card(showRack("dracula", i), mine && own === "dracula" ? "การ์ดของคุณ" : "")}</div><div class="inhabitants" aria-label="แวมไพร์ ${v.vampires![i]} จาก 4 คน">${Array.from({ length: 4 }, (_, j) => `<span class="${j < v.vampires![i] ? "vampire" : "human"}">${marker(j < v.vampires![i] ? "vampire" : "human")}</span>`).join("")}</div><span class="conversion-count">แวมไพร์ ${v.vampires![i]}/4</span><div class="district-side" data-side="helsing"><span>Van Helsing</span>${card(showRack("helsing", i), mine && own === "helsing" ? "การ์ดของคุณ" : "")}</div>${v.result ? `<p class="district-result">${result ? `${ROLE_NAME[result.winner]} ชนะ<br>${result.reason}<br>${result.winner === "dracula" ? "แวมไพร์ +1" : "HP −1"}` : "ไม่ตัดสิน • เกมจบก่อนถึงเขตนี้"}</p>` : ""}</section>`;
    })
    .join(
      "",
    )}</div></div><div class="duel-piles"><div><h3>กองจั่ว ${v.deckCount} ใบ</h3>${v.deckTop ? card(v.deckTop, "ใบบนสุดที่เปิดแล้ว") : "<p>ใบบนสุดคว่ำอยู่</p>"}</div><div><h3>กองทิ้ง ${v.discard!.length} ใบ</h3><div class="discard-list">${v.discard!.map((c) => `<span class="suit-${c.suit}">${SUIT_NAME[c.suit]} ${c.value}</span>`).join("") || "ยังไม่มีการ์ด"}</div></div></div>`;
  const publicDraw = v.drawn
    ? `<section class="public-draw" role="status"><div><h2>${esc(name(v.turn))} จั่วไพ่ที่เปิดเผยแล้ว</h2><p>${SUIT_NAME[v.drawn.suit]} ${v.drawn.value} • ทุกคนเห็นใบนี้</p><p>กำลังเลือกทิ้ง หรือวางแทนที่เขต 1–5 ไพ่จะยังเปิดเผยเมื่อวางแล้ว</p></div>${card(v.drawn, "เปิดเผยต่อทุกคน")}</section>`
    : "";
  const outcome =
    v.phase === "finished"
      ? `<section class="round-outcome winner-seal">${rolePortrait(v.winner!)}<div><h2>ผู้ชนะ: ${ROLE_NAME[v.winner!]}</h2><p>${esc(v.reason)}</p></div></section>`
      : v.phase === "results"
        ? `<section class="round-outcome"><h2>เปิดการ์ดรอบ ${v.result!.round}</h2><p>${esc(v.result!.cause)}</p></section>`
        : "";
  motion.mount(board);
  motion.update(v, publicDraw + outcome + boardHTML, snapshot);
  if (v.phase === "finished") {
    controls.innerHTML = `<p>การดวลจบแล้ว ดูผลแต่ละเขตด้านล่าง</p>${host ? `<button id="duel-restart" ${blocked || v.players.some((p) => !p.connected) ? "disabled" : ""}>เล่นอีกครั้ง</button><p>ใช้ห้องและบทบาทเดิม เริ่มเกมใหม่เมื่อทั้งสองคนเชื่อมต่อ</p>` : "<p>รอผู้สร้างห้องกดเล่นอีกครั้งที่จอกลาง</p>"}`;
    bind("#duel-restart", { type: "restart" });
    motion.bindControls(controls);
    return;
  }
  if (v.phase === "results") {
    controls.innerHTML = `<h2>ผลรอบ ${v.result!.round}</h2><p>${esc(v.result!.cause)} • เฉลยการ์ดสองฝ่ายทีละเขต</p>${mine ? `<button id="next-round" ${!can({ type: "next-round" }) ? "disabled" : ""}>พร้อมรอบถัดไป</button><p>${v.acknowledged!.includes(mine.id) ? "คุณพร้อมแล้ว รออีกฝ่าย" : "ดูผลทั้ง 5 เขต แล้วกดพร้อมเพื่อเริ่มรอบใหม่"}</p>` : "<p>รอผู้เล่นทั้งสองกดพร้อมรอบถัดไปจากมือถือ</p>"}`;
    bind("#next-round", { type: "next-round" });
    motion.bindControls(controls);
    return;
  }
  controls.innerHTML = `<div class="controller-ranking" aria-label="ลำดับสีปัจจุบัน"><span>ทรัมป์</span>${v.ranking!.map((s,i)=>`<b class="suit-${s} ${i===0?"current-trump":""}" aria-label="${i===0?"สีทรัมป์ ":""}${SUIT_NAME[s]}">${i===0?SUIT_NAME[s]:SUIT_NAME[s].split(" ")[1]}</b>`).join("<span class=rank-arrow aria-hidden=true>›</span>")}</div><h2>${mine && v.turn === mine.id ? "ตาของคุณ" : `ตาของ ${esc(name(v.turn))}`}</h2><p>${esc(v.lastAction)}</p>${v.ending ? '<p class="duel-ending">มีคนขอจบรอบแล้ว นี่คือตาสุดท้าย (การ์ด 5 ต่อได้)</p>' : ""}<div id="duel-action-panel"></div>`;
  const panel = controls.querySelector<HTMLElement>("#duel-action-panel")!;
  if (!mine || v.turn !== mine.id) {
    panel.innerHTML = `<p>${mine ? "รอคู่แข่งเล่น การ์ดของคุณแสดงเฉพาะบนเครื่องนี้" : "เลือกการกระทำผ่านมือถือ จอกลางดูได้เฉพาะการ์ดที่เปิดแล้ว"}</p>`;
    return;
  }
  if (v.step === "draw") {
    panel.innerHTML = `<button id="draw" ${!can({ type: "draw" }) ? "disabled" : ""}>จั่วการ์ด</button><button id="end-round" ${!can({ type: "end-round" }) ? "disabled" : ""}>ขอจบรอบ</button><p>${v.discard!.length < 6 ? "ขอจบรอบได้เมื่อกองทิ้งมีอย่างน้อย 6 ใบ" : "ขอจบรอบแทนจั่ว คู่แข่งได้ตาสุดท้าย"}</p>`;
    bind("#draw", { type: "draw" });
    bind("#end-round", { type: "end-round" });
    return;
  }
  if (v.step === "discard") {
    panel.innerHTML = `<h3>ใบที่จั่วมา</h3>${card(mine.drawn!)}<p>เลือกทิ้งใบที่จั่ว หรือเลือกเขตเพื่อแทนที่แล้วทิ้งใบเดิม ความสามารถของใบที่ทิ้งจะทำงาน</p><div class="discard-choices">${[-1, 0, 1, 2, 3, 4].map((slot) => `<button class="discard-choice" data-slot="${slot}" aria-pressed="${selected[0] === slot}" ${!can({ type: "discard", slot }) ? "disabled" : ""}>${slot === -1 ? "ทิ้งใบที่จั่ว" : `แทนที่เขต ${slot + 1}`}${card(slot === -1 ? mine.drawn! : mine.cards[slot])}</button>`).join("")}</div><div class="discard-confirm-bar" hidden><p id="selection-preview" role="status"></p><button id="confirm-discard" disabled>ยืนยันทิ้งการ์ด</button></div>`;
    panel.querySelectorAll<HTMLButtonElement>("[data-slot]").forEach((b) =>
      b.addEventListener("click", () => {
        selected = [Number(b.dataset.slot)];
        updateDiscard();
        if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
          b.animate(
            [
              { transform: "translateY(0)" },
              { transform: "translateY(-5px)" },
              { transform: "translateY(0)" },
            ],
            { duration: 180 },
          );
      }),
    );
    function updateDiscard() {
      panel
        .querySelectorAll<HTMLElement>("[data-slot]")
        .forEach((b) =>
          b.setAttribute(
            "aria-pressed",
            String(Number(b.dataset.slot) === selected[0]),
          ),
        );
      (panel.querySelector(".discard-confirm-bar") as HTMLElement).hidden = selected.length !== 1;
      const c = selected[0] === -1 ? mine!.drawn! : mine!.cards[selected[0]];
      panel.querySelector("#selection-preview")!.textContent = c
        ? `จะทิ้ง ${SUIT_NAME[c.suit]} ${c.value} • ${EFFECTS[c.value]}`
        : "";
      (panel.querySelector("#confirm-discard") as HTMLButtonElement).disabled =
        selected.length !== 1 || !can({ type: "discard", slot: selected[0] });
    }
    updateDiscard();
    panel
      .querySelector("#confirm-discard")!
      .addEventListener("click", () =>
        command({ type: "discard", slot: selected[0] }),
      );
    return;
  }
  const choices = legal.filter(
    (a): a is Extract<DuelAction, { type: "effect" }> => a.type === "effect",
  );
  panel.innerHTML = `<h3>ทำความสามารถ ${v.effect}: ${EFFECTS[v.effect!]}</h3><div class="effect-choices ${v.effect === 7 ? "trump-choices" : ""}">${choices.map((a, i) => `<button data-effect="${i}" ${v.effect===7 ? `class="trump-choice suit-${v.ranking![a.targets[0]]}" aria-label="เปลี่ยนทรัมป์เป็น ${SUIT_NAME[v.ranking![a.targets[0]]]}"` : ""} aria-pressed="${JSON.stringify(selected) === JSON.stringify(a.targets)}" ${blocked ? "disabled" : ""}>${v.effect === 7 ? `<span aria-hidden="true">${SUIT_NAME[v.ranking![a.targets[0]]].split(" ")[1]}</span>` : a.targets.map((t) => `เขต ${t + 1}`).join(" ↔ ")}</button>`).join("")}</div><p id="effect-preview" role="status"></p><button id="confirm-effect" disabled>ยืนยันความสามารถ</button>`;
  function updateEffect() {
    panel
      .querySelectorAll<HTMLElement>("[data-effect]")
      .forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(
            JSON.stringify(selected) ===
              JSON.stringify(choices[Number(b.dataset.effect)].targets),
          ),
        ),
      );
    const match = choices.find(
      (a) => JSON.stringify(a.targets) === JSON.stringify(selected),
    );
    (panel.querySelector("#confirm-effect") as HTMLButtonElement).disabled =
      !match || blocked;
    panel.querySelector("#effect-preview")!.textContent = match
      ? `เลือกแล้ว: ${v.effect === 7 ? SUIT_NAME[v.ranking![selected[0]]] : selected.map((t) => `เขต ${t + 1}`).join(" ↔ ")}`
      : "เลือกเป้าหมายก่อนยืนยัน";
  }
  panel.querySelectorAll<HTMLButtonElement>("[data-effect]").forEach((b) =>
    b.addEventListener("click", () => {
      selected = [...choices[Number(b.dataset.effect)].targets];
      updateEffect();
    }),
  );
  updateEffect();
  panel
    .querySelector("#confirm-effect")!
    .addEventListener("click", () =>
      command({ type: "effect", targets: [...selected] }),
    );
}
