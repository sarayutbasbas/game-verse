import type { RoomView } from "../shared/types.js";
export function endedTurn(
  previous: RoomView | undefined,
  next: RoomView,
  snapshot: boolean,
) {
  return (
    !!previous &&
    !snapshot &&
    previous.code === next.code &&
    previous.gameId === next.gameId &&
    next.revision === previous.revision + 1 &&
    previous.phase === "playing" &&
    (next.phase !== "playing" || next.turn !== previous.turn || (next.gameId === "calico" && next.event?.kind === "calico-draft") || (next.gameId === "seven-wonders-duel" && !next.pending && !!next.event && ["build", "discard", "wonder", "wonders-decide"].includes(next.event.kind)))
  );
}
/** Notifications follow accepted state transitions, never renders or ACK retries. */
export class TurnSound {
  private previous?: RoomView;
  private context?: AudioContext;
  private enabled = true;
  private compact = false;
  setCompact(compact:boolean){this.compact=compact;this.paint();}
  private unlocked = false;
  readonly button = document.createElement("button");
  constructor() {
    try {
      this.enabled = localStorage.getItem("gameverse:turn-sound") !== "off";
    } catch {}
    this.button.type = "button";
    this.button.className = "turn-sound-button";
    this.button.addEventListener("click", () => {
      this.enabled = !(this.enabled && this.unlocked);
      try {
        localStorage.setItem(
          "gameverse:turn-sound",
          this.enabled ? "on" : "off",
        );
      } catch {}
      if (this.enabled) void this.unlock(true);
      else this.paint();
    });
    document.addEventListener(
      "pointerdown",
      (event) => {
        if (!this.button.contains(event.target as Node) && this.enabled)
          void this.unlock();
      },
      { once: true },
    );
    document.addEventListener(
      "keydown",
      (event) => {
        if (!this.button.contains(event.target as Node) && this.enabled)
          void this.unlock();
      },
      { once: true },
    );
    this.paint();
  }
  private paint() {
    const label = !this.enabled
      ? "เสียงจบตา: ปิด"
      : this.unlocked
        ? "เสียงจบตา: เปิด"
        : "เปิดเสียงแจ้งจบตา";
    this.button.setAttribute("aria-label",label);
    this.button.classList.toggle("sound-icon-only",this.compact);
    if(this.compact)this.button.innerHTML=`<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 9h4l5-4v14l-5-4H4z"/>${!this.enabled?'<path d="m16 8 5 8m0-8-5 8"/>':'<path d="M17 8q5 4 0 8m-1-6q2 2 0 4"/>'}</svg>`;else this.button.textContent=label;
    this.button.setAttribute(
      "aria-pressed",
      String(this.enabled && this.unlocked),
    );
    this.button.title =
      "ตั้งค่าเสียงเฉพาะเครื่องนี้ • แตะหนึ่งครั้งเพื่อให้ browser อนุญาตเสียง";
  }
  private async unlock(preview = false) {
    try {
      const Audio = window.AudioContext ?? (window as any).webkitAudioContext;
      if (!Audio) {
        this.button.textContent = "อุปกรณ์นี้ไม่รองรับเสียง";
        this.button.disabled = true;
        return;
      }
      this.context ??= new Audio();
      await this.context!.resume();
      this.unlocked = this.context!.state === "running";
      this.paint();
      if (preview && this.enabled && this.unlocked) this.chime();
    } catch {
      this.paint();
    }
  }
  private chime() {
    if (!this.enabled || !this.unlocked || this.context?.state !== "running")
      return;
    const context = this.context,
      start = context.currentTime;
    for (const [offset, frequency] of [
      [0, 523.25],
      [0.14, 783.99],
    ]) {
      const oscillator = context.createOscillator(),
        gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start + offset);
      gain.gain.linearRampToValueAtTime(0.12, start + offset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + offset + 0.22);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start + offset);
      oscillator.stop(start + offset + 0.24);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    }
  }
  accept(next: RoomView, snapshot: boolean) {
    const notify = endedTurn(this.previous, next, snapshot);
    this.previous = next;
    if (notify) this.chime();
  }
}
