import {test,expect} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startServer} from '../../src/server/index.js';
import {testAccount} from './auth-fixture.js';

test('Harmonies lobby clears Solo on player join, retains expansions, and reconnect starts multiplayer',async({browser})=>{
 const dir=await mkdtemp(join(tmpdir(),'hm-lobby-'));
 const app=await startServer(0,'127.0.0.1',true,()=>.42,{storePath:join(dir,'db.sqlite')});
 const origin=`http://localhost:${(app.server.address() as any).port}`;
 const ownerContext=await browser.newContext(),friendContext=await browser.newContext(),displayContext=await browser.newContext();
 const owner=await ownerContext.newPage(),friend=await friendContext.newPage(),display=await displayContext.newPage();
 try{
  await owner.goto(origin+'/games/harmonies');await testAccount(owner,app);await owner.locator('#create').click();await expect(owner.locator('#qr')).toBeVisible();
  const code=owner.url().split('/').pop()!;
  await expect(owner.locator('#hm-solo')).toBeChecked();
  await expect(owner.locator('[name="hm-card-art"][value="illustrated"]')).toBeChecked();
  await owner.locator('[name="hm-card-art"][value="sculpted"]').check();
  await display.goto(origin+'/harmonies/display/'+code);await expect(display.locator('.lobby-players>li')).toHaveCount(1);
  await expect(owner.locator('#hm-solo')).toBeChecked();
  await owner.locator('#hm-natureSpirits').check();await owner.locator('#hm-whispers').check();await owner.locator('#hm-side').selectOption('B');
  await friend.goto(origin+'/harmonies/play/'+code);await friend.getByRole('textbox',{name:'ชื่อของคุณ'}).fill('เพื่อน');await friend.getByRole('button',{name:'เข้าห้อง',exact:true}).click();
  await expect(owner.locator('.lobby-players>li')).toHaveCount(2);await expect(display.locator('.lobby-players>li')).toHaveCount(2);
  await expect(owner.locator('#hm-solo')).not.toBeChecked();await expect(owner.locator('#hm-solo')).toBeDisabled();await expect(owner.locator('#start')).toBeDisabled();
  await expect(owner.locator('#hm-natureSpirits')).toBeChecked();await expect(owner.locator('#hm-whispers')).toBeChecked();await expect(owner.locator('#hm-side')).toHaveValue('B');
  await expect(owner.locator('[name="hm-card-art"][value="sculpted"]')).toBeChecked();
  const friendId=app.rooms.rooms.get(code)!.players[1].id;
  await friend.goto('about:blank');await friend.goto(origin+'/harmonies/play/'+code);await expect(friend.locator('#lobby-ready')).toBeVisible();
  expect(app.rooms.rooms.get(code)!.players).toHaveLength(2);expect(app.rooms.rooms.get(code)!.players[1].id).toBe(friendId);await expect(owner.locator('#hm-solo')).not.toBeChecked();
  await friend.getByRole('button',{name:'พร้อมเล่น',exact:true}).click();await expect(owner.locator('#start')).toBeEnabled();await owner.locator('#start').click();
  await expect(owner.locator('.hm-root')).toBeVisible();await expect(friend.locator('.hm-root')).toBeVisible();await expect(display.locator('.hm-root')).toBeVisible();
  for(const page of [owner,friend,display])await expect(page.locator('html')).toHaveAttribute('data-hm-card-art','sculpted');
  const state=app.rooms.rooms.get(code)!.harmonies!;expect(state.players).toHaveLength(2);expect(state.options).toMatchObject({solo:false,natureSpirits:true,whispers:true});expect(state.side).toBe('B');
  // Both players get their own pair before any terrain has been picked.
  await expect(owner.locator('[data-spirit-choice]')).toHaveCount(2);await expect(friend.locator('[data-spirit-choice]')).toHaveCount(2);await expect(display.locator('[data-spirit-choice]')).toHaveCount(0);
  await friend.reload();await expect(friend.locator('[data-spirit-choice]')).toHaveCount(2);
  for(const mode of ['sculpted','illustrated']){await owner.locator('#hm-menu').click();await owner.locator(`[data-art-style="${mode}"]`).click();await owner.keyboard.press('Escape');await expect(owner.locator('.hm-spirit-offer .hm-detail-model-preview')).toHaveCount(0);for(const width of[320,390,1100]){await owner.setViewportSize({width,height:844});await expect(owner.locator('[data-spirit-choice]').first()).toHaveText('เลือก');await expect(owner.locator('.hm-spirit-choice-name')).toHaveCount(2);await expect(owner.locator('.hm-spirit-offer .hm-inspect').first()).toHaveCSS('background-color','rgba(0, 0, 0, 0)');await expect.poll(()=>owner.locator('[data-spirit-choice]').evaluateAll(es=>Math.abs(es[0].getBoundingClientRect().top-es[1].getBoundingClientRect().top))).toBeLessThan(1);await owner.screenshot({path:`data/hm-spirit-draft-${mode}-${width}.png`});}}
  await owner.setViewportSize({width:320,height:844});await owner.locator('.hm-spirit-choice-name').first().evaluate(e=>e.textContent='สัตว์วิเศษที่มีชื่อยาวมากเป็นพิเศษเพื่อทดสอบการขึ้นบรรทัดใหม่');await expect.poll(()=>owner.locator('[data-spirit-choice]').evaluateAll(es=>Math.abs(es[0].getBoundingClientRect().top-es[1].getBoundingClientRect().top))).toBeLessThan(1);

  await owner.locator('[data-spirit-choice]').first().click();await expect(owner.locator('#hm-choice-confirm')).toBeVisible();
  await friend.locator('[data-spirit-choice]').first().click();await friend.locator('#hm-choice-confirm').click();await expect(friend.locator('.hm-spirit-waiting')).toContainText('รอเพื่อน');
  await expect(owner.locator('#hm-choice-confirm')).toBeVisible();await expect(owner.locator('.hm-spirit-selection')).toBeVisible();
  expect(app.rooms.rooms.get(code)!.harmonies!.players[1].cards).toHaveLength(1);expect(app.rooms.rooms.get(code)!.harmonies!.players[0].cards).toHaveLength(0);
  await owner.locator('#hm-choice-confirm').click();await expect(owner.locator('.hm-spirit-selection')).toHaveCount(0);await expect(friend.locator('.hm-spirit-selection')).toHaveCount(0);await expect(display.locator('.hm-spirit-selection')).toHaveCount(0);
  await expect(owner.locator('.chosen-board .hm-board')).toHaveAttribute('style',/--tilt:\s*36deg/);await expect.poll(()=>owner.locator('.chosen-board .hm-board-viewport').evaluate(e=>{const v=e.getBoundingClientRect(),m=e.querySelector('.hm-board-mat')!.getBoundingClientRect();return Math.abs((m.top+m.bottom)/2-(v.top+v.bottom)/2);})).toBeLessThan(2);await owner.locator('#hm-menu').click();await owner.locator('[data-camera=top]').click();await expect(owner.locator('.chosen-board .hm-board')).toHaveCSS('--tilt','0deg');await owner.locator('#hm-menu').click();await owner.locator('[data-camera=reset]').click();await expect(owner.locator('.chosen-board .hm-board')).toHaveCSS('--tilt','36deg');const selected=app.rooms.rooms.get(code)!.harmonies!;expect(selected.players.every(p=>p.cards.length===1)).toBe(true);expect(selected.turnCount).toBe(0);expect(selected.picked).toBe(false);await expect(owner.locator('.hm-groups')).toBeVisible();

 }finally{await Promise.all([ownerContext.close(),friendContext.close(),displayContext.close()]);await app.close();await rm(dir,{recursive:true,force:true});}
});
