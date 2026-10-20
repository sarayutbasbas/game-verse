import { CARD } from "../../src/games/seven-wonders-duel/data.js";
import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import {testAccount,createDisplayRoom} from "./auth-fixture.js";
import type { WondersView } from "../../src/games/seven-wonders-duel/types.js";
const read = (p: Page): Promise<WondersView> =>
  p.evaluate(() => (window as any).__view);
async function capture(p: Page) {
  await p.addInitScript(() => {
    (window as any).__frames = [];
    (window as any).__sockets = [];
    (window as any).__motions = 0;
    (window as any).__flights = 0;
    (window as any).__syncs = 0;
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (...args: Parameters<typeof animate>) {
      if (this.matches(".wd-pawn,.wd-progress,.wd-slot,.wd-result"))
        (window as any).__motions++;
      if (this.matches(".wd-flight")) (window as any).__flights++;
      return animate.apply(this, args);
    };
    window.WebSocket = new Proxy(window.WebSocket, {
      construct(T, args) {
        const ws = new T(args[0], args[1]);
        (window as any).__sockets.push(ws);
        const send = ws.send.bind(ws);
        ws.send = (data: any) => {
          if (JSON.parse(String(data)).type === "sync")
            (window as any).__syncs++;
          send(data);
        };
        ws.addEventListener("message", (e) => {
          const m = JSON.parse(e.data);
          (window as any).__frames.push(m);
          if (m.type === "state" && (window as any).__dropStates) {
            (window as any).__dropStates--;
            e.stopImmediatePropagation();
            return;
          }
          if (m.type === "state") (window as any).__view = m.view;
          if (m.type === "ack" && (window as any).__dropAck) {
            (window as any).__dropAck = false;
            e.stopImmediatePropagation();
            ws.close();
          }
        });
        return ws;
      },
    });
  });
}
async function revision(p: Page, n: number) {
  await expect(p.locator("#main")).toHaveAttribute("data-revision", String(n));
}
test("7 Wonders Duel: display + two phones, Wonder draft, three Ages, costs, reconnect, privacy and rematch", async ({
  browser,
}) => {
  test.setTimeout(240000);
  const contexts: BrowserContext[] = [],
    errors: string[] = [];
  let host: Page | undefined, code: string | undefined;
  const make = async (mobile = false) => {
    const c = await browser.newContext({
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1440, height: 1000 },
      isMobile: mobile,
      hasTouch: mobile,
    });
    contexts.push(c);
    const p = await c.newPage();
    await capture(p);
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("response", (r) => {
      if (new URL(r.url()).pathname.startsWith("/art/") && r.status() >= 400)
        errors.push("art " + r.status());
    });
    return p;
  };
  try {
    host = await make();
    await host.goto("/games/seven-wonders-duel");
    await testAccount(host);
    await createDisplayRoom(host);
    await expect(host.locator("#qr")).toBeVisible();
    code = await host.locator(".room-code strong").innerText();
    const phones: Page[] = [];
    for (let i = 0; i < 2; i++) {
      const p = await make(true);
      phones.push(p);
      await p.goto("/play/" + code);
      await p
        .getByRole("textbox", { name: "ชื่อของคุณ" })
        .fill(i ? "นครจันทร์" : "นครตะวัน");
      await p.getByRole("button", { name: "เข้าห้อง", exact: true }).click();
      await p.getByRole("button", { name: "พร้อมเล่น", exact: true }).click();
    }
    const third = await make(true);
    await third.goto("/play/" + code);
    await third.getByRole("textbox", { name: "ชื่อของคุณ" }).fill("คนที่สาม");
    await third.getByRole("button", { name: "เข้าห้อง", exact: true }).click();
    await expect(third.locator("#notice")).toContainText("เต็ม");
    const ids = await Promise.all(
      phones.map(async (p) => (await read(p)).me!.id),
    );
    await host.locator("#starter").selectOption(ids[0]);
    await host.getByRole("button", { name: "เริ่มเกม", exact: true }).click();
    await expect(host.locator(".wd-draft")).toBeVisible();
    await host.screenshot({
      path: "test-results/wonders-draft-desktop.png",
      fullPage: true,
    });
    let v = await read(host),
      moves = 0;
    const ages = new Set<number>();
    let reconnected = false,
      previewed = false;
    while (v.phase !== "finished" && moves < 80) {
      const phone = phones[ids.indexOf(v.turn!)];
      await revision(phone, v.revision);
      const pv = await read(phone);
      const next = v.revision + 1;
      const dropping = moves === 12;
      if (dropping)
        await host.evaluate(() => ((window as any).__dropStates = 1));
      if (v.phase === "setup") {
        await phone.locator("[data-pick]:not([disabled])").first().click();
        await phone.locator("#wd-pick-confirm").click();
      } else if (pv.me!.decision) {
        if (!reconnected) {
          const old = pv;
          await phone.reload();
          await expect(
            phone.locator("[data-choice]:not([disabled])"),
          ).toHaveCount(old.me!.decision!.options.length);
          expect((await read(phone)).me!.id).toBe(old.me!.id);
          expect((await read(phone)).me!.decision).toEqual(old.me!.decision);
          expect(await phone.evaluate(() => (window as any).__motions)).toBe(0);
          reconnected = true;
        }
        await phone.locator("[data-choice]:not([disabled])").first().click();
      } else {
        if (!ages.has(v.age!)) {
          ages.add(v.age!);
          await host.screenshot({
            path: `test-results/wonders-age-${v.age}-desktop.png`,
            fullPage: true,
          });
          await host.setViewportSize({ width: 1024, height: 768 });
          await host.screenshot({
            path: `test-results/wonders-age-${v.age}-ipad.png`,
            fullPage: true,
          });
          expect(
            await host.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          ).toBeTruthy();
          await host.setViewportSize({ width: 1440, height: 1000 });
        }
        const offer =
          pv.me!.offers.find((o) => o.build.affordable && o.build.total > 0) ??
          pv.me!.offers[0];
        const card = v.layout!.find((n) => n.slot === offer.slot)!.card!;
        const safeBuild =
          offer.build.affordable &&
          !["red", "green"].includes(CARD[card].color);
        await phone.locator(`[data-slot="${offer.slot}"]`).click();
        await phone
          .locator(`[data-mode="${safeBuild ? "build" : "discard"}"]`)
          .click();
        if (!previewed) {
          expect((await read(phone)).revision).toBe(v.revision);
          await phone.screenshot({
            path: "test-results/wonders-phone-cost.png",
            fullPage: true,
          });
          await phone.evaluate(() => ((window as any).__dropAck = true));
          previewed = true;
        }
        await phone.locator("#wd-confirm").click();
      }
      await Promise.all(
        [...(dropping ? [] : [host]), ...phones].map((p) => revision(p, next)),
      );
      moves++;
      v = await read(dropping ? phone : host);
      await phone.waitForTimeout(300);
      if (moves === 10) {
        const count = await host.evaluate(() => (window as any).__motions);
        await host.evaluate(() => {
          const m = (window as any).__frames
            .filter((m: any) => m.type === "state")
            .at(-1);
          (window as any).__sockets
            .at(-1)
            .dispatchEvent(
              new MessageEvent("message", { data: JSON.stringify(m) }),
            );
        });
        expect(await host.evaluate(() => (window as any).__motions)).toBe(
          count,
        );
      }
    }
    expect(
      await host.evaluate(() => (window as any).__flights),
    ).toBeGreaterThan(0);
    expect(await host.evaluate(() => (window as any).__syncs)).toBeGreaterThan(
      0,
    );
    expect(v.phase).toBe("finished");
    expect(v.victory).toBe("civilian");
    expect([...ages]).toEqual([1, 2, 3]);
    expect(reconnected).toBeTruthy();
    await expect(host.locator(".wd-result")).toBeVisible();
    await host.screenshot({
      path: "test-results/wonders-final-desktop.png",
      fullPage: true,
    });
    await phones[0].screenshot({
      path: "test-results/wonders-final-phone.png",
      fullPage: true,
    });
    for (const p of phones) {
      expect((await read(p)).scores).toEqual(v.scores);
      expect(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
    }
    for (const p of [host, ...phones]) {
      const frames = await p.evaluate(() =>
        (window as any).__frames.filter((m: any) => m.type === "state"),
      );
      for (const { view } of frames) {
        expect(view.decks).toBeUndefined();
        expect(view.boxTokens).toBeUndefined();
        expect(view.wonderDeck).toBeUndefined();
        expect(view.removed).toBeUndefined();
        for (const n of view.layout ?? [])
          if (!n.faceUp) expect(n.card).toBeUndefined();
      }
      expect(
        await p
          .locator(".wd-root img")
          .evaluateAll((imgs) =>
            imgs.every(
              (img) =>
                (img as HTMLImageElement).complete &&
                (img as HTMLImageElement).naturalWidth > 0 &&
                !img.getAttribute("src")?.endsWith("fallback.svg"),
            ),
          ),
      ).toBeTruthy();
    }
    await host.locator("#wd-restart").click();
    await expect(host.locator(".wd-draft")).toBeVisible();
    const fresh = await read(host);
    expect(fresh.sequence).toBe(0);
    expect(fresh.military).toBe(0);
    expect(fresh.discard).toEqual([]);
    expect(
      fresh.players.every(
        (p) =>
          p.coins === 7 &&
          p.buildings.length === 0 &&
          p.tokens.length === 0 &&
          p.wonders.length === 0,
      ),
    ).toBeTruthy();
    expect(errors).toEqual([]);
  } finally {
    if (host && code)
      await host.request.post("/api/rooms/leave", {
        headers: { Origin: new URL(host.url()).origin },
        data: { code, close: true },
      });
    for (const c of contexts) await c.close();
  }
});

