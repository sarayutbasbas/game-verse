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
        assert.ok(host.view.players.every(p => p.plan));
        assert.equal((await spectator.send({ type: 'command', id: 'spectator-action-123', revision: host.view.revision, action: { type: 'ck-run' } }, 'error')).type, 'error');
        assert.equal((await host.command({ type: 'ck-run' })).ok, true);
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
