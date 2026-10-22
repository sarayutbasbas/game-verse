import {test,expect} from '@playwright/test';
import {mkdtemp,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startServer} from '../../src/server/index.js';
import {testAccount} from './auth-fixture.js';
import {ANIMAL} from '../../src/games/harmonies/data.js';

test('Library scoring matches board inspection; speaker slash requires both sound switches off',async({browser})=>{
 const dir=await mkdtemp(join(tmpdir(),'hm-browsing-')),app=await startServer(0,'127.0.0.1',true,()=>.42,{storePath:join(dir,'db.sqlite')}),origin=`http://localhost:${(app.server.address() as any).port}`,context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
 try{
  await mkdir('data/hm-polish',{recursive:true});await page.goto(origin+'/games/harmonies');await testAccount(page,app);await page.locator('#create').click();await page.locator('#start').click();await expect(page.locator('.hm-root')).toBeVisible();
  const id=await page.locator('.hm-market [data-detail]').first().getAttribute('data-detail');
  await page.locator(`.hm-market [data-detail="${id}"]`).click();const boardText=await page.locator('.hm-detail .hm-card-scoring').innerText(),habitat=await page.locator('.hm-detail .hm-card-habitat').innerText();await page.keyboard.press('Escape');
  await page.locator('#hm-card-library').click();const d=page.locator('.hm-card-library');
  for(const card of [id!,'spirit-01','spirit-11','whisper-01','pulse-01']){
   await d.locator(`[data-library-card="${card}"] button`).click();const detail=d.locator('.hm-library-detail');await expect(detail.locator('.hm-card-scoring')).toBeVisible();
   if(card===id){expect(await detail.locator('.hm-card-scoring').innerText()).toBe(boardText);expect(await detail.locator('.hm-card-habitat').innerText()).toBe(habitat);}
   if(ANIMAL[card].description)await expect(detail.locator('.hm-card-scoring,.hm-card-habitat')).toContainText([ANIMAL[card].kind==='spirit'||ANIMAL[card].kind==='whisper'?ANIMAL[card].description!:'วิธีได้คะแนน',ANIMAL[card].kind==='spirit'||ANIMAL[card].kind==='whisper'?'รูปแบบถิ่นอาศัย':ANIMAL[card].description!]);
   if(!ANIMAL[card].kind){await expect(detail.locator('.hm-card-point-steps dd')).toHaveText(ANIMAL[card].points.map(n=>`${n} คะแนน`));await expect(detail.locator('.hm-card-scoring')).toContainText('ไม่บวกคะแนนแต่ละขั้น');}
   await detail.locator('img').evaluateAll(es=>Promise.all(es.map(e=>(e as HTMLImageElement).decode())));
   await page.screenshot({path:`data/hm-polish/library-${card}.png`});await d.locator('.hm-library-back').click();
  }
  await d.locator('.hm-info-close').click();const audio=page.locator('.audio-settings'),summary=audio.locator('summary');
  const theme=await page.locator('#hm-help').evaluate(e=>({color:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor}));expect(await summary.evaluate(e=>({color:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor}))).toEqual(theme);
  await summary.click();await expect(audio).toHaveAttribute('data-muted','false');await expect(audio.locator('.audio-muted-slash')).toHaveCount(0);
  await audio.locator('.turn-sound-button').click();await expect(audio.locator('.turn-sound-button')).toHaveText('เสียงเอฟเฟกต์: ปิด');await expect(audio.locator('.audio-muted-slash')).toHaveCount(0);
  await audio.locator('.music-sound-button').click();await expect(audio).toHaveAttribute('data-muted','true');await expect(audio.locator('.audio-muted-slash')).toHaveCount(1);
  await audio.locator('.turn-sound-button').click();await expect(audio).toHaveAttribute('data-muted','false');await expect(audio.locator('.audio-muted-slash')).toHaveCount(0);
  await audio.locator('.music-sound-button').click();await expect(audio).toHaveAttribute('data-muted','false');
  await audio.locator('.turn-sound-button').click();await audio.locator('.music-sound-button').click();await page.reload();await expect(page.locator('.hm-root')).toBeVisible();await expect(audio).toHaveAttribute('data-muted','true');await expect(audio.locator('.audio-muted-slash')).toHaveCount(1);
 }finally{await context.close();await app.close();await rm(dir,{recursive:true,force:true});}
});
