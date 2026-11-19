import {test,expect,type Page,type BrowserContext} from '@playwright/test';
import {mkdtemp,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startServer} from '../../src/server/index.js';
import {testAccount} from './auth-fixture.js';
import {rng,choose} from '../friday-fixtures.js';
import type {FridayView,FridayAction} from '../../src/games/friday/types.js';
const read=(p:Page):Promise<FridayView>=>p.evaluate(()=>(window as any).__fridayView);
const noX=async(p:Page)=>expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
test('Friday actual solo UI: pregame/library, one-screen owner, shared display, every decision through buttons, private sort reload, final score and rematch',async({browser})=>{
 test.setTimeout(360000);const live=process.env.FR_LIVE==='1',dir=await mkdtemp(join(tmpdir(),'friday-browser-'));
 const app=live?undefined:await startServer(0,'127.0.0.1',true,rng(1),{storePath:join(dir,'rooms.sqlite')}),origin=live?'http://localhost:5555':'http://localhost:'+(app!.server.address() as any).port;
 const contexts:BrowserContext[]=[],errors:string[]=[];let code='',phone:Page|undefined;
 try{
  await mkdir('data/friday',{recursive:true});const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});contexts.push(context);
  await context.addInitScript(()=>{window.WebSocket=new Proxy(window.WebSocket,{construct(T,args){const ws=new T(args[0],args[1]);ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.type==='state'&&m.view?.gameId==='friday')(window as any).__fridayView=m.view;});return ws;}});});
  phone=await context.newPage();phone.on('pageerror',e=>errors.push(e.message));await phone.goto(origin+'/games/friday');await expect(phone.locator('.entry-play-time')).toContainText('30 นาที');
  await phone.locator('.learn-more summary').click();await expect(phone.locator('.game-introduction')).toContainText('โจรสลัด');await phone.locator('[data-card-reference="friday"]').click();await expect(phone.locator('.reference-card')).toHaveCount(12);await phone.locator('.reference-card').first().click();await expect(phone.locator('.reference-detail-copy')).toContainText('จั่วฟรี');await phone.keyboard.press('Escape');
  await testAccount(phone,app);await phone.locator('#create').click();await expect(phone.locator('#start')).toBeEnabled();await expect(phone.locator('.fr-level-options button')).toHaveCount(4);code=new URL(phone.url()).pathname.split('/').pop()!;
  const display=await context.newPage();display.on('pageerror',e=>errors.push(e.message));await display.setViewportSize({width:1440,height:1000});await display.goto(origin+'/display/'+code);await expect(display.locator('#qr')).toBeVisible();
  await phone.locator('#start').click();await expect(phone.locator('.fr-root')).toBeVisible();await expect(display.locator('.fr-root')).toBeVisible();expect((await read(display)).me).toBeUndefined();
  await expect(phone.locator('.fr-choice')).toHaveCount(2);await phone.screenshot({path:`data/friday/${live?'docker':'isolated'}-choose-phone.png`,fullPage:true});await display.screenshot({path:`data/friday/${live?'docker':'isolated'}-choose-display.png`});
  await phone.setViewportSize({width:320,height:760});await noX(phone);await phone.setViewportSize({width:390,height:844});
  let n=0,last=Date.now(),peekReload=false,combatImage=false;
  while((await read(phone!)).phase!=='finished'){
   const v=await read(phone!);expect(v.me).toBeDefined();const a=choose(v),idx=v.me!.legal.findIndex(x=>JSON.stringify(x)===JSON.stringify(a));expect(idx).toBeGreaterThanOrEqual(0);
   if(v.pending?.kind==='sort'&&v.pending.count>=2&&!peekReload){
    const pub=await read(display);expect(pub.me).toBeUndefined();expect((pub.pending as any)?.cards).toBeUndefined();expect(pub.pending?.count).toBe(v.pending.count);const peek=v.me!.peek;
    await phone.reload();await expect(phone.locator('.fr-root')).toBeVisible();await expect.poll(async()=>(await read(phone!)).revision).toBe(v.revision);expect((await read(phone!)).me!.peek).toEqual(peek);await phone.screenshot({path:'data/friday/private-sort.png',fullPage:true});peekReload=true;
   }
   if(v.played.length>=4&&!combatImage){await phone.setViewportSize({width:320,height:760});await noX(phone);await phone.screenshot({path:`data/friday/${live?'docker':'isolated'}-fight-phone.png`,fullPage:true});await phone.setViewportSize({width:390,height:844});await display.screenshot({path:`data/friday/${live?'docker':'isolated'}-fight-display.png`,fullPage:true});combatImage=true;}
   const wait=350-(Date.now()-last);if(wait>0)await phone.waitForTimeout(wait);last=Date.now();
   if(a.type==='fr-use'||a.type==='fr-target'||a.type==='fr-trash'){const selector=a.type==='fr-use'?`[data-fr-use="${a.source}"]`:`[data-fr-action="${idx}"]`;for(let page=0;page<30&&!await phone.locator(selector).count();page++){const next=phone.locator('[data-fr-page="1"]:not(:disabled)');if(await next.count())await next.click();else if(await phone.locator('[data-fr-page="-1"]:not(:disabled)').count()){while(await phone.locator('[data-fr-page="-1"]:not(:disabled)').count())await phone.locator('[data-fr-page="-1"]').click();}else break;}}
   if(a.type==='fr-use'){
    await phone.locator(`[data-fr-use="${a.source}"]`).click();if(await phone.locator('.fr-dialog [data-fr-copy]').count())await phone.locator(`.fr-dialog [data-fr-copy="${idx}"]`).click();
   }else if(a.type==='fr-sort-finish'){
    const desired=[...a.order,...(a.discard?[a.discard]:[])];
    for(let i=0;i<desired.length;i++){
     let order=await phone.locator('[data-fr-peek-discard]').evaluateAll(ns=>ns.map(n=>(n as HTMLElement).dataset.frPeekDiscard!));let j=order.indexOf(desired[i]);
     while(j>i){await phone.locator(`[data-fr-move="${j}"][data-dir="-1"]`).click();j--;}
    }
    if(a.discard)await phone.locator(`[data-fr-peek-discard="${a.discard}"]`).click();await phone.locator('[data-fr-sort-done]').click();
   }else await phone.locator(`[data-fr-action="${idx}"]`).click();
   await expect.poll(async()=>(await read(phone!)).revision).toBeGreaterThan(v.revision);await expect.poll(async()=>(await read(display)).revision).toBe((await read(phone!)).revision);
   if(++n>1700)throw Error('Game did not terminate');
  }
  const end=await read(phone!);await expect(phone.locator('.fr-result')).toBeVisible();expect(end.score?.total).toBeDefined();if(!live){expect(end.outcome).toBe('won');expect(end.defeated).toHaveLength(2);expect(peekReload).toBe(true);}
  await phone.screenshot({path:`data/friday/${live?'docker':'isolated'}-final.png`,fullPage:true});await noX(phone);expect((await read(display)).score).toEqual(end.score);
  await phone.locator('[data-fr-rematch]').click();await expect(phone.locator('.fr-choice')).toHaveCount(2);expect((await read(phone!)).phase).toBe('choose');expect((await read(phone!)).players[0].id).toBe(end.players[0].id);
  await phone.locator('[data-fr-help]').click();await expect(phone.locator('.game-learning-dialog')).toContainText('ระดับ 4');await phone.keyboard.press('Escape');
  await phone.locator('[data-fr-settings]').click();await phone.locator('.fr-dialog [data-fr-pile="discard"]').click();await expect(phone.locator('.fr-dialog')).toBeVisible();await phone.keyboard.press('Escape');await expect(phone.locator('.fr-dialog')).toHaveCount(0);
  console.log('Friday UI verified',JSON.stringify({live,actions:n,outcome:end.outcome,score:end.score?.total,privateSort:peekReload}));expect(errors).toEqual([]);
 }finally{
  if(live&&phone&&code)await phone.request.post(origin+'/api/rooms/leave',{headers:{Origin:origin},data:{code,close:true}}).catch(()=>{});
  for(const context of contexts)await context.close();if(app)await app.close();await rm(dir,{recursive:true,force:true});
 }
});
