import type {CKView} from '../games/critter-kitchen/types.js';
import {ckIcon} from './critter-kitchen-shell.js';
import {esc} from './platform.js';
import {avatar} from './account.js';
export function finalResults(v:CKView,own?:string){
 const players=[...v.players].sort((a,b)=>(b.score?.total??0)-(a.score?.total??0)||(b.score?.quality??0)-(a.score?.quality??0)||v.priority.indexOf(a.id)-v.priority.indexOf(b.id));
 return `<div class="ck-final-results ${players.length===2?'ck-final-pair':''}" data-final-player-count="${players.length}">${players.map((p,index)=>{
 const s=p.score!;const rows=[['รอบเสิร์ฟอาหาร',s.challenge],['เชฟ',s.chef],['คุณภาพมื้อสุดท้าย',s.qualityStars],['ซุป',s.soup],['ครบทุกคอร์ส',s.seven],['จานยอดเยี่ยม',s.best.reduce((a,b)=>a+b,0)],['โบนัสและข่าวลือ',s.bonus+s.rumors.reduce((n,r)=>n+r.stars,0)]] as const;
 return `<article class="ck-result-player" data-winner="${v.winners.includes(p.id)}" data-result-rank="${index+1}" data-result-score="${s.total}"><header>${avatar(p)}<strong>${esc(p.name)}${p.id===own?' (คุณ)':''}</strong><span class="ck-result-crown" aria-label="ผู้ชนะ">♛</span></header><div class="ck-result-total">${ckIcon('star')}<b data-total="${s.total}">0</b><span>ดาว</span></div><small>คุณภาพมื้อสุดท้าย ${s.quality}</small><div class="ck-final-breakdown">${rows.map(([name,value],i)=>`<div class="ck-score-step" style="--ck-step:${i}"><span>${name}</span><b>${ckIcon('star')}${value}</b></div>`).join('')}</div><small class="ck-rank-reason">${esc(s.rankReason??'')}</small></article>`;
 }).join('')}</div>`;
}
export function countResults(root:HTMLElement,skip=false){
 if(root.dataset.countStarted)return;root.dataset.countStarted='true';
 const done=()=>{root.classList.remove('ck-counting');root.classList.add('ck-count-complete');root.querySelectorAll<HTMLElement>('[data-total]').forEach(el=>el.textContent=el.dataset.total!);};
 root.addEventListener('ck-skip-count',done,{once:true});
 if(skip||matchMedia('(prefers-reduced-motion: reduce)').matches){done();return;}
 root.classList.add('ck-counting');const start=performance.now();
 const tick=(now:number)=>{if(!root.isConnected||root.classList.contains('ck-count-complete'))return;const progress=Math.min(1,(now-start)/3200);root.querySelectorAll<HTMLElement>('[data-total]').forEach(el=>el.textContent=String(Math.floor(Number(el.dataset.total)*progress)));if(progress<1)requestAnimationFrame(tick);else done();};requestAnimationFrame(tick);
}

export function fitFinalResultRail(root:HTMLElement){
 const rail=root.querySelector<HTMLElement>('.ck-final-results');if(!rail||Number(rail.dataset.finalPlayerCount)<=2)return ()=>{};
 const observer=new ResizeObserver(()=>{const count=Number(rail.dataset.finalPlayerCount),available=rail.clientWidth-6,gap=12;if(available<=0)return;const visible=Math.min(count-1,Math.max(1,Math.floor((available+gap)/222-.4)));rail.style.setProperty('--ck-final-player-width',`${(available-gap*visible)/(visible+.4)}px`);});observer.observe(rail);return ()=>observer.disconnect();
}
