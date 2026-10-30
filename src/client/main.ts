import {renderSoundsFishy,closeSoundsFishy} from "./sounds-fishy.js";
import {renderPerch,closePerch} from "./perch.js";
import {renderDraftosaurus,closeDraftosaurus} from "./draftosaurus.js";
import {harmoniesArtStyle} from './harmonies-view-preferences.js';
import {prepareHarmoniesEntry,harmoniesSplashMarkup,updateHarmoniesSplash,type GardenEntry} from './harmonies-entry.js';
import {roomRoute,roomPath} from './room-route.js';
import {updateRoomRestart} from './room-restart.js';
import {illustratedGameGuide} from './game-learning.js';
import {renderTakeTime,closeTakeTime} from "./take-time.js";
import {renderLocus} from "./locus.js";
import {mountNameIt} from "./name-it.js";
import {renderCK,closeCK} from "./critter-kitchen.js";
import {renderSky} from "./sky-team.js";
let harmoniesModule:typeof import('./harmonies.js')|undefined;
let harmoniesLoading:Promise<typeof import('./harmonies.js')>|undefined;
let gardenEntry:GardenEntry|undefined;
let harmoniesFirstMount=true,harmoniesLoadError=false;
function closeHarmonies(){harmoniesModule?.closeHarmonies();gardenEntry=undefined;harmoniesFirstMount=true;}
import {renderPixies,closePixiesResults} from "./pixies.js";
import { completeJaipurCounting } from "./jaipur-results.js";
import { updateGameHeader } from "./game-header.js";
import {renderJaipur,captureJaipurMotion} from "./jaipur.js";
import { renderWonders, captureWondersMotion } from "./seven-wonders-duel.js";
import { renderCalico } from "./calico.js";
import { roomCode, bindRoomLinks, showToast, clearToast } from "./ui.js";
import {
  NAMES,
  COLORS,
  type Color,
  type Action,
  type HostAction,
  type Camel,
  type ClientMessage,
  type ServerMessage,
  type View,
  type RoomView,
  type RoomAction,
  type GameId,
} from "../shared/types.js";
import "./style.css";
import {
  platform,
  refreshAccount,
  guest,
  accountNav,
  login,
  profilePage,
  adminPage,
  avatar as profileAvatar,
} from "./account.js";
import { gallery, entry, lobby } from "./platform.js";
import { DraculaMotion } from "./dracula-motion.js";
import { preloadDuelArt } from "./dracula-assets.js";
import { renderAzul } from "./azul.js";
import { metadata } from "../shared/catalog.js";
import { renderDracula } from "./dracula.js";
import { BoardRenderer } from "./board.js";
import { TurnSound } from "./turn-sound.js";
import { preloadArt, sprite, CAMEL_CELL, SYMBOL } from "./assets.js";
const boardRenderer = new BoardRenderer(() => send({ type: "sync" }));
const duelMotion = new DraculaMotion(() => send({ type: "sync" }));
const turnSound = new TurnSound();
let duelArtReady = false,
  duelArtLoading = false;
let deliverySnapshot = false;
let reconnectPresentation = false;
let artReady = false,
  artError = "",
  artLoading = false;

const main = document.querySelector<HTMLElement>("#main")!;
type Session = {
  code: string;
  token: string;
  role: "host" | "player";
  playerId?: string;
};
let session: Session | undefined,
  view: RoomView | undefined,
  ws: WebSocket,
  connected = false,
  stopped = false,
  notice = "",
  entryPending = false,
  entryError = "",
  deferredEntry: ClientMessage | undefined,
  pending: Extract<ClientMessage, { type: "command" }> | undefined;
let route = roomRoute(location.pathname),
  role = route[0],
  code = (
    ["display", "play"].includes(role) ? (route[1] ?? "") : ""
  ).toUpperCase();
