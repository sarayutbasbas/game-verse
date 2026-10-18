import { patchHTML } from "./dom-patch.js";
import { DEAL_GAP_MS, marker } from "./dracula-assets.js";
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
  private dealAt?: number;
  queueDeal(revision:number){this.dealAt=revision;}
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
  }
  update(view: DuelView, html: string, snapshot = false) {
    const delivery = duelDelivery(this.previous, view, snapshot),
      old = this.previous ?? view;
    const owner = view.me?.id;
    if (delivery === "ignore" && this.owner === owner) return;
    // Keep the document tall enough when end-of-round controls replace the
    // discard panel. Otherwise the browser clamps scrollY at the new bottom.
    if (old?.phase === "playing" && view.result && this.node.closest(".phone-surface"))
      this.node.style.minHeight = `${this.node.getBoundingClientRect().height}px`;
    else if (view.phase === "playing") this.node.style.minHeight = "";
    const dealing=this.dealAt===view.revision;
    this.dealAt=undefined;
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
    if ((delivery !== "animate" && !dealing) || this.reduced.matches) return;
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
              fill: "backwards",
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
    const isDeal = view.phase === "playing" && (dealing || old.phase !== "playing" && !view.result);
    if (isDeal) {
      const deck=this.node.querySelector('.city-draw')!.getBoundingClientRect();
      this.node.dataset.dealRevision=String(view.revision);
      for(let slot=0;slot<5;slot++)for(const side of ['dracula','helsing']) {
        const card=this.node.querySelector<HTMLElement>(`[data-district="${slot}"] [data-side="${side}"] .duel-card`)!;
        const target=card.getBoundingClientRect();
        animate(`[data-district="${slot}"] [data-side="${side}"] .duel-card`,[
          {transform:`translate(${deck.x+deck.width/2-target.x-target.width/2}px, ${deck.y+deck.height/2-target.y-target.height/2}px) scale(.45)`,opacity:0},
          {transform:'translate(0,0) scale(1)',opacity:1},
        ],380,(slot*2+(side==='helsing'?1:0))*DEAL_GAP_MS);
      }
    }
    {
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
          if (isDeal) continue;
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
