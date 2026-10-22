import {test,expect} from '@playwright/test';
import {mkdtemp,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startServer} from '../../src/server/index.js';
import {testAccount} from './auth-fixture.js';

test('Android lightweight mode: draft labels, full detail, persistent effects preference and unchanged game state',async({browser})=>{
 const dir=await mkdtemp(join(tmpdir(),'hm-perf-')),app=await startServer(0,'127.0.0.1',true,()=>.42,{storePath:join(dir,'db.sqlite')}),origin=`http://localhost:${(app.server.address() as any).port}`,context=await browser.newContext({viewport:{width:390,height:844},userAgent:'Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36'}),p=await context.newPage();
 try{
  await p.goto(origin+'/games/harmonies');await testAccount(p,app);await p.locator('#create').click();await expect(p.locator('#qr')).toBeVisible();const code=p.url().split('/').pop()!;await p.locator('#hm-natureSpirits').check();await p.locator('#hm-whispers').check();await p.locator('#start').click();await expect(p.locator('html')).toHaveClass(/hm-low-effects/);
  const offer=p.locator('[data-spirit-choice]').first();await expect(offer).toHaveText('เลือก');await expect(p.locator('.hm-spirit-choice-name').first()).not.toBeEmpty();await expect(p.locator('.hm-spirit-offer .hm-detail-model-preview')).toHaveCount(0);await p.locator('.hm-spirit-offer [data-detail]').first().click();await expect(p.locator('#hm-detail-title')).not.toBeEmpty();await expect(p.locator('.hm-detail .hm-animal-art img')).toBeVisible();expect(await p.locator('.hm-detail .hm-animal-art img').evaluate((i:HTMLImageElement)=>i.src)).not.toContain('-lite.webp');await expect(p.locator('.hm-detail .hm-expansion-card-name')).toHaveCount(0);await p.locator('.hm-detail .hm-close').click();await offer.click();await p.locator('#hm-choice-confirm').click();await expect(p.locator('.hm-spirit-selection')).toHaveCount(0);
  const room=app.rooms.rooms.get(code)!,revision=room.revision,state=JSON.stringify(room.harmonies);
  await p.locator('#hm-menu').click();await expect(p.locator('#hm-low-effects')).toBeChecked();await p.locator('#hm-low-effects').uncheck();await expect(p.locator('html')).not.toHaveClass(/hm-low-effects/);await p.reload();await expect(p.locator('html')).not.toHaveClass(/hm-low-effects/);await p.locator('#hm-menu').click();await p.locator('#hm-low-effects').check();await p.reload();await expect(p.locator('html')).toHaveClass(/hm-low-effects/);expect(room.revision).toBe(revision);expect(JSON.stringify(room.harmonies)).toBe(state);
 }finally{await context.close();await app.close();await rm(dir,{recursive:true,force:true});}
});

test('paired animals fit distinct anchors, board aura stays on its sprite, and special popup cards retain light',async({page,baseURL})=>{
 const {readFile,mkdir}=await import('node:fs/promises'),{animalFigure,cylinder,cardFace}=await import('../../src/client/harmonies-presentation.js'),css=await readFile('src/client/harmonies.css','utf8');await mkdir('data/qa-harmonies-performance',{recursive:true});await page.goto('/');await page.setViewportSize({width:390,height:844});
 await page.setContent(`<base href="${baseURL}"><style>${css}.audit{display:block!important;height:500px!important}.audit .hm-board{width:340px!important;left:50%;top:200px}.audit .hm-board-viewport{width:360px;height:400px}.audit .hm-cell{--x:50%;--y:50%}</style><div class="hm-root audit"><div class="hm-board-viewport"><div class="hm-board" style="--tilt:0deg;--angle:0deg"><div class="hm-cell"><span class="hm-stack">${cylinder('field',0)}${animalFigure('spirit-07',1)}${animalFigure('whisper-04',1)}</span></div></div></div></div><dialog open class="hm-dialog hm-detail" style="position:relative;inset:auto"><div class="hm-large-card">${cardFace('whisper-01',0,true)}</div></dialog>`);
 await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>(i as HTMLImageElement).decode())));
 const a=await page.locator('.hm-board .hm-spirit-model>img').boundingBox(),b=await page.locator('.hm-board .hm-whisper-model>img').boundingBox();expect(a!.width).toBeLessThanOrEqual(30);expect(b!.width).toBeLessThanOrEqual(25);expect(a!.x+a!.width/2).toBeLessThan(b!.x+b!.width/2);expect(await page.locator('.hm-board .hm-spirit-model').evaluate(e=>getComputedStyle(e,':before').display)).toBe('none');const light=page.locator('.hm-board .hm-spirit-sparkles');expect((await light.boundingBox())!.width).toBeCloseTo(a!.width,0);await expect(page.locator('.hm-detail .hm-card-aura[data-special=whisper]')).toBeVisible();
 await page.screenshot({path:'data/qa-harmonies-performance/pair-and-popup.png'});
});

test('lightweight phone renders only the selected garden and can still inspect a friend without changing game state',async({browser})=>{
 const dir=await mkdtemp(join(tmpdir(),'hm-perf-tabs-')),app=await startServer(0,'127.0.0.1',true,()=>.42,{storePath:join(dir,'db.sqlite')}),origin=`http://localhost:${(app.server.address() as any).port}`,context=await browser.newContext(),guest=await browser.newContext(),p=await context.newPage(),q=await guest.newPage();
 await p.addInitScript(()=>localStorage.setItem('gameverse:harmonies:low-effects','on'));
 try{
  await p.goto(origin+'/games/harmonies');await testAccount(p,app);await p.locator('#create').click();await expect(p.locator('#qr')).toBeVisible();const code=p.url().split('/').pop()!;await q.goto(origin+'/play/'+code);await q.getByRole('textbox',{name:'ชื่อของคุณ'}).fill('Friend');await q.getByRole('button',{name:'เข้าห้อง',exact:true}).click();await q.getByRole('button',{name:'พร้อมเล่น',exact:true}).click();await p.locator('#hm-solo').uncheck();await p.locator('#start').click();await expect(p.locator('.hm-player')).toHaveCount(1);const room=app.rooms.rooms.get(code)!,sequence=room.harmonies!.sequence;
  await p.locator('#hm-menu').click();await p.locator(`[data-tab="${room.players[1].id}"]`).click();await expect(p.locator('.hm-player')).toHaveCount(1);await expect(p.locator('.hm-player')).toHaveAttribute('data-player',room.players[1].id);await p.locator('#hm-menu').click();await p.locator(`[data-tab="${room.players[0].id}"]`).click();await expect(p.locator('.hm-player')).toHaveAttribute('data-player',room.players[0].id);expect(room.harmonies!.sequence).toBe(sequence);
 }finally{await context.close();await guest.close();await app.close();await rm(dir,{recursive:true,force:true});}
});
