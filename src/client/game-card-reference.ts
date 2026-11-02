import type {GameId} from '../shared/types.js';
import {metadata} from '../shared/catalog.js';
import {esc} from './platform.js';
import type {ReferenceCard} from './game-card-reference-data.js';
import './game-card-reference.css';
const components=new Set<GameId>(['azul','draftosaurus','perch','sky-team']);
export function cardReferenceButton(id:GameId){return `<button class="entry-card-reference" type="button" data-card-reference="${id}"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="7" y="3" width="14" height="18" rx="2"/><path d="M3 7v12a3 3 0 0 0 3 3M11 8h6m-6 4h6m-6 4h3"/></svg>${components.has(id)?'ดูอุปกรณ์และความสามารถ':'ดูการ์ดทั้งหมด'}</button>`;}
let active:HTMLDialogElement|undefined;
export function bindCardReference(root:HTMLElement){
 root.querySelectorAll<HTMLButtonElement>('[data-card-reference]').forEach(trigger=>trigger.onclick=()=>void open(trigger.dataset.cardReference as GameId,trigger));
}
async function open(id:GameId,trigger:HTMLButtonElement){
 if(active?.open)return;
 const dialog=active=document.createElement('dialog');dialog.className='game-card-reference';dialog.setAttribute('aria-labelledby','reference-title');
 const label=components.has(id)?'อุปกรณ์และความสามารถ':'คลังการ์ด';
 dialog.innerHTML=`<header><button type="button" data-reference-back hidden aria-label="กลับไปการ์ดทั้งหมด">← กลับ</button><h2 id="reference-title">${label} · ${esc(metadata(id)?.name)}</h2><button type="button" data-reference-close aria-label="ปิดคลังการ์ด">×</button></header><div class="reference-content"><p role="status">กำลังโหลด${label}…</p></div>`;
 dialog.querySelector<HTMLButtonElement>('[data-reference-close]')!.onclick=()=>dialog.close();
 dialog.onclose=()=>{dialog.remove();if(active===dialog)active=undefined;const target=trigger.isConnected?trigger:document.querySelector<HTMLButtonElement>(`[data-card-reference="${id}"]`);target?.focus({preventScroll:true});};
 document.body.append(dialog);dialog.showModal();
 const content=dialog.querySelector<HTMLElement>('.reference-content')!,back=dialog.querySelector<HTMLButtonElement>('[data-reference-back]')!,title=dialog.querySelector<HTMLElement>('h2')!;
 try{
  if(id==='harmonies'){
   const {openHarmoniesCardLibrary}=await import('./harmonies-card-library.js');
   if(!dialog.open)return;
   dialog.close();openHarmoniesCardLibrary(trigger);return;
  }
  const {referenceCards}=await import('./game-card-reference-data.js');const cards=await referenceCards(id);
  if(!dialog.open)return;
  let group='',query='',page=0,selectedId='',listScroll=0;const size=12,groups=[...new Set(cards.map(c=>c.group))];
  const picture=(c:ReferenceCard)=>c.image?`<img src="${esc(c.image)}" alt="" loading="lazy" decoding="async">`:c.diagram??`<span class="reference-card-symbol" aria-hidden="true">${esc(c.badge??'▤')}</span>`;
  function list(restore=false){
   back.hidden=true;title.textContent=`${label} · ${metadata(id)?.name}`;
   content.innerHTML=`<div class="reference-controls"><label>ค้นหา<input type="search" name="reference-search" placeholder="ชื่อหรือความสามารถ" value="${esc(query)}"></label><label>หมวดหมู่<select name="reference-group"><option value="">ทั้งหมด</option>${groups.map(g=>`<option value="${esc(g)}" ${group===g?'selected':''}>${esc(g)}</option>`).join('')}</select></label></div><p class="reference-count" role="status"></p><div class="reference-grid"></div><nav class="reference-pages" aria-label="หน้าคลังการ์ด"></nav>`;
   const search=content.querySelector<HTMLInputElement>('input')!,select=content.querySelector<HTMLSelectElement>('select')!;
   function results(){
    const needle=query.trim().toLocaleLowerCase('th'),matching=cards.filter(c=>(!group||c.group===group)&&(!needle||`${c.name} ${c.body.replace(/<[^>]*>/g,' ')}`.toLocaleLowerCase('th').includes(needle)));
    const pages=Math.max(1,Math.ceil(matching.length/size));page=Math.min(page,pages-1);
    content.querySelector('.reference-count')!.textContent=`${matching.length} แบบ${matching.length?` · หน้า ${page+1}/${pages}`:''}`;
    content.querySelector('.reference-grid')!.innerHTML=matching.slice(page*size,(page+1)*size).map(c=>`<button type="button" class="reference-card" data-reference-card="${esc(c.id)}" aria-label="ดู ${esc(c.name)}"><span class="reference-card-art">${picture(c)}${c.image&&c.badge?`<b>${esc(c.badge)}</b>`:''}</span><strong>${esc(c.name)}</strong><small>${esc(c.group)}</small></button>`).join('')||'<p>ไม่พบการ์ดที่ตรงกัน ลองเปลี่ยนคำค้นหรือหมวดหมู่</p>';
    content.querySelector('.reference-pages')!.innerHTML=pages>1?`<button type="button" data-page="prev" ${page===0?'disabled':''}>ก่อนหน้า</button><span>${page+1} / ${pages}</span><button type="button" data-page="next" ${page===pages-1?'disabled':''}>ถัดไป</button>`:'';
    content.querySelectorAll<HTMLButtonElement>('[data-reference-card]').forEach(b=>b.onclick=()=>detail(cards.find(c=>c.id===b.dataset.referenceCard)!,b));
    content.querySelectorAll<HTMLButtonElement>('[data-page]').forEach(b=>b.onclick=()=>{page+=b.dataset.page==='next'?1:-1;results();dialog.scrollTop=0;content.querySelector<HTMLButtonElement>(`[data-page="${b.dataset.page}"]:not(:disabled)`)?.focus({preventScroll:true});});
   }
   search.oninput=()=>{query=search.value;page=0;results();};select.onchange=()=>{group=select.value;page=0;results();};results();
   if(restore){dialog.scrollTop=listScroll;[...content.querySelectorAll<HTMLButtonElement>('[data-reference-card]')].find(b=>b.dataset.referenceCard===selectedId)?.focus({preventScroll:true});}
  }
  function detail(c:ReferenceCard,_button:HTMLButtonElement){
   selectedId=c.id;listScroll=dialog.scrollTop;back.hidden=false;title.textContent=c.name;
   content.innerHTML=`<article class="reference-detail"><div class="reference-detail-art">${picture(c)}</div><div class="reference-detail-copy"><p class="reference-detail-group">${esc(c.group)}</p><h3>${esc(c.name)}</h3>${c.image&&c.badge?`<p class="reference-value">${esc(c.badge)}</p>`:''}${c.body}${c.image&&c.diagram?c.diagram:''}</div></article>`;
   dialog.scrollTop=0;back.focus({preventScroll:true});
  }
  back.onclick=()=>list(true);list();
 }catch{
  if(dialog.open){content.innerHTML='<p role="alert">โหลดคลังการ์ดไม่ได้ กรุณาลองอีกครั้ง</p><button type="button" data-reference-retry>ลองอีกครั้ง</button>';content.querySelector<HTMLButtonElement>('button')!.onclick=()=>{dialog.close();void open(id,trigger);};}
 }
}
