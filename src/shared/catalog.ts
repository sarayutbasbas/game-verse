import type { GameId } from "./types.js";
export type GameStatus = "ready" | "beta" | "maintenance" | "coming-soon";
export interface GameMetadata {
  id: GameId;
  playMode?: "room" | "local";
  name: string;
  aliases: readonly string[];
  cover: string;
  coverAlt: string;
  minPlayers: number;
  maxPlayers: number;
  supportedCounts?: readonly number[];
  durationMinutes: number;
  category: string;
  difficulty: string | null;
  metadataSource: string;
  status: GameStatus;
  rulesVersion: string;
  stateSchemaVersion: number;
  ui: GameId;
}
// Public metadata only: importing this file never includes engine state or secrets.
export const GAME_CATALOG: readonly GameMetadata[] = [
 {id:'flip-7',name:'Flip 7',aliases:['flip7','flip 7','ฟลิปเซเว่น','ฟลิปเจ็ด','ฟลิป 7'],cover:'/art/flip-7/cover.webp',coverAlt:'กล่อง Flip 7 ลายเส้นโค้งสีสันและเลขเจ็ด',minPlayers:3,maxPlayers:9,durationMinutes:20,category:'เสี่ยงเปิดไพ่ • ภาคหลัก 94 ใบ',difficulty:null,metadataSource:'https://theop.games/products/flip-7',status:'beta',rulesVersion:'op-base94-dized-faq-2026-v1',stateSchemaVersion:1,ui:'flip-7'},
 {id:'catch-sketch',name:'Catch Sketch',aliases:['catch sketch','doodly quickly','แคตช์สเก็ตช์','วาดเร็วทายภาพ'],cover:'/art/catch-sketch/cover.webp',coverAlt:'กล่อง Catch Sketch สีเหลือง ภาพกระดานวาดและปากกา ชุดคำไทย',minPlayers:3,maxPlayers:6,durationMinutes:20,category:'วาดพร้อมกัน • แย่งลำดับเปิดภาพ • ชุดคำไทย',difficulty:null,metadataSource:'https://instaplay.fr/en/games/doodly-quickly/',status:'beta',rulesVersion:'mandoo-2021-base-original-th-100-pairs-v1',stateSchemaVersion:1,ui:'catch-sketch'},
 {id:'muffin-time',name:'Muffin Time · ชุดการ์ดไทยเว็บ',aliases:['muffin time','มัฟฟินไทม์','มัฟฟิน','มัฟฟิน ไทม์'],cover:'/art/muffin-time/cover.webp',coverAlt:'กล่อง Muffin Time สีฟ้า มัฟฟินภาพเส้นขาวดำ ชุดการ์ดไทยเว็บ',minPlayers:2,maxPlayers:8,durationMinutes:20,category:'ปาร์ตี้แกล้งเพื่อน • ชุดดัดแปลง 120 ใบ',difficulty:null,metadataSource:'https://bigpotato.co.uk/products/muffin-time',status:'beta',rulesVersion:'big-potato-core-2019-original-th-web-120-v1',stateSchemaVersion:1,ui:'muffin-time'},
 {id:'mansions-of-madness',name:'Mansions of Madness · ด่านแฟนเมด',aliases:['mansions of madness','mansion of madness','แมนชัน','คฤหาสน์วิปลาส'],cover:'/art/mansions-of-madness/cover.webp',coverAlt:'กล่อง Mansions of Madness ภาพคฤหาสน์กลางสายฝน ชุดด่านแฟนเมด',minPlayers:1,maxPlayers:5,supportedCounts:[1,2,3,4,5],durationMinutes:180,category:'สืบสวนร่วมมือ · ด่านและชุดการ์ดแฟนเมด · กลไก Second Edition',difficulty:null,metadataSource:'https://www.fantasyflightgames.com/product/mansions-of-madness-second-edition/',status:'beta',rulesVersion:'ffg-2e-fan-scenarios-btt-mechanics-v1',stateSchemaVersion:1,ui:'mansions-of-madness'},
 {id:'just-one',name:'Just One',aliases:['just one','justone','จัสต์วัน','จัสวัน','คำใบ้'],cover:'/art/just-one/cover.webp',coverAlt:'กล่อง Just One กระดานคำใบ้และปากกาหลากสี',minPlayers:3,maxPlayers:7,supportedCounts:[3,4,5,6,7],durationMinutes:20,category:'ร่วมมือทายคำ · คละหมวด 100 ใบ',difficulty:null,metadataSource:'https://www.rprod.com/en/games/just-one',status:'beta',rulesVersion:'repos-base-2018-th-mixed100-replace-v2',stateSchemaVersion:1,ui:'just-one'},
 {id:'bomb-busters',name:'Bomb Busters',aliases:['bomb busters','bombbusters','บอมบ์บัสเตอร์ส','บอมบ์บัสเตอร์','กู้ระเบิด'],cover:'/art/bomb-busters/cover.webp',coverAlt:'กล่อง Bomb Busters ทีมสัตว์ชุดแดงร่วมมือกู้ระเบิด',minPlayers:2,maxPlayers:5,supportedCounts:[2,3,4,5],durationMinutes:30,category:'ร่วมมือเดาสายไฟ · ภารกิจ 1, 4 และ 8',difficulty:null,metadataSource:'https://www.cocktailgames.com/jeu/bomb-busters/',status:'beta',rulesVersion:'cocktail-pegasus-2024-verified-missions-1-4-8-v1',stateSchemaVersion:1,ui:'bomb-busters'},
 {id:'courtisans',name:'สภาฐานันดร',aliases:['courtisans','สภาฐานันดร','ราชสำนัก'],cover:'/art/courtisans/cover.webp',coverAlt:'กล่อง Courtisans ราชสำนักหกตระกูลสีมรกตและทอง',minPlayers:2,maxPlayers:5,supportedCounts:[2,3,4,5],durationMinutes:20,category:'ชิงอิทธิพล · ภารกิจลับ · เล่นไพ่สามพื้นที่',difficulty:null,metadataSource:'https://catchupgames.com/nos-jeux/courtisans/',status:'beta',rulesVersion:'catch-up-2024-base-fr-missions-v1',stateSchemaVersion:1,ui:'courtisans'},

 {id:'trio',name:'Trio',aliases:['trio','ทรีโอ','ทริโอ'],cover:'/art/trio/cover.webp',coverAlt:'กล่อง Trio ไพ่ตัดกระดาษหลากสีและอะโวคาโด',minPlayers:3,maxPlayers:6,supportedCounts:[3,4,5,6],durationMinutes:15,category:'จำไพ่ · ขอเลขต่ำสุดหรือสูงสุด · เก็บชุดสามใบ',difficulty:null,metadataSource:'https://www.cocktailgames.com/jeu/trio/',status:'beta',rulesVersion:'cocktail-games-2023-simple-spicy-teams-v1',stateSchemaVersion:1,ui:'trio'},
 {id:'castle-combo',name:'คอมโบคนปราสาท',aliases:['castle combo','chateau combo','คอมโบ คนปราสาท','คอมโบคนปราสาท'],cover:'/art/castle-combo/cover.webp',coverAlt:'กล่อง Castle Combo งานเลี้ยงตัวละครแห่งปราสาทและหมู่บ้าน',minPlayers:2,maxPlayers:5,supportedCounts:[2,3,4,5],durationMinutes:25,category:'ซื้อการ์ด · จัดตาราง 3×3 · สร้างคอมโบ',difficulty:null,metadataSource:'https://catchupgames.com/nos-jeux/chateau-combo/',status:'beta',rulesVersion:'catch-up-games-base-78-2024-v1',stateSchemaVersion:1,ui:'castle-combo'},
 {id:'power-hungry-pets',name:'Power Hungry Pets',aliases:['power hungry pets','power hungry pet','พาวเวอร์ฮังกรีเพ็ตส์','สัตว์ชิงบัลลังก์','ราชาแมว'],cover:'/art/power-hungry-pets/cover.webp',coverAlt:'กล่อง Power Hungry Pets ราชาแมวและเหล่าสัตว์ชิงเหรียญอุ้งเท้า',minPlayers:2,maxPlayers:6,supportedCounts:[2,3,4,5,6],durationMinutes:15,category:'จั่วหนึ่ง เล่นหนึ่ง · สัตว์ชิงอำนาจ',difficulty:null,metadataSource:'https://www.explodingkittens.com/pages/how-to-play-power-hungry-pets',status:'beta',rulesVersion:'exploding-kittens-base-21-cards-2025-printing-tie-shared-v1',stateSchemaVersion:1,ui:'power-hungry-pets'},
 {id:'love-letter',name:'Love Letter · Classic + Marvel',aliases:['love letter','infinity gauntlet','infinity gaunlet','marvel','เลิฟเลตเตอร์','จดหมายรัก','ธานอส'],cover:'/art/love-letter/cover.webp',coverAlt:'กล่อง Love Letter รวมภาคหลักและ Marvel Infinity Gauntlet',minPlayers:2,maxPlayers:6,supportedCounts:[2,3,4,5,6],durationMinutes:20,category:'สองโหมดในกล่องเดียว • ราชสำนัก / Marvel',difficulty:null,metadataSource:'https://www.zmangames.com/game/love-letter/',status:'beta',rulesVersion:'zman-21-card-2019-and-infinity-gauntlet-2020-v1',stateSchemaVersion:1,ui:'love-letter'},
 {id:"sounds-fishy",name:"Sounds Fishy",aliases:["sound fish","sounds fishy","ซาวด์ฟิช","เรื่องนี้กลิ่นตุ","ปลา","จับโกหก"],cover:"/art/sounds-fishy/cover.webp",coverAlt:"กล่อง Sounds Fishy ปลาฟ้าท่ามกลางฝูงปลาแดง",minPlayers:4,maxPlayers:10,supportedCounts:[4,5,6,7,8,9,10],durationMinutes:15,category:"จับโกหกด้วยความรู้โลก • ระดับยาก 200 ข้อ",difficulty:null,metadataSource:"https://bigpotato.com/products/sounds-fishy",status:"ready",rulesVersion:"big-potato-base-2022-th-original-200-v1",stateSchemaVersion:1,ui:"sounds-fishy"},
 {id:"perch",name:"Perch",aliases:["perch","เพิร์ช","นก","ฝูงนก"],cover:"/art/perch/cover-v2.webp",coverAlt:"กล่อง Perch สวนนกสามมิติยามเย็น",minPlayers:2,maxPlayers:5,supportedCounts:[2,3,4,5],durationMinutes:45,category:"แย่งพื้นที่ฝูงนก • ชุดแนะนำเกมแรก",difficulty:null,metadataSource:"https://insideupgames.com/our-games/perch/",status:"ready",rulesVersion:"inside-up-base-2024-first-game-2026-01-v1",stateSchemaVersion:1,ui:"perch"},
 {id:"draftosaurus",name:"Draftosaurus",aliases:["draftosaurus","ดราฟโทซอรัส","ไดโนเสาร์","สวนไดโนเสาร์"],cover:"/art/draftosaurus/cover-v2.webp",coverAlt:"กล่อง Draftosaurus สวนจำลองและไดโนเสาร์หกชนิด",minPlayers:2,maxPlayers:5,supportedCounts:[2,3,4,5],durationMinutes:15,category:"ดราฟต์ไดโนเสาร์ สร้างสวนของคุณ",difficulty:null,metadataSource:"https://www.ankama-shop.com/en/all-boardgames/1997-draftosaurus.html",status:"ready",rulesVersion:"ankama-base-2019-summer-2to5-v1",stateSchemaVersion:1,ui:"draftosaurus"},
 {id:"take-time",name:"Take Time",aliases:["take time","เทคไทม์","เวลา","นาฬิกา"],cover:"/art/take-time/cover.webp",coverAlt:"นาฬิกาดาราศาสตร์ในสวนแห่งกาลเวลา",minPlayers:2,maxPlayers:4,supportedCounts:[2,3,4],durationMinutes:30,category:"ร่วมมือไขปริศนาเวลา • ด่านเริ่มต้น 1–1",difficulty:null,metadataSource:"https://www.libellud.com/game/take-time/",status:"beta",rulesVersion:"libellud-2025-th-en-clock-1-1-v1",stateSchemaVersion:1,ui:"take-time"},
 {id:"critter-kitchen",name:"Critter Kitchen",aliases:["critter kitchen","คริตเตอร์","ครัวสัตว์","เชฟ"],cover:"/art/covers/critter-kitchen.webp",coverAlt:"เหล่าเชฟสัตว์ในเมืองร้านอาหารริมคลอง",minPlayers:2,maxPlayers:5,supportedCounts:[2,3,4,5],durationMinutes:60,category:"วางแผนลับและปรุงอาหาร",difficulty:null,metadataSource:"https://cardboardalchemy.com/critter-kitchen/",status:"beta",rulesVersion:"cardboard-alchemy-base-2024-v1",stateSchemaVersion:1,ui:"critter-kitchen"},
 {id:"locus",name:"Locus",aliases:["locus","โลคัส","กากบาท","flip write"],cover:"/art/locus/cover.webp",coverAlt:"กระดาษและดินสอห้าสีบนโต๊ะปริศนา",minPlayers:2,maxPlayers:5,supportedCounts:[2,3,4,5],durationMinutes:30,category:"พลิกการ์ด กากบาท และต่อคอมโบ",difficulty:null,metadataSource:"https://www.tuckersfunfactory.nl/1009/webshop/kaartspellen/TFF-482108",status:"ready",rulesVersion:"tucker-base-2024-en-v1",stateSchemaVersion:1,ui:"locus"},
 {id:"sky-team",name:"Sky Team",aliases:["sky team","สกายทีม","เครื่องบิน","ลงจอด"],cover:"/art/covers/sky-team.webp",coverAlt:"เครื่องบินโดยสารเข้าใกล้รันเวย์ยามเช้า",minPlayers:2,maxPlayers:2,supportedCounts:[2],durationMinutes:20,category:"ร่วมมือลงจอดเครื่องบิน",difficulty:null,metadataSource:"https://www.scorpionmasque.com/en/sky-team",status:"ready",rulesVersion:"base-2023-yul-intro-v1",stateSchemaVersion:1,ui:"sky-team"},
 {id:"harmonies",name:"Harmonies",aliases:["harmonies","ฮาร์โมนี","ฮาร์โมนีส์","ธรรมชาติ","สัตว์"],cover:"/art/harmonies/reference/cover.webp",coverAlt:"สัตว์น้อยในโลกธรรมชาติและชิ้นไม้หลากสี",minPlayers:1,maxPlayers:4,supportedCounts:[1,2,3,4],durationMinutes:30,category:"สร้างภูมิประเทศและถิ่นอาศัยสัตว์",difficulty:null,metadataSource:"https://www.libellud.com/game/harmonies/",status:"ready",rulesVersion:"libellud-base-2024-spirits-solo-crescendo-whispers-v2",stateSchemaVersion:1,ui:"harmonies"},
 {id:"pixies",name:"Pixies — ภูตจิ๋วจอมป่วน",aliases:["pixies","พิกซี","พิกซี่","ภูตจิ๋ว","ภูต"],cover:"/art/covers/pixies.webp",coverAlt:"ภูตเมล็ดพืชตัวจิ๋วในป่ามอส",minPlayers:2,maxPlayers:5,supportedCounts:[2,3,4,5],durationMinutes:30,category:"เลือกไพ่และจัดสวนภูต 3×3",difficulty:null,metadataSource:"https://studiobombyx.com/jeu/pixies/",status:"ready",rulesVersion:"bombyx-base-2024-v1",stateSchemaVersion:1,ui:"pixies"},
 {id:"jaipur",name:"Jaipur",aliases:["jaipur","ชัยปุระ","ไจปูร์","จัยปูร์","ตลาด"],cover:"/art/covers/jaipur.webp",coverAlt:"ตลาดชัยปุระ สินค้าเครื่องประดับ ผ้าและอูฐ",minPlayers:2,maxPlayers:2,supportedCounts:[2],durationMinutes:30,category:"ค้าขายและแลกสินค้า",difficulty:null,metadataSource:"https://www.spacecowboys-games.com/game/jaipur/",status:"ready",rulesVersion:"space-cowboys-2019-v1",stateSchemaVersion:1,ui:"jaipur"},
  {id:"seven-wonders-duel",name:"7 Wonders Duel",aliases:["7 wonders duel","seven wonders","ดูเอล","เจ็ดสิ่งมหัศจรรย์"],cover:"/art/covers/seven-wonders-duel.webp",coverAlt:"สองนครโบราณเหนืออ่าวยามอาทิตย์ตก",minPlayers:2,maxPlayers:2,supportedCounts:[2],durationMinutes:30,category:"สร้างอารยธรรมสำหรับสองคน",difficulty:null,metadataSource:"https://www.rprod.com/en/games/7-wonders-duel",status:"ready",rulesVersion:"base-2015-v1",stateSchemaVersion:1,ui:"seven-wonders-duel"},
  {
    id: "calico", name: "Calico", aliases: ["calico", "คาลิโก", "คาลิโก้", "คาลิโค", "แมว", "ผ้าห่ม"],
    cover: "/art/covers/calico.webp", coverAlt: "แมวนอนบนผ้าควิลต์สีสด",
    minPlayers: 1, maxPlayers: 4, supportedCounts: [1,2,3,4], durationMinutes: 45,
    category: "ต่อผ้าห่มและสะสมแมว", difficulty: null,
    metadataSource: "https://www.alderac.com/calico", status: "ready",
    rulesVersion: "base-2020-one-to-four-v2", stateSchemaVersion: 2, ui: "calico",
  },
  {
    id: "azul", name: "Azul", aliases: ["azul", "อาซูล", "อาซุล", "กระเบื้อง"],
    cover: "/art/covers/azul.webp", coverAlt: "Azul ภาคหลัก • กระดานผนังสีมาตรฐาน",
    minPlayers: 2, maxPlayers: 4, durationMinutes: 45,
    category: "เลือกและจัดกระเบื้อง", difficulty: null,
    metadataSource: "https://www.nextmove-games.com/en/azul/azul-game/",
    status: "ready", rulesVersion: "base-colored-wall-2018-v1", stateSchemaVersion: 1, ui: "azul",
  },
  {
    id: "camel-up",
    name: "Camel Up",
    aliases: ["camel up", "camelup", "คาเมลอัพ", "อูฐ"],
    cover: "/art/covers/camel-up.webp",
    coverAlt: "อูฐแข่งรอบพีระมิด",
    minPlayers: 3,
    maxPlayers: 8,
    durationMinutes: 30,
    category: "เดิมพันการแข่งขัน",
    difficulty: null,
    metadataSource: "https://store.asmodee.com/products/camel-up",
    status: "ready",
    rulesVersion: "second-edition-2018-2024-v1",
    stateSchemaVersion: 1,
    ui: "camel-up",
  },
  {
    id: "dracula-vs-van-helsing",
    name: "Dracula vs Van Helsing",
    aliases: ["dracula", "van helsing", "แดร็กคูล่า", "แวน เฮลซิง"],
    cover: "/art/covers/dracula.webp",
    coverAlt: "Dracula และนักล่าในเมืองยามค่ำคืน",
    minPlayers: 2,
    maxPlayers: 2,
    durationMinutes: 30,
    category: "วางแผนสำหรับสองคน",
    difficulty: null,
    metadataSource: "https://www.asmodee.it/product/dracula-vs-van-helsing/",
    supportedCounts: [2],
    status: "ready",
    rulesVersion: "mandoo-2023-v1",
    stateSchemaVersion: 1,
    ui: "dracula-vs-van-helsing",
  },
 {id:"name-it",playMode:"local",name:"Name It! — มหึหมา",aliases:["name it","name it!","มหึหมา","หมา","จำชื่อ"],cover:"/art/name-it/c00.webp",coverAlt:"น้องหมาขี้เล่นในสวนสีสดใส",minPlayers:2,maxPlayers:6,supportedCounts:[2,3,4,5,6],durationMinutes:15,category:"ปาร์ตี้และความจำ เล่นบนเครื่องเดียว",difficulty:null,metadataSource:"user-provided-rules",status:"beta",rulesVersion:"user-request-web-69-v1",stateSchemaVersion:1,ui:"name-it"},
];
export const metadata = (id: string) => GAME_CATALOG.find((g) => g.id === id);
export const supportsPlayers = (g: GameMetadata, n: number) =>
  g.supportedCounts
    ? g.supportedCounts.includes(n)
    : n >= g.minPlayers && n <= g.maxPlayers;
export const normalizeSearch = (s: string) =>
  s.normalize("NFKC").trim().toLocaleLowerCase("th").replace(/\s+/g, " ");
export const filterGames = (
  games: readonly GameMetadata[],
  q: string,
  n?: number,
) =>
  games.filter(
    (g) =>
      (!n || supportsPlayers(g, n)) &&
      [g.name, ...g.aliases].some((s) =>
        normalizeSearch(s).includes(normalizeSearch(q)),
      ),
  );
