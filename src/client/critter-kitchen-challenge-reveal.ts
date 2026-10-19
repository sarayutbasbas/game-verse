import {CHALLENGE,CRITIC,FOOD_NAMES} from '../games/critter-kitchen/data.js';
import {esc} from './platform.js';
let active:HTMLDialogElement|undefined;
let activeKey='';
export function closeCKChallengeReveal(){
    if(active?.open)active.close();active?.remove();active=undefined;activeKey='';
}
/** Only receives a newly public card from the server projection. */
export function showCKChallengeReveal(id:string,index:number,onContinue:(()=>void)|undefined,blocked=false,restored=false,critic?:string){
    const key=id+':'+index;
    if(active?.open&&activeKey===key){const button=active.querySelector('button');if(button){button.disabled=blocked;button.onclick=()=>{if(!blocked&&onContinue){button.disabled=true;onContinue();}};}return;}
    closeCKChallengeReveal();const card=CHALLENGE[id];if(!card)return;
    const held=index===2||index===5;
    const dialog=document.createElement('dialog');active=dialog;activeKey=key;
    dialog.className='ck-challenge-reveal'+(index===0?' ck-opening-briefing':'')+(restored?' is-restored':'');dialog.tabIndex=-1;
    dialog.setAttribute('aria-labelledby','ck-new-challenge-title');
    dialog.innerHTML=`<section><p>${index===0?"เปิดครัววันแรก · รู้เป้าหมายก่อนออกตลาด":"เป้าหมายใหม่มาแล้ว!"}</p><h2 id="ck-new-challenge-title">Challenge ${index+1}</h2><div class="ck-challenge-flip"><div class="ck-challenge-flipper"><div class="ck-challenge-back"><img src="/art/critter-kitchen/thumbs/back-challenge.webp" alt="" width="240" height="320"></div><div class="ck-challenge-front"><img src="/art/critter-kitchen/portrait/challenge-${esc(id)}.webp" alt="" width="600" height="800"><strong>${esc(card.name)}</strong></div></div></div><div class="ck-new-challenge-foods"><h3>เตรียมวัตถุดิบสำหรับเมนูนี้</h3><p>เสิร์ฟ Challenge ในรอบ ${index<3?3:6}</p>${held?'<p>ไม่ใช้วัตถุดิบขวาสุด</p>':''}<div>${card.foods.map((food,i)=>`<span class="${held&&i===2?'ck-new-food-omitted':''}"><i><img src="/art/critter-kitchen/thumbs/ingredient-${food}.webp" alt="" width="128" height="128">${held&&i===2?'<b aria-label="ไม่ใช้">×</b>':''}</i><strong>${esc(FOOD_NAMES[food])}</strong></span>`).join('')}</div>${index===0&&critic?`<p class="ck-opening-critic">มื้อสุดท้ายรอบ 7 · นักวิจารณ์ ${esc(CRITIC[critic].name)}<br>${esc(CRITIC[critic].text)}</p>`:""}${onContinue?`<button type="button" ${blocked?'disabled':''}>${index===0?"เริ่มส่งเชฟ":"ส่งเชฟรอบถัดไป"}</button>`:'<p>รอผู้เล่นกดเริ่มส่งเชฟ</p>'}</div></section>`;
    dialog.oncancel=e=>e.preventDefault();
    const button=dialog.querySelector('button');if(button)button.onclick=()=>{if(!blocked&&onContinue){button.disabled=true;onContinue();}};
    document.body.append(dialog);dialog.showModal();dialog.focus({preventScroll:true});
}
