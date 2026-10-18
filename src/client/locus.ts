import { deviceDisplayMode, saveDisplayMode } from './display-mode.js';
import { patchHTML } from './dom-patch.js';
import { avatar } from './account.js';
import { esc } from './platform.js';
import { SHEET, ZONES, INK, LABEL, transform, cellKey, type Zone, type XY, type Ink, type ShapeCard } from '../games/locus/data.js';
import { placementError } from '../games/locus/engine.js';
import type { LocusView, LocusAction, Effect, PublicPlayer } from '../games/locus/types.js';
import type { RoomAction } from '../shared/types.js';
import type { GameEffect } from './turn-sound.js';
import './locus.css';
let autoCount = true;
let countTimer: ReturnType<typeof setTimeout> | undefined;
let room = '', match = '', epoch = '', sheetId = '', selected = '', zone: Zone | '' = '', rotation = 0, mirror = false, wild = false, anchor: XY | null = null, mode = '', resultClosed = false, count = 0, lastSequence = -1, lastDeal = 0, detail = false;
const crown = '<svg width="26" height="24" viewBox="0 0 30 25" role="img" aria-label="ผู้ชนะ"><path d="M3 5l8 7 4-10 5 10 8-7-3 17H6z" fill="#ecc147" stroke="#74500e" stroke-width="2"/></svg>';
const note: Record<Zone, string> = { yellow: 'เติมแถวให้ครบ รับ 8–12 แต้มต่อแถว', purple: 'เชื่อมช่องขอบหนา เครือข่ายที่เชื่อมได้มากที่สุดรับ 6 แต้มต่อช่อง (อย่างน้อย 2 ช่อง)', red: 'เติมกลุ่มให้ครบ รับ 12 / 12 / 14 / 16 แต้ม วางได้โดยไม่ต้องติดของเดิม', green: 'ต่อจากกลางไปปลายทาง ปลายละ 8 แต้ม', blue: 'ขึ้นให้ถึงเส้นคะแนน รับเฉพาะขั้นสูงสุด 8 / 16 / 24 / 32 / 40 / 50' };
function shape(cells: readonly XY[], color: Ink, cls = '') { const a = transform(cells, 0, false), w = Math.max(...a.map(c => c[0])) + 1, h = Math.max(...a.map(c => c[1])) + 1; return `<svg class="lc-shape ${cls}" viewBox="-2 -2 ${w * 22 + 4} ${h * 22 + 4}" role="img" aria-label="รูปทรง ${cells.length} ช่อง สี${LABEL[color]}">${a.map(([x, y]) => `<rect x="${x * 22}" y="${y * 22}" width="21" height="21" rx="2" fill="${color === 'wild' ? 'url(#lc-rainbow)' : INK[color]}" stroke="#f8f4e9" stroke-width="1.2"/>`).join('')}</svg>`; }
const bonus = (color: Ink | 'coin', size: number, x: number, y: number) => color === 'coin' ? `<circle cx="${x}" cy="${y}" r="7" fill="#e9bd4c" stroke="#8e6b22"/><text x="${x}" y="${y + 3}" class="lc-coin-letter">●</text>` : size === 1 ? `<rect x="${x - 6}" y="${y - 6}" width="12" height="12" fill="url(#lc-rainbow)" stroke="#4a5161"/>` : `<rect x="${x - 8}" y="${y - 4}" width="7" height="8" fill="${INK[color]}"/><rect x="${x + 1}" y="${y - 4}" width="7" height="8" fill="${INK[color]}"/>`;
const layouts: Record<Zone, {
    x: number;
    y: number;
    c: number;
}> = { yellow: { x: 12, y: 39, c: 27 }, purple: { x: 12, y: 288, c: 27 }, red: { x: 215, y: 39, c: 26 }, green: { x: 215, y: 283, c: 24 }, blue: { x: 467, y: 39, c: 21 } };
function sheet(p: PublicPlayer, e: Effect | undefined, editable: boolean, animated: string[], overview = false) {
    const zoom = !overview && !!zone, zs = zoom ? [zone as Zone] : ZONES, def = zoom && zone ? SHEET[zone] : null, w = def ? Math.max(220, def.width * 39 + 55) : 590, h = def ? def.height * 39 + 75 : 550;
    const ghost = e && !overview && zone && anchor ? transform(e.cells, rotation, mirror).map(([x, y]) => cellKey(x + anchor![0], y + anchor![1])) : [], error = e && zone && anchor ? placementError(p, e, zone, anchor[0], anchor[1], rotation, mirror, wild) : '';
    return `<svg class="lc-sheet-svg ${zoom ? 'zoom' : ''}" style="${!overview && zone === 'blue' ? 'max-width:250px' : ''}" viewBox="0 0 ${w} ${h}" aria-label="แผ่นผู้เล่น ${esc(p.name)}${zoom && zone ? ' · ' + LABEL[zone] : ''}" role="group">${zs.map(z => { const d = SHEET[z], l = zoom ? { x: 15, y: 39, c: 39 } : layouts[z], starts = new Set(d.starts.map(([x, y]) => cellKey(x, y))), marked = new Set(p.sheet[z]); return `<g class="lc-zone" data-zone="${z}" style="--zone:${INK[z]}"><text x="${l.x}" y="${l.y - 12}" class="lc-zone-title">${LABEL[z]} <tspan>${p.score[z]}</tspan></text>${d.cells.map(([x, y]) => { const jitter=((x*13+y*7+ZONES.indexOf(z)*3)%5-2)*.35; const key = cellKey(x, y), px = l.x + x * l.c, py = l.y + y * l.c, b = d.bonuses[key], g = zone === z && ghost.includes(key), recent = animated.includes(`${z}:${key}`), end = d.ends?.some(c => c[0] === x && c[1] === y); return `<g data-cell="${z}:${key}" ${editable ? `role="button" tabindex="0" aria-label="${LABEL[z]} คอลัมน์ ${x + 1} แถว ${y + 1}${marked.has(key) ? ' กากบาทแล้ว' : ''}${b ? ' โบนัส' + (b.color === 'coin' ? 'เหรียญ' : LABEL[b.color]) : ''}"` : ''} class="lc-cell ${g ? 'ghost ' + (error ? 'invalid' : 'valid') : ''} ${recent ? 'recent' : ''}"><rect x="${px}" y="${py}" width="${l.c - 1}" height="${l.c - 1}" rx="1" fill="${INK[z]}" fill-opacity=".18" stroke="${starts.has(key) ? '#25333c' : end ? INK[z] : '#738084'}" stroke-width="${starts.has(key) || end ? 2.8 : .65}"/>${b ? `<g transform="translate(${px + l.c / 2},${py + l.c / 2}) scale(${zoom ? 1.3 : .95})">${bonus(b.color, b.size, 0, 0)}</g>` : ''}${marked.has(key) ? `<path class="lc-x ${recent ? 'draw' : ''}" style="--delay:${Math.max(0, animated.indexOf(`${z}:${key}`)) * 65}ms" d="M${px + 5+jitter} ${py + 5-jitter}l${l.c - 11-jitter} ${l.c - 12+jitter}M${px + l.c - 6+jitter} ${py + 4}L${px + 5-jitter} ${py + l.c - 6}" pathLength="1"/>` : ''}${g ? `<rect class="lc-ghost-fill" x="${px + 2}" y="${py + 2}" width="${l.c - 5}" height="${l.c - 5}" fill="${error ? '#d23545' : '#213a58'}" fill-opacity=".45" stroke="${error ? '#d23545' : '#213a58'}" stroke-width="2"/>` : ''}</g>`; }).join('')}${z === 'yellow' ? d.rowScores!.map((n, y) => `<text x="${l.x + d.width * l.c + 7}" y="${l.y + (y + .7) * l.c}" class="lc-grid-score">${n}</text>`).join('') : ''}${z === 'red' ? d.groups!.map(g => `<text x="${l.x + (Math.min(...g.cells.map(c => c[0])) + .2) * l.c}" y="${l.y + (Math.max(...g.cells.map(c => c[1])) + 1) * l.c + 13}" class="lc-grid-score">${g.score} แต้ม</text>`).join('') : ''}${z === 'green' ? d.ends!.map(([x, y]) => `<text x="${l.x + (x + .5) * l.c}" y="${l.y + (y + .8) * l.c}" class="lc-end-score">8</text>`).join('') : ''}${z === 'blue' ? d.tiers!.map(([y, score]) => `<path d="M${l.x - 3} ${l.y + (y + 1) * l.c}h${d.width * l.c + 5}" stroke="${INK.blue}" stroke-width="3"/><text x="${l.x + d.width * l.c + 6}" y="${l.y + (y + .7) * l.c}" class="lc-grid-score">${score}</text>`).join('') : ''}</g>`; }).join('')}</svg>`;
}
function marketCard(c: ShapeCard) { return `${shape(c.cells, c.color)}<span class="lc-card-ink">${LABEL[c.color]}${c.coin ? ' · ◉ +1' : ''}</span>`; }
export function renderLocus(root: HTMLElement, v: LocusView, host: boolean, blocked: boolean, command: (a: RoomAction) => void, snapshot: boolean, play: (kind: GameEffect) => void = () => { }) {
    if (room !== v.code || match !== v.matchId) {
        room = v.code;
        match = v.matchId;
        epoch = '';
        selected = '';
        sheetId = v.me?.id ?? v.players[0]?.id ?? '';
        zone = '';
        anchor = null;
        mode = '';
        resultClosed = false;
        count = 0;
        autoCount = true;
        lastSequence = -1;
        lastDeal = 0;
        mode = deviceDisplayMode(v.code);
    }
    if (v.phase === 'finished' && (snapshot && lastSequence < 0 || matchMedia('(prefers-reduced-motion: reduce)').matches))
        count = 6;
    const me = v.me, l = me?.legal, mine = v.players.find(p => p.id === me?.id), currentEpoch = l?.epoch ?? '';
    if (epoch !== currentEpoch) {
        epoch = currentEpoch;
        anchor = null;
        rotation = 0;
        mirror = false;
        wild = false;
        if (!l?.effects.some(e => e.id === selected))
            selected = l?.effects[0]?.id ?? '';
    }
    const p = v.players.find(p => p.id === sheetId) ?? mine ?? v.players[0], e = l?.effects.find(e => e.id === selected), editable = !!mine && p?.id === mine.id && v.phase === 'playing' && !mine.done;
    const animated = !snapshot && lastSequence >= 0 && v.sequence === lastSequence + 1 && v.event.kind === 'mark' && v.event.actor === p?.id ? (v.event.cells ?? []).map(c => `${c.zone}:${c.x},${c.y}`) : [], dealing = !snapshot && lastDeal > 0 && v.deal !== lastDeal;
    const displayMode = mode || v.defaultMode, full = !me || displayMode === 'full-mobile', rerender = () => renderLocus(root, v, host, blocked, command, true, play);
    const btn = (s: string, attrs: string, disabled = false) => `<button type="button" ${attrs} ${disabled ? 'disabled' : ''}>${s}</button>`;
    const send = (a: Omit<LocusAction, 'epoch'> | Record<string, unknown>) => { if (!blocked && l)
        command({ ...a, epoch: l.epoch } as LocusAction); };
    const status = v.phase === 'finished' ? 'จบเกมแล้ว' : v.turn === me?.id ? 'เลือกการ์ดของคุณ' : v.turn ? `รอผู้เล่น ${v.players.findIndex(p=>p.id===v.turn)+1} · ${v.players.find(p => p.id === v.turn)?.name ?? 'เพื่อน'} เลือกการ์ด` : mine?.done ? 'รอเพื่อนจัดการโบนัสและจบชุด' : 'จัดการรูปทรง โบนัส และเหรียญก่อนจบชุด';
    const error = e && zone && anchor && p ? placementError(p, e, zone, anchor[0], anchor[1], rotation, mirror, wild) : '';
    let html = `<section class="lc-root ${!me?'display-only':''}"><svg width="0" height="0" aria-hidden="true" class="lc-defs"><defs><linearGradient id="lc-rainbow"><stop offset="0" stop-color="#e7bc16"/><stop offset=".25" stop-color="#e96062"/><stop offset=".5" stop-color="#9459a3"/><stop offset=".75" stop-color="#279bd0"/><stop offset="1" stop-color="#79ac3b"/></linearGradient></defs></svg><header class="lc-heading"><h1 translate="no">Locus<span>กากบาทให้เป็นคอมโบ</span></h1><div>${v.phase === 'lobby' ? 'ห้อง ' + v.code : `รอบ ${v.round}/${v.rounds} · ชุด ${v.turnInRound}/${v.players.length}`}<small>${v.phase === 'lobby' ? '2–5 คน' : `กองจั่ว ${v.remaining} · ทิ้ง ${v.discardCount}`}</small></div></header>`;
    {
        html += `<div class="lc-status" role="status">${esc(status)}</div>${me ? `<label class="lc-mode">หน้าจอนี้<select id="lc-mode" name="display-mode"><option value="shared-table" ${displayMode === 'shared-table' ? 'selected' : ''}>เล่นร่วมกับจอกลาง</option><option value="full-mobile" ${displayMode === 'full-mobile' ? 'selected' : ''}>เล่นครบจากมือถือ</option></select></label>` : ''}<section class="lc-market ${full ? 'full' : 'numbers'} ${dealing ? 'dealing' : ''}" aria-label="การ์ดกลาง">${v.market.map((m, i) => `<div class="lc-market-slot ${m.owner ? 'claimed' : ''}" style="--delay:${i * 70}ms" data-ui-key="market-${m.slot}">${btn(`<b class="lc-slot-number">${m.slot}</b>${full ? marketCard(m.card) : `<span>ใบ ${m.slot}</span>`}${m.owner ? `<small>${esc(v.players.find(p => p.id === m.owner)?.name ?? 'เลือกแล้ว')}</small>` : '<small>เลือกได้</small>'}`, `data-pick="${m.slot}" aria-label="เลือกการ์ด ${m.slot} สี${LABEL[m.card.color]}"`, blocked || !l?.picks.includes(m.slot))}</div>`).join('')}<div class="lc-deck" aria-label="กองจั่ว ${v.remaining} ใบ"><img src="/art/locus/back.webp" alt="" width="70" height="100"><small>${v.remaining}</small></div></section><nav class="lc-players" aria-label="แผ่นผู้เล่น">${v.players.map((p, i) => btn(`${avatar(p)}<span>${esc(p.name)}${p.id === me?.id ? ' (คุณ)' : ''}<small>ผู้เล่น ${i + 1} · ◉ ${p.coins} · ${p.score.total} แต้ม ${p.done ? '✓' : ''}</small></span>`, `data-player="${p.id}" class="${sheetId === p.id ? 'selected' : ''} ${v.turn === p.id ? 'turn' : ''}" aria-pressed="${sheetId === p.id}"`)).join('')}</nav>`;
        if (!me) html += `<div class="lc-all-sheets" aria-label="ภาพรวมแผ่นทุกคน">${v.players.map((player,i)=>btn(`<strong>${i+1} · ${esc(player.name)} ${player.id===v.first?'★':''}</strong>${sheet(player,undefined,false,[],true)}<small>${player.score.total} แต้ม · ◉ ${player.coins}${player.done?' · ✓':player.effects.length?' · รอวาง '+player.effects.length:!player.picked?' · รอเลือก':''}</small>`,`data-player="${player.id}" class="${sheetId===player.id?'selected':''}" aria-pressed="${sheetId===player.id}"`)).join('')}</div>`;
        if (p)
            html += `<section class="lc-paper"><header><b>${esc(p.name)} ${p.id === me?.id ? '· แผ่นของคุณ' : ''}</b><span class="lc-coins ${!snapshot && (v.event.gained||v.event.spent) && v.event.actor === p.id && lastSequence !== v.sequence ? 'pop' : ''}">◉ ${p.coins}</span><span>${p.score.total} แต้ม</span></header><nav class="lc-zone-tabs" aria-label="เลือกโซน">${btn('ทั้งแผ่น', 'data-zoom="" class="' + (!zone ? 'selected' : '') + '"')}${ZONES.map(z => btn(`${LABEL[z]} ${p.score[z]}`, `data-zoom="${z}" style="--zone:${INK[z]}" class="${zone === z ? 'selected' : ''}" aria-pressed="${zone === z}"`)).join('')}</nav><div class="lc-sheet-scroll" data-ui-key="sheet-scroll">${sheet(p, e, editable, animated)}</div>${zone ? `<p class="lc-zone-note">${note[zone]}</p>` : '<p class="lc-zone-note">แตะโซนเพื่อขยาย · ขอบหนาคือช่องเริ่มต้น · เติมโซนคะแนนน้อยให้ดี จะนับซ้ำอีกครั้ง</p>'}</section>`;
        if (me && v.phase === 'playing') {
            html += `<section class="lc-workbench" aria-label="รูปทรงที่รอวาง"><div class="lc-effects">${(l?.effects ?? []).map(f => btn(`${shape(f.cells, f.color)}<span>${f.kind === 'main' ? 'การ์ดที่เลือก' : f.kind === 'bonus' ? 'โบนัสจาก ' + (f.source ? LABEL[f.source.split(':')[0] as Zone] : '') : f.kind === 'remaining' ? 'การ์ดที่เหลือ' : 'ช่องจากเหรียญ'}<small>${LABEL[f.color]} ${f.cells.length} ช่อง</small></span>`, `data-effect="${f.id}" class="${selected === f.id ? 'selected' : ''} ${!snapshot&&lastSequence!==v.sequence&&v.event.effects?.includes(f.id)?'new-bonus':''}" aria-pressed="${selected === f.id}"`, blocked)).join('') || `<p>${mine?.done ? 'จบชุดนี้แล้ว' : mine?.picked ? 'จัดการรูปทรงครบแล้ว ใช้เหรียญเพิ่มหรือจบชุดได้' : 'เลือกการ์ดเมื่อถึงตาคุณ'}</p>`}</div>${e ? `<div class="lc-tools">${shape(transform(e.cells, rotation, mirror), e.color, 'lc-preview-shape')}${btn('หมุน ↻', 'id="lc-rotate"', blocked)}${btn('สะท้อน ↔', 'id="lc-mirror"', blocked)}${e.color !== 'wild' ? `<label><input type="checkbox" id="lc-wild" name="wild-color" ${wild ? 'checked' : ''} ${mine!.coins < 1 || blocked ? 'disabled' : ''}> 1 ◉ เปลี่ยนสี</label>` : ''}${btn('ไปยังโซน' + LABEL[e.color], 'id="lc-goto"', e.color === 'wild')}${btn(e.kind === 'main' ? 'ทิ้ง รับ 2 ◉' : e.kind==='bonus'?'ไม่ใช้โบนัส':'ไม่ใช้รูปทรงนี้', 'id="lc-skip"', blocked)}</div><div class="lc-placement-status" role="status">${p?.id !== me.id ? 'กลับแผ่นของคุณเพื่อวาง' : anchor ? error || `พร้อมกากบาท ${e.cells.length} ช่องในโซน${LABEL[zone as Zone]}` : 'แตะโซน แล้วแตะช่องซ้ายบนของรูปทรง'}</div><div class="lc-confirm-row">${btn('ยกเลิกตำแหน่ง', 'id="lc-cancel"', !anchor)}${btn('ยืนยันกากบาท', 'id="lc-confirm"', blocked || !editable || !zone || !anchor || !!error)}</div>` : ''}<div class="lc-spend">${btn('2 ◉ · กาเดี่ยว 2 ช่อง', 'id="lc-two"', blocked || !l?.coinBlocks)}${btn('3 ◉ · ใช้การ์ดที่เหลือ', 'id="lc-buy"', blocked || !l?.buy)}${btn('จบชุดนี้', 'id="lc-done"', blocked || !l?.done)}</div><small>ใช้การ์ดที่เหลือได้หลังทุกคนเลือกแล้ว ครั้งเดียวต่อชุด · โบนัส 2 ช่องต้องติดกัน</small></section>`;
        }
        if (v.phase === 'finished')
            html += `<section class="lc-final-banner"><b>${crown} ${v.winners.map(id => esc(v.players.find(p => p.id === id)?.name ?? '')).join(' และ ')} ชนะ${v.winners.length > 1 ? 'ร่วมกัน' : ''}</b><div>${btn('ดูสรุปคะแนน', 'id="lc-show-results"')}${host ? btn('เริ่มเล่นใหม่', 'id="lc-restart"', blocked) + (v.winners.length > 1 ? btn('ต่ออีก 1 รอบ (คะแนนเสมอ)', 'id="lc-extra"', blocked) : '') : ''}</div></section>`;
    }
    html += `<details class="lc-rules" ${detail ? 'open' : ''}><summary>วิธีเล่นและคะแนน</summary><p>การ์ดสีเดียวกับโซน หมุน/สะท้อนได้ ใช้รูปทรงเต็ม ห้ามทับของเดิม ทุกสีต้องทับช่องขอบหนาหรือติดช่องเดิมแนวตั้ง/นอน ยกเว้นสีแดง</p>${ZONES.map(z => `<p><b style="color:${INK[z]}">${LABEL[z]}</b> ${note[z]}</p>`).join('')}<p>โซนคะแนนต่ำสุดนับเพิ่มอีกครั้ง · ทิ้งการ์ดหลักรับ 2 เหรียญ · 1 เหรียญเปลี่ยนสีรูปทรง · 2 เหรียญกาเดี่ยว 2 ช่อง · 3 เหรียญใช้การ์ดที่เหลือ</p><p>รุ่น Tucker’s Fun Factory ภาคหลัก 2–5 คน · ไม่รวม Solo</p></details>`;
    if (v.phase === 'finished' && !resultClosed)
        html += `<div class="lc-modal" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="lc-result-title" tabindex="-1" class="lc-results"><h2 id="lc-result-title">${crown} สรุปคะแนน Locus</h2><p>นับคะแนนแยกสี แล้วเพิ่มโซนต่ำสุดอีกครั้ง</p><div class="lc-count-tabs">${ZONES.map((z, i) => btn(LABEL[z], `data-count="${i}" style="--zone:${INK[z]}" class="${i === count ? 'selected' : ''}"`)).join('')}${btn('ต่ำสุด ×2', 'data-count="5"')}${btn('รวม', 'data-count="6"')}</div><div class="lc-score-table"><table><thead><tr><th>ผู้เล่น</th>${ZONES.map(z => `<th style="color:${INK[z]}">${LABEL[z]}</th>`).join('')}<th>ต่ำสุด</th><th>รวม</th></tr></thead><tbody>${v.players.map((p, i) => `<tr class="${v.winners.includes(p.id) ? 'winner' : ''}"><th>${v.winners.includes(p.id) ? crown : ''}${esc(p.name)}<small>ผู้เล่น ${i + 1}${p.id === me?.id ? ' · คุณ' : ''}</small></th>${ZONES.map((z, j) => `<td class="${j === count ? 'counting' : ''}">${p.score[z]}</td>`).join('')}<td class="${count === 5 ? 'counting' : ''}">${p.score.lowest}</td><td class="${count === 6 ? 'counting' : ''}"><b>${p.score.total}</b></td></tr>`).join('')}</tbody></table></div><div class="lc-result-detail">${v.players.map((p, i) => `<p><b>${esc(p.name)} (${i + 1})</b> ${count === 0 ? `แถวที่ครบ: ${p.score.details.yellowRows.map(y => y + 1).join(', ') || 'ยังไม่มี'}` : count === 1 ? `เชื่อมช่องขอบหนาได้มากที่สุด ${p.score.details.purpleConnected} ช่อง` : count === 2 ? `กลุ่มที่ครบ: ${p.score.details.redGroups.map(g => g + 1).join(', ') || 'ยังไม่มี'}` : count === 3 ? `ต่อถึงปลาย ${p.score.details.greenEnds.length} จุด × 8` : count === 4 ? `ขั้นสูงสุด ${p.score.blue} แต้ม` : count === 5 ? `โซนต่ำสุด ${p.score.lowest} แต้ม นับเพิ่มอีกครั้ง` : `รวม ${p.score.total} แต้ม`}</p>`).join('')}</div><div class="lc-result-actions">${btn('ตกลง', 'id="lc-close-results"')}${btn('ข้ามการนับ', 'data-count="6"')}${host ? btn('เริ่มเล่นใหม่', 'id="lc-result-restart"', blocked) : ''}</div></section></div>`;
    html += '</section>';
    patchHTML(root, html);
    const on = (q: string, fn: (el: HTMLElement) => void) => root.querySelectorAll<HTMLElement>(q).forEach(el => el.onclick = () => fn(el));
    on('#lc-ready', () => command({ type: 'ready', ready: !mine?.ready }));
    on('#lc-start', () => command({ type: 'start', startingPlayerId: root.querySelector<HTMLSelectElement>('#lc-starter')?.value }));
    on('[data-pick]', el => { const slot = Number(el.dataset.pick); if (l?.picks.includes(slot) && !blocked)
        send({ type: 'locus-pick', slot }); });
    on('[data-player]', el => { sheetId = el.dataset.player!; anchor = null; rerender(); });
    on('[data-zoom]', el => { zone = el.dataset.zoom as Zone | ''; anchor = null; rerender(); });
    on('[data-cell]', el => { if (!editable || !e || blocked)
        return; const [z, key] = el.dataset.cell!.split(':'); if (!zone) {
        zone = z as Zone;
        anchor = null;
    }
    else
        anchor = key.split(',').map(Number) as unknown as XY; play('select'); rerender(); });
    root.querySelectorAll<SVGElement>('[data-cell][tabindex]').forEach(el => el.onkeydown = ev => { if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    } });
    on('[data-effect]', el => { selected = el.dataset.effect!; anchor = null; rotation = 0; mirror = false; wild = false; play('select'); rerender(); });
    on('#lc-rotate', () => { rotation = (rotation + 1) % 4; rerender(); });
    on('#lc-mirror', () => { mirror = !mirror; rerender(); });
    on('#lc-goto', () => { if (e && e.color !== 'wild') {
        zone = e.color;
        sheetId = me!.id;
        anchor = null;
        rerender();
    } });
    const wildInput = root.querySelector<HTMLInputElement>('#lc-wild');
    if (wildInput)
        wildInput.onchange = () => { wild = wildInput.checked; rerender(); };
    const modeInput = root.querySelector<HTMLSelectElement>('#lc-mode');
    if (modeInput)
        modeInput.onchange = () => { mode = modeInput.value; saveDisplayMode(v.code, mode); rerender(); };
    on('#lc-cancel', () => { anchor = null; rerender(); });
    on('#lc-confirm', () => { if (e && zone && anchor && !error && editable && !blocked)
        send({ type: 'locus-place', effect: e.id, zone, x: anchor[0], y: anchor[1], rotation, mirror, wild }); });
    on('#lc-skip', () => e && send({ type: e.kind === 'main' ? 'locus-discard' : 'locus-skip', effect: e.id }));
    on('#lc-two', () => send({ type: 'locus-coin-blocks' }));
    on('#lc-buy', () => send({ type: 'locus-buy' }));
    on('#lc-done', () => send({ type: 'locus-done' }));
    on('#lc-restart,#lc-result-restart', () => command({ type: 'restart' }));
    on('#lc-extra', () => command({ type: 'locus-extra' }));
    on('#lc-show-results', () => { resultClosed = false; rerender(); });
    on('#lc-close-results', () => { resultClosed = true; rerender(); });
    on('[data-count]', el => { count = Number(el.dataset.count); autoCount = false; rerender(); });
    const rules = root.querySelector<HTMLDetailsElement>('.lc-rules');
    if (rules)
        rules.ontoggle = () => { detail = rules.open; };
    if (countTimer) {
        clearTimeout(countTimer);
        countTimer = undefined;
    }
    const modal = root.querySelector<HTMLElement>('.lc-modal');
    root.closest('body')?.classList.toggle('lc-dialog-open', !!modal);
    document.body.classList.toggle('lc-dialog-open', !!modal);
    if (modal) {
        modal.onkeydown = ev => { if (ev.key === 'Escape') {
            resultClosed = true;
            rerender();
        } if (ev.key === 'Tab') {
            const buttons = [...modal.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')], first = buttons[0], last = buttons.at(-1);
            if (ev.shiftKey && document.activeElement === first) {
                ev.preventDefault();
                last?.focus({ preventScroll: true });
            }
            else if (!ev.shiftKey && document.activeElement === last) {
                ev.preventDefault();
                first?.focus({ preventScroll: true });
            }
        } };
        if (!modal.contains(document.activeElement))
            modal.querySelector<HTMLElement>('[role="dialog"]')?.focus({ preventScroll: true });
    }
    if (modal && autoCount && count < 6 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const currentMatch = v.matchId;
        countTimer = setTimeout(() => { if (root.isConnected && match === currentMatch && !resultClosed) {
            count++;
            rerender();
        } }, 1000);
    }
    lastSequence = v.sequence;
    lastDeal = v.deal;
}
