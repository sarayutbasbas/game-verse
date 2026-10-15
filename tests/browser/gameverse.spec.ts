import { GAME_CATALOG } from "../../src/shared/catalog.js";
import { test, expect } from "@playwright/test";
import { testAccount } from "./auth-fixture.js";
test("GameVerse Home filters, Google setup state, Guest/session, profile uploads, shared identity and logout", async ({
  browser,
}) => {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage(),
    errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /GameVerse/ })).toBeVisible();
    await page.getByRole("searchbox", { name: "ค้นหาเกม" }).fill("อูฐ");
    await page.getByLabel("ตอนนี้มีผู้เล่น").selectOption("4");
    await expect(page.locator(".game-cover")).toHaveCount(1);
    await expect(page).toHaveURL(/q=.*players=4/);
    await page.reload();
    await expect(page.locator(".game-cover")).toHaveCount(1);
    await page.getByLabel("ตอนนี้มีผู้เล่น").selectOption("2");
    await expect(
      page.getByText("ไม่พบเกมที่ตรงกัน", { exact: false }),
    ).toBeVisible();
    await page.getByRole("link", { name: "ล้างตัวกรอง", exact: true }).click();
    await expect(page.locator(".game-cover")).toHaveCount(GAME_CATALOG.length);
    await page.screenshot({
      path: "test-results/gameverse-home-mobile.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 1366, height: 1024 });
    await page.screenshot({
      path: "test-results/gameverse-home-desktop.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login?returnTo=%2Fprofile");
    await expect(
      page.getByRole("button", { name: "ล็อกอินด้วย Google" }),
    ).toBeDisabled();
    await page.screenshot({
      path: "test-results/gameverse-login.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "เล่นเป็น Guest" }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await page
      .getByRole("textbox", { name: "ชื่อที่แสดง" })
      .fill("นักเล่น GameVerse");
    await page.getByRole("button", { name: "ยืนยัน" }).click();
    await expect(page.locator("#profile-status")).toHaveText("บันทึกแล้ว");
    await page.reload();
    await expect(
      page.getByRole("textbox", { name: "ชื่อที่แสดง" }),
    ).toHaveValue("นักเล่น GameVerse");
    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "เปลี่ยนรูปโปรไฟล์" }).click();
    await (await chooser).setFiles("test-results/gameverse-home-mobile.png");
    await expect(page.locator("#profile-status")).toHaveText("บันทึกแล้ว");
    await expect(page.locator(".profile-summary img")).toBeVisible();
    await page.screenshot({
      path: "test-results/gameverse-profile.png",
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.getByRole("button", { name: "ใช้รูปเริ่มต้น" }).click();
    await expect(page.locator(".profile-summary img")).toHaveCount(0);
    await page.getByRole("button", { name: "ออกจากระบบ", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator(".account-link")).toHaveAttribute("aria-label", "ล็อกอิน");
    await page.goto("/games/camel-up");
    await expect(
      page.getByRole("button", { name: "สร้างห้องบนจอกลาง" }),
    ).toBeDisabled();
    await testAccount(page);
    await expect(
      page.getByRole("button", { name: "สร้างห้องบนจอกลาง" }),
    ).toBeEnabled();
    await page.getByRole("button", { name: "สร้างห้องบนจอกลาง" }).click();
    await expect(page.locator("#qr")).toBeVisible();
    const code = await page.locator(".room-code strong").innerText();
    const second = await ctx.newPage();
    await second.goto("/");
    await expect(
      second.getByText("Camel Up " + code, { exact: true }),
    ).toBeVisible();
    await expect(second.locator(".recent-games")).toHaveCount(0); // Creating a room isn't starting a game.
    await second.getByRole("link", { name: "เปิดจอกลาง", exact: true }).click();
    await expect(
      second.getByRole("button", { name: "เริ่มเกม", exact: true }),
    ).toBeVisible();
    await second.screenshot({
      path: "test-results/gameverse-lobby.png",
      fullPage: true,
    });
    expect(errors).toEqual([]);
  } finally {
    await ctx.close();
  }
});

test("owner controls from phone, public display without account, both players ready and start", async ({
  browser,
}) => {
  const owner = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    }),
    guest = await browser.newContext({ viewport: { width: 390, height: 844 } }),
    shared = await browser.newContext({
      viewport: { width: 1024, height: 768 },
    });
  try {
    const phone = await owner.newPage();
    await phone.goto("/games/dracula-vs-van-helsing");
    await testAccount(phone);
    await phone.getByRole("button", { name: "สร้างห้องบนจอกลาง" }).click();
    await expect(phone.locator("#qr")).toBeVisible();
    const code = await phone.locator(".room-code strong").innerText(),
      display = await shared.newPage();
    await display.goto("/display/" + code);
    await expect(display.locator("#qr")).toBeVisible();
    await expect(display.locator("#start")).toHaveCount(0);
    await phone.goto("/play/" + code);
    await phone.getByRole("button", { name: "เข้าห้อง", exact: true }).click();
    await expect(
      phone.getByRole("heading", { name: "คุณเข้าห้องแล้ว" }),
    ).toBeVisible();
    await phone.getByRole("button", { name: "Dracula", exact: true }).click();
    await phone.getByRole("button", { name: "พร้อมเล่น", exact: true }).click();
    const other = await guest.newPage();
    await other.goto("/play/" + code);
    await other.getByRole("textbox", { name: "ชื่อของคุณ" }).fill("ผู้ล่า");
    await other.getByRole("button", { name: "เข้าห้อง", exact: true }).click();
    await expect(
      other.getByRole("heading", { name: "คุณเข้าห้องแล้ว" }),
    ).toBeVisible();
    await other
      .getByRole("button", { name: "Van Helsing", exact: true })
      .click();
    await other.getByRole("button", { name: "พร้อมเล่น", exact: true }).click();
    await expect(
      phone.getByRole("button", { name: "เริ่มเกม", exact: true }),
    ).toBeEnabled();
    await expect(other.locator("#start")).toHaveCount(0);
    await phone.screenshot({
      path: "test-results/gameverse-owner-phone.png",
      fullPage: true,
    });
    await phone.getByRole("button", { name: "เริ่มเกม", exact: true }).click();
    await expect(display.locator(".district-map")).toBeVisible();
    await expect(
      phone.locator('[data-side="dracula"] [data-card="revealed"]'),
    ).toHaveCount(5);
    await expect(
      other.locator('[data-side="helsing"] [data-card="revealed"]'),
    ).toHaveCount(5);
  } finally {
    await owner.close();
    await guest.close();
    await shared.close();
  }
});
