import { PlatformStore } from '../src/server/store.js';
import { createAuth } from '../src/server/auth.js';
if (!/^postgres(?:ql)?:/.test(process.env.GAMEVERSE_DATABASE_URL ?? '')) throw Error('Set GAMEVERSE_DATABASE_URL to the target Postgres database');
process.env.GAMEVERSE_MIGRATE='1';
const store=new PlatformStore();
const runtime=await createAuth(store,()=>{throw Error('No account linking during migrations')},process.env.BETTER_AUTH_URL??'http://localhost:3000');
await runtime.auth.$context;
runtime.close();store.close();console.log('GameVerse Postgres migrations complete');
