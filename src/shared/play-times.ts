import type {GameId} from './types.js';

export interface PlayTime {
  min: number;
  max: number;
  source: string;
  sourceName: string;
  /** Qualifies the advertised box-game time where the web implementation differs. */
  note?: string;
  extraSource?: {url: string; name: string};
}

// Published box-game estimates, checked 2026-11-02. Not telemetry or time limits.
// Keep every catalogue entry covered; see docs/ui/play-times.md for provenance.
export const GAME_PLAY_TIMES: Record<GameId, PlayTime> = {
  'dividend-hunter':{min:15,max:15,source:'user-created-rules',sourceName:'ผู้สร้างเกม',note:'ค่าเริ่มต้น 5 รอบ ปรับได้ก่อนเริ่ม'},
  'high-low-scoreboard':{min:20,max:20,source:'user-created-rules',sourceName:'ผู้สร้างเกม',note:'10 ข้อโดยประมาณ; ปรับจำนวนข้อและเวลาเฉลยได้ตามกลุ่ม'},
  'stock-market-crash':{min:15,max:15,source:'user-provided-rules',sourceName:'ผู้สร้างเกม',note:'เวลาขึ้นอยู่กับจำนวนรอบและขนาดกลุ่ม'},
  'spirit-island':{min:100,max:100,source:'https://shop.greaterthangames.com/products/spirit-island',sourceName:'Greater Than Games'},
  'tiny-towns':{min:30,max:30,source:'https://www.alderac.com/tiny-towns/',sourceName:'AEG'},
  friday:{min:30,max:30,source:'https://2f-games.com/2f-spiele/friday/',sourceName:'2F-Spiele'},
  'wealth-of-nations': {min:120,max:120,source:'https://hobbyjapan.co.jp/game/?p=287',sourceName:'Hobby Japan',note:'ฉบับ TableStar 2008 เวลาจริงขึ้นอยู่กับการเจรจาของกลุ่ม'},
  'flip-7': {min:20,max:20,source:'https://theop.games/products/flip-7',sourceName:'The Op'},
  'catch-sketch': {min:20,max:20,source:'https://instaplay.fr/en/games/doodly-quickly/',sourceName:'InstaPlay'},
  'muffin-time': {min:20,max:20,source:'https://bigpotato.co.uk/products/muffin-time',sourceName:'Big Potato',note:'อ้างอิงเกมกล่อง ชุดการ์ดไทยดัดแปลงบนเว็บอาจใช้เวลาต่างกัน'},
  'mansions-of-madness': {min:120,max:180,source:'https://www.fantasyflightgames.com/product/mansions-of-madness-second-edition/',sourceName:'Fantasy Flight Games',note:'อ้างอิงเกมกล่อง Second Edition ด่านแฟนเมดบนเว็บอาจใช้เวลาต่างกัน'},
  'just-one': {min:20,max:20,source:'https://www.rprod.com/en/games/just-one',sourceName:'Repos Production'},
  'bomb-busters': {min:20,max:40,source:'https://pegasus.de/Bomb-Busters-Spiel-des-Jahres-2025/51280G',sourceName:'Pegasus Spiele',note:'ต่อหนึ่งภารกิจ ไม่ใช่เวลารวมทุกภารกิจ'},
  courtisans: {min:20,max:20,source:'https://catchupgames.com/nos-jeux/courtisans/',sourceName:'Catch Up Games'},
  trio: {min:15,max:20,source:'https://www.cocktailgames.com/as-dor-trio/',sourceName:'Cocktail Games'},
  'castle-combo': {min:25,max:25,source:'https://catchupgames.com/nos-jeux/chateau-combo/',sourceName:'Catch Up Games'},
  'power-hungry-pets': {min:15,max:15,source:'https://www.explodingkittens.com/products/power-hungry-pets',sourceName:'Exploding Kittens'},
  'love-letter': {min:15,max:20,source:'https://www.zmangames.com/game/love-letter/',sourceName:'Z-Man Games',note:'Classic ประมาณ 20 นาที · Marvel ประมาณ 15 นาที',extraSource:{url:'https://store.asmodee.com/products/infinity-gauntlet-a-love-letter-game',name:'Asmodee · Marvel'}},
  'sounds-fishy': {min:15,max:15,source:'https://bigpotato.co.uk/products/sounds-fishy',sourceName:'Big Potato',note:'อ้างอิงเกมกล่อง ระยะเวลาขึ้นอยู่กับจำนวนรอบและการพูดคุย'},
  perch: {min:45,max:60,source:'https://insideupgames.com/our-games/perch/',sourceName:'Inside Up Games'},
  draftosaurus: {min:15,max:15,source:'https://www.ankama-shop.com/en/all-boardgames/1997-draftosaurus.html',sourceName:'Ankama'},
  'take-time': {min:30,max:30,source:'https://www.libellud.com/game/take-time/',sourceName:'Libellud',note:'ต่อการเล่นหนึ่งด่าน ไม่ใช่เวลารวมทั้งแคมเปญ'},
  'critter-kitchen': {min:55,max:70,source:'https://cardboardalchemy.com/critter-kitchen/',sourceName:'Cardboard Alchemy',note:'อ้างอิงภาคหลัก 1–5 คน ภาคเสริมและกลุ่ม 6–7 คนอาจใช้เวลานานขึ้น'},
  locus: {min:30,max:30,source:'https://www.asmodee.co.uk/products/asmtff482108-locus',sourceName:'Asmodee UK'},
  'sky-team': {min:20,max:20,source:'https://www.scorpionmasque.com/sites/scorpionmasque.com/files/st_rules01_en_06jun2023.pdf',sourceName:'Le Scorpion Masqué · คู่มือ',note:'ต่อหนึ่งเที่ยวบิน'},
  harmonies: {min:30,max:30,source:'https://www.libellud.com/game/harmonies/',sourceName:'Libellud'},
  pixies: {min:30,max:30,source:'https://studiobombyx.com/jeu/pixies/',sourceName:'Bombyx'},
  jaipur: {min:30,max:30,source:'https://www.spacecowboys-games.com/game/jaipur/',sourceName:'Space Cowboys'},
  'seven-wonders-duel': {min:30,max:30,source:'https://www.rprod.com/en/games/7-wonders-duel',sourceName:'Repos Production'},
  calico: {min:30,max:45,source:'https://www.alderac.com/calico/',sourceName:'AEG'},
  azul: {min:30,max:45,source:'https://www.nextmove-games.com/en/azul/azul-game/',sourceName:'Next Move Games'},
  'camel-up': {min:30,max:30,source:'https://store.asmodee.com/products/camel-up',sourceName:'Asmodee'},
  'dracula-vs-van-helsing': {min:30,max:30,source:'https://www.asmodee.it/product/dracula-vs-van-helsing/',sourceName:'Asmodee Italia'},
  'name-it': {min:15,max:15,source:'https://boardgame-rakuichi.com/5th/booth/sumatoeipugemusu/product/name-it',sourceName:'Smart Ape Games · ข้อมูลผู้จัดแสดง',note:'อ้างอิง Name It! ชุดสุนัข 69 ใบ'},
};

export function playTimeLabel(id: GameId): string {
  const time = GAME_PLAY_TIMES[id];
  return `${time.min === time.max ? time.min : `${time.min}–${time.max}`} นาที`;
}
