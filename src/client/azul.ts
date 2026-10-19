import {illustratedGameGuide} from './game-learning.js';
import { roomCode } from "./ui.js";
import { TILE_NAMES, type TileColor, type AzulView } from "../games/azul/types.js";
import type { RoomAction } from "../shared/types.js";
import { azulArtState, preloadAzulArt } from "./azul-assets.js";
import { Tile, FactoryDisplay, OfferGroups, PlayerBoard, RoundSummary, FinalResults, esc, sourceName } from "./azul-components.js";
import "./azul.css";
type Choice = { source: number; color: TileColor; target?: number };
class AzulTable {
  readonly node = document.createElement("div");
  private view?: AzulView;
  private signature = "";
  private selectionKey = "";
  private inspected = "";
  private choice?: Choice;
  private expanded = false;
  private message = "";
  private blocked = false;
  private host = false;
  private command: (a: RoomAction) => void = () => {};
  constructor() {
    this.node.className = "az-scene";
    this.node.addEventListener("error", e => {
      if (e.target instanceof HTMLImageElement) {
        e.target.hidden = true;
        e.target.parentElement?.classList.add("art-missing");
      }
    }, true);
    this.node.addEventListener("click", event => this.click(event));
  }
  update(v: AzulView, host: boolean, blocked: boolean, command: (a: RoomAction) => void) {
    const key = `${v.code}:${v.revision}:${v.me?.id}`;
    if (key !== this.selectionKey) {
      this.message = this.choice ? "สถานะเปลี่ยนแล้ว ยกเลิกการเลือกเดิม กรุณาเลือกใหม่เมื่อถึงตา" : "";
      this.choice = undefined; this.expanded = false; this.selectionKey = key;
    }
    if (!this.view || this.view.code !== v.code || this.view.me?.id !== v.me?.id) this.inspected = v.me?.id ?? "";
    this.view = v; this.host = host; this.blocked = blocked; this.command = command;
    const signature = JSON.stringify(v) + host;
    if (signature !== this.signature) { this.signature = signature; this.build(); }
    this.updateInteraction();
  }
  private active() { return !this.blocked && this.view?.phase === "playing" && this.view.turn === this.view.me?.id; }
  private offer() { return this.choice && this.view?.me?.offers.find(o => o.source === this.choice!.source && o.color === this.choice!.color); }
  private build() {
    const v = this.view!, name = (id?: string) => esc(v.players.find(p => p.id === id)?.name ?? "");
    this.node.dataset.players = String(v.players.length);
    this.node.dataset.presentationRevision = String(v.revision);
    this.node.innerHTML = `<div class="az-heading"><div><h1 translate="no">Azul</h1><p>ผนังสีมาตรฐาน • รอบ ${v.round}</p></div></div>
      <section class="az-turn" role="status"><strong>${v.phase === "playing" ? `รอบ ${v.round}` : v.phase === "finished" ? `${v.winners!.length > 1 ? "ผู้ชนะร่วม" : "ผู้ชนะ"}: ${v.winners!.map(name).join(" และ ")}` : `ผลรอบ ${v.round}`}</strong><p>${esc(v.lastAction)}</p></section>
      ${azulArtState.missing.length ? '<p class="az-art-warning" role="status">ภาพบางส่วนโหลดไม่ได้ ใช้สีและตัวอักษรสำรองได้ ลองโหลดหน้าใหม่เพื่อรับภาพครบ</p>' : ""}
      ${v.phase === "results" ? `<section class="az-results"><h2>สรุปการปูผนังรอบ ${v.round}</h2><p>ผู้เริ่มรอบหน้า: ${name(v.starter)} • ผู้เล่นคนใดหรือผู้สร้างห้องกดต่อได้ ไม่ต้องรอทุกคนพร้อม</p>${RoundSummary(v, v.settlements!.at(-1)!)}${v.me || this.host ? '<button id="az-next">เริ่มรอบถัดไป</button>' : '<p>รอผู้เล่นหรือผู้สร้างห้อง</p>'}</section>` : ""}
      ${v.phase === "finished" ? FinalResults(v, this.host, this.blocked) : ""}
      <div class="az-layout"><section class="az-supply"><h2>1 เลือกสีกระเบื้อง</h2><p>ในถุง ${v.bagCount} • กองทิ้ง ${v.discardCount} ชิ้น</p><div class="az-source-selection" role="status"></div><div class="az-supply-body"><div class="az-factories">${v.factories!.map(FactoryDisplay).join("")}</div><section class="az-center"><h3>กลางโต๊ะ</h3>${v.markerInCenter ? `<p class="az-center-marker">${Tile("first")}คนแรกที่หยิบจากกลางรับ marker</p>` : ""}<div class="az-center-colors">${OfferGroups(v.center!, -1, true)}</div></section></div></section>
      <div class="az-personal"><section class="az-controller" aria-label="เลือกการกระทำ"></section>
      ${v.me ? `<nav class="az-tabs" aria-label="ดูกระดานผู้เล่น">${v.players.map(p => `<button data-inspect="${p.id}" aria-pressed="false">${esc(p.name)}${p.id === v.me!.id ? " (คุณ)" : " • ดูอย่างเดียว"}<small>${p.score} คะแนน</small></button>`).join("")}</nav>` : ""}
      <section class="az-boards ${v.me ? "az-inspected" : ""}">${v.players.map(p => `<div data-board-player="${p.id}">${PlayerBoard(p, v)}</div>`).join("")}</section><section class="az-confirm-wrap"></section></div></div>
      ${v.settlements?.length ? `<details class="az-history"><summary>รายละเอียดคะแนนรอบล่าสุดและประวัติ</summary>${[...v.settlements].reverse().map(r => RoundSummary(v, r)).join("")}</details>` : ""}
      <details class="az-help"><summary>วิธีเล่น Azul ภาคหลัก</summary>${illustratedGameGuide('azul')}<p>เลือกสีเดียวทั้งหมดจากโรงงานหนึ่งวงหรือกลางโต๊ะ วางแถวเดียวหรือพื้น เศษโรงงานไปกลาง แถวรับสีเดิมและสีนี้ต้องยังไม่มีบนผนังแถวนั้น แถวเต็มปูจากบนลงล่าง แถวไม่เต็มคงอยู่รอบหน้า</p><p>ช่องเดี่ยว +1 ต่อแนวเดียวคิดความยาวกลุ่ม ถ้าต่อสองแนวคิดทั้งสองกลุ่ม จบหลังทุกคนคิดผลเมื่อมีผนังแถวครบ โบนัสแถว +2 คอลัมน์ +7 สีครบ +10</p><p>แทร็กแสดงช่วงคะแนนจริง เมื่อเกินช่วงจะเลื่อนช่วง ไม่ย้อนคะแนนเป็นศูนย์. กระดานคู่แข่งเปิดเผยและดูได้จากแท็บ</p><p>หลุดแล้วกลับลิงก์เดิม: ที่นั่งและคะแนนเดิม ไม่ข้ามตา. ช่วงผลรอบผู้เล่นคนใดหรือ owner กดต่อได้. ผู้เริ่มเว็บเลือกหรือสุ่มแทนเกณฑ์ไปโปรตุเกสล่าสุด; เมื่อพื้นเต็มรับ marker ไว้ข้างกระดานโดยไม่เพิ่มค่าปรับเกิน 7 ช่อง ตามข้อวินิจฉัยที่ผู้ใช้ยืนยัน</p></details>`;
  }
  private updateInteraction() {
    const v = this.view!, offer = this.offer(), active = this.active();
    const target = offer?.targets.find(t => t.target === this.choice?.target);
    this.node.dataset.choosing = String(!!this.choice && !this.expanded);
    for (const b of this.node.querySelectorAll<HTMLButtonElement>("[data-source]")) {
      b.disabled = !active;
      b.setAttribute("aria-pressed", String(this.choice?.source === Number(b.dataset.source) && this.choice.color === b.dataset.color));
    }
    for (const b of this.node.querySelectorAll<HTMLButtonElement>("[data-inspect]")) b.setAttribute("aria-pressed", String(b.dataset.inspect === this.inspected));
    for (const board of this.node.querySelectorAll<HTMLElement>("[data-board-player]")) board.hidden = !!v.me && board.dataset.boardPlayer !== this.inspected;
    const selection = this.node.querySelector<HTMLElement>(".az-source-selection")!;
    selection.innerHTML = offer ? `<div>${Tile(offer.color)}<span>${sourceName(offer.source)}<strong>${TILE_NAMES[offer.color]} • ${offer.count} ชิ้น</strong></span></div><button id="az-change-source">${this.expanded ? "กลับไปเลือกแถว" : "เปลี่ยนแหล่ง / สี"}</button>` : "";
    const controller = this.node.querySelector<HTMLElement>(".az-controller")!;
    controller.hidden = !v.me || v.phase !== "playing";
    controller.innerHTML = `<h2 tabindex="-1">${v.turn !== v.me?.id ? "รอคู่แข่ง • ดูกระดานได้" : offer ? "2 เลือกแถวหรือพื้นบนกระดานคุณ" : "เลือกสีจากโรงงานหรือกลางโต๊ะก่อน"}</h2><p id="az-selection-message" role="status">${this.blocked ? "กำลังตรวจรายการ หรือรอเชื่อมต่อ…" : this.message || (offer ? "แถวที่มีกรอบพร้อมให้แตะ • เส้นประคือ preview ยังไม่ใช่กระเบื้องที่วางแล้ว" : "แตะได้ทั้งหมด ไม่ต้องลากกระเบื้อง")}</p>${offer ? `<ul class="az-target-reasons">${offer.targets.filter(t => !t.valid).map(t => `<li>แถว ${t.target + 1}: ${esc(t.reason)}</li>`).join("")}</ul>` : ""}`;
    for (const b of this.node.querySelectorAll<HTMLButtonElement>("[data-target]")) {
      const option = offer?.targets.find(t => t.target === Number(b.dataset.target));
      b.disabled = !active || !option?.valid;
      b.classList.toggle("az-target-available", !!option?.valid && !!active);
      b.setAttribute("aria-pressed", String(!!this.choice && this.choice.target === Number(b.dataset.target)));
      b.title = option?.reason || (option ? `วาง ${option.placed} • ลงพื้น ${option.floor} • ทิ้ง ${option.discarded}` : "เลือกสีก่อน");
    }
    this.paintPreview();
    const confirm = this.node.querySelector<HTMLElement>(".az-confirm-wrap")!;
    confirm.hidden = !v.me || v.phase !== "playing";
    confirm.innerHTML = `<h2>3 ตรวจและยืนยัน</h2><p id="az-preview" role="status">${target?.valid ? `${sourceName(offer!.source)} • ${TILE_NAMES[offer!.color]} ${offer!.count} ชิ้น → ${target.target === -1 ? "พื้น" : `แถว ${target.target + 1}`} วาง ${target.placed} • ล้นลงพื้น ${target.floor} • ทิ้งทันที ${target.discarded}${target.marker ? " • รับ marker เริ่มรอบถัดไปด้วย" : ""}` : "เลือกแถวหรือพื้นเพื่อดูจำนวนก่อนยืนยัน"}</p><div class="az-preview-counts">${target?.valid ? `<span>${Tile(offer!.color, false, true)}วาง ${target.placed}</span><span>พื้น ${target.floor}</span><span>ทิ้ง ${target.discarded}</span>` : ""}</div><div class="az-confirm-actions"><button id="az-confirm" ${!active || !target?.valid ? "disabled" : ""}>${this.blocked ? "กำลังส่งรายการ…" : "ยืนยันหยิบกระเบื้อง"}</button><button id="az-cancel" ${!this.choice || this.blocked ? "disabled" : ""}>ยกเลิกการเลือก</button></div>`;
    const next = this.node.querySelector<HTMLButtonElement>("#az-next"); if (next) next.disabled = this.blocked;
    const restart = this.node.querySelector<HTMLButtonElement>("#az-restart"); if (restart) restart.disabled = this.blocked || v.players.some(p => !p.connected);
  }
  private paintPreview() {
    this.node.querySelectorAll(".az-preview-layer").forEach(el => el.remove());
    const v = this.view!, own = v.players.find(p => p.id === v.me?.id), offer = this.offer();
    const target = offer?.targets.find(t => t.target === this.choice?.target);
    if (!own || !target?.valid || !offer) return;
    const board = this.node.querySelector(`[data-board-player="${own.id}"]`)!;
    const add = (slot: Element, color: TileColor | "first") => {
      const layer = document.createElement("span"); layer.className = "az-preview-layer";
      layer.innerHTML = Tile(color, false, true); slot.append(layer);
    };
    if (target.target !== -1) {
      const slots = [...board.querySelectorAll(`[data-row="${target.target}"] .az-slot[data-empty="true"]`)];
      for (const slot of slots.slice(slots.length - target.placed)) add(slot, offer.color);
    }
    const floor = [...board.querySelectorAll(".az-floor-slots .az-slot[data-empty='true']")];
    let index = 0;
    if (target.marker && floor[index]) add(floor[index++], "first");
    for (let i = 0; i < target.floor && floor[index]; i++) add(floor[index++], offer.color);
  }
  private click(event: MouseEvent) {
    const b = (event.target as Element).closest<HTMLButtonElement>("button");
    if (!b || b.disabled || !this.view) return;
    const v = this.view, keyboard = event.detail === 0;
    if (b.dataset.inspect) { this.inspected = b.dataset.inspect; this.updateInteraction(); return; }
    if (b.id === "az-change-source") { this.expanded = !this.expanded; this.updateInteraction(); return; }
    if (b.dataset.source !== undefined && this.active()) {
      this.choice = { source: Number(b.dataset.source), color: b.dataset.color as TileColor };
      this.inspected = v.me!.id; this.expanded = false; this.message = ""; this.updateInteraction();
      if (matchMedia("(max-width: 600px)").matches) this.node.querySelector(".az-controller")?.scrollIntoView({ block: "nearest", behavior: "instant" });
      if (keyboard) this.node.querySelector<HTMLButtonElement>("[data-target]:not(:disabled)")?.focus({ preventScroll: true });
      return;
    }
    if (b.dataset.target !== undefined && this.choice && this.active()) {
      this.choice.target = Number(b.dataset.target); this.updateInteraction();
      if (keyboard) this.node.querySelector<HTMLButtonElement>("#az-confirm")?.focus({ preventScroll: true });
      return;
    }
    if (b.id === "az-cancel" && !this.blocked) { this.choice = undefined; this.expanded = false; this.message = ""; this.updateInteraction(); return; }
    if (b.id === "az-confirm" && this.active() && this.choice) {
      const target = this.offer()?.targets.find(t => t.target === this.choice?.target);
      if (target?.valid) this.command({ type: "draft", source: this.choice.source, color: this.choice.color, target: target.target });
    }
    if (b.id === "az-next" && !this.blocked) this.command({ type: "next-round" });
    if (b.id === "az-restart" && !this.blocked) this.command({ type: "restart" });
  }
}
const table = new AzulTable();
let latest: { root: HTMLElement; view: AzulView; host: boolean; blocked: boolean; command: (a: RoomAction) => void } | undefined;
let preloading = false;
export function renderAzul(root: HTMLElement, view: AzulView, host: boolean, blocked: boolean, command: (a: RoomAction) => void) {
  latest = { root, view, host, blocked, command };
  if (!azulArtState.ready) {
    root.innerHTML = '<section class="az-loading" role="status">กำลังเตรียมกระเบื้องและกระดาน…</section>';
    if (!preloading) { preloading = true; void preloadAzulArt().then(() => { if (latest?.root.isConnected) renderAzul(latest.root, latest.view, latest.host, latest.blocked, latest.command); }); }
    return;
  }
  root.replaceChildren(table.node); table.update(view, host, blocked, command);
}
