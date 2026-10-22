import {test,expect} from '@playwright/test';
import {mkdtemp,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startServer} from '../../src/server/index.js';
import {testAccount} from './auth-fixture.js';

test('Harmonies scoring reference: left of help, illustrations, modules, mobile and public display',async({browser})=>{
 const dir=await mkdtemp(join(tmpdir(),'hm-scoring-')),app=await startServer(0,'127.0.0.1',true,()=>.42,{storePath:join(dir,'db.sqlite')}),origin=`http://localhost:${(app.server.address() as any).port}`,context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
 try{
  await mkdir('data/qa-harmonies-animation',{recursive:true});
  await page.goto(origin+'/games/harmonies');await testAccount(page,app);await page.locator('#create').click();await expect(page.locator('#qr')).toBeVisible();const code=page.url().split('/').pop()!;
  await page.locator('#hm-natureSpirits').check();await page.locator('#hm-whispers').check();await page.locator('#start').click();await expect(page.locator('#hm-scoring')).toBeVisible();
  for(const width of [320,390,1100]){
   await page.setViewportSize({width,height:844});const score=await page.locator('#hm-scoring').boundingBox(),help=await page.locator('#hm-help').boundingBox();expect(score!.x+score!.width).toBeLessThan(help!.x);expect(score!.width).toBe(help!.width);expect(score!.x).toBeGreaterThanOrEqual(0);
   await page.locator('#hm-scoring').click();const dialog=page.locator('.hm-scoring-dialog');await expect(dialog).toBeVisible();await expect(dialog).toContainText('ต้นไม้ · 1 / 3 / 7 คะแนน');await expect(dialog).toContainText('ภูเขาโดดเดี่ยวได้ 0');await expect(dialog).toContainText('ไม่บวกทุกตัวเลข');await expect(dialog.locator('.hm-scoring-spirits article')).toHaveCount(10);await expect(dialog).toContainText('5 + 2 = 7');expect(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);if(width===390)await page.screenshot({path:'data/qa-harmonies-animation/scoring-phone.png'});await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);if(width===390)await page.screenshot({path:'data/qa-harmonies-animation/header-phone.png'});
  }
  const display=await context.newPage();await display.goto(origin+'/display/'+code);await display.locator('#hm-scoring').click();await expect(display.locator('.hm-scoring-dialog')).toBeVisible();await display.keyboard.press('Escape');await display.locator('#hm-help').click();await expect(display.locator('.hm-guide-dialog')).toContainText('หนึ่งตาทำอะไรบ้าง?');
 }finally{await context.close();await app.close();await rm(dir,{recursive:true,force:true});}
});

