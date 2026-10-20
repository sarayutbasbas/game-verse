import type {RoomView} from '../shared/types.js';
import {metadata} from '../shared/catalog.js';
import {roomActionIcon} from './room-icons.js';
import {api,platform} from './account.js';
let dialog:HTMLDialogElement|undefined,roomCode='';
function close(){dialog?.remove();dialog=undefined;}
export function updateRoomExit(main:HTMLElement,view:RoomView|undefined){
 if(!view){close();roomCode='';return;}
 if(roomCode!==view.code)close();roomCode=view.code;
 for(const panel of main.querySelectorAll<HTMLElement>('.ck-menu-panel,.hm-menu-content,.shared-room-menu>div')){
  // Existing navigation links in these menus are replaced by the confirmed exit.
  panel.querySelectorAll('a[href="/"]').forEach(el=>el.remove());
  if(panel.querySelector('.room-exit-entry'))continue;
  const entry=document.createElement('div');entry.className='room-restart-entry room-exit-entry';
  entry.innerHTML=`<button type="button" class="room-exit-button" aria-label="ออกจากห้อง" title="ออกจากห้อง">${roomActionIcon('exit')}</button><span>ออกจากห้อง</span>`;panel.append(entry);
  entry.querySelector('button')!.onclick=()=>{
   close();const menu=entry.closest('details');if(menu)menu.open=false;
   const d=dialog=document.createElement('dialog');d.className='room-restart-dialog room-exit-dialog';d.setAttribute('aria-labelledby','room-exit-title');
   d.innerHTML=`<div class="room-restart-emblem">${roomActionIcon('exit')}</div><h2 id="room-exit-title">ออกจากห้อง?</h2><p class="room-exit-game"></p><p>กลับไปหน้ารายละเอียดเกม ที่นั่งและความคืบหน้ายังอยู่ คุณกลับเข้าห้องเดิมเพื่อเล่นต่อได้</p><p class="room-exit-error" role="alert"></p><div class="room-restart-actions"><button type="button" data-cancel-exit>เล่นต่อ</button><button type="button" data-confirm-exit>ยืนยันออกจากห้อง</button></div>`;
   d.querySelector('.room-exit-game')!.textContent=`${metadata(view.gameId)!.name} · ห้อง ${view.code}`;
   const cancel=()=>{close();menu?.querySelector<HTMLElement>('summary')?.focus({preventScroll:true});};
   d.querySelector<HTMLButtonElement>('[data-cancel-exit]')!.onclick=cancel;d.oncancel=e=>{e.preventDefault();cancel();};
   d.querySelector<HTMLButtonElement>('[data-confirm-exit]')!.onclick=async()=>{
    const confirm=d.querySelector<HTMLButtonElement>('[data-confirm-exit]')!;confirm.disabled=true;
    // Anonymous public displays have no membership; navigation still works offline.
    try{if(platform.profile)await api('/api/rooms/visit','POST',{code:view.code});}catch{/* Reconnect credentials and state are preserved even if offline. */}
    if(dialog===d&&roomCode===view.code)location.assign('/games/'+view.gameId);
   };
   document.body.append(d);d.showModal();d.querySelector<HTMLButtonElement>('[data-cancel-exit]')!.focus();
  };
 }
}
