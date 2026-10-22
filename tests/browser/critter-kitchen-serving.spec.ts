import {test,expect} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {startServer} from '../../src/server/index.js';import {testAccount} from './auth-fixture.js';
import {seeded,botAction} from '../critter-kitchen-fixtures.js';
import {applyAction} from '../../src/games/critter-kitchen/engine.js';
import {TOKENS,FOODS} from '../../src/games/critter-kitchen/data.js';import {validateCKState} from '../../src/games/critter-kitchen/validation.js';
test('resolved Challenges are grayscale; Fruit Bat pairs inline, keeps pantry reachable and submits a legal meal',async({browser})=>{
 const dir=await mkdtemp(join(tmpdir(),'ck-inline-wine-')),random=seeded(910),app=await startServer(0,'127.0.0.1',true,random,{storePath:join(dir,'db.sqlite')}),origin=`http://localhost:${(app.server.address() as any).port}`,context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),guest=await browser.newContext(),page=await context.newPage(),friend=await guest.newPage();
 try{
  await page.goto(origin+'/games/critter-kitchen');await testAccount(page,app);await page.locator('#create').click();await expect(page.locator('#qr')).toBeVisible();const code=page.url().split('/').pop()!;
  await friend.goto(origin+'/play/'+code);await friend.getByRole('textbox',{name:'ชื่อของคุณ'}).fill('ครัวเพื่อน');await friend.getByRole('button',{name:'เข้าห้อง',exact:true}).click();await friend.getByRole('button',{name:'พร้อมเล่น',exact:true}).click();await page.locator('#start').click();await expect(page.locator('.ck-root')).toBeVisible();
  const room=app.rooms.rooms.get(code)!;let state=room.ck!,guard=0;
  while(!(state.round===4&&state.phase==='planning')&&guard++<1800){const n=botAction(state,random);state=applyAction(state,n.actor,n.action,random);}
  expect(state.round).toBe(4);delete state.challengeReveal;room.ck=state;room.revision++;app.store.saveRooms(app.rooms.exportRooms());await page.reload();await page.locator('[data-tab="information"]').click();
  await expect(page.locator('.ck-reference-grid').first().locator('.ck-challenge-completed')).toHaveCount(3);await expect(page.locator('.ck-reference-slot').first()).toHaveCSS('filter','grayscale(1)');await expect(page.locator('.ck-reference-slot').nth(3)).toHaveCSS('filter','none');
  await page.locator('.ck-reference-slot').first().locator('[data-detail]').click();await expect(page.locator('.ck-challenge-detail')).toHaveCSS('filter','grayscale(1)');await page.locator('.ck-dialog .ck-close').click();
  const display=await context.newPage();await display.goto(origin+'/display/'+code);await expect(display.locator('.ck-d-challenges .ck-challenge-completed')).toHaveCount(3);await display.close();
  while(state.phase!=='critic'&&guard++<2200){const n=botAction(state,random);state=applyAction(state,n.actor,n.action,random);}expect(state.phase).toBe('critic');
  state.unusedCritics=state.unusedCritics.filter(c=>c!=='fruit-bat');if(state.critic!=='fruit-bat')state.unusedCritics.push(state.critic);state.critic='fruit-bat';
  for(const p of state.players){state.bag.push(...p.storage);p.storage=[];p.critic=null;}
  const ingredient=(food:string,value:number,index=0)=>TOKENS.filter(t=>t.kind==='ingredient'&&t.food===food&&t.value===value)[index].id;
  const chosen=[...FOODS.map(f=>ingredient(f,6)),ingredient('wine',6,1),ingredient('wine',5)];
  for(const id of chosen){state.bag=state.bag.filter(t=>t!==id);state.discard=state.discard.filter(t=>t!==id);for(const loc of Object.keys(state.locations))state.locations[loc]=state.locations[loc].filter(t=>t!==id);state.players[0].storage.push(id);}
  expect(validateCKState(state)).toBe(true);room.ck=state;room.revision++;app.store.saveRooms(app.rooms.exportRooms());await page.reload();await expect(page.locator('.ck-final-cooking')).toBeVisible();
  const bread=ingredient('bread',6),pair=page.locator('[data-pair-wine="bread"]');await page.locator(`[data-add="${bread}"]`).click();await expect(pair).toBeEnabled();await expect(pair).toHaveAttribute('data-wine-token',ingredient('wine',6));
  await expect(page.locator('select[data-wine]')).toHaveCount(0);await expect(page.locator('.ck-wine-pairing')).toHaveCount(1);await pair.tap();await expect(pair).toHaveAttribute('aria-pressed','true');await expect(page.locator('#ck-serve')).toBeEnabled();
  for(const food of FOODS.filter(f=>f!=='bread'&&f!=='wine')){await page.locator(`[data-add="${ingredient(food,6)}"]`).click();}
  await expect(page.locator('.ck-wine-pairing')).toHaveCount(6);await expect(page.locator('[data-pair-wine="fish"]')).toBeEnabled();
  for(const [width,height]of [[320,568],[390,844],[1024,768]]){await page.setViewportSize({width,height});await page.locator('[data-pair-wine="mushroom"]').scrollIntoViewIfNeeded();expect(await page.locator('[data-pair-wine="mushroom"]').evaluate(e=>{const r=e.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('[data-pair-wine]')===e})).toBe(true);}
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'data/qa-critter-kitchen-inline-wine.png'});
  await pair.scrollIntoViewIfNeeded();await pair.tap();await expect(pair).toHaveAttribute('aria-pressed','false');await pair.tap();
  await page.locator('#ck-serve').click();await expect(page.locator('.ck-final-serving-dialog')).toBeVisible();await page.locator('#ck-choice-confirm').click();await expect.poll(()=>room.ck!.players[0].critic?.wine?.length).toBe(1);expect(validateCKState(room.ck!)).toBe(true);
 }finally{await context.close();await guest.close();await app.close();await rm(dir,{recursive:true,force:true});}
});
