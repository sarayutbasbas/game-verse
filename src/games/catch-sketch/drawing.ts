import type {Drawing} from './types.js';
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef';
export const MAX_STROKES=64,MAX_POINTS=1200,MAX_BYTES=6800;
export function point(x:number,y:number){const a=Math.max(0,Math.min(1023,Math.round(x))),b=Math.max(0,Math.min(1023,Math.round(y)));return alphabet[a>>5]+alphabet[a&31]+alphabet[b>>5]+alphabet[b&31];}
// Each coordinate is two base32 digits (0–1023), four characters per point.
export function points(encoded:string):[number,number][]{const a:[number,number][]=[];for(let i=0;i<encoded.length;i+=4)a.push([alphabet.indexOf(encoded[i])*32+alphabet.indexOf(encoded[i+1]),alphabet.indexOf(encoded[i+2])*32+alphabet.indexOf(encoded[i+3])]);return a;}
export function validDrawing(d:unknown):d is Drawing{if(!Array.isArray(d)||d.length>MAX_STROKES||JSON.stringify(d).length>MAX_BYTES)return false;let count=0;for(const s of d){
 if(!s||typeof s!=='object'||Object.keys(s).sort().join(',')!=='erase,points,size'||![2,5,9].includes(s.size)||typeof s.erase!=='boolean'||typeof s.points!=='string'||s.points.length<4||s.points.length%4||!/^[A-Za-f]+$/.test(s.points))return false;count+=s.points.length/4;}return count<=MAX_POINTS;}
