import {roomPath} from './room-route.js';
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
let toast: HTMLElement | undefined;
let dismissTimer: ReturnType<typeof setTimeout> | undefined;
/** Presentation only: never delays or mutates a game state. */
export function showToast(message: string, error = false) {
  toast ??= document.body.appendChild(document.createElement("div"));
  toast.className = "game-toast" + (error ? " toast-error" : "");
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.replaceChildren();
  const text = document.createElement("span");
  text.textContent = message;
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "×";
  close.setAttribute("aria-label", "ปิดข้อความ");
  close.onclick = () => {
    toast!.hidden = true;
  };
  toast.append(text, close);
  toast.hidden = false;
  clearTimeout(dismissTimer);
  dismissTimer = setTimeout(
    () => {
      toast!.hidden = true;
    },
    error ? 6000 : 3000,
  );
}
export function roomCode(code: string) {
  return `<button type="button" class="room-code" data-copy-room="${escape(code)}" aria-label="คัดลอกลิงก์เข้าห้อง ${escape(code)}"><span>รหัสห้อง <svg aria-hidden="true" width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor"><rect x="5" y="5" width="9" height="9" rx="1"/><path d="M10 3V1H1v9h2"/></svg></span><strong translate="no">${escape(code)}</strong></button>`;
}
const boundRoomLinks = new WeakSet<HTMLButtonElement>();
export function bindRoomLinks(root: HTMLElement, origin: string,gameId?:string) {
  root
    .querySelectorAll<HTMLButtonElement>("[data-copy-room]")
    .forEach((button) => {
      if (boundRoomLinks.has(button)) return;
      boundRoomLinks.add(button);
      button.addEventListener("click", async () => {
        const url = new URL(roomPath(gameId,'play',button.dataset.copyRoom!), origin).href;
        try {
          if (navigator.clipboard?.writeText)
            await navigator.clipboard.writeText(url);
          else {
            const field = document.createElement("textarea");
            field.value = url;
            field.className = "clipboard-fallback";
            document.body.append(field);
            field.select();
            const copied = document.execCommand("copy");
            field.remove();
            button.focus({ preventScroll: true });
            if (!copied) throw Error("copy");
          }
          showToast("คัดลอกลิงก์เข้าห้องแล้ว");
        } catch {
          showToast("คัดลอกไม่ได้ กรุณาใช้ลิงก์เข้าห้อง: " + url, true);
        }
      });
    });
}

export function clearToast() {
  clearTimeout(dismissTimer);
  if (toast) toast.hidden = true;
}
