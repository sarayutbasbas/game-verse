import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { startServer } from "../../src/server/index.js";
import { testAccount } from "./auth-fixture.js";
async function instrument(page: Page) {
  await page.addInitScript(() => {
    const w = window as any;
    w.__tones = 0;
    const original = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () {
      const node = original.call(this),
        start = node.start.bind(node);
      node.start = (...a: any[]) => {
        w.__tones++;
        return start(...(a as [number]));
      };
      return node;
    };
    window.WebSocket = new Proxy(window.WebSocket, {
      construct(T, args) {
        const ws = new T(args[0], args[1]);
        w.__socket = ws;
        ws.addEventListener("message", (event) => {
          const m = JSON.parse(event.data);
          if (m.type === "state") {
            w.__view = m.view;
            w.__state = event.data;
          }
        });
        return ws;
      },
    });
  });
}
const view = (p: Page) => p.evaluate(() => (window as any).__view);
async function command(p: Page, action: any) {
  const revision = (await view(p)).revision;
  await p.evaluate((a) => {
    const w = window as any;
    w.__socket.send(
      JSON.stringify({
        type: "command",
        id: crypto.randomUUID(),
        revision: w.__view.revision,
        action: a,
      }),
    );
  }, action);
  await expect(p.locator("#main")).toHaveAttribute(
    "data-revision",
    String(revision + 1),
  );
}
test("all games notify only at turn boundary, mute persists, and TV fallback retains cards and privacy", async ({
  browser,
}) => {
  const app = await startServer(0, "127.0.0.1", true, () => 0.42, {
      storePath: ":memory:",
      legacyHarness: true,
    }),
    url = "http://127.0.0.1:" + (app.server.address() as any).port,
    contexts: BrowserContext[] = [];
  const make = async (tv = false) => {
    const ctx = await browser.newContext({
      viewport: tv
        ? { width: 1920, height: 1080 }
        : { width: 390, height: 844 },
    });
    contexts.push(ctx);
    if (tv)
      await ctx.route("**/*.css", async (route) => {
        const r = await route.fetch();
        const text = (await r.text())
          .replace(/(?<=[{;])\s*(?:aspect-ratio|container-type|inset)\s*:[^;}]+;?/g, "")
          .replace(/[^{};]+:[^{};]*cqw[^{};]*;?/g, "");
        await route.fulfill({ response: r, body: text });
      });
    const p = await ctx.newPage();
    await instrument(p);
    return p;
  };
  try {
    for (const game of ["camel-up", "dracula-vs-van-helsing", "azul"]) {
      const display = await make(game === "dracula-vs-van-helsing");
      await display.goto(url + "/games/" + game);
      await testAccount(display, app);
      await display.getByRole("button", { name: "สร้างห้องบนจอกลาง" }).click();
      await expect(display.locator(".room-code strong")).toBeVisible();
      const code = await display.locator(".room-code strong").innerText(),
        phones: Page[] = [];
      for (let i = 0; i < (game === "camel-up" ? 3 : 2); i++) {
        const p = await make();
        phones.push(p);
        await p.goto(url + "/play/" + code);
        await p.getByRole("textbox", { name: "ชื่อของคุณ" }).fill("Phone " + i);
        await p.getByRole("button", { name: "เข้าห้อง", exact: true }).click();
        if (game === "dracula-vs-van-helsing")
          await p
            .getByRole("button", {
              name: i ? "Van Helsing" : "Dracula",
              exact: true,
            })
            .click();
        if (game !== "camel-up")
          await p
            .getByRole("button", { name: "พร้อมเล่น", exact: true })
            .click();
      }
      await display
        .getByRole("button", { name: "เริ่มเกม", exact: true })
        .click();
      await expect(display.locator(".turn-sound-button")).toHaveAttribute(
        "aria-label",
        "เสียงเอฟเฟกต์: เปิด",
      );
      await expect
        .poll(async () => (await view(display))?.phase)
        .toBe("playing");
      let v = await view(display);
      const room = app.rooms.rooms.get(code)!;
      if (game === "dracula-vs-van-helsing") {
        await expect(display.locator(".duel-table")).toHaveAttribute("data-motion-state","idle");
        for (const el of await display
          .locator(".district-side .duel-card")
          .all()) {
          const b = await el.boundingBox();
          expect(b!.height).toBeGreaterThan(100);
          expect(b!.width).toBeGreaterThan(60);
        }
        await expect(
          display.locator('.district [data-card="hidden"]'),
        ).toHaveCount(10);
        room.duel!.players[0].cards[0].revealed = true;
        room.revision++;
        app.rooms.syncRoom(code);
        await expect(
          display.locator('.district [data-card="revealed"]'),
        ).toHaveCount(1);
        const portrait = display.locator(
          '.district [data-card="revealed"] .duel-portrait',
        );
        expect((await portrait.boundingBox())!.height).toBeGreaterThan(80);
        expect((await portrait.boundingBox())!.width).toBeGreaterThan(60);
        await display.screenshot({
          path: "test-results/dracula-tv-css-fallback.png",
          fullPage: true,
        });
      }
      const turn = async () => {
        v = await view(display);
        for (const phone of phones)
          await expect(phone.locator("#main")).toHaveAttribute(
            "data-revision",
            String(v.revision),
          );
        const p =
          phones[
            (await Promise.all(phones.map(view))).findIndex(
              (x) => x.me.id === v.turn,
            )
          ];
        if (game === "dracula-vs-van-helsing") {
          const deck = room.duel!.deck,
            index = deck.findIndex((c) => c.value === 7);
          expect(index).toBeGreaterThanOrEqual(0);
          [deck[0], deck[index]] = [deck[index], deck[0]];
          await command(p, { type: "draw" });
          const partial = (await view(p)).revision;
          await expect(display.locator("#main")).toHaveAttribute(
            "data-revision",
            String(partial),
          );
          await command(p, { type: "discard", slot: -1 });
          await command(
            p,
            (await view(p)).me.legal.find((a: any) => a.type === "effect"),
          );
        } else
          await command(
            p,
            game === "camel-up"
              ? { type: "roll" }
              : (await view(p)).me.legal.find((a: any) => a.type === "draft"),
          );
        await expect(display.locator("#main")).toHaveAttribute(
          "data-revision",
          String((await view(p)).revision),
        );
      };
      const increment=game==="dracula-vs-van-helsing"?4:2;
      const initial = await display.evaluate(() => (window as any).__tones);
      await turn();
      await expect
        .poll(() => display.evaluate(() => (window as any).__tones))
        .toBe(initial + increment);
      await display.evaluate(() => {
        const w = window as any;
        w.__socket.dispatchEvent(
          new MessageEvent("message", { data: w.__state }),
        );
        w.__socket.send(JSON.stringify({ type: "sync" }));
      });
      await expect(display.locator(".turn-sound-button")).toHaveAttribute(
        "aria-label",
        "เสียงเอฟเฟกต์: เปิด",
      );
      expect(await display.evaluate(() => (window as any).__tones)).toBe(
        initial + increment,
      );
      if(!await display.locator(".audio-settings").evaluate(n=>(n as HTMLDetailsElement).open))await display.locator(".audio-settings summary").click();
      await display.locator(".turn-sound-button").click();
      await expect(display.locator(".turn-sound-button")).toHaveAttribute(
        "aria-label",
        "เสียงเอฟเฟกต์: ปิด",
      );
      await turn();
      expect(await display.evaluate(() => (window as any).__tones)).toBe(
        initial + increment,
      );
      await display.reload();
      await expect(display.locator(".turn-sound-button")).toHaveAttribute(
        "aria-label",
        "เสียงเอฟเฟกต์: ปิด",
      );
      expect(await display.evaluate(() => (window as any).__tones)).toBe(0);
      if(!await display.locator(".audio-settings").evaluate(n=>(n as HTMLDetailsElement).open))await display.locator(".audio-settings summary").click();
      await display.locator(".turn-sound-button").click();
      await expect(display.locator(".turn-sound-button")).toHaveAttribute(
        "aria-label",
        "เสียงเอฟเฟกต์: เปิด",
      );
      expect(await display.evaluate(() => (window as any).__tones)).toBe(2);
      if(game==="dracula-vs-van-helsing") {
        await display.locator('.music-sound-button').click();
        await expect(display.locator('.audio-settings')).toHaveAttribute('data-music-playing','true');
        await display.locator('.turn-sound-button').click();
        await expect(display.locator('.turn-sound-button')).toHaveAttribute('aria-pressed','false');
        await expect(display.locator('.music-sound-button')).toHaveAttribute('aria-pressed','true');
        const fx=await display.locator('.audio-settings').getAttribute('data-fx-count');
        await turn();
        expect(await display.locator('.audio-settings').getAttribute('data-fx-count')).toBe(fx);
        await expect(display.locator('.audio-settings')).toHaveAttribute('data-music-playing','true');
        await display.reload();
        await expect(display.locator('.turn-sound-button')).toHaveText('เสียงเอฟเฟกต์: ปิด');
        await expect(display.locator('.music-sound-button')).toHaveText('เสียงพื้นหลัง: เปิด');
        await display.locator('.audio-settings summary').click();
        await expect(display.locator('.audio-settings')).toHaveAttribute('data-music-playing','true');
        await display.locator('.music-sound-button').click();
        await expect(display.locator('.audio-settings')).toHaveAttribute('data-music-playing','false');
        await expect(display.locator('.turn-sound-button')).toHaveAttribute('aria-pressed','false');
        await display.screenshot({path:'test-results/dracula-audio-settings.png'});
      }
      for (const p of [display, ...phones]) {
        expect(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBeTruthy();
        await p.context().close();
      }
    }
  } finally {
    for (const c of contexts) await c.close();
    await app.close();
  }
});
