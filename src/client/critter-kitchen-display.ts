import {BASE_CHEFS,CHALLENGE,CRITIC,FOODS,FOOD_NAMES,RUMOR,ZOU} from '../games/critter-kitchen/data.js';
import type {CKView} from '../games/critter-kitchen/types.js';
import {resolveTeamColors} from '../games/critter-kitchen/team-colors.js';
import {esc} from './platform.js';
import './critter-kitchen-display.css';
import {midnightMysteryCount,mysteryStock} from './critter-kitchen-mystery.js';
type DisplayParts={art:(id:string,cls?:string,large?:boolean)=>string;token:(id:string)=>string;label:(id:string)=>string;icon:(name:string)=>string};
const inks={blue:'#317db5',red:'#bc4b4d',green:'#44865d',purple:'#8753a7',orange:'#c47832'};
export const displayPhase:Record<string,string>={restaurateurs:'เลือกเจ้าของร้าน',planning:'วางแผนลับ',running:'พร้อมออกตลาด',shopping:'ออกตลาด',challenge:'เสิร์ฟอาหาร', 'challenge-results':'ผลการเสิร์ฟ',refrigeration:'จัดตู้เย็น',critic:'เสิร์ฟมื้อสุดท้าย',finished:'สรุปผลการแข่งขัน'};
/** Public projection only. No private hand, unrevealed rumor or draft plan is accepted. */
export function displayDashboard(v:CKView,parts:DisplayParts,action:string,host:boolean,blocked:boolean){
 const {art,token,label,icon}=parts,teams=resolveTeamColors(v.players.map(p=>p.id),v.teamColors),players=new Map(v.players.map(p=>[p.id,p]));
 const teamStyle=(actor:string)=>`--team:${inks[teams[actor]]}`;
 const portrait=(chef:string,actor:string)=>art(['cosmo','rudy','alex','peter','queenie','shaggy'].includes(chef)?'sous-'+chef:'teams-v2/'+teams[actor]+'/'+chef);
 const chefName=(id:string)=>BASE_CHEFS.find(c=>c.id===id)?.name??ZOU[id]?.name??id;
 const history=!['restaurateurs','planning','running'].includes(v.phase);
 const revealedPlans=['restaurateurs','planning','running'].includes(v.phase)?[]:v.visits;
 const reference=(kind:'critic'|'challenge'|'rumor',id:string|null,heading:string,held=false)=>{
  const data=id?(kind==='critic'?CRITIC[id]:kind==='challenge'?CHALLENGE[id]:RUMOR[id]):null;
  const image=art(id?kind+'-'+id:'back-'+kind);
  return `<${id?'button type="button"':'article'} class="ck-d-reference ${id?'':'is-hidden'}" ${id?`data-detail="${kind}:${id}" aria-label="ดู ${esc(data!.name)}"`:''}>${image}<b>${esc(heading)}</b><div class="ck-d-caption"><span>${id?esc(data!.name):'ยังไม่เปิดเผย'}</span>${kind==='challenge'&&id?`<i class="ck-d-requirements">${CHALLENGE[id].foods.map((food,i)=>`<span class="${held&&i===2?'is-omitted':''}">${art('ingredient-'+food)}${held&&i===2?icon('close'):''}</span>`).join('')}</i>`:''}</div></${id?'button':'article'}>`;
 };
 const stores=v.config.locations.map(loc=>{
  const mystery=loc.id==='midnight'?mysteryStock(midnightMysteryCount(v),'display'):'';
  const picks=history?(v.pickups??[]).filter(p=>p.loc===loc.id):[];
  const items=[...new Set([...(history?v.marketStock?.[loc.id]??[]:[]),...(v.locations[loc.id]??[]),...picks.map(p=>p.item),...loc.id==='soup'?['soup',...v.bisqueAvailable?['bisque']:[]]:[],...loc.id==='academy'?[...v.academySous?['zous:'+v.academySous]:[],...v.seventhAvailable?['seventh-allspice']:[]]:[]])];
  const crew=revealedPlans.filter(visit=>visit.loc===loc.id),active=v.location===loc.id&&v.phase==='shopping';
  return `<article class="ck-d-shop ${active?'is-active':''}" data-display-location="${loc.id}" data-ui-key="display-shop-${loc.id}" style="--shop-cover:url('/art/critter-kitchen/location-${loc.id}.webp')"><header><div class="ck-d-shop-plaque"><h2>${esc(loc.name)}</h2><small>${active?'กำลังหยิบของ':loc.id==='soup'?'ซุปไม่จำกัด':loc.id==='midnight'&&mystery?`สุ่ม ${loc.slots} ชิ้นเมื่อถึงคิว`:loc.slots?`เติมรอบละ ${loc.slots} ชิ้น`:'เชฟเสริมและของที่เหลือ'}</small></div><div class="ck-d-visitors" aria-label="เชฟที่ ${esc(loc.name)}">${crew.map(visit=>{
   const current=visit.actor===v.turn&&visit.chef===v.decision?.chef&&active,name=players.get(visit.actor)?.name??'';
   return `<button type="button" class="ck-d-visitor ${current?'is-current':''} ${visit.done?'is-done':''}" data-inspect-chef="${visit.chef}" data-visit-actor="${visit.actor}" data-ui-key="display-visit-${visit.id}" style="${teamStyle(visit.actor)}" aria-label="${esc(name)} · ${esc(chefName(visit.chef))}${current?' · กำลังเลือกของ':''}" title="${esc(name)} · ${esc(chefName(visit.chef))}" aria-current="${current}">${portrait(visit.chef,visit.actor)}<span>${visit.used}/${visit.limit}</span></button>`;
  }).join('')}</div></header><div class="ck-d-stock" data-display-stock="${loc.id}" data-ui-key="display-stock-${loc.id}" aria-label="ของที่ ${esc(loc.name)}">${mystery}${items.map(id=>{
   const marks=picks.filter(p=>p.item===id),owners=[...new Map(marks.map(p=>[p.actor+':'+p.chef,p])).values()];
   const available=(v.locations[loc.id]??[]).includes(id)||id==='soup'||id==='bisque'&&v.bisqueAvailable||id.startsWith('zous:')&&v.academySous===id.slice(5)||id==='seventh-allspice'&&v.seventhAvailable;
   const sold=marks.length>0&&!available;
   return `<div class="ck-d-item ${sold?'is-sold':''}" data-display-item="${id}" data-ui-key="display-item-${loc.id}-${id}"><button type="button" data-pick="${id}" aria-label="${esc(label(id))}${sold?' · หมดแล้ว':''}" aria-haspopup="dialog">${token(id)}</button>${sold?'<strong class="ck-d-sold">หมด</strong>':''}${owners.length?`<span class="ck-d-owners" aria-label="${esc(owners.map(p=>players.get(p.actor)?.name??'').join(', '))} หยิบแล้ว">${owners.slice(-2).map(p=>`<i style="${teamStyle(p.actor)}">${portrait(p.chef,p.actor)}</i>`).join('')}${owners.length>2?`<small>+${owners.length-2}</small>`:''}</span>`:''}${id==='soup'?'<small class="ck-d-unlimited" aria-label="ไม่จำกัด">∞</small>':''}</div>`;
  }).join('')||(!mystery?`<div class="ck-d-empty">${icon('supplies')}<span>ไม่มีของในตลาด</span></div>`:'')}</div></article>`;
 }).join('');
 const current=players.get(v.turn??''),pending=v.players.filter(p=>v.phase==='refrigeration'?!p.fridgeReady:!p.committed);
 const message=v.phase==='shopping'?current?`${current.name} กำลัง${v.decision?.kind==='rumor'?'เลือกข่าวลือ':'หยิบวัตถุดิบ'}`:'กำลังจัดคิวเชฟ':v.phase==='running'?'ทุกคนส่งแผนแล้ว พร้อมออกตลาด':v.phase==='planning'?`วางแผนบนมือถือ · ส่งแผนแล้ว ${v.players.filter(p=>p.committed).length}/${v.players.length} คน`:v.phase==='finished'?'สิ้นสุดการประลองครัว':`${displayPhase[v.phase]}บนมือถือ${pending.length?` · รออีก ${pending.length} คน`:''}`;
 return `<div class="ck-d-dashboard" data-ui-key="display-dashboard" data-player-count="${v.players.length}" style="--player-count:${v.players.length};--shop-rows:${Math.ceil(v.config.locations.length/2)}"><section class="ck-d-references" aria-label="นักวิจารณ์ Challenge และข่าวลือ"><div class="ck-d-critic">${reference('critic',v.critic,'นักวิจารณ์มื้อสุดท้าย')}</div><div class="ck-d-challenges">${v.challenges.map((c,i)=>reference('challenge',c.id,'Challenge '+(i+1),c.held)).join('')}</div><div class="ck-d-rumors">${v.rumors.map((id,i)=>reference('rumor',id,'ข่าวลือ '+(i+1))).join('')}</div></section><div class="ck-d-market-layout"><section class="ck-d-shops" aria-label="ร้านค้าทั้งหมด">${stores}</section><aside class="ck-d-priority" aria-label="คิวเชฟตามลำดับหมวก"><h2>คิวเชฟ<small>ลำดับหมวก</small></h2><ol>${v.priority.map((actor,i)=>{
  const p=players.get(actor)!;return `<li data-ui-key="display-priority-${actor}" data-priority-player="${actor}" style="${teamStyle(actor)}" class="${actor===v.turn?'is-current':''}"><div class="ck-d-queue-portrait">${portrait('boar',actor)}<b>${i+1}</b>${v.phase==='planning'&&p.committed?`<span class="ck-d-plan-ready" aria-label="ส่งแผนแล้ว">${icon('confirm')}</span>`:''}</div><strong>${esc(p.name)}</strong><small>${p.stars} ดาว</small></li>`;
 }).join('')}</ol></aside></div><footer class="ck-d-footer"><div class="ck-d-legend"><b>วัตถุดิบ</b>${FOODS.map(food=>`<span>${art('ingredient-'+food)}<small>${FOOD_NAMES[food]}</small></span>`).join('')}</div><p role="status">${icon('supplies')}<span>${esc(message)}</span></p>${v.phase==='running'&&host?`<button type="button" data-action="ck-run" class="ck-d-start" ${blocked?'disabled':''}>เริ่มออกตลาด</button>`:''}</footer>${action&&v.phase!=='running'?`<div class="ck-d-action-overlay"><section class="ck-action" id="ck-action">${action}</section></div>`:''}</div>`;
}

/** Fit each store independently; very large stocks retain a partial next-card cue. */
export function fitDisplayStocks(rails:HTMLElement[]){
 for(const rail of rails){
  if(!rail.clientWidth||!rail.clientHeight||rail.querySelector('.ck-d-empty'))continue;
  const height=110,width=72,rows=rail.children.length>6&&rail.clientHeight>=239?2:1;
  rail.style.setProperty('--display-stock-rows',String(rows));rail.style.setProperty('--display-face-height',`${height}px`);rail.style.setProperty('--display-face-width',`${width}px`);
 }
}
