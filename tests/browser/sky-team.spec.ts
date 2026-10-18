import {test,expect,type Page,type BrowserContext} from '@playwright/test';
import {mkdtemp,rm,mkdir,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startServer} from '../../src/server/index.js';
import {SCRIPT} from '../sky-team-fixtures.js';
import type {SkyView} from '../../src/games/sky-team/types.js';
import {testAccount} from './auth-fixture.js';
const read=(p:Page):Promise<SkyView>=>p.evaluate(()=>(window as any).__view);
async function capture(p:Page){await p.addInitScript(()=>{(window as any).__frames=[];window.WebSocket=new Proxy(window.WebSocket,{construct(T,args){const ws=new T(args[0],args[1]);ws.addEventListener('message',e=>{const m=JSON.parse(e.data);(window as any).__frames.push(m);if(m.type==='state')(window as any).__view=m.view;});return ws;}});});}
const revision=async(p:Page,n:number)=>expect(p.locator('#main')).toHaveAttribute('data-revision',String(n));
test('Sky Team deterministic YUL: real display and both private controllers, seven rounds to safe landing',async({browser})=>{
 const dir=await mkdtemp(join(tmpdir(),'sky-browser-')),rolls=SCRIPT.flatMap(([p,c])=>[...p,...c]);const app=await startServer(0,'127.0.0.1',true,()=>((rolls.shift()??1)-.5)/6,{storePath:join(dir,'rooms.sqlite')});const url=`http://localhost:${(app.server.address() as any).port}`,contexts:BrowserContext[]=[],errors:string[]=[];await mkdir('data/qa-sky-team',{recursive:true});
 const make=async(mobile=false)=>{const c=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile});contexts.push(c);const p=await c.newPage();p.setDefaultTimeout(12000);await capture(p);p.on('pageerror',e=>errors.push(e.message));return p;};
 try{
 const host=await make();await host.goto(url+'/games/sky-team');await testAccount(host,app);await host.goto(url+'/');await expect(host.locator('img[src="/art/covers/sky-team.webp"]')).toBeVisible();await host.screenshot({path:'data/qa-sky-team/portal-cover.png',fullPage:true});await host.goto(url+'/games/sky-team');await host.getByRole('button',{name:'สร้างห้องบนจอกลาง'}).click();await expect(host.locator('#qr')).toBeVisible();const code=await host.locator('.room-code strong').innerText();const phones:Page[]=[];
 for(let i=0;i<2;i++){const p=await make(true);phones.push(p);await p.goto(url+'/play/'+code);await p.getByRole('textbox',{name:'ชื่อของคุณ'}).fill('กัปตัน');await p.getByRole('button',{name:'เข้าห้อง',exact:true}).click();await p.getByRole('button',{name:'พร้อมเล่น',exact:true}).click();}
 const third=await make(true);await third.goto(url+'/play/'+code);await third.getByRole('textbox',{name:'ชื่อของคุณ'}).fill('นักบินคนที่สาม');await third.getByRole('button',{name:'เข้าห้อง',exact:true}).click();await expect(third.locator('#entry-error')).toContainText('ห้องเต็ม');
 await host.getByRole('button',{name:'เริ่มเกม',exact:true}).click();await expect(host.locator('.st-root')).toBeVisible();await host.screenshot({path:'data/qa-sky-team/planning-desktop.png',fullPage:true});await expect(host.locator('.st-private')).toHaveCount(0);
 for(let round=1;round<=7;round++){
 await Promise.all(phones.map(p=>p.locator('#st-ready').click()));await expect(host.locator('.st-root')).toHaveAttribute('data-phase','placement');
 for(const p of phones){await expect(p.locator('.st-hand button')).toHaveCount(4);expect(await p.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);}
 if(round===1){await host.screenshot({path:'data/qa-sky-team/cockpit-desktop.png',fullPage:true});await host.setViewportSize({width:1024,height:768});await host.screenshot({path:'data/qa-sky-team/cockpit-ipad.png',fullPage:true});await host.setViewportSize({width:1440,height:1000});await phones[0].screenshot({path:'data/qa-sky-team/pilot-mobile.png',fullPage:true});await phones[1].screenshot({path:'data/qa-sky-team/copilot-mobile.png',fullPage:true});}
 for(const [slot,value] of SCRIPT[round-1][2]){
 const view=await read(host),p=phones[slot.endsWith('copilot')||slot.startsWith('radio-1')||slot.startsWith('radio-2')||slot.startsWith('flaps')?1:slot.startsWith('coffee')?view.players.findIndex(x=>x.id===view.turn):0];await revision(p,view.revision);const own=await read(p),d=own.me!.dice.find(d=>d.value===value)!;expect(d).toBeTruthy();
 const before=await read(host);await p.locator(`[data-die="${d.id}"]`).click();await p.locator(`[data-slot="${slot}"]`).click();expect((await read(host)).revision).toBe(before.revision);await expect(p.locator('.st-preview')).toBeVisible();const box=await p.locator('#st-confirm').boundingBox();expect(box!.y+box!.height).toBeLessThan(844);if(round===1&&slot==='axis-pilot')await p.screenshot({path:'data/qa-sky-team/private-preview.png',fullPage:true});
 await p.locator('#st-confirm').click();await revision(host,before.revision+1);expect((await read(host)).placements[slot].value).toBe(value);
 }
 const end=await read(host);expect(end.phase).toBe(round===7?'finished':'resolution');
 if(round<7){if(round===1){await phones[0].reload();await expect(phones[0].locator('.st-root')).toHaveAttribute('data-phase','resolution');expect((await read(phones[0])).me!.id).toBe(end.players[0].id);await host.screenshot({path:'data/qa-sky-team/round-resolution.png',fullPage:true});}await phones[0].locator('#st-next').click();await expect(host.locator('.st-root')).toHaveAttribute('data-phase','planning');}
 }
 expect((await read(host)).result?.success).toBe(true);await host.screenshot({path:'data/qa-sky-team/success.png',fullPage:true});await expect(host.locator('#st-restart')).toBeVisible();expect(rolls).toHaveLength(0);
 for(const [i,p] of [host,...phones].entries()){const frames=await p.evaluate(()=>(window as any).__frames.filter((m:any)=>m.type==='state'));for(const {view:v} of frames){expect(v.dice).toBeUndefined();expect(v.reroll).toBeUndefined();if(i===0)expect(v.me).toBeUndefined();else if(v.me)expect(v.me.dice.every((d:any)=>d.id.startsWith(v.me.role+'-'))).toBe(true);}}
 const manifest=JSON.parse(await readFile('docs/games/sky-team/asset-manifest.json','utf8'));expect(manifest.assets).toHaveLength(9);for(const a of manifest.assets){const r=await host.request.get(url+a.path);expect(r.ok()).toBe(true);expect(r.headers()['content-type']).toContain('image/webp');}
 await host.locator('#st-restart').click();await expect(host.locator('.st-root')).toHaveAttribute('data-phase','planning');expect(errors).toEqual([]);
 }finally{for(const c of contexts)await c.close();await app.close();await rm(dir,{recursive:true,force:true});}
});

