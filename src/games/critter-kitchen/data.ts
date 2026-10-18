export const FOODS = ['bread', 'carrot', 'cheese', 'fish', 'meat', 'mushroom', 'wine'] as const;
export type Food = typeof FOODS[number];
export const FOOD_NAMES: Record<Food, string> = { bread: 'ขนมปัง', carrot: 'แครอต', cheese: 'ชีส', fish: 'ปลา', meat: 'เนื้อ', mushroom: 'เห็ด', wine: 'ไวน์' };
export interface Token {
    id: string;
    kind: 'ingredient' | 'spice' | 'rumor';
    food?: Food | 'all';
    value?: number;
    rumor?: number;
}
export const TOKENS: Token[] = [...FOODS.flatMap(food => [2, 2, 2, 3, 3, 3, 4, 4, 5, 5, 6, 6, 7].map((value, i) => ({ id: `i-${food}-${i}`, kind: 'ingredient' as const, food, value }))), ...[...FOODS, 'all' as const].flatMap(food => [0, 1].map(i => ({ id: `s-${food}-${i}`, kind: 'spice' as const, food }))), ...[0, 1, 2, 3].flatMap(rumor => [0, 1, 2].map(i => ({ id: `r-${rumor}-${i}`, kind: 'rumor' as const, rumor })))];
export const TOKEN: Record<string, Token> = Object.fromEntries(TOKENS.map(t => [t.id, t]));
export const SPECIAL_ALLSPICE = 'seventh-allspice';
TOKEN[SPECIAL_ALLSPICE] = { id: SPECIAL_ALLSPICE, kind: 'spice', food: 'all' };
export const LOCATIONS = [{ id: 'soup', name: 'รถซุป', english: 'Soup Truck', slots: 0 }, { id: 'garden', name: 'สวนบนหลังคา', english: 'Garden Top Shop', slots: 3 }, { id: 'desert', name: 'พ่อค้าทะเลทราย', english: 'Desert Vendor', slots: 3 }, { id: 'water', name: 'ตลาดน้ำ', english: 'Water-Market', slots: 3 }, { id: 'air', name: 'ท่าเรือเหาะ', english: 'Air Docks', slots: 3 }, { id: 'lantern', name: 'ตรอกโคมไฟ', english: 'Lantern Lane', slots: 3 }, { id: 'midnight', name: 'พ่อค้าเที่ยงคืน', english: 'Midnight Merchant', slots: 5 }, { id: 'academy', name: 'โรงเรียนเชฟ', english: 'Chef Academy', slots: 0 }] as const;
export type LocationId = typeof LOCATIONS[number]['id'];
export function boardConfiguration(count: number) { if (!Number.isInteger(count) || count < 2 || count > 5)
    throw Error('Critter Kitchen รองรับผู้เล่น 2–5 คน'); return { id: count === 2 ? 'two-player' : 'standard', count, locations: [LOCATIONS[0], ...LOCATIONS.slice(1, count + 1), { ...LOCATIONS[6], slots: count === 2 ? 3 : 5 }, { ...LOCATIONS[7], slots: count === 2 ? 2 : 0 }], specialSide: count === 2 ? '2' : 'standard', refrigeration: [5, 10] }; }
