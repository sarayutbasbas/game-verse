import './harmonies-dialog.css';
import type {HarmoniesLeaderboards,HarmoniesLeaderboardMode} from '../shared/harmonies-leaderboard.js';
import {esc} from './platform.js';
import './harmonies-leaderboard.css';
const trophy='<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3h8v6a4 4 0 0 1-8 0zM8 5H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4m-4 2v5m-4 3h8m-6-3h4v3h-4"/></svg>';
const profile='<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2z"/></svg>';
const medals=['ทอง','เงิน','ทองแดง'];
let active:HTMLDialogElement|undefined;
export const harmoniesLeaderboardButton=()=>`<button type="button" class="harmonies-leaderboard-trigger" aria-label="เปิดอันดับผู้เล่น Harmonies" title="Leaderboard">${trophy}</button>`;
export function bindHarmoniesLeaderboard(root:HTMLElement){
 const trigger=root.querySelector<HTMLButtonElement>('.harmonies-leaderboard-trigger');
 if(trigger)trigger.onclick=()=>openHarmoniesLeaderboard(trigger);
}
function openHarmoniesLeaderboard(trigger:HTMLButtonElement){
 active?.close();
 const dialog=active=document.createElement('dialog');dialog.className='hl-dialog hm-dialog hm-info-dialog hm-ranking-dialog';dialog.tabIndex=-1;dialog.setAttribute('aria-labelledby','hl-title');
 let mode:HarmoniesLeaderboardMode='competitive',data:HarmoniesLeaderboards|undefined,controller:AbortController|undefined;
 dialog.innerHTML=`<header class="hm-info-header"><h2 id="hl-title">อันดับผู้เล่น</h2><button type="button" class="hl-close hm-info-close" aria-label="ปิดอันดับผู้เล่น"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header><div class="hm-info-content"><p class="hl-intro">10 อันดับสูงสุด · คะแนนดีที่สุดของแต่ละคน</p><div class="hl-modes" role="group" aria-label="โหมด leaderboard"><button type="button" data-leaderboard-mode="solo" aria-pressed="false">เล่นคนเดียว</button><button type="button" data-leaderboard-mode="competitive" aria-pressed="true">แข่งขัน</button></div><section class="hl-results" aria-live="polite" aria-label="อันดับโหมดแข่งขัน"></section><footer>บันทึกคะแนนเมื่อเล่นจบเกม รวมกระดานและภาคเสริมที่เลือก<br>คะแนนเท่ากัน เรียงผู้ที่ทำได้ก่อน</footer></div>`;
 const results=dialog.querySelector<HTMLElement>('.hl-results')!;
 function render(){
  dialog.querySelectorAll<HTMLButtonElement>('[data-leaderboard-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.leaderboardMode===mode)));
  results.setAttribute('aria-label','อันดับโหมด'+(mode==='solo'?'เล่นคนเดียว':'แข่งขัน'));
  if(!data)return;
  results.setAttribute('aria-busy','false');
  const entries=data[mode];
  if(!entries.length){results.innerHTML=`<div class="hl-empty"><span>${trophy}</span><h3>ยังไม่มีคะแนนในโหมดนี้</h3><p>เล่นให้จบเกม เพื่อเริ่มบันทึกอันดับแรก</p></div>`;return;}
  const dates=new Intl.DateTimeFormat('th-TH',{dateStyle:'medium',timeZone:'Asia/Bangkok'});
  results.innerHTML=`<ol class="hl-list">${entries.map(entry=>`<li class="hl-row ${entry.rank<=3?'hl-medal hl-medal-'+entry.rank:''}" data-rank="${entry.rank}"><span class="hl-rank" aria-label="อันดับ ${entry.rank}${entry.rank<=3?' เหรียญ'+medals[entry.rank-1]:''}">${entry.rank}</span><span class="hl-avatar">${profile}${entry.avatar?`<img src="${esc(entry.avatar)}" alt="" width="44" height="44" loading="lazy" referrerpolicy="no-referrer">`:''}</span><div class="hl-player"><strong>${esc(entry.name)}</strong><time datetime="${new Date(entry.achievedAt).toISOString()}" title="${esc(new Date(entry.achievedAt).toLocaleString('th-TH',{timeZone:'Asia/Bangkok'}))} เวลาไทย">${dates.format(entry.achievedAt)}</time></div><span class="hl-score"><b>${entry.score.toLocaleString('th-TH')}</b><small>คะแนน</small></span></li>`).join('')}</ol>`;
  results.querySelectorAll('img').forEach(img=>img.onerror=()=>img.remove());
 }
 async function load(){
  controller?.abort();controller=new AbortController();const request=controller;
  results.setAttribute('aria-busy','true');results.innerHTML='<p class="hl-loading" role="status"><span></span>กำลังโหลดอันดับ…</p>';
  try{
   const response=await fetch('/api/games/harmonies/leaderboard',{cache:'no-store',signal:request.signal});
   if(!response.ok)throw Error('Leaderboard unavailable');
   const payload=await response.json() as HarmoniesLeaderboards;
   if(active!==dialog||request.signal.aborted)return;
   data=payload;render();
  }catch{
   if(active!==dialog||request.signal.aborted)return;
   results.setAttribute('aria-busy','false');results.innerHTML='<div class="hl-empty"><h3>โหลดอันดับไม่สำเร็จ</h3><p>ลองเชื่อมต่อแล้วเปิดอันดับอีกครั้ง</p><button type="button" class="hl-retry">ลองใหม่</button></div>';
   results.querySelector<HTMLButtonElement>('.hl-retry')!.onclick=()=>void load();
  }
 }
 dialog.querySelector<HTMLButtonElement>('.hl-close')!.onclick=()=>dialog.close();
 dialog.querySelectorAll<HTMLButtonElement>('[data-leaderboard-mode]').forEach(button=>button.onclick=()=>{mode=button.dataset.leaderboardMode as HarmoniesLeaderboardMode;render();});
 const leavePage=()=>dialog.close();window.addEventListener('popstate',leavePage);
 let outsideDown=false;const outside=(e:MouseEvent)=>{const r=dialog.getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom;};
 dialog.onpointerdown=e=>{outsideDown=e.target===dialog&&outside(e);};dialog.onclick=e=>{if(outsideDown&&e.target===dialog&&outside(e))dialog.close();};
 dialog.onclose=()=>{document.documentElement.classList.toggle('harmonies-modal-open',!!document.querySelector('.hm-dialog[open]')); controller?.abort();dialog.remove();window.removeEventListener('popstate',leavePage);if(active===dialog)active=undefined;(trigger.isConnected?trigger:document.querySelector<HTMLElement>('.harmonies-leaderboard-trigger'))?.focus({preventScroll:true});};
 document.body.append(dialog);dialog.showModal();document.documentElement.classList.add('harmonies-modal-open');dialog.focus({preventScroll:true});void load();
}
