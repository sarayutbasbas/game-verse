import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {ANIMAL} from '../src/games/harmonies/data.js';
import {animalModelArt,setHarmoniesCardArt,animalFigure,illustratedHabitat} from '../src/client/harmonies-presentation.js';
test('all53 new 2D models share a padded canvas and ground baseline, with distinct art per card',async()=>{
 const manifest=JSON.parse(await readFile('docs/games/harmonies/storybook-v1-model-jobs.json','utf8')),magic=JSON.parse(await readFile('docs/games/harmonies/magic-paper-v1-model-jobs.json','utf8')),paths=new Set<string>(),hashes=new Set<string>();assert.equal(manifest.entries.length,53);
 try{setHarmoniesCardArt('illustrated');for(const card of Object.values(ANIMAL).filter(c=>c.expansion!=='pulse')){
  const path=animalModelArt(card.id);assert.match(path,card.kind?/figurines\/magic-paper-v1\//:/figurines\/storybook-v1\//);paths.add(path);
  const bytes=await readFile('public'+path),hash=createHash('sha256').update(bytes).digest('hex');hashes.add(hash);assert.equal(hash,(card.kind?magic:manifest).entries.find((j:any)=>j.id===card.id).sha256);
  const meta=await sharp(bytes).metadata();assert.equal(meta.width,160);assert.equal(meta.height,184);assert.equal(meta.hasAlpha,true);
  const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});let left=160,right=0,top=184,bottom=0;
  for(let y=0;y<184;y++)for(let x=0;x<160;x++)if(data[(y*160+x)*info.channels+3]>16){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  assert.ok(left>=7&&right<=152&&top>=7&&bottom>=172&&bottom<=176,`${card.id}: ${[left,top,right,bottom]}`);assert.ok(Math.abs((left+right)/2-79.5)<2,card.id);
  for(const piece of [animalFigure(card.id,2),animalFigure(card.id,2,true),animalFigure(card.id,0,false,true)])assert.ok(piece.includes(`src="${path}"`));
  assert.ok(illustratedHabitat(card.id,true).includes(`href="${path}"`));
 }}finally{setHarmoniesCardArt('illustrated');}
 assert.equal(paths.size,53);assert.equal(hashes.size,53);
});
test('3D model paths and original file contents remain unchanged for every card',async()=>{
 const manifest=JSON.parse(await readFile('docs/games/harmonies/storybook-v1-model-jobs.json','utf8'));assert.equal(manifest.preserved3D.length,53);
 try{setHarmoniesCardArt('sculpted');for(const before of manifest.preserved3D){assert.equal(animalModelArt(before.id),before.path);assert.equal(createHash('sha256').update(await readFile('public'+before.path)).digest('hex'),before.sha256);}}
 finally{setHarmoniesCardArt('illustrated');}
});
