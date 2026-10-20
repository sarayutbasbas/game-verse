import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { startServer } from "../../src/server/index.js";
import {testAccount,createDisplayRoom} from "./auth-fixture.js";
import * as duel from "../../src/games/dracula-vs-van-helsing/engine.js";
import { SUIT_NAME, type DuelAction } from "../../src/games/dracula-vs-van-helsing/types.js";
const view = (p: Page) => p.evaluate(() => (window as any).__view);
test("compact controller: original factions, copy join URL, live trump, sticky discard, toast and complete rematch reset", async ({
  browser,
}) => {
  const app = await startServer(0, "127.0.0.1", true, () => 0.42, {
    storePath: ":memory:",
    legacyHarness: true,
  });
  const url = "http://127.0.0.1:" + (app.server.address() as any).port,
    contexts: BrowserContext[] = [];
  const make = async (mobile = false) => {
    const ctx = await browser.newContext({
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1366, height: 1024 },
    });
    contexts.push(ctx);
    const p = await ctx.newPage();
    await p.addInitScript(() => {
      const w = window as any;
      w.__copied = "";
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: async (text: string) => {
            w.__copied = text;
          },
        },
      });
      window.WebSocket = new Proxy(window.WebSocket, {
        construct(T, args) {
          const ws = new T(args[0], args[1]);
          w.__socket = ws;
          ws.addEventListener("message", (e) => {
            const m = JSON.parse(e.data);
            if (m.type === "state") {
              w.__view = m.view;
              w.__frame = e.data;
            }
          });
          return ws;
        },
      });
    });
    return p;
  };
  try {
    const display = await make();
    await display.goto(url + "/games/dracula-vs-van-helsing");
    await testAccount(display, app);
    await createDisplayRoom(display);
    await expect(display.locator(".room-code strong")).toBeVisible();
    const code = await display.locator(".room-code strong").innerText(),
      phones: Page[] = [];
    for (let i = 0; i < 2; i++) {
      const p = await make(true);
      phones.push(p);
      await p.goto(url + "/play/" + code);
      await p.getByRole("textbox", { name: "ชื่อของคุณ" }).fill("Player " + i);
      await p.getByRole("button", { name: "เข้าห้อง", exact: true }).click();
      const b = p.getByRole("button", {
        name: i ? "Van Helsing" : "Dracula",
        exact: true,
      });
      await expect(b.locator(".role-portrait")).toBeVisible();
      await b.click();
      await expect(b).toHaveAttribute("aria-pressed", "true");
      await expect(b).toContainText("ฝั่งของคุณ");
      if(i===0) await p.screenshot({path:"test-results/dracula-controller-lobby.png",fullPage:true});
      await p.getByRole("button", { name: "พร้อมเล่น", exact: true }).click();
    }
    const room = app.rooms.rooms.get(code)!;
    // Supply a profile image, then verify it cannot replace a game's faction art.
    room.players[0].avatar = "/art/dracula/card-back.webp";
    await display
      .getByRole("button", { name: "เริ่มเกม", exact: true })
      .click();
    const d = phones[0],
      h = phones[1],
      all = [display, d, h];
    await expect(d.locator("#draw")).toBeVisible();
    await expect(d.locator('.city-draw')).toHaveAttribute('data-draw-cue','true');
    await expect(h.locator('.city-draw')).toHaveAttribute('data-draw-cue','false');
    await expect(d.locator('.center-step-status')).toContainText('ตาคุณ');
    await expect(h.locator('.center-step-status')).toContainText('รอ Dracula จั่ว');
    await expect(d.locator('.rack-label-bottom')).toContainText('คุณ • แวมไพร์');
    await expect(h.locator('.rack-label-bottom')).toContainText('คุณ • แวน');
    await expect(d.locator('.rack-label-top')).toContainText('คู่แข่ง • แวน');
    await expect(d.locator('.rack-frame-bottom')).toHaveAttribute('data-active','true');
    await expect(h.locator('.rack-frame-top')).toHaveAttribute('data-active','true');
    await expect(d.locator('.rack-label-bottom .rack-health strong')).toHaveText('12/12');
    await expect(h.locator('.rack-label-top .rack-health strong')).toHaveText('12/12');
    await expect(d.locator('.duel-status')).toHaveCount(0);
    expect(await d.locator('#draw .duel-card').evaluate(n=>getComputedStyle(n).animationName)).toBe('duel-draw-invitation');
    await d.emulateMedia({reducedMotion:'reduce'});
    expect(await d.locator('#draw .duel-card').evaluate(n=>getComputedStyle(n).animationName)).toBe('none');
    await d.emulateMedia({reducedMotion:'no-preference'});
    await expect(d.locator(".rack-person.is-you .role-dracula")).toBeVisible();
    await expect(d.locator(".rack-person .profile-avatar")).toHaveCount(0);
    await expect(d.locator(".rack-person.is-you")).toContainText("คุณ");
    await expect(
      d.locator(".account-link > span:not(.profile-avatar)"),
    ).toHaveCount(0);
    await expect(d.locator(".brand")).toHaveText("GameVerse");
    await expect(d.locator(".connection")).toHaveText("ออนไลน์");
    const account = (await d.locator(".header-account").boundingBox())!,
      header = (await d.locator(".game-header").boundingBox())!;
    expect(header.height).toBeLessThan(85);
    expect(account.x + account.width).toBeGreaterThan(340);
    await d.locator(".shared-room-menu summary").click();
    await d.locator(".room-code").click();
    expect(await d.evaluate(() => (window as any).__copied)).toBe(
      url + "/play/" + code,
    );
    await expect(d.locator(".game-toast")).toContainText(
      "คัดลอกลิงก์เข้าห้องแล้ว",
    );
    await d.locator(".shared-room-menu summary").click();
    const ranking = async () => {
      const v = await view(d);
      await expect(d.locator(".city-map")).toHaveAttribute("data-trump", v.ranking[0]);
      const colors: Record<string,string> = {red:"rgb(239, 100, 117)",yellow:"rgb(245, 206, 88)",green:"rgb(97, 215, 174)",purple:"rgb(197, 154, 245)"};
      expect(await d.locator(".city-map").evaluate(n=>getComputedStyle(n).borderTopColor)).toBe(colors[v.ranking[0]]);
      await expect(d.locator(".controller-ranking .current-trump")).toHaveClass(
        new RegExp("suit-" + v.ranking[0]),
      );
    };
    await ranking();
    for (const p of [d, h]) {
      const state = await view(p);
      const own = state.players.find((x: any) => x.id === state.me.id).character;
      for (const width of [320, 390]) {
        await p.setViewportSize({width, height: 844});
        const positions = await p.locator(".district-side").evaluateAll(nodes => nodes.map(n => {
          const r = n.getBoundingClientRect();
          return {side: (n as HTMLElement).dataset.side, y: r.y, bottom: r.bottom, x: r.x, right: r.right};
        }));
        const ours = positions.filter(x => x.side === own), theirs = positions.filter(x => x.side !== own);
        expect(ours).toHaveLength(5);
        expect(theirs).toHaveLength(5);
        expect(new Set(ours.map(x => x.y)).size).toBe(1);
        expect(new Set(theirs.map(x => x.y)).size).toBe(1);
        expect(ours[0].y).toBeGreaterThan(theirs[0].bottom);
        expect(ours.every(x => x.x >= 0 && x.right <= width)).toBeTruthy();
        await expect(p.locator(".city-draw")).toHaveCount(1);
        expect(await p.locator(".district-map").evaluate(n => getComputedStyle(n,"::after").display)).toBe("none");
        const labels = await p.locator(".territory-content h2").evaluateAll(ns => ns.map(n=>n.getBoundingClientRect().y));
        expect(new Set(labels.map(y=>Math.round(y))).size).toBeGreaterThan(2);
        const clearCenter = await p.locator(".district-map").evaluate(n => {
          const deck = n.querySelector(".city-draw")!.getBoundingClientRect();
          return Array.from(n.querySelectorAll(".territory-content h2, .inhabitants > span")).every(el => {
            const r = el.getBoundingClientRect();
            return Math.min(r.right, deck.right) <= Math.max(r.left, deck.left) || Math.min(r.bottom, deck.bottom) <= Math.max(r.top, deck.top);
          });
        });
        expect(clearCenter).toBeTruthy();
        const mapped = await p.locator('.district-map').evaluate(async map=>{
          const xml=await (await fetch('/art/dracula/districts.svg')).text();
          const svg=new DOMParser().parseFromString(xml,'image/svg+xml').documentElement as unknown as SVGSVGElement;
          const paths=svg.querySelectorAll<SVGPathElement>('g:first-child > path');
          document.body.append(svg); svg.style.position='fixed'; svg.style.visibility='hidden';
          const r=map.querySelector('.city-terrain')!.getBoundingClientRect();
          const valid=[...map.querySelectorAll('.inhabitants > span')].every(token=>{
            const b=token.getBoundingClientRect(), district=Number(token.closest('[data-district]')!.getAttribute('data-district'));
            return [[b.x+b.width/2,b.y+b.height/2],[b.x+1,b.y+b.height/2],[b.right-1,b.y+b.height/2],[b.x+b.width/2,b.y+1],[b.x+b.width/2,b.bottom-1]].every(([x,y])=>paths[district].isPointInFill(new DOMPoint((x-r.x)/r.width*600,(y-r.y)/r.height*300)));
          });
          svg.remove(); return valid;
        });
        expect(mapped).toBeTruthy();
        for(const district of await p.locator(".district").all()) await expect(district.locator(".inhabitants > span")).toHaveCount(4);
        for(const effect of await p.locator(".district-side .duel-effect").all()) await expect(effect).toBeVisible();
        const opacity = await p.locator(".district-side .duel-card").first().evaluate(n => getComputedStyle(n).opacity);
        expect(opacity).toBe(own === "dracula" ? "1" : "0.55");
        await p.screenshot({path: `test-results/dracula-five-${own}-${width}.png`, fullPage:true});
      }
    }
    for (const [width, height] of [[1366,1024],[1024,768],[768,1024]]) {
      await display.setViewportSize({width,height});
      for(const district of await display.locator(".district").all()) {
        const clear = await district.locator(".inhabitants > span").evaluateAll(ns => {
          const rs = ns.map(n=>n.getBoundingClientRect());
          return rs.every((a,i)=>rs.every((b,j)=>i===j || Math.min(a.right,b.right)<=Math.max(a.left,b.left)+.5 || Math.min(a.bottom,b.bottom)<=Math.max(a.top,b.top)+.5));
        });
        expect(clear).toBeTruthy();
      }
      await display.screenshot({path:`test-results/dracula-city-display-${width}x${height}.png`,fullPage:true});
    }
    await display.setViewportSize({width:1366,height:1024});
    await expect(d.locator('.controller-ranking img[src$="green.svg"]')).toBeVisible();
    // Public status belongs to the authoritative card, stays clear while waiting,
    // and survives a real player reconnect without revealing any extra cards.
    room.duel!.players[0].cards[0].revealed = true;
    room.duel!.players[0].cards[2].revealed = true;
    room.duel!.turn = room.players[1].id;
    room.revision++;
    app.rooms.syncRoom(code);
    await expect(d.locator(".rack-public-badge")).toHaveCount(2);
    await expect(d.locator(".rack-reveal-summary")).toContainText("2/5 ใบ");
    await expect(d.locator(".rack-reveal-summary")).toContainText("เขต 1, 3");
    for (const badge of await d.locator(".rack-public-badge").all()) {
      await expect(badge).toBeVisible();
      expect(await badge.evaluate(n=>getComputedStyle(n).opacity)).toBe("1");
    }
    await expect.poll(()=>d.locator('.rack-face[data-own="true"] .duel-card').first().evaluate(n=>getComputedStyle(n).opacity)).toBe("0.55");
    await d.screenshot({path:"test-results/dracula-exposed-waiting.png",fullPage:true});
    await d.reload();
    await expect(d.locator(".rack-public-badge")).toHaveCount(2);
    await expect(d.locator(".rack-reveal-summary")).toContainText("2/5 ใบ");
    room.duel!.turn = room.players[0].id;
    room.revision++;
    app.rooms.syncRoom(code);
    await expect(d.locator("#draw")).toBeVisible();
    // Make a legal effect-7 turn without altering the conservation of all 32 cards.
    let s = room.duel!;
    const beforeEight = structuredClone(s);
    const eight = s.deck.findIndex(c=>c.value===8);
    [s.deck[0], s.deck[eight]] = [s.deck[eight], s.deck[0]];
    if (!s.players[0].cards.some(c=>c.value===8)) {
      const otherEight = s.deck.findIndex((c,i)=>i>0 && c.value===8);
      expect(otherEight).toBeGreaterThan(0);
      [s.players[0].cards[0],s.deck[otherEight]] = [s.deck[otherEight],s.players[0].cards[0]];
    }
    room.revision++;
    app.rooms.syncRoom(code);
    await expect(d.locator('#main')).toHaveAttribute('data-revision',String(room.revision));
    await d.locator('#draw').click();
    await expect(d.locator('.center-discard')).toBeDisabled();
    await expect(d.locator('.center-discard')).toContainText('ทิ้งไม่ได้');
    const clear = async (selector: string) => {
      const style = await d.locator(selector).evaluate(n=>({opacity:getComputedStyle(n).opacity,filter:getComputedStyle(n).filter}));
      expect(style).toEqual({opacity:'1',filter:'none'});
    };
    await clear('.center-discard .duel-card');
    await expect(d.locator('.city-draw')).not.toHaveClass(/is-drawing/);
    await d.screenshot({path:'test-results/dracula-locked-eight.png',fullPage:true});
    // The same restriction applies to an eight already in our rack.
    const rackSlot = s.players[0].cards.findIndex(c=>c.value===8);
    expect(rackSlot).toBeGreaterThanOrEqual(0);
    await expect(d.locator(`[data-slot="${rackSlot}"]`)).toBeDisabled();
    await expect(d.locator(`[data-slot="${rackSlot}"] .card-lock-badge`)).toHaveText('ทิ้งไม่ได้');
    await clear(`[data-slot="${rackSlot}"] .duel-card`);
    room.duel = beforeEight;
    s = room.duel;
    room.revision++;
    app.rooms.syncRoom(code);
    await expect(d.locator('#draw')).toBeVisible();
    const index = s.deck.findIndex((c) => c.value === 7);
    [s.deck[0], s.deck[index]] = [s.deck[index], s.deck[0]];
    const old = (await view(d)).revision;
    await d.evaluate(() => {
      const w = window as any;
      w.__cityNode = document.querySelector('.city-map');
      w.__cardNode = document.querySelector('[data-side="dracula"] .duel-card');
      scrollTo(0, Math.max(0, w.__cityNode.getBoundingClientRect().top + scrollY - 40));
    });
    const scrollBeforeDraw = await d.evaluate(()=>scrollY);
    await d.locator("#draw").click();
    await expect(d.locator("#main")).toHaveAttribute(
      "data-revision",
      String(old + 1),
    );
    await expect(d.locator(".game-toast")).toBeHidden();
    expect(Math.abs(await d.evaluate(()=>scrollY) - scrollBeforeDraw)).toBeLessThan(2);
    expect(await d.evaluate(() => {
      const w = window as any;
      return w.__cityNode === document.querySelector('.city-map') && w.__cardNode === document.querySelector('[data-side="dracula"] .duel-card');
    })).toBeTruthy();
    await expect(d.locator("#notice")).toBeEmpty();
    await expect(d.locator(".discard-confirm-bar")).toBeHidden();
    await expect(d.locator(".rack-choice")).toHaveCount(5);
    await expect(d.locator(".discard-choice")).toHaveCount(1);
    await expect(d.locator(".city-draw [data-slot=\"-1\"]")).toHaveCount(1);
    await expect(d.locator(".city-draw .duel-value")).toHaveText("7");
    await expect(h.locator(".city-draw .duel-value")).toHaveCount(0);
    expect(await d.locator("#duel-controls").evaluate(n => !!(n.compareDocumentPosition(document.querySelector(".duel-piles")!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBeTruthy();
    const rackChoice = d.locator(".rack-choice:enabled").first();
    await rackChoice.click();
    await expect(rackChoice).toHaveAttribute("aria-pressed", "true");
    await expect(d.locator("#confirm-discard")).toBeEnabled();
    await d.locator('[data-slot="-1"]').click();
    await expect(d.locator("#confirm-discard")).toBeVisible();
    const bar = (await d.locator(".discard-confirm-bar").boundingBox())!;
    expect(Math.abs(bar.x + bar.width / 2 - 195)).toBeLessThan(2);
    expect(bar.y + bar.height).toBeLessThanOrEqual(844);
    expect(bar.y).toBeGreaterThan(650);
    await d.locator('[data-slot="4"]').scrollIntoViewIfNeeded();
    await expect(d.locator("#confirm-discard")).toBeInViewport();
    await d.screenshot({path:"test-results/dracula-controller-discard-viewport.png"});
    await d.screenshot({
      path: "test-results/dracula-controller-discard.png",
      fullPage: true,
    });
    const scrollBeforeDiscard = await d.evaluate(()=>scrollY);
    await d.locator("#confirm-discard").click();
    await expect(d.locator(".trump-choice")).toHaveCount(3);
    await expect(d.locator('.game-toast')).toBeHidden();
    await expect(d.locator('.city-draw')).toHaveAttribute('data-draw-cue','false');
    expect(Math.abs(await d.evaluate(()=>scrollY) - scrollBeforeDiscard)).toBeLessThan(2);
    await expect(d.locator(".controller-ranking")).toBeVisible();
    const choice = d.locator(".trump-choice").first();
    await expect(choice).toHaveAttribute("aria-pressed", "true");
    await expect(choice).toHaveAttribute("aria-pressed", "true");
    expect(await choice.evaluate(e => getComputedStyle(e).backgroundColor)).toBe("rgb(172, 53, 75)");
    await expect(choice.locator(".duel-suit-icon")).toHaveAttribute("src", /suits\/red\.svg$/);
    expect(await choice.innerText()).toBe("");
    expect(
      await choice.evaluate((e) => getComputedStyle(e).borderTopWidth),
    ).toBe("3px");
    await d.screenshot({
      path: "test-results/dracula-controller-trump.png",
      fullPage: true,
    });
    await d.locator("#confirm-effect").click();
    await expect
      .poll(async () => (await view(d)).turn)
      .not.toBe((await view(d)).me.id);
    await ranking();
    // Commit a replacement from the actual stand, with no duplicate rack below.
    await expect(h.locator('.city-draw')).toHaveAttribute('data-draw-cue','true');
    await expect(h.locator('.rack-frame-bottom')).toHaveAttribute('data-active','true');
    await h.locator("#draw").click();
    await expect(h.locator(".rack-choice")).toHaveCount(5);
    const incoming = (await view(h)).me.drawn;
    const target = h.locator(".rack-choice:enabled").first();
    const slot = Number(await target.getAttribute("data-slot"));
    await target.click();
    await expect(target).toHaveAttribute("aria-pressed", "true");
    await h.locator("#confirm-discard").click();
    await expect.poll(async () => {
      const c = (await view(h)).me.cards[slot];
      return {suit:c.suit, value:c.value};
    }).toEqual({suit:incoming.suit, value:incoming.value});
    await expect.poll(async () => (await view(h)).me.drawn).toBeUndefined();
    // Exercise actual board targeting for reveal-own/reveal-other/swap-own/exchange.
    const base = structuredClone(room.duel!);
    for (const effect of [1,3,4,6]) {
      room.duel = structuredClone(base);
      room.duel.effect = effect;
      room.duel.step = "effect";
      room.duel.turn = room.players[0].id;
      room.revision++;
      app.rooms.syncRoom(code);
      await expect(d.locator("#main")).toHaveAttribute("data-revision",String(room.revision));
      await expect(d.locator(".effect-choices,#duel-action-panel")).toHaveCount(0);
      await expect(d.locator(".effect-confirm-bar")).toBeVisible();
      await expect(d.locator("#confirm-effect")).toBeEnabled();
      const actor = room.players[0].id;
      const offered = duel.getLegalActions(room.duel,actor).filter((a):a is Extract<DuelAction,{type:"effect"}>=>a.type==="effect");
      const action = offered[0];
      expect(action).toBeDefined();
      const role = effect === 3 ? "helsing" : "dracula";
      const before = structuredClone(room.duel);
      for (const t of action.targets) {
        await expect(d.locator(`[data-target="${t}"][data-target-side="${role}"]`)).toHaveAttribute("aria-pressed","true");
      }
      await expect(d.locator("#effect-preview")).toContainText(effect===3 ? "ไพ่คู่แข่ง" : "ไพ่ของคุณ");
      // Change the suggested selection before confirming, including partial swap.
      for (const t of action.targets) await d.locator(`[data-target="${t}"][data-target-side="${role}"]`).click();
      for (const [j,t] of [...action.targets].reverse().entries()) {
        const button = d.locator(`[data-target="${t}"][data-target-side="${role}"]`);
        await button.click();
        await expect(button).toHaveAttribute("aria-pressed","true");
        await expect.poll(()=>button.evaluate(n=>new DOMMatrixReadOnly(getComputedStyle(n).transform).m42)).toBeLessThan(-5);
        await expect(d.locator(".effect-confirm-bar")).toBeVisible();
        if (effect===4 && j===0) await expect(d.locator("#confirm-effect")).toBeDisabled();
      }
      if(effect===6) await expect(d.locator("#effect-preview")).toContainText(`จะส่ง ${SUIT_NAME[before.players[0].cards[action.targets[0]].suit]} ${before.players[0].cards[action.targets[0]].value}`);
      if(effect===6) await expect(d.locator(`[data-target="${action.targets[0]}"][aria-pressed="true"]`)).toHaveCount(2);
      await expect(d.locator("#confirm-effect")).toBeInViewport();
      await expect(d.locator("#confirm-effect")).toBeEnabled();
      await d.screenshot({path:`test-results/dracula-direct-effect-${effect}.png`,fullPage:true});
      const y = await d.evaluate(()=>scrollY), revision = room.revision;
      await d.locator("#confirm-effect").click();
      await expect(d.locator("#main")).toHaveAttribute("data-revision",String(revision+1));
      expect(room.duel.players).toEqual(duel.applyAction(before,actor,action,()=>.42).players);
      if(effect===6){await expect(h.locator('.duel-exchange-note')).toContainText('คู่แข่งแลกไพ่ของคุณ');await expect(d.locator('.duel-exchange-note')).toContainText('คุณแลกไพ่');expect((await view(display)).me).toBeUndefined();expect((await view(h)).me.exchange.gave).toEqual(before.players[1].cards[action.targets[0]]);await h.screenshot({path:'test-results/dracula-exchange-receipt.png',fullPage:true});}
      expect(Math.abs(await d.evaluate(()=>scrollY)-y)).toBeLessThan(2);
    }
    // Play rules in the isolated engine up to the final legal command, then let
    // the real server/transport resolve that command and the rematch.
    s = structuredClone(room.duel!);
    let final: DuelAction | undefined;
    for (let n = 0; n < 800 && !final; n++) {
      const legal = duel.getLegalActions(s, s.turn);
      const a = legal.find((a) => a.type === "end-round") ?? legal[0];
      const next = duel.applyAction(s, s.turn, a, () => 0.42);
      if (next.phase === "finished") final = a;
      else if (next.phase === "results") {
        s = next;
        for(const p of s.players)for(const a of duel.getLegalActions(s,p.id))if(a.type==="reveal-result")s=duel.applyAction(s,p.id,a,()=>.42);
        for (const p of s.players)
          s = duel.applyAction(s, p.id, { type: "next-round" }, () => 0.42);
      } else s = next;
    }
    expect(final).toBeDefined();
    room.duel = s;
    room.revision++;
    app.rooms.syncRoom(code);
    for (const p of all)
      await expect(p.locator("#main")).toHaveAttribute(
        "data-revision",
        String(room.revision),
      );
    const actor = phones[s.players.findIndex((p) => p.id === s.turn)];
    const endScroll = await Promise.all(phones.map(p=>p.evaluate(()=>{
      const city=document.querySelector('.city-map')!;
      scrollTo(0,Math.max(0,city.getBoundingClientRect().top+scrollY-20));
      return scrollY;
    })));
    await actor.evaluate((a) => {
      const w = window as any;
      w.__socket.send(
        JSON.stringify({
          type: "command",
          id: crypto.randomUUID(),
          revision: w.__view.revision,
          action: a,
        }),
      );
    }, final!);
    await expect.poll(async () => !!(await view(display)).result).toBe(true);
    for(const [i,p] of phones.entries())expect(Math.abs(await p.evaluate(()=>scrollY)-endScroll[i])).toBeLessThan(2);
    for(const phone of phones)while(await phone.locator('[data-result-slot]').count()) {
      const rev=room.revision;await phone.locator('[data-result-slot]').first().click();
      await expect(phone.locator('#main')).toHaveAttribute('data-revision',String(rev+1));
    }
    await expect.poll(async () => (await view(display)).phase).toBe("finished");
    for (const p of all) {
      const skip = p.getByRole("button", { name: "แสดงผลทั้งหมด", exact: true });
      if (await skip.isVisible()) await skip.click();
      await expect(p.locator(".duel-table")).toHaveAttribute("data-motion-state", "idle", {timeout:16000});
    }
    for (const [i,p] of phones.entries()) {
      const controlsBox=(await p.locator('#duel-controls').boundingBox())!, deckBox=(await p.locator('.city-draw').boundingBox())!;
      expect(controlsBox.y).toBeGreaterThanOrEqual(deckBox.y);
      expect(controlsBox.x).toBeGreaterThanOrEqual(deckBox.x);
    }
    const finishedFrame = await display.evaluate(() => (window as any).__frame);
    await display
      .getByRole("button", { name: "เล่นอีกครั้ง", exact: true })
      .click();
    for (const p of all) {
      await expect.poll(async () => (await view(p)).phase).toBe("playing");
      await expect(p.locator(".board-health strong")).toHaveText("12/12");
      await expect(
        p.locator(".round-outcome,.reveal-focus,.district-result"),
      ).toHaveCount(0);
      expect((await view(p)).discard).toEqual([]);
      expect((await view(p)).vampires).toEqual([0, 0, 0, 0, 0]);
      expect((await view(p)).result).toBeUndefined();
    }
    await expect(display.locator('.district [data-card="hidden"]')).toHaveCount(
      10,
    );
    for (const p of phones) {
      const v = await view(p);
      expect(v.me.cards.every((c: any) => !c.revealed)).toBeTruthy();
      await expect(p.locator(".rack-public-badge")).toHaveCount(0);
      await expect(p.locator(".rack-reveal-summary")).toContainText("0/5 ใบ");
      await expect(p.locator('.district [data-card="hidden"]')).toHaveCount(5);
      const side = v.players.find((x: any) => x.id === v.me.id).character;
      for (let i = 0; i < 5; i++)
        await expect(
          p.locator(`[data-district="${i}"] [data-side="${side}"] .duel-value`),
        ).toHaveText(String(v.me.cards[i].value));
    }
    await display.evaluate(
      (frame) =>
        (window as any).__socket.dispatchEvent(
          new MessageEvent("message", { data: frame }),
        ),
      finishedFrame,
    );
    await expect(display.locator('.district [data-card="hidden"]')).toHaveCount(
      10,
    );
    await d.reload();
    await expect(d.locator("#draw")).toBeVisible();
    await expect(d.locator('.district [data-card="hidden"]')).toHaveCount(5);
    await d.screenshot({
      path: "test-results/dracula-controller-rematch.png",
      fullPage: true,
    });
    for (const p of all)
      expect(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
  } finally {
    for (const c of contexts) await c.close();
    await app.close();
  }
});
