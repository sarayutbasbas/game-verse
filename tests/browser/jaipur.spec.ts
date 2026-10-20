import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import {testAccount,createDisplayRoom} from "./auth-fixture.js";
import type { JaipurView } from "../../src/games/jaipur/types.js";
const read = (p: Page): Promise<JaipurView> =>
  p.evaluate(() => (window as any).__view);
async function capture(p: Page) {
  await p.addInitScript(() => {
    (window as any).__frames = [];
    (window as any).__sockets = [];
    (window as any).__motions = 0;
    (window as any).__flights = 0;
    (window as any).__syncs = 0;
    (window as any).__sentActions = 0;
    (window as any).__leakedFlights = 0;
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (...args: Parameters<typeof animate>) {
      if (this.matches(".jp-market,.jp-prices,.jp-results,.jp-market-table"))
        (window as any).__motions++;
      if (this.matches(".jp-flight")) {
        (window as any).__flights++;
        const v = (window as any).__view;
        if (
          v?.me?.id !== v?.event?.actor &&
          Array.from(this.querySelectorAll("img")).some(
            (img) => !img.src.includes("/card-back.webp"),
          )
        )
          (window as any).__leakedFlights++;
      }
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
          if (JSON.parse(String(data)).type === "command")
            (window as any).__sentActions++;
          send(data);
        };
        ws.addEventListener("message", (e) => {
          const m = JSON.parse(e.data);
          (window as any).__frames.push(m);
          if (
            m.type === "state" &&
            m.view.revision === (window as any).__dropRevision
          ) {
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
test("Jaipur: complete match with display + two phones, previews, private bonus, resync and rematch", async ({
  browser,
}) => {
  test.setTimeout(240000);
  const contexts: BrowserContext[] = [],
    errors: string[] = [];
  let host: Page | undefined, code: string | undefined;
  const make = async (mobile = false, reduce = false) => {
    const c = await browser.newContext({
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1440, height: 1000 },
      isMobile: mobile,
      hasTouch: mobile,
      reducedMotion: reduce ? "reduce" : "no-preference",
    });
    contexts.push(c);
    const p = await c.newPage();
    await capture(p);
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    p.on("requestfailed", (r) => {
      if (r.failure()?.errorText !== "net::ERR_ABORTED")
        errors.push(r.failure()?.errorText ?? "request failed");
    });
    p.on("response", (r) => {
      if (new URL(r.url()).pathname.startsWith("/art/") && r.status() >= 400)
        errors.push("art " + r.status());
    });
    return p;
  };
  try {
    host = await make();
    await host.goto("/games/jaipur");
    await testAccount(host);
    await host.screenshot({
      path: "test-results/jaipur-cover.png",
      fullPage: true,
    });
    await createDisplayRoom(host);
    await expect(host.locator("#qr")).toBeVisible();
    code = await host.locator(".room-code strong").innerText();
    const phones: Page[] = [];
    for (let i = 0; i < 2; i++) {
      const p = await make(true, i === 1);
      phones.push(p);
      await p.goto("/play/" + code);
      await p
        .getByRole("textbox", { name: "ชื่อของคุณ" })
        .fill(i ? "พ่อค้าเครื่องเทศ" : "ร้านผ้าไหม");
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
    await expect(host.locator(".jp-market")).toBeVisible();
    // Shared header, compact bank, automatic market intent and stable live DOM.
    const first = phones[0];
    await expect(first.locator(".shared-turn")).toHaveCount(0);
    await expect(first.locator(`[data-trader="${ids[0]}"]`)).toHaveClass(
      /jp-current/,
    );
    await expect(first.locator("#content .room-code")).toHaveCount(0);
    await first.locator(".shared-room-menu summary").click();
    await expect(first.locator(".shared-room-menu canvas")).toBeVisible();
    await first.locator(".shared-room-menu summary").click();
    await expect(first.locator(".turn-sound-button svg")).toHaveCount(1);
    await expect(first.locator("#jp-sort-hand")).toHaveCount(0);
    await expect(first.locator(".jp-discard")).toHaveCount(0);
    const marketGoods = (await read(first)).market!.filter(
      (c) => c.kind !== "camel",
    );
    await first.evaluate(() => {
      (window as any).__marketNode = document.querySelector(".jp-market");
      (window as any).__handNode = document.querySelector(".jp-hand");
      (window as any).__turnAnnouncements = 0;
      new MutationObserver(() => {
        (window as any).__turnAnnouncements++;
      }).observe(document.querySelector("#turn-announcement")!, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    });
    if (marketGoods.length) {
      await first.locator(`[data-market="${marketGoods[0].id}"]`).click();
      await expect(first.locator('[data-mode="take"]')).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      if (marketGoods.length >= 2) {
        await first.locator(`[data-market="${marketGoods[1].id}"]`).click();
        await expect(first.locator('[data-mode="exchange"]')).toHaveAttribute(
          "aria-pressed",
          "true",
        );
        const plus = await first.locator("#jp-camel-plus").boundingBox();
        expect(plus!.width).toBe(44);
        expect(plus!.height).toBe(44);
        await first.locator(`[data-market="${marketGoods[1].id}"]`).click();
        await expect(first.locator('[data-mode="take"]')).toHaveAttribute(
          "aria-pressed",
          "true",
        );
      }
      await first.locator("#jp-clear").click();
    }
    expect(
      await first.evaluate(() => (window as any).__turnAnnouncements),
    ).toBe(0);
    for (const p of [host, first]) {
      const closeToast = p.getByRole("button", {
        name: "ปิดข้อความ",
        exact: true,
      });
      if (await closeToast.isVisible()) await closeToast.click();
    }
    for (const width of [320, 390]) {
      await first.setViewportSize({ width, height: 844 });
      const boxes = await first.locator(".jp-price").evaluateAll((nodes) =>
        nodes.map((n) => ({
          top: n.getBoundingClientRect().top,
          bottom: n.getBoundingClientRect().bottom,
        })),
      );
      expect(new Set(boxes.map((b) => b.top)).size).toBe(1);
      expect(
        await first.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
      await first.screenshot({
        path: `test-results/jaipur-ui-${width}.png`,
        fullPage: true,
      });
    }
    await host.screenshot({
      path: "test-results/jaipur-desktop.png",
      fullPage: true,
    });
    await host.setViewportSize({ width: 1024, height: 768 });
    await host.screenshot({
      path: "test-results/jaipur-ipad.png",
      fullPage: true,
    });
    expect(
      await host.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await host.setViewportSize({ width: 1440, height: 1000 });
    for (const [i, p] of phones.entries()) {
      await expect(p.locator(".jp-hand")).toBeVisible();
      await p.screenshot({
        path: `test-results/jaipur-phone-${i + 1}.png`,
        fullPage: true,
      });
    }
    let v = await read(host),
      moves = 0,
      exchangeDone = false,
      saleDone = false,
      reconnected = false,
      duplicateChecked = false;
    while (v.phase !== "finished" && moves < 240) {
      const phone = v.phase === "results" ? host : phones[ids.indexOf(v.turn!)];
      await revision(phone, v.revision);
      const pv = await read(phone);
      const next = v.revision + 1;
      const dropping = moves === 8;
      if (dropping)
        await host.evaluate((n) => ((window as any).__dropRevision = n), next);
      if (v.phase === "results") {
        // Each client owns its overlay; dismissing one never advances the room.
        for (const p of [host, ...phones])
          await expect(p.locator(".jp-result-dialog")).toBeVisible();
        const resultRevision = v.revision;
        if (v.round === 1) {
          await expect(host.locator(".jp-result-dialog")).toHaveAttribute(
            "data-stage",
            "0:goods",
          );
          await expect(host.locator('[data-count="1:goods"]')).toHaveText("—");
          await host.evaluate(() => {
            (window as any).__dialogNode =
              document.querySelector(".jp-result-dialog");
            const m = (window as any).__frames
              .filter((m: any) => m.type === "state")
              .at(-1);
            (window as any).__sockets
              .at(-1)
              .dispatchEvent(
                new MessageEvent("message", { data: JSON.stringify(m) }),
              );
          });
          expect(
            await host.evaluate(
              () =>
                (window as any).__dialogNode ===
                document.querySelector(".jp-result-dialog"),
            ),
          ).toBeTruthy();
          await host.evaluate(() => {
            const d = document.querySelector(".jp-result-dialog")!;
            const w = window as any;
            w.__resultStages = [d.getAttribute("data-stage")];
            new MutationObserver(() =>
              w.__resultStages.push(d.getAttribute("data-stage")),
            ).observe(d, { attributes: true, attributeFilter: ["data-stage"] });
          });
          await phones[0].evaluate(() =>
            (window as any).__sockets.at(-1).close(),
          );
          await expect(phones[0].locator(".jp-result-dialog")).toHaveAttribute(
            "data-stage",
            "final",
          );
          await phones[0].reload();
          await expect(phones[0].locator(".jp-result-dialog")).toHaveAttribute(
            "data-stage",
            "final",
          );
          await phones[0].screenshot({
            path: "test-results/jaipur-phone-result.png",
          });
          await expect(phones[1].locator(".jp-result-dialog")).toHaveAttribute(
            "data-stage",
            "final",
          );
        }
        if (v.round === 1) {
          await expect(host.locator(".jp-result-dialog")).toHaveAttribute(
            "data-stage",
            "final",
            { timeout: 12000 },
          );
          expect(
            await host.evaluate(() => (window as any).__resultStages),
          ).toEqual([
            "0:goods",
            "1:goods",
            "0:bonus",
            "1:bonus",
            "0:camel",
            "1:camel",
            "final",
          ]);
        } else if (await host.locator("#jp-count-skip").isVisible())
          await host.locator("#jp-count-skip").click();
        await expect(host.locator(".jp-result-dialog")).toHaveAttribute(
          "data-stage",
          "final",
        );
        await host.screenshot({ path: "test-results/jaipur-result-popup.png" });
        await host.locator("#jp-result-ok").click();
        expect((await read(host)).revision).toBe(resultRevision);
        await expect(phones[0].locator(".jp-result-dialog")).toBeVisible();
        await host.locator("#jp-reopen").click();
        await expect(host.locator(".jp-result-dialog")).toHaveAttribute(
          "data-stage",
          "final",
        );
        await host.locator("#jp-result-ok").click();
        await expect(host.locator(".jp-results table")).toBeVisible();
        for (const p of phones) {
          if (await p.locator("#jp-count-skip").isVisible())
            await p.locator("#jp-count-skip").click();
          await p.locator("#jp-result-ok").click();
        }
        await host.screenshot({
          path: `test-results/jaipur-round-${v.round}.png`,
          fullPage: true,
        });
        if (!v.result!.nextStarter)
          await host.locator("#jp-next-starter").selectOption(ids[0]);
        await host.locator("#jp-next").click();
      } else {
        const me = pv.me!;
        if (!reconnected && me.bonus.length) {
          const prior = structuredClone(me);
          await phone.reload();
          await expect(phone.locator(".jp-hand")).toBeVisible();
          const restored = (await read(phone)).me!;
          expect(restored.id).toBe(prior.id);
          expect(restored.hand).toEqual(prior.hand);
          expect(restored.herd).toEqual(prior.herd);
          expect(restored.bonus).toEqual(prior.bonus);
          expect(await phone.evaluate(() => (window as any).__motions)).toBe(0);
          reconnected = true;
        }
        const sentBefore = await phone.evaluate(
          () => (window as any).__sentActions,
        );
        const sale =
          me.sell
            .filter((o) => o.count >= 3)
            .sort(
              (a, b) => b.count - a.count || b.goodsTotal - a.goodsTotal,
            )[0] ??
          (me.hand.length >= 6
            ? [...me.sell].sort((a, b) => b.count - a.count)[0]
            : undefined);
        if (!exchangeDone && me.exchanges.length) {
          const [take, give, camels] = me.exchanges[0];
          await phone.locator('[data-mode="exchange"]').click();
          for (const [i, c] of v.market!.entries())
            if (take & (1 << i))
              await phone.locator(`[data-market="${c.id}"]`).click();
          await expect(phone.locator('[data-mode="exchange"]')).toHaveAttribute(
            "aria-pressed",
            "true",
          );
          const selected = v.market!.filter((_, i) => take & (1 << i));
          if (selected.length === 2) {
            await phone.locator(`[data-market="${selected[1].id}"]`).click();
            await expect(phone.locator('[data-mode="take"]')).toHaveAttribute(
              "aria-pressed",
              "true",
            );
            await phone.locator(`[data-market="${selected[1].id}"]`).click();
          }
          const stepper = await phone.locator("#jp-camel-plus").boundingBox();
          expect(stepper!.width).toBe(44);
          expect(stepper!.height).toBe(44);
          for (const [i, c] of me.hand.entries())
            if (give & (1 << i))
              await phone.locator(`[data-hand="${c.id}"]`).click();
          while (
            Number(await phone.locator(".jp-stepper b").first().innerText()) >
            camels
          )
            await phone.locator("#jp-camel-minus").click();
          while (
            Number(await phone.locator(".jp-stepper b").first().innerText()) <
            camels
          )
            await phone.locator("#jp-camel-plus").click();
          await expect(phone.locator("#jp-confirm")).toBeEnabled();
          expect((await read(phone)).revision).toBe(v.revision);
          await phone.screenshot({
            path: "test-results/jaipur-exchange-preview.png",
            fullPage: true,
          });
          exchangeDone = true;
        } else if (sale) {
          await phone.locator('[data-mode="sell"]').click();
          const cards = me.hand
            .filter((c) => c.kind === sale.good)
            .slice(0, sale.count);
          for (const c of cards)
            await phone.locator(`[data-hand="${c.id}"]`).click();
          await expect(phone.locator(".jp-preview")).toContainText(
            `${sale.goodsTotal} รูปี`,
          );
          if (!saleDone) {
            expect((await read(host!)).revision).toBe(v.revision);
            await phone.screenshot({
              path: "test-results/jaipur-sell-preview.png",
              fullPage: true,
            });
            saleDone = true;
          }
        } else {
          const goods = me.legal.filter((a) => a.type === "jaipur-take");
          let take = goods.sort(
            (a, b) =>
              me.hand.filter(
                (c) =>
                  c.kind ===
                  v.market!.find((c) => c.id === (b as any).cardId)!.kind,
              ).length -
              me.hand.filter(
                (c) =>
                  c.kind ===
                  v.market!.find((c) => c.id === (a as any).cardId)!.kind,
              ).length,
          )[0];
          if (moves === 0 && me.legal.some((a) => a.type === "jaipur-camels"))
            take = undefined as any;
          if (take?.type === "jaipur-take")
            await phone.locator(`[data-market="${take.cardId}"]`).click();
          else if (me.legal.some((a) => a.type === "jaipur-camels"))
            await phone
              .locator('[data-market][data-kind="camel"]')
              .first()
              .click();
          else {
            const s = me.sell[0];
            expect(s).toBeTruthy();
            await phone.locator('[data-mode="sell"]').click();
            for (const c of me.hand
              .filter((c) => c.kind === s.good)
              .slice(0, s.count))
              await phone.locator(`[data-hand="${c.id}"]`).click();
          }
        }
        await expect(phone.locator("#jp-confirm")).toBeEnabled();
        expect(await phone.evaluate(() => (window as any).__sentActions)).toBe(
          sentBefore,
        );
        if (moves === 0)
          await phone.evaluate(() => ((window as any).__dropAck = true));
        if (moves === 0)
          await phone.evaluate(() => {
            const table = document.querySelector(".jp-market")!;
            window.scrollTo({
              top: table.getBoundingClientRect().top + scrollY - 70,
              behavior: "instant",
            });
            (window as any).__scrollBefore = scrollY;
          });
        await phone.locator("#jp-confirm").click();
      }
      await Promise.all(
        [...(dropping ? [] : [host]), ...phones].map((p) => revision(p, next)),
      );
      if (moves === 0) {
        const stable = await phone.evaluate(() => ({
          market:
            (window as any).__marketNode ===
            document.querySelector(".jp-market"),
          hand:
            (window as any).__handNode === document.querySelector(".jp-hand"),
          scroll: Math.abs(scrollY - (window as any).__scrollBefore),
        }));
        expect(stable.market && stable.hand).toBeTruthy();
        expect(stable.scroll).toBeLessThan(3);
      }
      if (v.phase === "playing")
        for (const good of Object.keys(v.goods!) as (keyof NonNullable<
          JaipurView["goods"]
        >)[]) {
          if (!v.goods![good].length) {
            const pile = host.locator(`[data-inspect-good="${good}"]`);
            await expect(pile.locator("img")).toHaveCount(0);
            await expect(pile).toContainText("หมด");
          }
        }
      moves++;
      v = await read(dropping ? phone : host);
      await phone.waitForTimeout(300);
      if (moves === 6 && !duplicateChecked) {
        const before = await host.evaluate(() => (window as any).__motions);
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
          before,
        );
        duplicateChecked = true;
      }
    }
    expect(v.phase).toBe("finished");
    expect(exchangeDone && saleDone && reconnected).toBeTruthy();
    expect(v.players.find((p) => p.id === v.winners![0])!.seals).toBe(2);
    expect(
      await host.evaluate(() => (window as any).__flights),
    ).toBeGreaterThan(0);
    expect(await host.evaluate(() => (window as any).__syncs)).toBeGreaterThan(
      0,
    );
    expect(await phones[1].evaluate(() => (window as any).__motions)).toBe(0);
    await host.screenshot({
      path: "test-results/jaipur-match.png",
      fullPage: true,
    });
    for (const p of phones) {
      expect((await read(p)).result).toEqual(v.result);
      expect(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
    }
    for (const p of [host, ...phones]) {
      expect(await p.evaluate(() => (window as any).__leakedFlights)).toBe(0);
      const frames = await p.evaluate(() =>
        (window as any).__frames.filter((m: any) => m.type === "state"),
      );
      for (const { view } of frames) {
        expect(view.deck).toBeUndefined();
        for (const t of view.players) {
          expect(
            Number.isInteger(t.herdCount) &&
              t.herdCount >= 0 &&
              t.herdCount <= 11,
          ).toBeTruthy();
          for (const field of [
            "hand",
            "herd",
            "subtotal",
            "score",
            "goods",
            "bonus",
          ])
            expect(t[field]).toBeUndefined();
        }
        if (view.phase === "playing") expect(view.result).toBeUndefined();
        expect(view.bonus).toBeUndefined();
      }
      expect(
        await p
          .locator(".jp-root img")
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
    for (const p of [host, ...phones]) {
      await expect(p.locator(".jp-result-dialog")).toBeVisible();
      if (await p.locator("#jp-count-skip").isVisible())
        await p.locator("#jp-count-skip").click();
      await p.locator("#jp-result-ok").click();
    }
    await host.locator("#jp-restart").click();
    await expect(host.locator(".jp-results")).toHaveCount(0);
    await expect(phones[0].locator(".jp-hand")).toBeVisible();
    const fresh = await read(host);
    expect(fresh.matchId).not.toBe(v.matchId);
    for (const p of [host, ...phones])
      await expect(p.locator(".jp-result-dialog")).toHaveCount(0);
    expect(fresh.round).toBe(1);
    expect(fresh.history).toEqual([]);
    expect(fresh.sequence).toBe(0);
    expect(fresh.deckCount).toBe(40);
    expect(
      fresh.players.every(
        (p) => p.seals === 0 && p.goodsCount === 0 && p.bonusCount === 0,
      ),
    ).toBeTruthy();
    expect(errors).toEqual([]);
    console.log(
      "Jaipur completed",
      moves,
      "accepted actions;",
      v.round,
      "rounds",
    );
  } finally {
    if (host && code)
      await host.request.post("/api/rooms/leave", {
        headers: { Origin: new URL(host.url()).origin },
        data: { code, close: true },
      });
    for (const c of contexts) await c.close();
  }
});

test("Jaipur compact table: open eleven-camel herd, full display bank and adjustable default camel exchange", async ({
  browser,
}) => {
  const { startServer } = await import("../../src/server/index.js");
  const { validateJaipurState } =
    await import("../../src/games/jaipur/validation.js");
  const app = await startServer(0, "127.0.0.1", true, () => 0.42, {
    storePath: ":memory:",
    legacyHarness: true,
  });
  const url = "http://127.0.0.1:" + (app.server.address() as any).port;
  const contexts: BrowserContext[] = [];
  const make = async (mobile = false) => {
    const c = await browser.newContext({
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1024, height: 768 },
    });
    contexts.push(c);
    const p = await c.newPage();
    await capture(p);
    return p;
  };
  try {
    const host = await make();
    await host.goto(url + "/games/jaipur");
    await testAccount(host, app);
    await createDisplayRoom(host);
    const code = await host.locator(".room-code strong").innerText();
    const phones: Page[] = [];
    for (const name of ["ร้านผ้า", "ร้านเครื่องเทศ"]) {
      const p = await make(true);
      phones.push(p);
      await p.goto(url + "/play/" + code);
      await p.getByRole("textbox", { name: "ชื่อของคุณ" }).fill(name);
      await p.getByRole("button", { name: "เข้าห้อง", exact: true }).click();
      await p.getByRole("button", { name: "พร้อมเล่น", exact: true }).click();
    }
    const own = (await read(phones[0])).me!.id;
    await host.locator("#starter").selectOption(own);
    await host.getByRole("button", { name: "เริ่มเกม", exact: true }).click();
    await expect(host.locator(".jp-market")).toBeVisible();
    // Internal test fixture preserves all 55 physical cards; no debug endpoint.
    const room = app.rooms.rooms.get(code)!,
      s = room.jaipur!;
    const camels = [
      ...s.deck,
      ...s.market,
      ...s.players.flatMap((p) => [...p.hand, ...p.herd]),
    ].filter((c) => c.kind === "camel");
    s.deck = s.deck.filter((c) => c.kind !== "camel");
    s.market = s.market.filter((c) => c.kind !== "camel");
    for (const p of s.players) {
      p.hand = p.hand.filter((c) => c.kind !== "camel");
      p.herd = p.id === own ? camels : [];
    }
    s.market.push(...s.deck.splice(0, 5 - s.market.length));
    expect(validateJaipurState(s)).toBeTruthy();
    room.revision++;
    (app.rooms as any).broadcast(room, true);
    for (const p of [host, ...phones]) await revision(p, room.revision);
    for (const p of [host, ...phones]) {
      expect((await read(p)).players.find((p) => p.id === own)!.herdCount).toBe(
        11,
      );
      const herd = p.locator(`[data-herd-player="${own}"]`);
      await expect(herd.locator(".jp-card")).toHaveCount(11);
      await expect(herd.locator(".jp-herd-overflow")).toHaveCount(0);
      expect((await herd.locator(".jp-herd-stack").boundingBox())!.height).toBe(
        44,
      );
      await expect(p.locator(".shared-turn")).toHaveCount(0);
      await expect(p.locator(`[data-trader="${own}"]`)).toHaveClass(
        /jp-current/,
      );
    }
    await expect(phones[0].locator(".jp-root")).not.toHaveClass(/jp-waiting/);
    await expect(phones[1].locator(".jp-root")).toHaveClass(/jp-waiting/);
    await expect
      .poll(() =>
        phones[1]
          .locator(".jp-market .jp-card")
          .first()
          .evaluate((n) => Number(getComputedStyle(n).opacity)),
      )
      .toBe(0.55);
    expect(
      await phones[0]
        .locator(".jp-hand .jp-card")
        .first()
        .evaluate((n) => getComputedStyle(n).opacity),
    ).toBe("1");
    expect(
      await host
        .locator(".jp-market .jp-card")
        .first()
        .evaluate((n) => getComputedStyle(n).opacity),
    ).toBe("1");
    const display = await read(host);
    for (const [kind, tokens] of Object.entries(display.goods!)) {
      const pile = host.locator(`[data-inspect-good="${kind}"]`);
      await expect(pile.locator(".jp-token")).toHaveCount(tokens.length);
      expect(await pile.locator(".jp-token b").allTextContents()).toEqual(
        tokens.map((t) => String(t.value)),
      );
      expect(
        new Set(
          await pile
            .locator(".jp-token")
            .evaluateAll((ns) => ns.map((n) => n.getBoundingClientRect().top)),
        ).size,
      ).toBe(1);
    }
    const grid = await host
      .locator(".jp-price")
      .evaluateAll((ns) => ns.map((n) => n.getBoundingClientRect().top));
    expect(new Set(grid.slice(0, 3)).size).toBe(1);
    expect(grid[3]).toBeGreaterThan(grid[0]);
    const p = phones[0];
    for (const width of [320, 390]) {
      await p.setViewportSize({ width, height: 844 });
      await expect(p.locator(".jp-deck")).toBeHidden();
      await expect(p.locator(".jp-market button")).toHaveCount(5);
      for (const foot of await p.locator(".jp-market .jp-card-foot").all())
        await expect(foot).toBeHidden();
      expect(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
      const halves = await p.locator(".jp-seat-strip").evaluateAll((rows) =>
        rows.map((row) => {
          const profile = row.querySelector("[data-trader]")!.getBoundingClientRect();
          const herd = row.querySelector("[data-herd-player]")!.getBoundingClientRect();
          const stack = row.querySelector(".jp-herd-stack")!.getBoundingClientRect();
          return {
            equal: Math.abs(profile.width - herd.width) < 1,
            contained: stack.left >= herd.left - 0.5 && stack.right <= herd.right + 0.5,
          };
        }),
      );
      expect(halves.every((h) => h.equal && h.contained)).toBeTruthy();
      const profiles = await p
        .locator(".jp-public-player")
        .evaluateAll((nodes) =>
          nodes.map((n) => {
            const stats = n.querySelector(".jp-seat-stats")!,
              name = n.querySelector(".jp-player-name")!;
            const rect = stats.getBoundingClientRect(),
              header = name.getBoundingClientRect();
            const cells = Array.from(stats.children).map((c) =>
              c.getBoundingClientRect(),
            );
            const metrics = Array.from(stats.querySelectorAll("b")).map((c) =>
              c.getBoundingClientRect(),
            );
            return {
              separate: rect.top >= header.bottom,
              singleRow: cells.every((c) => Math.abs(c.top - cells[0].top) < 1) && rect.height <= 44,
              inside:
                cells.every(
                  (c) =>
                    c.left >= rect.left - 0.5 && c.right <= rect.right + 0.5,
                ) &&
                metrics.every(
                  (m, i) =>
                    m.left >= cells[i].left - 0.5 &&
                    m.right <= cells[i].right + 0.5,
                ),
              overlap: cells.some((a, i) =>
                cells.some(
                  (b, j) =>
                    i !== j &&
                    Math.min(a.right, b.right) >
                      Math.max(a.left, b.left) + 0.5 &&
                    Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top) + 0.5,
                ),
              ),
            };
          }),
        );
      expect(
        profiles.every((p) => p.separate && p.singleRow && p.inside && !p.overlap),
      ).toBeTruthy();
      await p.screenshot({
        path: `test-results/jaipur-v2-${width}.png`,
        fullPage: true,
      });
    }
    await expect(p.locator(".jp-players")).toHaveCount(0);
    const ownBox = await p
      .locator(".jp-seat-bottom [data-trader]")
      .boundingBox();
    const ownHerd = await p
      .locator(".jp-seat-bottom [data-herd-player]")
      .boundingBox();
    const otherBox = await p
      .locator(".jp-seat-top [data-trader]")
      .boundingBox();
    const otherHerd = await p
      .locator(".jp-seat-top [data-herd-player]")
      .boundingBox();
    expect(
      (await p
        .locator(".jp-seat-bottom .jp-player-name .profile-avatar")
        .boundingBox())!.height,
    ).toBeGreaterThan(
      (await p
        .locator(".jp-seat-top .jp-player-name .profile-avatar")
        .boundingBox())!.height,
    );
    expect(ownHerd!.x).toBeLessThan(ownBox!.x);
    expect(otherBox!.x).toBeLessThan(otherHerd!.x);
    const radii = await p.locator(".jp-market-table").evaluate((n) => {
      const c = getComputedStyle(n);
      return [
        c.borderTopLeftRadius,
        c.borderTopRightRadius,
        c.borderBottomRightRadius,
        c.borderBottomLeftRadius,
      ];
    });
    expect(new Set(radii).size).toBe(1);
    const pileOrder = await p
      .locator(".jp-price")
      .first()
      .evaluate((n) => {
        const count = n.querySelector(".jp-remaining")!,
          minimum = n.querySelector(".jp-minimum")!,
          coin = n.querySelector(".jp-token")!;
        return {
          count: count.getBoundingClientRect().top,
          coin: coin.getBoundingClientRect().top,
          minimum: minimum.getBoundingClientRect().top,
          small: Number.parseFloat(getComputedStyle(minimum).fontSize),
          normal: Number.parseFloat(getComputedStyle(count).fontSize),
          divider: Number.parseFloat(getComputedStyle(n).borderBottomWidth),
        };
      });
    expect(pileOrder.count).toBeLessThan(pileOrder.coin);
    expect(pileOrder.minimum).toBeGreaterThan(pileOrder.coin);
    expect(pileOrder.small).toBeLessThan(pileOrder.normal);
    expect(pileOrder.divider).toBe(8);
    await host.screenshot({
      path: "test-results/jaipur-v2-display.png",
      fullPage: true,
    });
    const market = (await read(p)).market!;
    const before = (await read(p)).revision;
    await p.locator(`[data-market="${market[0].id}"]`).click();
    await p.locator(`[data-market="${market[1].id}"]`).click();
    await expect(p.locator('[data-mode="exchange"]')).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(p.locator(".jp-stepper b").first()).toHaveText("2");
    await expect(p.locator("#jp-confirm")).toBeEnabled();
    expect((await read(p)).revision).toBe(before);
    await p.locator("#jp-camel-minus").click();
    await expect(p.locator(".jp-stepper b").first()).toHaveText("1");
    await expect(p.locator("#jp-confirm")).toBeDisabled();
    await p.locator("#jp-camel-plus").click();
    await expect(p.locator("#jp-clear")).toHaveText("ยกเลิก");
    await p.locator("#jp-confirm").click();
    for (const peer of [host, ...phones]) await revision(peer, before + 1);
    expect(
      (await read(host)).players.find((p) => p.id === own)!.herdCount,
    ).toBe(9);
    await p.reload();
    await expect(p.locator(".jp-own-herd .jp-herd-stack .jp-card")).toHaveCount(
      9,
    );
    await expect(p.locator(".jp-own-herd .jp-herd-overflow")).toHaveCount(0);
    await expect(p.locator(".jp-root")).toHaveClass(/jp-waiting/);
    await expect
      .poll(() =>
        p
          .locator(".jp-hand .jp-card")
          .first()
          .evaluate((n) => Number(getComputedStyle(n).opacity)),
      )
      .toBe(0.55);
    await expect(phones[1].locator(".jp-root")).not.toHaveClass(/jp-waiting/);
    const turn = (await read(host)).turn!;
    for (const peer of [host, ...phones])
      await expect(peer.locator(`[data-trader="${turn}"]`)).toHaveClass(
        /jp-current/,
      );
    // Finish using the actual engine, then give both seats the same visible name.
    const rules = await import("../../src/games/jaipur/engine.js");
    let end = room.jaipur!,
      moves = 0;
    while (end.phase !== "finished" && moves++ < 1200) {
      const actor = end.players[end.turn].id;
      if (end.phase === "results")
        end = rules.applyAction(
          end,
          actor,
          {
            type: "jaipur-next",
            ...(!end.history.at(-1)!.nextStarter
              ? { startingPlayerId: own }
              : {}),
          },
          () => 0.42,
        );
      else {
        const legal = rules.getLegalActions(end, actor);
        const action =
          legal.find((a) => a.type === "jaipur-sell") ??
          legal.find((a) => a.type === "jaipur-camels") ??
          legal.find((a) => a.type === "jaipur-take");
        expect(action).toBeTruthy();
        end = rules.applyAction(end, actor, action!, () => 0.42);
      }
    }
    expect(end.phase).toBe("finished");
    expect(validateJaipurState(end)).toBeTruthy();
    for (const player of room.players) player.name = "Bas";
    for (const player of end.players) player.name = "Bas";
    room.jaipur = end;
    room.revision++;
    (app.rooms as any).broadcast(room, true);
    for (const peer of [host, ...phones]) {
      await revision(peer, room.revision);
      const winner = end.winners[0],
        loser = end.players.find((p) => p.id !== winner)!.id;
      const dialog = peer.locator(".jp-result-dialog");
      await expect(dialog).toHaveAttribute("data-stage", "final");
      await expect(
        dialog.locator(`[data-result-player="${winner}"]`),
      ).toHaveClass("jp-winner");
      await expect(
        dialog.locator(`[data-result-player="${winner}"] .jp-crown`),
      ).toBeVisible();
      await expect(
        dialog.locator(`[data-result-player="${loser}"] .jp-crown`),
      ).toHaveCount(0);
      await expect(
        dialog.locator(`[data-result-player="${winner}"] small`),
      ).toContainText("ผู้เล่น");
      await peer.screenshot({
        path: `test-results/jaipur-v3-winner-${peer === host ? "display" : (await read(peer)).me!.id === winner ? "own" : "other"}.png`,
      });
      await peer.locator("#jp-result-ok").click();
      await expect(
        peer.locator(`.jp-results [data-result-row="${winner}"]`),
      ).toHaveClass("jp-winner");
      await expect(
        peer.locator(`.jp-results [data-result-row="${winner}"] .jp-crown`),
      ).toBeVisible();
    }
  } finally {
    for (const c of contexts) await c.close();
    await app.close();
  }
});
