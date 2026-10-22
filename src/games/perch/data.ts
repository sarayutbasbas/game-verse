import {COLORS,type Color,type LocationId,type Creature,type Tile} from './types.js';
export const BIRD:Record<Color,{name:string;hex:string}>={red:{name:'แดง',hex:'#d94b51'},blue:{name:'ฟ้า',hex:'#329ed2'},yellow:{name:'เหลือง',hex:'#edbd40'},green:{name:'เขียว',hex:'#79b649'},black:{name:'ดำ',hex:'#3c4053'}};
export const zero=()=>Object.fromEntries(COLORS.map(c=>[c,0])) as Record<Color,number>;
export const LOCATION:Record<LocationId,{name:string;en:string;points:number[];nests:number;type:'basic'|'special'|'creature';help:string;creature?:Creature;art:number}>= {
 pine:{name:'สนหอม',en:'The Scented Pine Trees',points:[3,5,2],nests:1,type:'basic',help:'อันดับหนึ่ง 3 อันดับสอง 5 อันดับสาม 2 คะแนน มีรัง 1 รัง',art:0},
 ash:{name:'ต้นแอชใหญ่',en:'The Great Ash Tree',points:[5,3,2],nests:1,type:'basic',help:'อันดับหนึ่ง 5 อันดับสอง 3 อันดับสาม 2 คะแนน มีรัง 1 รัง',art:1},
 doghouse:{name:'บ้านสุนัข',en:'The Doghouse',points:[1,3,1],nests:0,type:'creature',creature:'dog',help:'ช่วงดูแล ผู้ครองพื้นที่ได้รับการควบคุมสุนัขในรอบถัดไป',art:2},
 country:{name:'บ้านชนบท',en:'A Country House',points:[0,1,1],nests:0,type:'creature',creature:'cat',help:'ช่วงดูแล ผู้ครองพื้นที่ได้รับการควบคุมแมวในรอบถัดไป',art:3},
 hanging:{name:'รังแขวนโงนเงน',en:'The Precariously Hanging Nest',points:[5,3,1],nests:0,type:'special',help:'หลังคิดคะแนน หากพื้นที่นี้มีนกรวมอย่างน้อย 4 ตัว ส่งนกทั้งหมดที่ไม่ได้รับการปกป้องไปลาน นกฝูงกลางกลับแหล่งพักแทน',art:4},
 early:{name:'นกตื่นเช้า',en:'The Early Bird',points:[3,4,5],nests:0,type:'special',help:'ช่วงอพยพ ผู้ครองพื้นที่เพิ่มนกสีตนจากแหล่งพักลงถุงอีก 1 ตัว',art:5},
 elm:{name:'เอล์มเดียวดาย',en:'The Lonely Elm Tree',points:[5,0,2],nests:1,type:'basic',help:'อันดับหนึ่ง 5 อันดับสอง 0 อันดับสาม 2 คะแนน มีรัง 1 รัง',art:6},
 hawk:{name:'รังเหยี่ยว',en:'The Hawk’s Nest',points:[1,1,2],nests:0,type:'creature',creature:'hawk',help:'ช่วงดูแล ผู้ครองพื้นที่ได้รับการควบคุมเหยี่ยวในรอบถัดไป',art:7},
 corn:{name:'ไร่ข้าวโพด',en:'A Cornfield',points:[0,2,2],nests:0,type:'creature',creature:'scarecrow',help:'ผู้ครองพื้นที่ควบคุมหุ่นไล่กา เมื่อเปลี่ยนผู้ควบคุม เลือกจุดบรรจบของ 3 พื้นที่ให้หุ่นยืน',art:9},
 oak:{name:'โอ๊กยักษ์',en:'The Mighty Oak Tree',points:[6,4,3],nests:2,type:'basic',help:'อันดับหนึ่ง 6 อันดับสอง 4 อันดับสาม 3 คะแนน มีรัง 2 รัง',art:8},
 birch:{name:'เบิร์ชผลัดเปลือก',en:'The Peeling Birch Trees',points:[5,3,3],nests:1,type:'basic',help:'อันดับหนึ่ง 5 อันดับสอง 3 อันดับสาม 3 คะแนน มีรัง 1 รัง',art:10},
 birdbath:{name:'อ่างนกสุขใจ',en:'The Happy Birdbath',points:[2,0,1],nests:0,type:'special',help:'ผู้ครองพื้นที่รับนกก่อนคนอื่น สุ่มจากถุง 3 ตัวแล้วเลือกคืน 1 ตัว ก่อนคนอื่นสุ่มตามปกติ',art:11},
 fox:{name:'โพรงจิ้งจอก',en:'The Fox’s Den',points:[0,0,1],nests:0,type:'creature',creature:'fox',help:'ช่วงดูแล ผู้ครองพื้นที่ได้รับการควบคุมจิ้งจอกในรอบถัดไป',art:12}
};
export const ANIMAL:Record<Creature,{name:string;help:string;art:number}>={dog:{name:'สุนัข',art:0,help:'ย้ายไปพื้นที่ติดกัน แล้วอาจไล่นก 1 ตัวจากพื้นที่นั้นไปพื้นที่ติดกันใดก็ได้ หากไล่ออกนอกกระดาน ส่งไปน้ำพุ'},cat:{name:'แมว',art:1,help:'ย้ายไปพื้นที่ติดกันที่มีนกรวมมากที่สุด หากเสมอเลือกได้ แล้วอาจส่งนก 1 ตัวไปน้ำพุและย้ายนกอีก 1 ตัวไปพื้นที่ติดกัน'},hawk:{name:'เหยี่ยว',art:2,help:'ย้ายไปพื้นที่อื่นใดก็ได้ แล้วอาจส่งนก 1 ตัวจากพื้นที่ที่เหยี่ยวหยุดไปน้ำพุ'},fox:{name:'จิ้งจอก',art:3,help:'ย้าย 2 พื้นที่พอดีโดยไม่ย้อนกลับ แล้วอาจส่งนก 1 ตัวจากแต่ละพื้นที่ที่ผ่านและหยุดไปน้ำพุ'},scarecrow:{name:'หุ่นไล่กา',art:5,help:'ยืนตรงจุดบรรจบเดิมจนเปลี่ยนผู้ควบคุม เมื่อใช้ ส่งนก 1 ตัวจาก 2 พื้นที่ต่างกันที่ติดกับหุ่นไปน้ำพุ'}};
export const BASE:LocationId[]=['pine','ash','doghouse','country','hanging','early','elm','hawk'];
export function makeTiles(n:number):Tile[]{const columns:LocationId[][]=[['pine','ash','doghouse'],['country','hanging'],['early','elm','hawk']];if(n>=4)columns.unshift(['corn','oak']);if(n===5)columns.unshift(['birch','birdbath','fox']);return columns.flatMap((col,x)=>col.map((id,i)=>({id,x,y:i*2+(col.length===2?1:0),birds:zero(),nests:Array(LOCATION[id].nests).fill(null),houses:[]})));}
export const DIRECTIONS=[[0,-2],[1,-1],[1,1],[0,2],[-1,1],[-1,-1]] as const;
export const adjacent=(a:Tile,b:Tile)=>DIRECTIONS.some(([x,y])=>a.x+x===b.x&&a.y+y===b.y);
export function fountainLayout(n:number){const small=n<=3,widths=small?[4,3,2,2,1]:[4,4,4,3,2,1],points=small?[1,2,3,4,6]:[1,1,2,3,5,8];let id=0;const rows=widths.map((w,l)=>Array.from({length:w},(_,i)=>({id:id++,level:l,x:3-(w-1)+i*2,points:points[l],needs:[] as number[]})));for(let l=1;l<rows.length;l++)for(const cell of rows[l])cell.needs=rows[l-1].filter(b=>small&&l===3?true:widths[l]===widths[l-1]?b.x===cell.x:Math.abs(b.x-cell.x)===1).map(b=>b.id);return rows.flat();}
