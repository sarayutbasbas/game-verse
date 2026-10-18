import type {Catalog} from './types.js';
/** Web edition: user-confirmed 12×5 + 3 cat + 3 Gluta + 3 Gollum (2026-10-16). */
export const RULES_APPROVED=true;
export const REQUIRED_DECK_SIZE=69;
export const CATALOG_CONFIRMED=true;
export const BREEDS=[['dachshund','ดัชชุนด์'],['french-bulldog','เฟรนช์บูลด็อก'],['pomeranian','ปอมเมอเรเนียน'],['chihuahua','ชิวาวา'],['shiba','ชิบะ'],['pug','ปั๊ก'],['husky','ฮัสกี'],['corgi','คอร์กี'],['beagle','บีเกิล'],['dalmatian','ดัลเมเชียน'],['golden-retriever','โกลเด้นรีทรีฟเวอร์'],['poodle','พุดเดิล']] as const;
export const WEB_PRESET:Catalog={id:'web-69',rulesVersion:'user-request-web-69-v1',provenance:'user-approved-web',breeds:BREEDS.map(([id,name],i)=>({id,name,art:`c${String(i<8?i*2+1:20+(i-8)*2).padStart(2,'0')}`,leashArt:`c${String(i<8?i*2+2:21+(i-8)*2).padStart(2,'0')}`,ordinary:3,leashed:2})),cat:3,gluta:3,gollum:3,specialArt:{cat:'c17',gluta:'c18',gollum:'c19'},nearMs:35};
export const CAN_START=RULES_APPROVED&&CATALOG_CONFIRMED&&WEB_PRESET.breeds.reduce((n,b)=>n+b.ordinary+b.leashed,0)+WEB_PRESET.cat+WEB_PRESET.gluta+WEB_PRESET.gollum===REQUIRED_DECK_SIZE;
export const AVATAR_IDS=['a01','a02','a03','a04','a05','a06'];
export const SEAT_COLORS=['#dd604c','#397db3','#8254a5','#418d69','#ba8221','#a84c83'];
