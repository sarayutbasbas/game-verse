import {test,expect,type Page} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {testAccount} from './auth-fixture.js';
import type {CKView,CKAction,CKState,Player} from '../../src/games/critter-kitchen/types.js';
import {TOKEN} from '../../src/games/critter-kitchen/data.js';
import {challengeMeals,criticMeal,seeded} from '../critter-kitchen-fixtures.js';
const read=(p:Page):Promise<CKView>=>p.evaluate(()=>(window as any).__ckView);
async function capture(p:Page){await p.addInitScript(()=>{window.WebSocket=new Proxy(window.WebSocket,{construct(T,args){const ws=new T(args[0],args[1]);(window as any).__ckSocket=ws;ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.type==='state')(window as any).__ckView=m.view;});return ws;}});});}
test('Critter Kitchen Promo: Docker lobby choices, private phones, reload, artwork and complete settlement',async({browser})=>{
 test.setTimeout(240000);await mkdir('data/qa-critter-kitchen',{recursive:true});const contexts=[],errors:string[]=[];let code='';
 const hc=await browser.newContext({viewport:{width:1280,height:900}});contexts.push(hc);const host=await hc.newPage();await capture(host);host.on('pageerror',e=>errors.push(e.message));
 try{
 await host.goto('/games/critter-kitchen');await testAccount(host);await host.getByRole('button',{name:'สร้างห้องบนจอกลาง'}).click();code=await host.locator('.room-code strong').innerText();
 await host.locator('#ck-luckyDuck').check();await expect.poll(async()=>(await read(host)).expansions?.luckyDuck).toBe(true);await host.locator('#ck-rudy').check();await expect.poll(async()=>(await read(host)).expansions?.rudy).toBe(true);await host.locator('#ck-aLaCartChefs').check();await expect.poll(async()=>(await read(host)).expansions?.aLaCartChefs).toBe(true);await host.locator('#ck-aLaCartMoreChefs').check();await expect.poll(async()=>(await read(host)).expansions?.aLaCartMoreChefs).toBe(true);await host.reload();await expect(host.locator('#ck-aLaCartMoreChefs')).toBeChecked();await expect(host.locator('#ck-aLaCartChefs')).toBeChecked();await expect(host.locator('#ck-luckyDuck')).toBeChecked();await expect(host.locator('#ck-rudy')).toBeChecked();
 await expect.poll(()=>host.locator('.ck-promo-setup img').evaluateAll((imgs:HTMLImageElement[])=>imgs.every(i=>i.complete&&i.naturalWidth>0))).toBe(true);await host.screenshot({path:'data/qa-critter-kitchen/promo-lobby-desktop.png',fullPage:true});await host.setViewportSize({width:320,height:740});expect(await host.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);await host.locator('.ck-promo-setup').screenshot({path:'data/qa-critter-kitchen/promo-lobby-mobile.png'});await host.setViewportSize({width:1280,height:900});
 const phones:Page[]=[];for(let i=0;i<2;i++){const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});contexts.push(c);const p=await c.newPage();await capture(p);p.on('pageerror',e=>errors.push(e.message));phones.push(p);await p.goto('/play/'+code);await p.getByRole('textbox',{name:'ชื่อของคุณ'}).fill('ครัว Promo '+i);await p.getByRole('button',{name:'เข้าห้อง',exact:true}).click();await p.getByRole('button',{name:'พร้อมเล่น',exact:true}).click();}
 await expect(host.locator('#ck-luckyDuck')).toBeChecked();await expect(host.locator('#ck-rudy')).toBeChecked();await host.locator('#ck-restaurateurs').check();await host.locator('#start').click();await expect.poll(async()=>(await read(host)).phase).toBe('restaurateurs');const ids=await Promise.all(phones.map(async p=>(await read(p)).me!.id));const random=seeded(762);let sawGift=false;
 for(let steps=0;steps<1000;steps++){
 const h=await read(host);if(h.phase==='finished')break;let actor:Page=host,action:CKAction|undefined;
 if(h.phase==='running')action={type:'ck-run'};
 else if(h.phase==='planning'&&h.challengeReveal!==undefined)action={type:'ck-continue-planning',round:h.round,challenge:h.challengeReveal};
 else if(h.phase==='challenge-results')action={type:h.resultsRevealed===false?'ck-reveal-results':'ck-next'};
 else{
 const target=h.phase==='shopping'?h.turn!:h.players.find(p=>h.phase==='refrigeration'?!p.fridgeReady:!p.committed)!.id;actor=phones[ids.indexOf(target)];await expect.poll(async()=>(await read(actor)).revision).toBe(h.revision);const v=await read(actor),me=v.me!,mine=v.players.find(p=>p.id===me.id)!;
 if(v.phase==='restaurateurs')action=me.legal.find(a=>a.type==='ck-restaurateur'&&a.card==='wolfgang-duck')??me.legal[0];
 if(v.phase==='planning'){const locs=v.config.locations.map(l=>l.id).sort(()=>random()-.5);action={type:'ck-plan',epoch:me.epoch,plan:Object.fromEntries(me.chefIds.map((id,i)=>[id,locs[i]]))};}
 if(v.phase==='shopping'){
 if(v.decision?.kind==='rudy-gift'){await expect(actor.locator('.ck-rudy-gift')).toBeVisible();await actor.locator('.ck-rudy-gift').screenshot({path:'data/qa-critter-kitchen/promo-rudy-gift.png'});const before=v.revision;await actor.locator('[data-rudy-recipient]').first().click();await expect.poll(async()=>(await read(host)).revision).toBe(before+1);sawGift=true;continue;}
 action=me.legal.find(a=>a.type==='ck-pick'&&a.item.startsWith('zous:'))??me.legal.find(a=>a.type==='ck-pick')??me.legal.find(a=>a.type==='ck-consolation'&&a.reward==='soup')??me.legal[0];
 }
 const s={...v,challenges:v.challenges.map(c=>c.id!)} as unknown as CKState,p={...mine,...me} as unknown as Player;
 if(v.phase==='challenge')action={type:'ck-meals',epoch:me.epoch,meals:challengeMeals(s,p)};
 if(v.phase==='critic')action={type:'ck-final',epoch:me.epoch,meal:criticMeal(s,p)};
 if(v.phase==='refrigeration'){const free=me.storage.filter(t=>v.critic==='raccoon'&&TOKEN[t].kind==='ingredient'&&TOKEN[t].value===2),normal=me.storage.filter(t=>!free.includes(t));action={type:'ck-fridge',epoch:me.epoch,keep:[...free,...normal.slice(0,v.round===3?5:10)]};}
 if(me.cosmoSous){const other=phones.find(p=>p!==actor)!;expect((await read(other)).me?.cosmoSous).toBeUndefined();expect(JSON.stringify(h)).not.toContain('cosmoSous');}
 }
 expect(action,JSON.stringify({phase:h.phase,step:steps})).toBeTruthy();await actor.evaluate(({action,revision})=>(window as any).__ckSocket.send(JSON.stringify({type:'command',id:crypto.randomUUID(),revision,action})),{action,revision:h.revision});await expect.poll(async()=>(await read(host)).revision).toBe(h.revision+1);await actor.waitForTimeout(350);
 }
 const done=await read(host);expect(done.phase).toBe('finished');expect(done.players).toHaveLength(2);expect(done.players.every(p=>Number.isFinite(p.score?.total))).toBe(true);expect(done.expansions).toEqual({luckyDuck:true,rudy:true,aLaCartChefs:true,aLaCartMoreChefs:true});expect(errors).toEqual([]);
 for(const id of ['sous-cosmo','sous-rudy','sous-alex','sous-peter','sous-queenie','sous-shaggy','restaurateur-wolfgang-duck']){const r=await host.request.get('/art/critter-kitchen/portrait/'+id+'.webp');expect(r.ok()).toBe(true);}
 await phones[0].screenshot({path:'data/qa-critter-kitchen/promo-final.png'});test.info().annotations.push({type:'Rudy UI observed',description:String(sawGift)});
 }finally{if(code){await host.goto('/games/critter-kitchen').catch(()=>{});host.on('dialog',d=>d.accept());await host.locator(`[data-close-game-room="${code}"]`).click({timeout:2000}).catch(()=>{});}await Promise.all(contexts.map(c=>c.close()));}
});

