// Land/terrain/setup/edge-mark facts; sources and visual verification in docs/games/spirit-island/rules.md.
export const BOARDS = {
 "A": {
  "lands": [
   {
    "n": 0,
    "terrain": "ocean",
    "neighbors": [
     1,
     2,
     3
    ],
    "dahan": 0,
    "town": 0,
    "city": 0,
    "blight": 0
   },
   {
    "n": 1,
    "terrain": "mountain",
    "neighbors": [
     0,
     2,
     4,
     5,
     6
    ],
    "dahan": 0,
    "town": 0,
    "city": 0,
    "blight": 0
   },
   {
    "n": 2,
    "terrain": "wetland",
    "neighbors": [
     0,
     1,
     3,
     4
    ],
    "dahan": 1,
    "town": 0,
    "city": 1,
    "blight": 0
   },
   {
    "n": 3,
    "terrain": "jungle",
    "neighbors": [
     0,
     2,
     4
    ],
    "dahan": 2,
    "town": 0,
    "city": 0,
    "blight": 0
   },
   {
    "n": 4,
    "terrain": "sands",
    "neighbors": [
     1,
     2,
     3,
     5
    ],
    "dahan": 0,
    "town": 0,
    "city": 0,
    "blight": 1
   },
   {
    "n": 5,
    "terrain": "wetland",
    "neighbors": [
     1,
     4,
     6,
     7,
     8
    ],
    "dahan": 0,
    "town": 0,
    "city": 0,
    "blight": 0
   },
   {
    "n": 6,
    "terrain": "mountain",
    "neighbors": [
     1,
     5,
     8
    ],
    "dahan": 1,
    "town": 0,
    "city": 0,
    "blight": 0
   },
   {
    "n": 7,
    "terrain": "sands",
    "neighbors": [
     5,
     8
    ],
    "dahan": 2,
    "town": 0,
    "city": 0,
    "blight": 0
   },
   {
    "n": 8,
    "terrain": "jungle",
    "neighbors": [
     5,
     6,
     7
    ],
    "dahan": 0,
    "town": 1,
    "city": 0,
    "blight": 0
   }
  ],
  "edges": [
   {
    "side": 0,
    "start": 0,
    "end": 2,
    "land": 1
   },
   {
    "side": 0,
    "start": 2,
    "end": 4,
    "land": 6
   },
   {
    "side": 0,
    "start": 4,
    "end": 7,
    "land": 8
   },
   {
    "side": 1,
    "start": 0,
    "end": 3,
    "land": 8
   },
   {
    "side": 1,
    "start": 3,
    "end": 7,
    "land": 7
   },
   {
    "side": 2,
    "start": 0,
    "end": 1,
    "land": 7
   },
   {
    "side": 2,
    "start": 1,
    "end": 2,
    "land": 5
   },
   {
    "side": 2,
    "start": 2,
    "end": 4,
    "land": 4
   },
   {
    "side": 2,
    "start": 4,
    "end": 7,
    "land": 3
   }
  ]
 },
 "B": {
  "lands": [
   {
    "n": 0,
    "terrain": "ocean",
    "neighbors": [
     1,
     2,
     3
    ],
    "dahan": 0,
    "town": 0,
    "city": 0,
    "blight": 0
   },
   {
    "n": 1,
    "terrain": "wetland",
    "neighbors": [
     0,
     2,
     4,
     5,
     6
    ],
    "dahan": 1,
    "town": 0,
    "city": 0,
    "blight": 0
   },
   {
    "n": 2,
    "terrain": "mountain",
    "neighbors": [
     0,
     1,
     3,
     4
    ],
    "dahan": 0,
    "town": 0,
    "city": 1,
    "blight": 0
   },
   {
    "n": 3,
    "terrain": "sands",
    "neighbors": [
     0,
     2,
     4
    ],
    "dahan": 2,
    "town": 0,
    "city": 0,
    "blight": 0
   },
   {
    "n": 4,
    "terrain": "jungle",
    "neighbors": [
     1,
     2,
     3,
     5,
     7
    ],
    "dahan": 0,
    "town": 0,
    "city": 0,
    "blight": 1
   },
   {
    "n": 5,
    "terrain": "sands",
    "neighbors": [
     1,
     4,
     6,
     7
    ],
    "dahan": 0,
    "town": 0,
    "city": 0,
    "blight": 0
   },
   {
    "n": 6,
    "terrain": "wetland",
    "neighbors": [
     1,
     5,
     7,
     8
    ],
    "dahan": 0,
    "town": 1,
    "city": 0,
    "blight": 0
   },
   {
    "n": 7,
    "terrain": "mountain",
    "neighbors": [
     4,
     5,
     6,
     8
    ],
    "dahan": 1,
    "town": 0,
    "city": 0,
    "blight": 0
   },
   {
    "n": 8,
    "terrain": "jungle",
    "neighbors": [
     6,
     7
    ],
    "dahan": 2,
    "town": 0,
    "city": 0,
    "blight": 0
   }
  ],
  "edges": [
   {
    "side": 0,
    "start": 0,
    "end": 1,
    "land": 1
   },
   {
    "side": 0,
    "start": 1,
    "end": 4,
    "land": 6
   },
   {
    "side": 0,
    "start": 4,
    "end": 7,
    "land": 8
   },
   {
    "side": 1,
    "start": 0,
    "end": 3,
    "land": 8
   },
   {
    "side": 1,
    "start": 3,
    "end": 7,
    "land": 7
   },
   {
    "side": 2,
    "start": 0,
    "end": 1,
    "land": 7
   },
   {
    "side": 2,
    "start": 1,
    "end": 3,
    "land": 4
   },
   {
    "side": 2,
    "start": 3,
    "end": 7,
    "land": 3
   }
  ]
 },
 "C": {
  "lands": [
   {
    "n": 0,
    "terrain": "ocean",
    "neighbors": [
     1,
     2,
     3
    ],
    "dahan": 0,
    "town": 0,
    "city": 0,
    "blight": 0
   },
   {
    "n": 1,
    "terrain": "jungle",
    "neighbors": [
     0,
     2,
     5,
     6
    ],
    "dahan": 1,
    "town": 0,
    "city": 0,
    "blight": 0
   },
   {
    "n": 2,
    "terrain": "sands",
    "neighbors": [
     0,
     1,
     3,
     4,
     5
    ],
    "dahan": 0,
    "town": 0,
    "city": 1,
    "blight": 0
   },
   {
    "n": 3,
    "terrain": "mountain",
    "neighbors": [
     0,
     2,
     4
    ],
    "dahan": 2,
    "town": 0,
    "city": 0,
    "blight": 0
   },
   {
    "n": 4,
    "terrain": "jungle",
    "neighbors": [
     2,
     3,
     5,
     7
    ],
    "dahan": 0,
    "town": 0,
    "city": 0,
    "blight": 0
   },
   {
    "n": 5,
    "terrain": "wetland",
    "neighbors": [
     1,
     2,
     4,
     6,
     7
    ],
    "dahan": 2,
    "town": 0,
    "city": 0,
    "blight": 1
   },
   {
    "n": 6,
    "terrain": "sands",
    "neighbors": [
     1,
     5,
     7,
     8
    ],
    "dahan": 1,
    "town": 0,
    "city": 0,
    "blight": 0
   },
   {
    "n": 7,
    "terrain": "mountain",
    "neighbors": [
     4,
     5,
     6,
     8
    ],
    "dahan": 0,
    "town": 1,
    "city": 0,
    "blight": 0
   },
   {
    "n": 8,
    "terrain": "wetland",
    "neighbors": [
     6,
     7
    ],
    "dahan": 0,
    "town": 0,
    "city": 0,
    "blight": 0
   }
  ],
  "edges": [
   {
    "side": 0,
    "start": 0,
    "end": 2,
    "land": 1
   },
   {
    "side": 0,
    "start": 2,
    "end": 4,
    "land": 6
   },
   {
    "side": 0,
    "start": 4,
    "end": 7,
    "land": 8
   },
   {
    "side": 1,
    "start": 0,
    "end": 4,
    "land": 8
   },
   {
    "side": 1,
    "start": 4,
    "end": 6,
    "land": 7
   },
   {
    "side": 1,
    "start": 6,
    "end": 7,
    "land": 4
   },
   {
    "side": 2,
    "start": 0,
    "end": 4,
    "land": 4
   },
   {
    "side": 2,
    "start": 4,
    "end": 7,
    "land": 3
   }
  ]
 },
 "D": {
  "lands": [
   {
    "n": 0,
    "terrain": "ocean",
    "neighbors": [
     1,
     2,
     3
    ],
    "dahan": 0,
    "town": 0,
    "city": 0,
    "blight": 0
   },
   {
    "n": 1,
    "terrain": "wetland",
    "neighbors": [
     0,
     2,
     5,
     7,
     8
    ],
    "dahan": 2,
    "town": 0,
    "city": 0,
    "blight": 0
   },
   {
    "n": 2,
    "terrain": "jungle",
    "neighbors": [
     0,
     1,
     3,
     4,
     5
    ],
    "dahan": 1,
    "town": 0,
    "city": 1,
    "blight": 0
   },
   {
    "n": 3,
    "terrain": "wetland",
    "neighbors": [
     0,
     2,
     4
    ],
    "dahan": 0,
    "town": 0,
    "city": 0,
    "blight": 0
   },
   {
    "n": 4,
    "terrain": "sands",
    "neighbors": [
     2,
     3,
     5,
     6
    ],
    "dahan": 0,
    "town": 0,
    "city": 0,
    "blight": 0
   },
   {
    "n": 5,
    "terrain": "mountain",
    "neighbors": [
     1,
     2,
     4,
     6,
     7
    ],
    "dahan": 1,
    "town": 0,
    "city": 0,
    "blight": 1
   },
   {
    "n": 6,
    "terrain": "jungle",
    "neighbors": [
     4,
     5,
     7
    ],
    "dahan": 0,
    "town": 0,
    "city": 0,
    "blight": 0
   },
   {
    "n": 7,
    "terrain": "sands",
    "neighbors": [
     1,
     5,
     6,
     8
    ],
    "dahan": 2,
    "town": 1,
    "city": 0,
    "blight": 0
   },
   {
    "n": 8,
    "terrain": "mountain",
    "neighbors": [
     1,
     7
    ],
    "dahan": 0,
    "town": 0,
    "city": 0,
    "blight": 0
   }
  ],
  "edges": [
   {
    "side": 0,
    "start": 0,
    "end": 6,
    "land": 1
   },
   {
    "side": 0,
    "start": 6,
    "end": 7,
    "land": 8
   },
   {
    "side": 1,
    "start": 0,
    "end": 3,
    "land": 8
   },
   {
    "side": 1,
    "start": 3,
    "end": 6,
    "land": 7
   },
   {
    "side": 1,
    "start": 6,
    "end": 7,
    "land": 6
   },
   {
    "side": 2,
    "start": 0,
    "end": 2,
    "land": 6
   },
   {
    "side": 2,
    "start": 2,
    "end": 5,
    "land": 4
   },
   {
    "side": 2,
    "start": 5,
    "end": 7,
    "land": 3
   }
  ]
 }
} as const;
