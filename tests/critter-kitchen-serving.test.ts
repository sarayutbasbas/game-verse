import type {Meal} from '../src/games/critter-kitchen/types.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TOKENS,type Food} from '../src/games/critter-kitchen/data.js';
import {emptyMeal,validateMeals,type MealContext,type MealPlayer} from '../src/games/critter-kitchen/scoring.js';
import {winePairingOptions,pruneWinePairings,challengeCompleted} from '../src/client/critter-kitchen-serving.js';
const ids=(food:Food,value:number)=>TOKENS.filter(t=>t.kind==='ingredient'&&t.food===food&&t.value===value).map(t=>t.id);
test('Fruit Bat offers only matching printed-value wine, never a used token or another critic bonus',()=>{
 const bread=ids('bread',6)[0],fish=ids('fish',6)[0],wine=ids('wine',6)[0],wrong=ids('wine',5)[0];
 const context:MealContext={critic:'fruit-bat',round:7,challenges:[]},player:MealPlayer={storage:[bread,fish,wine,wrong],soup:0,bisque:0,known:[],restaurateur:null},meal:Meal={...emptyMeal(),items:[{token:bread,as:'bread' as const}]};
 assert.deepEqual(winePairingOptions(context,player,meal,'bread'),[wine]);
 meal.wine=[{token:wine,course:'bread'}];assert.doesNotThrow(()=>validateMeals(context,player,[meal],true));
 meal.items.push({token:fish,as:'fish'});assert.deepEqual(winePairingOptions(context,player,meal,'fish'),[]);
 assert.deepEqual(winePairingOptions({...context,critic:'mouse'},player,meal,'bread'),[]);
 assert.throws(()=>validateMeals(context,player,[{...meal,wine:[{token:wrong,course:'bread'}]}],true),/เลขพิมพ์/);
 meal.items.splice(0,1);pruneWinePairings(context,player,meal);assert.deepEqual(meal.wine,[]);
 assert.deepEqual(winePairingOptions(context,player,meal,'fish'),[wine]);
});
test('Challenge faces turn grayscale only after each three-round batch has resolved',()=>{
 for(const phase of ['planning','shopping','challenge'] as const)assert.equal(challengeCompleted({round:3,phase},0),false);
 for(const phase of ['challenge-results','refrigeration'] as const){assert.equal(challengeCompleted({round:3,phase},2),true);assert.equal(challengeCompleted({round:3,phase},3),false);}
 assert.deepEqual([0,1,2,3,4,5].map(i=>challengeCompleted({round:4,phase:'planning'},i)),[true,true,true,false,false,false]);
 assert.equal(challengeCompleted({round:6,phase:'challenge'},5),false);
 assert.equal(challengeCompleted({round:6,phase:'challenge-results'},5),true);
 assert.ok([0,1,2,3,4,5].every(i=>challengeCompleted({round:7,phase:'critic'},i)));
});
