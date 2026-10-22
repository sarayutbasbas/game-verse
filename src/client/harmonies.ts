import {harmoniesBoardHelp} from './harmonies-board-help.js';
import {cardLibraryIcon,openHarmoniesCardLibrary,closeHarmoniesCardLibrary} from './harmonies-card-library.js';
import './harmonies-dialog.css';
import {sanctuaryFace,sanctuaryModel,sanctuaryDescription,sanctuaryBoardModel} from './harmonies-sanctuaries.js';
import {SANCTUARY} from '../games/harmonies/sanctuaries.js';
import {harmoniesLeaderboardButton,bindHarmoniesLeaderboard} from './harmonies-leaderboard.js';
import {harmoniesArtStyle,setHarmoniesArtPreference} from './harmonies-view-preferences.js';
import {boardLayout} from './harmonies-board-layout.js';
import {BOARD_NAMES,boardNeighbors,isPrintedDry} from '../games/harmonies/boards.js';
import {fitHarmoniesBoards} from './harmonies-board-fit.js';
import {harmoniesMarketLayout} from './harmonies-market-layout.js';
import {applyHarmoniesEffects,harmoniesLowEffects,setHarmoniesLowEffects,harmoniesReducedMotion} from './harmonies-effects.js';
import {updateRoomRestart} from './room-restart.js';
import QRCode from 'qrcode';
import { placementReason, habitats } from '../games/harmonies/engine.js';
import { patchHTML } from './dom-patch.js';
import { avatar } from './account.js';
import { esc } from './platform.js';
import type { RoomAction } from '../shared/types.js';
import type { HarmoniesView, Cell, Habitat, Terrain, Side } from '../games/harmonies/types.js';
import { ANIMAL, COORDS, NAMES, terrain } from '../games/harmonies/data.js';
import './harmonies.css';
import { terrainScene } from './harmonies-scenes.js';
import { terrainPrint } from './harmonies-token-art.js';
import { lastRoundInfo } from './harmonies-last-round.js';
import { harmoniesGuide, harmoniesScoringGuide } from './harmonies-guide.js';
import { TERRAIN_PAINT as PALETTE, animalArt, setHarmoniesCardArt, animalFigure, terrainIcon, cylinder, cardFace, boardAnimalFigure } from './harmonies-presentation.js';
const closeIcon = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>';
const trophyIcon = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M8 3h8v6a4 4 0 0 1-8 0V3Zm0 2H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4m-4 2v5m-4 3h8m-6-3h4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const summaryIcon = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M4 20V4m0 16h16M8 16v-4m5 4V7m5 9v-6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const restartIcon = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M5 8a8 8 0 1 1-1 7M5 3v5h5" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const disk = (t: Terrain, extra = '') => `<span class="hm-disk ${extra}" style="--paint:${PALETTE[t]}" title="${NAMES[t]}">${terrainIcon(t)}</span>`;
function enlargedGroup(tokens:string[],source:HTMLElement){
    const discs=source.querySelectorAll<HTMLElement>('.hm-disk'),size=parseFloat(getComputedStyle(discs[0]).width),overlap=Math.abs(parseFloat(getComputedStyle(discs[1]).marginLeft));
    return `<div class="hm-choice-tokens" style="--hm-choice-overlap:${64*overlap/size}px">${tokens.map(t=>disk(terrain(t))).join('')}</div>`;
}
let sanctuaryDialog:HTMLDialogElement|undefined;
let code = '', selectedToken = '', selectedCell = -1, tab = '', selectedHabitat: Habitat | undefined, showMatches = '', sequence = -1;
let expanded = false, highlightAnimal = '', displayMode = '', camera: 'tilt' | 'top' = 'tilt';
let marketLayout: (string | null)[] = [];
const crown = '<svg class="hm-crown" viewBox="0 0 32 28" width="28" height="25" role="img" aria-label="ผู้ชนะ"><path d="m3 7 7 6 6-10 6 10 7-6-3 17H6z" fill="#e6b742" stroke="#795313" stroke-width="2"/></svg>';
let lastRoundDialog: HTMLDialogElement | undefined, lastRoundSeen='', lastRoundTurnSeen='';
let menuDialog: HTMLDialogElement | undefined;
let guideDialog: HTMLDialogElement | undefined, turnDialog: HTMLDialogElement | undefined, lastObservedTurn = '';
let publicHabitatKey = '', publicHabitatMatches: Habitat[] = [];
let boardFitCleanup:(()=>void)|undefined;
let repositionCleanup: (() => void) | undefined;
let choiceDialog: HTMLDialogElement | undefined, choiceRevision = -1;
let revealedResults = '', resultsCleanup: (() => void) | undefined;
let error = '', scoreDismissed = '', scoreDialog: HTMLDialogElement | undefined, detail: HTMLDialogElement | undefined;
export function closeHarmonies() { camera='tilt'; closeHarmoniesCardLibrary(); sanctuaryDialog?.remove();sanctuaryDialog=undefined; menuDialog?.remove();menuDialog=undefined;document.querySelector<HTMLDialogElement>('.hl-dialog')?.close(); boardFitCleanup?.();boardFitCleanup=undefined; lastRoundDialog?.remove();lastRoundDialog=undefined; guideDialog?.remove();guideDialog=undefined;turnDialog?.remove();turnDialog=undefined; choiceDialog?.remove(); choiceDialog = undefined; resultsCleanup?.(); resultsCleanup = undefined; repositionCleanup?.(); repositionCleanup = undefined; scoreDialog?.remove(); scoreDialog = undefined; detail?.remove(); detail = undefined; document.documentElement.classList.remove('harmonies-modal-open','hm-low-effects'); delete document.documentElement.dataset.hmCardArt; }
function modalLock() { document.documentElement.classList.toggle('harmonies-modal-open', !!document.querySelector('.hm-dialog[open]')); }
function confirmChoice(v: HarmoniesView, title: string, preview: string, accept: () => void) {
    choiceDialog?.close();
    const d = choiceDialog = document.createElement('dialog');
    choiceRevision = v.revision;
    d.className = 'hm-dialog hm-choice-dialog';
    d.setAttribute('aria-labelledby','hm-choice-title');
    d.tabIndex = -1;
    d.innerHTML = `<h2 id="hm-choice-title">${title}</h2><div class="hm-choice-preview">${preview}</div><div class="hm-choice-actions"><button id="hm-choice-cancel">ยกเลิก</button><button id="hm-choice-confirm">ยืนยัน</button></div>`;
    let settled = false, downOutside = false;
    const outside = (event: MouseEvent) => { const r=d.getBoundingClientRect();return event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom; };
    d.onpointerdown = e => { downOutside=e.target===d&&outside(e); };
    d.onclick = e => { if(downOutside&&e.target===d&&outside(e))d.close(); };
    d.querySelector<HTMLButtonElement>('#hm-choice-cancel')!.onclick = () => d.close();
    d.querySelector<HTMLButtonElement>('#hm-choice-confirm')!.onclick = () => { if(settled||choiceDialog!==d)return;settled=true;d.close();accept(); };
    d.onclose = () => { settled=true;d.remove();if(choiceDialog===d)choiceDialog=undefined;modalLock(); };
    document.body.append(d);d.showModal();d.focus({preventScroll:true});modalLock();
}
function infoDialog(title: string, body: string, cls: string) {
    const d=document.createElement('dialog');d.className=`hm-dialog hm-info-dialog ${cls}`;d.tabIndex=-1;
    d.setAttribute('aria-label',title);
    d.innerHTML=`<header class="hm-info-header"><h2>${title}</h2><button class="hm-info-close" aria-label="ปิด">${closeIcon}</button></header><div class="hm-info-content">${body}</div>`;
    d.querySelector<HTMLButtonElement>('.hm-info-close')!.onclick=()=>d.close();
    let outsideDown=false;
    const outside=(e:MouseEvent)=>{const r=d.getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom;};
    d.onpointerdown=e=>{outsideDown=e.target===d&&outside(e);};
    d.onclick=e=>{if(outsideDown&&e.target===d&&outside(e))d.close();};
    d.onclose=()=>{d.remove();if(guideDialog===d)guideDialog=undefined;if(turnDialog===d)turnDialog=undefined;modalLock();};
    document.body.append(d);d.showModal();d.focus({preventScroll:true});modalLock();return d;
}
function openScoringGuide(v:HarmoniesView) {guideDialog?.close();guideDialog=infoDialog('วิธีให้คะแนน',harmoniesScoringGuide(v.side,v.options),'hm-guide-dialog hm-scoring-dialog');}
function openGuide(v:HarmoniesView) {guideDialog?.close();guideDialog=infoDialog('วิธีเล่น',harmoniesGuide(v.side,v.options),'hm-guide-dialog');}
/** Fixed image frames share the same bottom baseline, regardless of stack height. */
function scoreTerrain(stack:Terrain[]) {
    return `<span class="hm-mini-scene hm-score-terrain" role="img" aria-label="${stack.map(t=>NAMES[t]).join(' / ')}"><span class="hm-mini-tile" hidden></span>${stack.map((t,i)=>`<img src="${terrainPrint(t)}" alt="" style="--score-layer:${i}" width="70" height="62">`).join('')}</span>`;
}
function terrainScores(p:HarmoniesView['players'][number],side:Side) {
    return [['ต้นไม้',['wood','leaf'],p.score.trees],['ภูเขา',['rock','rock'],p.score.mountains],['ทุ่งดอกไม้',['field'],p.score.fields],['อาคาร',['wood','building'],p.score.buildings],[side==='B'?'หมู่เกาะ':'แม่น้ำ',['water'],p.score.water]].map(([name,stack,points])=>`<div>${scoreTerrain(stack as Terrain[])}<dt>${name}</dt><dd>${points}</dd></div>`).join('');
}
function cardDetail(v: HarmoniesView, id: string) {
    detail?.remove();
    const d = detail = document.createElement('dialog');
    const placed = v.players.flatMap(p => p.cards).find(c => c.card === id)?.placed;
    const complete = placed !== undefined && placed >= ANIMAL[id].points.length;
    d.className = 'hm-dialog hm-detail';
    d.setAttribute('aria-labelledby', 'hm-detail-title');
    d.innerHTML = `<div class="hm-detail-header"><h2 id="hm-detail-title">${ANIMAL[id].name}</h2><button class="hm-close" aria-label="ปิด"><svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/></svg></button></div><div class="hm-detail-content"><div class="hm-large-card ${complete ? 'complete' : ''}"><div class="hm-detail-face">${cardFace(id, placed, true, undefined, false)}${complete ? '<span class="hm-complete-ribbon">ครบแล้ว</span>' : ''}</div></div><p>${ANIMAL[id].description??'หมุนได้ 6 ทิศ • ความสูงต้องตรง • อาคารใช้ฐานแดง/ลำต้น/หินได้'}</p>${id==='spirit-11'?'<p class="hm-promo-scoring-example"><strong>ตัวอย่างคะแนน:</strong> สัตว์ที่เชื่อมต่อถึงทีเร็กซ์ 6 ตัว × 2 = โบนัส 12 คะแนน เพิ่มจากคะแนนปกติ ไม่ใช่คูณคะแนนรวมทั้งกระดาน</p>':''}<dl class="hm-detail-requirements" style="--requirement-columns:${ANIMAL[id].pattern.length}">${ANIMAL[id].pattern.map((p, i) => `<div><dt>ช่องที่ ${i + 1}</dt><dd>${p.stack[0] === 'building' && (ANIMAL[id].kind!=='whisper'||p.stack.length===2) ? '<span>อาคาร 2 ชั้น</span><span>ฐาน: แดง / ลำต้น / หิน</span>' : p.stack.map(t => `<span>${NAMES[t]}${t==='building'?' 1 ชั้น':''}</span>`).join('')}${p.cube ? `<em>${ANIMAL[id].kind==='whisper'?'วางเสียงกระซิบ':ANIMAL[id].kind==='spirit'?'วางจิตวิญญาณ':'วางสัตว์'}</em>` : ''}</dd></div>`).join('')}</dl></div>`;
    document.body.append(d);
    d.querySelector('button')!.onclick = () => d.close();
    const outside = (event: MouseEvent) => { const r = d.getBoundingClientRect(); return event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom; };
    let downOutside = false;
    d.onpointerdown = event => { downOutside = event.target === d && outside(event); };
    d.onclick = event => {
        if (downOutside && event.target === d && outside(event))
            d.close();
    };
    d.onclose = () => {
        d.remove();
        if (detail === d)
            detail = undefined;
        modalLock();
    };
    d.showModal();
    modalLock();
}
function cellCardDetails(v:HarmoniesView,owner:HarmoniesView['players'][number],cell:Cell){
 const cards=[cell.cube?.card,cell.whisper?.card].filter((id):id is string=>!!id);
 if(cards.length===1){cardDetail(v,cards[0]);return;}
 detail?.remove();
 const d=detail=infoDialog('ดูข้อมูลการ์ดใบไหน?',`<div class="hm-cell-card-choices">${cards.map(id=>{const placed=owner.cards.find(c=>c.card===id)?.placed??0,complete=placed>=ANIMAL[id].points.length;return `<article class="hm-animal ${complete?'complete':''}"><button class="hm-inspect" data-cell-card="${id}" aria-label="ดู ${ANIMAL[id].name}">${cardFace(id,placed)}${complete?'<span class="hm-complete-ribbon">ครบแล้ว</span>':''}</button><span class="hm-cell-card-name">${esc(ANIMAL[id].name)}</span></article>`;}).join('')}</div>`,'hm-cell-card-picker');
 d.querySelectorAll<HTMLButtonElement>('[data-cell-card]').forEach(b=>b.onclick=()=>{d.close();cardDetail(v,b.dataset.cellCard!);});
 d.addEventListener('close',()=>{if(detail===d)detail=undefined;});
}
function gardenTypes(p:HarmoniesView['players'][number]) {return [...new Set(p.board.flatMap(cell=>[cell.cube?.card,cell.whisper?.card,...(cell.sanctuaryCubes??[]).map(c=>c.card)].filter((id):id is string=>!!id)))];}
/** One display figure per card type actually present in the final garden. */
function gardenMenagerie(p:HarmoniesView['players'][number]) {
    const animals=gardenTypes(p).map(id=>`<figure data-result-animal="${id}"><span class="hm-result-model">${animalFigure(id,0,false,true)}</span><figcaption title="${esc(ANIMAL[id].name)}">${esc(ANIMAL[id].name)}</figcaption></figure>`).join('');
    const sanctuaries=(p.sanctuaries??[]).filter(t=>t.complete).map(t=>`<figure data-result-sanctuary="${t.tile}"><span class="hm-result-model hm-result-sanctuary">${sanctuaryModel(t.tile)}</span><figcaption title="${esc(SANCTUARY[t.tile].name)}">${esc(SANCTUARY[t.tile].name)}</figcaption></figure>`).join('');
    return `<div class="hm-score-menagerie" aria-label="สัตว์ เสียงกระซิบ และวิหารในสวน">${animals+sanctuaries||'<p class="hm-score-no-animals">ยังไม่มีสัตว์ที่วางสำเร็จ</p>'}</div>`;
}
function scoreRows(v: HarmoniesView) {
    return [...v.players].sort((a,b)=>b.score.total-a.score.total||b.score.cubes-a.score.cubes).map(p => {
        const cards=[...p.score.animals,...p.score.spirits??[],...p.score.whispers??[]];
        const animals=cards.map(c=>`<div data-result-animal="${c.card}" data-card-points="${c.points}"><span class="hm-score-default-model hm-result-model">${animalFigure(c.card,0,false,true)}</span><dt title="${esc(ANIMAL[c.card].name)}">${esc(ANIMAL[c.card].name)}</dt><dd>${c.points}</dd></div>`).join('');
        const sanctuaries=(p.score.sanctuaries??[]).map(t=>`<div data-result-sanctuary="${t.tile}"><span class="hm-score-default-model hm-score-sanctuary-model">${sanctuaryModel(t.tile)}</span><dt title="${esc(SANCTUARY[t.tile].name)}">${esc(SANCTUARY[t.tile].name)}</dt><dd>${t.points}</dd></div>`).join('');
        return `<section data-ui-key="score-${p.id}" class="hm-score-player ${v.winners?.includes(p.id) ? 'winner' : ''}">${avatar(p)}<h3><span class="hm-result-player-name" title="${esc(p.name)}">${v.winners?.includes(p.id) ? crown : ''}${esc(p.name)}${p.id === v.me?.id ? ' (คุณ)' : ''}</span><small>สัตว์ ${p.score.cubes} ตัว</small></h3><b data-total="${p.score.total}">${p.score.total}<small>คะแนน</small></b><dl class="hm-category-scores hm-individual-scores" aria-label="คะแนนภูมิประเทศและการ์ดแต่ละใบ" tabindex="0">${terrainScores(p,v.side)}${animals}${sanctuaries}</dl></section>`;
    }).join('');
}
function comparisonTable(v:HarmoniesView) {
    return `<div class="hm-comparison-scroll"><table class="hm-comparison"><caption>คะแนนทุกสวน</caption><thead><tr><th scope="col">ผู้เล่น</th><th scope="col">รวม</th><th scope="col">ภูมิประเทศ</th><th scope="col">สัตว์</th><th scope="col">พิเศษ</th></tr></thead><tbody>${[...v.players].sort((a,b)=>b.score.total-a.score.total||b.score.cubes-a.score.cubes).map(p=>`<tr class="${v.winners?.includes(p.id)?'is-winner':''}"><th scope="row" title="${esc(p.name)}">${esc(p.name)}</th><td>${p.score.total}</td><td>${p.score.landscape}</td><td>${p.score.animalTotal}</td><td aria-label="สัตว์วิเศษ ${p.score.spiritTotal??0} เสียงกระซิบ ${p.score.whisperTotal??0} วิหาร ${p.score.sanctuaryTotal??0}">${(p.score.spiritTotal??0)+(p.score.whisperTotal??0)+(p.score.sanctuaryTotal??0)}</td></tr>`).join('')}</tbody></table></div>`;
}
function results(v: HarmoniesView, onRevealed: () => void) {
    const key = v.code + ':' + v.sequence;
    if (scoreDialog || scoreDismissed === key) return;
    const d = scoreDialog = document.createElement('dialog');
    d.className = 'hm-dialog hm-results hm-reveal-dialog';
    d.setAttribute('aria-label', 'ผลเกม Harmonies');
    d.innerHTML = `<header class="hm-reveal-header"><h2>ทุกสวนมีเรื่องราว</h2><button id="hm-reveal-skip">ข้ามไปดูผู้ชนะ</button><button id="hm-ok" aria-label="ปิดผลเกม">${closeIcon}</button></header><div class="hm-reveal-content"></div>`;
    document.body.append(d);
    const content = d.querySelector<HTMLElement>('.hm-reveal-content')!;
    let timer: ReturnType<typeof setTimeout> | undefined, playerIndex = 0;
    const cancel = () => { if (timer !== undefined) clearTimeout(timer); timer = undefined; };
    resultsCleanup = cancel;
    const reduce = harmoniesReducedMotion();
    const table = () => {
        cancel();
        revealedResults = key;
        d.querySelector<HTMLButtonElement>('#hm-reveal-skip')!.hidden = true;
        content.innerHTML = `<h3 class="hm-reveal-title">สวนที่น่าจดจำ</h3>${comparisonTable(v)}${v.players.length>1?`<nav class="hm-score-player-tabs" aria-label="เลือกสวนที่ดูคะแนน">${v.players.map(p=>`<button data-score-player="${p.id}" aria-pressed="false">${avatar(p)}<span>${esc(p.name)}</span></button>`).join('')}</nav>`:''}${scoreRows(v)}`;
        const selectPlayer=(id:string)=>{content.querySelectorAll<HTMLElement>('.hm-score-player').forEach(section=>section.hidden=section.dataset.uiKey!=='score-'+id);content.querySelectorAll<HTMLButtonElement>('[data-score-player]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.scorePlayer===id)));};
        selectPlayer(v.me?.id??v.players[0].id);
        content.querySelectorAll<HTMLButtonElement>('[data-score-player]').forEach(button=>button.onclick=()=>selectPlayer(button.dataset.scorePlayer!));
        d.scrollTop = 0;
        onRevealed();
    };
    const winner = (immediate = false) => {
        cancel();d.querySelector<HTMLButtonElement>('#hm-reveal-skip')!.hidden=true;
        let winnerIndex=0;
        const showWinner=()=>{
            const winners=v.players.filter(p=>v.winners?.includes(p.id)),p=winners[winnerIndex];
            content.innerHTML=`<section class="hm-winner-spotlight" data-winner="${p.id}"><div class="hm-winner-crown">${crown}</div><p>${winners.length>1?'ผู้ชนะร่วม · '+(winnerIndex+1)+' / '+winners.length:v.options?.solo?'ผลสวนของคุณ':'สวนที่เปล่งประกายที่สุด'}</p>${avatar(p)}<h3 class="hm-result-player-name" title="${esc(p.name)}">${esc(p.name)}</h3><div class="hm-winner-score"><b data-winner-total="${p.score.total}">${p.score.total}<small>คะแนน</small></b>${v.options?.solo&&typeof v.soloSuns==='number'?`<p class="hm-solo-suns"><span class="hm-sun-icons" aria-hidden="true">${'☀'.repeat(v.soloSuns??0)}</span><b>${v.soloSuns??0} ดวงอาทิตย์</b></p>`:''}</div><p>${v.options?.solo?'คะแนนจากภูมิประเทศ สัตว์ และโหมดที่เลือก':winners.length>1?'คะแนนและจำนวนสัตว์เท่ากัน จึงชนะร่วมกัน':v.players.some(other=>other.id!==p.id&&other.score.total===p.score.total)?'คะแนนเสมอ ตัดสินด้วยจำนวนสัตว์ที่วางได้มากกว่า':'คะแนนรวมสูงสุด'}</p>${gardenMenagerie(p)}<button id="hm-winner-next">${winnerIndex+1<winners.length?'ดูผู้ชนะร่วมคนถัดไป':'ดูตารางคะแนนทั้งหมด'}</button></section>`;
            content.querySelector<HTMLButtonElement>('#hm-winner-next')!.onclick=()=>{if(++winnerIndex<winners.length)showWinner();else table();};
            d.scrollTop=0;
            document.dispatchEvent(new CustomEvent('gameverse-audio',{detail:'finish'}));
        };
        if(immediate){showWinner();return;}
        content.innerHTML=`<div class="hm-winner-pause" role="status">${terrainScene(['wood','wood','leaf'])}<h3>ทุกสวนเล่าเรื่องครบแล้ว</h3><p>อีกสักครู่… มาลุ้นสวนที่ได้คะแนนสูงสุดด้วยกัน</p></div>`;
        d.scrollTop=0;timer=setTimeout(showWinner,1200);
    };
    const revealFigure=(card:string,points:number)=>`<span class="hm-reveal-model">${animalFigure(card,0,false,true)}</span><figcaption title="${esc(ANIMAL[card].name)}">${esc(ANIMAL[card].name)}<b>+${points}</b></figcaption>`;
    const garden = () => {
        cancel();
        const p = v.players[playerIndex];
        const scores=[...p.score.animals,...p.score.spirits??[],...p.score.whispers??[]];
        const animals=gardenTypes(p).map(card=>({card,points:scores.find(s=>s.card===card)?.points??0}));
        content.innerHTML = `<div class="hm-reveal-player">${avatar(p)}<div><small>สวนที่ ${playerIndex+1} / ${v.players.length}</small><h3>${esc(p.name)}</h3></div></div><p class="hm-reveal-status" role="status">กำลังเปิดสวน…</p><div class="hm-reveal-animals"></div><div class="hm-reveal-subtotal"><span>คะแนนสัตว์</span><b>0</b></div><div class="hm-reveal-terrain" hidden><h4>คะแนนภูมิประเทศ</h4><dl class="hm-category-scores">${terrainScores(p,v.side)}</dl></div><button id="hm-reveal-next" disabled>${playerIndex+1 < v.players.length ? 'ดูสวนของ ' + esc(v.players[playerIndex+1].name) : 'ลุ้นผู้ชนะ'}</button>`;
        d.scrollTop = 0;
        const status = content.querySelector<HTMLElement>('.hm-reveal-status')!, stage = content.querySelector<HTMLElement>('.hm-reveal-animals')!, subtotal = content.querySelector<HTMLElement>('.hm-reveal-subtotal b')!;
        let index = 0, points = 0;
        const step = () => {
            if (!d.isConnected) return;
            if (index >= animals.length) {
                status.textContent = animals.length ? `เปิดครบ ${animals.length} ชนิดแล้ว` : 'สวนนี้ยังไม่มีสัตว์';
                content.querySelector<HTMLElement>('.hm-reveal-terrain')!.hidden = false;
                content.querySelector<HTMLButtonElement>('#hm-reveal-next')!.disabled = false;
                return;
            }
            const animal = animals[index++], item = document.createElement('figure');
            item.className = 'hm-revealed-animal';
            item.innerHTML = `${revealFigure(animal.card,animal.points)}`;
            stage.append(item);
            if (!reduce) item.animate([{opacity:0},{opacity:1}],{duration:180,easing:'ease-out'});
            points += animal.points; subtotal.textContent = String(points);
            status.textContent = `สัตว์ชนิดที่ ${index} / ${animals.length}`;
            document.dispatchEvent(new CustomEvent('gameverse-audio',{detail:'cube'}));
            if (reduce) { while (index < animals.length) { const next = animals[index++], extra=document.createElement('figure');extra.className='hm-revealed-animal';extra.innerHTML=`${revealFigure(next.card,next.points)}`;stage.append(extra);points+=next.points;}subtotal.textContent=String(points);step(); }
            else timer = setTimeout(step,700);
        };
        content.querySelector<HTMLButtonElement>('#hm-reveal-next')!.onclick = () => {
            if (index < animals.length) return;
            if (++playerIndex < v.players.length) garden(); else winner();
        };
        timer = setTimeout(step,reduce ? 0 : 450);
    };
    if (revealedResults === key) table();
    else {
        content.innerHTML = `<div class="hm-reveal-intro"><svg viewBox="0 0 80 80" width="88" height="88" aria-hidden="true"><path d="M40 70V34M40 47C16 48 10 32 15 15c22 0 31 13 25 32ZM40 57c24 1 30-15 25-32-22 0-31 13-25 32Z" fill="#508352" stroke="#d7b55e" stroke-width="2"/></svg><h3>สวนของใครจะเปล่งประกาย?</h3><p>จบเกมแล้ว ค่อย ๆ เปิดดูสัตว์ในสวนทีละคน<br>เมื่อพร้อมแล้ว กดเปิดสวนเพื่อดูผล</p><button id="hm-reveal-start">เปิดสวนเพื่อดูผล</button></div>`;
        if (!reduce) content.querySelector('.hm-reveal-intro svg')!.animate([{transform:'scale(.8)',opacity:0},{transform:'scale(1.06)',opacity:1},{transform:'scale(1)',opacity:1}],{duration:900,easing:'ease-out'});
        content.querySelector<HTMLButtonElement>('#hm-reveal-start')!.onclick = garden;
    }
    d.querySelector<HTMLButtonElement>('#hm-reveal-skip')!.onclick = () => winner(true);
    d.querySelector<HTMLButtonElement>('#hm-ok')!.onclick = () => d.close();
    d.onclose = () => { cancel(); resultsCleanup = undefined; scoreDismissed = key; d.remove(); if (scoreDialog === d) scoreDialog = undefined; modalLock(); };
    d.showModal(); modalLock();
}
export function renderHarmonies(root: HTMLElement, v: HarmoniesView, host: boolean, blocked: boolean, command: (a: RoomAction) => void, snapshot: boolean) {
    if (code !== v.code || v.sequence! < sequence) {
        closeHarmonies();
        code = v.code;
        selectedToken = '';
        selectedCell = -1;
        selectedHabitat = undefined;
        tab = '';
        sequence = -1;
        scoreDismissed = '';
        revealedResults = '';
        marketLayout = [];lastObservedTurn='';lastRoundSeen='';lastRoundTurnSeen='';publicHabitatKey='';publicHabitatMatches=[];
        showMatches = '';
        expanded = false;
        displayMode = v.displayMode || 'full-mobile';
        camera = 'tilt';
        highlightAnimal = '';
    }
    const artStyle=harmoniesArtStyle(v.options?.cardArt);setHarmoniesCardArt(artStyle);
    document.documentElement.dataset.hmCardArt=artStyle;
    applyHarmoniesEffects();
    const brand = root.closest('main')?.querySelector<HTMLAnchorElement>('.game-header .brand');
    if (brand) {
        if(artStyle!=='sculpted')brand.innerHTML='<img class="hm-illustrated-logo" src="/art/harmonies/illustrated-v1/logo.webp" alt="Harmonies" width="240" height="80">';else brand.textContent='Harmonies';
        brand.setAttribute('aria-label', 'Harmonies — กลับหน้าเลือกเกม');
    }
    displayMode = v.displayMode || 'full-mobile';
    if (choiceDialog && ((choiceRevision !== v.revision && !(choiceDialog.dataset.spiritChoice && (v.me??v.displayControl)?.legal.some(a=>a.type==='harmonies-spirit'&&a.card===choiceDialog!.dataset.spiritChoice))) || blocked || v.phase !== 'playing')) { const stale=choiceDialog;choiceDialog=undefined;stale.close(); }
    const scoresRevealed = revealedResults === v.code + ':' + v.sequence;
    if(sanctuaryDialog&&sanctuaryDialog.dataset.revision!==String(v.revision)){sanctuaryDialog.close();sanctuaryDialog=undefined;}
    const controller = v.me ?? v.displayControl;
    const mine = v.players.find(p => p.id === controller?.id), acting = !!mine && v.turn === mine.id && v.phase === 'playing', legal = controller?.legal ?? [];
    if (v.displayControl) tab = v.displayControl.id;
    if (!tab || !v.players.some(p => p.id === tab))
        tab = mine?.id ?? v.players[0].id;
    if (!showMatches && !v.hand?.includes(selectedToken)) {
        selectedToken = v.hand?.[0] ?? '';
        selectedCell = -1;
    }
    if (sequence !== v.sequence) {
        if (v.event?.kind === 'turn' || v.phase === 'finished') {
            showMatches = '';
            selectedToken = v.hand?.[0] ?? '';
        }
        selectedHabitat = undefined;
        selectedCell = -1;
        error = '';
    }
    const finalRound=lastRoundInfo(v);
    const finalKey=finalRound?`${v.code}:${finalRound.end}`:'';
    const finalTurnKey=`${finalKey}:${v.turnCount}:${v.turn}`;
    const finalNotice=!!finalRound&&(lastRoundSeen!==finalKey||(finalRound.ownLastTurn&&lastRoundTurnSeen!==finalTurnKey));
    if(!finalRound&&lastRoundDialog){lastRoundDialog.close();lastRoundDialog=undefined;}
    const turnReminder = !!v.me && acting && !!lastObservedTurn && lastObservedTurn!==v.turn && tab!==mine!.id;
    lastObservedTurn=v.turn??'';
    const activePlayer=v.players.find(p=>p.id===v.turn);
    if(activePlayer&&!acting&&v.phase==='playing'){
        const key=JSON.stringify([activePlayer.id,activePlayer.board,activePlayer.cards]);
        if(publicHabitatKey!==key){publicHabitatKey=key;publicHabitatMatches=habitats(activePlayer,v.side);}
    }
    const observerAnimals=activePlayer&&!acting&&v.phase==='playing'?activePlayer.cards.map(c=>({card:c.card,count:Math.min(ANIMAL[c.card].points.length-c.placed,new Set(publicHabitatMatches.filter(m=>m.card===c.card).map(m=>m.cell)).size)})).filter(c=>c.count>0):[];
    const matches = (controller?.habitats ?? []).filter(m => !showMatches || showMatches === '*' || m.card === showMatches);
    const previousMarket=marketLayout;
    marketLayout=harmoniesMarketLayout(v.code,v.sequence??0,v.market??[],v.options?.solo?3:5,marketLayout);
    const incoming=(v.market??[]).filter(id=>!previousMarket.includes(id));
    const availableAnimals = acting ? mine!.cards.map(c => ({ card: c.card, count: Math.min(ANIMAL[c.card].points.length - c.placed, new Set((controller?.habitats ?? []).filter(m => m.card === c.card).map(m => m.cell)).size) })).filter(c => c.count > 0) : [];
    const preview = !showMatches ? legal.find(a => a.type === 'harmonies-place' && a.token === selectedToken && a.cell === selectedCell) : undefined, canEnd = legal.some(a => a.type === 'harmonies-end');
    const cancelPlacementButton=(kind:'animal'|'token')=>`<button id="hm-cancel-placement" class="hm-cancel-${kind}" aria-label="ยกเลิกการวาง${kind==='animal'?'สัตว์':'ชิ้นไม้'}" title="ยกเลิกการวาง"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg></button>`;
    function board(p: HarmoniesView['players'][number]) { const layout=boardLayout(v.side),mat=layout.mat;return `<div class="hm-board-viewport ${highlightAnimal ? 'is-inspecting' : ''}" data-side="${v.side}" data-board-shape="${mat.width>mat.height?'wide':'regular'}"><div class="hm-board" data-board="${p.id}" data-max-stack="${v.options?.sanctuaries?4:3}" style="--tilt:${camera === 'tilt' ? 36 : 0}deg;--angle:0deg;--zoom:1;--hm-cell-width:${layout.cellWidth}%"><span class="hm-board-mat" aria-hidden="true" style="left:${mat.left}%;top:${mat.top}%;width:${mat.width}%;height:${mat.height}%"></span>${p.board.map((cell, i) => { const center=layout.cells[i],sanctuaryDone=!!cell.sanctuary&&!!p.sanctuaries?.some(t=>t.tile===cell.sanctuary&&t.complete),dry=isPrintedDry(v.side,i)&&!boardNeighbors(v.side,i).some(j=>!p.board[j].sanctuary&&p.board[j].stack.length&&terrain(p.board[j].stack.at(-1)!)==='water'),own = p.id === mine?.id, valid = acting && own && !showMatches && legal.some(a => a.type === 'harmonies-place' && a.token === selectedToken && a.cell === i), hab = acting && own && showMatches && matches.some(m => m.cell === i), ghost = own && preview && selectedCell === i, confirming = acting && own && tab === mine!.id && (ghost || selectedHabitat?.cell === i), confirmationHeight = cell.stack.length + (ghost ? 1 : 0); return `<div data-ui-key="cell-${i}" data-owner="${p.id}" data-cell="${i}" class="hm-cell ${sanctuaryDone?'is-sanctuary-complete':''} ${dry?'is-dry':''} ${valid ? 'legal' : ''} ${hab ? 'habitat' : ''} ${cell.cube?.card === highlightAnimal||cell.whisper?.card===highlightAnimal ? 'animal-location' : ''} ${selectedCell === i && own ? 'selected' : ''} ${selectedHabitat?.cells.includes(i) && own ? 'pattern-match' : ''}" style="--x:${center.x}%;--y:${center.y}%"><span class="hm-cell-origin" aria-hidden="true"></span><span class="hm-hex-wall" aria-hidden="true"></span><button class="hm-cell-hit" aria-label="ช่อง ${i + 1}: ${cell.stack.map(id => NAMES[terrain(id)]).join(' / ') || 'ว่าง'}${cell.cube ? ' • ' + (ANIMAL[cell.cube.card].kind==='spirit'?'สัตว์วิเศษ ':'') + ANIMAL[cell.cube.card].name : ''}${cell.whisper?' • เสียงกระซิบ '+ANIMAL[cell.whisper.card].name:''}"><span class="hm-cell-number">${i + 1}</span></button><span class="hm-stack" data-preserve-content data-ui-key="stack-${artStyle}-${i}-${cell.stack.join('/')}-${cell.cube?.card ?? ''}-${cell.whisper?.card??''}-${sanctuaryDone?'temple':''}-${cell.sanctuaryCubes?.map(c=>c.card).join(',')??''}-${ghost ? selectedToken : ''}-${own && selectedHabitat?.cell === i ? selectedHabitat.card : ''}" aria-hidden="true">${cell.stack.map((id, k) => cylinder(terrain(id), k, false, PALETTE[terrain(id)], true, k > 0 && terrain(cell.stack[k - 1]) === terrain(id))).join('')}${ghost ? cylinder(terrain(selectedToken), cell.stack.length, true, PALETTE[terrain(selectedToken)], true, cell.stack.length > 0 && terrain(cell.stack.at(-1)!) === terrain(selectedToken)) : ''}${sanctuaryDone?sanctuaryBoardModel(cell.sanctuary!,cell.stack.length,artStyle==='original'):''}${cell.cube ? boardAnimalFigure(cell.cube.card, cell.stack.length) : ''}${cell.sanctuaryCubes?.length?`<span class="hm-sanctuary-residents">${cell.sanctuaryCubes.slice(0,3).map(c=>boardAnimalFigure(c.card,cell.stack.length)).join('')}${cell.sanctuaryCubes.length>3?`<b>+${cell.sanctuaryCubes.length-3}</b>`:''}</span>`:''}${cell.whisper?boardAnimalFigure(cell.whisper.card,cell.stack.length):''}${own&&selectedHabitat?.cell===i?boardAnimalFigure(selectedHabitat.card,cell.stack.length,true):''}</span>${confirmationHeight > 1 ? `<span class="hm-height" aria-hidden="true">×${confirmationHeight}</span>` : ''}${confirming ? `<button id="hm-confirm" class="hm-tile-confirm ${selectedHabitat?'hm-animal-preview':'hm-terrain-preview'}" data-tile-confirm="${i}" data-placement="${selectedHabitat ? 'animal' : 'terrain'}" aria-label="${selectedHabitat ? 'ยืนยันวางสัตว์' : 'ยืนยันวางชิ้นไม้'}" title="ยืนยัน • แตะช่องเดิมเพื่อยกเลิก" style="--confirm-level:${confirmationHeight};--confirm-offset:${camera === 'tilt' ? 14 - 2 * confirmationHeight : -2 * Math.max(0,confirmationHeight - 1)}px" ${blocked ? 'disabled' : ''}><span class="hm-terrain-check hm-placement-check"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></span></button>` : ''}</div>`; }).join('')}</div>${ownControls(p)}</div>`; }
    function animalShelf(animals:{card:string;count:number}[],interactive:boolean){
        return `<div class="hm-animal-choices" aria-label="${interactive?'สัตว์ที่วางได้ แตะเลือกแล้วแตะช่องบนกระดาน':'สัตว์ที่เพื่อนวางได้'}">${animals.map(c=>`<div class="hm-available-slot" data-ui-key="available-slot-${c.card}"><button data-ui-key="available-${c.card}" ${interactive?`data-available-animal="${c.card}" aria-pressed="${showMatches===c.card}"`:`data-detail="${c.card}" class="hm-observed-animal"`} data-available-count="${c.count}" aria-label="${interactive?'เลือกวาง':'ดู'}${esc(ANIMAL[c.card].name)} วางได้ ${c.count} ตัว" ${interactive&&blocked?'disabled':''}>${boardAnimalFigure(c.card,0,false,true)}${c.count>1?`<span class="hm-available-count">x${c.count}</span>`:''}</button>${interactive&&selectedHabitat?.card===c.card?cancelPlacementButton('animal'):''}</div>`).join('')}${Array.from({length:Math.max(0,2-animals.length)},(_,i)=>`<span class="hm-animal-slot" data-ui-key="empty-animal-${i}" aria-hidden="true"></span>`).join('')}</div>`;
    }
    function ownControls(p:HarmoniesView['players'][number]){
        if(v.phase==='finished')return '<aside class="hm-board-sidebar" aria-label="คำสั่งหลังจบเกม"></aside>';
        const own=p.id===mine?.id,active=p.id===v.turn,animals=own?availableAnimals:active?observerAnimals:[];
        const hand=Array.from({length:3},(_,i)=>{const token=own?(acting?v.hand?.[i]:undefined):active?v.hand?.[i]:undefined;return token?own?`<div class="hm-token-slot"><button data-token="${token}" aria-label="เลือก${NAMES[terrain(token)]}" aria-pressed="${!showMatches&&selectedToken===token}" ${blocked?'disabled':''}>${disk(terrain(token))}</button>${preview&&selectedToken===token?cancelPlacementButton('token'):''}</div>`:`<span class="hm-observed-token" role="img" aria-label="${NAMES[terrain(token)]}">${disk(terrain(token))}</span>`:`<span class="hm-hand-slot" role="img" aria-label="ช่องชิ้นไม้ ${i+1} ว่าง"></span>`;}).join('');
        const candidates=selectedCell>=0&&showMatches?matches.map((m,index)=>({m,index})).filter(({m})=>m.cell===selectedCell):[];
        return `<aside class="hm-board-sidebar ${own?'':'hm-observer-controls'}" aria-label="ชิ้นไม้และสัตว์ด้านขวากระดาน"><div class="hm-header-hand" aria-label="ชิ้นไม้ในตานี้">${hand}</div>${animalShelf(animals,own)}${own?`<button id="hm-end" class="hm-round-action" aria-label="จบตา" title="จบตา" ${blocked||!acting||!canEnd||!!preview||!!selectedHabitat?'disabled':''}><span>จบตา</span></button>`:`<span class="hm-observer-label">${active?'กำลังเล่น':'รอเล่น'}</span>`}</aside>${own||finalRound?`<div class="hm-board-controls">${!error&&finalRound?`<button data-last-round-status class="hm-final-round-status" aria-label="รอบสุดท้าย เหลือ ${finalRound.count} ตา แตะดูคิว">${finalRound.ownLastTurn?'ตาสุดท้ายของคุณ':'รอบสุดท้าย'} · เหลือ ${finalRound.count} ตา</button>`:''}${own&&error?`<p class="hm-board-error" role="status">${esc(error)}</p>`:''}${candidates.length>1?`<div class="hm-board-choices">${candidates.map(({m,index})=>`<button data-habitat="${index}" aria-label="เลือกแบบ ${m.rotation+1} ${esc(ANIMAL[m.card].name)}" aria-pressed="${selectedHabitat?.card===m.card&&selectedHabitat.origin===m.origin&&selectedHabitat.rotation===m.rotation}">${esc(ANIMAL[m.card].name)} · ${m.rotation+1}</button>`).join('')}</div>`:''}</div>`:''}`;
    }
    function showLastRound(animate = true) {
        if(!finalRound)return;
        lastRoundDialog?.close();turnDialog?.close();detail?.close();guideDialog?.close();
        const ownRemaining=finalRound.remaining.some(p=>p.id===v.me?.id);
        const d=lastRoundDialog=infoDialog(finalRound.ownLastTurn?'นี่คือตาสุดท้ายของคุณ':'เข้าสู่รอบสุดท้ายแล้ว',`<div class="hm-last-round-hero"><span class="hm-last-round-emblem" aria-hidden="true">${terrainScene(['wood','wood','leaf'])}</span><b>${finalRound.count===1?'ตาสุดท้ายของเกม':'รอบสุดท้าย'}</b><p>${finalRound.reason}</p></div><p class="hm-last-round-explain">เล่นต่อเฉพาะผู้เล่นที่เหลือในรอบนี้ แล้วนับคะแนน ทุกคนจะได้เล่นจำนวนตาเท่ากัน</p><ol class="hm-last-round-queue">${finalRound.remaining.map((p,i)=>`<li ${i===0?'aria-current="step"':''}>${avatar(p)}<span>${esc(p.name)}${p.id===v.me?.id?' (คุณ)':''}</span><b>${i===0?'กำลังเล่น':'รอตาสุดท้าย'}</b></li>`).join('')}</ol>${v.me&&!ownRemaining?'<p class="hm-last-round-explain">คุณเล่นตาสุดท้ายไปแล้ว รอเพื่อนเล่นให้ครบก่อนดูผล</p>':''}<button id="hm-last-round-continue">${finalRound.ownLastTurn?'กลับไปเล่นตาสุดท้ายของคุณ':'รับทราบ · ดูตาสุดท้ายต่อ'}</button>`,'hm-last-round-dialog');
        d.dataset.turn=String(v.turnCount);
        d.querySelector<HTMLButtonElement>('#hm-last-round-continue')!.onclick=()=>{d.close();if(finalRound.ownLastTurn){tab=mine!.id;expanded=false;rerender();}};
        d.addEventListener('close',()=>{if(lastRoundDialog===d)lastRoundDialog=undefined;});
        if(animate&&!harmoniesReducedMotion())d.querySelector('.hm-last-round-emblem')!.animate([{opacity:0,transform:'translateY(8px) scale(.7)'},{opacity:1,transform:'translateY(0) scale(1.08)'},{opacity:1,transform:'none'}],{duration:650,easing:'ease-out'});
    }
    function ownedCards(p: HarmoniesView['players'][number]) {const ownedCount=p.cards.length+(p.sanctuaries?.length??0);
        const orderedCards = [...p.cards].sort((a,b) => Number(a.placed >= ANIMAL[a.card].points.length) - Number(b.placed >= ANIMAL[b.card].points.length));
        return `<section class="hm-owned-collection ${ownedCount > 4 ? 'has-overflow' : ''}" style="--shown-cards:${Math.max(1,Math.min(4,ownedCount))}"><div class="hm-owned-heading hm-rail-title">${p.id === v.me?.id ? 'สัตว์ของคุณ' : 'สัตว์ของ ' + esc(p.name)}</div><div class="hm-owned-cards ${ownedCount > 4 ? 'has-overflow' : ''}" data-owned-count="${p.cards.length}" style="--shown-cards:${Math.min(4,ownedCount)};--owned-columns:${Math.min(6,Math.max(4,ownedCount))}" aria-label="การ์ดสัตว์ทั้งหมด เลื่อนเพื่อดูเพิ่มเติม">${orderedCards.map(c => `<article style="order:${c.placed >= ANIMAL[c.card].points.length?2:0}" data-card-kind="${ANIMAL[c.card].kind??'animal'}" class="hm-animal ${ANIMAL[c.card].kind?'hm-special-card':''} ${c.placed === ANIMAL[c.card].points.length ? 'complete' : ''}" data-ui-key="owned-${c.card}"><button data-detail="${c.card}" class="hm-inspect" aria-label="ดู ${ANIMAL[c.card].name}">${cardFace(c.card,c.placed)}${c.placed >= ANIMAL[c.card].points.length ? '<span class="hm-complete-ribbon">ครบแล้ว</span>' : ''}</button></article>`).join('')+(p.sanctuaries??[]).map(t=>`<article style="order:1" class="hm-animal hm-owned-sanctuary"><button class="hm-inspect" data-sanctuaries="${p.id}" data-sanctuary-detail="${t.tile}" aria-label="ดู${SANCTUARY[t.tile].name}">${sanctuaryFace(t.tile,t.complete,p.score.sanctuaries?.find(s=>s.tile===t.tile)?.points,true)}</button></article>`).join('') || '<div class="hm-owned-empty" role="status"><svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true"><path d="M15 47c0-8 9-18 17-18s17 10 17 18c0 7-8 10-17 6-9 4-17 1-17-6Z" fill="currentColor"/><ellipse cx="12" cy="26" rx="7" ry="10" transform="rotate(-22 12 26)" fill="currentColor"/><ellipse cx="25" cy="16" rx="7" ry="10" transform="rotate(-8 25 16)" fill="currentColor"/><ellipse cx="40" cy="16" rx="7" ry="10" transform="rotate(8 40 16)" fill="currentColor"/><ellipse cx="53" cy="26" rx="7" ry="10" transform="rotate(22 53 26)" fill="currentColor"/></svg><p>ยังไม่มีการ์ดสัตว์</p></div>'}</div>${v.phase==='finished'?`<aside class="hm-board-sidebar hm-finished-controls" aria-label="คำสั่งหลังจบเกม">${p.id===tab?`<div class="hm-final-actions"><button id="hm-show-results" class="hm-round-action" aria-label="ดูสรุป" title="ดูสรุป">${summaryIcon}</button>${host?`<button id="hm-restart" class="hm-round-action" aria-label="เริ่มเล่นใหม่" title="เริ่มเล่นใหม่" ${blocked?'disabled':''}>${restartIcon}</button>`:''}</div>`:''}</aside>`:''}</section>`;
    }
    boardFitCleanup?.();
    const menuMarkup=`<div class="hm-menu-content"><label class="hm-effects-control"><input id="hm-low-effects" type="checkbox" ${harmoniesLowEffects()?'checked':''}><span>ลดเอฟเฟกต์ · ลื่นขึ้น<small>หยุดประกาย ลดเงา และใช้ภาพการ์ดเล็กแบบเบา</small></span></label><section class="hm-art-settings" aria-label="รูปแบบภาพ"><h3>รูปแบบภาพ</h3><div class="hm-art-buttons">${([['illustrated','2D'],['sculpted','3D'],['original','ORIGINAL']] as const).map(([style,label])=>`<button data-art-style="${style}" aria-pressed="${artStyle===style}">${label}</button>`).join('')}</div><small>ORIGINAL ใช้ภาพต้นฉบับที่มี ใบที่ไม่มีภาพต้นฉบับใช้ภาพ 2D</small></section><details class="hm-invite"><summary>รายละเอียดห้อง</summary><div class="hm-room-details"><p class="hm-menu-room">ห้อง ${esc(v.code)} · <a class="hm-join-link" href="/harmonies/play/${esc(v.code)}" target="_blank" rel="noopener">เข้าร่วมด้วยมือถือ</a></p><canvas width="144" height="144" aria-label="QR เข้าห้อง"></canvas><p>กองสัตว์เหลือ ${v.deckCount} ใบ</p><p>${[v.options?.solo?'Solo':'',v.options?.natureSpirits?'Nature’s Spirits':'',v.options?.promoTrex?'T-rex Promo':'',v.options?.whispers?'Crescendo · เสียงกระซิบ':'',v.options?.sanctuaries?'Crescendo · วิหาร':'',v.options?.pulse?'Pulse':''].filter(Boolean).join(' · ')}</p><p class="hm-side">ด้าน ${v.side} · ${BOARD_NAMES[v.side]}</p>${harmoniesBoardHelp(v.side)}</div></details><label class="hm-display-settings">โหมดจอกลาง<select id="hm-display-mode" name="display-mode" ${!v.canConfigureDisplay || blocked ? 'disabled' : ''}><option value="full-mobile" ${displayMode === 'full-mobile' ? 'selected' : ''}>จอกลางแสดงผลเท่านั้น</option><option value="shared-table" ${displayMode === 'shared-table' ? 'selected' : ''}>เล่นร่วมกันบนจอกลาง</option></select></label><div class="hm-camera"><button data-camera="tilt" aria-pressed="${camera === 'tilt'}">มุมเอียง</button><button data-camera="top" aria-pressed="${camera === 'top'}">มุมบน</button><button data-camera="reset">คืนมุมเดิม</button></div>${host?'<div class="hm-settings-restart"></div>':''}${v.players.length>1?`<nav class="hm-tabs" aria-label="ดูกระดานผู้เล่น">${!mine?`<button id="hm-overview" aria-pressed="${!expanded}">ดูกระดานทั้งหมด</button>`:''}${v.players.map(p=>`<button data-tab="${p.id}" aria-pressed="${p.id===tab}">${avatar(p)}<span>${p.id===mine?.id?'กระดานคุณ':esc(p.name)}</span></button>`).join('')}</nav>`:''}</div>`;
    patchHTML(root, `<div class="hm-root ${v.spiritSelectionsRemaining?'hm-choosing-spirit':''} ${v.me ? 'hm-phone' : 'hm-display'} ${controller?'hm-player-layout':''} ${v.phase === 'finished' ? 'hm-finished' : ''} ${expanded ? 'hm-expanded' : ''} ${v.me && displayMode === 'shared-table' ? 'hm-shared-table' : ''} ${v.displayControl ? 'hm-display-interactive' : ''}"><h1 class="sr-only">Harmonies</h1>${harmoniesLeaderboardButton().replace('class="harmonies-leaderboard-trigger"','class="harmonies-leaderboard-trigger hm-help-button hm-ranking-button"')}<button id="hm-scoring" class="hm-help-button hm-scoring-button" aria-label="วิธีให้คะแนน" title="วิธีให้คะแนน">${summaryIcon}</button><button id="hm-help" class="hm-help-button" aria-label="วิธีเล่น" title="วิธีเล่น"><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M8 8a4 4 0 1 1 6 3.5c-1.3.7-2 1.5-2 3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="18" r="1.3" fill="currentColor"/></svg></button><button id="hm-card-library" class="hm-help-button hm-library-button" aria-label="คลังการ์ด" title="คลังการ์ด">${cardLibraryIcon}</button><button id="hm-menu" class="hm-menu-trigger" aria-label="ตั้งค่าเกม" title="ตั้งค่าเกม"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="m9 3 1-1h4l1 3 3 1 3-1 2 4-2 2v3l2 2-2 4-3-1-3 1-1 3h-4l-1-3-3-1-3 1-2-4 2-2v-3L1 9l2-4 3 1 3-1Z" transform="translate(1 0) scale(.92)"/><circle cx="12" cy="12" r="3.2"/></g></svg></button><section class="hm-drafting-panel" aria-label="เลือกภูมิประเทศและสัตว์"><section class="hm-animal-market" data-ui-key="animal-market"><h2 data-deck-source class="hm-rail-title">สัตว์ในสวน ${v.options?.sanctuaries?'<button class="hm-sanctuary-market-trigger" data-sanctuaries="market">วิหารกลาง</button>':''}</h2><div class="hm-market ${v.options?.solo?'hm-solo-market':''}">${marketLayout.map((id, i) => `<div class="hm-market-slot" data-ui-key="market-slot-${i}">${id ? `<article data-market-card="${id}" data-ui-key="market-${id}" class="hm-animal"><button data-detail="${id}" class="hm-inspect" aria-label="ดู ${ANIMAL[id].name}">${cardFace(id)}</button>${acting ? `${legal.some(a=>a.type==='harmonies-solo-discard'&&a.card===id)?`<button data-solo-discard="${id}" class="hm-solo-discard" aria-label="เปลี่ยนการ์ด ${ANIMAL[id].name} แล้วจบตา" title="เปลี่ยนการ์ด ${ANIMAL[id].name} แล้วจบตา" ${blocked?'disabled':''}><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 8h14m-4-4 4 4-4 4M20 16H6m4-4-4 4 4 4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`:''}<button data-claim="${id}" aria-label="รับการ์ด ${ANIMAL[id].name}" title="รับการ์ด ${ANIMAL[id].name}" ${blocked || !legal.some(a => a.type === 'harmonies-card' && a.card === id) ? 'disabled' : ''}><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></button>` : ''}</article>` : '<div class="hm-market-empty" role="img" aria-label="เลือกแล้ว รอการ์ดใบถัดไป"><span class="hm-complete-ribbon" aria-hidden="true">เลือกแล้ว</span></div>'}</div>`).join('')}</div></section><section class="hm-supply ${finalRound?'hm-final-round-supply':''}" data-ui-key="supply">${v.phase==='finished'?'<div class="hm-game-finished-message" role="status"><strong>จบเกมแล้ว</strong></div>':''}<h2>${v.phase==='finished'?'จบเกมแล้ว · แตะสัตว์เพื่อดูรายละเอียด' : acting && v.picked ? 'เลือกชิ้นไม้วางบนกระดาน' : 'เลือกชุดภูมิประเทศ 1 กลุ่ม'} <small>ในถุง ${v.bagCount} ชิ้น</small></h2><div class="hm-groups ${v.options?.solo?'hm-solo-groups':''} ${mine && !acting ? 'is-off-turn' : ''} ${!acting || v.picked ? 'is-waiting' : ''}">${v.groups!.map((g, i) => `<button data-group="${i}" data-group-label="${i + 1}" aria-pressed="${!!v.picked && !g.length}" data-ui-key="group-${i}" ${blocked || !legal.some(a => a.type === 'harmonies-group' && a.group === i) ? 'disabled' : ''} aria-label="รับกลุ่ม ${i + 1} ${g.map(t => NAMES[terrain(t)]).join(' ')}">${g.map(t => disk(terrain(t))).join('') || '<span>หยิบแล้ว</span>'}</button>`).join('')}</div></section></section>${controller?.spiritChoices?.length?`<section class="hm-spirit-selection"><h2>เลือกจิตวิญญาณประจำสวน</h2><p>ทุกคนเลือก 1 จาก 2 ใบพร้อมกันก่อนเริ่มตาแรก เมื่อเลือกครบจึงเริ่มเล่น</p><div>${controller.spiritChoices.map(id=>`<article class="hm-spirit-offer"><div class="hm-animal"><button data-detail="${id}" class="hm-inspect" aria-label="อ่าน ${ANIMAL[id].name}">${cardFace(id,0,true,false,false)}</button></div><h3 class="hm-spirit-choice-name">${esc(ANIMAL[id].name)}</h3><p>${ANIMAL[id].description}</p><button data-spirit-choice="${id}" ${blocked||!legal.some(a=>a.type==='harmonies-spirit'&&a.card===id)?'disabled':''}>เลือก</button></article>`).join('')}</div></section>`:v.spiritSelectionsRemaining?`<section class="hm-spirit-selection hm-spirit-waiting" role="status"><h2>${controller?'เลือกสัตว์ในตำนานแล้ว':'กำลังเลือกสัตว์ในตำนาน'}</h2><p>รอเพื่อนเลือกให้ครบ · เหลือ ${v.spiritSelectionsRemaining} คน</p></section>`:''}<div class="hm-gardens">${v.players.filter(p=>!harmoniesLowEffects()||!v.me||p.id===tab).map(p => `<section data-ui-key="player-${p.id}" class="hm-player ${p.id === tab ? 'chosen-board' : ''} ${p.id === v.turn && v.phase === 'playing' ? 'active' : ''}" data-player="${p.id}"><header>${avatar(p)}<div><h2>${esc(p.name)}${p.id === v.me?.id ? ' (คุณ)' : ''}</h2><small>ผู้เล่น ${v.players.findIndex(seat=>seat.id===p.id)+1} • ${p.connected ? 'ออนไลน์' : 'รอกลับเข้าห้อง'}</small></div>${v.phase === 'finished' && scoresRevealed ? `<b>${p.score.total}<small>คะแนน</small></b>` : ''}</header>${board(p)}${ownedCards(p)}</section>`).join('')}</div><details class="hm-rules"><summary>กติกาและคะแนน</summary>${harmoniesScoringGuide(v.side,v.options)}</details></div>`);
    updateRoomRestart(root,v,host,blocked,action=>{menuDialog?.close();command(action);},menuDialog);
    repositionCleanup?.();
    boardFitCleanup=fitHarmoniesBoards(root);
    bindHarmoniesLeaderboard(root);
    const cancelSelection=()=>{selectedCell=-1;selectedHabitat=undefined;error='';renderHarmonies(root,v,host,blocked,command,true);};
    const escapeSelection=(event:KeyboardEvent)=>{if(event.key==='Escape'&&!event.defaultPrevented&&(preview||selectedHabitat)&&!document.querySelector('.hm-dialog[open]'))cancelSelection();};
    document.addEventListener('keydown',escapeSelection);repositionCleanup=()=>document.removeEventListener('keydown',escapeSelection);
    const rerender=()=>renderHarmonies(root,v,host,blocked,command,true);
    const openViewMenu=()=>{
     menuDialog?.close();const d=menuDialog=infoDialog('ตั้งค่าเกม',menuMarkup,'hm-view-dialog');
     updateRoomRestart(root,v,host,blocked,action=>{d.close();command(action);},d);
     d.addEventListener('close',()=>{if(menuDialog===d)menuDialog=undefined;root.querySelector<HTMLElement>('#hm-menu')?.focus({preventScroll:true});});
     const refresh=()=>{d.close();rerender();root.querySelector<HTMLButtonElement>('#hm-menu')?.click();};
     const effects=d.querySelector<HTMLInputElement>('#hm-low-effects')!;effects.onchange=()=>{setHarmoniesLowEffects(effects.checked);for(const a of root.getAnimations({subtree:true}))a.cancel();refresh();};
     d.querySelectorAll<HTMLButtonElement>('[data-art-style]').forEach(b=>b.onclick=()=>{const style=b.dataset.artStyle as 'illustrated'|'sculpted'|'original';setHarmoniesArtPreference(style);rerender();d.querySelectorAll<HTMLButtonElement>('[data-art-style]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.artStyle===style)));});
     const display=d.querySelector<HTMLSelectElement>('#hm-display-mode')!;display.onchange=()=>{if(v.canConfigureDisplay&&!blocked){d.close();command({type:'harmonies-display-mode',mode:display.value as 'full-mobile'|'shared-table'});}};
     d.querySelectorAll<HTMLButtonElement>('[data-camera]').forEach(b=>b.onclick=()=>{camera=b.dataset.camera==='top'?'top':'tilt';d.close();rerender();});
     d.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab!;if(!mine)expanded=true;d.close();rerender();});
     const overview=d.querySelector<HTMLButtonElement>('#hm-overview');if(overview)overview.onclick=()=>{expanded=false;d.close();rerender();};
     const joinURL=root.closest('main')?.querySelector<HTMLAnchorElement>('.shared-room-menu .join-link')?.href??new URL('/harmonies/play/'+v.code,location.href).href;
     d.querySelector<HTMLAnchorElement>('.hm-join-link')!.href=joinURL;
     const invite=d.querySelector<HTMLDetailsElement>('.hm-invite')!;invite.ontoggle=()=>{if(invite.open)void QRCode.toCanvas(invite.querySelector('canvas'),joinURL,{width:144,margin:1});};
    };
    root.querySelector<HTMLButtonElement>('#hm-menu')!.onclick=openViewMenu;
    root.querySelector<HTMLButtonElement>('#hm-card-library')!.onclick=e=>openHarmoniesCardLibrary(e.currentTarget as HTMLElement);
    root.querySelectorAll<HTMLButtonElement>('[data-group]').forEach(b => b.onclick = () => { const group=Number(b.dataset.group);if(b.disabled||!acting||blocked)return;confirmChoice(v,'รับภูมิประเทศกลุ่มนี้?',`${enlargedGroup(v.groups![group],b)}<p>รับชิ้นไม้ทั้ง 3 ชิ้นเพื่อวางในตานี้</p>`,()=>command({type:'harmonies-group',group})); });
    root.querySelectorAll<HTMLButtonElement>('[data-claim]').forEach(b => b.onclick = () => { const card=b.dataset.claim!;if(b.disabled||!acting||blocked)return;confirmChoice(v,ANIMAL[card].kind==='whisper'?'รับการ์ดเสียงกระซิบใบนี้?':'รับการ์ดสัตว์ใบนี้?',`<div class="hm-root hm-choice-full-card" style="--hm-card-height:260px;--hm-card-width:180px"><article class="hm-animal"><div class="hm-inspect">${cardFace(card)}</div></article></div><p>${ANIMAL[card].name}</p>`,()=>command({type:'harmonies-card',card})); });
    root.querySelectorAll<HTMLButtonElement>('[data-solo-discard]').forEach(b=>b.onclick=()=>{if(blocked||!acting)return;const card=b.dataset.soloDiscard!;confirmChoice(v,'เปลี่ยนการ์ดกลางแล้วจบตา?',`<p>ทิ้ง ${ANIMAL[card].name} และเปิดใบใหม่ เมื่อเปลี่ยนแล้วทำได้เพียงจบตานี้</p>`,()=>command({type:'harmonies-solo-discard',card}));});
    root.querySelectorAll<HTMLButtonElement>('[data-spirit-choice]').forEach(b=>b.onclick=()=>{const card=b.dataset.spiritChoice!,action=legal.find(a=>a.type==='harmonies-spirit'&&a.card===card);if(blocked||!action)return;confirmChoice(v,'เลือกจิตวิญญาณใบนี้?',`<div class="hm-spirit-confirm-card">${cardFace(card,0,true)}</div><p>${ANIMAL[card].name}</p><p>${ANIMAL[card].description}</p><p>อีกใบจะถูกเก็บออกจากเกม</p>`,()=>command(action));choiceDialog!.dataset.spiritChoice=card;});
    root.querySelectorAll<HTMLButtonElement>('[data-detail]').forEach(b => b.onclick = () => cardDetail(v, b.dataset.detail!));
    const selectTerrain=(token:string,cell=-1)=>{highlightAnimal='';selectedToken=token;selectedCell=cell;selectedHabitat=undefined;showMatches='';error='';tab=mine!.id;rerender();};
    root.querySelectorAll<HTMLButtonElement>('[data-token]').forEach(b=>b.onclick=()=>{if(!blocked&&acting)selectTerrain(b.dataset.token!);});
    root.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(b => b.onclick = () => {
        tab = b.dataset.tab!;
        if (!mine)
            expanded = true;
        rerender();
    });
    root.querySelectorAll<HTMLButtonElement>('[data-matches]').forEach(b => b.onclick = () => { highlightAnimal = ''; showMatches = showMatches === b.dataset.matches ? '' : b.dataset.matches!; tab = mine!.id; selectedHabitat = undefined; selectedCell = -1; error = ''; rerender(); });
    root.querySelectorAll<HTMLButtonElement>('[data-available-animal]').forEach(b => b.onclick = () => { highlightAnimal = ''; showMatches = showMatches === b.dataset.availableAnimal ? '' : b.dataset.availableAnimal!; selectedToken = ''; tab = mine!.id; selectedHabitat = undefined; selectedCell = -1; error = ''; rerender(); });
    function openSanctuaries(ownerId:string,tileId?:string){
      const owner=v.players.find(p=>p.id===ownerId)??mine??v.players[0];
      if(tileId){
        if(!SANCTUARY[tileId])return;const owned=owner.sanctuaries?.find(t=>t.tile===tileId),points=owner.score.sanctuaries?.find(s=>s.tile===tileId)?.points;
        sanctuaryDialog?.close();
        const d=sanctuaryDialog=infoDialog(SANCTUARY[tileId].name,`<div class="hm-sanctuary-detail-card">${sanctuaryFace(tileId,owned?.complete,points)}</div>${sanctuaryDescription(tileId,owned?.complete,points)}${owned?`<p>${owned.cell===undefined?'เริ่มสร้างบนกองที่มีสีฐานตรงตามแผ่น':'ช่อง '+(owned.cell+1)}</p>`:''}${owned?.cell===undefined?'':(owner.board[owned.cell].sanctuaryCubes??[]).map(c=>`<button data-sanct-detail="${c.card}">${ANIMAL[c.card].name}</button>`).join('')}${!owned&&acting&&legal.some(a=>a.type==='harmonies-sanctuary'&&a.tile===tileId)?`<button class="hm-sanctuary-select" data-sanct-claim="${tileId}">เลือก</button>`:''}${owner.id===mine?.id&&owned?.cell!==undefined?legal.filter(a=>a.type==='harmonies-sanctuary-cube'&&a.cell===owned.cell).map(a=>'card'in a?`<button data-sanct-animal="${a.card}" data-sanct-cell="${owned.cell}">วางตัวสุดท้าย · ${ANIMAL[a.card].name}</button>`:'').join(''):''}`,'hm-sanctuary-detail-dialog');
        d.dataset.revision=String(v.revision);
        d.querySelectorAll<HTMLButtonElement>('[data-sanct-claim]').forEach(b=>b.onclick=()=>{d.close();command({type:'harmonies-sanctuary',tile:b.dataset.sanctClaim!});});
        d.querySelectorAll<HTMLButtonElement>('[data-sanct-detail]').forEach(b=>b.onclick=()=>{d.close();cardDetail(v,b.dataset.sanctDetail!);});
        d.querySelectorAll<HTMLButtonElement>('[data-sanct-animal]').forEach(b=>b.onclick=()=>{const card=b.dataset.sanctAnimal!,cell=Number(b.dataset.sanctCell);d.close();confirmChoice(v,'วางสัตว์ตัวสุดท้ายในวิหาร?',`<p>${ANIMAL[card].name} · ช่อง ${cell+1}</p>`,()=>command({type:'harmonies-sanctuary-cube',card,cell}));});
        return;
      }
      const offers=v.sanctuaryMarket??[];
      const body=`<div class="hm-sanctuary-grid">${offers.map(id=>`<section><button class="hm-sanctuary-preview" data-sanct-preview="${id}" aria-label="ดู ${SANCTUARY[id].name}">${sanctuaryFace(id,false,undefined,true)}</button>${acting?`<button class="hm-sanctuary-select" data-sanct-claim="${id}" ${blocked||!legal.some(a=>a.type==='harmonies-sanctuary'&&a.tile===id)?'disabled':''}>เลือก</button>`:''}</section>`).join('')}</div><p class="hm-sanctuary-turn-limit" role="status">ตาละ 1 แผ่น · รับแยกจากการ์ดสัตว์</p><section class="hm-sanctuary-help"><h3>วิธีสร้างวิหาร</h3><p>รับได้ตาละ 1 แผ่น แยกจากสัตว์ · วิหารที่ยังไม่ครบรวมในโควตา 4 ใบ สร้างกอง 4 ชั้นตามการ์ด เมื่อครบ รับสัตว์ปกติตัวสุดท้ายที่สีตรงกันได้โดยไม่ต้องสร้างรูปแบบ สัตว์วิเศษและเสียงกระซิบใช้ไม่ได้</p></section>`;
      sanctuaryDialog?.close();const d=sanctuaryDialog=infoDialog('วิหารกลาง',body,'hm-sanctuary-dialog');d.dataset.revision=String(v.revision);
      const reference=root.querySelector<HTMLElement>('.chosen-board .hm-owned-cards .hm-animal')??root.querySelector<HTMLElement>('.hm-market .hm-animal');
      if(reference){const r=reference.getBoundingClientRect();d.style.setProperty('--hm-sanctuary-card-width',`${r.width}px`);d.style.setProperty('--hm-sanctuary-card-height',`${r.height}px`);}
      d.querySelectorAll<HTMLButtonElement>('[data-sanct-preview]').forEach(b=>b.onclick=()=>openSanctuaries(owner.id,b.dataset.sanctPreview!));
      d.querySelectorAll<HTMLButtonElement>('[data-sanct-claim]').forEach(b=>b.onclick=()=>{d.close();command({type:'harmonies-sanctuary',tile:b.dataset.sanctClaim!});});
    }
    root.querySelectorAll<HTMLButtonElement>('[data-sanctuaries]').forEach(b=>b.onclick=()=>openSanctuaries(b.dataset.sanctuaries!,b.dataset.sanctuaryDetail));
    root.querySelectorAll<HTMLButtonElement>('[data-habitat]').forEach(b => b.onclick = () => { highlightAnimal = ''; selectedHabitat = matches[Number(b.dataset.habitat)]; selectedCell = selectedHabitat.cell; error = ''; rerender(); });
    root.querySelectorAll<HTMLButtonElement>('[data-cell]').forEach(b => b.onclick = () => {
        const owner = v.players.find(p => p.id === b.dataset.owner)!, i = Number(b.dataset.cell);
        if(owner.board[i].sanctuary&&!(acting&&owner.id===mine?.id&&legal.some(a=>a.type==='harmonies-place'&&a.cell===i&&a.token===selectedToken))){openSanctuaries(owner.id,owner.board[i].sanctuary);return;}
        if ((owner.board[i].cube||owner.board[i].whisper) && !(acting&&owner.id===mine?.id&&showMatches&&matches.some(m=>m.cell===i))) {
            cellCardDetails(v,owner,owner.board[i]);
            return;
        }
        if (!acting || owner.id !== mine?.id)
            return;
        if (selectedCell === i && (preview || selectedHabitat)) { cancelSelection(); return; }
        highlightAnimal = '';
        document.dispatchEvent(new CustomEvent('gameverse-audio', { detail: 'select' }));
        const m = showMatches ? matches.filter(m => m.cell === i) : [];
        selectedHabitat = m[0];
        selectedCell = i;
        error = !m.length && selectedToken && !legal.some(a => a.type === 'harmonies-place' && a.cell === i && a.token === selectedToken) ? placementReason(owner.board[i], terrain(selectedToken)) ?? 'เลือกชิ้นไม้ที่ยังอยู่ในตานี้' : '';
        rerender();
    });
    // Browsers may retarget a click on a projected lower hex to its 3D parent.
    // Resolve only the interaction geometry; legality still comes from the server.
    root.querySelectorAll<HTMLElement>('.hm-board').forEach(board => board.onclick = event => {
        if ((event.target as Element).closest('[data-cell],button'))
            return;
        const targets = [...board.querySelectorAll<HTMLElement>('[data-cell]')].map(el => { const r = el.getBoundingClientRect(); return { el, d: ((event.clientX - r.x - r.width / 2) / r.width) ** 2 + ((event.clientY - r.y - r.height / 2) / r.height) ** 2 }; }).sort((a, b) => a.d - b.d);
        if (targets[0]?.d < .3)
            targets[0].el.click();
    });
    root.querySelectorAll<HTMLButtonElement>('[data-board-mode]').forEach(b => b.onclick = () => { highlightAnimal = ''; showMatches = b.dataset.boardMode === 'animal' ? '*' : ''; selectedToken = showMatches ? '' : v.hand?.[0] ?? ''; selectedHabitat = undefined; selectedCell = -1; error = ''; rerender(); });
    root.querySelectorAll<HTMLButtonElement>('[data-locations]').forEach(b => b.onclick = () => { highlightAnimal = highlightAnimal === b.dataset.locations ? '' : b.dataset.locations!; rerender(); });
    const bind = (id: string, fn: () => void) => {
        const b = root.querySelector<HTMLButtonElement>(id);
        if (b)
            b.onclick = e => { e.stopPropagation(); fn(); };
    };
    bind('#hm-cancel-placement', cancelSelection);
    bind('#hm-overview', () => { expanded = false; rerender(); });
    let submitted = false;
    const commit = (action: RoomAction) => { if (blocked || submitted) return; submitted = true; root.querySelectorAll<HTMLButtonElement>('#hm-confirm,#hm-end').forEach(b => b.disabled = true); command(action); };
    bind('#hm-confirm', () => {
        if (blocked)
            return;
        if (selectedHabitat)
            commit({ type: 'harmonies-cube', card: selectedHabitat.card, origin: selectedHabitat.origin, rotation: selectedHabitat.rotation });
        else if (preview)
            commit(preview);
    });
    const confirmPiece=(event:MouseEvent)=>{
     if(blocked||(!preview&&!selectedHabitat))return;const target=event.target as Element;
     if(target.closest('#hm-confirm,.hm-board-sidebar,.hm-board-controls')||!target.closest('.hm-board-viewport'))return;
     const img=root.querySelector<HTMLImageElement>('.chosen-board .hm-stack>.hm-animal-sprite.is-preview>img,.chosen-board .hm-token.ghost>img');if(!img||!img.complete||!img.naturalWidth)return;
     const r=img.getBoundingClientRect(),scale=Math.min(r.width/img.naturalWidth,r.height/img.naturalHeight),w=img.naturalWidth*scale,h=img.naturalHeight*scale,position=getComputedStyle(img).objectPosition.split(' '),px=parseFloat(position[0])/100||.5,py=parseFloat(position[1])/100||.5,x=(event.clientX-r.x-(r.width-w)*px)/scale,y=(event.clientY-r.y-(r.height-h)*py)/scale;
     if(x<0||y<0||x>=img.naturalWidth||y>=img.naturalHeight)return;
     const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const ctx=canvas.getContext('2d')!;ctx.drawImage(img,0,0);if(ctx.getImageData(Math.floor(x),Math.floor(y),1,1).data[3]<32)return;
     event.preventDefault();event.stopImmediatePropagation();root.querySelector<HTMLButtonElement>('#hm-confirm')?.click();
    };
    root.addEventListener('click',confirmPiece,true);const previousCleanup=repositionCleanup;repositionCleanup=()=>{previousCleanup?.();root.removeEventListener('click',confirmPiece,true);};
    bind('#hm-end', () => { if (acting && canEnd && !preview && !selectedHabitat) commit({ type: 'harmonies-end' }); });

    root.querySelectorAll<HTMLButtonElement>('[data-last-round-status]').forEach(b=>b.onclick=e=>{e.stopPropagation();showLastRound();});
    bind('#hm-scoring', () => { menuDialog?.close();openScoringGuide(v); });
    bind('#hm-help', () => { menuDialog?.close();openGuide(v); });
    bind('#hm-show-results', () => { scoreDismissed = ''; revealedResults=v.code+':'+v.sequence;results(v, rerender); });
    for (const button of root.querySelectorAll<HTMLButtonElement>('button')) {
        const handler = button.onclick;
        if (handler && !button.matches('[data-group],[data-claim],#hm-confirm,#hm-end'))
            button.onclick = function (event) { document.dispatchEvent(new CustomEvent('gameverse-audio', { detail: 'select' })); return handler.call(this, event); };
    }
    if (v.sequence !== sequence && !snapshot && !harmoniesReducedMotion()) {
        const special=v.event?.card&&ANIMAL[v.event.card]?.kind&&['spirit','card','cube'].includes(v.event.kind)?v.event.card:undefined;
        if(special)for(const seal of root.querySelectorAll<HTMLElement>(`[data-ui-key="owned-${special}"] .hm-special-seal`))seal.animate([{transform:'scale(1)',filter:'brightness(1)'},{transform:'scale(1.22)',filter:'brightness(1.8) drop-shadow(0 0 8px #fff4a6)'},{transform:'scale(1)',filter:'brightness(1)'}],{duration:1100,easing:'ease-out'});
        for (const id of incoming) root.querySelector<HTMLElement>(`[data-market-card="${id}"]`)?.animate([{opacity:.6},{opacity:1}], {duration:140,easing:'ease-out'});
    }
    if(finalNotice){lastRoundSeen=finalKey;if(finalRound!.ownLastTurn)lastRoundTurnSeen=finalTurnKey;showLastRound();}
    else if(finalRound&&lastRoundDialog&&lastRoundDialog.dataset.turn!==String(v.turnCount))showLastRound(false);
    if(turnReminder&&!turnDialog&&!finalNotice){
        detail?.close();guideDialog?.close();
        turnDialog=infoDialog('เพื่อนเล่นเสร็จแล้ว ถึงตาคุณ',`<div class="hm-turn-reminder">${terrainScene(['wood','leaf'])}<p>คุณกำลังดูสวนเพื่อนอยู่ กลับไปสร้างสวนของคุณต่อได้แล้ว</p><button id="hm-return-home">กลับไปสวนของคุณ</button><button id="hm-stay-here">ดูสวนเพื่อนต่อ</button></div>`,'hm-turn-dialog');
        turnDialog.querySelector<HTMLButtonElement>('#hm-return-home')!.onclick=()=>{turnDialog?.close();tab=mine!.id;expanded=false;rerender();};
        turnDialog.querySelector<HTMLButtonElement>('#hm-stay-here')!.onclick=()=>turnDialog?.close();
    }
    sequence = v.sequence!;
    if (v.phase === 'finished')
        results(v, rerender);
}
export { habitatDiagram, cardFace, boardAnimalFigure } from './harmonies-presentation.js';

/** Preload only public/current-player artwork needed by the first board view. */
export function harmoniesEntryAssets(v:HarmoniesView,style:import('./harmonies-presentation.js').HarmoniesCardArt){
 setHarmoniesCardArt(style);
 const cards=[...new Set([...(v.market??[]),...v.players.flatMap(p=>p.cards.map(c=>c.card)),...(v.me??v.displayControl)?.spiritChoices??[]])];
 const figures=[...new Set(v.players.flatMap(p=>p.board.flatMap(c=>[c.cube?.card,c.whisper?.card,...(c.sanctuaryCubes??[]).map(x=>x.card)]).filter((id):id is string=>!!id)))];
 const temples=v.players.flatMap(p=>(p.sanctuaries??[]).map(t=>sanctuaryFace(t.tile,t.complete,undefined,true)+(t.complete?sanctuaryBoardModel(t.tile,4,style==='original'):'')));
 const choices=(v.me??v.displayControl)?.spiritChoices??[];
 const markup=cards.map(id=>cardFace(id,0,false,harmoniesLowEffects(),false)).join('')+choices.map(id=>cardFace(id,0,true,false,false)).join('')+figures.map(id=>boardAnimalFigure(id)).join('')+temples.join('');
 const images=[...markup.matchAll(/<(?:img|image)\b[^>]*?\b(?:src|href)="([^"]+)"/g)].map(m=>m[1]).filter(src=>src.startsWith('/'));
 return [...new Set([...images,...(['water','rock','wood','leaf','field','building']as const).map(t=>`/art/harmonies/${style==='sculpted'?'tokens-v5':'tokens-soft-v1'}/${t}.png${style==='sculpted'?'?v=geometry-3':''}`),style==='sculpted'?'/art/harmonies/reference/forest-river.webp':'/art/harmonies/habitat-v4/background.webp'])];
}
