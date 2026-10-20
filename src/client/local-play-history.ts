const key='gameverse:name-it:last-played:v1';
export function recordLocalPlay(){try{localStorage.setItem(key,String(Date.now()));}catch{/* The local game also works without storage. */}}
export function localPlayHistory(){try{const startedAt=Number(localStorage.getItem(key));return Number.isFinite(startedAt)&&startedAt>0?[{gameId:'name-it',startedAt}]:[];}catch{return [];}}
