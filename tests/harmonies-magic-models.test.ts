import {test} from 'node:test';import assert from 'node:assert/strict';
import {animalFigure,animalModelArt,illustratedHabitat,setHarmoniesCardArt} from '../src/client/harmonies-presentation.js';
import {ANIMAL} from '../src/games/harmonies/data.js';
test('all 21 special 2D figures and large-card models use the new family and twinkle accents, with original 3D intact',()=>{
 try{for(const c of Object.values(ANIMAL).filter(c=>c.expansion!=='pulse')){
  setHarmoniesCardArt('illustrated');const piece=animalFigure(c.id),large=illustratedHabitat(c.id,true);
  if(c.kind){assert.match(animalModelArt(c.id),/figurines\/magic-paper-v1\//);const tone=c.id==='spirit-11'?'gold':c.kind==='spirit'?'rainbow':'purple';assert.match(piece,new RegExp(`data-magic-tone="${tone}"`));assert.match(large,/hm-paper-model-stars/);}
  else{assert.match(animalModelArt(c.id),/figurines\/storybook-v1\//);assert.doesNotMatch(piece,/hm-model-twinkles/);assert.doesNotMatch(large,/hm-paper-model-stars/);}
  setHarmoniesCardArt('sculpted');assert.doesNotMatch(animalFigure(c.id),/hm-model-twinkles/);assert.doesNotMatch(illustratedHabitat(c.id,true),/hm-paper-model-stars/);assert.doesNotMatch(animalModelArt(c.id),/magic-paper/);
 }}finally{setHarmoniesCardArt('illustrated');}
});
