const key='gameverse:harmonies:low-effects';
let preference:boolean|undefined;
export function harmoniesLowEffects(){
 if(preference!==undefined)return preference;
 if(typeof window==='undefined')return false;
 try{const value=localStorage.getItem(key);if(value==='on'||value==='off')return preference=value==='on';}catch{}
 return preference=/Android/i.test(navigator.userAgent)||matchMedia('(prefers-reduced-motion: reduce)').matches;
}
export function applyHarmoniesEffects(){document.documentElement.classList.toggle('hm-low-effects',harmoniesLowEffects());}
export function setHarmoniesLowEffects(value:boolean){preference=value;try{localStorage.setItem(key,value?'on':'off');}catch{}applyHarmoniesEffects();}
export function harmoniesReducedMotion(){return harmoniesLowEffects()||matchMedia('(prefers-reduced-motion: reduce)').matches;}
