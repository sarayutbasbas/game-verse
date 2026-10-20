import {updateRoomRestart} from './room-restart.js';
import QRCode from 'qrcode';
import { placementReason, habitats } from '../games/harmonies/engine.js';
import { patchHTML } from './dom-patch.js';
import { avatar } from './account.js';
import { esc } from './platform.js';
import type { RoomAction } from '../shared/types.js';
import type { HarmoniesView, Cell, Habitat, Terrain } from '../games/harmonies/types.js';
import { ANIMAL, COORDS, NAMES, terrain } from '../games/harmonies/data.js';
import './harmonies.css';
import { terrainScene } from './harmonies-scenes.js';
import { lastRoundInfo } from './harmonies-last-round.js';
import { harmoniesGuide } from './harmonies-guide.js';
import { TERRAIN_PAINT as PALETTE, animalArt, animalFigure, terrainIcon, cylinder, cardFace } from './harmonies-presentation.js';
const disk = (t: Terrain, extra = '') => `<span class="hm-disk ${extra}" style="--paint:${PALETTE[t]}" title="${NAMES[t]}">${terrainIcon(t)}</span>`;
let code = '', selectedToken = '', selectedCell = -1, tab = '', selectedHabitat: Habitat | undefined, showMatches = '', sequence = -1;
let expanded = false, highlightAnimal = '', displayMode = '', camera: 'tilt' | 'top' = 'tilt';
let marketLayout: (string | null)[] = [];
const crown = '<svg class="hm-crown" viewBox="0 0 32 28" width="28" height="25" role="img" aria-label="ผู้ชนะ"><path d="m3 7 7 6 6-10 6 10 7-6-3 17H6z" fill="#e6b742" stroke="#795313" stroke-width="2"/></svg>';
let lastRoundDialog: HTMLDialogElement | undefined, lastRoundSeen='', lastRoundTurnSeen='';
let guideDialog: HTMLDialogElement | undefined, turnDialog: HTMLDialogElement | undefined, lastObservedTurn = '';
let publicHabitatKey = '', publicHabitatMatches: Habitat[] = [];
let repositionCleanup: (() => void) | undefined;
let choiceDialog: HTMLDialogElement | undefined, choiceRevision = -1;
let revealedResults = '', resultsCleanup: (() => void) | undefined;
let error = '', scoreDismissed = '', scoreDialog: HTMLDialogElement | undefined, detail: HTMLDialogElement | undefined;
export function closeHarmonies() { lastRoundDialog?.remove();lastRoundDialog=undefined; guideDialog?.remove();guideDialog=undefined;turnDialog?.remove();turnDialog=undefined; choiceDialog?.remove(); choiceDialog = undefined; resultsCleanup?.(); resultsCleanup = undefined; repositionCleanup?.(); repositionCleanup = undefined; scoreDialog?.remove(); scoreDialog = undefined; detail?.remove(); detail = undefined; document.documentElement.classList.remove('harmonies-modal-open'); }
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
    const d=document.createElement('dialog');d.className=`hm-dialog ${cls}`;d.tabIndex=-1;
    d.setAttribute('aria-label',title);
    d.innerHTML=`<header class="hm-info-header"><h2>${title}</h2><button class="hm-info-close" aria-label="ปิด">×</button></header><div class="hm-info-content">${body}</div>`;
    d.querySelector<HTMLButtonElement>('.hm-info-close')!.onclick=()=>d.close();
    let outsideDown=false;
    const outside=(e:MouseEvent)=>{const r=d.getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom;};
    d.onpointerdown=e=>{outsideDown=e.target===d&&outside(e);};
    d.onclick=e=>{if(outsideDown&&e.target===d&&outside(e))d.close();};
    d.onclose=()=>{d.remove();if(guideDialog===d)guideDialog=undefined;if(turnDialog===d)turnDialog=undefined;modalLock();};
    document.body.append(d);d.showModal();d.focus({preventScroll:true});modalLock();return d;
}
function openGuide(v:HarmoniesView) {guideDialog?.close();guideDialog=infoDialog('วิธีเล่นและการนับคะแนน',harmoniesGuide(v.side,v.options),'hm-guide-dialog');}
function firstAnimalScene(p:HarmoniesView['players'][number]) { const cell=p.board.find(c=>c.cube);return terrainScene(cell?cell.stack.map(terrain):['field'],cell?.cube?.card); }
function terrainScores(p:HarmoniesView['players'][number],side:'A'|'B') {
    return [['ต้นไม้',['wood','leaf'],p.score.trees],['ภูเขา',['rock','rock'],p.score.mountains],['ทุ่งดอกไม้',['field'],p.score.fields],['อาคาร',['wood','building'],p.score.buildings],[side==='B'?'หมู่เกาะ':'แม่น้ำ',['water'],p.score.water]].map(([name,stack,points])=>`<div>${terrainScene(stack as Terrain[])}<dt>${name}</dt><dd>${points}</dd></div>`).join('');
}
function cardDetail(v: HarmoniesView, id: string) {
    detail?.remove();
    const d = detail = document.createElement('dialog');
    d.className = 'hm-dialog hm-detail';
    d.setAttribute('aria-labelledby', 'hm-detail-title');
    d.innerHTML = `<div class="hm-detail-header"><h2 id="hm-detail-title">${ANIMAL[id].name}</h2><button class="hm-close" aria-label="ปิด"><svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/></svg></button></div><div class="hm-detail-content"><div class="hm-large-card">${cardFace(id, v.players.flatMap(p => p.cards).find(c => c.card === id)?.placed, true)}</div><p>${ANIMAL[id].description??'หมุนได้ 6 ทิศ • ความสูงต้องตรง • อาคารใช้ฐานแดง/ลำต้น/หินได้'}</p><dl class="hm-detail-requirements" style="--requirement-columns:${ANIMAL[id].pattern.length}">${ANIMAL[id].pattern.map((p, i) => `<div><dt>ช่องที่ ${i + 1}</dt><dd>${p.stack[0] === 'building' && (ANIMAL[id].kind!=='whisper'||p.stack.length===2) ? '<span>อาคาร 2 ชั้น</span><span>ฐาน: แดง / ลำต้น / หิน</span>' : p.stack.map(t => `<span>${NAMES[t]}${t==='building'?' 1 ชั้น':''}</span>`).join('')}${p.cube ? `<em>${ANIMAL[id].kind==='whisper'?'วางเสียงกระซิบ':ANIMAL[id].kind==='spirit'?'วางจิตวิญญาณ':'วางสัตว์'}</em>` : ''}</dd></div>`).join('')}</dl></div>`;
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
function scoreRows(v: HarmoniesView) { return [...v.players].sort((a,b)=>b.score.total-a.score.total||b.score.cubes-a.score.cubes).map(p => `<section data-ui-key="score-${p.id}" class="hm-score-player ${v.winners?.includes(p.id) ? 'winner' : ''}">${avatar(p)}<h3>${v.winners?.includes(p.id) ? crown : ''}${esc(p.name)}${p.id === v.me?.id ? ' (คุณ)' : ''}<small>สัตว์ ${p.score.cubes} ตัว</small></h3><b data-total="${p.score.total}">${p.score.total}</b><dl>${terrainScores(p,v.side)}<div>${firstAnimalScene(p)}<dt>สัตว์</dt><dd>${p.score.animalTotal}</dd></div>${p.score.spiritTotal!==undefined?`<div><dt>จิตวิญญาณ</dt><dd>${p.score.spiritTotal}</dd></div>`:''}${p.score.whisperTotal!==undefined?`<div><dt>เสียงกระซิบ</dt><dd>${p.score.whisperTotal}</dd></div>`:''}</dl><details><summary>คะแนนการ์ดแต่ละใบ</summary>${[...p.score.animals,...p.score.spirits??[],...p.score.whispers??[]].map(c=>`<p>${ANIMAL[c.card].name}: ${c.points} คะแนน • ${c.placed} ตัว</p>`).join('')||'<p>ไม่มีการ์ดสัตว์</p>'}</details></section>`).join(''); }
function comparisonTable(v:HarmoniesView) {
    return `<div class="hm-comparison-scroll"><table class="hm-comparison"><caption>คะแนนทุกสวน</caption><thead><tr><th scope="col">ผู้เล่น</th><th scope="col">รวม</th><th scope="col">สัตว์</th><th scope="col">จิตวิญญาณ</th><th scope="col">เสียงกระซิบ</th><th scope="col">ต้นไม้</th><th scope="col">ภูเขา</th><th scope="col">ทุ่ง</th><th scope="col">อาคาร</th><th scope="col">${v.side==='A'?'แม่น้ำ':'เกาะ'}</th></tr></thead><tbody>${[...v.players].sort((a,b)=>b.score.total-a.score.total||b.score.cubes-a.score.cubes).map(p=>`<tr class="${v.winners?.includes(p.id)?'is-winner':''}"><th scope="row">${esc(p.name)}</th>${[p.score.total,p.score.animalTotal,p.score.spiritTotal??0,p.score.whisperTotal??0,p.score.trees,p.score.mountains,p.score.fields,p.score.buildings,p.score.water].map(n=>`<td>${n}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function results(v: HarmoniesView, onRevealed: () => void) {
    const key = v.code + ':' + v.sequence;
    if (scoreDialog || scoreDismissed === key) return;
    const d = scoreDialog = document.createElement('dialog');
    d.className = 'hm-dialog hm-results hm-reveal-dialog';
    d.setAttribute('aria-label', 'ผลเกม Harmonies');
    d.innerHTML = `<header class="hm-reveal-header"><h2>ทุกสวนมีเรื่องราว</h2><button id="hm-reveal-skip">ข้ามไปดูผู้ชนะ</button><button id="hm-ok" aria-label="ปิดผลเกม">×</button></header><div class="hm-reveal-content"></div>`;
    document.body.append(d);
    const content = d.querySelector<HTMLElement>('.hm-reveal-content')!;
    let timer: ReturnType<typeof setTimeout> | undefined, playerIndex = 0;
    const cancel = () => { if (timer !== undefined) clearTimeout(timer); timer = undefined; };
    resultsCleanup = cancel;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const table = () => {
        cancel();
        revealedResults = key;
        d.querySelector<HTMLButtonElement>('#hm-reveal-skip')!.hidden = true;
        content.innerHTML = `<h3 class="hm-reveal-title">สวนที่น่าจดจำ</h3>${comparisonTable(v)}${scoreRows(v)}<button id="hm-reveal-done">กลับไปดูกระดาน</button>`;
        content.querySelector<HTMLButtonElement>('#hm-reveal-done')!.onclick = () => d.close();
        d.scrollTop = 0;
        onRevealed();
    };
    const winner = (immediate = false) => {
        cancel();d.querySelector<HTMLButtonElement>('#hm-reveal-skip')!.hidden=true;
        let winnerIndex=0;
        const showWinner=()=>{
            const winners=v.players.filter(p=>v.winners?.includes(p.id)),p=winners[winnerIndex];
            content.innerHTML=`<section class="hm-winner-spotlight" data-winner="${p.id}"><div class="hm-winner-crown">${crown}</div><p>${winners.length>1?'ผู้ชนะร่วม · '+(winnerIndex+1)+' / '+winners.length:v.options?.solo?'ผลสวนของคุณ':'สวนที่เปล่งประกายที่สุด'}</p>${avatar(p)}<h3>${esc(p.name)}</h3><div class="hm-winner-garden">${terrainScene(['wood','wood','leaf'])}${firstAnimalScene(p)}${terrainScene(['rock','rock'])}</div><b data-winner-total="${p.score.total}">${p.score.total}<small>คะแนน</small></b>${v.options?.solo?`<p class="hm-solo-suns">${'☀'.repeat(v.soloSuns??0)}<b>${v.soloSuns??0} ดวงอาทิตย์</b></p>`:''}<p>${v.options?.solo?'คะแนนจากภูมิประเทศ สัตว์ และโหมดที่เลือก':winners.length>1?'คะแนนและจำนวนสัตว์เท่ากัน จึงชนะร่วมกัน':v.players.some(other=>other.id!==p.id&&other.score.total===p.score.total)?'คะแนนเสมอ ตัดสินด้วยจำนวนสัตว์ที่วางได้มากกว่า':'คะแนนรวมสูงสุด'}</p><button id="hm-winner-next">${winnerIndex+1<winners.length?'ดูผู้ชนะร่วมคนถัดไป':'ดูตารางคะแนนทั้งหมด'}</button></section>`;
            content.querySelector<HTMLButtonElement>('#hm-winner-next')!.onclick=()=>{if(++winnerIndex<winners.length)showWinner();else table();};
            d.scrollTop=0;
            document.dispatchEvent(new CustomEvent('gameverse-audio',{detail:'finish'}));
        };
        if(immediate){showWinner();return;}
        content.innerHTML=`<div class="hm-winner-pause" role="status">${terrainScene(['wood','wood','leaf'])}<h3>ทุกสวนเล่าเรื่องครบแล้ว</h3><p>อีกสักครู่… มาลุ้นสวนที่ได้คะแนนสูงสุดด้วยกัน</p></div>`;
        d.scrollTop=0;timer=setTimeout(showWinner,1200);
    };
    const garden = () => {
        cancel();
        const p = v.players[playerIndex];
        const animals = [...p.score.animals.flatMap(card => Array.from({length:card.placed},(_,i) => ({card:card.card,points:ANIMAL[card.card].points[i] - (i ? ANIMAL[card.card].points[i-1] : 0)}))),...[...p.score.spirits??[],...p.score.whispers??[]].filter(c=>c.placed).map(c=>({card:c.card,points:c.points}))];
        content.innerHTML = `<div class="hm-reveal-player">${avatar(p)}<div><small>สวนที่ ${playerIndex+1} / ${v.players.length}</small><h3>${esc(p.name)}</h3></div></div><p class="hm-reveal-status" role="status">กำลังเปิดสวน…</p><div class="hm-reveal-animals"></div><div class="hm-reveal-subtotal"><span>คะแนนสัตว์</span><b>0</b></div><div class="hm-reveal-terrain" hidden><h4>คะแนนภูมิประเทศ</h4><dl>${terrainScores(p,v.side)}</dl></div><button id="hm-reveal-next" disabled>${playerIndex+1 < v.players.length ? 'ดูสวนของ ' + esc(v.players[playerIndex+1].name) : 'ลุ้นผู้ชนะ'}</button>`;
        d.scrollTop = 0;
        const status = content.querySelector<HTMLElement>('.hm-reveal-status')!, stage = content.querySelector<HTMLElement>('.hm-reveal-animals')!, subtotal = content.querySelector<HTMLElement>('.hm-reveal-subtotal b')!;
        let index = 0, points = 0;
        const step = () => {
            if (!d.isConnected) return;
            if (index >= animals.length) {
                status.textContent = animals.length ? `เปิดสัตว์ครบ ${animals.length} ตัวแล้ว` : 'สวนนี้ยังไม่มีสัตว์';
                content.querySelector<HTMLElement>('.hm-reveal-terrain')!.hidden = false;
                content.querySelector<HTMLButtonElement>('#hm-reveal-next')!.disabled = false;
                return;
            }
            const animal = animals[index++], item = document.createElement('figure');
            item.className = 'hm-revealed-animal';
            item.innerHTML = `${terrainScene((p.board.find(c=>c.cube?.card===animal.card)?.stack??[]).map(terrain),animal.card)}<figcaption>${ANIMAL[animal.card].name}<b>+${animal.points}</b></figcaption>`;
            stage.append(item);
            if (!reduce) item.animate([{opacity:0},{opacity:1}],{duration:180,easing:'ease-out'});
            points += animal.points; subtotal.textContent = String(points);
            status.textContent = `สัตว์ตัวที่ ${index} / ${animals.length}`;
            document.dispatchEvent(new CustomEvent('gameverse-audio',{detail:'cube'}));
            if (reduce) { while (index < animals.length) { const next = animals[index++], extra=document.createElement('figure');extra.className='hm-revealed-animal';extra.innerHTML=`${terrainScene((p.board.find(c=>c.cube?.card===next.card)?.stack??[]).map(terrain),next.card)}<figcaption>${ANIMAL[next.card].name}<b>+${next.points}</b></figcaption>`;stage.append(extra);points+=next.points;}subtotal.textContent=String(points);step(); }
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
    const brand = root.closest('main')?.querySelector<HTMLAnchorElement>('.game-header .brand');
    if (brand) {
        brand.textContent = 'Harmonies';
        brand.setAttribute('aria-label', 'Harmonies — กลับหน้าเลือกเกม');
    }
    displayMode = v.displayMode || 'full-mobile';
    if (choiceDialog && (choiceRevision !== v.revision || blocked || v.phase !== 'playing')) { const stale=choiceDialog;choiceDialog=undefined;stale.close(); }
    const scoresRevealed = revealedResults === v.code + ':' + v.sequence;
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
        if(publicHabitatKey!==key){publicHabitatKey=key;publicHabitatMatches=habitats(activePlayer);}
    }
    const observerAnimals=activePlayer&&!acting&&v.phase==='playing'?activePlayer.cards.map(c=>({card:c.card,count:Math.min(ANIMAL[c.card].points.length-c.placed,new Set(publicHabitatMatches.filter(m=>m.card===c.card).map(m=>m.cell)).size)})).filter(c=>c.count>0):[];
    const matches = (controller?.habitats ?? []).filter(m => !showMatches || showMatches === '*' || m.card === showMatches);
    marketLayout = marketLayout.map(id => id && v.market?.includes(id) ? id : null);
    const incoming = (v.market ?? []).filter(id => !marketLayout.includes(id));
    for (const id of incoming) {
        const hole = marketLayout.indexOf(null);
        if (hole >= 0)
            marketLayout[hole] = id;
        else
            marketLayout.push(id);
    }
    const availableAnimals = acting ? mine!.cards.map(c => ({ card: c.card, count: Math.min(ANIMAL[c.card].points.length - c.placed, new Set((controller?.habitats ?? []).filter(m => m.card === c.card).map(m => m.cell)).size) })).filter(c => c.count > 0) : [];
    const preview = !showMatches ? legal.find(a => a.type === 'harmonies-place' && a.token === selectedToken && a.cell === selectedCell) : undefined, canEnd = legal.some(a => a.type === 'harmonies-end');
    function board(p: HarmoniesView['players'][number]) { return `<div class="hm-board-viewport ${highlightAnimal ? 'is-inspecting' : ''}" data-side="${v.side}"><div class="hm-board" data-board="${p.id}" style="--tilt:${camera === 'tilt' ? 36 : 0}deg;--angle:0deg;--zoom:1">${p.board.map((cell, i) => { const q = COORDS[i].q, y = COORDS[i].r + q / 2, own = p.id === mine?.id, valid = acting && own && !showMatches && legal.some(a => a.type === 'harmonies-place' && a.token === selectedToken && a.cell === i), hab = acting && own && showMatches && matches.some(m => m.cell === i), ghost = own && preview && selectedCell === i, confirming = acting && own && tab === mine!.id && (ghost || selectedHabitat?.cell === i), confirmationHeight = cell.stack.length + (ghost ? 1 : 0); return `<div data-ui-key="cell-${i}" data-owner="${p.id}" data-cell="${i}" class="hm-cell ${valid ? 'legal' : ''} ${hab ? 'habitat' : ''} ${cell.cube?.card === highlightAnimal||cell.whisper?.card===highlightAnimal ? 'animal-location' : ''} ${selectedCell === i && own ? 'selected' : ''} ${selectedHabitat?.cells.includes(i) && own ? 'pattern-match' : ''}" style="--x:${13 + q * 17.25}%;--y:${10.3 + y * 19.9}%"><span class="hm-hex-wall" aria-hidden="true"></span><button class="hm-cell-hit" aria-label="ช่อง ${i + 1}: ${cell.stack.map(id => NAMES[terrain(id)]).join(' / ') || 'ว่าง'}${cell.cube ? ' • ' + (ANIMAL[cell.cube.card].kind==='spirit'?'สัตว์วิเศษ ':'') + ANIMAL[cell.cube.card].name : ''}${cell.whisper?' • เสียงกระซิบ '+ANIMAL[cell.whisper.card].name:''}"><span class="hm-cell-number">${i + 1}</span></button><span class="hm-stack" data-preserve-content data-ui-key="stack-${i}-${cell.stack.join('/')}-${cell.cube?.card ?? ''}-${cell.whisper?.card??''}-${ghost ? selectedToken : ''}-${own && selectedHabitat?.cell === i ? selectedHabitat.card : ''}" aria-hidden="true">${cell.stack.map((id, k) => cylinder(terrain(id), k, false, PALETTE[terrain(id)], true, k > 0 && terrain(cell.stack[k - 1]) === terrain(id))).join('')}${ghost ? cylinder(terrain(selectedToken), cell.stack.length, true, PALETTE[terrain(selectedToken)], true, cell.stack.length > 0 && terrain(cell.stack.at(-1)!) === terrain(selectedToken)) : ''}${cell.cube ? animalFigure(cell.cube.card, cell.stack.length) : ''}${cell.whisper?animalFigure(cell.whisper.card,cell.stack.length):''}${own && selectedHabitat?.cell === i ? animalFigure(selectedHabitat.card, cell.stack.length, true) : ''}</span>${confirmationHeight > 1 ? `<span class="hm-height" aria-hidden="true">×${confirmationHeight}</span>` : ''}${confirming ? `<button id="hm-confirm" class="hm-tile-confirm" data-tile-confirm="${i}" data-placement="${selectedHabitat ? 'animal' : 'terrain'}" aria-label="${selectedHabitat ? 'ยืนยันวางสัตว์' : 'ยืนยันวางชิ้นไม้'}" title="ยืนยัน • แตะช่องเดิมเพื่อยกเลิก" style="--confirm-level:${confirmationHeight};--confirm-offset:${camera === 'tilt' ? 14 - 2 * confirmationHeight : -2 * Math.max(0,confirmationHeight - 1)}px" ${blocked ? 'disabled' : ''}><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="m5 12 4 4L19 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></button>` : ''}</div>`; }).join('')}</div>${ownControls(p)}</div>`; }
    function ownControls(p: HarmoniesView['players'][number]) {
        if (v.phase === 'finished')
            return `<aside class="hm-board-sidebar" aria-label="ช่องชิ้นไม้หลังจบเกม"><div class="hm-header-hand">${Array.from({length:3},(_,i) => `<span class="hm-hand-slot" aria-label="ช่องชิ้นไม้ ${i+1} ว่าง" role="img"></span>`).join('')}</div></aside>`;
        if (p.id !== mine?.id) {
            const active=p.id===v.turn,observed=active?observerAnimals:[];
            return `<aside class="hm-board-sidebar hm-observer-controls" aria-label="ชิ้นไม้และสัตว์ของ ${esc(p.name)}"><div class="hm-header-hand" aria-label="ชิ้นไม้ที่เหลือในตานี้">${Array.from({length:3},(_,i)=>{const token=active?v.hand?.[i]:undefined;return token?`<span class="hm-observed-token" role="img" aria-label="${NAMES[terrain(token)]}">${disk(terrain(token))}</span>`:`<span class="hm-hand-slot" role="img" aria-label="ช่องชิ้นไม้ ${i+1} ว่าง"></span>`;}).join('')}</div>${observed.length?`<div class="hm-animal-choices" aria-label="สัตว์ที่เพื่อนวางได้">${observed.map(c=>`<button class="hm-observed-animal" data-detail="${c.card}" aria-label="ดู ${ANIMAL[c.card].name} วางได้ ${c.count} ตัว">${animalFigure(c.card,0,false,true)}${c.count>1?`<span class="hm-available-count">x${c.count}</span>`:''}</button>`).join('')}</div>`:'<span class="hm-animal-choices-empty" aria-hidden="true"></span>'}<span class="hm-observer-label">${active?'กำลังเล่น':'รอเล่น'}</span></aside>`;
        }
        const candidates = selectedCell >= 0 && showMatches ? matches.map((m, index) => ({ m, index })).filter(({ m }) => m.cell === selectedCell) : [];
        return `<aside class="hm-board-sidebar" aria-label="ชิ้นไม้และจบตา"><div class="hm-header-hand" aria-label="ชิ้นไม้ในตานี้">${Array.from({length:3},(_,i) => { const t=acting ? v.hand?.[i] : undefined; return t ? `<button data-token="${t}" aria-label="เลือก${NAMES[terrain(t)]}" aria-pressed="${!showMatches && selectedToken === t}" ${blocked ? 'disabled' : ''}>${disk(terrain(t))}</button>` : `<span class="hm-hand-slot" aria-label="ช่องชิ้นไม้ ${i+1} รอหยิบ" role="img"></span>`; }).join('')}</div>${availableAnimals.length ? `<div class="hm-animal-choices" aria-label="สัตว์ที่วางได้ในตานี้">${availableAnimals.map(c => `<button data-ui-key="available-${c.card}" data-available-animal="${c.card}" data-available-count="${c.count}" aria-label="เลือกวาง${ANIMAL[c.card].name} วางได้ ${c.count} ตัว" aria-pressed="${showMatches === c.card}" ${blocked ? 'disabled' : ''}>${animalFigure(c.card, 0, false, true)}${c.count > 1 ? `<span class="hm-available-count">x${c.count}</span>` : ''}</button>`).join('')}</div>` : '<span class="hm-animal-choices-empty" aria-hidden="true"></span>'}<button id="hm-end" ${blocked || !acting || !canEnd || !!preview || !!selectedHabitat ? 'disabled' : ''}>จบตา</button></aside><div class="hm-board-modes"><button data-board-mode="terrain" ${!acting || blocked ? 'disabled' : ''} aria-pressed="${!showMatches}">ชิ้นไม้</button><button data-board-mode="animal" ${!acting || blocked ? 'disabled' : ''} aria-pressed="${!!showMatches}">วางสัตว์</button></div><div class="hm-board-controls" data-ui-key="board-controls"><p role="status">${!acting ? 'รอตาของคุณ' : error || selectedHabitat ? error || 'แตะ ✓ เพื่อวาง • แตะช่องเดิมเพื่อยกเลิก' : preview ? 'แตะ ✓ เพื่อวาง • แตะช่องเดิมเพื่อยกเลิก' : showMatches ? 'แตะช่องที่มีกรอบเพื่อเลือกสัตว์' : 'แตะช่องเพื่อดูตัวอย่าง'}</p>${candidates.length > 1 ? `<div class="hm-board-choices">${candidates.map(({ m, index }) => `<button data-habitat="${index}" aria-pressed="${selectedHabitat?.card === m.card && selectedHabitat.origin === m.origin && selectedHabitat.rotation === m.rotation}">${esc(ANIMAL[m.card].name)} • แบบ ${m.rotation + 1}</button>`).join('')}</div>` : ''}<div class="hm-board-footer"></div></div>`;
    }
    function showLastRound(animate = true) {
        if(!finalRound)return;
        lastRoundDialog?.close();turnDialog?.close();detail?.close();guideDialog?.close();
        const ownRemaining=finalRound.remaining.some(p=>p.id===v.me?.id);
        const d=lastRoundDialog=infoDialog(finalRound.ownLastTurn?'นี่คือตาสุดท้ายของคุณ':'เข้าสู่รอบสุดท้ายแล้ว',`<div class="hm-last-round-hero"><span class="hm-last-round-emblem" aria-hidden="true">${terrainScene(['wood','wood','leaf'])}</span><b>${finalRound.count===1?'ตาสุดท้ายของเกม':'รอบสุดท้าย'}</b><p>${finalRound.reason}</p></div><p class="hm-last-round-explain">เล่นต่อเฉพาะผู้เล่นที่เหลือในรอบนี้ แล้วนับคะแนน ทุกคนจะได้เล่นจำนวนตาเท่ากัน</p><ol class="hm-last-round-queue">${finalRound.remaining.map((p,i)=>`<li ${i===0?'aria-current="step"':''}>${avatar(p)}<span>${esc(p.name)}${p.id===v.me?.id?' (คุณ)':''}</span><b>${i===0?'กำลังเล่น':'รอตาสุดท้าย'}</b></li>`).join('')}</ol>${v.me&&!ownRemaining?'<p class="hm-last-round-explain">คุณเล่นตาสุดท้ายไปแล้ว รอเพื่อนเล่นให้ครบก่อนดูผล</p>':''}<button id="hm-last-round-continue">${finalRound.ownLastTurn?'กลับไปเล่นตาสุดท้ายของคุณ':'รับทราบ · ดูตาสุดท้ายต่อ'}</button>`,'hm-last-round-dialog');
        d.dataset.turn=String(v.turnCount);
        d.querySelector<HTMLButtonElement>('#hm-last-round-continue')!.onclick=()=>{d.close();if(finalRound.ownLastTurn){tab=mine!.id;expanded=false;rerender();}};
        d.addEventListener('close',()=>{if(lastRoundDialog===d)lastRoundDialog=undefined;});
        if(animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches)d.querySelector('.hm-last-round-emblem')!.animate([{opacity:0,transform:'translateY(8px) scale(.7)'},{opacity:1,transform:'translateY(0) scale(1.08)'},{opacity:1,transform:'none'}],{duration:650,easing:'ease-out'});
    }
    function ownedCards(p: HarmoniesView['players'][number]) {
        const orderedCards = [...p.cards].sort((a,b) => Number(a.placed >= ANIMAL[a.card].points.length) - Number(b.placed >= ANIMAL[b.card].points.length));
        return `<section class="hm-owned-collection ${p.cards.length > 4 ? 'has-overflow' : ''}" style="--shown-cards:${Math.max(1,Math.min(4,p.cards.length))}"><div class="hm-owned-heading hm-rail-title">${p.id === v.me?.id ? 'สัตว์ของคุณ' : 'สัตว์ของ ' + esc(p.name)}</div><div class="hm-owned-cards ${p.cards.length > 4 ? 'has-overflow' : ''}" data-owned-count="${p.cards.length}" style="--shown-cards:${Math.min(4,p.cards.length)};--owned-columns:${Math.min(6,Math.max(4,p.cards.length))}" aria-label="การ์ดสัตว์ทั้งหมด เลื่อนเพื่อดูเพิ่มเติม">${orderedCards.map(c => `<article data-card-kind="${ANIMAL[c.card].kind??'animal'}" class="hm-animal ${ANIMAL[c.card].kind?'hm-special-card':''} ${c.placed === ANIMAL[c.card].points.length ? 'complete' : ''}" data-ui-key="owned-${c.card}"><button data-detail="${c.card}" class="hm-inspect" aria-label="ดู ${ANIMAL[c.card].name}">${cardFace(c.card,c.placed)}</button>${c.placed >= ANIMAL[c.card].points.length ? '<span class="hm-complete-ribbon">ครบแล้ว</span>' : ''}</article>`).join('') || '<div class="hm-owned-empty" role="status"><svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true"><path d="M15 47c0-8 9-18 17-18s17 10 17 18c0 7-8 10-17 6-9 4-17 1-17-6Z" fill="currentColor"/><ellipse cx="12" cy="26" rx="7" ry="10" transform="rotate(-22 12 26)" fill="currentColor"/><ellipse cx="25" cy="16" rx="7" ry="10" transform="rotate(-8 25 16)" fill="currentColor"/><ellipse cx="40" cy="16" rx="7" ry="10" transform="rotate(8 40 16)" fill="currentColor"/><ellipse cx="53" cy="26" rx="7" ry="10" transform="rotate(22 53 26)" fill="currentColor"/></svg><p>ยังไม่มีการ์ดสัตว์</p></div>'}</div></section>`;
    }
    patchHTML(root, `<div class="hm-root ${controller?.spiritChoices?.length?'hm-choosing-spirit':''} ${v.me ? 'hm-phone' : 'hm-display'} ${v.phase === 'finished' ? 'hm-finished' : ''} ${expanded ? 'hm-expanded' : ''} ${v.me && displayMode === 'shared-table' ? 'hm-shared-table' : ''} ${v.displayControl ? 'hm-display-interactive' : ''}"><h1 class="sr-only">Harmonies</h1><button id="hm-help" class="hm-help-button" aria-label="วิธีเล่นและการนับคะแนน" title="วิธีเล่นและการนับคะแนน"><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M8 8a4 4 0 1 1 6 3.5c-1.3.7-2 1.5-2 3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="18" r="1.3" fill="currentColor"/></svg></button><details class="hm-view-options"><summary aria-label="เมนูกระดานและมุมมอง" title="ตั้งค่าเกม"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 6h14M5 12h14M5 18h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></summary><div class="hm-menu-panel"><header><b>ตั้งค่าเกม</b><button id="hm-menu-close" aria-label="ปิดเมนู">×</button></header><div class="hm-menu-content"><p class="hm-menu-room">ห้อง ${esc(v.code)} · <a class="hm-join-link" href="/play/${esc(v.code)}" target="_blank" rel="noopener">เข้าร่วมด้วยมือถือ</a></p><details class="hm-invite"><summary>QR เข้าห้อง</summary><canvas width="144" height="144" aria-label="QR เข้าห้อง"></canvas></details><p>กองสัตว์เหลือ ${v.deckCount} ใบ</p><p>${[v.options?.solo?'Solo':'',v.options?.natureSpirits?'Nature’s Spirits':'',v.options?.whispers?'Crescendo · เสียงกระซิบ':''].filter(Boolean).join(' · ')}</p><p class="hm-side">ด้าน ${v.side} · ${v.side === 'A' ? 'แม่น้ำ' : 'หมู่เกาะ'}</p><label>โหมดจอกลาง<select id="hm-display-mode" name="display-mode" ${!v.canConfigureDisplay || blocked ? 'disabled' : ''}><option value="full-mobile" ${displayMode === 'full-mobile' ? 'selected' : ''}>จอกลางแสดงผลเท่านั้น</option><option value="shared-table" ${displayMode === 'shared-table' ? 'selected' : ''}>เล่นร่วมกันบนจอกลาง</option></select></label><div class="hm-camera"><button data-camera="tilt" aria-pressed="${camera === 'tilt'}">มุมเอียง</button><button data-camera="top" aria-pressed="${camera === 'top'}">มุมบน</button><button data-camera="reset">คืนมุมเดิม</button></div><nav class="hm-tabs" aria-label="ดูกระดานผู้เล่น">${!mine ? `<button id="hm-overview" aria-pressed="${!expanded}">ดูกระดานทั้งหมด</button>` : ''}${v.players.map(p => `<button data-tab="${p.id}" aria-pressed="${p.id === tab}">${p.id === mine?.id ? 'กระดานคุณ' : esc(p.name)}</button>`).join('')}</nav></div></div></details><section class="hm-supply ${finalRound?'hm-final-round-supply':''}" data-ui-key="supply"><h2>${finalRound ? `<button id="hm-final-round-status" aria-label="รอบสุดท้าย เหลือ ${finalRound.count} ตา แตะดูคิว">${finalRound.ownLastTurn?'ตาสุดท้ายของคุณ':'รอบสุดท้าย'} · เหลือ ${finalRound.count} ตา</button>` : acting && v.picked ? 'เลือกชิ้นไม้วางบนกระดาน' : 'เลือกชุดภูมิประเทศ 1 กลุ่ม'} <small>${v.endAt && v.phase === 'playing' ? 'ตาสุดท้าย · ' : ''}ในถุง ${v.bagCount} ชิ้น</small></h2><div class="hm-groups ${v.options?.solo?'hm-solo-groups':''} ${mine && !acting ? 'is-off-turn' : ''} ${!acting || v.picked ? 'is-waiting' : ''}">${v.groups!.map((g, i) => `<button data-group="${i}" data-group-label="${i + 1}" aria-pressed="${!!v.picked && !g.length}" data-ui-key="group-${i}" ${blocked || !legal.some(a => a.type === 'harmonies-group' && a.group === i) ? 'disabled' : ''} aria-label="รับกลุ่ม ${i + 1} ${g.map(t => NAMES[terrain(t)]).join(' ')}">${g.map(t => disk(terrain(t))).join('') || '<span>หยิบแล้ว</span>'}</button>`).join('')}</div></section><section class="hm-animal-market" data-ui-key="animal-market"><h2 data-deck-source class="hm-rail-title">สัตว์ในสวน</h2><div class="hm-market ${v.options?.solo?'hm-solo-market':''}">${marketLayout.map((id, i) => `<div class="hm-market-slot" data-ui-key="market-slot-${i}">${id ? `<article data-market-card="${id}" data-ui-key="market-${id}" class="hm-animal"><button data-detail="${id}" class="hm-inspect" aria-label="ดู ${ANIMAL[id].name}">${cardFace(id)}</button>${acting ? `${legal.some(a=>a.type==='harmonies-solo-discard'&&a.card===id)?`<button data-solo-discard="${id}" class="hm-solo-discard" aria-label="เปลี่ยนการ์ด ${ANIMAL[id].name} แล้วจบตา" title="เปลี่ยนการ์ด ${ANIMAL[id].name} แล้วจบตา" ${blocked?'disabled':''}><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 8h14m-4-4 4 4-4 4M20 16H6m4-4-4 4 4 4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`:''}<button data-claim="${id}" aria-label="รับการ์ด ${ANIMAL[id].name}" title="รับการ์ด ${ANIMAL[id].name}" ${blocked || !legal.some(a => a.type === 'harmonies-card' && a.card === id) ? 'disabled' : ''}><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></button>` : ''}</article>` : '<div class="hm-market-empty" role="img" aria-label="หยิบแล้ว รอการ์ดใบถัดไป"><span class="hm-market-taken" aria-hidden="true">หยิบแล้ว</span></div>'}</div>`).join('')}</div></section>${controller?.spiritChoices?.length?`<section class="hm-spirit-selection"><h2>เลือกจิตวิญญาณประจำสวน</h2><p>เลือก 1 จาก 2 ใบก่อนเริ่มตาแรก ใบที่เลือกต้องวางคิวบ์สำเร็จจึงจะได้คะแนนพิเศษ</p><div>${controller.spiritChoices.map(id=>`<article class="hm-spirit-offer"><div class="hm-animal"><button data-detail="${id}" class="hm-inspect" aria-label="อ่าน ${ANIMAL[id].name}">${cardFace(id,0,true)}</button></div><p>${ANIMAL[id].description}</p><button data-spirit-choice="${id}" ${blocked?'disabled':''}>เลือก ${ANIMAL[id].name}</button></article>`).join('')}</div></section>`:''}<div class="hm-gardens">${v.players.map((p, i) => `<section data-ui-key="player-${p.id}" class="hm-player ${p.id === tab ? 'chosen-board' : ''} ${p.id === v.turn && v.phase === 'playing' ? 'active' : ''}" data-player="${p.id}"><header>${avatar(p)}<div><h2>${esc(p.name)}${p.id === v.me?.id ? ' (คุณ)' : ''}</h2><small>ผู้เล่น ${i + 1} • ${p.connected ? 'ออนไลน์' : 'รอกลับเข้าห้อง'}</small></div>${v.phase === 'finished' && scoresRevealed ? `<b>${p.score.total}<small>คะแนน</small></b>` : ''}</header>${board(p)}${ownedCards(p)}</section>`).join('')}</div>${v.phase === 'finished' ? `<section class="hm-score-table"><h2>${scoresRevealed ? 'ผลเกม' : 'จบเกมแล้ว'}</h2>${scoresRevealed ? scoreRows(v) : '<p class="hm-await-results">เปิดสวนทีละคน แล้วมาลุ้นผลรวมด้วยกัน</p>'}<div class="hm-final-actions"><button id="hm-show-results">${scoresRevealed ? 'ดูสรุป' : 'เปิดสวนเพื่อดูผล'}</button>${host ? '<button id="hm-restart">เริ่มเล่นใหม่</button>' : ''}</div></section>` : ''}<details class="hm-rules"><summary>กติกาและคะแนน</summary><p>เลือกชิ้นไม้ 1 กลุ่ม วางทั้ง 3 ชิ้นทีละชิ้น รับสัตว์ได้ 1 ใบต่อเทิร์น และวางลูกบาศก์กี่ครั้งก็ได้ก่อน/ระหว่าง/หลังวางชิ้นไม้. รูปแบบและความสูงต้องตรง หมุนได้ 6 ทิศแต่ไม่สะท้อน. ช่องมีสัตว์แล้วห้ามซ้อนเพิ่ม.</p><p>ต้นไม้สูง 1/2/3 = 1/3/7 แต้ม • ภูเขาสูง 1/2/3 = 1/3/7 ถ้าติดภูเขาอื่น • ทุ่งสีเหลืองกลุ่มละ 2+ = 5 • อาคารสูง 2 ที่ติดสีต่างกันอย่างน้อย 3 สี = 5 • ด้าน A: แม่น้ำตามทางสั้นที่สุดที่ยาวที่สุด 1/2/3/4/5/6 = 0/2/5/8/11/15 ต่อไป +4 • ด้าน B: เกาะละ 5 (ช่องว่างนับเป็นแผ่นดิน).</p><p>เหลือช่องว่างไม่เกิน 2 หรือถุงไม่พอเติมเมื่อจบตา เริ่มรอบสุดท้ายให้ทุกคนเล่นจำนวนตาเท่ากัน. คะแนนรวมสูงสุดชนะ เสมอดูจำนวนสัตว์ที่วาง และชนะร่วมถ้ายังเท่ากัน.</p></details></div>`);
    updateRoomRestart(root,v,host,blocked,command);
    const invite = root.querySelector<HTMLDetailsElement>('.hm-invite');
    const joinURL = root.closest('main')?.querySelector<HTMLAnchorElement>('.shared-room-menu .join-link')?.href ?? new URL('/play/' + v.code, location.href).href;
    const joinLink = root.querySelector<HTMLAnchorElement>('.hm-join-link');
    if (joinLink) joinLink.href = joinURL;
    if (invite) invite.ontoggle = () => { if (invite.open) void QRCode.toCanvas(invite.querySelector('canvas'), joinURL, { width: 144, margin: 1 }); };
    repositionCleanup?.();
    const viewMenu = root.querySelector<HTMLDetailsElement>('.hm-view-options');
    const closeMenuOutside = (event: PointerEvent) => { if(viewMenu?.open&&!viewMenu.contains(event.target as Node))viewMenu.open=false; };
    const escapeMenu = (event: KeyboardEvent) => { if(event.key==='Escape'&&viewMenu?.open){event.preventDefault();viewMenu.open=false;viewMenu.querySelector<HTMLElement>('summary')?.focus({preventScroll:true});} };
    document.addEventListener('pointerdown',closeMenuOutside);document.addEventListener('keydown',escapeMenu);
    const closeMenuButton = root.querySelector<HTMLButtonElement>('#hm-menu-close');
    if(closeMenuButton)closeMenuButton.onclick=()=>{if(viewMenu)viewMenu.open=false;};
    const cancelSelection = () => { selectedCell = -1; selectedHabitat = undefined; error = ''; renderHarmonies(root, v, host, blocked, command, true); };
    const escapeSelection = (event: KeyboardEvent) => { if(event.key === 'Escape' && !event.defaultPrevented && !viewMenu?.open && (preview || selectedHabitat) && !document.querySelector('.hm-dialog[open]')) cancelSelection(); };
    document.addEventListener('keydown', escapeSelection);
    repositionCleanup = () => { document.removeEventListener('pointerdown',closeMenuOutside);document.removeEventListener('keydown',escapeMenu);document.removeEventListener('keydown',escapeSelection); };
    const rerender = () => renderHarmonies(root, v, host, blocked, command, true);
    const modeSelect = root.querySelector<HTMLSelectElement>('#hm-display-mode');
    if (modeSelect)
        modeSelect.onchange = () => { if(v.canConfigureDisplay && !blocked) command({type:'harmonies-display-mode',mode:modeSelect.value as 'full-mobile'|'shared-table'}); };
    root.querySelectorAll<HTMLButtonElement>('[data-camera]').forEach(b => b.onclick = () => { camera = b.dataset.camera === 'top' ? 'top' : 'tilt'; rerender(); });
    root.querySelectorAll<HTMLButtonElement>('[data-group]').forEach(b => b.onclick = () => { const group=Number(b.dataset.group);if(b.disabled||!acting||blocked)return;confirmChoice(v,'รับภูมิประเทศกลุ่มนี้?',`<div class="hm-choice-tokens">${v.groups![group].map(t=>disk(terrain(t))).join('')}</div><p>รับชิ้นไม้ทั้ง 3 ชิ้นเพื่อวางในตานี้</p>`,()=>command({type:'harmonies-group',group})); });
    root.querySelectorAll<HTMLButtonElement>('[data-claim]').forEach(b => b.onclick = () => { const card=b.dataset.claim!;if(b.disabled||!acting||blocked)return;confirmChoice(v,ANIMAL[card].kind==='whisper'?'รับการ์ดเสียงกระซิบใบนี้?':'รับการ์ดสัตว์ใบนี้?',`<div class="hm-root hm-choice-full-card" style="--hm-card-height:260px;--hm-card-width:180px"><article class="hm-animal"><div class="hm-inspect">${cardFace(card)}</div></article></div><p>${ANIMAL[card].name}</p>`,()=>command({type:'harmonies-card',card})); });
    root.querySelectorAll<HTMLButtonElement>('[data-solo-discard]').forEach(b=>b.onclick=()=>{if(blocked||!acting)return;const card=b.dataset.soloDiscard!;confirmChoice(v,'เปลี่ยนการ์ดกลางแล้วจบตา?',`<p>ทิ้ง ${ANIMAL[card].name} และเปิดใบใหม่ เมื่อเปลี่ยนแล้วทำได้เพียงจบตานี้</p>`,()=>command({type:'harmonies-solo-discard',card}));});
    root.querySelectorAll<HTMLButtonElement>('[data-spirit-choice]').forEach(b=>b.onclick=()=>{if(blocked||!acting)return;const card=b.dataset.spiritChoice!;confirmChoice(v,'เลือกจิตวิญญาณใบนี้?',`<div class="hm-spirit-confirm-card">${cardFace(card,0,true)}</div><p>${ANIMAL[card].name}</p><p>${ANIMAL[card].description}</p><p>อีกใบจะถูกเก็บออกจากเกม</p>`,()=>command({type:'harmonies-spirit',card}));});
    root.querySelectorAll<HTMLButtonElement>('[data-detail]').forEach(b => b.onclick = () => cardDetail(v, b.dataset.detail!));
    root.querySelectorAll<HTMLButtonElement>('[data-token]').forEach(b => b.onclick = () => { highlightAnimal = ''; selectedToken = b.dataset.token!; selectedCell = -1; selectedHabitat = undefined; showMatches = ''; error = ''; rerender(); });
    root.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(b => b.onclick = () => {
        tab = b.dataset.tab!;
        if (!mine)
            expanded = true;
        rerender();
    });
    root.querySelectorAll<HTMLButtonElement>('[data-matches]').forEach(b => b.onclick = () => { highlightAnimal = ''; showMatches = showMatches === b.dataset.matches ? '' : b.dataset.matches!; tab = mine!.id; selectedHabitat = undefined; selectedCell = -1; error = ''; rerender(); });
    root.querySelectorAll<HTMLButtonElement>('[data-available-animal]').forEach(b => b.onclick = () => { highlightAnimal = ''; showMatches = showMatches === b.dataset.availableAnimal ? '' : b.dataset.availableAnimal!; selectedToken = ''; tab = mine!.id; selectedHabitat = undefined; selectedCell = -1; error = ''; rerender(); });
    root.querySelectorAll<HTMLButtonElement>('[data-habitat]').forEach(b => b.onclick = () => { highlightAnimal = ''; selectedHabitat = matches[Number(b.dataset.habitat)]; selectedCell = selectedHabitat.cell; error = ''; rerender(); });
    root.querySelectorAll<HTMLButtonElement>('[data-cell]').forEach(b => b.onclick = () => {
        const owner = v.players.find(p => p.id === b.dataset.owner)!, i = Number(b.dataset.cell);
        if (owner.board[i].cube && !(acting&&owner.id===mine?.id&&showMatches&&matches.some(m=>m.cell===i))) {
            cardDetail(v, owner.board[i].cube!.card);
            return;
        }
        if (!acting || owner.id !== mine?.id)
            return;
        if (selectedCell === i && (preview || selectedHabitat)) { cancelSelection(); return; }
        highlightAnimal = '';
        document.dispatchEvent(new CustomEvent('gameverse-audio', { detail: 'select' }));
        const m = showMatches ? matches.filter(m => m.cell === i) : [];
        selectedHabitat = m.length === 1 ? m[0] : undefined;
        selectedCell = i;
        error = m.length > 1 ? 'เลือกสัตว์และรูปแบบบนกระดาน' : !m.length && selectedToken && !legal.some(a => a.type === 'harmonies-place' && a.cell === i && a.token === selectedToken) ? placementReason(owner.board[i], terrain(selectedToken)) ?? 'เลือกชิ้นไม้ที่ยังอยู่ในตานี้' : '';
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
    bind('#hm-end', () => { if (acting && canEnd && !preview && !selectedHabitat) commit({ type: 'harmonies-end' }); });

    bind('#hm-final-round-status',()=>showLastRound());
    bind('#hm-help', () => { if(viewMenu)viewMenu.open=false;openGuide(v); });
    bind('#hm-show-results', () => { scoreDismissed = ''; results(v, rerender); });
    bind('#hm-restart', () => command({ type: 'restart' }));
    for (const button of root.querySelectorAll<HTMLButtonElement>('button')) {
        const handler = button.onclick;
        if (handler && !button.matches('[data-group],[data-claim],#hm-confirm,#hm-end'))
            button.onclick = function (event) { document.dispatchEvent(new CustomEvent('gameverse-audio', { detail: 'select' })); return handler.call(this, event); };
    }
    if (v.sequence !== sequence && !snapshot && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
export { habitatDiagram, cardFace } from './harmonies-presentation.js';
