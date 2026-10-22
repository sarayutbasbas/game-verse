import './harmonies-dialog.css';
import {SANCTUARY} from '../games/harmonies/sanctuaries.js';
import {sanctuaryFace,sanctuaryDescription} from './harmonies-sanctuaries.js';
import {ANIMAL} from '../games/harmonies/data.js';
import type {Terrain} from '../games/harmonies/types.js';
import {cardRailTerrain} from './harmonies-paper.js';
import {cardFace} from './harmonies-presentation.js';
import {esc} from './platform.js';

const COLORS:Terrain[]=['field','rock','leaf','wood','water','building'];
const groups=[['animal','สัตว์ธรรมดา'],['whisper','การ์ดเสียงกระซิบ'],['spirit','การ์ดสัตว์วิเศษ'],['dinosaur','การ์ดไดโนเสาร์'],['sanctuary','การ์ดวิหาร']] as const;
const category=(id:string)=>SANCTUARY[id]?'sanctuary':id==='spirit-11'?'dinosaur':ANIMAL[id].kind??'animal';
const cardName=(id:string)=>(SANCTUARY[id]??ANIMAL[id]).name;
const cardColor=(id:string)=>SANCTUARY[id]?.colors[0]??cardRailTerrain(id);
const libraryFace=(id:string,large=false)=>SANCTUARY[id]?sanctuaryFace(id,false,undefined,!large):cardFace(id,0,large,false,false);
const collator=new Intl.Collator('th',{numeric:true});
let active:HTMLDialogElement|undefined;
export const cardLibraryIcon='<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="7" y="3" width="14" height="18" rx="2"/><path d="M4 6H3v13a2 2 0 0 0 2 2"/></g><g fill="currentColor"><ellipse cx="14" cy="14.5" rx="3" ry="2.5"/><circle cx="10.5" cy="11" r="1.2"/><circle cx="13" cy="9" r="1.2"/><circle cx="16" cy="9.5" r="1.2"/><circle cx="18" cy="12" r="1.2"/></g></svg>';
export function closeHarmoniesCardLibrary(){active?.close();}
export function openHarmoniesCardLibrary(trigger:HTMLElement){
 active?.close();
 const d=active=document.createElement('dialog');d.className='hm-dialog hm-info-dialog hm-card-library';d.tabIndex=-1;d.setAttribute('aria-labelledby','hm-library-title');
 const cards=[...Object.keys(ANIMAL),...Object.keys(SANCTUARY)].sort((a,b)=>COLORS.indexOf(cardColor(a))-COLORS.indexOf(cardColor(b))||collator.compare(cardName(a),cardName(b))||a.localeCompare(b));
 d.innerHTML=`<header class="hm-info-header"><button class="hm-library-back" type="button" hidden aria-label="กลับไปการ์ดทั้งหมด"><span aria-hidden="true">←</span> กลับ</button><h2 id="hm-library-title">คลังการ์ด</h2><button class="hm-info-close" type="button" aria-label="ปิดคลังการ์ด"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg></button></header><div class="hm-info-content"><div class="hm-library-list"><p>ทั้งหมด ${cards.length} ใบ รวมภาคเสริม · เรียงตามสีแถบขวา<br>แตะการ์ดเพื่อดูใบใหญ่</p>${groups.map(([key,label])=>{const ids=cards.filter(id=>category(id)===key);return `<section class="hm-library-category" data-library-category="${key}" aria-labelledby="hm-library-${key}"><h3 id="hm-library-${key}">${label} <small>${ids.length} ใบ</small></h3><div class="hm-library-grid">${ids.map(id=>`<article class="hm-animal" data-library-card="${id}" data-library-color="${cardColor(id)}"><button class="hm-inspect" type="button" aria-label="ดู ${esc(cardName(id))}">${libraryFace(id)}</button><span class="sr-only">${esc(cardName(id))}</span></article>`).join('')}</div></section>`;}).join('')}</div><div class="hm-library-detail" hidden></div></div>`;
 const list=d.querySelector<HTMLElement>('.hm-library-list')!,detail=d.querySelector<HTMLElement>('.hm-library-detail')!,back=d.querySelector<HTMLButtonElement>('.hm-library-back')!,title=d.querySelector<HTMLElement>('#hm-library-title')!;
 let scroll=0,selected:HTMLButtonElement|undefined;
 for(const article of d.querySelectorAll<HTMLElement>('[data-library-card]')){const button=article.querySelector<HTMLButtonElement>('button')!;button.onclick=()=>{const id=article.dataset.libraryCard!;scroll=d.scrollTop;selected=button;list.hidden=true;detail.hidden=false;back.hidden=false;title.textContent=cardName(id);detail.innerHTML=`<div class="hm-large-card"><div class="hm-detail-face">${libraryFace(id,true)}</div></div>${SANCTUARY[id]?sanctuaryDescription(id):''}`;d.scrollTop=0;back.focus({preventScroll:true});};}
 back.onclick=()=>{list.hidden=false;detail.hidden=true;detail.replaceChildren();back.hidden=true;title.textContent='คลังการ์ด';d.scrollTop=scroll;selected?.focus({preventScroll:true});};
 d.querySelector<HTMLButtonElement>('.hm-info-close')!.onclick=()=>d.close();
 let outsideDown=false;const outside=(e:MouseEvent)=>{const r=d.getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom;};
 d.onpointerdown=e=>{outsideDown=e.target===d&&outside(e);};d.onclick=e=>{if(outsideDown&&e.target===d&&outside(e))d.close();};
 d.onclose=()=>{d.remove();if(active===d)active=undefined;document.documentElement.classList.toggle('harmonies-modal-open',!!document.querySelector('.hm-dialog[open]'));if(trigger.isConnected)trigger.focus({preventScroll:true});};
 document.body.append(d);d.showModal();d.focus({preventScroll:true});document.documentElement.classList.add('harmonies-modal-open');
}
