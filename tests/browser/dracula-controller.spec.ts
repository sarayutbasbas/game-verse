import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { startServer } from "../../src/server/index.js";
import { testAccount } from "./auth-fixture.js";
import * as duel from "../../src/games/dracula-vs-van-helsing/engine.js";
import type { DuelAction } from "../../src/games/dracula-vs-van-helsing/types.js";
const view = (p: Page) => p.evaluate(() => (window as any).__view);
test("compact controller: original factions, copy join URL, live trump, sticky discard, toast and complete rematch reset", async ({
  browser,
}) => {
  const app = await startServer(0, "127.0.0.1", true, () => 0.42, {
    storePath: ":memory:",
    legacyHarness: true,
  });
  const url = "http://127.0.0.1:" + (app.server.address() as any).port,
    contexts: BrowserContext[] = [];
  const make = async (mobile = false) => {
    const ctx = await browser.newContext({
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1366, height: 1024 },
    });
    contexts.push(ctx);
    const p = await ctx.newPage();
    await p.addInitScript(() => {
      const w = window as any;
      w.__copied = "";
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: async (text: string) => {
            w.__copied = text;
          },
        },
      });
      window.WebSocket = new Proxy(window.WebSocket, {
        construct(T, args) {
          const ws = new T(args[0], args[1]);
          w.__socket = ws;
          ws.addEventListener("message", (e) => {
            const m = JSON.parse(e.data);
            if (m.type === "state") {
              w.__view = m.view;
              w.__frame = e.data;
            }
          });
          return ws;
        },
      });
    });
    return p;
  };
  try {
    const display = await make();
    await display.goto(url + "/games/dracula-vs-van-helsing");
    await testAccount(display, app);
    await display.getByRole("button", { name: "สร้างห้องบนจอกลาง" }).click();
    await expect(display.locator(".room-code strong")).toBeVisible();
    const code = await display.locator(".room-code strong").innerText(),
      phones: Page[] = [];
    for (let i = 0; i < 2; i++) {
      const p = await make(true);
      phones.push(p);
      await p.goto(url + "/play/" + code);
      await p.getByRole("textbox", { name: "ชื่อของคุณ" }).fill("Player " + i);
      await p.getByRole("button", { name: "เข้าห้อง", exact: true }).click();
      const b = p.getByRole("button", {
        name: i ? "Van Helsing" : "Dracula",
        exact: true,
      });
      await expect(b.locator(".role-portrait")).toBeVisible();
      await b.click();
      await expect(b).toHaveAttribute("aria-pressed", "true");
      await expect(b).toContainText("ฝั่งของคุณ");
      if(i===0) await p.screenshot({path:"test-results/dracula-controller-lobby.png",fullPage:true});
      await p.getByRole("button", { name: "พร้อมเล่น", exact: true }).click();
    }
    const room = app.rooms.rooms.get(code)!;
    // Supply a profile image, then verify it cannot replace a game's faction art.
    room.players[0].avatar = "/art/dracula/card-back.webp";
    await display
      .getByRole("button", { name: "เริ่มเกม", exact: true })
      .click();
    const d = phones[0],
      h = phones[1],
      all = [display, d, h];
    await expect(d.locator("#draw")).toBeVisible();
    await expect(d.locator(".duel-person.is-you .role-dracula")).toBeVisible();
    await expect(d.locator(".duel-person .profile-avatar")).toHaveCount(0);
    await expect(d.locator(".duel-person.is-you .role-you")).toHaveText("คุณ");
    await expect(
      d.locator(".account-link > span:not(.profile-avatar)"),
    ).toHaveCount(0);
    await expect(d.locator(".brand")).toHaveText("GameVerse");
    await expect(d.locator(".connection")).toHaveText("ออนไลน์");
    const account = (await d.locator(".header-account").boundingBox())!,
      header = (await d.locator(".game-header").boundingBox())!;
    expect(header.height).toBeLessThan(85);
    expect(account.x + account.width).toBeGreaterThan(340);
    await d.locator(".room-code").click();
    expect(await d.evaluate(() => (window as any).__copied)).toBe(
      url + "/play/" + code,
    );
    await expect(d.locator(".game-toast")).toContainText(
      "คัดลอกลิงก์เข้าห้องแล้ว",
    );
    const ranking = async () => {
      const v = await view(d);
      await expect(d.locator(".controller-ranking .current-trump")).toHaveClass(
        new RegExp("suit-" + v.ranking[0]),
      );
    };
    await ranking();
    // Make a legal effect-7 turn without altering the conservation of all 32 cards.
    let s = room.duel!;
    const index = s.deck.findIndex((c) => c.value === 7);
    [s.deck[0], s.deck[index]] = [s.deck[index], s.deck[0]];
    const old = (await view(d)).revision;
    await d.locator("#draw").click();
    await expect(d.locator("#main")).toHaveAttribute(
      "data-revision",
      String(old + 1),
    );
    await expect(d.locator(".game-toast")).toContainText("ทำรายการแล้ว");
    await expect(d.locator("#notice")).toBeEmpty();
    await expect(d.locator(".discard-confirm-bar")).toBeHidden();
    await d.locator('[data-slot="-1"]').click();
    await expect(d.locator("#confirm-discard")).toBeVisible();
    const bar = (await d.locator(".discard-confirm-bar").boundingBox())!;
    expect(Math.abs(bar.x + bar.width / 2 - 195)).toBeLessThan(2);
    expect(bar.y + bar.height).toBeLessThanOrEqual(844);
    expect(bar.y).toBeGreaterThan(650);
    await d.locator('[data-slot="4"]').scrollIntoViewIfNeeded();
    await expect(d.locator("#confirm-discard")).toBeInViewport();
    await d.screenshot({path:"test-results/dracula-controller-discard-viewport.png"});
    await d.screenshot({
      path: "test-results/dracula-controller-discard.png",
      fullPage: true,
    });
    await d.locator("#confirm-discard").click();
    await expect(d.locator(".trump-choice")).toHaveCount(3);
    await expect(d.locator(".controller-ranking")).toBeInViewport();
    const choice = d.locator(".trump-choice").first();
    await choice.click();
    await expect(choice).toHaveAttribute("aria-pressed", "true");
    expect(await choice.evaluate(e => getComputedStyle(e).backgroundColor)).toBe("rgb(172, 53, 75)");
    expect(await choice.innerText()).toMatch(/^[◆☀♣✦]$/);
    expect(
      await choice.evaluate((e) => getComputedStyle(e).borderTopWidth),
    ).toBe("3px");
    await d.screenshot({
      path: "test-results/dracula-controller-trump.png",
      fullPage: true,
    });
    await d.locator("#confirm-effect").click();
    await expect
      .poll(async () => (await view(d)).turn)
      .not.toBe((await view(d)).me.id);
    await ranking();
    // Play rules in the isolated engine up to the final legal command, then let
    // the real server/transport resolve that command and the rematch.
    s = structuredClone(room.duel!);
    let final: DuelAction | undefined;
    for (let n = 0; n < 800 && !final; n++) {
      const legal = duel.getLegalActions(s, s.turn);
      const a = legal.find((a) => a.type === "end-round") ?? legal[0];
      const next = duel.applyAction(s, s.turn, a, () => 0.42);
      if (next.phase === "finished") final = a;
      else if (next.phase === "results") {
        s = next;
        for (const p of s.players)
          s = duel.applyAction(s, p.id, { type: "next-round" }, () => 0.42);
      } else s = next;
    }
    expect(final).toBeDefined();
    room.duel = s;
    room.revision++;
    app.rooms.syncRoom(code);
    for (const p of all)
      await expect(p.locator("#main")).toHaveAttribute(
        "data-revision",
        String(room.revision),
      );
    const actor = phones[s.players.findIndex((p) => p.id === s.turn)];
    await actor.evaluate((a) => {
      const w = window as any;
      w.__socket.send(
        JSON.stringify({
          type: "command",
          id: crypto.randomUUID(),
          revision: w.__view.revision,
          action: a,
        }),
      );
    }, final!);
    await expect.poll(async () => (await view(display)).phase).toBe("finished");
    for (const p of all)
      await p
        .getByRole("button", { name: "แสดงผลทั้งหมด", exact: true })
        .click();
    const finishedFrame = await display.evaluate(() => (window as any).__frame);
    await display
      .getByRole("button", { name: "เล่นอีกครั้ง", exact: true })
      .click();
    for (const p of all) {
      await expect.poll(async () => (await view(p)).phase).toBe("playing");
      await expect(p.locator(".board-health strong")).toHaveText("12/12");
      await expect(
        p.locator(".round-outcome,.reveal-focus,.district-result"),
      ).toHaveCount(0);
      expect((await view(p)).discard).toEqual([]);
      expect((await view(p)).vampires).toEqual([0, 0, 0, 0, 0]);
      expect((await view(p)).result).toBeUndefined();
    }
    await expect(display.locator('.district [data-card="hidden"]')).toHaveCount(
      10,
    );
    for (const p of phones) {
      const v = await view(p);
      expect(v.me.cards.every((c: any) => !c.revealed)).toBeTruthy();
      await expect(p.locator('.district [data-card="hidden"]')).toHaveCount(5);
      const side = v.players.find((x: any) => x.id === v.me.id).character;
      for (let i = 0; i < 5; i++)
        await expect(
          p.locator(`[data-district="${i}"] [data-side="${side}"] .duel-value`),
        ).toHaveText(String(v.me.cards[i].value));
    }
    await display.evaluate(
      (frame) =>
        (window as any).__socket.dispatchEvent(
          new MessageEvent("message", { data: frame }),
        ),
      finishedFrame,
    );
    await expect(display.locator('.district [data-card="hidden"]')).toHaveCount(
      10,
    );
    await d.reload();
    await expect(d.locator("#draw")).toBeVisible();
    await expect(d.locator('.district [data-card="hidden"]')).toHaveCount(5);
    await d.screenshot({
      path: "test-results/dracula-controller-rematch.png",
      fullPage: true,
    });
    for (const p of all)
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
