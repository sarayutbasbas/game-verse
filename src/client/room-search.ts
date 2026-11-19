import {guest,platform} from './account.js';
import './room-search.css';
let dialog:HTMLDialogElement|undefined;
/** Resolve the game and authenticated membership through the normal join protocol. */
export function openRoomSearch(){
 if(dialog?.open){dialog.querySelector<HTMLInputElement>('#search-room-code')?.focus();return;}
 const opener=document.activeElement as HTMLElement|null;
 const modal=document.createElement('dialog');dialog=modal;modal.className='room-search-dialog';modal.setAttribute('aria-labelledby','room-search-title');
 modal.innerHTML='<header><h2 id="room-search-title">ค้นหาห้อง</h2><button type="button" class="room-search-close" aria-label="ปิดค้นหาห้อง">×</button></header><form><p>กรอกรหัสห้องเพื่อเข้าเกมของเพื่อนได้เลย</p><label for="search-room-code">รหัสห้อง</label><input id="search-room-code" name="code" maxlength="12" required autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABC234" aria-describedby="room-search-error"><div class="room-search-name"><label for="search-room-name">ชื่อของคุณ</label><input id="search-room-name" name="name" maxlength="24" autocomplete="nickname"></div><p id="room-search-error" role="alert"></p><button class="room-search-submit" type="submit">เข้าห้อง</button></form>';
 const form=modal.querySelector('form')!,code=modal.querySelector<HTMLInputElement>('#search-room-code')!,name=modal.querySelector<HTMLInputElement>('#search-room-name')!,button=modal.querySelector<HTMLButtonElement>('[type="submit"]')!,error=modal.querySelector<HTMLElement>('#room-search-error')!;
 const needsName=!platform.profile||platform.profile.guest;
 modal.querySelector<HTMLElement>('.room-search-name')!.hidden=!needsName;name.required=needsName;name.value=platform.profile?.name??'';
 let socket:WebSocket|undefined,timer:ReturnType<typeof setTimeout>|undefined,busy=false,closed=false;
 const cleanup=()=>{if(timer)clearTimeout(timer);if(socket){socket.onclose=null;socket.close();socket=undefined;}};
 const fail=(message:string)=>{if(closed)return;cleanup();busy=false;form.removeAttribute('aria-busy');button.disabled=false;button.textContent='เข้าห้อง';error.textContent=message;};
 modal.querySelector('.room-search-close')!.addEventListener('click',()=>modal.close());
 modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close();}});
 modal.addEventListener('close',()=>{closed=true;cleanup();modal.remove();if(dialog===modal)dialog=undefined;opener?.focus();});
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(busy)return;const roomCode=code.value.trim().toUpperCase(),playerName=name.value.trim()||platform.profile?.name||'';
  if(!roomCode){error.textContent='กรอกรหัสห้อง';code.focus();return;}
  busy=true;error.textContent='';button.disabled=true;button.textContent='กำลังเข้าห้อง…';form.setAttribute('aria-busy','true');
  try{await guest();if(closed)return;
   socket=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws`);
   timer=setTimeout(()=>fail('เชื่อมต่อนานเกินไป ลองเข้าห้องอีกครั้ง'),15000);
   socket.onopen=()=>socket?.send(JSON.stringify({type:'join',code:roomCode,name:playerName}));
   socket.onmessage=e=>{try{const m=JSON.parse(e.data);if(m.type==='error'){fail(m.error);return;}if(m.type==='session'){
     localStorage.setItem(`games:player:${m.code}`,JSON.stringify(m));cleanup();location.assign('/play/'+encodeURIComponent(m.code));
   }}catch{fail('เข้าห้องไม่สำเร็จ กรุณาลองใหม่');}};
   socket.onerror=()=>fail('เชื่อมต่อไม่ได้ ตรวจอินเทอร์เน็ตแล้วลองใหม่');socket.onclose=()=>fail('การเชื่อมต่อขาด ลองเข้าห้องอีกครั้ง');
  }catch(e){fail((e as Error).message);}
 });
 document.body.append(modal);modal.showModal();code.focus();
}
