import {updateRoomExit} from './room-exit.js';
import type {RoomView,RoomAction} from '../shared/types.js';
import {metadata} from '../shared/catalog.js';
import './room-restart.css';
const restartIcon='<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1.8 8.2M4 4v6h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
let dialog:HTMLDialogElement|undefined;
let confirmationKey='';
let current:{key:string;allowed:boolean;blocked:boolean}|undefined;
function close(){dialog?.close();dialog?.remove();dialog=undefined;confirmationKey='';}
/** Run after the game's own menu has rendered. Permission is also enforced on the server. */
export function updateRoomRestart(main:HTMLElement,view:RoomView|undefined,allowed:boolean,blocked:boolean,command:(action:RoomAction)=>void,overlay?:HTMLElement){
 updateRoomExit(main,view);
 const key=view?`${view.code}:${view.revision}`:'';
 current={key,allowed,blocked};
 if(!view||view.phase==='lobby'||!allowed){close();for(const scope of [main,...overlay?[overlay]:[]])scope.querySelectorAll('.room-restart-entry:not(.room-exit-entry)').forEach(el=>el.remove());return;}
 if(dialog&&confirmationKey!==key)close();
 if(dialog)dialog.querySelector<HTMLButtonElement>('[data-confirm-restart]')!.disabled=blocked;
 const triggers:HTMLButtonElement[]=[];
 const finishedRestart=main.querySelector<HTMLButtonElement>('#hm-restart');if(finishedRestart)triggers.push(finishedRestart);
 for(const panel of [...main.querySelectorAll<HTMLElement>('.ck-menu-panel,.hm-menu-content,.shared-room-menu>div'),...overlay?.querySelectorAll<HTMLElement>('.hm-menu-content')??[]]){
  let entry=panel.querySelector<HTMLElement>('.room-restart-entry:not(.room-exit-entry)');
  if(!entry){entry=document.createElement('div');entry.className='room-restart-entry';entry.innerHTML=`<button type="button" class="room-restart-button" aria-label="เริ่มเกมใหม่" title="เริ่มเกมใหม่">${restartIcon}</button><span>เริ่มเกมใหม่</span>`;(panel.querySelector('.hm-settings-restart')??panel).append(entry);}
  const button=entry.querySelector<HTMLButtonElement>('button')!;button.disabled=blocked;
  triggers.push(button);
 }
 for(const button of triggers){
  button.disabled=blocked;
  button.onclick=()=>{
   if(current?.key!==key||!current.allowed||current.blocked)return;
   const enclosing=button.closest('details');if(enclosing)enclosing.open=false;
   const restoreFocus=()=>{const target=enclosing?.querySelector<HTMLElement>('summary')??button;target.focus({preventScroll:true});};
   close();confirmationKey=key;const d=dialog=document.createElement('dialog');d.className='room-restart-dialog';d.setAttribute('aria-labelledby','room-restart-title');d.setAttribute('aria-describedby','room-restart-description');
   d.innerHTML=`<div class="room-restart-emblem">${restartIcon}</div><h2 id="room-restart-title">เริ่มเกมใหม่?</h2><p class="room-restart-game"></p><p id="room-restart-description">ล้างความคืบหน้าและคะแนนของเกมนี้ แล้วแจกของใหม่ตั้งแต่ต้น ทุกคนยังอยู่ในห้องเดิมและใช้ตัวเลือกเกมเดิม</p><div class="room-restart-actions"><button type="button" data-cancel-restart>เล่นต่อ</button><button type="button" data-confirm-restart>ยืนยันเริ่มใหม่</button></div>`;
   d.querySelector('.room-restart-game')!.textContent=metadata(view.gameId)!.name;
   if(view.phase==='finished')d.querySelector('[data-cancel-restart]')!.textContent='ยกเลิก';
   d.querySelector<HTMLButtonElement>('[data-cancel-restart]')!.onclick=()=>{close();restoreFocus();};
   d.querySelector<HTMLButtonElement>('[data-confirm-restart]')!.onclick=()=>{if(current?.key!==key||!current.allowed||current.blocked)return;close();for(const menu of main.querySelectorAll<HTMLDetailsElement>('details:has(.room-restart-entry)'))menu.open=false;command({type:button.id==='hm-restart'?'restart':'room-restart'});};
   d.oncancel=e=>{e.preventDefault();close();restoreFocus();};
   document.body.append(d);d.showModal();d.querySelector<HTMLButtonElement>('[data-cancel-restart]')!.focus();
  };
 }
}
