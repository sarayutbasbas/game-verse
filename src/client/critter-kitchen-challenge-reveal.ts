import {CHALLENGE,FOOD_NAMES} from '../games/critter-kitchen/data.js';
import {esc} from './platform.js';
let active:HTMLDialogElement|undefined,timer:ReturnType<typeof setTimeout>|undefined;
export function closeCKChallengeReveal(){
    if(timer!==undefined)clearTimeout(timer);timer=undefined;
    if(active?.open)active.close();active?.remove();active=undefined;
}
/** Only receives a newly public card from the server projection. */
export function showCKChallengeReveal(id:string,index:number){
    closeCKChallengeReveal();const card=CHALLENGE[id];if(!card)return;
    const held=index===2||index===5;
    const dialog=document.createElement('dialog');active=dialog;
    dialog.className='ck-challenge-reveal';dialog.tabIndex=-1;
    dialog.setAttribute('aria-labelledby','ck-new-challenge-title');
    dialog.innerHTML=`<section><p>นักวิจารณ์คนถัดไปมาแล้ว!</p><h2 id="ck-new-challenge-title">Challenge ${index+1}</h2><div class="ck-challenge-flip"><div class="ck-challenge-flipper"><div class="ck-challenge-back"><img src="/art/critter-kitchen/thumbs/back-challenge.webp" alt="" width="240" height="320"></div><div class="ck-challenge-front"><img src="/art/critter-kitchen/portrait/challenge-${esc(id)}.webp" alt="" width="600" height="800"><strong>${esc(card.name)}</strong></div></div></div><div class="ck-new-challenge-foods"><h3>เตรียมวัตถุดิบสำหรับเมนูนี้</h3>${held?'<p>ไม่ใช้วัตถุดิบขวาสุด</p>':''}<div>${card.foods.map((food,i)=>`<span class="${held&&i===2?'ck-new-food-omitted':''}"><i><img src="/art/critter-kitchen/thumbs/ingredient-${food}.webp" alt="" width="128" height="128">${held&&i===2?'<b aria-label="ไม่ใช้">×</b>':''}</i><strong>${esc(FOOD_NAMES[food])}</strong></span>`).join('')}</div><button type="button">ส่งเชฟรอบถัดไป</button></div></section>`;
    dialog.oncancel=()=>closeCKChallengeReveal();
    dialog.querySelector('button')!.onclick=closeCKChallengeReveal;
    document.body.append(dialog);dialog.showModal();dialog.focus({preventScroll:true});
    timer=setTimeout(closeCKChallengeReveal,6500);
}
