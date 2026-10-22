import {test,expect} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startServer} from '../../src/server/index.js';
import {gameAdapters} from '../../src/games/registry.js';
import {testAccount} from './auth-fixture.js';

test('ordinary GO in every online game joins a ready owner; reconnect, independent display and solo start',async({browser})=>{
 const dir=await mkdtemp(join(tmpdir(),'creator-player-ui-')),app=await startServer(0,'127.0.0.1',true,()=>.42,{storePath:join(dir,'db.sqlite')}),url=`http://localhost:${(app.server.address() as any).port}`,context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(url+'/games/harmonies');await testAccount(page,app);
  for(const gameId of Object.keys(gameAdapters)){
   await page.goto(url+'/games/'+gameId);await page.locator('#create').click();await expect(page).toHaveURL(/\/play\/[A-Z0-9]{6}$/);await expect(page.locator('#qr')).toBeVisible();
   const code=page.url().split('/').pop()!,room=app.rooms.rooms.get(code)!;expect(room.players).toHaveLength(1);expect(room.players[0].ready).toBe(true);const playerId=room.players[0].id;
   await expect(page.getByRole('textbox',{name:'ชื่อของคุณ'})).toHaveCount(0);await expect(page.locator('#start')).toBeVisible();await expect(page.locator('.lobby-display-link')).toHaveAttribute('href',(gameId==='harmonies'?'/harmonies':'')+'/display/'+code);
   await page.reload();await expect(page.locator('#start')).toBeVisible();expect(room.players).toHaveLength(1);expect(room.players[0].id).toBe(playerId);
   const display=await context.newPage();await display.goto(url+'/display/'+code);await expect(display.locator('#qr')).toBeVisible();expect([...room.sockets.values()].filter(s=>s?.role==='player')).toHaveLength(1);expect([...room.sockets.values()].some(s=>s?.role==='host')).toBe(true);await expect(page.locator('#start')).toBeVisible();await display.close();
   if(gameId==='harmonies'){
    await page.locator('#hm-solo').check();await expect(page.locator('#start')).toBeEnabled();await page.locator('#start').click();await expect(page.locator('.hm-root')).toBeVisible();expect(room.harmonies!.players).toHaveLength(1);
   }
   if(gameId==='pixies'){
    const friendContext=await browser.newContext({viewport:{width:390,height:844}});
    try{
     const friend=await friendContext.newPage();await friend.goto(url+'/play/'+code);await friend.getByRole('textbox',{name:'ชื่อของคุณ'}).fill('Friend');await friend.getByRole('button',{name:'เข้าห้อง',exact:true}).click();await friend.getByRole('button',{name:'พร้อมเล่น',exact:true}).click();await expect(friend.locator('#start')).toHaveCount(0);
     await expect(page.locator('#start')).toBeEnabled();await page.locator('#start').click();await expect(page.locator('.px-garden')).toHaveCount(2);await expect(friend.locator('.px-garden')).toHaveCount(2);expect(room.pixies!.players).toHaveLength(2);
    }finally{await friendContext.close();}
   }
   const closed=await page.request.post(url+'/api/rooms/leave',{headers:{Origin:url},data:{code,close:true}});expect(closed.ok(),await closed.text()).toBe(true);
  }
  expect(errors).toEqual([]);
 }finally{await context.close();await app.close();await rm(dir,{recursive:true,force:true});}
});
