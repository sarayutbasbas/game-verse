import {test,expect,type Page,type BrowserContext} from '@playwright/test';
import {mkdtemp,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startServer} from '../../src/server/index.js';
import {testAccount,createDisplayRoom} from './auth-fixture.js';
import {seeded} from '../critter-kitchen-fixtures.js';
const read=(p:Page)=>p.evaluate(()=>(window as any).__view);
async function capture(p:Page){await p.addInitScript(()=>{window.WebSocket=new Proxy(window.WebSocket,{construct(T,args){const ws=new T(args[0],args[1]);ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.type==='state')(window as any).__view=m.view;});return ws;}});});}
test('Owner hamburger restart: cancel, confirm, private fresh setup and reconnect across four games',async({browser})=>{
 const dir=await mkdtemp(join(tmpdir(),'restart-ui-')),app=await startServer(0,'127.0.0.1',true,seeded(66),{storePath:join(dir,'rooms.sqlite')}),url=`http://localhost:${(app.server.address() as any).port}`,contexts:BrowserContext[]=[];
 try{
 await mkdir('data/qa-room-restart',{recursive:true});const hc=await browser.newContext({viewport:{width:1000,height:850}});contexts.push(hc);const host=await hc.newPage();await capture(host);await host.goto(url+'/games/critter-kitchen');await testAccount(host,app);
 for(const game of ['critter-kitchen','harmonies','pixies','take-time']){
 await host.goto(url+'/games/'+game);await createDisplayRoom(host);const code=await host.locator('.room-code strong').innerText();const owner=await hc.newPage();await owner.setViewportSize({width:390,height:844});await capture(owner);const gc=await browser.newContext({viewport:{width:390,height:844}});contexts.push(gc);const guest=await gc.newPage();await capture(guest);
 for(const [i,p]of [owner,guest].entries()){p.setDefaultTimeout(15000);await p.goto(url+'/play/'+code);const name=p.getByRole('textbox',{name:'ชื่อของคุณ'});if(await name.isEditable())await name.fill('ครัว '+i);await p.getByRole('button',{name:'เข้าห้อง',exact:true}).click();await p.getByRole('button',{name:'พร้อมเล่น',exact:true}).click();}
 if(game==='critter-kitchen')await host.locator('#ck-restaurateurs').check();await host.locator('#start').click();
 if(game==='critter-kitchen'){for(const p of [owner,guest]){await p.locator('[data-rest]').first().click();await p.locator('#ck-choice-confirm').click();}await host.locator('.ck-challenge-reveal button').click();await expect(owner.locator('.ck-challenge-reveal')).toHaveCount(0);}
 await expect.poll(()=>read(owner).then(v=>v.phase)).not.toBe('lobby');await expect(owner.locator('.room-restart-button').first()).toHaveCount(1);await expect(guest.locator('.room-restart-button')).toHaveCount(0);
 const sc=await browser.newContext();contexts.push(sc);const spectator=await sc.newPage();await spectator.goto(url+'/display/'+code);await expect(spectator.locator('.room-restart-button')).toHaveCount(0);
 if(game==='critter-kitchen')await owner.locator('[data-tab=information]').click();
 const menu=owner.locator(game==='critter-kitchen'?'.ck-menu':game==='harmonies'?'.hm-view-options':'.shared-room-menu');await menu.locator('summary').first().click();const button=menu.locator('.room-restart-button');await expect(button).toBeVisible();await expect(button).toHaveCSS('border-radius','50%');let before=app.rooms.rooms.get(code)!.revision;
 await button.click();await expect(owner.locator('.room-restart-dialog')).toBeVisible();expect(await owner.evaluate(()=>document.activeElement?.hasAttribute('data-cancel-restart'))).toBe(true);await owner.screenshot({path:'data/qa-room-restart/'+game+'-confirm.png'});await owner.locator('[data-cancel-restart]').click();expect(app.rooms.rooms.get(code)!.revision).toBe(before);
 if(game==='take-time'){await menu.locator('summary').first().click();await button.click();await guest.locator('#tt-open').click();await expect(owner.locator('.room-restart-dialog')).toHaveCount(0);before=app.rooms.rooms.get(code)!.revision;}
 await menu.locator('summary').first().click();await button.click();await owner.locator('[data-confirm-restart]').evaluate((b:HTMLButtonElement)=>{b.click();b.click();});await expect.poll(()=>app.rooms.rooms.get(code)!.revision).toBe(before+1);await expect(owner.locator('.room-restart-dialog')).toHaveCount(0);
 await expect.poll(()=>read(guest).then(v=>v.revision)).toBe(before+1);const fresh=await read(owner);expect(fresh.code).toBe(code);expect(fresh.players).toHaveLength(2);expect(fresh.me.canManage).toBe(true);
 if(game==='critter-kitchen'){await expect(owner.locator('[data-rest]')).toHaveCount(2);await expect(owner.locator('[data-rest]').first()).toBeVisible();expect(fresh.phase).toBe('restaurateurs');expect(fresh.players.every((p:any)=>p.restaurateur===null)).toBe(true);}
 if(game==='take-time'){expect(fresh.phase).toBe('discussion');expect(fresh.attempt).toBe(1);expect(fresh.bonus).toBe(0);expect(fresh.players.every((p:any)=>!p.opened)).toBe(true);}
 if(game==='harmonies')expect(fresh.players.every((p:any)=>p.board.every((c:any)=>!c.stack.length))).toBe(true);
 await owner.reload();await expect.poll(()=>read(owner).then(v=>v?.revision)).toBe(before+1);await expect(guest.locator('.room-restart-button')).toHaveCount(0);
 // Every participant can leave the page without leaving the seat, then resume.
 const guestMenu=guest.locator(game==='critter-kitchen'?'.ck-menu':game==='harmonies'?'.hm-view-options':'.shared-room-menu');
 await guestMenu.locator('summary').first().click();await guestMenu.getByRole('button',{name:'ออกจากห้อง',exact:true}).click();await expect(guest.locator('.room-exit-dialog')).toBeVisible();await guest.locator('[data-cancel-exit]').click();expect(app.rooms.rooms.get(code)!.revision).toBe(before+1);
 await guestMenu.locator('summary').first().click();await guestMenu.getByRole('button',{name:'ออกจากห้อง',exact:true}).click();await guest.locator('[data-confirm-exit]').click();await expect(guest).toHaveURL(url+'/games/'+game);await expect(guest.locator('.game-rooms .relative-time')).toContainText('เมื่อสักครู่');await expect(guest.locator('.learn-introduction')).not.toHaveAttribute('open');expect(app.rooms.rooms.get(code)!.players).toHaveLength(2);expect(app.rooms.rooms.get(code)!.revision).toBe(before+1);
 await guest.getByRole('link',{name:new RegExp('กลับไปเล่น .* ห้อง '+code)}).click();await expect.poll(()=>read(guest).then(v=>v?.revision)).toBe(before+1);await expect(guest.locator('.room-restart-button')).toHaveCount(0);
await owner.close();await guest.close();await spectator.close();
 }
 }finally{for(const c of contexts)await c.close();await app.close();await rm(dir,{recursive:true,force:true});}
});
