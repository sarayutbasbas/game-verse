import {TOKEN,type Food} from '../games/critter-kitchen/data.js';
import {validateMeals,type MealContext,type MealPlayer} from '../games/critter-kitchen/scoring.js';
import type {Meal,CKView} from '../games/critter-kitchen/types.js';
/** Offer only complete drafts the authoritative meal validator accepts. */
export function winePairingOptions(context:MealContext,player:MealPlayer,meal:Meal,course:Food){
 if(context.critic!=='fruit-bat'||!meal.items.some(item=>item.as===course))return [];
 return player.storage.filter(id=>{
  if(TOKEN[id]?.kind!=='ingredient'||TOKEN[id].food!=='wine')return false;
  try{validateMeals(context,player,[{...meal,wine:[...(meal.wine??[]).filter(w=>w.course!==course),{token:id,course}]}],true);return true;}catch{return false;}
 });
}
export function pruneWinePairings(context:MealContext,player:MealPlayer,meal:Meal){
 // Test pairs independently so removing one invalid course preserves valid pairs.
 const candidates=meal.wine??[];meal.wine=[];
 for(const pair of candidates)if(winePairingOptions(context,player,meal,pair.course).includes(pair.token))meal.wine.push(pair);
}
export function challengeCompleted(view:Pick<CKView,'round'|'phase'>,index:number){
 if(index<0||index>5)return false;
 const round=index<3?3:6;
 return view.round>round||view.round===round&&['challenge-results','refrigeration','finished'].includes(view.phase);
}
