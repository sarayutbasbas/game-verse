export type Mode='base'|'marvel';
export type Side='base'|'hero'|'thanos';
export interface CardDef {id:string;name:string;english:string;rank:number;copies:number;side:Side;effect:string;stone?:boolean;portrait:string}
const base=[
 ['spy','สายลับ','Spy',0,2,'จบรอบ หากคุณยังอยู่และเป็นคนเดียวที่เคยลงหรือทิ้งสายลับ รับตราเพิ่ม 1','adult cloaked female court spy, burgundy hood, holding a secret sealed letter, candlelit palace corridor'],
 ['guard','ทหารยาม','Guard',1,6,'เลือกคู่แข่งแล้วทายไพ่ ห้ามทายทหารยาม หากถูก คู่แข่งตกรอบ','adult royal palace guard in red and steel armor, holding a halberd, watchful expression, arched palace gate'],
 ['priest','นักบวช','Priest',2,2,'แอบดูไพ่ในมือคู่แข่งหนึ่งคน','elderly kind court priest, ivory and gold robes, bound prayer book, stained glass light'],
 ['baron','บารอน','Baron',3,2,'เทียบไพ่กับคู่แข่งเป็นความลับ คนเลขต่ำกว่าตกรอบ เสมอไม่มีใครตกรอบ','adult elegant aristocratic baron, navy velvet and gold embroidery, thoughtful look, palace study'],
 ['handmaid','นางกำนัล','Handmaid',4,2,'จนเริ่มตาถัดไป ผู้เล่นอื่นเลือกคุณเป็นเป้าหมายไม่ได้','adult royal handmaid in sage-green renaissance dress, holding a silver tray, sunlit royal garden'],
 ['prince','เจ้าชาย','Prince',5,2,'เลือกใครก็ได้รวมตัวเอง ให้ทิ้งไพ่แล้วจั่วใหม่ หากทิ้งเจ้าหญิงจะตกรอบ','adult prince age thirty, blue and gold royal coat, small crown, handsome dignified expression, palace balcony'],
 ['chancellor','เสนาบดี','Chancellor',6,2,'จั่วเพิ่ม 2 เก็บไว้ 1 ใบในมือ คืนใบอื่นลงใต้กองตามลำดับที่เลือก','older royal chancellor with spectacles, ornate gold-brown robes, scroll and signet ring, book-lined council chamber'],
 ['king','พระราชา','King',7,1,'แลกไพ่ในมือกับคู่แข่งหนึ่งคน','mature regal king with dark beard, crimson and gold ermine robes, jeweled crown, throne room'],
 ['countess','เคาน์เตส','Countess',8,1,'หากอีกใบเป็นเจ้าชายหรือพระราชา ต้องลงเคาน์เตส','adult countess in deep crimson velvet gown, dark hair, jeweled comb and folding fan, mysterious court portrait'],
 ['princess','เจ้าหญิง','Princess',9,1,'เมื่อเล่นหรือทิ้งเจ้าหญิง คุณตกรอบทันที','adult princess age twenty-five in rose and ivory silk royal gown, delicate gold diadem, holding a wax-sealed love letter, palace roses'],
] as const;
const heroEffects:Record<number,string>={1:'ทายเลขไพ่ในมือธานอส หากถูก ไพ่เลขนั้นแพ้หนึ่งใบ ธานอสเสียพลังชีวิต 1',2:'เลือกฮีโร่คนอื่นให้แอบดูไพ่ธานอสแบบสุ่ม 1 ใบ เล่นสองคนให้คุณดูเอง',3:'เลือกสู้กับธานอส หรือผ่าน การเทียบไพ่เป็นความลับ',4:'เลือกฮีโร่รวมตัวคุณ ให้รับโทเคนพลัง 1 อัน',5:'แอบดูไพ่บนกองฮีโร่ 3 ใบ แล้วเรียงกลับตามต้องการ',6:'เลือกฮีโร่รวมตัวคุณ ให้ตัดสินใจว่าจะสู้ธานอสหรือไม่'};
const heroes=[
 ['nebula','เนบิวลา','Nebula',1,'Marvel comics Nebula, blue skin, cybernetic metallic face implants, bald head, purple tactical outfit, dual batons'],
 ['spiderman','สไปเดอร์แมน','Spider-Man',1,'Marvel comics Spider-Man, red and blue web-pattern suit, large white mask eyes, dynamic web-swinging pose, New York skyline'],
 ['starlord','สตาร์ลอร์ด','Star-Lord',1,'Marvel comics Star-Lord, red long jacket, metallic breathing mask with red eye lenses, two sci-fi blasters, space adventure'],
 ['blackwidow','แบล็ควิโดว์','Black Widow',2,'Marvel comics Black Widow, long red hair, black tactical suit, gold wrist gauntlets, confident action pose'],
 ['gamora','กาโมรา','Gamora',2,'Marvel comics Gamora, green skin, long dark hair, black and white space armor, sword, cosmic nebula'],
 ['antman-wasp','แอนต์แมนและวอสป์','Ant-Man & Wasp',2,'Marvel comics Ant-Man and Wasp together, Ant-Man in red silver insect helmet and suit, Wasp as winged woman in yellow black suit and silver helmet, both full characters'],
 ['captainamerica','กัปตันอเมริกา','Captain America',3,'Marvel comics Captain America, blue suit, white star, winged blue helmet with A, iconic round red white blue shield, heroic action'],
 ['hulk','ฮัลค์','Hulk',3,'Marvel comics Hulk, enormous muscular green skin, purple torn trousers, powerful roaring pose, dramatic rubble but no blood'],
 ['thor','ธอร์','Thor',3,'Marvel comics classic Thor, long blond hair, silver winged helmet, red cape, black silver armor, Mjolnir hammer, lightning'],
 ['blackpanther','แบล็คแพนเธอร์','Black Panther',4,'Marvel comics Black Panther, full black vibranium panther suit and pointed ears mask, silver claw necklace, purple energy highlights, Wakanda'],
 ['falcon','ฟอลคอน','Falcon',4,'Marvel comics Sam Wilson Falcon, Black adult man, red white heroic suit, red goggles, immense mechanical feather wings spread'],
 ['doctorstrange','ด็อกเตอร์สเตรนจ์','Doctor Strange',4,'Marvel comics Doctor Strange, black hair with white temples, goatee, high-collared red Cloak of Levitation, blue tunic, golden magical circles'],
 ['scarletwitch','สการ์เล็ตวิทช์','Scarlet Witch',5,'Marvel comics Scarlet Witch, adult woman long auburn hair, iconic pointed red tiara and red cape, red costume, swirling crimson chaos magic'],
 ['vision','วิชัน','Vision',5,'Marvel comics Vision, red face, green android suit, yellow diamond chest and flowing golden cape, glowing forehead gem, floating'],
 ['captainmarvel','กัปตันมาร์เวล','Captain Marvel',6,'Marvel comics Carol Danvers Captain Marvel, adult blonde woman, blue and red suit, large gold eight-point star emblem, gold glowing fists, soaring cosmic pose'],
 ['ironman','ไอรอนแมน','Iron Man',6,'Marvel comics Iron Man, iconic polished red and gold armor, white glowing chest arc reactor and repulsor palm, flying toward viewer'],
] as const;
const villains=[
 ['outrider','เอาต์ไรเดอร์','Outrider',1,2,'เลือกฮีโร่แล้วทายเลข หากถูก ฮีโร่ทิ้งไพ่ เสียพลังชีวิตทีม 1 แล้วจั่วใหม่','Marvel comics Outrider, alien with four powerful clawed arms, black and gold plated skin, crouching insectlike monstrous silhouette, no gore'],
 ['corvus','คอร์วัส เกลฟ','Corvus Glaive',2,1,'เลือกฮีโร่ หากไพ่ในมือเลข 3 หรือต่ำกว่า ให้แพ้ไพ่ใบนั้น','Marvel comics Corvus Glaive, pale gaunt alien face, black hood, black and gold armor, long bladed glaive, sinister cosmic battlefield'],
 ['blackdwarf','แบล็คดวอร์ฟ','Black Dwarf',3,1,'เลือกฮีโร่สู้ด้วยหนึ่งคน หรือผ่าน คุณเลือกไพ่ในมือที่จะใช้สู้','Marvel comics Black Dwarf of the Black Order, enormous stocky orange-brown rocky alien warrior, heavy black gold armor, massive battle axe'],
 ['proxima','พร็อกซิมา มิดไนต์','Proxima Midnight',4,1,'รับโทเคนพลัง 1 อัน','Marvel comics Proxima Midnight, athletic blue-skinned female alien with long dark blue hair, gold and black horned headpiece and armor, long cosmic spear'],
 ['ebonymaw','เอโบนี มอว์','Ebony Maw',5,1,'จั่วเพิ่ม 1 แล้วคืนไพ่จากมือ 1 ใบลงใต้กอง ต้องคืนให้เสร็จก่อนดีดนิ้ว','Marvel comics Ebony Maw, tall thin pale gray alien, long chin, swept-back pale hair, elegant dark and gold robes, telekinetic hand gesture'],
 ['thanos','ธานอส','Thanos',7,1,'เล่นใบนี้ไม่ได้ หากแพ้ ให้จั่วแทนก่อน แล้วสับธานอสกลับเข้ากอง','Marvel comics Thanos, huge purple-skinned titan with ridged chin, blue and gold armor and helmet, golden Infinity Gauntlet with six colored gems raised, formidable cosmic portrait'],
] as const;
const stones=[
 ['mind','มายด์สโตน','Mind Stone',1,'ทายเลขเดียว ใช้กับฮีโร่ทุกคน ไพ่ที่ตรงแพ้ทั้งหมด จั่วแทนตามลำดับเล่น','yellow'],
 ['soul','โซลสโตน','Soul Stone',2,'เลือกฮีโร่ หากไพ่ในมือเลข 3 หรือสูงกว่า ให้แพ้ไพ่ใบนั้น','orange'],
 ['space','สเปซสโตน','Space Stone',3,'สู้ได้สูงสุด 2 ครั้งกับฮีโร่ต่างคน เล่นสองคนสู้คนเดิมซ้ำได้','blue'],
 ['power','พาวเวอร์สโตน','Power Stone',4,'รับโทเคนพลัง 3 อัน','purple'],
 ['reality','เรียลลิตีสโตน','Reality Stone',5,'จั่วเพิ่ม 2 แล้วคืนไพ่จากมือ 2 ใบลงใต้กองตามลำดับ ต้องคืนก่อนดีดนิ้ว','red'],
 ['time','ไทม์สโตน','Time Stone',6,'ใช้ความสามารถของไพ่ธานอสใบอื่นที่หงายอยู่หน้าคุณ','green'],
] as const;
export const CARDS:CardDef[]=[
 ...base.map(([key,name,english,rank,copies,effect,portrait])=>({id:'b-'+key,name,english,rank,copies,effect,portrait,side:'base' as Side})),
 ...heroes.map(([key,name,english,rank,portrait])=>({id:'h-'+key,name,english,rank,copies:1,effect:heroEffects[rank],portrait,side:'hero' as Side})),
 ...villains.map(([key,name,english,rank,copies,effect,portrait])=>({id:'t-'+key,name,english,rank,copies,effect,portrait,side:'thanos' as Side})),
 ...stones.map(([key,name,english,rank,effect,color])=>({id:'t-'+key,name,english,rank,copies:1,effect:effect+' หากแพ้ จั่วแทนก่อนสับสโตนกลับกอง',portrait:`Marvel Infinity ${english}, one luminous faceted ${color} cosmic gemstone suspended above a golden Infinity Gauntlet socket, vivid ${color} energy flowing around it, deep space, gemstone takes most of image, no text`,side:'thanos' as Side,stone:true})),
];
export const CARD=Object.fromEntries(CARDS.map(c=>[c.id,c])) as Record<string,CardDef>;
export const definition=(instance:string)=>CARD[instance.split(':')[0]];
export const instances=(side:Side)=>CARDS.filter(c=>c.side===side).flatMap(c=>Array.from({length:c.copies},(_,i)=>c.id+':'+i));
export const rank=(id:string)=>definition(id).rank;
export const FAVOR_TARGET:Record<number,number>={2:6,3:5,4:4,5:3,6:3};
export const THANOS_LIFE:Record<number,number>={2:4,3:4,4:5,5:6,6:7};
