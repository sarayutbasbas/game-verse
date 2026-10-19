import {test,expect,type BrowserContext} from '@playwright/test';
import {mkdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startServer} from '../../src/server/index.js';
import {GAME_CATALOG} from '../../src/shared/catalog.js';
import {testAccount} from './auth-fixture.js';

test('All games explain goals and rules with working illustrations before entry, including mobile primary games',async({browser})=>{
 const context=await browser.newContext({viewport:{width:1280,height:950}}),page=await context.newPage(),errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));await mkdir('data/qa-game-learning',{recursive:true});
 try{
 const priority=['harmonies','critter-kitchen','pixies','take-time'];
 const games=[...priority,...GAME_CATALOG.filter(g=>!priority.includes(g.id)).map(g=>g.id)];
 for(const id of games){
  await page.goto('http://localhost:5555/games/'+id);const intro=page.locator('.game-introduction');await expect(intro).toBeVisible();await expect(intro.locator('.learn-goal')).not.toBeEmpty();await expect(intro.locator('.learn-entry-preview .learn-step')).toHaveCount(3);
  await intro.locator('.learn-more summary').click();await expect(intro.locator('.learn-finish')).toBeVisible();
  await intro.locator('img').evaluateAll(async imgs=>{await Promise.all(imgs.map(img=>{(img as HTMLImageElement).loading='eager';return (img as HTMLImageElement).decode();}));});
  expect(await intro.locator('img').evaluateAll(imgs=>imgs.every(img=>(img as HTMLImageElement).naturalWidth>0))).toBe(true);
  if(id!=='name-it')expect(await page.locator('#create').evaluate(el=>!!el.closest('.platform-entry')&&!!(document.querySelector('.game-introduction')!.compareDocumentPosition(el)&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  if(priority.includes(id)){
   await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`data/qa-game-learning/${id}-desktop.png`,fullPage:true});
   await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`data/qa-game-learning/${id}-phone.png`,fullPage:true});
   await page.setViewportSize({width:320,height:760});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);await page.setViewportSize({width:1280,height:950});
  }
 }
 expect(errors).toEqual([]);
 }finally{await context.close();}
});

test('Mixed saved rooms show game names and correct return destinations; illustrated help works before and after start',async({browser})=>{
 const dir=await mkdtemp(join(tmpdir(),'learning-rooms-')),app=await startServer(0,'127.0.0.1',true,()=>.42,{storePath:join(dir,'rooms.sqlite')});const url=`http://localhost:${(app.server.address() as any).port}`;const contexts:BrowserContext[]=[],hostContext=await browser.newContext({viewport:{width:1000,height:900}});contexts.push(hostContext);const host=await hostContext.newPage();const errors:string[]=[];host.on('pageerror',e=>errors.push(e.message));
 try{
 await host.goto(url+'/games/take-time');await testAccount(host,app);const saved:{name:string;code:string}[]=[];
 for(const [id,name] of [['take-time','Take Time'],['harmonies','Harmonies']]){await host.goto(url+'/games/'+id);await host.locator('#create').click();await expect(host.locator('#qr')).toBeVisible();saved.push({name,code:await host.locator('.room-code strong').innerText()});}
 await host.goto(url+'/join');
 for(const {name,code} of saved){const identity=host.locator('.room-game-identity').filter({hasText:code});await expect(identity.locator('strong')).toHaveText(name);const row=identity.locator('..');await expect(row.locator('a[href="/display/'+code+'"]')).toHaveText('เปิดจอกลาง');}
 await host.screenshot({path:'data/qa-game-learning/mixed-room-names.png',fullPage:true});await host.setViewportSize({width:320,height:760});expect(await host.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);await host.setViewportSize({width:1000,height:900});
 const code=saved[0].code,phones=[];
 for(let i=0;i<2;i++){const c=await browser.newContext({viewport:{width:390,height:844}});contexts.push(c);const p=await c.newPage();phones.push(p);await p.goto(url+'/play/'+code);await p.getByRole('textbox',{name:'ชื่อของคุณ'}).fill('เวลา '+i);await p.getByRole('button',{name:'เข้าห้อง',exact:true}).click();await p.getByRole('button',{name:'พร้อมเล่น',exact:true}).click();}
 await host.goto(url+'/display/'+code);await host.locator('#start').click();await expect(host.locator('.tt-root')).toBeVisible();await host.locator('.shared-room-menu summary').click();await host.getByRole('button',{name:'วิธีเล่นพร้อมภาพ',exact:true}).click();await expect(host.locator('.game-learning-dialog')).toBeVisible();await expect(host.locator('.game-learning-dialog .learn-step')).toHaveCount(4);await host.locator('.game-learning-dialog img').evaluateAll(async imgs=>{await Promise.all(imgs.map(img=>{(img as HTMLImageElement).loading='eager';return (img as HTMLImageElement).decode();}));});await host.screenshot({path:'data/qa-game-learning/shared-illustrated-help.png'});await host.getByRole('button',{name:'ปิดวิธีเล่น',exact:true}).click();
 await phones[0].locator('#tt-help').click();await expect(phones[0].locator('.tt-dialog .game-learning')).toBeVisible();await expect(phones[0].locator('.tt-dialog .learn-step')).toHaveCount(4);await phones[0].getByRole('button',{name:'ปิด',exact:true}).click();expect(errors).toEqual([]);
 }finally{for(const c of contexts)await c.close();await app.close();await rm(dir,{recursive:true,force:true});}
});
