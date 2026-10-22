import {test} from 'node:test';
import assert from 'node:assert/strict';
import {access} from 'node:fs/promises';
import {ANIMAL} from '../src/games/harmonies/data.js';
import {paperArtFolder} from '../src/client/harmonies-paper.js';
import {optionsFor} from '../src/games/harmonies/expansions.js';
import {createInitialState,getDisplayView} from '../src/games/harmonies/engine.js';
import {validateHarmoniesState} from '../src/games/harmonies/validation.js';
import {animalArt,animalFigure,animalModelArt,cardFace,habitatDiagram,setHarmoniesCardArt} from '../src/client/harmonies-presentation.js';

test('both complete art families retain identical rules with style-matched models, with illustrated default and distinct patch keys',async()=>{
 for(const id of Object.keys(ANIMAL).filter(id=>ANIMAL[id].expansion!=='pulse')){
  setHarmoniesCardArt();assert.match(animalArt(id),/^\/art\/harmonies\/(?:paper-v6|special-paper-v1)\//);
  const flat=cardFace(id,0,true,false,false),model=animalFigure(id);
  setHarmoniesCardArt('sculpted');const old=cardFace(id,0,true,false,false);
  assert.match(animalArt(id),/reference/);assert.notEqual(flat,old);
  assert.ok(flat.includes('hm-printed-habitat'));assert.ok(flat.includes('hm-pattern-stack'));assert.ok(flat.includes(`art-illustrated-paper-v6-${id}`));
  assert.ok(old.includes('hm-pattern-stack'));assert.match(model,/figurines/);assert.match(animalFigure(id),/figurines/);assert.ok(old.includes(`art-sculpted-habitat-v4-${id}`));
  const folder=paperArtFolder(id);
  for(const suffix of ['','-small','-lite'])await access(`public/art/harmonies/${folder}/${id}${suffix}.webp`);
  for(const suffix of ['','-small','-lite'])await access(`public/art/harmonies/reference/${id}${suffix}.webp`);
 }
 setHarmoniesCardArt();
});

test('paper v6 renders the canonical axial stacks, cube destination and score values from the catalog',()=>{
 setHarmoniesCardArt('illustrated');
 for(const card of Object.values(ANIMAL).filter(card=>/^animal-0[1-5]$/.test(card.id))){
  const small=cardFace(card.id,0,false,false,false),popup=cardFace(card.id,0,true,false,false);
  for(const pattern of card.pattern){
   const attrs=`data-q="${pattern.q}" data-r="${pattern.r}" data-stack-height="${pattern.stack.length}" data-cube-cell="${pattern.cube?'true':'false'}"`;
   assert.ok(small.includes(attrs),`${card.id} small is missing ${attrs}`);
   assert.ok(popup.includes(attrs),`${card.id} popup is missing ${attrs}`);
  }
  assert.equal((small.match(/class="hm-pattern-stack"/g)??[]).length,card.pattern.length);
  assert.equal((small.match(/data-cube-cell="true"/g)??[]).length,1);
  assert.match(small,new RegExp(`/rails-v6/${card.pattern.find(p=>p.cube)!.stack.at(-1)}-small\\.png`));
  assert.match(small,/hm-joined-hex/);
  assert.match(small,/hm-paper-score-row/);
  for(const score of card.points)assert.ok(small.includes(`>${score}</text>`),`${card.id} is missing score ${score}`);
  if(card.pattern.some(pattern=>pattern.stack.length>1))assert.match(small,/hm-pattern-height/);
  assert.match(popup,/paper-v6\/animal-0[1-5]\.webp/);
 }
});
test('art option survives projections/restore without changing random setup; rejects malformed client values',()=>{
 const seats=[{id:'p1',name:'หนึ่ง'},{id:'p2',name:'สอง'}];
 const a=createInitialState(seats,()=>.4,undefined,'A',{cardArt:'illustrated',natureSpirits:true,whispers:true});
 const b=createInitialState(seats,()=>.4,undefined,'A',{cardArt:'sculpted',natureSpirits:true,whispers:true});
 assert.deepEqual({...a,options:undefined},{...b,options:undefined});
 const c=createInitialState(seats,()=>.4,undefined,'A',{cardArt:'original',natureSpirits:true,whispers:true});
 assert.deepEqual({...a,options:undefined},{...c,options:undefined});
 for(const state of [a,b,c]){
  assert.equal(validateHarmoniesState(JSON.parse(JSON.stringify(state))),true);
  assert.equal(getDisplayView(state,'CODE',1).options?.cardArt,state.options?.cardArt);
 }
 assert.deepEqual(optionsFor(),{solo:false,natureSpirits:false,whispers:false});
 for(const value of [null,true,{},'unknown','../../secret'])assert.throws(()=>optionsFor({cardArt:value} as any));
});

test('every board and placement-preview animal matches its shelf image; crystals stay on cards',async()=>{
 try{for(const style of ['illustrated','sculpted'] as const){setHarmoniesCardArt(style);for(const id of Object.keys(ANIMAL).filter(id=>ANIMAL[id].expansion!=='pulse')){
  const path=animalModelArt(id);await access('public'+path);
  for(const figure of [animalFigure(id,2),animalFigure(id,2,true),animalFigure(id,0,false,true)]){
   assert.ok(figure.includes(`src="${path}"`));assert.doesNotMatch(figure,/hm-crystal-marker|baked-cards-v1\/crystal/);
  }
  assert.match(habitatDiagram(id,true),/class="hm-habitat-model"/);
 }}}finally{setHarmoniesCardArt('illustrated');}
});
