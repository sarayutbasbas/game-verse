import {openGameGuide,closeGameGuide} from './game-learning.js';
import {metadata} from '../shared/catalog.js';
import type { RoomView } from "../shared/types.js";
import QRCode from "qrcode";
import { roomCode } from "./ui.js";
import "./game-header.css";
import { turnStatus } from "./turn-status.js";
import { endedTurn } from "./turn-sound.js";
let previousTurn: RoomView | undefined;
let turnEpoch = 0;
let announcement: HTMLElement | undefined;
let announced = "";
export function updateGameHeader(
  main: HTMLElement,
  view: RoomView | undefined,
  joinOrigin: string,
) {
  // Outside the replaceable game tree: duplicate deliveries and local previews do not re-announce.
  if (!announcement) {
    announcement = document.createElement("p");
    announcement.className = "sr-only";
    announcement.id = "turn-announcement";
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", "polite");
    announcement.setAttribute("aria-atomic", "true");
    document.body.append(announcement);
  }
  const playing = !!view && view.phase !== "lobby";
  main.classList.toggle("in-game", playing);
  if (!view || !playing) {
    closeGameGuide();
    announced = "";
    previousTurn = undefined;
    announcement.textContent = "";
    return;
  }
  const header = main.querySelector("header")!;
  let chip = header.querySelector<HTMLElement>(".shared-turn");
  header.classList.toggle("jaipur-header", view.gameId === "jaipur");
  if (!chip && view.gameId !== "jaipur") {
    chip = document.createElement("div");
    chip.className = "shared-turn";
    header.querySelector(".header-brand")!.after(chip);
  }
  if (endedTurn(previousTurn, view, false)) turnEpoch++;
  previousTurn = view;
  const status = turnStatus(view);
  if (view.gameId === "jaipur") chip?.remove();
  else if (chip) {
    chip.dataset.own = String(status.own);
    chip.textContent = (status.own ? "◆ " : "○ ") + status.text;
    chip.title = status.text;
  }
  const identity = [
    view.code,
    view.phase,
    view.turn,
    view.gameId === "seven-wonders-duel" ? view.pending?.actor : "",
    status.text,
    turnEpoch,
  ].join(":");
  if (identity !== announced) {
    announcement.textContent = status.text;
    announced = identity;
  }
  let menu = header.querySelector<HTMLDetailsElement>(".shared-room-menu");
  if (!menu) {
    menu = document.createElement("details");
    menu.className = "shared-room-menu";
    header.querySelector(".header-brand")!.append(menu);
  }
  if (menu.dataset.code !== view.code) {
    menu.dataset.code = view.code;
    const url = new URL("/play/" + view.code, joinOrigin).href;
    menu.innerHTML =
      "<summary>ข้อมูลห้อง</summary><div>" +
      roomCode(view.code) +
      '<button type="button" class="shared-illustrated-guide">วิธีเล่นพร้อมภาพ</button><canvas width="160" height="160" aria-label="QR เข้าห้อง"></canvas><a class="join-link">ลิงก์เข้าห้อง</a><a href="/">เลือกเกม / ออกจากหน้าห้อง</a><small>กลับลิงก์เดิมเพื่อเล่นต่อได้</small></div>';
    menu.querySelector<HTMLButtonElement>('.shared-illustrated-guide')!.onclick=()=>{menu!.open=false;openGameGuide(view.gameId,metadata(view.gameId)!.name);};
    menu.querySelector<HTMLAnchorElement>(".join-link")!.href = url;
    menu.ontoggle = () => {
      if (menu!.open)
        void QRCode.toCanvas(menu!.querySelector("canvas"), url, {
          width: 160,
          margin: 1,
        });
    };
  }
}
