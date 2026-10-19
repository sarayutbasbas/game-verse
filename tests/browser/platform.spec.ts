import { GAME_CATALOG } from "../../src/shared/catalog.js";
import { testAccount } from "./auth-fixture.js";
import { test, expect, type BrowserContext } from "@playwright/test";
test("game box gallery and common join UI: errors preserve drafts, pasted code, Enter, duplicate lock, full room, QR and resume", async ({
  browser,
}) => {
  const contexts: BrowserContext[] = [];
  const make = async (mobile = false) => {
    const ctx = await browser.newContext({
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1366, height: 1024 },
      isMobile: mobile,
      hasTouch: mobile,
    });
    contexts.push(ctx);
    return ctx.newPage();
  };
  try {
    const host = await make();
    await host.goto("/");
    await expect(host.locator(".game-cover")).toHaveCount(Math.min(10, GAME_CATALOG.length));
    await expect(host.locator(".all-games .game-box")).toHaveCount(Math.min(10, GAME_CATALOG.length));
    for (const image of await host.locator('.all-games .game-box').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    }
    expect(
      await host
        .locator(".all-games .game-box")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    ).toBeTruthy();
    await host.screenshot({ path: "test-results/portal.png", fullPage: true });
    await host.setViewportSize({ width: 390, height: 844 });
    await host.screenshot({
      path: "test-results/portal-mobile.png",
      fullPage: true,
    });
    expect(
      await host.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await host.setViewportSize({ width: 1366, height: 1024 });
    await host.getByRole('button', { name: 'หน้า 2', exact: true }).click();
    await host
      .getByRole("link", {
        name: "เลือกเล่น Dracula vs Van Helsing",
        exact: true,
      })
      .click();
    await testAccount(host);
    await host.getByRole("button", { name: "สร้างห้องบนจอกลาง" }).click();
    await expect(host.locator("#qr")).toBeVisible();
    const code = await host.locator(".room-code strong").innerText();
    expect(
      await host
        .locator("#qr")
        .evaluate((c) =>
          Array.from(
            (c as HTMLCanvasElement)
              .getContext("2d")!
              .getImageData(0, 0, 240, 240).data,
          ).some((x) => x < 100),
        ),
    ).toBeTruthy();
    const phone = await make(true);
    await phone.addInitScript(() => {
      (window as any).__joins = 0;
      window.WebSocket = new Proxy(window.WebSocket, {
        construct(Target, args) {
          const socket = new Target(args[0], args[1]),
            send = socket.send.bind(socket);
          socket.send = (data) => {
            if (JSON.parse(String(data)).type === "join")
              (window as any).__joins++;
            send(data);
          };
          return socket;
        },
      });
    });
    await phone.goto("/join");
    await phone.getByRole("textbox", { name: "รหัสห้อง" }).fill("ZZZZZZ");
    await phone
      .getByRole("textbox", { name: "ชื่อของคุณ" })
      .fill("ชื่อที่เก็บไว้");
    await phone.getByRole("textbox", { name: "ชื่อของคุณ" }).press("Enter");
    await expect(phone.locator("#entry-error")).toContainText("ไม่พบห้อง");
    await expect(
      phone.getByRole("textbox", { name: "ชื่อของคุณ" }),
    ).toHaveValue("ชื่อที่เก็บไว้");
    await expect(phone.getByRole("textbox", { name: "รหัสห้อง" })).toHaveValue(
      "ZZZZZZ",
    );
    await phone.screenshot({
      path: "test-results/join-error.png",
      fullPage: true,
    });
    await phone
      .getByRole("textbox", { name: "รหัสห้อง" })
      .fill(` ${code.toLowerCase()} `);
    await phone.locator("#join").evaluate((form) => {
      (form as HTMLFormElement).requestSubmit();
      (form as HTMLFormElement).requestSubmit();
    });
    await expect(
      phone.getByRole("heading", { name: "คุณเข้าห้องแล้ว" }),
    ).toBeVisible();
    expect(await phone.evaluate(() => (window as any).__joins)).toBe(2);
    await expect(phone.locator("#main")).toHaveClass(/platform-surface/);
    expect(
      await phone.evaluate(
        () => getComputedStyle(document.body, "::before").backgroundImage,
      ),
    ).toContain("/art/platform/tabletop-background.webp");
    const id = await phone.locator(".lobby-players strong").first().innerText();
    await phone.reload();
    await expect(
      phone.getByRole("heading", { name: "คุณเข้าห้องแล้ว" }),
    ).toBeVisible();
    expect(await phone.evaluate(() => (window as any).__joins)).toBe(0);
    await expect(phone.locator(".lobby-players strong").first()).toHaveText(id);
    const second = await make(true);
    await second.goto(`/play/${code}`);
    await expect(second.getByRole("textbox", { name: "รหัสห้อง" })).toHaveCount(
      0,
    );
    await second.getByRole("textbox", { name: "ชื่อของคุณ" }).fill("คนที่สอง");
    await second.screenshot({
      path: "test-results/join-url.png",
      fullPage: true,
    });
    await second.getByRole("textbox", { name: "ชื่อของคุณ" }).press("Enter");
    await expect(
      second.getByRole("heading", { name: "คุณเข้าห้องแล้ว" }),
    ).toBeVisible();
    const third = await make(true);
    await third.goto(`/play/${code}`);
    await third.getByRole("textbox", { name: "ชื่อของคุณ" }).fill("คนที่สาม");
    await third.getByRole("button", { name: "เข้าห้อง", exact: true }).click();
    await expect(third.locator("#entry-error")).toContainText("ห้องเต็ม");
    await expect(
      third.getByRole("textbox", { name: "ชื่อของคุณ" }),
    ).toHaveValue("คนที่สาม");
    // An expired credential is rejected by the server and returns to the same
    // common form; valid player identities remain untouched.
    const expired = await make(true);
    await expired.goto("/join");
    await expired.evaluate(
      (code) =>
        localStorage.setItem(
          `games:player:${code}`,
          JSON.stringify({ code, role: "player", token: "0".repeat(64) }),
        ),
      code,
    );
    await expired.goto(`/play/${code}`);
    await expect(expired.locator("#entry-error")).toContainText(
      "เซสชันหมดอายุ",
    );
    await expect(
      expired.getByRole("button", { name: "เข้าห้อง", exact: true }),
    ).toBeEnabled();
    expect(
      await expired.evaluate(
        (code) => localStorage.getItem(`games:player:${code}`),
        code,
      ),
    ).toBeNull();
    await host.screenshot({
      path: "test-results/common-lobby-dracula.png",
      fullPage: true,
    });
    const camel = await make();
    await camel.goto("/games/camel-up");
    await expect(camel.locator("#main")).toHaveClass(/platform-surface/);
    expect(
      await camel.evaluate(
        () => getComputedStyle(document.body, "::before").backgroundImage,
      ),
    ).toContain("/art/platform/tabletop-background.webp");
    await testAccount(camel);
    await camel.getByRole("button", { name: "สร้างห้องบนจอกลาง" }).click();
    await expect(camel.locator("#qr")).toBeVisible();
    await camel.screenshot({
      path: "test-results/common-lobby-camel.png",
      fullPage: true,
    });
  } finally {
    for (const ctx of contexts) await ctx.close();
  }
});
