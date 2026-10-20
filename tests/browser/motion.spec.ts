import {testAccount,createDisplayRoom} from "./auth-fixture.js";
import { test, expect, type Page } from "@playwright/test";
import { startServer } from "../../src/server/index.js";

async function capture(page: Page) {
  await page.addInitScript(() => {
    (window as any).__wire = [];
    window.WebSocket = new Proxy(window.WebSocket, {
      construct(Target, args) {
        const socket = new Target(args[0], args[1]);
        ((window as any).__sockets ??= []).push(socket);
        const send = socket.send.bind(socket);
        socket.send = (data) => {
          try {
            (window as any).__wire.push({ sent: JSON.parse(String(data)) });
          } catch {}
          send(data);
        };
        socket.addEventListener("message", (e) => {
          const m = JSON.parse(e.data);
          (window as any).__wire.push({ received: m });
          if (
            (window as any).__dropState &&
            m.type === "state" &&
            !m.snapshot
          ) {
            (window as any).__dropState = false;
            e.stopImmediatePropagation();
          }
        });
        return socket;
      },
    });
  });
}
async function idle(page: Page, revision: number) {
  await expect(page.locator(".board-scene")).toHaveAttribute(
    "data-animating",
    "false",
  );
  await expect(page.locator(".board-scene")).toHaveAttribute(
    "data-visual-revision",
    String(revision),
  );
}
async function comparePieces(page: Page, stacks: Record<number, string[]>) {
  for (const [position, cs] of Object.entries(stacks))
    for (let i = 0; i < cs.length; i++) {
      const camel = page.locator(`[data-camel="${cs[i]}"]`);
      await expect(camel).toHaveAttribute("data-position", position);
      await expect(camel).toHaveAttribute("data-stack-index", String(i));
    }
}

