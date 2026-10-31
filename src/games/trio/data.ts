export const rank=(id:string)=>Number(id.split(':')[0]);
export const instances=()=>Array.from({length:12},(_,i)=>Array.from({length:3},(_,j)=>`${i+1}:${j}`)).flat();
export const HAND_COUNTS:Record<number,number>={3:9,4:7,5:6,6:5};
export const connected=(a:number,b:number)=>a!==b&&(a+b===7||Math.abs(a-b)===7);
export const links=(n:number)=>Array.from({length:12},(_,i)=>i+1).filter(m=>connected(n,m));
export const COLORS=['','#80388f','#ddb33f','#d97430','#c93e44','#c53c8a','#299260','#efcc8d','#376aa4','#2c9c91','#de725a','#704394','#1aaab4'];
export const art=(n:number)=>`/art/trio/card-${n}.webp`;
