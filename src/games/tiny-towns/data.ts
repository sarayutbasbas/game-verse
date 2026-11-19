import type {BuildingCard,BuildingType,Resource,TinyOptions} from './types.js';
export const RESOURCES:Resource[]=['wood','wheat','brick','glass','stone'];
export const RESOURCE_INFO:Record<Resource,{name:string;symbol:string;color:string}>={wood:{name:'ไม้',symbol:'▤',color:'#9b603b'},wheat:{name:'ข้าวสาลี',symbol:'✦',color:'#efbf37'},brick:{name:'อิฐ',symbol:'▰',color:'#cd5948'},glass:{name:'แก้ว',symbol:'◆',color:'#2fabb2'},stone:{name:'หิน',symbol:'⬟',color:'#a6aaa4'}};
export const LETTERS:Record<string,Resource>={L:'wood',Y:'wheat',R:'brick',G:'glass',S:'stone'};
export const TYPES:BuildingType[]=['cottage','food','gray','worship','green','yellow','black','monument'];
export const TYPE_NAMES:Record<BuildingType,string>={cottage:'บ้าน',food:'อาหาร',gray:'สิ่งอำนวยความสะดวก',worship:'ศาสนสถาน',green:'ชุมชน',yellow:'การค้า',black:'อุตสาหกรรม',monument:'อนุสาวรีย์'};
export const DEFAULT_OPTIONS:TinyOptions={randomBuildings:false,monuments:true,cavern:false,mode:'master'};
const make=(id:string,name:string,en:string,type:BuildingType,pattern:string[],text:string):BuildingCard=>({id,name,en,type,pattern,text});
export const CARDS:BuildingCard[]=[
 make('cottage','บ้านพัก','Cottage','cottage',['.Y','RG'],'บ้านที่ได้รับอาหารให้ 3 คะแนน บ้านที่ไม่ได้รับอาหารให้ 0 คะแนน สร้างก่อนมีอาหารได้'),
 make('farm','ฟาร์ม','Farm','food',['YY','LL'],'แต่ละฟาร์มให้อาหารบ้านได้ 4 หลังที่ใดก็ได้ในเมือง ฟาร์มเองไม่มีคะแนน'),
 make('granary','ยุ้งฉาง','Granary','food',['YY','LR'],'ให้อาหารบ้านทุกหลังใน 8 ช่องรอบตัว รวมแนวทแยง ตัวอาคารไม่มีคะแนน'),
 make('greenhouse','เรือนกระจก','Greenhouse','food',['YG','LL'],'แต่ละหลังให้อาหารบ้าน 1 กลุ่มที่ต่อกันด้วยด้าน กลุ่มนั้นอยู่ที่ใดก็ได้ บ้านทุกหลังในกลุ่มได้รับอาหาร'),
 make('orchard','สวนผลไม้','Orchard','food',['SY','YL'],'ให้อาหารบ้านทุกหลังในแถวและคอลัมน์เดียวกับสวน ไม่รวมแนวทแยง ตัวอาคารไม่มีคะแนน'),
 make('well','บ่อน้ำ','Well','gray',['LS'],'1 คะแนนต่อบ้านที่ติดกันด้วยด้าน ไม่ว่าบ้านนั้นได้รับอาหารหรือไม่'),
 make('shed','โรงเก็บของ','Shed','gray',['LS'],'1 คะแนน หลังคืนทรัพยากรแล้ววางโรงเก็บของในช่องว่างใดก็ได้ ไม่จำกัดเฉพาะช่องที่เพิ่งคืนทรัพยากร'),
 make('fountain','น้ำพุ','Fountain','gray',['LS'],'2 คะแนนถ้าติดน้ำพุอื่นด้วยด้าน ไม่ว่าจะติดกี่หลังก็ได้สูงสุด 2 คะแนนต่อหลัง'),
 make('millstone','โรงโม่','Millstone','gray',['LS'],'2 คะแนนถ้าติดอาคารอาหารสีแดงหรืออาคารการค้าสีเหลืองด้วยด้าน สูงสุด 2 ต่อหลัง'),
 make('chapel','โบสถ์น้อย','Chapel','worship',['..G','SGS'],'แต่ละโบสถ์ได้ 1 คะแนนต่อบ้านที่ได้รับอาหารทุกหลังในเมือง ไม่ต้องอยู่ติดกัน'),
 make('abbey','อาราม','Abbey','worship',['..G','RSS'],'3 คะแนนถ้าไม่ติดอาคารสีเขียว สีเหลือง หรือสีดำด้วยด้าน ถ้าติดชนิดใดชนิดหนึ่งให้ 0'),
 make('cloister','อารามลานสวน','Cloister','worship',['..G','LRS'],'แต่ละหลังได้ 1 คะแนนต่ออารามลานสวนที่อยู่มุมเมือง นับตัวเองด้วยถ้าอยู่มุม สูงสุด 4 ต่อหลัง'),
 make('temple','วิหาร','Temple','worship',['..G','RRS'],'4 คะแนนถ้าติดบ้านที่ได้รับอาหารอย่างน้อย 2 หลังด้วยด้าน มิฉะนั้น 0 คะแนน'),
 make('tavern','โรงเตี๊ยม','Tavern','green',['RRG'],'นับรวมทั้งเมือง 1/2/3/4/5 หลัง ได้ 2/5/9/14/20 คะแนน มากกว่า 5 หลังยังได้รวม 20'),
 make('feast-hall','หอจัดเลี้ยง','Feast Hall','green',['LLG'],'หลังละ 2 คะแนน ถ้ามีมากกว่าผู้เล่นทางขวาให้หลังละ 3 คะแนน ถ้าเท่ากันให้ 2 เล่นเดี่ยวเทียบกับเมืองตัวเองจึงได้หลังละ 2'),
 make('inn','โรงแรม','Inn','green',['YSG'],'หลังละ 3 คะแนนถ้าไม่มีโรงแรมอื่นในแถวหรือคอลัมน์เดียวกัน ไม่ใช้ในการเล่นเดี่ยว'),
 make('almshouse','โรงทาน','Almshouse','green',['SSG'],'นับรวม 1/2/3/4/5/6 หลัง ได้ −1/5/−3/15/−5/26 คะแนน มากกว่า 6 หลังยังได้รวม 26'),
 make('theater','โรงละคร','Theater','yellow',['.S.','LGL'],'1 คะแนนต่อประเภทอาคารอื่นที่มีในแถวและคอลัมน์เดียวกัน สีซ้ำนับครั้งเดียว ไม่นับสีเหลือง สูงสุด 6'),
 make('bakery','ร้านขนมปัง','Bakery','yellow',['.Y.','RGR'],'3 คะแนนถ้าติดอาคารสีแดงหรือสีดำด้วยด้าน สูงสุด 3 ต่อหลัง'),
 make('market','ตลาด','Market','yellow',['.L.','SGS'],'1 คะแนนต่ออาคารสีเหลืองในแถวหรือคอลัมน์เดียวกัน เลือกแนวที่ได้มากกว่า นับตัวเอง สูงสุด 4'),
 make('tailor','ร้านตัดเสื้อ','Tailor','yellow',['.Y.','SGS'],'1 คะแนนเริ่มต้น + 1 ต่อร้านตัดเสื้ออื่นใน 4 ช่องกลางเมือง ถ้าตัวเองอยู่กลางไม่นับตัวเองซ้ำ'),
 make('factory','โรงงาน','Factory','black',['L...','RSSR'],'สร้างแล้วเลือกสีทรัพยากรประจำโรงงาน เมื่อคนอื่นเรียกสีนั้น คุณเลือกใช้สีอื่นแทนได้ ไม่มีคะแนน ใช้ได้กับสำรับเดี่ยวและรอบเปิดการ์ด Town Hall'),
 make('bank','ธนาคาร','Bank','black',['YY.','LGR'],'4 คะแนน เมื่อสร้างเลือกทรัพยากรที่ธนาคารอื่นของคุณยังไม่มี คุณห้ามเรียกสีนั้นเมื่อเป็นผู้เรียกทรัพยากร สร้างได้ไม่เกิน 5 หลัง ถ้าห้ามครบ 5 สีให้ข้ามสิทธิ์เรียก เมื่อเหลือคนเดียวเมืองจะจบตามคำชี้แจงผู้ออกแบบ ไม่ใช้ในเกมเดี่ยว'),
 make('trading-post','จุดแลกเปลี่ยน','Trading Post','black',['SL.','SLR'],'1 คะแนน ใช้เป็นทรัพยากรสีใดก็ได้ในแบบก่อสร้างครั้งต่อไป จุดแลกเปลี่ยนไม่ถูกคืน ต้องใช้ลูกบาศก์จริงอย่างน้อย 1 ก้อนด้วย'),
 make('warehouse','คลังสินค้า','Warehouse','black',['YLY','R.R'],'เก็บทรัพยากรที่คนอื่นเรียกได้ไม่เกิน 3 ก้อนต่อหลัง หรือเอาก้อนใหม่ใส่แล้วนำก้อนเดิม 1 ก้อนออกวางในช่องว่าง ห้ามนำของออกโดยไม่ใส่ของใหม่ ท้ายเกม −1 ต่อก้อนที่เก็บ'),
 make('guild','สมาคมสถาปนิก',"Architect’s Guild",'monument',['..G','.YS','LR.'],'1 คะแนน เมื่อสร้างเปลี่ยนอาคารปกติเดิมได้ไม่เกิน 2 หลังเป็นประเภทอื่นจาก 7 ใบที่ใช้ในเกม ใช้ทันทีเท่านั้น เปลี่ยนเป็นอนุสาวรีย์ไม่ได้'),
 make('archive','หอจดหมายเหตุ', 'Archive of the Second Age','monument',['YY','RG'],'1 คะแนนต่อประเภทอาคารปกติที่ต่างกันในเมือง ไม่รวมอนุสาวรีย์'),
 make('castle','ปราสาทบาร์เร็ตต์','Barrett Castle','monument',['Y..S','LGGR'],'5 คะแนนถ้าได้รับอาหาร สำหรับการคิดคะแนนอาคารอื่นนับเป็นบ้าน 2 หลัง และไม่นับเป็นประเภทอนุสาวรีย์'),
 make('cathedral','มหาวิหารคาเทรินา','Cathedral of Caterina','monument',['.Y','SG'],'2 คะแนน ช่องว่างในเมืองนี้ไม่เสียคะแนน −1'),
 make('fort','ป้อมไอรอนวีด','Fort Ironweed','monument',['Y.R','SLS'],'7 คะแนน หลังสร้างไม่เป็นผู้เรียกทรัพยากรอีก ยกเว้นเหลือคุณคนเดียว Town Hall ข้ามรอบเลือกสีเอง ไม่ใช้ในเกมเดี่ยว'),
 make('mausoleum','สุสานโรดินา','Grand Mausoleum of the Rodina','monument',['LL','RS'],'บ้านที่ไม่ได้รับอาหารของคุณได้หลังละ 3 คะแนน บ้านที่ได้รับอาหารก็ได้ 3 ตามปกติ'),
 make('university','มหาวิทยาลัยโกรฟ','Grove University','monument',['.R.','SGS'],'3 คะแนน เมื่อสร้าง วางอาคารปกติจาก 7 ใบที่ใช้ในเกม 1 หลังในช่องว่างใดก็ได้ทันที ไม่ต้องใช้ทรัพยากรเพิ่ม'),
 make('palace','พระราชวังมันดราส','Mandras Palace','monument',['YG','RL'],'2 คะแนนต่อประเภทอาคารที่ต่างกันและติดพระราชวังด้วยด้าน สีซ้ำคิดครั้งเดียว'),
 make('watch','หอสังเกตการณ์โอปอลอาย',"Opaleye’s Watch",'monument',['L...','RGYY','S...'],'เมื่อสร้างเลือกอาคารปกติ 3 ประเภทต่างกัน เมื่อเพื่อนทางซ้ายหรือขวาสร้างประเภทที่ยังรออยู่ รับอาคารประเภทนั้นวางช่องว่างของคุณทันที ประเภทละ 1 ครั้ง ไม่ใช้ในเกมเดี่ยว'),
 make('obelisk','เสาจันทร์เสี้ยว','Obelisk of the Crescent','monument',['Y..','RGR'],'หลังสร้างเสานี้ อาคารทุกหลังที่สร้างต่อจากนี้วางในช่องว่างใดก็ได้ หลังคืนทรัพยากรตามแบบเดิม'),
 make('shrine','ศาลต้นไม้โบราณ','Shrine of the Elder Tree','monument',['RYS','LGL'],'คะแนนตามจำนวนอาคารในเมืองตอนสร้างรวมศาลนี้: 1/2/3/4/5/6 ขึ้นไป ได้ 1/2/3/4/5/8 คะแนน ล็อกคะแนนทันที'),
 make('forum','ลานชุมนุมซิลวา','Silva Forum','monument',['..Y.','RRSL'],'1 คะแนน + จำนวนอาคารในกลุ่มสีเดียวที่ใหญ่ที่สุดซึ่งต่อกันด้วยด้านในเมือง'),
 make('baths','โรงอาบน้ำลอยฟ้า','The Sky Baths','monument',['.Y.','SGL','R.R'],'2 คะแนนต่อประเภทอาคารปกติที่ไม่มีอยู่ในเมือง นับจาก 7 ประเภทปกติ ไม่รวมอนุสาวรีย์'),
 make('starloom','หอดูดาว','The Starloom','monument',['GG','LY'],'จบเมืองอันดับ 1/2/3/4 ขึ้นไป ได้ 6/3/2/0 คะแนน ถ้าจบในรอบเดียวกันได้อันดับสูงสุดร่วมกัน เล่นเดี่ยวได้อันดับ 1'),
 make('bondmaker','อนุสาวรีย์ผู้เชื่อมสัมพันธ์','Statue of the Bondmaker','monument',['LSSG','Y...'],'เมื่อคนอื่นเรียกทรัพยากร วางก้อนนั้นบนช่องบ้านได้ บ้านละ 1 ก้อน ก้อนบนบ้านใช้สร้างอาคารไม่ได้ ใช้กับสำรับเดี่ยวและรอบเปิดการ์ด Town Hall')
];
export const card=(id:string)=>{const c=CARDS.find(c=>c.id===id);if(!c)throw Error('ไม่พบการ์ดอาคาร');return c;};
export const NORMAL=CARDS.filter(c=>c.type!=='monument');
export const MONUMENTS=CARDS.filter(c=>c.type==='monument');
export const FIRST=['cottage','farm','well','chapel','tavern','theater','factory'];
export const art=(type:BuildingType)=>`/art/tiny-towns/building-${TYPES.indexOf(type)}.webp`;
export const soloRank=(score:number)=>score>=38?'สถาปนิกเอก':score>=32?'นักผังเมือง':score>=25?'วิศวกร':score>=18?'ช่างไม้':score>=10?'ช่างฝึกหัด':'ว่าที่สถาปนิก';

export const cardArt=(id:string)=>`/art/tiny-towns/card-${card(id).id}.webp`;
