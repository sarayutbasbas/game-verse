import type {GameId} from '../shared/types.js';
import {GAME_PLAY_TIMES,playTimeLabel} from '../shared/play-times.js';

const clock = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path stroke-linecap="round" d="M12 7v5l3 2"/></svg>';

export function playTimeMarkup(id: GameId, detail = false): string {
  const time = GAME_PLAY_TIMES[id];
  const label = `<p class="game-play-time${detail?' entry-play-time':''}" title="เวลาเล่นโดยประมาณ">${clock}<small class="play-time-prefix">ประมาณ </small>${playTimeLabel(id)}</p>`;
  if (!detail) return label;
  const source=time.source.startsWith('user-')?'เวลาประเมินจากจำนวนรอบและกลุ่มผู้เล่น':`เวลาอ้างอิงเกมกล่อง อาจต่างกันตามจำนวนคนและความคุ้นเคย<br>ข้อมูลจาก <a href="${time.source}" target="_blank" rel="noopener noreferrer">${time.sourceName}</a>${time.extraSource?` / <a href="${time.extraSource.url}" target="_blank" rel="noopener noreferrer">${time.extraSource.name}</a>`:''}`;
  return `${label}<p class="entry-play-time-note">${time.note?`${time.note}<br>`:''}${source}</p>`;
}
