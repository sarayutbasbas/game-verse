// Only remove rooms owned by IDs recorded by the freshly-created Guest fixture.
// Never select rooms by name, age, game, or a broad production-wide DELETE.
import {readFileSync,renameSync} from 'node:fs';
import {Pool} from 'pg';
const owners=[...new Set(readFileSync('data/deploy-test-owners.jsonl','utf8').trim().split('\n').filter(Boolean).map(s=>JSON.parse(s).id))];
if(!process.env.GAMEVERSE_E2E_DATABASE_URL || !owners.length)throw Error('Explicit fixture database and recorded owner IDs required');
const pool=new Pool({connectionString:process.env.GAMEVERSE_E2E_DATABASE_URL,max:1});const c=await pool.connect();
try{
 await c.query('BEGIN');await c.query('SELECT pg_advisory_xact_lock(73829101)');
 const records=(await c.query("SELECT code,state FROM gv_rooms WHERE state::jsonb->>'ownerId'=ANY($1::text[])",[owners])).rows;
 const ids=new Set<string>(owners);
 for(const row of records){const r=JSON.parse(row.state);for(const p of r.players)if(p.userId)ids.add(p.userId);for(const s of r.sessions)await c.query('DELETE FROM gv_presence WHERE token=$1',[s.token]);await c.query('DELETE FROM gv_rooms WHERE code=$1',[row.code]);}
 // Never delete a real provider account, even if it joined a fixture room.
 const removable=(await c.query('SELECT id FROM "user" WHERE id=ANY($1::text[]) AND NOT EXISTS(SELECT 1 FROM account WHERE "userId"="user".id) AND ("isAnonymous"=true OR id=ANY($2::text[]))',[[...ids],owners])).rows.map(r=>r.id);
 for(const table of ['session','account'])await c.query(`DELETE FROM ${table} WHERE "userId"=ANY($1::text[])`,[removable]);
 for(const table of ['gv_recent','gv_profiles','gv_roles'])await c.query(`DELETE FROM ${table} WHERE user_id=ANY($1::text[])`,[removable]);
 await c.query('DELETE FROM "user" WHERE id=ANY($1::text[])',[removable]);await c.query('COMMIT');
 renameSync('data/deploy-test-owners.jsonl','data/deploy-test-owners-cleaned-'+Date.now()+'.jsonl');
 console.log(JSON.stringify({fixtureRoomsRemoved:records.length,fixtureUsersRemoved:removable.length}));
}catch(e){await c.query('ROLLBACK');throw Error('Fixture cleanup failed; no broad cleanup attempted');}finally{c.release();await pool.end();}
