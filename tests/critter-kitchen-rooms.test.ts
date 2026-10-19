import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import WebSocket from "ws";
import { DatabaseSync } from "node:sqlite";
import { startServer } from "../src/server/index.js";
import * as ckRules from "../src/games/critter-kitchen/engine.js";
import { validateCKState } from "../src/games/critter-kitchen/validation.js";
import type { CKView } from "../src/games/critter-kitchen/types.js";
class Peer {
    messages: any[] = [];
    ws!: WebSocket;
    async connect(url: string, cookie = "") {
        this.ws = new WebSocket(url.replace("http", "ws") + "/ws", {
            origin: url,
            headers: { Cookie: cookie },
        });
        this.ws.on("message", (raw) => this.messages.push(JSON.parse(String(raw))));
        await new Promise<void>((r, j) => {
            this.ws.once("open", r);
            this.ws.once("error", j);
        });
        return this;
    }
    async wait(predicate: (m: any) => boolean, from = 0) {
        for (let i = 0; i < 1000; i++) {
            const found = this.messages.slice(from).find(predicate);
            if (found)
                return found;
            await new Promise((r) => setTimeout(r, 5));
        }
        throw Error("Protocol timeout");
    }
    async send(m: unknown, type: string) {
        const from = this.messages.length;
        this.ws.send(JSON.stringify(m));
        return this.wait((m) => m.type === type, from);
    }
    get view(): CKView {
        return this.messages.filter((m) => m.type === "state").at(-1)?.view;
    }
    async command(action: unknown, revision = this.view.revision, id: string = randomUUID()) {
        const ack = await this.send({ type: "command", id, revision, action }, "ack");
        await this.wait((m) => m.type === "state" && m.view.revision === ack.revision);
        return ack;
    }
}
import { seeded, botAction } from './critter-kitchen-fixtures.js';
test('Critter Kitchen real WS: mixed presentation, private simultaneous commitments, strict picks, receipts and two restart points', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ck-room-')), path = join(dir, 'rooms.sqlite');
    let app = await startServer(0, '127.0.0.1', true, seeded(24), { storePath: path });
    let url = `http://localhost:${(app.server.address() as any).port}`;
    const peers: Peer[] = [];
    const make = async (cookie = '') => { const p = await new Peer().connect(url, cookie); peers.push(p); return p; };
    const identity = async (member = false) => { const r = await fetch(url + '/api/auth/sign-in/anonymous', { method: 'POST', headers: { Origin: url, 'Content-Type': 'application/json' }, body: '{}' }); const data = await r.json(); if (member)
        await (await app.auth.$context).internalAdapter.updateUser(data.user.id, { isAnonymous: false }); return r.headers.getSetCookie().map(c => c.split(';')[0]).join('; '); };
    try {
        const cookies = [await identity(true), await identity(), await identity()];
        let host = await make(cookies[0]);
        const hs = await host.send({ type: 'create', gameId: 'critter-kitchen', displayMode: 'full-mobile' }, 'session'), code = hs.code;
        let phones: Peer[] = [];
        const tokens: string[] = [], ids: string[] = [];
        for (let i = 0; i < 3; i++) {
            const p = await make(cookies[i]), session = await p.send({ type: 'join', code, name: 'ครัว ' + i }, 'session');
            phones.push(p);
            tokens.push(session.token);
            ids.push(session.playerId);
            await p.send({ type: 'sync' }, 'state');
            await p.command({ type: 'ready', ready: true });
        }
        let spectator = await make();
        await spectator.send({ type: 'watch', code }, 'state');
        await host.send({ type: 'sync' }, 'state');
        assert.equal((await phones[1].command({ type: 'start' })).ok, false);
        assert.equal((await host.command({ type: 'start' })).ok, true);
        assert.equal(host.view.displayMode, 'full-mobile');
        assert.equal(host.view.config.specialSide, 'standard');
        assert.equal(host.view.config.locations.length, 6);
        assert.equal(host.view.challengeReveal,1);await phones[0].send({type:'sync'},'state');assert.equal((await phones[0].command({type:'ck-plan',epoch:phones[0].view.me!.epoch,plan:{mouse:'garden',lizard:'midnight',boar:'academy'}})).ok,false);assert.equal((await host.command({type:'ck-continue-planning',round:1,challenge:1})).ok,true);
        const plan = { mouse: 'garden', lizard: 'midnight', boar: 'academy' };
        await phones[0].send({ type: 'sync' }, 'state');
        assert.equal((await phones[0].command({ type: 'ck-plan', epoch: phones[0].view.me!.epoch, plan })).ok, true);
        await spectator.send({ type: 'sync' }, 'state');
        assert.equal(spectator.view.players[0].plan, null);
        assert.equal(spectator.view.players[0].committed, true);
        assert.equal(spectator.view.me, undefined);
        const restart = async () => { const saved = structuredClone(app.rooms.rooms.get(code)!.ck); await app.close(); app = await startServer(0, '127.0.0.1', true, seeded(123), { storePath: path }); url = `http://localhost:${(app.server.address() as any).port}`; assert.equal(app.store.quarantined.length, 0); assert.deepEqual(app.rooms.rooms.get(code)!.ck, saved); phones = []; for (let i = 0; i < 3; i++) {
            const p = await make(cookies[i]);
            await p.send({ type: 'resume', code, token: tokens[i] }, 'state');
            phones.push(p);
        } host = await make(cookies[0]); await host.send({ type: 'resume', code, token: hs.token }, 'state'); spectator = await make(); await spectator.send({ type: 'watch', code }, 'state'); return saved; };
        await restart();
        assert.deepEqual(phones[0].view.me!.plan, plan);
        assert.equal(phones[1].view.players[0].plan, null);
        assert.equal(phones[1].view.me!.plan, null);
        const rev = host.view.revision;
        for (let i = 1; i < 3; i++)
            assert.equal((await phones[i].command({ type: 'ck-plan', epoch: phones[i].view.me!.epoch, plan }, rev)).ok, true);
        await host.send({ type: 'sync' }, 'state');
        assert.equal(host.view.phase, 'running');
        assert.ok(host.view.players.every(p => p.plan===null));assert.deepEqual(host.view.visits,[]);await spectator.send({type:'sync'},'state');assert.ok(spectator.view.players.every(p=>p.plan===null));assert.deepEqual(spectator.view.visits,[]);
        assert.equal((await spectator.send({ type: 'command', id: 'spectator-action-123', revision: host.view.revision, action: { type: 'ck-run' } }, 'error')).type, 'error');
        assert.equal((await host.command({ type: 'ck-run' })).ok, true);await host.send({type:'sync'},'state');assert.ok(host.view.players.every(p=>p.plan));assert.equal(host.view.visits.length,9);
        const state = app.rooms.rooms.get(code)!.ck!, index = ids.indexOf(state.pending!.actor), actor = phones[index];
        await actor.send({ type: 'sync' }, 'state');
        const action = actor.view.me!.legal.find(a => a.type === 'ck-pick')!;
        const wrong = phones[(index + 1) % 3];
        await wrong.send({ type: 'sync' }, 'state');
        assert.equal((await wrong.command(action)).ok, false);
        assert.equal((await host.command(action)).ok, false);
        const before = actor.view.revision, id = randomUUID();
        assert.equal((await actor.command(action, before, id)).ok, true);
        const accepted = structuredClone(app.rooms.rooms.get(code)!.ck);
        assert.equal((await actor.command(action, before, id)).ok, true);
        assert.deepEqual(app.rooms.rooms.get(code)!.ck, accepted);
        assert.equal((await actor.command(action, before)).ok, false);
        assert.ok(validateCKState(accepted));
        const saved = await restart();
        assert.equal(host.view.phase, 'shopping');
        assert.deepEqual(app.rooms.rooms.get(code)!.ck, saved);
        assert.equal(phones[index].view.me!.storage.length, saved!.players[index].storage.length);
        // The next-Challenge gate is shared, persisted and restricted to room members/managers.
        const random=seeded(422);
        for(let step=0;app.rooms.rooms.get(code)!.ck!.challengeReveal===undefined&&step<200;step++){
            const next=botAction(app.rooms.rooms.get(code)!.ck!,random),peer=phones[ids.indexOf(next.actor)];await peer.send({type:'sync'},'state');assert.equal((await peer.command(next.action)).ok,true);
        }
        await host.send({type:'sync'},'state');assert.equal(host.view.challengeReveal,2);const pendingStage=structuredClone(app.rooms.rooms.get(code)!.ck),continueAction={type:'ck-continue-planning',round:2,challenge:2};
        await spectator.send({type:'sync'},'state');assert.equal((await spectator.send({type:'command',id:randomUUID(),revision:host.view.revision,action:continueAction},'error')).type,'error');assert.deepEqual(app.rooms.rooms.get(code)!.ck,pendingStage);
        await restart();assert.equal(host.view.challengeReveal,2);assert.equal(phones[1].view.challengeReveal,2);const continueRevision=phones[1].view.revision,continueId=randomUUID();assert.equal((await phones[1].command(continueAction,continueRevision,continueId)).ok,true);
        const continued=structuredClone(app.rooms.rooms.get(code)!.ck);assert.equal(continued!.challengeReveal,undefined);assert.equal(continued!.round,2);assert.equal((await phones[1].command(continueAction,continueRevision,continueId)).ok,true);assert.deepEqual(app.rooms.rooms.get(code)!.ck,continued);assert.equal((await phones[1].command(continueAction,continueRevision)).ok,false);
        await restart();assert.equal(host.view.challengeReveal,undefined);assert.equal(phones[0].view.challengeReveal,undefined);assert.equal(host.view.round,2);
        for (const peer of peers)
            for (const m of peer.messages.filter(x => x.type === 'state' && x.view.gameId === 'critter-kitchen')) {
                assert.equal(m.view.bag, undefined);
                assert.equal(m.view.unusedRumors, undefined);
                assert.equal(m.view.zousDeck, undefined);
                assert.equal(m.view.tasks, undefined);
                assert.equal(m.view.sessions, undefined);
                for (const p of m.view.players) {
                    assert.equal(p.storage, undefined);
                    assert.equal(p.soup, undefined);
                    assert.equal(p.extraRumor, undefined);
                    if (m.view.phase === 'planning')
                        assert.equal(p.plan, null);
                }
            }
    }
    finally {
        for (const p of peers)
            p.ws.close();
        await app.close();
        await rm(dir, { recursive: true, force: true });
    }
});

