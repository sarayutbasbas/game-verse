import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { test, expect } from '@playwright/test';
import sharp from 'sharp';

test('profile: native photo picker, independent drafts, inline name confirmation and persisted image', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto('/login?returnTo=%2Fprofile');
    await page.getByRole('button', { name: 'เล่นเป็น Guest', exact: true }).click();
    await expect(page).toHaveURL(/\/profile$/);
    const input = page.getByRole('textbox', { name: 'ชื่อที่แสดง' });
    const confirm = page.getByRole('button', { name: 'ยืนยัน', exact: true });
    const original = await input.inputValue();
    await expect(confirm).toBeDisabled();
    await input.fill('ชื่อที่ยังไม่บันทึก');
    await expect(confirm).toBeEnabled();
    await input.fill(original);
    await expect(confirm).toBeDisabled();
    await input.fill('   ');
    await expect(confirm).toBeDisabled();
    await input.fill('ชื่อที่ยังไม่บันทึก');
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'เปลี่ยนรูปโปรไฟล์', exact: true }).click();
    const buffer = await sharp({ create: { width: 80, height: 80, channels: 3, background: '#387885' } }).png().toBuffer();
    await (await chooser).setFiles({ name: 'profile.png', mimeType: 'image/png', buffer });
    await expect(page.locator('#profile-status')).toHaveText('บันทึกแล้ว');
    await expect(input).toHaveValue('ชื่อที่ยังไม่บันทึก');
    await expect(confirm).toBeEnabled();
    let profile = (await (await page.request.get('/api/platform')).json()).profile;
    expect(profile.name).toBe(original);
    const avatar = profile.avatar;
    expect(avatar).toMatch(/^\/avatars\//);
    await expect(page.locator('.profile-summary img')).toHaveAttribute('src', avatar);
    await confirm.click();
    await expect(page.locator('#profile-status')).toHaveText('บันทึกแล้ว');
    await expect(confirm).toBeDisabled();
    if (process.env.GAMEVERSE_E2E_DOCKER === '1') {
      await promisify(execFile)('docker', ['compose', 'up', '--detach', '--force-recreate', '--wait', 'app'], { timeout: 90000 });
    }
    await page.reload();
    await expect(input).toHaveValue('ชื่อที่ยังไม่บันทึก');
    await expect(page.locator('.profile-summary img')).toHaveAttribute('src', avatar);
    profile = (await (await page.request.get('/api/platform')).json()).profile;
    expect(profile.name).toBe('ชื่อที่ยังไม่บันทึก');
    expect(profile.avatar).toBe(avatar);
    expect((await page.request.get(avatar)).ok()).toBeTruthy();
    const boxes = await Promise.all([input.boundingBox(), confirm.boundingBox()]);
    expect(Math.abs(boxes[0]!.y - boxes[1]!.y)).toBeLessThan(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await page.screenshot({ path: 'test-results/profile-mobile.png', fullPage: true });
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.screenshot({ path: 'test-results/profile-ipad.png', fullPage: true });
    await page.getByRole('button', { name: 'ใช้รูปเริ่มต้น' }).click();
    await expect(page.locator('.profile-summary img')).toHaveCount(0);
    await expect(input).toHaveValue('ชื่อที่ยังไม่บันทึก');
    await expect(confirm).toBeDisabled();
    expect(errors).toEqual([]);
  } finally { await ctx.close(); }
});
