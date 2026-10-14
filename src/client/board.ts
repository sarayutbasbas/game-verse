import {
  NAMES,
  type Camel,
  type View,
  type PublicEvent,
} from "../shared/types.js";
import { CAMEL_CELL, SYMBOL, sprite } from "./assets.js";
export type Point = { x: number; y: number };
// Clockwise loop, one coordinate system shared by static placement and motion.
export const TRACK: Record<number, Point> = {
  1: { x: 15, y: 14 },
  2: { x: 29, y: 14 },
  3: { x: 43, y: 14 },
  4: { x: 57, y: 14 },
  5: { x: 71, y: 14 },
  6: { x: 85, y: 14 },
  7: { x: 88, y: 38 },
  8: { x: 88, y: 62 },
  9: { x: 85, y: 86 },
  10: { x: 71, y: 86 },
  11: { x: 57, y: 86 },
  12: { x: 43, y: 86 },
  13: { x: 29, y: 86 },
  14: { x: 15, y: 86 },
  15: { x: 12, y: 62 },
  16: { x: 12, y: 38 },
};
export const pointFor = (n: number): Point =>
  n < 1 ? { x: 9, y: 25 } : n > 16 ? { x: 19, y: 25 } : TRACK[n];
const escape = (x: string) =>
  x.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const camelTransform = (position: number, index: number) => {
  const p = pointFor(position);
  return `translate(${p.x}%, ${p.y + 4.5 - index * 2.35}%)`;
};
export type Delivery = "snap" | "animate" | "duplicate" | "gap";
export function delivery(
  last: number | undefined,
  v: View,
  snapshot: boolean,
): Delivery {
  if (snapshot || last === undefined) return "snap";
  if (v.revision <= last) return "duplicate";
  if (v.revision !== last + 1 || v.event?.revision !== v.revision) return "gap";
  const event = v.event;
  if (
    event.kind === "roll" &&
    (!event.movement ||
      !event.roll ||
      !event.movement.path.length ||
      !event.movement.unit.length)
  )
    return "gap";
  if (event.kind === "final" && !event.side) return "gap";
  if (event.kind === "leg" && !event.color) return "gap";
  return "animate";
}
export class BoardRenderer {
  readonly root = document.createElement("div");
  private queue: { view: View; event: PublicEvent }[] = [];
  private last?: number;
  private generation = 0;
  private busy = false;
  private animations = new Set<Animation>();
  private reduced = matchMedia("(prefers-reduced-motion: reduce)");
  private current?: View;
  private newest?: View;
  private revisionCount = 0;
  constructor(private resync: () => void) {
    this.root.className = "board-scene";
    this.root.dataset.animating = "false";
    this.root.innerHTML = `<img class="board-base" src="/art/board.svg" width="1200" height="850" alt=""><div class="track-cells">${Object.entries(
      TRACK,
    )
      .map(
        ([n, p]) =>
          `<div class="track-cell ${(+n >= 7 && +n <= 8) || +n >= 15 ? "side-cell" : ""}" data-space="${n}" style="left:${p.x}%;top:${p.y}%"><span>${n}</span><span class="direction" aria-hidden="true">${+n <= 6 ? "›" : +n <= 8 ? "⌄" : +n <= 14 ? "‹" : "⌃"}</span></div>`,
      )
      .join(
        "",
      )}</div><div class="finish-line" aria-label="เส้นชัย ระหว่างช่อง 16 และ 1">เส้นชัย</div><div class="desert-palm palm-one">${sprite("camels", 7)}</div><div class="desert-palm palm-two">${sprite("camels", 7)}</div><div class="table-center"><div class="round-title">รอบย่อย <strong data-leg>1</strong></div><div class="pyramid">${sprite("camels", 8)}</div><div class="pyramid-tickets"></div><div class="dice-tray"></div><div class="board-bank">${sprite("objects", 0)}<span>ธนาคาร</span></div></div><div class="board-decks"></div><div class="camel-layer"></div><div class="tile-layer"></div><div class="board-toast" role="status"></div><div class="motion-fx" aria-hidden="true"></div>`;
    for (const c of Object.keys(CAMEL_CELL) as Camel[]) {
      const node = document.createElement("div");
      node.className = `camel-position camel-${c}`;
      node.dataset.camel = c;
      node.innerHTML = `<div class="camel-piece ${c === "black" || c === "white" ? "reverse" : ""}">${sprite("camels", CAMEL_CELL[c])}</div><span class="camel-label">${SYMBOL[c]} ${NAMES[c]}</span>`;
      node.setAttribute("aria-label", `อูฐ${NAMES[c]}`);
      this.root.querySelector(".camel-layer")!.append(node);
    }
    this.reduced.addEventListener("change", () => {
      if (this.reduced.matches && this.newest) this.snap(this.newest);
    });
  }
  mount(slot: HTMLElement) {
    if (this.root.parentElement !== slot) slot.replaceChildren(this.root);
  }
  reset() {
    this.last = undefined;
    this.queue = [];
    this.generation++;
    this.animations.forEach((a) => a.cancel());
    this.animations.clear();
    this.busy = false;
    this.current = undefined;
    this.root.querySelector(".motion-fx")!.replaceChildren();
    this.root.querySelector(".board-toast")!.textContent = "";
    this.root.dataset.animating = "false";
  }
  update(v: View, snapshot = false) {
    this.newest = v;
    const mode = delivery(this.last, v, snapshot);
    if (mode === "gap") {
      this.snap(v);
      this.resync();
      return;
    }
    if (mode === "duplicate") {
      if (!this.busy && v.revision === this.last) this.place(v);
      return;
    }
    this.last = v.revision;
    if (
      mode === "snap" ||
      v.event?.kind === "restart" ||
      this.reduced.matches ||
      !v.stacks ||
      !this.current?.stacks
    ) {
      this.snap(v);
      return;
    }
    this.queue.push({ view: structuredClone(v), event: v.event! });
    if (this.queue.length > 8) {
      this.snap(v);
      this.resync();
      return;
    }
    void this.drain();
  }
  private snap(v: View) {
    this.reset();
    this.last = v.revision;
    this.newest = v;
    this.place(v);
    this.root.dataset.visualRevision = String(v.revision);
  }
  private place(v: View) {
    this.current = structuredClone(v);
    for (const [position, stack] of Object.entries(v.stacks ?? {}))
      stack.forEach((c, i) => {
        const node = this.root.querySelector<HTMLElement>(
          `[data-camel="${c}"]`,
        )!;
        node.style.transform = camelTransform(+position, i);
        node.style.zIndex = String(20 + i);
        node.dataset.position = position;
        node.dataset.stackIndex = String(i);
        node.setAttribute(
          "aria-label",
          `อูฐ${NAMES[c]} ช่อง ${position} ลำดับ ${i + 1} จากล่าง`,
        );
      });
    this.root.querySelector("[data-leg]")!.textContent = String(v.leg ?? 1);
    this.root.querySelector(".pyramid-tickets")!.innerHTML =
      `${sprite("objects", 4, "ticket-paper")}${sprite("camels", 8, "ticket-pyramid")}<span>พีระมิด</span><strong>${v.pyramidRemaining ?? 0}</strong><small>บัตรละ 1 เหรียญ</small>`;
    this.root.querySelector(".dice-tray")!.innerHTML = (v.dice ?? [])
      .map(
        (d) =>
          `<span class="mini-die ${d}" title="เต๋า${d === "grey" ? "เทา" : NAMES[d as Camel]}ยังไม่ออก">${sprite("objects", 1)}<span>${d === "grey" ? "เทา" : SYMBOL[d as Camel]}</span></span>`,
      )
      .join("");
    this.root.querySelector(".board-decks")!.innerHTML =
      Object.entries(v.available ?? {})
        .map(
          ([color, values]) =>
            `<div class="deck" data-deck="${color}">${sprite("objects", 4)}<span>${SYMBOL[color as Camel]} ${NAMES[color as Camel]}</span><strong>${values[0] ?? "หมด"}</strong><small>${values.length} ใบ</small></div>`,
        )
        .join("") +
      `<div class="finish-deck" data-final="winner">${sprite("objects", 5)}<span>ชนะทั้งเกม ${v.finalCounts?.winner ?? 0} ใบ</span></div><div class="finish-deck" data-final="loser">${sprite("objects", 5)}<span>แพ้ทั้งเกม ${v.finalCounts?.loser ?? 0} ใบ</span></div>`;
    this.root.querySelector(".tile-layer")!.innerHTML = Object.entries(
      v.tiles ?? {},
    )
      .map(([position, t]) => {
        const p = pointFor(+position),
          owner = v.players.find((x) => x.id === t.owner);
        return `<div class="spectator" data-tile="${position}" style="left:${p.x}%;top:${p.y}%">${sprite("objects", t.direction === 1 ? 2 : 3)}<span>${t.direction === 1 ? "+1" : "−1"} ${escape(owner?.name ?? "")}</span></div>`;
      })
      .join("");
    this.root.dataset.visualRevision = String(v.revision);
  }
  private async animate(
    node: HTMLElement,
    keyframes: Keyframe[],
    duration: number,
    generation: number,
  ) {
    if (this.reduced.matches || generation !== this.generation) return;
    const animation = node.animate(keyframes, {
      duration: Math.max(
        50,
        duration / Math.max(1, Math.min(3, this.queue.length)),
      ),
      easing: "ease-in-out",
      fill: "none",
    });
    this.animations.add(animation);
    try {
      await animation.finished;
    } catch {
    } finally {
      this.animations.delete(animation);
    }
  }
  private async drain() {
    if (this.busy) return;
    this.busy = true;
    const generation = this.generation;
    this.root.dataset.animating = "true";
    while (this.queue.length && generation === this.generation) {
      const { view, event } = this.queue.shift()!;
      this.revisionCount++;
      this.root.dataset.animationCount = String(this.revisionCount);
      this.root.dataset.lastEventRevision = String(event.revision);
      await this.play(view, event, generation);
      if (generation !== this.generation) return;
      this.place(view);
    }
    if (generation === this.generation) {
      this.busy = false;
      this.root.dataset.animating = "false";
      this.root.querySelector(".motion-fx")!.replaceChildren();
      this.root.querySelector(".board-toast")!.textContent = "";
    }
  }
  private async play(v: View, e: PublicEvent, g: number) {
    const toast = this.root.querySelector<HTMLElement>(".board-toast")!;
    if (e.kind === "roll" && e.movement && e.roll) {
      toast.textContent = "พีระมิดกำลังปล่อยลูกเต๋า…";
      await this.animate(
        this.root.querySelector(".pyramid")!,
        [
          { transform: "rotate(0deg)" },
          { transform: "rotate(-6deg)" },
          { transform: "rotate(5deg)" },
          { transform: "rotate(0deg)" },
        ],
        330,
        g,
      );
      if (g !== this.generation) return;
      toast.textContent = `อูฐ${NAMES[e.roll.camel]} • ${e.roll.value} ช่อง`;
      const fx = this.root.querySelector<HTMLElement>(".motion-fx")!;
      fx.innerHTML = `<div class="revealed-die">${sprite("objects", 1)}<strong>${e.roll.value}</strong><span>${NAMES[e.roll.camel]}</span></div>`;
      await this.animate(
        fx.querySelector(".revealed-die")!,
        [
          { transform: "scale(.5) rotate(-80deg)", opacity: 0 },
          { transform: "scale(1) rotate(0deg)", opacity: 1 },
        ],
        190,
        g,
      );
      const move = e.movement;
      this.root.dataset.lastUnit = JSON.stringify(move.unit);
      this.root.dataset.lastPath = JSON.stringify(move.path);
      // These are server-supplied steps, including any spectator-tile displacement.
      let from = move.from;
      for (let step = 0; step < move.path.length; step++) {
        const to = move.path[step],
          last = step === move.path.length - 1;
        if (move.tile && from === move.tile.position) {
          toast.textContent = `${move.tile.direction === 1 ? "เชียร์ +1" : "โห่ −1 • ลงใต้กอง"} • ${v.players.find((p) => p.id === move.tile!.owner)?.name ?? ""}`;
          const tile = this.root.querySelector<HTMLElement>(
            `[data-tile="${move.tile.position}"]`,
          );
          if (tile)
            void this.animate(
              tile,
              [
                { transform: "translate(-50%,-50%) scale(1)" },
                { transform: "translate(-50%,-50%) scale(1.2)" },
                { transform: "translate(-50%,-50%) scale(1)" },
              ],
              250,
              g,
            );
        }
        const offset = last
          ? move.destinationStack.indexOf(move.unit[0])
          : move.fromIndex;
        await Promise.all(
          move.unit.map((c, i) => {
            const node = this.root.querySelector<HTMLElement>(
              `[data-camel="${c}"]`,
            )!;
            const a = camelTransform(
                from,
                step === 0 ? move.fromIndex + i : move.fromIndex + i,
              ),
              b = camelTransform(to, Math.max(0, offset) + i);
            node.style.zIndex = String(
              last ? 20 + Math.max(0, offset) + i : 40 + i,
            );
            return this.animate(
              node,
              [{ transform: a }, { transform: b }],
              190,
              g,
            ).then(() => {
              if (g === this.generation) node.style.transform = b;
            });
          }),
        );
        if (g !== this.generation) return;
        from = to;
      }
      // Lift destination residents when the authoritative landing inserts underneath.
      if (move.under)
        await Promise.all(
          move.destinationStack
            .filter((c) => !move.unit.includes(c))
            .map((c) => {
              const node = this.root.querySelector<HTMLElement>(
                `[data-camel="${c}"]`,
              )!;
              node.style.zIndex = String(20 + move.destinationStack.indexOf(c));
              return this.animate(
                node,
                [
                  { transform: node.style.transform },
                  {
                    transform: camelTransform(
                      move.to,
                      move.destinationStack.indexOf(c),
                    ),
                  },
                ],
                160,
                g,
              );
            }),
        );
    }
    if (g !== this.generation) return;
    if (e.kind === "leg" || e.kind === "final") {
      const fx = this.root.querySelector<HTMLElement>(".motion-fx")!;
      fx.innerHTML = `<div class="flying-card">${sprite("objects", e.kind === "final" ? 5 : 4)}</div>`;
      toast.textContent =
        e.kind === "final" ? "ลงการ์ดคว่ำแล้ว" : "รับบัตรเดิมพันรอบย่อยแล้ว";
      const node = fx.querySelector<HTMLElement>(".flying-card")!;
      const target = this.root.querySelector<HTMLElement>(
        e.kind === "final"
          ? `[data-final="${e.side}"]`
          : `[data-deck="${e.color}"]`,
      )!;
      const bounds = this.root.getBoundingClientRect(),
        end = target.getBoundingClientRect();
      // Measure once per accepted action; the browser interpolates transforms.
      const deckX = end.left - bounds.left,
        deckY = end.top - bounds.top;
      const handX = bounds.width * 0.48,
        handY = bounds.height * 0.91;
      node.style.left = "0";
      node.style.top = "0";
      await this.animate(
        node,
        e.kind === "final"
          ? [
              {
                transform: `translate(${handX}px,${handY}px) rotate(-10deg)`,
                opacity: 0,
              },
              {
                transform: `translate(${deckX}px,${deckY}px) rotate(0deg)`,
                opacity: 1,
              },
            ]
          : [
              {
                transform: `translate(${deckX}px,${deckY}px) rotate(0deg)`,
                opacity: 1,
              },
              {
                transform: `translate(${handX}px,${handY}px) rotate(10deg)`,
                opacity: 0,
              },
            ],
        380,
        g,
      );
    }
    if (g !== this.generation) return;
    if (e.money.length) {
      for (const m of e.money) {
        const badge = document.querySelector<HTMLElement>(
          `[data-player="${m.id}"] b`,
        );
        if (badge)
          void this.animate(
            badge,
            [
              { transform: "scale(1)" },
              { transform: "scale(1.18)" },
              { transform: "scale(1)" },
            ],
            400,
            g,
          );
      }

      toast.textContent = e.money
        .map(
          (m) =>
            `${v.players.find((p) => p.id === m.id)?.name} ${m.amount > 0 ? "+" : ""}${m.amount} เหรียญ`,
        )
        .join(" • ");
      const fx = this.root.querySelector<HTMLElement>(".motion-fx")!;
      fx.innerHTML = `<div class="coin-flight">${sprite("objects", 0)}</div>`;
      await this.animate(
        fx.querySelector(".coin-flight")!,
        [
          { transform: "translateY(0)", opacity: 1 },
          { transform: "translateY(-60px)", opacity: 0 },
        ],
        400,
        g,
      );
    }
    if (g !== this.generation) return;
    if (e.legEnded || e.finished) {
      toast.textContent = e.finished
        ? "จบการแข่งขัน • สรุปผล"
        : "คิดคะแนนรอบย่อยแล้ว";
      if (e.finished) {
        const results = document.querySelector<HTMLElement>(".results");
        if (results)
          void this.animate(
            results,
            [
              { opacity: 0, transform: "translateY(10px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            350,
            g,
          );
      }
      await this.animate(
        toast,
        [
          { opacity: 0, transform: "translateY(8px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        250,
        g,
      );
    }
  }
}
