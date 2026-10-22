import { test, expect, type Page, type BrowserContext, type Locator } from '@playwright/test';
import { mkdtemp, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startServer } from '../../src/server/index.js';
import {testAccount,createDisplayRoom} from './auth-fixture.js';
import type { CKView, Meal } from '../../src/games/critter-kitchen/types.js';
import { FOODS, TOKEN, CHALLENGE } from '../../src/games/critter-kitchen/data.js';
import { emptyMeal, mealQuality } from '../../src/games/critter-kitchen/scoring.js';
import { seeded,botAction } from '../critter-kitchen-fixtures.js';
import * as ckEngine from '../../src/games/critter-kitchen/engine.js';
async function continueOpening(page:Page){await expect(page.locator('.ck-root')).toBeVisible();if((await read(page)).challengeReveal===1){await page.locator('.ck-challenge-reveal button').click();await expect(page.locator('.ck-challenge-reveal')).toHaveCount(0);}}
const read = (p: Page): Promise<CKView> => p.evaluate(() => (window as any).__view);
async function capture(p: Page) { await p.addInitScript(() => { (window as any).__frames = []; window.WebSocket = new Proxy(window.WebSocket, { construct(T, args) { const ws = new T(args[0], args[1]); ws.addEventListener('message', e => { const m = JSON.parse(e.data); (window as any).__frames.push(m); if (m.type === 'state')
        (window as any).__view = m.view; }); return ws; } }); }); }
