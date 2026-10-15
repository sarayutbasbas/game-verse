import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PlatformStore} from '../src/server/store.js';
test('empty optional Postgres URL uses configured SQLite path instead of a temporary database',()=>{
 const database=process.env.GAMEVERSE_DATABASE_URL,path=process.env.GAMEVERSE_DB_PATH;
 try {
  process.env.GAMEVERSE_DATABASE_URL='';process.env.GAMEVERSE_DB_PATH=':memory:';
  const store=new PlatformStore();try {assert.equal(store.path,':memory:');assert.equal(store.distributed,false);assert.equal(store.loadRooms().length,0);}finally{store.close();}
 } finally {
  if(database===undefined)delete process.env.GAMEVERSE_DATABASE_URL;else process.env.GAMEVERSE_DATABASE_URL=database;
  if(path===undefined)delete process.env.GAMEVERSE_DB_PATH;else process.env.GAMEVERSE_DB_PATH=path;
 }
});
