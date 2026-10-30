// Server-only: importing this module into a client renderer would expose answers.
import data from './questions.json' with {type:'json'};
export const QUESTIONS=data;
export const QUESTION:Record<string,typeof data[number]>=Object.fromEntries(data.map(q=>[q.id,q]));
