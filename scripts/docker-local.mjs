import {spawnSync} from 'node:child_process';
const setup=spawnSync(process.execPath,['scripts/setup-docker-env.mjs'],{stdio:'inherit'});
if(setup.status!==0)process.exit(setup.status??1);
const watch=process.argv.includes('--watch');
const args=['compose','up','--build',...(watch?['--watch']:['--detach','--wait'])];
const result=spawnSync('docker',args,{stdio:'inherit'});
if(result.error){console.error('Docker is unavailable. Start Docker Desktop and retry.');process.exit(1);}
process.exit(result.status??1);
