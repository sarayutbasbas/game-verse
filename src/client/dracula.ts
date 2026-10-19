import {illustratedGameGuide} from './game-learning.js';
import { patchHTML } from "./dom-patch.js";
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
  suitIcon,
  suitLabel,
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
const compactEffects: Record<number, string> = {1:"เปิดไพ่เรา",2:"เปิดกองจั่ว",3:"เปิดไพ่คู่แข่ง",4:"สลับไพ่เรา",5:"เล่นอีกตา",6:"แลกไพ่",7:"เปลี่ยนทรัมป์",8:"จบรอบ"};
const card = (c: Card | null, caption = "", compact = false) =>
  c
    ? `<span class="duel-card suit-${c.suit}" data-card="revealed" aria-label="${SUIT_NAME[c.suit].split(" ")[0]} ${c.value}: ${EFFECTS[c.value]}"><span class="duel-card-size" aria-hidden="true"></span><span class="card-ink">${suitLabel(c.suit)}</span><strong class="duel-value">${c.value}</strong>${effectIcon(c.value)}${portrait(c.value)}<small class="duel-effect">${compact ? compactEffects[c.value] : EFFECTS[c.value]}</small><span class="visibility">${caption || (c.revealed ? "เปิดเผยแล้ว" : "เฉพาะคุณ")}</span></span>`
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
  const freshSelection = selectionKey !== selection;
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
  root.dataset.duelWaiting = String(!!mine && v.phase === "playing" && v.turn !== mine.id);
  patchHTML(root, `<div class="duel-room room-heading"><div><h1>Dracula <span>vs</span> Van Helsing</h1><p>${v.round ? `รอบ ${v.round}/5 • ` : ""}${phase}</p></div></div>
  <section id="duel-board" data-preserve-content class="duel-game-board ${mine ? "duel-player-board" : ""} own-${own ?? "helsing"}"></section>
  <details class="duel-help"><summary>วิธีเล่นและความสามารถการ์ด</summary>${illustratedGameGuide('dracula-vs-van-helsing')}<p>วางการ์ดตรงเขต 1–5 ห้ามจัดใหม่เอง ในตาของคุณจั่วหนึ่งใบ แล้วทิ้งใบที่จั่วหรือเปลี่ยนกับใบในเขต ความสามารถมาจากใบที่ทิ้ง และต้องทำถ้าทำได้</p><p>ทรัมป์ชนะสีอื่น ถ้าเหมือนกันใช้เลข เลขเท่ากันใช้ลำดับสี เปิดการ์ดคงเปิดแม้สลับตำแหน่ง</p><ol>${Object.entries(
    EFFECTS,
  )
    .map(([n, e]) => `<li value="${n}">${e}</li>`)
    .join(
      "",
    )}</ol><p>กองทิ้งครบ 6 ใบจึงขอจบรอบได้ คู่แข่งได้ตาสุดท้าย การ์ด 5 เล่นต่อได้ การ์ด 8 จบโดยไม่ให้ตาสุดท้าย กองจั่วหมดก็จบรอบ</p><p>ตัดสินเขต 1 → 5: Dracula ชนะเปลี่ยนคนเป็นแวมไพร์ Helsing ชนะลด HP หนึ่ง ตรวจผู้ชนะทุกเขตและหยุดทันทีเมื่อ HP 0 หรือเขตใดมีแวมไพร์ 4 ถ้ารอดครบ 5 รอบ Dracula ชนะ</p><p>เกม Mandoo Games ©2023 ดู <a href="https://cdn.svc.asmodee.net/production-asmodeeit/uploads/2024/09/DraculaVSVanHelsing_ITA.pdf" target="_blank" rel="noreferrer">คู่มือทางการ</a> เวอร์ชันเว็บเพิ่มช่วงรอทั้งสองกดพร้อมเพื่อดูผลรอบ</p></details>`);
  const board = root.querySelector<HTMLElement>("#duel-board")!;
  const bind = (selector: string, a: DuelAction | LobbyAction | HostAction) => {
    const button = root.querySelector<HTMLButtonElement>(selector);
    if (button) button.onclick = () => command(a);
  };
  const choices = legal.filter((a): a is Extract<DuelAction, {type:"effect"}> => a.type === "effect");
  const acting = !!mine && v.turn === mine.id && v.phase === "playing";
  if (freshSelection && acting && v.step === "effect" && choices.length)
    selected = [...choices[0].targets];
  const lockedEight = (c: Card | null | undefined) => acting && v.step === "discard" && c?.value === 8 && v.discard!.length < 6;
  const effectTarget = (character: "dracula" | "helsing", i: number) => acting && v.step === "effect" && v.effect !== 7 &&
    (v.effect === 6 || (v.effect === 3 ? character !== own : character === own)) && choices.some(a=>a.targets.includes(i));
  const hint = v.step === "effect" ? (v.effect === 4 ? "เลือกไพ่ของคุณ 2 ใบเพื่อสลับ" : v.effect === 6 ? "เลือกเขตที่ต้องการแลกไพ่" : v.effect === 3 ? "เลือกไพ่คู่แข่งที่ต้องการเปิด" : v.effect === 7 ? "เลือกสีทรัมป์บนกระดาน" : "เลือกไพ่ของคุณที่ต้องการเปิด") : v.step === "discard" ? "เลือกทิ้งใบกลางหรือแทนที่ไพ่ของคุณ" : "แตะกองกลางเพื่อจั่วการ์ด";
  const showRack = (character: "dracula" | "helsing", i: number) =>
    own === character && mine
      ? (v.result && !mine.cards[i].revealed ? null : mine.cards[i])
      : (v.racks?.[character][i] ?? null);
  const rackCard = (character: "dracula" | "helsing", i: number) => {
    const c = showRack(character, i);
    const exposed = !!mine && own === character && v.phase === "playing" && !!c?.revealed;
    const face = `<span class="rack-face ${exposed ? "rack-is-public" : ""}" data-own="${!!mine && own === character}" data-public="${exposed}">${card(c, mine && own === character ? "การ์ดของคุณ" : "", true)}${exposed ? '<span class="rack-public-badge" aria-label="ไพ่ใบนี้เปิดเผยต่อคู่แข่งอยู่">เปิดแล้ว</span>' : ""}${own === character && lockedEight(c) ? '<span class="card-lock-badge" title="กองทิ้งต้องครบ 6 ใบก่อน">ทิ้งไม่ได้</span>' : ""}</span>`;
    if (v.result && own===character && !c && legal.some(a=>a.type==="reveal-result" && a.slot===i))
      return `<button data-ui-key="rack-${character}-${i}" class="rack-item result-reveal-card" data-result-slot="${i}" aria-label="เปิดไพ่ของคุณ เขต ${i+1}" ${blocked?"disabled":""}>${face}<span class="tap-reveal">แตะเปิด</span></button>`;
    if (effectTarget(character, i)) return `<button data-ui-key="rack-${character}-${i}" class="rack-item rack-choice effect-card" data-effect="${i}" data-target="${i}" data-target-side="${character}" aria-label="${v.effect === 6 ? "แลกไพ่" : v.effect === 4 ? "สลับไพ่" : "เปิดไพ่"} ${ROLE_NAME[character]} เขต ${i + 1}" aria-pressed="${selected.includes(i)}" ${blocked ? "disabled" : ""}>${face}</button>`;
    return mine && own === character && v.turn === mine.id && v.step === "discard" && v.phase === "playing"
      ? `<button data-ui-key="rack-${character}-${i}" class="rack-item rack-choice" data-slot="${i}" aria-label="แทนที่เขต ${i + 1}" aria-pressed="${selected[0] === i}" ${!can({type: "discard", slot: i}) ? "disabled" : ""}>${face}</button>`
      : mine ? `<button data-ui-key="rack-${character}-${i}" class="rack-item rack-readonly" disabled aria-label="${ROLE_NAME[character]} เขต ${i + 1}">${face}</button>` : face;
  };
  const incoming = mine?.drawn ?? v.drawn;
  const centerFace = incoming ?? v.deckTop ?? null;
  const centerAction = mine && v.turn === mine.id && v.phase === "playing";
  const activeRole = v.phase === "playing" ? v.players.find(p=>p.id===v.turn)?.character : undefined;
  const roleLabel = (character: "dracula" | "helsing") => character === "dracula" ? "แวมไพร์ (Dracula)" : "แวน (Van Helsing)";
  const bottomRole = own ?? "helsing", topRole = bottomRole === "helsing" ? "dracula" : "helsing";
  const rackLabel = (character: "dracula" | "helsing", position: "top" | "bottom") => {
    const person = v.players.find(p=>p.character===character);
    return `<div class="rack-side-label rack-label-${position}" data-active="${activeRole === character}" data-character="${character}">${character === "dracula" ? `<div class="board-health rack-health" aria-label="พลังชีวิต Dracula">${marker("heart")}<strong>${v.hp}/12</strong></div>` : ""}<div class="rack-person ${character===own ? "is-you" : ""}">${rolePortrait(character)}<div><strong>${mine ? (character === own ? "คุณ • " : "คู่แข่ง • ") : ""}${roleLabel(character)}</strong><small>${esc(person?.name ?? "")} • ${!person?.connected ? "หลุด" : activeRole===character ? "กำลังเล่น" : "ออนไลน์"}</small></div></div></div>`;
  };
  const centerCard = card(centerFace, incoming ? (v.drawn ? "เปิดเผยต่อทุกคน" : "เฉพาะคุณ") : "");
  const center = `<section class="city-draw ${v.drawn ? "public-draw" : ""}" data-draw-cue="${!!centerAction && v.step === "draw" && !blocked}" data-draw-state="${v.step === "discard" ? "held" : "deck"}" aria-label="กองจั่วกลางกระดาน">
    ${v.result ? `<div class="center-card result-deck">${card(null)}</div><section id="duel-controls" class="duel-controls" data-preserve-content></section>` : centerAction && v.step === "draw" ? `<button id="draw" class="board-draw" aria-label="จั่วการ์ด" ${!can({type:"draw"}) ? "disabled" : ""}>${centerCard}<span>จั่วการ์ด</span></button>`
    : centerAction && v.step === "discard" ? `<button class="discard-choice center-discard" data-slot="-1" aria-label="${lockedEight(incoming) ? "ทิ้งไม่ได้ ต้องมีกองทิ้งครบ 6 ใบก่อน" : "ทิ้งใบที่จั่ว"}" aria-pressed="${selected[0] === -1}" ${!can({type:"discard",slot:-1}) ? "disabled" : ""}>${centerCard}<span>${lockedEight(incoming) ? "ทิ้งไม่ได้ • กองทิ้งยังไม่ครบ 6 ใบ" : "จั่วแล้ว • ทิ้งใบนี้"}</span></button>`
    : `<div class="center-card">${centerCard}</div><small>${incoming ? "ไพ่ที่เปิดเผย" : v.step === "discard" ? "รอเลือกไพ่" : "กองจั่ว"}</small>`}
    ${incoming?.revealed && v.phase === "playing" ? '<small class="drawn-public-note">เปิดจากกองจั่วแล้ว</small>' : ""}<small class="center-step-status" role="status">${v.phase !== "playing" ? "" : v.step === "discard" ? (centerAction ? "เลือกทิ้งหรือแทนที่" : "คู่แข่งจั่วแล้ว") : v.phase === "playing" && v.step === "draw" ? (centerAction ? "ตาคุณ • แตะเพื่อจั่ว" : `รอ ${activeRole ? ROLE_NAME[activeRole] : "คู่แข่ง"} จั่ว`) : v.deckTop ? "ใบบนสุดเปิดอยู่ • ยังไม่ได้จั่ว" : ""}</small><small class="center-deck-count">เหลือ ${v.deckCount} ใบ</small></section>`;
  const exposedSlots = mine?.cards.flatMap((c, i) => c.revealed ? [i + 1] : []) ?? [];
  const exposureSummary = mine ? `<p class="rack-reveal-summary" role="status">${v.phase === "playing" ? `ไพ่ของคุณเปิดเผยแล้ว <b>${exposedSlots.length}/5 ใบ</b>${exposedSlots.length ? ` • เขต ${exposedSlots.join(", ")}` : ""}` : "ผลการเปิดไพ่แต่ละเขต"}</p>` : "";
  const boardHTML = `<div class="board-public"><div class="board-turn"><span>${marker("ship")}รอบ ${v.round}/5</span><strong>${v.revealPending ? "จบรอบแล้ว เปิดการ์ดเพื่อดูคะแนน" : v.phase === "playing" ? hint : v.phase === "finished" ? "จบการดวล" : "ผลรอบ"}</strong><small>${esc(v.lastAction)}</small></div></div><div class="duel-ranking controller-ranking">${v.ranking!.map((s, i) => (i ? '<span class="rank-arrow" aria-hidden="true">→</span>' : "") + (acting && v.step === "effect" && v.effect === 7 && choices.some(a=>a.targets[0]===i) ? `<button class="trump-choice suit-${s}" data-effect="${choices.findIndex(a=>a.targets[0]===i)}" data-trump-target="${i}" aria-label="เปลี่ยนทรัมป์เป็น ${SUIT_NAME[s]}" aria-pressed="${selected[0]===i}" ${blocked?"disabled":""}>${suitIcon(s)}</button>` : `<b class="suit-${s} ${i===0?"current-trump":""}">${suitLabel(s)}</b>`)).join("")}</div>
  ${mine?.exchange?`<p class="duel-exchange-note" role="status">${mine.exchange.initiated?"คุณแลกไพ่":"คู่แข่งแลกไพ่ของคุณ"} • เขต ${mine.exchange.slot+1}<br>ส่ง ${suitLabel(mine.exchange.gave.suit)} ${mine.exchange.gave.value} ไป • รับ ${suitLabel(mine.exchange.received.suit)} ${mine.exchange.received.value}</p>`:""}${exposureSummary}<div class="city-map" data-trump="${v.ranking![0]}">${rackLabel(topRole,"top")}<div class="district-map" aria-label="เขต 1 ถึง 5 ตัดสินจากซ้ายไปขวา"><div class="rack-turn-frame rack-frame-top" data-active="${activeRole === topRole}" aria-hidden="true"></div><div class="rack-turn-frame rack-frame-bottom" data-active="${activeRole === bottomRole}" aria-hidden="true"></div><div class="city-terrain" aria-hidden="true"></div>${center}${[0,1,2,3,4].map((i) => {
    const result = v.result?.districts.find((r) => r.district === i);
    return `<section class="district" data-ui-key="district-${i}" data-district="${i}" style="--district-column:${i + 1}"><div class="district-side" data-ui-key="side-dracula" data-side="dracula"><span>Dracula</span>${rackCard("dracula", i)}</div><div class="district-territory"><div class="territory-content"><h2>เขต ${i + 1}</h2><div class="inhabitants" aria-label="แวมไพร์ ${v.vampires![i]} จาก 4 คน">${Array.from({length:4},(_,j)=>`<span class="${j < v.vampires![i] ? "vampire" : "human"}">${marker(j < v.vampires![i] ? "vampire" : "human")}</span>`).join("")}</div><span class="conversion-count">แวมไพร์ ${v.vampires![i]}/4</span></div></div><div class="district-side" data-ui-key="side-helsing" data-side="helsing"><span>Van Helsing</span>${rackCard("helsing", i)}</div>${v.result ? `<p class="district-result">${result ? `${ROLE_NAME[result.winner]} ชนะ<br>${result.reason}<br>${result.winner === "dracula" ? "แวมไพร์ +1" : "HP −1"}` : (v.revealPending ? "เปิดไพ่ทั้งสองฝั่งเพื่อดูคะแนน" : "ไม่ตัดสิน • เกมจบก่อนถึงเขตนี้")}</p>` : ""}</section>`;
  }).join("")}</div>${rackLabel(bottomRole,"bottom")}</div>${mine && v.phase === "playing" ? `<div class="board-secondary"><button id="end-round" ${!can({type:"end-round"})?"disabled":""} title="${v.discard!.length < 6 ? "ต้องมีกองทิ้งอย่างน้อย 6 ใบ" : "ใช้แทนการจั่วเมื่อถึงตาคุณ"}">ขอจบรอบ</button></div>` : ""}${!v.result ? '<section id="duel-controls" class="duel-controls" data-preserve-content></section>' : ""}<div class="duel-piles"><div><h3>กองจั่ว ${v.deckCount} ใบ</h3><p>${v.deckTop ? "ใบบนสุดเปิดเผยอยู่กลางกระดาน" : "แตะกองไพ่กลางกระดานเมื่อถึงตาของคุณ"}</p></div><div><h3>กองทิ้ง ${v.discard!.length} ใบ</h3><div class="discard-list">${v.discard!.map((c)=>`<span class="suit-${c.suit}">${suitLabel(c.suit)} ${c.value}</span>`).join("") || "ยังไม่มีการ์ด"}</div></div></div>`;
  const outcome = v.phase === "finished"
    ? `<section class="round-outcome winner-seal">${rolePortrait(v.winner!)}<div><h2>ผู้ชนะ: ${ROLE_NAME[v.winner!]}</h2><p>${esc(v.reason)}</p></div></section>` : "";
  motion.mount(board);
  motion.update(v, outcome + boardHTML, snapshot);
  // Presence/name updates may share a game revision. The motion controller
  // deliberately preserves card DOM for those deliveries; update live labels
  // separately without interrupting an active reveal or repainting its HP.
  for (const p of v.players) {
    const status = board.querySelector<HTMLElement>(`.rack-side-label[data-character="${p.character}"] .rack-person small`);
    if (status) status.textContent = `${p.name} • ${!p.connected ? "หลุด" : activeRole === p.character ? "กำลังเล่น" : "ออนไลน์"}`;
  }
  const controls = board.querySelector<HTMLElement>("#duel-controls")!;
  controls.classList.toggle("board-controls", v.phase === "playing");
  if (v.phase === "finished") {
    controls.innerHTML = `${host ? `<button id="duel-restart" ${blocked || v.players.some((p) => !p.connected) ? "disabled" : ""}>เล่นอีกครั้ง</button>` : "<p>รอผู้สร้างห้องเริ่มใหม่</p>"}`;
    bind("#duel-restart", { type: "restart" });
    return;
  }
  if (v.phase === "results" && v.revealPending) {
    controls.innerHTML=`<p>เปิดแล้ว ${v.revealedCount}/10 ใบ</p><p>${!mine ? "รอผู้เล่นเปิดไพ่จากมือถือ" : mine.cards.every(c=>c.revealed) ? "คุณเปิดครบแล้ว รออีกฝ่าย" : "แตะเปิดไพ่ฝั่งของคุณ"}</p>`;
    root.querySelectorAll<HTMLButtonElement>('[data-result-slot]').forEach(b=>{
      b.onclick=()=>command({type:"reveal-result",slot:Number(b.dataset.resultSlot),round:v.round!});
    });
    return;
  }
  if (v.phase === "results") {
    controls.innerHTML = `${mine ? `<button id="next-round" ${!can({ type: "next-round" }) ? "disabled" : ""}>พร้อมรอบถัดไป</button><p class="round-ready-status" role="status">${v.acknowledged!.includes(mine.id) ? "คุณพร้อมแล้ว รออีกฝ่าย" : "ดูผลแล้วกดพร้อม"}</p>` : "<p>รอผู้เล่นทั้งสองกดพร้อมจากมือถือ</p>"}`;
    bind("#next-round", { type: "next-round" });
    return;
  }
  controls.replaceChildren();
  if (!acting) return;
  bind("#end-round", {type:"end-round"});
  if (v.step === "draw") {
    const drawButton = board.querySelector<HTMLButtonElement>("#draw");
    if (drawButton) {
      drawButton.disabled = !can({type:"draw"});
      drawButton.onclick = () => command({type:"draw"});
    }
    return;
  }
  const panel = controls;
  if (v.step === "discard") {
    panel.innerHTML = `<div class="discard-confirm-bar" hidden><p id="selection-preview" role="status"></p><button id="confirm-discard" disabled>ยืนยันทิ้งการ์ด</button></div>`;
    root.querySelectorAll<HTMLButtonElement>("[data-slot]").forEach((b) => {
      b.disabled = !can({type: "discard", slot: Number(b.dataset.slot)});
      b.onclick = () => {
        selected = [Number(b.dataset.slot)];
        updateDiscard();
        if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
          b.animate(
            [{ transform: "translateY(0)" }, { transform: "translateY(-5px)" }, { transform: "translateY(0)" }],
            { duration: 180 },
          );
      };
    });
    function updateDiscard() {
      root
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
        ? `จะทิ้ง ${SUIT_NAME[c.suit].split(" ")[0]} ${c.value} • ${EFFECTS[c.value]}`
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
  panel.innerHTML = `<div class="discard-confirm-bar effect-confirm-bar" hidden><p id="effect-preview" role="status"></p><button id="confirm-effect" disabled>ยืนยันความสามารถ</button></div>`;
  const selectedAction = () => choices.find(a=>JSON.stringify(a.targets)===JSON.stringify(selected));
  const updateEffect = () => {
    root.querySelectorAll<HTMLButtonElement>("[data-target], [data-trump-target]").forEach(b=> {
      const i = Number(b.dataset.target ?? b.dataset.trumpTarget);
      b.setAttribute("aria-pressed",String(selected.includes(i)));
      b.disabled = blocked;
    });
    const match = selectedAction();
    panel.querySelector<HTMLElement>(".effect-confirm-bar")!.hidden = selected.length === 0;
    panel.querySelector<HTMLButtonElement>("#confirm-effect")!.disabled = !match || blocked;
    const side = v.effect === 3 ? "ไพ่คู่แข่ง" : v.effect === 6 ? "ไพ่ของคุณ ↔ ไพ่คู่แข่ง" : v.effect === 7 ? "สีทรัมป์" : "ไพ่ของคุณ";
    panel.querySelector("#effect-preview")!.textContent = selected.length ? `${EFFECTS[v.effect!]} • ${side} • ${v.effect === 7 ? SUIT_NAME[v.ranking![selected[0]]].split(" ")[0] : selected.map(i=>`เขต ${i+1}`).join(" ↔ ")}${v.effect === 4 && selected.length === 1 ? " • เลือกอีก 1 ใบ" : ""}${v.effect===6&&selected.length===1?` • จะส่ง ${SUIT_NAME[mine!.cards[selected[0]].suit]} ${mine!.cards[selected[0]].value} ให้คู่แข่ง`:""}` : "";
  };
  root.querySelectorAll<HTMLButtonElement>("[data-target], [data-trump-target]").forEach(b=> {
    b.onclick = () => {
      const i = Number(b.dataset.target ?? b.dataset.trumpTarget);
      if (selected.includes(i)) selected = selected.filter(n=>n!==i);
      else selected = v.effect === 4 ? [...selected.slice(-1),i].sort((a,b)=>a-b) : [i];
      updateEffect();
    };
  });
  updateEffect();
  panel.querySelector<HTMLButtonElement>("#confirm-effect")!.onclick = () => {
    const action = selectedAction();
    if (action && !blocked) command(action);
  };
}
