// Transcribed from Repos Production base-game rulebook pp18–20.
export const RESOURCES = ["wood", "clay", "stone", "glass", "papyrus"] as const;
export type Resource = (typeof RESOURCES)[number];
export type Color =
  "brown" | "grey" | "blue" | "green" | "yellow" | "red" | "purple";
export type Science =
  "wheel" | "triangle" | "quill" | "mortar" | "pendulum" | "sundial" | "law";
export interface Effect {
  points?: number;
  coins?: number;
  shields?: number;
  science?: Science;
  produce?: Partial<Record<Resource, number>>;
  flexible?: Resource[];
  discount?: Resource[];
  income?: { kind: Color | "wonder"; rate: number };
  guild?: Color | "materials" | "wonder" | "treasury";
  extra?: boolean;
  decision?: "destroy-brown" | "destroy-grey" | "discard" | "library";
}
export interface Card extends Effect {
  id: string;
  name: string;
  age: 1 | 2 | 3;
  color: Color;
  cost: Partial<Record<Resource, number>>;
  coinCost: number;
  chainFrom?: string;
  chain?: string;
}
const R = (s: string): Partial<Record<Resource, number>> => {
  const r: Partial<Record<Resource, number>> = {};
  for (const c of s) {
    const key = (
      { w: "wood", c: "clay", s: "stone", g: "glass", p: "papyrus" } as const
    )[c as "w"];
    if (!key) throw Error("resource");
    r[key] = (r[key] ?? 0) + 1;
  }
  return r;
};
const cards: Card[] = [];
function c(
  age: 1 | 2 | 3,
  id: string,
  name: string,
  color: Color,
  cost: string,
  coinCost: number,
  e: Effect = {},
  chainFrom?: string,
  chain?: string,
) {
  cards.push({
    id,
    name,
    age,
    color,
    cost: R(cost),
    coinCost,
    ...e,
    ...(chainFrom ? { chainFrom } : {}),
    ...(chain ? { chain } : {}),
  });
}
c(1, "lumber-yard", "ลานไม้", "brown", "", 0, { produce: R("w") });
c(1, "logging-camp", "ค่ายตัดไม้", "brown", "", 1, { produce: R("w") });
c(1, "clay-pool", "บ่อดิน", "brown", "", 0, { produce: R("c") });
c(1, "clay-pit", "หลุมดิน", "brown", "", 1, { produce: R("c") });
c(1, "quarry", "เหมืองหิน", "brown", "", 0, { produce: R("s") });
c(1, "stone-pit", "หลุมหิน", "brown", "", 1, { produce: R("s") });
c(1, "glassworks", "โรงแก้ว", "grey", "", 1, { produce: R("g") });
c(1, "press", "โรงกระดาษ", "grey", "", 1, { produce: R("p") });
c(1, "guard-tower", "หอสังเกตการณ์", "red", "", 0, { shields: 1 });
c(1, "stable", "คอกม้า", "red", "w", 0, { shields: 1 }, undefined, "horseshoe");
c(1, "garrison", "กองทหาร", "red", "c", 0, { shields: 1 }, undefined, "sword");
c(
  1,
  "palisade",
  "รั้วป้องกัน",
  "red",
  "",
  2,
  { shields: 1 },
  undefined,
  "tower",
);
c(1, "workshop", "โรงช่าง", "green", "p", 0, {
  science: "triangle",
  points: 1,
});
c(1, "apothecary", "ร้านยา", "green", "g", 0, { science: "wheel", points: 1 });
c(
  1,
  "scriptorium",
  "ห้องคัดลอก",
  "green",
  "",
  2,
  { science: "quill" },
  undefined,
  "book",
);
c(
  1,
  "pharmacist",
  "เภสัชกร",
  "green",
  "",
  2,
  { science: "mortar" },
  undefined,
  "gear",
);
for (const [id, n, r] of [
  ["stone-reserve", "คลังหิน", "stone"],
  ["clay-reserve", "คลังดิน", "clay"],
  ["wood-reserve", "คลังไม้", "wood"],
] as const)
  c(1, id, n, "yellow", "", 3, { discount: [r] });
