export function relativeTime(timestamp:number,now=Date.now()):string{
 const minutes=Math.max(0,Math.floor((now-timestamp)/60000));
 if(minutes<1)return 'เมื่อสักครู่';
 if(minutes<60)return `${minutes} นาทีที่แล้ว`;
 const hours=Math.floor(minutes/60);if(hours<24)return `${hours} ชม. ที่แล้ว`;
 const days=Math.floor(hours/24);if(days<30)return `${days} วันที่แล้ว`;
 return days<365?`${Math.floor(days/30)} เดือนที่แล้ว`:`${Math.floor(days/365)} ปีที่แล้ว`;
}
export function relativeTimeMarkup(timestamp:number|undefined,label:string){
 if(!timestamp||!Number.isFinite(timestamp))return '';
 return `<time class="relative-time" datetime="${new Date(timestamp).toISOString()}" data-relative-time="${timestamp}" title="${label}">${relativeTime(timestamp)}</time>`;
}
// Refresh visible labels without replacing expanded guides or focused controls.
setInterval(()=>document.querySelectorAll<HTMLElement>('[data-relative-time]').forEach(el=>{el.textContent=relativeTime(Number(el.dataset.relativeTime));}),30000);
