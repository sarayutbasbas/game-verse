import type {HarmoniesCardArt} from './harmonies-presentation.js';
const key='gameverse:harmonies:card-art';
let preference:HarmoniesCardArt|null|undefined;
export function harmoniesArtStyle(fallback:HarmoniesCardArt='illustrated'):HarmoniesCardArt{
 if(preference===undefined){preference=null;try{if(typeof localStorage!=='undefined'){const value=localStorage.getItem(key);if(value==='illustrated'||value==='sculpted'||value==='original')preference=value;}}catch{}}
 return preference??fallback;
}
export function setHarmoniesArtPreference(style:HarmoniesCardArt){preference=style;try{localStorage.setItem(key,style);}catch{}}