// Targeted late-game fixtures verify browser/server victory and secret decision flow;
// the test above independently plays the complete normal setup/three-Age game.
for (const kind of ["military", "science", "library"] as const)
  test(`Duel ${kind}: authoritative end state on display and both phones`, async ({
    browser,
  }) => {
    const { startServer } = await import("../../src/server/index.js");
    const { lateFixture } = await import("../wonders-fixture.js");
    const { mkdtemp, rm } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const dir = await mkdtemp(join(tmpdir(), "wonders-browser-")),
      app = await startServer(0, "127.0.0.1", true, () => 0.42, {
        storePath: join(dir, "test.sqlite"),
      });
    const url = `http://localhost:${(app.server.address() as any).port}`;
    const contexts: BrowserContext[] = [];
    try {
      const pages: Page[] = [];
      for (let i = 0; i < 3; i++) {
        const c = await browser.newContext({
          viewport: i
            ? { width: 390, height: 844 }
            : { width: 1440, height: 1000 },
          reducedMotion: kind === "science" ? "reduce" : "no-preference",
        });
        contexts.push(c);
        const p = await c.newPage();
        await capture(p);
        pages.push(p);
      }
      const [host, a, b] = pages;
      await host.goto(url + "/games/seven-wonders-duel");
      await testAccount(host, app);
      await createDisplayRoom(host);
      await expect(host.locator("#qr")).toBeVisible();
      const code = await host.locator(".room-code strong").innerText();
      for (const [i, p] of [a, b].entries()) {
        await p.goto(url + "/play/" + code);
        await p
          .getByRole("textbox", { name: "ชื่อของคุณ" })
          .fill(i ? "ฝ่ายสอง" : "ฝ่ายหนึ่ง");
        await p.getByRole("button", { name: "เข้าห้อง", exact: true }).click();
        await p.getByRole("button", { name: "พร้อมเล่น", exact: true }).click();
      }
      const room = app.rooms.rooms.get(code)!;
      room.wonders = lateFixture(room.players, kind);
      room.revision++;
      (app.rooms as any).broadcast(room, true);
      await expect(host.locator(".wd-layout")).toBeVisible();
      await revision(a, room.revision);
      await revision(b, room.revision);
      if (kind === "library") {
        const prior = await read(a);
        expect(prior.me!.decision?.kind).toBe("library");
        expect((await read(host)).pending?.options).toBeUndefined();
        expect((await read(b)).me!.decision).toBeUndefined();
        expect(prior.me!.decision!.options).toContain("law");
        await a.reload();
        await expect(a.locator('[data-choice="law"]')).toBeVisible();
        expect((await read(a)).me!.decision).toEqual(prior.me!.decision);
        expect(await a.evaluate(() => (window as any).__motions)).toBe(0);
        await a.locator('[data-choice="law"]').click();
      } else {
        await a.locator('[data-slot="19"]').click();
        await a.locator('[data-mode="build"]').click();
        await a.locator("#wd-confirm").click();
      }
      const final = room.revision;
      await Promise.all(pages.map((p) => revision(p, final)));
      for (const p of pages) {
        await expect(p.locator(".wd-result")).toBeVisible();
        const v = await read(p);
        expect(v.victory).toBe(kind === "military" ? "military" : "science");
        expect(v.winners).toEqual([room.players[0].id]);
        expect(v.me?.legal ?? []).toEqual([]);
      }
      await host.screenshot({
        path: `test-results/wonders-${kind}-victory.png`,
        fullPage: true,
      });
      if (kind === "science")
        expect(await a.evaluate(() => (window as any).__motions)).toBe(0);
    } finally {
      for (const c of contexts) await c.close();
      await app.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