async function confirmButton(p:Page, button:Locator) {
    await button.click();
    await expect(p.locator('.ck-choice-dialog')).toBeVisible();
    expect(await p.evaluate(()=>document.activeElement?.id)).not.toMatch(/ck-choice-(cancel|confirm)/);
    await p.locator('#ck-choice-confirm').evaluate((button:HTMLButtonElement)=>{button.click();button.click();});
    await expect(p.locator('.ck-choice-dialog')).toHaveCount(0);
}
async function clearPlate(p:Page){
    for(let guard=0;guard<150;guard++){const remove=p.locator('[data-remove],[data-remove-broth]').first();if(!await remove.count())break;await remove.click();}
    await expect(p.locator('.ck-dish-item')).toHaveCount(0);
}
async function inspectChefAndClose(p:Page,id:string){
    await p.locator(`[data-chef="${id}"]`).click();
    await expect(p.locator('.ck-chef-detail')).toBeVisible();
    await expect(p.locator('.ck-chef-detail')).toContainText('ถือได้');
    const spacing=await p.locator('.ck-chef-description').evaluate(el=>{const a=el.querySelector('span')!.getBoundingClientRect(),b=el.querySelector('p')!.getBoundingClientRect();return b.top-a.bottom;});expect(spacing).toBeLessThanOrEqual(8);
    await expect.poll(()=>p.locator('.ck-chef-detail img').evaluate((e:HTMLImageElement)=>e.naturalWidth)).toBeGreaterThan(0);
    await expect(p.locator('.ck-close')).toHaveCSS('background-color','rgb(255, 251, 237)');await expect(p.locator('.ck-close')).toHaveCSS('border-top-width','2px');await expect(p.locator('.ck-close')).toHaveCSS('border-radius','50%');
    await p.keyboard.press('Escape');await expect(p.locator('.ck-dialog')).toHaveCount(0);
}
async function dragChefTo(p:Page,id:string,location:string){
    await p.locator('.ck-route-planner').scrollIntoViewIfNeeded();
    const target=p.locator(`[data-destination="${location}"]`);await target.scrollIntoViewIfNeeded();
    const from=await p.locator(`[data-chef="${id}"]`).boundingBox(),to=await target.boundingBox();
    await p.mouse.move(from!.x+from!.width/2,from!.y+from!.height/2);await p.mouse.down();await p.mouse.move(to!.x+to!.width*.75,to!.y+to!.height/2,{steps:8});await p.mouse.up();
    await expect(target.locator('.ck-placed-chef')).toHaveAttribute('data-placed-chef',id);await expect(p.locator('.ck-dialog')).toHaveCount(0);
}
async function startMarket(p:Page){
    const before=Date.now();await p.locator('[data-action="ck-run"]').click();
    await expect(p.locator('.ck-market-departure')).toBeVisible();await expect(p.locator('.ck-market-departure .ck-runner')).toHaveCount(3);
    await expect(p.locator('.ck-market-departure')).toHaveCount(0,{timeout:5000});expect(Date.now()-before).toBeGreaterThanOrEqual(1850);
}
const revision = async (p: Page, n: number) => expect(p.locator('#main')).toHaveAttribute('data-revision', String(n));
function dishes(v: CKView) {
    const me = v.me!, p = v.players.find(p => p.id === me.id)!, ctx = { critic: v.critic, round: v.round, challenges: v.challenges.map(c => c.id ?? '') }, owner = { storage: me.storage, soup: me.soup, bisque: me.bisque, known: me.rumorTokens, restaurateur: p.restaurateur };
    let pool = [...me.storage], soup = me.soup, bisque = me.bisque;
    const meals: Meal[] = [];
    for (let i = 0; i < 3; i++) {
        const req = CHALLENGE[ctx.challenges[(v.round === 3 ? 0 : 3) + i]].foods.slice(0, i === 2 ? 2 : 3), m = emptyMeal(), ids: string[] = [];
        for (const f of req) {
            const id = pool.filter(t => TOKEN[t].kind === 'ingredient' && TOKEN[t].food === f).sort((a, b) => TOKEN[b].value! - TOKEN[a].value!)[0];
            if (id) {
                m.items.push({ token: id, as: f });
                ids.push(id);
                pool = pool.filter(t => t !== id);
            }
        }
        let ok = !!m.items.length;
        const missing = req.filter(f => !m.items.some(a => a.as === f)).length;
        for (let k = 0; k < missing; k++) {
            if (m.soup < soup)
                m.soup++;
            else if (m.bisque < bisque)
                m.bisque++;
            else
                ok = false;
        }
        while (ok && mealQuality(ctx, owner, m, true) < 6) {
            if (m.soup < soup)
                m.soup++;
            else if (m.bisque < bisque)
                m.bisque++;
            else
                ok = false;
        }
        if (ok) {
            soup -= m.soup;
            bisque -= m.bisque;
            meals.push(m);
        }
        else {
            pool.push(...ids);
            meals.push(emptyMeal());
        }
    }
    return meals;
}
for (const count of [2, 3])
    test(`Critter Kitchen ${count} players: real mobile actions through seven rounds, both modes, privacy and summary`, async ({ browser }) => {
        test.setTimeout(600000);
        const dir = await mkdtemp(join(tmpdir(), 'ck-browser-')), app = await startServer(0, '127.0.0.1', true, seeded(752 + count), { storePath: join(dir, 'rooms.sqlite') }), url = `http://localhost:${(app.server.address() as any).port}`, contexts: BrowserContext[] = [], errors: string[] = [];
        await mkdir('data/qa-critter-kitchen', { recursive: true });
        const make = async (mobile = false) => { const c = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, isMobile: mobile, hasTouch: mobile }); contexts.push(c); const p = await c.newPage(); p.setDefaultTimeout(12000); await capture(p); p.on('pageerror', e => errors.push(e.message)); return p; };
        const times = new Map<Page, number[]>(),previewStars=new Map<string,number>();
        const pace = async (p: Page) => { const t = Date.now(), a = (times.get(p) ?? []).filter(n => n > t - 10000); if (a.length >= 27)
            await p.waitForTimeout(a[0] + 10010 - t); a.push(Date.now()); times.set(p, a); };
        try {
            let host = await make();
            await host.goto(url + '/games/critter-kitchen');
            await testAccount(host, app);
            await host.locator('#ck-entry-mode').selectOption(count === 2 ? 'shared-table' : 'full-mobile');
            await createDisplayRoom(host);
            await expect(host.locator('#qr')).toBeVisible();
            const code = await host.locator('.room-code strong').innerText(), phones: Page[] = [];
            for (let i = 0; i < count; i++) {
                const p = await make(true);
                phones.push(p);
                await p.goto(url + '/play/' + code);
                await p.getByRole('textbox', { name: 'ชื่อของคุณ' }).fill('เชฟ ' + i);
                await p.getByRole('button', { name: 'เข้าห้อง', exact: true }).click();
                await p.getByRole('button', { name: 'พร้อมเล่น', exact: true }).click();
            }
            await host.locator('#ck-tutorial').check();
            await host.locator('#ck-restaurateurs').check();
            await host.locator('#start').click();await continueOpening(host);
            await expect(host.locator('.ck-root')).toHaveAttribute('data-phase', 'restaurateurs');
            for (const p of phones)
                await confirmButton(p, p.locator('[data-rest]').first());
            await expect(host.locator('.ck-root')).toHaveAttribute('data-phase', 'planning');
            expect((await read(host)).me).toBeUndefined();
            for (const size of [{width:1440,height:1000},{width:1024,height:768}]) {
                await host.setViewportSize(size);
                expect(await host.evaluate(()=>document.documentElement.scrollHeight)).toBeLessThanOrEqual(size.height+2);
            }
            await host.setViewportSize({width:1440,height:1000});
            for(const page of [host,...phones])if(await page.locator('.ck-challenge-reveal').isVisible())await page.locator('.ck-challenge-reveal button').click();
            const ui=phones[0];
            for(const size of [{width:390,height:844},{width:390,height:620},{width:320,height:568}]){
                await ui.setViewportSize(size);
                expect(await ui.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(size.width);
                if(count===2)expect(await ui.evaluate(()=>document.documentElement.scrollHeight)).toBeLessThanOrEqual(size.height+2);
            }
            await ui.setViewportSize({width:390,height:844});
            await ui.locator('#ck-help-button').click();await expect(ui.locator('.ck-dialog')).toContainText('การนับคะแนน');await ui.mouse.click(1,1);await expect(ui.locator('.ck-dialog')).toHaveCount(0);
            await ui.locator('.ck-menu > summary').click();await expect(ui.locator('#ck-mode')).toBeVisible();await ui.mouse.click(2,400);await expect(ui.locator('#ck-mode')).not.toBeVisible();
            const home=ui.locator('[data-tab="kitchen"]'),market=ui.locator('[data-tab="board"]');
            await expect(home).toHaveAttribute('aria-label','ครัวของคุณ');await expect(market).toHaveAttribute('aria-label','ตลาดกลาง');
            const navSize=await home.boundingBox();expect(navSize!.height).toBe(navSize!.width);
            await market.click();await expect(market).toHaveAttribute('aria-pressed','true');await expect(ui.locator('.ck-board')).toBeVisible();await expect(ui.locator('.ck-board .ck-location-caption>strong').first()).toHaveCSS('background-color','rgba(0, 0, 0, 0)');await expect(ui.locator('.ck-market-tabs')).toHaveCount(0);await expect(ui.locator('.ck-board .ck-location:visible')).toHaveCount((await read(ui)).config.locations.length);const destinations=await ui.locator('.ck-board .ck-location').evaluateAll(es=>es.map(e=>e.getBoundingClientRect()));expect(destinations.every((r,i)=>i===0||r.top>=destinations[i-1].bottom)).toBe(true);await expect(ui.locator('.ck-board .ck-market-stock .ck-token').first()).toHaveCSS('height','114px');await expect(ui.locator('.ck-board .ck-queues')).toHaveCount(0);await expect(ui.locator('.ck-board .ck-location>header').first()).toHaveCSS('height','68px');await expect(ui.locator('.ck-board')).toHaveCSS('overflow-y','visible');await ui.locator('.ck-board .ck-location').last().scrollIntoViewIfNeeded();expect(await ui.evaluate(()=>scrollY)).toBeGreaterThan(0);expect(await ui.locator('.ck-board').evaluate(e=>e.scrollTop)).toBe(0);await ui.screenshot({path:'data/qa-critter-kitchen/market-icon-nav.png',fullPage:true});await home.click();
            await ui.screenshot({path:'data/qa-critter-kitchen/compact-planning.png'});
            if(count===2){
                const own=await read(ui),locs=own.config.locations;
                const drag=async(id:string,loc:string,touch=false,placed=false)=>{
                    const a=await ui.locator(placed?`.ck-route-planner [data-placed-chef="${id}"]`:`.ck-route-planner [data-chef="${id}"]`).boundingBox(),b=await ui.locator(`.ck-route-planner [data-destination="${loc}"]`).boundingBox();
                    expect(a).toBeTruthy();expect(b).toBeTruthy();const x=a!.x+a!.width/2,y=a!.y+a!.height/2,tx=b!.x+b!.width/2,ty=b!.y+b!.height/2;
                    const visibleGhost=async()=>{
                        const geometry=await ui.locator('.ck-chef-ghost').evaluate(e=>({outer:e.getBoundingClientRect().height,face:e.querySelector('.ck-chef-face')!.getBoundingClientRect().height,portrait:e.querySelector('.ck-chef-portrait')!.getBoundingClientRect().height,opacity:getComputedStyle(e).opacity}));
                        expect(geometry.face,JSON.stringify(geometry)).toBeGreaterThan(geometry.outer*.85);expect(geometry.portrait,JSON.stringify(geometry)).toBeGreaterThan(geometry.outer*.35);expect(geometry.opacity).toBe('1');
                        await expect.poll(()=>ui.locator('.ck-chef-ghost img').evaluate((e:HTMLImageElement)=>e.naturalWidth)).toBeGreaterThan(0);
                        await expect.poll(()=>ui.locator('.ck-chef-ghost').evaluate((e,{tx,ty})=>Math.max(Math.abs(parseFloat((e as HTMLElement).style.left)-tx),Math.abs(parseFloat((e as HTMLElement).style.top)-ty)),{tx,ty})).toBeLessThan(1);
                        await ui.screenshot({path:`data/qa-critter-kitchen/drag-ghost-${placed?'placed':'hand'}-${touch?'touch':'mouse'}.png`});
                    };
                    if(touch){const cdp=await ui.context().newCDPSession(ui);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+(tx-x)*i/8,y:y+(ty-y)*i/8}]});expect(await ui.locator('.ck-chef-ghost').evaluate(e=>parseFloat((e as HTMLElement).style.height))).toBeGreaterThan(a!.height-(placed?5:0));await visibleGhost();await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
                    else{await ui.mouse.move(x,y);await ui.mouse.down();await ui.mouse.move(tx,ty,{steps:10});expect(await ui.locator('.ck-chef-ghost').evaluate(e=>parseFloat((e as HTMLElement).style.height))).toBeGreaterThan(a!.height-(placed?5:0));await visibleGhost();await ui.mouse.up();}
                    await expect(ui.locator(`[data-destination="${loc}"] .ck-placed-chef b`)).toHaveCount(1);await expect(ui.locator('.ck-dialog')).toHaveCount(0);await expect(ui.locator('.ck-chef-ghost')).toHaveCount(0);
                };
                const rev=own.revision;
                await inspectChefAndClose(ui,own.me!.chefIds[0]);expect((await read(ui)).revision).toBe(rev);
                await ui.locator(`[data-destination="${locs[0].id}"] .ck-route-name`).click();await expect(ui.locator('.ck-placed-chef')).toHaveCount(0);await expect(ui.locator('#ck-commit')).toHaveCount(0);

                await drag(own.me!.chefIds[0],locs[0].id,true);
                await drag(own.me!.chefIds[1],locs[1].id);
                await drag(own.me!.chefIds[0],locs[1].id); // occupied destination swaps assignments
                await ui.locator(`[data-destination="${locs[1].id}"] .ck-route-name`).click();await expect(ui.locator(`[data-destination="${locs[1].id}"] .ck-placed-chef`)).toHaveAttribute('data-placed-chef',own.me!.chefIds[0]);await expect(ui.locator(`[data-destination="${locs[0].id}"] .ck-placed-chef`)).toHaveAttribute('data-placed-chef',own.me!.chefIds[1]);

                await expect(ui.locator(`[data-destination="${locs[0].id}"] .ck-placed-chef b`)).toHaveText('เชฟกิ้งก่า');
                await drag(own.me!.chefIds[2],locs[2].id);
                await drag(own.me!.chefIds[2],locs[3].id,true,true);await expect(ui.locator(`[data-destination="${locs[2].id}"] .ck-placed-chef`)).toHaveCount(0);
                await drag(own.me!.chefIds[2],locs[2].id,false,true);await expect(ui.locator(`[data-destination="${locs[3].id}"] .ck-placed-chef`)).toHaveCount(0);
                await expect(ui.locator(`[data-destination="${locs[2].id}"] .ck-placed-chef`)).not.toHaveCSS('box-shadow','none');
                await ui.locator(`[data-destination="${locs[2].id}"] .ck-placed-chef`).click();await expect(ui.locator('.ck-chef-detail')).toBeVisible();await expect(ui.locator('.ck-chef-detail')).toContainText('เชฟหมูป่า');await expect.poll(()=>ui.locator('.ck-chef-detail img').evaluate((e:HTMLImageElement)=>e.naturalWidth)).toBeGreaterThan(0);await ui.screenshot({path:'data/qa-critter-kitchen/chef-tap-detail.png'});await ui.keyboard.press('Escape');await expect(ui.locator(`[data-destination="${locs[2].id}"] .ck-placed-chef b`)).toHaveText('เชฟหมูป่า');

                expect((await read(ui)).revision).toBe(rev);expect((await read(ui)).me!.plan).toBeNull();
                await ui.locator('#ck-commit').click();await expect(ui.locator('.ck-choice-dialog')).toBeVisible();
                await expect(ui.locator('.ck-review-route')).toHaveCount(3);
                await expect(ui.locator('.ck-review-route .ck-chef-portrait')).toHaveCount(3);
                await expect(ui.locator('.ck-review-route .ck-review-destination b')).toHaveText([locs[1].name,locs[0].name,locs[2].name]);
                await ui.screenshot({path:'data/qa-critter-kitchen/chef-route-confirm.png'});
                await ui.setViewportSize({width:320,height:568});
                const review=await ui.locator('.ck-choice-dialog .ck-dialog-body').evaluate(e=>({scroll:e.scrollHeight,client:e.clientHeight}));expect(review.scroll).toBeLessThanOrEqual(review.client+2);
                const portraits=await ui.locator('.ck-review-route .ck-chef-face').evaluateAll(es=>es.map(e=>({face:e.getBoundingClientRect().height,portrait:e.querySelector('.ck-chef-portrait')!.getBoundingClientRect().height})));expect(portraits.every(r=>r.portrait>r.face*.45)).toBe(true);
                await ui.screenshot({path:'data/qa-critter-kitchen/chef-route-confirm-320.png'});
                await ui.setViewportSize({width:390,height:844});await ui.locator('#ck-choice-cancel').click();
                await ui.screenshot({path:'data/qa-critter-kitchen/chef-drag-mobile.png'});
                await expect(ui.locator('#ck-clear-plan')).toHaveCount(0);await expect(ui.locator('.ck-placed-chef')).toHaveCount(3);await expect(ui.locator('#ck-commit')).toBeVisible();
                await host.screenshot({path:'data/qa-critter-kitchen/chef-locations-display.png'});
            }


            const display = host;
            if (count === 3) {
                await display.goto(url + '/');
                host = phones[0];
            }
            let actions = 0, recovered = false, scored = false, fridge = false, spiceChecked=false, rumorChecked=0;
            while ((await read(host)).phase !== 'finished' && actions++ < 1000) {
                const v = await read(host);
                if(v.challengeReveal!==undefined){await revision(phones[0],v.revision);await phones[0].locator('.ck-challenge-reveal button').click();await revision(host,v.revision+1);continue;}
                let p: Page;
                if (v.phase === 'planning') {
                    p = phones.find((_p, i) => !v.players[i].committed)!;
                    await pace(p);
                    await revision(p, v.revision);
                    if(await p.locator('.ck-challenge-reveal').isVisible())await p.locator('.ck-challenge-reveal button').click();
                    const own = await read(p);
                    const locs = own.config.locations.map(l => l.id), offset = (v.round + v.players.findIndex(x => x.id === own.me!.id)) % locs.length;
                    for (const [i, id] of own.me!.chefIds.entries()) {
                        await inspectChefAndClose(p,id);
                        await dragChefTo(p,id,locs[(i+offset)%locs.length]);
                    }
                    const rev = v.revision;
                    expect((await read(host)).revision).toBe(rev);
                    await confirmButton(p, p.locator('#ck-commit'));
                    if (!recovered) {
                        await revision(p, rev + 1);
                        const previous = await read(p);
                        await p.reload();
                        await expect(p.locator('.ck-root')).toHaveAttribute('data-phase', 'planning');
                        expect((await read(p)).me!.plan).toEqual(previous.me!.plan);
                        recovered = true;
                        await p.screenshot({ path: `data/qa-critter-kitchen/planning-${count}-mobile.png`, fullPage: true });
                    }
                }
                else if (v.phase === 'running') {
                    p = host;
                    await pace(p);
                    await startMarket(p);
                }
                else if (v.phase === 'shopping') {
                    p = phones[v.players.findIndex(x => x.id === v.turn)];
                    await revision(p, v.revision);
                    await pace(p);
                    const own = await read(p);
                    if (v.decision?.kind === 'rumor'){
                        rumorChecked++;
                        await expect(p.locator('[data-rumor]')).toHaveCount(3);
                        for(let i=0;i<3;i++){const option=p.locator(`[data-rumor="${i}"]`);await expect(option.locator('img')).toHaveAttribute('src',/back-rumor\.webp$/);if(!own.me!.rumorChoices.includes(i)){await expect(option).toBeDisabled();await expect(option).toHaveCSS('filter','grayscale(1)');}}
                        const layout=await p.locator('.ck-rumor-slot').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().toJSON()));
                        expect(Math.abs(layout[0].y-layout[1].y)).toBeLessThan(2);expect(layout[2].y).toBeGreaterThan(layout[0].bottom);
                        expect(Math.abs(layout[2].x+layout[2].width/2-(layout[0].x+layout[1].right)/2)).toBeLessThan(2);
                        await p.screenshot({path:`data/qa-critter-kitchen/rumor-options-${count}.png`});
                        await expect(p.locator('[data-rumor-buy]')).toHaveCount(own.me!.rumorChoices.length);
                        await confirmButton(p,p.locator(`[data-rumor-buy="${own.me!.rumorChoices[0]}"]`));
                    }
                    else if (v.decision?.kind === 'consolation')
                        await confirmButton(p, p.locator('[data-reward="soup"]'));
                    else {
                        for(const unavailable of await p.locator('.ck-picks .ck-rumor-unavailable').all()){
                            await expect(unavailable.locator('.ck-rumor-face')).toHaveCSS('filter','grayscale(1)');
                            await expect(unavailable.locator('[data-buy]')).toHaveCount(0);
                        }
                        await expect(p.locator('[data-tab="board"]')).toBeDisabled();
                        await expect(p.locator('.ck-picks')).toHaveCSS('display','grid');
                        if(await p.locator('.ck-picks .ck-pick-card').count()>=5)await expect(p.locator('.ck-picks')).toHaveAttribute('data-rows','2');
                        const marketCells=await p.locator('.ck-picks .ck-pick-card').evaluateAll(els=>els.map(el=>({row:Number((el as HTMLElement).style.gridRow),column:Number((el as HTMLElement).style.gridColumn)})));
                        const topCount=marketCells.filter(cell=>cell.row===1).length,bottomCount=marketCells.filter(cell=>cell.row===2).length;
                        expect(topCount).toBeGreaterThanOrEqual(bottomCount);if(marketCells.length===5)await p.screenshot({path:`data/qa-critter-kitchen/five-offers-${count}.png`});if(marketCells.length>=5&&marketCells.length<=8){expect(topCount).toBe(4);expect(bottomCount).toBe(marketCells.length-4);}else if(bottomCount)expect(topCount-bottomCount).toBeLessThanOrEqual(1);
                        await expect(p.locator('.ck-pick-toolbar')).toHaveCount(0);
                        if(actions<25){
                            for(const size of [{width:320,height:568},{width:390,height:844}]){
                                await p.setViewportSize(size);
                                await expect.poll(()=>p.locator('.ck-action').evaluate(el=>el.scrollHeight<=el.clientHeight+1)).toBe(true);
                                await expect.poll(()=>p.locator('.ck-kitchen').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight+1)).toBe(true);
                            }
                            await p.screenshot({path:`data/qa-critter-kitchen/shop-fit-${count}.png`});
                        }
                        const ingredients=p.locator('.ck-picks .ingredient>img'),spices=p.locator('.ck-picks .spice>img');
                        if(await ingredients.count()&&await spices.count()){const a=await ingredients.first().boundingBox(),b=await spices.first().boundingBox();expect(Math.abs(a!.width-b!.width)).toBeLessThan(1);expect(Math.abs(a!.height-b!.height)).toBeLessThan(1);spiceChecked=true;}
                        const specificSpice=own.me!.choices.find(id=>TOKEN[id]?.kind==='spice'&&TOKEN[id].food!=='all');
                        if(specificSpice){const spice=p.locator(`.ck-picks [data-pick="${specificSpice}"]`);await expect(spice.locator('.ck-resource-heading')).toHaveCSS('font-size','19px');await expect(spice.locator('.ck-spice-badge')).toHaveCSS('width','32px');await expect(spice.locator('img.ck-resource-icon')).toHaveAttribute('src',new RegExp(`ingredient-${TOKEN[specificSpice].food}\\.webp$`));await expect(spice.locator('.ck-spice-badge img')).toBeVisible();}
                        const rumorPriority=count===3?(own.me!.choices.find(id=>TOKEN[id]?.kind==='rumor'&&(own.me!.known.some(Boolean)?TOKEN[id].rumor===3:TOKEN[id].rumor!==3))??own.me!.choices.find(id=>TOKEN[id]?.kind==='rumor')):undefined;
                        const id = rumorPriority ?? own.me!.choices.find(id => id.startsWith('zous:')) ?? own.me!.choices.filter(id => TOKEN[id]?.kind === 'ingredient').sort((a, b) => TOKEN[b].value! - TOKEN[a].value!)[0] ?? own.me!.choices[0];
                        if(id.startsWith('zous:')){const offer=p.locator(`.ck-picks [data-pick="${id}"]`);await expect(offer.locator('.ck-chef-offer-face strong')).toBeVisible();await expect(offer.locator('img')).toHaveCSS('object-fit','cover');await offer.click();await expect(p.locator('.ck-chef-detail')).toBeVisible();expect((await read(host)).revision).toBe(v.revision);await p.keyboard.press('Escape');}
                        const offerOrder=await p.locator('.ck-picks [data-pick]').evaluateAll(es=>es.map(e=>(e as HTMLElement).dataset.pick));
                        await confirmButton(p,p.locator(`.ck-picks [data-buy="${id}"]`));
                        await revision(p,v.revision+1);const afterPick=await read(p);if(afterPick.phase==='shopping'&&afterPick.decision?.loc===own.decision?.loc&&afterPick.decision?.kind==='pick')expect(await p.locator('.ck-picks [data-pick]').evaluateAll(es=>es.map(e=>(e as HTMLElement).dataset.pick))).toEqual(offerOrder);
                    }
                }
                else if (v.phase === 'challenge') {
                    p = phones[v.players.findIndex(x => !x.committed)];
                    await revision(p, v.revision);
                    await pace(p);
                    const own = await read(p), meals = dishes(own);
                    await expect(p.locator('#ck-action>h2')).toHaveCount(0);
                    await expect(p.locator('#ck-restore-meals')).toHaveCount(0);
                    await expect(p.locator('.ck-dish-rail')).toHaveCSS('border-radius','14px');
                    await expect(p.locator('.ck-dish-rail')).toHaveCSS('align-items','center');
                    await expect(p.locator('.ck-dish-rail')).toHaveCSS('justify-content','flex-start');
                    await expect(p.locator('.ck-plate-tabs [data-plate]')).toHaveCount(3);
                    await expect(p.locator('.ck-workspace-heading .ck-stage-name')).toHaveText('เสิร์ฟอาหาร');
                    await expect(p.locator('.ck-workspace-heading .ck-plate-tabs [data-plate]')).toHaveCount(0);
                    await expect(p.locator('.ck-cooking .ck-plate-tabs')).toHaveCount(1);
                    await expect(p.locator('.ck-plate-tabs [data-plate-ready="true"]')).toHaveCount(0);
                    await expect(p.locator('.ck-dish-heading>h3')).toHaveText('เมนูที่ต้องเสิร์ฟ');await expect(p.locator('.ck-score-guide')).toContainText('6+');await expect(p.locator('.ck-score-guide')).toContainText('12+');await expect(p.locator('.ck-score-guide')).toContainText('21+');await expect(p.locator('.ck-score-guide>span strong')).toHaveText(['1','2','4']);
                    await expect(p.locator('.ck-required-food small').first()).toBeVisible();
                    await expect(p.locator('.ck-plate-number').first()).toHaveCSS('background-image',/serving-plate/);
                    const cookingGeometry=await p.evaluate(()=>{
                        const size=(selector:string)=>document.querySelector(selector)!.getBoundingClientRect();
                        const card=size('.ck-cook-source .ck-token');
                        const plates=size('.ck-cooking .ck-plate-tabs'),plate=size('.ck-cooking [data-plate]'),cook=size('.ck-cooking');
                        return {cardHeight:card.height,plateWidth:plate.width,plateHeight:plate.height,centerOffset:Math.abs(plates.x+plates.width/2-cook.x-cook.width/2)};
                    });
                    expect(cookingGeometry.cardHeight).toBe(114);expect(cookingGeometry.plateWidth).toBe(58);expect(cookingGeometry.plateHeight).toBe(58);expect(cookingGeometry.centerOffset).toBeLessThan(1);
                    await expect(p.locator('.ck-recipe-picture').first()).toHaveCSS('width','44px');
                    await expect(p.locator('.ck-recipe-picture').first()).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
                    await expect(p.locator('.ck-recipe-picture').first()).toHaveCSS('box-shadow','none');
                    const ingredientCounts=new Map<string,number>();
                    for(const id of own.me!.storage){const t=TOKEN[id];if(t.kind==='ingredient'){const key=`ingredient:${t.food}:${t.value}`;ingredientCounts.set(key,(ingredientCounts.get(key)??0)+1);}}
                    await expect(p.locator('[data-stock-group]')).toHaveCount(ingredientCounts.size);
                    for(const [key,quantity] of ingredientCounts){const badge=p.locator(`[data-stock-quantity="${key}"]`);await expect(badge).toHaveText(`×${quantity}`);if(quantity<2)await expect(badge).toBeHidden();else{await expect(badge).toBeVisible();await expect(badge).toHaveCSS('width','24px');}}
                    const duplicate=[...ingredientCounts].find(([,quantity])=>quantity>1);
                    if(duplicate){
                        const [key,quantity]=duplicate,group=p.locator(`[data-stock-group="${key}"]`);
                        await group.locator('[data-add]').click();await group.locator('[data-add]').click();
                        await expect(p.locator('.ck-dish-item')).toHaveCount(1);await expect(p.locator('.ck-ingredient-quantity')).toHaveText('×2');
                        await expect(group.locator('[data-stock-quantity]')).toHaveText(`×${quantity-2}`);
                        await p.locator('[data-remove]').click();await expect(p.locator('.ck-ingredient-quantity')).toBeHidden();await expect(group.locator('[data-stock-quantity]')).toHaveText(`×${quantity-1}`);
                        await clearPlate(p);await expect(group.locator('[data-stock-quantity]')).toHaveText(`×${quantity}`);
                        expect((await read(host)).revision).toBe(v.revision);
                    }

                    await expect(p.locator('.ck-broth-stepper')).toHaveCount(0);
                    await expect(p.locator('.ck-cook-source>.ck-pick-card').nth(0).locator('[data-resource="soup"]')).toHaveCount(1);
                    await expect(p.locator('.ck-cook-source>.ck-pick-card').nth(1).locator('[data-resource="bisque"]')).toHaveCount(1);
                    for(const kind of ['soup','bisque'] as const){
                        const stock=p.locator(`[data-remaining="${kind}"]`),add=p.locator(`[data-broth="${kind}"]`);
                        await expect(stock).toHaveText(`×${own.me![kind]}`);
                        if(own.me![kind]){
                            await add.click();await expect(stock).toHaveText(`×${own.me![kind]-1}`);await expect(p.locator('.ck-dish-quantity')).toBeHidden();
                            const ingredient=p.locator('.ck-cook-source [data-add]').first();
                            if(await ingredient.count()){
                                await ingredient.click();
                                const tops=await p.locator('.ck-dish-rail .ck-token').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().top));
                                expect(Math.max(...tops)-Math.min(...tops)).toBeLessThan(1);
                                await p.locator('[data-remove]').click();
                            }

                            await p.locator('[data-plate="1"]').click();await expect(stock).toHaveText(`×${own.me![kind]-1}`);await expect(p.locator(`[data-remove-broth="${kind}"]`)).toHaveCount(0);
                            await p.locator('[data-plate="0"]').click();await p.locator(`[data-remove-broth="${kind}"]`).click();await expect(stock).toHaveText(`×${own.me![kind]}`);
                        }else await expect(add).toHaveCount(0);
                    }
                    const stockIds=await p.locator('.ck-cook-source [data-add]').evaluateAll(els=>els.map(el=>(el as HTMLElement).dataset.add!));
                    for(let i=1;i<stockIds.length;i++)if(TOKEN[stockIds[i-1]].food===TOKEN[stockIds[i]].food)expect(TOKEN[stockIds[i-1]].value!).toBeGreaterThanOrEqual(TOKEN[stockIds[i]].value!);

                    await expect(p.locator('#ck-serve')).toHaveCSS('border-radius','50%');
                    const source=p.locator('.ck-cook-source');
                    await expect.poll(()=>source.evaluate(rail=>{
                        rail.scrollLeft=0;
                        if(rail.scrollWidth<=rail.clientWidth+1)return true;
                        const edge=rail.getBoundingClientRect().right;
                        const next=[...rail.querySelectorAll('.ck-pick-card')].map(el=>el.getBoundingClientRect()).find(r=>r.left<edge&&r.right>edge+1);
                        return !!next&&(edge-next.left)/next.width>.38&&(edge-next.left)/next.width<.42;
                    })).toBe(true);
                    const firstFood=p.locator('.ck-cook-source [data-add]').first();
                    if(await firstFood.count()){
                        const food=await firstFood.getAttribute('data-add');
                        await p.locator('.ck-cook-source [data-token-detail]').first().click();
                        await expect(p.locator('.ck-dialog .ck-token-preview')).toBeVisible();await p.keyboard.press('Escape');
                        expect((await read(host)).revision).toBe(v.revision);
                        await firstFood.click();
                        await expect(p.locator('.ck-dish-item')).toHaveCount(1);
                        await expect(p.locator(`.ck-cook-source [data-add="${food}"]`)).toHaveCount(0);
                        if(!await p.locator('.ck-serve-ready').count())await expect(p.locator('#ck-serve')).toBeDisabled();
                        const spice=p.locator('[data-toggle-spice]').first();
                        if(await spice.isEnabled()){await spice.check();await expect(spice).toBeChecked();await spice.uncheck();}
                        await p.locator('[data-remove]').click();await expect(p.locator('.ck-dish-item')).toHaveCount(0);await expect(p.locator(`.ck-cook-source [data-add="${food}"]`)).toBeVisible();
                        await p.locator(`.ck-cook-source [data-add="${food}"]`).click();
                        await clearPlate(p);await expect(p.locator('.ck-dish-item')).toHaveCount(0);
                        expect((await read(host)).revision).toBe(v.revision);
                    }

                    for (const [i, m] of meals.entries()) {
                        await p.locator(`[data-plate="${i}"]`).click();
                        for (const a of m.items)
                            await p.locator(`[data-add="${a.token}"]`).click();
                        for(const kind of ['soup','bisque'] as const)for(let n=0;n<m[kind];n++)await p.locator(`[data-broth="${kind}"][data-delta="1"]`).click();
                        await expect(p.locator(`[data-plate="${i}"]`)).toHaveAttribute('data-plate-ready',String(m.items.length>0));
                        if(m.items.length){await expect(p.locator(`[data-plate="${i}"] svg`)).toBeVisible();await expect(p.locator(`[data-plate="${i}"] .ck-plate-quality`)).toHaveText(/^\d+$/);await expect(p.locator(`[data-plate="${i}"] .ck-plate-quality`)).toHaveCSS('color','rgb(255, 255, 255)');}else await expect(p.locator(`[data-plate="${i}"] .ck-plate-number`)).toHaveText(String(i+1));
                    }
                    const removeTarget=p.locator('.ck-dish-row .ck-remove-food').first();
                    if(await removeTarget.count())expect(await removeTarget.evaluate(el=>{const r=el.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+4)?.closest('button')===el;})).toBe(true);
                    for(const viewport of [{width:320,height:568},{width:390,height:844}]){
                        await p.setViewportSize(viewport);
                        await expect.poll(()=>p.locator('#ck-action').evaluate(frame=>{
                            frame.scrollTop=30;
                            const cooking=frame.querySelector('.ck-cooking')!,rail=frame.querySelector('.ck-dish-rail')!,stock=frame.querySelector('.ck-cook-source')!;
                            const box=frame.getBoundingClientRect(),end=frame.querySelector('#ck-serve')!.getBoundingClientRect();
                            return getComputedStyle(frame).overflowY==='hidden'&&frame.scrollTop===0&&cooking.scrollHeight<=cooking.clientHeight+1&&end.bottom<=box.bottom+1&&stock.getBoundingClientRect().bottom<=box.bottom+1&&getComputedStyle(rail.querySelector('.ck-dish-row')??rail).overflowY==='hidden';
                        })).toBe(true);
                        if(viewport.width===320)await p.screenshot({path:`data/qa-critter-kitchen/cooking-fixed-small-${count}.png`});
                    }
                    await expect(p.locator('#ck-serve')).toBeEnabled();
                    if (!scored) {
                        await p.screenshot({ path: `data/qa-critter-kitchen/challenge-${count}.png`, fullPage: true });
                        scored = true;
                    }
                    await p.locator('#ck-serve').click();
                    await expect(p.locator('.ck-meal-review>section')).toHaveCount(3);
                    await expect(p.locator('.ck-review-plate-icon')).toHaveCount(0);
                    await expect(p.locator('.ck-review-plate-label').first()).toContainText('จานที่ 1');
                    const totalStars=Number(await p.locator('.ck-meal-total').getAttribute('data-preview-stars'));await expect(p.locator('.ck-meal-total .ck-star-piece')).toHaveCount(1);await expect(p.locator('.ck-meal-total strong')).toContainText(String(totalStars));
                    for(const viewport of [{width:320,height:568},{width:390,height:844}]){
                        await p.setViewportSize(viewport);
                        await expect.poll(()=>p.locator('.ck-serving-dialog').evaluate(dialog=>{
                            const body=dialog.querySelector('.ck-dialog-body')!,preview=dialog.querySelector('.ck-choice-preview')!,sections=[...dialog.querySelectorAll('.ck-meal-review>section')].map(el=>el.getBoundingClientRect());
                            const footer=dialog.querySelector('.ck-choice-actions')!.getBoundingClientRect();
                            return body.scrollHeight<=body.clientHeight+1&&preview.scrollHeight<=preview.clientHeight+1&&dialog.scrollHeight<=dialog.clientHeight+1&&Math.max(...sections.map(s=>s.height))-Math.min(...sections.map(s=>s.height))<1&&sections.every(s=>s.bottom<=footer.top+1);
                        })).toBe(true);
                        await expect(p.locator('.ck-meal-total>small')).toHaveCount(0);
                        await expect(p.locator('.ck-serving-dialog #ck-choice-confirm')).toBeVisible();
                        if(viewport.width===320)await p.screenshot({path:`data/qa-critter-kitchen/meal-confirm-fit-small-${count}.png`});
                    }
                    for(const [index,meal] of meals.entries())if(!meal.items.length&&!meal.soup&&!meal.bisque){await expect(p.locator('.ck-meal-review>section').nth(index).locator('.ck-empty-plate')).toBeVisible();await expect(p.locator('.ck-meal-review>section').nth(index).locator('.ck-empty-caption')).toHaveText('ไม่เสิร์ฟจานนี้');}

                    previewStars.set(own.me!.id,Number(await p.locator('.ck-meal-total').getAttribute('data-preview-stars')));
                    for(const [index,meal] of meals.entries()){
                        const section=p.locator('.ck-meal-review>section').nth(index);
                        for(const kind of ['soup','bisque'] as const){
                            await expect(section.locator(`[data-resource="${kind}"]`)).toHaveCount(meal[kind]?1:0);
                            if(meal[kind]>1)await expect(section.locator('.ck-review-resource').filter({has:p.locator(`[data-resource="${kind}"]`)}).locator('.ck-review-quantity')).toHaveText(`×${meal[kind]}`);
                        }
                    }
                    for(const rail of await p.locator('.ck-meal-rail').all())await expect.poll(()=>rail.evaluate(el=>{
                        if(el.scrollWidth<=el.clientWidth+1)return true;
                        const edge=el.getBoundingClientRect().right;
                        const next=[...el.children].map(item=>item.getBoundingClientRect()).find(r=>r.left<edge&&r.right>edge+1);
                        return !!next&&(edge-next.left)/next.width>.38&&(edge-next.left)/next.width<.42;
                    })).toBe(true);
                    const reviewToken=p.locator('.ck-meal-rail .ck-token').first();if(await reviewToken.count())await expect(reviewToken).toHaveCSS('height','114px');
                    expect(await p.locator('.ck-review-quantity').evaluateAll(els=>els.every(el=>Number(el.textContent!.replace('×',''))>=2))).toBe(true);
                    await p.screenshot({path:`data/qa-critter-kitchen/meal-confirm-${count}.png`});
                    expect((await read(host)).revision).toBe(v.revision);
                    await p.locator('#ck-choice-cancel').click();
                    await confirmButton(p, p.locator('#ck-serve'));
                    await revision(host,v.revision+1);await revision(p,v.revision+1);
                    if((await read(host)).phase==='challenge'){await expect(p.locator('.ck-serving-wait')).toContainText('รอ');await expect(p.locator('.ck-serving-wait img')).toBeVisible();await p.screenshot({path:`data/qa-critter-kitchen/serving-wait-${count}.png`});}
                }
                else if (v.phase === 'challenge-results') {
                    if(v.resultsRevealed===false){
                        await expect(host.locator('.ck-result-player')).toHaveCount(0);
                        const revealer=phones[0];await revision(revealer,v.revision);await revealer.locator('[data-action="ck-reveal-results"]').click();await revision(host,v.revision+1);
                        for(const phone of phones){await revision(phone,v.revision+1);expect((await read(phone)).resultsRevealed).toBe(true);}
                        continue;
                    }
                    for(const player of v.players)expect(previewStars.get(player.id)).toBe(v.challengeResults![player.id].reduce((total,dish)=>total+dish.stars,0));
                    previewStars.clear();
                    const resultPhone=phones[0];await revision(resultPhone,v.revision);
                    await expect(resultPhone.locator('.ck-result-player')).toHaveCount(count);
                    await expect(resultPhone.locator('.ck-result-dish')).toHaveCount(count*3);
                    const resultScores=await resultPhone.locator('.ck-result-player').evaluateAll(els=>els.map(el=>Number((el as HTMLElement).dataset.resultStars)));
                    expect(resultScores).toEqual([...resultScores].sort((a,b)=>b-a));
                    await expect(resultPhone.locator('.ck-next-fridge svg')).toBeVisible();
                    await expect(resultPhone.locator('.ck-title')).toBeHidden();
                    for(const size of [{width:390,height:844},{width:320,height:568}]){
                        await resultPhone.setViewportSize(size);
                        await expect.poll(()=>resultPhone.locator('.ck-kitchen').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight+1)).toBe(true);
                        if(count===2){
                            const paired=await resultPhone.locator('.ck-result-player').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {top:r.top,width:r.width};}));
                            expect(Math.abs(paired[0].top-paired[1].top)).toBeLessThan(1);
                            expect(Math.abs(paired[0].width-paired[1].width)).toBeLessThan(1);
                        }else{
                            await expect.poll(()=>resultPhone.locator('.ck-results-rail').evaluate(el=>{
                                const edge=el.getBoundingClientRect().right;
                                const next=[...el.children].map(item=>item.getBoundingClientRect()).find(r=>r.left<edge&&r.right>edge+1);
                                return !!next&&(edge-next.left)/next.width>.38&&(edge-next.left)/next.width<.42;
                            })).toBe(true);
                        }
                        await resultPhone.screenshot({path:`data/qa-critter-kitchen/results-${count}-${size.width}.png`});
                    }
                    await resultPhone.setViewportSize({width:390,height:844});
                    p = host;
                    await pace(p);
                    await host.screenshot({ path: `data/qa-critter-kitchen/challenge-results-${count}.png`, fullPage: true });
                    await confirmButton(host, host.locator('[data-action="ck-next"]'));
                }
                else if (v.phase === 'refrigeration') {
                    p = phones[v.players.findIndex(x => !x.fridgeReady)];
                    await revision(p, v.revision);
                    await pace(p);
                    const own = await read(p), limit = v.round === 3 ? 5 : 10;
                    await expect(p.locator('#ck-fridge')).toBeDisabled();
                    const counted=own.me!.storage.filter(id=>!(v.critic==='raccoon'&&TOKEN[id].kind==='ingredient'&&TOKEN[id].value===2));
                    for (const id of counted.slice(0,limit))await p.locator(`[data-keep="${id}"]`).click();
                    await expect(p.locator('#ck-fridge')).toBeEnabled();
                    await expect(p.locator('.ck-fridge-grid .ck-will-discard').first()).toHaveCSS('outline-style','none');
                    const fridgeRows=await p.locator('.ck-fridge-grid>[data-keep]').evaluateAll(es=>es.map(e=>e.getBoundingClientRect()));
                    if(fridgeRows.length>4){expect(Math.abs(fridgeRows[0].top-fridgeRows[3].top)).toBeLessThan(1);expect(fridgeRows[4].top).toBeGreaterThan(fridgeRows[0].bottom);}
                    await p.locator('#ck-fridge').click();await expect(p.locator('.ck-fridge-review')).toBeVisible();await expect(p.locator('.ck-fridge-review .ck-token')).toHaveCount(await p.locator('.ck-kept').count());await p.screenshot({path:`data/qa-critter-kitchen/fridge-confirm-${count}.png`});await p.locator('#ck-choice-cancel').click();
                    await p.screenshot({ path: `data/qa-critter-kitchen/fridge-${count}.png`, fullPage: true });
                    fridge = true;
                    await confirmButton(p, p.locator('#ck-fridge'));
                }
                else if (v.phase === 'critic') {
                    p = phones[v.players.findIndex(x => !x.committed)];
                    await revision(p, v.revision);
                    await pace(p);
                    const own = await read(p);
                    await expect(p.locator('.ck-final-cooking .ck-dish-rail')).toHaveCount(0);
                    const ordered=await p.locator('.ck-final-cooking .ck-cook-source [data-stock-group]').evaluateAll(es=>es.map(e=>({food:(e as HTMLElement).dataset.food!,quality:Number((e as HTMLElement).dataset.quality)})));
                    for(let j=1;j<ordered.length;j++){const prev=FOODS.indexOf(ordered[j-1].food as any),next=FOODS.indexOf(ordered[j].food as any);expect(next).toBeGreaterThanOrEqual(prev);if(prev===next)expect(ordered[j].quality).toBeLessThanOrEqual(ordered[j-1].quality);}
                    const first=own.me!.storage.find(id=>TOKEN[id].kind==='ingredient');if(first){await p.locator(`[data-add="${first}"]`).click();const tile=p.locator('.ck-final-selected').filter({has:p.locator(`[data-token-detail="${first}"]`)});await expect(tile.locator('.ck-final-crown')).toBeVisible();await tile.locator('[data-final-remove]').click();await expect(p.locator(`[data-add="${first}"]`)).toBeVisible();}
                    for (const f of FOODS) {
                        const id = own.me!.storage.filter(id => TOKEN[id].kind === 'ingredient' && TOKEN[id].food === f).sort((a, b) => TOKEN[b].value! - TOKEN[a].value!)[0];
                        if (id)
                            await p.locator(`[data-add="${id}"]`).click();
                    }
                    await p.screenshot({path:`data/qa-critter-kitchen/final-meal-page-${count}.png`,fullPage:true});
                    await expect(p.locator('#ck-serve')).toBeEnabled();
                    await expect(p.locator('.ck-course-tabs,[data-spice]')).toHaveCount(0);
                    await expect.poll(()=>p.locator('.ck-final-cooking').evaluate(el=>el.scrollWidth<=el.clientWidth+2)).toBe(true);
                    await expect(p.locator('.ck-final-cooking .ck-cook-source')).toHaveCSS('flex-wrap','wrap');
                    await p.locator('#ck-serve').click();await expect(p.locator('.ck-final-serving-dialog')).toBeVisible();
                    const finalBox=await p.locator('.ck-final-serving-dialog').boundingBox();expect(finalBox!.x+finalBox!.width).toBeLessThanOrEqual(p.viewportSize()!.width+1);
                    await expect(p.locator('.ck-final-serving-dialog .ck-final-review-grid')).toHaveCSS('flex-wrap','wrap');await expect(p.locator('.ck-final-serving-dialog .ck-meal-review')).toHaveCount(0);expect(finalBox!.height).toBeLessThan(p.viewportSize()!.height*.91);
                    const reviewed=await p.locator('.ck-final-review-grid .ck-review-resource').evaluateAll(es=>es.map(e=>e.getBoundingClientRect()));if(reviewed.length>=5){expect(Math.abs(reviewed[0].top-reviewed[3].top)).toBeLessThan(1);expect(reviewed[4].top).toBeGreaterThan(reviewed[0].bottom);}
                    await p.screenshot({path:`data/qa-critter-kitchen/final-meal-review-${count}.png`});
                    await p.locator('#ck-choice-confirm').click();
                }
                else
                    throw Error('Unexpected phase ' + v.phase);
                await revision(host, v.revision + 1);
                if(count===2&&v.phase==='shopping'){
                    await revision(p,v.revision+1);
                    const pantry=p.locator('.ck-kitchen .ck-inventory:visible');
                    if(await pantry.count()){
                        const rail=p.locator('.ck-kitchen .ck-inventory');
                        const measurements=await rail.evaluate(e=>({count:e.children.length,width:e.scrollWidth,client:e.clientWidth}));
                        if(measurements.count>=8){
                            expect(measurements.width).toBeGreaterThan(measurements.client);
                            await rail.evaluate(e=>e.scrollLeft=e.scrollWidth);
                            const last=rail.locator('button').last();
                            const r=await last.boundingBox(),a=await rail.boundingBox();expect(r!.x+r!.width).toBeLessThanOrEqual(a!.x+a!.width+1);
                            await p.screenshot({path:'data/qa-critter-kitchen/pantry-many.png'});
                        }
                    }
                }
                if (actions === 8) {
                    const kitchen=phones[0];
                    await kitchen.locator('[data-pantry="cards"]').click();
                    const owned=kitchen.locator('.ck-pantry-cards [data-detail]').first();
                    await expect(owned.locator('strong')).toBeVisible();
                    expect((await owned.boundingBox())!.height).toBeGreaterThan(110);
                    await kitchen.screenshot({path:`data/qa-critter-kitchen/named-pantry-cards-${count}.png`});
                    await owned.click();
                    for(const size of [{width:320,height:568},{width:390,height:844}]){
                        await kitchen.setViewportSize(size);
                        const geometry=await kitchen.locator('.ck-detail-fit').evaluate(e=>{const b=e.querySelector('.ck-dialog-body')!;return{scroll:b.scrollHeight,client:b.clientHeight,height:e.getBoundingClientRect().height}});
                        expect(geometry.scroll).toBeLessThanOrEqual(geometry.client+2);expect(geometry.height).toBeLessThan(size.height-8);
                        await expect(kitchen.locator('.ck-close svg')).toHaveCount(1);
                    }
                    await kitchen.screenshot({path:`data/qa-critter-kitchen/card-fit-${count}.png`});
                    await kitchen.keyboard.press('Escape');await kitchen.locator('[data-pantry="stock"]').click();
                    await expect(kitchen.locator('.ck-inventory [data-token-detail="soup"] .ck-token')).toBeVisible();
                    const rail=kitchen.locator('.ck-kitchen .ck-inventory');
                    const bounds=await rail.evaluate(e=>{const k=e.closest('.ck-kitchen')!.getBoundingClientRect(),r=e.getBoundingClientRect();return{bottom:r.bottom,kitchen:k.bottom}});
                    expect(bounds.bottom).toBeLessThanOrEqual(bounds.kitchen+1);
                    await kitchen.screenshot({path:`data/qa-critter-kitchen/pantry-rail-${count}.png`});
                    await host.screenshot({ path: `data/qa-critter-kitchen/market-${count}-desktop.png`, fullPage: true });
                    await host.setViewportSize({ width: 1024, height: 768 });
                    await host.screenshot({ path: `data/qa-critter-kitchen/market-${count}-ipad.png`, fullPage: true });
                    await host.setViewportSize(count === 3 ? { width: 390, height: 844 } : { width: 1440, height: 1000 });
                    await phones[0].locator('.ck-menu > summary').click();
                    await phones[0].locator('#ck-mode').selectOption('full-mobile');
                    await phones[0].locator('#ck-menu-close').click();
                    await phones[0].setViewportSize({ width: 320, height: 740 });
                    expect(await phones[0].evaluate(() => document.documentElement.scrollWidth),JSON.stringify(await phones[0].evaluate(()=>[...document.querySelectorAll('.ck-root *')].filter(e=>{const r=e.getBoundingClientRect();return r.right>321&&r.width>0}).slice(0,8).map(e=>({tag:e.tagName,cls:e.className,width:e.getBoundingClientRect().width}))))).toBeLessThanOrEqual(320);
                    await phones[0].screenshot({ path: `data/qa-critter-kitchen/full-mobile-${count}.png`, fullPage: true });
                    await phones[0].setViewportSize({ width: 390, height: 844 });
                    await phones[0].locator('.ck-menu > summary').click();
                    await phones[0].locator('#ck-mode').selectOption('shared-table');
                    await phones[0].locator('#ck-menu-close').click();
                }
            }
            if (count === 3) {
                await display.goBack();
                await expect(display.locator('.ck-root')).toHaveAttribute('data-phase', 'finished');
                host = display;
            }
            let end = await read(host);
            expect(end.phase).toBe('finished');
            expect(end.round).toBe(7);
            expect(scored).toBeTruthy();
            expect(recovered).toBeTruthy();
            await expect(host.locator('.ck-dialog')).toHaveCount(0);
            await phones[0].locator('[data-action="ck-reveal-results"]').click();await revision(host,end.revision+1);end=await read(host);
            await expect(host.locator('.ck-ceremony-dialog')).toBeVisible();await phones[0].locator('[data-final-skip]').click();await revision(host,end.revision+1);end=await read(host);
            await expect(host.locator('.ck-final-result-dialog')).toBeVisible();
            await expect(host.locator('.ck-dialog [data-winner=true]')).toHaveCount(1);
            await expect(host.locator('#ck-skip-count')).toHaveCount(0);for(const player of end.players)await expect(host.locator(`.ck-dialog [data-total="${player.score!.total}"]`).first()).toHaveText(String(player.score!.total));await host.screenshot({ path: `data/qa-critter-kitchen/final-${count}.png` });
            for(const size of [{width:390,height:844},{width:320,height:568}]){
                await host.setViewportSize(size);
                await expect.poll(()=>host.locator('.ck-final-result-dialog').evaluate(el=>el.scrollHeight<=el.clientHeight+1)).toBe(true);
                await expect.poll(()=>host.locator('.ck-final-result-dialog .ck-dialog-body').evaluate(el=>el.scrollHeight<=el.clientHeight+1)).toBe(true);
                await expect(host.locator('.ck-final-result-dialog .ck-close')).toHaveCSS('background-color','rgb(255, 251, 237)');
                const headers=await host.locator('.ck-final-results .ck-result-player>header').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().bottom));
                expect(Math.max(...headers)-Math.min(...headers)).toBeLessThan(1);
                const rows=await host.locator('.ck-final-results .ck-result-player').evaluateAll(els=>els.map(el=>[...el.querySelectorAll('.ck-score-step')].map(row=>row.getBoundingClientRect().top)));
                for(let row=0;row<7;row++)expect(Math.max(...rows.map(r=>r[row]))-Math.min(...rows.map(r=>r[row]))).toBeLessThan(1);
                if(count>2)await expect.poll(()=>host.locator('.ck-final-results').evaluate(el=>{const edge=el.getBoundingClientRect().right;const next=[...el.children].map(c=>c.getBoundingClientRect()).find(r=>r.left<edge&&r.right>edge+1);return !!next&&(edge-next.left)/next.width>.38&&(edge-next.left)/next.width<.42;})).toBe(true);
                await host.screenshot({path:`data/qa-critter-kitchen/final-fit-${count}-${size.width}.png`});
            }
            await host.locator('.ck-close').click();
            await expect(host.locator('.ck-dialog')).toHaveCount(0);
            await expect(host.locator('.ck-kitchen,.ck-workspace-heading')).toHaveCount(0);
            await expect(host.locator('.ck-title>strong')).toHaveText('สรุปผลการแข่งขัน');
            await expect(host.locator('.ck-finished-art img')).toBeVisible();
            await expect.poll(()=>host.locator('.ck-action').evaluate(el=>el.scrollHeight<=el.clientHeight+1)).toBe(true);
            await host.screenshot({path:`data/qa-critter-kitchen/finished-hub-${count}.png`});
            await host.locator('#ck-show-result').click();
            await expect(host.locator('.ck-dialog')).toBeVisible();
            for (const [i, p] of [host, ...phones].entries()) {
                const frames = await p.evaluate(() => (window as any).__frames.filter((m: any) => m.type === 'state'));
                for (const { view: w } of frames) {
                    expect(w.bag).toBeUndefined();
                    expect(w.tasks).toBeUndefined();
                    expect(w.unusedRumors).toBeUndefined();
                    if (i === 0)
                        expect(w.me).toBeUndefined();
                    for (const who of w.players) {
                        expect(who.storage).toBeUndefined();
                        expect(who.soup).toBeUndefined();
                        if (w.phase === 'planning')
                            expect(who.plan).toBeNull();
                    }
                }
            }
            expect(spiceChecked).toBe(true);
            expect(errors).toEqual([]);
            if(count===3)expect(rumorChecked).toBeGreaterThan(0);
            console.log(`CK ${count} complete: ${actions} actions, refrigerator=${fridge}`);
            await confirmButton(host, host.locator('#ck-result-restart'));
            // Restart retains the enabled head-chef module and redeals its offers.
            await expect(host.locator('.ck-root')).toHaveAttribute('data-phase', 'restaurateurs');
            await continueOpening(host);
            for(const p of phones)await confirmButton(p,p.locator('[data-rest]').first());
            await expect(host.locator('.ck-root')).toHaveAttribute('data-phase', 'planning');
        }
        finally {
            for (const c of contexts)
                await c.close();
            await app.close();
            await rm(dir, { recursive: true, force: true });
        }
    });
