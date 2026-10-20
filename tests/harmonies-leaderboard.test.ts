import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {PlatformStore} from '../src/server/store.js';
import type {HarmoniesLeaderboardMode} from '../src/shared/harmonies-leaderboard.js';
const postgres=process.env.GAMEVERSE_TEST_LEADERBOARD_POSTGRES;
for(const backend of ['sqlite','postgres'])test(`Harmonies leaderboard ${backend}: top ten unique users per mode, personal bests, stable ties, profile/link and rollback`,{skip:backend==='postgres'&&!postgres},()=>{
 const store=new PlatformStore(backend==='sqlite'?':memory:':postgres!),time=Date.UTC(2026,9,19);
 const entry=(i:number,score=100+i)=>({userId:'rank-user-'+i,name:'ผู้เล่น '+i,avatar:null,score});
 const record=(mode:HarmoniesLeaderboardMode,entries:ReturnType<typeof entry>[],date=time)=>store.transaction(()=>store.recordHarmoniesScores(mode,entries,date));
 try{
  assert.deepEqual(store.harmoniesLeaderboards(),{solo:[],competitive:[]});
  for(const mode of ['solo','competitive'] as const)record(mode,Array.from({length:16},(_,i)=>entry(i,mode==='solo'?100+i:50+i)));
  for(const mode of ['solo','competitive'] as const){const rows=store.harmoniesLeaderboards()[mode];assert.equal(rows.length,10);assert.equal(rows[0].name,'ผู้เล่น 15');assert.equal(rows[9].name,'ผู้เล่น 6');assert.deepEqual(rows.map(r=>r.rank),[1,2,3,4,5,6,7,8,9,10]);assert.deepEqual(Object.keys(rows[0]).sort(),['achievedAt','avatar','name','rank','score']);}
  assert.equal(Number(store.db.prepare('SELECT COUNT(*) AS n FROM gv_harmonies_leaderboard').get()!.n),20);
  record('solo',[entry(15,1)],time+100);assert.equal(store.harmoniesLeaderboards().solo[0].score,115);assert.equal(store.harmoniesLeaderboards().solo[0].achievedAt,time);
  record('solo',[entry(15,200)],time+300);record('solo',[entry(15,200)],time+400);record('solo',[entry(14,200)],time+200);
  const rows=store.harmoniesLeaderboards().solo;assert.equal(rows[0].name,'ผู้เล่น 14');assert.equal(rows[1].name,'ผู้เล่น 15');assert.equal(rows[1].achievedAt,time+300);assert.equal(store.harmoniesLeaderboards().competitive[0].score,65);
  record('solo',[entry(0,100)],time+500);assert.equal(store.harmoniesLeaderboards().solo.length,10);assert.ok(!store.harmoniesLeaderboards().solo.some(r=>r.name==='ผู้เล่น 0'));
  store.db.prepare('INSERT INTO gv_profiles(user_id,name,avatar) VALUES(?,?,?)').run('rank-user-14','ชื่อใหม่',null);assert.equal(store.harmoniesLeaderboards().solo[0].name,'ชื่อใหม่');assert.equal(store.harmoniesLeaderboards().solo[0].avatar,null);
  record('solo',[entry(90,300)],time+600);store.transaction(()=>store.mergeHarmoniesScores('rank-user-90','rank-user-15',{name:'สมาชิกเดิม',avatar:null}));
  assert.equal(store.harmoniesLeaderboards().solo[0].score,300);assert.equal(store.harmoniesLeaderboards().solo[0].achievedAt,time+600);assert.equal(store.harmoniesLeaderboards().solo[0].name,'สมาชิกเดิม');assert.equal(Number(store.db.prepare('SELECT COUNT(*) AS n FROM gv_harmonies_leaderboard WHERE user_id=?').get('rank-user-90')!.n),0);
  const previous=store.harmoniesLeaderboards();assert.throws(()=>record('solo',[entry(1,-1)]));assert.deepEqual(store.harmoniesLeaderboards(),previous);
  assert.throws(()=>store.transaction(()=>{store.recordHarmoniesScores('solo',[entry(1,999)],time+700);throw Error('rollback');}));assert.deepEqual(store.harmoniesLeaderboards(),previous);
 }finally{store.close();}
});
test('Harmonies leaderboard SQLite migration preserves existing rooms and scores after reopening',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'harmonies-rank-store-')),path=join(dir,'db.sqlite');let store=new PlatformStore(path);
 try{
  store.db.prepare('INSERT INTO gv_recent VALUES(?,?,?)').run('existing-user','harmonies',100);
  store.transaction(()=>store.recordHarmoniesScores('solo',[{userId:'existing-user',name:'ผู้พิทักษ์',avatar:null,score:120}],100));store.close();store=new PlatformStore(path);
  assert.equal(store.harmoniesLeaderboards().solo[0].score,120);assert.equal(store.recent('existing-user').length,1);assert.equal(Number(store.db.prepare('SELECT COUNT(*) AS n FROM gv_migrations WHERE version=3').get()!.n),1);
 }finally{store.close();await rm(dir,{recursive:true,force:true});}
});
