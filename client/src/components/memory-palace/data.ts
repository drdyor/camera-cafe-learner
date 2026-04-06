import type { SpatialLevel } from "./SpatialViewer";

// ===== KITCHEN MEMORY PALACE - 7 Explorable Levels =====
export const kitchenLevels: SpatialLevel[] = [
  {
    id: "kitchen-main",
    name: "The Kitchen",
    nameIt: "La Cucina",
    description: "A warm Italian kitchen with terracotta tiles and morning sunlight",
    image: "/palace/kitchen/main.jpg",
    zones: [
      { 
        id: "fridge-zone", 
        name: "The Fridge", 
        nameIt: "Il Frigorifero", 
        x: 75, y: 45, width: 15, height: 25, 
        icon: "❄️", 
        targetLevelId: "kitchen-fridge",
        description: "Cold storage with fresh ingredients"
      },
      { 
        id: "cabinet-zone", 
        name: "Upper Cabinets", 
        nameIt: "Gli Armadietti", 
        x: 40, y: 25, width: 40, height: 20, 
        icon: "🗄️", 
        targetLevelId: "kitchen-cabinets",
        description: "Plates, cups, and cookware"
      },
      { 
        id: "drawer-zone", 
        name: "Drawers", 
        nameIt: "I Cassetti", 
        x: 40, y: 65, width: 25, height: 12, 
        icon: "🗂️", 
        targetLevelId: "kitchen-drawers",
        description: "Utensils and kitchen tools"
      },
      { 
        id: "stove-zone", 
        name: "Stove", 
        nameIt: "La Cucina", 
        x: 60, y: 55, width: 15, height: 15, 
        icon: "🔥", 
        targetLevelId: "kitchen-cooking",
        description: "Where Nonna cooks"
      },
      { 
        id: "sink-zone", 
        name: "Sink", 
        nameIt: "Il Lavello", 
        x: 30, y: 50, width: 12, height: 12, 
        icon: "🚰", 
        targetLevelId: "kitchen-sink",
        description: "Washing and cleaning"
      },
      { 
        id: "pantry-zone", 
        name: "Pantry", 
        nameIt: "La Dispensa", 
        x: 88, y: 35, width: 10, height: 35, 
        icon: "🥫", 
        targetLevelId: "kitchen-pantry",
        description: "Dry goods and storage"
      },
    ],
    words: [
      { id: "cucina", word: "la cucina", en: "kitchen", g: "f", emoji: "🍳", x: 50, y: 50, mnemonic: "Cooking happens in the CUCINA" },
      { id: "tavolo", word: "il tavolo", en: "table", g: "m", emoji: "🪑", x: 25, y: 75, mnemonic: "We eat at the TAVOLO" },
      { id: "sedia", word: "la sedia", en: "chair", g: "f", emoji: "🪑", x: 20, y: 80, mnemonic: "Sit on the SEDIA" },
      { id: "finestra", word: "la finestra", en: "window", g: "f", emoji: "🪟", x: 70, y: 30, mnemonic: "Light comes through the FINESTRA" },
      { id: "porta", word: "la porta", en: "door", g: "f", emoji: "🚪", x: 10, y: 50, mnemonic: "Enter through the PORTA" },
      { id: "pavimento", word: "il pavimento", en: "floor", g: "m", emoji: "⬜", x: 50, y: 90, mnemonic: "Stand on the PAVIMENTO" },
    ]
  },
  {
    id: "kitchen-fridge",
    name: "Inside the Fridge",
    nameIt: "Dentro il Frigorifero",
    description: "Cool shelves filled with fresh Italian ingredients",
    image: "/palace/kitchen/fridge.jpg",
    parentId: "kitchen-main",
    zones: [
      { id: "back", name: "Back to Kitchen", nameIt: "Torna", x: 8, y: 8, width: 12, height: 8, icon: "⬅️", targetLevelId: "kitchen-main" },
    ],
    words: [
      { id: "frigo", word: "il frigorifero", en: "refrigerator", g: "m", emoji: "❄️", x: 50, y: 50, mnemonic: "Cold things in the FRIGO" },
      { id: "latte", word: "il latte", en: "milk", g: "m", emoji: "🥛", x: 30, y: 35, mnemonic: "LATTE in the morning" },
      { id: "formaggio", word: "il formaggio", en: "cheese", g: "m", emoji: "🧀", x: 60, y: 35, mnemonic: "FORMAGGIO on pizza" },
      { id: "uova", word: "le uova", en: "eggs", g: "f", emoji: "🥚", x: 40, y: 55, mnemonic: "UOVA for breakfast" },
      { id: "burro", word: "il burro", en: "butter", g: "m", emoji: "🧈", x: 70, y: 55, mnemonic: "BURRO on bread" },
      { id: "pomodoro", word: "il pomodoro", en: "tomato", g: "m", emoji: "🍅", x: 25, y: 70, mnemonic: "POMODORO for sauce" },
      { id: "insalata", word: "l'insalata", en: "lettuce/salad", g: "f", emoji: "🥬", x: 50, y: 75, mnemonic: "Fresh INSALATA" },
      { id: "carne", word: "la carne", en: "meat", g: "f", emoji: "🥩", x: 75, y: 70, mnemonic: "CARNE for dinner" },
    ]
  },
  {
    id: "kitchen-cabinets",
    name: "Inside the Cabinets",
    nameIt: "Dentro gli Armadietti",
    description: "Shelves with plates, cups, and cooking essentials",
    image: "/palace/kitchen/cabinets.jpg",
    parentId: "kitchen-main",
    zones: [
      { id: "back", name: "Back to Kitchen", nameIt: "Torna", x: 8, y: 8, width: 12, height: 8, icon: "⬅️", targetLevelId: "kitchen-main" },
    ],
    words: [
      { id: "piatto", word: "il piatto", en: "plate", g: "m", emoji: "🍽️", x: 25, y: 40, mnemonic: "Eat from a PIATTO" },
      { id: "bicchiere", word: "il bicchiere", en: "glass", g: "m", emoji: "🥛", x: 50, y: 35, mnemonic: "Drink from a BICCHIERE" },
      { id: "tazza", word: "la tazza", en: "cup/mug", g: "f", emoji: "☕", x: 75, y: 40, mnemonic: "Coffee in a TAZZA" },
      { id: "coltello", word: "il coltello", en: "knife", g: "m", emoji: "🔪", x: 20, y: 65, mnemonic: "Cut with a COLTELLO" },
      { id: "forchetta", word: "la forchetta", en: "fork", g: "f", emoji: "🍴", x: 45, y: 60, mnemonic: "Eat with a FORCHETTA" },
      { id: "cucchiaio", word: "il cucchiaio", en: "spoon", g: "m", emoji: "🥄", x: 70, y: 65, mnemonic: "Soup with a CUCCHIAIO" },
      { id: "pentola", word: "la pentola", en: "pot", g: "f", emoji: "🍲", x: 35, y: 80, mnemonic: "Cook in a PENTOLA" },
      { id: "padella", word: "la padella", en: "pan", g: "f", emoji: "🍳", x: 60, y: 80, mnemonic: "Fry in a PADELLA" },
    ]
  },
  {
    id: "kitchen-drawers",
    name: "Inside the Drawers",
    nameIt: "Dentro i Cassetti",
    description: "Utensils, tools, and kitchen gadgets",
    image: "/palace/kitchen/drawers.jpg",
    parentId: "kitchen-main",
    zones: [
      { id: "back", name: "Back to Kitchen", nameIt: "Torna", x: 8, y: 8, width: 12, height: 8, icon: "⬅️", targetLevelId: "kitchen-main" },
    ],
    words: [
      { id: "cassetto", word: "il cassetto", en: "drawer", g: "m", emoji: "🗂️", x: 50, y: 50, mnemonic: "Open the CASSETTO" },
      { id: "cucinare-v", word: "cucinare", en: "to cook", emoji: "👨‍🍳", x: 30, y: 35, mnemonic: "CUCINARE like Nonna" },
      { id: "forno", word: "il forno", en: "oven", g: "m", emoji: "🔥", x: 70, y: 35, mnemonic: "Bake in the FORNO" },
      { id: "apri", word: "aprire", en: "to open", emoji: "📂", x: 25, y: 70, mnemonic: "APRI the drawer" },
      { id: "chiudi", word: "chiudere", en: "to close", emoji: "📁", x: 50, y: 75, mnemonic: "CHIUDI the drawer" },
      { id: "spegni", word: "spegnere", en: "to turn off", emoji: "⭕", x: 75, y: 70, mnemonic: "SPEGNI the light" },
    ]
  },
  {
    id: "kitchen-cooking",
    name: "Cooking Scene",
    nameIt: "Scene di Cucina",
    description: "Nonna is making fresh pasta!",
    image: "/palace/kitchen/cooking.jpg",
    parentId: "kitchen-main",
    zones: [
      { id: "back", name: "Back to Kitchen", nameIt: "Torna", x: 8, y: 8, width: 12, height: 8, icon: "⬅️", targetLevelId: "kitchen-main" },
    ],
    words: [
      { id: "cucinare", word: "cucinare", en: "to cook", emoji: "👨‍🍳", x: 50, y: 50, mnemonic: "CUCINARE with love" },
      { id: "acqua", word: "l'acqua", en: "water", g: "f", emoji: "💧", x: 30, y: 60, mnemonic: "Boil ACQUA for pasta" },
      { id: "olio", word: "l'olio", en: "oil", g: "m", emoji: "🫒", x: 70, y: 55, mnemonic: "Olive OLIO on salad" },
      { id: "sale", word: "il sale", en: "salt", g: "m", emoji: "🧂", x: 40, y: 75, mnemonic: "SALE for flavor" },
      { id: "pepe", word: "il pepe", en: "pepper", g: "m", emoji: "🌶️", x: 60, y: 75, mnemonic: "PEPE for spice" },
      { id: "pane", word: "il pane", en: "bread", g: "m", emoji: "🥖", x: 20, y: 40, mnemonic: "Fresh PANE daily" },
      { id: "pasta", word: "la pasta", en: "pasta", g: "f", emoji: "🍝", x: 80, y: 45, mnemonic: "PASTA every Sunday" },
      { id: "mangiare", word: "mangiare", en: "to eat", emoji: "😋", x: 50, y: 85, mnemonic: "MANGIARE together" },
    ]
  },
  {
    id: "kitchen-sink",
    name: "At the Sink",
    nameIt: "Al Lavello",
    description: "Washing dishes and cleaning up",
    image: "/palace/kitchen/sink.jpg",
    parentId: "kitchen-main",
    zones: [
      { id: "back", name: "Back to Kitchen", nameIt: "Torna", x: 8, y: 8, width: 12, height: 8, icon: "⬅️", targetLevelId: "kitchen-main" },
    ],
    words: [
      { id: "lavello", word: "il lavello", en: "sink", g: "m", emoji: "🚰", x: 50, y: 50, mnemonic: "Wash at the LAVELLO" },
      { id: "acqua-sink", word: "l'acqua", en: "water", g: "f", emoji: "💧", x: 50, y: 35, mnemonic: "ACQUA flows here" },
      { id: "sapone", word: "il sapone", en: "soap", g: "m", emoji: "🧼", x: 30, y: 60, mnemonic: "Wash with SAPONE" },
      { id: "asciugare", word: "asciugare", en: "to dry", emoji: "🧽", x: 70, y: 60, mnemonic: "ASCIUGARE the dishes" },
      { id: "pulire", word: "pulire", en: "to clean", emoji: "✨", x: 50, y: 75, mnemonic: "PULIRE the kitchen" },
    ]
  },
  {
    id: "kitchen-pantry",
    name: "The Pantry",
    nameIt: "La Dispensa",
    description: "Storage for dry goods and ingredients",
    image: "/palace/kitchen/pantry.jpg",
    parentId: "kitchen-main",
    zones: [
      { id: "back", name: "Back to Kitchen", nameIt: "Torna", x: 8, y: 8, width: 12, height: 8, icon: "⬅️", targetLevelId: "kitchen-main" },
    ],
    words: [
      { id: "dispensa", word: "la dispensa", en: "pantry", g: "f", emoji: "🥫", x: 50, y: 50, mnemonic: "Stock the DISPENSA" },
      { id: "riso", word: "il riso", en: "rice", g: "m", emoji: "🍚", x: 25, y: 40, mnemonic: "RISO for risotto" },
      { id: "zucchero", word: "lo zucchero", en: "sugar", g: "m", emoji: "🍬", x: 50, y: 35, mnemonic: "Sweet ZUCCHERO" },
      { id: "farina", word: "la farina", en: "flour", g: "f", emoji: "🌾", x: 75, y: 40, mnemonic: "FARINA for bread" },
      { id: "olio-pantry", word: "l'olio", en: "oil", g: "m", emoji: "🫒", x: 30, y: 70, mnemonic: "Cooking OLIO" },
      { id: "sale-pantry", word: "il sale", en: "salt", g: "m", emoji: "🧂", x: 70, y: 70, mnemonic: "SALE for seasoning" },
    ]
  },
];

// ===== ALL PALACES =====
export const allPalaces = {
  kitchen: kitchenLevels,
  // Add more palaces here: bedroom, living, etc.
};

// Helper to get level by ID
export function getLevelById(id: string): SpatialLevel | undefined {
  for (const palace of Object.values(allPalaces)) {
    const level = palace.find(l => l.id === id);
    if (level) return level;
  }
  return undefined;
}

// Helper to get root level of a palace
export function getPalaceRoot(palaceId: string): SpatialLevel | undefined {
  return allPalaces[palaceId as keyof typeof allPalaces]?.[0];
}