test('Critter Kitchen actual Docker: portal, mode, public board, secret plan, stable pickup and asset files', async ({ browser, baseURL }) => {
    test.skip(process.env.GAMEVERSE_E2E_DOCKER !== '1', 'Requires rebuilt local Docker app and its separate auth fixture');
    test.setTimeout(120000);
    const contexts: BrowserContext[] = [], errors: string[] = [];
    let host: Page | undefined, code = '';
    const make = async (mobile = false) => { const c = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, isMobile: mobile, hasTouch: mobile }); contexts.push(c); const p = await c.newPage(); p.setDefaultTimeout(12000); await capture(p); p.on('pageerror', e => errors.push(e.message)); p.on('response', r => { if (new URL(r.url()).pathname.startsWith('/art/critter-kitchen/') && r.status() >= 400)
        errors.push('missing ' + r.url()); }); return p; };
    try {
        host = await make();
        await host.goto('/');
        await expect(host.locator('img[src="/art/covers/critter-kitchen.webp"]')).toBeVisible();
        await host.screenshot({ path: 'data/qa-critter-kitchen/portal-local.png', fullPage: true });
        await host.goto('/games/critter-kitchen');
        await testAccount(host);
        await host.locator('#ck-entry-mode').selectOption('full-mobile');
        await createDisplayRoom(host);
        await expect(host.locator('#qr')).toBeVisible();
        code = await host.locator('.room-code strong').innerText();await host.locator('#ck-tutorial').check();await expect(host.locator('.ck-setup')).toContainText('เมื่อเปิด');await expect(host.locator('.ck-setup')).toContainText('เมื่อปิด');await expect(host.locator('.ck-setup')).toContainText('À La Cart');await host.locator('.ck-option-details > summary').first().click();await host.screenshot({path:'data/qa-critter-kitchen/setup-explained.png',fullPage:true});
        const phones: Page[] = [];
        for (let i = 0; i < 2; i++) {
            const p = await make(true);
            phones.push(p);
            await p.goto('/play/' + code);
            await p.getByRole('textbox', { name: 'ชื่อของคุณ' }).fill('เชฟทดสอบ ' + i);
            await p.getByRole('button', { name: 'เข้าห้อง', exact: true }).click();
            await p.getByRole('button', { name: 'พร้อมเล่น', exact: true }).click();
        }
        await expect(host.locator('#ck-tutorial')).toBeChecked();
        await host.locator('#start').click();await continueOpening(host);
        await expect(host.locator('.ck-root')).toHaveAttribute('data-phase', 'planning');expect((await read(host)).critic).toBe('mouse');
        const mobileHeadingTops=[];for(const workspace of ['kitchen','board','information']){await phones[0].locator(`[data-tab="${workspace}"]`).dispatchEvent('click');mobileHeadingTops.push(await phones[0].locator('.ck-workspace-heading').evaluate(e=>e.getBoundingClientRect().top+scrollY));}expect(Math.max(...mobileHeadingTops)-Math.min(...mobileHeadingTops)).toBeLessThanOrEqual(1);const toolbarHeights=[];for(const workspace of ['kitchen','board','information']){await phones[0].locator(`[data-tab="${workspace}"]`).dispatchEvent('click');toolbarHeights.push((await phones[0].locator('.ck-workspace-heading').boundingBox())!.height);}expect(toolbarHeights).toEqual([42,42,42]);
        await phones[0].locator('[data-tab="board"]').click();
        await expect(phones[0].locator('.ck-market-tabs')).toHaveCount(0);await expect(phones[0].locator('.ck-action')).not.toBeVisible();
        await expect(phones[0].locator('.ck-board .ck-location:visible')).toHaveCount((await read(host)).config.locations.length);await expect(phones[0].locator('.ck-kitchen')).toBeVisible();await expect(phones[0].locator('.ck-board')).toHaveCSS('background-image','none');await expect(phones[0].locator('.ck-kitchen')).toHaveCSS('position','static');await expect(phones[0].locator('.ck-kitchen')).toHaveAttribute('data-pane','stock');await expect(phones[0].locator('.ck-pantry-heading>nav')).not.toBeVisible();await expect(phones[0].locator('.ck-pantry-cards')).not.toBeVisible();const marketStockFits=await phones[0].locator('.ck-kitchen').evaluate(e=>{const r=e.getBoundingClientRect(),rail=e.querySelector('.ck-inventory')!.getBoundingClientRect();return rail.bottom<=r.bottom&&[...e.querySelectorAll('.ck-inventory .ck-token')].every(card=>card.getBoundingClientRect().bottom<=rail.bottom-5);});expect(marketStockFits).toBe(true);
        await expect(phones[0].locator('.ck-board .ck-market-stock .ck-token').first()).toHaveCSS('height','114px');
        await expect(phones[0].locator('.ck-location-caption').first()).toContainText('ซุปไม่จำกัด');
        await phones[0].screenshot({path:'data/qa-critter-kitchen/market-all-docker.png'});
        const lowerFace=phones[0].locator('.ck-board .ck-market-face').last();await lowerFace.scrollIntoViewIfNeeded();const lowerBefore=await lowerFace.boundingBox(),lowerScroll=await phones[0].evaluate(()=>scrollY);expect(lowerScroll).toBeGreaterThan(0);await lowerFace.click();await expect(phones[0].locator('.ck-dialog')).toBeVisible();expect(await lowerFace.boundingBox()).toEqual(lowerBefore);expect(await phones[0].evaluate(()=>scrollY)).toBe(lowerScroll);await phones[0].keyboard.press('Escape');expect(await phones[0].evaluate(()=>scrollY)).toBe(lowerScroll);await phones[0].screenshot({path:'data/qa-critter-kitchen/market-long-scroll-docker.png'});
        await phones[0].locator('[data-tab="kitchen"]').click();
        for (const p of phones) {
            await revision(p,(await read(host)).revision);const v = await read(p);
            await expect(p.locator('#ck-mode')).toHaveValue('full-mobile');await p.setViewportSize({width:320,height:568});expect(await p.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);await p.screenshot({path:'data/qa-critter-kitchen/planning-320.png',fullPage:true});await p.setViewportSize({width:390,height:844});await expect(p.locator('.ck-board')).not.toBeVisible();expect(await p.evaluate(()=>document.documentElement.scrollHeight)).toBeLessThanOrEqual(844);
            for (const [chef, loc] of [['mouse', 'garden'], ['lizard', 'soup'], ['boar', 'academy']]) {
                await inspectChefAndClose(p,chef);
                await dragChefTo(p,chef,loc);
            }
            await expect.poll(async()=>{const face=await p.locator('.ck-kitchen .ck-token').first().boundingBox(),chef=await p.locator('.ck-placed-chef').first().boundingBox();return Math.abs(face!.height-chef!.height*.8);}).toBeLessThan(1);
            if(p===phones[0]){await p.locator('#ck-commit').click();await expect(p.locator('.ck-choice-dialog')).toBeVisible();expect((await read(host!)).revision).toBe(v.revision);await expect(p.locator('.ck-choice-preview .ck-review-plan>div')).toHaveCount(3);await p.screenshot({path:'data/qa-critter-kitchen/confirm-plan.png'});await p.locator('#ck-choice-cancel').click();expect((await read(host!)).revision).toBe(v.revision);await expect(p.locator('#ck-commit')).toBeEnabled();}
            await confirmButton(p, p.locator('#ck-commit'));
            await revision(host, v.revision + 1);
        }
        await host.screenshot({ path: 'data/qa-critter-kitchen/board-two-player-local.png', fullPage: true });
        await expect(host.locator('.ck-title')).not.toContainText('เปิดแผนพร้อมกัน');
        await expect(host.locator('.ck-d-start')).toHaveText('เริ่มออกตลาด');
        await phones[0].locator('.ck-menu > summary').click();await phones[0].locator('#ck-mode').selectOption('shared-table');await phones[0].locator('#ck-menu-close').click();await phones[0].screenshot({path:'data/qa-critter-kitchen/ready-no-tabs-mobile.png'});
        for(const phone of phones){await expect(phone.locator('.ck-root')).toHaveAttribute('data-phase','running');await expect(phone.locator('.ck-workspace-heading')).toHaveCount(0);await expect(phone.locator('[data-tab]')).toHaveCount(0);}
        await host.screenshot({path:'data/qa-critter-kitchen/market-ready.png'});
        await phones[1].emulateMedia({reducedMotion:'reduce'});
        const runRevision=(await read(host)).revision,started=Date.now();
        await host.locator('[data-action="ck-run"]').evaluate((b:HTMLButtonElement)=>{b.click();b.click();});
        for(const page of [host,...phones]){await expect(page.locator('.ck-market-departure')).toBeVisible();await expect(page.locator('.ck-runner')).toHaveCount(3);}
        await expect(phones[1].locator('.ck-running-pack')).toHaveCSS('animation-name','none');
        for(const page of [host,...phones]){const runners=await page.locator('.ck-runner').evaluateAll(es=>es.map(e=>({animal:(e as HTMLElement).dataset.animal,box:e.getBoundingClientRect().toJSON()})));expect(runners.map(r=>r.animal)).toEqual(['mouse','lizard','boar']);expect(runners[0].box.height/runners[2].box.height).toBeCloseTo(.4,2);expect(runners[1].box.height/runners[2].box.height).toBeCloseTo(.7,2);expect(runners[0].box.bottom).toBeCloseTo(runners[2].box.bottom,0);expect(runners[1].box.bottom).toBeCloseTo(runners[2].box.bottom,0);}

        for(const page of [host,phones[0]])await expect.poll(()=>page.locator('.ck-runner img').evaluateAll(es=>es.length===3&&es.every(e=>{const img=e as HTMLImageElement,r=e.getBoundingClientRect();return img.naturalWidth>0&&r.x>=0&&r.right<=innerWidth+1&&r.height>20;}))).toBe(true);

        await host.screenshot({path:'data/qa-critter-kitchen/market-departure.png'});
        await phones[0].screenshot({path:'data/qa-critter-kitchen/market-departure-mobile.png'});
        await phones[1].reload();await expect(phones[1].locator('.ck-root')).toHaveAttribute('data-phase','shopping');await expect(phones[1].locator('.ck-market-departure')).toHaveCount(0);
        await expect(host.locator('.ck-market-departure')).toHaveCount(0,{timeout:5000});expect(Date.now()-started).toBeGreaterThanOrEqual(1850);expect((await read(host)).revision).toBe(runRevision+1);
        await expect(host.locator('.ck-root')).toHaveAttribute('data-phase', 'shopping');
        for(const phone of phones){const view=await read(phone);if(view.me?.id===view.turn)await expect(phone.locator('[data-tab="kitchen"]')).toBeVisible();else{await expect(phone.locator('[data-tab="kitchen"]')).toBeEnabled();await expect(phone.locator('[data-tab="board"]')).toBeDisabled();}}
        await phones[0].locator('.ck-menu > summary').click();await phones[0].locator('#ck-mode').selectOption('full-mobile');await phones[0].locator('#ck-menu-close').click();
        const v = await read(host), p = phones[v.players.findIndex(p => p.id === v.turn)];
        await revision(p, v.revision);
        await p.locator('[data-tab="information"]').click();
        await p.locator('.ck-reference [data-detail="critic:mouse"]').click();
        await expect(p.locator('.ck-dialog')).toBeVisible();
        await expect(p.locator('.ck-dialog .ck-close')).toHaveCSS('background-color','rgb(255, 251, 237)');
        await expect(p.locator('.ck-dialog .ck-close')).toHaveCSS('border-top-width','2px');await expect(p.locator('.ck-dialog .ck-close')).toHaveCSS('border-radius','50%');
        expect(await p.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden');
        await p.mouse.click(1, 1);
        await expect(p.locator('.ck-dialog')).toHaveCount(0);
        if(await p.locator('.ck-menu').evaluate(el=>el.hasAttribute('open')))await p.locator('#ck-menu-close').click();
        await expect(p.locator('[data-tab="board"]')).toBeDisabled();
        await p.locator('[data-tab="kitchen"]').click();
        const before = (await read(host)).revision;
        const sceneBefore=await p.locator('.ck-picks').boundingBox();const scrollBefore=await p.evaluate(()=>({x:scrollX,y:scrollY}));
        await p.locator('.ck-picks [data-pick]:enabled').first().click();
        const sceneOpen=await p.locator('.ck-picks').boundingBox();expect(sceneOpen).toEqual(sceneBefore);expect(await p.evaluate(()=>({x:scrollX,y:scrollY}))).toEqual(scrollBefore);expect(await p.evaluate(()=>document.activeElement?.classList.contains('ck-close'))).toBe(false);

        expect((await read(host)).revision).toBe(before);
        await expect(p.locator('.ck-token-preview')).toBeVisible();
        await expect(p.locator('.ck-choice-dialog')).toHaveCount(0);
        await p.keyboard.press('Escape');
        const picking=await read(host);
        await expect(p.locator('.ck-shopping-scene')).toContainText(picking.config.locations.find(l=>l.id===picking.decision?.loc)!.name);
        await expect(p.locator('.ck-shopping-chef.is-active .ck-chef-face')).toBeVisible();
        await p.locator('.ck-shopping-chef.is-active').click();
        await expect(p.locator('.ck-chef-detail')).toContainText('ถือได้');
    const spacing=await p.locator('.ck-chef-description').evaluate(el=>{const a=el.querySelector('span')!.getBoundingClientRect(),b=el.querySelector('p')!.getBoundingClientRect();return b.top-a.bottom;});expect(spacing).toBeLessThanOrEqual(8);
        await expect.poll(()=>p.locator('.ck-chef-detail img').evaluate((el:HTMLImageElement)=>el.naturalWidth)).toBeGreaterThan(0);
        await p.keyboard.press('Escape');
        await expect(p.locator('.ck-dialog')).toHaveCount(0);
        await expect(p.locator('.ck-picks [data-buy]').first()).toBeEnabled();
        expect((await read(host)).revision).toBe(before);
        const visitorIcon=await p.locator('.ck-shopping-chef.is-active').boundingBox();expect(visitorIcon!.width).toBeCloseTo(visitorIcon!.height,1);await expect(p.locator('.ck-shopping-chef.is-active')).toHaveCSS('border-radius','50%');
        await expect(p.getByText('คุณเลือกของได้แล้ว',{exact:true})).toHaveCount(0);
        await expect(p.locator('.ck-picks [data-buy]').first()).toBeVisible();
        await expect(p.locator('.ck-title>strong')).toBeHidden();
        await expect(p.locator('#ck-action>h2')).toHaveCount(0);
        await expect(p.locator('.ck-picks [data-buy]').first()).toHaveCSS('border-radius','50%');
        await expect(p.locator('.ck-picks [data-buy] svg').first()).toBeVisible();
        const headers=await p.locator('.ck-kitchen .ck-resource-heading').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().height));
        expect(headers.every(height=>height===24)).toBe(true);
        await expect(p.locator('.ck-kitchen .ck-resource-icon').first()).toHaveCSS('width','64px');
        const pickupIcon=p.locator('.ck-picks img.ck-resource-icon').first(),pantryIcon=p.locator('.ck-kitchen img.ck-resource-icon').first();
        const pickupBox=await pickupIcon.boundingBox(),pantryBox=await pantryIcon.boundingBox();
        expect(Math.abs(pickupBox!.width-pantryBox!.width)).toBeLessThan(1);expect(Math.abs(pickupBox!.height-pantryBox!.height)).toBeLessThan(1);
        await expect(p.locator('.ck-kitchen .ck-token-name').first()).toHaveCSS('font-size','12px');
        const personal=await read(p);
        for(const kind of ['soup','bisque'] as const)if(!personal.me![kind])await expect(p.locator(`.ck-kitchen .ck-broth-card [data-resource="${kind}"]`)).toHaveCSS('opacity','0.4');
        await expect(p.locator('.ck-pantry-heading h2')).toContainText(`(${personal.me!.storage.length+personal.me!.soup+personal.me!.bisque} อย่าง)`);
        await expect(p.locator('.ck-pantry-heading h2')).toHaveCSS('font-size','16px');
        await expect(p.locator('.ck-stock-counts')).toHaveCount(0);
        for(const pane of ['stock','cards']){const button=p.locator(`[data-pantry="${pane}"]`);await expect(button).toHaveCSS('border-radius','50%');await expect(button.locator('svg')).toBeVisible();}
        const brothStyles=await p.locator('.ck-broth-card .ck-token').evaluateAll(els=>els.map(el=>getComputedStyle(el).backgroundImage));
        expect(brothStyles[0]).not.toBe(brothStyles[1]);
        const quantity=p.locator('.ck-pantry-quantity').first();
        await expect(quantity).toHaveCSS('border-radius','50%');
        await expect(quantity).toHaveCSS('width','24px');await expect(quantity).toHaveCSS('height','24px');
        for(const scope of ['.ck-picks','.ck-kitchen'])await expect(p.locator(`${scope} .ck-resource-heading`).first()).toHaveCSS('justify-items','start');
        if(personal.me!.soup<2)await expect(quantity).toBeHidden();else await expect(quantity).toBeVisible();

        const actionRect=await p.locator('.ck-action').boundingBox(),coverRect=await p.locator('.ck-shopping-scene').boundingBox();
        expect(Math.abs(coverRect!.y-actionRect!.y)).toBeLessThanOrEqual(2);expect(Math.abs(coverRect!.x-actionRect!.x)).toBeLessThanOrEqual(2);
        const selected=p.locator('.ck-picks .ck-pick-card').first();
        await expect(selected.locator('.ck-token')).toHaveCSS('transform','none');
        await expect(selected.locator('.ck-token')).toHaveCSS('border-radius','10px');
        const waiting=phones.find(phone=>phone!==p)!;
        await expect(waiting.locator('.ck-waiting,.ck-pick-toolbar')).toHaveCount(0);
        await expect(waiting.locator('.ck-market-loading>svg')).toHaveCSS('width','64px');
        await expect(waiting.locator('.ck-market-loading')).toBeVisible();
        await expect(waiting.locator('.ck-market-loading')).toHaveCSS('pointer-events','none');
        await expect(waiting.locator('.ck-workspace-heading')).toBeVisible();
        await expect(waiting.locator('[data-tab="board"]')).toBeDisabled();await waiting.locator('[data-tab="information"]').click();await expect(waiting.locator('[data-tab="kitchen"]')).toBeEnabled();await waiting.locator('[data-tab="kitchen"]').click();await expect(waiting.locator('.ck-root')).toHaveAttribute('data-workspace','kitchen');
        await expect(waiting.locator('.ck-shopping-scene')).toBeVisible();
        expect((await waiting.locator('.ck-shopping-scene').boundingBox())!.width).toBeGreaterThan((await waiting.locator('#ck-action').boundingBox())!.width*.85);
        expect(await waiting.locator('.ck-picks [data-pick]').count()).toBeGreaterThan(0);
        await expect(waiting.locator('.ck-picks [data-buy]')).toHaveCount(0);
        await waiting.screenshot({path:'data/qa-critter-kitchen/waiting-opponent.png'});
        await p.screenshot({path:'data/qa-critter-kitchen/inline-pick.png'});
        const buy=p.locator('.ck-picks [data-buy]').first();
        await buy.click();await expect(p.locator('.ck-choice-dialog')).toBeVisible();
        expect((await read(host)).revision).toBe(before);
        await p.screenshot({path:'data/qa-critter-kitchen/buy-confirm.png'});
        await p.locator('#ck-choice-cancel').click();
        expect((await read(host)).revision).toBe(before);
        const cardBefore=await p.locator('.ck-picks .ck-pick-card').first().boundingBox();
        await confirmButton(p,buy);
        await revision(host, before + 1);
        const stamped=await read(host);expect(stamped.pickups!.length).toBeGreaterThan(0);
        const lastPickup=stamped.pickups!.at(-1)!;
        for(const phone of phones){await revision(phone,stamped.revision);if(lastPickup.item==='soup'||lastPickup.item==='bisque'){await expect(phone.locator('.ck-picks .ck-pick-stamp')).toHaveCount(0);continue;}const stamp=phone.locator(`.ck-picks .ck-pick-stamp[data-owner="${lastPickup.actor}"]`).first();await expect(stamp).toBeVisible();await expect(stamp.locator('img')).toHaveAttribute('src',new RegExp(`/teams-v2/${stamped.teamColors![lastPickup.actor]}/${lastPickup.chef}\\.webp$`));}
        await revision(p,stamped.revision);
        const cardAfter=await p.locator('.ck-picks .ck-pick-card').first().boundingBox();
        expect(Math.abs(cardAfter!.y-cardBefore!.y)).toBeLessThan(1);
        await expect(p.locator('.ck-picks')).toHaveCSS('align-items','center');
        const pickedVisit=stamped.visits.find(visit=>visit.actor===lastPickup.actor&&visit.chef===lastPickup.chef&&visit.loc===lastPickup.loc)!;
        for(const phone of phones){
            if(lastPickup.item==='soup'||lastPickup.item==='bisque')continue;
            const marked=phone.locator('.ck-picks .ck-pick-card').filter({has:phone.locator(`[data-pick="${lastPickup.item}"]`)});
            if(await marked.evaluate(el=>el.classList.contains('ck-exhausted'))){await expect(marked.locator('.ck-sold-ribbon')).toHaveText('หมด');await expect(marked.locator('[data-pick]')).toHaveCSS('outline-width','2px');}
            const seal=marked.locator(`.ck-pick-stamp[data-owner="${lastPickup.actor}"]`).last();
            await expect(seal.locator('small')).toHaveText(`${pickedVisit.used}/${pickedVisit.limit}`);
            const cardBox=(await marked.boundingBox())!,sealBox=(await seal.boundingBox())!;
            expect(sealBox.width).toEqual(sealBox.height);
            expect(sealBox.width).toBe(36);expect(sealBox.y).toBeCloseTo(cardBox.y-10,0);
            await expect(seal.locator('img')).toHaveAttribute('loading','eager');
            expect(sealBox.y).toBeLessThan(cardBox.y);
            expect(sealBox.x+sealBox.width).toBeGreaterThan(cardBox.x+cardBox.width-2);
            const ownWaiting=phone===p&&(await read(phone)).turn!==lastPickup.actor;
            await expect(marked.locator('[data-pick] .ck-token')).toHaveCSS('filter',ownWaiting?'none':'grayscale(1)');
            if(ownWaiting){
                await expect(marked.locator('[data-pick]')).toHaveCSS('opacity','0.55');
                const other=phone.locator('.ck-picks .ck-pick-card:not(.ck-owned) [data-pick]').first();
                if(await other.count())await expect(other).toHaveCSS('opacity','0.35');
            }
        }
        await phones.find(phone=>phone!==p)!.reload();await revision(phones.find(phone=>phone!==p)!,stamped.revision);if(lastPickup.item!=='soup'&&lastPickup.item!=='bisque')await expect(phones.find(phone=>phone!==p)!.locator('.ck-picks .ck-pick-stamp').first()).toBeVisible();
        await p.screenshot({path:'data/qa-critter-kitchen/market-stamps.png'});
        const railCheck=await p.evaluate(()=>{const picked=document.querySelector('.ck-picks .ck-token')?.getBoundingClientRect(),stored=document.querySelector('.ck-kitchen .ck-token')?.getBoundingClientRect(),rail=document.querySelector('.ck-kitchen .ck-inventory')?.getBoundingClientRect(),kitchen=document.querySelector('.ck-kitchen')?.getBoundingClientRect();return {picked:picked&&{w:picked.width,h:picked.height},stored:stored&&{w:stored.width,h:stored.height},inside:!!stored&&!!rail&&!!kitchen&&stored.bottom<=Math.min(rail.bottom,kitchen.bottom)+1};});
        if(railCheck.picked&&railCheck.stored){expect(railCheck.stored.h).toBe(114);expect(railCheck.picked.h).toBeLessThanOrEqual(114);}
        if(railCheck.stored)expect(railCheck.inside).toBe(true);
        const stored=p.locator('.ck-kitchen [data-token-detail]').first();if(await stored.count()){await stored.click();await expect(p.locator('.ck-dialog .ck-token-preview')).toBeVisible();await expect(p.locator('.ck-dialog .ck-token-preview .ck-token')).toHaveCSS('width','154px');await expect(p.locator('.ck-dialog .ck-resource-card')).toBeVisible();await expect(p.locator('.ck-dialog .ck-resource-heading')).toHaveCSS('height','36px');await expect(p.locator('.ck-dialog .ck-token-name')).toBeVisible();await expect(p.locator('.ck-dialog .ck-token-name')).toHaveCSS('background-color','rgba(0, 0, 0, 0)');const image=p.locator('.ck-dialog .ck-token-preview img');if(await image.count()){expect(await image.getAttribute('src')).not.toContain('/thumbs/');await expect.poll(()=>image.evaluate((el:HTMLImageElement)=>el.naturalWidth)).toBeGreaterThan(0);expect((await image.boundingBox())!.height).toBeGreaterThan(80);}await p.screenshot({path:'data/qa-critter-kitchen/ingredient-detail.png'});await p.keyboard.press('Escape');}
        for(const size of [{width:320,height:568},{width:390,height:844}]){
            await p.setViewportSize(size);
            await p.screenshot({path:`data/qa-critter-kitchen/shop-docker-${size.width}.png`});
            await expect.poll(()=>p.locator('.ck-action').evaluate(el=>el.scrollHeight<=el.clientHeight+1)).toBe(true);
            await expect.poll(()=>p.locator('.ck-kitchen').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight+1)).toBe(true);
            await p.screenshot({path:`data/qa-critter-kitchen/shop-docker-${size.width}.png`});
        }
        await p.locator('[data-pantry="cards"]').click();
        for(let index=0;index<3;index++)await expect(p.locator('.ck-private-rumors > *').nth(index).locator('strong')).toHaveText(`ข่าวลือ ใบที่ ${index+1}`);
        const namedCard=p.locator('.ck-pantry-cards [data-detail]').first();
        if(await namedCard.count())await expect(namedCard.locator('strong')).toBeVisible();
        for(const back of await p.locator('.ck-pantry-cards .ck-unknown-card>.ck-art').all())await expect(back).toHaveCSS('filter','grayscale(1)');
        const ownedCard=p.locator('.ck-pantry-cards .ck-card,.ck-pantry-cards .ck-unknown-card').first();
        const cardBox=await ownedCard.boundingBox(),cardRail=await p.locator('.ck-pantry-cards').boundingBox();
        expect(cardBox!.height).toBeGreaterThan(110);
        expect(cardBox!.height).toBeLessThan(190);
        const kitchenBox=await p.locator('.ck-kitchen').boundingBox();
        expect(cardRail!.y+cardRail!.height).toBeLessThanOrEqual(kitchenBox!.y+kitchenBox!.height+1);
        expect(cardBox!.height/cardBox!.width).toBeCloseTo(4/3,2);expect(cardBox!.y+cardBox!.height).toBeLessThanOrEqual(cardRail!.y+cardRail!.height-8);
        const readPeek=()=>p.locator('.ck-pantry-cards').evaluate(rail=>{const edge=rail.getBoundingClientRect().right;const next=[...rail.querySelectorAll('.ck-card,.ck-unknown-card')].map(el=>el.getBoundingClientRect()).find(r=>r.left<edge&&r.right>edge+1);return next?(edge-next.left)/next.width:null;});
        await expect.poll(async()=>{const overflow=await p.locator('.ck-pantry-cards').evaluate(rail=>rail.scrollWidth>rail.clientWidth+1);const peek=await readPeek();return !overflow||peek!==null&&peek>.38&&peek<.42;}).toBe(true);
        await p.screenshot({path:'data/qa-critter-kitchen/pantry-full-cards.png'});
        await p.locator('[data-pantry="stock"]').click();
        await expect(p.locator('.ck-kitchen .ck-art').first()).toHaveAttribute('src',/\/thumbs\//);
        await p.screenshot({ path: 'data/qa-critter-kitchen/resolution-local-mobile.png', fullPage: true });
        await host.screenshot({ path: 'data/qa-critter-kitchen/board-local-desktop.png', fullPage: true });
        const { readFile } = await import('node:fs/promises'), manifest = JSON.parse(await readFile('docs/games/critter-kitchen/asset-manifest.json', 'utf8'));
        expect(manifest.assets).toHaveLength(99);
        const plateAsset=await host.request.get(baseURL+'/art/critter-kitchen/thumbs/serving-plate.webp');expect(plateAsset.ok()).toBe(true);expect(plateAsset.headers()['content-type']).toContain('image/webp');
        const menuAsset=await host.request.get(baseURL+'/art/critter-kitchen/thumbs/service-menu-paper.webp');expect(menuAsset.ok()).toBe(true);expect(menuAsset.headers()['content-type']).toContain('image/webp');
        for (const a of manifest.assets) {
            expect(a.status).toBe('generated');
            const r = await host.request.get(baseURL + a.path);
            expect(r.ok(), a.path).toBe(true);
            expect(r.headers()['content-type']).toContain('image/webp');
        }
        let chefOfferChecked=false;
        for(let step=0;step<24&&!chefOfferChecked;step++){
            const current=await read(host);if(current.phase!=='shopping')break;
            const actor=phones[current.players.findIndex(player=>player.id===current.turn)];await revision(actor,current.revision);const own=await read(actor);
            const hired=own.me!.choices.find(id=>id.startsWith('zous:'));
            if(hired){
                const face=actor.locator(`.ck-picks [data-pick="${hired}"]`);await expect(face.locator('strong')).toBeVisible();const faceBox=await face.boundingBox();expect(faceBox!.height).toBeGreaterThan(faceBox!.width);expect(faceBox!.height).toBeLessThanOrEqual(114);const resourceHeight=await face.evaluate(el=>parseFloat(getComputedStyle(el.closest('.ck-picks')!).getPropertyValue('--ck-market-card-height'))||114);expect(faceBox!.height).toBeCloseTo(resourceHeight,0);await face.screenshot({path:'data/qa-critter-kitchen/chef-offer-card.png'});await expect(face.locator('img')).toHaveCSS('object-fit','cover');
                await face.click();await expect(actor.locator('.ck-chef-detail')).toBeVisible();const detailBox=await actor.locator('.ck-reference-detail-dialog').boundingBox();expect(detailBox!.width/detailBox!.height).toBeCloseTo(.75,2);await expect.poll(()=>actor.locator('.ck-chef-detail>.ck-art').evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0);await actor.locator('.ck-chef-detail>.ck-art').evaluate((img:HTMLImageElement)=>img.decode());await actor.screenshot({path:'data/qa-critter-kitchen/chef-portrait-detail.png'});await actor.keyboard.press('Escape');
                await actor.locator(`.ck-picks [data-buy="${hired}"]`).click();await expect(actor.locator('.ck-buy-chef-preview')).toBeVisible();await expect(actor.locator('.ck-buy-chef-preview img')).toHaveCSS('object-fit','cover');
                await expect.poll(()=>actor.locator('.ck-buy-chef-preview img').evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0);
                await actor.screenshot({path:'data/qa-critter-kitchen/chef-buy-confirm.png'});await actor.locator('#ck-choice-cancel').click();expect((await read(host)).revision).toBe(current.revision);chefOfferChecked=true;
            }else if(current.decision?.kind==='rumor')await confirmButton(actor,actor.locator(`[data-rumor="${own.me!.rumorChoices[0]}"]`));
            else if(current.decision?.kind==='consolation')await confirmButton(actor,actor.locator('[data-reward="soup"]'));
            else await confirmButton(actor,actor.locator(`.ck-picks [data-buy="${own.me!.choices[0]}"]`));
            if(!chefOfferChecked)await revision(host,current.revision+1);
        }
        expect(chefOfferChecked).toBe(true);
        const publicChef=host.locator('.ck-d-stock [data-pick^="zous:"]').first();
        if(await publicChef.count()){await publicChef.click();await expect(host.locator('.ck-chef-detail')).toBeVisible();await host.keyboard.press('Escape');}
        const marketOwners=host.locator('.ck-d-owners');
        expect(await marketOwners.count()).toBeGreaterThan(0);
        await expect(marketOwners.first()).toHaveAttribute('aria-label',/เชฟทดสอบ/);
        const ownedProduct=host.locator('.ck-d-item:has(.ck-d-owners)>button').first();await ownedProduct.scrollIntoViewIfNeeded();await expect(ownedProduct.locator('.ck-token')).toBeVisible();await expect.poll(()=>ownedProduct.locator('img').first().evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0&&img.getBoundingClientRect().height>30)).toBe(true);await ownedProduct.locator('.ck-token').screenshot({path:'data/qa-critter-kitchen/market-purchased-product.png'});for(const tile of await host.locator('.ck-d-item:has(.ck-d-owners)').all()){await tile.scrollIntoViewIfNeeded();await expect(tile.locator('.ck-token')).toBeVisible();await expect.poll(()=>tile.locator('button img').first().evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0&&img.getBoundingClientRect().height>30)).toBe(true);await expect(tile.locator('.ck-d-owners i').first()).toBeVisible();}await expect(host.locator('.ck-board .ck-queues')).toHaveCount(0);
        await host.screenshot({path:'data/qa-critter-kitchen/market-owners-docker.png'});

        const teams=JSON.parse(await readFile('docs/games/critter-kitchen/team-avatar-assets.json','utf8'));
        expect(teams.paths).toHaveLength(75);
        for(const path of teams.paths){const response=await host.request.get(baseURL+path);expect(response.ok(),path).toBe(true);}
        expect(errors).toEqual([]);
    }
    finally {
        if (host && code)
            await host.request.post('/api/rooms/leave', { data: { code, close: true } }).catch(() => { });
        for (const c of contexts)
            await c.close();
    }
});

