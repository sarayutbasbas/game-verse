import * as locusRules from "../games/locus/engine.js";
import type {LocusState,LocusAction,LocusView} from "../games/locus/types.js";
import * as ckRules from "../games/critter-kitchen/engine.js";
import type {CKState,CKAction,CKView,DisplayMode} from "../games/critter-kitchen/types.js";
import * as skyRules from "../games/sky-team/engine.js";
import type {SkyState,SkyAction,SkyView} from "../games/sky-team/types.js";
import * as harmoniesRules from "../games/harmonies/engine.js";
import type {HarmoniesState,HarmoniesAction,HarmoniesView} from "../games/harmonies/types.js";
import * as pixiesRules from "../games/pixies/engine.js";
import type {PixiesState,PixiesAction,PixiesView} from "../games/pixies/types.js";
import * as jaipurRules from "../games/jaipur/engine.js";
import type {JaipurState,JaipurAction,JaipurView} from "../games/jaipur/types.js";
import * as wondersRules from "../games/seven-wonders-duel/engine.js";
import type { WondersState, WondersAction, WondersView } from "../games/seven-wonders-duel/types.js";
import * as calicoRules from "../games/calico/engine.js";
import type { CalicoState, CalicoView, CalicoAction } from "../games/calico/types.js";
import {
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import type { WebSocket } from "ws";
import { games, gameAdapters } from "../games/registry.js";
import type {
  Action,
  ClientMessage,
  ServerMessage,
  View,
  RoomView,
  GameId,
  PublicEvent,
} from "../shared/types.js";
import type { GameState } from "../games/camel-up/engine.js";
import * as azulRules from "../games/azul/engine.js";
import type { AzulState, AzulAction, AzulView } from "../games/azul/types.js";
const azulEngine = gameAdapters.azul;
const engine = gameAdapters["camel-up"];
const duelEngine = gameAdapters["dracula-vs-van-helsing"];
import {
  ROLES,
  type Character,
  type DuelState,
  type DuelAction,
  type DuelView,
} from "../games/dracula-vs-van-helsing/types.js";
import { metadata } from "../shared/catalog.js";
import type { PlatformStore } from "./store.js";
import type { Principal } from "./auth.js";
export const ROOM_IDLE_MS = 10 * 60 * 60 * 1000;
type Ack = Extract<ServerMessage, { type: "ack" }>;
interface Session {
  userId?: string;
  guest?: boolean;
  token: string;
  role: "host" | "player";
  playerId?: string;
  receipts: Map<string, Ack>;
}
interface Room {
  ownerId?: string;
  legacy?: boolean;
  rulesVersion?: string;
  schemaVersion?: number;
  code: string;
  gameId: GameId;
  duel?: DuelState;
  azul?: AzulState;
  calico?: CalicoState;
  wonders?: WondersState;
  jaipur?: JaipurState;
  pixies?: PixiesState;
  harmonies?: HarmoniesState;
  harmoniesMode?:DisplayMode;
  sky?: SkyState;
  locus?:LocusState;
  locusMode?:DisplayMode;
  ck?:CKState;
  ckMode?:DisplayMode;
  calicoPreset?: "standard" | "first";
  revision: number;
  players: {
    id: string;
    name: string;
    userId?: string;
    avatar?: string | null;
    character?: Character;
    ready?: boolean;
  }[];
  sessions: Session[];
  sockets: Map<WebSocket, Session | undefined>;
  game?: GameState;
  event?: PublicEvent;
  updated: number;
}
export class RoomService {
  rooms = new Map<string, Room>();
  private attached = new Map<WebSocket, Room>();
  private principal = new Map<WebSocket, Principal>();
  private queued?: { ws: WebSocket; message: ServerMessage<RoomView> }[];
  private connections = new Map<WebSocket, string>();
  private presence = new Map<string, string>();
  private pollFingerprints = new Map<string, string>();
  private coordinate(fn: () => void) {
    this.store!.transaction(() => {
      this.restore(this.store!.loadRooms());
      this.presence = new Map(this.store!.db.prepare("SELECT token,connection_id FROM gv_presence WHERE expires_at>?").all(Date.now()).map(r => [String(r.token), String(r.connection_id)]));
      this.expireRooms(Date.now());
      fn();
    });
  }
  private connected(room: Room, playerId: string) {
    return this.store?.distributed ? room.sessions.some(s => s.playerId === playerId && this.presence.has(s.token)) : [...room.sockets.values()].some(s => s?.playerId === playerId);
  }
  /** Cross-instance delivery. Only public projections are sent to public sockets. */
  poll() {
    if (!this.store?.distributed || !this.attached.size) return;
    this.coordinate(() => {
      for (const [ws, id] of this.connections) {
        const room = this.attached.get(ws), session = room?.sockets.get(ws);
        if (!room || !session) continue;
        const principal=this.principal.get(ws);
        if (principal && (principal.expiresAt<=Date.now() || !this.store!.db.prepare('SELECT 1 FROM session WHERE id=? AND userId=?').get(principal.sessionId,principal.id))) {
          this.detach(ws);this.store!.afterCommit(()=>ws.close(4003,"signed out"));continue;
        }
        if (this.presence.get(session.token) !== id) {
          room.sockets.delete(ws); this.attached.delete(ws); this.connections.delete(ws);
          const replaced=this.presence.has(session.token);
          this.store!.afterCommit(() => ws.close(replaced?4001:1012, replaced?"session replaced":"presence expired; reconnect"));
        } else this.store!.db.prepare("UPDATE gv_presence SET expires_at=? WHERE token=? AND connection_id=?").run(Date.now()+15000,session.token,id);
      }
      for (const room of this.rooms.values()) if (room.sockets.size) {
        const key = JSON.stringify([room.revision, room.players, room.sessions.map(s => [s.playerId, this.presence.has(s.token)])]);
        if (this.pollFingerprints.get(room.code) !== key) { this.pollFingerprints.set(room.code,key); this.broadcast(room); }
      }
    });
  }
  constructor(
    private random = () => randomInt(0, 0x100000000) / 0x100000000,
    private store?: PlatformStore,
    private requireAccount = false,
  ) {
    if (store) { this.restore(store.loadRooms()); this.sweep(); }
  }
  exportRooms() {
    return [...this.rooms.values()].map((r) => ({
      ...r,
      sockets: undefined,
      sessions: r.sessions.map((s) => ({ ...s, receipts: [...s.receipts] })),
    }));
  }
  private restore(saved: any[]) {
    const connections = new Map(
      [...this.rooms].map(([code, r]) => [
        code,
        [...r.sockets].map(([ws, s]) => ({ ws, token: s?.token })),
      ]),
    );
    this.rooms.clear();
    this.attached.clear();
    for (const r of saved) {
      r.sockets = new Map();
      r.sessions = r.sessions.map((s: any) => ({
        ...s,
        receipts: new Map(s.receipts),
      }));
      this.rooms.set(r.code, r);
      for (const c of connections.get(r.code) ?? []) {
        r.sockets.set(
          c.ws,
          r.sessions.find((s: Session) => s.token === c.token),
        );
        this.attached.set(c.ws, r);
      }
    }
    if (this.store?.distributed) for (const [code, clients] of connections) {
      if (!this.rooms.has(code)) for (const {ws} of clients) {
        this.connections.delete(ws);
        this.store.afterCommit(() => {
          if (ws.readyState===1) ws.send(JSON.stringify({type:"error",error:"ห้องปิดหรือออกจากห้องแล้ว"}));
          ws.close(4004,"room closed");
        });
      }
    }
  }
  handle(ws: WebSocket, raw: unknown, principal?: Principal): void {
    if (!this.store?.distributed) this.expireRooms(Date.now());
    if (this.store?.distributed && !this.store.locked) {
      try { this.coordinate(() => this.handle(ws,raw,principal)); }
      catch { ws.close(1011,"storage unavailable; reconnect"); }
      return;
    }
    const connectionId = this.connections.get(ws), currentRoom = this.attached.get(ws), currentSession = currentRoom?.sockets.get(ws);
    if (this.store?.distributed && currentSession && this.presence.get(currentSession.token) !== connectionId) { ws.close(this.presence.has(currentSession.token)?4001:1012,"session changed; reconnect"); return; }
    if (principal) this.principal.set(ws, principal);
    else this.principal.delete(ws);
    if (!this.store) {
      this.handleInner(ws, raw);
      return;
    }
    const before = structuredClone(this.exportRooms());
    this.queued = [];
    try {
      this.store.transaction(() => {
        this.handleInner(ws, raw);
        this.store!.saveRooms(this.exportRooms());
      });
      const messages = this.queued;
      this.queued = undefined;
      for (const m of messages) this.send(m.ws, m.message);
    } catch {
      if (this.store.distributed) { this.queued = undefined; throw Error("Room transaction failed"); }
      this.queued = undefined;
      this.restore(before);
      const r = this.attached.get(ws);
      console.error(
        JSON.stringify({
          event: "room_commit_failed",
          correlationId: randomUUID(),
          gameId: r?.gameId,
          rulesVersion: r?.rulesVersion,
          phase: r?.game?.phase ?? r?.duel?.phase ?? r?.azul?.phase ?? r?.calico?.phase ?? r?.wonders?.phase ?? r?.jaipur?.phase ?? r?.locus?.phase ?? r?.ck?.phase ?? r?.sky?.phase ?? r?.harmonies?.phase ?? r?.pixies?.phase ?? "lobby",
          revision: r?.revision,
        }),
      );
      this.send(ws, {
        type: "error",
        error: "บันทึกไม่สำเร็จ สถานะยังไม่เปลี่ยน กรุณาลองใหม่",
      });
      if (r)
        this.send(ws, {
          type: "state",
          view: this.projection(r, r.sockets.get(ws)),
          snapshot: true,
        });
    }
  }
  active(userId: string) {
    if (!this.store?.distributed) this.expireRooms(Date.now());
    if (this.store?.distributed && !this.store.locked) this.coordinate(() => {});
    return [...this.rooms.values()]
      .filter(
        (r) =>
          r.ownerId === userId || r.players.some((p) => p.userId === userId),
      )
      .map((r) => ({
        code: r.code,
        gameId: r.gameId,
        phase: r.game?.phase ?? r.duel?.phase ?? r.azul?.phase ?? r.calico?.phase ?? r.wonders?.phase ?? r.jaipur?.phase ?? r.locus?.phase ?? r.ck?.phase ?? r.sky?.phase ?? r.harmonies?.phase ?? r.pixies?.phase ?? "lobby",
        owner: r.ownerId === userId,
        player: r.players.some((p) => p.userId === userId),
      }));
  }
  revokeSession(sessionId: string) {
    for (const [ws, p] of this.principal)
      if (p.sessionId === sessionId) {
        this.disconnect(ws);
        ws.close(4003, "signed out");
      }
  }
  updateProfile(
    userId: string,
    name: string | undefined,
    avatar: string | null | undefined,
    write?: () => void,
  ): void {
    if (this.store?.distributed && !this.store.locked) return this.coordinate(() => this.updateProfile(userId,name,avatar,write));
    const before = structuredClone(this.exportRooms());
    try {
      this.store?.transaction(() => {
        write?.();
        for (const r of this.rooms.values())
          for (const p of r.players)
            if (p.userId === userId) {
              if (name !== undefined) p.name = name;
              if (avatar !== undefined) p.avatar = avatar;
            }
        this.store!.saveRooms(this.exportRooms());
      });
    } catch (e) {
      this.restore(before);
      throw e;
    }
    // Cosmetic updates keep revision/event unchanged; never replay game actions.
    for (const r of this.rooms.values())
      if (r.players.some((p) => p.userId === userId)) this.broadcast(r);
  }
  linkGuest(
    oldId: string,
    newId: string,
    profile?: { name: string; avatar: string | null },
  ): void {
    if (this.store?.distributed && !this.store.locked) return this.coordinate(() => this.linkGuest(oldId,newId,profile));
    if (oldId === newId) return;
    for (const r of this.rooms.values())
      if (
        r.players.some((p) => p.userId === oldId) &&
        r.players.some((p) => p.userId === newId)
      )
        throw Error(
          "บัญชีนี้มีที่นั่งในห้องเดียวกันแล้ว กรุณาจบเกมหรือออกจากห้องรอก่อนเชื่อมบัญชี",
        );
    const before = structuredClone(this.exportRooms());
    try {
      this.store!.transaction(() => {
        for (const r of this.rooms.values()) {
          for (const p of r.players)
            if (p.userId === oldId) {
              p.userId = newId;
              if (profile) {
                p.name = profile.name;
                p.avatar = profile.avatar;
              }
            }
          for (const s of r.sessions)
            if (s.userId === oldId) {
              s.userId = newId;
              s.guest = false;
            }
        }
        this.store!.db.prepare(
          "INSERT INTO gv_links VALUES(?,?) ON CONFLICT(guest_id) DO UPDATE SET user_id=excluded.user_id",
        ).run(oldId, newId);
        this.store!.saveRooms(this.exportRooms());
        this.store!.db.prepare(
          "INSERT INTO gv_recent SELECT ?,game_id,started_at FROM gv_recent WHERE user_id=? ON CONFLICT(user_id,game_id) DO UPDATE SET started_at=MAX(started_at,excluded.started_at)",
        ).run(newId, oldId);
      });
    } catch (e) {
      this.restore(before);
      throw e;
    }
  }
  leave(userId: string, code: string, close = false): void {
    if (this.store?.distributed && !this.store.locked) return this.coordinate(() => this.leave(userId,code,close));
    const r = this.rooms.get(code);
    if (!r) throw Error("ไม่พบห้อง");
    if (close && r.ownerId !== userId)
      throw Error("ผู้สร้างห้องเท่านั้นที่ปิดห้องได้");
    if (!close && (r.game || r.duel || r.azul || r.calico || r.wonders || r.jaipur || r.pixies || r.harmonies || r.sky || r.ck || r.locus))
      throw Error(
        "เกมเริ่มแล้ว ที่นั่งยังเก็บไว้ให้กลับมาเล่น ออกถาวรได้ในห้องรอ",
      );
    const before = structuredClone(this.exportRooms());
    try {
      this.store!.transaction(() => {
        if (close) {
          this.store!.db.prepare("DELETE FROM gv_rooms WHERE code=?").run(code);
          this.rooms.delete(code);
        } else {
          const ids = r.players
            .filter((p) => p.userId === userId)
            .map((p) => p.id);
          if (!ids.length) throw Error("คุณไม่ได้อยู่ในห้องนี้");
          r.players = r.players.filter((p) => p.userId !== userId);
          r.sessions = r.sessions.filter(
            (s) => !ids.includes(s.playerId ?? ""),
          );
          r.revision++;
          this.store!.saveRooms(this.exportRooms());
        }
      });
    } catch (e) {
      this.restore(before);
      throw e;
    }
    for (const [ws, s] of r.sockets)
      if (close || s?.userId === userId) {
        this.send(ws, { type: "error", error: "ห้องปิดหรือออกจากห้องแล้ว" });
        this.attached.delete(ws);
        r.sockets.delete(ws);
        ws.close(4004, "left room");
      }
    if (!close) this.broadcast(r, true);
  }
  private send(ws: WebSocket, message: ServerMessage<RoomView>) {
    if (this.queued) {
      this.queued.push({ ws, message });
      return;
    }
    const send = () => { if (ws.readyState === 1) ws.send(JSON.stringify(message)); };
    if (this.store) this.store.afterCommit(send); else send();
  }
  private detach(ws: WebSocket) {
    const old = this.attached.get(ws);
    if (old) {
      const session = old.sockets.get(ws), id = this.connections.get(ws);
      if (this.store?.distributed && session && id) {
        this.store.db.prepare("DELETE FROM gv_presence WHERE token=? AND connection_id=?").run(session.token,id);
        if (this.presence.get(session.token) === id) this.presence.delete(session.token);
      }
      this.connections.delete(ws);
      old.sockets.delete(ws);
      this.attached.delete(ws);
      this.broadcast(old);
    }
  }
  disconnect(ws: WebSocket): void {
    if (this.store?.distributed && !this.store.locked) return this.coordinate(() => this.disconnect(ws));
    this.detach(ws);
    this.principal.delete(ws);
  }
  private attach(ws: WebSocket, room: Room, session?: Session) {
    this.detach(ws);
    // One live transport per authenticated session; old phones may resume again.
    if (session)
      for (const [other, s] of room.sockets)
        if (s === session) {
          room.sockets.delete(other);
          this.attached.delete(other);
          other.close(4001, "session replaced");
        }
    room.sockets.set(ws, session);
    this.attached.set(ws, room);
    if (this.store?.distributed && session) {
      const id = randomUUID(); this.connections.set(ws,id);
      this.store.db.prepare("INSERT INTO gv_presence VALUES(?,?,?) ON CONFLICT(token) DO UPDATE SET connection_id=excluded.connection_id,expires_at=excluded.expires_at").run(session.token,id,Date.now()+15000);
      this.presence.set(session.token,id);
    }
    this.broadcast(room, true);
  }
  private projection(room: Room, session?: Session): RoomView {
    const connected = new Set(
      this.store?.distributed ? room.sessions.filter(s => this.presence.has(s.token)).map(s => s.playerId) : [...room.sockets.values()].map((s) => s?.playerId),
    );
    if(room.gameId==="locus"){
      const seats=room.players.length>=2?room.players:[...room.players,...Array.from({length:2-room.players.length},(_,i)=>({id:"placeholder"+i,name:"รอผู้เล่น"}))];
      const state=room.locus??locusRules.createInitialState(seats,()=>.5);
      const base:LocusView=locusRules.getDisplayView(state,room.code,room.revision,room.locusMode??"shared-table");
      if(!room.locus){base.phase="lobby";base.players=base.players.filter(p=>room.players.some(x=>x.id===p.id));for(const p of base.players)p.ready=!!room.players.find(x=>x.id===p.id)?.ready;}
      for(const p of base.players){const profile=room.players.find(x=>x.id===p.id)!;p.name=profile.name;p.avatar=profile.avatar;p.connected=connected.has(p.id);}
      if(session?.role==="player"){base.me=locusRules.getPlayerView(state,session.playerId!);base.me.canManage=this.canManage(room,session);}
      return base;
    }
    if(room.gameId==="critter-kitchen"){
      const seats=room.players.length>=2?room.players:[...room.players,...Array.from({length:2-room.players.length},(_,i)=>({id:"placeholder"+i,name:"รอผู้เล่น"}))];
      const state=room.ck??ckRules.createInitialState(seats,()=>.5);
      const base:CKView=ckRules.getDisplayView(state,room.code,room.revision,room.ckMode??"shared-table");
      if(!room.ck){base.phase="lobby";base.players=base.players.filter(p=>room.players.some(x=>x.id===p.id));for(const p of base.players)p.ready=!!room.players.find(x=>x.id===p.id)?.ready;}
      for(const p of base.players){const profile=room.players.find(x=>x.id===p.id)!;p.name=profile.name;p.avatar=profile.avatar;p.connected=connected.has(p.id);}
      if(session?.role==="player"){base.me=ckRules.getPlayerView(state,session.playerId!);base.me.canManage=this.canManage(room,session);}
      return base;
    }
    if(room.gameId==="sky-team"){
      const state=room.sky??skyRules.createInitialState([{id:room.players[0]?.id??"pilot",name:room.players[0]?.name??"Pilot"},{id:room.players[1]?.id??"copilot",name:room.players[1]?.name??"Co-pilot"}]);
      const base:SkyView=skyRules.getDisplayView(state,room.code,room.revision);
      if(!room.sky){base.phase="lobby";base.players=room.players.map((p,i)=>({id:p.id,name:p.name,role:i===0?"pilot":"copilot",ready:!!p.ready}));}
      for(const p of base.players){const profile=room.players.find(x=>x.id===p.id)!;p.name=profile.name;p.avatar=profile.avatar;p.connected=connected.has(p.id);}
      if(session?.role==="player"){base.me=room.sky?skyRules.getPlayerView(room.sky,session.playerId!):{id:session.playerId!,role:room.players[0]?.id===session.playerId?"pilot":"copilot",dice:[],legal:[],ready:false,rerollSubmitted:false};base.me.canManage=this.canManage(room,session);}
      return base;
    }
    if(room.gameId==="harmonies"){
      const base:HarmoniesView=room.harmonies?harmoniesRules.getDisplayView(room.harmonies,room.code,room.revision):{gameId:"harmonies",code:room.code,revision:room.revision,phase:"lobby",side:"A",players:room.players.map(p=>({id:p.id,name:p.name,board:[],cards:[],score:harmoniesRules.scorePlayer(harmoniesRules.emptyPlayer(p.id,p.name),"A"),ready:!!p.ready}))};
      for(const p of base.players){const profile=room.players.find(x=>x.id===p.id)!;p.name=profile.name;p.avatar=profile.avatar;p.connected=connected.has(p.id);}
      if(session?.role==="player")base.me=room.harmonies?harmoniesRules.getPlayerView(room.harmonies,session.playerId!):{id:session.playerId!,habitats:[],legal:[]};
      base.displayMode=room.harmoniesMode??"full-mobile";
      base.canConfigureDisplay=!!session&&this.canManage(room,session);
      if(session?.role==="host"&&base.canConfigureDisplay&&base.displayMode==="shared-table"&&room.harmonies?.phase==="playing"){
        const state=room.harmonies;const actor=state.players[state.turn].id;
        base.displayControl=harmoniesRules.getPlayerView(state,actor);
      }
      if(base.me)base.me.canManage=this.canManage(room,session!);return base;
    }
    if(room.gameId==="pixies"){
      const base:PixiesView=room.pixies?pixiesRules.getDisplayView(room.pixies,room.code,room.revision):{gameId:"pixies",code:room.code,revision:room.revision,phase:"lobby",players:room.players.map(p=>({id:p.id,name:p.name,grid:[],scores:[],total:0,score:pixiesRules.scorePlayer(pixiesRules.emptyPlayer(p.id,p.name),1),ready:!!p.ready}))};
      for(const p of base.players){const profile=room.players.find(x=>x.id===p.id)!;p.name=profile.name;p.avatar=profile.avatar;p.connected=connected.has(p.id);}
      if(session?.role==="player")base.me=room.pixies?pixiesRules.getPlayerView(room.pixies,session.playerId!):{id:session.playerId!,offers:[],legal:[]};
      if(base.me)base.me.canManage=this.canManage(room,session!);return base;
    }
    if(room.gameId==="jaipur"){
      const base:JaipurView=room.jaipur?jaipurRules.getDisplayView(room.jaipur,room.code,room.revision):{gameId:"jaipur",code:room.code,revision:room.revision,phase:"lobby",players:room.players.map(p=>({id:p.id,name:p.name,handCount:0,herdCount:0,goodsCount:0,bonusCount:0,seals:0,ready:!!p.ready}))};
      for(const p of base.players){const profile=room.players.find(x=>x.id===p.id)!;p.name=profile.name;p.avatar=profile.avatar;p.connected=connected.has(p.id);}
      if(session?.role==="player")base.me=room.jaipur?jaipurRules.getPlayerView(room.jaipur,session.playerId!):{id:session.playerId!,hand:[],herd:[],goods:[],bonus:[],subtotal:0,exchanges:[],sell:[],take:[],legal:[{type:"ready",ready:!room.players.find(p=>p.id===session.playerId)?.ready}]};
      if(base.me)base.me.canManage=this.canManage(room,session!);return base;
    }
    if (room.gameId === "seven-wonders-duel") {
      const base: WondersView=room.wonders?wondersRules.getDisplayView(room.wonders,room.code,room.revision):{gameId:"seven-wonders-duel",code:room.code,revision:room.revision,phase:"lobby",players:room.players.map(p=>({...wondersRules.emptyPlayer(p.id,p.name),ready:!!p.ready}))};
      for(const p of base.players){const profile=room.players.find(x=>x.id===p.id)!;p.name=profile.name;p.avatar=profile.avatar;p.connected=connected.has(p.id);}
      if(session?.role==="player")base.me=room.wonders?wondersRules.getPlayerView(room.wonders,session.playerId!):{id:session.playerId!,offers:[],legal:[{type:"ready",ready:!room.players.find(p=>p.id===session.playerId)?.ready}]};
      if(base.me)base.me.canManage=this.canManage(room,session!);return base;
    }
    if (room.gameId === "calico") {
      const base: CalicoView = room.calico ? calicoRules.getDisplayView(room.calico, room.code, room.revision) : {
        gameId:"calico",code:room.code,revision:room.revision,phase:"lobby",preset:room.calicoPreset??"standard",
        players:room.players.map((p,i)=>{const {options:_,draft:__,...publicPlayer}=calicoRules.emptyPlayer(p.id,p.name,i);return {...publicPlayer,ready:!!p.ready,connected:false};}),
      };
      for(const p of base.players){const profile=room.players.find(x=>x.id===p.id)!;p.name=profile.name;p.avatar=profile.avatar;p.connected=connected.has(p.id);}
      if(session?.role==="player")base.me=room.calico?calicoRules.getPlayerView(room.calico,session.playerId!):{id:session.playerId!,options:[],draft:[],legal:[{type:"ready",ready:!room.players.find(p=>p.id===session.playerId)?.ready}]};
      if(base.me)base.me.canManage=this.canManage(room,session!);
      return base;
    }
    if (room.gameId === "azul") {
      const base: AzulView = room.azul ? azulEngine.publicView(room.azul, room.code, room.revision) : {
        gameId: "azul", code: room.code, revision: room.revision, phase: "lobby",
        players: room.players.map(p => ({ ...azulRules.emptyBoard(p.id, p.name), ready: !!p.ready, connected: false })),
      };
      for (const p of base.players) {
        const profile = room.players.find(x => x.id === p.id)!;
        p.name = profile.name; p.avatar = profile.avatar; p.connected = connected.has(p.id);
      }
      if (session?.role === "player") base.me = room.azul ? azulEngine.privateView(room.azul, session.playerId!) : {
        id: session.playerId!, offers: [], legal: [{ type: "ready", ready: !room.players.find(p => p.id === session.playerId)?.ready }],
      };
      if (base.me) base.me.canManage = this.canManage(room, session!);
      return base;
    }
    if (room.gameId === "dracula-vs-van-helsing") {
      const base: DuelView = room.duel
        ? duelEngine.publicView(room.duel, room.code, room.revision)
        : {
            gameId: room.gameId,
            code: room.code,
            revision: room.revision,
            phase: "lobby",
            players: room.players.map((p) => ({
              id: p.id,
              name: p.name,
              character: p.character,
              ready: !!p.ready,
              connected: false,
            })),
          };
      base.players.forEach((p) => {
        p.connected = connected.has(p.id);
        const profile = room.players.find((x) => x.id === p.id);
        if (profile) {
          p.name = profile.name;
          p.avatar = profile.avatar;
        }
      });
      if (room.duel)
        base.event = {
          revision: room.revision,
          round: room.duel.round,
          kind: room.duel.lastEvent ?? room.duel.phase,
          serial: room.duel.actionSerial ?? 0,
          reveal: room.duel.phase !== "playing" ? base.result : undefined,
        };
      if (session?.role === "player")
        base.me = room.duel
          ? duelEngine.privateView(room.duel, session.playerId!)
          : {
              id: session.playerId!,
              cards: [],
              legal: [
                ...ROLES.filter(
                  (r) =>
                    !room.players.some(
                      (p) => p.id !== session.playerId && p.character === r,
                    ),
                ).map((character) => ({
                  type: "choose-role" as const,
                  character,
                })),
                {
                  type: "ready",
                  ready: !room.players.find((p) => p.id === session.playerId)
                    ?.ready,
                },
              ],
            };
      if (base.me) base.me.canManage = this.canManage(room, session!);
      return base;
    }
    const base: View = room.game
      ? engine.publicView(room.game, room.code, room.revision)
      : {
          gameId: "camel-up",
          code: room.code,
          phase: "lobby",
          revision: room.revision,
          players: room.players.map((p) => ({
            id: p.id,
            name: p.name,
            avatar: p.avatar,
            money: 3,
            tickets: [],
            pyramids: 0,
            connected: false,
          })),
        };
    base.event = room.event;
    base.players.forEach((p) => {
      p.connected = connected.has(p.id);
      const profile = room.players.find((x) => x.id === p.id);
      if (profile) {
        p.name = profile.name;
        p.avatar = profile.avatar;
      }
    });
    if (session?.role === "player" && room.game)
      base.me = engine.privateView(room.game, session.playerId!);
    else if (session?.role === "player")
      base.me = { id: session.playerId!, cards: [], bets: [], legal: [] };
    if (base.me) base.me.canManage = this.canManage(room, session!);
    return base;
  }
  /** Internal snapshot delivery; never exposed as an unauthenticated HTTP action. */
  syncRoom(code: string) {
    const room = this.rooms.get(code);
    if (room) this.broadcast(room, true);
  }
  private broadcast(room: Room, snapshot = false) {
    for (const [ws, session] of room.sockets) {
      const p = this.principal.get(ws);
      if (
        session?.role === "player" &&
        session.userId &&
        (!p || p.id !== session.userId || p.expiresAt <= Date.now())
      ) {
        ws.close(4003, "session expired");
        continue;
      }
      this.send(ws, {
        type: "state",
        view: this.projection(room, session),
        snapshot,
      });
    }
  }
  private handleInner(ws: WebSocket, raw: unknown) {
    try {
      if (!raw || typeof raw !== "object" || Array.isArray(raw))
        throw Error("คำสั่งไม่ถูกต้อง กรุณาโหลดหน้าใหม่");
      const m = raw as ClientMessage;
      const account = this.principal.get(ws);
      const attached = this.attached.get(ws),
        ownSession = attached?.sockets.get(ws);
      if (
        ownSession?.role === "player" &&
        ownSession.userId &&
        ownSession.userId !== account?.id
      ) {
        ws.close(4003, "signed out");
        throw Error("เซสชันบัญชีเปลี่ยนแล้ว กรุณาล็อกอินอีกครั้ง");
      }
      if (m.type === "create") {
        if (this.requireAccount && (!account || account.guest))
          throw Error("กรุณาล็อกอิน Google ก่อนสร้างห้อง");
        if(m.displayMode!==undefined&&(!["critter-kitchen","locus"].includes(m.gameId??"")||!["shared-table","full-mobile"].includes(m.displayMode)))throw Error("รูปแบบหน้าจอไม่ถูกต้อง");
        const chosen = metadata(m.gameId ?? "camel-up");
        if(chosen?.playMode==="local")throw Error("เกมนี้เล่นร่วมกันบนเครื่องเดียว เปิดจากหน้าเกมได้เลย");
        if (
          chosen &&
          !["ready", "beta"].includes(
            this.store?.status(chosen.id) ?? chosen.status,
          )
        )
          throw Error("เกมนี้พักการสร้างห้องใหม่ ห้องที่เริ่มแล้วเล่นต่อได้");
        const existing = this.attached.get(ws),
          current = existing?.sockets.get(ws);
        if (existing && current) {
          this.send(ws, {
            type: "session",
            code: existing.code,
            token: current.token,
            role: current.role,
            playerId: current.playerId,
          });
          this.send(ws, {
            type: "state",
            view: this.projection(existing, current),
          });
          return;
        }
        if (
          m.gameId !== undefined &&
          (typeof m.gameId !== "string" || !Object.hasOwn(games, m.gameId))
        )
          throw Error("ไม่พบเกมที่เลือก");
        if (metadata(m.gameId ?? "camel-up"))
          gameAdapters[(m.gameId ?? "camel-up") as keyof typeof gameAdapters].validateSettings({});
        if (this.rooms.size >= 200) throw Error("ห้องเต็ม กรุณาลองใหม่ภายหลัง");
        let code = "";
        do {
          code = Array.from(
            { length: 6 },
            () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[randomInt(32)],
          ).join("");
        } while (
          this.rooms.has(code) ||
          !!this.store?.db
            .prepare("SELECT 1 FROM gv_rooms WHERE code=?")
            .get(code)
        );
        const session: Session = {
          token: randomBytes(32).toString("hex"),
          role: "host",
          userId: account?.id,
          guest: account?.guest,
          receipts: new Map(),
        };
        const room: Room = {
          code,
          ownerId: account?.id,
          legacy: !this.requireAccount,
          rulesVersion: chosen?.rulesVersion,
          schemaVersion: chosen?.stateSchemaVersion,
          gameId: m.gameId ?? "camel-up",
          ...(m.gameId==="locus"?{locusMode:m.displayMode??"shared-table"}:{}),
          ...(m.gameId==="critter-kitchen"?{ckMode:m.displayMode??"shared-table"}:{}),
          revision: 0,
          players: [],
          sessions: [session],
          sockets: new Map(),
          updated: Date.now(),
        };
        this.rooms.set(code, room);
        this.send(ws, {
          type: "session",
          code,
          token: session.token,
          role: "host",
        });
        this.attach(ws, room, session);
        return;
      }
      if (m.type === "join" || m.type === "resume" || m.type === "watch") {
        if (typeof m.code !== "string") throw Error("กรุณาระบุรหัสห้อง");
        const room = this.rooms.get(m.code.toUpperCase());
        if (!room) {
          if (
            this.store?.quarantined.some((r) => r.code === m.code.toUpperCase())
          )
            throw Error(
              "เวอร์ชันเกมห้องนี้ยังไม่รองรับ ข้อมูลถูกเก็บไว้ กรุณาติดต่อผู้ดูแล",
            );
          throw Error("ไม่พบห้อง ตรวจรหัสหรือสร้างห้องใหม่");
        }
        if (m.type === "watch") {
          const display =
            account && room.ownerId && account.id === room.ownerId
              ? room.sessions.find((s) => s.role === "host")
              : undefined;
          if (display)
            this.send(ws, {
              type: "session",
              code: room.code,
              token: display.token,
              role: "host",
            });
          this.attach(ws, room, display);
          return;
        }
        if (m.type === "resume") {
          if (typeof m.token !== "string" || !/^[a-f0-9]{64}$/.test(m.token))
            throw Error("เซสชันไม่ถูกต้อง กรุณาเข้าห้องใหม่");
          const s = room.sessions.find((s) =>
            timingSafeEqual(Buffer.from(s.token), Buffer.from(m.token)),
          );
          if (!s) throw Error("เซสชันหมดอายุ กรุณาเข้าห้องใหม่");
          if (s.role === "player" && s.userId && s.userId !== account?.id)
            throw Error("เซสชันบัญชีไม่ตรงกับที่นั่ง กรุณาล็อกอินบัญชีเดิม");
          // One-time adoption of a pre-account seat requires its original capability.
          if (room.legacy && !s.userId && account) {
            if (s.role === "player") {
              if (
                room.players.some(
                  (p) => p.userId === account.id && p.id !== s.playerId,
                )
              )
                throw Error(
                  "บัญชีนี้มีอีกที่นั่งในห้องแล้ว ไม่สามารถรวมสองที่นั่ง",
                );
              const seat = room.players.find((p) => p.id === s.playerId)!;
              seat.userId = account.id;
              seat.avatar = account.avatar;
              if (
                !account.guest ||
                !!this.store?.db
                  .prepare("SELECT 1 FROM gv_profiles WHERE user_id=?")
                  .get(account.id)
              )
                seat.name = account.name;
              else
                this.store?.db
                  .prepare(
                    "INSERT OR IGNORE INTO gv_profiles(user_id,name) VALUES(?,?)",
                  )
                  .run(account.id, seat.name);
              s.userId = account.id;
              s.guest = account.guest;
            } else if (!account.guest && !room.ownerId) {
              room.ownerId = account.id;
              s.userId = account.id;
              s.guest = false;
            }
          }
          // Host capability is a separate public-display credential, never a player seat.
          this.attach(ws, room, s);
          return;
        }
        const existing = this.attached.get(ws),
          current = existing?.sockets.get(ws);
        if (existing === room && current?.role === "player") {
          this.send(ws, {
            type: "session",
            code: room.code,
            token: current.token,
            role: current.role,
            playerId: current.playerId,
          });
          this.send(ws, {
            type: "state",
            view: this.projection(room, current),
          });
          return;
        }
        if (this.requireAccount && !account)
          throw Error("เลือกเล่นเป็น Guest หรือล็อกอินก่อนเข้าห้อง");
        const saved =
          account &&
          room.sessions.find(
            (s) => s.role === "player" && s.userId === account.id,
          );
        if (saved) {
          this.send(ws, {
            type: "session",
            code: room.code,
            token: saved.token,
            role: saved.role,
            playerId: saved.playerId,
          });
          this.attach(ws, room, saved);
          return;
        }
        const maxPlayers = metadata(room.gameId)!.maxPlayers;
        if (room.players.length >= maxPlayers)
          throw Error(`ห้องเต็ม มีผู้เล่นครบ ${maxPlayers} คนแล้ว`);
        if (room.game || room.duel || room.azul || room.calico || room.wonders || room.jaipur || room.pixies || room.harmonies || room.sky || room.ck || room.locus)
          throw Error("เกมเริ่มแล้ว เข้าร่วมเกมใหม่เมื่อสร้างห้องใหม่");
        if (
          typeof m.name !== "string" ||
          !m.name.trim() ||
          m.name.trim().length > 24 ||
          /[\p{C}]/u.test(m.name)
        )
          throw Error("ใช้ชื่อ 1–24 ตัวอักษร");
        const p = {
          id: randomUUID(),
          name: account && !account.guest ? account.name : m.name.trim(),
          userId: account?.id,
          avatar: account?.avatar,
        };
        const s: Session = {
          token: randomBytes(32).toString("hex"),
          role: "player",
          playerId: p.id,
          userId: account?.id,
          guest: account?.guest,
          receipts: new Map(),
        };
        if (account?.guest && this.store) {
          this.store.db
            .prepare(
              "INSERT INTO gv_profiles(user_id,name) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET name=excluded.name",
            )
            .run(account.id, p.name);
          for (const other of this.rooms.values()) {
            let changed = false;
            for (const seat of other.players)
              if (seat.userId === account.id) {
                seat.name = p.name;
                changed = true;
              }
            if (changed && other !== room) this.broadcast(other);
          }
        }
        room.players.push(p);
        room.sessions.push(s);
        room.revision++;
        this.send(ws, {
          type: "session",
          code: room.code,
          token: s.token,
          role: "player",
          playerId: p.id,
        });
        room.updated = Date.now();
        this.attach(ws, room, s);
        return;
      }
      if (m.type === "sync") {
        const room = this.attached.get(ws);
        if (!room) throw Error("กรุณาเข้าห้องก่อน");
        this.send(ws, {
          type: "state",
          view: this.projection(room, room.sockets.get(ws)),
          snapshot: true,
        });
        return;
      }
      if (m.type !== "command")
        throw Error("ไม่รู้จักคำสั่ง กรุณาโหลดหน้าใหม่");
      const room = this.attached.get(ws),
        s = room?.sockets.get(ws);
      if (!room || !s) throw Error("กรุณาเข้าห้องก่อนทำรายการ");
      if (typeof m.id !== "string" || !/^[a-zA-Z0-9-]{8,80}$/.test(m.id))
        throw Error("รหัสคำสั่งไม่ถูกต้อง");
      const previous = s.receipts.get(m.id);
      if (previous) {
        this.send(ws, previous);
        this.send(ws, {
          type: "state",
          view: this.projection(room, s),
          snapshot: true,
        });
        return;
      }
      let ack: Ack;
      const before = room.game;
      try {
        // Revealing different own cards commutes within this exact settled round.
        // Intent validation still enforces actor, closed slot and round identity.
        const simultaneousReveal=room.gameId==="dracula-vs-van-helsing" && room.duel?.phase!=="playing" &&
          s.role==="player" && m.action?.type==="reveal-result" && "round" in m.action && m.action.round===room.duel?.round && m.revision<=room.revision;
        const simultaneousSky=room.gameId==="sky-team" && !!room.sky && s.role==="player" &&
          ((room.sky.phase==="planning" && m.action?.type==="sky-ready") || (room.sky.phase==="reroll" && m.action?.type==="sky-reroll-dice")) &&
          "epoch" in m.action && m.action.epoch===skyRules.decisionKey(room.sky) && m.revision<=room.revision;
        const simultaneousLocus=room.gameId==="locus"&&!!room.locus&&s.role==="player"&&m.action?.type?.startsWith("locus-")&&m.action.type!=="locus-pick"&&"epoch" in m.action&&m.action.epoch===locusRules.decisionKey(room.locus,s.playerId!)&&m.revision<=room.revision;
        const simultaneousCK=room.gameId==="critter-kitchen"&&!!room.ck&&s.role==="player"&&
          ((room.ck.phase==="planning"&&m.action?.type==="ck-plan")||(room.ck.phase==="challenge"&&m.action?.type==="ck-meals")||(room.ck.phase==="refrigeration"&&m.action?.type==="ck-fridge")||(room.ck.phase==="critic"&&m.action?.type==="ck-final"))&&
          "epoch"in m.action&&m.action.epoch===ckRules.decisionKey(room.ck)&&m.revision<=room.revision;
        if (!Number.isSafeInteger(m.revision) || m.revision<0 || m.revision !== room.revision && !simultaneousReveal && !simultaneousSky && !simultaneousCK && !simultaneousLocus)
          throw Error("สถานะเปลี่ยนแล้ว กรุณาดูตาปัจจุบันแล้วเลือกใหม่");
        if (!m.action || typeof m.action !== "object")
          throw Error("เลือกการกระทำก่อน");
        if(room.gameId==="locus"){this.locusCommand(room,s,m.action);
        }else if(room.gameId==="critter-kitchen"){this.ckCommand(room,s,m.action);
        }else if(room.gameId==="sky-team"){this.skyCommand(room,s,m.action);
        }else if(room.gameId==="harmonies"){this.harmoniesCommand(room,s,m.action);
        }else if(room.gameId==="pixies"){this.pixiesCommand(room,s,m.action);
        } else if(room.gameId==="jaipur"){this.jaipurCommand(room,s,m.action);
        } else if (room.gameId === "seven-wonders-duel") {
          this.wondersCommand(room,s,m.action);
        } else if (room.gameId === "calico") {
          this.calicoCommand(room, s, m.action);
        } else if (room.gameId === "azul") {
          this.azulCommand(room, s, m.action);
        } else if (room.gameId === "dracula-vs-van-helsing") {
          this.duelCommand(room, s, m.action);
        } else if (m.action.type === "start" || m.action.type === "restart") {
          if (!this.canManage(room, s))
            throw Error(
              "เริ่มเกมหรือเล่นอีกครั้งได้โดยผู้สร้างห้องหรือจอกลางที่มีสิทธิ์เท่านั้น",
            );
          if (m.action.type === "restart" && room.game?.phase !== "finished")
            throw Error("เล่นอีกครั้งได้หลังจบเกมเท่านั้น");
          if (m.action.type === "start" && room.game)
            throw Error("เกมเริ่มแล้ว");
          if (room.players.length < 3) throw Error("รอผู้เล่นอย่างน้อย 3 คน");
          if (
            room.players.some(
              (p) =>
                !this.connected(room,p.id),
            )
          )
            throw Error("รอผู้เล่นทุกคนเชื่อมต่อก่อนเริ่ม");
          room.game = engine.start(
            room.players.map((p) => ({ id: p.id, name: p.name })),
            this.random,
            m.action.startingPlayerId,
          );
        } else {
          if (s.role !== "player" || !room.game)
            throw Error("ทำรายการได้จากมือถือผู้เล่นหลังเริ่มเกม");
          room.game = engine.apply(
            room.game,
            s.playerId!,
            m.action as Action,
            this.random,
          );
        }
        room.revision++;
        if (room.gameId === "camel-up") {
          room.event = {
            revision: room.revision,
            actorId: s.playerId ?? "host",
            kind: m.action.type as PublicEvent["kind"],
            money:
              m.action.type === "restart"
                ? []
                : room
                    .game!.players.map((p) => ({
                      id: p.id,
                      amount:
                        p.money -
                        (before?.players.find((x) => x.id === p.id)?.money ??
                          p.money),
                    }))
                    .filter((p) => p.amount !== 0),
            legEnded:
              m.action.type !== "restart" &&
              !!before &&
              (room.game!.leg !== before.leg ||
                room.game!.settlements.length !== before.settlements.length),
            finished: room.game!.phase === "finished",
          };
          if (m.action.type === "roll") {
            room.event!.movement = room.game!.lastMovement;
            room.event!.roll = room.game!.lastRoll;
          }
          if (m.action.type === "leg") room.event!.color = m.action.color;
          if (m.action.type === "final") room.event!.side = m.action.side;
          if (m.action.type === "tile")
            room.event!.position = m.action.position;
        }
        room.updated = Date.now();
        if (m.action.type === "start" || m.action.type === "restart")
          this.store?.started(
            room.players
              .map((p) => p.userId)
              .filter((id): id is string => !!id),
            room.gameId,
          );
        ack = { type: "ack", id: m.id, ok: true, revision: room.revision };
      } catch (error) {
        ack = {
          type: "ack",
          id: m.id,
          ok: false,
          error: (error as Error).message,
          revision: room.revision,
        };
      }
      s.receipts.set(m.id, ack);
      if (s.receipts.size > 512)
        s.receipts.delete(s.receipts.keys().next().value!);
      this.send(ws, ack);
      this.broadcast(room, ack.ok && m.action.type === "restart");
    } catch (error) {
      this.send(ws, { type: "error", error: (error as Error).message });
    }
  }
  private canManage(room: Room, session: Session) {
    return (
      session.role === "host" ||
      (!!session.userId && session.userId === room.ownerId)
    );
  }
  private locusCommand(room:Room,session:Session,action:import("../shared/types.js").RoomAction){
    const keys=Object.keys(action).sort().join(",");
    if(action.type==="ready"){const p=room.players.find(p=>p.id===session.playerId);if(session.role!=="player"||!p||room.locus||keys!=="ready,type"||typeof action.ready!=="boolean")throw Error("กดพร้อมได้ในห้องรอจากมือถือ");p.ready=action.ready;return;}
    if(action.type==="start"||action.type==="restart"){
      if(!Object.keys(action).every(k=>["type","startingPlayerId"].includes(k))||!this.canManage(room,session))throw Error("ให้ผู้สร้างห้องเริ่มเกม");
      if(action.type==="start"&&room.locus||action.type==="restart"&&room.locus?.phase!=="finished")throw Error("เกมยังไม่พร้อมเริ่มใหม่");
      if(room.players.length<2||room.players.length>5||room.players.some(p=>!p.ready||!this.connected(room,p.id)))throw Error("รอผู้เล่น 2–5 คนเชื่อมต่อและกดพร้อม");
      room.locus=locusRules.createInitialState(room.players,this.random,action.startingPlayerId);room.locus.matchId=randomUUID();return;
    }
    if(action.type==="locus-extra"){if(keys!=="type"||!this.canManage(room,session)||!room.locus)throw Error("ให้ผู้สร้างห้องต่อรอบเมื่อเสมอ");room.locus=locusRules.extendTiedRound(room.locus,this.random);return;}
    if(session.role!=="player"||!room.locus)throw Error("ใช้มือถือผู้เล่นหลังเริ่มเกม");
    room.locus=locusRules.applyAction(room.locus,session.playerId!,action as LocusAction,this.random);
  }
  private ckCommand(room:Room,session:Session,action:import("../shared/types.js").RoomAction){
    const keys=Object.keys(action).sort().join(",");
    if(action.type==="ready"){const p=room.players.find(p=>p.id===session.playerId);if(session.role!=="player"||!p||room.ck||keys!=="ready,type"||typeof action.ready!=="boolean")throw Error("กดพร้อมได้ในห้องรอจากมือถือ");p.ready=action.ready;return;}
    if(action.type==="start"||action.type==="restart"){
      if(!Object.keys(action).every(k=>["type","restaurateurs","tutorial"].includes(k))||!this.canManage(room,session)||action.restaurateurs!==undefined&&typeof action.restaurateurs!=="boolean"||action.tutorial!==undefined&&typeof action.tutorial!=="boolean")throw Error("ให้ผู้สร้างห้องเลือกการจัดเกมและเริ่มเกม");
      if(action.type==="start"&&room.ck||action.type==="restart"&&room.ck?.phase!=="finished")throw Error("เกมยังไม่พร้อมเริ่มใหม่");
      if(room.players.length<2||room.players.length>5||room.players.some(p=>!p.ready||!this.connected(room,p.id)))throw Error("รอผู้เล่น 2–5 คนเชื่อมต่อและกดพร้อม");
      room.ck=ckRules.createInitialState(room.players,this.random,{restaurateurs:action.restaurateurs,tutorial:action.tutorial});room.ck.matchId=randomUUID();return;
    }
    if(room.ck&&this.canManage(room,session)&&(action.type==="ck-run"||action.type==="ck-next")){room.ck=ckRules.applyAction(room.ck,room.ck.players[0].id,action,this.random);return;}
    if(session.role!=="player"||!room.ck)throw Error("ใช้มือถือผู้เล่นหลังเริ่มเกม");
    room.ck=ckRules.applyAction(room.ck,session.playerId!,action as CKAction,this.random);
  }
  private skyCommand(room:Room,session:Session,action:import("../shared/types.js").RoomAction){
    const keys=Object.keys(action).sort().join(",");
    if(action.type==="ready"){const own=room.players.find(p=>p.id===session.playerId);if(session.role!=="player"||!own||room.sky||keys!=="ready,type"||typeof action.ready!=="boolean")throw Error("กดพร้อมได้ในห้องรอจากมือถือ");own.ready=action.ready;return;}
    if(action.type==="start"||action.type==="restart"){
      if(keys!=="type"||!this.canManage(room,session))throw Error("เริ่มเกมได้โดยผู้สร้างห้องเท่านั้น");
      if(action.type==="start"&&room.sky||action.type==="restart"&&room.sky?.phase!=="finished")throw Error("เกมยังไม่พร้อมเริ่มใหม่");
      if(room.players.length!==2||room.players.some(p=>!p.ready||!this.connected(room,p.id)))throw Error("รอผู้เล่น 2 คนเชื่อมต่อและกดพร้อม");
      room.sky=skyRules.createInitialState(room.players,this.random);room.sky.matchId=randomUUID();return;
    }
    if(session.role!=="player"||!room.sky)throw Error("ใช้มือถือผู้เล่นหลังเริ่มเกม");
    room.sky=skyRules.applyAction(room.sky,session.playerId!,action as SkyAction,this.random);
  }
  private harmoniesCommand(room:Room,session:Session,action:import("../shared/types.js").RoomAction){
    const keys=Object.keys(action).sort().join(",");
    if(action.type==="harmonies-display-mode"){
      if(!this.canManage(room,session)||keys!=="mode,type"||!["shared-table","full-mobile"].includes(action.mode))throw Error("ผู้สร้างห้องเลือกโหมดจอกลางได้เท่านั้น");
      room.harmoniesMode=action.mode;return;
    }
    if(action.type==="ready"){const own=room.players.find(p=>p.id===session.playerId);if(session.role!=="player"||!own||room.harmonies||keys!=="ready,type"||typeof action.ready!=="boolean")throw Error("กดพร้อมได้ในห้องรอจากมือถือ");own.ready=action.ready;return;}
    if(action.type==="start"||action.type==="restart"){
      if((action.boardSide!==undefined&&!(["A","B"] as unknown[]).includes(action.boardSide))||!["type","startingPlayerId,type","boardSide,type","boardSide,startingPlayerId,type"].includes(keys)||(action.startingPlayerId!==undefined&&typeof action.startingPlayerId!=="string")||!this.canManage(room,session))throw Error("เริ่มเกมได้โดยผู้สร้างห้องเท่านั้น");
      if(action.type==="start"&&room.harmonies||action.type==="restart"&&room.harmonies?.phase!=="finished")throw Error("เกมยังไม่พร้อมเริ่มใหม่");
      if(room.players.length<2||room.players.length>4||room.players.some(p=>!p.ready||!this.connected(room,p.id)))throw Error("รอผู้เล่น 2–4 คนเชื่อมต่อและกดพร้อม");
      room.harmonies=harmoniesRules.createInitialState(room.players,this.random,action.startingPlayerId,action.boardSide??(action.type==="restart"?(this.random()<.5?"A":"B"):"A"));room.harmonies.matchId=randomUUID();return;
    }
    if(!room.harmonies)throw Error("รอเริ่มเกมก่อน");
    const sharedHost=session.role==="host"&&this.canManage(room,session)&&room.harmoniesMode==="shared-table";
    if(session.role!=="player"&&!sharedHost)throw Error("เปิดโหมดเล่นร่วมจอกลางโดยผู้สร้างห้องก่อน");
    const actor=sharedHost?room.harmonies.players[room.harmonies.turn].id:session.playerId!;
    room.harmonies=harmoniesRules.applyAction(room.harmonies,actor,action as HarmoniesAction,this.random);
  }
  private pixiesCommand(room:Room,session:Session,action:import("../shared/types.js").RoomAction){
    const keys=Object.keys(action).sort().join(",");
    if(action.type==="ready"){const own=room.players.find(p=>p.id===session.playerId);if(session.role!=="player"||!own||room.pixies||keys!=="ready,type"||typeof action.ready!=="boolean")throw Error("กดพร้อมได้ในห้องรอจากมือถือ");own.ready=action.ready;return;}
    if(action.type==="start"||action.type==="restart"){
      if(!["type","startingPlayerId,type"].includes(keys)||(action.startingPlayerId!==undefined&&typeof action.startingPlayerId!=="string")||!this.canManage(room,session))throw Error("เริ่มเกมได้โดยผู้สร้างห้องเท่านั้น");
      if(action.type==="start"&&room.pixies||action.type==="restart"&&room.pixies?.phase!=="finished")throw Error("เกมยังไม่พร้อมเริ่มใหม่");
      if(room.players.length<2||room.players.length>5||room.players.some(p=>!p.ready||!this.connected(room,p.id)))throw Error("รอผู้เล่น 2–5 คนเชื่อมต่อและกดพร้อม");
      room.pixies=pixiesRules.createInitialState(room.players,this.random,action.startingPlayerId);room.pixies.matchId=randomUUID();return;
    }
    if(action.type==="pixies-next"&&room.pixies&&this.canManage(room,session)){
      room.pixies=pixiesRules.applyAction(room.pixies,room.pixies.players[0].id,action,this.random);return;
    }
    if(session.role!=="player"||!room.pixies)throw Error("ใช้มือถือผู้เล่นหลังเริ่มเกม");
    room.pixies=pixiesRules.applyAction(room.pixies,session.playerId!,action as PixiesAction,this.random);
  }
  private jaipurCommand(room:Room,session:Session,action:import("../shared/types.js").RoomAction){
 const keys=Object.keys(action).sort().join(",");
 if(action.type==="ready"){const own=room.players.find(p=>p.id===session.playerId);if(session.role!=="player"||!own||room.jaipur||keys!=="ready,type"||typeof action.ready!=="boolean")throw Error("กดพร้อมได้ในห้องรอจากมือถือ");own.ready=action.ready;return;}
 if(action.type==="start"||action.type==="restart"){
 if(!["type","startingPlayerId,type"].includes(keys)||(action.startingPlayerId!==undefined&&typeof action.startingPlayerId!=="string")||!this.canManage(room,session))throw Error("เริ่มเกมได้โดยผู้สร้างห้องเท่านั้น");
 if(action.type==="start"&&room.jaipur||action.type==="restart"&&room.jaipur?.phase!=="finished")throw Error("เกมยังไม่พร้อมเริ่มใหม่");
 if(room.players.length!==2||room.players.some(p=>!p.ready||!this.connected(room,p.id)))throw Error("รอผู้เล่น 2 คนเชื่อมต่อและกดพร้อม");room.jaipur=jaipurRules.createInitialState(room.players,this.random,action.startingPlayerId);room.jaipur.matchId=randomUUID();return;}
 if(action.type==="jaipur-next"&&this.canManage(room,session)&&room.jaipur){room.jaipur=jaipurRules.nextRound(room.jaipur,action,this.random,session.role==="host"?"host":session.playerId!);return;}
 if(session.role!=="player"||!room.jaipur)throw Error("ใช้มือถือผู้เล่นหลังเริ่มเกม");room.jaipur=jaipurRules.applyAction(room.jaipur,session.playerId!,action as JaipurAction,this.random);
 }
  private wondersCommand(room:Room,session:Session,action:import("../shared/types.js").RoomAction){
    const keys=Object.keys(action).sort().join(",");
    if(action.type==="ready"){
      const own=room.players.find(p=>p.id===session.playerId);
      if(session.role!=="player"||!own||room.wonders||keys!=="ready,type"||typeof action.ready!=="boolean")throw Error("กดพร้อมได้ในห้องรอจากมือถือ");
      own.ready=action.ready;return;
    }
    if(action.type==="start"||action.type==="restart"){
      if(!["type","startingPlayerId,type"].includes(keys)||(action.startingPlayerId!==undefined&&typeof action.startingPlayerId!=="string")||!this.canManage(room,session))throw Error("เริ่มเกมได้โดยผู้สร้างห้องเท่านั้น");
      if(action.type==="start"&&room.wonders||action.type==="restart"&&room.wonders?.phase!=="finished")throw Error("เกมยังไม่พร้อมเริ่มใหม่");
      if(room.players.length!==2||room.players.some(p=>!p.ready||!this.connected(room,p.id)))throw Error("รอผู้เล่น 2 คนเชื่อมต่อและกดพร้อม");
      room.wonders=wondersRules.createInitialState(room.players,this.random,action.startingPlayerId);return;
    }
    if(session.role!=="player"||!room.wonders)throw Error("ใช้มือถือผู้เล่นหลังเริ่มเกม");
    room.wonders=wondersRules.applyAction(room.wonders,session.playerId!,action as WondersAction,this.random);
  }
  private calicoCommand(room:Room,session:Session,action:import("../shared/types.js").RoomAction){
    const keys=Object.keys(action).sort().join(",");
    if(action.type==="calico-preset"){
      if(!this.canManage(room,session)||room.calico||keys!=="preset,type"||!["standard","first"].includes(action.preset))throw Error("เลือกโหมดได้โดยผู้สร้างในห้องรอ");
      room.calicoPreset=action.preset;return;
    }
    if(action.type==="ready"){
      const own=room.players.find(p=>p.id===session.playerId);
      if(session.role!=="player"||!own||room.calico||keys!=="ready,type"||typeof action.ready!=="boolean")throw Error("กดพร้อมได้จากมือถือในห้องรอ");
      own.ready=action.ready;return;
    }
    if(action.type==="start"||action.type==="restart"){
      if(!["type","startingPlayerId,type"].includes(keys)||(action.startingPlayerId!==undefined&&typeof action.startingPlayerId!=="string")||!this.canManage(room,session))throw Error("เริ่มเกมได้โดยผู้สร้างห้องเท่านั้น");
      if(action.type==="start"&&room.calico||action.type==="restart"&&room.calico?.phase!=="finished")throw Error("เกมยังไม่พร้อมเริ่มใหม่");
      if(room.players.length<1||room.players.length>4||room.players.some(p=>!p.ready||!this.connected(room,p.id)))throw Error("รอผู้เล่น 1–4 คนเชื่อมต่อและกดพร้อม");
      room.rulesVersion=metadata("calico")!.rulesVersion;room.schemaVersion=metadata("calico")!.stateSchemaVersion;
      room.calico=calicoRules.createInitialState(room.players,this.random,action.startingPlayerId,room.calicoPreset??"standard");return;
    }
    if(session.role!=="player"||!room.calico)throw Error("ใช้มือถือผู้เล่นหลังเริ่มเกม");
    room.calico=calicoRules.applyAction(room.calico,session.playerId!,action as CalicoAction,this.random);
  }
  private azulCommand(room: Room, session: Session, action: import("../shared/types.js").RoomAction) {
    const keys = Object.keys(action).sort().join(",");
    if (action.type === "ready") {
      const own = room.players.find(p => p.id === session.playerId);
      if (session.role !== "player" || !own || room.azul || keys !== "ready,type" || typeof action.ready !== "boolean") throw Error("กดพร้อมได้จากผู้เล่นในห้องรอเท่านั้น");
      own.ready = action.ready; return;
    }
    if (action.type === "start" || action.type === "restart") {
      if (!["type", "startingPlayerId,type"].includes(keys) || (action.startingPlayerId !== undefined && typeof action.startingPlayerId !== "string")) throw Error("เลือกผู้เริ่มที่อยู่ในห้อง หรือสุ่มที่ server");
      if (!this.canManage(room, session)) throw Error("เริ่มเกมได้โดยผู้สร้างห้องเท่านั้น");
      if (action.type === "start" && room.azul) throw Error("เกมเริ่มแล้ว");
      if (action.type === "restart" && room.azul?.phase !== "finished") throw Error("เล่นอีกครั้งได้หลังจบเกมเท่านั้น");
      if (room.players.length < 2 || room.players.length > 4 || room.players.some(p => !p.ready)) throw Error("รอผู้เล่น 2–4 คนกดพร้อม");
      if (room.players.some(p => !this.connected(room,p.id))) throw Error("รอผู้เล่นทุกคนเชื่อมต่อก่อนเริ่ม");
      room.azul = azulEngine.start(room.players, this.random, action.startingPlayerId); return;
    }
    if (action.type === "next-round" && keys === "type" && this.canManage(room, session) && room.azul) {
      room.azul = azulRules.nextRound(room.azul, this.random); return;
    }
    if (session.role !== "player" || !room.azul) throw Error("ทำรายการได้จากมือถือผู้เล่นหลังเริ่มเกม");
    room.azul = azulEngine.apply(room.azul, session.playerId!, action as AzulAction, this.random);
  }
  private duelCommand(
    room: Room,
    session: Session,
    action: import("../shared/types.js").RoomAction,
  ) {
    const own = room.players.find((p) => p.id === session.playerId);
    const keys = Object.keys(action).sort().join(",");
    if (action.type === "choose-role" || action.type === "ready") {
      if (session.role !== "player" || !own || room.duel)
        throw Error("เลือกบทบาทและพร้อมได้ในห้องรอเท่านั้น");
      if (action.type === "choose-role") {
        if (keys !== "character,type" || !ROLES.includes(action.character))
          throw Error("เลือกบทบาทที่มีในเกม");
        if (
          room.players.some(
            (p) => p.id !== own.id && p.character === action.character,
          )
        )
          throw Error("บทบาทนี้ถูกเลือกแล้ว");
        own.character = action.character;
        own.ready = false;
      } else {
        if (
          keys !== "ready,type" ||
          typeof action.ready !== "boolean" ||
          !own.character
        )
          throw Error("เลือกบทบาทก่อนกดพร้อม");
        own.ready = action.ready;
      }
      return;
    }
    if (action.type === "start" || action.type === "restart") {
      if (keys !== "type")
        throw Error("Dracula เป็นผู้เริ่มเสมอ ไม่ต้องเลือกผู้เริ่ม");
      if (!this.canManage(room, session))
        throw Error("เริ่มเกมได้โดยผู้สร้างห้องหรือจอกลางที่มีสิทธิ์เท่านั้น");
      if (action.type === "start" && room.duel) throw Error("เกมเริ่มแล้ว");
      if (action.type === "restart" && (room.duel?.phase !== "finished" || !duelEngine.isFinished(room.duel)))
        throw Error("เล่นอีกครั้งได้หลังจบเกมเท่านั้น");
      if (
        room.players.length !== 2 ||
        room.players.some((p) => !p.character || !p.ready)
      )
        throw Error("รอผู้เล่นสองบทบาทกดพร้อม");
      if (
        room.players.some(
          (p) => !this.connected(room,p.id),
        )
      )
        throw Error("รอผู้เล่นทุกคนเชื่อมต่อก่อนเริ่ม");
      room.duel = duelEngine.start(
        room.players.map((p) => ({
          id: p.id,
          name: p.name,
          character: p.character,
        })),
        this.random,
      );
      return;
    }
    if (session.role !== "player" || !room.duel)
      throw Error("ทำรายการได้จากมือถือผู้เล่นหลังเริ่มเกม");
    room.duel = duelEngine.apply(
      room.duel,
      session.playerId!,
      action as DuelAction,
      this.random,
    );
  }
  sweep(now = Date.now()): void {
    if (this.store?.distributed && !this.store.locked) return this.coordinate(() => this.sweep(now));
    if (this.store?.distributed) this.store.db.prepare("DELETE FROM gv_presence WHERE expires_at<?").run(now);
    this.expireRooms(now);
  }
  private expireRooms(now: number) {
    for (const [code, room] of this.rooms) if (now - room.updated > ROOM_IDLE_MS) {
      this.store?.db.prepare("DELETE FROM gv_rooms WHERE code=?").run(code);
      if (this.store?.distributed) for (const session of room.sessions)
        this.store.db.prepare("DELETE FROM gv_presence WHERE token=?").run(session.token);
      for (const ws of room.sockets.keys()) {
        this.attached.delete(ws);
        this.connections.delete(ws);
        this.send(ws, { type: "error", error: "ห้องหมดอายุหลังไม่มีการใช้งานเกิน 10 ชั่วโมง กรุณาสร้างห้องใหม่" });
        const close = () => ws.close(4004, "room expired");
        if (this.store) this.store.afterCommit(close); else close();
      }
      this.rooms.delete(code);
    }
  }
}
