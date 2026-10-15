import { crown, seatLabel } from "./jaipur-identity.js";
import type { JaipurView } from "../games/jaipur/types.js";
import { avatar } from "./account.js";
const esc = (x: unknown) =>
  String(x ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
let dialog: HTMLDialogElement | undefined;
let activeKey = "";
let cancelCounting: (() => void) | undefined;
let finishCounting: (() => void) | undefined;
let lastView: JaipurView | undefined;
const memory = new Map<string, string>();
function saved(key: string) {
  try {
    return localStorage.getItem(key) ?? memory.get(key);
  } catch {
    return memory.get(key);
  }
}
function save(key: string, value: string) {
  memory.set(key, value);
  try {
    localStorage.setItem(key, value);
  } catch {}
}
/** Legacy saves have no matchId. Their immutable result identity is their full first
 * settlement, including IDs and token awards. New matches always have server UUIDs. */
export function jaipurResultKey(v: JaipurView) {
  return (
    "gameverse:jaipur-result:" +
    v.code +
    ":" +
    (v.matchId ?? JSON.stringify(v.history?.[0] ?? v.result)) +
    ":" +
    v.result?.round
  );
}
function remove() {
  cancelCounting?.();
  cancelCounting = undefined;
  finishCounting = undefined;
  if (dialog) {
    dialog.close();
    dialog.remove();
    dialog = undefined;
  }
  activeKey = "";
}
export function syncJaipurResult(
  v: JaipurView,
  snapshot: boolean,
  fromPlaying: boolean,
) {
  lastView = v;
  if (!v.result || !["results", "finished"].includes(v.phase)) {
    remove();
    return;
  }
  const key = jaipurResultKey(v);
  if (activeKey === key) return;
  remove();
  if (saved(key) === "dismissed") return;
  open(v, !snapshot && fromPlaying && !saved(key));
}
/** Transport calls this only on an authenticated reconnect, never receipt retries. */
export function completeJaipurCounting() {
  finishCounting?.();
}
export function reopenJaipurResult(v: JaipurView) {
  if (v.result) {
    remove();
    open(v, false);
  }
}
function open(v: JaipurView, count: boolean) {
  const r = v.result!;
  const key = jaipurResultKey(v);
  activeKey = key;
  save(key, "seen");
  const focusBefore = document.activeElement as HTMLElement | null;
  const scrollBefore = window.scrollY;
  const d = document.createElement("dialog");
  dialog = d;
  d.className = "jp-result-dialog";
  d.dataset.resultId = key;
  d.setAttribute("aria-labelledby", "jp-result-title");
  const scores = v.players.map((p) => ({
    p,
    s: r.scores.find((s) => s.id === p.id)!,
  }));
  const winner = v.players.find(
    (p) => p.id === (v.phase === "finished" ? v.winners?.[0] : r.winner),
  );
  const finalTitle = winner
    ? `${v.phase === "finished" ? "ผู้ชนะการแข่งขัน" : "ผู้ชนะรอบ"}: ${winner.name} (${seatLabel(v, winner.id)})`
    : "รอบเสมอ · ไม่แจกตราชนะ";
  d.innerHTML = `<div class="jp-result-paper"><p class="jp-result-eyebrow">JAIPUR · รอบ ${r.round}</p><h2 id="jp-result-title">จบรอบแล้ว</h2><p class="jp-count-label" role="status" aria-live="polite">กำลังสรุปจากโทเคนที่ได้รับ</p><div class="jp-result-portraits">${scores.map(({ p }) => `<div data-result-player="${p.id}" class="${p.id === winner?.id ? "jp-winner" : ""}">${p.id === winner?.id ? crown() : ""}${avatar(p)}<span><strong>${esc(p.name)}</strong><small>${seatLabel(v, p.id)}</small></span></div>`).join("")}</div><div class="jp-score-scroll"><table><thead><tr><th>ผู้เล่น</th><th>สินค้า</th><th>โบนัส</th><th>อูฐ</th><th>รวม</th></tr></thead><tbody>${scores.map(({ p }, i) => `<tr data-score-seat="${i}" data-result-row="${p.id}" class="${p.id === winner?.id ? "jp-winner" : ""}"><th>${esc(p.name)}<small>${seatLabel(v, p.id)}</small></th>${["goods", "bonus", "camel", "total"].map((field) => `<td data-count="${i}:${field}">—</td>`).join("")}</tr>`).join("")}</tbody></table></div><p class="jp-result-verdict" hidden>${esc(finalTitle)}<small>${r.tieBreak === "bonus" ? "คะแนนเสมอ · ตัดสินด้วยจำนวนโทเคนโบนัส" : r.tieBreak === "goods" ? "คะแนนและจำนวนโบนัสเสมอ · ตัดสินด้วยจำนวนโทเคนสินค้า" : r.tieBreak === "draw" ? "คะแนน จำนวนโบนัส และจำนวนโทเคนสินค้าเท่ากัน" : "รางวัลอูฐ 5 รูปีให้ฝูงมากกว่า · ฝูงเท่ากันไม่ได้รางวัล"}</small></p><p class="jp-token-breakdown">${scores.map(({ p, s }) => `${esc(p.name)}: สินค้า ${s.tokens.goods.map((t) => t.value).join(" + ") || "0"} · โบนัส ${s.tokens.bonus.map((t) => t.value).join(" + ") || "0"} · อูฐ ${s.herd} ใบ`).join("<br>")}</p><div class="jp-result-actions"><button id="jp-count-skip">ข้ามการนับ</button><button id="jp-result-ok" hidden>ตกลง</button></div></div>`;
  document.body.append(d);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let frame = 0;
  let disposed = false;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const stop = () => {
    clearTimeout(timer);
    cancelAnimationFrame(frame);
  };
  const cleanup = () => {
    disposed = true;
    stop();
    reduce.removeEventListener("change", onReduce);
  };
  cancelCounting = cleanup;
  const setCell = (
    i: number,
    field: "goods" | "bonus" | "camel" | "total",
    value: number,
  ) => {
    d.querySelector(`[data-count="${i}:${field}"]`)!.textContent =
      String(value);
  };
  const final = () => {
    stop();
    for (const [{ s }, i] of scores.map((x, i) => [x, i] as const))
      for (const f of ["goods", "bonus", "camel", "total"] as const)
        setCell(i, f, s[f]);
    d.dataset.stage = "final";
    d.querySelector("#jp-result-title")!.textContent =
      v.phase === "finished" ? "จบการแข่งขัน" : `สรุปรอบ ${r.round}`;
    d.querySelector(".jp-count-label")!.textContent = "นับครบแล้ว";
    (d.querySelector(".jp-result-verdict") as HTMLElement).hidden = false;
    (d.querySelector("#jp-count-skip") as HTMLElement).hidden = true;
    (d.querySelector("#jp-result-ok") as HTMLElement).hidden = false;
    d.querySelector<HTMLButtonElement>("#jp-result-ok")!.focus({
      preventScroll: true,
    });
  };
  finishCounting = final;
  function onReduce() {
    if (reduce.matches) final();
  }
  reduce.addEventListener("change", onReduce);
  const steps = scores
    .map((_, i) => ({ i, field: "goods" as const, label: "โทเคนสินค้า" }))
    .concat([]);
  const timeline: {
    i: number;
    field: "goods" | "bonus" | "camel";
    label: string;
  }[] = [
    ...steps,
    ...scores.map((_, i) => ({
      i,
      field: "bonus" as const,
      label: "โทเคนโบนัส",
    })),
    ...scores.map((_, i) => ({
      i,
      field: "camel" as const,
      label: "รางวัลอูฐ",
    })),
  ];
  let index = 0;
  const advance = () => {
    if (disposed || dialog !== d || lastView?.result?.round !== r.round) return;
    const step = timeline[index++];
    if (!step) {
      final();
      return;
    }
    d.dataset.stage = `${step.i}:${step.field}`;
    d.querySelector(".jp-count-label")!.textContent =
      `${scores[step.i].p.name} · ${step.label}`;
    const value = scores[step.i].s[step.field],
      start = performance.now();
    const tick = (time: number) => {
      if (disposed) return;
      const progress = Math.min(1, (time - start) / 600);
      setCell(step.i, step.field, Math.round(value * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else timer = setTimeout(advance, 350);
    };
    frame = requestAnimationFrame(tick);
  };
  const dismiss = () => {
    save(key, "dismissed");
    remove();
    const target = focusBefore?.isConnected
      ? focusBefore
      : document.querySelector<HTMLElement>("#jp-reopen");
    target?.focus({ preventScroll: true });
    window.scrollTo({ top: scrollBefore, behavior: "instant" });
  };
  d.querySelector<HTMLButtonElement>("#jp-count-skip")!.onclick = final;
  d.querySelector<HTMLButtonElement>("#jp-result-ok")!.onclick = dismiss;
  d.oncancel = (e) => {
    e.preventDefault();
    if (d.dataset.stage === "final") dismiss();
    else final();
  };
  d.showModal();
  if (!count || reduce.matches) final();
  else timer = setTimeout(advance, 700);
}