test("authoritative unit path, tile landing, duplicate/gap/reconnect and desktop/iPad/reduced motion", async ({
  browser,
}) => {
  let outcomes: number[] = [];
  const app = await startServer(
    0,
    "127.0.0.1",
    true,
    () => outcomes.shift() ?? 0,
    { storePath: ":memory:", legacyHarness: true },
  );
  const url = `http://127.0.0.1:${(app.server.address() as any).port}`;
  const contexts = [];
  const errors: string[] = [];
  try {
    const host = await browser.newContext({
      viewport: { width: 1366, height: 1024 },
    });
    contexts.push(host);
    const display = await host.newPage();
    await capture(display);
    display.on("pageerror", (e) => errors.push(e.message));
    await display.goto(`${url}/games/camel-up`);
    await testAccount(display, app);
    await createDisplayRoom(display);
    await expect(display.locator(".room-code strong")).toBeVisible();
    const code = await display.locator(".room-code strong").innerText();
    const players: Page[] = [];
    for (let i = 0; i < 3; i++) {
      const ctx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      });
      contexts.push(ctx);
      const p = await ctx.newPage();
      await capture(p);
      p.on("pageerror", (e) => errors.push(e.message));
      await p.goto(`${url}/play/${code}`);
      await p.getByRole("textbox", { name: "ชื่อของคุณ" }).fill(`ภาพ ${i + 1}`);
      await p.getByRole("button", { name: "เข้าห้อง", exact: true }).click();
      await expect(
        p.getByRole("heading", { name: "คุณเข้าห้องแล้ว" }),
      ).toBeVisible();
      players.push(p);
    }
    await display
      .getByRole("button", { name: "เริ่มเกม", exact: true })
      .click();
    await expect(
      players[0].getByRole("heading", { name: "เลือก 1 การกระทำ" }),
    ).toBeVisible();
    const room = app.rooms.rooms.get(code)!;
    const initial = room.revision;
    // Internal server fixture only; no test endpoints or client-side outcome injection ship.
    room.game!.stacks = {
      2: ["blue", "green", "yellow"],
      4: ["red", "purple"],
      14: ["black"],
      15: ["white"],
    };
    room.game!.tiles = { 5: { owner: room.players[1].id, direction: -1 } };
    room.game!.dice = ["green", "grey", "blue", "red", "purple", "yellow"];
    app.rooms.syncRoom(code);
    await comparePieces(display, room.game!.stacks);
    await idle(display, initial);
    outcomes = [0, 0.99];
    await players[0]
      .getByRole("button", { name: "ทอยเต๋า • รับบัตรพีระมิด", exact: true })
      .click();
    await expect(display.locator(".board-scene")).toHaveAttribute(
      "data-animating",
      "true",
    );
    await expect(display.locator("main")).toHaveAttribute(
      "data-revision",
      String(initial + 1),
    );
    // Rules commit immediately while the independent visual model catches up.
    expect(room.game!.stacks[4]).toEqual(["green", "yellow", "red", "purple"]);
    await idle(display, initial + 1);
    await comparePieces(display, room.game!.stacks);
    await expect(display.locator(".board-scene")).toHaveAttribute(
      "data-last-unit",
      '["green","yellow"]',
    );
    await expect(display.locator(".board-scene")).toHaveAttribute(
      "data-last-path",
      "[3,4,5,4]",
    );
    for (const p of [display, ...players])
      await expect(p.locator(".players li").nth(1).locator("b")).toContainText(
        "4",
      );
    const count = await display
      .locator(".board-scene")
      .getAttribute("data-animation-count");
    const publicFrame = await display.evaluate(
      () =>
        (window as any).__wire
          .filter((x: any) => x.received?.type === "state")
          .at(-1).received,
    );
    const hostSocket = [...room.sockets].find(
      ([, s]) => s?.role === "host",
    )![0];
    hostSocket.send(JSON.stringify({ ...publicFrame, snapshot: false }));
    await expect(display.locator(".board-scene")).toHaveAttribute(
      "data-animation-count",
      count!,
    );
    await idle(display, initial + 1);
    // Drop one real event; the next accepted revision must request sync, not guess a path.
    await display.evaluate(() => ((window as any).__dropState = true));
    await players[1]
      .getByRole("button", { name: /เดิมพันรอบย่อย อูฐฟ้า/ })
      .click();
    await expect(
      players[2].getByRole("heading", { name: "เลือก 1 การกระทำ" }),
    ).toBeVisible();
    await players[2]
      .getByRole("button", { name: /เดิมพันรอบย่อย อูฐเหลือง/ })
      .click();
    await idle(display, initial + 3);
    expect(
      await display.evaluate(() =>
        (window as any).__wire.some((x: any) => x.sent?.type === "sync"),
      ),
    ).toBe(true);
    // Disconnect the display during movement: resume snaps to latest without replay.
    await players[0]
      .getByRole("button", { name: "ทอยเต๋า • รับบัตรพีระมิด", exact: true })
      .click();
    await expect(display.locator(".board-scene")).toHaveAttribute(
      "data-animating",
      "true",
    );
    await display.evaluate(() => {
      for (const s of (window as any).__sockets) s.close();
    });
    await expect(display.locator(".connection")).toContainText("ออนไลน์");
    await idle(display, initial + 4);
    await comparePieces(display, room.game!.stacks);
    await expect(display.locator(".motion-fx")).toBeEmpty();
    for (const viewport of [
      { width: 1366, height: 1024 },
      { width: 1024, height: 768 },
      { width: 768, height: 1024 },
    ]) {
      await display.setViewportSize(viewport);
      expect(
        await display.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const rect = await display.locator(".board-scene").boundingBox();
      expect(rect!.y + rect!.height).toBeLessThanOrEqual(viewport.height);
      await display.screenshot({
        path: `test-results/board-${viewport.width}x${viewport.height}.png`,
        fullPage: true,
      });
    }
    const reduced = await browser.newContext({
      viewport: { width: 1024, height: 768 },
      reducedMotion: "reduce",
    });
    contexts.push(reduced);
    const spectator = await reduced.newPage();
    await spectator.goto(`${url}/display/${code}`);
    await idle(spectator, room.revision);
    await players[1]
      .getByRole("button", { name: "ทอยเต๋า • รับบัตรพีระมิด", exact: true })
      .click();
    await idle(spectator, initial + 5);
    await comparePieces(spectator, room.game!.stacks);
    expect(
      await spectator
        .locator(".board-scene")
        .getAttribute("data-animation-count"),
    ).toBeNull();
    for (const p of [display, ...players, spectator]) {
      expect(
        await p.evaluate(
          () => document.querySelectorAll("[data-camel]").length,
        ),
      ).toBe(7);
      expect(
        await p.evaluate(() =>
          [...document.images].every((i) => i.complete && i.naturalWidth > 0),
        ),
      ).toBe(true);
    }
    expect(errors).toEqual([]);
  } finally {
    for (const ctx of contexts) await ctx.close();
    await app.close();
  }
});

