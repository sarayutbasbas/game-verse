import {validateState} from '../games/name-it/validation.js';
import {recoverState} from '../games/name-it/engine.js';
import type {NameState} from '../games/name-it/types.js';
export const SAVE_KEY='gameverse:name-it:local:v1';
export interface StoragePort {getItem(key:string):string|null;setItem(key:string,value:string):void;removeItem(key:string):void}
export function readSaved(storage:StoragePort):{state:NameState|null;error:string}{try{const text=storage.getItem(SAVE_KEY);if(!text)return {state:null,error:''};const state=JSON.parse(text);if(!validateState(state))return {state:null,error:'ข้อมูลเกมที่บันทึกไม่สมบูรณ์ เก็บข้อมูลเดิมไว้แล้ว คุณเริ่มเกมใหม่ได้'};return {state,error:''};}catch{return {state:null,error:'อ่านเกมที่บันทึกไม่ได้ เบราว์เซอร์อาจปิดการบันทึกข้อมูล'};}}
export function saveState(storage:StoragePort,state:NameState){if(!validateState(state))throw Error('สถานะเกมไม่ถูกต้อง จึงยังไม่บันทึกทับเกมเดิม');try{storage.setItem(SAVE_KEY,JSON.stringify(state));}catch{throw Error('บันทึกเกมบนเครื่องไม่ได้ กรุณาตรวจพื้นที่หรือสิทธิ์ของเบราว์เซอร์');}}
export function resumeSaved(storage:StoragePort){const saved=readSaved(storage);if(!saved.state)throw Error(saved.error||'ไม่มีเกมที่บันทึก');const state=recoverState(saved.state);saveState(storage,state);return state;}
