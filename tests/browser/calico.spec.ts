import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { testAccount } from "./auth-fixture.js";
import type { CalicoView } from "../../src/games/calico/types.js";
const read = (p: Page): Promise<CalicoView> =>
  p.evaluate(() => (window as any).__view);
async function capture(p: Page) {
  await p.addInitScript(() => {
    (window as any).__frames = [];
    (window as any).__sockets = [];
    (window as any).__calicoAnimations = 0;
    (window as any).__calicoAnimActors = [];
    (window as any).__wrongAwardMotion = 0;
    const nativeAnimate = Element.prototype.animate;
    Element.prototype.animate = function (
      ...args: Parameters<typeof nativeAnimate>
    ) {
      if (
        this.matches(
          ".patch-cell,.market-tray,.award-cat,.award-button,.calico-finish",
        )
      )
        (window as any).__calicoAnimations++;
      if (this.matches(".patch-cell"))
        (window as any).__calicoAnimActors.push({
          actor: (this.closest("[data-quilter]") as HTMLElement)?.dataset
            .quilter,
          expected: (window as any).__view?.event?.actor,
        });
      if(this.matches(".award-cat,.award-button")){const at=(this.closest("[data-award-at]") as HTMLElement)?.dataset.awardAt;const kind=this.matches(".award-cat")?"cat":"button";if(!(window as any).__view?.event?.awards?.some((a:any)=>a.at===at&&a.kind===kind))(window as any).__wrongAwardMotion++;}
      return nativeAnimate.apply(this, args);
    };
    window.WebSocket = new Proxy(window.WebSocket, {
      construct(T, args) {
        const ws = new T(args[0], args[1]);
        (window as any).__sockets.push(ws);
        ws.addEventListener("message", (e) => {
          const m = JSON.parse(e.data);
          (window as any).__frames.push(m);
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
for (const preset of ["standard", "first"] as const)
  test(`Calico ${preset}: shared table + two phones, complete game, goals, market reconnect and rematch`, async ({
    browser,
  }) => {
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
        reducedMotion: preset === "first" ? "reduce" : "no-preference",
      });
      contexts.push(c);
      const p = await c.newPage();
      await capture(p);
      p.on("pageerror", (e) => errors.push(e.message));
      p.on("response", (r) => {
        if (new URL(r.url()).pathname.startsWith("/art/") && r.status() >= 400)
          errors.push("Artwork HTTP " + r.status());
      });
      return p;
    };
    try {
      host = await make();
      await host.goto("/");
      await expect(
        host.getByRole("link", { name: /เลือกเล่น Calico/ }),
      ).toBeVisible();
      await host.screenshot({
        path: `test-results/calico-${preset}-portal.png`,
        fullPage: true,
      });
      await host.goto("/games/calico");
      await testAccount(host);
      await host.getByRole("button", { name: "สร้างห้องบนจอกลาง" }).click();
      await expect(host.locator("#qr")).toBeVisible();
      code = await host.locator(".room-code strong").innerText();
      if (preset === "first") {
        const rev = (await read(host)).revision;
        await host.getByLabel("การจัดเกม").selectOption("first");
        await revision(host, rev + 1);
      }
      const phones: Page[] = [];
      for (let i = 0; i < 2; i++) {
        const p = await make(true);
        phones.push(p);
        await p.goto("/play/" + code);
        await p
          .getByRole("textbox", { name: "ชื่อของคุณ" })
          .fill(i ? "ผ้าห่มของดาว" : "ผ้าห่มของฝน");
        await p.getByRole("button", { name: "เข้าห้อง", exact: true }).click();
        await p.getByRole("button", { name: "พร้อมเล่น", exact: true }).click();
      }
      await expect(
        host.getByRole("button", { name: "เริ่มเกม", exact: true }),
      ).toBeEnabled();
      await host
        .locator("#starter")
        .selectOption((await read(phones[0])).me!.id);
      await host.getByRole("button", { name: "เริ่มเกม", exact: true }).click();
      const third = await make(true);
      await third.goto("/play/" + code);
      await third.getByRole("textbox", { name: "ชื่อของคุณ" }).fill("คนที่สาม");
      await third
        .getByRole("button", { name: "เข้าห้อง", exact: true })
        .click();
      await expect(third.locator("#notice")).toContainText("เริ่มแล้ว");
      if (preset === "standard") {
        for (const p of phones) {
          await expect(p.locator("[data-goal]")).toHaveCount(4);
          const options = (await read(p)).me!.options;
          for (const id of options.slice(0, 2)) {
            const rev = (await read(p)).revision;
            await p.locator(`[data-goal="${id}"]`).click();
            await revision(p, rev + 1);
          }
          await p.reload();
          await expect(p.locator("[data-goal]")).toHaveCount(4);
          expect((await read(p)).me!.options).toEqual(options);
          expect((await read(p)).me!.draft).toEqual(options.slice(0, 2));
          const rev = (await read(p)).revision;
          await p.locator(`[data-goal="${options[2]}"]`).click();
          await revision(p, rev + 1);
          await p.screenshot({
            path: "test-results/calico-goal-setup.png",
            fullPage: true,
          });
          await p
            .getByRole("button", { name: "ยืนยันเป้าหมาย", exact: true })
            .click();
          await expect(p.locator(".goal-setup")).toHaveCount(0);
        }
      }
      await expect(host.locator(".quilt-player")).toHaveCount(2);
      await expect(phones[0].locator("[data-hand]")).toHaveCount(2);
      await host.screenshot({
        path: `test-results/calico-${preset}-desktop.png`,
        fullPage: true,
      });
      await host.setViewportSize({ width: 1024, height: 768 });
      await host.screenshot({
        path: `test-results/calico-${preset}-ipad.png`,
        fullPage: true,
      });
      expect(
        await host.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
      // Both boards are on the display; all hand tiles are public by the user's ruling.
      expect(
        (await read(host)).players.every((p) => p.hand.length === 2),
      ).toBeTruthy();
      await expect(host.locator(".public-hand .fabric")).toHaveCount(4);
      const ids = await Promise.all(
        phones.map(async (p) => (await read(p)).me!.id),
      );
      let v = await read(host),
        moves = 0,
        reconnected = false;
      while (v.phase !== "finished" && moves < 90) {
        const phone = phones[ids.indexOf(v.turn!)];
        await revision(phone, v.revision);
        const next = v.revision + 1;
        if (v.step === "place") {
          await phone.locator("[data-hand]").first().click();
          await phone
            .locator(".quilt-player")
            .first()
            .locator("[data-hex]:not([disabled])")
            .first()
            .click();
          if (moves === 0) {
            await phone.screenshot({
              path: `test-results/calico-${preset}-preview.png`,
              fullPage: true,
            });
            expect((await read(phone)).revision).toBe(v.revision);
            await phone.evaluate(() => ((window as any).__dropAck = true));
          }
          await phone
            .getByRole("button", { name: "ยืนยันวางผ้า", exact: true })
            .click();
        } else {
          if (!reconnected) {
            const before = await read(phone);
            await phone.reload();
            await expect(
              phone.locator(".calico-market button:not([disabled])"),
            ).toHaveCount(3);
            expect((await read(phone)).me!.id).toBe(before.me!.id);
            expect((await read(phone)).step).toBe("draft");
            expect((await read(phone)).players).toEqual(before.players);
            expect(
              await phone.evaluate(() => (window as any).__calicoAnimations),
            ).toBe(0);
            reconnected = true;
          }
          await phone.locator('[data-market="0"]').click();
          await phone
            .getByRole("button", { name: "ยืนยันเลือกผ้า", exact: true })
            .click();
        }
        await Promise.all([host, ...phones].map((p) => revision(p, next)));
        moves++;
        if (moves === 1) {
          const actors: any[] = await host.evaluate(
            () => (window as any).__calicoAnimActors,
          );
          expect(actors.every((a) => a.actor === a.expected)).toBeTruthy();
          const count = await host.evaluate(
            () => (window as any).__calicoAnimations,
          );
          await host.evaluate(() => {
            const frame = (window as any).__frames
              .filter((m: any) => m.type === "state")
              .at(-1);
            (window as any).__sockets
              .at(-1)
              .dispatchEvent(
                new MessageEvent("message", { data: JSON.stringify(frame) }),
              );
          });
          expect(
            await host.evaluate(() => (window as any).__calicoAnimations),
          ).toBe(count);
        }
        v = await read(host);
        // Stay within the normal 40 commands / 10s quota used for real players.
        await phone.waitForTimeout(270);
      }
      expect(v.phase).toBe("finished");
      expect(moves).toBe(88);
      expect(v.placements).toBe(44);
      for(const p of [host,...phones])expect(await p.evaluate(()=>(window as any).__wrongAwardMotion)).toBe(0);
      expect(v.bagCount).toBe(57);
      expect(
        v.players.every((p) => Object.keys(p.patches).length === 22),
      ).toBeTruthy();
      await expect(
        host.getByRole("heading", { name: /ผู้ชนะ:/ }),
      ).toBeVisible();
      await host.screenshot({
        path: `test-results/calico-${preset}-finished.png`,
        fullPage: true,
      });
      for (const p of phones) {
        expect((await read(p)).players.map((p) => p.score)).toEqual(
          v.players.map((p) => p.score),
        );
        expect(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBeTruthy();
      }
      await phones[0].screenshot({
        path: `test-results/calico-${preset}-phone.png`,
        fullPage: true,
      });
      await host.locator(".cat-contract").first().locator("summary").click();
      await expect(host.locator(".cat-requirement").first()).toBeVisible();
      await host.screenshot({
        path: `test-results/calico-${preset}-cats.png`,
        fullPage: true,
      });
      const frames: any[] = await host.evaluate(() =>
        (window as any).__frames.filter((m: any) => m.type === "state"),
      );
      for (const { view } of frames) {
        expect(view.me).toBeUndefined();
        expect(view.bag).toBeUndefined();
        expect(JSON.stringify(view)).not.toContain('"token"');
        for (const p of view.players) {
          expect(p.options).toBeUndefined();
          expect(p.draft).toBeUndefined();
        }
      }
      const rev = v.revision;
      await host
        .getByRole("button", { name: "เล่นอีกครั้ง", exact: true })
        .click();
      await Promise.all([host, ...phones].map((p) => revision(p, rev + 1)));
      const fresh = await read(host);
      expect(fresh.phase).toBe(preset === "standard" ? "setup" : "playing");
      expect(fresh.placements).toBe(0);
      expect(
        fresh.players.every(
          (p) => Object.keys(p.patches).length === 0 && p.awards.length === 0,
        ),
      ).toBeTruthy();
      const count = await host.evaluate(
        () => (window as any).__calicoAnimations,
      );
      const actorLogs: any[] = await host.evaluate(
        () => (window as any).__calicoAnimActors,
      );
      expect(actorLogs.every((a) => a.actor === a.expected)).toBeTruthy();
      if (preset === "first") expect(count).toBe(0);
      else expect(count).toBeGreaterThan(0);
      for (const p of [host, ...phones])
        expect(
          await p.evaluate(() =>
            Array.from(document.images)
              .filter((img) => img.src.includes("/art/calico/"))
              .every((img) => img.complete && img.naturalWidth > 0),
          ),
        ).toBeTruthy();
      expect(errors).toEqual([]);
      console.log(
        `Calico ${preset}: ${moves} accepted actions, ${v.players.map((p) => p.score!.total).join(" / ")} points`,
      );
    } finally {
      if (host && code) {
        const origin = new URL(host.url()).origin;
        await host.request
          .post("/api/rooms/leave", {
            headers: { Origin: origin },
            data: { code, close: true },
          })
          .catch(() => {});
      }
      for (const c of contexts) await c.close();
    }
  });
for (const count of [1, 3, 4])
  test(`Calico ${count} players: ${count === 1 ? "complete Solo conveyor" : "shared market and turn cycle"}, compact mobile and room menu`, async ({
    browser,
  }) => {
    test.setTimeout(180000);
    const contexts: BrowserContext[] = [];
    let host: Page | undefined, code: string | undefined;
    const make = async (mobile = false) => {
      const c = await browser.newContext({
        viewport: mobile
          ? { width: 390, height: 620 }
          : { width: 1600, height: 1000 },
        isMobile: mobile,
        hasTouch: mobile,
      });
      contexts.push(c);
      const p = await c.newPage();
      await capture(p);
      return p;
    };
    try {
      host = await make();
      await host.goto("/?players=" + count);
      await expect(
        host.getByRole("heading", { name: "Calico", exact: true }),
      ).toBeVisible();
      await host.goto("/games/calico");
      await testAccount(host);
      await host.getByRole("button", { name: "สร้างห้องบนจอกลาง" }).click();
      await expect(host.locator("#qr")).toBeVisible();
      code = await host.locator(".room-code strong").innerText();
      await host.getByLabel("การจัดเกม").selectOption("first");
      const phones: Page[] = [];
      for (let i = 0; i < count; i++) {
        const p = await make(true);
        phones.push(p);
        await p.goto("/play/" + code);
        await p
          .getByRole("textbox", { name: "ชื่อของคุณ" })
          .fill("ช่างเย็บ" + (i + 1));
        await p.getByRole("button", { name: "เข้าห้อง", exact: true }).click();
        await p.getByRole("button", { name: "พร้อมเล่น", exact: true }).click();
      }
      if (count === 4) {
        const extra = await make(true);
        await extra.goto("/play/" + code);
        await extra.getByRole("textbox", { name: "ชื่อของคุณ" }).fill("คนเกิน");
        await extra
          .getByRole("button", { name: "เข้าห้อง", exact: true })
          .click();
        await expect(extra.locator("#notice")).toContainText("เต็ม");
      }
      const ids = await Promise.all(
        phones.map(async (p) => (await read(p)).me!.id),
      );
      await host.locator("#starter").selectOption(ids[0]);
      await host.getByRole("button", { name: "เริ่มเกม", exact: true }).click();
      await expect(host.locator(".quilt")).toHaveCount(count);
      await host.screenshot({
        path: `test-results/calico-v2-${count}-desktop.png`,
        fullPage: true,
      });
      await host.setViewportSize({ width: 1024, height: 768 });
      if (count === 4)
        expect(
          await host
            .locator(".quilt")
            .evaluateAll((els) =>
              els.every((e) => e.getBoundingClientRect().bottom <= innerHeight),
            ),
        ).toBeTruthy();
      await host.screenshot({
        path: `test-results/calico-v2-${count}-ipad.png`,
        fullPage: true,
      });
      await host.setViewportSize({ width: 1600, height: 1000 });
      let v = await read(host),
        moves = 0,
        reconnected = false;
      while (v.phase !== "finished" && moves < (count === 1 ? 45 : count * 4)) {
        const p = phones[ids.indexOf(v.turn!)];
        await revision(p, v.revision);
        const next = v.revision + 1;
        if (v.step === "place") {
          await p.locator("[data-hand]").first().click();
          await p
            .locator(".quilt-player")
            .first()
            .locator("[data-hex]:not([disabled])")
            .first()
            .click();
          await expect(p.locator(".calico-market-dock")).toBeInViewport();
          const overlap = await p.locator(".calico-market-dock").boundingBox();
          expect(overlap!.height).toBeLessThan(210);
          if (!moves) {
            await p.screenshot({
              path: `test-results/calico-v2-${count}-short-phone.png`,
              fullPage: false,
            });
            await expect(p.locator(".calico-heading .room-code")).toHaveCount(
              0,
            );
            await p.locator(".shared-room-menu summary").click();
            await expect(
              p.locator(".shared-room-menu .room-code"),
            ).toBeVisible();
            await p.screenshot({
              path: `test-results/calico-v2-${count}-room-menu.png`,
              fullPage: true,
            });
            await p.locator(".shared-room-menu summary").click();
            await expect(p.locator(".turn-sound-button svg")).toHaveCount(1);
            await expect(p.locator(".turn-sound-button")).toHaveAttribute(
              "aria-label",
              /เสียง/,
            );
          }
          await p.locator("#calico-place").click();
        } else {
          if (!reconnected) {
            const before = await read(p);
            await p.reload();
            await expect(
              p.locator(".calico-market button:not([disabled])"),
            ).toHaveCount(3);
            expect((await read(p)).players).toEqual(before.players);
            expect((await read(p)).market).toEqual(before.market);
            expect((await read(p)).removedCount).toBe(before.removedCount);
            reconnected = true;
          }
          const before = await read(p),
            pick = Math.floor(moves / 2) % 3;
          await p.locator(`[data-market="${pick}"]`).click();
          await p.locator("#calico-draft").click();
          await revision(p, next);
          const after = await read(p);
          if (count === 1) {
            expect(after.removedCount).toBe((before.removedCount ?? 0) + 1);
            expect(after.bagCount).toBe(before.bagCount! - 2);
            const remaining = before.market!.filter((_, i) => i !== pick);
            expect(after.market![0]).toEqual(remaining[1]);
            expect(after.event!.marketCycle!.removed).toEqual([remaining[0]]);
          } else {
            expect(after.removedCount).toBe(0);
            expect(after.bagCount).toBe(before.bagCount! - 1);
            expect(after.turn).toBe(
              ids[(ids.indexOf(before.turn!) + 1) % count],
            );
          }
        }
        await Promise.all([host, ...phones].map((p) => revision(p, next)));
        v = await read(host);
        moves++;
        await p.waitForTimeout(count === 1 ? 320 : 270);
      }
      expect(reconnected).toBeTruthy();
      if (count === 1) {
        expect(v.phase).toBe("finished");
        expect(moves).toBe(44);
        expect(v.removedCount).toBe(22);
        expect(v.bagCount).toBe(59);
        await host.screenshot({
          path: "test-results/calico-v2-solo-final.png",
          fullPage: true,
        });
        await host.locator("#calico-restart").click();
        await expect(host.locator(".calico-market button")).toHaveCount(3);
        expect((await read(host)).removedCount).toBe(0);
        await revision(phones[0], v.revision + 1);
      } else expect(v.placements).toBe(count * 2);
      for (const p of [host, ...phones]) {
        expect(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBeTruthy();
        expect((await read(p)).players.map((p) => p.score)).toEqual(
          (await read(host)).players.map((p) => p.score),
        );
      }
      console.log("Calico", count, "players:", moves, "accepted actions");
    } finally {
      if (host && code)
        await host.request.post("/api/rooms/leave", {
          headers: { Origin: new URL(host.url()).origin },
          data: { code, close: true },
        });
      for (const c of contexts) await c.close();
    }
  });
test("Calico reward overlays: real earning groups, readable fabric, no duplicate after reload or resize", async ({
  browser,
}) => {
  const { startServer } = await import("../../src/server/index.js");
  const rules = await import("../../src/games/calico/engine.js");
  const { fromOffset } = await import("../../src/games/calico/data.js");
  const { validateCalicoState } =
    await import("../../src/games/calico/validation.js");
  const { mkdtemp, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dir = await mkdtemp(join(tmpdir(), "calico-overlays-"));
  const app = await startServer(0, "127.0.0.1", true, () => 0.42, {
    storePath: join(dir, "test.sqlite"),
  });
  const url = `http://localhost:${(app.server.address() as any).port}`,
    contexts: BrowserContext[] = [];
  try {
    const a = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
      }),
      b = await browser.newContext({ viewport: { width: 390, height: 620 } });
    contexts.push(a, b);
    const host = await a.newPage(),
      phone = await b.newPage();
    await capture(host);
    await capture(phone);
    await host.goto(url + "/games/calico");
    await testAccount(host, app);
    await host.getByRole("button", { name: "สร้างห้องบนจอกลาง" }).click();
    await expect(host.locator("#qr")).toBeVisible();
    const code = await host.locator(".room-code strong").innerText();
    await phone.goto(url + "/play/" + code);
    await phone.getByRole("textbox", { name: "ชื่อของคุณ" }).fill("ผืนรางวัล");
    await phone.getByRole("button", { name: "เข้าห้อง", exact: true }).click();
    await phone.getByRole("button", { name: "พร้อมเล่น", exact: true }).click();
    const room = app.rooms.rooms.get(code)!;
    let s = rules.createInitialState(
      room.players,
      () => 0.42,
      room.players[0].id,
      "first",
    );
    s.players[0].board = 0;
    s.cats = [
      { id: "millie", patterns: ["dots", "stripes"] },
      { id: "tibbit", patterns: ["flowers", "vines"] },
      { id: "coconut", patterns: ["quatrefoil", "swirls"] },
    ];
    const all = rules.tiles(),
      dots = all.filter((t) => t.color === "blue" && t.pattern === "dots"),
      others = all.filter((t) => !dots.some((d) => d.id === t.id));
    s.players[0].hand = dots.slice(0, 2);
    s.market = [dots[2], ...others.splice(0, 2)];
    s.bag = others;
    for (let i = 0; i < 3; i++) {
      s = rules.applyAction(s, s.players[0].id, {
        type: "calico-place",
        tileId: dots[i].id,
        hex: fromOffset(0, i),
      });
      s = rules.applyAction(s, s.players[0].id, {
        type: "calico-draft",
        index: 0,
      });
    }
    expect(validateCalicoState(s)).toBeTruthy();
    expect(s.players[0].awards.some((a) => a.kind === "cat")).toBeTruthy();
    expect(s.players[0].awards.some((a) => a.kind === "button")).toBeTruthy();
    room.calico = s;
    room.revision++;
    (app.rooms as any).broadcast(room, true);
    await expect(phone.locator(".quilt-award")).toHaveCount(
      s.players[0].awards.length,
    );
    const old = await read(phone);
    await phone.locator('[data-award="0"]').click();
    await expect(phone.locator(".calico-token-detail")).toContainText(/กลุ่ม/);
    await phone.locator("#calico-close-token").click();
    await phone.locator("#calico-token-opacity").click();
    await expect(phone.locator(".quilt-awards")).toHaveClass(/tokens-muted/);
    await phone.screenshot({
      path: "test-results/calico-v2-tokens-muted-phone.png",
      fullPage: true,
    });
    await phone.locator("#calico-token-opacity").click();
    await phone.screenshot({
      path: "test-results/calico-v2-tokens-phone.png",
      fullPage: true,
    });
    await host.screenshot({
      path: "test-results/calico-v2-tokens-desktop.png",
      fullPage: true,
    });
    await phone.reload();
    await expect(phone.locator(".quilt-award")).toHaveCount(
      s.players[0].awards.length,
    );
    expect((await read(phone)).players[0].awards).toEqual(
      old.players[0].awards,
    );
    expect((await read(phone)).players[0].score).toEqual(old.players[0].score);
    expect(await phone.evaluate(() => (window as any).__calicoAnimations)).toBe(
      0,
    );
    await phone.setViewportSize({ width: 430, height: 740 });
    expect(
      await phone.locator(".quilt-award-group").evaluateAll((els) =>
        els.every((el) => {
          const r = el.getBoundingClientRect(),
            q = el.closest(".quilt")!.getBoundingClientRect();
          return (
            r.left >= q.left &&
            r.right <= q.right &&
            r.top >= q.top &&
            r.bottom <= q.bottom
          );
        }),
      ),
    ).toBeTruthy();
  } finally {
    for (const c of contexts) await c.close();
    await app.close();
    await rm(dir, { recursive: true, force: true });
  }
});
