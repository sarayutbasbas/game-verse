import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import sharp from 'sharp';
import {setHarmoniesCardArt,terrainPrint,cardFace} from '../src/client/harmonies-presentation.js';
import {terrainPickerPrint} from '../src/client/harmonies-token-art.js';
import {ANIMAL} from '../src/games/harmonies/data.js';
test('2D softened 3D textures retain every alpha pixel and original 3D geometry',async()=>{
 const terrains=['water','rock','wood','leaf','field','building'] as const;
 for(const t of terrains){setHarmoniesCardArt('illustrated');assert.equal(terrainPrint(t),`/art/harmonies/tokens-soft-v1/${t}.svg`);const {data,info}=await sharp('public'+terrainPrint(t)).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(info.width,256);assert.equal(info.height,224);assert.equal(terrainPickerPrint(t),`/art/harmonies/tokens-soft-v1/${t}.png`);const picker=await sharp('public'+terrainPickerPrint(t)).ensureAlpha().raw().toBuffer();assert.deepEqual(picker,data,`${t}: picker retains card colors, detail and alpha`);const original=await sharp(`public/art/harmonies/tokens-v5/${t}.png`).ensureAlpha().raw().toBuffer();for(let i=3;i<data.length;i+=4)assert.equal(data[i],original[i],`${t} alpha at ${i}`);for(const [x,y]of [[128,85],[128,143],[128,190]])assert.ok(data[(y*256+x)*4+3]>240);for(const [x,y]of [[20,85],[128,10],[128,210]])assert.equal(data[(y*256+x)*4+3],0);setHarmoniesCardArt('sculpted');assert.match(terrainPrint(t),new RegExp(`/tokens-v5/${t}.png`));}
 setHarmoniesCardArt('illustrated');
});
test('special cards have generated art without rims and large scenario values below their tokens',async()=>{
 const manifest=JSON.parse(await readFile('docs/games/harmonies/special-paper-v1-jobs.json','utf8'));assert.equal(manifest.jobs.length,27);
 for(const c of Object.values(ANIMAL))for(const size of [false,true]){const face=cardFace(c.id,0,size,false,false);assert.doesNotMatch(face,/hm-paper-edge/);if(c.kind)assert.match(face,new RegExp(`/special-paper-v1/${c.id}`));if(c.kind==='spirit'){assert.match(face,/hm-scenario-tokens/);assert.match(face,/x="60"[^>]*hm-scenario-number/);}if(c.kind==='whisper')assert.match(face,/font-size:32px">2\/5/);}
});
test('four generated Sanctuary miniatures retain transparent backgrounds and uniform export bounds',async()=>{
 const {SANCTUARY}=await import('../src/games/harmonies/sanctuaries.js');const {sanctuaryFace}=await import('../src/client/harmonies-sanctuaries.js');
 for(const id of Object.keys(SANCTUARY)){const {data,info}=await sharp(`public/art/harmonies/sanctuaries-v2/${id}-model.webp`).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(info.width,256);assert.equal(info.height,224);assert.equal(data[3],0);assert.equal(data.at(-1),0);assert.ok(data.some((v,i)=>i%4===3&&v===255));assert.doesNotMatch(sanctuaryFace(id),/<h3|<p>|<strong|<small/);}
});

test('Small and large 2D card diagrams use precolored lossless pixels without nested SVG color filters',async()=>{
 const {terrainCardPrint}=await import('../src/client/harmonies-token-art.js'),{sanctuaryFace}=await import('../src/client/harmonies-sanctuaries.js'),{SANCTUARY}=await import('../src/games/harmonies/sanctuaries.js');
 setHarmoniesCardArt('illustrated');
 for(const card of Object.values(ANIMAL))for(const large of[false,true]){
  const face=cardFace(card.id,0,large,false,false);
  assert.doesNotMatch(face,/tokens-soft-v1\/\w+\.svg/);
  for(const t of new Set(card.pattern.flatMap(p=>p.stack)))assert.ok(face.includes(terrainCardPrint(t)),`${card.id} ${large} ${t}`);
 }
 for(const id of Object.keys(SANCTUARY))for(const compact of[false,true])assert.doesNotMatch(sanctuaryFace(id,false,undefined,compact),/tokens-soft-v1\/\w+\.svg/);
 for(const t of ['water','rock','wood','leaf','field','building']as const){
  assert.equal(terrainCardPrint(t),`/art/harmonies/tokens-soft-v1/${t}.png`);
  setHarmoniesCardArt('sculpted');assert.equal(terrainCardPrint(t),terrainPrint(t));setHarmoniesCardArt('illustrated');
 }
});
