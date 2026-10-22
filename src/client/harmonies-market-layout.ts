/** Public card IDs only. Preserve visual slots across pickup, rerender and reload. */
export function harmoniesMarketLayout(code:string,sequence:number,market:string[],size:number,previous:(string|null)[]){
 const key='gameverse:harmonies:market:'+code;
 let slots=previous;
 if(!slots.length){try{const cached=JSON.parse(sessionStorage.getItem(key)??'null');if(cached&&Number.isInteger(cached.sequence)&&cached.sequence<=sequence&&Array.isArray(cached.slots)&&cached.slots.length===size&&cached.slots.every((id:unknown)=>id===null||typeof id==='string'))slots=cached.slots;}catch{}}
 slots=Array.from({length:size},(_,i)=>slots[i]&&market.includes(slots[i]!)?slots[i]:null);
 for(const id of market.filter(id=>!slots.includes(id))){const hole=slots.indexOf(null);if(hole>=0)slots[hole]=id;}
 try{sessionStorage.setItem(key,JSON.stringify({sequence,slots}));}catch{}
 return slots;
}
