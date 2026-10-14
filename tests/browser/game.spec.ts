import { testAccount } from "./auth-fixture.js";
import { test, expect, type Page } from "@playwright/test";
test("จอกลาง + มือถือ 3 คน เล่นครบเกมและหลุดกลับผู้เล่นเดิม", async ({
  browser,
}) => {
  const displayContext = await browser.newContext({
    viewport: { width: 1366, height: 1024 },
  });
  const display = await displayContext.newPage();
  const errors: string[] = [];
  display.on("pageerror", (e) => errors.push(e.message));
  await display.goto("/games/camel-up");
    await testAccount(display);
  await display.getByRole("button", { name: "สร้างห้องบนจอกลาง" }).click();
  await expect(display.locator(".room-code strong")).toBeVisible();
  const code = await display.locator(".room-code strong").innerText();
  const players: Page[] = [],
    contexts = [];
  const frames: Record<number, any[]> = {};
  for (let i = 0; i < 3; i++) {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    contexts.push(ctx);
    const p = await ctx.newPage();
    await p.addInitScript(() => {
      window.WebSocket = new Proxy(window.WebSocket, {
        construct(Target, args) {
          const socket = new Target(args[0], args[1]);
          ((window as any).__testSockets ??= []).push(socket);
          socket.addEventListener("message", (event) => {
            if (
              (window as any).__dropOneAck &&
              JSON.parse(event.data).type === "ack"
            ) {
              (window as any).__dropOneAck = false;
              event.stopImmediatePropagation();
              socket.close();
            }
          });
          return socket;
        },
      });
    });
    p.on("pageerror", (e) => errors.push(e.message));
    frames[i] = [];
    p.on("websocket", (socket) =>
      socket.on("framereceived", (frame) => {
        try {
          frames[i].push(JSON.parse(String(frame.payload)));
        } catch {}
      }),
    );
    await p.goto(`/play/${code}`);
    await p
      .getByRole("textbox", { name: "ชื่อของคุณ" })
      .fill(`มือถือ ${i + 1}`);
    await p.getByRole("button", { name: "เข้าห้อง", exact: true }).click();
    await expect(
      p.getByRole("heading", { name: "คุณเข้าห้องแล้ว" }),
    ).toBeVisible();
    players.push(p);
  }
  await expect(
    display.getByRole("heading", { name: "ผู้เล่น 3/8" }),
  ).toBeVisible();
  await display.getByRole("button", { name: "เริ่มเกม", exact: true }).click();
  await expect(
    players[0].getByRole("heading", { name: "ตาของคุณ เลือก 1 การกระทำ" }),
  ).toBeVisible();
  // Private final bet through actual UI.
  await players[0].getByRole("button", { name: "ลงการ์ดลับ" }).click();
  await expect(
    players[1].getByRole("heading", { name: "ตาของคุณ เลือก 1 การกระทำ" }),
  ).toBeVisible();
  await players[1].evaluate(() => ((window as any).__dropOneAck = true));
  await players[1]
    .getByRole("button", { name: /เดิมพันรอบย่อย อูฐ/ })
    .first()
    .click();
  await expect(players[1].locator(".notice")).toHaveText("ทำรายการแล้ว");
  await expect(
    players[1].locator(".players li").nth(1).locator(".tickets"),
  ).toHaveText("ฟ้า 5");
  await expect(
    players[2].getByRole("heading", { name: "ตาของคุณ เลือก 1 การกระทำ" }),
  ).toBeVisible();
  await players[2]
    .getByRole("button", { name: "วางป้าย", exact: true })
    .click();
  await expect(
    players[0].getByRole("heading", { name: "ตาของคุณ เลือก 1 การกระทำ" }),
  ).toBeVisible();
  await display.screenshot({
    path: "test-results/display.png",
    fullPage: true,
  });
  await players[0].screenshot({
    path: "test-results/mobile.png",
    fullPage: true,
  });
  // Chromium offline emulation does not sever existing WebSockets. Explicitly close
  // the real transport while offline, then restore network and reload the session.
  const before = await players[0].locator(".players li").allTextContents();
  await contexts[0].setOffline(true);
  await players[0].evaluate(() => {
    for (const socket of (window as any).__testSockets) socket.close();
  });
  await expect(display.locator(".players li").first()).toContainText("หลุด", {
    timeout: 45000,
  });
  await contexts[0].setOffline(false);
  await players[0].reload();
  await expect(
    players[0].getByRole("heading", { name: "มือถือ 1", exact: true }),
  ).toBeVisible();
  await expect(
    players[0].getByRole("heading", { name: "ตาของคุณ เลือก 1 การกระทำ" }),
  ).toBeVisible();
  expect(await players[0].locator(".players li").allTextContents()).toEqual(
    before,
  );
  let moves = 0;
  while (
    !(await display.getByRole("heading", { name: /ผู้ชนะ:/ }).count()) &&
    moves < 700
  ) {
    const current = players[moves % 3];
    await expect(
      current.getByRole("button", {
        name: "ทอยเต๋า • รับบัตรพีระมิด",
        exact: true,
      }),
    ).toBeVisible();
    /* Pace below the production command quota. */ await new Promise((r) =>
      setTimeout(r, 150),
    );
    const previous = await display.locator(".room-heading p").innerText();
    await current
      .getByRole("button", { name: "ทอยเต๋า • รับบัตรพีระมิด", exact: true })
      .click();
    await expect(display.locator(".room-heading p")).not.toHaveText(previous);
    moves++;
    if (!(await display.getByRole("heading", { name: /ผู้ชนะ:/ }).count()))
      await expect(
        players[moves % 3].getByRole("button", {
          name: "ทอยเต๋า • รับบัตรพีระมิด",
          exact: true,
        }),
      ).toBeVisible();
  }
  await expect(display.getByRole("heading", { name: /ผู้ชนะ:/ })).toBeVisible();
  const final = await display.locator(".players li").allTextContents();
  for (const p of players) {
    await expect(p.getByRole("heading", { name: /ผู้ชนะ:/ })).toBeVisible();
    const normalize = (s: string) => s.replace(" (คุณ)", "").replace(/\s/g, "");
    expect(
      (await p.locator(".players li").allTextContents()).map(normalize),
    ).toEqual(final.map(normalize));
    expect(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  for (let i = 0; i < 3; i++) {
    const states = frames[i].filter(
      (m) => m.type === "state" && m.view.phase === "playing",
    );
    expect(states.length).toBeGreaterThan(0);
    for (const m of states) {
      expect(
        m.view.players.every((p: any) => !("cards" in p) && !("bets" in p)),
      ).toBe(true);
      expect(JSON.stringify(m.view)).not.toContain("token");
    }
    if (i > 0)
      expect(states.every((m) => m.view.me.bets.length === 0)).toBe(true);
  }
  await expect(display.locator(".board-scene")).toHaveAttribute(
    "data-animating",
    "false",
    { timeout: 12000 },
  );
  const latestRevision = await display
    .locator("main")
    .getAttribute("data-revision");
  await expect(display.locator(".board-scene")).toHaveAttribute(
    "data-visual-revision",
    latestRevision!,
  );
  await display.screenshot({
    path: "test-results/finished.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
  console.log(`Browser completed ${moves} roll actions, room ${code}`);
  for (const ctx of [...contexts, displayContext]) await ctx.close();
});

test("วง 6 คน เลือกบัตรพันธมิตรบนมือถือและจบ settlement พร้อมกัน", async ({
  browser,
}) => {
  const hostContext = await browser.newContext();
  const display = await hostContext.newPage();
  await display.goto("/games/camel-up");
    await testAccount(display);
  await display.getByRole("button", { name: "สร้างห้องบนจอกลาง" }).click();
  await expect(display.locator(".room-code strong")).toBeVisible();
  const code = await display.locator(".room-code strong").innerText();
  const contexts = [],
    players: Page[] = [];
  for (let i = 0; i < 6; i++) {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    contexts.push(ctx);
    const p = await ctx.newPage();
    await p.goto(`/play/${code}`);
    await p.getByRole("textbox", { name: "ชื่อของคุณ" }).fill(`คู่ ${i + 1}`);
    await p.getByRole("button", { name: "เข้าห้อง", exact: true }).click();
    await expect(
      p.getByRole("heading", { name: "คุณเข้าห้องแล้ว" }),
    ).toBeVisible();
    players.push(p);
  }
  await display.getByRole("button", { name: "เริ่มเกม", exact: true }).click();
  await players[0]
    .getByRole("button", { name: "จับคู่กับ คู่ 2", exact: true })
    .click();
  for (let i = 1; i <= 5; i++) {
    await expect(
      players[i].getByRole("button", {
        name: "ทอยเต๋า • รับบัตรพีระมิด",
        exact: true,
      }),
    ).toBeVisible();
    await players[i]
      .getByRole("button", { name: "ทอยเต๋า • รับบัตรพีระมิด", exact: true })
      .click();
  }
  await expect(display.locator(".room-heading p")).toHaveText(
    "เลือกผลตอบแทนพันธมิตร",
  );
  await expect(
    players[0].getByRole("button", {
      name: "คัดลอกบัตรพีระมิด +1",
      exact: true,
    }),
  ).toBeVisible();
  await players[0]
    .getByRole("button", { name: "คัดลอกบัตรพีระมิด +1", exact: true })
    .click();
  await expect(display.locator(".room-heading p")).toHaveText(
    "เลือกผลตอบแทนพันธมิตร",
  );
  await players[1]
    .getByRole("button", { name: "ไม่คัดลอกบัตร", exact: true })
    .click();
  await expect(display.locator(".room-heading p")).toHaveText(
    /รอบย่อย 2|จบการแข่งขัน/,
  );
  for (const p of [display, ...players]) {
    await expect(p.locator(".players li").first().locator("b")).toContainText(
      "4",
    );
    await expect(p.locator(".players li").nth(1).locator("b")).toContainText(
      "4",
    );
    await expect(p.locator(".players")).not.toContainText("คู่กับ");
  }
  for (const ctx of [...contexts, hostContext]) await ctx.close();
});
