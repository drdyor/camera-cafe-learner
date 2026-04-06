import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, ArrowLeft, Coffee, Eye, EyeOff, Volume2, Grid3X3, Map, Search, X,
  UtensilsCrossed, Home, BookOpen, TreePine, Building2, Users, Heart, Shirt, 
  Sparkles, Brain, Briefcase, Clock, Cloud, Bus, Gamepad2, Utensils, Wifi, HeartPulse
} from "lucide-react";

interface RoomConfig {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  gradient: string;
  bgImage: string;
  icon: React.ReactNode;
}

const ROOMS: RoomConfig[] = [
  {
    id: "kitchen",
    name: "La Cucina",
    nameEn: "The Kitchen",
    description: "Food & cooking",
    gradient: "from-orange-400 to-amber-600",
    bgImage: "/rooms/kitchen.jpg",
    icon: <UtensilsCrossed size={18} />,
  },
  {
    id: "bedroom",
    name: "La Camera",
    nameEn: "The Bedroom",
    description: "Sleep & rest",
    gradient: "from-indigo-400 to-purple-600",
    bgImage: "/rooms/bedroom.jpg",
    icon: <Home size={18} />,
  },
  {
    id: "school",
    name: "La Scuola",
    nameEn: "The School",
    description: "Learning & knowledge",
    gradient: "from-sky-400 to-blue-600",
    bgImage: "/rooms/school.jpg",
    icon: <BookOpen size={18} />,
  },
  {
    id: "outdoors",
    name: "La Natura",
    nameEn: "The Outdoors",
    description: "Nature & elements",
    gradient: "from-green-400 to-emerald-600",
    bgImage: "/rooms/outdoors.jpg",
    icon: <TreePine size={18} />,
  },
  {
    id: "buildings",
    name: "La Città",
    nameEn: "The City",
    description: "Places & structures",
    gradient: "from-stone-400 to-gray-600",
    bgImage: "/rooms/city.jpg",
    icon: <Building2 size={18} />,
  },
  {
    id: "people",
    name: "Le Persone",
    nameEn: "The People",
    description: "Family & relationships",
    gradient: "from-rose-400 to-pink-600",
    bgImage: "/rooms/people.jpg",
    icon: <Users size={18} />,
  },
  {
    id: "body",
    name: "Il Corpo",
    nameEn: "The Body",
    description: "Body parts",
    gradient: "from-pink-400 to-rose-500",
    bgImage: "/rooms/body.jpg",
    icon: <Heart size={18} />,
  },
  {
    id: "clothing",
    name: "I Vestiti",
    nameEn: "The Clothing",
    description: "Clothes & wear",
    gradient: "from-fuchsia-400 to-purple-600",
    bgImage: "/rooms/clothing.jpg",
    icon: <Shirt size={18} />,
  },
  {
    id: "materials",
    name: "I Materiali",
    nameEn: "The Materials",
    description: "Raw materials",
    gradient: "from-amber-400 to-orange-600",
    bgImage: "/rooms/materials.jpg",
    icon: <Sparkles size={18} />,
  },
  {
    id: "fantasy",
    name: "La Fantasia",
    nameEn: "The Fantasy",
    description: "Magic & imagination",
    gradient: "from-purple-400 to-indigo-700",
    bgImage: "/rooms/fantasy.jpg",
    icon: <Sparkles size={18} />,
  },
  {
    id: "emotions",
    name: "Le Emozioni",
    nameEn: "The Emotions",
    description: "Feelings & moods",
    gradient: "from-yellow-300 to-orange-500",
    bgImage: "/rooms/emotions.jpg",
    icon: <Brain size={18} />,
  },
  {
    id: "home",
    name: "La Casa",
    nameEn: "The Home",
    description: "Household items",
    gradient: "from-teal-400 to-cyan-600",
    bgImage: "/rooms/home.jpg",
    icon: <Home size={18} />,
  },
  {
    id: "shop",
    name: "Il Negozio",
    nameEn: "The Shop",
    description: "Commerce & trade",
    gradient: "from-cyan-400 to-blue-600",
    bgImage: "/rooms/shop.jpg",
    icon: <Building2 size={18} />,
  },
  // NEW ROOMS for GCSE themes
  {
    id: "freetime",
    name: "Il Tempo Libero",
    nameEn: "Free Time",
    description: "Hobbies & entertainment",
    gradient: "from-violet-400 to-purple-600",
    bgImage: "/rooms/freetime.jpg",
    icon: <Gamepad2 size={18} />,
  },
  {
    id: "health",
    name: "La Salute",
    nameEn: "Health",
    description: "Health & wellbeing",
    gradient: "from-red-400 to-rose-600",
    bgImage: "/rooms/health.jpg",
    icon: <HeartPulse size={18} />,
  },
  {
    id: "restaurant",
    name: "Il Ristorante",
    nameEn: "The Restaurant",
    description: "Dining out",
    gradient: "from-amber-500 to-orange-700",
    bgImage: "/rooms/restaurant.jpg",
    icon: <Utensils size={18} />,
  },
  {
    id: "technology",
    name: "La Tecnologia",
    nameEn: "Technology",
    description: "Tech & devices",
    gradient: "from-blue-500 to-indigo-600",
    bgImage: "/rooms/technology.jpg",
    icon: <Wifi size={18} />,
  },
  {
    id: "time",
    name: "Il Tempo",
    nameEn: "Time",
    description: "Time & dates",
    gradient: "from-amber-400 to-yellow-600",
    bgImage: "/rooms/time.jpg",
    icon: <Clock size={18} />,
  },
  {
    id: "transport",
    name: "I Trasporti",
    nameEn: "Transport",
    description: "Travel & vehicles",
    gradient: "from-green-500 to-teal-600",
    bgImage: "/rooms/transport.jpg",
    icon: <Bus size={18} />,
  },
  {
    id: "weather",
    name: "Il Meteo",
    nameEn: "Weather",
    description: "Weather & seasons",
    gradient: "from-sky-400 to-cyan-500",
    bgImage: "/rooms/weather.jpg",
    icon: <Cloud size={18} />,
  },
  {
    id: "work",
    name: "Il Lavoro",
    nameEn: "Work",
    description: "Jobs & careers",
    gradient: "from-slate-500 to-gray-600",
    bgImage: "/rooms/work.jpg",
    icon: <Briefcase size={18} />,
  },
];

