import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {randomBytes} from 'node:crypto';
if(existsSync('.env')){console.log('.env exists; left unchanged');process.exit(0);}
let secret;
const path=process.env.GAMEVERSE_DB_PATH??'./data/gameverse.sqlite';
if(existsSync(path)){
 const db=new DatabaseSync(path,{readOnly:true});
 try {secret=db.prepare('SELECT secret FROM gv_local_secret WHERE id=1').get()?.secret;}catch{}finally{db.close();}
}
secret??=randomBytes(48).toString('base64');
const template=readFileSync('.env.example','utf8').replace(/^BETTER_AUTH_SECRET=$/m,`BETTER_AUTH_SECRET=${secret}`);
writeFileSync('.env',template,{mode:0o600,flag:'wx'});
console.log('Created private .env. Add Google credentials there; never send secrets in chat.');