test('Sky Team deployed local app: catalog, lobby, private rolls and finish controls',async({browser,baseURL})=>{
 const contexts:BrowserContext[]=[],errors:string[]=[];const make=async()=>{const c=await browser.newContext({viewport:{width:390,height:844}});contexts.push(c);const p=await c.newPage();p.setDefaultTimeout(12000);await capture(p);p.on('pageerror',e=>errors.push(e.message));return p;};
 try{const host=await make();await host.goto('/games/sky-team');await testAccount(host);await host.getByRole('button',{name:'สร้างห้องบนจอกลาง'}).click();await expect(host.locator('#qr')).toBeVisible();const code=await host.locator('.room-code strong').innerText();const phones:Page[]=[];for(let i=0;i<2;i++){const p=await make();phones.push(p);await p.goto('/play/'+code);await p.getByRole('textbox',{name:'ชื่อของคุณ'}).fill('นักบิน '+i);await p.getByRole('button',{name:'เข้าห้อง',exact:true}).click();await p.getByRole('button',{name:'พร้อมเล่น',exact:true}).click();}await host.locator('#start').click();await expect(host.locator('.st-root')).toBeVisible();await Promise.all(phones.map(p=>p.locator('#st-ready').click()));await expect(phones[0].locator('.st-hand button')).toHaveCount(4);await expect(host.locator('.st-private')).toHaveCount(0);
 for(let k=0;k<8;k++){const v=await read(host);if(v.phase!=='placement')break;const i=v.players.findIndex(p=>p.id===v.turn),p=phones[i];await revision(p,v.revision);const own=await read(p),a=own.me!.legal.find(a=>a.type==='sky-place'&&a.adjust===0&&a.slot.startsWith('coffee'))??own.me!.legal.find(a=>a.type==='sky-place'&&a.adjust===0&&!a.slot.startsWith('axis')&&!a.slot.startsWith('engine'))??own.me!.legal.find(a=>a.type==='sky-place'&&a.adjust===0);if(!a||a.type!=='sky-place')break;await p.locator(`[data-die="${a.die}"]`).click();await p.locator(`[data-slot="${a.slot}"]`).click();await p.locator('#st-confirm').click();await revision(host,v.revision+1);}
 expect((await read(host)).phase).toBe('finished');expect((await read(host)).result?.success).toBe(false);await host.screenshot({path:'data/qa-sky-team/failure-local-app.png',fullPage:true});await expect(host.locator('#st-restart')).toBeVisible();expect(errors).toEqual([]);
 }finally{for(const c of contexts)await c.close();}
});
