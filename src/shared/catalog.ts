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
