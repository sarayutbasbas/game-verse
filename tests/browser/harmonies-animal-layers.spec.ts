import {test,expect,type Page,type Locator} from '@playwright/test';
import sharp from 'sharp';
import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {startServer} from '../../src/server/index.js';import {testAccount} from './auth-fixture.js';
import {denseLandscape} from '../harmonies-fixtures.js';
import {animalFigure,setHarmoniesCardArt} from '../../src/client/harmonies-presentation.js';
/** Compare opaque model pixels against the same frame with terrain hidden.
 * DOM visibility alone cannot detect a CSS 3D plane cutting through a model. */
async function visibleModelFraction(page:Page,model:Locator,card:string){
 const r=(await model.locator('img').boundingBox())!,clip={x:Math.floor(r.x),y:Math.floor(r.y),width:Math.ceil(r.width)+1,height:Math.ceil(r.height)+1};
 // Use actual opaque source pixels. Contrast percentiles include too much of a
 // 3D sprite's translucent halo once its board footprint is reduced.
 const alpha=await model.locator('img').evaluate((image:HTMLImageElement,clip)=>{const r=image.getBoundingClientRect(),canvas=document.createElement('canvas');canvas.width=clip.width;canvas.height=clip.height;const ctx=canvas.getContext('2d')!,scale=Math.min(r.width/image.naturalWidth,r.height/image.naturalHeight),w=image.naturalWidth*scale,h=image.naturalHeight*scale;ctx.drawImage(image,r.x-clip.x+(r.width-w)/2,r.y-clip.y+r.height-h,w,h);const pixels=ctx.getImageData(0,0,clip.width,clip.height).data;return Array.from({length:pixels.length/4},(_,i)=>pixels[i*4+3]);},clip);
 const rendered=await page.screenshot({clip});
 const covered=page.locator(`.chosen-board .hm-board :is(.hm-token-art,.hm-cell-hit,.hm-hex-wall,.hm-animal-sprite:not([data-cube-card="${card}"]))`);
 await covered.evaluateAll(es=>es.forEach(e=>(e as HTMLElement).style.opacity='0'));
 const alone=await page.screenshot({clip});await model.locator('img').evaluate(e=>(e as HTMLElement).style.opacity='0');const background=await page.screenshot({clip});
 await model.locator('img').evaluate(e=>(e as HTMLElement).style.removeProperty('opacity'));await covered.evaluateAll(es=>es.forEach(e=>(e as HTMLElement).style.removeProperty('opacity')));
 const [a,b,c]=await Promise.all([rendered,alone,background].map(buffer=>sharp(buffer).ensureAlpha().raw().toBuffer()));let total=0,visible=0;
 for(let i=0;i<a.length;i+=4){const contrast=Math.abs(b[i]-c[i])+Math.abs(b[i+1]-c[i+1])+Math.abs(b[i+2]-c[i+2]);if(alpha[i/4]<245||contrast<100)continue;total++;if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])<90)visible++;}
 expect(total).toBeGreaterThan(12);return visible/total;
}
for(const art of ['illustrated','sculpted'] as const)test(`${art}: a three-layer animal stays in front; a shared whisper keeps equal size and overlaps side by side`,async({browser})=>{
 const dir=await mkdtemp(join(tmpdir(),'hm-model-layers-')),app=await startServer(0,'127.0.0.1',true,()=>.42,{storePath:join(dir,'db.sqlite')}),origin=`http://localhost:${(app.server.address() as any).port}`,owner=await browser.newContext({viewport:{width:390,height:844}}),guest=await browser.newContext(),page=await owner.newPage(),friend=await guest.newPage();
 try{
  await page.goto(origin+'/games/harmonies');await testAccount(page,app);await page.locator('#create').click();await expect(page.locator('#qr')).toBeVisible();const code=page.url().split('/').pop()!;
  await page.locator('#hm-card-art-'+art).check();await friend.goto(origin+'/play/'+code);await friend.getByRole('textbox',{name:'ชื่อของคุณ'}).fill('เพื่อน');await friend.getByRole('button',{name:'เข้าห้อง',exact:true}).click();await friend.getByRole('button',{name:'พร้อมเล่น',exact:true}).click();await page.locator('#start').click();await expect(page.locator('.hm-root')).toBeVisible();
  const room=app.rooms.rooms.get(code)!;room.harmonies=denseLandscape(room.players);room.harmonies.options!.cardArt=art;room.revision++;app.store.saveRooms(app.rooms.exportRooms());await page.reload();
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const board=page.locator('.chosen-board .hm-board'),originalWidth=await board.evaluate(e=>parseFloat(getComputedStyle(e).width));
  // Presentation-only overlay fixture: no fake animal placement enters game state.
  const cellId=await page.locator('.chosen-board .hm-cell:has(.hm-token[style*="--level:2"]):not(:has(.hm-animal-sprite))').first().getAttribute('data-cell');
  const stack=page.locator(`.chosen-board [data-cell="${cellId}"] .hm-stack`);setHarmoniesCardArt(art);
  await stack.evaluate((e,html)=>e.insertAdjacentHTML('beforeend',html),animalFigure('animal-20',3));
  await page.setViewportSize({width:391,height:844});
  const main=stack.locator('>.hm-normal-model'),image=main.locator('img');await image.evaluate((e:HTMLImageElement)=>e.decode());
  await expect.poll(()=>main.evaluate(e=>parseFloat((e as HTMLElement).style.getPropertyValue('--hm-figure-y')))).not.toBeNaN();
  await page.setViewportSize({width:390,height:844});await expect.poll(()=>main.evaluate(e=>parseFloat((e as HTMLElement).style.getPropertyValue('--hm-figure-y')))).not.toBeNaN();
  await expect.poll(async()=>Math.abs(await board.evaluate(e=>parseFloat(getComputedStyle(e).width))-originalWidth)).toBeLessThan(.5);
  await expect.poll(()=>image.evaluate(e=>{const img=e.getBoundingClientRect(),cap=[...e.closest('.hm-stack')!.querySelectorAll('.hm-token>img')].at(-1)!.getBoundingClientRect();return Math.hypot(img.x+img.width*.5-cap.x-cap.width*.5,img.y+img.height*.955-cap.y-cap.height*.48);})).toBeLessThan(.5);
  expect(await image.evaluate(e=>parseFloat(getComputedStyle(e).width))).toBeGreaterThanOrEqual(35);await expect(image).toHaveAttribute('src',art==='illustrated'?'/art/harmonies/figurines/storybook-v1/animal-20.webp':'/art/harmonies/figurines/animated-v5/animal-20.webp');
  if(art==='illustrated')expect(await image.evaluate(e=>getComputedStyle(e).filter)).toContain('rgb(255, 255, 255)');const size=await image.evaluate(e=>[getComputedStyle(e).width,getComputedStyle(e).height]);
  expect(await visibleModelFraction(page,main,'animal-20')).toBeGreaterThan(.9);
  await stack.evaluate((e,html)=>e.insertAdjacentHTML('beforeend',html),animalFigure('whisper-05',3));
  expect(await image.evaluate(e=>[getComputedStyle(e).width,getComputedStyle(e).height])).toEqual(size);
  const whisper=stack.locator('>.hm-whisper-model');await whisper.locator('img').evaluate((e:HTMLImageElement)=>e.decode());
  const pairError=()=>stack.evaluate(e=>{const a=e.querySelector('.hm-normal-model>img')!.getBoundingClientRect(),w=e.querySelector('.hm-whisper-model>img')!.getBoundingClientRect(),cap=[...e.querySelectorAll('.hm-token>img')].at(-1)!.getBoundingClientRect();return Math.max(Math.hypot(a.x+a.width*.5-cap.x-cap.width*.38,a.y+a.height*.955-cap.y-cap.height*.48),Math.hypot(w.x+w.width*.5-cap.x-cap.width*.62,w.y+w.height*.955-cap.y-cap.height*.48));});
  for(const [width,height]of [[320,667],[390,844],[1024,768]]){
   await page.setViewportSize({width,height});await expect.poll(pairError).toBeLessThan(.5);
   const {a,w}=await stack.evaluate(e=>({a:e.querySelector('.hm-normal-model>img')!.getBoundingClientRect().toJSON(),w:e.querySelector('.hm-whisper-model>img')!.getBoundingClientRect().toJSON()}));
   expect(Math.abs(w.width-a.width)).toBeLessThan(.1);expect(Math.abs(w.height-a.height)).toBeLessThan(.1);expect(w.x).toBeGreaterThan(a.x);expect(Math.abs(w.bottom-a.bottom)).toBeLessThan(.5);expect(w.x).toBeLessThan(a.right);
  }
  await page.setViewportSize({width:390,height:844});await expect.poll(pairError).toBeLessThan(.5);await expect.poll(async()=>Math.abs(await board.evaluate(e=>parseFloat(getComputedStyle(e).width))-originalWidth)).toBeLessThan(.5);await page.screenshot({path:`data/qa-harmonies-layout/shared-whisper-before-${art}.png`});expect(await visibleModelFraction(page,main,'animal-20')).toBeGreaterThan(.9);expect(await main.evaluate(e=>parseFloat(getComputedStyle(e).getPropertyValue('--hm-figure-front')))).toBeGreaterThan(await whisper.evaluate(e=>parseFloat(getComputedStyle(e).getPropertyValue('--hm-figure-front'))));await page.screenshot({path:`data/qa-harmonies-layout/shared-whisper-${art}.png`});
  if(art==='illustrated'){for(const id of ['spirit-01','spirit-11']){await stack.evaluate((e,html)=>e.insertAdjacentHTML('beforeend',html),animalFigure(id,3));const magic=stack.locator(`[data-cube-card="${id}"]`);expect(await magic.locator('img').evaluate(e=>getComputedStyle(e).filter)).toContain('rgb(255, 139, 196)');await magic.evaluate(e=>e.remove());}}
  // The same model at the back and front of the mat has identical dimensions.
  const emptyStacks=page.locator('.chosen-board .hm-cell .hm-stack:has(>.hm-token):not(:has(>.hm-animal-sprite))');
  for(const stack of [emptyStacks.first(),emptyStacks.last()])await stack.evaluate((e,html)=>e.insertAdjacentHTML('beforeend',html.replace('data-cube-card=', 'data-projection-check="true" data-cube-card=')),animalFigure('animal-20',3));
  await page.setViewportSize({width:391,height:844});await page.setViewportSize({width:390,height:844});
  const samples=page.locator('[data-projection-check]>img');await expect(samples).toHaveCount(2);await samples.evaluateAll(imgs=>Promise.all(imgs.map(i=>(i as HTMLImageElement).decode())));
  const near=(await samples.first().boundingBox())!,far=(await samples.last().boundingBox())!;expect(Math.abs(near.width-far.width)).toBeLessThan(.1);expect(Math.abs(near.height-far.height)).toBeLessThan(.1);
 }finally{setHarmoniesCardArt('illustrated');await owner.close();await guest.close();await app.close();await rm(dir,{recursive:true,force:true});}
});
