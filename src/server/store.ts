import { validateRoomRecord } from "./room-validation.js";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, mkdirSync, chmodSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { GAME_CATALOG, metadata, type GameStatus } from "../shared/catalog.js";
import { PostgresDatabase } from "./postgres.js";
import type {HarmoniesLeaderboardMode,HarmoniesLeaderboards} from '../shared/harmonies-leaderboard.js';
export class PlatformStore {
  db: DatabaseSync | PostgresDatabase;
  readonly distributed: boolean;
  locked = false;
  private deferred: (() => void)[] = [];
  private loadedRooms = new Map<string,string>();
  quarantined: { code: string; gameId: string; reason: string }[] = [];
  constructor(
    public path = process.env.GAMEVERSE_DATABASE_URL || process.env.GAMEVERSE_DB_PATH || "./data/gameverse.sqlite",
  ) {
    this.distributed = /^postgres(?:ql)?:/.test(path);
    if (this.distributed) {
      this.db = new PostgresDatabase(path);
      this.transaction(() => {
        this.db.exec(readFileSync(resolve("migrations/002-postgres.sql"), "utf8"));
        this.migrateHarmoniesLeaderboard();
      });
      return;
    }
    if (path !== ":memory:")
      mkdirSync(dirname(resolve(path)), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    if (path !== ":memory:") chmodSync(path, 0o600);
    this.db.exec(
      "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;",
    );
    this.db.exec(readFileSync(resolve("migrations/001-platform.sql"), "utf8"));
    this.transaction(()=>this.migrateHarmoniesLeaderboard());
  }
  private migrateHarmoniesLeaderboard(){
    this.db.exec(readFileSync(resolve('migrations/003-harmonies-leaderboard.sql'),'utf8'));
    this.db.prepare('INSERT INTO gv_migrations VALUES(3,?) ON CONFLICT(version) DO NOTHING').run(Date.now());
  }
  harmoniesLeaderboards():HarmoniesLeaderboards{
    const read=(mode:HarmoniesLeaderboardMode)=>this.db.prepare(`SELECT l.score,l.achieved_at,
      COALESCE(p.name,l.name) AS name,CASE WHEN p.user_id IS NULL THEN l.avatar ELSE p.avatar END AS avatar
      FROM gv_harmonies_leaderboard l LEFT JOIN gv_profiles p ON p.user_id=l.user_id
      WHERE l.mode=? ORDER BY l.score DESC,l.achieved_at ASC,l.user_id ASC LIMIT 10`).all(mode)
      .map((row,i)=>({rank:i+1,name:String(row.name),avatar:row.avatar===null?null:String(row.avatar),score:Number(row.score),achievedAt:Number(row.achieved_at)}));
    return {solo:read('solo'),competitive:read('competitive')};
  }
  /** Called inside the room transaction; keep only each mode's ten best users. */
  recordHarmoniesScores(mode:HarmoniesLeaderboardMode,entries:{userId:string;name:string;avatar:string|null;score:number}[],achievedAt:number){
    if(!['solo','competitive'].includes(mode)||!Number.isSafeInteger(achievedAt)||achievedAt<=0||entries.some(e=>!e.userId||!Number.isSafeInteger(e.score)||e.score<0))throw Error('Invalid Harmonies result');
    const insert=this.db.prepare(`INSERT INTO gv_harmonies_leaderboard(mode,user_id,name,avatar,score,achieved_at) VALUES(?,?,?,?,?,?)
      ON CONFLICT(mode,user_id) DO UPDATE SET name=excluded.name,avatar=excluded.avatar,score=excluded.score,achieved_at=excluded.achieved_at
      WHERE excluded.score>gv_harmonies_leaderboard.score OR (excluded.score=gv_harmonies_leaderboard.score AND excluded.achieved_at<gv_harmonies_leaderboard.achieved_at)`);
    for(const entry of entries)insert.run(mode,entry.userId,entry.name,entry.avatar,entry.score,achievedAt);
    this.db.prepare(`DELETE FROM gv_harmonies_leaderboard WHERE mode=? AND user_id NOT IN
      (SELECT user_id FROM gv_harmonies_leaderboard WHERE mode=? ORDER BY score DESC,achieved_at ASC,user_id ASC LIMIT 10)`).run(mode,mode);
  }
  /** Guest -> member linking must not leave two ranks for the same account. */
  mergeHarmoniesScores(oldId:string,newId:string,profile?:{name:string;avatar:string|null}){
    const previous=this.db.prepare('SELECT * FROM gv_harmonies_leaderboard WHERE user_id=?').all(oldId);
    this.db.prepare('DELETE FROM gv_harmonies_leaderboard WHERE user_id=?').run(oldId);
    for(const row of previous)this.recordHarmoniesScores(row.mode as HarmoniesLeaderboardMode,[{userId:newId,name:String(row.name),avatar:row.avatar===null?null:String(row.avatar),score:Number(row.score)}],Number(row.achieved_at));
    if(profile)this.db.prepare('UPDATE gv_harmonies_leaderboard SET name=?,avatar=? WHERE user_id=?').run(profile.name,profile.avatar,newId);
  }
  transaction<T>(fn: () => T): T {
    if (this.distributed) {
      if (this.locked) return fn();
      this.db.exec("BEGIN");
      this.locked = true; this.deferred = [];
      let result: T;
      try {
        this.db.exec("SELECT pg_advisory_xact_lock(73829101)");
        result = fn();
        this.db.exec("COMMIT");
      } catch (e) {
        this.deferred = [];
        try { this.db.exec("ROLLBACK"); } finally { this.locked = false; }
        throw e;
      }
      this.locked = false;
      const deferred = this.deferred; this.deferred = [];
      for (const send of deferred) send();
      return result;
    }
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const result = fn();
      this.db.exec("COMMIT");
      return result;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
  afterCommit(fn: () => void) {
    if (this.distributed && this.locked) this.deferred.push(fn); else fn();
  }
  saveRooms(rooms: any[]) {
    const save = this.db.prepare(
      "INSERT INTO gv_rooms VALUES(?,?,?,?,?,?,?) ON CONFLICT(code) DO UPDATE SET rules_version=excluded.rules_version,schema_version=excluded.schema_version,revision=excluded.revision,updated_at=excluded.updated_at,state=excluded.state",
    );
    for (const r of rooms) {
      const state=JSON.stringify(r);
      if (this.distributed && this.loadedRooms.get(r.code)===state) continue;
      const g = metadata(r.gameId)!;
      save.run(
        r.code,
        r.gameId,
        r.rulesVersion ?? g.rulesVersion,
        r.schemaVersion ?? g.stateSchemaVersion,
        r.revision,
        r.updated,
        state,
      );
      if (this.distributed) this.loadedRooms.set(r.code,state);
    }
  }
  loadRooms(): any[] {
    this.quarantined = [];
    this.loadedRooms.clear();
    const rows = this.db.prepare("SELECT * FROM gv_rooms").all();
    return rows.flatMap((r) => {
      const g = metadata(String(r.game_id));
      if (
        !g ||
        ((r.rules_version !== g.rulesVersion || r.schema_version !== g.stateSchemaVersion)&&!(r.game_id==="calico"&&r.rules_version==="base-2020-two-player-v1"&&r.schema_version===1)&&!(r.game_id==="harmonies"&&r.rules_version==="libellud-base-2024-A-B-v1"&&r.schema_version===1))
      ) {
        this.quarantined.push({
          code: String(r.code),
          gameId: String(r.game_id),
          reason: "version",
        });
        return [];
      }
      try {
        const x = JSON.parse(String(r.state));
        if (
          x.code !== r.code ||
          x.gameId !== r.game_id ||
          x.revision !== r.revision ||
          !validateRoomRecord(x)
        )
          throw Error();
        // Optional Harmonies modules preserve the base snapshot schema and base rules.
        // Upgrade only this known compatible predecessor; all other mismatches stay quarantined.
        if(r.game_id==="harmonies"&&r.rules_version==="libellud-base-2024-A-B-v1"){
          x.rulesVersion=g.rulesVersion;x.schemaVersion=g.stateSchemaVersion;
        }
        this.loadedRooms.set(x.code,String(r.state));
        return [x];
      } catch {
        this.quarantined.push({
          code: String(r.code),
          gameId: String(r.game_id),
          reason: "invalid-state",
        });
        return [];
      }
    });
  }
  status(id: string): GameStatus {
    return (
      (this.db
        .prepare("SELECT status FROM gv_game_settings WHERE game_id=?")
        .get(id)?.status as GameStatus) ?? metadata(id)!.status
    );
  }
  catalog() {
    return GAME_CATALOG.map((g) => ({ ...g, status: this.status(g.id) }));
  }
  recent(userId: string) {
    return this.db
      .prepare(
        "SELECT game_id AS gameId,started_at AS startedAt FROM gv_recent WHERE user_id=? ORDER BY started_at DESC LIMIT 3",
      )
      .all(userId);
  }
  started(ids: string[], gameId: string) {
    const stmt = this.db.prepare(
      "INSERT INTO gv_recent VALUES(?,?,?) ON CONFLICT(user_id,game_id) DO UPDATE SET started_at=excluded.started_at",
    );
    for (const id of new Set(ids)) stmt.run(id, gameId, Date.now());
  }
  profile(user: any) {
    const p = this.db
      .prepare(
        "SELECT name,avatar,avatar_source FROM gv_profiles WHERE user_id=?",
      )
      .get(user.id);
    return {
      id: user.id,
      name:
        String(p?.name ?? user.name ?? "ผู้เล่น")
          .replace(/[\p{C}]/gu, " ")
          .trim()
          .slice(0, 24) || "ผู้เล่น",
      avatar: p ? p.avatar : this.googleAvatar(user.image),
      avatarSource:
        p?.avatar_source ??
        (this.googleAvatar(user.image) ? "google" : "default"),
      guest: !!user.isAnonymous,
      admin: this.admin(user.id),
    };
  }
  googleAvatar(url: unknown) {
    try {
      const u = new URL(String(url));
      return u.protocol === "https:" &&
        (u.hostname === "lh3.googleusercontent.com" ||
          u.hostname === "lh4.googleusercontent.com" ||
          u.hostname === "lh5.googleusercontent.com" ||
          u.hostname === "lh6.googleusercontent.com")
        ? u.href
        : null;
    } catch {
      return null;
    }
  }
  admin(id: string) {
    return !!this.db
      .prepare("SELECT 1 FROM gv_roles WHERE user_id=? AND role='admin'")
      .get(id);
  }
  close() {
    this.db.close();
  }
}
