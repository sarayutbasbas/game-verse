// Card facts verified against Bombyx base rulebook and publisher-authorized BGA catalog.
export const COLORS = ["blue","green","yellow","red"] as const;
export type Color = typeof COLORS[number];
export interface Card {id:string;number:number;colors:Color[];spirals:number;crosses:number;perColor:Color|null}
export const SLOTS = [1,2,3,4,5,6,7,8,9] as const;
export const CARDS:readonly Card[] = [
  {
    "id": "all-01",
    "number": 2,
    "colors": [
      "blue",
      "green",
      "yellow",
      "red"
    ],
    "spirals": 0,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "all-02",
    "number": 3,
    "colors": [
      "blue",
      "green",
      "yellow",
      "red"
    ],
    "spirals": 0,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "all-03",
    "number": 4,
    "colors": [
      "blue",
      "green",
      "yellow",
      "red"
    ],
    "spirals": 0,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "all-04",
    "number": 6,
    "colors": [
      "blue",
      "green",
      "yellow",
      "red"
    ],
    "spirals": 0,
    "crosses": 1,
    "perColor": null
  },
  {
    "id": "all-05",
    "number": 7,
    "colors": [
      "blue",
      "green",
      "yellow",
      "red"
    ],
    "spirals": 0,
    "crosses": 1,
    "perColor": null
  },
  {
    "id": "all-06",
    "number": 8,
    "colors": [
      "blue",
      "green",
      "yellow",
      "red"
    ],
    "spirals": 0,
    "crosses": 1,
    "perColor": null
  },
  {
    "id": "blue-01",
    "number": 1,
    "colors": [
      "blue"
    ],
    "spirals": 6,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "blue-02",
    "number": 2,
    "colors": [
      "blue"
    ],
    "spirals": 4,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "blue-03",
    "number": 3,
    "colors": [
      "blue"
    ],
    "spirals": 3,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "blue-04",
    "number": 3,
    "colors": [
      "blue"
    ],
    "spirals": 1,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "blue-05",
    "number": 4,
    "colors": [
      "blue"
    ],
    "spirals": 1,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "blue-06",
    "number": 4,
    "colors": [
      "blue"
    ],
    "spirals": 0,
    "crosses": 0,
    "perColor": "blue"
  },
  {
    "id": "blue-07",
    "number": 4,
    "colors": [
      "blue"
    ],
    "spirals": 0,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "blue-08",
    "number": 5,
    "colors": [
      "blue"
    ],
    "spirals": 0,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "blue-09",
    "number": 5,
    "colors": [
      "blue"
    ],
    "spirals": 0,
    "crosses": 2,
    "perColor": null
  },
  {
    "id": "blue-10",
    "number": 5,
    "colors": [
      "blue"
    ],
    "spirals": 0,
    "crosses": 0,
    "perColor": "blue"
  },
  {
    "id": "blue-11",
    "number": 6,
    "colors": [
      "blue"
    ],
    "spirals": 1,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "blue-12",
    "number": 6,
    "colors": [
      "blue"
    ],
    "spirals": 0,
    "crosses": 1,
    "perColor": null
  },
  {
    "id": "blue-13",
    "number": 7,
    "colors": [
      "blue"
    ],
    "spirals": 0,
    "crosses": 3,
    "perColor": null
  },
  {
    "id": "blue-14",
    "number": 8,
    "colors": [
      "blue"
    ],
    "spirals": 0,
    "crosses": 3,
    "perColor": null
  },
  {
    "id": "blue-15",
    "number": 9,
    "colors": [
      "blue"
    ],
    "spirals": 0,
    "crosses": 6,
    "perColor": null
  },
  {
    "id": "blue-16",
    "number": 9,
    "colors": [
      "blue"
    ],
    "spirals": 0,
    "crosses": 1,
    "perColor": null
  },
  {
    "id": "green-01",
    "number": 1,
    "colors": [
      "green"
    ],
    "spirals": 5,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "green-02",
    "number": 2,
    "colors": [
      "green"
    ],
    "spirals": 3,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "green-03",
    "number": 3,
    "colors": [
      "green"
    ],
    "spirals": 2,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "green-04",
    "number": 3,
    "colors": [
      "green"
    ],
    "spirals": 0,
    "crosses": 0,
    "perColor": "green"
  },
  {
    "id": "green-05",
    "number": 4,
    "colors": [
      "green"
    ],
    "spirals": 4,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "green-06",
    "number": 4,
    "colors": [
      "green"
    ],
    "spirals": 0,
    "crosses": 1,
    "perColor": null
  },
  {
    "id": "green-07",
    "number": 5,
    "colors": [
      "green"
    ],
    "spirals": 0,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "green-08",
    "number": 5,
    "colors": [
      "green"
    ],
    "spirals": 0,
    "crosses": 1,
    "perColor": null
  },
  {
    "id": "green-09",
    "number": 5,
    "colors": [
      "green"
    ],
    "spirals": 0,
    "crosses": 0,
    "perColor": "green"
  },
  {
    "id": "green-10",
    "number": 6,
    "colors": [
      "green"
    ],
    "spirals": 0,
    "crosses": 4,
    "perColor": null
  },
  {
    "id": "green-11",
    "number": 6,
    "colors": [
      "green"
    ],
    "spirals": 0,
    "crosses": 1,
    "perColor": null
  },
  {
    "id": "green-12",
    "number": 6,
    "colors": [
      "green"
    ],
    "spirals": 1,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "green-13",
    "number": 7,
    "colors": [
      "green"
    ],
    "spirals": 0,
    "crosses": 2,
    "perColor": null
  },
  {
    "id": "green-14",
    "number": 7,
    "colors": [
      "green"
    ],
    "spirals": 0,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "green-15",
    "number": 8,
    "colors": [
      "green"
    ],
    "spirals": 0,
    "crosses": 2,
    "perColor": null
  },
  {
    "id": "green-16",
    "number": 9,
    "colors": [
      "green"
    ],
    "spirals": 0,
    "crosses": 4,
    "perColor": null
  },
  {
    "id": "yellow-01",
    "number": 1,
    "colors": [
      "yellow"
    ],
    "spirals": 4,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "yellow-02",
    "number": 2,
    "colors": [
      "yellow"
    ],
    "spirals": 2,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "yellow-03",
    "number": 2,
    "colors": [
      "yellow"
    ],
    "spirals": 0,
    "crosses": 0,
    "perColor": "yellow"
  },
  {
    "id": "yellow-04",
    "number": 3,
    "colors": [
      "yellow"
    ],
    "spirals": 5,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "yellow-05",
    "number": 3,
    "colors": [
      "yellow"
    ],
    "spirals": 0,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "yellow-06",
    "number": 4,
    "colors": [
      "yellow"
    ],
    "spirals": 3,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "yellow-07",
    "number": 4,
    "colors": [
      "yellow"
    ],
    "spirals": 0,
    "crosses": 1,
    "perColor": null
  },
  {
    "id": "yellow-08",
    "number": 5,
    "colors": [
      "yellow"
    ],
    "spirals": 0,
    "crosses": 2,
    "perColor": null
  },
  {
    "id": "yellow-09",
    "number": 5,
    "colors": [
      "yellow"
    ],
    "spirals": 0,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "yellow-10",
    "number": 5,
    "colors": [
      "yellow"
    ],
    "spirals": 0,
    "crosses": 0,
    "perColor": "yellow"
  },
  {
    "id": "yellow-11",
    "number": 6,
    "colors": [
      "yellow"
    ],
    "spirals": 0,
    "crosses": 3,
    "perColor": null
  },
  {
    "id": "yellow-12",
    "number": 6,
    "colors": [
      "yellow"
    ],
    "spirals": 0,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "yellow-13",
    "number": 7,
    "colors": [
      "yellow"
    ],
    "spirals": 0,
    "crosses": 5,
    "perColor": null
  },
  {
    "id": "yellow-14",
    "number": 7,
    "colors": [
      "yellow"
    ],
    "spirals": 1,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "yellow-15",
    "number": 8,
    "colors": [
      "yellow"
    ],
    "spirals": 0,
    "crosses": 1,
    "perColor": null
  },
  {
    "id": "yellow-16",
    "number": 9,
    "colors": [
      "yellow"
    ],
    "spirals": 0,
    "crosses": 2,
    "perColor": null
  },
  {
    "id": "red-01",
    "number": 1,
    "colors": [
      "red"
    ],
    "spirals": 3,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "red-02",
    "number": 1,
    "colors": [
      "red"
    ],
    "spirals": 0,
    "crosses": 0,
    "perColor": "red"
  },
  {
    "id": "red-03",
    "number": 2,
    "colors": [
      "red"
    ],
    "spirals": 5,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "red-04",
    "number": 3,
    "colors": [
      "red"
    ],
    "spirals": 4,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "red-05",
    "number": 4,
    "colors": [
      "red"
    ],
    "spirals": 2,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "red-06",
    "number": 4,
    "colors": [
      "red"
    ],
    "spirals": 0,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "red-07",
    "number": 5,
    "colors": [
      "red"
    ],
    "spirals": 0,
    "crosses": 1,
    "perColor": null
  },
  {
    "id": "red-08",
    "number": 5,
    "colors": [
      "red"
    ],
    "spirals": 0,
    "crosses": 0,
    "perColor": "red"
  },
  {
    "id": "red-09",
    "number": 5,
    "colors": [
      "red"
    ],
    "spirals": 0,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "red-10",
    "number": 6,
    "colors": [
      "red"
    ],
    "spirals": 0,
    "crosses": 2,
    "perColor": null
  },
  {
    "id": "red-11",
    "number": 6,
    "colors": [
      "red"
    ],
    "spirals": 0,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "red-12",
    "number": 7,
    "colors": [
      "red"
    ],
    "spirals": 0,
    "crosses": 4,
    "perColor": null
  },
  {
    "id": "red-13",
    "number": 7,
    "colors": [
      "red"
    ],
    "spirals": 0,
    "crosses": 1,
    "perColor": null
  },
  {
    "id": "red-14",
    "number": 8,
    "colors": [
      "red"
    ],
    "spirals": 0,
    "crosses": 5,
    "perColor": null
  },
  {
    "id": "red-15",
    "number": 8,
    "colors": [
      "red"
    ],
    "spirals": 0,
    "crosses": 0,
    "perColor": null
  },
  {
    "id": "red-16",
    "number": 9,
    "colors": [
      "red"
    ],
    "spirals": 0,
    "crosses": 0,
    "perColor": null
  }
];
export const CARD = Object.fromEntries(CARDS.map(c=>[c.id,c])) as Record<string,Card>;
export const COLOR_NAME:Record<Color,string>={blue:"ฟ้า",green:"เขียว",yellow:"เหลือง",red:"แดง"};
