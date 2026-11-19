// Server-only quiz bank. Every entry has a source URL; never import this from client code.
import questions from './questions.json' with {type:'json'};
import type {HighLowQuestion} from './types.js';
export const QUESTIONS=questions as HighLowQuestion[];
export const QUESTION_BY_ID=Object.fromEntries(QUESTIONS.map(q=>[q.id,q])) as Record<string,HighLowQuestion>;
