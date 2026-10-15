import { testAccount } from "./auth-fixture.js";
import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { startServer } from "../../src/server/index.js";
import * as duel from "../../src/games/dracula-vs-van-helsing/engine.js";
import type {
  DuelState,
  DuelAction,
} from "../../src/games/dracula-vs-van-helsing/types.js";
async function hook(p: Page) {
  await p.addInitScript(() => {
    (window as any).__frames = [];
    (window as any).__sent = [];
    window.WebSocket = new Proxy(window.WebSocket, {
      construct(Target, args) {
        const s = new Target(args[0], args[1]);
        ((window as any).__sockets ??= []).push(s);
        const send = s.send.bind(s);
        s.send = (data) => {
          (window as any).__sent.push(JSON.parse(String(data)).type);
          send(data);
        };
        s.addEventListener("message", (event) => {
          const m = JSON.parse(event.data);
          (window as any).__frames.push(m);
          if (m.type === "state") (window as any).__view = m.view;
          if (m.type === "state" && (window as any).__skip) {
            (window as any).__skip = false;
            event.stopImmediatePropagation();
          } else if (m.type === "state" && (window as any).__duplicate) {
            (window as any).__duplicate = false;
            s.dispatchEvent(new MessageEvent("message", { data: event.data }));
          }
        });
        return s;
      },
    });
  });
}
async function cmd(p: Page, a: unknown) {
  await p.evaluate((action) => {
    const w = window as any;
    w.__sockets.at(-1).send(
      JSON.stringify({
        type: "command",
        id: crypto.randomUUID(),
        revision: w.__view.revision,
        action,
      }),
    );
  }, a);
}
test("authoritative reveal/motion: both hands same snapshot, dedup, gap sync, reconnect mid-reveal and reduced motion", async ({
  browser,
}) => {
  const app = await startServer(0, "127.0.0.1", true, () => 0.42, {storePath: ":memory:", legacyHarness:true}),
    url = `http://127.0.0.1:${(app.server.address() as any).port}`,
    contexts: BrowserContext[] = [];
  const make = async (mobile = false) => {
    const ctx = await browser.newContext({
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1366, height: 1024 },
      isMobile: mobile,
      hasTouch: mobile,
    });
    contexts.push(ctx);
    const p = await ctx.newPage();
    await hook(p);
    return p;
  };
  try {
    const display = await make();
    await display.goto(`${url}/games/dracula-vs-van-helsing`);
    await testAccount(display, app);
    await display.getByRole("button", { name: "สร้างห้องบนจอกลาง" }).click();
    await expect(display.locator(".room-code strong")).toBeVisible();
    const code = await display.locator(".room-code strong").innerText(),
      phones = [];
    for (let i = 0; i < 2; i++) {
      const p = await make(true);
      phones.push(p);
      await p.goto(`${url}/play/${code}`);
      await p
        .getByRole("textbox", { name: "ชื่อของคุณ" })
        .fill(i ? "Hunter" : "Count");
      await p.getByRole("button", { name: "เข้าห้อง", exact: true }).click();
      await p
        .getByRole("button", {
          name: i ? "Van Helsing" : "Dracula",
          exact: true,
        })
        .click();
      await p.getByRole("button", { name: "พร้อมเล่น", exact: true }).click();
    }
    await display
      .getByRole("button", { name: "เริ่มเกม", exact: true })
      .click();
    await expect(display.locator(".duel-table")).toBeVisible();
    await expect(
      phones[0].getByRole("button", { name: "จั่วการ์ด", exact: true }),
    ).toBeVisible();
    await phones[0].screenshot({
      path: "test-results/dracula-mobile-count.png",
      fullPage: true,
    });
    await phones[1].screenshot({
      path: "test-results/dracula-mobile-helsing.png",
      fullPage: true,
    });
    const room = app.rooms.rooms.get(code)!;
    // A real command chain reproduces the reported effect-2 bug on all three screens.
    // Internal deterministic setup only: all 32 cards conserved, no app debug route.
    const fixture = duel.createInitialState(room.players, () => 0.42);
    fixture.players[0].cards = [1, 3, 4, 5, 6].map((value) => ({ suit: "red" as const, value, revealed: false }));
    fixture.players[1].cards = [1, 3, 4, 5, 6].map((value) => ({ suit: "green" as const, value, revealed: false }));
    const used = fixture.players.flatMap((p) => p.cards);
    const remaining = duel.allCards().filter((c) => !used.some((u) => u.suit === c.suit && u.value === c.value));
    fixture.deck = [remaining.find((c) => c.suit === "red" && c.value === 2)!, remaining.find((c) => c.suit === "purple" && c.value === 5)!,
      ...remaining.filter((c) => !(c.suit === "red" && c.value === 2) && !(c.suit === "purple" && c.value === 5))];
    fixture.lastAction = "เตรียมทดสอบไพ่เปิดเผย";
    room.duel = fixture;
    for (const p of [display, ...phones]) {
      await p.evaluate(() => (window as any).__sockets.at(-1).send(JSON.stringify({ type: "sync" })));
      await expect(p.locator(".board-turn small")).toHaveText(fixture.lastAction);
    }
    const all = [display, ...phones];
    const sendAndWait = async (p: Page, action: DuelAction) => {
      const revision = room.revision + 1;
      await cmd(p, action);
      for (const page of all) await expect(page.locator("#main")).toHaveAttribute("data-revision", String(revision));
    };
    await sendAndWait(phones[0], { type: "draw" });
    for (const p of all) await expect(p.locator(".public-draw")).toHaveCount(0);
    await sendAndWait(phones[0], { type: "discard", slot: -1 });
    const drawsBefore = Number(await display.locator('.duel-table').getAttribute('data-draw-animation-count') ?? 0);
    await display.evaluate(() => ((window as any).__duplicate = true));
    await sendAndWait(phones[1], { type: "draw" });
    await expect(display.locator('.duel-table')).toHaveAttribute('data-draw-animation-count',String(drawsBefore+1));
    for(const p of all) {
      await expect(p.locator('.duel-table')).toHaveAttribute('data-draw-revision',String(room.revision));
      await expect(p.locator('.city-draw')).toHaveAttribute('data-draw-state','held');
    }
    for (const p of all) {
      await expect(p.locator(".public-draw .duel-value")).toHaveText("5");
      expect(await p.evaluate(() => (window as any).__view.drawn)).toEqual({ suit: "purple", value: 5, revealed: true });
    }
    await phones[0].screenshot({ path: "test-results/dracula-public-draw-phone.png", fullPage: true });
    await sendAndWait(phones[1], { type: "discard", slot: 3 });
    for (const p of all) {
      await expect(p.locator('[data-district="3"] [data-side="helsing"] .duel-value')).toHaveText("5");
      await expect(p.locator(".board-turn small")).toContainText("ที่เขต 4");
      await expect(p.locator(".public-draw")).toHaveCount(0);
    }
    await phones[0].reload();
    await expect(phones[0].locator('[data-district="3"] [data-side="helsing"] .duel-value')).toHaveText("5");
    // Internal engine fixture, never an HTTP/debug endpoint: roll forward legally
    // until one intent will end this round. This sets up a deterministic reveal.
    let s = room.duel!,
      final: DuelAction | undefined;
    for (let i = 0; i < 150 && !final; i++) {
      const legal = duel.getLegalActions(s, s.turn);
      const a = legal.find((a) => a.type === "end-round") ?? legal[0];
      const after = duel.applyAction(s, s.turn, a, () => 0.42);
      if (after.phase !== "playing") {
        final = a;
        break;
      }
      s = after;
    }
    expect(final).toBeDefined();
    room.duel = s;
    for (const p of [display, ...phones])
      await p.evaluate(() =>
        (window as any).__sockets.at(-1).send(JSON.stringify({ type: "sync" })),
      );
    await expect(display.locator(".duel-table")).toHaveAttribute(
      "data-motion-state",
      "idle",
    );
    const previous = room.revision;
    const beforeMotions = Number(await display.locator(".duel-table").getAttribute("data-animation-count"));
    const actor = phones.find((_, i) => room.players[i].id === s.turn)!;
    const scrollPositions = await Promise.all(phones.map(p => p.evaluate(() => {
      const city = document.querySelector('.city-map')!;
      scrollTo(0, Math.max(0, city.getBoundingClientRect().top + scrollY - 20));
      return scrollY;
    })));
    await display.evaluate(() => ((window as any).__duplicate = true));
    await cmd(actor, final!);
    await expect(display.locator(".duel-table")).toHaveAttribute(
      "data-presentation-revision",
      String(previous + 1),
    );
    await expect(display.locator(".duel-table")).toHaveAttribute(
      "data-reveal-revision",
      String(previous + 1),
    );
    expect(
      await display.locator('.district [data-card="revealed"]').count(),
    ).toBe(10);
    const motions = await display
      .locator(".duel-table")
      .getAttribute("data-animation-count");
    expect(Number(motions)).toBe(beforeMotions + 1);
    // Both cards within each district open together, and later districts stay covered.
    for (let district = 0; district < room.duel!.result!.districts.length; district++) {
      for (const p of [display, ...phones]) {
        await expect(p.locator(".duel-table")).toHaveAttribute("data-reveal-district", String(district), { timeout: 6000 });
        await expect(p.locator(".reveal-verdict")).toContainText("แพ้", { timeout: 3000 });
        await expect(p.locator(".reveal-pending")).toHaveCount(4 - district);
        const starts = await p.locator(`[data-district="${district}"] .duel-card`).evaluateAll((cards) => cards.map((c) => c.getAnimations()[0]?.startTime));
        expect(starts[0]).toEqual(starts[1]);
        const result = room.duel!.result!.districts[district];
        await expect(p.locator(".board-health strong")).toHaveText(`${result.hp}/12`);
        if (district === 0) {
          const hidden = await p.locator('[data-district="1"] .duel-value').evaluateAll((els) => els.every((el) => getComputedStyle(el).visibility === "hidden"));
          expect(hidden).toBeTruthy();
          const overlay=p.locator('.city-map > .board-reveal-layer');
          await expect(overlay).toBeVisible();
          await expect(p.locator('dialog')).toHaveCount(0);
          const layer=(await overlay.boundingBox())!, board=(await p.locator('.city-map').boundingBox())!;
          expect(Math.abs(layer.x-board.x)).toBeLessThan(8);
          expect(layer.y).toBeGreaterThanOrEqual(board.y);
          expect(await overlay.evaluate(n=>getComputedStyle(n).position)).toBe('absolute');
          expect(await p.evaluate(()=>document.documentElement.style.overflow)).not.toBe('hidden');
          if(p!==display) {
            await expect(p.locator('.city-draw #next-round')).toBeDisabled();
            expect(Math.abs(await p.evaluate(()=>scrollY)-scrollPositions[phones.indexOf(p)])).toBeLessThan(2);
          }
        }
      }
      if (district === 0) {
        await display.screenshot({ path: "test-results/dracula-reveal.png", fullPage: false });
        await phones[0].screenshot({ path: "test-results/dracula-paired-reveal-phone.png", fullPage: false });
      }
    }
    for (const p of [display, ...phones]) await expect(p.locator(".duel-table")).toHaveAttribute("data-motion-state", "idle", { timeout: 6000 });
    await expect(phones[0].getByRole("button", { name: "พร้อมรอบถัดไป" })).toBeEnabled();
    for (const [i, p] of phones.entries()) {
      expect(Math.abs(await p.evaluate(()=>scrollY) - scrollPositions[i])).toBeLessThan(2);
      await expect(p.locator('#next-round')).toBeInViewport();
      await expect(p.locator('dialog[open]')).toHaveCount(0);
      expect(await p.evaluate(()=>document.documentElement.style.overflow)).not.toBe("hidden");
      const ready=(await p.locator('#next-round').boundingBox())!, deck=(await p.locator('.city-draw').boundingBox())!;
      expect(ready.x).toBeGreaterThanOrEqual(deck.x);
      expect(ready.x+ready.width).toBeLessThanOrEqual(deck.x+deck.width);
      expect(await p.locator('#duel-controls').evaluate(n=>getComputedStyle(n).position)).toBe('absolute');
    }
    await phones[0].screenshot({path:"test-results/dracula-centered-ready.png"});
    // Reloading a result snapshot never replays the completed district sequence.
    await display.reload();
    await expect(display.locator(".duel-table")).toHaveAttribute(
      "data-motion-state",
      "idle",
    );
    await expect(
      display.locator('.district [data-card="revealed"]'),
    ).toHaveCount(10);
    await expect(display.locator(".duel-table")).toHaveAttribute(
      "data-animation-count",
      "0",
    );
    const d = phones[0],
      h = phones[1];
    await d.getByRole("button", { name: "พร้อมรอบถัดไป" }).click();
    await expect(h.locator("#main")).toHaveAttribute(
      "data-revision",
      String(previous + 2),
    );
    await h.getByRole("button", { name: "พร้อมรอบถัดไป" }).click();
    await expect(
      d.getByRole("button", { name: "จั่วการ์ด", exact: true }),
    ).toBeVisible();
    await Promise.all(
      [display, ...phones].map((p) =>
        expect(p.locator("#main")).toHaveAttribute(
          "data-revision",
          String(previous + 3),
        ),
      ),
    );
    await display.emulateMedia({ reducedMotion: "reduce" });
    const count = await display
      .locator(".duel-table")
      .getAttribute("data-animation-count");
    const drawRevision = room.revision + 1;
    await d.getByRole("button", { name: "จั่วการ์ด", exact: true }).click();
    await Promise.all(
      [display, ...phones].map((p) =>
        expect(p.locator("#main")).toHaveAttribute(
          "data-revision",
          String(drawRevision),
        ),
      ),
    );
    await expect(display.locator(".duel-table")).toHaveAttribute(
      "data-motion-state",
      "idle",
    );
    expect(
      await display.locator(".duel-table").getAttribute("data-animation-count"),
    ).toBe(count);
    // Resolve another authoritative round to exercise interruption while revealing.
    const continued = structuredClone(room.duel!);
    let partial = room.duel!, ending: DuelAction | undefined;
    for (let i = 0; i < 150 && !ending; i++) {
      const actions = duel.getLegalActions(partial, partial.turn);
      const action = actions.find((a) => a.type === "end-round") ?? actions[0];
      const after = duel.applyAction(partial, partial.turn, action, () => 0.42);
      if (after.phase !== "playing") ending = action;
      else partial = after;
    }
    expect(ending).toBeDefined();
    room.duel = partial;
    partial.lastAction = "เตรียมทดสอบข้ามการเฉลย";
    for (const p of all) {
      await p.evaluate(() => (window as any).__sockets.at(-1).send(JSON.stringify({ type: "sync" })));
      await expect(p.locator(".board-turn small")).toHaveText(partial.lastAction);
    }
    const finisher = phones.find((_, i) => room.players[i].id === partial.turn)!;
    await sendAndWait(finisher, ending!);
    await expect(display.locator(".duel-table")).toHaveAttribute("data-motion-state", "idle");
    await expect(display.locator(".reveal-focus")).toHaveCount(0);
    await expect(h.locator(".duel-table")).toHaveAttribute("data-motion-state", "animating");
    const hCount = await h.locator(".duel-table").getAttribute("data-animation-count");
    // A valid early ACK from another device must preserve this result's sequence.
    await sendAndWait(d, { type: "next-round" });
    await expect(h.locator(".duel-table")).toHaveAttribute("data-motion-state", "animating");
    expect(await h.locator(".duel-table").getAttribute("data-animation-count")).toBe(hCount);
    await h.getByRole("button", { name: "แสดงผลทั้งหมด" }).click();
    await expect(h.locator(".duel-table")).toHaveAttribute("data-motion-state", "idle");
    await expect(h.locator(".reveal-pending")).toHaveCount(0);
    await expect(h.getByRole("button", { name: "พร้อมรอบถัดไป" })).toBeEnabled();
    await d.emulateMedia({ reducedMotion: "reduce" });
    await expect(d.locator(".duel-table")).toHaveAttribute("data-motion-state", "idle");
    await expect(d.locator(".reveal-pending")).toHaveCount(0);
    await d.reload();
    await expect(d.locator(".duel-table")).toHaveAttribute("data-motion-state", "idle");
    await expect(d.locator(".reveal-focus")).toHaveCount(0);
    expect(await d.evaluate(() => (window as any).__view.result)).toEqual(room.duel!.result);
    await d.emulateMedia({ reducedMotion: "no-preference" });
    room.duel = continued;
    continued.lastAction = "ทดสอบ event gap ต่อ";
    for (const p of all) {
      await p.evaluate(() => (window as any).__sockets.at(-1).send(JSON.stringify({ type: "sync" })));
      await expect(p.locator(".board-turn small")).toHaveText(continued.lastAction);
    }
    await display.emulateMedia({ reducedMotion: "no-preference" });
    // Drop one state then the next arrives with a revision gap: display asks sync.
    await display.evaluate(() => ((window as any).__skip = true));
    const legal = duel.getLegalActions(room.duel!, room.duel!.turn),
      first = legal[0];
    const firstRevision = room.revision + 1;
    await cmd(d, first);
    await expect(d.locator("#main")).toHaveAttribute(
      "data-revision",
      String(firstRevision),
    );
    const next = duel.getLegalActions(room.duel!, room.duel!.turn)[0],
      player = phones.find((_, i) => room.players[i].id === room.duel!.turn)!;
    const nextRevision = room.revision + 1;
    await cmd(player, next);
    await expect(display.locator(".duel-table")).toHaveAttribute(
      "data-presentation-revision",
      String(nextRevision),
    );
    await expect(display.locator(".duel-table")).toHaveAttribute(
      "data-motion-state",
      "idle",
    );
    await expect
      .poll(() =>
        display.evaluate(
          () =>
            (window as any).__sent.filter((t: string) => t === "sync").length,
        ),
      )
      .toBeGreaterThan(0);
    for (const p of [display, ...phones])
      expect(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
  } finally {
    for (const c of contexts) await c.close();
    await app.close();
  }
});