test('Critter Kitchen dense planning: vertical chef hand stays visible, enlarged placements and bounded panorama list',async({browser})=>{
    test.setTimeout(90000);
    const dir=await mkdtemp(join(tmpdir(),'ck-panorama-')),app=await startServer(0,'127.0.0.1',true,seeded(910),{storePath:join(dir,'rooms.sqlite')}),url=`http://localhost:${(app.server.address() as any).port}`,contexts:BrowserContext[]=[];
    try{
        const hc=await browser.newContext({viewport:{width:1440,height:1000}});contexts.push(hc);const host=await hc.newPage();
        await capture(host);await host.goto(url+'/games/critter-kitchen');await testAccount(host,app);await host.locator('#ck-entry-mode').selectOption('shared-table');await createDisplayRoom(host);await expect(host.locator('#qr')).toBeVisible();const code=await host.locator('.room-code strong').innerText(),phones:Page[]=[];
        for(let i=0;i<5;i++){const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});contexts.push(c);const p=await c.newPage();p.setDefaultTimeout(12000);await capture(p);phones.push(p);await p.goto(url+'/play/'+code);await p.getByRole('textbox',{name:'ชื่อของคุณ'}).fill('เชฟ '+i);await p.getByRole('button',{name:'เข้าห้อง',exact:true}).click();await p.getByRole('button',{name:'พร้อมเล่น',exact:true}).click();}
        await host.locator('#start').click();await continueOpening(host);const p=phones[0];await expect(p.locator('.ck-route-planner')).toBeVisible();await expect(p.locator('.ck-title')).not.toContainText('วางแผนลับ');await expect(p.locator('.ck-route-planner [data-destination]')).toHaveCount(8);
        await expect(p.locator('.ck-title .ck-round-badge')).toHaveCount(0);await expect(p.locator('.ck-stage-round')).toHaveText('รอบที่ 1/7');await expect(p.locator('.ck-stage-name')).toHaveText('ส่งเชฟออกตลาด');await expect(p.locator('.ck-kitchen')).toBeVisible();await expect(p.locator('.ck-pantry-heading>nav')).not.toBeVisible();await expect(p.locator('#ck-clear-plan,#ck-commit')).toHaveCount(0);
        const five=await read(host);expect(new Set(Object.values(five.teamColors!)).size).toBe(5);await p.locator('[data-tab="board"]').click();await expect(p.locator('.ck-kitchen')).toHaveAttribute('data-pane','stock');await expect(p.locator('.ck-kitchen')).toHaveCSS('position','static');await expect(p.locator('.ck-pantry-heading>nav')).not.toBeVisible();await p.locator('[data-tab="kitchen"]').click();
        for(const phone of phones){const own=await read(phone);expect(own.teamColors).toEqual(five.teamColors);const color=own.teamColors![own.me!.id];await expect(phone.locator('[data-chef="mouse"] img')).toHaveAttribute('src',`/art/critter-kitchen/thumbs/teams-v2/${color}/mouse.webp`);expect((await phone.request.get(url+`/art/critter-kitchen/thumbs/teams-v2/${color}/mouse.webp`)).ok()).toBe(true);}

        const planningRoom=app.rooms.rooms.get(code)!,planningState=planningRoom.ck!,stockLoc=planningState.config.locations.find(loc=>loc.slots>0)!.id;
        planningState.bag.push(...planningState.locations[stockLoc]);const previewItems=[planningState.bag.find(id=>TOKEN[id]?.kind==='spice'&&TOKEN[id]?.food!=='all')!,...planningState.bag.filter(id=>TOKEN[id]?.kind==='ingredient').slice(0,12)];planningState.bag=planningState.bag.filter(id=>!previewItems.includes(id));planningState.locations[stockLoc]=previewItems;const pantryItems=planningState.bag.filter(id=>TOKEN[id]?.kind==='ingredient').slice(0,12);planningState.bag=planningState.bag.filter(id=>!pantryItems.includes(id));planningState.players[0].storage.push(...pantryItems);const seasoning=planningState.bag.find(id=>TOKEN[id]?.kind==='spice'&&TOKEN[id]?.food!=='all')!;planningState.bag=planningState.bag.filter(id=>id!==seasoning);planningState.players[0].storage.push(seasoning);
        planningRoom.revision++;(app.rooms as any).broadcast(planningRoom,true);await revision(p,planningRoom.revision);
        for(const size of [{width:320,height:568},{width:390,height:620},{width:390,height:844}]){
            await p.setViewportSize(size);
            const stock=p.locator(`[data-destination="${stockLoc}"] .ck-route-stock`);await expect(stock.locator('.ck-route-stock-item')).toHaveCount(13);await expect(stock).toHaveAttribute('data-rows','1');
            const previewFit=await stock.evaluate(e=>{const r=e.getBoundingClientRect(),cells=[...e.children].map(c=>c.getBoundingClientRect()),tops=[...new Set(cells.map(c=>Math.round(c.top)))],first=cells[0],style=getComputedStyle(e),size=first.width,gap=parseFloat(style.columnGap),available=e.clientWidth-5,visible=Math.floor((available+gap)/(size+gap));return {tops:tops.length,counts:tops.map(y=>cells.filter(c=>Math.round(c.top)===y).length),round:Math.abs(first.width-first.height)<1,overflow:e.scrollWidth>e.clientWidth,bottom:Math.max(...cells.map(c=>c.bottom))+4<=r.bottom,peek:(available-visible*(size+gap))/size};});
            expect(previewFit.tops).toBe(1);expect(previewFit.counts).toEqual([13]);expect(previewFit,JSON.stringify(previewFit)).toMatchObject({round:true,overflow:true,bottom:true});expect(previewFit.peek).toBeCloseTo(.4,1);
            await stock.evaluate(e=>e.scrollLeft=e.scrollWidth);expect(await stock.evaluate(e=>e.scrollLeft)).toBeGreaterThan(0);await stock.evaluate(e=>e.scrollLeft=0);
            expect((await stock.locator('.ck-route-stock-item').first().boundingBox())!.width).toBeGreaterThanOrEqual(32);
            await expect(stock).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
            const spiceBadge=stock.locator('.ck-route-spice');await expect(spiceBadge).toHaveCount(1);const badgeBounds=await spiceBadge.boundingBox(),spiceBounds=await spiceBadge.locator('..').boundingBox();expect(badgeBounds!.x+badgeBounds!.width).toBeGreaterThan(spiceBounds!.x+spiceBounds!.width);expect(badgeBounds!.y+badgeBounds!.height).toBeGreaterThan(spiceBounds!.y+spiceBounds!.height);
            await p.locator('[data-tab="board"]').click();await expect.poll(()=>p.locator('.ck-market-stock').first().evaluate(e=>(e as HTMLElement).style.getPropertyValue('--ck-resource-width'))).not.toBe('');const marketFaces=await p.locator('.ck-market-stock .ck-resource-card').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(),head=e.querySelector('.ck-resource-heading')!,img=e.querySelector('.ck-resource-icon')!;return {ratio:r.width/r.height,scoreLayer:Number(getComputedStyle(head).zIndex),artLayer:Number(getComputedStyle(img).zIndex)};}));expect(marketFaces.length).toBeGreaterThan(0);expect(marketFaces.every(f=>f.ratio<=.67&&f.scoreLayer>f.artLayer)).toBe(true);if(size.height===620)await p.screenshot({path:'data/qa-critter-kitchen/market-portrait-short-phone.png'});await p.locator('[data-tab="kitchen"]').click();
            const beforePreviewPlan=(await read(p)).me!.plan;await stock.locator('.ck-route-stock-item').first().click();await expect(p.locator('.ck-token-preview')).toBeVisible();await p.keyboard.press('Escape');expect((await read(p)).me!.plan).toEqual(beforePreviewPlan);
            if(size.height===844)await p.screenshot({path:'data/qa-critter-kitchen/planning-stock-circles.png'});
            const rows=await p.locator('.ck-route-planner [data-destination]').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,b:r.bottom}}));
            expect(new Set(rows.map(r=>r.x)).size).toBe(1);expect(rows.every(r=>r.w>r.h*1.8&&r.h>=100)).toBe(true);
            const list=p.locator('.ck-route-planner .ck-destinations');await list.evaluate(e=>e.scrollTop=e.scrollHeight);const last=await p.locator('.ck-route-planner [data-destination]').last().boundingBox();expect(last!.y+last!.height).toBeLessThan(size.height);await list.evaluate(e=>e.scrollTop=0);
            const area=await p.locator('#ck-action').evaluate(e=>({scroll:e.scrollHeight,client:e.clientHeight}));expect(area.scroll).toBeLessThanOrEqual(area.client+2);
            expect(await p.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(size.width);expect(await p.evaluate(()=>document.documentElement.scrollHeight)).toBeLessThanOrEqual(size.height);expect(await p.evaluate(()=>getComputedStyle(document.documentElement).overflowY)).not.toBe('hidden');expect(await p.evaluate(()=>getComputedStyle(document.body).overflowY)).not.toBe('hidden');await expect(p.locator('.ck-destinations')).toHaveCSS('overscroll-behavior-y','auto');await expect(p.locator('.ck-action')).toHaveCSS('overscroll-behavior-y','auto');expect(await p.evaluate(()=>getComputedStyle(document.documentElement).overscrollBehaviorY)).toBe('auto');const right=await p.locator('[data-destination]').first().boundingBox();expect(size.width-right!.x-right!.width).toBeGreaterThanOrEqual(7);const footer=await p.locator('.ck-kitchen').boundingBox(),face=await p.locator('.ck-kitchen .ck-token').first().boundingBox();expect(face!.y).toBeGreaterThanOrEqual(footer!.y);expect(face!.y+face!.height+6).toBeLessThanOrEqual(size.height);
            await inspectChefAndClose(p,'mouse');await dragChefTo(p,'mouse','garden');
            const inHand=await p.locator('[data-chef="mouse"] .ck-chef-face').boundingBox(),onBoard=await p.locator('[data-destination="garden"] .ck-chef-face').boundingBox();expect(onBoard!.height).toBeGreaterThan(inHand!.height);
            const handCards=await p.locator('.ck-route-planner [data-chef]').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().x));expect(new Set(handCards).size).toBe(1);
            await p.screenshot({path:`data/qa-critter-kitchen/panorama-8-${size.height}.png`});
        }
        await inspectChefAndClose(p,'mouse');await dragChefTo(p,'mouse','garden');
        const hand=await p.locator('[data-chef="mouse"] .ck-chef-face').boundingBox(),placed=await p.locator('[data-destination="garden"] .ck-chef-face').boundingBox();expect(placed!.height).toBeGreaterThan(hand!.height);expect(placed!.width).toBeGreaterThan(hand!.width);
        const slot=await p.locator('[data-destination="garden"] .ck-route-slot').boundingBox(),name=await p.locator('[data-destination="garden"] .ck-route-name').boundingBox(),destination=await p.locator('[data-destination="garden"]').boundingBox();expect(slot!.x-destination!.x).toBeLessThan(10);expect(name!.x-(slot!.x+slot!.width)).toBeGreaterThanOrEqual(10);expect(slot!.height/destination!.height).toBeGreaterThan(.85);expect(slot!.height-placed!.height).toBeLessThanOrEqual(5);
        await dragChefTo(p,'lizard','soup');await dragChefTo(p,'boar','academy');await expect(p.locator('#ck-commit')).toBeVisible();await expect(p.locator('.ck-plan-floating')).toHaveCSS('position','fixed');
        await p.locator('.ck-kitchen').scrollIntoViewIfNeeded();const floating=await p.locator('#ck-commit').boundingBox();expect(Math.abs(floating!.x+floating!.width/2-195)).toBeLessThan(1);expect(floating!.width).toBe(floating!.height);await expect(p.locator('.ck-pantry-cards')).not.toBeVisible();const pantry=p.locator('.ck-kitchen .ck-inventory');await expect(p.locator('.ck-pantry-heading')).not.toBeVisible();const compactFace=await pantry.locator('.ck-token').first().boundingBox();const chefReference=await p.locator('.ck-placed-chef').first().boundingBox();expect(compactFace!.height).toBeCloseTo(chefReference!.height*.8,0);expect(compactFace!.width).toBeCloseTo(chefReference!.width*.8,0);const inventoryBox=await p.locator('.ck-kitchen').boundingBox(),actionBox=await p.locator('.ck-action').boundingBox();expect(inventoryBox!.height).toBeGreaterThanOrEqual(compactFace!.height+8);expect(compactFace!.y-inventoryBox!.y).toBeLessThanOrEqual(3);expect(inventoryBox!.y+inventoryBox!.height).toBeCloseTo(844,0);expect(floating!.y+floating!.height/2).toBeCloseTo(inventoryBox!.y,0);await expect(p.locator('.ck-plan-floating')).toHaveCSS('background-color','rgba(0, 0, 0, 0)');await expect(pantry.locator('.ck-pantry-quantity').first()).toHaveCSS('width','24px');expect(await pantry.evaluate(e=>e.scrollWidth>e.clientWidth)).toBe(true);await pantry.evaluate(e=>e.scrollLeft=e.scrollWidth);expect(await pantry.evaluate(e=>e.scrollLeft)).toBeGreaterThan(0);
        await expect(pantry.locator('.ck-spice-badge').first()).toHaveCSS('width','24px');const pantryScrollBefore=await pantry.evaluate(e=>e.scrollLeft);await dragChefTo(p,'mouse','desert');expect(await pantry.evaluate(e=>e.scrollLeft)).toBeCloseTo(pantryScrollBefore,0);await dragChefTo(p,'mouse','garden');expect(await pantry.evaluate(e=>e.scrollLeft)).toBeCloseTo(pantryScrollBefore,0);
        await p.screenshot({path:'data/qa-critter-kitchen/planning-pantry-confirm.png'});await p.locator('#ck-commit').click();await expect(p.locator('.ck-choice-dialog')).toBeVisible();await p.locator('#ck-choice-cancel').click();await expect(p.locator('.ck-placed-chef')).toHaveCount(3);
        await confirmButton(p,p.locator('#ck-commit'));await expect(p.locator('#ck-commit')).toHaveAttribute('aria-label','แก้ไขแผน');await expect(p.locator('#ck-commit')).toHaveClass(/ck-edit-plan/);await expect(p.locator('.ck-plan-lock svg rect').first()).toHaveAttribute('rx','2');await expect(p.locator('.ck-placed-chef .ck-plan-lock')).toHaveCount(3);await expect(p.locator('.ck-chefs .ck-plan-lock')).toHaveCount(3);await p.screenshot({path:'data/qa-critter-kitchen/planning-locked.png'});
        await confirmButton(p,p.locator('#ck-commit'));await expect(p.locator('.ck-plan-lock')).toHaveCount(0);await expect(p.locator('#ck-commit')).toHaveAttribute('aria-label','ยืนยันแผน');await expect(p.locator('.ck-placed-chef')).toHaveCount(3);await dragChefTo(p,'mouse','desert');await expect(p.locator('[data-destination="desert"] .ck-placed-chef')).toHaveAttribute('data-placed-chef','mouse');
        const beforeTakeover=await p.locator('.ck-workspace-heading').boundingBox(),replacement=await p.context().newPage();await capture(replacement);await replacement.goto(url+'/play/'+code);await expect(p.locator('#notice')).toContainText('เซสชันนี้เปิดในอีกหน้าจอ');await expect(p.locator('#notice')).toHaveClass(/session-toast/);await expect(p.locator('#notice')).toHaveCSS('position','fixed');expect(await p.locator('.ck-workspace-heading').boundingBox()).toEqual(beforeTakeover);expect(await p.evaluate(()=>document.documentElement.scrollHeight)).toBeLessThanOrEqual(844);await p.screenshot({path:'data/qa-critter-kitchen/planning-session-toast.png'});
        const currentPhones=[replacement,...phones.slice(1)];
        for(const phone of currentPhones){for(const [id,loc] of [['mouse','garden'],['lizard','soup'],['boar','academy']])await dragChefTo(phone,id,loc);await confirmButton(phone,phone.locator('#ck-commit'));}
        await startMarket(replacement);await expect(replacement.locator('.ck-shopping-chef')).toHaveCount(5);await expect(replacement.locator('.ck-shopping-chef.is-active')).toHaveCount(1);await expect(replacement.locator('.ck-shopping-chef:not(.is-active)')).toHaveCount(4);
        const market=await read(host);await expect(replacement.locator('.ck-shopping-chef.is-active')).toHaveAttribute('data-visit-actor',market.turn!);await expect(replacement.locator('.ck-shopping-chef:not(.is-active)').first()).toHaveCSS('filter','grayscale(1)');const visitorBoxes=await replacement.locator('.ck-shopping-chef').evaluateAll(es=>es.map(e=>e.getBoundingClientRect()));expect(visitorBoxes.every(r=>Math.abs(r.width-r.height)<1&&r.right<=390)).toBe(true);await replacement.screenshot({path:'data/qa-critter-kitchen/shopping-five-chefs.png'});
        await replacement.locator('.ck-shopping-chef:not(.is-active)').first().click();await expect(replacement.locator('.ck-chef-detail')).toBeVisible();await replacement.keyboard.press('Escape');
        await expect(replacement.locator('.ck-shopping-chefs .ck-chef-caption').first()).not.toBeVisible();
        const identities=await Promise.all(currentPhones.map(read)),actorPhone=currentPhones[identities.findIndex(v=>v.me!.id===market.turn)];
        const beforePick=await read(host);await confirmButton(actorPhone,actorPhone.locator('[data-buy="soup"]'));await revision(host,beforePick.revision+1);await revision(actorPhone,beforePick.revision+1);
        const nextVisitor=await read(host);expect(nextVisitor.turn).not.toBe(market.turn);await expect(replacement.locator('.ck-shopping-chef')).toHaveCount(5);await expect(replacement.locator('.ck-shopping-chef.is-active')).toHaveAttribute('data-visit-actor',nextVisitor.turn!);await expect(replacement.locator(`.ck-shopping-chef[data-visit-actor="${market.turn}"]`)).toHaveCSS('filter','grayscale(1)');await replacement.screenshot({path:'data/qa-critter-kitchen/shopping-five-chefs-next.png'});


    }finally{for(const c of contexts)await c.close();await app.close();await rm(dir,{recursive:true,force:true});}
});