test("เดิมพันผู้ชนะและผู้แพ้ทั้งเกมเห็นตลอด และ server จ่ายรางวัลเมื่อจบ", async ({
  browser,
}) => {
  const app = await startServer(0, "127.0.0.1", true, () => 0, {
    storePath: ":memory:",
    legacyHarness: true,
  });
  const url = `http://127.0.0.1:${(app.server.address() as any).port}`;
  const contexts = [];
  try {
    const host = await browser.newContext({
      viewport: { width: 1366, height: 1024 },
      reducedMotion: "reduce",
    });
    contexts.push(host);
    const display = await host.newPage();
    await capture(display);
    await display.goto(`${url}/games/camel-up`);
    await testAccount(display, app);
    await createDisplayRoom(display);
    await expect(display.locator(".room-code strong")).toBeVisible();
    const code = await display.locator(".room-code strong").innerText();
    const players: Page[] = [];
    for (let i = 0; i < 3; i++) {
      const ctx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        reducedMotion: "reduce",
      });
      contexts.push(ctx);
      const p = await ctx.newPage();
      await p.goto(`${url}/play/${code}`);
      await p
        .getByRole("textbox", { name: "ชื่อของคุณ" })
        .fill(`เดิมพัน ${i + 1}`);
      await p.getByRole("button", { name: "เข้าห้อง", exact: true }).click();
      await expect(
        p.getByRole("heading", { name: "คุณเข้าห้องแล้ว" }),
      ).toBeVisible();
      players.push(p);
    }
    await display
      .getByRole("button", { name: "เริ่มเกม", exact: true })
      .click();
    await expect(players[0].locator(".final-betting")).toBeVisible();
    await expect(players[1].locator(".final-betting")).toBeVisible();
    await expect(
      players[1].getByRole("button", { name: "ลงการ์ดลับ" }),
    ).toBeDisabled();
    await expect(players[1].locator(".final-status")).toContainText(
      "เมื่อถึงตา",
    );
    const room = app.rooms.rooms.get(code)!;
    room.game!.stacks = {
      16: ["blue"],
      10: ["green"],
      9: ["yellow"],
      8: ["purple"],
      1: ["red"],
      14: ["black"],
      15: ["white"],
    };
    room.game!.dice = ["blue", "grey"];
    app.rooms.syncRoom(code);
    await players[0]
      .getByRole("button", { name: "เลือกการ์ดอูฐฟ้า", exact: true })
      .click();
    await players[0].getByRole("button", { name: "ลงการ์ดลับ" }).click();
    await expect(
      players[1].getByRole("button", { name: "ลงการ์ดลับ" }),
    ).toBeEnabled();
    await players[1]
      .getByRole("button", { name: "เลือกการ์ดอูฐแดง", exact: true })
      .click();
    await players[1].getByLabel("ผลที่ทาย").selectOption("loser");
    await players[1].getByRole("button", { name: "ลงการ์ดลับ" }).click();
    await expect(
      players[2].getByRole("button", { name: /เดิมพันรอบย่อย อูฐเขียว/ }),
    ).toBeEnabled();
    await players[2]
      .getByRole("button", { name: /เดิมพันรอบย่อย อูฐเขียว/ })
      .click();
    await expect(
      players[0].getByRole("button", { name: "ทอยเต๋า • รับบัตรพีระมิด" }),
    ).toBeVisible();
    await players[0].screenshot({
      path: "test-results/final-betting-mobile.png",
      fullPage: true,
    });
    await players[0]
      .getByRole("button", { name: "ทอยเต๋า • รับบัตรพีระมิด" })
      .click();
    await expect(
      display.getByRole("heading", { name: /ผู้ชนะ:/ }),
    ).toBeVisible();
    expect(room.game!.finalResults).toEqual([
      {
        side: "winner",
        playerId: room.players[0].id,
        color: "blue",
        amount: 8,
      },
      { side: "loser", playerId: room.players[1].id, color: "red", amount: 8 },
    ]);
    expect(room.game!.players.map((p) => p.money)).toEqual([12, 11, 4]);
    for (const p of [display, ...players]) {
      await expect(p.getByRole("heading", { name: /ผู้ชนะ:/ })).toBeVisible();
      await expect(p.locator(".results")).toContainText("+8");
      expect(await p.locator("main").innerText()).not.toContain("เลก");
    }
    await expect(
      display.getByRole("button", { name: "เล่นอีกครั้ง", exact: true }),
    ).toBeVisible();
    await expect(
      players[0].getByRole("button", { name: "เล่นอีกครั้ง", exact: true }),
    ).toHaveCount(0);
    await display
      .getByLabel("ผู้เริ่มเกมใหม่")
      .selectOption(room.players[2].id);
    await display
      .getByRole("button", { name: "เล่นอีกครั้ง", exact: true })
      .click();
    for (const p of [display, ...players]) {
      await expect(p.getByRole("heading", { name: /ผู้ชนะ:/ })).toHaveCount(0);
      await expect(p.locator(".shared-room-menu .room-code strong")).toHaveText(code);
      for (let i = 0; i < 3; i++)
        await expect(
          p.locator(".players li").nth(i).locator("b"),
        ).toContainText("3");
      await idle(p, room.revision);
    }
    for (const p of players)
      await expect(p.locator(".hand-choice:not(.used)")).toHaveCount(5);
    const restart = await display.evaluate(
      () =>
        (window as any).__wire
          .filter((x: any) => x.sent?.action?.type === "restart")
          .at(-1).sent,
    );
    const revision = room.revision;
    await display.evaluate((command) => {
      (window as any).__sockets.at(-1).send(JSON.stringify(command));
    }, restart);
    await expect(display.locator("main")).toHaveAttribute(
      "data-revision",
      String(revision),
    );
    expect(room.revision).toBe(revision);
    await players[1].reload();
    await expect(
      players[1].getByRole("heading", { name: "เดิมพัน 2", exact: true }),
    ).toBeVisible();
    await expect(
      players[2].getByRole("heading", { name: "เลือก 1 การกระทำ" }),
    ).toBeVisible();
    await display.screenshot({
      path: "test-results/rematch-display.png",
      fullPage: true,
    });
    await players[2]
      .getByRole("button", { name: /เดิมพันรอบย่อย อูฐแดง/ })
      .click();
    expect(room.game!.players[2].tickets).toEqual([{ color: "red", value: 5 }]);
  } finally {
    for (const ctx of contexts) await ctx.close();
    await app.close();
  }
});
