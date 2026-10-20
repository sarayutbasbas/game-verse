import {updateRoomRestart} from './room-restart.js';
import {illustratedGameGuide} from './game-learning.js';
import {finalRevealMarkup,bindFinalReveal} from './critter-kitchen-final-reveal.js';
import {finalResults,countResults,fitFinalResultRail} from './critter-kitchen-results.js';
import {displayDashboard,displayPhase,fitDisplayStocks} from './critter-kitchen-display.js';
import {midnightMysteryCount,mysteryStock} from './critter-kitchen-mystery.js';
import type {TeamColor} from '../games/critter-kitchen/team-colors.js';
import {deviceDisplayMode,saveDisplayMode} from './display-mode.js';
import { patchHTML } from './dom-patch.js';
import { avatar } from './account.js';
import { esc } from './platform.js';
import { FOODS, FOOD_NAMES, TOKEN, BASE_CHEFS, ZOU, CRITIC, CHALLENGE, RESTAURATEUR, RUMOR, type Food, type LocationId } from '../games/critter-kitchen/data.js';
import { emptyMeal, validateMeals, mealQuality, scoreChallenge, spiceMatches, type MealContext, type MealPlayer } from '../games/critter-kitchen/scoring.js';
import type { CKView, CKAction, Meal, Plan } from '../games/critter-kitchen/types.js';
import type { RoomAction } from '../shared/types.js';
import './critter-kitchen.css';
import {bindChefDrag} from './critter-kitchen-drag.js';
import {closeCKDeparture,showCKDeparture} from './critter-kitchen-departure.js';
import {closeCKChallengeReveal,showCKChallengeReveal} from './critter-kitchen-challenge-reveal.js';
import {ckIcon,ckSky} from './critter-kitchen-shell.js';
let room = '', epoch = '', lastSequence = -1, lastRevision = -1, plan: Plan = {}, chef = '', pick = '', plate = 0, meals: Meal[] = [], keep: string[] = [], tab = 'kitchen', detail = '', locationDetail = '', mode = '', resultClosed = false, resultCount = true;
let previousPhase='';
let lastFinalStep=-1;
const workspaceScroll=new Map<string,()=>void>();
const shoppingOrders=new Map<string,string[]>();
let shoppingRound=0;
function rememberCKScroll(root:HTMLElement){
    const x=window.scrollX,y=window.scrollY,positions=[...root.querySelectorAll<HTMLElement>('.ck-board,.ck-picks,.ck-inventory,.ck-pantry-cards,.ck-destinations,.ck-route-stock,.ck-fridge-grid,.ck-dish-row,.ck-action')].map(el=>({el,left:el.scrollLeft,top:el.scrollTop}));
    return ()=>{for(const p of positions)if(p.el.isConnected){p.el.scrollLeft=p.left;p.el.scrollTop=p.top;}window.scrollTo({left:x,top:y,behavior:'instant'});};
}
let resourceRails:ResizeObserver|undefined;
let disposeChefDrag:(()=>void)|undefined;
let pantryView='stock', course:Food=FOODS[0], menuEvents:AbortController|undefined;
export function closeCK(){workspaceScroll.clear();resourceRails?.disconnect();resourceRails=undefined;closeCKDeparture();closeCKChallengeReveal();lastFinalStep=-1;previousPhase='';disposeChefDrag?.();disposeChefDrag=undefined;menuEvents?.abort();menuEvents=undefined;dismissChoice();document.querySelectorAll('.ck-dialog').forEach(el=>el.remove());detail='';locationDetail='';}
const crown = '<svg class="ck-crown" viewBox="0 0 32 25" width="27" height="22" aria-label="ผู้ชนะ" role="img"><path d="M3 5l8 7 5-10 5 10 8-7-3 16H6z" fill="#e0a226" stroke="#805615" stroke-width="2"/><path d="M7 24h18" stroke="#805615" stroke-width="2"/></svg>';
const playerColors = ['#cb7046', '#337dba', '#a94e91', '#6c9a3c', '#a77d19'];
const hat = (index: number, order = index) => `<svg class="ck-hat" viewBox="0 0 30 26" width="22" height="20" aria-label="หมวกลำดับ ${order+1}" role="img"><path d="M7 15C0 14 0 6 7 5C9-1 19-1 22 5C30 5 30 14 23 15L22 24H8z" fill="${playerColors[index]}" stroke="#234e50"/><path d="M8 19h14" stroke="#fff9df" stroke-width="3"/></svg>`;
const colors: Record<string, string> = { bread: '#b67a30', carrot: '#ed791f', cheese: '#e7ba25', fish: '#459fc3', meat: '#c34b61', mushroom: '#9765b4', wine: '#8caa37', all: '#346e68' };
const art = (id: string, cls = '', large = false) => {
    const portrait=/^(challenge-|critic-|restaurateur-)/.test(id)||['sous-cosmo','sous-rudy','sous-alex','sous-peter','sous-queenie','sous-shaggy','restaurateur-wolfgang-duck'].includes(id);
    return `<img class="ck-art ${cls}" src="/art/critter-kitchen/${large?'':'thumbs/'}${portrait?'portrait/':''}${id}.webp" alt="" width="${portrait?600:400}" height="${portrait?800:300}" loading="${large?'eager':'lazy'}">`;
};
const waitScene=(message:string)=>`<div class="ck-wait-scene" role="status"><picture><source media="(prefers-reduced-motion: reduce)" srcset="/art/critter-kitchen/wait-chef-poster.webp"><source type="image/webp" srcset="/art/critter-kitchen/wait-chef.webp"><img src="/art/critter-kitchen/wait-chef.gif" width="320" height="320" alt="" decoding="async"></picture><p>${esc(message)}</p></div>`;
const chefData = (id: string) => BASE_CHEFS.find(c => c.id === id) ?? ZOU[id];
const chefName = (id: string) => chefData(id)?.name ?? id;
const chefCarry=(id:string)=>id==='cosmo'?'ใช้ความจุของเชฟลับ':`ถือได้ ${chefData(id)?.capacity} ชิ้น`;
const chefArtId=(id:string,team?:TeamColor)=>team&&!['cosmo','rudy','alex','peter','queenie','shaggy'].includes(id)?'teams-v2/'+team+'/'+id:(ZOU[id]?'sous-':'chef-')+id;
const chefFace=(id:string,team?:TeamColor)=>`<span class="ck-chef-face"><span class="ck-chef-portrait ${team?'ck-team-portrait':ZOU[id]?'ck-sous-portrait':''}">${art(chefArtId(id,team))}</span><span class="ck-chef-caption"><b>${esc(chefName(id))}</b><small>${chefCarry(id)}</small></span></span>`;

function resourceToken(id:string,kind:string,heading:string,name:string,image:string,food:string,spice:boolean,large:boolean){
    return `<span class="ck-token ${kind} ck-resource-card" data-resource="${esc(id)}" style="--food:${colors[food]??colors.all}" aria-label="${esc(label(id))}"><b class="ck-resource-heading">${esc(heading)}</b>${art(image,'ck-resource-icon',large)}${spice?`<span class="ck-spice-badge" aria-hidden="true">${art('resource-spice','',large)}</span>`:''}<small class="ck-token-name">${esc(name)}</small></span>`;
}
function token(id: string, large = false) {
    if(id.startsWith('zous:'))return `<span class="ck-token special ck-chef-offer-face">${art('sous-'+id.slice(5),'',large)}<span class="ck-rumor-caption"><strong>${esc(ZOU[id.slice(5)]?.name??'เชฟเสริม')}</strong></span></span>`;
    if(id==='soup'||id==='bisque')return resourceToken(id,'special',id==='soup'?'1':'3',id==='soup'?'ซุป':'บิสก์','resource-'+id,'all',false,large);
    if(id==='allspice'||id==='seventh-allspice')return resourceToken(id,'spice','×2','เครื่องเทศรวม','resource-spice','all',false,large);
    const t=TOKEN[id];
    if(!t)return `<span class="ck-token special"><b>${id==='sous'?'เชฟเสริม':'เครื่องเทศรวม'}</b></span>`;
    const food=t.food??'all';
    if(t.kind==='ingredient')return resourceToken(id,t.kind,String(t.value),FOOD_NAMES[food as Food],'ingredient-'+food,food,false,large);
    if(t.kind==='spice')return resourceToken(id,t.kind,'×2',food==='all'?'เครื่องเทศรวม':FOOD_NAMES[food],food==='all'?'resource-spice':'ingredient-'+food,food,food!=='all',large);
    return `<span class="ck-token rumor ck-rumor-face">${art('back-rumor','',large)}<span class="ck-rumor-caption"><strong>ข่าวลือ</strong><small>${t.rumor===3?'เลือก 1 ใบ':'ใบที่ '+(Number(t.rumor)+1)}</small></span></span>`;
}
// Public stock only; keep each physical piece and its printed quality visible.
function routeStockItem(id:string){
    const t=TOKEN[id],food=t?.food??'all';
    const image=id==='soup'||id==='bisque'?'resource-'+id:id.startsWith('zous:')?'sous-'+id.slice(5):t?.kind==='rumor'?'back-rumor':t?.kind==='ingredient'||t?.kind==='spice'&&food!=='all'?'ingredient-'+food:'resource-spice';
    const value=id==='soup'?'1':id==='bisque'?'3':t?.kind==='ingredient'?String(t.value):t?.kind==='spice'||id.includes('allspice')?'×2':'';
    return `<button type="button" class="ck-route-stock-item" data-pick="${esc(id)}" aria-haspopup="dialog" aria-label="ดูรายละเอียด ${esc(label(id))}"><span class="ck-route-stock-art">${art(image)}</span>${t?.kind==='spice'&&food!=='all'?`<span class="ck-route-spice" aria-hidden="true">${art('resource-spice')}</span>`:''}${value?`<b>${value}</b>`:''}</button>`;
}
function groupIngredients(ids:string[]){
    const groups=new Map<string,{id:string;ids:string[];key:string}>();
    for(const id of ids){const t=TOKEN[id],key=t?.kind==='ingredient'?`ingredient:${t.food}:${t.value}`:id;
        const group=groups.get(key);if(group)group.ids.push(id);else groups.set(key,{id,ids:[id],key});}
    return [...groups.values()];
}
function label(id: string) { if (id.startsWith('zous:'))
    return 'เชฟเสริม ' + (ZOU[id.slice(5)]?.name ?? ''); const t = TOKEN[id]; return !t ? id === 'soup' ? 'ซุป 1' : id === 'bisque' ? 'บิสก์ 3' : id === 'sous' ? 'เชฟเสริม' : id === 'allspice' ? 'เครื่องเทศรวม' : id : t.kind === 'ingredient' ? `${FOOD_NAMES[t.food as Food]} ${t.value}` : t.kind === 'spice' ? `เครื่องเทศ${t.food === 'all' ? 'รวม' : FOOD_NAMES[t.food!]}` : `ข่าวลือ ${t.rumor === 3 ? 'เลือก' : Number(t.rumor) + 1}`; }