c(1, "theater", "โรงละคร", "blue", "", 0, { points: 3 }, undefined, "mask");
c(1, "altar", "แท่นบูชา", "blue", "", 0, { points: 3 }, undefined, "moon");
c(1, "baths", "โรงอาบน้ำ", "blue", "s", 0, { points: 3 }, undefined, "drop");
c(1, "tavern", "โรงเหล้า", "yellow", "", 0, { coins: 4 }, undefined, "amphora");
c(2, "sawmill", "โรงเลื่อย", "brown", "", 2, { produce: R("ww") });
c(2, "brickyard", "โรงอิฐ", "brown", "", 2, { produce: R("cc") });
c(2, "shelf-quarry", "เหมืองขั้นบันได", "brown", "", 2, { produce: R("ss") });
c(2, "glass-blower", "ช่างเป่าแก้ว", "grey", "", 0, { produce: R("g") });
c(2, "drying-room", "ห้องตากกระดาษ", "grey", "", 0, { produce: R("p") });
c(2, "walls", "กำแพง", "red", "ss", 0, { shields: 2 });
c(
  2,
  "horse-breeders",
  "ผู้เพาะม้า",
  "red",
  "cw",
  0,
  { shields: 1 },
  "horseshoe",
);
c(2, "barracks", "ค่ายทหาร", "red", "", 3, { shields: 1 }, "sword");
c(
  2,
  "archery-range",
  "สนามธนู",
  "red",
  "swp",
  0,
  { shields: 2 },
  undefined,
  "target",
);
c(
  2,
  "parade-ground",
  "ลานสวนสนาม",
  "red",
  "ccg",
  0,
  { shields: 2 },
  undefined,
  "helmet",
);
c(
  2,
  "library",
  "ห้องสมุด",
  "green",
  "swg",
  0,
  { science: "quill", points: 2 },
  "book",
);
c(
  2,
  "dispensary",
  "สถานพยาบาล",
  "green",
  "ccs",
  0,
  { science: "mortar", points: 2 },
  "gear",
);
c(
  2,
  "school",
  "โรงเรียน",
  "green",
  "wpp",
  0,
  { science: "wheel", points: 1 },
  undefined,
  "lyre",
);
c(
  2,
  "laboratory",
  "ห้องทดลอง",
  "green",
  "wgg",
  0,
  { science: "triangle", points: 1 },
  undefined,
  "lamp",
);
c(2, "statue", "รูปสลัก", "blue", "cc", 0, { points: 4 }, "mask", "column");
c(2, "temple", "วิหาร", "blue", "wp", 0, { points: 4 }, "moon", "sun");
c(2, "aqueduct", "สะพานส่งน้ำ", "blue", "sss", 0, { points: 5 }, "drop");
c(
  2,
  "rostrum",
  "แท่นปราศรัย",
  "blue",
  "sw",
  0,
  { points: 4 },
  undefined,
  "pillar",
);
c(2, "forum", "ลานชุมนุม", "yellow", "c", 3, {
  flexible: ["glass", "papyrus"],
});
c(2, "caravansery", "ที่พักคาราวาน", "yellow", "gp", 2, {
  flexible: ["wood", "clay", "stone"],
});
c(2, "customs-house", "ด่านศุลกากร", "yellow", "", 4, {
  discount: ["glass", "papyrus"],
});
c(
  2,
  "brewery",
  "โรงเบียร์",
  "yellow",
  "",
  0,
  { coins: 6 },
  undefined,
  "barrel",
);
c(2, "courthouse", "ศาล", "blue", "wwg", 0, { points: 5 });
c(3, "arsenal", "คลังแสง", "red", "cccww", 0, { shields: 3 });
c(3, "pretorium", "กองบัญชาการ", "red", "", 8, { shields: 3 });
c(3, "fortifications", "ป้อมปราการ", "red", "sscp", 0, { shields: 2 }, "tower");
c(
  3,
  "siege-workshop",
  "โรงเครื่องล้อม",
  "red",
  "wwwg",
  0,
  { shields: 2 },
  "target",
);
c(3, "circus", "สนามแข่งรถศึก", "red", "ccss", 0, { shields: 2 }, "helmet");
c(3, "academy", "สถาบัน", "green", "swgg", 0, {
  science: "sundial",
  points: 3,
});
c(3, "study", "ห้องค้นคว้า", "green", "wwgp", 0, {
  science: "sundial",
  points: 3,
});
c(
  3,
  "university",
  "มหาวิทยาลัย",
  "green",
  "cgp",
  0,
  { science: "pendulum", points: 2 },
  "lyre",
);
c(
  3,
  "observatory",
  "หอดูดาว",
  "green",
  "spp",
  0,
  { science: "pendulum", points: 2 },
  "lamp",
);
c(3, "palace", "พระราชวัง", "blue", "cswgg", 0, { points: 7 });
c(3, "town-hall", "ศาลากลาง", "blue", "sssww", 0, { points: 7 });
c(3, "obelisk", "เสาโอเบลิสก์", "blue", "ssg", 0, { points: 5 });
c(3, "gardens", "สวน", "blue", "ccww", 0, { points: 6 }, "column");
c(3, "pantheon", "มหาวิหาร", "blue", "cwpp", 0, { points: 6 }, "sun");
c(3, "senate", "วุฒิสภา", "blue", "ccsp", 0, { points: 5 }, "pillar");
c(3, "chamber-of-commerce", "หอการค้า", "yellow", "pp", 0, {
  points: 3,
  income: { kind: "grey", rate: 3 },
});
c(3, "port", "ท่าเรือ", "yellow", "wgp", 0, {
  points: 3,
  income: { kind: "brown", rate: 2 },
});
c(3, "armory", "โรงอาวุธ", "yellow", "ssg", 0, {
  points: 3,
  income: { kind: "red", rate: 1 },
});
c(
  3,
  "lighthouse",
  "ประภาคาร",
  "yellow",
  "ccg",
  0,
  { points: 3, income: { kind: "yellow", rate: 1 } },
  "amphora",
);
c(
  3,
  "arena",
  "อารีนา",
  "yellow",
  "csw",
  0,
  { points: 3, income: { kind: "wonder", rate: 2 } },
  "barrel",
);
for (const [id, n, cost, guild] of [
  ["merchants-guild", "สมาคมพ่อค้า", "cwgp", "yellow"],
  ["shipowners-guild", "สมาคมเจ้าของเรือ", "csgp", "materials"],
  [
    "builders-guild",
    "สมาคมช่างก่อสร้าง",
    "sscw g".replaceAll(" ", ""),
    "wonder",
  ],
  ["magistrates-guild", "สมาคมตุลาการ", "wwcp", "blue"],
  ["scientists-guild", "สมาคมนักวิทยาศาสตร์", "ccww", "green"],
  ["moneylenders-guild", "สมาคมเจ้าหนี้", "ssww", "treasury"],
  ["tacticians-guild", "สมาคมนักยุทธศาสตร์", "sscp", "red"],
] as const)
  c(3, id, n, "purple", cost, 0, { guild });
