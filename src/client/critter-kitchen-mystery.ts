import type {CKView} from '../games/critter-kitchen/types.js';
import './critter-kitchen-mystery.css';
/** The merchant's draw happens on arrival, not while players plan their routes. */
export function midnightMysteryCount(v:CKView){
 const index=v.config.locations.findIndex(l=>l.id==='midnight');if(index<0)return 0;
 const pending=['restaurateurs','planning','running'].includes(v.phase)||v.phase==='shopping'&&(v.location===null||v.config.locations.findIndex(l=>l.id===v.location)<index);
 return pending?v.config.locations[index].slots:0;
}
export function mysteryStock(count:number,shape:'circle'|'card'|'display'){
 return Array.from({length:count},(_,i)=>{
  const face=`<span class="${shape==='circle'?'ck-route-stock-item ck-mystery-circle':'ck-token ck-mystery-card'}" role="img" aria-label="ของสุ่มที่ยังไม่เปิด ชิ้นที่ ${i+1}"><b aria-hidden="true">?</b>${shape==='circle'?'':'<small>รอเปิดของสุ่ม</small>'}</span>`;
  return shape==='circle'?face:`<div class="${shape==='display'?'ck-d-item':'ck-market-token'} ck-mystery-item" data-ui-key="mystery-${shape}-${i}">${face}</div>`;
 }).join('');
}
