import {test,expect} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';
import {startServer} from '../../src/server/index.js';
import {testAccount} from './auth-fixture.js';
import {denseLandscape} from '../harmonies-fixtures.js';
import {ANIMAL,WHISPERS,terrain} from '../../src/games/harmonies/data.js';
import {validateHarmoniesState} from '../../src/games/harmonies/validation.js';
for(const art of ['illustrated','sculpted'] as const)test(`${art}: shared-cell card picker, clipped completion and final-turn message below the board`,async({browser})=>{
 const dir=await mkdtemp(join(tmpdir(),'hm-cell-cards-')),app=await startServer(0,'127.0.0.1',true,()=>.42,{storePath:join(dir,'db.sqlite')}),origin=`http://localhost:${(app.server.address() as any).port}`,context=await browser.newContext({viewport:{width:390,height:844}}),guest=await browser.newContext(),page=await context.newPage(),friend=await guest.newPage();page.setDefaultTimeout(8000);friend.setDefaultTimeout(8000);
 try{
  await page.goto(origin+'/games/harmonies');await testAccount(page,app);await page.locator('#create').click();await expect(page.locator('#qr')).toBeVisible();const code=page.url().split('/').pop()!;
  await page.locator('#hm-card-art-'+art).check();await friend.goto(origin+'/play/'+code);await friend.getByRole('textbox',{name:'ชื่อของคุณ'}).fill('เพื่อน');await friend.getByRole('button',{name:'เข้าห้อง',exact:true}).click();await friend.getByRole('button',{name:'พร้อมเล่น',exact:true}).click();await page.locator('#start').click();await expect(page.locator('.hm-root')).toBeVisible();
  const room=app.rooms.rooms.get(code)!,state=denseLandscape(room.players),player=state.players[0],shared=player.board.findIndex(c=>c.cube),other=player.board.findIndex((c,i)=>i!==shared&&c.stack.length&&terrain(c.stack.at(-1)!)==='water');expect(other).toBeGreaterThanOrEqual(0);
  state.options={...state.options!,whispers:true,cardArt:art};state.deck.push(...WHISPERS.filter(c=>c.id!=='whisper-04').map(c=>c.id));player.cards.push({card:'whisper-04',placed:2});player.board[shared].whisper={id:'cube-whisper-04-0',card:'whisper-04'};player.board[other].whisper={id:'cube-whisper-04-1',card:'whisper-04'};state.endAt=22;
  expect(validateHarmoniesState(state)).toBe(true);room.harmonies=state;room.revision++;app.store.saveRooms(app.rooms.exportRooms());await page.reload();await expect(page.locator('.hm-last-round-dialog')).toBeVisible();await page.locator('#hm-last-round-continue').click();
  const revision=room.revision,notice=page.locator('.chosen-board .hm-board-controls>[data-last-round-status]');await expect(notice).toBeVisible();await expect(page.locator('.hm-supply [data-last-round-status]')).toHaveCount(0);
  for(const [width,height]of [[320,667],[390,844],[1024,768]]){
   await page.setViewportSize({width,height});await expect.poll(async()=>{const n=(await notice.boundingBox())!,b=(await page.locator('.chosen-board .hm-board-viewport').boundingBox())!;return n.y>=b.y+b.height*.7&&n.y+n.height<=b.y+b.height+1;}).toBe(true);
   await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1)).toBe(true);
  }
  await page.setViewportSize({width:390,height:844});await notice.click();await expect(page.locator('.hm-last-round-dialog')).toBeVisible();await page.locator('#hm-last-round-continue').click();
  const completed=page.locator('.chosen-board [data-ui-key="owned-whisper-04"] .hm-inspect');await expect(completed.locator('>.hm-complete-ribbon')).toHaveText('ครบแล้ว');await expect(completed.locator('.hm-paper-edge')).toHaveCount(0);
  await page.screenshot({path:`data/qa-harmonies-layout/board-final-message-${art}.png`});
  const cell=page.locator(`.chosen-board [data-cell="${shared}"] .hm-cell-hit`);await cell.click();const picker=page.locator('.hm-cell-card-picker');await expect(picker).toBeVisible();await expect(picker.locator('[data-cell-card]')).toHaveCount(2);
  for(const id of ['animal-01','whisper-04']){const choice=picker.locator(`[data-cell-card="${id}"]`),owned=page.locator(`.chosen-board [data-ui-key="owned-${id}"] .hm-inspect`);await expect(choice.locator('.hm-animal-art>img')).toHaveAttribute('src',(await owned.locator('.hm-animal-art>img').getAttribute('src'))!);expect(await choice.locator('.hm-pattern-stack').count()).toBe(await owned.locator('.hm-pattern-stack').count());}
  const a=(await picker.locator('[data-cell-card="animal-01"]').boundingBox())!,b=(await picker.locator('[data-cell-card="whisper-04"]').boundingBox())!;expect(a.x+a.width).toBeLessThan(b.x);expect(Math.abs(a.y-b.y)).toBeLessThan(1);
  await page.screenshot({path:`data/qa-harmonies-layout/shared-cell-picker-${art}.png`});
  await picker.locator('[data-cell-card="whisper-04"]').click();await expect(picker).toHaveCount(0);await expect(page.locator('#hm-detail-title')).toHaveText(ANIMAL['whisper-04'].name);await expect(page.locator('.hm-detail-face>.hm-complete-ribbon')).toHaveText('ครบแล้ว');await page.locator('.hm-detail .hm-close').click();
  await cell.click();await page.locator('[data-cell-card="animal-01"]').click();await expect(page.locator('#hm-detail-title')).toHaveText(ANIMAL['animal-01'].name);await page.locator('.hm-detail .hm-close').click();expect(room.revision).toBe(revision);
 }finally{await context.close();await guest.close();await app.close();await rm(dir,{recursive:true,force:true});}
});