export const CARDS: readonly Card[] = cards;
export const CARD = Object.fromEntries(cards.map((c) => [c.id, c])) as Record<
  string,
  Card
>;
export interface Wonder extends Effect {
  id: string;
  name: string;
  cost: Partial<Record<Resource, number>>;
}
// Costs verified against Asmodee USA SEV07-prodimages-image5_2000.jpg (all 12).
export const WONDERS: Wonder[] = [
  {
    id: "piraeus",
    name: "ท่าเรือพีเรียส",
    cost: R("csww"),
    flexible: ["glass", "papyrus"],
    extra: true,
    points: 2,
  },
  {
    id: "circus-maximus",
    name: "เซอร์คัส แม็กซิมัส",
    cost: R("gwss"),
    decision: "destroy-grey",
    shields: 1,
    points: 3,
  },
  {
    id: "great-lighthouse",
    name: "ประภาคารใหญ่",
    cost: R("ppsw"),
    flexible: ["wood", "clay", "stone"],
    points: 4,
  },
  {
    id: "temple-of-artemis",
    name: "วิหารอาร์เทมิส",
    cost: R("pgsw"),
    coins: 12,
    extra: true,
  },
  {
    id: "appian-way",
    name: "ถนนแอปเปียน",
    cost: R("pccss"),
    coins: 3,
    extra: true,
    points: 3,
  },
  {
    id: "colossus",
    name: "มหารูปแห่งโรดส์",
    cost: R("gccc"),
    shields: 2,
    points: 3,
  },
  {
    id: "great-library",
    name: "หอสมุดใหญ่",
    cost: R("pgwww"),
    decision: "library",
    points: 4,
  },
  {
    id: "hanging-gardens",
    name: "สวนลอย",
    cost: R("pgww"),
    coins: 6,
    extra: true,
    points: 3,
  },
  {
    id: "statue-of-zeus",
    name: "เทวรูปซุส",
    cost: R("ppcws"),
    decision: "destroy-brown",
    shields: 1,
    points: 3,
  },
  {
    id: "mausoleum",
    name: "สุสานฮาลิคาร์นัสซัส",
    cost: R("pggcc"),
    decision: "discard",
    points: 2,
  },
  { id: "pyramids", name: "พีระมิด", cost: R("psss"), points: 9 },
  { id: "sphinx", name: "สฟิงซ์", cost: R("ggcs"), extra: true, points: 6 },
];
export const TOKENS = [
  "agriculture",
  "architecture",
  "economy",
  "law",
  "masonry",
  "mathematics",
  "philosophy",
  "strategy",
  "theology",
  "urbanism",
] as const;
export type Token = (typeof TOKENS)[number];
export const TOKEN_NAMES: Record<Token, string> = {
  agriculture: "เกษตรกรรม",
  architecture: "สถาปัตยกรรม",
  economy: "เศรษฐกิจ",
  law: "กฎหมาย",
  masonry: "ช่างก่ออิฐ",
  mathematics: "คณิตศาสตร์",
  philosophy: "ปรัชญา",
  strategy: "ยุทธศาสตร์",
  theology: "เทววิทยา",
  urbanism: "ผังเมือง",
};
export interface Slot {
  id: number;
  x: number;
  y: number;
  faceUp: boolean;
  coveredBy: number[];
}
function layout(rows: number[][]): Slot[] {
  let id = 0;
  const slots = rows.flatMap((xs, y) =>
    xs.map((x) => ({
      id: id++,
      x,
      y,
      faceUp: y % 2 === 0,
      coveredBy: [] as number[],
    })),
  );
  for (const s of slots)
    s.coveredBy = slots
      .filter((t) => t.y === s.y + 1 && Math.abs(t.x - s.x) < 1)
      .map((t) => t.id);
  return slots;
}
export const LAYOUTS: Record<1 | 2 | 3, Slot[]> = {
  1: layout([
    [-0.5, 0.5],
    [-1, 0, 1],
    [-1.5, -0.5, 0.5, 1.5],
    [-2, -1, 0, 1, 2],
    [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5],
  ]),
  2: layout([
    [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5],
    [-2, -1, 0, 1, 2],
    [-1.5, -0.5, 0.5, 1.5],
    [-1, 0, 1],
    [-0.5, 0.5],
  ]),
  3: layout([
    [-0.5, 0.5],
    [-1, 0, 1],
    [-1.5, -0.5, 0.5, 1.5],
    [-1, 1],
    [-1.5, -0.5, 0.5, 1.5],
    [-1, 0, 1],
    [-0.5, 0.5],
  ]),
};
