import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import {testAccount,createDisplayRoom} from "./auth-fixture.js";
import { startServer } from "../../src/server/index.js";
import * as azul from "../../src/games/azul/engine.js";
import { validateAzulState } from "../../src/games/azul/validation.js";
import { TILE_COLORS, WALL, type TileColor, type AzulState } from "../../src/games/azul/types.js";
function conserve(s: AzulState) {
  const used = [...s.factories.flat(), ...s.center, ...s.discard, ...s.players.flatMap(p => [
    ...p.floor.filter((c): c is TileColor => c !== "first"),
    ...p.pattern.flatMap(l => l.color ? Array<TileColor>(l.count).fill(l.color) : []),
    ...p.wall.flatMap((row,r) => row.flatMap((filled,c) => filled ? [WALL[r][c]] : [])),
  ])];
  s.bag = TILE_COLORS.flatMap(c => Array<TileColor>(20-used.filter(x=>x===c).length).fill(c));
  expect(validateAzulState(s)).toBeTruthy();
}
async function hook(page: Page) {
  await page.addInitScript(()=>{
    (window as any).__frames=[];
    window.WebSocket=new Proxy(window.WebSocket,{construct(Target,args){
      const socket=new Target(args[0],args[1]);((window as any).__sockets??=[]).push(socket);
      const send=socket.send.bind(socket);socket.send=data=>{const m=JSON.parse(String(data));if(m.type==="command")(window as any).__lastCommand=m;send(data);};
      socket.addEventListener("message",e=>{const m=JSON.parse(e.data);(window as any).__frames.push(m);if(m.type==="state")(window as any).__view=m.view;});return socket;
    }});
  });
}
test("Azul presentation: real artwork, score beyond 100, server overflow preview, stable board DOM, dedup, tied results and image fallback",async({browser})=>{
  const app=await startServer(0,"127.0.0.1",true,()=>.42,{storePath:":memory:"});
  const url=`http://127.0.0.1:${(app.server.address() as any).port}`, contexts:BrowserContext[]=[],errors:string[]=[];
  const make=async(mobile=false,cookies?:any[])=>{
    const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1366,height:1024},isMobile:mobile,hasTouch:mobile});contexts.push(context);
    if(cookies)await context.addCookies(cookies);const page=await context.newPage();page.on("pageerror",e=>errors.push(e.message));await hook(page);return page;
  };
  try {
    const display=await make();await display.goto(url+"/games/azul");await testAccount(display,app);await createDisplayRoom(display);
    await expect(display.locator(".room-code strong")).toBeVisible();const code=await display.locator(".room-code strong").innerText();
    const cookies=await display.context().cookies(), phones:Page[]=[];
    for(let i=0;i<2;i++){
      const p=await make(true,i?undefined:cookies);phones.push(p);await p.goto(url+`/play/${code}`);
      if(i)await p.getByRole("textbox",{name:"ชื่อของคุณ"}).fill("คู่แข่ง Azul");
      await p.getByRole("button",{name:"เข้าห้อง",exact:true}).click();await p.getByRole("button",{name:"พร้อมเล่น",exact:true}).click();
    }
    const room=app.rooms.rooms.get(code)!, owner=room.players[0].id;
    await display.locator("#starter").selectOption(owner);await display.getByRole("button",{name:"เริ่มเกม",exact:true}).click();
    await expect(display.locator(".az-player")).toHaveCount(2);
    for(const file of ["tile-blue","tile-yellow","tile-red","tile-black","tile-white","factory","first-player","board-paper"]){const response=await display.request.get(url+`/art/azul/${file}.webp`);expect(response.status()).toBe(200);expect(response.headers()["content-type"]).toContain("image/webp");}
    const s=azul.createInitialState(room.players,()=>.42,owner);
    s.factories=s.factories.map(()=>[]);s.factories[0]=["blue"];s.center=Array<TileColor>(4).fill("red");
    s.players[0].score=121;s.players[0].floor=Array<TileColor>(5).fill("yellow");s.players[0].pattern[2]={color:"red",count:2};s.players[0].pattern[4]={color:"white",count:1};s.players[0].wall[1][WALL[1].indexOf("red")]=true;
    conserve(s);room.azul=s;room.revision++;app.rooms.syncRoom(code);
    const p=phones[0];await expect(p.locator(`[data-player="${owner}"] .score-marker`)).toHaveText("121");
    await expect(p.locator(`[data-player="${owner}"] .az-score-track`)).toHaveAttribute("aria-label","คะแนนจริง 121 แทร็กช่วง 120 ถึง 130");
    const source=p.locator('[data-source="-1"][data-color="red"]');
    await p.evaluate(()=>{(window as any).__board=document.querySelector(".az-boards");});
    const before=structuredClone(room.azul);
    await source.click();await p.locator('[data-target="2"]').click();
    await expect(p.locator("#az-preview")).toContainText("วาง 1 • ล้นลงพื้น 1 • ทิ้งทันที 2");
    await expect(p.locator(".az-preview-layer")).toHaveCount(3); // One pattern tile, marker and one floor tile.
    await expect(p.locator('[data-target="1"]')).toBeDisabled();await expect(p.locator(".az-target-reasons")).toContainText("ผนังแถวนี้มีสีนี้แล้ว");
    expect(await p.evaluate(()=>(window as any).__board===document.querySelector(".az-boards"))).toBeTruthy();
    await p.locator(`[data-inspect="${room.players[1].id}"]`).click();await expect(p.locator("#az-preview")).toContainText("ทิ้งทันที 2");
    await p.locator(`[data-inspect="${owner}"]`).click();expect(room.azul).toEqual(before);
    expect(await p.evaluate(()=>(window as any).__board===document.querySelector(".az-boards"))).toBeTruthy();
    await p.screenshot({path:"test-results/azul-overflow-preview.png",fullPage:true});
    await display.screenshot({path:"test-results/azul-score-121.png",fullPage:true});
    await p.locator("#az-confirm").click();await expect(p.locator("#main")).toHaveAttribute("data-revision",String(room.revision));
    await expect.poll(()=>room.azul!.firstPlayer).toBe(owner);expect(room.azul!.players[0].floor.length).toBe(7);expect(room.azul!.discard.length).toBe(2);expect(validateAzulState(room.azul)).toBeTruthy();
    const committed=structuredClone(room.azul);const revision=room.revision;
    const ackBefore=await p.evaluate(()=>(window as any).__frames.filter((m:any)=>m.type==="ack").length);
    await p.evaluate(()=>{(window as any).__afterBoard=document.querySelector(".az-boards");(window as any).__sockets.at(-1).send(JSON.stringify((window as any).__lastCommand));});
    await expect.poll(()=>p.evaluate(()=>(window as any).__frames.filter((m:any)=>m.type==="ack").length)).toBeGreaterThan(ackBefore);
    expect(room.revision).toBe(revision);expect(room.azul).toEqual(committed);
    expect(await p.evaluate(()=>(window as any).__afterBoard===document.querySelector(".az-boards"))).toBeTruthy();
    // An authoritative final-round fixture creates a real engine-produced shared win.
    const final=azul.createInitialState(room.players,()=>.42,owner);final.factories=final.factories.map(()=>[]);final.center=["red"];
    for(const player of final.players){player.wall[0]=[true,true,true,true,false];player.pattern[0]={color:"white",count:1};player.score=player.id===owner?35:33;}
    conserve(final);room.azul=azul.applyAction(final,owner,{type:"draft",source:-1,color:"red",target:-1},()=>.42);room.revision++;app.rooms.syncRoom(code);
    await expect(display.getByRole("heading",{name:"โบนัสท้ายเกม"})).toBeVisible();
    // Owner takes marker + one floor tile (−2), both players finish at 40.
    expect(room.azul.winners).toHaveLength(2);await expect(display.getByText("ชนะร่วม • คะแนนรวมและจำนวนแถวครบเท่ากัน")).toBeVisible();
    await expect(display.getByText("ก่อนโบนัส",{exact:true})).toHaveCount(2);
    await display.screenshot({path:"test-results/azul-tied-final.png",fullPage:true});
    await display.getByRole("button",{name:"เล่นอีกครั้ง"}).click();await expect(display.locator(".shared-turn")).toContainText("ตา");
    const fallback=await make(true,cookies);await fallback.route("**/art/azul/tile-red.webp",route=>route.abort());
    await fallback.goto(url+`/play/${code}`);await fallback.getByRole("button",{name:"เข้าห้อง",exact:true}).click();
    await expect(fallback.locator(".az-art-warning")).toContainText("สีและตัวอักษรสำรอง");
    await expect(fallback.locator(".az-tile.red.art-missing").first()).toBeVisible();
    await fallback.emulateMedia({reducedMotion:"reduce"});
    expect(await fallback.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    await fallback.screenshot({path:"test-results/azul-art-fallback.png",fullPage:true});
    expect(errors).toEqual([]);
  }finally{for(const c of contexts)await c.close();await app.close();}
});
