import {CRITIC,FOODS,FOOD_NAMES,RESTAURATEUR,RUMOR,TOKEN} from './data.js';
import {baseValue} from './scoring.js';
import type {CKState,FinalReveal,FinalRevealItem,Player} from './types.js';
/** Explanations derive from settled scores; advancing the ceremony never changes points. */
export function finalRevealItems(s:CKState):FinalRevealItem[]{
 const facts=s.players.map(p=>{
  const meal=p.critic!,score=p.score!,used=new Set([...meal.items.flatMap(i=>[i.token,...i.spice?[i.spice]:[]]),...(meal.wine??[]).map(w=>w.token)]),left=p.storage.filter(id=>!used.has(id));
  const by=FOODS.map(food=>meal.items.filter(i=>i.as===food));
  return {p,meal,score,left,by,values:by.map(items=>items.length?Math.max(...items.map(i=>baseValue(s,p,i.token))):0),all:[...meal.items.map(i=>baseValue(s,p,i.token)),...(meal.wine??[]).map(w=>baseValue(s,p,w.token))]};
 });
 const items:FinalRevealItem[]=[];
 const add=(id:string,title:string,rule:string,award:(p:Player,index:number)=>{stars:number;evidence:string;winner?:boolean},extra:Partial<FinalRevealItem>={})=>items.push({id,title,rule,...extra,awards:s.players.map((p,i)=>({actor:p.id,...award(p,i)}))});
 add('saved','ก่อนมื้อสุดท้าย มีดาวสะสมเท่าไร?','นำดาวจากการเสิร์ฟ Challenge และความสามารถเชฟที่ได้รับระหว่างเกม มาตั้งต้นในยอดรวม',p=>({stars:p.score!.challenge+p.score!.chef,evidence:`Challenge ${p.score!.challenge} ดาว + เชฟ ${p.score!.chef} ดาว`}));
 add('soup','ใครเหลือซุปและบิสก์มากที่สุด?','รวมคุณภาพของที่เหลือ: ซุปถ้วยละ 1 บิสก์ถ้วยละ 3 ผู้ที่มีผลรวมสูงที่สุดได้ 1 ดาว ถ้าเสมอกันได้ทุกคน',p=>({stars:p.score!.soup,evidence:`ซุป ${p.soup} + บิสก์ ${p.bisque} × 3 = ${p.soup+3*p.bisque} คุณภาพ`}));
 add('seven','ใครเสิร์ฟครบทั้ง 7 ช่องอาหาร?','เสิร์ฟมื้อสุดท้ายครบทั้ง 7 ชนิด ได้เพิ่ม 1 ดาว ช่องที่เว้นว่างไม่นับ',(_p,i)=>({stars:facts[i].score.seven,evidence:`เสิร์ฟ ${facts[i].values.filter(v=>v>0).length}/7 ช่องอาหาร`}));
 FOODS.forEach((food,index)=>add('best-'+food,`ใครทำ${FOOD_NAMES[food]}ได้ยอดเยี่ยมที่สุด?`,`เปรียบเทียบคุณภาพช่อง${FOOD_NAMES[food]}หลังเครื่องเทศ ก่อนคูณข่าวลือของโปรด ผู้ที่สูงที่สุดได้ 1 ดาว${s.critic==='mouse'&&food==='cheese'?' และโบนัสจากผู้วิจารณ์อีก 2 ดาว รวม 3 ดาว':''} หากเสมอกันได้ทุกคน และไม่ให้ดาวหากไม่มีใครเสิร์ฟ`,(_p,i)=>({stars:facts[i].score.best[index],evidence:facts[i].by[index].length?`คุณภาพ${FOOD_NAMES[food]} ${facts[i].score.courseQuality[index]}`:'ไม่ได้เสิร์ฟช่องนี้'}),{food}));
 const rumors=[...s.rumors,...s.players.flatMap(p=>p.extraRumor?[p.extraRumor]:[])];
 for(const id of rumors){
  const foodIndex=FOODS.findIndex(food=>id===food+'-fanatic');
  add('rumor-'+id,`ข่าวลือ: ${RUMOR[id].name}`,RUMOR[id].text,(_p,i)=>{
   const f=facts[i],stars=f.score.rumors.find(r=>r.id===id)?.stars??0,unique=[...new Set(f.all)].sort((a,b)=>a-b),served=f.values.filter(v=>v>0);
   let evidence='';
   if(foodIndex>=0)evidence=`คุณภาพ${FOOD_NAMES[FOODS[foodIndex]]} ${f.score.courseQuality[foodIndex]} → ${f.score.finalQuality[foodIndex]} · นำไปคิดดาวคุณภาพภายหลัง`;
   else switch(id){
    case 'varied-servings':evidence=`ค่าที่ไม่ซ้ำ ${unique.length} ค่า: ${unique.join(', ')||'ไม่มี'}`;break;
    case 'shortsighted':evidence=`แครอตสูงสุด ${f.values[1]} − 2 (ขั้นต่ำ 0)`;break;
    case 'super-chatty':evidence=`เก็บโทเคนข่าวลือ ${f.p.known.filter(Boolean).length} ชิ้น`;break;
    case 'picky':evidence=`เสิร์ฟ ${served.length}/7 ช่อง · ค่าต่ำสุด ${f.all.length?Math.min(...f.all):0}`;break;
    case 'to-go':evidence=`วัตถุดิบและเครื่องเทศเหลือ ${f.left.length} ชิ้น`;break;
    case 'spice-lover':evidence=`ใส่เครื่องเทศให้วัตถุดิบ ${f.meal.items.filter(i=>i.spice).length} ชิ้น`;break;
    case 'odd-tastes':case 'nocturnal':evidence=`ค่าสูงสุดแต่ละช่องที่เสิร์ฟ: ${served.join(' → ')||'ไม่ได้เสิร์ฟ'}`;break;
    case 'simple-palate':evidence=`กลุ่มค่าเดียวกันมากสุด ${Math.max(0,...f.all.map(v=>f.all.filter(x=>x===v).length))} ชิ้น`;break;
    case 'tender':evidence=served.length?`ซ้ายสุด ${served[0]} + ขวาสุด ${served.at(-1)} = ${served[0]+served.at(-1)!}`:'ไม่ได้เสิร์ฟ';break;
    case 'subtle-flavors':evidence=`ขนมปังสูงสุด ${f.values[0]} · ของค่าเดียวกัน ${f.values[0]?f.all.filter(v=>v===f.values[0]).length:0} ชิ้น`;break;
    case 'mercurial':evidence=f.all.length?`สูงสุด ${Math.max(...f.all)} − ต่ำสุด ${Math.min(...f.all)}`:'ไม่ได้เสิร์ฟ';break;
    case 'wine-cellar':evidence=`ไวน์ที่ไม่ได้เสิร์ฟ ${f.left.filter(id=>TOKEN[id].kind==='ingredient'&&TOKEN[id].food==='wine').length} ชิ้น`;break;
    case 'psychedelic-flavor':evidence=`เห็ดคุณภาพ ${f.score.courseQuality[5]} · ช่องที่ดีที่สุดของคุณ ${Math.max(...f.score.courseQuality)}`;break;
    case 'big-cheese':evidence=`ชีสสูงสุด ${f.values[2]} · เสิร์ฟ ${served.length} ช่อง`;break;
    case 'hibernator':{const index=f.values.reduce((last,v,i)=>v>0?i:last,-1);evidence=index>=0?`ขวาสุด ${FOOD_NAMES[FOODS[index]]} คุณภาพ ${f.score.courseQuality[index]} · สูงสุด ${Math.max(...f.score.courseQuality)}`:'ไม่ได้เสิร์ฟ';break;}
    case 'big-dipper':evidence=`ซุปและบิสก์คุณภาพ ${f.p.soup+3*f.p.bisque} · ขนมปังสูงสุด ${f.values[0]}`;break;
    case 'extremely-pampered':evidence=`มีวัตถุดิบเลขพิมพ์ 5 ขึ้นไป ${f.by.filter(items=>items.some(i=>TOKEN[i.token].value!>=5)).length}/7 ช่อง`;break;
    case 'unsophisticated':evidence=`ช่องที่ใช้ของชิ้นเดียว ไม่ใส่เครื่องเทศ/ไวน์เพิ่ม ${f.by.filter(items=>items.length===1&&!items[0].spice&&!f.meal.wine?.some(w=>w.course===items[0].as)).length} ช่อง`;break;
    case 'sommelier':evidence=`ค่าสูงสุด ไวน์ ${f.values[6]} · ปลา ${f.values[3]} · เนื้อ ${f.values[4]}`;break;
    case 'varied-leftovers':evidence=`ของเหลือมีค่าต่างกัน ${new Set(f.left.filter(id=>TOKEN[id].kind==='ingredient').map(id=>baseValue(s,f.p,id))).size} ค่า`;break;
   }
   return {stars,evidence};
  },{card:{kind:'rumor',id}});
 }
 add('quality','คุณภาพมื้อสุดท้าย เปลี่ยนเป็นกี่ดาว?','รวมคุณภาพทุกช่องหลังเครื่องเทศและข่าวลือของโปรด ทุก 7 คุณภาพได้ 1 ดาว เศษที่เหลือได้อีก 1 ดาว เช่น คุณภาพ 41 ได้ 6 ดาว',(_p,i)=>({stars:facts[i].score.qualityStars,evidence:`คุณภาพ ${facts[i].score.finalQuality.join(' + ')} = ${facts[i].score.quality}`}));
 if(s.critic==='fruit-bat'||s.critic==='poodle')add('critic-bonus',`โบนัสผู้วิจารณ์: ${CRITIC[s.critic].name}`,CRITIC[s.critic].text,(p,i)=>({stars:p.score!.bonus-(p.restaurateur?RESTAURATEUR[p.restaurateur].bonus:0),evidence:s.critic==='fruit-bat'?`เพิ่มไวน์จับคู่ ${facts[i].meal.wine?.length??0} ชิ้น`:`เสิร์ฟของค่าก่อนเครื่องเทศ 6 ขึ้นไป ${facts[i].all.filter(v=>v>=6).length} ชิ้น`}),{card:{kind:'critic',id:s.critic}});
 if(s.players.some(p=>p.restaurateur))add('restaurant-bonus','โบนัสประจำเจ้าของร้าน ได้กี่ดาว?','รับโบนัสประจำเจ้าของร้านตามตัวเลขบนการ์ด ส่วนดาวจากความสามารถระหว่างเกมได้รวมไว้ในหัวข้อ Challenge หรือเชฟแล้ว',p=>({stars:p.restaurateur?RESTAURATEUR[p.restaurateur].bonus:0,evidence:p.restaurateur?RESTAURATEUR[p.restaurateur].name:'ไม่ได้ใช้เจ้าของร้าน'}));

 return items;
}
export function finalRevealView(s:CKState):FinalReveal|undefined{
 if(s.phase!=='finished'||!s.players.every(p=>p.score&&p.critic))return;
 const items=finalRevealItems(s),step=Math.min(s.finalRevealStep??(s.resultsRevealed===false?0:items.length*2),items.length*2),index=Math.min(items.length-1,Math.floor(step/2)),complete=step>=items.length*2;
 const totals=Object.fromEntries(s.players.map(p=>[p.id,0]));
 for(const item of items.slice(0,Math.min(items.length,Math.ceil(step/2))))for(const award of item.awards)totals[award.actor]+=award.stars;
 const answered=complete||step%2===1,item=items[index];
 return {step,index,total:items.length,complete,answered,totals,...!complete?{item:{id:item.id,title:item.title,rule:item.rule,food:item.food,card:item.card,...answered?{awards:item.awards}:{}}}:{}};
}
