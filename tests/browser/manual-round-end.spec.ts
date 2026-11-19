import {test,expect} from '@playwright/test';import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {startServer} from '../../src/server/index.js';import {testAccount} from './auth-fixture.js';
for(const [game,rounds,submit,results] of [
 ['high-low-scoreboard','#hl-rounds','[data-answer="true"]','.hl-final'],
 ['stock-market-crash','#cr-rounds','[data-bid]','.crash-winner'],
 ['dividend-hunter','#hunter-rounds','.hunter-controller button','.hunter-winners'],
] as const)test(game+': both phones wait for manual round close, guest can reveal after reload',async({browser})=>{
 const dir=await mkdtemp(join(tmpdir(),'manual-close-')),app=await startServer(0,'127.0.0.1',true,()=>.4,{storePath:join(dir,'rooms.sqlite')}),origin='http://localhost:'+(app.server.address() as any).port;
 const ownerContext=await browser.newContext({viewport:{width:390,height:844}}),guestContext=await browser.newContext({viewport:{width:390,height:844}});
 try{const owner=await ownerContext.newPage();await owner.goto(origin+'/games/'+game);await testAccount(owner,app);await owner.locator('#create').click();await owner.locator(rounds).waitFor();if(game==='stock-market-crash')await owner.locator(rounds).selectOption('1');else await owner.locator(rounds).fill('1');const code=new URL(owner.url()).pathname.split('/').pop()!;
 const guest=await guestContext.newPage();await guest.goto(origin+'/play/'+code);await guest.locator('[name="name"]').fill('เพื่อน');await guest.locator('#join button[type="submit"]').click();await guest.locator('#lobby-ready').click();if(await owner.locator('#lobby-ready').textContent()==='พร้อมเล่น')await owner.locator('#lobby-ready').click();await expect(owner.locator('#start')).toBeEnabled();await owner.locator('#start').click();
 for(const [i,p] of [owner,guest].entries()){await expect(p.locator('[data-round-end]')).toHaveCount(0);if(game==='dividend-hunter')await p.locator('#hunter-number').fill(String(10+i));if(game==='stock-market-crash')await p.locator('#cr-bid').fill(String(10+i));await p.locator(submit).click();}
 for(const p of [owner,guest]){await expect(p.locator('[data-round-end]')).toBeVisible();await expect(p.locator(results)).toHaveCount(0);}
 await guest.reload();await expect(guest.locator('[data-round-end]')).toBeVisible();await expect(guest.locator(results)).toHaveCount(0);await guest.locator('[data-round-end]').click();await expect(guest.locator(results)).toBeVisible();await expect(owner.locator(results)).toBeVisible();await expect(owner.locator('[data-round-end]')).toHaveCount(0);
 }finally{await ownerContext.close();await guestContext.close();await app.close();await rm(dir,{recursive:true,force:true});}
});
