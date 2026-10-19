import type {CKView} from '../games/critter-kitchen/types.js';
import type {RoomAction} from '../shared/types.js';
import {resolveTeamColors} from '../games/critter-kitchen/team-colors.js';
import {ckIcon} from './critter-kitchen-shell.js';
import {esc} from './platform.js';
import './critter-kitchen-final-reveal.css';
export function finalRevealMarkup(v:CKView,canAdvance:boolean,blocked:boolean){
 const r=v.finalReveal!,item=r.item!,teams=resolveTeamColors(v.players.slice(0,5).map(p=>p.id),v.teamColors);
 const lastAnswer=r.answered&&r.index===r.total-1;
 const winner=lastAnswer?`<div class="ck-tally-winner" role="status"><span aria-hidden="true">♛</span><div><small>ผู้ชนะการประลองครัว</small><strong>${v.players.filter(p=>v.winners.includes(p.id)).map(p=>esc(p.name)).join(' และ ')}</strong></div><b>${v.players.find(p=>v.winners.includes(p.id))?.score?.total??0} ${ckIcon('star')}</b></div>`:'';
 const image=item.food?'ingredient-'+item.food:item.card?(item.card.kind==='critic'?'portrait/':'')+item.card.kind+'-'+item.card.id:item.id==='soup'?'resource-soup':item.id==='seven'?'resource-bisque':'resource-spice';
 return `<section class="ck-tally ${v.players.length>3?'is-multi':''} ${lastAnswer?'has-winner':''}" data-reveal-step="${r.step}" data-reveal-answered="${r.answered}" style="--tally-players:${v.players.length};--tally-columns:${Math.min(3,v.players.length)}"><header class="ck-tally-heading"><span>เปิดผลทีละข้อ · ${r.index+1}/${r.total}</span><h2>${esc(item.title)}</h2></header><div class="ck-tally-question ${item.rule.length>180?'is-long-rule':''}">${item.food||item.card||item.id==='soup'?`<img src="/art/critter-kitchen/${item.card?'':'thumbs/'}${image}.webp" alt="" width="240" height="320">`:`<span class="ck-tally-symbol" aria-hidden="true">${ckIcon(item.id==='seven'?'cards':'star')}</span>`}<div><b>เงื่อนไขข้อนี้</b><p>${esc(item.rule)}</p></div></div><div class="ck-tally-players ${v.players.length===2?'is-pair':''}" aria-label="ดาวของผู้เล่นทุกคน">${v.players.map(p=>{
  const award=item.awards?.find(a=>a.actor===p.id),total=r.totals[p.id];
  return `<article class="ck-tally-player ${lastAnswer&&v.winners.includes(p.id)?'is-winner':''}" data-tally-player="${p.id}"><header><img src="/art/critter-kitchen/thumbs/teams-v2/${teams[p.id]??'blue'}/boar.webp" alt="" width="100" height="100"><strong>${esc(p.name)}</strong>${lastAnswer&&v.winners.includes(p.id)?'<span class="ck-tally-crown" aria-label="ผู้ชนะ">♛</span>':''}</header>${r.answered?`<div class="ck-tally-award" data-award="${award!.stars}">${award!.winner?'ผู้ชนะ':`${award!.stars?'+ ':''}${ckIcon('star')} ${award!.stars}`}</div><p class="ck-tally-evidence">${esc(award!.evidence)}</p>`:'<div class="ck-tally-unanswered">?</div><p class="ck-tally-evidence">กดดูผลลัพธ์เพื่อเฉลย</p>'}<div class="ck-tally-total">${ckIcon('star')}<b data-tally-total="${total}" data-tally-before="${total-(award?.stars??0)}">${total}</b><small>ดาวรวม</small></div></article>`;
 }).join('')}</div><footer class="ck-tally-actions">${winner}${canAdvance?`<button type="button" class="ck-tally-next" data-final-step="${r.step}" ${blocked?'disabled':''}>${r.answered?r.index===r.total-1?'ดูตารางสรุปคะแนน':'ดูโจทย์ถัดไป':'ดูผลลัพธ์'}</button>${!lastAnswer?`<button type="button" class="ck-tally-skip" data-final-skip="${r.step}" ${blocked?'disabled':''}>ข้ามไปสรุป</button>`:''}`:'<p>รอผู้เล่นกดดูผลลัพธ์</p>'}<small>กดแล้วเปิดพร้อมกันทั้งห้อง</small></footer></section>`;
}
export function bindFinalReveal(dialog:HTMLElement,v:CKView,command:(action:RoomAction)=>void,animate:boolean){
 const r=v.finalReveal!;
 dialog.classList.toggle('ck-tally-restored',!animate);
 dialog.querySelectorAll<HTMLButtonElement>('[data-final-step],[data-final-skip]').forEach(button=>button.onclick=()=>{
  if(button.disabled)return;
  const skip=button.hasAttribute('data-final-skip');
  dialog.querySelectorAll<HTMLButtonElement>('[data-final-step],[data-final-skip]').forEach(b=>b.disabled=true);
  command({type:'ck-score-step',step:r.step,...skip?{skip:true}:{}});
 });
 if(!r.answered||!animate||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const start=performance.now(),duration=1250;
 dialog.querySelectorAll<HTMLElement>('[data-tally-total]').forEach(total=>total.textContent=total.dataset.tallyBefore!);
 for(const card of dialog.querySelectorAll<HTMLElement>('.ck-tally-player')){
  const stars=Number(card.querySelector<HTMLElement>('[data-award]')?.dataset.award??0);if(!stars)continue;
  const from=card.querySelector('.ck-tally-award')!.getBoundingClientRect(),to=card.querySelector('.ck-tally-total')!.getBoundingClientRect(),box=card.getBoundingClientRect();
  for(let i=0;i<Math.min(6,stars);i++){
   const star=document.createElement('span');star.className='ck-tally-flying-star';star.innerHTML=ckIcon('star');star.style.left=`${from.left+from.width/2-box.left-12}px`;star.style.top=`${from.top-box.top}px`;card.append(star);
   star.animate([{transform:'translate(0,0) scale(.7)',opacity:0},{transform:'translate(0,8px) scale(1.15)',opacity:1,offset:.2},{transform:`translate(${(i%3-1)*9}px,${to.top-from.top+8}px) scale(.55)`,opacity:0}],{duration:950,delay:i*55,easing:'cubic-bezier(.25,.65,.4,1)',fill:'both'}).finished.then(()=>star.remove()).catch(()=>star.remove());
  }
 }
 const tick=(now:number)=>{if(!dialog.isConnected)return;const progress=Math.min(1,(now-start)/duration);dialog.querySelectorAll<HTMLElement>('[data-tally-total]').forEach(total=>{const before=Number(total.dataset.tallyBefore),target=Number(total.dataset.tallyTotal);total.textContent=String(Math.round(before+(target-before)*progress));});if(progress<1)requestAnimationFrame(tick);};requestAnimationFrame(tick);
}
