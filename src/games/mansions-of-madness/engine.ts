import {PROFILE,PROFILES,ITEMS,AFFLICTIONS,INSANITY,MONSTERS,SCENARIO_INFO,SKILLS} from './catalog.js';
import {makeRooms,makeDeck,shuffle} from './scenarios.js';
import type {MadnessState as S,MadnessAction as A,MadnessView as V,Hero,Room,Skill,Test,Intent,ScenarioId,Monster,Affliction,Possession} from './types.js';
const directions=[['north',0,-1],['east',1,0],['south',0,1],['west',-1,0]] as const;
export const hero=(s:S,id:string)=>s.heroes.find(h=>h.id===id)!;
export const room=(s:S,id:string)=>s.rooms.find(r=>r.id===id)!;
const event=(s:S,text:string)=>{s.log.push({id:++s.sequence,text});s.log=s.log.slice(-30);};
const nextId=(s:S,prefix:string)=>prefix+(++s.serial);
export const skill=(h:Hero,k:Skill)=>Math.max(1,PROFILE[h.profile!].stats[k]-[...h.damage,...h.horror].filter(c=>c.faceup&&'skill'in AFFLICTIONS[c.definition as keyof typeof AFFLICTIONS]&&(AFFLICTIONS[c.definition as keyof typeof AFFLICTIONS] as {skill?:string}).skill===k).length);
export function adjacent(s:S,id:string):Room[]{const r=room(s,id);return s.rooms.filter(x=>Math.abs(x.x-r.x)+Math.abs(x.y-r.y)===1);}
export function distance(s:S,a:string,b:string,ranged=false){const queue:[string,number][]=[[a,0]],seen=new Set([a]);for(const [id,n]of queue){if(id===b)return n;for(const next of adjacent(s,id)){if(!next.revealed||seen.has(next.id)||ranged&&!(room(s,id).open&&next.open))continue;seen.add(next.id);queue.push([next.id,n+1]);}}return Infinity;}
export function light(s:S,h:Hero){const ids=new Set([h.space,...adjacent(s,h.space).map(r=>r.id)]);return s.heroes.some(p=>!p.eliminated&&ids.has(p.space)&&p.items.some(i=>ITEMS[i.definition].light))||s.rooms.some(r=>ids.has(r.id)&&r.ground.some(i=>ITEMS[i.definition].light));}
export const canSpend=(s:S,h:Hero)=>!room(s,h.space).dark||light(s,h);
export function createInitialState(seats:{id:string;name:string}[],random:()=>number=Math.random,_starter?:string,scenario:ScenarioId='rain-house',expansion=false):S{
 if(!Object.hasOwn(SCENARIO_INFO,scenario)||SCENARIO_INFO[scenario].expansion&&!expansion||seats.length<1||seats.length>5||new Set(seats.map(p=>p.id)).size!==seats.length||seats.some(p=>!p.id||!p.name))throw Error('เลือกด่านที่เปิดใช้ และผู้เล่น 1–5 คน');
 const heroes=Array.from({length:Math.max(2,seats.length)},(_,i):Hero=>({id:'h'+i,owner:seats[i%seats.length].id,ready:false,space:'r0',clues:2,actions:0,moves:0,moveActions:0,done:false,wounded:false,eliminated:false,items:[],damage:[],horror:[]}));
 return {schema:1,scenario,expansion,players:seats.map(p=>({id:p.id,name:p.name})),heroes,rooms:makeRooms(scenario,random),monsters:[],phase:'setup',round:1,sequence:0,serial:100,damageDeck:makeDeck('damage',random),horrorDeck:makeDeck('horror',random),evidence:[],mythosQueue:[],winners:[],log:[],shifted:[]};
}
function possession(s:S,definition:string,key=false):Possession{return{id:nextId(s,'i'),definition,key};}
function terminal(s:S,result:'win'|'loss',reason:string){s.phase='finished';s.result=result;s.reason=reason;delete s.active;delete s.pending;delete s.puzzle;s.mythosQueue=[];s.winners=result==='win'?s.heroes.filter(h=>!h.eliminated&&(!h.insane||h.insane==='solitude'?!h.insane||!s.heroes.some(x=>x.id!==h.id&&!x.eliminated&&x.space===h.space):h.items.length>=2)).map(h=>h.id):[];event(s,reason);}
function recycle(s:S,h:Hero,kind:'damage'|'horror',random:()=>number){const cards=h[kind].filter(c=>!c.faceup);h[kind]=h[kind].filter(c=>c.faceup);s[kind==='damage'?'damageDeck':'horrorDeck'].push(...cards.map(c=>({...c,faceup:false})));shuffle(s[kind==='damage'?'damageDeck':'horrorDeck'],random);}
function eliminated(s:S,h:Hero){if(h.eliminated)return;h.eliminated=true;h.done=true;h.actions=0;h.moves=0;room(s,h.space).ground.push(...h.items);h.items=[];s.lastChance??=s.round+1;event(s,`${PROFILE[h.profile!].name} ถูกกำจัด ทุกคนมีโอกาสถึงจบช่วงนักสืบรอบ ${s.lastChance}`);if(s.heroes.every(x=>x.eliminated))terminal(s,'loss','นักสืบทั้งหมดถูกกำจัด');}
function suffer(s:S,h:Hero,kind:'damage'|'horror',n:number,random:()=>number){
 if(h.eliminated||s.phase==='finished')return;const deck=s[kind==='damage'?'damageDeck':'horrorDeck'];if(deck.length<n)throw Error('กองการ์ดไม่พอ');
 for(let i=0;i<n;i++){const card=deck.pop()!;card.faceup=AFFLICTIONS[card.definition as keyof typeof AFFLICTIONS].keep;h[kind].push(card);}
 const threshold=kind==='damage'?PROFILE[h.profile!].health:PROFILE[h.profile!].sanity;if(h[kind].length>=threshold){if(kind==='damage'){if(h.wounded)eliminated(s,h);else{h.wounded=true;recycle(s,h,kind,random);event(s,`${PROFILE[h.profile!].name} บาดเจ็บหนัก ต่อไปใช้แอ็กชันเดินได้ครั้งเดียวต่อตา`);if(h.damage.length>=threshold)eliminated(s,h);}}else if(h.insane)eliminated(s,h);else{h.insane=random()<.5?'solitude':'keepsake';recycle(s,h,kind,random);event(s,`${PROFILE[h.profile!].name} เสียสติ เป้าหมายใหม่ส่งให้เฉพาะเจ้าของ`);if(h.horror.length>=threshold)eliminated(s,h);}}
}
export function getLegalActions(s:S,id:string,hid:string):A['type'][] {
 const h=hero(s,hid);if(!h||h.owner!==id||h.eliminated||s.phase==='finished')return[];
 if(s.phase==='setup')return !h.profile?['mm-profile']:h.ready?['mm-ready']:['mm-ready','mm-trade'];
 if(s.phase==='test')return s.pending?.hero===hid?['mm-resolve']:[];
 if(s.phase==='puzzle')return s.puzzle?.hero===hid?['mm-code','mm-close']:[];
 if(s.phase==='mythos')return ['mm-mythos'];
 if(!s.active)return h.done?[]:['mm-begin'];if(s.active!==hid)return[];
 const actions:A['type'][]=['mm-end'];if(h.moves>0&&adjacent(s,h.space).some(r=>r.revealed))actions.push('mm-step');
 if(h.actions>0){if(!h.wounded||h.moveActions===0)actions.push('mm-move');if(adjacent(s,h.space).some(r=>!r.revealed))actions.push('mm-explore');if(room(s,h.space).nodes.some(n=>eligibleNode(s,h,n.id)))actions.push('mm-node');if(s.monsters.some(m=>distance(s,h.space,m.space)<=3))actions.push('mm-attack');actions.push('mm-trade');if(h.items.some(i=>!i.key&&ITEMS[i.definition].action&&(ITEMS[i.definition].action==='heal'?h.damage:h.horror).some(c=>!c.faceup)))actions.push('mm-item');}
 return actions;
}
function test(s:S,h:Hero,skillName:Skill,difficulty:number,label:string,effect:Test['effect'],random:()=>number,extra:Partial<Test>={}){const previous=s.phase==='mythos'?'mythos':'investigation';s.pending={id:++s.serial,hero:h.id,skill:skillName,difficulty,dice:Array.from({length:skill(h,skillName)},()=>{const n=Math.floor(random()*8);return n<3?'success':n<5?'clue':'blank';}),label,effect,returnPhase:previous,...extra};s.phase='test';}
function cleanupTurn(s:S){if(s.phase!=='investigation'||!s.active)return;const h=hero(s,s.active);if(h.eliminated||h.actions===0&&h.moves===0){h.done=true;h.actions=0;h.moves=0;delete s.active;endInvestigation(s);}}
function endInvestigation(s:S){if(s.phase!=='investigation'||!s.heroes.every(h=>h.done||h.eliminated))return;if(s.lastChance!==undefined&&s.round>=s.lastChance){terminal(s,'loss','เวลาช่วยเหลือหมดลงหลังมีนักสืบถูกกำจัด');return;}s.phase='mythos';s.mythosQueue=[{kind:'event',id:''},...s.monsters.map(m=>({kind:'monster' as const,id:m.id})),...s.heroes.filter(h=>!h.eliminated).map(h=>({kind:'horror' as const,id:h.id}))];event(s,'ช่วงมิธอสเริ่มขึ้น เสียงในบ้านค่อย ๆ ดังขึ้น');}
function awareness(s:S,h:Hero){return s.monsters.filter(m=>m.space===h.space).sort((a,b)=>MONSTERS[b.kind].awareness-MONSTERS[a.kind].awareness)[0];}
function needsEvade(s:S,h:Hero,intent:Intent,random:()=>number){const m=awareness(s,h);if(!m)return false;test(s,h,'agility',MONSTERS[m.kind].awareness,'หลบหลีก '+MONSTERS[m.kind].name,'evade',random,{monster:m.id,resume:intent});return true;}
function nodeOf(s:S,h:Hero,id:string){return room(s,h.space).nodes.find(n=>n.id===id);}
function eligibleNode(s:S,h:Hero,id:string){const n=nodeOf(s,h,id);if(!n||n.done)return false;if(n.kind!=='objective')return true;if(s.evidence.filter(id=>id.includes(':')).length<needed(s)||!s.evidence.includes('seal'))return false;return room(s,h.space).art===0?s.evidence.includes('ritual')&&s.heroes.every(x=>x.eliminated||x.space===h.space):!SCENARIO_INFO[s.scenario].expansion||h.items.some(i=>i.key);}
const needed=(s:S)=>SCENARIO_INFO[s.scenario].needed;
function reward(s:S,h:Hero,nodeId:string,random:()=>number){const n=nodeOf(s,h,nodeId)!;if(n.done)return;n.done=true;
 if(n.reward==='evidence'){s.evidence.push(n.id);h.clues+=1;const puzzle=s.rooms.flatMap(r=>r.nodes).find(x=>x.kind==='puzzle')!;const digit=puzzle.solution![n.piece!];event(s,`พบหลักฐาน ${s.evidence.filter(id=>id.includes(':')).length}/${needed(s)} · บันทึกรหัสตำแหน่ง ${n.piece!+1}: ${digit}`);}
 else if(n.reward==='seal'){s.evidence.push('seal');h.clues+=1;event(s,'ตู้รหัสเปิดออก เผยคำสั่งปิดรอยแยกในห้องพิธี');}
 else if(n.reward==='key'){const item=possession(s,'journal',true);h.items.push(item);event(s,'สมุดบันทึกได้รับโทเคนกุญแจ: ได้คุณลักษณะ Key และ Evidence และทิ้งไม่ได้');}
 else if(n.reward){h.items.push(possession(s,n.reward));event(s,`${PROFILE[h.profile!].name} พบ ${ITEMS[n.reward].name}`);}
 cleanupTurn(s);
}
function perform(s:S,h:Hero,a:Intent,random:()=>number,evaded=false){
 if(a.type!=='mm-move'&&!evaded&&needsEvade(s,h,a,random))return;
 if(a.type==='mm-step'){h.space=a.to;h.moves--;event(s,`${PROFILE[h.profile!].name} ไปยัง${room(s,a.to).name}`);cleanupTurn(s);return;}
 if(s.phase!=='setup')h.actions--;
 if(a.type==='mm-move'){h.moves+=2;h.moveActions++;return;}
 if(a.type==='mm-explore'){const d=directions.find(x=>x[0]===a.direction)!,from=room(s,h.space),target=s.rooms.find(r=>r.x===from.x+d[1]&&r.y===from.y+d[2])!;target.revealed=true;event(s,`เปิดประตู พบ${target.name} · คุณยังอยู่ที่${from.name}`);}
 else if(a.type==='mm-node'){
 const n=nodeOf(s,h,a.node)!;
 if(n.kind==='puzzle'){s.puzzle={hero:h.id,node:n.id,steps:skill(h,n.skill),returnPhase:'investigation'};s.phase='puzzle';event(s,`${PROFILE[h.profile!].name} เริ่มไขตู้รหัส`);return;}
 if(n.kind==='objective'){
 if(s.evidence.filter(id=>id.includes(':')).length<needed(s)||!s.evidence.includes('seal'))throw Error('ต้องมีหลักฐานครบและไขตู้รหัสก่อน');
 if(room(s,h.space).art===0){if(!s.evidence.includes('ritual')||s.heroes.some(x=>!x.eliminated&&x.space!==h.space))throw Error('ปิดรอยแยก แล้วพานักสืบที่ยังอยู่กลับมารวมกันที่โถง');terminal(s,'win','ทุกคนออกจากคฤหาสน์ได้ พร้อมหลักฐานที่ไม่มีใครกล้าปฏิเสธ');return;}
 if(s.expansion&&SCENARIO_INFO[s.scenario].expansion&&!h.items.some(i=>i.key))throw Error('ผู้ปิดรอยแยกต้องถือวัตถุติดกุญแจ');
 }
 test(s,h,n.skill,n.difficulty,n.name,n.kind==='objective'?'objective':'search',random,{node:n.id});return;
 }else if(a.type==='mm-trade'){
 const giving=h.items.filter(i=>a.items.includes(i.id));h.items=h.items.filter(i=>!a.items.includes(i.id));const destination=a.to?hero(s,a.to).items:room(s,h.space).ground;destination.push(...giving);const r=room(s,h.space),taking=r.ground.filter(i=>a.take.includes(i.id));r.ground=r.ground.filter(i=>!a.take.includes(i.id));h.items.push(...taking);event(s,`${PROFILE[h.profile!].name} จัดการสิ่งของ`);
 }else if(a.type==='mm-item'){
 const item=h.items.find(i=>i.id===a.item)!,kind=ITEMS[item.definition].action==='heal'?'damage':'horror',candidates=h[kind].filter(c=>!c.faceup),chosen=candidates[Math.floor(random()*candidates.length)];h[kind]=h[kind].filter(c=>c!==chosen);s[kind==='damage'?'damageDeck':'horrorDeck'].push({...chosen,faceup:false});shuffle(s[kind==='damage'?'damageDeck':'horrorDeck'],random);h.items=h.items.filter(i=>i.id!==item.id);event(s,`${PROFILE[h.profile!].name} ใช้ ${ITEMS[item.definition].name}`);
 }
 cleanupTurn(s);
}
function spawn(s:S,kind:Monster['kind'],space:string){s.monsters.push({id:nextId(s,'m'),kind,space,damage:0,health:MONSTERS[kind].baseHealth+s.heroes.length});event(s,`${MONSTERS[kind].name} ปรากฏใน${room(s,space).name}`);}
function advanceMythos(s:S,random:()=>number){
 while(s.phase==='mythos'&&s.mythosQueue.length){const step=s.mythosQueue.shift()!;
 if(step.kind==='event'){
  if(SCENARIO_INFO[s.scenario].expansion&&[3,6,9].includes(s.round)&&!s.shifted.includes(s.round)){const candidates=s.rooms.filter(r=>r.art!==0&&r.revealed);if(candidates.length>=2){const a=candidates[Math.floor(random()*candidates.length)],b=candidates.find(r=>r.id!==a.id)!;[a.x,b.x]=[b.x,a.x];[a.y,b.y]=[b.y,a.y];s.shifted.push(s.round);event(s,'บ้านเปลี่ยนรูป! ห้องสองห้องสลับตำแหน่ง ทุกตัวละคร สิ่งของ และโทเคนยังอยู่บนแผ่นห้องเดิม');}}
  if(s.round%3===0&&s.monsters.length<3){const candidates=s.rooms.filter(r=>r.revealed),r=candidates[Math.floor(random()*candidates.length)];spawn(s,s.expansion&&SCENARIO_INFO[s.scenario].expansion?'thrall':s.round>=6?'deep-one':'cultist',r.id);s.mythosQueue.splice(0,0,{kind:'monster',id:s.monsters.at(-1)!.id});}
  const h=s.heroes.find(h=>!h.eliminated)!;if(s.round%2===0){event(s,'เสียงกระซิบถามชื่อคุณจากในผนัง');test(s,h,'will',1,'เสียงที่ไม่มีต้นกำเนิด','event',random);return;}else{h.clues++;event(s,`${PROFILE[h.profile!].name} สังเกตสัญลักษณ์ประหลาด ได้เบาะแส 1 ชิ้น`);}
 }else if(step.kind==='monster'){
  const m=s.monsters.find(m=>m.id===step.id);if(!m)continue;const targets=s.heroes.filter(h=>!h.eliminated).sort((a,b)=>distance(s,m.space,a.space)-distance(s,m.space,b.space)||a.clues-b.clues||a.id.localeCompare(b.id));const target=targets[0];if(!target)continue;
  if(m.space!==target.space){const next=adjacent(s,m.space).filter(r=>r.revealed).sort((a,b)=>distance(s,a.id,target.space)-distance(s,b.id,target.space)||a.id.localeCompare(b.id))[0];if(next&&distance(s,next.id,target.space)<distance(s,m.space,target.space))m.space=next.id;event(s,`${MONSTERS[m.kind].name} เคลื่อนไป${room(s,m.space).name}`);}
  if(m.space===target.space){test(s,target,'strength',2,'ต้านการโจมตีจาก '+MONSTERS[m.kind].name,'monster',random,{monster:m.id});return;}
 }else{const h=hero(s,step.id);if(!h||h.eliminated)continue;const m=s.monsters.filter(m=>distance(s,h.space,m.space,true)<=3).sort((a,b)=>MONSTERS[b.kind].horror-MONSTERS[a.kind].horror||a.id.localeCompare(b.id))[0];if(m){test(s,h,'will',MONSTERS[m.kind].horror,'ทดสอบความหวาดกลัว: '+MONSTERS[m.kind].name,'horror',random,{monster:m.id});return;}}
 }
 if(s.phase!=='mythos')return;if(s.round>=SCENARIO_INFO[s.scenario].rounds){terminal(s,'loss','เสียงระฆังสุดท้ายดังขึ้น คฤหาสน์กลืนหายไปพร้อมผู้ที่ยังอยู่ข้างใน');return;}s.round++;s.phase='investigation';s.heroes.forEach(h=>{h.done=h.eliminated;h.actions=0;h.moves=0;h.moveActions=0;});event(s,`รอบ ${s.round} เริ่ม เลือกลำดับนักสืบได้อิสระ`);
}
const shapes:Record<A['type'],string>={'mm-profile':'hero,profile,type','mm-ready':'hero,ready,type','mm-begin':'hero,type','mm-end':'hero,type','mm-move':'hero,type','mm-step':'hero,to,type','mm-explore':'direction,hero,type','mm-node':'hero,node,type','mm-trade':'hero,items,take,to,type','mm-item':'hero,item,type','mm-attack':'hero,monster,type,weapon','mm-resolve':'hero,spend,type','mm-code':'guess,hero,spend,type','mm-close':'hero,type','mm-mythos':'type'};
function strings(x:unknown):x is string[]{return Array.isArray(x)&&x.length<=30&&x.every(a=>typeof a==='string')&&new Set(x).size===x.length;}
export function applyAction(state:S,id:string,a:A,random:()=>number=Math.random):S{
 if(!state.players.some(p=>p.id===id)||!a||typeof a!=='object'||Object.keys(a).sort().join(',')!==shapes[a.type])throw Error('คำสั่งหรือผู้เล่นไม่ถูกต้อง');
 if(a.type==='mm-mythos'){if(state.phase!=='mythos')throw Error('ยังไม่ถึงช่วงมิธอส');const s=structuredClone(state);advanceMythos(s,random);return s;}
 const original=hero(state,a.hero);if(!original||!getLegalActions(state,id,a.hero).includes(a.type))throw Error('ยังทำไม่ได้ หรือไม่ใช่นักสืบของคุณ');
 if(a.type==='mm-profile'&&(!Object.hasOwn(PROFILE,a.profile)||PROFILE[a.profile].expansion&&!state.expansion||state.heroes.some(h=>h.profile===a.profile))||a.type==='mm-ready'&&typeof a.ready!=='boolean')throw Error('เลือกนักสืบที่ยังว่าง และเปิดใช้ภาคเสริมให้ตรง');
 if(a.type==='mm-step'&&!adjacent(state,original.space).some(r=>r.id===a.to&&r.revealed)||a.type==='mm-explore'&&!directions.some(([name,dx,dy])=>name===a.direction&&state.rooms.some(r=>{const from=room(state,original.space);return r.x===from.x+dx&&r.y===from.y+dy&&!r.revealed;}))||a.type==='mm-node'&&!eligibleNode(state,original,a.node))throw Error('เป้าหมายอยู่นอกตำแหน่งที่เข้าถึงได้');
 if(a.type==='mm-node'&&nodeOf(state,original,a.node)?.done)throw Error('สำรวจจุดนี้ไปแล้ว');
 if(a.type==='mm-trade'&&(!strings(a.items)||!strings(a.take)||!a.items.length&&!a.take.length||a.items.some(i=>!original.items.some(x=>x.id===i))||a.take.some(i=>!room(state,original.space).ground.some(x=>x.id===i))||a.to!==null&&(typeof a.to!=='string'||a.to===original.id||!state.heroes.some(h=>h.id===a.to&&!h.eliminated&&h.space===original.space))))throw Error('แลกเฉพาะสิ่งของของคุณกับคนหรือกองในช่องเดียวกัน');
 if(a.type==='mm-item'&&!original.items.some(i=>i.id===a.item&&!i.key&&ITEMS[i.definition].action&&(ITEMS[i.definition].action==='heal'?original.damage:original.horror).some(c=>!c.faceup)))throw Error('สิ่งของนี้ใช้ไม่ได้ หรือมีโทเคนกุญแจจึงทิ้งไม่ได้');
 if(a.type==='mm-resolve'&&(!Number.isSafeInteger(a.spend)||a.spend<0||a.spend>original.clues||a.spend>state.pending!.dice.filter(x=>x==='clue').length||a.spend>0&&!canSpend(state,original)))throw Error('ใช้เบาะแสได้ไม่เกินผลแว่นขยาย และใช้ในความมืดไม่ได้');
 if(a.type==='mm-code'&&(!Array.isArray(a.guess)||a.guess.length!==3||a.guess.some(n=>!Number.isInteger(n)||n<1||n>4)||typeof a.spend!=='boolean'||state.puzzle!.steps<=0&&!a.spend||a.spend&&(!canSpend(state,original)||original.clues<1)))throw Error('เลือกเลข 1–4 ครบสามช่อง และเหลือขั้นปริศนาหรือใช้เบาะแส');
 if(a.type==='mm-attack'){const m=state.monsters.find(m=>m.id===a.monster),weapon=a.weapon===null?undefined:original.items.find(i=>i.id===a.weapon),definition=weapon?ITEMS[weapon.definition]:undefined;if(!m||a.weapon!==null&&!definition?.attack||(definition?.attack==='ranged'?distance(state,original.space,m.space,true)>3:m.space!==original.space))throw Error('เลือกอาวุธและมอนสเตอร์ในระยะ');}
 const s=structuredClone(state),h=hero(s,a.hero);
 if(a.type==='mm-profile'){h.profile=a.profile;h.items.push(possession(s,PROFILE[a.profile].stats.strength>=4?'crowbar':'revolver'),possession(s,['elena','iris'].includes(a.profile)?'lantern':a.profile==='maria'?'medicine':'journal'));event(s,`${PROFILE[a.profile].name} เข้าร่วมคดี`);return s;}
 if(a.type==='mm-ready'){h.ready=a.ready;if(s.heroes.every(h=>h.profile&&h.ready)){s.phase='investigation';event(s,SCENARIO_INFO[s.scenario].pitch);event(s,'เป้าหมาย: หาเอกสารสามชิ้น ไขตู้รหัส ปิดรอยแยก แล้วพาทุกคนกลับโถงทางเข้า');}return s;}
 if(a.type==='mm-begin'){s.active=h.id;h.actions=2;h.moves=0;h.moveActions=0;event(s,`${PROFILE[h.profile!].name} เริ่มตา มี 2 แอ็กชัน`);return s;}
 if(a.type==='mm-end'){h.done=true;h.actions=0;h.moves=0;delete s.active;endInvestigation(s);return s;}
 if(a.type==='mm-attack'){const item=h.items.find(i=>i.id===a.weapon),def=item?ITEMS[item.definition]:undefined;h.actions--;test(s,h,def?.attack==='ranged'?'agility':'strength',0,'โจมตี '+MONSTERS[s.monsters.find(m=>m.id===a.monster)!.kind].name,'attack',random,{monster:a.monster,weapon:item?.definition});return s;}
 if(a.type==='mm-close'){delete s.puzzle;s.phase='investigation';cleanupTurn(s);return s;}
 if(a.type==='mm-code'){const p=s.puzzle!,n=nodeOf(s,h,p.node)!,solution=n.solution!;if(a.spend)h.clues--;else p.steps--;const exact=a.guess.filter((v,i)=>v===solution[i]).length,matched=[1,2,3,4].reduce((sum,n)=>sum+Math.min(solution.filter(v=>v===n).length,a.guess.filter(v=>v===n).length),0);n.guesses.push({guess:[...a.guess],exact,misplaced:matched-exact});n.guesses=n.guesses.slice(-30);if(exact===3){delete s.puzzle;s.phase='investigation';reward(s,h,n.id,random);}return s;}
 if(a.type==='mm-resolve'){
  const t=s.pending!;h.clues-=a.spend;const successes=t.dice.filter(x=>x==='success').length+a.spend,passed=successes>=t.difficulty;delete s.pending;s.phase=t.returnPhase;event(s,`${PROFILE[h.profile!].name} · ${t.label}: ${successes} ผลสำเร็จ`);
  if(t.effect==='evade'){if(passed)perform(s,h,t.resume!,random,true);else{if(t.resume?.type==='mm-step')h.moves=0;else h.actions--;suffer(s,h,'damage',1,random);cleanupTurn(s);}return s;}
  if(t.effect==='attack'){const m=s.monsters.find(m=>m.id===t.monster);if(m){m.damage+=successes+(t.weapon?ITEMS[t.weapon].bonus??0:0);if(m.damage>=m.health){s.monsters=s.monsters.filter(x=>x!==m);event(s,`${MONSTERS[m.kind].name} ถูกกำจัด`);}}}
  else if(t.effect==='search'){if(passed)reward(s,h,t.node!,random);else{suffer(s,h,'horror',1,random);event(s,'ยังไขความหมายไม่ได้ ลองสำรวจอีกครั้งในแอ็กชันถัดไป');}}
  else if(t.effect==='objective'){if(passed){nodeOf(s,h,t.node!)!.done=true;s.evidence.push('ritual');event(s,'รอยแยกปิดแล้ว! ทุกคนกลับไปที่โถงทางเข้าเพื่อหนีออกจากบ้าน');}else suffer(s,h,'horror',1,random);}
  else if(t.effect==='monster'){if(!passed)suffer(s,h,'damage',2,random);}
  else if(t.effect==='horror'||t.effect==='event'){if(!passed)suffer(s,h,'horror',t.effect==='horror'?2:1,random);}
  if(s.phase==='mythos')advanceMythos(s,random);else cleanupTurn(s);return s;
 }
 perform(s,h,a as Intent,random);return s;
}
export function getDisplayView(s:S,code='',revision=0):V {
 const setup=s.phase==='setup',visible=s.rooms.filter(r=>r.revealed),rooms=setup?[]:visible.map(r=>({id:r.id,name:r.name,art:r.art,x:r.x,y:r.y,dark:r.dark,nodes:r.nodes.map(n=>({id:n.id,kind:n.kind,name:n.name,text:n.text,done:n.done})),ground:structuredClone(r.ground)}));
 return {gameId:'mansions-of-madness',code,revision,phase:s.phase,scenario:s.scenario,expansion:s.expansion,round:s.round,limit:SCENARIO_INFO[s.scenario].rounds,turn:s.active?hero(s,s.active).owner:s.pending?hero(s,s.pending.hero).owner:s.puzzle?hero(s,s.puzzle.hero).owner:'',active:s.active,evidence:s.evidence.filter(id=>id.includes(':')).length,evidenceNeeded:needed(s),players:s.players.map(p=>({...p})),heroes:s.heroes.map(h=>({id:h.id,owner:h.owner,name:h.profile?PROFILE[h.profile].name:'เลือกนักสืบ',profile:h.profile,art:h.profile?PROFILE[h.profile].art:0,ready:h.ready,space:h.space,clues:h.clues,actions:h.actions,moves:h.moves,done:h.done,wounded:h.wounded,insane:!!h.insane,eliminated:h.eliminated,health:h.profile?PROFILE[h.profile].health:0,sanity:h.profile?PROFILE[h.profile].sanity:0,damage:h.damage.length,horror:h.horror.length,faceupDamage:h.damage.filter(c=>c.faceup).map(c=>{const d=AFFLICTIONS[c.definition as keyof typeof AFFLICTIONS];return{name:d.name,text:d.text};}),faceupHorror:h.horror.filter(c=>c.faceup).map(c=>{const d=AFFLICTIONS[c.definition as keyof typeof AFFLICTIONS];return{name:d.name,text:d.text};}),items:structuredClone(h.items)})),rooms,doors:setup?[]:s.heroes.filter(h=>!h.eliminated).flatMap(h=>directions.flatMap(([direction,dx,dy])=>{const from=room(s,h.space),r=s.rooms.find(r=>r.x===from.x+dx&&r.y===from.y+dy&&!r.revealed);return r?[{hero:h.id,direction,x:r.x,y:r.y}]:[];})),monsters:setup?[]:s.monsters.filter(m=>room(s,m.space).revealed).map(m=>({...m})),...(s.pending?{test:{id:s.pending.id,hero:s.pending.hero,skill:s.pending.skill,difficulty:s.pending.difficulty,dice:[...s.pending.dice],label:s.pending.label,canSpend:canSpend(s,hero(s,s.pending.hero))}}:{}),...(s.puzzle?{puzzle:{hero:s.puzzle.hero,node:s.puzzle.node,steps:s.puzzle.steps,canSpend:canSpend(s,hero(s,s.puzzle.hero)),guesses:structuredClone(nodeOf(s,hero(s,s.puzzle.hero),s.puzzle.node)!.guesses)}}:{}),log:structuredClone(s.log),result:s.result,reason:s.reason,winners:[...s.winners]};
}
export function getPlayerView(s:S,id:string,code='',revision=0):V {const v=getDisplayView(s,code,revision);if(!s.players.some(p=>p.id===id))return v;return {...v,me:{id,heroes:s.heroes.filter(h=>h.owner===id).map(h=>({id:h.id,stats:h.profile?Object.fromEntries(SKILLS.map(k=>[k,skill(h,k)])) as Record<Skill,number>:Object.fromEntries(SKILLS.map(k=>[k,0])) as Record<Skill,number>,...h.insane?{insanity:INSANITY[h.insane as keyof typeof INSANITY]}:{},legal:getLegalActions(s,id,h.id),targets:{nodeIds:room(s,h.space).nodes.filter(n=>eligibleNode(s,h,n.id)).map(n=>n.id),monsterIds:s.monsters.filter(m=>distance(s,h.space,m.space,true)<=3).map(m=>m.id),stepIds:adjacent(s,h.space).filter(r=>r.revealed).map(r=>r.id),directions:directions.filter(([,dx,dy])=>{const from=room(s,h.space);return s.rooms.some(r=>r.x===from.x+dx&&r.y===from.y+dy&&!r.revealed);}).map(([d])=>d),tradeHeroes:s.heroes.filter(x=>x.id!==h.id&&!x.eliminated&&x.space===h.space).map(x=>x.id)}}))}};}
export const isFinished=(s:S)=>s.phase==='finished';
