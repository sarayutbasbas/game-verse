import type {GameId} from '../shared/types.js';
import {esc} from './platform.js';
export interface ReferenceCard {id:string;name:string;group:string;image?:string;badge?:string;body:string;diagram?:string}
const paragraphs=(...text:string[])=>text.filter(Boolean).map(t=>`<p>${esc(t)}</p>`).join('');
const shape=(cells:readonly (readonly [number,number])[])=>`<svg class="reference-shape" viewBox="${Math.min(...cells.map(c=>c[0]))-1} ${Math.min(...cells.map(c=>c[1]))-1} ${Math.max(...cells.map(c=>c[0]))-Math.min(...cells.map(c=>c[0]))+3} ${Math.max(...cells.map(c=>c[1]))-Math.min(...cells.map(c=>c[1]))+3}" aria-label="รูปทรงการ์ด" role="img">${cells.map(([x,y])=>`<rect x="${x}" y="${y}" width=".85" height=".85" rx=".12" fill="currentColor"/>`).join('')}</svg>`;
/** Public printed definitions only. Never takes a room view or a player's hand. */
export async function referenceCards(game:GameId):Promise<ReferenceCard[]>{
 switch(game){
 case 'flip-7':{const d=await import('../games/flip-7/data.js');return d.CARDS.map(c=>({id:c.id,name:c.name,group:c.kind==='number'?'ไพ่ตัวเลข':['bonus','multiplier'].includes(c.kind)?'ไพ่ปรับคะแนน':'ไพ่แอ็กชัน',image:d.art(c.id),badge:c.copies+' ใบ',body:paragraphs(c.text,'มี '+c.copies+' ใบในสำรับ 94 ใบ',c.kind==='number'?'เปิดได้เจ็ดเลขต่างกันจบรอบทันทีและรับโบนัส 15 แต้ม':'ไพ่ชนิดนี้ไม่นับเป็นหนึ่งในเจ็ดเลข และไม่ทำให้บัสต์')}));}
 case 'catch-sketch':{const {CARDS}=await import('../games/catch-sketch/data.js');return CARDS.map((c,i)=>({id:c.id,name:'การ์ดคำไทย '+(i+1),group:'ชุดคำไทยสร้างใหม่',image:'/art/catch-sketch/back.webp',badge:'ง่าย / ท้าทาย',body:paragraphs('คำง่าย: '+c.easy,'คำท้าทาย: '+c.hard,'คนทายไม่เห็นคำที่เลือกในรอบปัจจุบัน ผู้วาดห้ามวาดตัวหนังสือหรือตัวเลข')}));}
 case 'muffin-time':{const d=await import('../games/muffin-time/data.js');return d.CARDS.map(c=>({id:c.id,name:c.name,group:d.KIND_NAME[c.kind],image:d.cardArt(c.id),badge:'5 ใบ',body:paragraphs('ชุดการ์ดไทยดัดแปลงสำหรับเว็บ',c.text,c.kind==='trap'?'วางคว่ำต้นตาได้ 1 ใบ มีพร้อมกันไม่เกิน 3 ใบ ไม่รวมในจำนวนไพ่ในมือ':'')}));}
 case 'mansions-of-madness':{const d=await import('../games/mansions-of-madness/catalog.js');const atlas=(name:string,i:number,cols:number,rows:number)=>`<span style="display:block;width:100%;aspect-ratio:1;background-image:url('/art/mansions-of-madness/${name}.webp');background-size:${cols*100}% ${rows*100}%;background-position:${i%cols/(cols-1)*100}% ${rows>1?Math.floor(i/cols)/(rows-1)*100:50}%"></span>`;return [...d.PROFILES.map(p=>({id:p.id,name:p.name+' · '+p.role,group:'นักสืบแฟนเมด',diagram:atlas('investigators',p.art,3,2),body:paragraphs(p.help,`พลังชีวิต ${p.health} · สติ ${p.sanity}`,...d.SKILLS.map(k=>`${d.SKILL_NAMES[k]} ${p.stats[k]}`))})),...Object.entries(d.ITEMS).map(([id,c])=>({id,name:c.name,group:'สิ่งของแฟนเมด',diagram:atlas('items',c.art,3,2),body:paragraphs(c.text)})),...Object.entries(d.AFFLICTIONS).map(([id,c])=>({id,name:c.name,group:'ความเสียหาย / หวาดกลัวแฟนเมด',body:paragraphs(c.text,'เป็นการ์ดสร้างใหม่สำหรับชุดด่านแฟนเมด ไม่ใช่การ์ดทางการ')})),...Object.entries(d.INSANITY).map(([id,c])=>({id,name:c.name,group:'เสียสติ · เป้าหมายแฟนเมด',body:paragraphs(c.text,'เมื่อสุ่มได้ในเกม ข้อความนี้ส่งให้เฉพาะมือถือเจ้าของ')}))];}
 case 'just-one':{const {CARDS,CATEGORIES}=await import('../games/just-one/data.js');return CARDS.map((c,i)=>({id:c.id,name:`การ์ดคำศัพท์ ${i+1}`,group:'ชุดคำไทยคละหมวด',badge:String(i+1),body:c.words.map((w,j)=>`<p><strong>${j+1}.</strong> ${esc(w)} <small>· ${esc(CATEGORIES.find(g=>g.id===c.categories[j])?.name)}</small></p>`).join('')}));}
 case 'love-letter':{
  const {CARDS}=await import('../games/love-letter/data.js'),{loveLetterCardArt}=await import('./love-letter-art.js');
  return CARDS.map(c=>({id:c.id,name:c.name,group:c.side==='base'?'Love Letter ภาคหลัก':c.side==='hero'?'Marvel · ฮีโร่':'Marvel · ธานอส',image:loveLetterCardArt(c.id),badge:String(c.rank),body:paragraphs(c.english,`มี ${c.copies} ใบ`,c.effect)}));
 }
 case 'power-hungry-pets':{
  const {CARDS}=await import('../games/power-hungry-pets/data.js');return CARDS.map(c=>({id:String(c.rank),name:c.name,group:'ภาคหลัก',image:`/art/power-hungry-pets/pet-${c.rank}.webp`,badge:String(c.rank),body:paragraphs(c.english,`มี ${c.copies} ใบ`,c.effect)}));
 }
 case 'castle-combo':{
  const d=await import('../games/castle-combo/data.js');return d.CARDS.map(c=>({id:String(c.id),name:d.name(c.id),group:d.PLACE[c.place],image:d.art(c.id),badge:`${c.cost} เหรียญ`,body:paragraphs(`สังกัด: ${c.shields.map(s=>d.SHIELDS[s]).join(' + ')}`,`เมื่อซื้อ: ${d.abilityText(c.id)}`,`คิดคะแนน: ${d.scoringText(c.id)}`,c.move?`หลังใช้ความสามารถ ย้ายผู้ส่งสารไป${d.PLACE[c.place===1?2:1]} แล้วเติมตลาด`:'')}));
 }
 case 'courtisans':{
  const d=await import('../games/courtisans/data.js');return [...d.FAMILIES.flatMap(f=>d.ROLES.map(r=>({id:`${f}-${r}`,name:`${d.FAMILY[f].name} · ${d.ROLE[r].name}`,group:'การ์ดตระกูล',image:d.art(f,r),body:paragraphs(`มี ${d.ROLE[r].count} ใบในตระกูลนี้`,d.ROLE[r].help,`เมื่อจบเกม ตระกูลรุ่งเรืองได้ +${r==='noble'?2:1} คะแนน ตกอับได้ −${r==='noble'?2:1} คะแนน เป็นกลางได้ 0 คะแนน`)}))),...d.MISSIONS.map(m=>({id:m.id,name:`ภารกิจ ${m.id.toUpperCase()}`,group:m.color==='white'?'ภารกิจสีขาว':'ภารกิจสีฟ้า',body:paragraphs(m.text,'ทำสำเร็จได้ 3 คะแนน')}))];
 }
 case 'trio':{
  const d=await import('../games/trio/data.js');return Array.from({length:12},(_,i)=>{const n=i+1;return {id:String(n),name:`ไพ่เลข ${n}`,group:'ภาคหลัก',image:d.art(n),badge:String(n),body:paragraphs('มี 3 ใบ เก็บเลขเดียวกันครบสามใบเป็นหนึ่งชุด',n===7?'เก็บชุด 7 ครบสามใบแล้วชนะทันที ทั้ง Simple และ Spicy แต่ต้องเปิดตามกติกาทีละใบ ห้ามหยิบไพ่จากกลางมือมาเปิด':`โหมด Spicy: ชุดนี้เชื่อมกับ ${d.links(n).map(m=>'ชุด '+m).join(' หรือ ')}`)};});
 }
 case 'critter-kitchen':{
  const d=await import('../games/critter-kitchen/data.js');
  const groups=[['critic','ผู้วิจารณ์',Object.values(d.CRITIC)],['challenge','Challenge',Object.values(d.CHALLENGE)],['rumor','ข่าวลือ',Object.values(d.RUMOR)],['restaurateur','เจ้าของร้าน',Object.values(d.RESTAURATEUR)],['sous','เชฟเสริม',Object.values(d.ZOU)]] as const;
  return groups.flatMap(([kind,group,cards])=>cards.map(c=>{const portrait=['critic','challenge','restaurateur'].includes(kind)||['cosmo','rudy','alex','peter','queenie','shaggy'].includes(c.id);return {id:`${kind}-${c.id}`,name:c.name,group,image:`/art/critter-kitchen/${portrait?'portrait/':''}${kind}-${c.id}.webp`,body:paragraphs('text'in c?c.text:'เสิร์ฟจานตามวัตถุดิบบนการ์ดให้ครบตามเกณฑ์คุณภาพของวัน','foods'in c?`วัตถุดิบ: ${c.foods.map(f=>d.FOOD_NAMES[f]).join(' / ')}`:'','capacity'in c?`ถือได้ ${c.capacity} ชิ้น`:'')};}));
 }
 case 'pixies':{
  const d=await import('../games/pixies/data.js');return d.CARDS.map(c=>({id:c.id,name:`ภูตเลข ${c.number} · ${c.colors.map(x=>d.COLOR_NAME[x]).join(' / ')}`,group:c.colors.length===4?'หลายสี':d.COLOR_NAME[c.colors[0]],image:`/art/pixies/cards/${c.id}.webp`,badge:String(c.number),body:paragraphs(`วางในช่องเลข ${c.number}`,`สัญลักษณ์เกลียว ${c.spirals} · กากบาท ${c.crosses}`,c.perColor?`ได้คะแนนตามจำนวนไพ่สี${d.COLOR_NAME[c.perColor]} ในสวน`:'ไม่มีโบนัสตามสี','ไพ่ที่ยืนยันแล้วให้คะแนนตามเลข เกลียว +1 กากบาท −1 นับสัญลักษณ์บนไพ่ที่หงายเท่านั้น')}));
 }
 case 'seven-wonders-duel':{
  const d=await import('../games/seven-wonders-duel/data.js'),{effectText}=await import('./seven-wonders-duel.js');
  const names={wood:'ไม้',clay:'ดิน',stone:'หิน',glass:'แก้ว',papyrus:'กระดาษ'};
  return [...d.CARDS.map(c=>({id:c.id,name:c.name,group:`ยุค ${c.age}`,image:`/art/seven-wonders-duel/${c.id}.webp?v=2`,body:paragraphs(`ราคา: ${c.coinCost} เหรียญ ${d.RESOURCES.filter(r=>c.cost[r]).map(r=>`${names[r]} ${c.cost[r]}`).join(' / ')}`,effectText(c),c.chainFrom?`สร้างฟรีด้วยโซ่ ${c.chainFrom}`:'',c.chain?`ให้สัญลักษณ์โซ่ ${c.chain}`:'')})),...d.WONDERS.map(c=>({id:c.id,name:c.name,group:'สิ่งมหัศจรรย์',image:`/art/seven-wonders-duel/${c.id}.webp?v=2`,body:paragraphs(`ราคา: ${d.RESOURCES.filter(r=>c.cost[r]).map(r=>`${names[r]} ${c.cost[r]}`).join(' / ')}`,effectText(c))}))];
 }
 case 'jaipur':{
  const d=await import('../games/jaipur/data.js');return Object.entries(d.COUNTS).map(([id,count])=>{const kind=id as keyof typeof d.COUNTS;return {id,name:d.NAMES[kind],group:kind==='camel'?'อูฐ':'สินค้า',image:`/art/jaipur/${id}.webp?v=1`,body:paragraphs(`มี ${count} ใบ`,kind==='camel'?'หยิบอูฐทั้งหมดจากตลาดเข้าเป็นฝูง ไม่ถือเป็นไพ่ในมือ ใช้แลกสินค้าได้ ผู้มีอูฐมากกว่าเมื่อจบรอบได้ 5 คะแนน':`ขายอย่างน้อย ${d.minimum(kind)} ใบต่อครั้ง รับโทเคนตามจำนวนที่ขาย มูลค่าโทเคน: ${d.VALUES[kind].join(' / ')}`)};});
 }
 case 'locus':{
  const d=await import('../games/locus/data.js');return d.CARDS.map(c=>({id:c.id,name:`รูปทรง ${c.id} · ${d.LABEL[c.color]}`,group:d.LABEL[c.color],diagram:shape(c.cells),body:paragraphs(`กากบาทตามรูปทรง ${c.cells.length} ช่อง ในโซน${c.color==='wild'?'สีใดก็ได้':d.LABEL[c.color]}`,'หมุนและกลับด้านรูปทรงได้ แต่ห้ามวางทับช่องเดิม',c.coin?'รับเหรียญ 1 เหรียญเมื่อเลือกใบนี้':'ไม่มีเหรียญบนใบนี้')}));
 }
 case 'take-time':return (['solar','lunar'] as const).flatMap(suit=>Array.from({length:12},(_,i)=>({id:`${suit}-${i+1}`,name:`${suit==='solar'?'สุริยะ':'จันทรา'} ${i+1}`,group:suit==='solar'?'สุริยะ':'จันทรา',badge:String(i+1),body:paragraphs(`เพิ่มผลรวมในช่องนาฬิกาที่วาง ${i+1}`,'มีอย่างละ 1 ใบต่อสี ไพ่ทั้งหมดใช้วางในนาฬิกาตามเงื่อนไขด่าน 1–1')})));
 case 'dracula-vs-van-helsing':{
  const d=await import('../games/dracula-vs-van-helsing/types.js');return d.SUITS.flatMap(suit=>Array.from({length:8},(_,i)=>({id:`${suit}-${i+1}`,name:`${d.SUIT_NAME[suit]} ${i+1}`,group:d.SUIT_NAME[suit],badge:String(i+1),image:`/art/dracula/suits/${suit}.svg`,body:paragraphs(`เมื่อทิ้ง: ${d.EFFECTS[i+1]}`,'วางลงเขตเพื่อใช้ดวลตอนจบรอบ ความสามารถทำงานเมื่อทิ้งการ์ด ไม่ใช่เมื่อวางลงเขต')})));
 }
 case 'calico':{
  const d=await import('../games/calico/data.js');return [...Object.entries(d.CATS).map(([id,c])=>({id,name:c.name,group:'แมว',image:`/art/calico/${id}.webp`,body:paragraphs(`ได้รับ ${c.points} คะแนนต่อโทเคนแมว`,'size'in c?`ต่อผ้าลายเดียวกันเป็นกลุ่มติดกันอย่างน้อย ${c.size} ชิ้น`:'ต่อลายเดียวกันตามรูปทรงที่กำหนด'),diagram:'shape'in c?`<svg class="reference-shape" viewBox="-2 -2 10 10" role="img" aria-label="รูปทรง ${c.name} หมุนได้">${c.shape.map(h=>{const x=2+h.q+h.r/2,y=2+h.r*.866;return `<path d="M${x} ${y-.55}l.48 .275v.55l-.48 .275-.48-.275v-.55Z" fill="currentColor"/>`;}).join('')}</svg>`:undefined})),...Object.entries(d.GOALS).map(([id,g])=>({id,name:g.label,group:'เป้าหมาย',body:paragraphs(`ผ้ารอบเป้าหมาย 6 ช่องต้องแบ่งกลุ่มเป็น ${g.counts.join(' / ')}`,`ทำได้ตามสีหรือลายอย่างใดอย่างหนึ่ง ${g.one} คะแนน ทำได้ทั้งสองอย่าง ${g.both} คะแนน`)}))];
 }
 case 'bomb-busters':{
  const d=await import('../games/bomb-busters/data.js');return [...d.TOOLS.map(c=>({id:`tool-${c.id}`,name:c.name,group:'อุปกรณ์',image:`/art/bomb-busters/tool-${c.id}.webp`,body:paragraphs(c.help)})),...Array.from({length:12},(_,i)=>({id:`blue-${i+1}`,name:`สายสีน้ำเงิน ${i+1}`,group:'สายไฟ',image:'/art/bomb-busters/tile-blue.webp',badge:String(i+1),body:paragraphs('มีค่าเดียวกัน 4 เส้น ตัดเป็นคู่กับค่าเดียวกันของเพื่อน หรือตัดเดี่ยวตามเงื่อนไขเกม')})),{id:'yellow',name:'สายสีเหลือง',group:'สายไฟ',image:'/art/bomb-busters/tile-yellow.webp',badge:'Y',body:paragraphs('ระบุว่า Y แทนตัวเลข ตัดคู่กับสายสีเหลืองของเพื่อน')},{id:'red',name:'สายสีแดง',group:'สายไฟ',image:'/art/bomb-busters/tile-red.webp',badge:'R',body:paragraphs('ตัดผิดโดนสายสีแดง ระเบิดทันที','เมื่อสายที่ยังไม่ตัดของคุณเป็นสีแดงทั้งหมด จึงเลือกเปิดเผยสายสีแดงอย่างปลอดภัยตามกติกาได้')}];
 }
 case 'perch':{
  const d=await import('../games/perch/data.js');return Object.entries(d.LOCATION).map(([id,c])=>({id,name:c.name,group:'พื้นที่',image:`/art/perch/location-${String(c.art).padStart(2,'0')}.webp`,body:paragraphs(c.help,`คะแนนตามอันดับ: ${c.points.join(' / ')}`,`รัง ${c.nests}`)}));
 }
 case 'draftosaurus':{
  const d=await import('../games/draftosaurus/data.js');return [...Object.entries(d.PEN).map(([id,c])=>({id,name:c.name,group:'คอกและแม่น้ำ',body:paragraphs(c.rule)})),...Object.entries(d.FACE).map(([id,c])=>({id,name:c.name,group:'หน้าลูกเต๋า',body:paragraphs(c.rule)}))];
 }
 case 'sky-team':{
  const d=await import('../games/sky-team/data.js');return d.CONTROLS.map(c=>({id:c.id,name:c.name,group:d.ROLE_NAME[c.role as keyof typeof d.ROLE_NAME]??'ทั้งสองคน',body:paragraphs(`ค่าลูกเต๋าที่วางได้: ${c.values.join(' / ')}`,c.help)}));
 }
 case 'name-it':{
  const {WEB_PRESET:d}=await import('../games/name-it/data.js');return [...d.breeds.flatMap(c=>[{id:c.id,name:c.name,group:'สุนัข',image:`/art/name-it/${c.art}.webp`,body:paragraphs(`มี ${c.ordinary} ใบ`,'เมื่อเจอสายพันธุ์ใหม่ เรียกชื่อสายพันธุ์แล้วตั้งชื่อ เมื่อเจอซ้ำให้เรียกชื่อที่ตั้งไว้ ผู้ตอบถูกก่อนรับ +1 คะแนน')},{id:c.id+'-leash',name:c.name+' · มีสายจูง',group:'สุนัขมีสายจูง',image:`/art/name-it/${c.leashArt}.webp`,body:paragraphs(`มี ${c.leashed} ใบ`,'ถ้าเคยตั้งชื่อแล้ว ให้เรียกชื่อผู้ตั้งชื่อครั้งแรก การรับไพ่ในภายหลังไม่เปลี่ยนเจ้าของ ถ้าเป็นสายพันธุ์ใหม่ให้ตั้งชื่อตามปกติ')}]),...(['cat','gluta','gollum'] as const).map(id=>({id,name:{cat:'แมว',gluta:'กลูต้า',gollum:'กอลลัม'}[id],group:'การ์ดพิเศษ',image:`/art/name-it/${d.specialArt[id]}.webp`,body:paragraphs(`มี ${d[id]} ใบ`,{cat:'แตะโซนของตน ผู้แตะช้าที่สุดรับ −1 คะแนน',gluta:'แตะโซนของตน ผู้แตะเร็วที่สุดรับ +1 คะแนน',gollum:'ทำการกระทำและตอบเหมือนการ์ดใบก่อน ผู้ทำถูกก่อนรับ +1 คะแนน'}[id])}))];
 }
 case 'camel-up':return [{id:'leg',name:'ตั๋วเดิมพันรอบ',group:'เดิมพัน',body:paragraphs('เลือกอูฐที่คิดว่าจะนำเมื่อจบรอบ ตั๋วบนสุดให้รางวัลสูงกว่า อันดับหนึ่งได้ตามหน้าตั๋ว อันดับสองได้ 1 เหรียญ อันดับอื่นเสีย 1 เหรียญ')},{id:'finish',name:'การ์ดเดิมพันผู้ชนะ / ผู้แพ้',group:'เดิมพัน',body:paragraphs('เดิมพันผลสุดท้ายของอูฐแข่ง ส่งการ์ดคว่ำลงกองผู้ชนะหรือผู้แพ้ รางวัลทายถูกเรียงตามลำดับที่ส่ง 8 / 5 / 3 / 2 / 1 เหรียญ ทายผิดเสีย 1 เหรียญ')}];
 case 'azul':return [{id:'tiles',name:'กระเบื้องทั้ง 5 สี',group:'อุปกรณ์',body:paragraphs('เลือกสีเดียวจากโรงงานหรือกลางโต๊ะ วางลงแถวแบบที่รองรับสีนั้น ชิ้นเกินลงพื้น','แถวแบบครบแล้วเลื่อนหนึ่งชิ้นขึ้นผนัง คิดคะแนนจากกระเบื้องที่ต่อกันในแนวนอนและแนวตั้ง')},{id:'first',name:'ตัวเริ่มเล่น',group:'อุปกรณ์',body:paragraphs('คนแรกที่หยิบจากกลางโต๊ะรับตัวเริ่มเล่นลงพื้น และได้เริ่มรอบถัดไป')}];
 case 'sounds-fishy':return [{id:'blue',name:'ปลาสีน้ำเงิน',group:'บทบาทลับ',image:'/art/sounds-fishy/blue.webp',body:paragraphs('คุณรู้คำตอบจริงและต้องตอบตามจริง โดยพยายามให้ผู้ทายคิดว่าคุณโกหก')},{id:'red',name:'ปลาสีแดง',group:'บทบาทลับ',image:'/art/sounds-fishy/red.webp',body:paragraphs('แต่งคำตอบหลอกให้ผู้ทายเชื่อ อย่าซ้ำกับคำตอบที่คนอื่นพูดไปแล้ว')}];
 case 'harmonies':return []; // Opens the existing full library, including expansions.
 }
}
