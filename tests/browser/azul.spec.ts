import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import {testAccount,createDisplayRoom} from "./auth-fixture.js";
import type { AzulView } from "../../src/games/azul/types.js";
async function hook(p: Page) {
  await p.addInitScript(()=>{
    (window as any).__frames=[];
    window.WebSocket=new Proxy(window.WebSocket,{construct(Target,args){
      const ws=new Target(args[0],args[1]);((window as any).__sockets??=[]).push(ws);
      ws.addEventListener("message",e=>{const m=JSON.parse(e.data);(window as any).__frames.push(m);if(m.type==="state")(window as any).__view=m.view;
        if(m.type==="ack" && (window as any).__dropAck){(window as any).__dropAck=false;e.stopImmediatePropagation();ws.close();}
      });return ws;
    }});
  });
}
const read=(p:Page):Promise<AzulView>=>p.evaluate(()=>(window as any).__view);
async function revision(p:Page,n:number){await expect(p.locator("#main")).toHaveAttribute("data-revision",String(n));}
for(const count of [2,3,4]) test(`Azul ${count} players: actual UI, ${count===2?"complete game":"round flow"}, public boards, retry and reconnect`,async({browser})=>{
  const contexts:BrowserContext[]=[],errors:string[]=[];
  const make=async(mobile=false,ownerCookies?:any[])=>{
    const c=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1366,height:1024},isMobile:mobile,hasTouch:mobile});contexts.push(c);
    if(ownerCookies)await c.addCookies(ownerCookies);
    const p=await c.newPage();p.on("pageerror",e=>errors.push(e.message));await hook(p);return p;
  };
  try {
    const display=await make();await display.goto("/games/azul");await testAccount(display);
    await createDisplayRoom(display);await expect(display.locator(".room-code strong")).toBeVisible();
    const code=await display.locator(".room-code strong").innerText(), phones:Page[]=[];
    const cookies=await display.context().cookies();
    for(let i=0;i<count;i++) {
      const p=await make(true,i===0?cookies:undefined);phones.push(p);await p.goto(`/play/${code}`);
      if(i!==0)await p.getByRole("textbox",{name:"ชื่อของคุณ"}).fill(`Azul ${i+1}`);
      await p.getByRole("button",{name:"เข้าห้อง",exact:true}).click();await expect(p.getByRole("heading",{name:"คุณเข้าห้องแล้ว"})).toBeVisible();
      await p.getByRole("button",{name:"พร้อมเล่น",exact:true}).click();
    }
    await expect(phones[0].getByRole("button",{name:"เริ่มเกม",exact:true})).toBeEnabled();
    await phones[0].locator("#starter").selectOption((await read(phones[0])).me!.id);
    await phones[0].getByRole("button",{name:"เริ่มเกม",exact:true}).click();
    await expect(display.locator(".az-factory")).toHaveCount(count*2+1);await expect(display.locator(".az-player")).toHaveCount(count);
    let v=await read(display);const ids=await Promise.all(phones.map(async p=>(await read(p)).me!.id));
    // Every opponent is available read-only on every phone.
    for(const p of phones) {
      for(const id of ids){await p.locator(`[data-inspect="${id}"]`).click();await expect(p.locator(`.az-player[data-player="${id}"]`)).toBeVisible();}
      await p.locator(`[data-inspect="${(await read(p)).me!.id}"]`).click();
    }
    await expect(phones[1].locator("[data-source]").first()).toBeDisabled();
    for(const size of [{width:1366,height:1024},{width:1024,height:768}]) {
      await display.setViewportSize(size);expect(await display.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
      await display.screenshot({path:`test-results/azul-${count}-${size.width}.png`,fullPage:true});
      if(size.width===1024 && count===4) expect(await display.locator(".az-boards").evaluate(el=>el.getBoundingClientRect().bottom)).toBeLessThanOrEqual(768);
    }
    await display.setViewportSize({width:1366,height:1024});
    const first=phones[0];await first.locator("[data-source]").first().click();
    await expect(first.locator("#az-confirm")).toBeDisabled();
    await first.locator("[data-target]:enabled").first().click();await expect(first.locator("#az-preview")).not.toHaveText("");
    await first.screenshot({path:`test-results/azul-${count}-preview.png`,fullPage:true});
    await first.getByRole("button",{name:"ยกเลิกการเลือก"}).click();await expect(first.locator("#az-confirm")).toBeDisabled();
    let moves=0,rounds=0,reconnected=false,resultReconnect=false,retried=false;
    while((v=await read(display)).phase!=="finished" && moves<350) {
      if(v.phase==="results") {
        rounds++;
        await display.screenshot({path:`test-results/azul-${count}-round.png`,fullPage:true});
        if(!resultReconnect){await phones[1].reload();await expect(phones[1].getByRole("button",{name:"เริ่มรอบถัดไป"})).toBeVisible();expect((await read(phones[1])).settlements).toEqual(v.settlements);resultReconnect=true;}
        // Any connected player may continue; a disconnected peer cannot block results.
        if(count!==2) break;
        await phones[0].getByRole("button",{name:"เริ่มรอบถัดไป"}).click();
        await Promise.all([display,...phones].map(p=>revision(p,v.revision+1)));continue;
      }
      const p=phones[ids.indexOf(v.turn!)];const mine=await read(p);
      const legal=mine.me!.legal.filter(a=>a.type==="draft");
      const action=legal.find(a=>a.type==="draft" && a.target===0) ?? legal.find(a=>a.type==="draft" && a.target>=0) ?? legal[0];
      if(action.type!=="draft") throw Error("missing draft");
      await p.waitForTimeout(280); // Keep a real browser below production transport quota.
      await p.locator(`[data-source="${action.source}"][data-color="${action.color}"]`).click();
      await p.locator(`[data-target="${action.target}"]`).click();await expect(p.locator("#az-preview")).not.toHaveText("");
      if(!retried && count===2){await p.evaluate(()=>(window as any).__dropAck=true);retried=true;}
      await p.locator("#az-confirm").click();
      await Promise.all([display,...phones].map(page=>revision(page,v.revision+1)));
      if(retried)await expect(p.locator("#notice")).not.toHaveText("กำลังตรวจรายการ…");
      moves++;
      // Presence changes do not increment game revision and can reach instances
      // a poll apart during the intentional dropped-ACK reconnect.
      for(const phone of phones) await expect(async()=>{
        const current=await read(display),{me,...publicPart}=await read(phone);
        expect(publicPart).toEqual(current);
      }).toPass({timeout:30000});
      if(!reconnected && moves>3){
        await phones[1].context().setOffline(true);await phones[1].evaluate(()=>(window as any).__sockets.at(-1).close());
        await expect(display.getByText("หลุด • รอกลับเข้าห้อง",{exact:false}).first()).toBeVisible();
        await phones[1].context().setOffline(false);await phones[1].reload();await expect(phones[1].locator(".az-player").first()).toBeAttached();
        expect((await read(phones[1])).me!.id).toBe(ids[1]);reconnected=true;
      }
    }
    expect(moves).toBeGreaterThan(5);expect(reconnected).toBeTruthy();expect(resultReconnect).toBeTruthy();
    if(count===2){
      v=await read(display);expect(v.phase).toBe("finished");expect(v.winners!.length).toBeGreaterThan(0);expect(v.bonus!.length).toBe(2);
      await expect(display.getByRole("heading",{name:"โบนัสท้ายเกม"})).toBeVisible();
      await display.screenshot({path:"test-results/azul-finished.png",fullPage:true});
      await display.getByRole("button",{name:"เล่นอีกครั้ง"}).click();await Promise.all([display,...phones].map(p=>revision(p,v.revision+1)));
      expect((await read(display)).round).toBe(1);expect((await read(phones[0])).me!.id).toBe(ids[0]);
    }
    await phones[0].screenshot({path:`test-results/azul-${count}-phone.png`,fullPage:true});
    for(const page of [display,...phones])expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    const frames=await display.evaluate(()=>(window as any).__frames.filter((m:any)=>m.type==="state"));
    for(const {view} of frames){expect(view.me).toBeUndefined();expect(view.bag).toBeUndefined();expect(view.discard).toBeUndefined();expect(JSON.stringify(view)).not.toContain('"token"');}
    expect(errors).toEqual([]);console.log(`Azul ${count} players: ${moves} drafts, ${v.round} rounds, ${count===2?"finished":"round flow passed"}`);
  } finally {for(const c of contexts)await c.close();}
});
