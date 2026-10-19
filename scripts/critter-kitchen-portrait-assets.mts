import sharp from 'sharp';
import {mkdir,readFile,writeFile} from 'node:fs/promises';

const folder='public/art/critter-kitchen';
const jobs=JSON.parse(await readFile('docs/games/critter-kitchen/portrait-art-jobs.json','utf8')) as {id:string;prompt:string;path:string}[];
const manifestPath='docs/games/critter-kitchen/asset-manifest.json';
const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
await mkdir(`${folder}/portrait`,{recursive:true});
await mkdir(`${folder}/thumbs/portrait`,{recursive:true});
for(const job of jobs){
  if(!/^(challenge|critic)-[a-z-]+$/.test(job.id))throw Error('Invalid portrait component');
  const source=sharp(job.path),metadata=await source.metadata();
  if(!metadata.width||!metadata.height||metadata.height<=metadata.width)throw Error(`Not portrait: ${job.id}`);
  await source.resize(600,800,{fit:'cover'}).webp({quality:85,effort:5}).toFile(`${folder}/portrait/${job.id}.webp`);
  await sharp(`${folder}/portrait/${job.id}.webp`).resize({width:240}).webp({quality:74,effort:5}).toFile(`${folder}/thumbs/portrait/${job.id}.webp`);
  const asset=manifest.assets.find((asset:{componentId:string})=>asset.componentId===job.id);
  if(!asset)throw Error(`Missing component: ${job.id}`);
  asset.previousPath??=asset.path;
  asset.previousSource??=asset.source;
  Object.assign(asset,{path:`/art/critter-kitchen/portrait/${job.id}.webp`,source:job.path,generator:'built-in image_gen',aspectRatio:'3:4',revisedAt:'2026-10-19'});
}
await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
console.log(`Prepared ${jobs.length} portrait cards and thumbnails`);
