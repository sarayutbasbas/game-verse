import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { mkdtemp, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startServer } from '../../src/server/index.js';
import { testAccount } from './auth-fixture.js';
import { botAction, seeded } from '../locus-fixtures.js';
import { validateLocusState } from '../../src/games/locus/validation.js';
import type { LocusView, LocusAction } from '../../src/games/locus/types.js';
const read = (p: Page): Promise<LocusView> => p.evaluate(() => (window as any).__view);
async function capture(p: Page) { await p.addInitScript(() => { (window as any).__frames = []; window.WebSocket = new Proxy(window.WebSocket, { construct(T, args) { const ws = new T(args[0], args[1]); ws.addEventListener('message', e => { const m = JSON.parse(e.data); (window as any).__frames.push(m); if (m.type === 'state')
        (window as any).__view = m.view; }); return ws; } }); }); }
const rev = async (p: Page, n: number) => expect.poll(async () => (await read(p))?.revision).toBe(n);
test('Locus real phone game: mixed modes, retained preview, touch shapes, bonuses, coins, reconnect and final modal', async ({ browser }) => {
    test.setTimeout(600000);
    const dir = await mkdtemp(join(tmpdir(), 'locus-browser-')), app = await startServer(0, '127.0.0.1', true, seeded(42), { storePath: join(dir, 'db.sqlite') }), url = `http://localhost:${(app.server.address() as any).port}`, contexts: BrowserContext[] = [], errors: string[] = [];
    await mkdir('data/qa-locus', { recursive: true });
    const make = async (mobile = false, width = mobile ? 390 : 1440, height = mobile ? 844 : 1000) => { const c = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile }); contexts.push(c); const p = await c.newPage(); p.setDefaultTimeout(10000); await capture(p); p.on('pageerror', e => errors.push(e.message)); return p; };
    const times = new Map<Page, number[]>();
    const pace = async (p: Page) => { const a = (times.get(p) ?? []).filter(t => t > Date.now() - 10000); if (a.length >= 26)
        await p.waitForTimeout(a[0] + 10020 - Date.now()); a.push(Date.now()); times.set(p, a); };
    try {
        const host = await make();
        await host.goto(url + '/games/locus');
        await testAccount(host, app);
        await host.locator('#ck-entry-mode').selectOption('shared-table');
        await host.locator('#create').click();
        await expect(host.locator('#qr')).toBeVisible();
        const code = await host.locator('.room-code strong').innerText();
        const phones: Page[] = [];
        for (let i = 0; i < 2; i++) {
            const p = await make(true, i ? 360 : 390, i ? 780 : 844);
            phones.push(p);
            await p.goto(url + '/play/' + code);
            await p.getByRole('textbox', { name: 'ชื่อของคุณ' }).fill('ชื่อเดียวกัน');
            await p.getByRole('button', { name: 'เข้าห้อง', exact: true }).click();
            await p.locator('#lobby-ready').click();
        }
        await host.locator('#start').click();
        await expect(host.locator('.lc-root')).toBeVisible();
        await phones[1].locator('#lc-mode').selectOption('full-mobile');
        await expect(phones[0].locator('.lc-market')).toHaveClass(/numbers/);
        await expect(phones[1].locator('.lc-market')).toHaveClass(/full/);
        const display = await make(false, 1024, 768);
        await display.goto(url + '/display/' + code);
        await expect(display.locator('.lc-root')).toBeVisible();
        expect((await read(display)).me).toBeUndefined();
        await display.screenshot({ path: 'data/qa-locus/ipad-overview.png', fullPage: true });
        await host.screenshot({ path: 'data/qa-locus/desktop-overview.png', fullPage: true });
        await phones[1].screenshot({ path: 'data/qa-locus/phone-overview.png', fullPage: true });
        let steps = 0, previewChecked = false, recovered = false, combo = false, coins = false;
        const place = async (p: Page, a: Extract<LocusAction, {
            type: 'locus-place';
        }>, testPreview = false) => {
            const v = await read(p);
            if (v.players.find(x => x.id === v.me!.id)!.effects[0]?.id !== a.effect)
                await p.locator(`[data-effect="${a.effect}"]`).click();
            await p.locator(`[data-zoom="${a.zone}"]`).click();
            for (let i = 0; i < a.rotation; i++)
                await p.locator('#lc-rotate').click();
            if (a.mirror)
                await p.locator('#lc-mirror').click();
            if (a.wild)
                await p.locator('#lc-wild').check();
            await p.locator(`[data-cell="${a.zone}:${a.x},${a.y}"]`).click();
            await expect(p.locator('#lc-confirm')).toBeEnabled();
            if (testPreview) {
                const seq = (await read(p)).sequence, ghost = await p.locator('.ghost').count();
                await p.locator('#lc-mode').selectOption('full-mobile');
                await expect(p.locator('#lc-confirm')).toBeEnabled();
                expect(await p.locator('.ghost').count()).toBe(ghost);
                expect((await read(p)).sequence).toBe(seq);
                await p.screenshot({ path: 'data/qa-locus/phone-preview.png', fullPage: true });
                await p.locator('#lc-mode').selectOption('shared-table');
                const other = phones.find(other => other !== p)!, ov = await read(other);
                if (ov.me?.legal.picks.length) {
                    const y = await p.evaluate(() => scrollY), sameGhost = await p.locator('.ghost').count();
                    await pace(other);
                    await other.locator(`[data-pick="${ov.me.legal.picks[0]}"]`).click();
                    await expect.poll(async () => (await read(p)).revision).toBeGreaterThan(ov.revision);
                    await expect(p.locator('#lc-confirm')).toBeEnabled();
                    expect(await p.locator('.ghost').count()).toBe(sameGhost);
                    expect(await p.evaluate(() => scrollY)).toBe(y);
                }
            }
            await p.locator('#lc-confirm').click();
        };
        while (app.rooms.rooms.get(code)!.locus!.phase !== 'finished' && steps++ < 1800) {
            const s = app.rooms.rooms.get(code)!.locus!, v = await read(host);
            let found = false;
            for (let i = 0; i < 2; i++) {
                const id = s.players[i].id, a = botAction(s, id);
                if (!a)
                    continue;
                found = true;
                const p = phones[i];
                await pace(p);
                await rev(p, v.revision);
                if (a.type === 'locus-pick')
                    await p.locator(`[data-pick="${a.slot}"]`).click();
                else if (a.type === 'locus-place') {
                    await place(p, a, !previewChecked);
                    previewChecked = true;
                }
                else if (a.type === 'locus-discard' || a.type === 'locus-skip') {
                    await p.locator(`[data-effect="${a.effect}"]`).click();
                    await p.locator('#lc-skip').click();
                }
                else if (a.type === 'locus-coin-blocks') {
                    await p.locator('#lc-two').click();
                    coins = true;
                }
                else if (a.type === 'locus-buy') {
                    await p.locator('#lc-buy').click();
                    coins = true;
                }
                else
                    await p.locator('#lc-done').click();
                const acceptedRevision = app.rooms.rooms.get(code)!.revision;
                await rev(host, acceptedRevision);
                await rev(p, acceptedRevision);
                if (!combo && app.rooms.rooms.get(code)!.locus!.players.some(p => p.effects.some(e => e.kind === 'bonus'))) {
                    combo = true;
                    await p.screenshot({ path: 'data/qa-locus/phone-combo.png', fullPage: true });
                    const saved = structuredClone(app.rooms.rooms.get(code)!.locus);
                    await p.reload();
                    await expect(p.locator('.lc-root')).toBeVisible();
                    await rev(p, acceptedRevision);
                    expect(app.rooms.rooms.get(code)!.locus).toEqual(saved);
                    expect(await p.locator('.lc-x.draw').count()).toBe(0);
                    recovered = true;
                }
                break;
            }
            expect(found).toBeTruthy();
        }
        expect(steps).toBeLessThan(1800);
        expect(previewChecked && combo && recovered && coins).toBeTruthy();
        expect(validateLocusState(app.rooms.rooms.get(code)!.locus)).toBeTruthy();
        await expect(host.getByRole('dialog')).toBeVisible();
        await expect(phones[0].getByRole('dialog')).toBeVisible();
        await host.screenshot({ path: 'data/qa-locus/final-desktop.png' });
        await phones[0].screenshot({ path: 'data/qa-locus/final-phone.png' });
        await phones[0].locator('[data-count="2"]').click();
        await expect(phones[0].locator('td.counting')).toHaveCount(2);
        await phones[0].locator('#lc-close-results').click();
        await expect(phones[0].getByRole('dialog')).toHaveCount(0);
        await expect(host.getByRole('dialog')).toBeVisible();
        await phones[0].emulateMedia({ reducedMotion: 'reduce' });
        await phones[0].locator('#lc-show-results').click();
        await phones[0].locator('#lc-close-results').click();
        await host.locator('#lc-close-results').click();
        await host.locator('#lc-restart').click();
        await expect.poll(async () => (await read(host)).phase).toBe('playing');
        expect((await read(host)).players.every(p => p.coins === 1 && Object.values(p.sheet).flat().length === 0)).toBeTruthy();
        for (const p of [host, display, ...phones]) {
            expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
            const frames = await p.evaluate(() => (window as any).__frames);
            for (const m of frames.filter((x: any) => x.type === 'state')) {
                expect(m.view.deck).toBeUndefined();
                expect(m.view.sessions).toBeUndefined();
            }
        }
        expect(errors).toEqual([]);
    }
    finally {
        for (const c of contexts)
            await c.close();
        await app.close();
        await rm(dir, { recursive: true, force: true });
    }
});
for (const count of [3, 4, 5])
    test(`Locus ${count}-player phone setup, all market cards and next first-player cycle`, async ({ browser }) => {
        const dir = await mkdtemp(join(tmpdir(), 'locus-count-')), app = await startServer(0, '127.0.0.1', true, seeded(42 + count), { storePath: join(dir, 'db.sqlite') }), url = `http://localhost:${(app.server.address() as any).port}`, contexts: BrowserContext[] = [];
        const make = async (mobile = false) => { const c = await browser.newContext({ viewport: mobile ? { width: 360, height: 780 } : { width: 1366, height: 900 }, isMobile: mobile, hasTouch: mobile }); contexts.push(c); const p = await c.newPage(); await capture(p); return p; };
        try {
            const host = await make();
            await host.goto(url + '/games/locus');
            await testAccount(host, app);
            await host.locator('#ck-entry-mode').selectOption('full-mobile');
            await host.locator('#create').click();
            await expect(host.locator('#qr')).toBeVisible();
            const code = await host.locator('.room-code strong').innerText(), phones: Page[] = [];
            for (let i = 0; i < count; i++) {
                const p = await make(true);
                phones.push(p);
                await p.goto(url + '/play/' + code);
                await p.getByRole('textbox', { name: 'ชื่อของคุณ' }).fill('ผู้เล่น ' + (i + 1));
                await p.getByRole('button', { name: 'เข้าห้อง', exact: true }).click();
                await p.locator('#lobby-ready').click();
            }
            await host.locator('#start').click();
            await expect(host.locator('.lc-root')).toBeVisible();
            for (let i = 0; i < count; i++) {
                const p = phones[i];
                await expect(p.locator('.lc-market-slot')).toHaveCount(count + 1);
                await p.locator('[data-pick]:enabled').first().click();
                await expect(p.locator('[data-effect]')).toHaveCount(1);
                await p.locator('#lc-skip').click();
            }
            for (const p of phones)
                await p.locator('#lc-done').click();
            await expect.poll(async () => (await read(host)).deal).toBe(2);
            expect((await read(host)).turn).toBe((await read(phones[1])).me!.id);
            expect((await read(host)).rounds).toBe(({ 3: 5, 4: 4, 5: 3 } as Record<number, number>)[count]);
            await phones[0].screenshot({ path: `data/qa-locus/phone-${count}-players.png`, fullPage: true });
            for (const p of phones)
                expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
        }
        finally {
            for (const c of contexts)
                await c.close();
            await app.close();
            await rm(dir, { recursive: true, force: true });
        }
    });