test('Critter Kitchen Promo lobby: manager-only authoritative options, strict input, reconnect and restart persistence', async()=>{
 const dir=await mkdtemp(join(tmpdir(),'ck-promos-')),path=join(dir,'rooms.sqlite');
 let app=await startServer(0,'127.0.0.1',true,seeded(981),{storePath:path});let url=`http://localhost:${(app.server.address() as any).port}`;const peers:Peer[]=[];
 const connect=async(cookie='')=>{const p=await new Peer().connect(url,cookie);peers.push(p);return p;};
 const identity=async(member=false)=>{const r=await fetch(url+'/api/auth/sign-in/anonymous',{method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:'{}'});const data=await r.json();if(member)await(await app.auth.$context).internalAdapter.updateUser(data.user.id,{isAnonymous:false});return r.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');};
 try{
 const ownerCookie=await identity(true),guestCookie=await identity();let host=await connect(ownerCookie);const hs=await host.send({type:'create',gameId:'critter-kitchen'},'session');await host.send({type:'sync'},'state');
 const phones:Peer[]=[];for(const [i,cookie]of [ownerCookie,guestCookie].entries()){const p=await connect(cookie);await p.send({type:'join',code:hs.code,name:'Promo '+i},'session');await p.send({type:'sync'},'state');phones.push(p);}
 const observer=await connect();await observer.send({type:'watch',code:hs.code},'state');await host.send({type:'sync'},'state');const revision=host.view.revision;
 assert.equal((await phones[1].command({type:'ck-expansions',expansions:{rudy:true}})).ok,false);assert.equal(phones[1].view.revision,revision);
 for(const expansions of [null,{aLaCartMoreChefs:1},{aLaCart:true},{luckyDuck:1},{rudy:true,forged:true}])assert.equal((await host.command({type:'ck-expansions',expansions})).ok,false);
 const action={type:'ck-expansions',expansions:{luckyDuck:true,rudy:true,aLaCartChefs:true,aLaCartMoreChefs:true}},actionId=randomUUID();const ack=await host.command(action,host.view.revision,actionId);assert.equal(ack.ok,true);
 await observer.wait((m:any)=>m.type==='state'&&m.view.revision===ack.revision);assert.deepEqual(observer.view.expansions,{luckyDuck:true,rudy:true,aLaCartChefs:true,aLaCartMoreChefs:true});assert.equal((await host.command(action,revision,actionId)).revision,ack.revision);
 assert.equal((await host.command({type:'ck-expansions',expansions:{rudy:false}},revision)).ok,false);assert.equal(host.view.expansions!.rudy,true);
 for(const p of peers)p.ws.close();await app.close();app=await startServer(0,'127.0.0.1',true,seeded(981),{storePath:path});url=`http://localhost:${(app.server.address() as any).port}`;
 host=await connect(ownerCookie);await host.send({type:'resume',code:hs.code,token:hs.token},'state');await host.send({type:'sync'},'state');assert.deepEqual(host.view.expansions,{luckyDuck:true,rudy:true,aLaCartChefs:true,aLaCartMoreChefs:true});
 for(let i=0;i<phones.length;i++){const p=await connect(i===0?ownerCookie:guestCookie);await p.send({type:'join',code:hs.code,name:'same identity'},'session');await p.send({type:'sync'},'state');await p.command({type:'ready',ready:true});phones[i]=p;}
 await host.send({type:'sync'},'state');assert.equal((await host.command({type:'start',expansions:{luckyDuck:false}})).ok,false);assert.equal((await host.command({type:'start',restaurateurs:true})).ok,true);assert.deepEqual(host.view.expansions,{luckyDuck:true,rudy:true,aLaCartChefs:true,aLaCartMoreChefs:true});
 assert.equal((await host.command({type:'ck-expansions',expansions:{}})).ok,false);assert.deepEqual(host.view.expansions,{luckyDuck:true,rudy:true,aLaCartChefs:true,aLaCartMoreChefs:true});
 // Finish a valid game, then replay with the same head-chef module and fresh private offers.
 const room=app.rooms.rooms.get(hs.code)!,random=seeded(431);let finished=room.ck!,guard=0;
 while(finished.phase!=='finished'&&guard++<2000){const next=botAction(finished,random);finished=ckRules.applyAction(finished,next.actor,next.action,random);}
 assert.equal(finished.phase,'finished');assert.ok(validateCKState(finished));const oldMatch=finished.matchId;room.ck=finished;
 const replayRevision=room.revision,replayId=randomUUID();assert.equal((await phones[1].command({type:'restart'},replayRevision)).ok,false);
 assert.equal((await host.command({type:'restart'},replayRevision,replayId)).ok,true);assert.equal(room.ck!.phase,'restaurateurs');assert.notEqual(room.ck!.matchId,oldMatch);assert.equal(room.ck!.round,1);
 assert.ok(room.ck!.players.every(p=>p.restaurateur===null&&p.offers.length===2&&p.stars===0));assert.equal(new Set(room.ck!.players.flatMap(p=>p.offers)).size,4);
 const replay=structuredClone(room.ck);assert.equal((await host.command({type:'restart'},replayRevision,replayId)).ok,true);assert.deepEqual(room.ck,replay);
 await phones[0].send({type:'sync'},'state');assert.equal(phones[0].view.me!.offers.length,2);assert.equal((phones[0].view.players[1] as any).offers,undefined);
 assert.equal((await phones[0].command({type:'ck-plan',epoch:phones[0].view.me!.epoch,plan:{mouse:'soup',lizard:'garden',boar:'academy'}})).ok,false);

 }finally{for(const p of peers)p.ws.close();await app.close();await rm(dir,{recursive:true,force:true});}
});
