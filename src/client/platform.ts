import { rolePortrait } from "./dracula-assets.js";
import { roomCode } from "./ui.js";
import { GAME_CATALOG, filterGames } from "../shared/catalog.js";
import { platform, avatar, api } from "./account.js";
import QRCode from "qrcode";
import type { GameId, RoomView, RoomAction } from "../shared/types.js";
import "./platform.css";
export const esc = (x: unknown) =>
  String(x ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export const CATALOG = GAME_CATALOG.map((g) => ({
  ...g,
  count:
    g.minPlayers === g.maxPlayers
      ? `${g.minPlayers} คน`
      : `${g.minPlayers}–${g.maxPlayers} คน`,
}));
export function gallery(root: HTMLElement) {
  const params = new URLSearchParams(location.search),
    q = params.get("q") ?? "",
    n = Number(params.get("players")) || undefined;
  const games = platform.games.length ? platform.games : GAME_CATALOG;
  root.innerHTML = `<section class="platform-gallery" aria-labelledby="catalog-title"><div class="gallery-heading"><h1 id="catalog-title">เลือกเกม</h1><a href="/join">เข้าห้องด้วยรหัส</a></div><form class="catalog-filters" id="catalog-filters" role="search"><div><label for="game-search">ค้นหาเกม</label><input id="game-search" name="q" type="search" placeholder="ชื่อเกม ไทยหรืออังกฤษ…" value="${esc(q)}"></div><div><label for="player-count">ตอนนี้มีผู้เล่น</label><select id="player-count" name="players"><option value="">ทุกจำนวน</option>${Array.from(
    { length: 7 },
    (_, i) => i + 2,
  )
    .map(
      (x) =>
        `<option value="${x}" ${x === n ? "selected" : ""}>${x} คน</option>`,
    )
    .join(
      "",
    )}</select></div><button>ค้นหา</button><a href="/">ล้างตัวกรอง</a></form>${platform.rooms.length ? `<section class="active-rooms"><h2>กลับเข้าห้อง</h2>${platform.rooms.map((r) => `<div><strong>${esc(games.find((g) => g.id === r.gameId)?.name)} ${r.code}</strong>${r.player ? `<a href="/play/${r.code}">กลับไปเล่น</a>` : ""}${r.owner ? `<a href="/display/${r.code}">เปิดจอกลาง</a>` : ""}</div>`).join("")}</section>` : ""}${
    platform.recent.length
      ? `<section class="recent-games"><h2>เกมล่าสุด</h2><div>${platform.recent
          .map((r) => {
            const g = games.find((g) => g.id === r.gameId);
            return g
              ? `<a href="/games/${g.id}" aria-label="เล่น ${esc(g.name)} อีกครั้ง"><img src="${g.cover}" alt="${esc(g.name)}" width="120" height="180"></a>`
              : "";
          })
          .join("")}</div></section>`
      : ""
  }<div class="cover-gallery" id="filtered-games"></div></section>`;
  const results = root.querySelector("#filtered-games")!;
  const update = () => {
    const query = root.querySelector<HTMLInputElement>("#game-search")!.value,
      players =
        Number(root.querySelector<HTMLSelectElement>("#player-count")!.value) ||
        undefined;
    const found = filterGames(games, query, players);
    results.innerHTML =
      found
        .map(
          (g) =>
            `<a class="game-cover" href="/games/${g.id}" aria-label="เลือกเล่น ${esc(g.name)}"><figure><img src="${g.cover}" alt="${esc(g.coverAlt)}" width="640" height="960" fetchpriority="high"><h2 class="cover-name" translate="no">${esc(g.name)}</h2><figcaption><span>${g.minPlayers === g.maxPlayers ? g.minPlayers : g.minPlayers + "–" + g.maxPlayers} คน</span>${!["ready", "beta"].includes(g.status) ? "<span>พักการสร้างห้อง</span>" : ""}</figcaption></figure></a>`,
        )
        .join("") ||
      '<p role="status">ไม่พบเกมที่ตรงกัน ลองเปลี่ยนจำนวนผู้เล่นหรือล้างตัวกรอง</p>';
    const url = new URL(location.href);
    if (query.trim()) url.searchParams.set("q", query.trim());
    else url.searchParams.delete("q");
    if (players) url.searchParams.set("players", String(players));
    else url.searchParams.delete("players");
    history.replaceState(null, "", url);
    results.querySelectorAll<HTMLImageElement>("img").forEach(
      (img) =>
        (img.onerror = () => {
          img.style.visibility = "hidden";
        }),
    );
  };
  root.querySelector<HTMLInputElement>("#game-search")!.oninput = update;
  root.querySelector<HTMLSelectElement>("#player-count")!.onchange = update;
  root.querySelector<HTMLFormElement>("#catalog-filters")!.onsubmit = (e) => {
    e.preventDefault();
    update();
  };
  update();
}
function recentRooms() {
  const rooms: { code: string; role: string }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const match = /^games:(host|player):([A-Z2-9]{6})$/.exec(
      localStorage.key(i) ?? "",
    );
    if (match) rooms.push({ code: match[2], role: match[1] });
  }
  return rooms.slice(-4);
}
export function entry(
  root: HTMLElement,
  options: {
    game?: GameId;
    code: string;
    connected: boolean;
    busy: boolean;
    error: string;
    resuming: boolean;
    canCreate: boolean;
  },
  submit: (code: string, name: string) => void,
  create: (game: GameId) => void,
) {
  const g = CATALOG.find((g) => g.id === options.game),
    fixed = !!options.code;
  root.innerHTML = `<section class="platform-entry"><div class="entry-context">${g ? `<img src="${g.cover}" width="80" height="120" alt=""><div><h1 translate="no">${g.name}</h1><p>${g.count}</p><button id="create" ${!options.connected || options.busy || !options.canCreate || !["ready", "beta"].includes(platform.games.find((x) => x.id === g.id)?.status ?? g.status) ? "disabled" : ""}>สร้างห้องบนจอกลาง</button>${!["ready", "beta"].includes(platform.games.find((x) => x.id === g.id)?.status ?? g.status) ? "<p>เกมนี้พักการสร้างห้องใหม่ ห้องที่เริ่มแล้วเล่นต่อได้</p>" : ""}${!options.canCreate ? `<p><a href="/login?returnTo=${encodeURIComponent(location.pathname)}">ล็อกอิน Google เพื่อสร้างห้อง</a></p>` : ""}</div>` : "<div><h1>เข้าห้อง</h1><p>ใช้มือถือเลือกการกระทำจากห้องเดียวกับจอกลาง</p></div>"}</div><form id="join" class="platform-form" aria-busy="${options.busy}"><h2>${fixed ? `เข้าห้อง ${esc(options.code)}` : "เข้าห้องจากมือถือ"}</h2>${fixed ? `<input type="hidden" name="code" value="${esc(options.code)}"><p class="fixed-code">รหัสห้อง <strong>${esc(options.code)}</strong></p>` : `<label for="join-code">รหัสห้อง</label><input id="join-code" name="code" maxlength="12" value="" autocapitalize="characters" autocomplete="off" spellcheck="false" required placeholder="เช่น ABC234…" aria-describedby="entry-error">`}${!platform.profile ? `<p>เข้าร่วมเป็น Guest หรือ <a href="/login?returnTo=${encodeURIComponent(location.pathname)}">ล็อกอิน Google</a></p>` : ""}<label for="join-name">ชื่อของคุณ</label><input id="join-name" name="name" ${platform.profile && !platform.profile.guest ? "readonly" : ""} maxlength="24" autocomplete="nickname" value="${esc(platform.profile?.guest ? "" : (platform.profile?.name ?? ""))}" required placeholder="ชื่อที่เพื่อนรู้จัก…" aria-describedby="entry-error"><p id="entry-error" class="entry-error" role="alert">${esc(options.error)}</p><button ${!options.connected || options.busy || options.resuming ? "disabled" : ""}>${options.resuming ? "กำลังกลับเข้าห้องเดิม…" : options.busy ? "กำลังเข้าห้อง…" : "เข้าห้อง"}</button></form>${
    recentRooms().length
      ? `<nav class="recent-rooms" aria-label="ห้องที่เคยเข้าบนเครื่องนี้"><h2>กลับเข้าห้องเดิม</h2>${recentRooms()
          .map(
            (r) =>
              `<a href="/${r.role === "host" ? "display" : "play"}/${r.code}">${r.role === "host" ? "จอกลาง" : "ผู้เล่น"} • ${r.code}</a>`,
          )
          .join("")}</nav>`
      : ""
  }<a class="back-to-games" href="/">เลือกเกม</a></section>`;
  root
    .querySelector("#create")
    ?.addEventListener("click", () => g && create(g.id));
  root.querySelector<HTMLFormElement>("#join")!.onsubmit = (event) => {
    event.preventDefault();
    if (options.busy || !options.connected || options.resuming) return;
    const form = event.currentTarget as HTMLFormElement,
      data = new FormData(form);
    const code = String(data.get("code")).replace(/\s/g, "").toUpperCase(),
      name = String(data.get("name")).trim();
    const error = root.querySelector("#entry-error")!;
    if (!/^[A-Z2-9]{6}$/.test(code)) {
      error.textContent = "ใส่รหัสห้อง 6 ตัวอักษรจากจอกลาง";
      root.querySelector<HTMLInputElement>('[name="code"]')?.focus();
      return;
    }
    if (!name) {
      error.textContent = "กรุณาใส่ชื่อที่เพื่อนรู้จัก";
      root.querySelector<HTMLInputElement>('[name="name"]')?.focus();
      return;
    }
    submit(code, name);
  };
}
export function lobby(
  root: HTMLElement,
  v: RoomView,
  isPlayer: boolean,
  host: boolean,
  blocked: boolean,
  command: (a: RoomAction) => void,
) {
  const game = CATALOG.find((g) => g.id === v.gameId)!;
  const joinURL = new URL(
    `/play/${v.code}`,
    platform.joinOrigin ?? location.origin,
  ).href;
  const mine = v.me,
    own = v.players.find((p) => p.id === mine?.id);
  const duel = v.gameId === "dracula-vs-van-helsing";
  const azul = v.gameId === "azul";
  root.innerHTML = `<section class="platform-lobby"><div class="lobby-heading"><img src="${game.cover}" width="64" height="96" alt=""><div><h1 translate="no">${game.name}</h1><p>${game.count}</p></div>${roomCode(v.code)}</div><div class="lobby-grid"><section class="join-panel"><h2>${isPlayer ? "คุณเข้าห้องแล้ว" : "ชวนเพื่อนมาที่กระดานนี้"}</h2>${isPlayer ? "<p>รอเริ่มเกมที่จอกลาง ใช้หน้านี้เลือกการกระทำเมื่อเกมเริ่ม</p>" : `<canvas id="qr" aria-label="QR สำหรับเข้าห้อง"></canvas><a class="join-link" href="${esc(joinURL)}">${esc(joinURL)}</a><p>มือถือกับจอกลางต้องเข้าถึงที่อยู่นี้ได้ บน Wi-Fi ให้เปิดจอกลางด้วย LAN IP ของคอม</p>`}${duel && isPlayer ? `<div class="role-choices">${(["dracula", "helsing"] as const).map((character) => `<button data-character="${character}" aria-label="${character === "dracula" ? "Dracula" : "Van Helsing"}" aria-pressed="${own && "character" in own && own.character === character}" ${blocked || v.players.some((p) => "character" in p && p.id !== mine?.id && p.character === character) ? "disabled" : ""}>${rolePortrait(character)}<strong>${character === "dracula" ? "Dracula" : "Van Helsing"}</strong><span class="role-choice-check">${own && "character" in own && own.character === character ? "✓ ฝั่งของคุณ" : "เลือกฝั่งนี้"}</span></button>`).join("")}</div><button id="lobby-ready" ${blocked || !own || !("character" in own) || !own.character ? "disabled" : ""}>${own && "ready" in own && own.ready ? "ยกเลิกพร้อม" : "พร้อมเล่น"}</button>` : ""}${azul && isPlayer ? `<button id="lobby-ready" ${blocked ? "disabled" : ""}>${own && "ready" in own && own.ready ? "ยกเลิกพร้อม" : "พร้อมเล่น"}</button>` : ""}${host ? `${!duel ? `<label>${azul ? "ผู้เริ่มเกม (เว็บ: เลือกผู้ไปโปรตุเกสล่าสุด หรือสุ่ม)" : "ผู้เริ่มเกม (เลือกคนอายุน้อยที่สุด)"}<select id="starter" name="starter">${azul ? `<option value="">สุ่มที่ server</option>` : ""}${v.players.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select></label>` : ""}<button id="start" ${blocked || v.players.some((p) => !p.connected) || (!duel && !azul && v.players.length < 3) || (azul && (v.players.length < 2 || v.players.some(p => !("ready" in p) || !p.ready))) || (duel && (v.players.length !== 2 || v.players.some((p) => !("ready" in p) || !p.ready || !p.character))) ? "disabled" : ""}>เริ่มเกม</button><p>${duel ? "ทั้งสองคนเลือกคนละบทบาทและกดพร้อม Dracula เริ่มก่อน" : azul ? "รอผู้เล่น 2–4 คนเชื่อมต่อและกดพร้อมครบ" : "รอผู้เล่นอย่างน้อย 3 คนเชื่อมต่อก่อนเริ่ม"}</p>` : ""}</section><aside><h2>ผู้เล่น ${v.players.length}/${game.maxPlayers}</h2><ol class="lobby-players">${v.players.map((p) => `<li>${duel && "character" in p && p.character ? rolePortrait(p.character) : avatar(p)}<strong>${esc(p.name)}</strong><span>${p.connected ? "เชื่อมต่อแล้ว" : "หลุด • รอกลับเข้าห้อง"}</span>${azul ? `<small>${"ready" in p && p.ready ? "พร้อมแล้ว" : "ยังไม่พร้อม"}</small>` : ""}${"character" in p ? `<small>${p.character === "dracula" ? "Dracula" : p.character === "helsing" ? "Van Helsing" : "ยังไม่เลือกบทบาท"} • ${p.ready ? "พร้อมแล้ว" : "ยังไม่พร้อม"}</small>` : ""}</li>`).join("") || "<li>ยังไม่มีผู้เล่น สแกน QR ด้วยมือถือเพื่อเข้าห้อง</li>"}</ol></aside></div></section>`;
  if (platform.profile) {
    const controls = document.createElement("div");
    controls.className = "room-lifecycle";
    controls.innerHTML = `${isPlayer ? '<button id="leave-room">ออกจากห้องรอ</button>' : ""}${platform.rooms.some((r) => r.code === v.code && r.owner) ? '<button id="close-room">ปิดห้อง</button>' : ""}<p id="room-action-error" role="alert"></p>`;
    root.append(controls);
    for (const [id, close] of [
      ["leave-room", false],
      ["close-room", true],
    ] as const)
      root
        .querySelector<HTMLButtonElement>("#" + id)
        ?.addEventListener("click", async () => {
          const b = root.querySelector<HTMLButtonElement>("#" + id)!;
          if (
            close &&
            !confirm("ปิดห้องนี้? ผู้เล่นทุกคนจะออกจากห้องและเล่นต่อไม่ได้")
          )
            return;
          b.disabled = true;
          try {
            await api("/api/rooms/leave", "POST", { code: v.code, close });
            for (const k of Object.keys(localStorage))
              if (k.startsWith("games:") && k.includes(v.code))
                localStorage.removeItem(k);
            location.assign("/");
          } catch (e) {
            root.querySelector("#room-action-error")!.textContent = (
              e as Error
            ).message;
            b.disabled = false;
          }
        });
  }
  const canvas = root.querySelector<HTMLCanvasElement>("#qr");
  if (canvas)
    void QRCode.toCanvas(canvas, joinURL, {
      width: 240,
      margin: 2,
      color: { dark: "#243341", light: "#ffffff" },
    });
  root.querySelector("#start")?.addEventListener("click", () =>
    command(
      duel
        ? { type: "start" }
        : {
            type: "start",
            startingPlayerId:
              root.querySelector<HTMLSelectElement>("#starter")!.value || undefined,
          },
    ),
  );
  root.querySelectorAll<HTMLButtonElement>("[data-character]").forEach((b) =>
    b.addEventListener("click", () =>
      command({
        type: "choose-role",
        character: b.dataset.character as "dracula" | "helsing",
      }),
    ),
  );
  root
    .querySelector("#lobby-ready")
    ?.addEventListener("click", () =>
      command({ type: "ready", ready: !(own && "ready" in own && own.ready) }),
    );
}