// Spatial positions for words in each room (percentage-based)
const DEFAULT_POSITIONS: Record<string, Record<string, { x: number; y: number }>> = {
  kitchen: {
    acqua: { x: 70, y: 60 },
    pane: { x: 30, y: 45 },
    cibo: { x: 50, y: 40 },
    zuppa: { x: 60, y: 55 },
    pesce: { x: 75, y: 50 },
    bastoncini: { x: 25, y: 65 },
  },
  bedroom: {
    letto: { x: 50, y: 60 },
  },
  school: {
    libro: { x: 30, y: 55 },
    carta: { x: 60, y: 50 },
    lettera: { x: 45, y: 65 },
    pittura: { x: 70, y: 45 },
    studio: { x: 25, y: 40 },
    scienza: { x: 80, y: 35 },
    telescopio: { x: 55, y: 30 },
    maestro: { x: 40, y: 50 },
  },
  outdoors: {
    sole: { x: 80, y: 15 },
    cielo: { x: 50, y: 10 },
    terra: { x: 50, y: 80 },
    mare: { x: 20, y: 70 },
    montagna: { x: 85, y: 40 },
    fiume: { x: 30, y: 75 },
    foresta: { x: 15, y: 35 },
    fiore: { x: 70, y: 65 },
  },
  body: {
    testa: { x: 50, y: 20 },
    occhio: { x: 45, y: 30 },
    occhi: { x: 55, y: 30 },
    bocca: { x: 50, y: 40 },
    mano: { x: 30, y: 60 },
    mani: { x: 70, y: 60 },
    piede: { x: 40, y: 85 },
    cuore: { x: 50, y: 50 },
    corpo: { x: 50, y: 55 },
  },
  people: {
    uomo: { x: 30, y: 50 },
    donna: { x: 70, y: 50 },
    bambino: { x: 25, y: 65 },
    bambina: { x: 75, y: 65 },
    ragazzo: { x: 35, y: 55 },
    ragazza: { x: 65, y: 55 },
    padre: { x: 40, y: 40 },
    madre: { x: 60, y: 40 },
    famiglia: { x: 50, y: 50 },
  },
};

function speak(text: string) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "it-IT";
  u.rate = 0.85;
  speechSynthesis.speak(u);
}

