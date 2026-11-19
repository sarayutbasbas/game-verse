import type {Element,Power,SpiritOptions} from './types.js';
export const DEFAULT_OPTIONS:SpiritOptions={blightCard:false,progression:true};
export const ELEMENTS:Element[]=['sun','moon','fire','air','water','earth','plant','animal'];
export const ELEMENT_INFO:Record<Element,{name:string;symbol:string;color:string}>={"sun": {"name": "อาทิตย์", "symbol": "☀", "color": "#e4b645"}, "moon": {"name": "จันทร์", "symbol": "☾", "color": "#a5a1d3"}, "fire": {"name": "ไฟ", "symbol": "♨", "color": "#d96745"}, "air": {"name": "ลม", "symbol": "≋", "color": "#b4c7db"}, "water": {"name": "น้ำ", "symbol": "≈", "color": "#4faac0"}, "earth": {"name": "ดิน", "symbol": "▲", "color": "#9e8b71"}, "plant": {"name": "พืช", "symbol": "❧", "color": "#57a96c"}, "animal": {"name": "สัตว์", "symbol": "✧", "color": "#b68b5d"}};
export const POWERS:Power[]=[
 {
  "id": "u0",
  "name": "หนึ่งปีแห่งความสงบนิ่ง",
  "en": "A Year of Perfect Stillness",
  "kind": "unique",
  "cost": 3,
  "speed": "fast",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "sun",
   "earth"
  ],
  "text": "ผู้รุกรานข้ามการกระทำทุกชนิดในพื้นที่นี้ตลอดรอบนี้",
  "art": 0,
  "spirit": "earth"
 },
 {
  "id": "u1",
  "name": "พรแห่งพละกำลัง",
  "en": "Boon of Vigor",
  "kind": "unique",
  "cost": 0,
  "speed": "fast",
  "range": 0,
  "source": "presence",
  "target": "spirit",
  "restriction": "any",
  "elements": [
   "sun",
   "water",
   "plant"
  ],
  "text": "เป้าหมายเป็นตัวเอง: รับพลังงาน 1 หากเป็นภูติอื่น รับพลังงานเท่าจำนวนการ์ดพลังที่เป้าหมายเล่นในรอบนี้",
  "art": 1,
  "spirit": "river"
 },
 {
  "id": "u2",
  "name": "เสียงเรียกจากห้วงลึก",
  "en": "Call of the Deeps",
  "kind": "unique",
  "cost": 0,
  "speed": "fast",
  "range": 0,
  "source": "presence",
  "target": "land",
  "restriction": "coastal",
  "elements": [
   "moon",
   "air",
   "water"
  ],
  "text": "รวมนักสำรวจ 1 ตัวเข้ามา หากเป้าหมายเป็นมหาสมุทร รวมนักสำรวจเพิ่มอีก 1 ตัวได้",
  "art": 2,
  "spirit": "ocean"
 },
 {
  "id": "u3",
  "name": "ขอพลังจากฝันเที่ยงคืน",
  "en": "Call on Midnight's Dream",
  "kind": "unique",
  "cost": 0,
  "speed": "fast",
  "range": 0,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "moon",
   "animal"
  ],
  "text": "เลือก: หากมีดาฮาน รับพลังใหญ่ หากลืมใบนี้เพื่อรับพลังใหญ่ รับพลังงานเท่าจำนวนดาฮาน และเล่นใบใหม่ทันทีโดยจ่ายค่าพลังงานได้ หรือหากมีผู้รุกราน สร้างความกลัว 2",
  "art": 3,
  "spirit": "dreams"
 },
 {
  "id": "u4",
  "name": "เงามืดปกป้อง",
  "en": "Concealing Shadows",
  "kind": "unique",
  "cost": 0,
  "speed": "fast",
  "range": 0,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "moon",
   "air"
  ],
  "text": "ความกลัว 1 ดาฮานในพื้นที่ไม่รับความเสียหายจากการบุกทำลายในรอบนี้",
  "art": 4,
  "spirit": "shadows"
 },
 {
  "id": "u5",
  "name": "พืชผลเหี่ยวเฉา",
  "en": "Crops Wither and Fade",
  "kind": "unique",
  "cost": 1,
  "speed": "slow",
  "range": 0,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "moon",
   "fire",
   "plant"
  ],
  "text": "ความกลัว 2 แทนที่หมู่บ้าน 1 ด้วยนักสำรวจ 1 หรือแทนที่เมือง 1 ด้วยหมู่บ้าน 1",
  "art": 5,
  "spirit": "shadows"
 },
 {
  "id": "u6",
  "name": "เสียงเรียกจากผืนดินอุดม",
  "en": "Draw of the Fruitful Earth",
  "kind": "unique",
  "cost": 1,
  "speed": "slow",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "earth",
   "plant",
   "animal"
  ],
  "text": "รวมนักสำรวจไม่เกิน 2 ตัว และรวมดาฮานไม่เกิน 2 คนเข้ามา",
  "art": 6,
  "spirit": "earth"
 },
 {
  "id": "u7",
  "name": "ภาพหลอนอันน่าหวาดหวั่น",
  "en": "Dread Apparitions",
  "kind": "unique",
  "cost": 2,
  "speed": "fast",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "invaders",
  "elements": [
   "moon",
   "air"
  ],
  "text": "ความกลัว 1 ตลอดรอบนี้ ทุกครั้งที่พลังสร้างความกลัวในพื้นที่ ให้ป้องกันเพิ่มเท่าความกลัวนั้น ไม่นับความกลัวจากการทำลายอาคารตามปกติ",
  "art": 7,
  "spirit": "dreams"
 },
 {
  "id": "u8",
  "name": "ความฝันของชาวดาฮาน",
  "en": "Dreams of the Dahan",
  "kind": "unique",
  "cost": 0,
  "speed": "fast",
  "range": 2,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "moon",
   "air"
  ],
  "text": "เลือก: รวมดาฮานไม่เกิน 2 คน หรือหากมีหมู่บ้านหรือเมือง สร้างความกลัวเท่าจำนวนดาฮาน สูงสุด 3",
  "art": 8,
  "spirit": "dreams"
 },
 {
  "id": "u9",
  "name": "หนี้บุญคุณที่ทวงคืน",
  "en": "Favors Called Due",
  "kind": "unique",
  "cost": 1,
  "speed": "slow",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "moon",
   "air",
   "animal"
  ],
  "text": "รวมดาฮานไม่เกิน 4 คน หากมีผู้รุกรานและดาฮานมีมากกว่าผู้รุกรานหลังรวม สร้างความกลัว 3",
  "art": 9,
  "spirit": "shadows"
 },
 {
  "id": "u10",
  "name": "ทุ่งที่พงไพรกลืนกิน",
  "en": "Fields Choked with Growth",
  "kind": "unique",
  "cost": 0,
  "speed": "slow",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "sun",
   "water",
   "plant"
  ],
  "text": "เลือก: ผลักหมู่บ้าน 1 หรือผลักดาฮาน 3 คน",
  "art": 10,
  "spirit": "green"
 },
 {
  "id": "u11",
  "name": "น้ำหลากฉับพลัน",
  "en": "Flash Floods",
  "kind": "unique",
  "cost": 2,
  "speed": "fast",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "sun",
   "water"
  ],
  "text": "ความเสียหาย 1 หากเป็นพื้นที่ชายฝั่ง เพิ่มความเสียหายอีก 1",
  "art": 11,
  "spirit": "river"
 },
 {
  "id": "u12",
  "name": "พรแห่งการแพร่ขยาย",
  "en": "Gift of Proliferation",
  "kind": "unique",
  "cost": 1,
  "speed": "fast",
  "range": 0,
  "source": "presence",
  "target": "other",
  "restriction": "any",
  "elements": [
   "moon",
   "plant"
  ],
  "text": "ภูติเป้าหมายเพิ่มอำนาจสถิต 1 ในระยะ 1 จากอำนาจสถิตเดิม เล่นเดี่ยวเลือกตัวเองได้",
  "art": 12,
  "spirit": "green"
 },
 {
  "id": "u13",
  "name": "กระแสน้ำโอบรัด",
  "en": "Grasping Tide",
  "kind": "unique",
  "cost": 1,
  "speed": "fast",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "coastal",
  "elements": [
   "moon",
   "water"
  ],
  "text": "ความกลัว 2 และป้องกัน 4",
  "art": 13,
  "spirit": "ocean"
 },
 {
  "id": "u14",
  "name": "ฟื้นฟูและคุ้มครองผืนดิน",
  "en": "Guard the Healing Land",
  "kind": "unique",
  "cost": 3,
  "speed": "fast",
  "range": 1,
  "source": "sacred",
  "target": "land",
  "restriction": "any",
  "elements": [
   "water",
   "earth",
   "plant"
  ],
  "text": "ถอนความเสื่อมโทรม 1 และป้องกัน 4",
  "art": 14,
  "spirit": "earth"
 },
 {
  "id": "u15",
  "name": "ผู้ส่งสารแห่งสายฟ้า",
  "en": "Harbingers of the Lightning",
  "kind": "unique",
  "cost": 0,
  "speed": "slow",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "fire",
   "air"
  ],
  "text": "ผลักดาฮานไม่เกิน 2 คน หากผลักอย่างน้อย 1 คนไปยังพื้นที่ที่มีหมู่บ้านหรือเมือง สร้างความกลัว 1",
  "art": 15,
  "spirit": "lightning"
 },
 {
  "id": "u16",
  "name": "พรแห่งสายฟ้า",
  "en": "Lightning's Boon",
  "kind": "unique",
  "cost": 1,
  "speed": "fast",
  "range": 0,
  "source": "presence",
  "target": "spirit",
  "restriction": "any",
  "elements": [
   "fire",
   "air"
  ],
  "text": "ภูติเป้าหมายใช้พลังช้าไม่เกิน 2 ครั้งเป็นพลังเร็วได้ในรอบนี้ รวมพลังติดตัวด้วย",
  "art": 16,
  "spirit": "lightning"
 },
 {
  "id": "u17",
  "name": "สำแดงอานุภาพและเกียรติภูมิ",
  "en": "Manifestation of Power and Glory",
  "kind": "unique",
  "cost": 3,
  "speed": "slow",
  "range": 0,
  "source": "presence",
  "target": "land",
  "restriction": "dahan",
  "elements": [
   "sun",
   "fire",
   "air"
  ],
  "text": "ความกลัว 1 ดาฮานแต่ละคนสร้างความเสียหายเท่าจำนวนอำนาจสถิตของคุณในพื้นที่นี้",
  "art": 17,
  "spirit": "thunder"
 },
 {
  "id": "u18",
  "name": "ม่านแห่งความหวาดผวา",
  "en": "Mantle of Dread",
  "kind": "unique",
  "cost": 1,
  "speed": "slow",
  "range": 0,
  "source": "presence",
  "target": "spirit",
  "restriction": "any",
  "elements": [
   "moon",
   "fire",
   "air"
  ],
  "text": "ความกลัว 2 ภูติเป้าหมายอาจผลักนักสำรวจ 1 และหมู่บ้าน 1 จากพื้นที่ที่ตนมีอำนาจสถิต",
  "art": 18,
  "spirit": "shadows"
 },
 {
  "id": "u19",
  "name": "พงไพรผลิบานในคืนเดียว",
  "en": "Overgrow in a Night",
  "kind": "unique",
  "cost": 2,
  "speed": "fast",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "moon",
   "plant"
  ],
  "text": "เลือก: เพิ่มอำนาจสถิตของคุณ 1 ในพื้นที่นี้ หรือหากมีอำนาจสถิตของคุณและผู้รุกราน สร้างความกลัว 3",
  "art": 19,
  "spirit": "green"
 },
 {
  "id": "u20",
  "name": "ฝันร้ายของผู้ล่า",
  "en": "Predatory Nightmares",
  "kind": "unique",
  "cost": 2,
  "speed": "slow",
  "range": 1,
  "source": "sacred",
  "target": "land",
  "restriction": "invaders",
  "elements": [
   "moon",
   "fire",
   "earth",
   "animal"
  ],
  "text": "ความเสียหาย 2 แล้วผลักดาฮานไม่เกิน 2 คน ความสามารถผู้ให้กำเนิดฝันจะแทนการทำลายด้วยความกลัวและการผลัก",
  "art": 20,
  "spirit": "dreams"
 },
 {
  "id": "u21",
  "name": "พายุเกรี้ยวกราด",
  "en": "Raging Storm",
  "kind": "unique",
  "cost": 3,
  "speed": "slow",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "fire",
   "air",
   "water"
  ],
  "text": "ความเสียหาย 1 ต่อผู้รุกรานแต่ละตัว",
  "art": 21,
  "spirit": "lightning"
 },
 {
  "id": "u22",
  "name": "พิธีแห่งการทำลาย",
  "en": "Rituals of Destruction",
  "kind": "unique",
  "cost": 3,
  "speed": "slow",
  "range": 1,
  "source": "sacred",
  "target": "land",
  "restriction": "dahan",
  "elements": [
   "sun",
   "moon",
   "fire",
   "earth",
   "plant"
  ],
  "text": "ความเสียหาย 2 หากมีดาฮานอย่างน้อย 3 คน เพิ่มความเสียหาย 3 และความกลัว 2",
  "art": 22,
  "spirit": "earth"
 },
 {
  "id": "u23",
  "name": "ของขวัญจากสายน้ำ",
  "en": "River's Bounty",
  "kind": "unique",
  "cost": 0,
  "speed": "slow",
  "range": 0,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "sun",
   "water",
   "animal"
  ],
  "text": "รวมดาฮานไม่เกิน 2 คน หากตอนนี้มีอย่างน้อย 2 คน เพิ่มดาฮาน 1 และรับพลังงาน 1",
  "art": 23,
  "spirit": "river"
 },
 {
  "id": "u24",
  "name": "ทำลายเรือนพัก",
  "en": "Shatter Homesteads",
  "kind": "unique",
  "cost": 2,
  "speed": "slow",
  "range": 2,
  "source": "sacred",
  "target": "land",
  "restriction": "any",
  "elements": [
   "fire",
   "air"
  ],
  "text": "ความกลัว 1 และทำลายหมู่บ้าน 1",
  "art": 24,
  "spirit": "lightning"
 },
 {
  "id": "u25",
  "name": "สกัดกั้นธารน้ำจืด",
  "en": "Stem the Flow of Fresh Water",
  "kind": "unique",
  "cost": 0,
  "speed": "slow",
  "range": 1,
  "source": "sacred",
  "target": "land",
  "restriction": "any",
  "elements": [
   "water",
   "plant"
  ],
  "text": "ความเสียหาย 1 ต่อหมู่บ้านหรือเมือง 1 หากเป็นภูเขาหรือหาดทราย ให้ทำความเสียหาย 1 ต่อหมู่บ้านและเมืองทุกแห่งแทน",
  "art": 25,
  "spirit": "green"
 },
 {
  "id": "u26",
  "name": "ซุ่มโจมตีฉับพลัน",
  "en": "Sudden Ambush",
  "kind": "unique",
  "cost": 2,
  "speed": "fast",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "fire",
   "air",
   "animal"
  ],
  "text": "อาจรวมดาฮาน 1 คน แล้วดาฮานแต่ละคนทำลายนักสำรวจ 1 ตัว",
  "art": 26,
  "spirit": "thunder"
 },
 {
  "id": "u27",
  "name": "กลืนผู้เดินบนแผ่นดิน",
  "en": "Swallow the Land-Dwellers",
  "kind": "unique",
  "cost": 0,
  "speed": "slow",
  "range": 0,
  "source": "presence",
  "target": "land",
  "restriction": "coastal",
  "elements": [
   "water",
   "earth"
  ],
  "text": "จมนักสำรวจ 1 หมู่บ้าน 1 และดาฮาน 1 คน",
  "art": 27,
  "spirit": "ocean"
 },
 {
  "id": "u28",
  "name": "พรแห่งกระแสน้ำ",
  "en": "Tidal Boon",
  "kind": "unique",
  "cost": 1,
  "speed": "slow",
  "range": 0,
  "source": "presence",
  "target": "other",
  "restriction": "any",
  "elements": [
   "moon",
   "water",
   "earth"
  ],
  "text": "ภูติเป้าหมายรับพลังงาน 2 และอาจผลักหมู่บ้าน 1 กับดาฮานไม่เกิน 2 จากพื้นที่ที่ตนมีอำนาจสถิต หากดาฮานถูกผลักลงทะเลของคุณ เลือกย้ายไปพื้นที่ชายฝั่งใดแทนการจมได้",
  "art": 28,
  "spirit": "ocean"
 },
 {
  "id": "u29",
  "name": "เสียงแห่งฟ้าร้อง",
  "en": "Voice of Thunder",
  "kind": "unique",
  "cost": 0,
  "speed": "slow",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "sun",
   "air"
  ],
  "text": "เลือก: ผลักดาฮานไม่เกิน 4 คน หรือหากมีผู้รุกราน สร้างความกลัว 2",
  "art": 29,
  "spirit": "thunder"
 },
 {
  "id": "u30",
  "name": "กวาดล้างด้วยสายน้ำ",
  "en": "Wash Away",
  "kind": "unique",
  "cost": 1,
  "speed": "slow",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "water",
   "earth"
  ],
  "text": "ผลักนักสำรวจหรือหมู่บ้านรวมไม่เกิน 3 ชิ้น",
  "art": 30,
  "spirit": "river"
 },
 {
  "id": "u31",
  "name": "ถ้อยคำเตือนภัย",
  "en": "Words of Warning",
  "kind": "unique",
  "cost": 1,
  "speed": "fast",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "dahan",
  "elements": [
   "sun",
   "air",
   "animal"
  ],
  "text": "ป้องกัน 3 ในการบุกทำลายรอบนี้ ดาฮานโจมตีพร้อมกับผู้รุกราน จึงโต้กลับได้แม้ถูกทำลายในครั้งนั้น",
  "art": 31,
  "spirit": "thunder"
 },
 {
  "id": "m0",
  "name": "เรียกวิถีแห่งดาฮาน",
  "en": "Call of the Dahan Ways",
  "kind": "minor",
  "cost": 1,
  "speed": "slow",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "dahan",
  "elements": [
   "moon",
   "water",
   "animal"
  ],
  "text": "แทนที่นักสำรวจ 1 ด้วยดาฮาน 1 หากมีจันทร์ 2 อาจแทนที่หมู่บ้าน 1 ด้วยดาฮานแทน",
  "art": 32,
  "threshold": {
   "moon": 2
  }
 },
 {
  "id": "m1",
  "name": "เสียงเรียกสู่การต่อสู้",
  "en": "Call to Bloodshed",
  "kind": "minor",
  "cost": 1,
  "speed": "slow",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "dahan",
  "elements": [
   "sun",
   "fire",
   "animal"
  ],
  "text": "เลือก: ความเสียหายเท่าจำนวนดาฮาน หรือรวมดาฮานไม่เกิน 3 คน",
  "art": 33
 },
 {
  "id": "m2",
  "name": "เสียงเรียกให้ออกห่าง",
  "en": "Call to Isolation",
  "kind": "minor",
  "cost": 0,
  "speed": "fast",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "dahan",
  "elements": [
   "sun",
   "air",
   "animal"
  ],
  "text": "เลือก: ผลักนักสำรวจหรือหมู่บ้านได้เท่าจำนวนดาฮาน หรือผลักดาฮาน 1 คน",
  "art": 34
 },
 {
  "id": "m3",
  "name": "เสียงเรียกให้อพยพ",
  "en": "Call to Migrate",
  "kind": "minor",
  "cost": 1,
  "speed": "slow",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "fire",
   "air",
   "animal"
  ],
  "text": "รวมดาฮานไม่เกิน 3 แล้วผลักดาฮานไม่เกิน 3",
  "art": 35
 },
 {
  "id": "m4",
  "name": "เสียงเรียกให้ดูแล",
  "en": "Call to Tend",
  "kind": "minor",
  "cost": 1,
  "speed": "slow",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "dahan",
  "elements": [
   "water",
   "plant",
   "animal"
  ],
  "text": "เลือก: ถอนความเสื่อมโทรม 1 หรือผลักดาฮานไม่เกิน 3 คน",
  "art": 36
 },
 {
  "id": "m5",
  "name": "ป่ามืดพันพัว",
  "en": "Dark and Tangled Woods",
  "kind": "minor",
  "cost": 1,
  "speed": "fast",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "moon",
   "earth",
   "plant"
  ],
  "text": "ความกลัว 2 หากเป็นภูเขาหรือป่า ป้องกัน 3",
  "art": 37
 },
 {
  "id": "m6",
  "name": "ภาพลวงแห่งอันตราย",
  "en": "Delusions of Danger",
  "kind": "minor",
  "cost": 1,
  "speed": "fast",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "sun",
   "moon",
   "air"
  ],
  "text": "เลือก: ผลักนักสำรวจ 1 หรือความกลัว 2",
  "art": 38
 },
 {
  "id": "m7",
  "name": "มดกลืนกิน",
  "en": "Devouring Ants",
  "kind": "minor",
  "cost": 1,
  "speed": "slow",
  "range": 1,
  "source": "sacred",
  "target": "land",
  "restriction": "any",
  "elements": [
   "sun",
   "earth",
   "animal"
  ],
  "text": "ความกลัว 1 ความเสียหาย 1 ทำลายดาฮาน 1 หากเป็นป่าหรือหาดทราย เพิ่มความเสียหาย 1",
  "art": 39
 },
 {
  "id": "m8",
  "name": "ล่องลอยสู่นิทรา",
  "en": "Drift Down into Slumber",
  "kind": "minor",
  "cost": 0,
  "speed": "fast",
  "range": 2,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "air",
   "earth",
   "plant"
  ],
  "text": "ป้องกัน 1 หากเป็นป่าหรือหาดทราย เปลี่ยนเป็นป้องกัน 4",
  "art": 40
 },
 {
  "id": "m9",
  "name": "ภัยแล้ง",
  "en": "Drought",
  "kind": "minor",
  "cost": 1,
  "speed": "slow",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "sun",
   "fire",
   "earth"
  ],
  "text": "ทำลายหมู่บ้าน 3 จากนั้นทำความเสียหาย 1 ต่อหมู่บ้านและเมืองทุกแห่ง เพิ่มความเสื่อมโทรม 1 หากมีอาทิตย์ 3 ทำลายเมืองเพิ่ม 1",
  "art": 41,
  "threshold": {
   "sun": 3
  }
 },
 {
  "id": "m10",
  "name": "พรแห่งธาตุ",
  "en": "Elemental Boon",
  "kind": "minor",
  "cost": 1,
  "speed": "fast",
  "range": 0,
  "source": "presence",
  "target": "spirit",
  "restriction": "any",
  "elements": [],
  "text": "ภูติเป้าหมายเลือกธาตุ 3 ชนิดต่างกัน ได้ชนิดละ 1 ในรอบนี้ หากให้ภูติอื่น คุณได้ธาตุชุดเดียวกันด้วย",
  "art": 42
 },
 {
  "id": "m11",
  "name": "เกราะคุ้มครองทั่วแดน",
  "en": "Encompassing Ward",
  "kind": "minor",
  "cost": 1,
  "speed": "fast",
  "range": 0,
  "source": "presence",
  "target": "spirit",
  "restriction": "any",
  "elements": [
   "sun",
   "water",
   "earth"
  ],
  "text": "ป้องกัน 2 ในทุกพื้นที่ที่ภูติเป้าหมายมีอำนาจสถิต",
  "art": 43
 },
 {
  "id": "m12",
  "name": "เสน่ห์ชวนหลงใหล",
  "en": "Enticing Splendor",
  "kind": "minor",
  "cost": 0,
  "speed": "fast",
  "range": 0,
  "source": "presence",
  "target": "land",
  "restriction": "no-blight",
  "elements": [
   "sun",
   "air",
   "plant"
  ],
  "text": "เลือก: รวมนักสำรวจหรือหมู่บ้าน 1 หรือรวมดาฮานไม่เกิน 2",
  "art": 44
 },
 {
  "id": "m13",
  "name": "ภาพหลอนตรึงใจ",
  "en": "Entrancing Apparitions",
  "kind": "minor",
  "cost": 1,
  "speed": "fast",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "moon",
   "air",
   "water"
  ],
  "text": "ป้องกัน 2 หากไม่มีผู้รุกราน อาจรวมนักสำรวจไม่เกิน 2 ตัว",
  "art": 45
 },
 {
  "id": "m14",
  "name": "พรแห่งความมั่นคง",
  "en": "Gift of Constancy",
  "kind": "minor",
  "cost": 0,
  "speed": "fast",
  "range": 0,
  "source": "presence",
  "target": "spirit",
  "restriction": "any",
  "elements": [
   "sun",
   "earth"
  ],
  "text": "เป้าหมายรับพลังงาน 2 ตอนจบรอบอาจนำการ์ดที่เล่น 1 ใบกลับมือแทนทิ้ง หากให้ภูติอื่น คุณนำการ์ดที่เล่น 1 ใบกลับได้ด้วย",
  "art": 46
 },
 {
  "id": "m15",
  "name": "พรแห่งพลังชีวิต",
  "en": "Gift of Living Energy",
  "kind": "minor",
  "cost": 0,
  "speed": "fast",
  "range": 0,
  "source": "presence",
  "target": "spirit",
  "restriction": "any",
  "elements": [
   "sun",
   "fire",
   "plant"
  ],
  "text": "เป้าหมายรับพลังงาน 1 เพิ่มอีก 1 หากคุณมีสถานศักดิ์สิทธิ์อย่างน้อย 2 แห่ง และเพิ่มอีก 1 หากให้ภูติอื่น",
  "art": 47
 },
 {
  "id": "m16",
  "name": "พรแห่งพลังใหม่",
  "en": "Gift of Power",
  "kind": "minor",
  "cost": 0,
  "speed": "slow",
  "range": 0,
  "source": "presence",
  "target": "spirit",
  "restriction": "any",
  "elements": [
   "moon",
   "water",
   "earth",
   "plant"
  ],
  "text": "ภูติเป้าหมายรับการ์ดพลังเล็ก 1 ใบ",
  "art": 48
 },
 {
  "id": "m17",
  "name": "รากไม้แทะทำลาย",
  "en": "Gnawing Rootbiters",
  "kind": "minor",
  "cost": 0,
  "speed": "slow",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "earth",
   "animal"
  ],
  "text": "ผลักหมู่บ้านไม่เกิน 2 แห่ง",
  "art": 49
 },
 {
  "id": "m18",
  "name": "ดินแดนหลอนและเถ้าคุ",
  "en": "Land of Haunts and Embers",
  "kind": "minor",
  "cost": 0,
  "speed": "fast",
  "range": 2,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "moon",
   "fire",
   "air"
  ],
  "text": "ความกลัว 2 ผลักนักสำรวจหรือหมู่บ้านไม่เกิน 2 หากมีความเสื่อมโทรม ทำทั้งสองอย่างเพิ่มอีกครั้ง จากนั้นเพิ่มความเสื่อมโทรม 1",
  "art": 50
 },
 {
  "id": "m19",
  "name": "แรงดึงดูดจากสิ่งลี้ลับ",
  "en": "Lure of the Unknown",
  "kind": "minor",
  "cost": 0,
  "speed": "fast",
  "range": 2,
  "source": "presence",
  "target": "land",
  "restriction": "no-invaders",
  "elements": [
   "moon",
   "fire",
   "air",
   "plant"
  ],
  "text": "รวมนักสำรวจหรือหมู่บ้าน 1 เข้าพื้นที่นี้",
  "art": 51
 },
 {
  "id": "m20",
  "name": "ความยืดหยุ่นของธรรมชาติ",
  "en": "Nature's Resilience",
  "kind": "minor",
  "cost": 1,
  "speed": "fast",
  "range": 1,
  "source": "sacred",
  "target": "land",
  "restriction": "any",
  "elements": [
   "earth",
   "plant",
   "animal"
  ],
  "text": "ป้องกัน 6 หากมีน้ำ 2 อาจถอนความเสื่อมโทรม 1 แทน",
  "art": 52,
  "threshold": {
   "water": 2
  }
 },
 {
  "id": "m21",
  "name": "ดึงลงใต้ผืนดินหิวโหย",
  "en": "Pull Beneath the Hungry Earth",
  "kind": "minor",
  "cost": 1,
  "speed": "slow",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "moon",
   "water",
   "earth"
  ],
  "text": "หากคุณมีอำนาจสถิตในพื้นที่ สร้างความกลัว 1 และความเสียหาย 1 หากเป็นหาดทรายหรือพื้นที่ชุ่มน้ำ สร้างความเสียหายอีก 1",
  "art": 53
 },
 {
  "id": "m22",
  "name": "เปลวไฟชำระล้าง",
  "en": "Purifying Flame",
  "kind": "minor",
  "cost": 1,
  "speed": "slow",
  "range": 1,
  "source": "sacred",
  "target": "land",
  "restriction": "any",
  "elements": [
   "sun",
   "fire",
   "air",
   "plant"
  ],
  "text": "ความเสียหายเท่าจำนวนความเสื่อมโทรม หากเป็นภูเขาหรือหาดทราย อาจถอนความเสื่อมโทรม 1 แทน",
  "art": 54
 },
 {
  "id": "m23",
  "name": "ปลุกแรงดิ้นรนแห่งผืนดิน",
  "en": "Quicken the Earth's Struggles",
  "kind": "minor",
  "cost": 1,
  "speed": "fast",
  "range": 0,
  "source": "sacred",
  "target": "land",
  "restriction": "any",
  "elements": [
   "moon",
   "fire",
   "earth",
   "animal"
  ],
  "text": "เลือก: ความเสียหาย 1 ต่อหมู่บ้านและเมืองทุกแห่ง หรือป้องกัน 10",
  "art": 55
 },
 {
  "id": "m24",
  "name": "ฝนโลหิต",
  "en": "Rain of Blood",
  "kind": "minor",
  "cost": 0,
  "speed": "slow",
  "range": 1,
  "source": "sacred",
  "target": "land",
  "restriction": "invaders",
  "elements": [
   "air",
   "water",
   "animal"
  ],
  "text": "ความกลัว 2 หากมีหมู่บ้านและเมืองรวมอย่างน้อย 2 แห่ง ความกลัวเพิ่ม 1",
  "art": 56
 },
 {
  "id": "m25",
  "name": "เอื้อมคว้าไกลโพ้น",
  "en": "Reaching Grasp",
  "kind": "minor",
  "cost": 0,
  "speed": "fast",
  "range": 0,
  "source": "presence",
  "target": "spirit",
  "restriction": "any",
  "elements": [
   "sun",
   "air",
   "water"
  ],
  "text": "ภูติเป้าหมายได้ระยะพลังเพิ่ม 2 ตลอดรอบนี้ ไม่เพิ่มระยะการเติบโต การรวม หรือการผลัก",
  "art": 57
 },
 {
  "id": "m26",
  "name": "ปลุกต้นไม้และศิลา",
  "en": "Rouse the Trees and Stones",
  "kind": "minor",
  "cost": 1,
  "speed": "slow",
  "range": 1,
  "source": "sacred",
  "target": "land",
  "restriction": "no-blight",
  "elements": [
   "fire",
   "earth",
   "plant"
  ],
  "text": "ความเสียหาย 2 แล้วผลักนักสำรวจ 1",
  "art": 58
 },
 {
  "id": "m27",
  "name": "บั่นทอนพละกำลังมวลชน",
  "en": "Sap the Strength of Multitudes",
  "kind": "minor",
  "cost": 0,
  "speed": "fast",
  "range": 0,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "water",
   "animal"
  ],
  "text": "ป้องกัน 5 หากมีลม 1 ระยะของพลังนี้เพิ่มจาก 0 เป็น 1",
  "art": 59,
  "threshold": {
   "air": 1
  }
 },
 {
  "id": "m28",
  "name": "สัตว์ร้ายอันดุร้าย",
  "en": "Savage Mawbeasts",
  "kind": "minor",
  "cost": 0,
  "speed": "slow",
  "range": 1,
  "source": "sacred",
  "target": "land",
  "restriction": "any",
  "elements": [
   "fire",
   "animal"
  ],
  "text": "หากเป็นป่าหรือพื้นที่ชุ่มน้ำ ความกลัว 1 และความเสียหาย 1 หากมีสัตว์ 3 เพิ่มความเสียหายอีก 1",
  "art": 60,
  "threshold": {
   "animal": 3
  }
 },
 {
  "id": "m29",
  "name": "เงาแห่งป่าลุกไหม้",
  "en": "Shadows of the Burning Forest",
  "kind": "minor",
  "cost": 0,
  "speed": "slow",
  "range": 0,
  "source": "presence",
  "target": "land",
  "restriction": "invaders",
  "elements": [
   "moon",
   "fire",
   "plant"
  ],
  "text": "ความกลัว 2 หากเป็นภูเขาหรือป่า ผลักนักสำรวจ 1 และหมู่บ้าน 1",
  "art": 61
 },
 {
  "id": "m30",
  "name": "บทเพลงชำระแดน",
  "en": "Song of Sanctity",
  "kind": "minor",
  "cost": 1,
  "speed": "slow",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "mountain,jungle",
  "elements": [
   "sun",
   "water",
   "plant"
  ],
  "text": "หากมีนักสำรวจ ผลักทั้งหมด หากไม่มี ถอนความเสื่อมโทรม 1",
  "art": 62
 },
 {
  "id": "m31",
  "name": "ไอน้ำปะทุ",
  "en": "Steam Vents",
  "kind": "minor",
  "cost": 1,
  "speed": "fast",
  "range": 0,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "fire",
   "air",
   "water",
   "earth"
  ],
  "text": "ทำลายนักสำรวจ 1 หากมีดิน 3 อาจทำลายหมู่บ้าน 1 แทน",
  "art": 63,
  "threshold": {
   "earth": 3
  }
 },
 {
  "id": "m32",
  "name": "การละลายพิสดาร",
  "en": "Uncanny Melting",
  "kind": "minor",
  "cost": 1,
  "speed": "slow",
  "range": 1,
  "source": "sacred",
  "target": "land",
  "restriction": "any",
  "elements": [
   "sun",
   "moon",
   "water"
  ],
  "text": "หากมีผู้รุกราน ความกลัว 1 หากเป็นหาดทรายหรือพื้นที่ชุ่มน้ำ ถอนความเสื่อมโทรม 1",
  "art": 64
 },
 {
  "id": "m33",
  "name": "ม่านพรางแห่งการล่ายามค่ำ",
  "en": "Veil the Night's Hunt",
  "kind": "minor",
  "cost": 1,
  "speed": "fast",
  "range": 2,
  "source": "presence",
  "target": "land",
  "restriction": "dahan",
  "elements": [
   "moon",
   "air",
   "animal"
  ],
  "text": "เลือก: ดาฮานแต่ละคนเลือกผู้รุกรานต่างตัวกัน สร้างความเสียหายตัวละ 1 หรือผลักดาฮานไม่เกิน 3",
  "art": 65
 },
 {
  "id": "m34",
  "name": "นิมิตแห่งไฟมรณะ",
  "en": "Visions of Fiery Doom",
  "kind": "minor",
  "cost": 1,
  "speed": "fast",
  "range": 0,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "moon",
   "fire"
  ],
  "text": "ความกลัว 1 ผลักนักสำรวจหรือหมู่บ้าน 1 หากมีไฟ 2 ความกลัวเพิ่ม 1",
  "art": 66,
  "threshold": {
   "fire": 2
  }
 },
 {
  "id": "m35",
  "name": "การเติบโตไม่รู้จักอิ่ม",
  "en": "Voracious Growth",
  "kind": "minor",
  "cost": 1,
  "speed": "slow",
  "range": 1,
  "source": "sacred",
  "target": "land",
  "restriction": "jungle,wetland",
  "elements": [
   "water",
   "plant"
  ],
  "text": "เลือก: ความเสียหาย 2 หรือถอนความเสื่อมโทรม 1",
  "art": 67
 },
 {
  "id": "j0",
  "name": "ความผุพังเร่งรัด",
  "en": "Accelerated Rot",
  "kind": "major",
  "cost": 4,
  "speed": "slow",
  "range": 2,
  "source": "presence",
  "target": "land",
  "restriction": "jungle,wetland",
  "elements": [
   "sun",
   "water",
   "plant"
  ],
  "text": "ความกลัว 2 ความเสียหาย 4 หากมีอาทิตย์ 3 น้ำ 2 พืช 3 เพิ่มความเสียหาย 5 และถอนความเสื่อมโทรม 1",
  "art": 68,
  "threshold": {
   "sun": 3,
   "water": 2,
   "plant": 3
  }
 },
 {
  "id": "j1",
  "name": "การฟื้นคืนในเปลวเพลิง",
  "en": "Blazing Renewal",
  "kind": "major",
  "cost": 5,
  "speed": "fast",
  "range": 0,
  "source": "presence",
  "target": "spirit",
  "restriction": "any",
  "elements": [
   "fire",
   "earth",
   "plant"
  ],
  "text": "ในพื้นที่เดียวภายในระยะ 2 ของอำนาจสถิตคุณ เป้าหมายนำอำนาจสถิตที่ถูกทำลายกลับมา 2 หากเพิ่มได้อย่างน้อย 1 ทำความเสียหาย 2 ต่อหมู่บ้านและเมืองทุกแห่ง หากมีไฟ 3 ดิน 3 พืช 2 เพิ่มความเสียหาย 4",
  "art": 69,
  "threshold": {
   "fire": 3,
   "earth": 3,
   "plant": 2
  }
 },
 {
  "id": "j2",
  "name": "อุทกภัยชำระล้าง",
  "en": "Cleansing Floods",
  "kind": "major",
  "cost": 5,
  "speed": "slow",
  "range": 1,
  "source": "wetland",
  "target": "land",
  "restriction": "any",
  "elements": [
   "sun",
   "water"
  ],
  "text": "ความเสียหาย 4 ถอนความเสื่อมโทรม 1 หากมีน้ำ 4 เพิ่มความเสียหาย 10",
  "art": 70,
  "threshold": {
   "water": 4
  }
 },
 {
  "id": "j3",
  "name": "สลายสายใยเครือญาติ",
  "en": "Dissolve the Bonds of Kinship",
  "kind": "major",
  "cost": 4,
  "speed": "slow",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "fire",
   "water",
   "animal"
  ],
  "text": "แทนเมือง 1 ด้วยนักสำรวจ 2 แทนหมู่บ้าน 1 และดาฮาน 1 ด้วยนักสำรวจอย่างละ 1 แล้วผลักนักสำรวจทั้งหมดให้แยกไปต่างพื้นที่เท่าที่ทำได้ หากมีไฟ 2 น้ำ 2 สัตว์ 3 ก่อนผลัก ผู้รุกรานทั้งสองกลุ่มโจมตีกัน",
  "art": 71,
  "threshold": {
   "fire": 2,
   "water": 2,
   "animal": 3
  }
 },
 {
  "id": "j4",
  "name": "พลังประสานสัมพันธ์",
  "en": "Entwined Power",
  "kind": "major",
  "cost": 2,
  "speed": "fast",
  "range": 0,
  "source": "presence",
  "target": "other",
  "restriction": "any",
  "elements": [
   "moon",
   "water",
   "plant"
  ],
  "text": "คุณกับเป้าหมายใช้อำนาจสถิตของกันและกันเป็นต้นทางพลังได้ เป้าหมายเลือกพลังจาก 4 ใบ คุณรับ 1 ในใบที่เขาไม่เก็บ หากมีน้ำ 2 พืช 4 ทั้งคู่รับพลังงาน 3 และอาจแลกการ์ดจากมือกันคนละ 1",
  "art": 72,
  "threshold": {
   "water": 2,
   "plant": 4
  }
 },
 {
  "id": "j5",
  "name": "ประกาศสิทธิ์อันไม่สั่นคลอน",
  "en": "Indomitable Claim",
  "kind": "major",
  "cost": 4,
  "speed": "fast",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "sun",
   "earth"
  ],
  "text": "เพิ่มอำนาจสถิต 1 ในพื้นที่นี้ได้แม้ปกติชนิดพื้นที่จะห้าม และป้องกัน 20 หากมีอาทิตย์ 2 ดิน 3 และมีผู้รุกราน สร้างความกลัว 3 และข้ามการกระทำผู้รุกรานทุกชนิด",
  "art": 73,
  "threshold": {
   "sun": 2,
   "earth": 3
  }
 },
 {
  "id": "j6",
  "name": "ชีวิตไร้ขอบเขต",
  "en": "Infinite Vitality",
  "kind": "major",
  "cost": 3,
  "speed": "fast",
  "range": 1,
  "source": "sacred",
  "target": "land",
  "restriction": "any",
  "elements": [
   "earth",
   "plant",
   "animal"
  ],
  "text": "ดาฮานมีพลังชีวิตเพิ่ม 4 และพื้นที่ไม่รับความเสื่อมโทรมในรอบนี้ หากมีดิน 4 ดาฮานไม่รับความเสียหายหรือการทำลาย และถอนความเสื่อมโทรม 1 จากพื้นที่นี้หรือพื้นที่ติดกัน",
  "art": 74,
  "threshold": {
   "earth": 4
  }
 },
 {
  "id": "j7",
  "name": "หมอกแห่งการเลือนหาย",
  "en": "Mists of Oblivion",
  "kind": "major",
  "cost": 4,
  "speed": "slow",
  "range": 3,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "moon",
   "air",
   "water"
  ],
  "text": "ความเสียหาย 1 ต่อผู้รุกรานทุกตัว เพิ่มความกลัว 1 ต่อหมู่บ้านหรือเมืองที่พลังนี้ทำลาย สูงสุด 4 หากมีจันทร์ 2 ลม 3 น้ำ 2 เพิ่มความเสียหาย 3",
  "art": 75,
  "threshold": {
   "moon": 2,
   "air": 3,
   "water": 2
  }
 },
 {
  "id": "j8",
  "name": "ความกลัวตรึงร่าง",
  "en": "Paralyzing Fright",
  "kind": "major",
  "cost": 4,
  "speed": "fast",
  "range": 1,
  "source": "sacred",
  "target": "land",
  "restriction": "any",
  "elements": [
   "air",
   "earth"
  ],
  "text": "ความกลัว 4 ข้ามการกระทำผู้รุกรานทุกชนิด หากมีลม 2 ดิน 3 เพิ่มความกลัว 4",
  "art": 76,
  "threshold": {
   "air": 2,
   "earth": 3
  }
 },
 {
  "id": "j9",
  "name": "เสาเพลิงมีชีวิต",
  "en": "Pillar of Living Flame",
  "kind": "major",
  "cost": 5,
  "speed": "slow",
  "range": 2,
  "source": "sacred",
  "target": "land",
  "restriction": "any",
  "elements": [
   "fire"
  ],
  "text": "ความกลัว 3 ความเสียหาย 5 หากเป็นป่าหรือพื้นที่ชุ่มน้ำ เพิ่มความเสื่อมโทรม 1 หากมีไฟ 4 เพิ่มความกลัว 2 และความเสียหาย 5",
  "art": 77,
  "threshold": {
   "fire": 4
  }
 },
 {
  "id": "j10",
  "name": "ผืนดินพิษ",
  "en": "Poisoned Land",
  "kind": "major",
  "cost": 3,
  "speed": "slow",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "earth",
   "plant",
   "animal"
  ],
  "text": "ความกลัว 1 ความเสียหาย 7 เพิ่มความเสื่อมโทรม 1 และทำลายดาฮานทั้งหมด หากมีดิน 3 พืช 2 สัตว์ 2 สร้างความกลัว 1 และความเสียหาย 4 ต่อความเสื่อมโทรมแต่ละชิ้นหลังเพิ่มแล้ว",
  "art": 78,
  "threshold": {
   "earth": 3,
   "plant": 2,
   "animal": 2
  }
 },
 {
  "id": "j11",
  "name": "พายุแห่งพลัง",
  "en": "Powerstorm",
  "kind": "major",
  "cost": 3,
  "speed": "fast",
  "range": 0,
  "source": "presence",
  "target": "spirit",
  "restriction": "any",
  "elements": [
   "sun",
   "fire",
   "air"
  ],
  "text": "เป้าหมายรับพลังงาน 3 อาจใช้การ์ดพลังซ้ำ 1 ใบโดยจ่ายพลังงานอีกครั้ง หากมีอาทิตย์ 2 ไฟ 2 ลม 3 อาจใช้ใบอื่นซ้ำได้เพิ่ม 2 ใบ ไม่ได้ธาตุเพิ่มจากการใช้ซ้ำ",
  "art": 79,
  "threshold": {
   "sun": 2,
   "fire": 2,
   "air": 3
  }
 },
 {
  "id": "j12",
  "name": "กรงเล็บสายฟ้า",
  "en": "Talons of Lightning",
  "kind": "major",
  "cost": 6,
  "speed": "fast",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "mountain,wetland",
  "elements": [
   "fire",
   "air"
  ],
  "text": "ความกลัว 3 ความเสียหาย 5 หากมีไฟ 3 ลม 3 ระยะเพิ่มเป็น 3 และทำลายหมู่บ้าน 1 ในแต่ละพื้นที่ติดกัน",
  "art": 80,
  "threshold": {
   "fire": 3,
   "air": 3
  }
 },
 {
  "id": "j13",
  "name": "ฝันร้ายชวนสะพรึง",
  "en": "Terrifying Nightmares",
  "kind": "major",
  "cost": 4,
  "speed": "fast",
  "range": 2,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "moon",
   "air"
  ],
  "text": "ความกลัว 2 ผลักนักสำรวจหรือหมู่บ้านไม่เกิน 4 หากมีจันทร์ 4 เพิ่มความกลัว 4",
  "art": 81,
  "threshold": {
   "moon": 4
  }
 },
 {
  "id": "j14",
  "name": "ป่าหิวโหย",
  "en": "The Jungle Hungers",
  "kind": "major",
  "cost": 3,
  "speed": "slow",
  "range": 1,
  "source": "jungle",
  "target": "land",
  "restriction": "any",
  "elements": [
   "moon",
   "plant"
  ],
  "text": "ทำลายนักสำรวจ หมู่บ้าน และดาฮานทั้งหมด หากมีจันทร์ 2 พืช 3 ทำลายเมือง 1 เพิ่ม และไม่ทำลายดาฮาน",
  "art": 82,
  "threshold": {
   "moon": 2,
   "plant": 3
  }
 },
 {
  "id": "j15",
  "name": "ผืนดินดิ้นด้วยความเจ็บปวด",
  "en": "The Land Thrashes in Furious Pain",
  "kind": "major",
  "cost": 4,
  "speed": "slow",
  "range": 2,
  "source": "presence",
  "target": "land",
  "restriction": "blight",
  "elements": [
   "moon",
   "fire",
   "earth"
  ],
  "text": "ความเสียหาย 2 ต่อความเสื่อมโทรมในพื้นที่นี้ บวก 1 ต่อความเสื่อมโทรมในพื้นที่ติดกัน หากมีจันทร์ 3 ดิน 3 ใช้ซ้ำในพื้นที่ติดกัน โดยไม่สนระยะและเงื่อนไขเป้าหมาย",
  "art": 83,
  "threshold": {
   "moon": 3,
   "earth": 3
  }
 },
 {
  "id": "j16",
  "name": "ต้นไม้และศิลากล่าวถึงสงคราม",
  "en": "The Trees and Stones Speak of War",
  "kind": "major",
  "cost": 2,
  "speed": "fast",
  "range": 1,
  "source": "presence",
  "target": "land",
  "restriction": "dahan",
  "elements": [
   "sun",
   "earth",
   "plant"
  ],
  "text": "ความเสียหาย 1 และป้องกัน 2 ต่อดาฮาน หากมีอาทิตย์ 2 ดิน 2 พืช 2 อาจผลักดาฮานไม่เกิน 2 คน โดยย้ายการป้องกันคนละ 2 ไปด้วย",
  "art": 84,
  "threshold": {
   "sun": 2,
   "earth": 2,
   "plant": 2
  }
 },
 {
  "id": "j17",
  "name": "สึนามิ",
  "en": "Tsunami",
  "kind": "major",
  "cost": 6,
  "speed": "slow",
  "range": 2,
  "source": "sacred",
  "target": "land",
  "restriction": "coastal",
  "elements": [
   "water",
   "earth"
  ],
  "text": "ความกลัว 2 ความเสียหาย 8 ทำลายดาฮาน 2 หากมีน้ำ 3 ดิน 2 แต่ละพื้นที่ชายฝั่งอื่นบนกระดานเดียวกันรับความกลัว 1 ความเสียหาย 4 และทำลายดาฮาน 1",
  "art": 85,
  "threshold": {
   "water": 3,
   "earth": 2
  }
 },
 {
  "id": "j18",
  "name": "การแก้แค้นของผู้ล่วงลับ",
  "en": "Vengeance of the Dead",
  "kind": "major",
  "cost": 3,
  "speed": "fast",
  "range": 3,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "moon",
   "fire",
   "animal"
  ],
  "text": "ความกลัว 3 ตลอดรอบนี้ เมื่อหมู่บ้าน เมือง หรือดาฮานถูกทำลายในพื้นที่ สร้างความเสียหาย 1 ต่อชิ้นที่ถูกทำลาย ผลนี้ไม่กระตุ้นตัวเอง หากมีสัตว์ 3 เลือกกระจายความเสียหายไปพื้นที่ติดกันได้",
  "art": 86,
  "threshold": {
   "animal": 3
  }
 },
 {
  "id": "j19",
  "name": "พลังแห่งรุ่งอรุณ",
  "en": "Vigor of the Breaking Dawn",
  "kind": "major",
  "cost": 3,
  "speed": "fast",
  "range": 2,
  "source": "presence",
  "target": "land",
  "restriction": "dahan",
  "elements": [
   "sun",
   "animal"
  ],
  "text": "ความเสียหาย 2 ต่อดาฮาน หากมีอาทิตย์ 3 สัตว์ 2 อาจผลักดาฮานไม่เกิน 2 ไปพื้นที่ติดกัน แล้วสร้างความเสียหาย 2 ต่อดาฮานในปลายทางเหล่านั้น",
  "art": 87,
  "threshold": {
   "sun": 3,
   "animal": 2
  }
 },
 {
  "id": "j20",
  "name": "ลมสนิมและการเสื่อมสลาย",
  "en": "Winds of Rust and Atrophy",
  "kind": "major",
  "cost": 3,
  "speed": "fast",
  "range": 3,
  "source": "sacred",
  "target": "land",
  "restriction": "any",
  "elements": [
   "air",
   "water",
   "animal"
  ],
  "text": "ความกลัว 1 ป้องกัน 6 ลดระดับหมู่บ้านหรือเมือง 1 หากมีลม 3 น้ำ 3 สัตว์ 2 ใช้พลังนี้ซ้ำ",
  "art": 88,
  "threshold": {
   "air": 3,
   "water": 3,
   "animal": 2
  }
 },
 {
  "id": "j21",
  "name": "อ้อมปีกแห่งแสงตะวัน",
  "en": "Wrap in Wings of Sunlight",
  "kind": "major",
  "cost": 3,
  "speed": "fast",
  "range": 0,
  "source": "presence",
  "target": "land",
  "restriction": "any",
  "elements": [
   "sun",
   "air",
   "animal"
  ],
  "text": "ย้ายดาฮานไม่เกิน 5 ไปพื้นที่เดียวใดก็ได้ รวมถึงพื้นที่เดิม หากย้ายอย่างน้อย 1 ป้องกัน 5 ที่นั่น หากมีอาทิตย์ 2 ลม 2 สัตว์ 2 รวมดาฮานไม่เกิน 3 ก่อนย้าย",
  "art": 89,
  "threshold": {
   "sun": 2,
   "air": 2,
   "animal": 2
  }
 }
];
export const power=(id:string)=>{const c=POWERS.find(c=>c.id===id);if(!c)throw Error('ไม่พบการ์ดพลัง');return c;};
export const powerArt=(id:string)=>`/art/spirit-island/power-${power(id).art}.webp`;
