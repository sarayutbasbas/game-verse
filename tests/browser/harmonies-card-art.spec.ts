import {test,expect} from '@playwright/test';
import {mkdtemp,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startServer} from '../../src/server/index.js';
import {ANIMAL} from '../../src/games/harmonies/data.js';
import {cardRailTerrain} from '../../src/client/harmonies-paper.js';
import {validateHarmoniesState} from '../../src/games/harmonies/validation.js';
import {testAccount} from './auth-fixture.js';
import {cardFace,setHarmoniesCardArt,illustratedHabitat} from '../../src/client/harmonies-presentation.js';

const batch=['animal-01','animal-02','animal-03','animal-04','animal-05'];
const previewBatch=Object.keys(ANIMAL);

test('paper v6 all54 cards shows the exact live rules overlay at market, owned rail and popup sizes',async({browser})=>{
 const dir=await mkdtemp(join(tmpdir(),'hm-card-v5-')),app=await startServer(0,'127.0.0.1',true,()=>.099,{storePath:join(dir,'db.sqlite')}),origin=`http://localhost:${(app.server.address() as any).port}`,context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2}),friendContext=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2}),page=await context.newPage(),friend=await friendContext.newPage();page.setDefaultTimeout(8000);friend.setDefaultTimeout(8000);
 try{
  await mkdir('data/qa-harmonies-paper-v6/screens',{recursive:true});await page.goto(origin+'/games/harmonies');await testAccount(page,app);await page.locator('#create').click();await expect(page.locator('#qr')).toBeVisible();
  const code=page.url().split('/').pop()!;await friend.goto(origin+'/play/'+code);await friend.getByRole('textbox',{name:'ชื่อของคุณ'}).fill('เพื่อน');await friend.getByRole('button',{name:'เข้าห้อง',exact:true}).click();await friend.getByRole('button',{name:'พร้อมเล่น',exact:true}).click();
  await expect(page.locator('[name="hm-card-art"][value="illustrated"]')).toBeChecked();await page.locator('#hm-solo').uncheck();await page.locator('#start').click();
  const room=app.rooms.rooms.get(code)!,state=room.harmonies!;
  const pool=[...state.market,...state.deck].filter(id=>!batch.includes(id));state.market=[...batch];state.deck=pool;room.revision++;expect(validateHarmoniesState(state)).toBeTruthy();app.store.saveRooms(app.rooms.exportRooms());
  await page.reload();await expect(page.locator('.hm-root')).toBeVisible();
  const cards=page.locator('.hm-market [data-market-card]');await expect(cards).toHaveCount(5);
  for(const [index,id] of batch.entries()){
   const card=page.locator(`.hm-market [data-market-card="${id}"]`);await expect(card).toHaveAttribute('data-market-card',id);await expect(card.locator('.hm-card-v6>img')).toHaveAttribute('src',new RegExp(`${ANIMAL[id].expansion==='pulse'?'pulse-v1':id.startsWith('animal')?'paper-v6':'special-paper-v1'}/${id}-(?:small|lite)\\.webp`));
   const stacks=card.locator('.hm-pattern-stack');await expect(stacks).toHaveCount(ANIMAL[id].pattern.length);
   for(const pattern of ANIMAL[id].pattern){const stack=card.locator(`.hm-pattern-stack[data-q="${pattern.q}"][data-r="${pattern.r}"]`);await expect(stack).toHaveAttribute('data-stack-height',String(pattern.stack[0]==='building'&&!(ANIMAL[id].kind==='whisper'&&pattern.stack.length===1)?2:pattern.stack.length));await expect(stack).toHaveAttribute('data-cube-cell',String(pattern.cube));}
   await expect(card.locator('.hm-paper-points>span')).toHaveCount(ANIMAL[id].points.length);
   const claimBox=await card.locator('[data-claim]').boundingBox();
   if(claimBox)for(const score of await card.locator('.hm-paper-points>span').all()){const scoreBox=await score.boundingBox(),separate=!scoreBox||scoreBox.x+scoreBox.width<=claimBox.x||claimBox.x+claimBox.width<=scoreBox.x||scoreBox.y+scoreBox.height<=claimBox.y||claimBox.y+claimBox.height<=scoreBox.y;expect(separate,`${id}: ${JSON.stringify({scoreBox,claimBox})}`).toBeTruthy();}
  }
  await page.screenshot({path:'data/qa-harmonies-paper-v6/screens/market-small-390.png',fullPage:true});
  for(const id of batch)await page.locator(`[data-market-card="${id}"]`).screenshot({path:`data/qa-harmonies-paper-v6/screens/small-${id}.png`});
  await page.setViewportSize({width:1024,height:768});await page.screenshot({path:'data/qa-harmonies-paper-v6/screens/market-tablet-1024.png',fullPage:true});
  for(const id of batch){await page.locator(`[data-market-card="${id}"] [data-detail="${id}"]`).click();const dialog=page.locator('.hm-detail');await expect(dialog).toBeVisible();await expect(dialog.locator('.hm-card-v6>img')).toHaveAttribute('src',new RegExp(`${ANIMAL[id].expansion==='pulse'?'pulse-v1':id.startsWith('animal')?'paper-v6':'special-paper-v1'}/${id}\\.webp`));await expect(dialog.locator('.hm-pattern-stack')).toHaveCount(ANIMAL[id].pattern.length);await expect(dialog.locator('.hm-paper-points>span')).toHaveCount(ANIMAL[id].points.length);for(const label of await dialog.locator('.hm-pattern-height').all())await expect(label).toBeHidden();await dialog.screenshot({path:`data/qa-harmonies-paper-v6/screens/popup-${id}.png`});await dialog.locator('.hm-close').click();}
  const owned=batch.slice(0,4);state.market=[batch[4],...pool.splice(0,4)];state.deck=pool;state.players[0].cards=owned.map(card=>({card,placed:0}));state.cubeReserve-=owned.reduce((sum,id)=>sum+ANIMAL[id].points.length,0);room.revision++;expect(validateHarmoniesState(state)).toBeTruthy();app.store.saveRooms(app.rooms.exportRooms());
  await page.setViewportSize({width:390,height:844});await page.reload();await expect(page.locator('.hm-owned-cards [data-ui-key^="owned-"]')).toHaveCount(4);await page.screenshot({path:'data/qa-harmonies-paper-v6/screens/owned-small-390.png',fullPage:true});
  for(const card of await page.locator('.hm-card-v6').all()){const box=await card.boundingBox();expect(box?.width).toBeGreaterThan(0);expect(await card.evaluate(el=>getComputedStyle(el).borderRadius)).not.toBe('0px');}
  setHarmoniesCardArt('illustrated');
  const smallCards=previewBatch.map(id=>`<article class="hm-animal" data-qa-small="${id}"><div class="hm-inspect">${cardFace(id,cardRailTerrain(id)==='field'&&!ANIMAL[id].kind?1:0,false,false,false)}</div></article>`).join('');
  const popupCard=(id:string)=>`<article class="qa-popup hm-detail" data-qa-popup="${id}"><h2>${ANIMAL[id].name}</h2><div class="hm-large-card"><div class="hm-detail-face">${cardFace(id,0,true,false,false)}</div></div></article>`;
  await page.setViewportSize({width:1600,height:1100});
  await page.evaluate(({smallCards,popupMarkup})=>{document.body.className='harmonies-theme';document.body.innerHTML=`<main><section id="qa-small" class="hm-root qa-grid">${smallCards}</section><section id="qa-popup" class="hm-root qa-popup-grid">${popupMarkup}</section></main><style>body{overflow:auto!important}.qa-grid{height:auto!important;max-height:none!important;overflow:visible!important;--hm-card-height:240px;display:grid!important;grid-template-columns:repeat(4,180px);gap:16px;width:max-content;padding:18px;background:#1c302c}.qa-grid .hm-animal{display:block!important;width:180px!important;height:240px!important;min-width:180px!important}.qa-grid .hm-inspect{display:block!important;width:180px!important;height:240px!important;min-height:240px!important;aspect-ratio:3/4!important;overflow:hidden}.qa-popup-grid{height:auto!important;max-height:none!important;overflow:visible!important;display:block!important;width:max-content;padding:18px;background:#1c302c}.qa-popup{box-sizing:content-box!important;width:270px!important;max-width:none!important;padding:8px!important;background:#fff4d7;border:0;border-radius:12px}.qa-popup h2{height:30px;margin:0 0 6px;font-size:14px;color:#174f4d}.qa-popup .hm-large-card{width:270px!important;height:360px!important;aspect-ratio:3/4!important}.qa-popup .hm-detail-face{position:absolute;inset:0;border-radius:inherit;overflow:hidden;box-sizing:border-box}</style>`;}, {smallCards,popupMarkup:popupCard(previewBatch[0])});
  await page.locator('#qa-small img').evaluateAll(images=>Promise.all(images.map(image=>(image as HTMLImageElement).decode().catch(()=>undefined))));
  for(const id of previewBatch){
   await page.locator('#qa-popup').evaluate((root,markup)=>{root.innerHTML=markup;},popupCard(id));
   await page.locator('#qa-popup img').evaluateAll(images=>Promise.all(images.map(image=>(image as HTMLImageElement).decode().catch(()=>undefined))));
   const small=page.locator(`[data-qa-small="${id}"]`),popup=page.locator(`[data-qa-popup="${id}"]`),expectedTheme=id==='spirit-11'?'dinosaur':ANIMAL[id].kind==='spirit'?'spirit':ANIMAL[id].kind==='whisper'?'whisper':'normal';
   await expect(small.locator('.hm-card-v6>img')).toHaveAttribute('src',new RegExp(`${ANIMAL[id].expansion==='pulse'?'pulse-v1':id.startsWith('animal')?'paper-v6':'special-paper-v1'}/${id}-small\\.webp`));
   await expect(small.locator('.hm-card-v6>img')).toHaveJSProperty('naturalWidth',300);
   await expect(popup.locator('.hm-card-v6>img')).toHaveJSProperty('naturalWidth',900);
   await expect(small.locator('.hm-side-rail')).toHaveAttribute('src',expectedTheme==='spirit'?'/art/harmonies/rails-v6/spirit-rainbow.svg':`/art/harmonies/rails-v6/${cardRailTerrain(id)}-small.png`);
   await expect(small.locator('.hm-paper-points')).toHaveAttribute('data-card-theme',expectedTheme);if(cardRailTerrain(id)==='field'&&expectedTheme==='normal')await expect(small.locator('.hm-paper-score-row.earned .hm-paper-score-number')).toHaveCSS('fill','rgb(255, 255, 255)');await expect(small.locator('.hm-category-badge')).toHaveCount(expectedTheme==='normal'?0:1);await expect(popup.locator('.hm-habitat-model')).toHaveCount(1);if(expectedTheme==='dinosaur'){for(const face of [small,popup])expect(await face.locator('.hm-paper-spirit-panel .hm-scenario-frame').evaluate(e=>getComputedStyle(e).fill)).toBe('rgb(189, 80, 28)');}
   await expect(small.locator('.hm-pattern-stack')).toHaveCount(ANIMAL[id].pattern.length);
   for(const pattern of ANIMAL[id].pattern){const stack=small.locator(`.hm-pattern-stack[data-q="${pattern.q}"][data-r="${pattern.r}"]`);await expect(stack).toHaveAttribute('data-stack-height',String(pattern.stack[0]==='building'&&!(ANIMAL[id].kind==='whisper'&&pattern.stack.length===1)?2:pattern.stack.length));await expect(stack).toHaveAttribute('data-cube-cell',String(pattern.cube));}
   for(const wrapper of [small.locator('.hm-inspect'),popup.locator('.hm-detail-face')]){
    const clip=await wrapper.evaluate(el=>{const s=getComputedStyle(el);return {overflow:s.overflow,radii:[s.borderTopLeftRadius,s.borderTopRightRadius,s.borderBottomLeftRadius,s.borderBottomRightRadius]};});
    expect(clip.overflow).toBe('hidden');expect(clip.radii.every(r=>parseFloat(r)>0)).toBeTruthy();
   }
   for(const face of [small.locator('.hm-inspect'),popup.locator('.hm-detail-face')]){
    const frame=await face.boundingBox();
    for(const score of await face.locator('.hm-paper-points>span').all()){
     const box=await score.boundingBox();expect(box!.height).toBeGreaterThan(0);expect(box!.y).toBeGreaterThanOrEqual(frame!.y-.5);expect(box!.y+box!.height).toBeLessThanOrEqual(frame!.y+frame!.height+.5);
    }
   }
   const smallRows=await small.locator('.hm-paper-points>span').all(),popupRows=await popup.locator('.hm-paper-points>span').all();
   for(let n=1;n<smallRows.length;n++){
    const lower=await smallRows[n-1].boundingBox(),upper=await smallRows[n].boundingBox();expect(upper!.y+upper!.height).toBeLessThanOrEqual(lower!.y+.5);
    const above=await popupRows[n-1].boundingBox(),below=await popupRows[n].boundingBox();expect(below!.y+below!.height).toBeLessThanOrEqual(above!.y+.5);
   }
   if(batch.includes(id)){
    await popup.locator('.hm-printed-habitat').evaluate((el,html)=>{el.outerHTML=html;},illustratedHabitat(id,true,true));
    await popup.locator('.hm-detail-face').evaluate(el=>{const safe=document.createElement('div');safe.className='qa-safe';safe.style.cssText='position:absolute;inset:4% 13.0556% 6% 2%;border:1px dashed cyan;pointer-events:none;z-index:9';el.append(safe);});
    await popup.screenshot({path:`data/qa-harmonies-paper-v6/screens/debug-${id}.png`});
    await popup.locator('.qa-safe').evaluate(el=>el.remove());
    await popup.locator('.hm-printed-habitat').evaluate((el,html)=>{el.outerHTML=html;},illustratedHabitat(id,true,false));
    await popup.locator('img').evaluateAll(images=>Promise.all(images.map(image=>(image as HTMLImageElement).decode().catch(()=>undefined))));
   }
   await small.screenshot({path:`data/qa-harmonies-paper-v6/screens/small-${id}.png`});
   await popup.screenshot({path:`data/qa-harmonies-paper-v6/screens/popup-${id}.png`});
  }
 }finally{await friendContext.close();await context.close();await app.close();await rm(dir,{recursive:true,force:true});}
});

