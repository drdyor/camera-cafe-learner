// Room definitions — each room pulls vocab from the italian-dictionary.json by category
// Zones within rooms sub-filter for drill-down navigation

export interface RoomZone {
  id: string;
  name: string;
  nameIt: string;
  description: string;
  icon: string;
  categories: string[]; // dictionary categories to pull from
  x: number; // position on room image (%)
  y: number;
  width: number;
  height: number;
  interiorImage?: string; // optional close-up image for this zone
  interiorVocab?: { word: string; x: number; y: number }[]; // specific words positioned in interior image
}

export interface Room {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  description: string;
  categories: string[]; // main dictionary categories for this room
  zones: RoomZone[]; // clickable sub-areas
  grammarFocus: string; // what grammar this room teaches
}

export const rooms: Room[] = [
  {
    id: 'entrance-hall',
    name: 'Entrance Hall',
    subtitle: 'Essere & Avere',
    image: '/palace/rooms/entrance-hall.jpg',
    description: 'Step into the grand hall. Meet the people and learn to describe them with essere and avere.',
    categories: ['people'],
    grammarFocus: 'essere & avere (to be & to have)',
    zones: [
      { id: 'family-portrait', name: 'Family Portrait', nameIt: 'Ritratto di Famiglia', description: 'Family members on the wall', icon: '👨‍👩‍👧‍👦', categories: ['people'], x: 30, y: 40, width: 20, height: 25 },
      { id: 'coat-rack', name: 'Coat Rack', nameIt: 'Appendiabiti', description: 'Clothes and accessories', icon: '🧥', categories: ['clothing'], x: 75, y: 45, width: 15, height: 30 },
      { id: 'mirror', name: 'The Mirror', nameIt: 'Lo Specchio', description: 'Body parts and descriptions', icon: '🪞', categories: ['body'], x: 50, y: 35, width: 15, height: 20 },
    ],
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    subtitle: 'Fare & -ARE Verbs',
    image: '/palace/rooms/kitchen.jpg',
    description: 'La cucina del palazzo — where every object tells a story and teaches the verb "fare".',
    categories: ['kitchen'],
    grammarFocus: 'fare & regular -ARE verbs',
    zones: [
      { 
        id: 'fridge', 
        name: 'The Fridge', 
        nameIt: 'Il Frigorifero', 
        description: 'Cold food and drinks', 
        icon: '❄️', 
        categories: ['kitchen'], 
        x: 75, y: 45, width: 15, height: 25,
        interiorImage: '/palace/rooms/kitchen-fridge.jpg',
        interiorVocab: [
          { word: 'latte', x: 20, y: 30 }, { word: 'uova', x: 50, y: 25 },
          { word: 'burro', x: 30, y: 50 }, { word: 'formaggio', x: 70, y: 40 },
          { word: 'acqua', x: 40, y: 70 }, { word: 'frutta', x: 80, y: 60 },
        ]
      },
      { 
        id: 'pantry', 
        name: 'The Pantry', 
        nameIt: 'La Dispensa', 
        description: 'Dry goods and staples', 
        icon: '🥫', 
        categories: ['kitchen'], 
        x: 88, y: 40, width: 10, height: 30,
        interiorImage: '/palace/rooms/kitchen-pantry.jpg',
        interiorVocab: [
          { word: 'pasta', x: 25, y: 35 }, { word: 'riso', x: 55, y: 30 },
          { word: 'olio', x: 35, y: 55 }, { word: 'sale', x: 65, y: 50 },
          { word: 'zucchero', x: 45, y: 75 }, { word: 'pane', x: 75, y: 70 },
        ]
      },
      { 
        id: 'stove', 
        name: 'The Stove', 
        nameIt: 'I Fornelli', 
        description: 'Cooking and preparation', 
        icon: '🔥', 
        categories: ['kitchen'], 
        x: 60, y: 55, width: 15, height: 15,
        interiorImage: '/palace/rooms/kitchen-stove.jpg',
        interiorVocab: [
          { word: 'pentola', x: 30, y: 40 }, { word: 'padella', x: 60, y: 35 },
          { word: 'coltello', x: 25, y: 65 }, { word: 'forchetta', x: 50, y: 60 },
          { word: 'cucchiaio', x: 75, y: 55 },
        ]
      },
      { 
        id: 'table', 
        name: 'The Table', 
        nameIt: 'Il Tavolo', 
        description: 'Dining and eating', 
        icon: '🍽️', 
        categories: ['restaurant'], 
        x: 25, y: 65, width: 20, height: 15,
        interiorImage: '/palace/rooms/kitchen-table.jpg',
        interiorVocab: [
          { word: 'piatto', x: 30, y: 45 }, { word: 'bicchiere', x: 60, y: 40 },
          { word: 'tovagliolo', x: 45, y: 65 }, { word: 'caffè', x: 75, y: 55 },
        ]
      },
    ],
  },
  {
    id: 'library',
    name: 'Library',
    subtitle: 'Regular -ERE & -IRE Verbs',
    image: '/palace/rooms/library.jpg',
    description: 'Master the patterns that unlock hundreds of Italian verbs.',
    categories: ['school'],
    grammarFocus: 'regular -ERE & -IRE verb conjugation',
    zones: [
      { id: 'bookshelf', name: 'The Bookshelf', nameIt: 'Lo Scaffale', description: 'School and study words', icon: '📚', categories: ['school'], x: 40, y: 35, width: 30, height: 30 },
      { id: 'desk', name: 'The Desk', nameIt: 'La Scrivania', description: 'Work and office', icon: '📝', categories: ['work'], x: 65, y: 65, width: 20, height: 15 },
      { id: 'computer', name: 'The Computer', nameIt: 'Il Computer', description: 'Technology words', icon: '💻', categories: ['technology'], x: 80, y: 50, width: 15, height: 15 },
    ],
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    subtitle: 'Family & Descriptions',
    image: '/palace/rooms/bedroom.jpg',
    description: 'Learn family members and master adjective agreement.',
    categories: ['bedroom', 'clothing'],
    grammarFocus: 'possessive adjectives & adjective agreement',
    zones: [
      { id: 'wardrobe', name: 'The Wardrobe', nameIt: "L'Armadio", description: 'Clothes and fashion', icon: '👔', categories: ['clothing'], x: 70, y: 40, width: 15, height: 30 },
      { id: 'bed', name: 'The Bed', nameIt: 'Il Letto', description: 'Rest and daily routine', icon: '🛏️', categories: ['bedroom'], x: 40, y: 55, width: 25, height: 20 },
      { id: 'photos', name: 'Family Photos', nameIt: 'Le Foto', description: 'Family and relationships', icon: '📷', categories: ['people'], x: 25, y: 30, width: 20, height: 15 },
    ],
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    subtitle: 'Daily Routine & Reflexives',
    image: '/palace/rooms/bathroom.jpg',
    description: 'Il bagno — master daily routines and reflexive verbs.',
    categories: ['body', 'health'],
    grammarFocus: 'reflexive verbs (mi lavo, mi pettino) & daily routine',
    zones: [
      { id: 'sink', name: 'The Sink', nameIt: 'Il Lavandino', description: 'Washing and face', icon: '🚰', categories: ['body'], x: 25, y: 45, width: 20, height: 25, interiorImage: '/palace/rooms/bathroom-sink.jpg', interiorVocab: [{ word: 'lavarsi', x: 30, y: 40 }, { word: 'faccia', x: 50, y: 35 }, { word: 'denti', x: 70, y: 45 }, { word: 'sapone', x: 40, y: 65 }] },
      { id: 'shower', name: 'The Shower', nameIt: 'La Doccia', description: 'Bathing and body', icon: '🚿', categories: ['body'], x: 60, y: 35, width: 25, height: 35, interiorImage: '/palace/rooms/bathroom-shower.jpg', interiorVocab: [{ word: 'doccia', x: 40, y: 30 }, { word: 'asciugamano', x: 70, y: 50 }, { word: 'shampoo', x: 30, y: 60 }, { word: 'capelli', x: 55, y: 40 }] },
      { id: 'cabinet', name: 'Medicine Cabinet', nameIt: 'L\'Armadietto', description: 'Health and care', icon: '💊', categories: ['health'], x: 85, y: 30, width: 12, height: 20, interiorImage: '/palace/rooms/bathroom-cabinet.jpg', interiorVocab: [{ word: 'medicina', x: 35, y: 35 }, { word: 'crema', x: 65, y: 45 }, { word: 'spazzolino', x: 45, y: 65 }] },
    ],
  },
  {
    id: 'garden',
    name: 'Garden',
    subtitle: 'Andare & Places',
    image: '/palace/rooms/garden.jpg',
    description: 'Il giardino del palazzo — learn the verb "andare" as you walk through the garden.',
    categories: ['outdoors'],
    grammarFocus: 'andare & preposizioni articolate',
    zones: [
      { id: 'flowers', name: 'The Flowers', nameIt: 'I Fiori', description: 'Nature and plants', icon: '🌸', categories: ['outdoors'], x: 65, y: 60, width: 20, height: 20 },
      { id: 'path', name: 'The Path', nameIt: 'Il Vialetto', description: 'Places and directions', icon: '🛤️', categories: ['buildings'], x: 30, y: 75, width: 25, height: 15 },
      { id: 'sky', name: 'The Sky', nameIt: 'Il Cielo', description: 'Weather and seasons', icon: '☀️', categories: ['weather'], x: 50, y: 15, width: 30, height: 15 },
    ],
  },
  {
    id: 'study',
    name: 'Study',
    subtitle: 'Questions & Negation',
    image: '/palace/rooms/study.jpg',
    description: 'Master asking questions and expressing negatives.',
    categories: ['school', 'work'],
    grammarFocus: 'question formation & negation (non...mai/niente/nessuno)',
    zones: [
      { id: 'desk-study', name: 'The Desk', nameIt: 'La Scrivania', description: 'Study materials', icon: '📖', categories: ['school'], x: 50, y: 55, width: 20, height: 15 },
      { id: 'clock', name: 'The Clock', nameIt: "L'Orologio", description: 'Time and dates', icon: '🕐', categories: ['time'], x: 75, y: 30, width: 15, height: 15 },
    ],
  },
  {
    id: 'living-room',
    name: 'Living Room',
    subtitle: 'Modal Verbs',
    image: '/palace/rooms/living-room.jpg',
    description: 'Express ability, desire, and obligation with modal verbs.',
    categories: ['home', 'freetime'],
    grammarFocus: 'modal verbs: potere, volere, dovere',
    zones: [
      { id: 'sofa', name: 'The Sofa', nameIt: 'Il Divano', description: 'Relaxation and free time', icon: '🛋️', categories: ['freetime'], x: 40, y: 60, width: 25, height: 20 },
      { id: 'tv', name: 'The TV', nameIt: 'La TV', description: 'Entertainment and media', icon: '📺', categories: ['technology', 'freetime'], x: 70, y: 45, width: 15, height: 15 },
      { id: 'furniture', name: 'Furniture', nameIt: 'I Mobili', description: 'Home items', icon: '🏠', categories: ['home'], x: 20, y: 45, width: 15, height: 20 },
    ],
  },
  {
    id: 'supermarket',
    name: 'Supermarket',
    subtitle: 'Shopping & Numbers',
    image: '/palace/rooms/supermarket.jpg',
    description: 'Il supermercato — learn to shop, count, and pay.',
    categories: ['shop', 'kitchen'],
    grammarFocus: 'numbers, prices & shopping expressions',
    zones: [
      { id: 'produce', name: 'Fresh Produce', nameIt: 'Frutta e Verdura', description: 'Fruits and vegetables', icon: '🍎', categories: ['kitchen'], x: 20, y: 50, width: 25, height: 30, interiorImage: '/palace/rooms/supermarket-produce.jpg', interiorVocab: [{ word: 'mela', x: 25, y: 35 }, { word: 'arancia', x: 50, y: 40 }, { word: 'pomodoro', x: 35, y: 55 }, { word: 'comprare', x: 70, y: 60 }] },
      { id: 'dairy', name: 'Dairy Section', nameIt: 'Latticini', description: 'Milk and cheese', icon: '🧀', categories: ['kitchen'], x: 50, y: 45, width: 20, height: 25, interiorImage: '/palace/rooms/supermarket-dairy.jpg', interiorVocab: [{ word: 'latte', x: 30, y: 40 }, { word: 'formaggio', x: 60, y: 35 }, { word: 'uova', x: 45, y: 60 }] },
      { id: 'checkout', name: 'Checkout', nameIt: 'La Cassa', description: 'Paying and prices', icon: '💰', categories: ['shop'], x: 80, y: 55, width: 18, height: 20, interiorImage: '/palace/rooms/supermarket-checkout.jpg', interiorVocab: [{ word: 'pagare', x: 35, y: 45 }, { word: 'prezzo', x: 65, y: 40 }, { word: 'soldi', x: 50, y: 65 }, { word: 'scontrino', x: 75, y: 55 }] },
    ],
  },
  {
    id: 'cafe',
    name: 'Café',
    subtitle: 'Ordering & Social',
    image: '/palace/rooms/cafe.jpg',
    description: 'Il caffè — master ordering, social interaction, and café culture.',
    categories: ['restaurant', 'people'],
    grammarFocus: 'vorrei, posso, conditional politeness',
    zones: [
      { id: 'counter', name: 'The Counter', nameIt: 'Il Bancone', description: 'Ordering coffee', icon: '☕', categories: ['restaurant'], x: 35, y: 40, width: 30, height: 20, interiorImage: '/palace/rooms/cafe-counter.jpg', interiorVocab: [{ word: 'caffè', x: 30, y: 35 }, { word: 'vorrei', x: 55, y: 30 }, { word: 'cornetto', x: 45, y: 55 }, { word: 'posso', x: 70, y: 45 }] },
      { id: 'table-cafe', name: 'Table', nameIt: 'Il Tavolo', description: 'Sitting and socializing', icon: '🪑', categories: ['restaurant'], x: 70, y: 60, width: 25, height: 20, interiorImage: '/palace/rooms/cafe-table.jpg', interiorVocab: [{ word: 'mangiare', x: 35, y: 40 }, { word: 'bere', x: 60, y: 35 }, { word: 'amico', x: 45, y: 60 }, { word: 'parlare', x: 75, y: 50 }] },
    ],
  },
  {
    id: 'gallery',
    name: 'Gallery',
    subtitle: 'Passato Prossimo',
    image: '/palace/rooms/gallery.jpg',
    description: 'Learn the passato prossimo to talk about completed actions.',
    categories: ['emotions', 'health'],
    grammarFocus: 'passato prossimo: avere/essere + participio passato',
    zones: [
      { id: 'paintings', name: 'The Paintings', nameIt: 'I Quadri', description: 'Emotions and feelings', icon: '🎨', categories: ['emotions'], x: 40, y: 35, width: 25, height: 20 },
      { id: 'pharmacy', name: 'Medicine Cabinet', nameIt: 'Armadietto Medicinale', description: 'Health and body', icon: '💊', categories: ['health'], x: 75, y: 50, width: 15, height: 20 },
      { id: 'shopping', name: 'Gift Shop', nameIt: 'Il Negozio', description: 'Shopping and commerce', icon: '🛍️', categories: ['shop'], x: 20, y: 60, width: 15, height: 15 },
    ],
  },
];