test('Locus Docker5555 actual shared display and two phones commit a visible shape', async ({ browser, baseURL }) => {
    test.skip(process.env.GAMEVERSE_E2E_DOCKER !== '1' || baseURL !== 'http://localhost:5555', 'Explicit local Docker verification only');
    const { placements, emptyPlayer } = await import('../../src/games/locus/engine.js');
    const contexts: BrowserContext[] = [];
    const make = async (mobile = false) => { const c = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, isMobile: mobile, hasTouch: mobile }); contexts.push(c); const p = await c.newPage(); await capture(p); return p; };
    try {
        const host = await make();
        await host.goto(baseURL + '/games/locus');
        await testAccount(host);
        await host.locator('#ck-entry-mode').selectOption('full-mobile');
        await host.locator('#create').click();
        await expect(host.locator('#qr')).toBeVisible();
        const code = await host.locator('.room-code strong').innerText(), phones: Page[] = [];
        for (let i = 0; i < 2; i++) {
            const p = await make(true);
            phones.push(p);
            await p.goto(baseURL + '/play/' + code);
            await p.getByRole('textbox', { name: 'ชื่อของคุณ' }).fill('ทดสอบ ' + (i + 1));
            await p.getByRole('button', { name: 'เข้าห้อง', exact: true }).click();
            await p.locator('#lobby-ready').click();
        }
        await host.locator('#start').click();
        await expect(host.locator('.lc-root')).toBeVisible();
        const p = phones[0];
        await p.locator('[data-pick]:enabled').first().click();
        await expect(p.locator('[data-effect]')).toHaveCount(1);
        const v = await read(p), me = v.players.find(x => x.id === v.me!.id)!, owner = { ...emptyPlayer(me.id, me.name), sheet: me.sheet, coins: me.coins }, e = v.me!.legal.effects[0], a = placements(owner, e).find(a => !a.wild)!;
        await p.locator(`[data-zoom="${a.zone}"]`).click();
        for (let i = 0; i < a.rotation; i++)
            await p.locator('#lc-rotate').click();
        if (a.mirror)
            await p.locator('#lc-mirror').click();
        await p.locator(`[data-cell="${a.zone}:${a.x},${a.y}"]`).click();
        await expect(p.locator('#lc-confirm')).toBeEnabled();
        await p.locator('#lc-confirm').click();
        await expect.poll(async () => Object.values((await read(p)).players[0].sheet).flat().length).toBe(e.cells.length);
        await expect.poll(async () => Object.values((await read(host)).players[0].sheet).flat().length).toBe(e.cells.length);
        expect((await read(host)).me).toBeUndefined();
        expect((await host.request.get(baseURL + '/health')).ok()).toBeTruthy();
        await host.screenshot({ path: 'data/qa-locus/docker-display.png', fullPage: true });
        await p.screenshot({ path: 'data/qa-locus/docker-phone.png', fullPage: true });
    }
    finally {
        for (const c of contexts)
            await c.close();
    }
});