for(const art of ['illustrated','sculpted'] as const)test(`${art} popup preserves joined hexes and places the animal model on the destination token`,async({browser})=>{
 const dir=await mkdtemp(join(tmpdir(),'hm-popup-modes-')),app=await startServer(0,'127.0.0.1',true,()=>.42,{storePath:join(dir,'db.sqlite')}),origin=`http://localhost:${(app.server.address() as any).port}`,context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
 try{
  await page.goto(origin+'/games/harmonies');await testAccount(page,app);await page.locator('#create').click();await page.locator('#hm-card-art-'+art).check();await page.locator('#hm-solo').check();await page.locator('#start').click();
  const small=page.locator('.hm-market .hm-inspect').first();
  await expect(small.locator('.hm-printed-habitat')).toBeVisible();
  expect(await small.locator('.hm-joined-hex').count()).toBe(await small.locator('.hm-pattern-stack').count());
  await small.click();await expect(page.locator('.hm-detail-model-preview')).toHaveCount(0);await expect(page.locator('.hm-detail .hm-habitat-model')).toHaveCount(1);
  const popup=page.locator('.hm-detail');expect(await popup.locator('.hm-habitat-model').evaluate(e=>getComputedStyle(e).filter)).toContain('rgb(255, 255, 255)');await popup.locator('img').evaluateAll(images=>Promise.all(images.map(img=>(img as HTMLImageElement).decode())));
  await expect(popup.locator('.hm-printed-habitat')).toBeVisible();
  expect(await popup.locator('.hm-joined-hex').count()).toBe(await popup.locator('.hm-pattern-stack').count());
  await expect(popup.locator('.hm-habitat-plane,.hm-pattern-base')).toHaveCount(0);
  expect(await popup.locator('.hm-animal-art').evaluate(e=>getComputedStyle(e,'::after').backgroundImage)).toContain('linear-gradient');
  await popup.locator('.hm-close').click();await page.locator('[data-group]').first().click();
  const centered=await page.locator('.hm-choice-tokens .hm-disk').evaluateAll(disks=>disks.every(d=>{const r=d.getBoundingClientRect(),i=d.querySelector('img')!.getBoundingClientRect();return Math.abs(r.x+r.width/2-i.x-i.width/2)<1&&Math.abs(r.y+r.height/2-i.y-i.height/2)<1}));expect(centered).toBe(true);
 }finally{await context.close();await app.close();await rm(dir,{recursive:true,force:true});}
});