test('Critter Kitchen refrigeration: ten-card review, four-column selection and waiting market navigation',async({browser})=>{
    test.setTimeout(45000);
    const dir=await mkdtemp(join(tmpdir(),'ck-fridge-')),app=await startServer(0,'127.0.0.1',true,seeded(910),{storePath:join(dir,'rooms.sqlite')}),url=`http://localhost:${(app.server.address() as any).port}`,contexts:BrowserContext[]=[];
    try{
        const hc=await browser.newContext({viewport:{width:1440,height:1000}});contexts.push(hc);const host=await hc.newPage();await capture(host);await host.goto(url+'/games/critter-kitchen');await testAccount(host,app);await createDisplayRoom(host);await expect(host.locator('#qr')).toBeVisible();const code=await host.locator('.room-code strong').innerText(),phones:Page[]=[];
        for(let i=0;i<2;i++){const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});contexts.push(c);const p=await c.newPage();await capture(p);phones.push(p);await p.goto(url+'/play/'+code);await p.getByRole('textbox',{name:'ชื่อของคุณ'}).fill('เชฟตู้เย็น '+i);await p.getByRole('button',{name:'เข้าห้อง',exact:true}).click();await p.getByRole('button',{name:'พร้อมเล่น',exact:true}).click();}
        await host.locator('#start').click();await continueOpening(host);await expect(host.locator('.ck-root')).toHaveAttribute('data-phase','planning');
        const room=app.rooms.rooms.get(code)!,state=room.ck!;
        const learner=phones[0],other=phones[1];
        for(const p of phones)await revision(p,room.revision);
        await learner.locator('[data-tab="board"]').click();
        const midnightMarket=learner.locator('[data-location-card="midnight"]');await expect(midnightMarket.locator('.ck-mystery-card')).toHaveCount(state.config.locations.find(l=>l.id==='midnight')!.slots);await expect(midnightMarket.locator('header')).toHaveCSS('filter','none');await expect(midnightMarket.locator('.ck-market-empty')).toHaveCount(0);
        await learner.locator('.ck-location-caption>strong').first().click();await expect(learner.locator('.ck-dialog[open]')).toHaveCount(0);
        for(const p of phones){await p.locator('[data-tab="information"]').click();await expect(p.locator('.ck-root')).toHaveAttribute('data-workspace','information');await expect(p.locator('.ck-reference-section')).toHaveCount(3);await expect(p.locator('.ck-reference-grid').first().locator('.ck-reference-slot')).toHaveCount(6);await expect(p.locator('.ck-reference-grid').last().locator('.ck-reference-slot')).toHaveCount(3);await expect(p.locator('.ck-layout')).not.toBeVisible();await expect(p.locator('.ck-menu-cards')).toHaveCount(0);}
        const challengeBoxes=await learner.locator('.ck-reference-grid').first().locator('.ck-reference-slot').evaluateAll(es=>es.map(e=>e.getBoundingClientRect()));expect(challengeBoxes[0].top).toBe(challengeBoxes[2].top);expect(challengeBoxes[3].top).toBeGreaterThan(challengeBoxes[0].bottom);
        const marketLoc=state.config.locations.find(loc=>loc.slots>0)!.id,marketTokens=state.bag.filter(id=>TOKEN[id].kind==='ingredient').slice(0,12);state.bag=state.bag.filter(id=>!marketTokens.includes(id));state.locations[marketLoc].push(...marketTokens);
        state.players[0].known[0]=state.rumors[0];state.revealed=3;room.revision++;(app.rooms as any).broadcast(room,true);for(const p of phones)await revision(p,room.revision);
        await expect(learner.locator(`.ck-reference [data-detail="rumor:${state.rumors[0]}"]`)).toHaveCount(1);await expect(other.locator(`.ck-reference [data-detail="rumor:${state.rumors[0]}"]`)).toHaveCount(0);await expect(other.locator('.ck-reference-grid').last().locator('.ck-reference-back')).toHaveCount(3);
        await learner.locator('.ck-reference-grid').last().scrollIntoViewIfNeeded();expect(await learner.evaluate(()=>scrollY)).toBeGreaterThan(0);expect(await learner.locator('.ck-reference').evaluate(e=>e.scrollHeight<=e.clientHeight+1)).toBe(true);
        const referenceScroll=await learner.evaluate(()=>{(window as any).__referenceImages=[...document.querySelectorAll('.ck-reference .ck-card>.ck-art')];return scrollY;});
        const criticBox=await learner.locator('.ck-reference-critic .ck-card').boundingBox(),challengeBox=await learner.locator('.ck-reference-grid .ck-card').first().boundingBox();expect(criticBox!.width).toBeCloseTo(challengeBox!.width,0);expect(criticBox!.height).toBeCloseTo(challengeBox!.height,0);
        await expect(learner.locator('.ck-reference-back').first()).toHaveCSS('filter','grayscale(1)');await expect(learner.locator('.ck-reference-foods img').first()).toHaveCSS('filter','none');await expect(learner.locator('.ck-reference-foods>span').first()).toHaveCSS('border-radius','50%');await expect(learner.locator('.ck-reference-caption .ck-reference-hold')).toHaveCount(2);await expect(learner.locator('.ck-reference-slot>.ck-reference-note')).toHaveCount(0);
        const criticText=await learner.locator('.ck-reference-critic>p').boundingBox();expect(criticText!.x).toBeGreaterThan(criticBox!.x+criticBox!.width);await expect(learner.locator('.ck-reference-critic>p')).not.toBeEmpty();
        await expect(learner.locator('.ck-reference-index')).toHaveCount(9);expect(await learner.locator('.ck-reference-index').allTextContents()).toEqual(['Challenge 1','Challenge 2','Challenge 3','Challenge 4','Challenge 5','Challenge 6','ข่าวลือ 1','ข่าวลือ 2','ข่าวลือ 3']);const topIndices=await learner.locator('.ck-reference-index').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(),card=e.parentElement!.getBoundingClientRect();return Math.abs(r.top-card.top)<=2&&Math.abs(r.left+r.width/2-card.left-card.width/2)<1;}));expect(topIndices.every(Boolean)).toBe(true);await expect(learner.locator('.ck-reference-slot>h3')).toHaveCount(0);const circles=await learner.locator('.ck-reference-foods>span').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return Math.abs(r.width-r.height)<1;}));expect(circles.every(Boolean)).toBe(true);
        await expect(learner.locator('.ck-reference-foods')).toHaveCount(3);await expect(learner.locator('.ck-reference-caption>strong').first()).toHaveCSS('color','rgb(255, 251, 238)');
        await learner.locator('[data-tab="board"]').dispatchEvent('click');const marketRail=learner.locator(`[data-location-card="${marketLoc}"] .ck-market-stock`);
        await expect.poll(()=>marketRail.evaluate(e=>e.scrollWidth>e.clientWidth)).toBe(true);await expect.poll(()=>marketRail.evaluate(e=>(e as HTMLElement).style.getPropertyValue('--ck-resource-width'))).not.toBe('');const marketFit=await marketRail.evaluate(e=>{e.scrollLeft=80;(window as any).__marketImage=e.querySelector('img');return {left:e.scrollLeft,width:e.querySelector('.ck-market-token')!.getBoundingClientRect().width};});
        const marketSpacing=await marketRail.evaluate(e=>{const r=e.getBoundingClientRect(),item=e.firstElementChild!.getBoundingClientRect();return Math.abs((item.top-r.top)-(r.top+e.clientHeight-item.bottom));});expect(marketSpacing).toBeLessThanOrEqual(1);
        for(const workspace of ['kitchen','board','information']){await learner.locator(`[data-tab="${workspace}"]`).dispatchEvent('click');const gap=await learner.evaluate((workspace)=>{const root=document.querySelector('.ck-root')!,heading=root.querySelector('.ck-workspace-heading')!,panel=root.querySelector(workspace==='board'?'.ck-board':workspace==='information'?'.ck-reference':'.ck-action')!;return panel.getBoundingClientRect().top-heading.getBoundingClientRect().bottom;},workspace);expect(gap).toBeCloseTo(8,0);}
        expect(await learner.evaluate(()=>scrollY)).toBe(referenceScroll);
        expect(await learner.evaluate(()=>(window as any).__referenceImages.every((img:Element,i:number)=>img===document.querySelectorAll('.ck-reference .ck-card>.ck-art')[i]))).toBe(true);
        await learner.locator('[data-tab="board"]').dispatchEvent('click');expect(await marketRail.evaluate(e=>({left:e.scrollLeft,width:e.querySelector('.ck-market-token')!.getBoundingClientRect().width}))).toEqual(marketFit);expect(await marketRail.evaluate(e=>(window as any).__marketImage===e.querySelector('img'))).toBe(true);
        const headingTops=[];for(const workspace of ['kitchen','board','information']){await learner.locator(`[data-tab="${workspace}"]`).dispatchEvent('click');headingTops.push(await learner.locator('.ck-workspace-heading').evaluate(e=>e.getBoundingClientRect().top+scrollY));}expect(Math.max(...headingTops)-Math.min(...headingTops)).toBeLessThanOrEqual(1);
        await learner.locator('[data-tab="information"]').dispatchEvent('click');await learner.evaluate(()=>scrollTo(0,0));await learner.screenshot({path:'data/qa-critter-kitchen/reference-album.png',fullPage:true});await learner.locator('.ck-reference-critic [data-detail]').click();await expect(learner.locator('.ck-reference-detail-dialog')).toBeVisible();await expect.poll(()=>learner.locator('.ck-reference-detail>.ck-art').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);await learner.screenshot({path:'data/qa-critter-kitchen/reference-critic-popup.png'});await learner.keyboard.press('Escape');await learner.locator('.ck-reference-grid [data-detail^="rumor:"]').first().click();await expect(learner.locator('.ck-reference-detail-caption p')).toBeVisible();await expect.poll(()=>learner.locator('.ck-reference-detail>.ck-art').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);await learner.screenshot({path:'data/qa-critter-kitchen/reference-rumor-popup.png'});await learner.keyboard.press('Escape');
        await learner.locator('.ck-reference-grid [data-detail^="challenge:"]').first().click();await expect.poll(()=>learner.locator('.ck-challenge-detail>.ck-art').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);await expect(learner.locator('.ck-challenge-detail-foods>span')).toHaveCount(3);await expect(learner.locator('.ck-challenge-detail-foods strong')).toHaveCount(3);await expect(learner.locator('.ck-dialog-body>.ck-foods,.ck-dialog-body>p')).toHaveCount(0);const detailImage=await learner.locator('.ck-challenge-detail>.ck-art').boundingBox(),detailFoods=await learner.locator('.ck-challenge-detail-foods').boundingBox();expect(detailFoods!.y+detailFoods!.height).toBeLessThanOrEqual(detailImage!.y+detailImage!.height);expect(await learner.locator('.ck-reference-detail>h2').evaluate(e=>getComputedStyle(e).textAlign)).toBe('center');await learner.screenshot({path:'data/qa-critter-kitchen/reference-challenge-detail.png'});await learner.keyboard.press('Escape');
        state.revealed=6;room.revision++;(app.rooms as any).broadcast(room,true);await revision(learner,room.revision);
        await expect(learner.locator('.ck-held .ck-reference-foods>.ck-omitted-food>svg')).toHaveCount(2);await expect(learner.locator('.ck-held .ck-omitted-food').first()).toHaveCSS('opacity','1');
        const heldOrder=await learner.locator('.ck-held .ck-reference-caption').evaluateAll(es=>es.every(e=>{const name=e.querySelector('strong')!.getBoundingClientRect(),note=e.querySelector('.ck-reference-hold')!.getBoundingClientRect(),foods=e.querySelector('.ck-reference-foods')!.getBoundingClientRect();return note.top>=name.bottom&&foods.top>=note.bottom;}));expect(heldOrder).toBe(true);
        await learner.evaluate(()=>scrollTo(0,0));await learner.screenshot({path:'data/qa-critter-kitchen/reference-held-foods.png',fullPage:true});await learner.locator('.ck-held [data-detail]').first().click();await expect(learner.locator('.ck-challenge-held .ck-omitted-food>svg')).toHaveCount(1);await learner.screenshot({path:'data/qa-critter-kitchen/reference-held-detail.png'});await learner.keyboard.press('Escape');
        state.phase='running';room.revision++;(app.rooms as any).broadcast(room,true);for(const p of phones){await revision(p,room.revision);await expect(p.locator('.ck-root')).toHaveAttribute('data-workspace','kitchen');await expect(p.locator('.ck-reference')).not.toBeVisible();}
        state.phase='refrigeration';state.round=6;state.critic='mouse';state.pending=null;state.tasks=[];state.players.forEach(p=>{p.meals=null;p.fridgeReady=true;});
        // Isolated UI fixture: move physical tokens out of the bag, preserving ownership.
        const stock=state.bag.filter(id=>TOKEN[id].kind==='ingredient').slice(0,14);state.bag=state.bag.filter(id=>!stock.includes(id));state.players[0].storage.push(...stock);state.players[0].fridgeReady=false;room.revision++;(app.rooms as any).broadcast(room,true);
        const actor=phones[0],waiting=phones[1];for(const p of phones)await revision(p,room.revision);
        await expect(actor.locator('#ck-fridge')).toBeDisabled();await expect(actor.locator('.ck-title>strong')).toBeEmpty();await expect(waiting.locator('.ck-wait-scene')).toContainText('รอเพื่อนจัดตู้เย็น');await expect(waiting.locator('.ck-action')).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
        await expect.poll(()=>waiting.locator('.ck-wait-scene img').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);await waiting.screenshot({path:'data/qa-critter-kitchen/fridge-wait.png'});
        await waiting.locator('[data-tab="board"]').click();await expect(waiting.locator('.ck-board')).toBeVisible();await expect(waiting.locator('.ck-wait-scene')).not.toBeVisible();await waiting.locator('[data-tab="kitchen"]').click();await expect(waiting.locator('.ck-wait-scene')).toBeVisible();
        for(const id of stock.slice(0,9))await actor.locator(`[data-keep="${id}"]`).click();await expect(actor.locator('#ck-fridge')).toBeDisabled();await actor.locator(`[data-keep="${stock[9]}"]`).click();await expect(actor.locator('#ck-fridge')).toBeEnabled();await expect(actor.locator('.ck-fridge-grid .ck-will-discard')).toHaveCount(4);await expect(actor.locator('.ck-will-discard .ck-token').first()).toHaveCSS('filter','grayscale(1)');
        await actor.locator('#ck-fridge').click();const cards=actor.locator('.ck-fridge-review .ck-token');await expect(cards).toHaveCount(10);const boxes=await cards.evaluateAll(es=>es.map(e=>e.getBoundingClientRect()));expect(boxes[4].top).toBe(boxes[0].top);expect(boxes[5].top).toBeGreaterThan(boxes[0].bottom);expect(boxes[9].top).toBe(boxes[5].top);expect(await actor.locator('.ck-fridge-review').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);await actor.screenshot({path:'data/qa-critter-kitchen/fridge-ten-review.png'});
        for(const motion of ['reduce','no-preference'] as const){await waiting.emulateMedia({reducedMotion:motion});await expect.poll(()=>waiting.locator('.ck-wait-scene img').evaluate((img:HTMLImageElement)=>img.currentSrc)).toContain(motion==='reduce'?'wait-chef-poster.webp':'wait-chef.webp');}
        await actor.locator('#ck-choice-cancel').click();state.phase='challenge';state.players[0].meals=[emptyMeal(),emptyMeal(),emptyMeal()];state.players[1].meals=null;room.revision++;(app.rooms as any).broadcast(room,true);await revision(actor,room.revision);await expect(actor.locator('.ck-serving-wait img')).toBeVisible();expect((await actor.locator('.ck-title').boundingBox())!.height).toBe(0);await expect(actor.locator('.ck-action')).toHaveCSS('background-color','rgba(0, 0, 0, 0)');await actor.screenshot({path:'data/qa-critter-kitchen/serving-wait-final.png'});
        // Adding/removing a far-right resource must retain the fitted, scrolled pantry rail.
        state.phase='challenge';state.round=3;state.players[0].meals=null;state.players[1].meals=null;state.players[0].storage=FOODS.flatMap(food=>Object.keys(TOKEN).filter(id=>TOKEN[id].kind==='ingredient'&&TOKEN[id].food===food).slice(-4));room.revision++;(app.rooms as any).broadcast(room,true);await revision(actor,room.revision);
        const servingRail=actor.locator('.ck-cook-source'),farFood=servingRail.locator('[data-add]').last();await farFood.scrollIntoViewIfNeeded();const servingOffset=await servingRail.evaluate(e=>e.scrollLeft);expect(servingOffset).toBeGreaterThan(0);await farFood.click();await expect(actor.locator('.ck-dish-item')).toHaveCount(1);await expect.poll(()=>servingRail.evaluate(e=>e.scrollLeft)).toBeCloseTo(servingOffset,0);await actor.locator('[data-remove]').click();await expect(actor.locator('.ck-dish-item')).toHaveCount(0);await expect.poll(()=>servingRail.evaluate(e=>e.scrollLeft)).toBeCloseTo(servingOffset,0);
        const choose=(food:string,value:number,kind='ingredient')=>Object.keys(TOKEN).find(id=>TOKEN[id].food===food&&TOKEN[id].value===value&&TOKEN[id].kind===kind)!;
        const fishHigh=choose('fish',5),fishLow=choose('fish',2),mushroom=choose('mushroom',4),spice=Object.keys(TOKEN).find(id=>TOKEN[id].kind==='spice'&&TOKEN[id].food==='fish')!;
        const finalStock=[fishLow,mushroom,fishHigh,spice];expect(finalStock.every(Boolean)).toBe(true);state.bag=state.bag.filter(id=>!finalStock.includes(id));for(const ids of Object.values(state.locations))for(const id of finalStock){const at=ids.indexOf(id);if(at>=0)ids.splice(at,1);}state.discard.push(...state.players[0].storage.filter(id=>!finalStock.includes(id)));state.players[0].storage=finalStock;state.players[0].meals=null;state.phase='critic';state.round=7;state.critic='badger';room.revision++;(app.rooms as any).broadcast(room,true);await revision(actor,room.revision);
        await actor.locator(`[data-add="${fishHigh}"]`).click();await expect(actor.locator(`[data-add="${fishLow}"]`)).toHaveCount(0);await expect(actor.locator('.ck-in-dish').filter({has:actor.locator(`[data-token-detail="${fishLow}"]`)}).locator('[data-token-detail]')).toHaveCSS('filter','grayscale(1)');
        await actor.locator('.ck-final-selected [data-toggle-spice]').check();await actor.locator('.ck-final-crown').click();await expect(actor.locator(`[data-add="${fishLow}"]`)).toBeVisible();await actor.locator(`[data-add="${fishHigh}"]`).click();await actor.locator(`[data-add="${mushroom}"]`).click();await actor.locator('[data-as]').selectOption('carrot');await expect(actor.locator('#ck-serve')).toBeEnabled();await expect(actor.locator('.ck-dish-rail')).toHaveCount(0);await actor.locator('#ck-serve').click();await expect(actor.locator('.ck-final-review-grid .ck-review-resource')).toHaveCount(2);await expect(actor.locator('.ck-final-serving-dialog .ck-meal-review')).toHaveCount(0);expect((await actor.locator('.ck-final-serving-dialog').boundingBox())!.height).toBeLessThan(500);await actor.screenshot({path:'data/qa-critter-kitchen/final-direct-small-review.png'});await actor.locator('#ck-choice-cancel').click();await actor.screenshot({path:'data/qa-critter-kitchen/final-direct-crowns.png'});
        // A full pantry must fit without moving the page or hiding the serve button.
        while(await actor.locator('.ck-final-crown').count())await actor.locator('.ck-final-crown').first().click();
        state.players[0].storage=FOODS.flatMap(food=>Object.keys(TOKEN).filter(id=>TOKEN[id].kind==='ingredient'&&TOKEN[id].food===food).slice(0,3)).slice(0,19);
        room.revision++;(app.rooms as any).broadcast(room,true);await revision(actor,room.revision);
        for(const viewport of [{width:390,height:844},{width:320,height:568}]){
            await actor.setViewportSize(viewport);
            if(!await actor.locator('.ck-final-crown').count())await actor.locator('.ck-final-cooking [data-add]').first().click();
            await expect(actor.locator('.ck-final-crown')).toBeVisible();
            await expect.poll(()=>actor.evaluate(()=>{
                const root=document.querySelector('.ck-root')!,source=root.querySelector('.ck-cook-source')!,footer=root.querySelector('.ck-serve-footer')!,heading=root.querySelector('.ck-workspace-heading')!,action=root.querySelector('.ck-action')!;
                return document.documentElement.scrollHeight<=innerHeight+1&&source.scrollHeight<=source.clientHeight+1&&footer.getBoundingClientRect().bottom<=innerHeight&&action.getBoundingClientRect().top-heading.getBoundingClientRect().bottom>=7;
            })).toBe(true);
            const circles=await actor.locator('.ck-final-cooking .ck-buy-button').evaluateAll(buttons=>buttons.map(button=>{
                const b=button.getBoundingClientRect(),s=button.querySelector('svg')!.getBoundingClientRect();
                return Math.abs(b.left+b.width/2-s.left-s.width/2)<1&&Math.abs(b.top+b.height/2-s.top-s.height/2)<1;
            }));expect(circles.length).toBeGreaterThan(0);expect(circles.every(Boolean)).toBe(true);
            await actor.screenshot({path:`data/qa-critter-kitchen/final-fit-${viewport.width}.png`});
        }

    }finally{for(const c of contexts)await c.close();await app.close();await rm(dir,{recursive:true,force:true});}
});

