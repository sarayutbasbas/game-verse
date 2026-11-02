import type {Card} from './types.js';
// Original Thai web pack. These are not a transcription of the retail deck.
export const CARDS:Card[]=[
 {id:'double',name:'อบมาเผื่อ',kind:'action',effect:'draw',amount:2,target:false,art:0,text:'จั่ว 2 ใบ'},
 {id:'rocket',name:'ส่งมัฟฟินขึ้นฟ้า',kind:'action',effect:'draw',amount:3,target:false,art:1,text:'จั่ว 3 ใบ'},
 {id:'treasure',name:'เจอคลังขนม',kind:'action',effect:'draw',amount:4,target:false,art:2,text:'จั่ว 4 ใบ'},
 {id:'feast',name:'ราชาโต๊ะขนม',kind:'action',effect:'draw',amount:5,target:false,art:3,text:'จั่ว 5 ใบ'},
 {id:'snatch',name:'ขอชิมคำเดียว',kind:'action',effect:'steal',amount:1,target:true,art:4,text:'สุ่มขโมย 1 ใบจากมือผู้เล่นที่เลือก โดยไม่แอบดู'},
 {id:'octopus',name:'มือเยอะไปหน่อย',kind:'action',effect:'steal',amount:2,target:true,art:5,text:'สุ่มขโมย 2 ใบจากมือผู้เล่นที่เลือก'},
 {id:'burglar',name:'หายทั้งถาด',kind:'action',effect:'steal',amount:3,target:true,art:6,text:'สุ่มขโมย 3 ใบจากมือผู้เล่นที่เลือก'},
 {id:'swap',name:'สลับถาดกันไหม',kind:'action',effect:'swap',amount:0,target:true,art:7,text:'แลกไพ่ในมือทั้งหมดกับผู้เล่นที่เลือก ไม่รวมกับดักที่วางไว้'},
 {id:'vacuum',name:'เครื่องดูดเศษขนม',kind:'action',effect:'discard',amount:2,target:true,art:8,text:'ผู้เล่นที่เลือกสุ่มทิ้งไพ่ 2 ใบ'},
 {id:'boom',name:'ฟูเกินพิมพ์',kind:'action',effect:'clear',amount:0,target:true,art:9,text:'ผู้เล่นที่เลือกทิ้งไพ่ในมือทั้งหมด ไม่รวมกับดักที่วางไว้'},
 {id:'rotate',name:'โต๊ะหมุนติ้ว',kind:'action',effect:'rotate',amount:0,target:false,art:10,text:'ส่งไพ่ในมือทั้งหมดให้คนถัดไปตามทิศการเล่น พร้อมกันทุกคน'},
 {id:'party',name:'แจกขนมทั้งโต๊ะ',kind:'action',effect:'allDraw',amount:2,target:false,art:11,text:'ผู้เล่นทุกคนจั่วคนละ 2 ใบ'},
 {id:'half',name:'แบ่งครึ่งดีกว่า',kind:'action',effect:'half',amount:0,target:true,art:12,text:'ผู้เล่นที่เลือกสุ่มทิ้งครึ่งหนึ่งของไพ่ในมือ ปัดลง'},
 {id:'nap',name:'งีบก่อนหนึ่งตา',kind:'action',effect:'skip',amount:1,target:true,art:13,text:'ผู้เล่นที่เลือกข้ามตาครั้งถัดไป ยังประกาศ 10 ใบ ใช้กับดักและสวนได้'},
 {id:'reverse',name:'กลับเตาอีกด้าน',kind:'action',effect:'reverse',amount:0,target:false,art:14,text:'กลับทิศการเล่น มีผลตั้งแต่ตาถัดไป'},
 {id:'mix',name:'ใครเปิดเครื่องปั่น',kind:'action',effect:'mix',amount:0,target:false,art:15,text:'รวมไพ่ในมือทุกคน สับ แล้วแจกคืนตามจำนวนเดิมของแต่ละคน'},
 {id:'draw-trap',name:'ขนมเด้งจากกล่อง',kind:'trap',effect:'steal',amount:2,target:true,art:16,trigger:'draw',text:'เมื่อคนอื่นจั่ว 1 ใบตามตาปกติ เปิดใบนี้เพื่อสุ่มขโมยเขา 2 ใบ'},
 {id:'play-trap',name:'เบ็ดเกี่ยวถาด',kind:'trap',effect:'discard',amount:2,target:true,art:17,trigger:'play',text:'หลังแอ็กชันของคนอื่นจบ เปิดใบนี้ให้คนที่เล่นสุ่มทิ้ง 2 ใบ'},
 {id:'claim-trap',name:'กริ่งดังเกินไป',kind:'trap',effect:'discard',amount:3,target:true,art:18,trigger:'claim',text:'เมื่อคนอื่นประกาศมัฟฟินไทม์ เปิดใบนี้ให้เขาสุ่มทิ้ง 3 ใบ'},
 {id:'bonus-trap',name:'เฝ้าเตาให้หน่อย',kind:'trap',effect:'draw',amount:2,target:false,art:19,trigger:'draw',text:'เมื่อคนอื่นจั่ว 1 ใบตามตาปกติ เปิดใบนี้เพื่อจั่ว 2 ใบเอง'},
 {id:'stop',name:'เดี๋ยวก่อนนะ',kind:'counter',effect:'counter',amount:0,target:false,art:20,text:'หยุดแอ็กชัน กับดัก หรือการ์ดสวนใบล่าสุดของคนอื่น ไม่หยุดมินิเกม'},
 {id:'shield',name:'ฝาครอบขนม',kind:'counter',effect:'counter',amount:0,target:false,art:21,text:'หยุดแอ็กชัน กับดัก หรือการ์ดสวนใบล่าสุดของคนอื่น ไม่หยุดมินิเกม'},
 {id:'undo',name:'ยังไม่นับเมื่อกี้',kind:'counter',effect:'counter',amount:0,target:false,art:22,text:'หยุดแอ็กชัน กับดัก หรือการ์ดสวนใบล่าสุดของคนอื่น ไม่หยุดมินิเกม'},
 {id:'duel',name:'เป่ายิ้งฉุบแย่งถาด',kind:'action',effect:'duel',amount:2,target:true,art:23,text:'เลือกคู่แข่ง เป่ายิ้งฉุบพร้อมกันแบบลับ ผู้ชนะจั่ว 2 ใบ ถ้าเสมอจั่วคนละ 1 ใบ มินิเกมสวนไม่ได้'},
];
export const COPIES=5;
export const instances=()=>CARDS.flatMap(c=>Array.from({length:COPIES},(_,i)=>`${c.id}:${i}`));
export function definition(instance:string):Card{const c=CARDS.find(c=>c.id===instance.split(':')[0]);if(!c)throw Error('ไม่พบการ์ด');return c;}
export const KIND_NAME={action:'แอ็กชัน',trap:'กับดัก',counter:'สวนกลับ'};
export const cardArt=(instance:string)=>`/art/muffin-time/cards/${definition(instance).id}.webp`;
