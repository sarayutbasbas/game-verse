import {test,expect,type Page,type BrowserContext} from '@playwright/test';
import {mkdtemp,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startServer} from '../../src/server/index.js';
import {testAccount} from './auth-fixture.js';
import type {TinyView,TinyAction} from '../../src/games/tiny-towns/types.js';
const rng=(seed=2)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
const read=(p:Page):Promise<TinyView>=>p.evaluate(()=>(window as any).__tinyView);
async function capture(c:BrowserContext){await c.addInitScript(()=>{window.WebSocket=new Proxy(window.WebSocket,{construct(T,args){const ws=new T(args[0],args[1]);ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.type==='state'&&m.view?.gameId==='tiny-towns')(window as any).__tinyView=m.view;});return ws;}});});}
async function act(page:Page,a:TinyAction){const v=await read(page),index=v.me!.legal.findIndex(x=>JSON.stringify(x)===JSON.stringify(a));await page.waitForTimeout(360);
 if(a.type==='tiny-place'&&a.warehouse===undefined){if(await page.locator(`[data-color="${a.resource}"]`).count())await page.locator(`[data-color="${a.resource}"]`).click();await page.locator(`[data-owner="${v.me!.id}"][data-cell="${a.at}"]`).click();}
 else if(a.type==='tiny-build'){await page.locator(`[data-build-card="${a.card}"]`).click();if(await page.locator('[data-build-options]').count())await page.locator('[data-build-options]').click();const b=v.me!.builds.findIndex(b=>b.card===a.card&&JSON.stringify(b.cells)===JSON.stringify(a.cells));if(await page.locator(`[data-build-index="${b}"]`).count())await page.locator(`[data-build-index="${b}"]`).click();await page.locator(`[data-owner="${v.me!.id}"][data-cell="${a.at}"]`).click();}
 else if(a.type==='tiny-free'||a.type==='tiny-replace'){if(await page.locator('[data-open-effect]').count())await page.locator('[data-open-effect]').click();if(await page.locator(`[data-effect-card="${a.card}"]`).count())await page.locator(`[data-effect-card="${a.card}"]`).click();await page.locator(`[data-owner="${v.me!.id}"][data-cell="${a.at}"]`).click();}
 else if(a.type==='tiny-watch'){if(await page.locator('[data-open-watch]').count())await page.locator('[data-open-watch]').click();for(const id of a.cards)await page.locator(`[name=watch][value="${id}"]`).check();await page.locator('.tiny-watch-form button[type=submit]').click();}
 else{expect(index).toBeGreaterThanOrEqual(0);await page.locator(`[data-tiny-action="${index}"]`).click();}
 await expect.poll(async()=>(await read(page)).revision).toBeGreaterThan(v.revision);
}
test('Tiny Towns actual phone + shared display: illustrated library, solo choices, build, full settlement, reconnect, rematch, two-player private draft',async({browser})=>{
 test.setTimeout(300000);const live=process.env.TINY_LIVE==='1',dir=await mkdtemp(join(tmpdir(),'tiny-browser-')),app=live?undefined:await startServer(0,'127.0.0.1',true,rng(),{storePath:join(dir,'rooms.sqlite')}),origin=live?'http://localhost:5555':'http://localhost:'+(app!.server.address() as any).port,contexts:BrowserContext[]=[],errors:string[]=[];
 try{
  await mkdir('data/tiny-towns',{recursive:true});const c=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});contexts.push(c);await capture(c);const phone=await c.newPage();phone.on('pageerror',e=>errors.push(e.message));await phone.goto(origin+'/games/tiny-towns');await expect(phone.locator('.entry-play-time')).toContainText('30 นาที');
  await phone.locator('[data-card-reference="tiny-towns"]').click();await expect(phone.locator('.reference-card')).toHaveCount(12);await phone.locator('.reference-card').first().click();await expect(phone.locator('.reference-detail-copy')).toContainText('อาหาร');await expect(phone.locator('.reference-detail .tiny-pattern')).toBeVisible();await phone.keyboard.press('Escape');
  await testAccount(phone,app);await phone.locator('#create').click();await expect(phone.locator('#start')).toBeEnabled();await expect(phone.locator('.tiny-lobby-options')).toBeVisible();const code=new URL(phone.url()).pathname.split('/').pop()!;
  // Start a first-game solo without monuments; exercise solo cards rather than a multiplayer approximation.
  await phone.locator('[data-tiny-setting=monuments]').uncheck();await expect(phone.locator('#start')).toBeDisabled();await phone.locator('#lobby-ready').click();await expect(phone.locator('#start')).toBeEnabled();
  const display=await c.newPage();display.on('pageerror',e=>errors.push(e.message));await display.setViewportSize({width:1440,height:1000});await display.goto(origin+'/display/'+code);await phone.locator('#start').click();await expect(phone.locator('.tiny-root')).toBeVisible();await expect(display.locator('.tiny-root')).toBeVisible();expect((await read(display)).me).toBeUndefined();
  await phone.screenshot({path:`data/tiny-towns/${live?'docker':'isolated'}-phone.png`,fullPage:true});await display.screenshot({path:`data/tiny-towns/${live?'docker':'isolated'}-display.png`,fullPage:true});await phone.setViewportSize({width:320,height:760});expect(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await phone.setViewportSize({width:390,height:844});
  let n=0,builds=0,reloaded=false;
  while((await read(phone)).phase!=='finished'){
   const v=await read(phone),me=v.me!,p=v.players.find(p=>p.id===me.id)!,legal=me.legal;let a:TinyAction|undefined;
   if(me.builds.length){const b=me.builds.find(b=>b.card==='cottage')??me.builds[0];a={type:'tiny-build',card:b.card,cells:b.cells,at:b.destinations[0]};builds++;}
   else if(legal.some(a=>a.type==='tiny-call')){const desired=p.board[0]===null?'wood':p.board[1]===null?'stone':undefined;a=legal.find(a=>a.type==='tiny-call'&&a.resource===desired)??legal.find(a=>a.type==='tiny-call');}
   else a=legal.find(a=>a.type==='tiny-finish')??legal.find(a=>a.type==='tiny-ready')??legal[0];
   if(!a)throw Error('No legal UI decision '+v.phase);await act(phone,a);
   if(!reloaded&&(await read(phone)).players[0].board.some(c=>c&&'building'in c)){const before=await read(phone);await phone.reload();await expect(phone.locator('.tiny-root')).toBeVisible();await expect.poll(async()=>(await read(phone)).revision).toBe(before.revision);expect((await read(phone)).players[0].board).toEqual(before.players[0].board);reloaded=true;}
   if(++n>600)throw Error('Solo did not finish');
  }
  expect(builds).toBeGreaterThan(0);await expect(phone.locator('.tiny-results')).toBeVisible();await expect(display.locator('.tiny-results')).toBeVisible();await phone.screenshot({path:`data/tiny-towns/${live?'docker':'isolated'}-score.png`,fullPage:true});expect((await read(phone)).players[0].score.total).toBe((await read(display)).players[0].score.total);
  await phone.locator('[data-rematch]').click();await expect.poll(async()=>(await read(phone)).phase).toBe('call');expect((await read(phone)).round).toBe(1);
  // A separate normal two-player room, owner remains a player and each phone gets only its own secret.
  await phone.goto(origin+'/games/tiny-towns');await phone.locator('#create').click();await expect(phone.locator('#start')).toBeVisible();const code2=new URL(phone.url()).pathname.split('/').pop()!;
  const c2=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});contexts.push(c2);await capture(c2);const friend=await c2.newPage();friend.on('pageerror',e=>errors.push(e.message));await friend.goto(origin+'/play/'+code2);await friend.locator('#join-name').fill('เพื่อน');await friend.getByRole('button',{name:'เข้าห้อง',exact:true}).click();await expect(friend.locator('#lobby-ready')).toBeVisible();await friend.locator('#lobby-ready').click();await phone.locator('#start').click();await expect.poll(async()=>(await read(phone)).phase).toBe('monuments');
  const own=await read(phone),other=await read(friend);expect(own.me!.offer).not.toEqual(other.me!.offer);expect(own.players.every(p=>p.monument===undefined)).toBe(true);
  await act(phone,own.me!.legal[0]);await act(friend,other.me!.legal[0]);await expect.poll(async()=>(await read(phone)).phase).toBe('call');
  for(const resource of ['wood','stone'] as const){const current=await read(phone),caller=current.turn===current.me!.id?phone:friend;await act(caller,(await read(caller)).me!.legal.find(a=>a.type==='tiny-call'&&a.resource===resource)!);for(const p of [phone,friend]){await act(p,(await read(p)).me!.legal.find(a=>a.type==='tiny-place'&&a.at===(resource==='wood'?0:1))!);if(resource==='stone'){const b=(await read(p)).me!.builds.find(b=>b.card==='well')!;await act(p,{type:'tiny-build',card:'well',cells:b.cells,at:b.destinations[0]});}await act(p,(await read(p)).me!.legal.find(a=>a.type==='tiny-ready')!);}}
  expect((await read(phone)).round).toBe(3);expect(errors).toEqual([]);
 }finally{for(const c of contexts)await c.close();await app?.close();await rm(dir,{recursive:true,force:true});}
});
test('Tiny Towns six real phones share one display with all towns visible and no monument secrets',async({browser})=>{
 test.setTimeout(150000);const live=process.env.TINY_LIVE==='1',dir=await mkdtemp(join(tmpdir(),'tiny-six-')),app=live?undefined:await startServer(0,'127.0.0.1',true,rng(99),{storePath:join(dir,'rooms.sqlite')}),origin=live?'http://localhost:5555':'http://localhost:'+(app!.server.address() as any).port,contexts:BrowserContext[]=[],phones:Page[]=[],errors:string[]=[];
 const page=async()=>{const c=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});contexts.push(c);await capture(c);const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));return p;};
 try{
  const owner=await page();phones.push(owner);await owner.goto(origin+'/games/tiny-towns');await testAccount(owner,app);await owner.locator('#create').click();await expect(owner.locator('#start')).toBeVisible();const code=owner.url().split('/').pop()!;
  for(let i=1;i<6;i++){const p=await page();phones.push(p);await p.goto(origin+'/play/'+code);await p.locator('#join-name').fill('เมือง '+i);await p.getByRole('button',{name:'เข้าห้อง',exact:true}).click();await p.locator('#lobby-ready').click();}
  await expect(owner.locator('#start')).toBeEnabled();const display=await contexts[0].newPage();await display.setViewportSize({width:1440,height:1000});display.on('pageerror',e=>errors.push(e.message));await display.goto(origin+'/display/'+code);await owner.locator('#start').click();
  for(const p of phones){await expect(p.locator('.tiny-draft article')).toHaveCount(2);const v=await read(p);expect(v.players.every(p=>p.monument===undefined)).toBe(true);await act(p,v.me!.legal[0]);}
  await expect(display.locator('.tiny-town')).toHaveCount(6);const publicView=await read(display);expect(publicView.me).toBeUndefined();expect(publicView.players.every(p=>p.monument===undefined)).toBe(true);
  let leader:Page|undefined;for(const p of phones)if((await read(p)).turn===(await read(p)).me!.id)leader=p;expect(leader).toBeDefined();await act(leader!,(await read(leader!)).me!.legal.find(a=>a.type==='tiny-call'&&a.resource==='wood')!);
  for(const p of phones){const v=await read(p);await act(p,v.me!.legal.find(a=>a.type==='tiny-place'&&a.at===0)!);}
  await display.evaluate(()=>window.scrollTo(0,0));const boxes=await display.locator('.tiny-town').evaluateAll(nodes=>nodes.map(n=>({top:n.getBoundingClientRect().top,bottom:n.getBoundingClientRect().bottom})));await display.screenshot({path:`data/tiny-towns/${live?'docker':'isolated'}-six-display.png`});expect(boxes.filter(b=>b.top<0||b.bottom>1000)).toEqual([]);
  await phones[5].screenshot({path:`data/tiny-towns/${live?'docker':'isolated'}-six-phone.png`,fullPage:true});expect(await phones[5].evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
 }finally{for(const c of contexts)await c.close();await app?.close();await rm(dir,{recursive:true,force:true});}
});