test('Critter Kitchen new Challenge: final market purchase reveals public foods before next planning',async({browser})=>{
    test.setTimeout(45000);
    const dir=await mkdtemp(join(tmpdir(),'ck-new-challenge-')),app=await startServer(0,'127.0.0.1',true,seeded(910),{storePath:join(dir,'rooms.sqlite')}),url=`http://localhost:${(app.server.address() as any).port}`,contexts:BrowserContext[]=[];
    try{
        const hc=await browser.newContext({viewport:{width:1440,height:1000}});contexts.push(hc);const host=await hc.newPage();await capture(host);await host.goto(url+'/games/critter-kitchen');await testAccount(host,app);await createDisplayRoom(host);await expect(host.locator('#qr')).toBeVisible();const code=await host.locator('.room-code strong').innerText(),phones:Page[]=[];
        for(let i=0;i<2;i++){const c=await browser.newContext({viewport:{width:360,height:640},isMobile:true,hasTouch:true,reducedMotion:i?'reduce':'no-preference'});contexts.push(c);const p=await c.newPage();await capture(p);phones.push(p);await p.goto(url+'/play/'+code);await p.getByRole('textbox',{name:'ชื่อของคุณ'}).fill('เชฟเปิดการ์ด '+i);await p.getByRole('button',{name:'เข้าห้อง',exact:true}).click();await p.getByRole('button',{name:'พร้อมเล่น',exact:true}).click();}
        await host.locator('#start').click();await continueOpening(host);for(const p of phones)await expect(p.locator('.ck-root')).toHaveAttribute('data-phase','planning');
        const room=app.rooms.rooms.get(code)!;let state=room.ck!;const actor=state.players[0].id;
        state.phase='shopping';state.location='soup';state.visits=[{id:'last-visit',actor,chef:'mouse',loc:'soup',capacity:1,limit:1,used:0,gained:0,done:false,started:true,newton:false}];state.pending={kind:'pick',actor,visit:'last-visit',loc:'soup',extra:false,fallback:false};state.tasks=[{kind:'end-round'}];
        room.revision++;(app.rooms as any).broadcast(room,true);for(const p of phones)await revision(p,room.revision);
        await confirmButton(phones[0],phones[0].locator('[data-buy="soup"]'));
        await expect.poll(async()=>(await read(host)).round).toBe(2);
        for(const page of [host,...phones]){
            const reveal=page.locator('.ck-challenge-reveal');await expect(reveal).toBeVisible();await expect(reveal.locator('h2')).toHaveText('Challenge 2');await expect(reveal.locator('.ck-new-challenge-foods>div>span')).toHaveCount(3);
            const ids=await reveal.locator('.ck-new-challenge-foods img').evaluateAll(es=>es.map(e=>(e as HTMLImageElement).getAttribute('src')));expect(ids).toEqual(CHALLENGE[state.challenges[1]].foods.map(food=>`/art/critter-kitchen/thumbs/ingredient-${food}.webp`));
            await expect(reveal.locator('.ck-new-challenge-foods button')).toBeVisible();
        }
        await phones[0].screenshot({path:'data/qa-critter-kitchen/new-challenge-reveal.png'});
        expect(await phones[1].locator('.ck-challenge-flipper').evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
        room.revision++;(app.rooms as any).broadcast(room,true);for(const p of phones)await revision(p,room.revision);await expect(phones[0].locator('.ck-challenge-reveal')).toHaveCount(1);
        await phones[0].reload();await expect(phones[0].locator('.ck-challenge-reveal')).toBeVisible();expect(await phones[0].locator('.ck-challenge-flipper').evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
        const sc=await browser.newContext({viewport:{width:1024,height:768}});contexts.push(sc);const spectator=await sc.newPage();await capture(spectator);await spectator.goto(url+'/display/'+code);await expect(spectator.locator('.ck-challenge-reveal')).toBeVisible();await expect(spectator.locator('.ck-challenge-reveal button')).toHaveCount(0);
        const beforeContinue=room.revision;await phones[1].locator('.ck-challenge-reveal button').click();for(const p of [host,...phones,spectator]){await revision(p,beforeContinue+1);await expect(p.locator('.ck-challenge-reveal')).toHaveCount(0);}expect(room.ck!.challengeReveal).toBeUndefined();expect(room.ck!.round).toBe(2);
        room.revision++;(app.rooms as any).broadcast(room,true);for(const p of phones){await revision(p,room.revision);await expect(p.locator('.ck-challenge-reveal')).toHaveCount(0);}
        await phones[0].reload();await expect(phones[0].locator('.ck-route-planner')).toBeVisible();await expect(phones[0].locator('.ck-challenge-reveal')).toHaveCount(0);
        // The third card reveals its held/excluded ingredient rather than promising all three.
        state=room.ck!;state.phase='shopping';state.round=2;state.location='soup';state.visits=[{id:'last-visit-2',actor,chef:'mouse',loc:'soup',capacity:1,limit:1,used:0,gained:0,done:false,started:true,newton:false}];state.pending={kind:'pick',actor,visit:'last-visit-2',loc:'soup',extra:false,fallback:false};state.tasks=[{kind:'end-round'}];room.revision++;(app.rooms as any).broadcast(room,true);for(const p of phones)await revision(p,room.revision);
        await confirmButton(phones[0],phones[0].locator('[data-buy="soup"]'));await expect(phones[0].locator('.ck-challenge-reveal h2')).toHaveText('Challenge 3');await expect(phones[0].locator('.ck-new-food-omitted')).toHaveCount(1);await expect(phones[0].locator('.ck-new-challenge-foods>p').filter({hasText:'ไม่ใช้วัตถุดิบขวาสุด'})).toHaveText('ไม่ใช้วัตถุดิบขวาสุด');await phones[0].waitForTimeout(7000);await expect(phones[0].locator('.ck-challenge-reveal')).toBeVisible();const raceRevision=room.revision;await Promise.all(phones.map(p=>p.locator('.ck-challenge-reveal button').evaluate((button:HTMLButtonElement)=>button.click())));for(const p of [host,...phones]){await revision(p,raceRevision+1);await expect(p.locator('.ck-challenge-reveal')).toHaveCount(0);}expect(room.revision).toBe(raceRevision+1);expect(room.ck!.round).toBe(3);await expect(phones[0].locator('.ck-route-planner')).toBeVisible();
    }finally{for(const c of contexts)await c.close();await app.close();await rm(dir,{recursive:true,force:true});}
});

test('Critter Kitchen shared display: responsive public panorama, colored visits, moving priority and live sold stock',async({browser})=>{
 test.setTimeout(120000);let pairPortrait=0;
 for(const count of [2,5]){
  const dir=await mkdtemp(join(tmpdir(),'ck-display-')),app=await startServer(0,'127.0.0.1',true,seeded(910),{storePath:join(dir,'rooms.sqlite')}),url=`http://localhost:${(app.server.address() as any).port}`,contexts:BrowserContext[]=[];
  try{
   const hc=await browser.newContext({viewport:{width:1440,height:900}});contexts.push(hc);const host=await hc.newPage();await capture(host);await host.addInitScript(()=>{(window as any).__queueMoves=[];const animate=Element.prototype.animate;Element.prototype.animate=function(...args:Parameters<Element['animate']>){if(this.hasAttribute('data-priority-player'))(window as any).__queueMoves.push(this.getAttribute('data-priority-player'));return animate.apply(this,args);};});await host.goto(url+'/games/critter-kitchen');await testAccount(host,app);await createDisplayRoom(host);await expect(host.locator('#qr')).toBeVisible();const code=await host.locator('.room-code strong').innerText(),phones:Page[]=[];
   for(let i=0;i<count;i++){const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});contexts.push(c);const p=await c.newPage();await capture(p);phones.push(p);await p.goto(url+'/play/'+code);await p.getByRole('textbox',{name:'ชื่อของคุณ'}).fill('ครัว '+(i+1));await p.getByRole('button',{name:'เข้าห้อง',exact:true}).click();await p.getByRole('button',{name:'พร้อมเล่น',exact:true}).click();}
   await host.locator('#start').click();await continueOpening(host);await expect(host.locator('.ck-d-dashboard')).toBeVisible();const room=app.rooms.rooms.get(code)!,state=room.ck!,garden='garden';
   const extras=state.bag.filter(id=>TOKEN[id].kind==='ingredient').slice(0,30);state.bag=state.bag.filter(id=>!extras.includes(id));state.locations[garden].push(...extras);room.revision++;(app.rooms as any).broadcast(room,true);for(const p of [host,...phones])await revision(p,room.revision);
   await expect(host.locator('.ck-d-references')).not.toContainText('แตะเพื่ออ่านเงื่อนไข');await expect(phones[0].locator('.ck-stage-round')).toHaveText('รอบที่ 1/7');await expect(phones[0].locator('.ck-title .ck-round-badge')).toHaveCount(0);await expect(host.locator('.ck-d-visitor')).toHaveCount(0);expect((await read(host)).me).toBeUndefined();expect((await read(host)).players.every(p=>p.plan===null)).toBe(true);await expect(host.locator('.ck-d-rumors .is-hidden')).toHaveCount(3);
   const mysteryCount=state.config.locations.find(l=>l.id==='midnight')!.slots;
   await expect(host.locator('[data-display-location="midnight"] .ck-mystery-card')).toHaveCount(mysteryCount);await expect(host.locator('[data-display-location="midnight"] .ck-d-empty')).toHaveCount(0);
   await expect(phones[0].locator('[data-destination="midnight"] .ck-mystery-circle')).toHaveCount(mysteryCount);await expect(phones[0].locator('[data-destination="midnight"]>.ck-route-cover')).toHaveCSS('filter','grayscale(1)');await phones[0].locator('[data-destination="midnight"]').scrollIntoViewIfNeeded();await expect(phones[0].locator('[data-destination="midnight"] .ck-mystery-circle').first()).toBeInViewport();await phones[0].screenshot({path:`data/qa-critter-kitchen/midnight-planning-${count}.png`});
   await phones[0].locator('[data-tab="board"]').click();await expect(phones[0].locator('[data-location-card="midnight"] .ck-mystery-card')).toHaveCount(mysteryCount);await expect(phones[0].locator('[data-location-card="midnight"]>header')).toHaveCSS('filter','none');await phones[0].locator('[data-location-card="midnight"]').scrollIntoViewIfNeeded();await phones[0].screenshot({path:`data/qa-critter-kitchen/midnight-market-${count}.png`});await phones[0].locator('[data-tab="kitchen"]').click();
   for(const size of [{width:1440,height:900},{width:1024,height:768},{width:864,height:649},{width:1084,height:604},{width:1920,height:1080}]){
    await host.setViewportSize(size);await expect.poll(()=>host.locator('.ck-d-stock').first().evaluate(e=>(e as HTMLElement).style.getPropertyValue('--display-face-height'))).not.toBe('');
    const bounds=await host.locator('.ck-d-shops,.ck-d-priority,.ck-d-references,.ck-d-footer').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));expect(bounds.every(r=>r.width>0&&r.height>0&&r.left>=0&&r.right<=size.width+1&&r.bottom<=size.height+1),JSON.stringify(bounds)).toBe(true);expect(await host.evaluate(()=>document.documentElement.scrollHeight)).toBeLessThanOrEqual(size.height);expect(await host.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(size.width);
    const faces=await host.locator('.ck-d-stock .ck-d-item').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();const rail=e.closest('.ck-d-stock')!.getBoundingClientRect();return {width:r.width,height:r.height,fits:r.top>=rail.top-1&&r.bottom<=rail.bottom+1};}));expect(faces.every(r=>Math.abs(r.width-72)<1&&Math.abs(r.height-110)<1&&r.fits)).toBe(true);await expect(host.locator('.ck-d-shop')).toHaveCount(state.config.locations.length);await expect(host.locator('[data-priority-player]')).toHaveCount(count);const sameChef=await host.locator('.ck-d-queue-portrait>.ck-art').evaluateAll(es=>es.every(e=>e.getAttribute('src')!.endsWith('/boar.webp')));expect(sameChef).toBe(true);
    if(size.width===864){const portrait=await host.locator('.ck-d-queue-portrait').first().boundingBox();if(count===2)pairPortrait=portrait!.height;else expect(portrait!.height).toBeLessThan(pairPortrait);}
    await host.screenshot({path:`data/qa-critter-kitchen/display-${count}-${size.width}.png`});
   }
   await host.setViewportSize({width:1440,height:900});await host.locator('.ck-d-shops').evaluate(el=>el.scrollTop=0);
   for(const p of phones){for(const [chef,loc] of [['mouse','garden'],['lizard','soup'],['boar','academy']])await dragChefTo(p,chef,loc);await confirmButton(p,p.locator('#ck-commit'));}
   await expect(host.locator('.ck-root')).toHaveAttribute('data-phase','running');await expect(host.locator('.ck-d-visitor')).toHaveCount(0);expect((await read(host)).players.every(p=>p.plan===null)).toBe(true);
   const sc=await browser.newContext({viewport:{width:1024,height:768}});contexts.push(sc);const spectator=await sc.newPage();await capture(spectator);await spectator.goto(url+'/display/'+code);await expect(spectator.locator('.ck-d-visitor')).toHaveCount(0);await expect(spectator.locator('.ck-d-start')).toHaveCount(0);expect((await read(spectator)).me).toBeUndefined();
   await host.locator('.ck-d-start').click();await expect(host.locator('.ck-market-departure')).toBeVisible();await expect(host.locator('.ck-market-departure')).toHaveCount(0,{timeout:5000});
   await expect(host.locator('.ck-d-visitor')).toHaveCount(3*count);await expect(spectator.locator('.ck-d-visitor')).toHaveCount(3*count);const colorCount=await host.locator('[data-display-location="garden"] .ck-d-visitor').evaluateAll(es=>new Set(es.map(e=>(e as HTMLElement).style.getPropertyValue('--team'))).size);expect(colorCount).toBe(count);const visitorSizes=await host.locator('.ck-d-visitor').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().width));expect(visitorSizes.every(width=>width>=44)).toBe(true);await host.setViewportSize({width:1084,height:604});await host.screenshot({path:`data/qa-critter-kitchen/display-compact-visitors-${count}.png`});await host.setViewportSize({width:1440,height:900});const before=await read(host),actor=phones[(await Promise.all(phones.map(read))).findIndex(v=>v.me!.id===before.turn)],stock=host.locator('[data-display-stock="soup"]'),bisque=stock.locator('[data-display-item="bisque"]');await expect(bisque).toBeVisible();const order=await stock.locator('[data-display-item]').evaluateAll(es=>es.map(e=>e.getAttribute('data-display-item')));
   await confirmButton(actor,actor.locator('[data-buy="bisque"]'));await revision(host,before.revision+1);await expect(bisque).toHaveClass(/is-sold/);await expect(bisque.locator('.ck-d-sold')).toHaveText('หมด');await expect(bisque.locator('.ck-d-owners i')).toHaveCount(1);expect(await stock.locator('[data-display-item]').evaluateAll(es=>es.map(e=>e.getAttribute('data-display-item')))).toEqual(order);
   const after=await read(host);expect(await host.locator('[data-priority-player]').evaluateAll(es=>es.map(e=>e.getAttribute('data-priority-player')))).toEqual(after.priority);expect(await host.evaluate(()=>(window as any).__queueMoves.length)).toBeGreaterThan(0);await expect(host.locator('.ck-d-visitor.is-current')).toHaveCount(1);
   const busy=host.locator('[data-display-stock="garden"]');await expect.poll(()=>busy.evaluate(e=>e.scrollWidth>e.clientWidth)).toBe(true);await busy.evaluate(e=>e.scrollLeft=e.scrollWidth);const offset=await busy.evaluate(e=>e.scrollLeft);const liveRoom=app.rooms.rooms.get(code)!;liveRoom.revision++;(app.rooms as any).broadcast(liveRoom,true);await revision(host,liveRoom.revision);await expect.poll(()=>busy.evaluate(e=>e.scrollLeft)).toBeCloseTo(offset,0);
   await host.locator('.ck-d-critic [data-detail]').click();await expect(host.locator('.ck-reference-detail-dialog')).toBeVisible();await host.keyboard.press('Escape');await host.evaluate(async()=>{await Promise.all(document.querySelector('.ck-d-priority')!.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})));});await host.screenshot({path:`data/qa-critter-kitchen/display-live-${count}.png`});
   await expect(host.locator('[data-display-location="midnight"] .ck-mystery-card')).toHaveCount(mysteryCount);
   await host.emulateMedia({reducedMotion:'reduce'});const motions=await host.evaluate(()=>(window as any).__queueMoves.length);liveRoom.ck!.priority.reverse();liveRoom.revision++;(app.rooms as any).broadcast(liveRoom,true);await revision(host,liveRoom.revision);expect(await host.evaluate(()=>(window as any).__queueMoves.length)).toBe(motions);
   liveRoom.ck!.location='midnight';const drawn=liveRoom.ck!.bag.splice(-mysteryCount);liveRoom.ck!.locations.midnight.push(...drawn);liveRoom.revision++;(app.rooms as any).broadcast(liveRoom,true);await revision(host,liveRoom.revision);await expect(host.locator('[data-display-location="midnight"] .ck-mystery-card')).toHaveCount(0);await expect(host.locator('[data-display-location="midnight"] [data-display-item]')).toHaveCount(mysteryCount);
  }finally{for(const c of contexts)await c.close();await app.close();await rm(dir,{recursive:true,force:true});}
 }
});

