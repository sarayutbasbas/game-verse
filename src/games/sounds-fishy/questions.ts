// Server-only: importing this module into a client renderer would expose answers.
import data from './questions.json' with {type:'json'};
import legacy from './questions-thai-v2.json' with {type:'json'};
export const CURRENT_QUESTION_PACK='world-advanced-2026-10-30';
export const LEGACY_QUESTION_PACK='thai-cheeky-v2';
export interface Question {id:string;category:string;text:string;answer:string;source:string;origin:string}
export const QUESTIONS=data;
export const QUESTION:Record<string,typeof data[number]>=Object.fromEntries(data.map(q=>[q.id,q]));
const archived:Record<string,Question>=Object.fromEntries(legacy.map(q=>[q.id,q]));
// Records saved before question-pack versioning belong to the previously released deck.
export function questionBank(pack:string=LEGACY_QUESTION_PACK):readonly Question[]{
 if(pack===CURRENT_QUESTION_PACK)return QUESTIONS;
 if(pack===LEGACY_QUESTION_PACK)return legacy;
 throw Error('ไม่รู้จักชุดคำถามที่บันทึกไว้');
}
export function getQuestion(id:string,pack:string=LEGACY_QUESTION_PACK):Question{
 const q=pack===CURRENT_QUESTION_PACK?QUESTION[id]:pack===LEGACY_QUESTION_PACK?archived[id]:undefined;
 if(!q)throw Error('ไม่พบคำถามในชุดที่บันทึกไว้');return q;
}
