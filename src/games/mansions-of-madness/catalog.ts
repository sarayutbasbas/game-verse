import type {Profile,Skill,ScenarioId} from './types.js';
export const SKILLS:Skill[]=['strength','agility','observation','lore','influence','will'];
export const SKILL_NAMES:Record<Skill,string>={strength:'พละกำลัง',agility:'ความคล่องแคล่ว',observation:'การสังเกต',lore:'ความรู้ลี้ลับ',influence:'อิทธิพล',will:'จิตใจ'};
const profile=(id:string,name:string,role:string,art:number,health:number,values:number[],expansion=false):Profile=>({id,name,role,art,health,sanity:14-health,stats:Object.fromEntries(SKILLS.map((s,i)=>[s,values[i]])) as Record<Skill,number>,expansion,help:'นักสืบแฟนเมด · ค่าพลังและประวัติสร้างใหม่สำหรับชุดด่านนี้'});
export const PROFILES=[profile('elena','เอเลนา','นักจดหมายเหตุ',0,6,[2,3,4,5,3,4]),profile('noah','โนอาห์','นักข่าว',1,7,[3,4,4,3,4,3]),profile('maria','มาเรีย','แพทย์',2,7,[3,3,4,4,3,4]),profile('jonas','โจนัส','นักสืบเอกชน',3,9,[5,4,3,2,3,4]),profile('iris','ไอริส','ผู้สื่อสารกับวิญญาณ',4,6,[2,3,4,5,3,4],true),profile('arthur','อาร์เธอร์','ช่างกล',5,9,[5,4,3,2,4,3])];
export const PROFILE=Object.fromEntries(PROFILES.map(p=>[p.id,p]));
export const SCENARIO_INFO:Record<ScenarioId,{name:string;subtitle:string;expansion:boolean;rounds:number;needed:number;pitch:string}>={
 'rain-house':{name:'เสียงฝีเท้าในบ้านฝน',subtitle:'คดีเริ่มต้น · แฟนเมด',expansion:false,rounds:14,needed:3,pitch:'จดหมายที่ลงวันที่พรุ่งนี้พาคุณกลับมายังคฤหาสน์ร้าง ตามหาเอกสารสามชิ้น เปิดห้องนิรภัย และพาทุกคนออกมาก่อนบ้านตื่น'},
 'midnight-guests':{name:'แขกคนสุดท้ายก่อนเที่ยงคืน',subtitle:'งานเลี้ยงลวงตา · แฟนเมด',expansion:false,rounds:15,needed:3,pitch:'เจ้าภาพหายตัวจากโต๊ะอาหาร แต่เงาของเขายังอยู่ สนทนากับแขกและไขคำให้การที่ขัดกันก่อนเสียงระฆังครั้งสุดท้าย'},
 'wandering-doors':{name:'ประตูที่จดจำคุณ',subtitle:'กลไก Beyond the Threshold · แฟนเมด',expansion:true,rounds:16,needed:3,pitch:'ห้องในบ้านค่อย ๆ ย้ายตำแหน่ง สิ่งของธรรมดากลายเป็นกุญแจเหนือธรรมชาติ เก็บหลักฐาน ตามหาสิ่งของติดกุญแจ และปิดประตูที่ไม่ควรมีอยู่'},
};
export interface ItemDef {name:string;text:string;art:number;attack?:'melee'|'ranged';bonus?:number;light?:boolean;action?:'heal'|'calm';consumable?:boolean}
export const ITEMS:Record<string,ItemDef>={
 revolver:{name:'ปืนพกของนักสืบ',text:'อาวุธแฟนเมด ระยะไกล 3 ช่องตามเส้นทางที่ไม่มีประตู/กำแพง ทดสอบความคล่องแคล่ว ทำความเสียหายเท่าผลสำเร็จ +2',art:0,attack:'ranged',bonus:2},
 crowbar:{name:'ชะแลงเก่า',text:'อาวุธแฟนเมดระยะประชิดในช่องเดียวกัน ทดสอบพละกำลัง ทำความเสียหายเท่าผลสำเร็จ +1',art:1,attack:'melee',bonus:1},
 lantern:{name:'ตะเกียงทองเหลือง',text:'แหล่งกำเนิดแสง ยกเลิกผลความมืดในช่องนี้และช่องที่ติดกัน ตกลงแลกให้เพื่อนได้ด้วยแอ็กชันแลกเปลี่ยน',art:2,light:true},
 journal:{name:'สมุดบันทึกปิดผนึก',text:'วัตถุหลักฐานแฟนเมด อาจได้รับโทเคนกุญแจในด่านเสริม เมื่อมีโทเคนกุญแจจะได้คุณลักษณะ Key และ Evidence และทิ้งออกจากเกมไม่ได้',art:3},
 medicine:{name:'กล่องปฐมพยาบาล',text:'แอ็กชันแฟนเมด: ทิ้งการ์ดนี้เพื่อสุ่มคืนความเสียหายคว่ำ 1 ใบเข้ากอง ถ้ามีโทเคนกุญแจจะใช้ไม่ได้เพราะห้ามทิ้ง',art:4,action:'heal',consumable:true},
 incense:{name:'เครื่องหอมสงบจิต',text:'แอ็กชันแฟนเมด: ทิ้งการ์ดนี้เพื่อสุ่มคืนความหวาดกลัวคว่ำ 1 ใบเข้ากอง ถ้ามีโทเคนกุญแจจะใช้ไม่ได้เพราะห้ามทิ้ง',art:5,action:'calm',consumable:true},
};
export const AFFLICTIONS={bruise:{name:'รอยช้ำ',text:'Resolve Immediately · พลิกคว่ำหลังรับ',keep:false},fatigue:{name:'ปวดกล้ามเนื้อ',text:'Keep Faceup · พละกำลัง −1 (ต่ำสุด 1)',keep:true,skill:'strength'},cut:{name:'แผลถลอก',text:'Resolve Immediately · พลิกคว่ำหลังรับ',keep:false},shock:{name:'ภาพติดตา',text:'Resolve Immediately · พลิกคว่ำหลังรับ',keep:false},doubt:{name:'เสียงกระซิบ',text:'Keep Faceup · จิตใจ −1 (ต่ำสุด 1)',keep:true,skill:'will'},nightmare:{name:'ความฝันร้าย',text:'Resolve Immediately · พลิกคว่ำหลังรับ',keep:false}} as const;
export const INSANITY={solitude:{name:'ไม่มีใครเข้าใจ',text:'เป้าหมายลับแฟนเมด: คุณชนะเมื่อทีมชนะ คุณยังไม่ถูกกำจัด และไม่มีนักสืบคนอื่นอยู่ในช่องเดียวกับคุณตอนจบ'},keepsake:{name:'หวงแหนของชิ้นสุดท้าย',text:'เป้าหมายลับแฟนเมด: คุณชนะเมื่อทีมชนะ คุณยังไม่ถูกกำจัด และคุณมีสิ่งของอย่างน้อย 2 ชิ้น'}};
export const MONSTERS={cultist:{name:'สาวกลัทธิ',awareness:3,horror:1,brawn:2,baseHealth:1,art:0},'deep-one':{name:'ผู้มาจากห้วงลึก',awareness:3,horror:4,brawn:2,baseHealth:2,art:1},thrall:{name:'Thrall · ผู้ถูกครอบงำ',awareness:3,horror:4,brawn:2,baseHealth:2,art:2}};