test('Harmonies animal rail follows content and scrolls only at End boundary',async({page,baseURL})=>{
 const {readFile,mkdir}=await import('node:fs/promises'),{animalFigure,cardFace,setHarmoniesCardArt}=await import('../../src/client/harmonies-presentation.js');
 const css=await readFile('src/client/harmonies.css','utf8');await mkdir('data/qa-harmonies-animation',{recursive:true});await page.goto('/');await page.setViewportSize({width:390,height:844});
 setHarmoniesCardArt('sculpted');await page.evaluate(()=>document.documentElement.dataset.hmCardArt='sculpted');await page.setContent(`<base href="${baseURL}"><style>${css}body{margin:0;background:#35665a}.tray-audit{display:block!important;width:320px!important;margin:20px auto;padding:0;background:#fff2ca}.tray-audit .hm-board-viewport{height:800px!important}.tray-audit .hm-owned-cards{display:none}</style><div class="hm-root tray-audit"><section class="hm-player"><div class="hm-board-viewport"><aside class="hm-board-sidebar"><div class="hm-header-hand">${[0,1,2].map(()=>'<span class="hm-hand-slot"></span>').join('')}</div><div class="hm-animal-choices">${['spirit-11','spirit-06','animal-19','animal-01','animal-02'].map((id,i)=>`<div class="hm-available-slot"><button data-available-animal="${id}" aria-pressed="${i===0}" aria-label="${id}">${animalFigure(id,0,false,true)}</button></div>`).join('')}</div><button id="hm-end">End</button></aside></div></section><div class="hm-market"><article class="hm-animal"><button data-solo-discard="animal-01" class="hm-solo-discard">↔</button></article></div><div class="hm-owned-cards"><article class="hm-animal complete"><button class="hm-inspect">${cardFace('animal-01')}</button></article></div></div>`);
 await expect(page.locator('[data-solo-discard]')).toHaveCSS('background-color','rgb(255, 255, 255)');await expect(page.locator('[data-solo-discard]')).toHaveCSS('color','rgb(35, 131, 76)');await expect(page.locator('[data-solo-discard]')).toHaveCSS('border-top-color','rgb(35, 131, 76)');
 await page.locator('.hm-animal-choices img').evaluateAll(imgs=>Promise.all(imgs.map(i=>(i as HTMLImageElement).decode())));
 expect(await page.locator('.complete .hm-inspect').evaluate(e=>getComputedStyle(e).filter)).not.toContain('grayscale');await expect(page.locator('.complete .hm-inspect')).toHaveCSS('opacity','1');for(const row of await page.locator('.complete .hm-card-points>span').all())await expect(row).toHaveCSS('opacity','1');
 const shelf=page.locator('.hm-animal-choices'),end=page.locator('#hm-end'),last=page.locator('[data-available-animal]').last();
 expect(await shelf.evaluate(e=>e.scrollHeight<=e.clientHeight+1)).toBe(true);
 const naturalEnd=(await end.boundingBox())!,naturalLast=(await last.boundingBox())!,rail=(await page.locator('.hm-board-sidebar').boundingBox())!;
 expect(naturalEnd.y-naturalLast.y-naturalLast.height).toBeGreaterThanOrEqual(6);expect(naturalEnd.y-naturalLast.y-naturalLast.height).toBeLessThan(25);expect(naturalEnd.y+naturalEnd.height).toBeLessThan(rail.y+rail.height-20);
 const selected=page.locator('[aria-pressed=true]');await expect(selected).toHaveCSS('border-top-color','rgb(0, 239, 228)');await expect(selected).toHaveCSS('outline-style','solid');expect(await selected.evaluate(e=>{const r=e.getBoundingClientRect(),p=e.closest('.hm-animal-choices')!.getBoundingClientRect();return r.left-p.left>=12&&p.right-r.right>=12})).toBe(true);
 for(const img of await page.locator('.hm-animal-choices img').all())expect(await img.evaluate(e=>getComputedStyle(e).filter)).toContain('rgb(255, 255, 255)');
 await page.screenshot({path:'data/qa-harmonies-animation/rail-natural.png'});
 await page.addStyleTag({content:'.tray-audit .hm-board-viewport{height:380px!important}'});
 expect(await shelf.evaluate(e=>e.scrollHeight>e.clientHeight)).toBe(true);const limitedEnd=(await end.boundingBox())!,limitedRail=(await page.locator('.hm-board-sidebar').boundingBox())!;
 expect(limitedEnd.y+limitedEnd.height).toBeLessThanOrEqual(limitedRail.y+limitedRail.height+1);expect(limitedRail.y+limitedRail.height-limitedEnd.y-limitedEnd.height).toBeLessThan(2);
 expect(await end.evaluate(e=>{const r=e.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('#hm-end')===e})).toBe(true);
 await shelf.evaluate(e=>{e.scrollTop=e.scrollHeight});const lastAfterScroll=(await last.boundingBox())!;expect(lastAfterScroll.y+lastAfterScroll.height).toBeLessThan(limitedEnd.y-5);expect(lastAfterScroll.y).toBeGreaterThanOrEqual((await shelf.boundingBox())!.y);
 await shelf.evaluate(e=>{e.scrollTop=0});const star=page.locator('[data-cube-card="spirit-11"]>img').first();expect(await star.evaluate(e=>getComputedStyle(e).animationName)).toBe('hm-trex-breathe');await page.emulateMedia({reducedMotion:'reduce'});expect(await star.evaluate(e=>getComputedStyle(e).animationName)).toBe('none');await page.emulateMedia({reducedMotion:'no-preference'});
 await page.screenshot({path:'data/qa-harmonies-animation/rail-scroll.png'});
});
