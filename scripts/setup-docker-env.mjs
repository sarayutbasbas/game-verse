import {existsSync,readFileSync,writeFileSync,chmodSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {networkInterfaces} from 'node:os';
import {parseEnv} from 'node:util';
if(existsSync('.env.docker')) {
  chmodSync('.env.docker',0o600);
  console.log('Kept existing private .env.docker (auth secret and local data stay stable).');
  process.exit(0);
}
// Reuse only local OAuth credentials, never production DB, auth secret or admin IDs.
const source=existsSync('.env')?parseEnv(readFileSync('.env','utf8')):{};
const addresses=Object.entries(networkInterfaces()).sort(([a],[b])=>(a==='en0'?-1:b==='en0'?1:0)).flatMap(([,list])=>list??[]);
const lan=addresses.find(a=>a.family==='IPv4'&&!a.internal&&/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(a.address));
const joinOrigin=process.env.GAMEVERSE_DOCKER_JOIN_ORIGIN??(lan?'http://'+lan.address+':5555':'http://localhost:5555');
const fields={
 BETTER_AUTH_URL:'http://localhost:5555',BETTER_AUTH_SECRET:randomBytes(48).toString('base64'),
 GOOGLE_CLIENT_ID:source.GOOGLE_CLIENT_ID??'',GOOGLE_CLIENT_SECRET:source.GOOGLE_CLIENT_SECRET??'',
 GAMEVERSE_JOIN_ORIGIN:joinOrigin,
 GAMEVERSE_TRUSTED_ORIGINS:[joinOrigin,'http://127.0.0.1:5555'].join(','),
};
const content='# Private local Docker config. Never commit or paste secrets.\n'+Object.entries(fields).map(([k,v])=>k+'='+JSON.stringify(v).replace(/\$/g,'$$$$')).join('\n')+'\n';
writeFileSync('.env.docker',content,{mode:0o600,flag:'wx'});
console.log('Created private .env.docker; local Docker uses its own persistent volume and auth secret.');
console.log('Local URL: http://localhost:5555; phone join origin: '+joinOrigin);
