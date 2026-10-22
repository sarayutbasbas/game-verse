import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';
import {ANIMAL} from '../src/games/harmonies/data.js';
import {cardRailTerrain,paperArtFolder,PAPER_SPIRIT_SCENARIOS,PAPER_TERRAIN_COLORS} from '../src/client/harmonies-paper.js';
import {cardFace,habitatLayout,setHarmoniesCardArt,illustratedHabitat} from '../src/client/harmonies-presentation.js';
test('all reviewed paper cards retain separate terrain-specific rails, catalog layers and shared-size habitats',()=>{
 setHarmoniesCardArt('illustrated');const views=new Set<string>(),terrains=new Set<string>();
 assert.equal(Object.keys(ANIMAL).length,63);
 for(const c of Object.values(ANIMAL)){
  const target=c.pattern.find(p=>p.cube)!;assert.equal(cardRailTerrain(c.id),target.stack.at(-1));terrains.add(cardRailTerrain(c.id));
  const small=cardFace(c.id,0,false,false,false),large=cardFace(c.id,0,true,false,false);
  assert.match(large,new RegExp(`/${paperArtFolder(c.id)}/${c.id}\\.webp`));assert.match(small,new RegExp(`/${paperArtFolder(c.id)}/${c.id}-small\\.webp`));
  assert.ok(large.includes(c.kind==='spirit'&&c.animal!=='trex'?'/rails-v6/spirit-rainbow.svg':`/rails-v6/${target.stack.at(-1)}.png`));assert.ok(!large.includes('baked-habitat'));
  assert.equal((large.match(/class="hm-pattern-stack"/g)||[]).length,c.pattern.length);
  assert.equal((large.match(/class="hm-habitat-token-image"/g)||[]).length,habitatLayout(c.id).cells.reduce((n,p)=>n+p.displayStack.length,0));
  assert.equal((large.match(/class="hm-habitat-model"/g)||[]).length,1);
  assert.equal((large.match(/class="hm-pattern-height"/g)||[]).length,0);
  assert.equal((small.match(/class="hm-pattern-height"/g)||[]).length,habitatLayout(c.id).cells.filter(p=>p.displayStack.length>1).length);
  const vb=illustratedHabitat(c.id,true).match(/viewBox="([^"]+)"/)![1].split(' ').map(Number);views.add(vb.slice(2).join(' '));
  if(c.kind==='spirit'){assert.ok(large.includes(`data-scoring-rule="${c.spiritScoring}"`));assert.ok(PAPER_SPIRIT_SCENARIOS[c.spiritScoring!]);assert.ok(!large.includes('>0</text>'));}
  if(c.kind==='whisper')assert.equal((large.match(/>2\/5<\/text>/g)||[]).length,2);
 }
 assert.equal(terrains.size,5);assert.equal(Object.keys(PAPER_TERRAIN_COLORS).length,6);assert.deepEqual([...views],['192 192']);
 assert.equal(cardRailTerrain('spirit-11'),'field');assert.equal(cardRailTerrain('spirit-09'),'water');assert.equal(cardRailTerrain('whisper-05'),'leaf');assert.equal(cardRailTerrain('animal-01'),'water');
});
test('every paper illustration has real full, small and lightweight WebP exports in 3:4',async()=>{
 for(const id of Object.keys(ANIMAL))for(const [suffix,width,height]of [['',900,1200],['-small',300,400],['-lite',150,200]]as const){
  const path=`public/art/harmonies/${paperArtFolder(id)}/${id}${suffix}.webp`,file=await readFile(path),meta=await sharp(file).metadata();assert.equal(meta.format,'webp',path);assert.equal(meta.width,width,path);assert.equal(meta.height,height,path);
 }
});

test('special card badges distinguish three categories and dinosaur scores use orange',async()=>{
 for(const [id,category] of [['spirit-11','dinosaur'],['spirit-09','spirit'],['whisper-05','whisper']]){
  for(const large of [false,true]){const face=cardFace(id,0,large,false,false);assert.match(face,new RegExp(`data-category="${category}"`));assert.match(face,new RegExp(`category-badges-v1/${category}\\.webp`));if(id==='spirit-11')assert.match(face,/--paper-score-fill:#bd501c/);}
  const meta=await sharp(`public/art/harmonies/category-badges-v1/${category}.webp`).metadata();assert.equal(meta.hasAlpha,true);assert.equal(meta.width,160);
 }
 assert.doesNotMatch(cardFace('animal-01',0,false,false,false),/hm-category-badge/);
});
