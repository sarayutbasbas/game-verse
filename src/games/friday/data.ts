import type {Ability,Card,Pirate} from './types.js';

export const ABILITIES:Record<Ability,{name:string;text:string}>={
 none:{name:'ไม่มีความสามารถ',text:'ใช้ค่าพลังต่อสู้ที่พิมพ์บนการ์ด'},
 life1:{name:'ฟื้นชีวิต +1',text:'รับชีวิตจากกองสำรอง 1 หน่วย ไม่เกินจำนวนชีวิตทั้งหมดของระดับนี้'},
 life2:{name:'ฟื้นชีวิต +2',text:'รับชีวิตจากกองสำรองได้สูงสุด 2 หน่วย'},
 draw1:{name:'จั่วเพิ่ม 1',text:'จั่วการ์ดต่อสู้เพิ่มฟรี 1 ใบ วางฝั่งการ์ดเพิ่มเติม'},
 draw2:{name:'จั่วเพิ่มสูงสุด 2',text:'จั่วฟรีทีละใบได้สูงสุด 2 ใบ จบความสามารถนี้ก่อนใช้อย่างอื่น'},
 destroy:{name:'ทำลาย 1 ใบ',text:'คว่ำการ์ดอื่นที่เปิดแล้ว 1 ใบ พลังเป็น 0 และความสามารถหายไป ยังนับเป็นหนึ่งใบจนจบการต่อสู้ แล้วนำออกจากเกม'},
 double:{name:'พลังสองเท่า',text:'เลือกการ์ดอื่น 1 ใบให้พลังเป็นสองเท่าตอนสรุปผล แต่ละใบคูณได้ครั้งเดียว ถ้าถูกทำให้พลังเป็น 0 ก็ยังได้ 0'},
 copy:{name:'คัดลอกความสามารถ',text:'ใช้ความสามารถของการ์ดอื่นที่เปิดอยู่ได้อีกครั้ง แม้ใบนั้นใช้แล้ว คัดลอกต่อกันได้ แต่ห้ามวนกลับมาที่ใบเดิม'},
 lower:{name:'ลดความยาก 1 สี',text:'ตอนสรุปผลใช้ค่าความเสี่ยงสีที่ง่ายลง 1 ขั้น ต่ำสุดสีเขียว ไม่มีผลกับโจรสลัด'},
 sort:{name:'ดูและเรียงสูงสุด 3',text:'แอบดูทีละใบได้สูงสุด 3 ใบ เลือกทิ้งได้ไม่เกิน 1 ใบ แล้วเรียงที่เหลือกลับบนกอง ไพ่ที่ดูยังไม่ใช่การ์ดในสนาม'},
 exchange1:{name:'เปลี่ยน 1 ใบ',text:'ทิ้งการ์ดอื่นที่เปิดอยู่ แล้วจั่วแทนในตำแหน่งเดิม ใช้กับใบที่ใช้ความสามารถแล้วได้'},
 exchange2:{name:'เปลี่ยนสูงสุด 2',text:'เปลี่ยนทีละใบได้สูงสุด 2 ครั้ง ครั้งที่สองเลือกเปลี่ยนใบที่เพิ่งจั่วแทนได้ ระหว่างนี้ยังใช้ความสามารถใบอื่นไม่ได้'},
 bottom:{name:'เก็บใต้กอง',text:'นำการ์ดอื่น 1 ใบไปใต้กองต่อสู้ ถ้ากองหมดให้ผสมกองทิ้งกับการ์ดแก่ตัวก่อน หากเลือกจากฝั่งจั่วฟรี สามารถจั่วทดแทนได้'},
 lose1:{name:'เสียชีวิต 1',text:'ต้องเสียชีวิตเพิ่ม 1 ตอนจบการต่อสู้ แม้ชนะ ไม่เพิ่มงบทำลายการ์ด ยกเลิกได้ด้วยการทำลายหรือย้ายใบนี้ออก'},
 lose2:{name:'เสียชีวิต 2',text:'ต้องเสียชีวิตเพิ่ม 2 ตอนจบการต่อสู้ ไม่เพิ่มงบทำลายการ์ด'},
 highest:{name:'ใบสูงสุดเป็น 0',text:'ตอนสรุปผล การ์ดที่มีพลังบวกที่พิมพ์สูงสุดหนึ่งใบกลายเป็น 0 ก่อนคูณสอง หากเสมอระบบเลือกทางที่เป็นประโยชน์ต่อคุณ'},
 stop:{name:'หยุดจั่วฟรี',text:'ถ้าอยู่ฝั่งจั่วฟรี จะหยุดจั่วฟรีชั่วคราว จั่วด้วยชีวิตหรือความสามารถได้ เมื่อทำลายหรือย้ายใบนี้ออกก็จั่วฟรีต่อได้'},
};
const names:Partial<Record<Ability,string>>={lower:'ตำรา',copy:'เลียนแบบ',destroy:'ความเข้าใจ',bottom:'กลอุบาย',draw2:'อุปกรณ์',exchange2:'แผนการ',exchange1:'กลยุทธ์',life1:'อาหาร',none:'อาวุธ',double:'ฝึกซ้ำ',sort:'มองการณ์ไกล',draw1:'ประสบการณ์'};
const art:Partial<Record<Ability,number>>={lower:0,copy:1,destroy:2,bottom:3,draw2:4,exchange2:5,exchange1:5,life1:6,none:7,double:8,sort:9,draw1:10};
const knowledge:Card[]=[];
function hazards(free:number,values:[number,number,number],value:number,abilities:Ability[],title:string){for(const ability of abilities)knowledge.push({id:'h'+knowledge.length,name:names[ability]!,kind:'knowledge',value,ability,art:art[ability]!,hazard:{name:title,free,values,art:free-1}});}
hazards(1,[0,1,3],0,['lower','copy','destroy','bottom','draw2','draw2','exchange2','exchange2','life1','life1'],'แพไปยังซากเรือ');
hazards(2,[1,3,6],1,['copy','life1','life1','double','bottom','destroy'],'สำรวจเกาะ');
hazards(2,[1,3,6],2,['none','none'],'สำรวจเกาะ');
hazards(3,[2,5,8],2,['double','sort','life1','draw1','destroy','exchange1'],'สำรวจลึกเข้าไป');
hazards(4,[4,7,11],3,['exchange1','sort','destroy','draw1'],'สัตว์ป่า');
hazards(5,[5,9,14],4,['none','none'],'ชาวเกาะผู้ดุร้าย');
const starting:Card[]=Array.from({length:18},(_,i)=>({id:'s'+i,kind:'starting',name:i===0?'หัวไว':i<4?'ตั้งใจ':i===4?'อิ่มท้อง':i<13?'ยังไม่ชำนาญ':'วอกแวก',value:i===0?2:i<4?1:i<13?0:-1,ability:i===4?'life2':'none',art:i===0?10:i<4?8:i===4?6:11}));
const ages:Card[]=([-1,-2,-2,-3,0,0,0,0,-4,-5,0] as const).map((value,i)=>({id:'a'+i,name:['เสียสมาธิ','พลาดท่า','หลงลืม','สับสนหนัก','หวาดกลัว','ตื่นตระหนก','หิว','อ่อนล้า','งุ่มง่ามมาก','หมดเรี่ยวแรง','หิวจัด'][i],kind:'aging',value,ability:i===4||i===5?'highest':i===6?'lose1':i===7?'stop':i===10?'lose2':'none',difficult:i>=8,art:11}));
export const CARDS:readonly Card[]=[...knowledge,...starting,...ages];
export const KNOWLEDGE=knowledge.map(c=>c.id),STARTING=starting.map(c=>c.id),AGING=ages.map(c=>c.id);
export const card=(id:string):Card=>{const c=CARDS.find(c=>c.id===id);if(!c)throw Error('ไม่พบการ์ด');return c;};
export const cardArt=(id:string,hazard=false)=>{const c=card(id);return `/art/friday/${hazard&&c.hazard?'hazards-'+c.hazard.art:'skills-'+c.art}.webp`;};
export const PIRATES:readonly Pirate[]=[
 {id:'p0',name:'เรือโจรสลัดแนวหน้า',value:20,free:6,ability:'none',text:'เอาชนะด้วยพลังอย่างน้อย 20 จั่วฟรีได้ 6 ใบ'},
 {id:'p1',name:'เรือโจรสลัดไล่ล่า',value:25,free:7,ability:'none',text:'พลังเป้าหมาย 25 จั่วฟรี 7 ใบ'},
 {id:'p2',name:'เรือโจรสลัดปืนใหญ่',value:30,free:8,ability:'none',text:'พลังเป้าหมาย 30 จั่วฟรี 8 ใบ'},
 {id:'p3',name:'กองเรือทะเลลึก',value:35,free:9,ability:'none',text:'พลังเป้าหมาย 35 จั่วฟรี 9 ใบ'},
 {id:'p4',name:'เรือธงของกัปตัน',value:40,free:10,ability:'none',text:'พลังเป้าหมาย 40 จั่วฟรี 10 ใบ'},
 {id:'p5',name:'โจรสลัดเก็บค่าผ่านทาง',value:16,free:7,ability:'cost2',text:'เป้าหมาย 16 จั่วฟรี 7 ใบ การจั่วด้วยชีวิตแต่ละครั้งเสีย 2 แทน 1 ความสามารถจั่วยังคงฟรี'},
 {id:'p6',name:'โจรสลัดคัดกำลัง',value:22,free:9,ability:'half',text:'เป้าหมาย 22 จั่วฟรี 9 ใช้พลังได้เพียงครึ่งหนึ่งของจำนวนใบที่วาง ปัดขึ้น และต้องนับการ์ดแก่ตัวที่เปิดอยู่ทุกใบ ระบบเลือกใบที่ให้พลังมากที่สุดให้'},
 {id:'p7',name:'โจรสลัดปลุกใจ',value:52,free:10,ability:'bonus',text:'เป้าหมาย 52 จั่วฟรี 10 ทุกใบที่วางเพิ่มพลังให้อีก 1 แม้เป็นใบที่ถูกคว่ำรอทำลาย'},
 {id:'p8',name:'โจรสลัดแห่งกาลเวลา',value:0,free:5,ability:'aging',text:'เป้าหมายเท่ากับ 2 × จำนวนการ์ดแก่ตัวที่เคยเพิ่มเข้าสำรับ รวมใบที่ทำลายแล้ว ล็อกเป้าหมายเมื่อเริ่มสู้ จั่วฟรี 5'},
 {id:'p9',name:'ความเสี่ยงครั้งสุดท้าย',value:0,free:0,ability:'hazards',text:'รวมค่าความเสี่ยงสีแดงและจำนวนจั่วฟรีของการ์ดความเสี่ยงที่ยังไม่ชนะทั้งหมด เป็นเป้าหมายและจำนวนจั่วฟรีของโจรสลัดนี้ การ์ดเหล่านั้นยังหักคะแนนท้ายเกม'},
];
export const pirate=(id:string)=>{const p=PIRATES.find(p=>p.id===id);if(!p)throw Error('ไม่พบโจรสลัด');return p;};
