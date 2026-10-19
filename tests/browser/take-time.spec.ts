import {test,expect,type Page,type BrowserContext} from '@playwright/test';
import {mkdtemp,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startServer} from '../../src/server/index.js';
import {successFixture,sequence} from '../take-time-fixtures.js';
import type {TakeTimeView} from '../../src/games/take-time/types.js';
import {testAccount} from './auth-fixture.js';
const read=(p:Page):Promise<TakeTimeView>=>p.evaluate(()=>(window as any).__view);
async function capture(p:Page){await p.addInitScript(()=>{(window as any).__frames=[];window.WebSocket=new Proxy(window.WebSocket,{construct(T,args){const ws=new T(args[0],args[1]);ws.addEventListener('message',e=>{const m=JSON.parse(e.data);(window as any).__frames.push(m);if(m.type==='state')(window as any).__view=m.view;});return ws;}});});}
const revision=async(p:Page,n:number)=>expect(p.locator('#main')).toHaveAttribute('data-revision',String(n));
async function joinPhone(p:Page,url:string,code:string,name:string){await p.goto(url+'/play/'+code);await p.getByRole('textbox',{name:'ชื่อของคุณ'}).fill(name);await p.getByRole('button',{name:'เข้าห้อง',exact:true}).click();await p.getByRole('button',{name:'พร้อมเล่น',exact:true}).click();}
test('Take Time full successful clock: display, private phones, manual resolution, guide, audio and reconnect',async({browser})=>{
 const dir=await mkdtemp(join(tmpdir(),'tt-browser-'));const app=await startServer(0,'127.0.0.1',true,()=>.42,{storePath:join(dir,'rooms.sqlite')});const url=`http://localhost:${(app.server.address() as any).port}`,contexts:BrowserContext[]=[],errors:string[]=[];await mkdir('data/qa-take-time',{recursive:true});
 const make=async(mobile=false)=>{const c=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile});contexts.push(c);const p=await c.newPage();p.setDefaultTimeout(12000);await capture(p);p.on('pageerror',e=>errors.push(e.message));return p;};
 try{
 const host=await make();await host.goto(url+'/games/take-time');await testAccount(host,app);await host.goto(url+'/');await expect(host.locator('img[src="/art/take-time/cover.webp"]')).toBeVisible();await host.screenshot({path:'data/qa-take-time/catalogue.png',fullPage:true});await host.goto(url+'/games/take-time');await host.getByRole('button',{name:'สร้างห้องบนจอกลาง'}).click();await expect(host.locator('#qr')).toBeVisible();const code=await host.locator('.room-code strong').innerText();const phones=[await make(true),await make(true)];for(let i=0;i<2;i++)await joinPhone(phones[i],url,code,'ผู้เดินทาง '+(i+1));
 await host.locator('#start').click();await expect(host.locator('.tt-root')).toHaveAttribute('data-phase','discussion');
 const room=app.rooms.rooms.get(code)!,fixture=successFixture();fixture.matchId=room.takeTime!.matchId;fixture.players.forEach((p,i)=>{p.id=room.players[i].id;p.name=room.players[i].name;});room.takeTime=fixture;
 for(const p of [host,...phones])await p.reload();await expect(host.locator('.tt-root')).toHaveAttribute('data-phase','discussion');await expect(host.locator('.tt-hand')).toHaveCount(0);
 await host.locator('#tt-help').click();await expect(host.getByRole('dialog')).toContainText('เปิดเล่น');await host.getByRole('button',{name:'ปิด',exact:true}).click();await host.locator('.audio-settings summary').click();await host.locator('.music-sound-button').click();await expect(host.locator('.music-sound-button')).toHaveAttribute('aria-pressed','true');await host.locator('.audio-settings summary').click();
 await host.screenshot({path:'data/qa-take-time/discussion-desktop.png',fullPage:true});for(const p of phones){await expect(p.locator('.tt-hand .tt-card.face')).toHaveCount(0);await p.locator('#tt-open').click();}
 await expect(host.locator('.tt-root')).toHaveAttribute('data-phase','placement');await phones[0].screenshot({path:'data/qa-take-time/hand-mobile.png',fullPage:true});
 for(const width of [320,390]){await phones[0].setViewportSize({width,height:844});expect(await phones[0].evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);}await phones[0].setViewportSize({width:390,height:844});
 await host.setViewportSize({width:1024,height:768});expect(await host.locator('.tt-table').evaluate(el=>el.getBoundingClientRect().bottom)).toBeLessThanOrEqual(768);await host.screenshot({path:'data/qa-take-time/clock-ipad.png',fullPage:true});await host.setViewportSize({width:1440,height:1000});
 for(let k=0;k<12;k++){
 const p=phones[k%2],v=await read(host);await revision(p,v.revision);const own=await read(p),[suit,value,segment]=sequence[k],c=own.me!.hand.find(c=>c.suit===suit&&c.value===value)!;expect(c).toBeTruthy();
 await p.locator(`[data-card="${c.id}"]`).click();await p.locator(`[data-segment="${segment}"]`).click();expect((await read(host)).revision).toBe(v.revision);if(k===0){await p.locator('#tt-place').scrollIntoViewIfNeeded();const box=await p.locator('#tt-place').boundingBox();expect(box!.y+box!.height).toBeLessThanOrEqual(844);await p.screenshot({path:'data/qa-take-time/selection-viewport.png'});}await p.locator('#tt-place').click();await revision(host,v.revision+1);
 if(k===0){const placed=(await read(host)).placed[0];expect(placed.card.value).toBeUndefined();await p.locator(`[data-peek="${c.id}"]`).click();await expect(p.getByRole('dialog')).toContainText('เฉพาะคุณ');await p.getByRole('button',{name:'ปิด',exact:true}).click();await p.reload();await expect(p.locator('.tt-root')).toHaveAttribute('data-phase','placement');expect((await read(p)).me!.id).toBe(own.me!.id);}
 if(k===3){await revision(phones[1],v.revision+1);expect((await read(phones[1])).players[0].reserve).toHaveLength(0);expect((await read(phones[1])).me!.hand).toHaveLength(4);}
 }
 await expect(host.locator('.tt-root')).toHaveAttribute('data-phase','resolution');await host.screenshot({path:'data/qa-take-time/before-reveal.png',fullPage:true});
 for(let i=0;i<6;i++){await host.locator('#tt-reveal').click();await expect.poll(async()=>(await read(host)).revealed).toBe(i+1);}
 expect((await read(host)).result?.success).toBe(true);await host.screenshot({path:'data/qa-take-time/success-desktop.png',fullPage:true});await phones[0].screenshot({path:'data/qa-take-time/success-mobile.png',fullPage:true});
 for(const p of [host,...phones]){const frames=await p.evaluate(()=>(window as any).__frames.filter((m:any)=>m.type==='state'));for(const {view:v} of frames){expect(v.unused).toBeUndefined();expect(v.matchId).toBeUndefined();expect(v.players.every((p:any)=>[...p.cards,...p.reserve].every((c:any)=>c.value===undefined))).toBe(true);for(const item of v.placed)if(!item.faceup&&item.segment>=v.revealed)expect(item.card.value).toBeUndefined();}}
 for(const asset of ['cover','solar','lunar','clock']){const r=await host.request.get(url+'/art/take-time/'+asset+'.webp');expect(r.ok()).toBe(true);}
 await host.locator('#tt-retry').click();await expect(host.locator('.tt-root')).toHaveAttribute('data-phase','discussion');expect((await read(host)).bonus).toBe(0);expect(errors).toEqual([]);
 }finally{for(const c of contexts)await c.close();await app.close();await rm(dir,{recursive:true,force:true});}
});
test('Take Time Docker: create/join three phones, hidden hands, first play, failed full clock and bonus retry',async({browser})=>{
 const contexts:BrowserContext[]=[],errors:string[]=[];const make=async()=>{const c=await browser.newContext({viewport:{width:390,height:844}});contexts.push(c);const p=await c.newPage();p.setDefaultTimeout(12000);await capture(p);p.on('pageerror',e=>errors.push(e.message));return p;};
 try{const host=await make();await host.goto('/games/take-time');await testAccount(host);await host.getByRole('button',{name:'สร้างห้องบนจอกลาง'}).click();await expect(host.locator('#qr')).toBeVisible();const code=await host.locator('.room-code strong').innerText();const phones=[await make(),await make(),await make()];for(let i=0;i<3;i++)await joinPhone(phones[i],'',code,'เวลา '+i);await host.locator('#start').click();await expect(host.locator('.tt-root')).toBeVisible();
 for(const p of phones){await expect(p.locator('.tt-hand .tt-card.face')).toHaveCount(0);await p.locator('#tt-open').click();}
 await expect(host.locator('.tt-root')).toHaveAttribute('data-phase','placement');for(let i=0;i<12;i++){const p=phones[i%3],v=await read(host);await revision(p,v.revision);const c=(await read(p)).me!.hand[0];await p.locator(`[data-card="${c.id}"]`).click();await p.locator('[data-segment="0"]').click();await p.locator('#tt-place').click();await revision(host,v.revision+1);}
 for(let i=0;i<6;i++){await host.locator('#tt-reveal').click();await expect.poll(async()=>(await read(host)).revealed).toBe(i+1);}expect((await read(host)).result?.success).toBe(false);await host.locator('#tt-retry').click();await expect(host.locator('.tt-root')).toHaveAttribute('data-phase','discussion');expect((await read(host)).bonus).toBe(1);expect(errors).toEqual([]);
 }finally{for(const c of contexts)await c.close();}
});
