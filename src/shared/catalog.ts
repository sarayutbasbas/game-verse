import type { GameId } from "./types.js";
export type GameStatus = "ready" | "beta" | "maintenance" | "coming-soon";
export interface GameMetadata {
  id: GameId;
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
