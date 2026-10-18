import {patchHTML} from "./dom-patch.js";
import type {RoomAction} from "../shared/types.js";
import type {PixiesView} from '../games/pixies/types.js';
import {COLOR_NAME,type Card} from '../games/pixies/data.js';
import {avatar} from './account.js';
import {esc} from './platform.js';
import './pixies.css';
const art=(id:string)=>`/art/pixies/cards/${id}.webp`;
export const pixieIcon=(kind:'spiral'|'cross'|'validate'|'score')=>`<svg viewBox="0 0 24 24" aria-hidden="true" class="px-icon" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${kind==='spiral'?'<path d="M12 12c0-3 5-3 5 1 0 6-10 7-12 0C2 3 16-2 21 8c5 13-13 20-20 8"/>':kind==='cross'?'<path d="m5 5 14 14M19 5 5 19"/>':kind==='validate'?'<path d="m4 12 5 5L20 6"/><path d="M21 13v8H3V3h11"/>':'<path d="M5 4h14l-9 8 9 8H5"/>'}</svg>`;
const shapes={blue:'<circle cx="12" cy="12" r="8"/>',green:'<path d="m12 2 10 10-10 10L2 12z"/>',yellow:'<path d="m12 2 10 19H2z"/>',red:'<path d="M3 3h18v18H3z"/>'};
const colorShape=(color:keyof typeof shapes)=>`<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="currentColor">${shapes[color]}</svg>`;
function cardHTML(c:Card){return `<span data-ui-key="card-${c.id}" class="px-card color-${c.colors.length===4?'all':c.colors[0]}" data-card-id="${c.id}"><img src="${art(c.id)}" alt="" width="336" height="464" loading="lazy" onerror="this.hidden=true"><b class="px-number">${c.number}</b><span class="px-symbols">${c.spirals?`<span class="px-spirals">${pixieIcon('spiral')}<b>${c.spirals}</b></span>`:''}${c.crosses?`<span class="px-crosses">${pixieIcon('cross')}<b>${c.crosses}</b></span>`:''}${c.perColor?`<span class="px-special">${pixieIcon('spiral')} / <b>${colorShape(c.perColor)}</b></span>`:''}</span><span class="px-colors">${c.colors.map(color=>`<span class="px-color ${color}" title="${COLOR_NAME[color]}">${colorShape(color)}</span>`).join('')}</span></span>`;}
const cardLabel=(c:Card)=>`เลข ${c.number} สี${c.colors.map(x=>COLOR_NAME[x]).join(' ')} ${c.spirals?`เกลียว ${c.spirals}`:''} ${c.crosses?`กากบาท ${c.crosses}`:''} ${c.perColor?`เกลียวต่อสี${COLOR_NAME[c.perColor]}`:''}`;
const crown=()=>'<svg class="px-crown" viewBox="0 0 32 28" width="28" height="25" aria-label="ผู้ชนะ" role="img"><path d="m3 7 7 6 6-10 6 10 7-6-3 17H6z" fill="#e6b742" stroke="#795313" stroke-width="2"/><path d="M7 20h18" stroke="#795313" stroke-width="2"/></svg>';
let room='',revision=-1,offerIndex=0,tab='',lastSequence=-1;
let previousVisual:PixiesView|undefined;
type Category='validated'|'spirals'|'crosses'|'special'|'zone';
const categories:Record<Category,string>={validated:'เลขยืนยัน',spirals:'เกลียว',crosses:'กากบาท',special:'เกลียวตามสี',zone:'กลุ่มสี'};
let review:Category='validated';
function reviewScore(v:PixiesView,category:Category){
 review=category;if(!dialog)return;
 dialog.querySelectorAll('.px-review-grid *').forEach(el=>el.getAnimations().forEach(a=>a.cancel()));
 dialog.querySelectorAll<HTMLElement>('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===category)));
 for(const p of v.players){const grid=dialog.querySelector<HTMLElement>(`[data-score-garden="${p.id}"]`)!;
  grid.querySelectorAll('.px-review-active').forEach(el=>el.classList.remove('px-review-active'));
  for(const i of p.contributors?.[category]??[]){const target=grid.querySelector<HTMLElement>(`[data-review-slot="${i}"] ${category==='validated'?'.px-number':category==='zone'?'.px-colors':category==='spirals'?'.px-spirals':category==='crosses'?'.px-crosses':'.px-special'}`);
   if(target){target.classList.add('px-review-active');if(!matchMedia('(prefers-reduced-motion: reduce)').matches)target.animate([{transform:'scale(1)'},{transform:'translateY(-7px) scale(1.28)'},{transform:'scale(1)'}],{duration:600,iterations:2,easing:'ease-in-out'});}
  }
 }
}
const dismissed=new Set<string>();
let dialog:HTMLDialogElement|undefined,finishCount:(()=>void)|undefined;
let choiceDialog:HTMLElement|undefined,choiceKey='',chosenKeep:'old'|'new'|undefined;
const flights=new Map<HTMLElement,Animation>();
function syncModalLock(){document.documentElement.classList.toggle('pixies-modal-open',!!document.querySelector('.px-summary[open],.px-zoom[open],.px-choice[open]'));}
function closeSummary(){finishCount?.();finishCount=undefined;dialog?.remove();dialog=undefined;syncModalLock();}
function closeChoice(){choiceDialog?.remove();choiceDialog=undefined;syncModalLock();}
function cancelFlights(){for(const a of flights.values())a.cancel();flights.clear();}
export function closePixiesResults(){closeSummary();closeChoice();document.querySelectorAll('.px-zoom').forEach(d=>d.remove());cancelFlights();syncModalLock();}
function zoom(c:Card){const d=document.createElement('dialog');d.className='px-zoom';d.innerHTML=`${cardHTML(c)}<button class="px-close-card" aria-label="ปิด">×</button><p>${cardLabel(c)}</p>`;document.body.append(d);d.querySelector('button')!.onclick=()=>d.close();d.onclose=()=>{d.remove();syncModalLock();};d.onclick=e=>{if(e.target===d)d.close();};d.showModal();syncModalLock();}
function summary(v:PixiesView,host:boolean,blocked:boolean,command:(a:RoomAction)=>void){
 const key=`${v.code}:${v.round}:${v.sequence}`;
 if(dialog?.dataset.resultKey!==key){
  closeSummary();dismissed.add(key);const d=dialog=document.createElement('dialog');d.className='px-summary';d.dataset.resultKey=key;d.setAttribute('aria-label',v.phase==='finished'?'ผลเกม Pixies':'ผลรอบ Pixies');
  const best=Math.max(...v.players.map(p=>p.scores.at(-1)!.total));
  d.innerHTML=`<h2>${v.phase==='finished'?'ผลเกม • สวนภูตผู้ชนะ':`สรุปรอบ ${v.round}`}</h2>${v.players.map((p,i)=>{const winner=v.phase==='finished'?v.winners?.includes(p.id):p.scores.at(-1)!.total===best;return `<section class="px-score-person ${winner?'winner':''}" data-result-player="${p.id}">${avatar(p)}<strong>${winner?crown():''}${esc(p.name)}${p.id===v.me?.id?' (คุณ)':''}</strong><span class="px-count" data-final="${v.phase==='finished'?p.total:p.scores.at(-1)!.total}">0</span><small>ผู้เล่น ${i+1} • ยืนยัน ${p.score.validated} + เกลียว ${p.score.spirals} + พิเศษ ${p.score.special} − กากบาท ${p.score.crosses} + สี ${p.score.zone}</small><small>${p.scores.map((s,i)=>`รอบ ${i+1}: ${s.total}`).join(' • ')} • รวม ${p.total}</small></section>`;}).join('')}<nav class="px-score-categories" aria-label="ทบทวนคะแนน">${Object.entries(categories).map(([key,label])=>`<button data-category="${key}" aria-pressed="false">${label}</button>`).join('')}</nav><p class="px-review-hint">แตะประเภทคะแนนเพื่อดูส่วนที่นับในสวนรอบนี้</p><div class="px-score-gardens">${v.players.map(p=>`<section><h3>${esc(p.name)}${p.id===v.me?.id?' (คุณ)':''}</h3><div class="px-review-grid" data-score-garden="${p.id}">${p.grid.map((slot,i)=>`<div data-review-slot="${i}">${slot.up?cardHTML(slot.up):slot.down?'<span class="px-back"></span>':`<span>${i+1}</span>`}</div>`).join('')}</div></section>`).join('')}</div><div class="px-summary-actions"></div>`;
  document.body.append(d);let frame=0;const start=performance.now(),nodes=[...d.querySelectorAll<HTMLElement>('[data-final]')];finishCount=()=>{cancelAnimationFrame(frame);for(const n of nodes)n.textContent=n.dataset.final!;};const tick=(now:number)=>{const t=Math.min(1,(now-start)/1400);for(const n of nodes)n.textContent=String(Math.round(Number(n.dataset.final)*t));if(t<1)frame=requestAnimationFrame(tick);};if(matchMedia('(prefers-reduced-motion: reduce)').matches)finishCount();else frame=requestAnimationFrame(tick);
  d.oncancel=e=>{if(v.phase==='finished')e.preventDefault();};d.onclose=()=>closeSummary();d.showModal();d.scrollTop=0;syncModalLock();
  d.querySelectorAll<HTMLButtonElement>('[data-category]').forEach(b=>b.onclick=()=>reviewScore(v,b.dataset.category as Category));reviewScore(v,'validated');
 }
 const allowed=v.phase==='results'?(!!v.me||host):host;
 patchHTML(dialog!.querySelector('.px-summary-actions')!,allowed?`<button id="px-summary-next" ${blocked?'disabled':''}>${v.phase==='finished'?'เริ่มเล่นใหม่':'เริ่มรอบถัดไป'}</button>`:'<p role="status">รอผู้เล่นเริ่มรอบถัดไป</p>');
 const button=dialog!.querySelector<HTMLButtonElement>('#px-summary-next');if(button)button.onclick=()=>{if(!blocked){finishCount?.();command({type:v.phase==='finished'?'restart':'pixies-next'});}};
}
function compareCards(root:HTMLElement,v:PixiesView,blocked:boolean,refresh:()=>void){
 const offers=v.me?.offers??[],own=v.players.find(p=>p.id===v.me?.id),old=own?.grid[offers[0]?.slot]?.up;
 if(!v.pending||v.pending.actor!==v.me?.id||!old||!offers.some(o=>o.keep==='old')||chosenKeep){closeChoice();return;}
 const mount=root.querySelector<HTMLElement>(`[data-owner="${own!.id}"][data-slot="${offers[0].slot}"] .px-choice-mount`);
 if(!mount)return;
 if(!choiceDialog){choiceDialog=document.createElement('section');choiceDialog.className='px-choice px-choice-popover';choiceDialog.setAttribute('aria-label','เลือกไพ่ที่จะเก็บหงาย');mount.append(choiceDialog);}
 patchHTML(choiceDialog,`<p>เลือกใบหงาย • ช่อง ${offers[0].slot+1}</p><div class="px-compare-cards">${(['new','old'] as const).map(keep=>`<button data-ui-key="compare-${keep}" data-keep="${keep}" ${blocked?'disabled':''}><strong>${keep==='new'?'ใบใหม่':'ใบเดิม'}</strong>${cardHTML(keep==='new'?v.pending!.card:old)}</button>`).join('')}</div>`);
 const box=mount.getBoundingClientRect(),width=210;
 choiceDialog.style.left=`${Math.max(8-box.left,Math.min((box.width-width)/2,document.documentElement.clientWidth-8-box.left-width))}px`;
 choiceDialog.querySelectorAll<HTMLButtonElement>('[data-keep]').forEach(b=>b.onclick=()=>{chosenKeep=b.dataset.keep as 'old'|'new';document.dispatchEvent(new CustomEvent('gameverse-audio',{detail:'select'}));closeChoice();refresh();});
}
export function renderPixies(root:HTMLElement,v:PixiesView,host:boolean,blocked:boolean,command:(a:RoomAction)=>void,snapshot:boolean){
 if(v.phase==='playing')closeSummary();
 if(snapshot)cancelFlights();
 if(v.sequence!==undefined&&v.sequence<lastSequence){dismissed.clear();previousVisual=undefined;offerIndex=0;}
 if(room!==v.code){room=v.code;revision=-1;tab='';lastSequence=-1;previousVisual=undefined;closePixiesResults();}if(revision!==v.revision){revision=v.revision;offerIndex=0;}
 const mine=v.players.find(p=>p.id===v.me?.id),acting=v.turn===v.me?.id&&v.phase==='playing',offers=v.me?.offers??[],selected=offers[offerIndex]??offers[0];
 if(acting&&v.pending&&v.sequence!==lastSequence)tab=mine!.id;
 const nextChoiceKey=v.pending?`${v.code}:${v.round}:${v.pending.card.id}:${v.pending.actor}`:'';if(nextChoiceKey!==choiceKey){closeChoice();choiceKey=nextChoiceKey;chosenKeep=undefined;}
 const players=mine?[mine,...v.players.filter(p=>p.id!==mine.id)]:v.players;
 if(!tab||!players.some(p=>p.id===tab))tab=players[0].id;
 patchHTML(root,`<div class="px-root ${mine?'px-phone':'px-display'} ${mine&&!acting?'px-waiting-turn':''}"><div class="px-title" data-ui-key="title"><div><h1 translate="no">Pixies</h1><p>ภูตจิ๋วจอมป่วน</p></div><p class="px-round">รอบ ${v.round}/3<br><b>กลุ่มสี ×${v.round!+1}</b></p></div>${mine?`<nav data-ui-key="tabs" class="px-tabs" aria-label="ดูกระดานผู้เล่น">${players.map(p=>`<button data-tab="${p.id}" aria-pressed="${p.id===tab}">${p.id===mine.id?'สวนคุณ':esc(p.name)}</button>`).join('')}</nav>`:''}<section data-ui-key="market-panel" class="px-market-panel" aria-label="การ์ดกลาง"><div class="px-market-title"><h2>${v.pending?'เลือกวิธีวาง':'เลือกภูตเข้าป่า'}</h2><span class="px-deck-source" aria-label="กองจั่ว ${v.deckCount} ใบ"><i aria-hidden="true"></i>กองจั่ว ${v.deckCount} ใบ</span></div><div class="px-market" data-count="${(v.marketLayout??v.market??[]).length}">${(v.marketLayout??v.market??[]).map((c,i)=>`<div class="px-market-cell" data-ui-key="market-cell-${i}">${c?`<button class="px-pick ${v.pending?.card.id===c.id?'is-selected':''}" data-ui-key="pick-${c.id}" data-pick="${c.id}" aria-pressed="${v.pending?.card.id===c.id}" ${mine&&(!acting||blocked)?'disabled':''} aria-label="${acting?(v.pending?.card.id===c.id?'ยกเลิก':'เลือก'):'ดู'} ${cardLabel(c)}">${cardHTML(c)}</button>`:'<span class="px-market-gap" aria-hidden="true"></span>'}</div>`).join('')}</div><p class="px-instruction" role="status">${v.phase!=='playing'?'จบรอบแล้ว • ดูรายละเอียดคะแนนด้านล่าง':!acting?`รอ ${esc(v.players.find(p=>p.id===v.turn)?.name??'ผู้เล่น')} เลือกและวางไพ่`:v.pending?(selected?.description??'เลือกช่องว่างในสวนของคุณ'):'แตะการ์ดกลางเพื่อเลือก แล้วตรวจวิธีวางก่อนยืนยัน'}</p></section><div class="px-gardens">${players.map(p=>`<section data-ui-key="garden-${p.id}" class="px-garden ${p.id===tab?'selected-garden':''} ${p.id===v.turn&&v.phase==='playing'?'active-player':''} ${mine&&p.id!==mine.id?'opponent':''}" data-player="${p.id}"><header>${avatar(p)}<div><h2>${esc(p.name)}${p.id===mine?.id?' (คุณ)':''}</h2><small>ผู้เล่น ${v.players.findIndex(x=>x.id===p.id)+1} • ${p.connected?'ออนไลน์':'รอกลับเข้าห้อง'}</small></div><b>${p.total}<small>รวม</small></b></header><div class="px-grid">${p.grid.map((slot,i)=>{const eligible=acting&&v.pending&&p.id===mine?.id&&offers.some(o=>o.slot===i),duplicate=eligible&&offers.some(o=>o.keep==='old'),preview=eligible&&(!duplicate||chosenKeep),face=preview?(chosenKeep==='old'?slot.up:v.pending!.card):slot.up;return `<div data-ui-key="slot-${i}" class="px-slot ${slot.down?'has-down':''} ${slot.up&&slot.down?'validated':''} ${eligible?'preview-slot':''} ${preview?'has-preview':''}" data-slot="${i}" data-owner="${p.id}"><button class="px-slot-face" ${blocked&&p.id===mine?.id?'disabled':''} aria-label="ช่อง ${i+1}${slot.up?' '+cardLabel(slot.up):slot.down?' ไพ่คว่ำ':' ว่าง'}${slot.up&&slot.down?' ยืนยันแล้ว':''}">${slot.down?'<span class="px-back" aria-label="ไพ่คว่ำ"></span>':''}${face?cardHTML(face):`<span class="px-slot-number">${i+1}</span>`}${slot.up&&slot.down?`<span class="px-validated">${pixieIcon('validate')} ${slot.up.number}</span>`:''}</button>${eligible?`<button class="px-place-here" data-place="${i}" ${blocked||duplicate&&!chosenKeep?'disabled':''}>ตกลง</button>`:''}<div class="px-choice-mount" data-ui-key="choice-mount" data-preserve-content></div></div>`;}).join('')}</div><p class="px-live-score">${pixieIcon('validate')} ${p.score.validated} · ${pixieIcon('spiral')} ${p.score.spirals+p.score.special} · ${pixieIcon('cross')} −${p.score.crosses} · สี ${p.score.zone}<b>${p.score.total} คะแนน</b></p>${v.phase!=='playing'?`<p class="px-history">${p.scores.map((s,i)=>`รอบ ${i+1}: ${s.total}`).join(' • ')}</p>`:''}</section>`).join('')}</div>${v.phase!=='playing'?`<section class="px-result-controls"><button id="px-summary">ดูสรุปคะแนน</button></section>`:''}<details class="px-rules"><summary>วิธีเล่นและคะแนน</summary><p>เลือกการ์ดตรงเลข 1–9 ถ้ามีใบเดิมให้เลือกเก็บใบหงายหนึ่งใบ อีกใบคว่ำใต้เพื่อยืนยันช่อง. หากช่องยืนยันแล้ว ต้องคว่ำใบใหม่ในช่องว่าง. ไพ่คว่ำเดี่ยวไม่ให้คะแนนในภาคหลัก.</p><p>ไพ่ยืนยันได้แต้มตามเลข • เกลียว +1 • กากบาท −1 • พิเศษได้เกลียวต่อไพ่หงายสีนั้น. กลุ่มสีติดด้านที่ใหญ่ที่สุดอย่างน้อย 2 ใบ ได้ใบละ 2/3/4 แต้มตามรอบ. ไพ่หลายสีเชื่อมได้ทุกสี แต่คิดกลุ่มใหญ่ที่สุดเพียงกลุ่มเดียว.</p><p>เล่น 3 รอบ คะแนนรวมสูงสุดชนะ เสมอชนะร่วมกัน. สองคนเปิด 4 ใบ สลับเลือกคนละสองครั้ง และจบรอบหลังเลือกเท่ากัน.</p></details></div>`);
 for(const b of root.querySelectorAll<HTMLButtonElement>('[data-pick]'))b.onclick=()=>{const c=v.market!.find(c=>c.id===b.dataset.pick)!;if(acting&&v.pending?.card.id===c.id){command({type:'pixies-cancel'});return;}if(acting){document.dispatchEvent(new CustomEvent('gameverse-audio',{detail:'select'}));command({type:'pixies-pick',card:c.id});}else zoom(c);};
 for(const b of root.querySelectorAll<HTMLButtonElement>('[data-tab]'))b.onclick=()=>{tab=b.dataset.tab!;renderPixies(root,v,host,blocked,command,true);};
 for(const cell of root.querySelectorAll<HTMLElement>('[data-slot]')){
  cell.querySelector<HTMLButtonElement>('.px-slot-face')!.onclick=()=>{const p=v.players.find(p=>p.id===cell.dataset.owner)!,slot=Number(cell.dataset.slot);if(p.grid[slot].up)zoom(p.grid[slot].up!);};
 }
 for(const b of root.querySelectorAll<HTMLButtonElement>('[data-place]'))b.onclick=()=>{if(blocked)return;const offer=offers.find(o=>o.slot===Number(b.dataset.place));if(offers.some(o=>o.keep==='old')&&chosenKeep)command({type:'pixies-place',slot:offer!.slot,keep:chosenKeep});else if(offer&&!offers.some(o=>o.keep==='old'))command({type:'pixies-place',slot:offer.slot,keep:offer.keep});};
 const bind=(id:string,fn:()=>void)=>{const b=root.querySelector<HTMLElement>(id);if(b)b.onclick=fn;};
 bind('#px-summary',()=>summary(v,host,blocked,command));
 if(v.sequence!==lastSequence&&!snapshot&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
   const motion=(selector:string,flip=false)=>root.querySelectorAll<HTMLElement>(selector).forEach((el,i)=>el.animate(flip?[{opacity:.5,transform:'perspective(500px) rotateY(-75deg)'},{opacity:1,transform:'perspective(500px) rotateY(0)'}]:[{opacity:.4,transform:'translateY(-7px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,delay:i*45,easing:'ease-out'}));
   const freshMarket=v.phase==='playing'&&!v.pending&&previousVisual?.phase==='playing'&&v.deckCount!==previousVisual.deckCount;
   if(v.event?.kind==='deal'||freshMarket){
     const source=root.querySelector('.px-deck-source i')!.getBoundingClientRect();
     root.querySelectorAll<HTMLElement>('.px-market .px-card').forEach((el,i)=>{const target=el.getBoundingClientRect();flights.get(el)?.cancel();const animation=el.animate([{transform:`translate(${source.x+source.width/2-target.x-target.width/2}px,${source.y+source.height/2-target.y-target.height/2}px) rotate(-9deg) scale(.45)`,opacity:0},{transform:'translate(0,0) rotate(0) scale(1)',opacity:1}],{duration:360,delay:i*120,fill:'backwards',easing:'ease-out'});flights.set(el,animation);void animation.finished.catch(()=>{}).then(()=>{if(flights.get(el)===animation)flights.delete(el);});});
   }
   else for(const p of v.players){const old=previousVisual?.players.find(x=>x.id===p.id);p.grid.forEach((cell,i)=>{if(JSON.stringify(cell)!==JSON.stringify(old?.grid[i]))motion(`.px-garden[data-player="${p.id}"] .px-slot[data-slot="${i}"] ${cell.up?'.px-card':'.px-back'}`,cell.down!==old?.grid[i]?.down);});}
 }
 lastSequence=v.sequence!;previousVisual=structuredClone(v);
 const key=`${v.code}:${v.round}:${v.sequence}`;if(v.phase==='finished'||v.phase!=='playing'&&!snapshot&&!dismissed.has(key))summary(v,host,blocked,command);
 if(dialog&&v.phase!=='playing')summary(v,host,blocked,command);
 compareCards(root,v,blocked,()=>renderPixies(root,v,host,blocked,command,true));
}
