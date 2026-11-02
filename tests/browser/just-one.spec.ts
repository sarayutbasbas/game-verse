import {test,expect,type Page,type BrowserContext} from '@playwright/test';
import {mkdtemp,rm,mkdir} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {startServer} from '../../src/server/index.js';import {testAccount} from './auth-fixture.js';
const read=(p:Page):Promise<any>=>p.evaluate(()=>(window as any).__joView);
async function capture(p:Page){await p.addInitScript(()=>{window.WebSocket=new Proxy(window.WebSocket,{construct(T,args){const ws=new T(args[0],args[1]);ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.type==='state')(window as any).__joView=m.view;});return ws;}});});}
test('Just One: creator plays on phone, independent shared displays, private clues, review, reconnect, complete game and rematch',async({browser})=>{
 test.setTimeout(180000);const live=process.env.JO_LIVE==='1',dir=await mkdtemp(join(tmpdir(),'just-one-browser-'));let seed=907;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};const app=live?undefined:await startServer(0,'127.0.0.1',true,random,{storePath:join(dir,'rooms.sqlite')}),origin=live?'http://localhost:5555':'http://localhost:'+(app!.server.address() as any).port;
 const contexts:BrowserContext[]=[],errors:string[]=[];let owner:Page|undefined,code='';
 const make=async(phone=false,context?:BrowserContext)=>{const c=context??await browser.newContext({viewport:phone?{width:390,height:844}:{width:1440,height:900},reducedMotion:'reduce'});if(!contexts.includes(c))contexts.push(c);const p=await c.newPage();p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));await capture(p);return p;};
 try{
 await mkdir('data/qa-just-one',{recursive:true});owner=await make(true);await owner.goto(origin+'/games/just-one');await expect(owner.locator('.entry-box')).toHaveAttribute('src','/art/just-one/cover.webp');await owner.locator('[data-card-reference]').click();await expect(owner.locator('.reference-count')).toContainText('100 แบบ');await owner.locator('.reference-card').first().click();await expect(owner.locator('.reference-detail-copy p')).toHaveCount(6);await owner.keyboard.press('Escape');await testAccount(owner,app);await owner.locator('#create').click();await expect(owner).toHaveURL(/\/play\//);code=owner.url().split('/').pop()!;await expect(owner.locator('.platform-lobby')).toBeVisible();
 const phones=[owner];for(let i=1;i<3;i++){const p=await make(true);phones.push(p);await p.goto(origin+'/play/'+code);await p.locator('#join-name').fill('เพื่อน '+i);await p.getByRole('button',{name:'เข้าห้อง',exact:true}).click();await p.locator('#lobby-ready').click();}
 const display=await make(false,owner.context()),publicDisplay=await make();await display.setViewportSize({width:1440,height:900});await display.goto(origin+'/display/'+code);await publicDisplay.goto(origin+'/display/'+code);await expect(publicDisplay.locator('#start')).toHaveCount(0);await expect(owner.locator('#start')).toBeEnabled();await owner.locator('#start').click();await expect(display.locator('.jo-root')).toBeVisible();await expect(publicDisplay.locator('.jo-root')).toBeVisible();await expect.poll(async()=>!!(await read(phones[2])).me).toBe(true);
 let actions=0,replaced=false,reconnected=false,checkedDraft=false,sawJudge=false,sawWrong=false,sawCancelled=false;
 while((await read(display)).phase!=='finished'){
  const v=await read(display);await expect.poll(async()=>(await Promise.all(phones.map(read))).every(x=>x?.revision===v.revision)).toBe(true);const views=await Promise.all(phones.map(read)),revision=v.revision;let actor:Page|undefined;
  const phone=(type:string)=>phones[views.findIndex(x=>x.me?.legal.includes(type))];
  if(v.phase==='choose'){actor=phone('jo-number');await actor.locator('[data-jo-number="1"]').click();}
  else if(v.phase==='writing'){
   actor=phone('jo-clues');
   if(!replaced){const old=(await read(actor)).me.word;await actor.locator('#jo-clue-0').fill('ร่างก่อนเปลี่ยนคำ');await actor.locator('[data-jo-replace]').click();await expect.poll(async()=>(await read(display)).phase).toBe('choose');const now=await Promise.all(phones.map(read)),picker=phones[now.findIndex(x=>x.me?.legal.includes('jo-number'))];await picker.locator('[data-jo-number="1"]').click();await expect.poll(async()=>(await read(display)).phase).toBe('writing');await expect(actor.locator('#jo-clue-0')).toHaveValue('');expect((await read(actor)).me.word).not.toBe(old);expect((await read(display)).round).toBe(v.round);expect((await read(display)).score).toBe(0);expect(JSON.stringify(await read(publicDisplay))).not.toContain(old);replaced=true;continue;}
const others=views.filter(x=>x.me?.word);expect(others.length).toBe(2);const target=others[0].me.word;
   for(const p of[display,publicDisplay,phones[views.findIndex(x=>x.me.id===v.turn)]]){expect((await read(p)).me?.word).toBeUndefined();expect((await read(p)).hints).toEqual([]);expect(await p.locator('.jo-secret').count()).toBe(0);expect(JSON.stringify(await read(p))).not.toContain(target);}
   const index=phones.indexOf(actor),words=[v.round===1?'แนวคิด':`ใบ้${index}ก`,v.round===1?['จินตนาการ','ความทรงจำ','การเดินทาง'][index]:`ใบ้${index}ข`];
   if(!checkedDraft){const second=phones[views.findIndex((x,i)=>phones[i]!==actor&&x.me?.legal.includes('jo-clues'))];await second.locator('#jo-clue-0').fill('ร่างที่ยังไม่ส่ง');checkedDraft=true;}
   await actor.locator('#jo-clue-0').fill(words[0]);await actor.locator('#jo-clue-1').fill(words[1]);await actor.locator('#jo-clue-form button[type="submit"]').click();
   if(!reconnected){await expect.poll(async()=>{const own=await read(actor!);return own.players.find((p:any)=>p.id===own.me.id).submitted;}).toBe(true);const before=(await read(actor)).me;await actor.reload();await expect(actor.locator('.jo-root')).toBeVisible();await expect.poll(async()=>(await read(actor!)).me).toEqual(before);reconnected=true;}
  }else if(v.phase==='review'){
   expect(v.hints).toEqual([]);expect((await read(publicDisplay)).me).toBeUndefined();actor=phone('jo-review');if(v.round===1){await expect(actor.locator('.jo-cancelled')).toHaveCount(2);sawCancelled=true;}await actor.locator('[data-jo-review]').click();
  }else if(v.phase==='guess'){
   actor=phone('jo-guess');if(v.round===1){await display.screenshot({path:'data/qa-just-one/display-hints.png'});await actor.screenshot({path:'data/qa-just-one/phone-guess.png'});}
   const target=views.find(x=>x.me?.word).me.word;await actor.locator('#jo-guess').fill(v.round===2?'คำตอบที่ผิดแน่นอน':v.round===3?'ออกเสียงเหมือนที่ตกลงกัน':target);await actor.locator('#jo-guess-form button').click();
  }else if(v.phase==='judge'){
   sawJudge=true;const index=views.findIndex(x=>x.me?.legal.includes('jo-vote')&&x.me.vote===undefined);actor=phones[index];await actor.locator(`[data-jo-vote="${v.round!==2}"]`).click();
  }else if(v.phase==='result'){
   if(v.result.outcome==='wrong'){sawWrong=true;expect(v.result.spent).toBe(2);}actor=display;await actor.locator('[data-jo-next]').click();
  }else throw Error('Unexpected phase '+v.phase);
  await expect.poll(async()=>(await read(display)).revision).toBeGreaterThan(revision);expect(++actions).toBeLessThan(160);
  if(actions%12===0)expect(await actor!.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 const final=await read(display);expect(final.score).toBe(11);expect(final.remaining).toBe(0);expect(sawJudge&&sawWrong&&sawCancelled&&reconnected&&replaced).toBe(true);await display.screenshot({path:'data/qa-just-one/display-final.png'});await phones[1].screenshot({path:'data/qa-just-one/phone-final.png'});
 await display.locator('.shared-room-menu summary').click();await display.getByRole('button',{name:'เริ่มเกมใหม่',exact:true}).click();await display.locator('[data-confirm-restart]').click();await expect.poll(async()=>(await read(display)).phase).toBe('choose');expect((await read(display)).score).toBe(0);expect((await read(display)).players.map((p:any)=>p.id)).toEqual(final.players.map((p:any)=>p.id));expect(errors).toEqual([]);
 }finally{if(owner&&code)await owner.request.post(origin+'/api/rooms/leave',{headers:{Origin:origin},data:{code,close:true}});for(const c of contexts)await c.close();await app?.close();await rm(dir,{recursive:true,force:true});}
});
