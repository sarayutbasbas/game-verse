/** Public pack metadata only; answers and the question bank stay on the server. */
export const QUESTION_PACKS=[
 {id:'mixed',name:'สุ่มรวมทุกชุด',count:200},
 {id:'nature',name:'สัตว์และธรรมชาติ',count:40},
 {id:'science',name:'วิทย์ใกล้ตัว',count:40},
 {id:'world',name:'รอบโลก',count:40},
 {id:'daily',name:'ของกินและชีวิตประจำวัน',count:40},
 {id:'culture',name:'กีฬาและวัฒนธรรม',count:40},
] as const;
export type QuestionPackId=typeof QUESTION_PACKS[number]['id'];
export const isQuestionPack=(id:unknown):id is QuestionPackId=>QUESTION_PACKS.some(p=>p.id===id);