export default function VisualDictionary() {
  const [, setLocation] = useLocation();
  const dictQuery = trpc.dictionary.lookup.useQuery();
  const [activeRoom, setActiveRoom] = useState<string>("kitchen");
  const [viewMode, setViewMode] = useState<"scene" | "grid">("grid");
  const [showTranslation, setShowTranslation] = useState(true);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const currentRoom = useMemo(() => 
    ROOMS.find(r => r.id === activeRoom) || ROOMS[0]
  , [activeRoom]);

  const roomWords = useMemo(() => {
    if (!dictQuery.data) return [];
    const words = Object.entries(dictQuery.data)
      .filter(([_, entry]) => entry.cat === activeRoom)
      .map(([word, entry]) => ({
        word,
        ...entry,
        position: DEFAULT_POSITIONS[activeRoom]?.[word] || {
          x: 15 + (word.charCodeAt(0) % 70),
          y: 25 + (word.length * 5) % 60,
        },
        image: `/items/${word}.jpg`,
      }))
      .sort((a, b) => a.word.localeCompare(b.word));
    return words;
  }, [dictQuery.data, activeRoom]);

  const filteredWords = useMemo(() => {
    if (!searchQuery) return roomWords;
    return roomWords.filter(w => 
      w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.en.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [roomWords, searchQuery]);

  const stats = useMemo(() => {
    if (!dictQuery.data) return { total: 0, categorized: 0, withEmoji: 0 };
    const entries = Object.values(dictQuery.data);
    return {
      total: entries.length,
      categorized: entries.filter(e => e.cat).length,
      withEmoji: entries.filter(e => e.emoji).length,
    };
  }, [dictQuery.data]);

  const selectedWordData = selectedWord ? roomWords.find(w => w.word === selectedWord) : null;

  const handleImageError = (path: string) => {
    setImageErrors(prev => new Set([...prev, path]));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Home
          </Button>
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-700" />
            <span className="font-semibold hidden sm:inline">Camera Cafe Learner</span>
          </div>
          
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search 624 words..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-sm bg-gray-100 rounded-full border-0 focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setViewMode(viewMode === "scene" ? "grid" : "scene")}
              className="hidden sm:flex"
            >
              {viewMode === "scene" ? <Grid3X3 className="w-4 h-4 mr-1" /> : <Map className="w-4 h-4 mr-1" />}
              {viewMode === "scene" ? "Grid" : "Scene"}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowTranslation(!showTranslation)}
              title={showTranslation ? "Hide English" : "Show English"}
            >
              {showTranslation ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </nav>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-60px)]">
        {/* Room Sidebar */}
        <aside className="lg:w-72 bg-white border-r border-gray-200 flex-shrink-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <div className="mb-4 p-3 bg-amber-50 rounded-lg">
                <p className="text-xs text-amber-700 font-medium">
                  {stats.total} total words • {stats.categorized} visual
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  GCSE Themes + Kelly Frequency
                </p>
              </div>
              
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                21 Rooms
              </h2>
              <div className="space-y-1">
                {ROOMS.map((room) => {
                  const wordCount = dictQuery.data 
                    ? Object.values(dictQuery.data).filter(e => e.cat === room.id).length
                    : 0;
                  return (
                    <button
                      key={room.id}
                      onClick={() => {
                        setActiveRoom(room.id);
                        setSelectedWord(null);
                      }}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                        activeRoom === room.id
                          ? "bg-amber-100 ring-2 ring-amber-500 shadow-sm"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${room.gradient} flex items-center justify-center text-white flex-shrink-0`}>
                        {room.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm truncate ${activeRoom === room.id ? "text-amber-900" : "text-gray-900"}`}>
                          {room.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{wordCount} words</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden bg-gray-100">
          {dictQuery.isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : viewMode === "scene" ? (
            /* Scene View - Room with positioned words */
            <div className="h-full flex flex-col">
              {/* Room Header */}
              <div className={`bg-gradient-to-r ${currentRoom.gradient} px-6 py-4 text-white flex-shrink-0`}>
                <h1 className="text-2xl font-bold">{currentRoom.name}</h1>
                <p className="text-white/80">{currentRoom.nameEn} • {filteredWords.length} words</p>
              </div>

              {/* Room Scene */}
              <div className="flex-1 relative overflow-auto">
                {/* Background Image */}
                <div className="absolute inset-0 min-h-[600px]">
                  {!imageErrors.has(currentRoom.bgImage) ? (
                    <img
                      src={currentRoom.bgImage}
                      alt={currentRoom.nameEn}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(currentRoom.bgImage)}
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${currentRoom.gradient} opacity-30`} />
                  )}
                  <div className="absolute inset-0 bg-black/20" />
                </div>

                {/* Positioned Word Hotspots */}
                {filteredWords.map((item) => (
                  <button
                    key={item.word}
                    onClick={() => {
                      setSelectedWord(item.word);
                      speak(item.word);
                    }}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                    style={{ left: `${item.position.x}%`, top: `${item.position.y}%` }}
                  >
                    {/* Hotspot Circle */}
                    <div className="relative">
                      <div className="w-4 h-4 bg-white rounded-full shadow-lg animate-pulse" />
                      <div className="absolute inset-0 w-4 h-4 bg-white rounded-full animate-ping opacity-50" />
                    </div>
                    
                    {/* Word Label */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-6 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      <div className="bg-white/95 backdrop-blur rounded-lg px-3 py-2 shadow-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{item.emoji || "📝"}</span>
                          <div>
                            <p className="font-bold text-gray-900">{item.word}</p>
                            {showTranslation && (
                              <p className="text-xs text-gray-500">{item.en}</p>
                            )}
                          </div>
                          {item.g && (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              item.g === "f" ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"
                            }`}>
                              {item.g}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}

                {/* Empty State */}
                {filteredWords.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-white/80 text-lg">
                      {searchQuery ? "No words match your search" : "No words in this room yet"}
                    </p>
                  </div>
                )}

                {/* Instructions */}
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg px-4 py-2 text-sm text-gray-600">
                  Click the pulsing dots to explore words
                </div>
              </div>
            </div>
          ) : (
            /* Grid View - Traditional card layout */
            <div className="h-full flex flex-col">
              {/* Room Header */}
              <div className={`bg-gradient-to-r ${currentRoom.gradient} px-6 py-4 text-white flex-shrink-0`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">{currentRoom.icon}</div>
                  <div>
                    <h1 className="text-2xl font-bold">{currentRoom.name}</h1>
                    <p className="text-white/80">{currentRoom.nameEn} • {filteredWords.length} words</p>
                  </div>
                </div>
              </div>

              {/* Word Grid */}
              <ScrollArea className="flex-1">
                <div className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filteredWords.map((item) => (
                      <Card
                        key={item.word}
                        className="overflow-hidden cursor-pointer hover:shadow-lg transition group"
                        onClick={() => {
                          setSelectedWord(item.word);
                          speak(item.word);
                        }}
                      >
                        {/* Item Image */}
                        <div className="aspect-square bg-gray-100 relative overflow-hidden">
                          {item.image && !imageErrors.has(item.image) ? (
                            <img
                              src={item.image}
                              alt={item.word}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={() => handleImageError(item.image!)}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-gray-100 to-gray-200">
                              {item.emoji || "📝"}
                            </div>
                          )}
                          {item.g && (
                            <div className="absolute top-2 right-2">
                              <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                                item.g === "f" 
                                  ? "bg-pink-500 text-white" 
                                  : "bg-blue-500 text-white"
                              }`}>
                                {item.g}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Word Info */}
                        <div className="p-3">
                          <p className="font-bold text-gray-900 text-center">{item.word}</p>
                          {showTranslation && (
                            <p className="text-sm text-gray-500 text-center mt-0.5">{item.en}</p>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>

                  {filteredWords.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      {searchQuery ? "No words match your search" : "No words in this room yet"}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </main>
      </div>

      {/* Word Detail Dialog */}
      <Dialog open={!!selectedWord} onOpenChange={() => setSelectedWord(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="text-3xl">{selectedWordData?.emoji || "📝"}</span>
              <span>{selectedWordData?.word}</span>
              {selectedWordData?.g && (
                <span className={`text-sm px-2 py-1 rounded-full ${
                  selectedWordData.g === "f" ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {selectedWordData.g === "f" ? "feminine" : "masculine"}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedWordData && (
            <div className="space-y-4">
              {/* Large Image */}
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                {selectedWordData.image && !imageErrors.has(selectedWordData.image) ? (
                  <img
                    src={selectedWordData.image}
                    alt={selectedWordData.word}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(selectedWordData.image!)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-8xl bg-gradient-to-br from-gray-100 to-gray-200">
                    {selectedWordData.emoji || "📝"}
                  </div>
                )}
              </div>

              {/* Translations */}
              <div className="space-y-2">
                <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">English</p>
                <p className="text-xl text-gray-900">{selectedWordData.en}</p>
              </div>

              {/* Category */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Category:</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium">
                  {currentRoom.name}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={() => speak(selectedWordData.word)}
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                >
                  <Volume2 className="w-4 h-4 mr-2" />
                  Listen
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedWord(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
