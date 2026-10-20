import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {testAccount,createDisplayRoom} from "./auth-fixture.js";
import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import type { DuelView } from "../../src/games/dracula-vs-van-helsing/types.js";
async function capture(p: Page) {
  await p.addInitScript(() => {
    (window as any).__frames = [];
    window.WebSocket = new Proxy(window.WebSocket, {
      construct(Target, args) {
        const socket = new Target(args[0], args[1]);
        ((window as any).__sockets ??= []).push(socket);
        socket.addEventListener("message", (event) => {
          const m = JSON.parse(event.data);
          (window as any).__frames.push(m);
          if (m.type === "state") (window as any).__view = m.view;
          if ((window as any).__dropAck && m.type === "ack") {
            (window as any).__dropAck = false;
            event.stopImmediatePropagation();
            socket.close();
          }
        });
        return socket;
      },
    });
  });
}
const read = (p: Page): Promise<DuelView> =>
  p.evaluate(() => (window as any).__view);
async function revision(p: Page, n: number) {
  await expect(p.locator("#main")).toHaveAttribute("data-revision", String(n));
}
test("portal → Dracula duel, two phones, private draws, atomic reveal, lost ACK and reconnect, full game", async ({
  browser,
}) => {
  const contexts: BrowserContext[] = [],
    errors: string[] = [];
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
    p.on("pageerror", (e) => errors.push(e.message));
    await capture(p);
    return p;
  };
  try {
    const display = await make();
    await display.goto("/");
    await display.screenshot({
      path: "test-results/portal.png",
      fullPage: true,
    });
    await expect(
      display.getByRole("link", { name: /เลือกเล่น Camel Up/ }),
    ).toBeVisible();
    await display.getByRole("link", { name: /เลือกเล่น Dracula/ }).click();
    await testAccount(display);
    await createDisplayRoom(display);
    await expect(display.locator(".room-code strong")).toBeVisible();
    const code = await display.locator(".room-code strong").innerText();
    const d = await make(true),
      h = await make(true),
      phones = [d, h];
    for (let i = 0; i < 2; i++) {
      const p = phones[i];
      await p.goto(`/play/${code}`);
      await p
        .getByRole("textbox", { name: "ชื่อของคุณ" })
        .fill(i ? "มือถือ Helsing" : "มือถือ Dracula");
      await p.getByRole("button", { name: "เข้าห้อง", exact: true }).click();
      await expect(
        p.getByRole("heading", { name: "คุณเข้าห้องแล้ว" }),
      ).toBeVisible();
      await p
        .getByRole("button", { name: i ? /^Van Helsing/ : /^Dracula/ })
        .click();
      await p.getByRole("button", { name: "พร้อมเล่น", exact: true }).click();
    }
    await expect(
      display.getByRole("button", { name: "เริ่มเกม", exact: true }),
    ).toBeEnabled();
    await display
      .getByRole("button", { name: "เริ่มเกม", exact: true })
      .click();
    await expect(
      d.getByRole("button", { name: "จั่วการ์ด", exact: true }),
    ).toBeEnabled();
    await d.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await d.locator(".shared-room-menu summary").click();
    await d.locator(".room-code").click();
    const joinOrigin = (await (await d.request.get("/api/platform")).json()).joinOrigin ?? new URL(d.url()).origin;
    await expect.poll(() => d.evaluate(() => navigator.clipboard.readText())).toBe(new URL(`/play/${code}`, joinOrigin).href);
    await d.locator(".shared-room-menu summary").click();
    let v = await read(display);
    expect(v.racks!.dracula.every((c) => c === null)).toBeTruthy();
    expect(v.racks!.helsing.every((c) => c === null)).toBeTruthy();
    expect(v.me).toBeUndefined();
    await display.screenshot({
      path: "test-results/dracula-desktop.png",
      fullPage: true,
    });
    await display.setViewportSize({ width: 1024, height: 768 });
    await display.screenshot({
      path: "test-results/dracula-ipad.png",
      fullPage: true,
    });
    await display.setViewportSize({ width: 768, height: 1024 });
    await display.screenshot({
      path: "test-results/dracula-ipad-portrait.png",
      fullPage: true,
    });
    await display.setViewportSize({ width: 1366, height: 1024 });
    for (const p of [display, d, h])
      expect(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
    const ids = phones.map(async (p) => (await read(p)).me!.id);
    const playerIds = await Promise.all(ids);
    await d.evaluate(() => ((window as any).__dropAck = true));
    await d.getByRole("button", { name: "จั่วการ์ด", exact: true }).click();
    await expect(d.locator('[data-slot="-1"]')).toBeVisible();
    await expect(d.locator(".game-toast")).toBeHidden();
    v = await read(display);
    await revision(h, v.revision);
    expect(v.drawn).toBeUndefined();
    expect((await read(h)).me!.drawn).toBeUndefined();
    expect((await read(d)).me!.drawn).toBeDefined();
    await d.screenshot({
      path: "test-results/dracula-mobile.png",
      fullPage: true,
    });
    if (process.env.GAMEVERSE_E2E_DOCKER === "1") {
      const ownBeforeRestart = (await read(d)).me!;
      const stateBeforeRestart = await read(display);
      // Recreate only this local service; its named data volume and auth secret stay intact.
      await promisify(execFile)("docker", ["compose", "up", "--detach", "--force-recreate", "--wait", "app"], { timeout: 90000 });
      for (const p of [display, d, h]) {
        await expect(p.locator('.connection[data-online="true"]')).toBeVisible();
        await p.reload();
        await expect(p.locator(".district")).toHaveCount(5);
      }
      const ownAfterRestart = (await read(d)).me!;
      expect(ownAfterRestart.id).toBe(ownBeforeRestart.id);
      expect(ownAfterRestart.drawn).toEqual(ownBeforeRestart.drawn);
      expect(ownAfterRestart.cards).toEqual(ownBeforeRestart.cards);
      expect((await read(display)).turn).toBe(stateBeforeRestart.turn);
      expect((await read(display)).step).toBe(stateBeforeRestart.step);
      expect((await read(display)).racks).toEqual(stateBeforeRestart.racks);
    }
    await h.context().setOffline(true);
    await h.evaluate(() => (window as any).__sockets.at(-1).close());
    await expect(
      display.locator('.rack-side-label[data-character="helsing"] small').filter({hasText:"หลุด"}),
    ).toBeVisible();
    await h.context().setOffline(false);
    await expect(
      h.locator('.connection[data-online="true"]'),
    ).toBeVisible();
    await h.reload();
    await expect(h.locator(".district")).toHaveCount(5);
    expect((await read(h)).me!.id).toBe(playerIds[1]);
    let rounds = 0,
      actions = 0,
      resultReconnect = false, manualReconnect = false;
    while ((v = await read(display)).phase !== "finished" && actions < 320) {
      const next = v.revision + 1;
      if(v.revealPending) {
        let opened=false;
        for(const phone of phones) {
          const closed=phone.locator('[data-result-slot]').first();
          if(await closed.count()) {await closed.click();await Promise.all([display,d,h].map(page=>revision(page,next)));opened=true;break;}
        }
        expect(opened).toBeTruthy();actions++;
        if(process.env.GAMEVERSE_E2E_DOCKER==="1"&&!manualReconnect){
          const pending=await read(display);
          await promisify(execFile)("docker",["compose","up","--detach","--force-recreate","--wait","app"],{timeout:90000});
          for(const page of [display,d,h]){await page.reload();await expect(page.locator('.district')).toHaveCount(5);}
          expect((await read(display)).racks).toEqual(pending.racks);
          expect((await read(display)).revealedCount).toBe(pending.revealedCount);
          expect((await read(d)).me!.id).toBe(playerIds[0]);expect((await read(h)).me!.id).toBe(playerIds[1]);
          manualReconnect=true;
        }
        continue;
      }
      if (v.phase === "results") {
        rounds++;
        expect(v.result!.cards.dracula.length).toBe(5);
        expect(v.result!.cards.helsing.length).toBe(5);
        expect(v.event!.reveal).toEqual(v.result);
        await display.screenshot({
          path: "test-results/dracula-round.png",
          fullPage: false,
        });
        if (!resultReconnect) {
          const before = await read(d);
          await d.reload();
          await expect(
            d.getByRole("button", { name: "พร้อมรอบถัดไป" }),
          ).toBeVisible();
          expect((await read(d)).me!.id).toBe(playerIds[0]);
          expect((await read(d)).result).toEqual(before.result);
          resultReconnect = true;
        }
        await d.getByRole("button", { name: "พร้อมรอบถัดไป" }).click();
        await Promise.all([display, d, h].map((p) => revision(p, next)));
        expect((await read(display)).round).toBe(v.round);
        await h.getByRole("button", { name: "พร้อมรอบถัดไป" }).click();
        await Promise.all([display, d, h].map((p) => revision(p, next + 1)));
        continue;
      }
      const p = phones[playerIds.indexOf(v.turn!)];
      const own = await read(p);
      await p.waitForTimeout(280); // production 40 commands/10 sec quota
      if (v.step === "draw") {
        // Keep rounds long enough to test effects; prefer normal draw over early call.
        await p.getByRole("button", { name: "จั่วการ์ด", exact: true }).click();
      } else if (v.step === "discard") {
        const legal = own.me!.legal.filter((a) => a.type === "discard");
        const a =
          legal.find((a) => a.type === "discard" && a.slot === -1) ?? legal[0];
        if (a.type !== "discard") throw Error("missing discard");
        await p.locator(`[data-slot="${a.slot}"]`).click();
        await expect(p.locator("#selection-preview")).not.toHaveText("");
        await p.getByRole("button", { name: "ยืนยันทิ้งการ์ด" }).click();
      } else {
        await expect(p.locator("#confirm-effect")).toBeEnabled();
        await p.getByRole("button", { name: "ยืนยันความสามารถ" }).click();
      }
      actions++;
      await Promise.all([display, d, h].map((p) => revision(p, next)));
      // Same game revision can temporarily carry different presence while a
      // reconnect crosses instances. Require the entire public view to converge.
      for (const phone of phones) await expect(async () => {
        const pub = await read(display), { me, ...publicPart } = await read(phone);
        expect(publicPart).toEqual(pub);
      }).toPass({ timeout: 30000 });
    }
    v = await read(display);
    expect(v.phase).toBe("finished");
    expect(v.winner).toBeTruthy();
    expect(actions).toBeGreaterThan(15);
    expect(resultReconnect).toBeTruthy();
    // The server has settled immediately; presentation reveals each district first.
    await expect(display.locator(".duel-table")).toHaveAttribute("data-motion-state", "idle", { timeout: 16000 });
    await expect(
      display.getByRole("heading", { name: /ผู้ชนะ:/ }),
    ).toBeVisible();
    await display.screenshot({
      path: "test-results/dracula-finished.png",
      fullPage: true,
    });
    expect(errors).toEqual([]);
    // Every public frame is checked, not only final DOM: closed cards are null; no server deck/credentials.
    const frames: any[] = await display.evaluate(() =>
      (window as any).__frames.filter((m: any) => m.type === "state"),
    );
    for (const { view } of frames) {
      expect(view.me).toBeUndefined();
      expect(view.deck).toBeUndefined();
      expect(JSON.stringify(view)).not.toContain('"token"');
      if (view.phase === "playing") {
        expect(view.result).toBeUndefined();
        for (const rack of Object.values(view.racks) as any[][])
          for (const c of rack) if (c) expect(c.revealed).toBe(true);
      }
    }
    await display.getByRole("button", { name: "เล่นอีกครั้ง" }).click();
    await Promise.all([display, d, h].map((p) => revision(p, v.revision + 1)));
    await expect(
      d.getByRole("button", { name: "จั่วการ์ด", exact: true }),
    ).toBeVisible();
    expect((await read(display)).hp).toBe(12);
    expect((await read(d)).me!.id).toBe(playerIds[0]);
    await expect(display.locator('.district [data-card="hidden"]')).toHaveCount(10);
    for (const phone of phones) {
      const fresh = await read(phone);
      expect(fresh.result).toBeUndefined();
      expect(fresh.discard).toEqual([]);
      expect(fresh.vampires).toEqual([0,0,0,0,0]);
      expect(fresh.me!.drawn).toBeUndefined();
      expect(fresh.me!.cards.every(c => !c.revealed)).toBeTruthy();
      await expect(phone.locator('.district [data-card="hidden"]')).toHaveCount(5);
      await expect(phone.locator('.round-outcome,.reveal-focus,.district-result')).toHaveCount(0);
      const side = fresh.players.find(p => p.id === fresh.me!.id)!.character;
      for(let slot=0;slot<5;slot++) await expect(phone.locator(`[data-district="${slot}"] [data-side="${side}"] .duel-value`)).toHaveText(String(fresh.me!.cards[slot].value));
    }
    await d.screenshot({path:"test-results/dracula-rematch-phone.png",fullPage:true});
    console.log(
      `Dracula complete: ${actions} actions, ${rounds + 1} rounds, winner ${v.winner}`,
    );
  } finally {
    for (const c of contexts) await c.close();
  }
});