// Deterministic server fixture: exercise rare cards with real authenticated browser actions.
test('Critter Kitchen additional portraits: Cosmo privacy, Rudy gifts and À La Cart card inspection',async({browser})=>{
 const {startServer}=await import('../../src/server/index.js'),engine=await import('../../src/games/critter-kitchen/engine.js'),{validateCKState}=await import('../../src/games/critter-kitchen/validation.js'),{mkdtemp,rm}=await import('node:fs/promises'),{tmpdir}=await import('node:os'),{join}=await import('node:path');
 const dir=await mkdtemp(join(tmpdir(),'ck-promo-ui-')),app=await startServer(0,'127.0.0.1',true,seeded(15),{storePath:join(dir,'rooms.sqlite')}),url=`http://localhost:${(app.server.address() as any).port}`,contexts=[];
 try{
 const hc=await browser.newContext({viewport:{width:1280,height:900}});contexts.push(hc);const host=await hc.newPage();await capture(host);await host.goto(url+'/games/critter-kitchen');await testAccount(host,app);await host.getByRole('button',{name:'สร้างห้องบนจอกลาง'}).click();const code=await host.locator('.room-code strong').innerText(),phones:Page[]=[];
 for(let i=0;i<2;i++){const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});contexts.push(c);const p=await c.newPage();phones.push(p);await capture(p);await p.goto(url+'/play/'+code);await p.getByRole('textbox',{name:'ชื่อของคุณ'}).fill('ครัวภาพ '+i);await p.getByRole('button',{name:'เข้าห้อง',exact:true}).click();await p.getByRole('button',{name:'พร้อมเล่น',exact:true}).click();}
 const room=app.rooms.rooms.get(code)!,s=engine.createInitialState(room.players,seeded(3),{expansions:{luckyDuck:true,rudy:true}}),ids=room.players.map(p=>p.id);
 delete s.challengeReveal;const remove=(id:string)=>{if(s.academySous===id)s.academySous=null;else s.zousDeck.splice(s.zousDeck.indexOf(id),1);};for(const id of ['rudy','cosmo','ming'])remove(id);s.players[0].activeSous='rudy';s.players[1].activeSous='cosmo';s.players[1].cosmoSous='ming';s.players[0].restaurateur='wolfgang-duck';s.unusedRestaurateurs.splice(s.unusedRestaurateurs.indexOf('wolfgang-duck'),1);
 for(const id of s.locations.garden.splice(0))s.bag.push(id);for(const id of ['i-carrot-0','i-carrot-1','i-carrot-2']){for(const pool of [s.bag,...Object.values(s.locations)]){const n=pool.indexOf(id);if(n>=0)pool.splice(n,1);}s.locations.garden.push(id);}
 if(!validateCKState(s))throw Error('Invalid deterministic Promo UI fixture');room.ck=s;room.ckExpansions={luckyDuck:true,rudy:true};room.revision++;
 for(const p of [host,...phones]){await p.evaluate(()=>(window as any).__ckSocket.send(JSON.stringify({type:'sync'})));await expect.poll(async()=>(await read(p)).revision).toBe(room.revision);}
 expect((await read(host)).players[1].activeSous).toBe('cosmo');expect((await read(phones[0])).me!.cosmoSous).toBeUndefined();expect((await read(phones[1])).me!.cosmoSous).toBe('ming');
 await phones[1].locator('[data-chef="cosmo"]').click();await expect(phones[1].locator('.ck-cosmo-private-detail')).toContainText('Ming');await expect(phones[1].locator('.ck-chef-description>span')).toContainText('เชฟลับ');await expect.poll(()=>phones[1].locator('.ck-chef-detail img').evaluate((im:HTMLImageElement)=>im.complete&&im.naturalWidth/im.naturalHeight===.75)).toBe(true);await phones[1].screenshot({path:'data/qa-critter-kitchen/promo-cosmo-private.png'});await phones[1].locator('.ck-close').click();
 const send=async(p:Page,action:CKAction)=>{const revision=(await read(p)).revision;await p.evaluate(({action,revision})=>(window as any).__ckSocket.send(JSON.stringify({type:'command',id:crypto.randomUUID(),revision,action})),{action,revision});await expect.poll(async()=>(await read(host)).revision).toBe(revision+1);};
 await send(phones[0],{type:'ck-plan',epoch:(await read(phones[0])).me!.epoch,plan:{mouse:'soup',lizard:'desert',boar:'academy',rudy:'garden'}});await expect.poll(async()=>(await read(phones[1])).revision).toBe(room.revision);await send(phones[1],{type:'ck-plan',epoch:(await read(phones[1])).me!.epoch,plan:{mouse:'soup',lizard:'desert',boar:'academy',cosmo:'midnight'}});await send(host,{type:'ck-run'});
 for(let n=0;n<30;n++){const h=await read(host);if(h.decision?.kind==='rudy-gift')break;const actor=phones[ids.indexOf(h.turn!)];await expect.poll(async()=>(await read(actor)).revision).toBe(h.revision);const v=await read(actor),pick=v.me!.legal.find(a=>a.type==='ck-pick'&&a.item==='i-carrot-0')??v.me!.legal.find(a=>a.type==='ck-pick')??v.me!.legal[0];await send(actor,pick);}
 await expect(phones[0].locator('.ck-rudy-gift')).toBeVisible();await expect(phones[0].locator('[data-rudy-recipient]')).toHaveCount(2);await expect.poll(()=>phones[0].locator('.ck-rudy-gift img').evaluateAll((imgs:HTMLImageElement[])=>imgs.every(im=>im.complete&&im.naturalWidth>0))).toBe(true);expect(await phones[0].evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);await expect(phones[0].locator('.ck-market-departure')).toHaveCount(0);await phones[0].screenshot({path:'data/qa-critter-kitchen/promo-rudy-gift.png'});const before=(await read(host)).revision;await phones[0].locator(`[data-rudy-recipient="${ids[1]}"]`).click();await expect.poll(async()=>(await read(host)).revision).toBe(before+1);expect((await read(host)).players[0].stars).toBe(1);expect((await read(phones[1])).me!.storage).toContain('i-carrot-0');expect(validateCKState(room.ck)).toBe(true);
 // Fresh, conserved fixtures for each independently selectable pair.
 for(const pair of [
  {ids:['alex','peter'],names:['Alex','Peter'],texts:['ขนมปัง','เครื่องเทศ'],options:{aLaCartChefs:true}},
  {ids:['queenie','shaggy'],names:['Queenie','Shaggy'],texts:['ตัวแรก','โทเคนข่าวลือ'],options:{aLaCartMoreChefs:true}}
 ]){
 const extra=engine.createInitialState(room.players,seeded(84),{expansions:pair.options});
 for(const [index,id]of pair.ids.entries()){if(extra.academySous===id)extra.academySous=null;else extra.zousDeck.splice(extra.zousDeck.indexOf(id),1);extra.players[index].activeSous=id;}
 expect(validateCKState(extra)).toBe(true);room.ck=extra;room.ckExpansions={luckyDuck:false,rudy:false,...pair.options};room.revision++;
 for(const p of [host,...phones]){await p.evaluate(()=>(window as any).__ckSocket.send(JSON.stringify({type:'sync'})));await expect.poll(async()=>(await read(p)).revision).toBe(room.revision);}
 for(const [index,id]of pair.ids.entries()){
  const phone=phones[index];await phone.locator(`[data-chef="${id}"]`).click();await expect(phone.locator('.ck-chef-detail h2')).toHaveText(pair.names[index]);await expect(phone.locator('.ck-chef-description')).toContainText(pair.texts[index]);
  await expect.poll(()=>phone.locator('.ck-chef-detail img').evaluate((im:HTMLImageElement)=>im.complete&&im.naturalWidth/im.naturalHeight===.75)).toBe(true);expect(await phone.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await phone.screenshot({path:`data/qa-critter-kitchen/alacart-${id}-detail.png`});await phone.locator('.ck-close').click();
 }
 if(pair.ids[1]==='shaggy'){
  const move=(id:string,loc:string)=>{for(const pool of [extra.bag,...Object.values(extra.locations)]){const i=pool.indexOf(id);if(i>=0)pool.splice(i,1);}extra.locations[loc].push(id);};
  for(const id of extra.locations.desert.splice(0))extra.bag.push(id);
  for(const id of ['i-meat-0','i-carrot-0','i-fish-0','i-bread-0'])move(id,'desert');
  for(let i=0;i<2;i++){const id=`r-${i}-0`;move(id,'midnight');extra.locations.midnight.splice(extra.locations.midnight.indexOf(id),1);extra.players[1].known[i]=id;}
  expect(validateCKState(extra)).toBe(true);room.revision++;
  for(const p of [host,...phones]){await p.evaluate(()=>(window as any).__ckSocket.send(JSON.stringify({type:'sync'})));await expect.poll(async()=>(await read(p)).revision).toBe(room.revision);}
  await send(phones[0],{type:'ck-plan',epoch:(await read(phones[0])).me!.epoch,plan:{mouse:'soup',lizard:'midnight',boar:'academy',queenie:'garden'}});
  await expect.poll(async()=>(await read(phones[1])).revision).toBe(room.revision);
  await send(phones[1],{type:'ck-plan',epoch:(await read(phones[1])).me!.epoch,plan:{mouse:'soup',lizard:'midnight',boar:'academy',shaggy:'desert'}});await send(host,{type:'ck-run'});
  for(let i=0;i<40;i++){
   const h=await read(host);if(room.ck!.pending?.kind==='pick'&&room.ck!.pending.extra&&h.decision?.chef==='shaggy')break;
   const actor=phones[ids.indexOf(h.turn!)];await expect.poll(async()=>(await read(actor)).revision).toBe(h.revision);const v=await read(actor);await send(actor,v.me!.legal.find(a=>a.type==='ck-pick')??v.me!.legal[0]);
  }
  expect(room.ck!.pending?.kind==='pick'&&room.ck!.pending.extra).toBe(true);expect((await read(host)).decision?.chef).toBe('shaggy');
  await expect.poll(async()=>(await read(phones[1])).revision).toBe(room.revision);
  for(let i=0;i<2;i++){
   const revision=room.revision;await phones[1].locator('[data-buy]').first().click();await expect(phones[1].locator('#ck-choice-confirm')).toBeVisible();await phones[1].locator('#ck-choice-confirm').click();await expect.poll(async()=>(await read(host)).revision).toBe(revision+1);await expect.poll(async()=>(await read(phones[1])).revision).toBe(revision+1);
  }
  expect(room.ck!.visits.find(v=>v.chef==='shaggy')!.gained).toBe(4);expect(validateCKState(room.ck)).toBe(true);
  await phones[1].screenshot({path:'data/qa-critter-kitchen/alacart-shaggy-bonus.png'});
 }
 }
 }finally{await Promise.all(contexts.map(c=>c.close()));await app.close();await rm(dir,{recursive:true,force:true});}
});
