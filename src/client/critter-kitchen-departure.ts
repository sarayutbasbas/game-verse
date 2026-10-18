let active:HTMLDialogElement|undefined,timer:ReturnType<typeof setTimeout>|undefined;
export function closeCKDeparture(){
 if(timer!==undefined)clearTimeout(timer);timer=undefined;
 if(active?.open)active.close();active?.remove();active=undefined;
}
/** Presentation only: runs once after an accepted running → shopping transition. */
export function showCKDeparture(){
 if(active?.isConnected)return;
 const dialog=document.createElement('dialog');active=dialog;
 dialog.className='ck-market-departure';dialog.tabIndex=-1;
 dialog.setAttribute('aria-labelledby','ck-departure-title');
 dialog.innerHTML=`<div class="ck-departure-scene"><h2 id="ck-departure-title">ออกตลาดกัน!</h2><p>เชฟกำลังไปหยิบวัตถุดิบ</p><div class="ck-runway" aria-hidden="true"><div class="ck-running-pack">${['mouse','lizard','boar'].map((id,i)=>`<span class="ck-runner" data-animal="${id}" style="--runner:${i};--runner-scale:${[.4,.7,1][i]}"><img src="/art/critter-kitchen/thumbs/chef-${id}.webp" alt="" width="240" height="360" loading="eager" draggable="false"><i></i></span>`).join('')}</div><div class="ck-market-basket"><b>ตลาด</b><img src="/art/critter-kitchen/thumbs/ingredient-carrot.webp" alt="" width="128" height="128"></div></div><div class="ck-departure-progress" aria-hidden="true"><span></span></div></div>`;
 dialog.oncancel=e=>e.preventDefault();document.body.append(dialog);dialog.showModal();dialog.focus({preventScroll:true});
 timer=setTimeout(closeCKDeparture,2000);
}