export const BASE_CHEFS = [{ id: 'mouse', name: 'เชฟหนู', animal: 'mouse', capacity: 1 }, { id: 'lizard', name: 'เชฟกิ้งก่า', animal: 'lizard', capacity: 2 }, { id: 'boar', name: 'เชฟหมูป่า', animal: 'boar', capacity: 3 }] as const;
export const ZOUS = [
    { id: 'chrissy', name: 'Chrissy', animal: 'chipmunk', capacity: 1, timing: 'start', text: 'ถ้าไม่มีเชฟอื่นมาสถานที่นี้ หยิบได้ 3 ชิ้นแทน 1' },
    { id: 'newton', name: 'Newton', animal: 'yorkie', capacity: 1, timing: 'after', text: 'ถ้าหยิบวัตถุดิบที่มีค่าต่ำที่สุดที่มีให้เลือก รับซุป 3 ถ้วย' },
    { id: 'lily', name: 'Lily', animal: 'frog', capacity: 1, timing: 'after', text: 'รับบิสก์จากรถซุป ถ้าไม่มีบิสก์ รับซุป 1 ถ้วย' },
    { id: 'ming', name: 'Ming', animal: 'hummingbird', capacity: 1, timing: 'start', text: 'หยิบก่อนเชฟอื่นทั้งหมด และไม่มีใครเปลี่ยนลำดับหมวกที่สถานที่นี้' },
    { id: 'ginger', name: 'Ginger', animal: 'fox', capacity: 2, timing: 'after', text: 'รับของสุ่ม 1 ชิ้นจากถุง' },
    { id: 'carol', name: 'Carol', animal: 'koala', capacity: 2, timing: 'after', text: 'ถ้าหมวกของคุณอยู่ท้ายสุด รับดาว 1 ดวง' },
    { id: 'penny', name: 'Penny', animal: 'penguin', capacity: 2, timing: 'after', text: 'เลือกของเพิ่ม 1 ชิ้นจากรถซุป รวมซุปได้ แม้อยู่สถานที่อื่น' },
    { id: 'otto', name: 'Otto', animal: 'otter', capacity: 2, timing: 'start', text: 'ถ้ามีเชฟความจุ 2 อีกตัวที่นี่ ทุกคนที่มีเชฟความจุ 2 ที่นี่รับของสุ่มจากถุงคนละ 1 ชิ้น' },
    { id: 'dash', name: 'Dash', animal: 'cheetah', capacity: 3, timing: 'start', text: 'ย้ายหมวกของคุณไปหน้าสุดของลำดับความสำคัญ' },
    { id: 'geoffrey', name: 'Geoffrey', animal: 'giraffe', capacity: 3, timing: 'before', text: 'ก่อนหยิบชิ้นแรก เติมของจากถุง 1 ชิ้นที่สถานที่ของ Geoffrey' },
    { id: 'snooze', name: 'Snooze', animal: 'sloth', capacity: 3, timing: 'start', text: 'เติมของจากถุง 2 ชิ้นที่สถานที่นี้' },
    { id: 'mandy', name: 'Mandy', animal: 'panda', capacity: 3, timing: 'after', text: 'เลือกของเพิ่มที่นี่ 1 ชิ้น ถ้าไม่มีของให้เลือก รับของสุ่มจากถุงแทน' }
] as const;
export const ZOU = Object.fromEntries(ZOUS.map(c => [c.id, c]));
export const CRITICS = [
    { id: 'mouse', name: 'The Mouse', animal: 'mouse', text: 'มื้อสุดท้ายเสิร์ฟชีสได้ไม่จำกัดชิ้น และผู้ชนะ Best of Cheese รับเพิ่ม 2 ดาว' },
    { id: 'jerboa', name: 'The Jerboa', animal: 'jerboa', text: 'มื้อสุดท้ายใช้โทเคนข่าวลือที่เก็บไว้แทนเครื่องเทศอเนกประสงค์ได้ โดยยังนับว่าเคยรู้ข่าวลือนั้น' },
    { id: 'saint-bernard', name: 'The Saint Bernard', animal: 'saint-bernard', text: 'ตลอดเกม ใช้วัตถุดิบไวน์แทนเครื่องเทศอเนกประสงค์ได้' },
    { id: 'badger', name: 'The Badger', animal: 'badger', text: 'ตลอดเกม เห็ดใช้แทนวัตถุดิบชนิดใดก็ได้ และใส่เครื่องเทศชนิดใดกับเห็ดก็ได้' },
    { id: 'fruit-bat', name: 'The Fruit Bat', animal: 'fruit-bat', text: 'มื้อสุดท้าย แต่ละคอร์สเพิ่มไวน์ไม่ใส่เครื่องเทศ 1 ชิ้นที่ค่าตรงกับวัตถุดิบค่าสูงสุดของคอร์สนั้น รับโบนัสไวน์ละ 1 ดาว' },
    { id: 'cow', name: 'The Cow', animal: 'cow', text: 'เลือกคอร์สเดียวในมื้อสุดท้ายให้ใช้วัตถุดิบชนิดนั้นได้ถึง 4 ชิ้น แต่ละชิ้นใส่เครื่องเทศได้' },
    { id: 'capybara', name: 'The Capybara', animal: 'capybara', text: 'แต่ละมื้อ Challenge ที่เสิร์ฟสำเร็จ รับเพิ่ม 1 ดาว' },
    { id: 'rabbit', name: 'The Rabbit', animal: 'rabbit', text: 'ตลอดเกม ค่าแครอตคูณ 2 ก่อนใส่เครื่องเทศ' },
    { id: 'tree-shrew', name: 'The Tree Shrew', animal: 'tree-shrew', text: 'ตลอดเกม เครื่องเทศคูณค่าวัตถุดิบ 3 เท่าแทน 2' },
    { id: 'poodle', name: 'The Poodle', animal: 'poodle', text: 'รับโบนัส 1 ดาวต่อวัตถุดิบค่า 6 ขึ้นไปก่อนเครื่องเทศที่เสิร์ฟในมื้อสุดท้าย' },
    { id: 'kangaroo', name: 'The Kangaroo', animal: 'kangaroo', text: 'ตลอดเกม วัตถุดิบที่พิมพ์ค่า 6 ถือเป็นค่า 9' },
    { id: 'raccoon', name: 'The Raccoon', animal: 'raccoon', text: 'วัตถุดิบค่าพิมพ์ 2 เก็บเปิดเผยและไม่กินที่ตู้เย็น มื้อสุดท้ายเพิ่มวัตถุดิบค่า 2 ในแต่ละคอร์สได้ไม่จำกัด' }
] as const;
export const CRITIC = Object.fromEntries(CRITICS.map(c => [c.id, c]));
export const CHALLENGES = [
    { id: 'coastal-fusion', name: 'Coastal Fusion', foods: ['fish', 'cheese', 'carrot'] },
    { id: 'savory-stack', name: 'Savory Stack', foods: ['cheese', 'meat', 'mushroom'] },
    { id: 'wine-dine', name: 'Wine & Dine', foods: ['mushroom', 'wine', 'fish'] },
    { id: 'street-eats', name: 'Street Eats', foods: ['meat', 'carrot', 'wine'] },
    { id: 'ultimate-melt', name: 'Ultimate Melt', foods: ['bread', 'fish', 'cheese'] },
    { id: 'comfort-food', name: 'Comfort Food', foods: ['wine', 'bread', 'meat'] },
    { id: 'tasty-tapas', name: 'Tasty Tapas', foods: ['carrot', 'mushroom', 'bread'] }
] as const;
export const CHALLENGE = Object.fromEntries(CHALLENGES.map(c => [c.id, c]));
export const RESTAURATEURS = [
    { id: 'anthony-boardain', name: 'Anthony Boardain', animal: 'boar', bonus: 3, text: 'เลือกของสุ่มจากถุงแทนซุปปลอบใจได้ รวมเมื่อเลือกกลับก่อนหยิบ' },
    { id: 'bobcat-flay', name: 'Bobcat Flay', animal: 'bobcat', bonus: 2, text: 'ใน Challenge เนื้อและปลาแต่ละชิ้นเพิ่มค่า 3 ก่อนเครื่องเทศ' },
    { id: 'falcon-brown', name: 'Falcon Brown', animal: 'falcon', bonus: 2, text: 'แต่ละ Challenge ที่ใช้วัตถุดิบตามที่ต้องการอย่างละ 1 ชิ้นพอดีและไม่มีซุป รับเพิ่ม 1 ดาว' },
    { id: 'goatn-ramsay', name: 'Goat’N Ramsay', animal: 'goat', bonus: 2, text: 'ใน Challenge วัตถุดิบค่าพิมพ์ 2 เพิ่มค่า 2 ก่อนเครื่องเทศ' },
    { id: 'graham-elephant', name: 'Graham Elephant', animal: 'elephant', bonus: 2, text: 'แต่ละ Challenge คุณภาพ 25 ขึ้นไป รับเพิ่ม 1 ดาว' },
    { id: 'heron-sanchez', name: 'Herón Sanchez', animal: 'heron', bonus: 3, text: 'ใน Challenge ใช้เครื่องเทศชิ้นเดียวกับวัตถุดิบชนิดเดียวกันได้หลายชิ้น ใช้ความสามารถได้หลายจาน แต่โทเคนเครื่องเทศแต่ละชิ้นอยู่จานเดียว' },
    { id: 'jamie-owliver', name: 'Jamie Owliver', animal: 'owl', bonus: 2, text: 'รับข่าวลือเพิ่มส่วนตัว 1 ใบทันที ข่าวลือนี้มีผลกับทุกคนเมื่อจบเกม' },
    { id: 'julia-wild', name: 'Julia Wild', animal: 'hedgehog', bonus: 1, text: 'ตลอดเกม ใช้เครื่องเทศทุกชนิดแทนเครื่องเทศอเนกประสงค์ได้' },
    { id: 'marcus-roostersson', name: 'Marcus Roostersson', animal: 'rooster', bonus: 2, text: 'จบแต่ละรอบ ขยับหมวกไปข้างหน้า 1 ขั้น ถ้าอยู่หน้าสุดแล้ว รับของสุ่ม 1 ชิ้นจากถุง' },
    { id: 'martha-shrewart', name: 'Martha Shrewart', animal: 'shrew', bonus: 3, text: 'เมื่อเสิร์ฟครบ 3 Challenge ในวันเดียวกัน รับเพิ่ม 2 ดาว' }
] as const;
export const RESTAURATEUR = Object.fromEntries(RESTAURATEURS.map(c => [c.id, c]));
export const RUMORS = [
    ...FOODS.map(food => ({ id: `${food}-fanatic`, name: `${FOOD_NAMES[food]}โปรด`, advanced: false, text: `ตอนรวมคุณภาพท้ายเกม คอร์ส${FOOD_NAMES[food]}คูณ 2 หลังเครื่องเทศ (ไม่เพิ่มผล Best of Course)` })),
    { id: 'varied-servings', name: 'Varied Servings', advanced: false, text: '1 ดาวต่อค่าที่แตกต่างของวัตถุดิบที่เสิร์ฟก่อนเครื่องเทศ และอีก 1 ดาวให้คนที่มีจำนวนค่าต่างกันมากที่สุด' },
    { id: 'shortsighted', name: 'Shortsighted', advanced: false, text: 'รับดาวเท่ากับแครอตค่าสูงสุดที่เสิร์ฟก่อนเครื่องเทศ ลบ 2 (ไม่ต่ำกว่า 0)' },
    { id: 'super-chatty', name: 'Super Chatty', advanced: false, text: '1 ดาวต่อโทเคนข่าวลือที่เคยเก็บ (ใบเพิ่มจาก Jamie ไม่นับ)' },
    { id: 'picky', name: 'Picky', advanced: false, text: 'ถ้าเสิร์ฟครบ 7 คอร์ส รับดาวเท่ากับวัตถุดิบค่าต่ำสุดที่เสิร์ฟก่อนเครื่องเทศ' },
    { id: 'to-go', name: 'To Go', advanced: false, text: '1 ดาวต่อวัตถุดิบหรือเครื่องเทศที่ไม่ได้เสิร์ฟทุก 2 ชิ้น และอีก 1 ดาวให้ผู้เหลือมากที่สุด' },
    { id: 'spice-lover', name: 'Spice Lover', advanced: false, text: 'ผู้เสิร์ฟวัตถุดิบที่ใส่เครื่องเทศมากที่สุด รับ 2 ดาว' },
    { id: 'odd-tastes', name: 'Odd Tastes', advanced: false, text: 'ถ้าวัตถุดิบค่าสูงสุดของทุกคอร์สที่เสิร์ฟก่อนเครื่องเทศเป็นเลขคี่ รับ 3 ดาว' },
    { id: 'simple-palate', name: 'Simple Palate', advanced: true, text: 'ผู้เสิร์ฟวัตถุดิบค่าเดียวกันจำนวนมากที่สุดก่อนเครื่องเทศ รับ 3 ดาว' },
    { id: 'tender', name: 'Tender', advanced: true, text: 'ค่าสูงสุดก่อนเครื่องเทศของคอร์สซ้ายสุดและขวาสุดที่เสิร์ฟรวมกันเท่ากับ 10 รับ 3 ดาว' },
    { id: 'subtle-flavors', name: 'Subtle Flavors', advanced: true, text: 'ผู้เสิร์ฟวัตถุดิบที่ค่าตรงกับขนมปังค่าสูงสุดของตนมากที่สุด รับ 3 ดาว (ทั้งหมดก่อนเครื่องเทศ)' },
    { id: 'mercurial', name: 'Mercurial', advanced: true, text: 'รับดาวเท่ากับผลต่างระหว่างวัตถุดิบค่าสูงสุดและต่ำสุดที่เสิร์ฟก่อนเครื่องเทศ' },
    { id: 'wine-cellar', name: 'Wine Cellar', advanced: true, text: 'รับ 1 ดาวต่อวัตถุดิบไวน์ที่ไม่ได้เสิร์ฟ เครื่องเทศไวน์ไม่นับ' },
    { id: 'psychedelic-flavor', name: 'Psychedelic Flavor', advanced: true, text: 'ถ้าคอร์สเห็ดเป็นคอร์สคุณภาพสูงสุดของคุณ รับ 2 ดาว ไม่รวมตัวคูณ Fanatic' },
    { id: 'big-cheese', name: 'Big Cheese', advanced: true, text: 'ถ้าชีสค่าสูงสุดก่อนเครื่องเทศมีค่าไม่น้อยกว่าจำนวนคอร์สที่เสิร์ฟ รับ 3 ดาว' },
    { id: 'hibernator', name: 'Hibernator', advanced: true, text: 'ถ้าคอร์สขวาสุดที่เสิร์ฟมีคุณภาพสูงสุด รับ 2 ดาว ไม่รวมตัวคูณ Fanatic' },
    { id: 'big-dipper', name: 'Big Dipper', advanced: true, text: 'ถ้าซุปและบิสก์ที่เหลือมีคุณภาพรวมไม่น้อยกว่าขนมปังค่าสูงสุดที่เสิร์ฟก่อนเครื่องเทศ รับ 2 ดาว' },
    { id: 'extremely-pampered', name: 'Extremely Pampered', advanced: true, text: 'เสิร์ฟครบ 7 คอร์ส และแต่ละคอร์สมีวัตถุดิบอย่างน้อย 1 ชิ้นค่าที่พิมพ์ 5 ขึ้นไป รับ 2 ดาว' },
    { id: 'unsophisticated', name: 'Unsophisticated', advanced: true, text: '1 ดาวต่อคอร์สที่เสิร์ฟวัตถุดิบชิ้นเดียวและไม่ใส่เครื่องเทศ อีก 1 ดาวให้ผู้มีคอร์สแบบนี้มากที่สุด' },
    { id: 'sommelier', name: 'Sommelier', advanced: true, text: 'ไวน์ค่าสูงสุดตรงกับปลาค่าสูงสุด รับ 2 ดาว และตรงกับเนื้อค่าสูงสุด รับอีก 2 ดาว (ก่อนเครื่องเทศ)' },
    { id: 'varied-leftovers', name: 'Varied Leftovers', advanced: true, text: '1 ดาวต่อค่าที่แตกต่างของวัตถุดิบที่ไม่ได้เสิร์ฟ และอีก 1 ดาวให้คนที่มีค่าต่างกันมากที่สุด' },
    { id: 'nocturnal', name: 'Nocturnal', advanced: true, text: 'ถ้าค่าสูงสุดก่อนเครื่องเทศของแต่ละคอร์สที่เสิร์ฟเรียงซ้ายไปขวาไม่ลดลง รับ 5 ดาว' }
];
export const RUMOR = Object.fromEntries(RUMORS.map(c => [c.id, c]));