const key = () => `games:${role === "display" ? "host" : "player"}:${code}`;
try {
  session = JSON.parse(localStorage.getItem(key()) ?? "null") ?? undefined;
  pending =
    JSON.parse(localStorage.getItem(`${key()}:pending`) ?? "null") ?? undefined;
} catch {}
const escape = (x: unknown) =>
  String(x ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const num = (n: number) => new Intl.NumberFormat("th-TH").format(n);
const name = (id?: string) =>
  view?.players.find((p) => p.id === id)?.name ?? "";
const avatar = (id: string) =>
  view?.players.find((p) => p.id === id)?.avatar
    ? profileAvatar(view!.players.find((p) => p.id === id)!)
    : sprite(
        "avatars",
        Math.max(0, view?.players.findIndex((p) => p.id === id) ?? 0),
      );
const cardArt = (c: Color, value: number | string, caption: string) =>
  `<span class="bet-card ${c}">${sprite("objects", 4, "card-paper")}${sprite("camels", CAMEL_CELL[c], "card-camel")}<span class="card-title">${SYMBOL[c]} อูฐ${NAMES[c]}</span><strong class="card-value">${value}</strong><span class="card-caption">${caption}</span></span>`;
const send = (m: ClientMessage) => {
  if (connected) ws.send(JSON.stringify(m));
};
function command(action: RoomAction) {
  if (
    !view ||
    pending ||
    !connected ||
    (view.gameId === "camel-up" && !artReady && view.phase !== "lobby") ||
    (view.gameId === "dracula-vs-van-helsing" &&
      !duelArtReady &&
      view.phase !== "lobby")
  )
    return;
  notice = "";
  clearToast();
  pending = {
    type: "command",
    id: Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join(""),
    revision: view.revision,
    action,
  };
  localStorage.setItem(`${key()}:pending`, JSON.stringify(pending));
  send(pending);
  render();
}
function connect() {
  ws = new WebSocket(
    `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`,
  );
  ws.onopen = () => {
    reconnectPresentation = !!view;
    connected = true;
    if (session)
      send({ type: "resume", code: session.code, token: session.token });
    else if (role === "display" && code) send({ type: "watch", code });
    if (deferredEntry) {
      send(deferredEntry);
      deferredEntry = undefined;
    }
    render();
  };
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data) as ServerMessage<RoomView>;
    if (m.type === "session") {
      session = m;
      code = m.code;
      role = m.role === "host" ? "display" : "play";
      history.replaceState(null, "", `/${role}/${code}`);
      localStorage.setItem(key(), JSON.stringify(session));
      void refreshAccount();
    }
    if (m.type === "state") {
      entryPending = false;
      entryError = "";
      if (view?.code === m.view.code && m.view.revision < view.revision) return;
      const startingLocus=m.view.gameId==="locus"&&m.view.phase==="playing"&&m.view.sequence===0&&view?.gameId==="locus"&&["lobby","finished"].includes(view.phase)&&!reconnectPresentation;
      const startingHarmonies=m.view.gameId==="harmonies"&&m.view.phase==="playing"&&m.view.sequence===0&&view?.gameId==="harmonies"&&["lobby","finished"].includes(view.phase)&&!reconnectPresentation;
      const startingPixies=m.view.gameId==="pixies"&&m.view.phase==="playing"&&m.view.sequence===0&&m.view.event?.kind==="deal"&&view?.gameId==="pixies"&&["lobby","finished"].includes(view.phase)&&!reconnectPresentation;
      const restartingDuel = view?.gameId === "dracula-vs-van-helsing" && view.phase === "finished" && m.view.phase === "playing";
      if (restartingDuel) duelMotion.reset();
      if(m.view.gameId==="dracula-vs-van-helsing" && m.view.phase==="playing" &&
        (restartingDuel && !reconnectPresentation || view?.gameId==="dracula-vs-van-helsing" && view.phase==="lobby"))
        duelMotion.queueDeal(m.view.revision);
      const wondersGap=view?.gameId==="seven-wonders-duel" && m.view.gameId==="seven-wonders-duel" && view.code===m.view.code && !m.snapshot && (m.view.revision>view.revision+1 || (view.sequence!==undefined && m.view.sequence!==undefined && m.view.sequence>view.sequence+1));
      const jaipurGap=view?.gameId==="jaipur"&&m.view.gameId==="jaipur"&&view.code===m.view.code&&!m.snapshot&&(m.view.revision>view.revision+1||(view.sequence!==undefined&&m.view.sequence!==undefined&&m.view.sequence>view.sequence+1));
      turnSound.accept(m.view, (!!m.snapshot || !!wondersGap || !!jaipurGap)&&!startingPixies&&!startingHarmonies&&!startingLocus, !!restartingDuel && !reconnectPresentation);
      view = m.view;
      // Public presentation hint only. Authentication retains the original room/role key.
      try{localStorage.setItem('gameverse:room-theme:'+view.code,view.gameId==='harmonies'&&view.phase!=='lobby'?'harmonies':'');}catch{}
      if(['play','display'].includes(role)){const path=roomPath(view.gameId,role as 'play'|'display',view.code);if(location.pathname!==path)history.replaceState(null,'',path);}
      if (view.gameId === "camel-up") loadCamelArt();
      deliverySnapshot = (!!m.snapshot || !!wondersGap || !!jaipurGap)&&!startingPixies&&!startingHarmonies;
      if(wondersGap||jaipurGap)send({type:"sync"});
      render();
      if(reconnectPresentation && view.gameId === "jaipur") completeJaipurCounting();
      reconnectPresentation = false;
      deliverySnapshot = false;
      if (artReady && view.gameId === "camel-up")
        boardRenderer.update(view, !!m.snapshot);
      if (pending) send(pending);
    }
    if (m.type === "ack") {
      const ownAck = pending?.id === m.id;
      if (ownAck) {
        pending = undefined;
        localStorage.removeItem(`${key()}:pending`);
      }
      notice = m.ok ? "" : (m.error ?? "");
      if (ownAck && !m.ok) showToast(m.error ?? "ทำรายการไม่สำเร็จ", true);
      render();
    }
    if (m.type === "error") {
      entryPending = false;
      entryError = m.error;
      if (session && /เซสชัน|ไม่พบห้อง|ห้องหมดอายุ/.test(m.error)) {
        localStorage.removeItem(key());
        localStorage.removeItem(`${key()}:pending`);
        session = undefined;
        pending = undefined;
        view = undefined;
        boardRenderer.reset();
        duelMotion.reset();
      }
      notice = m.error;
      render();
      if (!view) {
        const target = main.querySelector<HTMLInputElement>(
          m.error.includes("ชื่อ")
            ? 'input[name="name"]'
            : 'input[name="code"]:not([type="hidden"]), input[name="name"]',
        );
        target?.focus();
      }
    }
  };
  ws.onclose = (e) => {
    connected = false;
    entryPending = false;
    boardRenderer.reset();
    duelMotion.reset();
    if (e.code === 4003) {
      stopped = true;
      view = undefined;
      session = undefined;
      pending = undefined;
      notice = "ออกจากระบบแล้ว กรุณาล็อกอินอีกครั้ง";
    }
    if (e.code === 4004) {
      stopped = true;
      view = undefined;
      session = undefined;
      pending = undefined;
    }
    if (e.code === 4001) {
      stopped = true;
      notice =
        "เซสชันนี้เปิดในอีกหน้าจอแล้ว ปิดหน้านี้หรือโหลดใหม่เพื่อกลับมาใช้";
    }
    render();
    if (!stopped) setTimeout(connect, 1500);
  };
  ws.onerror = () => ws.close();
}
function board(_v: View) {
  return `<section class="tabletop" aria-label="กระดานการแข่งขัน"><div data-board-mount>${artReady ? "" : `<p role="status">${escape(artError || "กำลังเตรียมตัวหมากและกระดาน…")}</p>`}</div><p class="board-instructions">อูฐแข่งเดินตามเข็มนาฬิกา • กองเรียงล่างขึ้นบน • ตัวบนอยู่อันดับนำ</p></section>`;
}
function render() {
  if(role==="games"&&route[1]==="name-it"){mountNameIt(main,turnSound);return;}
  // Broadcasts can arrive while someone is typing or choosing a card. Preserve
  // their draft and keyboard focus whenever the same control still exists.
  const active = document.activeElement as HTMLElement | null;
  const hadFocus = !!active && main.contains(active);
  const controls = [
    ...main.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
      "input[name], select[name], select[id]",
    ),
  ];
  const drafts = controls.map((el) => ({
    name: el.name,
    id: el.id,
    value: el.value,
    focused: el === active,
  }));
  const activeButton =
    active?.tagName === "BUTTON" ? active.textContent : undefined;
  // Gate the document before changing any game theme, including lobby → game.
  // Keep this through lazy imports and decoded assets, not just the first render.
  const enteringGarden=view?.gameId==='harmonies'&&view.phase!=='lobby'&&(!gardenEntry?.ready||gardenEntry.code!==view.code);
  document.documentElement.toggleAttribute('data-hm-loading',!!enteringGarden||(!view&&preparingGarden()));
  renderContent();
  const gardenWaiting=!!main.querySelector('.hm-entry-splash,.room-garden-error');
  document.documentElement.toggleAttribute('data-hm-loading',gardenWaiting);
  document.getElementById('hm-boot-splash')?.remove();
  document.documentElement.removeAttribute('data-hm-boot');
  updateRoomRestart(main,view,session?.role === "host" || !!view?.me?.canManage,!!pending || !connected,command);
  bindRoomLinks(main, platform.joinOrigin ?? location.origin,view?.gameId);
  main.classList.toggle(
    "display-surface",
    !!view && session?.role !== "player",
  );
  main.classList.toggle("phone-surface", session?.role === "player");
  main.classList.toggle("many-players", (view?.players.length ?? 0) > 4);
  const gardenTheme=(!view&&preparingGarden())||(view?.gameId==='harmonies'&&view.phase!=='lobby');
  document.documentElement.toggleAttribute('data-room-theme',gardenTheme);
  if(gardenTheme)document.documentElement.dataset.roomTheme='harmonies';
  const platformTheme = !gardenTheme&&(!view || view.phase === "lobby");
  const duelTheme = !platformTheme && view?.gameId === "dracula-vs-van-helsing";
  const azulTheme = !platformTheme && view?.gameId === "azul";
  const critterTheme=!platformTheme&&view?.gameId==='critter-kitchen';
  document.documentElement.classList.toggle('critter-document',critterTheme);
  document.body.classList.toggle('critter-theme',critterTheme);
  if(!critterTheme)closeCK();
  document.documentElement.classList.toggle("harmonies-document",gardenTheme);
  document.body.classList.toggle("take-time-theme",!platformTheme&&view?.gameId==="take-time");
  if(view?.gameId!=="take-time")closeTakeTime();
  document.body.classList.toggle("harmonies-theme",gardenTheme);
  if(view?.gameId!=="harmonies"&&!gardenTheme)closeHarmonies();
  document.documentElement.classList.toggle("sf-document",view?.gameId==="sounds-fishy"&&view.phase!=="lobby");
  document.body.classList.toggle("sf-theme",view?.gameId==="sounds-fishy"&&view.phase!=="lobby");
  if(view?.gameId!=="sounds-fishy")closeSoundsFishy();
  document.body.classList.toggle("perch-theme",!platformTheme&&view?.gameId==="perch");
  if(view?.gameId!=="perch")closePerch();
  document.body.classList.toggle("draftosaurus-theme",!platformTheme&&view?.gameId==="draftosaurus");
  if(view?.gameId!=="draftosaurus")closeDraftosaurus();
  document.body.classList.toggle("pixies-theme",!platformTheme&&view?.gameId==="pixies");
  if(view?.gameId!=="pixies")closePixiesResults();
  document.body.classList.toggle("jaipur-theme",!platformTheme&&view?.gameId==="jaipur");
  document.body.classList.toggle("wonders-theme",!platformTheme && view?.gameId === "seven-wonders-duel");
  const calicoTheme = !platformTheme && view?.gameId === "calico";
  main.classList.toggle("calico-surface", calicoTheme);
  document.body.classList.toggle("calico-theme", calicoTheme);
  main.classList.toggle("azul-surface", azulTheme);
  document.body.classList.toggle("azul-theme", azulTheme);
  main.classList.toggle("platform-surface", platformTheme);
  document.body.classList.toggle("platform-theme", platformTheme);
  document.body.classList.toggle("hm-lobby-theme",view?.gameId==='harmonies'&&view.phase==='lobby');
  main.classList.toggle("duel-surface", duelTheme);
  main.classList.toggle("duel-running", duelTheme && view?.phase === "playing");
  document.body.classList.toggle("duel-theme", duelTheme);
  const themeMeta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  if (themeMeta)
    themeMeta.content = view?.gameId==="perch" ? "#24385a" : view?.gameId==="draftosaurus" ? "#183f37" : gardenTheme ? "#075b59" : view?.gameId === "pixies" ? "#143c34" : view?.gameId === "jaipur" ? "#efc36a" : view?.gameId === "seven-wonders-duel" ? "#183b3d" : azulTheme ? "#e4ddcf" : platformTheme
      ? "#f0f3f5"
      : duelTheme
        ? "#101f2a"
        : "#34251f";
  if (view) main.dataset.revision = String(view.revision);
  const mount = main.querySelector<HTMLElement>("[data-board-mount]");
  if (mount && artReady) boardRenderer.mount(mount);
  for (const draft of drafts) {
    const control = [
      ...main.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
        "input[name], select[name], select[id]",
      ),
    ].find((el) => (draft.id ? el.id === draft.id : el.name === draft.name));
    if (!control) continue;
    if (control instanceof HTMLInputElement && control.readOnly) continue;
    // Radio/checkbox values identify choices; restoring a draft must never
    // overwrite them. Their checked state belongs to each lobby's draft.
    if(control instanceof HTMLInputElement && ['radio','checkbox'].includes(control.type)){
      if(draft.focused)control.focus({preventScroll:true});
      continue;
    }
    if (
      !(control instanceof HTMLSelectElement) ||
      [...control.options].some((option) => option.value === draft.value)
    )
      control.value = draft.value;
    if (draft.focused) control.focus({ preventScroll: true });
  }
  const colorSelect = main.querySelector<HTMLSelectElement>(
    'select[name="color"]',
  );
  if (colorSelect) {
    const syncChoice = () =>
      main
        .querySelectorAll<HTMLElement>("[data-color]")
        .forEach((b) =>
          b.setAttribute(
            "aria-pressed",
            String(b.dataset.color === colorSelect.value),
          ),
        );
    syncChoice();
    colorSelect.addEventListener("change", syncChoice);
  }
  if (hadFocus && !main.contains(document.activeElement)) {
    const button = [...main.querySelectorAll<HTMLButtonElement>("button")].find(
      (b) => b.textContent === activeButton && !b.disabled,
    );
    const target =
      button ?? main.querySelector<HTMLElement>("#actions h2, #content h1");
    if (target) {
      if (!button) target.tabIndex = -1;
      target.focus({ preventScroll: true });
    }
  }
}
const initialGardenHint=document.documentElement.dataset.roomTheme==='harmonies';
function preparingGarden(){return initialGardenHint&&!!code&&!!(session||role==='display')&&!stopped&&!entryError;}
function gardenLoading(){return harmoniesSplashMarkup({code:code!,style:harmoniesArtStyle(),loaded:0,total:0,ready:false});}
function renderContent() {
  if(view?.gameId==="jaipur")captureJaipurMotion(main,view,deliverySnapshot);
  if(view?.gameId==="seven-wonders-duel")captureWondersMotion(main,view,deliverySnapshot);
  if ((view?.gameId === "sounds-fishy" && view.phase!=="lobby" && main.querySelector(".sf-root")) || (view?.gameId === "perch" && view.phase!=="lobby" && main.querySelector(".pc-root")) || (view?.gameId === "draftosaurus" && view.phase!=="lobby" && main.querySelector(".da-root")) || (!view && main.classList.contains("platform-surface") && main.querySelector("#content")) || (view?.gameId === "take-time" && view.phase!=="lobby" && main.querySelector(".tt-root")) || (view?.gameId === "locus" && view.phase!=="lobby" && main.querySelector(".lc-root")) || (view?.gameId === "critter-kitchen" && view.phase!=="lobby" && main.querySelector(".ck-root")) || (view?.gameId === "sky-team" && view.phase!=="lobby" && main.querySelector(".st-root")) || (view?.gameId === "harmonies" && view.phase!=="lobby" && main.querySelector(".hm-root")) || (view?.gameId === "pixies" && view.phase!=="lobby" && main.querySelector(".px-root")) || (view?.gameId === "jaipur" && main.querySelector('.jp-root')) || (view?.gameId === "dracula-vs-van-helsing" && view.phase !== "lobby" && main.querySelector('.duel-game-board'))) {
    const banner=main.querySelector<HTMLElement>('#notice')!;
    banner.textContent=notice;
    const connection=main.querySelector<HTMLElement>('.connection')!;
    connection.dataset.online=String(connected);
    connection.setAttribute('aria-label',connected?'เชื่อมต่อแล้ว':'หลุด กำลังเชื่อมต่อใหม่');
    connection.innerHTML='<i aria-hidden="true"></i>'+(connected?'ออนไลน์':'หลุด');
    const account=main.querySelector('.header-account nav');if(!view&&account&&account.innerHTML!==accountNav())account.innerHTML=accountNav();
  } else main.innerHTML = `<header class="game-header"><div class="header-brand"><a href="/" class="brand" aria-label="GameVerse"><img class="platform-masthead" src="/art/platform/gameverse-masthead.png" alt="" width="800" height="168"><span class="brand-wordmark">GameVerse</span></a></div><div class="header-account"><nav aria-label="บัญชี">${accountNav()}</nav><p class="connection" role="status" data-online="${connected}" aria-label="${connected ? "เชื่อมต่อแล้ว" : stopped ? "เปิดอยู่บนอีกจอ" : "หลุด กำลังเชื่อมต่อใหม่"}"><i aria-hidden="true"></i>${connected ? "ออนไลน์" : "หลุด"}</p></div></header><p id="notice" class="notice" role="status" aria-live="polite">${escape(notice || (pending && view?.gameId !== "locus" && view?.gameId !== "critter-kitchen" && view?.gameId !== "sky-team" && view?.gameId !== "harmonies" && view?.gameId !== "jaipur" && view?.gameId !== "pixies" && view?.gameId !== "dracula-vs-van-helsing" ? "กำลังตรวจรายการ…" : view?.gameId === "camel-up" && !artReady ? "กำลังเตรียมกระดานและตัวหมาก…" : ""))}</p><div id="content"></div>`;
  main.querySelector<HTMLElement>("#notice")?.classList.toggle("session-toast",stopped&&notice.startsWith("เซสชันนี้เปิด"));
  const content = main.querySelector<HTMLElement>("#content")!;
  turnSound.setCompact(!!view);
  turnSound.setActive(!!view && view.phase!=="lobby");
  if (view && view.phase !== "lobby" && (view.gameId!=='harmonies'||gardenEntry?.ready)) main.querySelector("header")!.append(turnSound.controls);
  else turnSound.controls.remove();
  updateGameHeader(main, view, platform.joinOrigin ?? location.origin);
  if (!view) {
    if(preparingGarden()){content.innerHTML=gardenLoading();return;}
    if (role === "login") {
      login(content);
      return;
    }
    if (role === "profile") {
      profilePage(content);
      return;
    }
    if (role === "admin") {
      void adminPage(content);
      return;
    }
    const game: GameId | undefined =
      role === "games" &&
      !!metadata(route[1])
        ? route[1] as GameId
        : undefined;
    if (!role && !session) {
      gallery(content);
      return;
    }
    entry(
      content,
      {
        game,
        code,
        connected,
        busy: entryPending,
        error: entryError,
        resuming: !!session,
        canCreate: !!platform.profile && !platform.profile.guest,
      },
      (joinCode, name) => {
        if (entryPending) return;
        entryPending = true;
        entryError = "";
        notice = "";
        void enterWithIdentity({ type: "join", code: joinCode, name });
        render();
      },
      (gameId,displayMode) => {
        if (entryPending) return;
        entryPending = true;
        entryError = "";
        notice = "";
        send({ type: "create", gameId,joinAsPlayer:true,...displayMode?{displayMode}:{} });
        render();
      },
    );
    return;
  }
  if (view.phase === "lobby") {
    gardenEntry=undefined;harmoniesFirstMount=true;
    lobby(
      content,
      view,
      session?.role === "player",
      session?.role === "host" || !!view.me?.canManage,
      !!pending || !connected,
      command,
    );
    return;
  }
  if (view.gameId === "dracula-vs-van-helsing") {
    if (!duelArtReady) {
      content.innerHTML =
        '<section class="duel-loading" role="status">กำลังเตรียมแผนที่และการ์ด…</section>';
      if (!duelArtLoading) {
        duelArtLoading = true;
        void preloadDuelArt()
          .then(() => {
            duelArtReady = true;
            deliverySnapshot = true;
            render();
            deliverySnapshot = false;
          })
          .catch(() => {
            notice = "โหลดภาพเกมไม่ครบ กรุณาโหลดหน้าใหม่";
            render();
          });
      }
      return;
    }
    renderDracula(
      content,
      view,
      session?.role === "host" || !!view.me?.canManage,
      !!pending || !connected,
      command,
      duelMotion,
      deliverySnapshot,
    );
    return;
  }
  if(view.gameId==="locus"){renderLocus(content,view,session?.role==="host"||!!view.me?.canManage,!!pending||!connected,command,deliverySnapshot,kind=>turnSound.playLocal(kind));return;}
  if(view.gameId==="critter-kitchen"){renderCK(content,view,session?.role==="host"||!!view.me?.canManage,!!pending||!connected,command,deliverySnapshot);return;}
  if(view.gameId==="take-time"){renderTakeTime(content,view,session?.role==="host"||!!view.me?.canManage,!!pending||!connected,command,deliverySnapshot);return;}
  if(view.gameId==="sky-team"){renderSky(content,view,session?.role==="host"||!!view.me?.canManage,!!pending||!connected,command,deliverySnapshot);return;}
  if(view.gameId==="harmonies"){
    {
      if(harmoniesLoadError){content.innerHTML='<section class="room-garden-loading room-garden-error" role="alert" aria-labelledby="hm-load-error-title"><span class="room-garden-loading-icon" aria-hidden="true"><svg viewBox="0 0 64 64"><path d="M32 50V27M32 36C16 36 14 25 16 15c13 0 20 8 16 21ZM32 43c16 0 18-11 16-21-13 0-20 8-16 21Z" fill="#9dc36c" stroke="#fff4c9" stroke-width="2" stroke-linejoin="round"/><circle cx="48" cy="47" r="11" fill="#fff4c9" stroke="#075b59" stroke-width="2"/><path d="M48 41v7" stroke="#075b59" stroke-width="3" stroke-linecap="round"/><circle cx="48" cy="53" r="1.5" fill="#075b59"/></svg></span><div class="room-garden-error-copy"><h1 id="hm-load-error-title">ยังเปิดสวนไม่ได้</h1><p>ลองโหลดอีกครั้งเพื่อกลับเข้าสู่เกม</p></div><button id="hm-load-retry" type="button"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 8a8 8 0 1 1-1 7M5 3v5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>ลองอีกครั้ง</button></section>';content.querySelector('#hm-load-retry')!.addEventListener('click',()=>location.reload());return;}
      if(!gardenEntry||gardenEntry.code!==view.code){
       const entry=gardenEntry={code:view.code,style:harmoniesArtStyle(view.options?.cardArt),loaded:0,total:0,ready:false};
       const snapshot=view;
       void prepareHarmoniesEntry(entry,async()=>{
        harmoniesLoading??=import('./harmonies.js');const module=await harmoniesLoading;harmoniesModule=module;
        return module.harmoniesEntryAssets(snapshot,entry.style);
       },()=>{if(gardenEntry===entry)updateHarmoniesSplash(content,entry);}).then(()=>{if(gardenEntry===entry)render();}).catch(()=>{if(gardenEntry===entry){harmoniesLoadError=true;render();}});
      }
      if(!gardenEntry.ready){content.innerHTML=harmoniesSplashMarkup(gardenEntry);return;}
    }
    harmoniesModule!.renderHarmonies(content,view,session?.role==="host"||!!view.me?.canManage,!!pending||!connected,command,deliverySnapshot||harmoniesFirstMount);harmoniesFirstMount=false;return;
  }
  if(view.gameId==="sounds-fishy"){renderSoundsFishy(content,view,session?.role==="host"||!!view.me?.canManage,!!pending||!connected,command);return;}
  if(view.gameId==="perch"){renderPerch(content,view,session?.role==="host"||!!view.me?.canManage,!!pending||!connected,command,deliverySnapshot);return;}
  if(view.gameId==="draftosaurus"){renderDraftosaurus(content,view,session?.role==="host"||!!view.me?.canManage,!!pending||!connected,command,deliverySnapshot);return;}
  if(view.gameId==="pixies"){renderPixies(content,view,session?.role==="host"||!!view.me?.canManage,!!pending||!connected,command,deliverySnapshot);return;}
  if(view.gameId==="jaipur"){renderJaipur(content,view,session?.role==="host"||!!view.me?.canManage,!!pending||!connected,command,deliverySnapshot);return;}
  if (view.gameId === "seven-wonders-duel") {
    renderWonders(content,view,session?.role === "host" || !!view.me?.canManage,!!pending || !connected,command,deliverySnapshot);return;
  }
  if (view.gameId === "calico") {
    renderCalico(content, view, session?.role === "host" || !!view.me?.canManage, !!pending || !connected, command, deliverySnapshot);
    return;
  }
  if (view.gameId === "azul") {
    renderAzul(content, view, session?.role === "host" || !!view.me?.canManage, !!pending || !connected, command);
    return;
  }
  const v = view,
    isPlayer = session?.role === "player",
    mine = v.me;
  content.innerHTML = `<div class="room-heading"><div><h1>${isPlayer ? escape(name(mine?.id)) : "กระดานวงอูฐ"}</h1><p>${v.phase === "finished" ? "จบการแข่งขัน" : v.phase === "settling" ? "เลือกผลตอบแทนพันธมิตร" : `รอบย่อย ${num(v.leg!)}`}</p></div></div><div class="game-layout ${isPlayer ? "controller" : ""}"><section id="play-area"></section><aside><h2>ผู้เล่น ${num(v.players.length)}/8</h2><ol class="players">${v.players.map((p) => `<li data-player="${p.id}" ${p.id === v.turn && v.phase === "playing" ? 'class="current"' : ""}><div>${avatar(p.id)}<strong>${escape(p.name)} ${p.id === mine?.id ? "(คุณ)" : ""}</strong><span>${p.connected ? "พร้อม" : "หลุด • รอกลับเข้า"}${p.partner ? ` • คู่กับ ${escape(name(p.partner))}` : ""}</span></div><b>${sprite("objects", 0)}${num(p.money)}<small>เหรียญ</small></b><p class="tickets">${p.tickets.map((t) => `<span class="mini-ticket">${sprite("camels", CAMEL_CELL[t.color])}<span>${NAMES[t.color]} ${t.value}</span></span>`).join(" / ")}${p.pyramids ? ` • พีระมิด ${p.pyramids}` : ""}</p></li>`).join("")}</ol>${v.phase !== "lobby" && v.phase !== "finished" ? `<section class="public-final-info"><h3>เดิมพันทั้งเกม</h3><p>ผู้ชนะ ${num(v.finalCounts?.winner ?? 0)} ใบ • ผู้แพ้ ${num(v.finalCounts?.loser ?? 0)} ใบ</p><p>ลงการ์ดคว่ำจากมือถือเมื่อถึงตา เปิดคิดเงินตอนจบการแข่งขัน</p><p>ถูกก่อนรับ +8 / +5 / +3 / +2 / +1<br>ทายผิด −1 เหรียญ</p><p class="round-help">รอบย่อยจบเมื่อทอยเต๋าครบ 5 ลูก</p></section>` : ""}<details><summary>วิธีเล่นและกติกาที่ใช้</summary>${illustratedGameGuide('camel-up')}<p>เลือก 1 การกระทำในตาของคุณ: ทอยเต๋า / เดิมพันรอบย่อย / วางป้าย / ทายผู้ชนะหรือผู้แพ้ทั้งเกม${v.players.length >= 6 ? " / จับคู่" : ""}</p><p>รอบย่อยจบเมื่อทอย 5 จาก 6 ลูก บัตรที่หนึ่งรับตามหน้า ที่สองรับ 1 อื่นเสีย 1 พีระมิดรับ 1 ต่อใบ เงินไม่ต่ำกว่า 0</p><p>ป้ายวางช่องว่าง 2–16 และไม่ติดป้ายอื่น อูฐซ้อนจากล่างขึ้นบน ตัวบนอันดับนำ อูฐบ้าเดิมพันไม่ได้</p><p>ทายผลทั้งเกมถูกตามลำดับรับ 8/5/3/2/1 ผิดเสีย 1 การ์ดที่ลงแล้วเอาคืนไม่ได้</p><p>หลุดแล้วกลับลิงก์เดิมบนเครื่องเดิมได้ อย่าล้างข้อมูลเว็บไซต์ ห้องเก็บข้าม server restart ได้ และหมดอายุเมื่อไม่มีการเข้าร่วมหรือทำรายการเกิน 10 ชั่วโมง</p></details></aside></div>`;
  const area = content.querySelector<HTMLElement>("#play-area")!;
  if (v.phase === "finished") {
    area.innerHTML = `<section class="results"><h2>ผู้ชนะ: ${v.winners!.map((id) => escape(name(id))).join(" และ ")}</h2><p>อันดับอูฐ: ${v
      .settlements!.at(-1)!
      .ranking.map((c, i) => `${i + 1}. ${NAMES[c]}`)
      .join(
        " / ",
      )}</p><h3>การ์ดเดิมพันทั้งเกมที่เปิดแล้ว</h3><ul>${v.finalResults?.map((b) => `<li>${escape(name(b.playerId))} • ${b.side === "winner" ? "ผู้ชนะ" : "ผู้แพ้"} ${NAMES[b.color]} • ${b.amount > 0 ? "+" : ""}${num(b.amount)} เหรียญ</li>`).join("") || "<li>ไม่มีการ์ดเดิมพันทั้งเกม</li>"}</ul>${session?.role === "host" || v.me?.canManage ? `<div class="rematch"><label>ผู้เริ่มเกมใหม่<select name="rematch-starter">${v.players.map((p) => `<option value="${p.id}">${escape(p.name)}</option>`).join("")}</select></label><button id="restart" ${pending || !connected || !artReady || v.players.some((p) => !p.connected) ? "disabled" : ""}>เล่นอีกครั้ง</button><p>${v.players.some((p) => !p.connected) ? "รอผู้เล่นทุกคนกลับเข้าห้องก่อนเล่นอีกครั้ง" : "ใช้ห้องเดิมและผู้เล่นเดิม เงินกับการ์ดจะเริ่มใหม่"}</p></div>` : `<p>รอผู้สร้างห้องกด “เล่นอีกครั้ง” ที่จอกลาง</p>`}<a class="new-room-link" href="/">สร้างห้องใหม่</a></section>${board(v)}`;
    area.querySelector("#restart")?.addEventListener("click", () =>
      command({
        type: "restart",
        startingPlayerId: (
          area.querySelector('[name="rematch-starter"]') as HTMLSelectElement
        ).value,
      }),
    );
  } else {
    area.innerHTML = `${isPlayer ? '<section id="actions"></section>' : ""}${board(v)}<section class="race-info"><h2>สนามแข่งขัน</h2><p>รอบย่อย = ช่วงที่ทอยเต๋าครบ 5 ลูก แล้วคิดเงินเดิมพันรอบนั้น</p><p>เต๋ายังไม่ออก: ${(v.dice ?? []).map((d) => (d === "grey" ? "เทา" : NAMES[d as Camel])).join(" / ")}</p><p>กองทายผู้ชนะ ${num(v.finalCounts?.winner ?? 0)} ใบ • ผู้แพ้ ${num(v.finalCounts?.loser ?? 0)} ใบ</p><p>บัตรรอบย่อยที่เหลือ: ${Object.entries(
      v.available ?? {},
    )
      .map(([c, values]) => `${NAMES[c as Camel]} ${values.join("/") || "หมด"}`)
      .join(" • ")}</p></section>`;
    if (isPlayer && mine) {
      const actions = area.querySelector<HTMLElement>("#actions")!,
        legal = mine.legal;
      const blocked = pending || !connected || !artReady;
      const mePlayer = v.players.find((p) => p.id === mine.id)!;
      actions.innerHTML = `<div class="character-card">${avatar(mine.id)}<div><strong>${escape(mePlayer.name)}</strong><span>ผู้เล่นของคุณ</span></div><b>${sprite("objects", 0)}${num(mePlayer.money)}</b></div><h2>${v.phase === "settling" ? "เลือกคัดลอกจากคู่ของคุณ" : v.turn === mine.id ? "เลือก 1 การกระทำ" : "เตรียมตัวเลือกสำหรับตาถัดไป"}</h2><div id="action-buttons"></div><details class="private"><summary>การ์ดส่วนตัวของคุณ</summary><p>ยังมี: ${mine.cards.map((c) => NAMES[c]).join(" / ") || "ใช้หมดแล้ว"}</p><p>ลงไว้แล้ว: ${mine.bets.map((b) => `${b.side === "winner" ? "ผู้ชนะ" : "ผู้แพ้"} ${NAMES[b.color]}`).join(" / ") || "ยังไม่ได้ลง"}</p></details>`;
      const container = actions.querySelector<HTMLElement>("#action-buttons")!;
      function add(label: string, a: Action) {
        const b = document.createElement("button");
        b.setAttribute("aria-label", label);
        if (a.type === "leg") {
          b.className = "leg-choice";
          b.innerHTML =
            cardArt(a.color, v.available![a.color][0], "ที่ 2 +1 • อื่น −1") +
            `<span class="choice-label">${escape(label)}</span>`;
        } else if (a.type === "roll") {
          b.className = "roll-choice";
          b.innerHTML =
            sprite("camels", 8) +
            `<span>${label}<small>รับ 1 เหรียญเมื่อจบรอบย่อย</small></span>`;
        } else b.textContent = label;
        b.disabled = !!blocked;
        b.addEventListener("click", () => command(a));
        container.append(b);
      }
      for (const a of legal.filter((a) =>
        ["roll", "leg", "partner", "claim"].includes(a.type),
      )) {
        let label = "";
        if (a.type === "roll") label = "ทอยเต๋า • รับบัตรพีระมิด";
        if (a.type === "leg")
          label = `เดิมพันรอบย่อย อูฐ${NAMES[a.color]} • ${v.available![a.color][0]} เหรียญ`;
        if (a.type === "partner") label = `จับคู่กับ ${name(a.playerId)}`;
        if (a.type === "claim") {
          const partner = v.players.find(
            (p) => p.id === v.players.find((p) => p.id === mine.id)?.partner,
          )!;
          const t = partner.tickets[a.ticket];
          label =
            a.ticket === -1
              ? "ไม่คัดลอกบัตร"
              : t
                ? `คัดลอก อูฐ${NAMES[t.color]} บัตร ${t.value}`
                : "คัดลอกบัตรพีระมิด +1";
        }
        add(label, a);
      }
      if (!legal.some((a) => a.type === "roll") && v.phase === "playing") {
        const reason =
          v.turn !== mine.id ? "ยังไม่ถึงตาของคุณ" : "รอสถานะล่าสุด";
        const message = document.createElement("p");
        message.className = "unavailable";
        message.textContent = reason;
        container.append(message);
      }
      if (v.phase === "playing")
        for (const color of COLORS)
          if (!legal.some((a) => a.type === "leg" && a.color === color)) {
            const b = document.createElement("button");
            b.className = "leg-choice";
            b.disabled = true;
            const reason =
              v.available![color].length === 0
                ? "บัตรสีนี้หมดในรอบย่อยนี้"
                : "ยังไม่ถึงตาของคุณ";
            b.innerHTML =
              cardArt(color, v.available![color][0] ?? "—", reason) +
              `<span class="choice-label">${reason}</span>`;
            b.setAttribute(
              "aria-label",
              `เดิมพันรอบย่อย อูฐ${NAMES[color]} • ${reason}`,
            );
            container.append(b);
          }
      const finals = legal.filter(
        (a): a is Extract<Action, { type: "final" }> => a.type === "final",
      );
      if (v.phase === "playing") {
        const finalBlocked = !!blocked || !finals.length;
        const form = document.createElement("form");
        form.innerHTML = `<h3>เดิมพันผู้ชนะ / ผู้แพ้ทั้งเกม</h3><p class="final-explanation">เลือกอูฐแล้วลงการ์ดคว่ำระหว่างเกม เปิดคิดเงินเมื่อการแข่งขันจบ แยกจากเดิมพันรอบย่อย</p><div class="payout-track" aria-label="รางวัลตามลำดับคนที่ทายถูก"><span>ถูกก่อนรับมากกว่า</span>${[8, 5, 3, 2, 1].map((reward, i) => `<span><small>คนที่ ${i + 1}${i === 4 ? " เป็นต้นไป" : ""}</small><strong>+${reward}</strong></span>`).join("")}<span class="wrong"><small>ทายผิด</small><strong>−1</strong></span></div><div class="hand-cards">${COLORS.map((c) => `<button type="button" class="hand-choice ${mine.cards.includes(c) ? "" : "used"}" data-color="${c}" aria-label="เลือกการ์ดอูฐ${NAMES[c]}" aria-pressed="${c === mine.cards[0]}" ${finalBlocked || !mine.cards.includes(c) ? "disabled" : ""}>${cardArt(c, "8", "ถูก 8/5/3/2/1 • ผิด −1")}${mine.cards.includes(c) ? "" : `<span class="used-label">ใช้แล้ว</span>`}</button>`).join("")}</div><label>อูฐ<select name="color" ${finalBlocked ? "disabled" : ""}>${mine.cards.map((c) => `<option value="${c}">${NAMES[c]}</option>`).join("")}</select></label><label>ผลที่ทาย<select name="side" ${finalBlocked ? "disabled" : ""}><option value="winner">ผู้ชนะทั้งเกม</option><option value="loser">ผู้แพ้ทั้งเกม</option></select></label><p>ลงแล้วนำกลับไม่ได้ เปิดตอนจบเกม ทายถูกตามลำดับรับ 8/5/3/2/1 เหรียญ ผิดเสีย 1</p><p class="final-status">${mine.cards.length === 0 ? "ใช้การ์ดทั้ง 5 สีครบแล้ว" : v.turn !== mine.id ? "เลือกลงเดิมพันได้เมื่อถึงตาของคุณ" : "การ์ดสีละ 1 ใบ ใช้ร่วมกันทั้งกองผู้ชนะและผู้แพ้"}</p><button ${finalBlocked ? "disabled" : ""}>ลงการ์ดลับ</button>`;
        form
          .querySelectorAll<HTMLButtonElement>("[data-color]")
          .forEach((button) =>
            button.addEventListener("click", () => {
              (form.elements.namedItem("color") as HTMLSelectElement).value =
                button.dataset.color!;
              form
                .querySelectorAll("[data-color]")
                .forEach((b) =>
                  b.setAttribute("aria-pressed", String(b === button)),
                );
            }),
          );
        form.onsubmit = (e) => {
          e.preventDefault();
          if (finalBlocked) return;
          const f = new FormData(form);
          command({
            type: "final",
            color: f.get("color") as any,
            side: f.get("side") as any,
          });
        };
        form.className = "final-betting";
        container.insertBefore(form, container.querySelector(".leg-choice"));
      }
      const tiles = legal.filter(
        (a): a is Extract<Action, { type: "tile" }> => a.type === "tile",
      );
      if (tiles.length) {
        const form = document.createElement("form");
        form.innerHTML = `<h3>วางหรือย้ายป้าย</h3><label>ช่องว่าง<select name="position">${[...new Set(tiles.map((t) => t.position))].map((n) => `<option>${n}</option>`).join("")}</select></label><label>ด้านป้าย<select name="direction"><option value="1">เชียร์ • เดินต่อ 1</option><option value="-1">โห่ • ถอย 1 และลงใต้กอง</option></select></label><button ${blocked ? "disabled" : ""}>วางป้าย</button>`;
        form.onsubmit = (e) => {
          e.preventDefault();
          const f = new FormData(form);
          command({
            type: "tile",
            position: Number(f.get("position")),
            direction: Number(f.get("direction")) as 1 | -1,
          });
        };
        container.append(form);
      } else if (v.phase === "playing") {
        const panel = document.createElement("div");
        panel.className = "action-unavailable";
        panel.innerHTML = `<h3>วางหรือย้ายป้าย</h3><p>${v.turn !== mine.id ? "รอถึงตาของคุณเพื่อวางป้าย" : "ไม่มีช่องที่วางป้ายได้ในสถานะนี้"}</p>`;
        container.append(panel);
      }
    }
  }
  if (v.settlements?.length) {
    const section = document.createElement("details");
    section.className = "history";
    section.innerHTML = `<summary>ผลรอบย่อยที่ผ่านมา (${num(v.settlements.length)} รอบย่อย)</summary><p>แต่ละรอบย่อยจบเมื่อทอยเต๋าครบ 5 ลูก จากนั้นคิดเงินและเริ่มรอบย่อยใหม่</p>${v.settlements.map((s) => `<p>รอบย่อย ${s.leg}: ${s.ranking.map((c, i) => `${i + 1}. ${NAMES[c]}`).join(" / ")}<br>${s.changes.map((p) => `${escape(name(p.id))} ${p.amount >= 0 ? "+" : ""}${p.amount} เหรียญ`).join(" • ")}</p>`).join("")}`;
    area.append(section);
  }
}
function loadCamelArt() {
  if (artReady || artLoading) return;
  artLoading = true;
  void preloadArt()
    .then(() => {
      artReady = true;
      render();
      if (view?.gameId === "camel-up") boardRenderer.update(view, true);
    })
    .catch((error) => {
      artError = String(error.message);
      notice = artError;
      render();
    });
}
async function enterWithIdentity(message: ClientMessage) {
  try {
    const needed = !platform.profile;
    if (needed) await guest();
    if (needed) {
      deferredEntry = message;
      ws.onclose = null;
      ws.close();
      connect();
    } else send(message);
  } catch (e) {
    entryPending = false;
    entryError = (e as Error).message;
    render();
  }
}
const accountChannel = new BroadcastChannel("gameverse-account");
accountChannel.onmessage = (e) => {
  if (e.data === "logout" && session?.role === "player") {
    stopped = true;
    ws.close();
    view = undefined;
    session = undefined;
    pending = undefined;
    void refreshAccount().then(render);
  }
};
let portalScroll=0,portalHome=location.origin+'/';
function navigatePortal(target:URL,push:boolean){
  const next=target.pathname.split('/').filter(Boolean);
  const allowed=!next.length||(next[0]==='games'&&next.length===2&&!!metadata(next[1])&&metadata(next[1])!.playMode!=='local');
  if(view||session||!allowed||!(!role||role==='games'))return false;
  if(!role){portalScroll=scrollY;portalHome=location.href;}
  if(push&&target.pathname==='/'&&!target.search)target=new URL(portalHome);
  if(push)history.pushState(null,'',target);
  route=target.pathname.split('/').filter(Boolean);role=route[0];code='';entryError='';entryPending=false;render();
  requestAnimationFrame(()=>scrollTo(0,!role?portalScroll:0));return true;
}
document.addEventListener('click',event=>{
  if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.defaultPrevented)return;
  const link=event.target instanceof Element?event.target.closest<HTMLAnchorElement>('a[href]'):null;
  if(!link||link.target||link.hasAttribute('download'))return;
  const url=new URL(link.href);if(url.origin===location.origin&&navigatePortal(url,true))event.preventDefault();
});
window.addEventListener('popstate',()=>{if(!navigatePortal(new URL(location.href),false))location.reload();});

render();
void refreshAccount()
  .catch(() => {
    notice = "โหลดข้อมูลบัญชีไม่ได้ กรุณาโหลดหน้าใหม่";
  })
  .finally(() => {
    if(!(role==="games"&&route[1]==="name-it"))connect();
    render();
  });