export const getRoomById = (id: string): Room | undefined => {
  return rooms.find((room) => room.id === id);
};

export const getAllRooms = (): Room[] => {
  return rooms;
};

export const getAdjacentRooms = (id: string): Room[] => {
  const adjacencyMap: Record<string, string[]> = {
    'entrance-hall': ['kitchen', 'library', 'living-room'],
    'kitchen': ['entrance-hall', 'garden', 'cafe'],
    'library': ['entrance-hall', 'study'],
    'bedroom': ['library', 'living-room', 'bathroom'],
    'bathroom': ['bedroom'],
    'garden': ['kitchen', 'gallery', 'supermarket'],
    'supermarket': ['garden', 'cafe'],
    'cafe': ['kitchen', 'supermarket'],
    'study': ['library', 'bedroom'],
    'living-room': ['entrance-hall', 'bedroom', 'gallery'],
    'gallery': ['living-room', 'garden'],
  };
  const adjacentIds = adjacencyMap[id] || [];
  return adjacentIds
    .map((adjId) => getRoomById(adjId))
    .filter((r): r is Room => r !== undefined);
};

// Get all rooms up to and including the current room (for cumulative vocabulary)
export const getRoomsUpTo = (id: string): Room[] => {
  const currentIndex = rooms.findIndex((r) => r.id === id);
  if (currentIndex === -1) return [];
  return rooms.slice(0, currentIndex + 1);
};

// Get all categories from rooms up to the current room
export const getCumulativeCategories = (id: string): string[] => {
  const roomsUpTo = getRoomsUpTo(id);
  const allCategories = roomsUpTo.flatMap((r) => [
    ...r.categories,
    ...r.zones.flatMap((z) => z.categories),
  ]);
  return Array.from(new Set(allCategories));
};