test('Critter Kitchen final ceremony: synchronized manual questions, evidence, cumulative stars and restored progress',async({browser})=>{
 test.setTimeout(120000);
 for(const count of [2,5]){
  const dir=await mkdtemp(join(tmpdir(),'ck-ceremony-')),app=await startServer(0,'127.0.0.1',true,seeded(910),{storePath:join(dir,'rooms.sqlite')}),url=`http://localhost:${(app.server.address() as any).port}`,contexts:BrowserContext[]=[];
  try{
   const hc=await browser.newContext({viewport:{width:1440,height:900}});contexts.push(hc);const host=await hc.newPage();await capture(host);await host.addInitScript(()=>{(window as any).__starFlights=0;const original=Element.prototype.animate;Element.prototype.animate=function(...args:Parameters<Element['animate']>){if(this.classList.contains('ck-tally-flying-star'))(window as any).__starFlights++;return original.apply(this,args);};});await host.goto(url+'/games/critter-kitchen');await testAccount(host,app);await createDisplayRoom(host);await expect(host.locator('#qr')).toBeVisible();const code=await host.locator('.room-code strong').innerText(),phones:Page[]=[];
   for(let i=0;i<count;i++){const c=await browser.newContext({viewport:{width:320,height:568},isMobile:true,hasTouch:true,reducedMotion:i===1?'reduce':'no-preference'});contexts.push(c);const p=await c.newPage();p.setDefaultTimeout(8000);await capture(p);phones.push(p);await p.goto(url+'/play/'+code);await p.getByRole('textbox',{name:'ชื่อของคุณ'}).fill('ครัวดาว '+(i+1));await p.getByRole('button',{name:'เข้าห้อง',exact:true}).click();await p.getByRole('button',{name:'พร้อมเล่น',exact:true}).click();}
   await host.locator('#start').click();await continueOpening(host);await expect(host.locator('.ck-root')).toHaveAttribute('data-phase','planning');const room=app.rooms.rooms.get(code)!;let finished=room.ck!,guard=0;const random=seeded(1200+count);while(finished.phase!=='finished'&&guard++<1800){const next=botAction(finished,random);finished=ckEngine.applyAction(finished,next.actor,next.action,random);}expect(finished.phase).toBe('finished');const scores=structuredClone(finished.players.map(p=>p.score));room.ck=finished;room.revision++;(app.rooms as any).broadcast(room,true);for(const page of [host,...phones])await revision(page,room.revision);
   await phones[0].locator('[data-action="ck-reveal-results"]').click();for(const page of [host,...phones]){await revision(page,room.revision);await expect(page.locator('.ck-tally')).toHaveAttribute('data-reveal-step','0');await expect(page.locator('.ck-tally-award,.ck-final-results,.ck-tally-crown')).toHaveCount(0);}
   await host.screenshot({path:`data/qa-critter-kitchen/ceremony-question-${count}.png`});await phones[0].screenshot({path:`data/qa-critter-kitchen/ceremony-question-phone-${count}.png`});
   // No timer may answer the question for the room.
   await host.waitForTimeout(1400);expect((await read(host)).finalReveal!.step).toBe(0);
   await Promise.all([phones[0],phones[1]].map(page=>page.locator('[data-final-step]').evaluate((b:HTMLButtonElement)=>b.click())));
   await expect.poll(async()=>(await read(host)).finalReveal!.step).toBe(1);for(const page of [host,...phones])await expect(page.locator('.ck-tally')).toHaveAttribute('data-reveal-answered','true');
   await expect.poll(()=>phones[1].locator('[data-tally-total]').evaluateAll(es=>es.every(e=>e.textContent===e.getAttribute('data-tally-total')))).toBe(true);
   await phones[0].reload();await expect(phones[0].locator('.ck-tally')).toHaveAttribute('data-reveal-step','1');expect((await read(phones[0])).finalReveal).toEqual((await read(host)).finalReveal);
   const sc=await browser.newContext({viewport:{width:1024,height:768}});contexts.push(sc);const spectator=await sc.newPage();await capture(spectator);await spectator.goto(url+'/display/'+code);await expect(spectator.locator('.ck-tally')).toHaveAttribute('data-reveal-step','1');await expect(spectator.locator('[data-final-step],[data-final-skip]')).toHaveCount(0);
   let view=await read(host),steps=0,animated=false,fixtureView:CKView|undefined;
   while(!view.finalReveal!.complete&&steps++<100){
    const reveal=view.finalReveal!,actor=[host,...phones][reveal.step%(count+1)];await revision(actor,view.revision);
    await expect(host.locator('.ck-tally-crown')).toHaveCount(reveal.index===reveal.total-1&&reveal.answered?1:0);
    if(!reveal.answered){await expect(host.locator('.ck-tally-award')).toHaveCount(0);await expect(host.locator('.ck-tally-unanswered')).toHaveCount(count);}
    else{
     await expect(host.locator('.ck-tally-award')).toHaveCount(count);await expect(host.locator('.ck-tally-evidence')).toHaveCount(count);
     if(!animated&&reveal.item!.awards!.some(a=>a.stars>0)){await expect.poll(()=>host.locator('[data-tally-total]').evaluateAll(es=>es.every(e=>e.textContent===e.getAttribute('data-tally-total')))).toBe(true);animated=true;}
    }
    if(reveal.index===0||reveal.item!.card||reveal.index===reveal.total-1){
     const fit=await phones[0].locator('.ck-ceremony-dialog').evaluate(d=>{const body=d.querySelector('.ck-dialog-body')!,p=d.querySelector('.ck-tally-question p')!,q=d.querySelector('.ck-tally-question')!;return {dialog:d.scrollHeight<=d.clientHeight+1,body:body.scrollHeight<=body.clientHeight+1,rule:p.getBoundingClientRect().bottom<=q.getBoundingClientRect().bottom+1,evidence:[...d.querySelectorAll('.ck-tally-evidence')].every(e=>e.scrollHeight<=e.clientHeight+1)};});expect(fit,JSON.stringify({step:reveal.step,fit})).toEqual({dialog:true,body:true,rule:true,evidence:true});
     if(reveal.answered&&reveal.item!.card){fixtureView=structuredClone(view);await host.screenshot({path:`data/qa-critter-kitchen/ceremony-rumor-${count}.png`});await phones[0].screenshot({path:`data/qa-critter-kitchen/ceremony-rumor-phone-${count}.png`});}
    }
    if(reveal.index===reveal.total-1&&reveal.answered){await expect(host.locator('.ck-tally-winner')).toContainText(view.players.find(p=>view.winners.includes(p.id))!.name);await expect(host.locator('[data-final-skip]')).toHaveCount(0);await expect(host.locator('.ck-tally')).not.toContainText('ดาวรวมมากที่สุดชนะ');await phones[0].locator('.ck-tally-winner').evaluate(async e=>{await Promise.all(e.getAnimations().map(a=>a.finished.catch(()=>{})));});await expect(phones[0].locator('.ck-tally-winner')).toHaveCSS('opacity','1');await phones[0].screenshot({path:`data/qa-critter-kitchen/ceremony-winner-phone-${count}.png`});}
    const previous=view.revision;await actor.locator('[data-final-step]').click();await revision(host,previous+1);view=await read(host);expect(view.finalReveal!.step).toBe(reveal.step+1);expect(room.ck!.players.map(p=>p.score)).toEqual(scores);
   }
   expect(await host.evaluate(()=>(window as any).__starFlights)).toBeGreaterThan(0);
   expect(view.finalReveal!.complete).toBe(true);expect(view.finalReveal!.totals).toEqual(Object.fromEntries(view.players.map(p=>[p.id,p.score!.total])));await expect(host.locator('.ck-final-result-dialog')).toBeVisible();await host.screenshot({path:`data/qa-critter-kitchen/ceremony-complete-${count}.png`});await expect(host.locator('#ck-skip-count,[data-final-skip]')).toHaveCount(0);
   if(count===5){
    // Six-seat presentation fixture; the base-game room/rule cap remains unchanged.
    const six=structuredClone(fixtureView!),extra=structuredClone(six.players[0]);extra.id='sixth-score-seat';extra.name='ครัวที่ 6';six.players.push(extra);six.priority.push(extra.id);six.finalReveal!.totals[extra.id]=six.finalReveal!.totals[six.players[0].id];six.finalReveal!.item!.awards!.push({...six.finalReveal!.item!.awards![0],actor:extra.id});
    const {build}=await import('esbuild'),bundle=await build({stdin:{contents:"export {finalRevealMarkup} from './src/client/critter-kitchen-final-reveal.ts';export {finalResults,countResults} from './src/client/critter-kitchen-results.ts';",resolveDir:process.cwd()},bundle:true,write:false,format:'iife',globalName:'__ceremonyFixture',loader:{'.css':'empty'}});await host.evaluate(js=>(0,eval)(js),bundle.outputFiles[0].text);
    for(const size of [{width:1440,height:1000},{width:1084,height:768}]){
     await host.setViewportSize(size);await host.evaluate(v=>{const d=document.querySelector<HTMLDialogElement>('.ck-dialog')!;d.className='ck-dialog ck-ceremony-dialog';d.innerHTML='<div class="ck-dialog-body">'+(window as any).__ceremonyFixture.finalRevealMarkup(v,true,false)+'</div>';},six);
     const layout=await host.locator('.ck-tally-player').evaluateAll(es=>({rows:new Set(es.map(e=>Math.round(e.getBoundingClientRect().top))).size,count:es.length,compact:es.every(e=>e.getBoundingClientRect().height<=256)}));expect(layout).toEqual({rows:2,count:6,compact:true});const evidenceFit=await host.locator('.ck-tally-evidence').evaluateAll(es=>es.every(e=>e.scrollWidth<=e.clientWidth+1&&e.scrollHeight<=e.clientHeight+1));expect(evidenceFit).toBe(true);await host.screenshot({path:`data/qa-critter-kitchen/ceremony-six-${size.width}.png`});
     await host.evaluate(v=>{const d=document.querySelector<HTMLDialogElement>('.ck-dialog')!;d.className='ck-dialog ck-final-result-dialog';d.innerHTML='<div class="ck-dialog-body"><div class="ck-final-hero"><h2>ผลการแข่งขัน</h2></div>'+(window as any).__ceremonyFixture.finalResults(v)+'</div>';delete d.dataset.countStarted;(window as any).__ceremonyFixture.countResults(d,true);},six);await expect(host.locator('.ck-result-player')).toHaveCount(6);const rows=await host.locator('.ck-result-player').evaluateAll(es=>new Set(es.map(e=>Math.round(e.getBoundingClientRect().top))).size);expect(rows).toBe(2);await host.screenshot({path:`data/qa-critter-kitchen/results-six-${size.width}.png`});
    }
   }
  }finally{for(const c of contexts)await c.close();await app.close();await rm(dir,{recursive:true,force:true});}
 }
});

