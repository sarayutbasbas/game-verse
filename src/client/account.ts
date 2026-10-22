import {roomRoute} from './room-route.js';
import { createAuthClient } from "better-auth/client";
import { anonymousClient } from "better-auth/client/plugins";
import { esc } from "./platform.js";
import type { GameMetadata } from "../shared/catalog.js";
const authClient = createAuthClient({ plugins: [anonymousClient()] });
export interface Profile {
  id: string;
  name: string;
  avatar: string | null;
  avatarSource: string;
  guest: boolean;
  admin: boolean;
}
export let platform: {
  profile: Profile | null;
  googleEnabled: boolean;
  googleOrigin?: string;
  joinOrigin?: string;
  games: GameMetadata[];
  recent: { gameId: string; startedAt: number }[];
  rooms: {
    code: string;
    gameId: string;
    phase: string;
    lastVisitedAt?: number;
    owner: boolean;
    player: boolean;
  }[];
} = { profile: null, googleEnabled: false, games: [], recent: [], rooms: [] };
export async function refreshAccount() {
  const res = await fetch("/api/platform", { cache: "no-store" });
  if (!res.ok) throw Error("โหลดข้อมูลบัญชีไม่ได้");
  platform = await res.json();
}
export async function guest() {
  if (!platform.profile) {
    const result = await authClient.signIn.anonymous();
    if (result.error)
      throw Error(result.error.message ?? "เข้า Guest ไม่สำเร็จ");
    await refreshAccount();
  }
}
export async function api(path: string, method: string, data?: unknown) {
  const r = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const v = await r.json();
  if (!r.ok) throw Error(v.error ?? "ทำรายการไม่สำเร็จ");
  return v;
}
export const returnPath = (input: string | null) =>
  input &&
  /^\/(?:$|(?:games|play|display)\/[a-zA-Z0-9-]+\/?$|(?:join|profile)\/?$)/.test(
    input,
  )
    ? input
    : "/";
