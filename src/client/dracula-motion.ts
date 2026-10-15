import { patchHTML } from "./dom-patch.js";
import { marker } from "./dracula-assets.js";
import { ROLE_NAME } from "../games/dracula-vs-van-helsing/types.js";
import type { DuelView } from "../games/dracula-vs-van-helsing/types.js";
export type MotionDelivery = "ignore" | "snap" | "animate" | "resync";
export function duelDelivery(
  previous: Pick<DuelView, "code" | "revision"> | undefined,
  next: DuelView,
  snapshot: boolean,
): MotionDelivery {
  if (snapshot || !previous || previous.code !== next.code) return "snap";
  if (next.revision <= previous.revision) return "ignore";
  if (
    next.revision !== previous.revision + 1 ||
    next.event?.revision !== next.revision
  )
    return "resync";
  return "animate";
}
export class DraculaMotion {
  readonly node = document.createElement("div");
  private previous?: DuelView;
  private animations: Animation[] = [];
  private version = 0;
  private count = 0;
  private reduced = matchMedia("(prefers-reduced-motion: reduce)");
  private owner?: string;
  private controls?: HTMLElement;
  private gated: { button: HTMLButtonElement; disabled: boolean }[] = [];
  private revealing = false;
  private dialog?: HTMLElement;
  private previousFocus?: HTMLElement;
  constructor(private sync: () => void) {
    this.node.className = "duel-table";
    this.reduced.addEventListener("change", () => this.cancel());
  }
  mount(parent: HTMLElement) {
    if (this.node.parentNode !== parent) parent.append(this.node);
  }
  reset() {
    this.cancel();
    this.previous = undefined;
    this.owner = undefined;
    this.count = 0;
    this.node.style.minHeight = "";
    this.node.replaceChildren();
    for (const key of Object.keys(this.node.dataset)) delete this.node.dataset[key];
    this.node.dataset.motionState = "idle";
  }
  private cancel() {
    this.version++;
    for (const a of this.animations) a.cancel();
    this.animations = [];
    this.node.dataset.motionState = "idle";
    this.node.querySelector(".is-drawing")?.classList.remove("is-drawing");
    this.finishReveal();
  }
  // Local presentation controls never alter the authoritative state.
  bindControls(controls: HTMLElement) {
    this.controls = controls;
    this.gated = [...controls.querySelectorAll<HTMLButtonElement>("#next-round, #duel-restart")]
      .map((button) => ({ button, disabled: button.disabled }));
    const status = document.createElement("p");
    status.className = "reveal-control-status";
    status.setAttribute("role", "status");
    const skip = document.createElement("button");
    skip.className = "skip-reveal";
    skip.textContent = "แสดงผลทั้งหมด";
    skip.addEventListener("click", () => this.cancel());
    controls.prepend(status, skip);
    this.updateControls();
  }
  private updateControls() {
    for (const { button, disabled } of this.gated) button.disabled = disabled || this.revealing;
    const status = this.controls?.querySelector<HTMLElement>(".reveal-control-status");
    if (status) status.textContent = this.revealing ? "กำลังเฉลยทีละเขต • รอดูผล หรือกดแสดงผลทั้งหมด" : "";
    const skip = this.controls?.querySelector<HTMLElement>(".skip-reveal");
    if (skip) skip.hidden = true; // The modal owns the skip control while open.
  }
  private paintResources(hp: number, vampires: number[]) {
    const health = this.node.querySelector(".board-health strong");
    if (health) health.textContent = `${hp}/12`;
    for (const [i, count] of vampires.entries()) {
      const district = this.node.querySelector(`[data-district="${i}"]`);
      const tokens = district?.querySelector(".inhabitants");
      if (tokens) {
        tokens.setAttribute("aria-label", `แวมไพร์ ${count} จาก 4 คน`);
        tokens.innerHTML = Array.from({ length: 4 }, (_, j) =>
          `<span class="${j < count ? "vampire" : "human"}">${marker(j < count ? "vampire" : "human")}</span>`).join("");
      }
      const label = district?.querySelector(".conversion-count");
      if (label) label.textContent = `แวมไพร์ ${count}/4`;
    }
  }
  private finishReveal() {
    this.revealing = false;
    this.node.classList.remove("revealing-round");
    this.node.querySelectorAll(".reveal-pending, .reveal-active").forEach((el) =>
      el.classList.remove("reveal-pending", "reveal-active"));
    this.node.querySelectorAll(".district-side, .district-result").forEach((el) => el.removeAttribute("aria-hidden"));
    if (this.dialog) {
      // The reveal stays within the board; restoring focus must not move it.
      this.dialog.remove();
      this.dialog = undefined;
      this.previousFocus?.focus({preventScroll:true});
      this.previousFocus = undefined;
    }
    delete this.node.dataset.revealDistrict;
    if (this.previous?.result) this.paintResources(this.previous.hp!, this.previous.vampires!);
    this.updateControls();
  }
  private async revealRound(view: DuelView, old: DuelView, version: number) {
    this.revealing = true;
    this.node.classList.add("revealing-round");
    this.node.querySelectorAll(".district").forEach((el) => el.classList.add("reveal-pending"));
    this.node.querySelectorAll(".district-side, .district-result").forEach((el) => el.setAttribute("aria-hidden", "true"));
    const focus = document.createElement("section");
    focus.className = "reveal-focus";
    focus.setAttribute("aria-label", "เฉลยการ์ดทีละเขต");
    const dialog = document.createElement("div");
    dialog.className = "board-reveal-layer duel-surface";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-label", "เฉลยผลรอบทีละเขต");
    const close = document.createElement("button");
    close.className = "skip-reveal";
    close.textContent = "แสดงผลทั้งหมด";
    close.onclick = () => this.cancel();
    dialog.addEventListener("keydown", e => { if (e.key === "Escape") this.cancel(); });
    dialog.append(focus, close);
    this.dialog = dialog;
    this.previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    this.node.querySelector(".city-map")!.append(dialog);
    close.focus({preventScroll:true});
    const vampires = [...old.vampires!];
    this.paintResources(old.hp!, vampires);
    this.updateControls();
    // WAAPI clocks affect only presentation; outcomes come exclusively from result.
    const play = async (elements: Element[], frames: Keyframe[], duration: number) => {
      const animations = elements.map((el) => el.animate(frames, { duration, easing: "ease-in-out" }));
      this.animations.push(...animations);
      await Promise.all(animations.map((a) => a.finished));
      if (this.version !== version) throw new Error("Presentation cancelled");
    };
    try {
      for (const result of view.result!.districts) {
        const district = this.node.querySelector<HTMLElement>(`[data-district="${result.district}"]`)!;
        this.node.dataset.revealDistrict = String(result.district);
        district.classList.remove("reveal-pending");
        district.classList.add("reveal-active");
        district.querySelectorAll(".district-side").forEach((el) => el.removeAttribute("aria-hidden"));
        const d = district.querySelector('[data-side="dracula"]')!.innerHTML;
        const h = district.querySelector('[data-side="helsing"]')!.innerHTML;
        focus.innerHTML = `<h2>เฉลยเขต ${result.district + 1}</h2><div class="reveal-pair"><div>${d}</div><div>${h}</div></div><p class="reveal-verdict" role="status">กำลังเปิดการ์ดทั้งสองฝ่าย…</p>`;
        await play([...district.querySelectorAll(".duel-card"), ...focus.querySelectorAll(".duel-card")], [
          { transform: "perspective(700px) rotateY(-90deg)", opacity: 0 },
          { transform: "perspective(700px) rotateY(0)", opacity: 1 },
        ], 500);
        district.classList.add("reveal-resolved");
        district.querySelector(".district-result")?.removeAttribute("aria-hidden");
        const loser = result.winner === "dracula" ? "helsing" : "dracula";
        focus.querySelector(".reveal-verdict")!.textContent = `${ROLE_NAME[result.winner]} ชนะ • ${ROLE_NAME[loser]} แพ้ — ${result.reason} • ${result.winner === "dracula" ? "แวมไพร์ +1" : "HP −1"}`;
        vampires[result.district] = result.vampires;
        this.paintResources(result.hp, vampires);
        // Leave each pair and its verdict readable before moving to the next district.
        await play([focus], [{ opacity: 1 }, { opacity: 1 }], 2100);
        district.classList.remove("reveal-active");
      }
      if (this.version === version) {
        this.finishReveal();
        this.node.dataset.motionState = "idle";
      }
    } catch {
      // Snapshot, skip, reduced motion or a new round cancels this generation.
      // An unexpected presentation failure must also release local controls.
      if (this.version === version) this.cancel();
    }
  }
  update(view: DuelView, html: string, snapshot = false) {
    const delivery = duelDelivery(this.previous, view, snapshot),
      old = this.previous;
    const owner = view.me?.id;
    if (delivery === "ignore" && this.owner === owner) return;
    // A ready acknowledgement/profile update for the same result must not cut
    // short the reveal on other screens. Snapshot/gap still snaps or resyncs.
    if (delivery !== "resync" && !snapshot && old?.code === view.code &&
        old.result && view.result && old.result.round === view.result.round &&
        this.owner === owner) {
      this.previous = structuredClone(view);
      this.node.dataset.presentationRevision = String(view.revision);
      this.node.dataset.revealRevision = String(view.revision);
      return;
    }
    // Keep the document tall enough when end-of-round controls replace the
    // discard panel. Otherwise the browser clamps scrollY at the new bottom.
    if (old?.phase === "playing" && view.result && this.node.closest(".phone-surface"))
      this.node.style.minHeight = `${this.node.getBoundingClientRect().height}px`;
    else if (view.phase === "playing") this.node.style.minHeight = "";
    this.cancel();
    patchHTML(this.node, html);
    this.node.classList.toggle("has-round-result", !!view.result);
    this.node.dataset.presentationRevision = String(view.revision);
    this.node.dataset.revealRevision = view.result ? String(view.revision) : "";
    this.node.dataset.animationCount = String(this.count);
    this.owner = owner;
    this.previous = structuredClone(view);
    if (delivery === "resync") {
      this.sync();
      return;
    }
    if (delivery !== "animate" || this.reduced.matches || !old) return;
    this.count++;
    this.node.dataset.animationCount = String(this.count);
    this.node.dataset.motionState = "animating";
    const version = this.version;
    const animate = (
      selector: string,
      frames: Keyframe[],
      duration = 400,
      delay = 0,
    ) =>
      this.node
        .querySelectorAll<HTMLElement>(selector)
        .forEach((el) =>
          this.animations.push(
            el.animate(frames, {
              duration,
              delay,
              easing: "cubic-bezier(.2,.65,.3,1)",
            }),
          ),
        );
    if (view.phase === "playing" && old.step === "draw" && view.step === "discard" && view.deckCount === old.deckCount! - 1) {
      this.node.dataset.drawRevision = String(view.revision);
      this.node.dataset.drawAnimationCount = String(Number(this.node.dataset.drawAnimationCount ?? 0) + 1);
      const pile = this.node.querySelector(".city-draw");
      pile?.classList.add("is-drawing");
      animate(".city-draw .duel-card", [
        {transform:"translate(24px,-24px) rotate(8deg) scale(.92)"},
        {transform:"translate(0,0) rotate(0) scale(1)"},
      ], 520);
    }
    if (!old.deckTop && view.deckTop && view.step !== "discard")
      animate(".city-draw .duel-card", [
        {transform:"perspective(700px) rotateY(-80deg)"},
        {transform:"perspective(700px) rotateY(0)"},
      ], 340);
    const revealed =
      !!view.result && (!old.result || old.result.round !== view.result.round);
    if (revealed) {
      void this.revealRound(view, old, version);
      return;
    } else {
      if (view.turn !== old.turn)
        animate(".board-turn", [
          { transform: "translateY(-8px)", opacity: 0.25 },
          { transform: "translateY(0)", opacity: 1 },
        ]);
      if (view.discard?.length !== old.discard?.length)
        animate(".discard-list span:last-child", [
          { transform: "translateY(-12px) rotate(-6deg)", opacity: 0 },
          { transform: "translateY(0) rotate(0)", opacity: 1 },
        ]);
      for (let i = 0; i < 5; i++) {
        if (view.vampires?.[i] !== old.vampires?.[i])
          animate(`[data-district="${i}"] .inhabitants`, [
            { transform: "scale(.85)", opacity: 0.5 },
            { transform: "scale(1)", opacity: 1 },
          ]);
        for (const side of ["dracula", "helsing"] as const) {
          const before = old.racks?.[side][i],
            after = view.racks?.[side][i];
          const privateBefore = old.me?.cards[i],
            privateAfter = view.me?.cards[i];
          if (
            JSON.stringify(before) !== JSON.stringify(after) ||
            (side ===
              view.players.find((p) => p.id === view.me?.id)?.character &&
              JSON.stringify(privateBefore) !== JSON.stringify(privateAfter))
          )
            animate(
              `[data-district="${i}"] [data-side="${side}"] .duel-card`,
              !before && after ? [
                { transform: "perspective(700px) rotateY(-80deg)" },
                { transform: "perspective(700px) rotateY(0)" },
              ] : [
                { transform: "translateY(-6px)" },
                { transform: "translateY(0)" },
              ],
              340,
            );
        }
      }
    }
    if (view.hp !== old.hp)
      animate(".board-health strong", [
        { transform: "scale(1.22)", opacity: 0.5 },
        { transform: "scale(1)", opacity: 1 },
      ]);
    if (view.phase === "finished" && old.phase !== "finished")
      animate(
        ".winner-seal",
        [
          { transform: "scale(.8)", opacity: 0 },
          { transform: "scale(1)", opacity: 1 },
        ],
        500,
      );
    Promise.allSettled(this.animations.map((a) => a.finished)).then(() => {
      if (this.version === version) {
        this.node.dataset.motionState = "idle";
        this.node.querySelector(".is-drawing")?.classList.remove("is-drawing");
      }
    });
  }
}
