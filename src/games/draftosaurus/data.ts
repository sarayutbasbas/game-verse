import type {Pen,Species,Face,Zoo} from './types.js';
export const DINO:Record<Species,{name:string;color:string}>={trex:{name:'ทีเร็กซ์',color:'#d65c46'},triceratops:{name:'ไทรเซราทอปส์',color:'#e7b431'},diplodocus:{name:'ดิพลอโดคัส',color:'#369b8f'},stegosaurus:{name:'สเตโกซอรัส',color:'#9371b2'},parasaurolophus:{name:'พาราซอโรโลฟัส',color:'#df8b38'},spinosaurus:{name:'สไปโนซอรัส',color:'#4f9cc3'}};
export const PEN:Record<Pen,{name:string;area:'woodlands'|'grasslands'|'river';side:'left'|'right'|'river';capacity:number;rule:string;short:string}>={
 forest:{name:'ป่าเพื่อนพันธุ์เดียว',area:'woodlands',side:'left',capacity:6,rule:'รับเฉพาะชนิดเดียวกัน สูงสุด 6 ตัว วางต่อกันจากซ้ายไปขวา จำนวน 1–6 ตัวได้ 2 / 4 / 8 / 12 / 18 / 24 คะแนน',short:'ชนิดเดียว · 2/4/8/12/18/24'},
 king:{name:'ราชาแห่งป่า',area:'woodlands',side:'right',capacity:1,rule:'รับ 1 ตัว ได้ 7 คะแนนเมื่อทั้งสวนของคุณมีชนิดนี้มากกว่าหรือเท่ากับสวนของผู้เล่นทุกคน นับในทุกคอกรวมแม่น้ำด้วย เสมอจำนวนก็ได้คะแนน',short:'มากที่สุดหรือเสมอ = 7'},
 trio:{name:'ป่าสามสหาย',area:'woodlands',side:'left',capacity:3,rule:'รับได้ทุกชนิด สูงสุด 3 ตัว ได้ 7 คะแนนเมื่อมีครบ 3 ตัวพอดี ถ้ามี 1 หรือ 2 ตัวได้ 0',short:'ครบ 3 ตัว = 7'},
 meadow:{name:'ทุ่งหลากสายพันธุ์',area:'grasslands',side:'right',capacity:6,rule:'รับเฉพาะชนิดไม่ซ้ำกัน สูงสุด 6 ตัว จำนวน 1–6 ตัวได้ 1 / 3 / 6 / 10 / 15 / 21 คะแนน',short:'ห้ามซ้ำ · 1/3/6/10/15/21'},
 love:{name:'ทุ่งคู่รัก',area:'grasslands',side:'left',capacity:12,rule:'รับทุกชนิด ชนิดเดียวกันทุก 2 ตัวได้ 5 คะแนน ชนิดเดิมมีได้หลายคู่ ตัวที่ไม่ครบคู่ไม่ให้คะแนน',short:'ชนิดเดียวทุกคู่ = 5'},
 solitary:{name:'เกาะสันโดษ',area:'grasslands',side:'right',capacity:1,rule:'รับ 1 ตัว ได้ 7 คะแนนเมื่อเป็นเพียงตัวเดียวของชนิดนี้ในสวนทั้งหมด รวมทุกคอกและแม่น้ำ',short:'ชนิดนี้ตัวเดียวในสวน = 7'},
 river:{name:'แม่น้ำ',area:'river',side:'river',capacity:12,rule:'ลงได้เสมอ ไม่ติดข้อจำกัดเต๋า ตัวละ 1 คะแนน แม่น้ำไม่ใช่คอก จึงไม่มีโบนัสทีเร็กซ์',short:'ลงได้เสมอ · ตัวละ 1'}
};
export const FACE:Record<Face,{name:string;symbol:string;rule:string}>={woodlands:{name:'เขตป่า',symbol:'tree',rule:'ลงเฉพาะคอกในเขตป่า'},grasslands:{name:'เขตทุ่ง',symbol:'grass',rule:'ลงเฉพาะคอกในเขตทุ่ง'},left:{name:'ฝั่งศูนย์อาหาร',symbol:'food',rule:'ลงเฉพาะคอกฝั่งซ้ายของแม่น้ำ'},right:{name:'ฝั่งห้องน้ำ',symbol:'restroom',rule:'ลงเฉพาะคอกฝั่งขวาของแม่น้ำ'},empty:{name:'คอกว่าง',symbol:'empty',rule:'ลงเฉพาะคอกที่ยังไม่มีไดโนเสาร์'},'no-trex':{name:'ระวังทีเร็กซ์',symbol:'trex',rule:'ลงเฉพาะคอกที่ยังไม่มีทีเร็กซ์ แต่เลือกวางทีเร็กซ์ตัวใหม่ได้'}};
export const species=(id:string):Species=>id.split('-')[0] as Species;
export const emptyZoo=():Zoo=>({forest:[],king:[],trio:[],meadow:[],love:[],solitary:[],river:[]});
