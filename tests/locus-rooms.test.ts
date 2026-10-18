import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import WebSocket from 'ws';
import { startServer } from '../src/server/index.js';
import * as rules from '../src/games/locus/engine.js';
import { validateLocusState } from '../src/games/locus/validation.js';
import type { LocusView } from '../src/games/locus/types.js';
import { seeded, botAction } from './locus-fixtures.js';
class Peer {
    messages: any[] = [];
    ws!: WebSocket;
    sent: number[] = [];
    async connect(url: string, cookie = '') { this.ws = new WebSocket(url.replace('http', 'ws') + '/ws', { origin: url, headers: { Cookie: cookie } }); this.ws.on('message', raw => this.messages.push(JSON.parse(String(raw)))); await new Promise<void>((r, j) => { this.ws.once('open', r); this.ws.once('error', j); }); return this; }
    async wait(pred: (m: any) => boolean, from = 0) { for (let i = 0; i < 1200; i++) {
        const m = this.messages.slice(from).find(pred);
        if (m)
            return m;
        await new Promise(r => setTimeout(r, 5));
    } throw Error('Protocol timeout'); }
    async send(m: unknown, type: string) { this.sent = this.sent.filter(t => t > Date.now() - 10000); if (this.sent.length >= 28)
        await new Promise(r => setTimeout(r, this.sent[0] + 10030 - Date.now())); this.sent.push(Date.now()); const from = this.messages.length; this.ws.send(JSON.stringify(m)); return this.wait(m => m.type === type, from); }
    get view(): LocusView { return this.messages.filter(m => m.type === 'state').at(-1)?.view; }
    async command(action: unknown, revision = this.view.revision, id = randomUUID()) { const ack = await this.send({ type: 'command', id, revision, action }, 'ack'); await this.wait(m => m.type === 'state' && m.view.revision >= ack.revision); return ack; }
}
test('Locus actual WS: authenticated picks, commuting personal intents, receipts, bonus recovery, privacy and final durable scores', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'locus-room-')), path = join(dir, 'db.sqlite');
    let app = await startServer(0, '127.0.0.1', true, seeded(32), { storePath: path }), url = `http://localhost:${(app.server.address() as any).port}`;
    const peers: Peer[] = [];
    const make = async (cookie = '') => { const p = await new Peer().connect(url, cookie); peers.push(p); return p; };
    const identity = async (member = false) => { const r = await fetch(url + '/api/auth/sign-in/anonymous', { method: 'POST', headers: { Origin: url, 'Content-Type': 'application/json' }, body: '{}' }), data = await r.json(); if (member)
        await (await app.auth.$context).internalAdapter.updateUser(data.user.id, { isAnonymous: false }); return r.headers.getSetCookie().map(c => c.split(';')[0]).join('; '); };
    try {
        const cookies = [await identity(true), await identity(), await identity()];
        let host = await make(cookies[0]);
        const hs = await host.send({ type: 'create', gameId: 'locus', displayMode: 'full-mobile' }, 'session'), code = hs.code;
        let phones: Peer[] = [];
        const ids: string[] = [], tokens: string[] = [];
        for (let i = 0; i < 3; i++) {
            const p = await make(cookies[i]), session = await p.send({ type: 'join', code, name: 'ชื่อเหมือนกัน' }, 'session');
            phones.push(p);
            ids.push(session.playerId);
            tokens.push(session.token);
            await p.send({ type: 'sync' }, 'state');
            assert.equal((await p.command({ type: 'ready', ready: true })).ok, true);
        }
        let display = await make();
        await display.send({ type: 'watch', code }, 'state');
        await host.send({ type: 'sync' }, 'state');
        assert.equal((await phones[1].command({ type: 'start' })).ok, false);
        assert.equal((await host.command({ type: 'start', startingPlayerId: ids[0] })).ok, true);
        assert.equal(host.view.defaultMode, 'full-mobile');
        await phones[1].send({ type: 'sync' }, 'state');
        assert.equal((await phones[1].command({ type: 'locus-pick', slot: 1, epoch: phones[1].view.me!.legal.epoch })).ok, false);
        assert.equal((await host.command({ type: 'locus-pick', slot: 1, epoch: phones[0].view.me!.legal.epoch })).ok, false);
        for (let i = 0; i < 3; i++) {
            await phones[i].send({ type: 'sync' }, 'state');
            assert.equal((await phones[i].command({ type: 'locus-pick', slot: i + 1, epoch: phones[i].view.me!.legal.epoch })).ok, true);
        }
        const state = app.rooms.rooms.get(code)!.locus!, old = host.view.revision, actions = ids.map(id => { const p = state.players.find(p => p.id === id)!; return { type: 'locus-discard', effect: p.effects[0].id, epoch: rules.decisionKey(state, id) }; });
        for (let i = 0; i < 3; i++)
            assert.equal((await phones[i].command(actions[i], old)).ok, true, 'independent effects commute');
        assert.equal((await phones[0].command(actions[0], old)).ok, false, 'old own epoch fails');
        const paid = { type: 'locus-coin-blocks', epoch: phones[0].view.me!.legal.epoch }, receipt = randomUUID(), before = phones[0].view.revision;
        assert.equal((await phones[0].command(paid, before, receipt)).ok, true);
        const saved = structuredClone(app.rooms.rooms.get(code)!.locus);
        assert.equal((await phones[0].command(paid, before, receipt)).ok, true);
        assert.deepEqual(app.rooms.rooms.get(code)!.locus, saved);
        const restart = async () => { const saved = structuredClone(app.rooms.rooms.get(code)!.locus); await app.close(); app = await startServer(0, '127.0.0.1', true, seeded(800), { storePath: path }); url = `http://localhost:${(app.server.address() as any).port}`; assert.equal(app.store.quarantined.length, 0); assert.deepEqual(app.rooms.rooms.get(code)!.locus, saved); phones = []; for (let i = 0; i < 3; i++) {
            const p = await make(cookies[i]);
            await p.send({ type: 'resume', code, token: tokens[i] }, 'state');
            phones.push(p);
        } host = await make(cookies[0]); await host.send({ type: 'resume', code, token: hs.token }, 'state'); display = await make(); await display.send({ type: 'watch', code }, 'state'); return saved; };
        await restart();
        assert.equal(phones[0].view.me!.legal.effects.length, 2);
        const snapshot = structuredClone(app.rooms.rooms.get(code)!.locus);
        assert.equal((await phones[1].command({ ...paid, epoch: phones[0].view.me!.legal.epoch })).ok, false);
        assert.deepEqual(app.rooms.rooms.get(code)!.locus, snapshot);
        let count = 0, bonusRecovered = false;
        while (app.rooms.rooms.get(code)!.locus!.phase !== 'finished' && count++ < 1800) {
            const s = app.rooms.rooms.get(code)!.locus!;
            let actionFound = false;
            for (let i = 0; i < 3; i++) {
                const a = botAction(s, ids[i]);
                if (a) {
                    const ack = await phones[i].command(a, host.view.revision);
                    assert.equal(ack.ok, true, ack.error);
                    actionFound = true;
                    break;
                }
            }
            assert.ok(actionFound);
            if (!bonusRecovered && app.rooms.rooms.get(code)!.locus!.players.some(p => p.effects.some(e => e.kind === 'bonus'))) {
                const before = await restart();
                assert.deepEqual(app.rooms.rooms.get(code)!.locus, before);
                bonusRecovered = true;
            }
        }
        assert.ok(count < 1800);
        assert.ok(bonusRecovered);
        const final = app.rooms.rooms.get(code)!.locus!;
        assert.ok(validateLocusState(final));
        assert.ok(final.results?.length === 3);
        await restart();
        assert.equal(host.view.phase, 'finished');
        for (const peer of peers)
            for (const m of peer.messages.filter(m => m.type === 'state' && m.view.gameId === 'locus')) {
                assert.equal(m.view.deck, undefined);
                assert.equal(m.view.sessions, undefined);
                assert.equal(m.view.effectSerial, undefined);
                if (peer === display)
                    assert.equal(m.view.me, undefined);
            }
        assert.equal((await display.send({ type: 'command', id: randomUUID(), revision: host.view.revision, action: { type: 'restart' } }, 'error')).type, 'error');
        assert.equal((await phones[1].command({ type: 'restart' })).ok, false);
        assert.equal((await host.command({ type: 'restart' })).ok, true);
        assert.equal(host.view.phase, 'playing');
        assert.ok(host.view.players.every(p => p.coins === 1 && Object.values(p.sheet).flat().length === 0));
    }
    finally {
        for (const p of peers)
            p.ws.close();
        await app.close();
        await rm(dir, { recursive: true, force: true });
    }
});
