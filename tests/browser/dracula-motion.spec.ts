import {testAccount,createDisplayRoom} from "./auth-fixture.js";
import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { startServer } from "../../src/server/index.js";
import * as duel from "../../src/games/dracula-vs-van-helsing/engine.js";
import type {
  DuelState,
  DuelAction,
} from "../../src/games/dracula-vs-van-helsing/types.js";
async function hook(p: Page) {
  await p.addInitScript(() => {
    (window as any).__frames = [];
    (window as any).__cardSounds=[];
    const bufferSource=AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource=function(){const node=bufferSource.call(this), start=node.start.bind(node);node.start=(time=0,...args:any[])=>{(window as any).__cardSounds.push(time);return start(time,...args);};return node;};
    (window as any).__sent = [];
    window.WebSocket = new Proxy(window.WebSocket, {
      construct(Target, args) {
        const s = new Target(args[0], args[1]);
        ((window as any).__sockets ??= []).push(s);
        const send = s.send.bind(s);
        s.send = (data) => {
          (window as any).__sent.push(JSON.parse(String(data)).type);
          send(data);
        };
        s.addEventListener("message", (event) => {
          const m = JSON.parse(event.data);
          (window as any).__frames.push(m);
          if (m.type === "state") (window as any).__view = m.view;
          if (m.type === "state" && (window as any).__skip) {
            (window as any).__skip = false;
            event.stopImmediatePropagation();
          } else if (m.type === "state" && (window as any).__duplicate) {
            (window as any).__duplicate = false;
            s.dispatchEvent(new MessageEvent("message", { data: event.data }));
          }
        });
        return s;
      },
    });
  });
}
async function cmd(p: Page, a: unknown, revision?:number) {
  await p.evaluate(({action,revision}) => {
    const w = window as any;
    w.__sockets.at(-1).send(
      JSON.stringify({
        type: "command",
        id: crypto.randomUUID(),
        revision: revision ?? w.__view.revision,
        action,
      }),
    );
  }, {action:a,revision});
}
test("manual reveal synchronizes two phones, protects closed cards, handles simultaneous taps and resumes after reconnect", async ({
  browser,
}) => {
  const app = await startServer(0, "127.0.0.1", true, () => 0.42, {storePath: ":memory:", legacyHarness:true}),
    url = `http://127.0.0.1:${(app.server.address() as any).port}`,
    contexts: BrowserContext[] = [];
  const make = async (mobile = false) => {
    const ctx = await browser.newContext({
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1366, height: 1024 },
      isMobile: mobile,
      hasTouch: mobile,
    });
    contexts.push(ctx);
    const p = await ctx.newPage();
    await hook(p);
    return p;
  };
  try {
    const display = await make();
    await display.goto(`${url}/games/dracula-vs-van-helsing`);
    await testAccount(display, app);
    await createDisplayRoom(display);
    await expect(display.locator(".room-code strong")).toBeVisible();
    const code = await display.locator(".room-code strong").innerText(),
      phones = [];
    for (let i = 0; i < 2; i++) {
      const p = await make(true);
      phones.push(p);
      await p.goto(`${url}/play/${code}`);
      await p
        .getByRole("textbox", { name: "ชื่อของคุณ" })
        .fill(i ? "Hunter" : "Count");
      await p.getByRole("button", { name: "เข้าห้อง", exact: true }).click();
      await p
        .getByRole("button", {
          name: i ? "Van Helsing" : "Dracula",
          exact: true,
        })
        .click();
      await p.getByRole("button", { name: "พร้อมเล่น", exact: true }).click();
    }
    await display
      .getByRole("button", { name: "เริ่มเกม", exact: true })
      .click();
    await expect(display.locator(".duel-table")).toBeVisible();
    await expect(
      phones[0].getByRole("button", { name: "จั่วการ์ด", exact: true }),
    ).toBeVisible();
    await phones[0].screenshot({
      path: "test-results/dracula-mobile-count.png",
      fullPage: true,
    });
    await phones[1].screenshot({
      path: "test-results/dracula-mobile-helsing.png",
      fullPage: true,
    });
    const room = app.rooms.rooms.get(code)!;
    for(const p of [display,...phones])await expect(p.locator('.duel-table')).toHaveAttribute('data-deal-revision',String(room.revision));
    const scheduled=await display.evaluate(()=>(window as any).__cardSounds as number[]);
    expect(scheduled).toHaveLength(10);
    expect(scheduled.slice(1).every((t,i)=>t>scheduled[i])).toBeTruthy();
    // A real command chain reproduces the reported effect-2 bug on all three screens.
    // Internal deterministic setup only: all 32 cards conserved, no app debug route.
    const fixture = duel.createInitialState(room.players, () => 0.42);
    fixture.players[0].cards = [1, 3, 4, 5, 6].map((value) => ({ suit: "red" as const, value, revealed: false }));
    fixture.players[1].cards = [1, 3, 4, 5, 6].map((value) => ({ suit: "green" as const, value, revealed: false }));
    const used = fixture.players.flatMap((p) => p.cards);
    const remaining = duel.allCards().filter((c) => !used.some((u) => u.suit === c.suit && u.value === c.value));
    fixture.deck = [remaining.find((c) => c.suit === "red" && c.value === 2)!, remaining.find((c) => c.suit === "purple" && c.value === 5)!,
      ...remaining.filter((c) => !(c.suit === "red" && c.value === 2) && !(c.suit === "purple" && c.value === 5))];
    fixture.lastAction = "เตรียมทดสอบไพ่เปิดเผย";
    room.duel = fixture;
    for (const p of [display, ...phones]) {
      await p.evaluate(() => (window as any).__sockets.at(-1).send(JSON.stringify({ type: "sync" })));
      await expect(p.locator(".board-turn small")).toHaveText(fixture.lastAction);
    }
    const all = [display, ...phones], [d,h]=phones;
    const sendAndWait = async (p: Page, action: DuelAction) => {
      const revision = room.revision + 1;
      await cmd(p, action);
      for (const page of all) await expect(page.locator("#main")).toHaveAttribute("data-revision", String(revision));
    };
    await sendAndWait(phones[0], { type: "draw" });
    for (const p of all) await expect(p.locator(".public-draw")).toHaveCount(0);
    await sendAndWait(phones[0], { type: "discard", slot: -1 });
    const drawsBefore = Number(await display.locator('.duel-table').getAttribute('data-draw-animation-count') ?? 0);
    const soundsBefore=await display.evaluate(()=>(window as any).__cardSounds.length);
    await display.evaluate(() => ((window as any).__duplicate = true));
    await sendAndWait(phones[1], { type: "draw" });
    await expect(display.locator('.duel-table')).toHaveAttribute('data-draw-animation-count',String(drawsBefore+1));
    expect(await display.evaluate(()=>(window as any).__cardSounds.length)).toBe(soundsBefore+1);
    for(const p of all) {
      await expect(p.locator('.duel-table')).toHaveAttribute('data-draw-revision',String(room.revision));
      await expect(p.locator('.city-draw')).toHaveAttribute('data-draw-state','held');
    }
    for (const p of all) {
      await expect(p.locator(".public-draw .duel-value")).toHaveText("5");
      expect(await p.evaluate(() => (window as any).__view.drawn)).toEqual({ suit: "purple", value: 5, revealed: true });
    }
    await phones[0].screenshot({ path: "test-results/dracula-public-draw-phone.png", fullPage: true });
    await sendAndWait(phones[1], { type: "discard", slot: 3 });
    for (const p of all) {
      await expect(p.locator('[data-district="3"] [data-side="helsing"] .duel-value')).toHaveText("5");
      await expect(p.locator(".board-turn small")).toContainText("ที่เขต 4");
      await expect(p.locator(".public-draw")).toHaveCount(0);
    }
    await phones[0].reload();
    await expect(phones[0].locator('[data-district="3"] [data-side="helsing"] .duel-value')).toHaveText("5");
    // Stop before the first authoritative round completion.
    let state=room.duel!, ending:DuelAction|undefined;
    for(let i=0;i<150&&!ending;i++) {
      const legal=duel.getLegalActions(state,state.turn),a=legal.find(a=>a.type==="end-round")??legal[0];
      const after=duel.applyAction(state,state.turn,a,()=>.42);
      if(after.phase!=="playing")ending=a;else state=after;
    }
    expect(ending).toBeDefined();
    state.players.forEach(p=>p.cards.forEach(c=>c.revealed=false));
    room.duel=state;room.revision++;app.rooms.syncRoom(code);
    for(const p of all)await expect(p.locator('#main')).toHaveAttribute('data-revision',String(room.revision));
    const actor=phones[state.players.findIndex(p=>p.id===state.turn)];
    await sendAndWait(actor,ending!);
    for(const p of all){
      await expect(p.locator('.board-turn strong')).toHaveText('จบรอบแล้ว เปิดการ์ดเพื่อดูคะแนน');
      await expect(p.locator('.reveal-focus,.board-reveal-layer')).toHaveCount(0);
      await expect(p.locator('#next-round,#duel-restart')).toHaveCount(0);
    }
    const closedBefore=(await display.evaluate(()=>(window as any).__view)).revealedCount;
    await display.waitForTimeout(800);
    expect((await display.evaluate(()=>(window as any).__view)).revealedCount).toBe(closedBefore);
    const dslot=Number(await d.locator('[data-result-slot]').last().getAttribute('data-result-slot'));
    const hslot=Number(await h.locator('[data-result-slot]').last().getAttribute('data-result-slot'));
    const priorRevision=room.revision;
    // Both intents carry the same revision and are allowed to commute.
    await Promise.all([cmd(d,{type:'reveal-result',slot:dslot,round:state.round},priorRevision),cmd(h,{type:'reveal-result',slot:hslot,round:state.round},priorRevision)]);
    for(const p of all)await expect(p.locator('#main')).toHaveAttribute('data-revision',String(priorRevision+2));
    const shared=await display.evaluate(()=>(window as any).__view);
    expect(shared.racks.dracula[dslot]).toBeTruthy();expect(shared.racks.helsing[hslot]).toBeTruthy();
    expect(shared.result.cards.dracula[dslot]).toEqual(shared.racks.dracula[dslot]);
    expect(shared.result.cards.dracula.filter((c:any)=>c===null).length).toBeGreaterThan(0);
    expect(shared.event.reveal.cards.helsing.filter((c:any)=>c===null).length).toBeGreaterThan(0);
    const count=shared.revealedCount;
    await d.reload();
    await expect(d.locator('.city-draw')).toContainText(`เปิดแล้ว ${count}/10 ใบ`);
    await expect(d.locator('.duel-table')).toHaveAttribute('data-motion-state','idle');
    await d.emulateMedia({reducedMotion:'reduce'});
    await d.screenshot({path:'test-results/dracula-manual-reveal.png',fullPage:true});
    for(const phone of phones)while(await phone.locator('[data-result-slot]').count()) {
      const rev=room.revision;await phone.locator('[data-result-slot]').first().click();
      for(const p of all)await expect(p.locator('#main')).toHaveAttribute('data-revision',String(rev+1));
    }
    expect((await display.evaluate(()=>(window as any).__view)).revealedCount).toBe(10);
    await d.locator('#next-round').click();await h.locator('#next-round').click();
    await expect(d.locator('#draw')).toBeVisible();
    // A reconnect snapshot never replays the new round's deal or prior sound effects.
    await h.reload();await expect(h.locator('.duel-table')).toHaveAttribute('data-motion-state','idle');
    await expect(h.locator('.duel-table')).not.toHaveAttribute('data-deal-revision',/.+/);
  } finally {
    for (const c of contexts) await c.close();
    await app.close();
  }
});