test('Critter Kitchen consolation: soup card preview, safe confirmation and full-width pantry cards',async({browser})=>{
 test.setTimeout(60000);
 const dir=await mkdtemp(join(tmpdir(),'ck-soup-ui-')),app=await startServer(0,'127.0.0.1',true,seeded(910),{storePath:join(dir,'rooms.sqlite')}),url=`http://localhost:${(app.server.address() as any).port}`,contexts:BrowserContext[]=[];
 try{
  const hc=await browser.newContext({viewport:{width:1440,height:900}});contexts.push(hc);const host=await hc.newPage();await capture(host);await host.goto(url+'/games/critter-kitchen');await testAccount(host,app);await createDisplayRoom(host);await expect(host.locator('#qr')).toBeVisible();const code=await host.locator('.room-code strong').innerText(),phones:Page[]=[];
  for(let i=0;i<2;i++){const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});contexts.push(c);const p=await c.newPage();phones.push(p);await capture(p);await p.goto(url+'/play/'+code);await p.getByRole('textbox',{name:'ชื่อของคุณ'}).fill('ครัวซุป '+i);await p.getByRole('button',{name:'เข้าห้อง',exact:true}).click();await p.getByRole('button',{name:'พร้อมเล่น',exact:true}).click();}
  await host.locator('#start').click();await continueOpening(host);for(const p of phones){for(const [chef,loc] of [['mouse','soup'],['lizard','garden'],['boar','academy']])await dragChefTo(p,chef,loc);await confirmButton(p,p.locator('#ck-commit'));}
  await host.locator('.ck-d-start').click();await expect(host.locator('.ck-market-departure')).toBeVisible();await expect(host.locator('.ck-market-departure')).toHaveCount(0,{timeout:5000});await expect(host.locator('.ck-root')).toHaveAttribute('data-phase','shopping');const view=await read(host),actor=phones[(await Promise.all(phones.map(read))).findIndex(v=>v.me!.id===view.turn)];await revision(actor,view.revision);const soup=(await read(actor)).me!.soup;
  await confirmButton(actor,actor.locator('[data-action="ck-leave"]'));await expect(actor.locator('.ck-consolation')).toBeVisible();const revisionBefore=(await read(actor)).revision;
  await expect(actor.locator('[data-reward="soup"] .ck-resource-card')).toBeVisible();await expect(actor.locator('[data-reward="soup"] .ck-reward-copy')).toContainText('รับซุป 1 ถ้วย');
  for(const size of [{width:320,height:568},{width:390,height:844}]){
   await actor.setViewportSize(size);await actor.locator('[data-pantry="cards"]').click();await expect.poll(()=>actor.locator('.ck-pantry-cards').evaluate(el=>parseFloat((el as HTMLElement).style.getPropertyValue('--ck-private-card-width')))).toBeGreaterThan(0);
   const fit=await actor.locator('.ck-pantry-cards').evaluate(el=>{const pane=el.closest('.ck-kitchen')!,style=getComputedStyle(pane),r=el.getBoundingClientRect(),p=pane.getBoundingClientRect();return {right:r.right,expected:p.right-parseFloat(style.borderRightWidth)-parseFloat(style.paddingRight),scroll:el.scrollWidth>el.clientWidth};});expect(fit.right).toBeCloseTo(fit.expected,0);const actionsFit=await actor.locator('.ck-consolation').evaluate(el=>{const card=el.querySelector('[data-reward="soup"]')!.getBoundingClientRect(),skip=el.querySelector('[data-reward="skip"]')!.getBoundingClientRect(),action=el.closest('.ck-action')!.getBoundingClientRect();return card.bottom<=action.bottom&&skip.bottom<=action.bottom;});expect(actionsFit).toBe(true);await actor.screenshot({path:`data/qa-critter-kitchen/soup-pantry-${size.width}.png`});
  }
  await actor.locator('[data-reward="soup"]').click();await expect(actor.locator('.ck-choice-dialog .ck-reward-preview .ck-resource-card')).toBeVisible();await expect(actor.locator('.ck-choice-dialog')).toContainText('เพิ่มซุป 1 ถ้วย');await actor.locator('.ck-reward-preview img').evaluate((img:HTMLImageElement)=>img.decode());await actor.screenshot({path:'data/qa-critter-kitchen/soup-confirm.png'});await actor.locator('#ck-choice-cancel').click();expect((await read(actor)).revision).toBe(revisionBefore);expect((await read(actor)).me!.soup).toBe(soup);
  await confirmButton(actor,actor.locator('[data-reward="soup"]'));await expect.poll(async()=>(await read(actor)).me!.soup).toBe(soup+1);await expect(actor.locator('.ck-consolation')).toHaveCount(0);
 }finally{for(const c of contexts)await c.close();await app.close();await rm(dir,{recursive:true,force:true});}
});

test('Critter Kitchen opening briefing and permanent portrait head chef cards',async({browser})=>{
 const dir=await mkdtemp(join(tmpdir(),'ck-opening-')),app=await startServer(0,'127.0.0.1',true,seeded(91),{storePath:join(dir,'rooms.sqlite')}),url=`http://localhost:${(app.server.address() as any).port}`,contexts:BrowserContext[]=[];
 try{
 await mkdir('data/qa-critter-kitchen',{recursive:true});const hc=await browser.newContext({viewport:{width:1280,height:900}});contexts.push(hc);const host=await hc.newPage();await capture(host);await host.goto(url+'/games/critter-kitchen');await testAccount(host,app);await createDisplayRoom(host);const code=await host.locator('.room-code strong').innerText();const phones:Page[]=[];
 for(let i=0;i<2;i++){const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});contexts.push(c);const p=await c.newPage();phones.push(p);await capture(p);await p.goto(url+'/play/'+code);await p.getByRole('textbox',{name:'ชื่อของคุณ'}).fill('หัวหน้าเชฟ '+i);await p.getByRole('button',{name:'เข้าห้อง',exact:true}).click();await p.getByRole('button',{name:'พร้อมเล่น',exact:true}).click();}
 await host.locator('#ck-restaurateurs').check();await host.locator('#start').click();const p=phones[0];await expect(p.locator('[data-rest]')).toHaveCount(2);await expect(p.locator('.ck-offers .ck-card')).toHaveCount(2);
 await expect.poll(()=>p.locator('.ck-offers img').evaluateAll(es=>es.every(e=>(e as HTMLImageElement).naturalWidth>0))).toBe(true);
 const shape=await p.locator('.ck-offers .ck-card img').first().boundingBox();expect(shape!.height).toBeGreaterThan(shape!.width);await p.screenshot({path:'data/qa-critter-kitchen/head-chef-choice.png',fullPage:true});
 const selected=(await read(p)).me!.offers[0];await confirmButton(p,p.locator('[data-rest]').first());await expect(p.locator('.ck-rest-wait')).toContainText('กำลังรอเพื่อนเลือกให้ครบ');await expect(p.locator('.ck-rest-wait svg')).toBeVisible();const waiting=await p.locator('.ck-rest-wait').boundingBox();expect(waiting!.width).toBe(390);expect(waiting!.x).toBe(0);await p.screenshot({path:'data/qa-critter-kitchen/head-chef-wait.png'});
 await p.reload();await expect(p.locator('.ck-rest-wait')).toBeVisible();await expect(p.locator('.ck-my-head-chef')).toBeVisible();await expect(phones[1].locator('[data-rest]')).toHaveCount(2);await confirmButton(phones[1],phones[1].locator('[data-rest]').first());
 for(const page of [host,...phones]){await expect(page.locator('.ck-challenge-reveal')).toBeVisible();await expect(page.locator('.ck-challenge-reveal h2')).toHaveText('Challenge 1');await expect(page.locator('.ck-opening-critic')).toContainText('มื้อสุดท้ายรอบ 7');await expect(page.locator('.ck-new-challenge-foods')).toContainText('เสิร์ฟ Challenge ในรอบ 3');}
 await expect(p.locator('.ck-new-challenge-foods button')).toBeVisible();await p.waitForTimeout(1500);await p.screenshot({path:'data/qa-critter-kitchen/opening-briefing.png'});await p.setViewportSize({width:320,height:568});await expect(p.locator('.ck-new-challenge-foods button')).toBeInViewport();await p.screenshot({path:'data/qa-critter-kitchen/opening-small.png'});await p.setViewportSize({width:390,height:844});await p.reload();await expect(p.locator('.ck-challenge-reveal')).toBeVisible();expect(app.rooms.rooms.get(code)!.ck!.challengeReveal).toBe(1);
 await phones[1].getByRole('button',{name:'เริ่มส่งเชฟ',exact:true}).click();for(const page of [host,...phones])await expect(page.locator('.ck-challenge-reveal')).toHaveCount(0);
 await p.locator('.ck-my-head-chef').click();await expect(p.locator('.ck-dialog')).toContainText(''+(await import('../../src/games/critter-kitchen/data.js')).RESTAURATEUR[selected].name);await expect(p.locator('.ck-dialog img').first()).toBeVisible();await p.locator('.ck-close').click();await p.screenshot({path:'data/qa-critter-kitchen/head-chef-planning.png'});
 for(const width of [320,390,768]){await p.setViewportSize({width,height:844});await expect(p.locator('.ck-my-head-chef')).toBeInViewport();expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 const room=app.rooms.rooms.get(code)!,random=seeded(771);let finished=room.ck!,guard=0;while(finished.phase!=='finished'&&guard++<1800){const next=botAction(finished,random);finished=ckEngine.applyAction(finished,next.actor,next.action,random);}expect(finished.phase).toBe('finished');finished=ckEngine.applyAction(finished,finished.players[0].id,{type:'ck-reveal-results'});finished=ckEngine.applyAction(finished,finished.players[0].id,{type:'ck-score-step',step:0,skip:true});room.ck=finished;room.revision++;(app.rooms as any).broadcast(room,true);await revision(host,room.revision);
 await expect(host.locator('#ck-result-restart')).toBeVisible();await host.locator('#ck-result-restart').click();await expect(host.locator('.ck-choice-dialog')).toContainText('แจกหัวหน้าเชฟให้ทุกคนเลือกใหม่');await host.locator('#ck-choice-confirm').click();
 for(const phone of phones){await expect(phone.locator('[data-rest]')).toHaveCount(2);await expect(phone.locator('.ck-root')).toHaveAttribute('data-phase','restaurateurs');await expect(phone.locator('.ck-my-head-chef')).toHaveCount(0);await expect(phone.locator('.ck-challenge-reveal')).toHaveCount(0);}
 await p.reload();await expect(p.locator('[data-rest]')).toHaveCount(2);await p.screenshot({path:'data/qa-critter-kitchen/replay-head-chef.png'});

 }finally{for(const c of contexts)await c.close();await app.close();await rm(dir,{recursive:true,force:true});}
});