function card(kind: string, id: string, small = false, interactive = true, caption?:string) { const c = kind === 'critic' ? CRITIC[id] : kind === 'challenge' ? CHALLENGE[id] : kind === 'restaurateur' ? RESTAURATEUR[id] : kind === 'rumor' ? RUMOR[id] : ZOU[id]; return `<${interactive ? 'button type="button"' : 'article'} class="ck-card ${small ? 'small' : ''}" ${interactive ? `data-detail="${kind}:${id}" aria-label="ดู ${esc(caption ?? c?.name ?? id)}"` : ''}>${art(kind + '-' + id, '', !small && !interactive)}<strong>${esc(caption ?? c?.name ?? id)}</strong>${kind === 'challenge' ? `<span class="ck-foods">${CHALLENGE[id].foods.map(f => `<i style="--food:${colors[f]}">${FOOD_NAMES[f]}</i>`).join('')}</span>` : ''}${interactive ? '<span class="ck-card-inspect" aria-hidden="true">ดูรายละเอียด ↗</span>' : ''}${!small && c && 'text' in c ? `<span>${esc(c.text)}</span>` : ''}</${interactive ? 'button' : 'article'}>`; }
const phaseName: Record<string, string> = { restaurateurs: 'เลือกเจ้าของร้าน', planning: '', running: '', shopping: 'ออกตลาด', challenge: 'เตรียมอาหาร Challenge', 'challenge-results': 'ผลการเสิร์ฟ', refrigeration: 'จัดตู้เย็น', critic: 'เตรียมมื้อสุดท้าย', finished: 'ประกาศผล' };
let choice: { dialog: HTMLDialogElement; revision: number; code: string; rails?:ResizeObserver } | undefined;
function dismissChoice() { choice?.rails?.disconnect();const d=choice?.dialog; choice=undefined; if(d?.open)d.close(); d?.remove(); }
const phaseSteps = ['วางแผน', 'ออกตลาด', 'ปรุงอาหาร', 'เก็บของ'];
const guidance: Record<string,string> = {
 restaurateurs:'แตะการ์ดเพื่ออ่านความสามารถ แล้วเลือกเจ้าของร้าน 1 คน',
 planning:'ลากการ์ดเชฟไปวางที่สถานที่ให้ครบทุกตัว ก่อนยืนยันแผน',
 running:'แผนของทุกคนเปิดแล้ว เริ่มออกตลาดเพื่อให้เชฟหยิบของตามคิว',
 shopping:'เชฟความจุน้อยหยิบก่อน เมื่อถึงคิวคุณ เลือกของแล้วกดยืนยัน',
 challenge:'เลือกจาน เติมวัตถุดิบและเครื่องเทศ ตรวจคุณภาพ แล้วเสิร์ฟทั้ง 3 จาน',
 'challenge-results':'ดูคะแนนอาหารของทุกคน แล้วไปจัดตู้เย็น',
 refrigeration:'เลือกของที่จะเก็บไว้รอบต่อไป ของที่จางลงจะไม่ถูกเก็บ',
 critic:'จัดมื้อสุดท้ายตามผู้วิจารณ์ ตรวจทั้ง 7 คอร์สก่อนยืนยันเสิร์ฟ',
 finished:'ดูดาวรวมและเงื่อนไขตัดสินผู้ชนะในสรุปผล'
};
export function renderCK(root: HTMLElement, v: CKView, host: boolean, blocked: boolean, command: (a: RoomAction) => void, snapshot: boolean) {
    const displayPositions=new Map([...root.querySelectorAll<HTMLElement>('[data-priority-player]')].map(node=>[node.dataset.priorityPlayer!,node.getBoundingClientRect()]));
    const displayStocks=[...root.querySelectorAll<HTMLElement>('.ck-d-stock')].map(node=>({node,left:node.scrollLeft,values:['--display-stock-rows','--display-face-height','--display-face-width'].map(name=>[name,node.style.getPropertyValue(name)] as const).filter(([,value])=>value)}));
    const displayScroll=new Map(displayStocks.map(item=>[item.node,item.left]));
    const existingFrame=room===v.code&&v.phase==='planning'&&tab==='kitchen'?root.querySelector<HTMLElement>('.ck-root[data-phase="planning"][data-workspace="kitchen"]'):null;
    const planningProperties=['--ck-plan-footer-height','--ck-plan-pantry-face','--ck-plan-pantry-width','--ck-plan-seam'];
    const planningStyles=existingFrame?planningProperties.map(name=>[name,existingFrame.style.getPropertyValue(name)] as const):[];
    let planningScroll=existingFrame?.querySelector<HTMLElement>('.ck-kitchen .ck-inventory')?.scrollLeft;
    const cookingFrame=room===v.code&&epoch===(v.me?.epoch??`${v.round}:${v.phase}`)&&['challenge','critic'].includes(v.phase)?root.querySelector<HTMLElement>('.ck-cooking'):null;
    const cookingSizes=cookingFrame?[cookingFrame,...cookingFrame.querySelectorAll<HTMLElement>('.ck-cook-source')].map(node=>({node,values:['--ck-resource-width','--ck-cook-card-width','--ck-final-face-height'].map(name=>[name,node.style.getPropertyValue(name)] as const).filter(([,value])=>value)})):[];
    let cookingScroll=cookingFrame?[...cookingFrame.querySelectorAll<HTMLElement>('.ck-cook-source,.ck-dish-rail,.ck-dish-row')].map(node=>({node,left:node.scrollLeft,top:node.scrollTop})):[];
    const restoreCookingScroll=()=>{for(const {node,left,top} of cookingScroll)if(node.isConnected){node.scrollLeft=left;node.scrollTop=top;}};
    if(choice && (choice.code!==v.code || choice.revision!==v.revision || blocked || !choice.dialog.isConnected)) dismissChoice();
    if (room !== v.code) {
        closeCKDeparture();closeCKChallengeReveal();lastFinalStep=-1;previousPhase='';
        room = v.code;pantryView='stock';shoppingOrders.clear();workspaceScroll.clear();
        epoch = '';
        lastSequence = -1;
        lastRevision = -1;
        plan = {};
        chef = '';
        pick = '';
        tab = v.me ? 'kitchen' : 'board';
        detail = '';
        locationDetail = '';
        mode = '';
        resultClosed = false;
        mode = deviceDisplayMode(v.code);
    }
    if (lastSequence >= 0 && v.sequence < lastSequence) {
        resultClosed = false;
        resultCount = true;
    }
    const finalStepChanged=!!v.finalReveal&&v.finalReveal.step!==lastFinalStep;
    if(finalStepChanged)resultClosed=false;
    if(shoppingRound!==v.round){shoppingOrders.clear();shoppingRound=v.round;}
    const departing=!snapshot&&previousPhase==='running'&&v.phase==='shopping';
    const newChallenge=v.phase==='planning'&&v.challengeReveal!==undefined;
    if(!newChallenge)closeCKChallengeReveal();
    previousPhase=v.phase;
    if(v.phase!=='shopping')closeCKDeparture();
    if(departing){dismissChoice();detail='';locationDetail='';}
    disposeChefDrag?.();disposeChefDrag=undefined;
    const me = v.me, mine = v.players.find(p => p.id === me?.id), currentEpoch = me?.epoch ?? `${v.round}:${v.phase}`;
    if (epoch !== currentEpoch) {
        epoch = currentEpoch;
        if(v.phase==='restaurateurs'||v.phase==='planning'&&v.round===1){tab='kitchen';pantryView='stock';detail='';locationDetail='';}
        plan = structuredClone(me?.plan ?? {});
        chef = me?.chefIds[0] ?? '';
        pick = '';
        plate = 0;course=FOODS[0];
        meals = v.phase === 'critic' ? [emptyMeal()] : [emptyMeal(), emptyMeal(), emptyMeal()];
        keep = v.phase==='refrigeration' ? (me?.storage??[]).filter(id=>v.critic==='raccoon'&&TOKEN[id].kind==='ingredient'&&TOKEN[id].value===2) : [...(me?.storage ?? [])];
    }
    if (v.revision !== lastRevision || pick && !me?.choices.includes(pick))
        pick = '';
    const brand=root.closest('main')?.querySelector<HTMLAnchorElement>('.game-header .brand');if(brand){brand.textContent='Critter Kitchen';brand.setAttribute('aria-label','Critter Kitchen — กลับหน้าเลือกเกม');}
    if((v.phase==='running'||v.phase==='finished')&&tab==='information')tab='kitchen';
    const displayMode = mode || v.displayMode, showBoard = tab!=='information'&& v.phase!=='finished'&&!(me&&v.phase==='shopping')&&(!me || displayMode === 'full-mobile' || tab === 'board');
    const locked = blocked || !me, submitted = !!(v.phase === 'challenge' ? me?.meals : v.phase === 'critic' ? me?.critic : false);
    const context: MealContext = { critic: v.critic, round: v.round, challenges: v.challenges.map(c => c.id ?? '') };
    const player: MealPlayer = { restaurateur: mine?.restaurateur ?? null, storage: me?.storage ?? [], known: me?.rumorTokens ?? [], soup: me?.soup ?? 0, bisque: me?.bisque ?? 0 };
    const rerender = () => renderCK(root, v, host, blocked, command, true);
    function confirmAction(title: string, preview: string, action: RoomAction) {
        if(blocked)return;
        dismissChoice();
        const menu=root.querySelector<HTMLDetailsElement>('.ck-menu');if(menu)menu.open=false;
        const restoreScene=rememberCKScroll(root);
        const slot=root.querySelector('#ck-dialog-slot')!;
        slot.querySelectorAll<HTMLDialogElement>('dialog').forEach(d=>{d.close();d.remove();});
        detail='';locationDetail='';
        const opener=document.activeElement as HTMLElement|null;
        const dialog=document.createElement('dialog');
        const serving=action.type==='ck-meals'||action.type==='ck-final';
        dialog.className='ck-dialog ck-choice-dialog'+(serving?' ck-serving-dialog':'')+(action.type==='ck-final'?' ck-final-serving-dialog':'');dialog.tabIndex=-1;dialog.autofocus=true;
        dialog.setAttribute('aria-labelledby','ck-choice-title');
        dialog.innerHTML=`<div class="ck-dialog-body"><h2 id="ck-choice-title" ${serving?'class="sr-only"':''}>${esc(title)}</h2><div class="ck-choice-preview">${preview}</div></div><footer class="ck-choice-actions"><button type="button" id="ck-choice-cancel">ยกเลิก</button><button type="button" id="ck-choice-confirm">ยืนยัน</button></footer>`;
        slot.append(dialog);choice={dialog,revision:v.revision,code:v.code};
        let settled=false;
        const close=()=>{if(settled)return;settled=true;if(choice?.dialog===dialog){choice.rails?.disconnect();choice=undefined;}dialog.close();dialog.remove();if(opener?.isConnected)opener.focus({preventScroll:true});if(lastRevision===v.revision)restoreScene();};
        dialog.querySelector<HTMLButtonElement>('#ck-choice-cancel')!.onclick=close;
        dialog.querySelector<HTMLButtonElement>('#ck-choice-confirm')!.onclick=()=>{
            if(settled || choice?.dialog!==dialog || room!==v.code || lastRevision!==v.revision)return;
            close();command(action);
        };
        dialog.oncancel=e=>{e.preventDefault();close();};
        dialog.onclick=e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}};
        dialog.showModal();dialog.focus({preventScroll:true});restoreScene();
        const rails=dialog.querySelectorAll<HTMLElement>('.ck-meal-rail');
        if(rails.length&&action.type!=='ck-final'){
            const observer=new ResizeObserver(entries=>{for(const {target} of entries){
                const rail=target as HTMLElement,first=rail.firstElementChild as HTMLElement|null;
                if(!first)continue;
                const leading=Math.max(0,first.getBoundingClientRect().left-rail.getBoundingClientRect().left+rail.scrollLeft);
                const available=rail.clientWidth-leading,gap=6;
                if(available<=0)continue;
                const count=Math.max(1,Math.floor((available+gap)/60-.4));
                rail.style.setProperty('--ck-review-card-width',`${(available-gap*count)/(count+.4)}px`);
            }});
            choice!.rails=observer;rails.forEach(rail=>observer.observe(rail));
        }

    }
    const teamFor=(actor=me?.id)=>v.teamColors?.[actor??''];
    const teamPortrait=(id:string,actor=me?.id)=>chefFace(id,teamFor(actor));
    const cosmoNote=me?.cosmoSous?`<aside class="ck-cosmo-note"><b>ความลับของ Cosmo</b><p>รอบที่ Cosmo ทำงาน เขาจะใช้ความสามารถและถือของได้เท่ากับ ${esc(chefName(me.cosmoSous))}</p>${card('sous',me.cosmoSous,true)}</aside>`:'';
    const planPreview=()=>`<div class="ck-review-plan">${me?.chefIds.map(id=>{const destination=v.config.locations.find(l=>l.id===(me.plan??plan)[id]);return `<div class="ck-review-route" data-preview-chef="${id}" data-preview-location="${destination?.id??''}" style="--ck-review-cover:url('/art/critter-kitchen/location-${destination?.id??'soup'}.webp')">${teamPortrait(id)}<span class="ck-review-destination"><small>ส่งไปที่</small><b>${esc(destination?.name??'ยังไม่เลือก')}</b></span></div>`;}).join('')??''}</div><p>แผนยังเป็นความลับจนกว่าทุกคนจะยืนยันครบ</p>`;
    const btn = (text: string, attrs: string, disabled = false) => `<button type="button" ${attrs} ${disabled ? 'disabled' : ''}>${text}</button>`;
    const legal = (type: string) => me?.legal.find(a => a.type === type);
    const isTarget = v.turn === me?.id;
    const waitingForOpponent=!!me&&v.phase==='shopping'&&!isTarget;
    if(me&&v.phase==='shopping'&&tab!=='information')tab='kitchen';
    const status = ['shopping','challenge','critic','challenge-results','refrigeration'].includes(v.phase) ? '' : phaseName[v.phase] ?? v.phase;
    const pantryOrder=(a:string,b:string)=>{const x=TOKEN[a],y=TOKEN[b];return FOODS.indexOf(x.food as Food)-FOODS.indexOf(y.food as Food)||x.kind.localeCompare(y.kind)||(y.value??0)-(x.value??0);};
    const shoppingLocation=v.config.locations.find(loc=>loc.id===(v.decision?.loc??v.location));
    const shoppingVisitors=shoppingLocation?v.visits.filter(visit=>visit.loc===shoppingLocation.id):[];
    const shoppingScene=shoppingLocation ? `<div class="ck-shopping-scene" style="--shopping-cover:url('/art/critter-kitchen/location-${shoppingLocation.id}.webp')"><strong>${esc(shoppingLocation.name)}</strong><div class="ck-shopping-chefs" aria-label="เชฟที่มาสถานที่นี้">${shoppingVisitors.map(visit=>{
        const active=visit.actor===v.turn&&visit.chef===v.decision?.chef,name=v.players.find(p=>p.id===visit.actor)?.name??'';
        return btn(teamPortrait(visit.chef,visit.actor),`class="ck-shopping-chef ${active?'is-active':''}" data-inspect-chef="${visit.chef}" data-visit-actor="${visit.actor}" data-ui-key="shopping-visit-${visit.id}" aria-current="${active}" aria-label="ดูรายละเอียด ${esc(chefName(visit.chef))} · ${esc(name)}${active?' · กำลังเลือกวัตถุดิบ':''}" title="${esc(name)} · ${esc(chefName(visit.chef))}"`);
    }).join('')}</div></div>` : '';

    const locationMarkup = (loc: CKView['config']['locations'][number], expanded = false) => {
        const history=!['restaurateurs','planning','running'].includes(v.phase),pickups=history?(v.pickups??[]).filter(p=>p.loc===loc.id):[];
        const ids=[...new Set([...(history?v.marketStock?.[loc.id]??[]:[]),...(v.locations[loc.id]??[]),...pickups.map(p=>p.item),...loc.id==='soup'?['soup',...v.bisqueAvailable?['bisque']:[]]:[],...loc.id==='academy'?[...v.academySous?['zous:'+v.academySous]:[],...v.seventhAvailable?['seventh-allspice']:[]]:[]])];
        const stock=(loc.id==='midnight'?mysteryStock(midnightMysteryCount(v),'card'):'')+ids.map(id=>{
            const marks=pickups.filter(p=>p.item===id),owners=[...new Map(marks.map(p=>[p.actor+':'+p.chef,p])).values()];
            const names=[...new Set(owners.map(p=>v.players.find(player=>player.id===p.actor)?.name??''))].join(', ');
            return `<div class="ck-market-token ${marks.length?'ck-market-owned':''}" data-market-item="${id}" data-ui-key="market-${loc.id}-${id}">${btn(token(id).replace('loading="lazy"','loading="eager"'),`class="ck-market-face" data-ui-key="market-face-${loc.id}-${id}" data-pick="${id}" aria-label="ดูรายละเอียด ${esc(label(id))}"`)}${owners.length?`<div class="ck-pick-stamps" data-ui-key="market-owners-${loc.id}-${id}">${owners.slice(-2).map(mark=>{const color=teamFor(mark.actor)??'blue';return `<span class="ck-pick-stamp" data-owner="${mark.actor}" data-team="${color}" title="${esc(names)}">${art(chefArtId(mark.chef,color))}</span>`;}).join('')}</div><small class="ck-market-owner-name">${esc(names)}</small>`:''}</div>`;
        }).join('');
        return `<article class="ck-location ${v.location===loc.id?'active':''}" data-ui-key="loc-${loc.id}" data-location-card="${loc.id}" style="--loc:url('/art/critter-kitchen/location-${loc.id}.webp')"><header><div class="ck-location-caption"><strong>${esc(loc.name)}</strong><small>${loc.id==='soup'?'ซุปไม่จำกัด':loc.id==='midnight'&&midnightMysteryCount(v)?`สุ่ม ${loc.slots} ชิ้นเมื่อถึงคิว`:loc.slots?`เติม ${loc.slots} ชิ้น`:'ของจากตลาด'}</small></div></header><div class="ck-stock ck-market-stock" aria-label="ของที่ ${esc(loc.name)}">${stock||'<div class="ck-market-empty"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 20 15 8h18l7 12v19H8Z"/><path d="M8 20h10l3 6h6l3-6h10M19 14h10"/></svg><p>ไม่มีของในตลาด</p></div>'}</div>${expanded?'<p>เชฟความจุน้อยหยิบก่อน เมื่อความจุเท่ากันจะเวียนตามลำดับหมวก</p>':''}</article>`;
    };
    const servicePlates=v.phase==='challenge'&&me&&!submitted?`<nav class="ck-plate-tabs" aria-label="เลือกจาน">${meals.map((m,i)=>{
        let ready=false;
        if(m.items.length)try{validateMeals(context,player,meals.map((other,j)=>j===i?other:emptyMeal()),false);ready=true;}catch{/* Incomplete plates keep their number. */}
        return btn(`<span class="ck-plate-number">${ready?`<b class="ck-plate-quality">${mealQuality(context,player,m,true)}</b><span class="ck-plate-ready-mark">${ckIcon('confirm')}</span>`:i+1}</span>`,`data-plate="${i}" data-plate-ready="${ready}" class="${i===plate?'selected':''}" aria-pressed="${i===plate}" aria-label="จาน ${i+1}${ready?' พร้อมเสิร์ฟ':''} คุณภาพ ${mealQuality(context,player,m,true)}"`);
    }).join('')}</nav>`:'';
    const processTitle:Record<string,string>={restaurateurs:'เลือกเจ้าของร้าน',planning:me?.plan?'รอออกตลาด':'ส่งเชฟออกตลาด',shopping:'เลือกวัตถุดิบ',challenge:'เสิร์ฟอาหาร',critic:'เสิร์ฟมื้อสุดท้าย','challenge-results':'ผลการเสิร์ฟ',refrigeration:'จัดตู้เย็น',finished:'สรุปผล'};
    const shoppingStock=()=>{
        const loc=shoppingLocation?.id;if(!loc)return '';
        const pickups=(v.pickups??[]).filter(p=>p.loc===loc);
        const candidates=[...new Set([...(v.marketStock?.[loc]??[]),...(v.locations[loc]??[]),...pickups.map(p=>p.item),...isTarget?me?.choices??[]:[]])];
        const orderKey=`${v.round}:${loc}`,ids=shoppingOrders.get(orderKey)??[];for(const id of candidates)if(!ids.includes(id))ids.push(id);shoppingOrders.set(orderKey,ids);
        const rows=ids.length>=5?2:1,columns=rows===1?ids.length:ids.length<=8?4:Math.ceil(ids.length/2);
        return `${shoppingScene}<div class="ck-market-cards"><div class="ck-picks" data-rows="${rows}" data-columns="${columns}" data-many="${ids.length>8}">${ids.map((id,index)=>{
            const marks=pickups.filter(p=>p.item===id),canPick=isTarget&&!!me?.choices.includes(id);
            const available=(v.locations[loc]??[]).includes(id)||id==='soup'||id==='bisque'&&v.bisqueAvailable||id.startsWith('zous:')&&v.academySous===id.slice(5)||id==='seventh-allspice'&&v.seventhAvailable;
            const exhausted=marks.length>0&&!available;
            const owners=[...new Map(marks.map(p=>[p.actor+':'+p.chef,p])).values()];
            // Keep the latest local pickup visible while waiting; shared soup can have many owners.
            if(waitingForOpponent)owners.sort((a,b)=>Number(a.actor===me?.id)-Number(b.actor===me?.id));
            const visibleOwners=(id==='soup'||id==='bisque')&&available?[]:owners.slice(-2),owned=marks.some(p=>p.actor===me?.id);
            const stampTitle=owners.map(mark=>`${v.players.find(p=>p.id===mark.actor)?.name??''} · ${chefName(mark.chef)}`).join(', ');
            return `<div class="ck-pick-card ${id.startsWith('zous:')?'ck-chef-offer-card':''} ${marks.length&&!((id==='soup'||id==='bisque')&&available)?'ck-claimed':''} ${owned?'ck-owned':''} ${exhausted?'ck-exhausted':''} ${TOKEN[id]?.kind==='rumor'&&!canPick?'ck-rumor-unavailable':''}" data-ui-key="shopping-${loc}-${id}" style="grid-row:${Math.floor(index/columns)+1};grid-column:${index%columns+1}">${btn(token(id),`data-pick="${id}" aria-haspopup="dialog" aria-label="ดูรายละเอียด ${esc(label(id))}"`)}${exhausted?'<span class="ck-sold-ribbon">หมด</span>':''}${canPick?btn(ckIcon('plus'),`data-buy="${id}" aria-haspopup="dialog" class="ck-buy-button" aria-label="หยิบ ${esc(label(id))}" title="หยิบ ${esc(label(id))}"`,blocked):''}<div class="ck-pick-stamps" data-ui-key="pickup-stamps-${loc}-${id}" title="${esc(stampTitle)}">${owners.length>2?`<span class="ck-stamp-more">+${owners.length-2}</span>`:''}${visibleOwners.map(mark=>{
                const name=v.players.find(p=>p.id===mark.actor)?.name??'',color=teamFor(mark.actor)??(mark.actor===me?.id?'blue':'red');
                const visit=v.visits.find(x=>x.actor===mark.actor&&x.chef===mark.chef&&x.loc===loc);
                const progress=visit?`${visit.used}/${visit.limit}`:'';
                return `<span class="ck-pick-stamp" data-ui-key="pickup-${mark.actor}-${mark.chef}" data-owner="${mark.actor}" data-team="${color}" title="${esc(name)} · ${esc(chefName(mark.chef))}${progress?' · '+progress:''}" aria-label="${esc(name)} ใช้ ${esc(chefName(mark.chef))} หยิบแล้ว ${progress} ชิ้น">${art(chefArtId(mark.chef,color)).replace('loading="lazy"','loading="eager" decoding="sync"')}${progress?`<small>${progress}</small>`:''}</span>`;
            }).join('')}</div></div>`;
        }).join('')}</div>${waitingForOpponent?`<div class="ck-market-loading" role="status">${ckIcon('loading')}<span>รอเพื่อนเลือกของสักครู่</span></div>`:''}</div>`;
    };
    const rumorOptions=()=>{
        if(!me)return '';
        return `<p>แตะข่าวลือที่ยังไม่รู้เพื่อยืนยันการเลือก</p><div class="ck-rumor-options">${[0,1,2].map(index=>{
            const known=!me.rumorChoices.includes(index);
            return `<div class="ck-rumor-slot" data-ui-key="rumor-choice-${index}">${btn(`${art('back-rumor')}<span class="ck-rumor-caption"><strong>ข่าวลือ ${index+1}</strong>${known?'<small>รู้แล้ว</small>':''}</span>`,`class="ck-rumor-face ${known?'ck-rumor-known':''}" data-rumor="${index}" aria-haspopup="dialog" aria-label="เลือกข่าวลือ ${index+1}${known?' · รู้แล้ว':''}"`,blocked||known)}${!known?btn(ckIcon('plus'),`class="ck-buy-button" data-rumor-buy="${index}" aria-label="เลือกข่าวลือ ${index+1}" aria-haspopup="dialog"`,blocked):''}</div>`;
        }).join('')}</div>`;
    };
    const consolationOptions=()=>`<section class="ck-consolation"><header><h2>เชฟกลับถึงครัวแล้ว</h2><p>เลือกของกลับครัวได้ 1 อย่าง</p></header><div class="ck-reward-options">${(me?.rewards??[]).filter(reward=>reward!=='skip').map(reward=>btn(`${reward==='soup'?token('soup'):`<span class="ck-reward-bag-art">${art('mystery-midnight-parcel')}</span>`}<span class="ck-reward-copy"><strong>${reward==='soup'?'รับซุป 1 ถ้วย':'สุ่มของจากถุง 1 ชิ้น'}</strong><small>${reward==='soup'?'ไว้เติมคุณภาพหรือแทนวัตถุดิบตอนเสิร์ฟ':'รับของสุ่มตามความสามารถเจ้าของร้าน'}</small></span>`,`class="ck-reward-option" data-reward="${reward}" aria-haspopup="dialog"`,blocked)).join('')}</div>${me?.rewards.includes('skip')?btn(`${ckIcon('logout')}<span>กลับครัวโดยไม่รับของ</span>`,'class="ck-reward-skip" data-reward="skip" aria-haspopup="dialog"',blocked):''}</section>`;
    let action = '';
    if (me) {
        if (v.phase === 'restaurateurs')
            action = `<h2>เลือกหัวหน้าเชฟของคุณ</h2><p class="ck-offer-hint">เลือก 1 จาก 2 ใบ · ความสามารถอยู่กับคุณตลอดเกม</p><div class="ck-offers">${me.offers.map(id => `<div>${card('restaurateur', id)}${btn('เลือกคนนี้', `data-rest="${id}"`, locked)}</div>`).join('') || `<div class="ck-rest-wait" role="status">${ckIcon('loading')}<h3>เลือกหัวหน้าเชฟแล้ว</h3><p>กำลังรอเพื่อนเลือกให้ครบ…</p></div>`}</div>`;
        if (v.phase === 'planning') {
            const shared=true,draft=me.plan??plan; // Both screen modes use drag-only planning.
            const chefCard=(id:string)=>teamPortrait(id)+(me.plan?`<span class="ck-plan-lock" role="img" aria-label="ล็อกแผนแล้ว" title="ล็อกแผนแล้ว">${ckIcon('lock')}</span>`:'');
            action = `<div class="${shared?'ck-route-planner':'ck-basic-planner'}" data-location-count="${v.config.locations.length}" style="--ck-location-count:${v.config.locations.length}"><h2>${me.plan ? 'ส่งแผนแล้ว' : 'ส่งเชฟออกตลาด'}</h2><p class="ck-route-hint">${shared?'ลากการ์ดเชฟไปวางในกรอบสีเหลือง แตะการ์ดเพื่ออ่านรายละเอียด':'เชฟแต่ละตัวไปคนละสถานที่ แผนจะเปิดพร้อมกันเมื่อทุกคนยืนยัน'}</p><div class="ck-chefs">${me.chefIds.map(id=>btn(`${chefCard(id)}${!shared?`<small>${esc(v.config.locations.find(l=>l.id===draft[id])?.name??'ยังไม่เลือก')}</small>`:''}`,`data-chef="${id}" data-ui-key="plan-chef-${id}" class="${chef===id?'selected':''} ${draft[id]?'ck-assigned':''}" aria-label="ดูรายละเอียด ${esc(chefName(id))} · ${chefCarry(id)}${draft[id]?' · '+esc(v.config.locations.find(l=>l.id===draft[id])?.name??''):''}"`,false)).join('')}</div><div class="ck-destinations">${v.config.locations.map(loc=>{
             const assigned=me.chefIds.find(id=>draft[id]===loc.id);
             const stock=[...(v.locations[loc.id]??[]),...loc.id==='soup'?['soup',...v.bisqueAvailable?['bisque']:[]]:[],...loc.id==='academy'?[...v.academySous?['zous:'+v.academySous]:[],...v.seventhAvailable?['seventh-allspice']:[]]:[]];
             const preview=`<span class="ck-route-stock" data-ui-key="route-stock-${loc.id}" aria-label="ของที่ ${esc(loc.name)}">${loc.id==='midnight'?mysteryStock(midnightMysteryCount(v),'circle'):''}${stock.map(routeStockItem).join('')}</span>`;
             return `<div data-destination="${loc.id}" role="group" aria-label="${esc(loc.name)}" aria-disabled="${!!me.plan||blocked}"><img class="ck-route-cover" src="/art/critter-kitchen/location-${loc.id}.webp" alt="" draggable="false"><b class="ck-route-name">${esc(loc.name)}</b>${preview}<span class="ck-route-slot ${assigned?'ck-route-filled':''}">${assigned?`<button type="button" class="ck-placed-chef" data-placed-chef="${assigned}" aria-label="ดูรายละเอียด ${esc(chefName(assigned))}">${chefCard(assigned)}</button>`:'<span class="ck-slot-outline" aria-hidden="true">＋</span>'}</span></div>`;
            }).join('')}</div><div class="ck-plan-summary">${me.chefIds.map(id => `<span>${chefName(id)} → ${esc(v.config.locations.find(l => l.id === (me.plan ?? plan)[id])?.name ?? 'ยังไม่เลือก')}</span>`).join('')}</div>${(me.plan||me.chefIds.every(id=>plan[id]))?`<div class="ck-plan-actions ck-plan-floating">${btn(ckIcon(me.plan?'edit':'confirm'),`id="ck-commit" class="ck-circle-action ${me.plan?'ck-edit-plan':''}" aria-label="${me.plan?'แก้ไขแผน':'ยืนยันแผน'}" title="${me.plan?'แก้ไขแผน':'ยืนยันแผน'}"`,locked)}</div>`:''}</div>`;
        }
        if (v.phase === 'running')
            action = `<section class="ck-ready-market"><h2>ทุกคนส่งแผนแล้ว</h2><p>กดปุ่มเริ่มเพื่อออกตลาด</p>${btn('เริ่ม','data-action="ck-run" class="ck-market-start"',locked)}</section>`;
        if (v.phase === 'shopping')
            action = `${isTarget ? v.decision?.kind === 'rudy-gift' ? `<section class="ck-rudy-gift"><h2>Rudy จะมอบแครอตให้ใคร?</h2><p>มอบแครอตชิ้นนี้ให้ผู้เล่นอื่นเพื่อรับ 1 ดาว หรือเก็บไว้ปรุงอาหารเอง</p><div class="ck-token-preview">${token(me.giftToken!)}</div><div class="ck-rudy-recipients">${v.players.filter(other=>other.id!==me.id).map(other=>btn(`${avatar(other)}<strong>${esc(other.name)}</strong>`,`data-rudy-recipient="${other.id}"`,blocked)).join('')}</div>${btn('เก็บแครอตไว้เอง','data-rudy-recipient=""',blocked)}</section>` : v.decision?.kind === 'rumor' ? rumorOptions() : v.decision?.kind === 'consolation' ? consolationOptions() : shoppingStock() : shoppingStock()}`;
        if (v.phase === 'challenge' || v.phase === 'critic') {
            const final = v.phase === 'critic';
            const used = new Set(meals.flatMap(m => [...m.items.flatMap(a => [a.token, ...a.spice ? [a.spice] : []]), ...(m.wine ?? []).map(w => w.token)]));
            const selectedMeal = meals[plate] ?? emptyMeal();
            let error = '';
            try {
                validateMeals(context, player, meals, final);
            }
            catch (e) {
                error = (e as Error).message;
            }
            const required=(CHALLENGE[v.challenges[(v.round===3?0:3)+plate]?.id??'']?.foods??[]).slice(0,plate===2?2:3);
            const spiceOptions=(a:Meal['items'][number])=>[...me.storage,...v.critic==='jerboa'&&final?me.rumorTokens.filter((x):x is string=>!!x):[]]
                .filter(id=>id!==a.token&&(TOKEN[id].kind==='spice'||v.critic==='saint-bernard'&&TOKEN[id].food==='wine'||TOKEN[id].kind==='rumor'))
                .filter(id=>spiceMatches(context,player,{...a,spice:id},final))
                .filter(id=>!used.has(id)||a.spice===id||mine?.restaurateur==='heron-sanchez'&&!final&&selectedMeal.items.some(other=>other.spice===id&&TOKEN[other.token].food===TOKEN[a.token].food)&&!meals.some((m,j)=>j!==plate&&m.items.some(other=>other.spice===id)))
                .sort((x,y)=>Number(TOKEN[x]?.food==='all')-Number(TOKEN[y]?.food==='all'));
            const dishGroups=new Map<string,{a:Meal['items'][number];i:number;count:number}>();
            selectedMeal.items.forEach((a,i)=>{
                // Keep independently seasoned/reassigned ingredients separately editable.
                const t=TOKEN[a.token],key=`${t.food}:${t.value}:${a.as}:${a.spice?i:'plain'}`;
                const group=dishGroups.get(key);if(group)group.count++;else dishGroups.set(key,{a,i,count:1});
            });
            const canAdd=(id:string)=>{if(used.has(id))return false;if(!final)return true;try{validateMeals(context,player,[{...selectedMeal,items:[...selectedMeal.items,{token:id,as:TOKEN[id].food as Food}]}],true);return true;}catch{return false;}};
            const scoreGuide=`<aside class="ck-score-guide" aria-label="คุณภาพที่ต้องได้เพื่อรับดาว"><small>คุณภาพ → ดาวพื้นฐาน</small>${[[6,1],[12,2],[21,4]].map(([quality,stars])=>`<span><b>${quality}+</b><i>→</i><strong>${ckIcon('star')}${stars}</strong></span>`).join('')}<small>ขั้นต่ำ 6 เพื่อเสิร์ฟ</small></aside>`;
            const bonusNotes=[v.critic==='capybara'?'คาปิบารา: +1 ดาวต่อจานที่เสิร์ฟ':'',mine?.restaurateur==='falcon-brown'?'โบนัส +1 ดาว เมื่อครบชนิดพอดีและไม่ใช้ซุป/บิสก์':'',mine?.restaurateur==='graham-elephant'?'โบนัส +1 ดาว เมื่อคุณภาพถึง 25':''].filter(Boolean);
            const foodIcon=(f:Food)=>`<span class="ck-required-food"><span class="ck-recipe-picture">${art('ingredient-'+f)}</span><small>${FOOD_NAMES[f]}</small></span>`;
            action = submitted?`<div class="ck-serving-wait">${waitScene('รอ '+(v.players.filter(p=>p.id!==me.id&&!p.committed).map(p=>p.name).join(', ')||'เพื่อน')+' เสิร์ฟอาหาร')}</div>`:`<div class="ck-cooking ${final?'ck-final-cooking':''}" data-ui-key="cooking">
                ${final?'':`<div class="ck-dish-heading"><h3>เมนูที่ต้องเสิร์ฟ</h3><div class="ck-recipe-icons" aria-label="วัตถุดิบที่จานนี้ต้องการ">${required.map(foodIcon).join('')}</div>${scoreGuide}${bonusNotes.length?`<small class="ck-score-bonus">${bonusNotes.map(esc).join(' · ')}</small>`:''}</div>`}
                ${servicePlates}
                ${final?'':`<div class="ck-dish-rail" aria-label="วัตถุดิบในจาน" data-ui-key="dish-${final?course:plate}"><div class="ck-dish-row">${[...dishGroups.values()].map(({a,i,count})=>{
                    const options=spiceOptions(a);
                    return `<div class="ck-dish-item" data-ui-key="dish-item-${a.token}">${btn(token(a.token),`data-token-detail="${a.token}" aria-label="ดู ${esc(label(a.token))}"`)}<span class="ck-dish-quantity ck-ingredient-quantity" ${count<2?'hidden':''}>×${count}</span>${btn(ckIcon('close'),`class="ck-remove-food" data-remove="${i}" aria-label="นำ ${esc(label(a.token))} ออกจากจาน"`,blocked)}<label class="ck-spice-toggle"><input type="checkbox" data-toggle-spice="${i}" data-spice-id="${a.spice??options[0]??''}" ${a.spice?'checked':''} ${blocked||!options.length?'disabled':''} aria-label="ใส่เครื่องเทศให้ ${esc(label(a.token))}">${art('resource-spice')}<span class="sr-only">เครื่องเทศ</span></label>${(v.critic==='badger'&&TOKEN[a.token].food==='mushroom'||!final&&mine?.restaurateur==='wolfgang-duck'&&TOKEN[a.token].food==='wine')?`<label>ใช้เป็น<select data-as="${i}">${FOODS.map(f=>`<option value="${f}" ${a.as===f?'selected':''}>${FOOD_NAMES[f]}</option>`).join('')}</select></label>`:''}</div>`;
                }).join('')}${!final?(['soup','bisque'] as const).filter(k=>selectedMeal[k]>0).map(k=>`<div class="ck-dish-item ck-dish-broth" data-ui-key="dish-broth-${k}">${btn(token(k),`data-token-detail="${k}" aria-label="ดู ${label(k)}"`)}${btn(ckIcon('close'),`class="ck-remove-food" data-remove-broth="${k}" aria-label="นำ ${k==='soup'?'ซุป':'บิสก์'} ออก 1 ชิ้น"`,blocked)}<span class="ck-dish-quantity" ${selectedMeal[k]<2?'hidden':''}>×${selectedMeal[k]}</span></div>`).join(''):''}${!selectedMeal.items.length&&!(selectedMeal.soup||selectedMeal.bisque)?'<p class="ck-dish-empty">กดบวกที่วัตถุดิบในครัวเพื่อเติมลงจาน</p>':''}</div></div>`}
                ${final&&v.critic==='fruit-bat'?[...new Set(selectedMeal.items.map(a=>a.as))].map(food=>`<label>ไวน์จับคู่ ${FOOD_NAMES[food]}<select data-wine="${food}"><option value="">ไม่เพิ่ม</option>${me.storage.filter(id=>TOKEN[id].kind==='ingredient'&&TOKEN[id].food==='wine'&&(!used.has(id)||selectedMeal.wine?.some(w=>w.token===id&&w.course===food))).map(id=>`<option value="${id}" ${selectedMeal.wine?.some(w=>w.token===id&&w.course===food)?'selected':''}>${esc(label(id))}</option>`).join('')}</select></label>`).join(''):''}
                <h3 class="ck-cook-stock-title">${final?'เลือกวัตถุดิบมื้อสุดท้าย':'เติมวัตถุดิบจากครัว'}</h3><div class="ck-inventory ck-cook-source">${!final?(['soup','bisque'] as const).map(k=>{
                    const remaining=me[k]-meals.reduce((n,m)=>n+m[k],0);
                    return `<div class="ck-pick-card ck-cook-broth ${remaining?'':'ck-stock-empty'}" data-ui-key="cook-broth-${k}">${btn(token(k),`data-token-detail="${k}" aria-label="ดู ${label(k)}"`)}${remaining>0?btn(ckIcon('plus'),`data-broth="${k}" data-delta="1" class="ck-buy-button" aria-label="เติม${k==='soup'?'ซุป':'บิสก์'}"`,blocked):''}<span class="ck-broth-remaining" ${remaining<2?'hidden':''} data-remaining="${k}" aria-label="เหลือ ${remaining} ชิ้น">×${remaining}</span></div>`;
                }).join(''):''}${(final?[...me.storage].sort(pantryOrder).filter(id=>TOKEN[id].kind==='ingredient').map(id=>({id,ids:[id],key:id})):groupIngredients([...me.storage].sort(pantryOrder).filter(id=>TOKEN[id].kind==='ingredient'))).map(group=>{
                    const available=group.ids.filter(id=>canAdd(id)),next=available[0],selectedIndex=final?selectedMeal.items.findIndex(item=>item.token===group.id):-1,selected=selectedMeal.items[selectedIndex];
                    const options=selected?spiceOptions(selected):[];
                    const controls=selected?`<label class="ck-spice-toggle"><input type="checkbox" data-toggle-spice="${selectedIndex}" data-spice-id="${selected.spice??options[0]??''}" ${selected.spice?'checked':''} ${blocked||!options.length?'disabled':''} aria-label="ใส่เครื่องเทศให้ ${esc(label(group.id))}">${art('resource-spice')}<span class="sr-only">เครื่องเทศ</span></label>${v.critic==='badger'&&TOKEN[group.id].food==='mushroom'?`<label class="ck-final-as">ใช้เป็น<select data-as="${selectedIndex}">${FOODS.map(f=>`<option value="${f}" ${selected.as===f?'selected':''}>${FOOD_NAMES[f]}</option>`).join('')}</select></label>`:''}`:'';
                    return `<div class="ck-pick-card ${selected?'ck-final-selected':next?'':'ck-in-dish'}" data-stock-group="${group.key}" data-ui-key="cook-stock-${group.key}" data-food="${TOKEN[group.id].food}" data-quality="${TOKEN[group.id].value}">${btn(token(group.id),`data-token-detail="${group.id}" aria-label="ดู ${esc(label(group.id))}"`)}${selected?btn(crown.replace('aria-label="ผู้ชนะ" role="img"','aria-hidden="true"'),`data-final-remove="${selectedIndex}" class="ck-buy-button ck-final-crown" aria-label="ยกเลิกเลือก ${esc(label(group.id))}"`,blocked):next?btn(ckIcon('plus'),`data-add="${next}" class="ck-buy-button" aria-label="เติม ${esc(label(next))}"`,blocked):''}${final?'':`<span class="ck-broth-remaining" ${available.length<2?'hidden':''} data-stock-quantity="${group.key}">×${available.length}</span>`}${controls}</div>`;
                }).join('')||'<p>ไม่มีวัตถุดิบในครัว</p>'}</div>
                <footer class="ck-serve-footer"><p class="ck-validation ${error?'':'ck-serve-ready'}" role="status">${!error?ckIcon('confirm'):''}<span>${esc(error||`พร้อมเสิร์ฟ · คุณภาพ ${mealQuality(context,player,selectedMeal,!final)}`)}</span></p>${btn(ckIcon('confirm'),'id="ck-serve" class="ck-cook-round" aria-label="ยืนยันส่งอาหาร" title="ยืนยันส่งอาหาร"',blocked||!!error)}</footer>
            </div>`;

        }
        if (v.phase === 'refrigeration') {
            const limit=v.round===3?5:10,free=(id:string)=>v.critic==='raccoon'&&TOKEN[id].kind==='ingredient'&&TOKEN[id].value===2;
            const target=Math.min(limit,me.storage.filter(id=>!free(id)).length),count=keep.filter(id=>!free(id)).length,full=count===target;
            action=mine?.fridgeReady?waitScene('รอเพื่อนจัดตู้เย็นสักครู่'):`<div class="ck-fridge-picker"><header><h2>เลือกเก็บในตู้เย็น <span>${count}/${target}</span></h2><small>ซุปและบิสก์เก็บให้แล้ว ไม่กินที่ตู้เย็น</small></header><div class="ck-fridge-grid">${[...me.storage].sort(pantryOrder).map(id=>btn(`${token(id)}${keep.includes(id)?`<span class="ck-fridge-tick">${ckIcon('confirm')}</span>`:''}`,`data-keep="${id}" class="${keep.includes(id)?'ck-kept':full?'ck-will-discard':''}" aria-label="${keep.includes(id)?'นำออกจากตู้เย็น':'เลือกเก็บ'} ${esc(label(id))}"`,blocked)).join('')}</div><footer>${btn(ckIcon('confirm'),'id="ck-fridge" aria-label="ยืนยันของที่เก็บ" title="ยืนยันของที่เก็บ"',blocked||!full)}</footer></div>`;
        }
    }
    if (host && !me && v.phase === 'running')
        action = `<section class="ck-ready-market"><h2>ทุกคนส่งแผนแล้ว</h2><p>กดปุ่มเริ่มเพื่อออกตลาด</p>${btn('เริ่ม','data-action="ck-run" class="ck-market-start"',blocked)}</section>`;
    if(v.phase==='challenge-results'){
        const results=v.players.map(p=>{const dishes=v.challengeResults?.[p.id]??[];return {p,dishes,stars:dishes.reduce((n,s)=>n+s.stars,0),quality:dishes.reduce((n,s)=>n+s.quality,0)};}).sort((a,b)=>b.stars-a.stars||b.quality-a.quality);
        action=`<div class="ck-round-results"><div class="ck-results-rail ${results.length===2?'ck-results-pair':''}" data-player-count="${results.length}" aria-label="ผลการเสิร์ฟ เรียงดาวมากไปน้อย">${results.map(({p,dishes,stars,quality})=>`<article class="ck-result-player" data-result-player="${p.id}" data-result-stars="${stars}" data-ui-key="result-${p.id}"><header>${avatar(p)}<strong>${esc(p.name)}${p.id===me?.id?' (คุณ)':''}</strong></header><div class="ck-result-total">${ckIcon('star')}<b data-total="${stars}">0</b><span>ดาว</span><small>คุณภาพรวม ${quality}</small></div><div class="ck-result-dishes">${dishes.map((dish,i)=>`<div class="ck-result-dish"><span class="ck-result-plate" role="img" aria-label="จานที่ ${i+1}"><span class="ck-plate-number">${i+1}</span></span><span class="ck-result-quality">คุณภาพ ${dish.quality}</span><b class="ck-result-dish-stars" aria-label="${dish.stars} ดาว">${ckIcon('star')}${dish.stars}</b></div>`).join('')}</div></article>`).join('')}</div>${me||host?`<footer>${btn(ckIcon('fridge'),'data-action="ck-next" class="ck-next-fridge" aria-label="จัดตู้เย็นและไปขั้นตอนถัดไป" title="จัดตู้เย็นและไปขั้นตอนถัดไป"',blocked)}</footer>`:''}</div>`;
    }
    const revealGate=()=>`<div class="ck-reveal-gate">${v.phase==='finished'?art('results','ck-gate-art',true):ckIcon('star')}<h2>${v.phase==='finished'?'มื้อสุดท้ายพร้อมแล้ว':'ทุกจานพร้อมแล้ว'}</h2><p>พร้อมลุ้นดาวไปด้วยกันหรือยัง?</p>${me||host?btn(v.phase==='finished'?'เริ่มเฉลยคะแนน':'เปิดผลการเสิร์ฟ','data-action="ck-reveal-results" class="ck-reveal-button"',blocked):'<p>รอผู้เล่นเปิดผลการเสิร์ฟ</p>'}</div>`;
    if(v.phase==='challenge-results'&&v.resultsRevealed===false)action=revealGate();
    if(v.phase==='finished')action=v.resultsRevealed===false?revealGate():`<section class="ck-finished-hub"><div class="ck-finished-art">${art('results','',true)}</div><footer>${btn(v.finalReveal&&!v.finalReveal.complete?'นับคะแนนต่อ':'ดูสรุปคะแนน','id="ck-show-result"')}${host||me?.canManage?btn('เริ่มเล่นใหม่','id="ck-restart"',blocked):`<a class="ck-exit-room" href="/" aria-label="ออกจากห้อง" title="ออกจากห้อง">${ckIcon('logout')}</a>`}</footer></section>`;
    const publicInformation=`<div class="ck-information"><div>${card('critic', v.critic, true)}</div><div class="ck-challenges">${v.challenges.map((c, i) => c.id ? `<div class="${c.held?'ck-held':''}">${card('challenge', c.id, true)}<small>${c.held ? 'Hold · ไม่ใช้ชนิดขวาสุด' : `Challenge ${i + 1}`}</small></div>` : `<div class="ck-card-back">${art('back-challenge')}<b>Challenge ${i + 1}</b></div>`).join('')}</div><div class="ck-rumors">${v.rumors.map((id, i) => id ? card('rumor', id, true) : `<div class="ck-card-back">${art('back-rumor')}<b>ข่าวลือ ${i + 1}</b><small>${v.players.filter(p => p.known[i]).length}/${v.players.length} คนรู้</small></div>`).join('')}</div></div>`;
    const referenceCard=(kind:'critic'|'challenge'|'rumor',id:string,held=false,heading='')=>{
        const data=kind==='critic'?CRITIC[id]:kind==='challenge'?CHALLENGE[id]:RUMOR[id];
        const foods=kind==='challenge'?`<span class="ck-reference-foods">${CHALLENGE[id].foods.map((food,index)=>`<span class="${held&&index===CHALLENGE[id].foods.length-1?'ck-omitted-food':''}" role="img" aria-label="${FOOD_NAMES[food]}${held&&index===CHALLENGE[id].foods.length-1?' ไม่ใช้ในข้อนี้':''}">${art('ingredient-'+food)}${held&&index===CHALLENGE[id].foods.length-1?ckIcon('close'):''}</span>`).join('')}</span>`:'';
        return `<button type="button" class="ck-card small ck-reference-face" data-ui-key="reference-${kind}-${id}" data-detail="${kind}:${id}" aria-label="ดู ${esc(data.name)}">${art(kind+'-'+id)}${heading?`<span class="ck-reference-index">${esc(heading)}</span>`:''}<span class="ck-reference-caption"><strong>${esc(data.name)}</strong>${held?'<small class="ck-reference-hold">ไม่ใช้วัตถุดิบชนิดขวาสุด</small>':''}${foods}</span></button>`;
    };
    const informationBack=(kind:string,caption:string,held=false)=>`<article class="ck-reference-back">${art('back-'+kind)}<span class="ck-reference-index">${esc(caption)}</span><span class="ck-reference-caption"><small>ยังไม่เปิดเผย</small>${held?'<small class="ck-reference-hold">ไม่ใช้วัตถุดิบชนิดขวาสุด</small>':''}</span></article>`;
    const referenceInformation=`<section class="ck-reference" data-ui-key="reference-workspace" aria-label="ผู้วิจารณ์ เป้าหมาย และข่าวลือ" ${me&&tab==='information'?'':'hidden'}>
        <section class="ck-reference-section"><h2>ผู้วิจารณ์มื้อสุดท้าย</h2><div class="ck-reference-critic">${referenceCard('critic',v.critic)}<p>${esc(CRITIC[v.critic].text)}</p></div></section>
        <section class="ck-reference-section"><h2>Challenge ทั้ง 6 ข้อ</h2><div class="ck-reference-grid">${v.challenges.map((challenge,i)=>`<div class="ck-reference-slot ${challenge.held?'ck-held':''}" data-ui-key="reference-challenge-${i}">${challenge.id?referenceCard('challenge',challenge.id,challenge.held,'Challenge '+(i+1)):informationBack('challenge','Challenge '+(i+1),challenge.held)}</div>`).join('')}</div></section>
        <section class="ck-reference-section"><h2>ข่าวลือ</h2><div class="ck-reference-grid">${v.rumors.map((publicId,i)=>{const id=publicId??me?.known[i];return `<div class="ck-reference-slot" data-ui-key="reference-rumor-${i}">${id?referenceCard('rumor',id,false,'ข่าวลือ '+(i+1)):informationBack('rumor','ข่าวลือ '+(i+1))}</div>`;}).join('')}</div></section>
    </section>`;
    const playerInformation=`<details class="ck-player-details"><summary>ร้านอาหารและเชฟของทุกคน</summary><div class="ck-scoreboard">${v.players.map(p => `<article>${avatar(p)}<strong>${esc(p.name)}</strong>${p.restaurateur ? card('restaurateur', p.restaurateur, true) : v.phase === 'restaurateurs' ? `<div class="ck-card-back">${art('back-restaurateur')}<b>กำลังเลือกเจ้าของร้าน</b></div>` : ''}${p.activeSous ? card('sous', p.activeSous, true) : ''}${p.nextSous ? `<small>เชฟเสริมรอบหน้า</small>${card('sous', p.nextSous, true)}` : ''}${p.publicStorage.length ? `<small>วัตถุดิบค่า 2 เปิดเผย</small><div class="ck-inventory">${p.publicStorage.map(id => token(id)).join('')}</div>` : ''}</article>`).join('')}</div></details>`;
    const rulesContent=`${illustratedGameGuide('critter-kitchen')}<h3>ลำดับเล่นและรายละเอียดเพิ่มเติม</h3><ol><li>วางแผนลับ ส่งเชฟแต่ละตัวไปคนละสถานที่ แล้วทุกคนกดยืนยัน</li><li>เปิดแผนพร้อมกัน ออกตลาดจากรถซุป ผ่านตลาดหมายเลข ไปพ่อค้าเที่ยงคืนและโรงเรียนเชฟ</li><li>เชฟความจุ 1 หยิบก่อน 2 และ 3 ถ้าเท่ากันให้เวียนหยิบตามลำดับหมวก ผู้หยิบก่อนที่เสมอจะย้ายหมวกไปท้าย</li><li>อาหารและเครื่องเทศเป็นของส่วนตัว ข่าวลืออ่านได้เมื่อเก็บโทเคนตรงหมายเลขหรือโทเคนเลือก</li><li>จบรอบ 3 และ 6 จัดอาหาร 3 จานตาม Challenge ใช้ซุปแทนชนิดที่ขาดได้ แต่ต้องมีวัตถุดิบจริงอย่างน้อยหนึ่งชิ้น เครื่องเทศคูณคุณภาพตามผู้วิจารณ์</li><li>คุณภาพ 6–11 ได้ 1 ดาว, 12–20 ได้ 2 ดาว, 21 ขึ้นไปได้ 4 ดาว ไม่นับโบนัส จากนั้นเก็บของได้ 5 ชิ้นในวันแรก และ 10 ชิ้นในวันที่สอง</li><li>รอบ 7 เสิร์ฟ 7 คอร์สตามชนิดวัตถุดิบ ปกติคอร์สละ 1 ชิ้น ไม่ใช้ซุป ตรวจความสามารถผู้วิจารณ์และข่าวลือก่อนเสิร์ฟ</li><li>รวมดาว Challenge, Best of Course, ข่าวลือ, โบนัส และดาวคุณภาพมื้อสุดท้าย ดาวเสมอดูคุณภาพ แล้วลำดับหมวก</li></ol><p>ข่าวลือและของในครัวซ่อนจากคนอื่น การเปลี่ยนรูปแบบหน้าจอไม่เปลี่ยนสิทธิ์ของคุณ ผู้เล่นหลุดให้กลับด้วยบัญชีหรือเซสชันเดิม เกมรอการเลือกของเจ้าของเชฟ ไม่ให้จอกลางเล่นแทน</p><a href="https://cardboardalchemy.com/downloads/CritterKitchen_Rulebook.pdf" target="_blank" rel="noreferrer">คู่มือภาคหลักจากผู้จัดพิมพ์</a>`;
    const menuInformation=`<div class="ck-priority" aria-label="ลำดับหมวก">${v.priority.map((id, i) => { const p = v.players.find(p => p.id === id)!; return `<span class="${id === v.turn ? 'active' : ''}">${avatar(p)}<b>${hat(v.players.findIndex(x=>x.id===p.id),i)}${i + 1}. ${esc(p.name)}</b><small>${p.stars} ดาว ${p.committed ? '· ยืนยันแล้ว' : ''}</small></span>`; }).join('')}</div><details class="ck-log"><summary>เหตุการณ์ล่าสุด / กติกาที่ใช้</summary><ol>${v.log.slice(-15).map(l => `<li>${esc(l)}</li>`).join('')}</ol><p>ภาคหลัก 2–5 คน · ข้อวินิจฉัยเว็บ: คอร์สว่างไม่ได้ Best of Course และต้องเสิร์ฟอย่างน้อย 1 คอร์สจึงรับ Nocturnal/Odd Tastes</p></details><section class="ck-turn-guide" aria-label="ขั้นตอนการเล่น"><div class="ck-rounds" aria-label="รอบที่ ${v.round} จาก 7">${Array.from({length:7},(_,i)=>`<span class="${i+1===v.round?'current':i+1<v.round?'done':''}" ${i+1===v.round?'aria-current="step"':''}>${i+1}<small>${i===2||i===5?'ปรุง':i===6?'มื้อสุดท้าย':''}</small></span>`).join('')}</div><h2>${esc(status)}</h2><p>${guidance[v.phase]??''}</p><ol class="ck-phase-steps" ${v.phase==='restaurateurs'||v.phase==='finished'?'hidden':''}>${phaseSteps.map((step,i)=>`<li class="${(v.phase==='planning'?0:v.phase==='shopping'||v.phase==='running'?1:v.phase==='refrigeration'?3:2)===i?'current':''}">${i+1}. ${step}</li>`).join('')}</ol></section>`;
    patchHTML(root, `<div class="ck-root ${displayMode==='shared-table'?'ck-shared':''} ${showBoard ? 'show-board' : ''} ${me ? 'has-player' : 'display-only ck-display-screen'}" data-mode="${displayMode}" data-workspace="${tab==='information'?'information':waitingForOpponent?'kitchen':tab}" data-waiting="${waitingForOpponent}" data-passive-wait="${submitted||v.phase==='refrigeration'&&!!mine?.fridgeReady}" data-phase="${v.phase}">${ckSky}<header class="ck-title"><h1 class="sr-only">Critter Kitchen</h1>${!me?`<span class="ck-round-badge" aria-label="รอบที่ ${v.round} จาก 7">รอบที่ ${v.round}/7</span>`:''}<strong>${esc(me?status:displayPhase[v.phase])}</strong></header><button id="ck-help-button" aria-label="วิธีเล่นและการนับคะแนน" title="วิธีเล่นและการนับคะแนน">${ckIcon('help')}</button><details class="ck-menu"><summary aria-label="เมนูเกม">${ckIcon('menu')}</summary><div class="ck-menu-panel"><header><b>เมนูครัว</b><button id="ck-menu-close" aria-label="ปิดเมนู">×</button></header><label>รูปแบบหน้าจอ<select id="ck-mode"><option value="shared-table" ${displayMode === 'shared-table' ? 'selected' : ''}>โต๊ะกลาง</option><option value="full-mobile" ${displayMode === 'full-mobile' ? 'selected' : ''}>เล่นบนมือถือ</option></select></label>${me?'':`<details class="ck-menu-cards"><summary>ผู้วิจารณ์ เป้าหมาย และข่าวลือ</summary>${publicInformation}</details>`}${playerInformation}${menuInformation}<a href="/">เลือกเกมอื่น</a></div></details>${me && v.phase!=='running'&&v.phase!=='finished' ? `<div class="ck-workspace-heading"><h2 class="ck-stage-heading"><span class="ck-stage-round" aria-label="รอบที่ ${v.round} จาก 7">รอบที่ ${v.round}/7</span><span class="ck-stage-name">${tab==='information'?'ผู้วิจารณ์และเป้าหมาย':processTitle[v.phase]??'ออกตลาด'}</span></h2><nav class="ck-tabs" aria-label="มุมมองเกม">${btn(ckIcon('home'),`data-tab="kitchen" aria-label="ครัวของคุณ" title="ครัวของคุณ" aria-pressed="${tab==='kitchen'}"`)}${btn(ckIcon('market'),`data-tab="board" aria-label="ตลาดกลาง" title="ตลาดกลาง" ${v.phase==='shopping'?'disabled':''} aria-pressed="${tab==='board'}"`)}${btn(ckIcon('cards'),`data-tab="information" aria-label="ผู้วิจารณ์ เป้าหมาย และข่าวลือ" title="ผู้วิจารณ์ เป้าหมาย และข่าวลือ" aria-pressed="${tab==='information'}"`)}${v.phase==='shopping'&&isTarget&&legal('ck-leave')?btn(ckIcon('logout'),'class="ck-return-home" data-action="ck-leave" aria-label="กลับบ้าน" title="กลับบ้าน"',blocked):''}</nav></div>` : ''}${!me?displayDashboard(v,{art,token,label,icon:ckIcon},action,host,blocked):`${referenceInformation}<div class="ck-layout"><section class="ck-board" style="--board:url('/art/critter-kitchen/board-${v.config.id}.webp')" ${!showBoard ? 'hidden' : ''}>${publicInformation}<div class="ck-market">${v.config.locations.map(l => locationMarkup(l)).join('')}</div></section><div class="ck-private" ${!action && !me ? 'hidden' : ''}>${action ? `<section class="ck-action" id="ck-action">${action}</section>` : ''}${me&&v.phase!=='finished' ? `<section class="ck-kitchen" aria-label="ครัวของคุณ" data-pane="${v.phase==='planning'?'stock':pantryView}"><header class="ck-pantry-heading"><h2>ครัวของคุณ <span class="ck-pantry-total">(${me.storage.length+me.soup+me.bisque} อย่าง)</span></h2><nav aria-label="ดูของในครัว"><button type="button" data-pantry="stock" aria-label="วัตถุดิบ" title="วัตถุดิบ" aria-pressed="${pantryView==='stock'}">${ckIcon('supplies')}</button><button type="button" data-pantry="cards" aria-label="การ์ดของคุณ" title="การ์ดของคุณ" aria-pressed="${pantryView==='cards'}">${ckIcon('cards')}</button></nav></header><div class="ck-pantry-stock"><div class="ck-pantry-rail"><div class="ck-inventory">${(['soup','bisque'] as const).map(kind=>`<button type="button" class="ck-inspect-token ck-broth-card ${me[kind]?'':'ck-stock-empty'}" data-token-detail="${kind}" aria-label="ดูรายละเอียด${kind==='soup'?'ซุป':'บิสก์'} ${me[kind]} ชิ้น">${token(kind)}<span class="ck-pantry-quantity" ${me[kind]<2?'hidden':''}>×${me[kind]}</span></button>`).join('')}${groupIngredients([...me.storage].sort(pantryOrder)).map(group=>`<button type="button" class="ck-inspect-token" data-token-detail="${group.id}" data-ui-key="inventory-${group.key}" aria-label="ดู ${esc(label(group.id))}${TOKEN[group.id]?.kind==='ingredient'?' '+group.ids.length+' ชิ้น':''}">${token(group.id)}${TOKEN[group.id]?.kind==='ingredient'?`<span class="ck-pantry-quantity ck-ingredient-stock-quantity" ${group.ids.length<2?'hidden':''}>×${group.ids.length}</span>`:''}</button>`).join('')}</div></div></div><div class="ck-pantry-cards"><div class="ck-private-rumors">${me.known.map((id, i) => id ? card('rumor', id, true, true, `ข่าวลือ ใบที่ ${i+1}`) : `<span class="ck-unknown-card" aria-label="ยังไม่รู้ข่าวลือ ${i+1}">${art('back-rumor')}<strong>ข่าวลือ ใบที่ ${i+1}</strong></span>`).join('')}${me.extraRumor ? card('rumor', me.extraRumor, true, true, 'ข่าวลือพิเศษ') : ''}</div>${mine?.restaurateur ? card('restaurateur', mine.restaurateur, true) : ''}${mine?.activeSous ? card('sous', mine.activeSous, true) : ''}${mine?.nextSous ? `${card('sous', mine.nextSous, true)}` : ''}${cosmoNote}</div></section>` : ''}</div></div>`}${me&&mine?.restaurateur?`<button type="button" class="ck-my-head-chef" data-detail="restaurateur:${mine.restaurateur}" aria-label="การ์ดของฉัน · ${esc(RESTAURATEUR[mine.restaurateur].name)}">${art("restaurateur-"+mine.restaurateur)}<span>การ์ดของฉัน<small>หัวหน้าเชฟ</small></span></button>`:""}<div id="ck-dialog-slot" data-preserve-content></div></div>`);
    updateRoomRestart(root,v,host,blocked,command);
    if(existingFrame){
        const frame=root.querySelector<HTMLElement>('.ck-root')!;
        for(const [name,value] of planningStyles)if(value)frame.style.setProperty(name,value);
        const rail=frame.querySelector<HTMLElement>('.ck-kitchen .ck-inventory');if(rail&&planningScroll!==undefined)rail.scrollLeft=planningScroll;
    }
    for(const {node,left,values} of displayStocks)if(node.isConnected){for(const [name,value] of values)node.style.setProperty(name,value);node.scrollLeft=left;}
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches)for(const node of root.querySelectorAll<HTMLElement>('[data-priority-player]')){
        const before=displayPositions.get(node.dataset.priorityPlayer!),after=node.getBoundingClientRect();
        if(before&&Math.abs(before.top-after.top)>1)node.animate([{transform:`translateY(${before.top-after.top}px)`},{transform:'translateY(0)'}],{duration:550,easing:'cubic-bezier(.2,.8,.2,1)'});
    }
    // Retain fitted widths before layout can clamp a scrolled rail during a draft update.
    for(const {node,values} of cookingSizes)if(node.isConnected)for(const [name,value] of values)node.style.setProperty(name,value);
    restoreCookingScroll();
    resourceRails?.disconnect();
    resourceRails=new ResizeObserver(entries=>{for(const entry of entries){
        const rail=entry.target as HTMLElement,style=getComputedStyle(rail);
        if(rail.classList.contains('ck-d-stock')){fitDisplayStocks([rail]);const left=displayScroll.get(rail);if(left!==undefined){rail.scrollLeft=left;displayScroll.delete(rail);}continue;}
        if(rail.matches('.ck-final-cooking .ck-cook-source')){
            // Four physical ingredients per row; reserve controls before fitting the faces.
            const rows=Math.max(1,Math.ceil(rail.children.length/4));
            const cards=[...rail.children] as HTMLElement[];
            let controls=0;
            for(let i=0;i<cards.length;i+=4)controls+=Math.max(0,...cards.slice(i,i+4).map(card=>card.querySelector('.ck-final-as')?62:card.classList.contains('ck-final-selected')?28:0));
            const available=rail.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);
            const face=Math.min(114,Math.max(24,Math.floor((available-(rows-1)*10-controls)/rows)));
            rail.style.setProperty('--ck-final-face-height',`${face}px`);
            continue;
        }
        if(rail.classList.contains('ck-route-stock')){
            const count=rail.children.length,outer=(rail.parentElement?.clientWidth??0)-parseFloat(style.left),available=outer-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight),gap=7;
            if(!count||available<=0)continue;
            const preferred=Math.max(32,Math.min(44,rail.clientHeight-12));
            const rows=1,columns=count;
            const overflow=columns*(preferred+gap)-gap>available;
            const visible=Math.max(1,Math.ceil((available+gap)/(preferred+gap)-.4));
            const size=overflow?(available-gap*visible)/(visible+.4):preferred;
            rail.style.width=`${outer}px`;
            rail.style.setProperty('--ck-route-circle',`${size}px`);
            rail.style.gridTemplateColumns=`repeat(${columns},${size}px)`;
            rail.style.gridTemplateRows=`repeat(${rows},${size+4}px)`;
            rail.dataset.rows=String(rows);
            [...rail.children].forEach((item,index)=>{const cell=item as HTMLElement;cell.style.gridColumn=String(index%columns+1);cell.style.gridRow=String(Math.floor(index/columns)+1);});
            continue;
        }
        if(rail.classList.contains('ck-results-rail')){
            const players=Number(rail.dataset.playerCount);if(players<=2)continue;
            const first=rail.firstElementChild as HTMLElement|null,leading=first?first.getBoundingClientRect().left-rail.getBoundingClientRect().left+rail.scrollLeft:6;
            const available=rail.clientWidth-leading,gap=10;if(available<=0)continue;
            const count=Math.max(1,Math.min(players-1,Math.floor((available+gap)/210-.4)));
            rail.style.setProperty('--ck-result-width',`${(available-gap*count)/(count+.4)}px`);continue;
        }

        if(rail.classList.contains('ck-picks')){
            if(rail.dataset.many!=='true')continue;
            const parentWidth=rail.parentElement?.clientWidth??rail.clientWidth,height=rail.firstElementChild?.getBoundingClientRect().height??114,gap=10,columns=Math.ceil(rail.children.length/2),preferred=height*.66;
            const visible=Math.min(4,columns-1,Math.max(1,Math.floor(parentWidth/(preferred+gap)-.4)));
            const windowWidth=Math.min(parentWidth,(visible+.4)*preferred+visible*gap+10);
            rail.style.setProperty('--ck-pick-window',`${windowWidth}px`);rail.style.setProperty('--ck-resource-width',`${(windowWidth-10-gap*visible)/(visible+.4)}px`);continue;
        }
        if(rail.classList.contains('ck-market-stock')){
            const available=rail.clientWidth-16,gap=6;if(available<=0)continue;
            const height=rail.querySelector('.ck-token')?.getBoundingClientRect().height??114;
            const preferred=Math.min(72,height*.66);
            // Fit a partial next card without widening faces beyond their portrait proportions.
            const count=Math.max(1,Math.ceil((available+gap)/(preferred+gap)-.4));
            rail.style.setProperty('--ck-resource-width',`${(available-gap*count)/(count+.4)}px`);continue;
        }
        if(rail.classList.contains('ck-pantry-cards')){
            const pantry=rail.closest<HTMLElement>('.ck-kitchen')!,pantryStyle=getComputedStyle(pantry);
            const available=pantry.clientWidth-parseFloat(pantryStyle.paddingLeft)-parseFloat(pantryStyle.paddingRight),leading=parseFloat(style.paddingLeft),trailing=parseFloat(style.paddingRight),gap=10;
            if(available<=0)continue;
            const preferred=Math.min(160,(root.clientWidth-42)/3),track=available-leading-trailing;
            const count=Math.max(1,Math.ceil((track+gap)/(preferred+gap)-.4));
            const cards=rail.querySelectorAll('.ck-card,.ck-unknown-card').length;
            const overflow=cards*preferred+Math.max(0,cards-1)*gap>track;
            const width=overflow?(available-leading-gap*count)/(count+.4):preferred;
            rail.style.setProperty('--ck-private-card-width',`${width}px`);continue;
        }
        if(v.phase==='planning'&&tab==='kitchen'&&rail.matches('.ck-kitchen .ck-inventory')){
            const frame=root.querySelector<HTMLElement>('.ck-root')!,count=v.config.locations.length;
            // Solve the footer/row split once; matching the measured portrait cannot resize it again.
            const footer=Math.max(85.2,(.8*(frame.clientHeight-42-26)+.4*count)/(count+.8));
            frame.style.setProperty('--ck-plan-footer-height',`${footer}px`);
            const portrait=frame.querySelector<HTMLElement>('.ck-placed-chef')??frame.querySelector<HTMLElement>('.ck-route-slot');
            if(portrait){const size=portrait.getBoundingClientRect();frame.style.setProperty('--ck-plan-pantry-face',`${Math.min(size.height*.8,footer-10)}px`);frame.style.setProperty('--ck-plan-pantry-width',`${size.width*.8}px`);}
            frame.style.setProperty('--ck-plan-seam',`${rail.closest('.ck-kitchen')!.getBoundingClientRect().top}px`);
            if(planningScroll!==undefined){rail.scrollLeft=planningScroll;planningScroll=undefined;}
        }
        const first=rail.querySelector<HTMLElement>('button,.ck-unknown-card'),leading=first?Math.max(0,first.getBoundingClientRect().left-rail.getBoundingClientRect().left+rail.scrollLeft):parseFloat(style.paddingLeft);
        const available=rail.clientWidth-(rail.classList.contains('ck-picks')?parseFloat(style.paddingLeft):leading),cards=rail.classList.contains('ck-pantry-cards'),gap=cards?10:6;
        if(available<=0)continue;
        if(cards){rail.style.setProperty('--ck-private-card-width',`${Math.min(160,(root.clientWidth-42)/3)}px`);continue;}
        const target=64;
        const count=Math.max(1,Math.floor((available+gap)/(target+gap)-.4));
        const width=(available-gap*count)/(count+.4);
        rail.style.setProperty(cards?'--ck-private-card-width':'--ck-resource-width',`${width}px`);
        if(rail.classList.contains('ck-cook-source'))rail.closest<HTMLElement>('.ck-cooking')?.style.setProperty('--ck-cook-card-width',`${width}px`);
    }
    if(entries.some(entry=>(entry.target as HTMLElement).classList.contains('ck-cook-source'))){restoreCookingScroll();cookingScroll=[];}
    });
    root.querySelectorAll<HTMLElement>('.ck-d-stock,.ck-route-stock,.ck-picks,.ck-market-stock,.ck-cook-source,.ck-pantry-rail>.ck-inventory,.ck-pantry-cards,.ck-results-rail').forEach(rail=>resourceRails!.observe(rail));
    const bind = (selector: string, fn: (el: HTMLElement, event:MouseEvent) => void) => root.querySelectorAll<HTMLElement>(selector).forEach(el => el.onclick = event => { if(el instanceof HTMLButtonElement && el.disabled)return;fn(el,event); });
    bind('#ck-help-button',()=>{detail='help';locationDetail='';showDialog();});
    bind('[data-pantry]',el=>{pantryView=el.dataset.pantry!;rerender();});
    bind('[data-course]',el=>{course=el.dataset.course as Food;rerender();});
    bind('[data-tab]', el => {
        const next=el.dataset.tab!;if(next===tab)return;
        workspaceScroll.set(tab,rememberCKScroll(root));
        // Retain fitted rail sizes synchronously, before the next observer/paint.
        const properties=['--ck-resource-width','--ck-pick-window','--ck-private-card-width','--ck-cook-card-width','--ck-final-face-height','--ck-result-width','--ck-pantry-card-window','--ck-plan-seam','--ck-plan-footer-height','--ck-plan-pantry-face','--ck-plan-pantry-width'];
        const fitted=[...root.querySelectorAll<HTMLElement>('[style]')].map(node=>({node,values:properties.map(name=>[name,node.style.getPropertyValue(name)] as const).filter(([,value])=>value)}));
        tab=next;rerender();
        for(const {node,values} of fitted)if(node.isConnected)for(const [name,value] of values)node.style.setProperty(name,value);
        const restore=workspaceScroll.get(next);if(restore)restore();else window.scrollTo({top:0,left:0,behavior:'instant'});
    });
    menuEvents?.abort();menuEvents=new AbortController();
    const menu=root.querySelector<HTMLDetailsElement>('.ck-menu')!;
    const closeMenu=()=>{menu.open=false;};
    bind('#ck-menu-close',closeMenu);
    document.addEventListener('pointerdown',e=>{if(menu.open&&!menu.contains(e.target as Node))closeMenu();},{signal:menuEvents.signal});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.open){e.preventDefault();closeMenu();menu.querySelector<HTMLElement>('summary')?.focus({preventScroll:true});}},{signal:menuEvents.signal});
    const selectMode = root.querySelector<HTMLSelectElement>('#ck-mode')!;
    selectMode.value = displayMode;
    selectMode.onchange = () => { mode = selectMode.value; saveDisplayMode(v.code, mode); rerender(); };
    for (const el of root.querySelectorAll<HTMLButtonElement>('[data-chef],[data-keep]'))
        el.setAttribute('aria-pressed', String(el.dataset.keep?keep.includes(el.dataset.keep):el.classList.contains('selected')));
    const inspectChef=(id:string)=>{dismissChoice();chef=id;detail='chef:'+id;locationDetail='';showDialog();};
    bind('[data-chef]',el=>inspectChef(el.dataset.chef!));
    bind('[data-inspect-chef]',el=>inspectChef(el.dataset.inspectChef!));
    const placeChef=(id:string,location:string)=>{
        if(!me||me.plan||blocked||v.phase!=='planning'||!me.chefIds.includes(id)||!v.config.locations.some(l=>l.id===location))return;
        const occupant=me.chefIds.find(other=>other!==id&&plan[other]===location);
        // Moving to an occupied destination swaps the two cards; no duplicate locations.
        if(occupant){if(plan[id])plan[occupant]=plan[id];else delete plan[occupant];}
        plan[id]=location as LocationId;
        chef=me.chefIds.find(other=>!plan[other])??id;rerender();
    };
    bind('[data-destination]',(el,event)=>{const placed=(event.target as Element).closest<HTMLElement>('[data-placed-chef]');if(placed)inspectChef(placed.dataset.placedChef!);});
    if(v.phase==='planning'&&me&&!me.plan&&!blocked)
        disposeChefDrag=bindChefDrag(root,placeChef);
    bind('#ck-commit', () => confirmAction(me?.plan?'เรียกแผนกลับมาแก้ไข?':'ส่งแผนเชฟชุดนี้?',planPreview(),me?.plan?{type:'ck-uncommit',epoch}:{type:'ck-plan',epoch,plan:structuredClone(plan)}));
    bind('[data-rest]', el => confirmAction('เลือกเจ้าของร้านคนนี้?',card('restaurateur',el.dataset.rest!,false,false),{type:'ck-restaurateur',card:el.dataset.rest!}));
    bind('[data-action]', el => {
        const type=el.dataset.action!;
        if(type==='ck-reveal-results'){if(!blocked)command({type:'ck-reveal-results'});return;}
        if(type==='ck-run'){if(blocked)return;(el as HTMLButtonElement).disabled=true;command({type:'ck-run'});return;}
        confirmAction(type==='ck-leave'?'ให้เชฟกลับก่อนหยิบของ?':type==='ck-next'?'ไปขั้นตอนถัดไป?':'เริ่มออกตลาด?',`<p>${type==='ck-leave'?'เชฟจะหยุดหยิบของจากสถานที่นี้ หากยังไม่ได้ของจะเข้าสู่การเลือกรางวัลปลอบใจ':type==='ck-next'?'ดูผลอาหารเรียบร้อยแล้ว ไปเลือกของที่จะเก็บสำหรับรอบต่อไป':'เชฟจะออกตลาดตามแผนที่เปิดแล้ว โดยหยิบของตามความจุและลำดับหมวก'}</p>`,{type} as CKAction);
    });
    bind('[data-pick]',el=>{dismissChoice();detail=el.dataset.pick!.startsWith('zous:')?'chef:'+el.dataset.pick!.slice(5):'token:'+el.dataset.pick!;locationDetail='';showDialog();});
    bind('[data-buy]',el=>{const id=el.dataset.buy!;if(blocked||!isTarget||!me?.choices.includes(id))return;confirmAction('ยืนยันหยิบ '+label(id)+'?',`${id.startsWith('zous:')?`<div class="ck-buy-chef-preview">${token(id,true)}</div><p>${esc(ZOU[id.slice(5)]?.text??'')}</p>`:`<div class="ck-token-preview">${token(id,true)}</div>`}<p>${id.startsWith('zous:')?'เชฟเสริมที่รับตอนนี้จะมาช่วยในรอบถัดไป 1 รอบ เมื่อจบรอบนั้นจะออกจากทีม':'รับของชิ้นนี้แล้วดำเนินคิวเชฟต่อ'}</p>`,{type:'ck-pick',item:id});});
    bind('[data-rumor],[data-rumor-buy]',el=>{const index=Number(el.dataset.rumor??el.dataset.rumorBuy);if(blocked||!isTarget||!me?.rumorChoices.includes(index))return;confirmAction('ยืนยันเลือกข่าวลือ '+(index+1)+'?',`<div class="ck-rumor-confirm">${art('back-rumor')}<span class="ck-rumor-caption"><strong>ข่าวลือ ${index+1}</strong></span></div><p>เปิดอ่านได้เฉพาะคุณ จนถึงเวลาที่กติกาให้เปิดเผย</p>`,{type:'ck-rumor',index});});
    bind('[data-rudy-recipient]',el=>{if(!blocked&&isTarget)command({type:'ck-rudy-gift',token:me!.giftToken!,recipient:el.dataset.rudyRecipient||null});});
    bind('[data-reward]', el => {const reward=el.dataset.reward as 'soup'|'bag'|'skip';confirmAction(reward==='soup'?'รับซุปกลับครัว?':reward==='bag'?'รับของสุ่มกลับครัว?':'กลับครัวโดยไม่รับของ?',`${reward==='soup'?`<div class="ck-token-preview ck-reward-preview">${token('soup',true)}</div>`:reward==='bag'?`<div class="ck-reward-preview ck-reward-bag-art">${art('mystery-midnight-parcel','',true)}</div>`:''}<p>${reward==='soup'?'เพิ่มซุป 1 ถ้วยในครัว เก็บไว้ใช้ตอนเสิร์ฟอาหาร':reward==='bag'?'รับของสุ่ม 1 ชิ้นจากถุงตามความสามารถเจ้าของร้าน':'เชฟกลับครัวโดยไม่รับรางวัล'}</p>`,{type:'ck-consolation',reward});});
    bind('[data-plate]', el => { plate = Number(el.dataset.plate); rerender(); });
    bind('[data-add]', el => { const id = el.dataset.add!;if(meals.some(m=>m.items.some(a=>a.token===id)))return; meals[plate].items.push({ token: id, as: TOKEN[id].food as Food });if(v.phase==='critic')course=TOKEN[id].food as Food;rerender(); });
    bind('[data-remove-broth]',el=>{const kind=el.dataset.removeBroth as 'soup'|'bisque';if(meals[plate][kind]>0)meals[plate][kind]--;rerender();});
    bind('[data-remove],[data-final-remove]', el => {const m=meals[plate];m.items.splice(Number(el.dataset.remove??el.dataset.finalRemove),1);if(m.wine)m.wine=m.wine.filter(w=>m.items.some(a=>a.as===w.course));rerender();});
    for (const el of root.querySelectorAll<HTMLSelectElement>('[data-as]'))
        el.onchange = () => { meals[plate].items[Number(el.dataset.as)].as = el.value as Food; rerender(); };
    for (const el of root.querySelectorAll<HTMLSelectElement>('[data-wine]'))
        el.onchange = () => { const m = meals[plate]; m.wine = (m.wine ?? []).filter(w => w.course !== el.dataset.wine); if (el.value)
            m.wine.push({ token: el.value, course: el.dataset.wine as Food }); rerender(); };
    for(const el of root.querySelectorAll<HTMLInputElement>('[data-toggle-spice]'))el.onchange=()=>{
        const item=meals[plate].items[Number(el.dataset.toggleSpice)];
        if(el.checked&&el.dataset.spiceId)item.spice=el.dataset.spiceId;else delete item.spice;
        rerender();
    };
    bind('[data-broth]',el=>{const kind=el.dataset.broth as 'soup'|'bisque';meals[plate][kind]+=Number(el.dataset.delta);rerender();});

    bind('#ck-serve',()=>{
        const final=v.phase==='critic',scores=final?[]:meals.map((m,i)=>scoreChallenge(context,player,m,i));
        const quality=meals.reduce((n,m)=>n+mealQuality(context,player,m,!final),0),stars=scores.reduce((n,score)=>n+score.stars,0);
        const starStack=(count:number)=>`<span class="ck-star-stack" role="img" aria-label="${count} ดาว"><span class="ck-star-piece">${ckIcon('star')}</span></span>`;
        const reviewCard=(id:string,count=1)=>`<span class="ck-review-resource">${token(id)}${count>1?`<span class="ck-review-quantity">×${count}</span>`:''}</span>`;
        if(final){
            const meal=meals[0],resources=groupIngredients([...meal.items.flatMap(item=>[item.token,...item.spice?[item.spice]:[]]),...(meal.wine??[]).map(w=>w.token)]).map(group=>reviewCard(group.id,group.ids.length));
            confirmAction('ยืนยันส่งอาหาร',`<div class="ck-meal-total"><b>คุณภาพรวม ${quality}</b><small>ดาวมื้อสุดท้ายจะคำนวณพร้อมทุกคนเมื่อจบเกม</small></div><div class="ck-final-review-grid" aria-label="วัตถุดิบมื้อสุดท้าย">${resources.join('')||'<p class="ck-final-empty">ไม่มีวัตถุดิบที่เลือกเสิร์ฟ</p>'}</div>`,{type:'ck-final',epoch,meal:structuredClone(meal)});return;
        }
        confirmAction('ยืนยันส่งอาหาร',`<div class="ck-meal-total" ${!final?`data-preview-stars="${stars}"`:''}>${final?'<small>คุณภาพมื้อสุดท้าย</small>':''}${!final?`<strong>${starStack(stars)}<small>${stars} ดาว</small></strong>`:''}<b>คุณภาพรวม ${quality}</b>${final?'<small>ดาวมื้อสุดท้ายจะคำนวณพร้อมทุกคนเมื่อจบเกม</small>':''}</div><div class="ck-meal-review" style="--ck-review-plates:${meals.length}">${meals.map((m,i)=>{
            const resources=[...groupIngredients([...m.items.flatMap(item=>[item.token,...item.spice?[item.spice]:[]]),...(m.wine??[]).map(w=>w.token)]).map(group=>reviewCard(group.id,group.ids.length)),...(m.soup?[reviewCard('soup',m.soup)]:[]),...(m.bisque?[reviewCard('bisque',m.bisque)]:[])];
            return `<section><header><span class="ck-review-plate-score"><span class="ck-review-plate-label">${final?'มื้อสุดท้าย':'จานที่ '+(i+1)} · คุณภาพ ${mealQuality(context,player,m,!final)}</span>${!final?`<b>${starStack(scores[i].stars)}<small>${scores[i].stars} ดาว</small></b>`:''}</span></header>${resources.length?`<div class="ck-meal-rail" aria-label="วัตถุดิบ${final?'มื้อสุดท้าย':'จาน '+(i+1)}">${resources.join('')}</div>`:'<div class="ck-review-empty" role="img" aria-label="ไม่เสิร์ฟจานนี้"><img class="ck-empty-plate" src="/art/critter-kitchen/thumbs/serving-plate.webp" alt="" width="64" height="64"><span class="ck-empty-caption">ไม่เสิร์ฟจานนี้</span></div>'}</section>`;
        }).join('')}</div>`,final?{type:'ck-final',epoch,meal:structuredClone(meals[0])}:{type:'ck-meals',epoch,meals:structuredClone(meals)});
    });
    bind('[data-keep]', el => { const id = el.dataset.keep!,free=(id:string)=>v.critic==='raccoon'&&TOKEN[id].kind==='ingredient'&&TOKEN[id].value===2;if(!keep.includes(id)&&!free(id)&&keep.filter(x=>!free(x)).length>=(v.round===3?5:10))return; keep = keep.includes(id) ? keep.filter(x => x !== id) : [...keep, id]; rerender(); });
    bind('#ck-fridge', () => confirmAction('เก็บของเหล่านี้เข้าตู้เย็น?',`<div class="ck-fridge-review">${keep.map(id=>token(id)).join('')||'<p>ไม่เก็บวัตถุดิบหรือเครื่องเทศ</p>'}</div><p>เก็บ ${keep.length} ชิ้น · คืนของที่ไม่ได้เลือก ${me!.storage.length-keep.length} ชิ้น ซุปและบิสก์ยังคงอยู่</p>`,{type:'ck-fridge',epoch,keep:[...keep]}));
    bind('#ck-restart', () => { if (!blocked)
        confirmAction('เริ่มการประลองครัวใหม่?', `<p>เริ่มเกมใหม่ในห้องเดิม${v.players.some(p=>p.restaurateur)?" โดยแจกหัวหน้าเชฟให้ทุกคนเลือกใหม่ก่อนเริ่มรอบแรก":""}</p>`, { type: 'restart' }); });
    bind('[data-detail]', el => { dismissChoice(); detail = el.dataset.detail!; locationDetail = ''; showDialog(); });
    bind('[data-location]', el => { dismissChoice(); locationDetail = el.dataset.location!; detail = ''; showDialog(); });
    bind('[data-token-detail]', el => { dismissChoice(); detail='token:'+el.dataset.tokenDetail!;locationDetail='';showDialog(); });
    bind('#ck-show-result', () => { resultClosed = false; showDialog(); });
    function showDialog() {
        const menu=root.querySelector<HTMLDetailsElement>('.ck-menu');if(menu)menu.open=false;
        const slot = root.querySelector('#ck-dialog-slot')!;
        let body = '';
        const final = v.phase === 'finished' && v.resultsRevealed!==false && !resultClosed && !detail && !locationDetail;
        const ceremony=final&&!!v.finalReveal&&!v.finalReveal.complete;
        if(detail==='help')body=`<h2>วิธีเล่นและการนับคะแนน</h2>${rulesContent}`;
        else if (detail) {
            const [kind, ...parts] = detail.split(':');const id=parts.join(':');
            const t=TOKEN[id];
            body = kind==='chef'?`<article class="ck-reference-detail ck-chef-detail">${art((ZOU[id]?'sous-':'chef-')+id,'',true)}<h2>${esc(chefName(id))}</h2><div class="ck-reference-detail-caption ck-chef-description"><span>${chefCarry(id)}</span><p>${ZOU[id]?esc(ZOU[id].text):'ที่แต่ละสถานที่ เชฟที่ถือของได้น้อยกว่าจะหยิบก่อน หากถือได้เท่ากัน ผู้ที่มีหมวกอยู่ข้างหน้าจะได้หยิบก่อน แล้วเวียนหยิบกันครั้งละ 1 ชิ้น จนเชฟถือของครบหรือไม่มีของให้เลือก'}</p>${id==='cosmo'&&me?.cosmoSous?`<p class="ck-cosmo-private-detail"><b>เชฟลับของคุณ: ${esc(chefName(me.cosmoSous))}</b><br>${chefCarry(me.cosmoSous)}<br>${esc(ZOU[me.cosmoSous].text)}</p>`:''}</div></article>`:kind==='token'?`<div class="ck-token-preview">${token(id,true)}</div><h2>${esc(label(id))}</h2><p>${t?.kind==='ingredient'?'ตัวเลขคือคุณภาพวัตถุดิบ ใช้ปรุง Challenge หรือเสิร์ฟเป็นคอร์สชนิดนี้ในมื้อสุดท้าย ตรวจเงื่อนไขผู้วิจารณ์ก่อนปรุง':t?.kind==='spice'?'ปกติใช้กับวัตถุดิบชนิดที่ตรงกันเพื่อคูณคุณภาพ 2 เท่า เครื่องเทศรวมใช้แทนชนิดใดก็ได้ ตรวจความสามารถพิเศษประกอบ':t?.kind==='rumor'?'หยิบโทเคนนี้เพื่อเปิดอ่านข่าวลือตามหมายเลขเป็นการส่วนตัว หากเป็นโทเคนเลือกข่าวลือ คุณเลือกอ่านได้ 1 ใบที่ยังไม่รู้ เมื่อจบเกม ข่าวลือจะเปิดให้ทุกคนเห็น และใช้คิดคะแนนให้ผู้เล่นทุกคน แม้คนที่ไม่เคยอ่านมาก่อน':id==='soup'||id==='bisque'?'ใช้เพิ่มคุณภาพหรือแทนชนิดวัตถุดิบที่ขาดใน Challenge ได้ ซุปให้คุณภาพ 1 บิสก์ให้ 3 ซุปและบิสก์ไม่กินที่ตู้เย็น':id.startsWith('zous:')?esc(ZOU[id.slice(5)]?.text??''):'ชิ้นส่วนพิเศษสำหรับครัวของคุณ'}</p>`:card(kind, id, false, false) + `<p>${kind === 'challenge' ? CHALLENGE[id]?.foods.map(f => FOOD_NAMES[f]).join(' + ') : ''}</p>`;
            if(kind==='challenge'&&CHALLENGE[id]){
                const challenge=CHALLENGE[id],held=v.challenges.some(c=>c.id===id&&c.held);
                body=`<article class="ck-reference-detail ck-challenge-detail ${held?'ck-challenge-held':''}">${art('challenge-'+id,'',true)}<h2>${esc(challenge.name)}</h2><div class="ck-reference-detail-caption">${held?'<p>ไม่ใช้วัตถุดิบชนิดขวาสุด</p>':''}<div class="ck-challenge-detail-foods">${challenge.foods.map((food,index)=>`<span><span class="ck-food-circle ${held&&index===challenge.foods.length-1?'ck-omitted-food':''}">${art('ingredient-'+food)}${held&&index===challenge.foods.length-1?ckIcon('close'):''}</span><strong>${FOOD_NAMES[food]}</strong></span>`).join('')}</div></div></article>`;
            }
            if(kind==='critic'||kind==='rumor'){
                const info=kind==='critic'?CRITIC[id]:RUMOR[id];
                if(info)body=`<article class="ck-reference-detail">${art(kind+'-'+id,'',true)}<h2>${esc(info.name)}</h2><div class="ck-reference-detail-caption"><p>${esc(info.text)}</p></div></article>`;
            }
        }
        else if (locationDetail) {
            const loc = v.config.locations.find(l => l.id === locationDetail);
            if (loc)
                body = locationMarkup(loc, true);
        }
        else if (final)
            body=ceremony?finalRevealMarkup(v,!!me||host,blocked):`<div class="ck-final-hero">${art('results','ck-result-art',true)}<h2><span>ผลการแข่งขัน</span></h2></div>${finalResults(v,me?.id)}<div class="ck-final-actions">${host||me?.canManage?btn('เริ่มเล่นใหม่','id="ck-result-restart"',blocked):''}</div>`;
        else
            return;
        const existing = slot.querySelector<HTMLDialogElement>('dialog');
        const dialogKey = detail || (locationDetail ? 'location:' + locationDetail + ':' + v.revision : '') || (final ? 'final:' + v.revision : '');
        if (existing?.dataset.key === dialogKey){
            if(ceremony)existing.querySelectorAll<HTMLButtonElement>('[data-final-step],[data-final-skip]').forEach(b=>b.disabled=blocked||!(me||host));
            return;
        }
        if (existing) {
            existing.close();
            existing.remove();
        }
        const restoreScene=rememberCKScroll(root);
        slot.innerHTML = `<dialog tabindex="-1" autofocus class="ck-dialog ${detail&&detail!=='help'?'ck-detail-fit':''} ${ceremony?'ck-ceremony-dialog':final?'ck-final-result-dialog':''} ${/^(challenge|critic|rumor|chef):/.test(detail)?'ck-reference-detail-dialog':''}" aria-label="${final ? 'ผลการแข่งขัน' : locationDetail ? 'รายละเอียดสถานที่' : 'รายละเอียดการ์ดและวัตถุดิบ'}" data-key="${esc(dialogKey)}"><button type="button" class="ck-close" aria-label="ปิด">${ckIcon('close')}</button><div class="ck-dialog-body">${body}</div></dialog>`;
        const dialog = slot.querySelector<HTMLDialogElement>('dialog')!;
        let stopFitting=()=>{};dialog.addEventListener('close',()=>stopFitting(),{once:true});
        const close = () => { if (final)
            resultClosed = true; detail = ''; locationDetail = ''; dialog.close(); dialog.remove();if(lastRevision===v.revision)restoreScene(); };
        dialog.querySelector<HTMLButtonElement>('.ck-close')!.onclick = close;
        dialog.oncancel = e => { e.preventDefault(); close(); };
        dialog.onclick = e => { if (e.target === dialog) {
            const r = dialog.getBoundingClientRect();
            if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
                close();
        } };
        dialog.querySelectorAll<HTMLButtonElement>('[data-pick]').forEach(el=>el.onclick=()=>{const id=el.dataset.pick!;close();detail=id.startsWith('zous:')?'chef:'+id.slice(5):'token:'+id;locationDetail='';showDialog();});
        dialog.querySelector<HTMLButtonElement>('#ck-skip-count')?.addEventListener('click',()=>{resultCount=false;dialog.dispatchEvent(new Event('ck-skip-count'));});
        dialog.querySelector<HTMLButtonElement>('#ck-result-restart')?.addEventListener('click', () => { close(); confirmAction('เริ่มการประลองครัวใหม่?', `<p>เริ่มเกมใหม่ในห้องเดิม${v.players.some(p=>p.restaurateur)?" โดยแจกหัวหน้าเชฟให้ทุกคนเลือกใหม่ก่อนเริ่มรอบแรก":""}</p>`, { type: 'restart' }); });
        dialog.showModal();if(final&&!ceremony)stopFitting=fitFinalResultRail(dialog);
        dialog.focus({preventScroll:true});restoreScene();
        if(ceremony)bindFinalReveal(dialog,v,command,!snapshot&&finalStepChanged);
        else if(final)countResults(dialog,!!v.finalReveal?.complete||!resultCount);
    }
    if (detail || locationDetail || v.phase === 'finished' && v.resultsRevealed!==false && !resultClosed)
        showDialog();
    else {
        const d = root.querySelector<HTMLDialogElement>('.ck-dialog:not(.ck-choice-dialog)');
        if (d) {
            d.close();
            d.remove();
        }
    }
    if (lastSequence >= 0 && v.sequence !== lastSequence && v.revision === lastRevision + 1 && !snapshot && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const selector = v.event.kind === 'reveal' ? '.ck-queues' : v.event.kind === 'pick' ? '.ck-inventory' : v.event.kind === 'round' ? '.ck-stock' : v.event.kind === 'finish' || v.event.kind === 'challenge' ? '.ck-scoreboard' : v.event.kind === 'location' ? '.ck-location.active' : null;
        if (selector)
            root.querySelectorAll(selector).forEach(el => el.animate([{ opacity: .7 }, { opacity: 1 }], { duration: 140 }));
    }
    for (const img of root.querySelectorAll<HTMLImageElement>('.ck-art'))
        img.onerror = () => { img.hidden = true; img.parentElement?.setAttribute('data-art-fallback', 'ภาพไม่พร้อม'); };
    if(v.phase==='challenge-results'&&v.resultsRevealed!==false){const panel=root.querySelector<HTMLElement>('.ck-round-results');if(panel)countResults(panel);}
    if(v.phase==='finished'&&v.resultsRevealed!==false){const panel=root.querySelector<HTMLElement>('.ck-action>.ck-final-results');if(panel)countResults(panel,!resultCount);}
    if(departing)showCKDeparture();
    if(newChallenge){dismissChoice();detail='';locationDetail='';root.querySelectorAll<HTMLDialogElement>('.ck-dialog').forEach(d=>{d.close();d.remove();});const count=v.challengeReveal!;showCKChallengeReveal(v.challenges[count-1].id!,count-1,me||host?()=>command({type:'ck-continue-planning',round:v.round,challenge:count}):undefined,blocked,snapshot,v.critic);}
    lastFinalStep=v.finalReveal?.step??-1;
    lastSequence = v.sequence;
    lastRevision = v.revision;
}
