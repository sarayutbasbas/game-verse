import {test,expect} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startServer} from '../../src/server/index.js';
import {testAccount} from './auth-fixture.js';

test('owner removes a lobby friend through an icon and confirmation; all devices converge',async({browser})=>{
 const dir=await mkdtemp(join(tmpdir(),'lobby-kick-')),app=await startServer(0,'127.0.0.1',true,()=>.42,{storePath:join(dir,'db.sqlite')}),origin=`http://localhost:${(app.server.address() as any).port}`;
 const owner=await browser.newContext({viewport:{width:390,height:844}}),guest=await browser.newContext({viewport:{width:390,height:844}}),other=await browser.newContext({viewport:{width:390,height:844}}),page=await owner.newPage(),friend=await guest.newPage(),survivor=await other.newPage();
 try{
  await page.goto(origin+'/games/harmonies');await testAccount(page,app);await page.locator('#create').click();await expect(page.locator('#qr')).toBeVisible();const code=page.url().split('/').pop()!,room=app.rooms.rooms.get(code)!;
  const display=await owner.newPage();await display.goto(origin+'/display/'+code);await expect(display.locator('#qr')).toBeVisible();
  for(const [p,name]of [[friend,'เพื่อนหนึ่ง'],[survivor,'เพื่อนสอง']] as const){await p.goto(origin+'/play/'+code);await p.getByRole('textbox',{name:'ชื่อของคุณ'}).fill(name);await p.getByRole('button',{name:'เข้าห้อง',exact:true}).click();await expect(p.locator('.lobby-players li')).toHaveCount(name==='เพื่อนหนึ่ง'?2:3);}
  await expect(page.locator('.lobby-kick')).toHaveCount(2);await expect(display.locator('.lobby-kick')).toHaveCount(2);await expect(friend.locator('.lobby-kick')).toHaveCount(0);await expect(survivor.locator('.lobby-kick')).toHaveCount(0);
  const cross=page.getByRole('button',{name:'นำ เพื่อนหนึ่ง ออกจากห้อง',exact:true});await expect(cross).toHaveText('×');await cross.click();await expect(page.locator('.lobby-kick-dialog')).toBeVisible();await page.locator('[data-cancel-kick]').click();expect(room.players).toHaveLength(3);
  await cross.click();await page.locator('[data-confirm-kick]').click();await expect(page.locator('.lobby-players li')).toHaveCount(2);await expect(survivor.locator('.lobby-players li')).toHaveCount(2);await expect(display.locator('.lobby-players li')).toHaveCount(2);
  await expect(friend.getByRole('textbox',{name:'ชื่อของคุณ'})).toBeVisible();await expect(friend.locator('.lobby-players')).toHaveCount(0);expect(room.sessions.some(s=>s.playerId&&!room.players.some(p=>p.id===s.playerId))).toBe(false);
  await page.screenshot({path:'data/qa-lobby-kick.png',fullPage:true});
  await survivor.getByRole('button',{name:'พร้อมเล่น',exact:true}).click();await expect(page.locator('#start')).toBeEnabled();await page.locator('#start').click();await expect(page.locator('.hm-root')).toBeVisible();await expect(page.locator('.lobby-kick')).toHaveCount(0);
 }finally{await Promise.all([owner.close(),guest.close(),other.close()]);await app.close();await rm(dir,{recursive:true,force:true});}
});