export function avatar(p: { name: string; avatar?: string | null }) {
  return p.avatar
    ? `<img class="profile-avatar" src="${esc(p.avatar)}" alt="" width="48" height="48" referrerpolicy="no-referrer">`
    : `<span class="profile-avatar default-avatar" aria-hidden="true"><svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2z"/></svg></span>`;
}
export function accountNav() {
  const p = platform.profile;
  return `<a class="account-link" aria-label="${p ? "โปรไฟล์ของคุณ" : "ล็อกอิน"}" title="${p ? "โปรไฟล์ของคุณ" : "ล็อกอิน"}" href="${p ? "/profile" : "/login"}?returnTo=${encodeURIComponent(location.pathname)}">${p ? avatar(p) : '<span class="profile-avatar default-avatar" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/></svg></span>'}</a>`;
}
export function login(root: HTMLElement) {
  const googleHere =
    platform.googleEnabled &&
    (!platform.googleOrigin || platform.googleOrigin === location.origin);
  const target = returnPath(
    new URLSearchParams(location.search).get("returnTo"),
  );
  root.innerHTML = `<section class="account-page"><h1>เข้า GameVerse</h1><p>ล็อกอิน Google เพื่อสร้างห้อง หรือเลือก Guest เพื่อเข้าร่วมเกมของเพื่อน</p><button id="google-login" ${googleHere ? "" : "disabled"}>ล็อกอินด้วย Google</button>${googleHere ? "" : `<p class="entry-error">${platform.googleEnabled ? "ที่อยู่นี้ใช้ Guest เข้าห้องได้ ส่วน Google Login ต้องเปิดผ่านที่อยู่หลักของ GameVerse" : "Google Login ยังไม่ได้ตั้งค่า ใช้ Guest เข้าห้องของเพื่อนได้"}</p>`}<button id="guest-login">เล่นเป็น Guest</button><p id="account-error" role="alert">${new URLSearchParams(location.search).has("error") ? "ล็อกอินไม่สำเร็จหรือถูกยกเลิก ลองอีกครั้ง หรือกลับไปเล่นเป็น Guest" : ""}</p><p class="privacy-copy">เราเก็บชื่อ รูป และอีเมลของบัญชี Google เพื่อยืนยันตัวคุณและกลับเข้าที่นั่งเดิม ไม่มีการอ่าน Gmail หรือรายชื่อผู้ติดต่อ</p><a href="/">เลือกเกม</a></section>`;
  root.querySelector("#google-login")?.addEventListener("click", async () => {
    const b = root.querySelector<HTMLButtonElement>("#google-login")!;
    b.disabled = true;
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: target,
        errorCallbackURL: "/login",
      });
      if (result.error) throw Error(result.error.message ?? "ล็อกอินไม่สำเร็จ");
    } catch (e) {
      root.querySelector("#account-error")!.textContent = (e as Error).message;
      b.disabled = false;
    }
  });
  root.querySelector("#guest-login")?.addEventListener("click", async () => {
    const b = root.querySelector<HTMLButtonElement>("#guest-login")!;
    b.disabled = true;
    try {
      await guest();
      location.assign(target);
    } catch (e) {
      root.querySelector("#account-error")!.textContent = (e as Error).message;
      b.disabled = false;
    }
  });
}
export function profilePage(root: HTMLElement) {
  const target = returnPath(
    new URLSearchParams(location.search).get("returnTo") ?? "/profile",
  );
  const p = platform.profile;
  if (!p) {
    login(root);
    return;
  }
  root.innerHTML = `<section class="account-page player-profile"><div class="profile-page-heading"><h1>โปรไฟล์ของคุณ</h1><p>ชื่อและรูปนี้จะแสดงให้เพื่อนเห็นในเกม</p>${target !== "/profile" ? `<a class="profile-return" href="${esc(target)}">กลับ${roomRoute(target)[0]==="play" ? "ไปเล่น" : roomRoute(target)[0]==="display" ? "ไปจอกลาง" : "ไปเลือกเกม"}</a>` : ''}</div><div class="profile-summary"><button id="select-avatar" type="button" class="profile-avatar-picker" aria-label="เปลี่ยนรูปโปรไฟล์" aria-describedby="avatar-label">${avatar(p)}<span class="avatar-edit-mark" aria-hidden="true">✎</span></button><div class="profile-identity"><strong>${esc(p.name)}</strong><p class="profile-account-type">${p.guest ? 'Guest' : 'บัญชี Google'}</p>${p.guest ? '<small>ใช้ได้บนเครื่องนี้</small>' : ''}</div></div><div class="profile-avatar-tools"><p id="avatar-label">แตะรูปเพื่อเปลี่ยน<br>PNG, JPEG, WebP ไม่เกิน 2 MB</p><input id="avatar-file" name="avatar-file" type="file" accept="image/png,image/jpeg,image/webp" hidden><button id="reset-avatar" type="button">ใช้รูปเริ่มต้น</button></div><form id="profile-form"><label for="profile-name">ชื่อที่แสดง</label><div class="profile-name-row"><input id="profile-name" name="profile-name" value="${esc(p.name)}" maxlength="24" required autocomplete="nickname"><button id="confirm-name" type="submit" disabled>ยืนยัน</button></div></form><p id="profile-status" role="status" aria-live="polite"></p>${p.guest ? `<aside class="profile-membership"><strong>เก็บที่นั่งและประวัติของคุณ</strong><p>เชื่อมบัญชี Google เพื่อกลับมาเล่นบนอุปกรณ์อื่นได้</p><a href="/login?returnTo=${encodeURIComponent(target)}">เชื่อมกับ Google</a></aside>` : ''}<details class="profile-details"><summary>เกี่ยวกับบัญชีของคุณ</summary><p class="privacy-copy">Guest ใช้เซสชันใน browser นี้ อย่าล้างข้อมูลระหว่างเล่น บัญชี Google กลับเข้าห้องบนเครื่องอื่นได้ การออกจากระบบตัดสิทธิ์มือถือ แต่ไม่ลบเกมหรือที่นั่ง Guest ที่ออกจากระบบจะกลับที่นั่งเดิมไม่ได้ ควรเชื่อม Google ก่อน</p></details><div class="profile-footer">${p.admin ? '<a href="/admin">จัดการเกมและห้อง</a>' : ''}<button id="logout" type="button">ออกจากระบบ</button></div></section>`;
  const nameInput = root.querySelector<HTMLInputElement>("#profile-name")!;
  const confirmName = root.querySelector<HTMLButtonElement>("#confirm-name")!;
  let busy = false;
  const syncName = () => { confirmName.disabled = busy || !nameInput.value.trim() || !nameInput.validity.valid || nameInput.value.trim() === p.name; };
  nameInput.addEventListener("input", syncName);
  syncName();
  const run = async (fn: () => Promise<void>, nameSaved = false) => {
    const draft = nameInput.value;
    busy = true; nameInput.disabled = true;
    const buttons = [...root.querySelectorAll<HTMLButtonElement>("button")];
    buttons.forEach((b) => (b.disabled = true));
    try {
      await fn();
      await refreshAccount();
      profilePage(root);
      if (!nameSaved) {
        const input = root.querySelector<HTMLInputElement>("#profile-name")!;
        if (input) { input.value = draft; input.dispatchEvent(new Event("input")); }
      }
      const status = root.querySelector("#profile-status");
      if (status) status.textContent = "บันทึกแล้ว";
    } catch (e) {
      const status = root.querySelector("#profile-status");
      if (status) status.textContent = (e as Error).message;
      busy = false; nameInput.disabled = false;
      buttons.forEach((b) => (b.disabled = false));
      syncName();
    }
  };
  root.querySelector<HTMLFormElement>("#profile-form")!.onsubmit = (e) => {
    e.preventDefault();
    if (confirmName.disabled) return;
    void run(async () => {
      await api("/api/profile", "PATCH", {
        name: root
          .querySelector<HTMLInputElement>("#profile-name")!
          .value.trim(),
      });
    }, true);
  };
  root.querySelector("#select-avatar")!.addEventListener("click", () => {
    const input = root.querySelector<HTMLInputElement>("#avatar-file")!;
    input.value = "";
    input.click();
  });
  root.querySelector<HTMLInputElement>("#avatar-file")!.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    void run(async () => {
      if (file.size > 2 * 1024 * 1024) throw Error("ใช้รูปไม่เกิน 2 MB");
      const res = await fetch("/api/profile/avatar", {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw Error((await res.json()).error);
    });
  };
  root.querySelector("#reset-avatar")!.addEventListener(
    "click",
    () =>
      void run(async () => {
        await api("/api/profile/avatar", "DELETE");
      }),
  );
  root.querySelector("#logout")!.addEventListener("click", () => {
    if (
      p.guest &&
      platform.rooms.some((r) => r.player && r.phase !== "finished") &&
      !confirm(
        "ออกจากระบบ Guest จะกลับที่นั่งเดิมไม่ได้ แนะนำเชื่อม Google ก่อน ต้องการออกจากระบบหรือไม่?",
      )
    )
      return;
    void run(async () => {
      const result = await authClient.signOut();
      if (result.error) throw Error("ออกจากระบบไม่สำเร็จ");
      for (const key of Object.keys(localStorage))
        if (key.startsWith("games:player:")) localStorage.removeItem(key);
      new BroadcastChannel("gameverse-account").postMessage("logout");
      location.assign("/");
    });
  });
}
export async function adminPage(root: HTMLElement) {
  root.innerHTML = '<p role="status">กำลังโหลด…</p>';
  try {
    const v = await api("/api/admin", "GET");
    root.innerHTML = `<section class="account-page"><h1>จัดการ GameVerse</h1>${v.games.map((g: GameMetadata) => `<div class="admin-game"><strong>${esc(g.name)}</strong><p>${esc(g.status)}</p><button data-game="${g.id}" data-status="${g.status === "maintenance" ? "ready" : "maintenance"}">${g.status === "maintenance" ? "เปิดสร้างห้อง" : "พักการสร้างห้อง"}</button></div>`).join("")}<h2>ห้องในระบบ (${v.rooms.length})</h2><ul>${v.rooms.map((r: any) => `<li>${esc(r.code)} ${esc(r.gameId)} • ${esc(r.phase)} • revision ${r.revision} • ${r.players} คน / ${r.connected} จอ</li>`).join("")}</ul><h2>ห้องที่ต้องตรวจเวอร์ชัน (${v.quarantined.length})</h2><ul>${v.quarantined.map((r: any) => `<li>${esc(r.code)} ${esc(r.reason)}</li>`).join("")}</ul><p id="admin-error" role="alert"></p></section>`;
    root.querySelectorAll<HTMLButtonElement>("[data-game]").forEach(
      (b) =>
        (b.onclick = async () => {
          b.disabled = true;
          try {
            await api("/api/admin/games", "PATCH", {
              gameId: b.dataset.game,
              status: b.dataset.status,
            });
            await refreshAccount();
            await adminPage(root);
          } catch (e) {
            root.querySelector("#admin-error")!.textContent = (
              e as Error
            ).message;
            b.disabled = false;
          }
        }),
    );
  } catch (e) {
    root.innerHTML = `<p role="alert">${esc((e as Error).message)}</p>`;
  }
}
