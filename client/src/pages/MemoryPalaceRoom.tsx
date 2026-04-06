import { useState, useMemo, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { ArrowLeft, ArrowRight, Volume2, Map, BookOpen, Gamepad2, GraduationCap, Lightbulb, ChevronDown, ChevronUp, Bookmark, BookmarkCheck, Sparkles } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { getRoomById, getAllRooms } from '@/components/memory-palace/data/rooms';
import type { RoomZone } from '@/components/memory-palace/data/rooms';
import { getGrammarForRoom, GrammarLesson } from '@/components/memory-palace/data/grammar';

interface DictEntry {
  en: string;
  g?: string;
  emoji?: string;
  cat?: string;
}

interface VocabDotData {
  id: string;
  word: string;
  english: string;
  gender: 'masculine' | 'feminine' | 'none';
  emoji?: string;
  x: number;
  y: number;
  depth: number; // 1 = basic, 2 = intermediate, 3 = advanced
  isReview?: boolean;
  attempts: number;
  correct: number;
}

// Deterministic hash to scatter dots across the room image
function hashPosition(word: string, index: number, total: number): { x: number; y: number } {
  let hash = 0;
  for (let i = 0; i < word.length; i++) {
    hash = ((hash << 5) - hash + word.charCodeAt(i)) | 0;
  }
  const cols = Math.ceil(Math.sqrt(total));
  const row = Math.floor(index / cols);
  const col = index % cols;
  const jitterX = ((hash & 0xff) / 255) * 12 - 6;
  const jitterY = (((hash >> 8) & 0xff) / 255) * 12 - 6;
  const x = 12 + (col / Math.max(cols - 1, 1)) * 76 + jitterX;
  const y = 18 + (row / Math.max(Math.ceil(total / cols) - 1, 1)) * 60 + jitterY;
  return { x: Math.max(8, Math.min(92, x)), y: Math.max(12, Math.min(85, y)) };
}

function mapGender(g?: string): 'masculine' | 'feminine' | 'none' {
  if (g === 'm') return 'masculine';
  if (g === 'f') return 'feminine';
  return 'none';
}

const getGenderColor = (gender: string) => {
  switch (gender) {
    case 'masculine': return '#3B82F6';
    case 'feminine': return '#EC4899';
    default: return '#E7A04D';
  }
};

const getGenderLabel = (gender: string) => {
  switch (gender) {
    case 'masculine': return 'il';
    case 'feminine': return 'la';
    default: return '';
  }
};

function speakWord(text: string) {
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'it-IT';
    u.rate = 0.8;
    window.speechSynthesis.speak(u);
  }
}

// Storage helpers
const getStorageKey = (roomId: string, type: 'reviews' | 'progress' | 'depth') => `palace-${roomId}-${type}`;

// Assign depth levels deterministically based on word characteristics
function calculateDepth(word: string, entry: DictEntry): number {
  // Common/basic words get depth 1
  const basicWords = ['casa', 'acqua', 'pane', 'vino', 'caffe', 'mela', 'pizza', 'gatto', 'cane', 'sole'];
  if (basicWords.includes(word) || word.length <= 4) return 1;
  
  // Intermediate - longer words or less common
  if (word.length <= 7 || entry.cat === 'kitchen' || entry.cat === 'home') return 2;
  
  // Advanced - complex words
  return 3;
}

function VocabDot({ 
  word, 
  isSelected,
  onClick,
}: { 
  word: VocabDotData; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const color = getGenderColor(word.gender);
  const showPulse = word.isReview || (word.attempts > 0 && word.correct / word.attempts < 0.7);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2 group"
      style={{ left: `${word.x}%`, top: `${word.y}%` }}
    >
      {/* Review/difficulty pulse ring */}
      {showPulse && !isSelected && (
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-30"
          style={{ 
            backgroundColor: word.isReview ? '#E7A04D' : '#EF4444', 
            width: 32, 
            height: 32, 
            margin: -6,
            animationDuration: word.isReview ? '2s' : '3s'
          }}
        />
      )}
      
      {/* Selection ring */}
      {isSelected && (
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{ 
            backgroundColor: '#E7A04D', 
            width: 36, 
            height: 36, 
            margin: -8,
            opacity: 0.4
          }}
        />
      )}
      
      {/* Glow */}
      <div
        className="absolute inset-0 rounded-full blur-md opacity-60"
        style={{ 
          backgroundColor: color, 
          width: 28, 
          height: 28, 
          margin: -4,
          opacity: hovered || isSelected ? 0.9 : 0.6
        }}
      />
      
      {/* Dot */}
      <div
        className={`relative w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shadow-lg border-2 transition-all duration-200 ${
          isSelected ? 'border-[#E7A04D] scale-125' : word.isReview ? 'border-[#E7A04D]' : 'border-white/30'
        }`}
        style={{ 
          backgroundColor: color,
          transform: hovered || isSelected ? 'scale(1.2)' : 'scale(1)'
        }}
      >
        {word.emoji || (word.gender === 'masculine' ? '♂' : word.gender === 'feminine' ? '♀' : '—')}
      </div>

      {/* Tooltip on hover (only when not selected) */}
      {hovered && !isSelected && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 whitespace-nowrap z-30 pointer-events-none">
          <div className="bg-[#2B1E1A]/95 backdrop-blur px-3 py-2 rounded-lg border shadow-xl" style={{ borderColor: `${color}50` }}>
            <p className="font-cinzel text-[#F3E8D7] text-sm font-bold">{word.word}</p>
            {word.isReview && (
              <span className="text-[10px] text-[#E7A04D]">★ Review</span>
            )}
          </div>
        </div>
      )}
    </button>
  );
}

// Side panel that appears next to the word
function WordSidePanel({ 
  word, 
  onClose, 
  isReview, 
  onToggleReview,
  position
}: { 
  word: VocabDotData; 
  onClose: () => void;
  isReview: boolean;
  onToggleReview: () => void;
  position: { x: number; y: number };
}) {
  const color = getGenderColor(word.gender);
  
  // Determine panel position (left or right of dot based on x position)
  const isRightSide = position.x < 50;
  const panelStyle: React.CSSProperties = isRightSide 
    ? { left: `${position.x + 5}%`, top: `${Math.max(10, Math.min(70, position.y - 10))}%` }
    : { right: `${100 - position.x + 5}%`, top: `${Math.max(10, Math.min(70, position.y - 10))}%` };

  return (
    <>
      {/* Invisible overlay to catch clicks outside */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Side Panel */}
      <div
        className="fixed z-50 w-64 bg-[#2B1E1A]/95 backdrop-blur-md border-2 rounded-xl p-4 shadow-2xl animate-in fade-in slide-in-from-left-2 duration-200"
        style={{ 
          ...panelStyle,
          borderColor: isReview ? '#E7A04D' : `${color}50`,
          boxShadow: `0 0 30px ${color}20`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 text-[#F3E8D7]/40 hover:text-[#F3E8D7]"
        >
          ×
        </button>

        {/* Word header */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-cinzel text-xl text-[#F3E8D7]">{word.word}</h3>
            {word.gender !== 'none' && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {word.gender === 'feminine' ? 'la' : 'il'}
              </span>
            )}
          </div>
          <p className="text-[#F3E8D7]/60 text-sm">{word.english}</p>
        </div>

        {/* Mastery indicator */}
        {word.attempts > 0 && (
          <div className="mb-3 p-2 bg-[#F3E8D7]/5 rounded-lg">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#F3E8D7]/50">Mastery</span>
              <span className={word.correct / word.attempts >= 0.8 ? 'text-green-400' : 'text-yellow-400'}>
                {Math.round((word.correct / word.attempts) * 100)}%
              </span>
            </div>
            <div className="h-1 bg-[#F3E8D7]/10 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all"
                style={{ 
                  width: `${(word.correct / word.attempts) * 100}%`,
                  backgroundColor: word.correct / word.attempts >= 0.8 ? '#4ADE80' : '#FACC15'
                }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => speakWord(word.word)}
            className="w-full py-2 bg-[#E7A04D] text-[#2B1E1A] font-cinzel text-sm rounded-lg hover:bg-[#F3E8D7] transition-colors flex items-center justify-center gap-2"
          >
            <Volume2 size={16} />
            Listen
          </button>

          <button
            onClick={onToggleReview}
            className={`w-full py-2 rounded-lg text-sm font-cinzel transition-colors flex items-center justify-center gap-2 ${
              isReview 
                ? 'bg-[#E7A04D]/20 text-[#E7A04D] border border-[#E7A04D]/50' 
                : 'bg-[#F3E8D7]/5 text-[#F3E8D7]/70 border border-[#F3E8D7]/20 hover:bg-[#F3E8D7]/10'
            }`}
          >
            {isReview ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            {isReview ? 'Reviewing' : 'Mark for Review'}
          </button>
        </div>

        {/* Depth indicator */}
        <div className="mt-3 pt-3 border-t border-[#F3E8D7]/10 flex items-center gap-1">
          <Sparkles size={12} className="text-[#E7A04D]" />
          <span className="text-[10px] text-[#F3E8D7]/40">
            {word.depth === 1 ? 'Basic' : word.depth === 2 ? 'Intermediate' : 'Advanced'}
          </span>
        </div>
      </div>
    </>
  );
}

function GrammarAccordion({ lessons }: { lessons: GrammarLesson[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {lessons.map((lesson) => {
        const isOpen = openId === lesson.id;
        return (
          <div
            key={lesson.id}
            className="bg-[#F3E8D7]/5 border border-[#F3E8D7]/10 rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setOpenId(isOpen ? null : lesson.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-[#F3E8D7]/5 transition-colors"
            >
              <div>
                <h4 className="font-cinzel text-[#F3E8D7] font-bold">{lesson.title}</h4>
                <p className="text-[#E7A04D] text-sm italic">{lesson.titleIt}</p>
              </div>
              {isOpen ? (
                <ChevronUp className="text-[#E7A04D]" size={20} />
              ) : (
                <ChevronDown className="text-[#F3E8D7]/40" size={20} />
              )}
            </button>
            {isOpen && (
              <div className="px-4 pb-4 border-t border-[#F3E8D7]/10 pt-3">
                <p className="text-[#F3E8D7]/80 text-sm mb-3">{lesson.explanation}</p>
                {lesson.formula && (
                  <div className="bg-[#E7A04D]/10 rounded-lg p-3 mb-3">
                    <p className="text-[#E7A04D] font-mono text-sm">{lesson.formula}</p>
                  </div>
                )}
                <div className="space-y-2">
                  {lesson.examples.map((ex, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className="text-[#E7A04D] font-bold">•</span>
                      <div>
                        <p className="text-[#F3E8D7]">{ex.it}</p>
                        <p className="text-[#F3E8D7]/50 text-xs">{ex.en}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {lesson.tips && (
                  <div className="mt-3 pt-3 border-t border-[#F3E8D7]/10">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="text-[#E7A04D] shrink-0 mt-0.5" size={14} />
                      <p className="text-[#E7A04D]/80 text-xs">{lesson.tips[0]}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ZoneOverlay({
  zone,
  isActive,
  hasInterior,
  onClick,
  onEnter,
}: {
  zone: RoomZone;
  isActive: boolean;
  hasInterior?: boolean;
  onClick: () => void;
  onEnter?: () => void;
}) {
  return (
    <div
      className="absolute border-2 rounded-lg transition-all"
      style={{
        left: `${zone.x}%`,
        top: `${zone.y}%`,
        width: `${zone.width}%`,
        height: `${zone.height}%`,
        borderColor: isActive ? '#E7A04D' : 'transparent',
        backgroundColor: isActive ? 'rgba(231,160,77,0.15)' : 'transparent',
      }}
    >
      <button
        onClick={onClick}
        className="absolute inset-0 w-full h-full"
        style={{ background: 'transparent' }}
      />
      <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="bg-[#2B1E1A]/90 backdrop-blur text-[#F3E8D7] text-xs px-2 py-1 rounded-full border border-[#F3E8D7]/20">
          {zone.icon} {zone.name}
        </span>
      </div>
      {isActive && hasInterior && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEnter?.();
          }}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-[#E7A04D] text-[#2B1E1A] text-xs px-3 py-1 rounded-full font-cinzel hover:bg-[#F3E8D7] transition-colors shadow-lg"
        >
          Enter →
        </button>
      )}
    </div>
  );
}

type TabType = 'explore' | 'learn' | 'practice' | 'test';
type ViewMode = 'room' | 'zone';

export default function MemoryPalaceRoom() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/palace/rooms/:roomId');
  const roomId = params?.roomId;

  const [selectedWord, setSelectedWord] = useState<VocabDotData | null>(null);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [showZones, setShowZones] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('explore');
  const [currentDepth, setCurrentDepth] = useState(3); // Show all words by default
  const [reviewWords, setReviewWords] = useState<string[]>([]);
  const [wordProgress, setWordProgress] = useState<Record<string, { attempts: number; correct: number }>>({});
  const [showOnlyReview, setShowOnlyReview] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('room');
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);

  const room = roomId ? getRoomById(roomId) : undefined;
  const grammar = roomId ? getGrammarForRoom(roomId) : undefined;
  const allRooms = getAllRooms();
  const currentIndex = allRooms.findIndex((r) => r.id === roomId);
  const prevRoom = currentIndex > 0 ? allRooms[currentIndex - 1] : null;
  const nextRoom = currentIndex < allRooms.length - 1 ? allRooms[currentIndex + 1] : null;

  // Load saved data from localStorage
  useEffect(() => {
    if (roomId) {
      const reviews = localStorage.getItem(getStorageKey(roomId, 'reviews'));
      const progress = localStorage.getItem(getStorageKey(roomId, 'progress'));
      const depth = localStorage.getItem(getStorageKey(roomId, 'depth'));
      
      if (reviews) setReviewWords(JSON.parse(reviews));
      if (progress) setWordProgress(JSON.parse(progress));
      // Only load saved depth if it exists, otherwise keep default (3 = all words)
      if (depth) {
        const savedDepth = JSON.parse(depth);
        if (savedDepth >= 1 && savedDepth <= 3) {
          setCurrentDepth(savedDepth);
        }
      }
    }
  }, [roomId]);

  // Save review words
  const toggleReviewWord = (wordId: string) => {
    const newReviews = reviewWords.includes(wordId)
      ? reviewWords.filter(id => id !== wordId)
      : [...reviewWords, wordId];
    setReviewWords(newReviews);
    if (roomId) {
      localStorage.setItem(getStorageKey(roomId, 'reviews'), JSON.stringify(newReviews));
    }
  };

  // Advance depth level
  const advanceDepth = () => {
    const newDepth = Math.min(3, currentDepth + 1);
    setCurrentDepth(newDepth);
    if (roomId) {
      localStorage.setItem(getStorageKey(roomId, 'depth'), JSON.stringify(newDepth));
    }
  };

  // Fetch dictionary
  const dictQuery = trpc.dictionary.lookup.useQuery();
  const dict = dictQuery.data as Record<string, DictEntry> | undefined;

  // Build vocabulary from dictionary (main room view)
  const { vocabulary, stats } = useMemo(() => {
    if (!dict || !room) return { vocabulary: [], stats: { total: 0, byDepth: { 1: 0, 2: 0, 3: 0 } } };

    // If in zone interior view, return empty (use zoneVocabulary instead)
    if (viewMode === 'zone') return { vocabulary: [], stats: { total: 0, byDepth: { 1: 0, 2: 0, 3: 0 } } };

    const categories = activeZone
      ? room.zones.find((z) => z.id === activeZone)?.categories || room.categories
      : Array.from(new Set([...room.categories, ...room.zones.flatMap((z) => z.categories)]));

    const entries: VocabDotData[] = [];
    const byDepth = { 1: 0, 2: 0, 3: 0 };
    
    for (const [word, entry] of Object.entries(dict)) {
      if (entry.cat && categories.includes(entry.cat)) {
        const depth = calculateDepth(word, entry);
        byDepth[depth as keyof typeof byDepth]++;
        
        entries.push({
          id: word,
          word,
          english: entry.en,
          gender: mapGender(entry.g),
          emoji: entry.emoji,
          x: 0,
          y: 0,
          depth,
          isReview: reviewWords.includes(word),
          attempts: wordProgress[word]?.attempts || 0,
          correct: wordProgress[word]?.correct || 0,
        });
      }
    }

    // Filter by depth or review mode
    let filteredEntries = showOnlyReview 
      ? entries.filter(e => reviewWords.includes(e.id))
      : entries.filter(e => e.depth <= currentDepth);

    // Assign positions
    filteredEntries.forEach((item, i) => {
      const pos = hashPosition(item.word, i, filteredEntries.length);
      item.x = pos.x;
      item.y = pos.y;
    });

    return { 
      vocabulary: filteredEntries, 
      stats: { total: entries.length, byDepth } 
    };
  }, [dict, room, activeZone, currentDepth, reviewWords, wordProgress, showOnlyReview, viewMode]);

  // Build zone interior vocabulary (pre-positioned words)
  const zoneVocabulary = useMemo(() => {
    if (!dict || !room || viewMode !== 'zone' || !activeZoneId) return [];
    
    const zone = room.zones.find(z => z.id === activeZoneId);
    if (!zone?.interiorVocab) return [];

    return zone.interiorVocab.map(item => {
      const entry = dict[item.word];
      return {
        id: item.word,
        word: item.word,
        english: entry?.en || '',
        gender: mapGender(entry?.g),
        emoji: entry?.emoji,
        x: item.x,
        y: item.y,
        depth: 1,
        isReview: reviewWords.includes(item.word),
        attempts: wordProgress[item.word]?.attempts || 0,
        correct: wordProgress[item.word]?.correct || 0,
      };
    });
  }, [dict, room, viewMode, activeZoneId, reviewWords, wordProgress]);

  if (!room) {
    return (
      <div className="min-h-screen bg-[#2B1E1A] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-cinzel text-[#F3E8D7] text-3xl mb-4">Room Not Found</h1>
          <button
            onClick={() => setLocation('/palace/rooms')}
            className="px-6 py-3 bg-[#E7A04D] text-[#2B1E1A] font-cinzel rounded-full"
          >
            View All Rooms
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'explore', label: 'Explore', icon: Map },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'practice', label: 'Practice', icon: Gamepad2 },
    { id: 'test', label: 'Test', icon: GraduationCap },
  ] as const;

  return (
    <div className="min-h-screen bg-[#2B1E1A]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#2B1E1A]/95 backdrop-blur-md py-3 px-4 lg:px-8 border-b border-[#F3E8D7]/10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={() => setLocation('/palace/rooms')}
            className="flex items-center gap-2 text-[#F3E8D7]/70 hover:text-[#E7A04D]"
          >
            <ArrowLeft size={18} />
            <span className="text-sm hidden sm:inline">All Rooms</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="text-center px-4">
              <span className="text-[10px] font-cinzel uppercase tracking-[0.2em] text-[#E7A04D] block">
                ROOM 0{currentIndex + 1}
              </span>
              <span className="font-cinzel text-[#F3E8D7] text-sm">{room.name}</span>
            </div>
          </div>
          <div className="w-20" />
        </div>
      </nav>

      {/* Tab Navigation */}
      <div className="fixed top-[57px] left-0 right-0 z-40 bg-[#2B1E1A]/90 backdrop-blur border-b border-[#F3E8D7]/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-cinzel transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'text-[#E7A04D] border-[#E7A04D]'
                      : 'text-[#F3E8D7]/50 border-transparent hover:text-[#F3E8D7]/80'
                  }`}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-[110px]">
        {/* EXPLORE TAB */}
        {activeTab === 'explore' && (
          <div className="relative w-full h-screen" style={{ marginTop: '-110px', paddingTop: '110px' }}>
            {/* Zone Interior View */}
            {viewMode === 'zone' && activeZoneId && (
              <>
                <img
                  src={room.zones.find(z => z.id === activeZoneId)?.interiorImage}
                  alt={room.zones.find(z => z.id === activeZoneId)?.name}
                  className="w-full h-full object-cover"
                  style={{ display: 'block' }}
                />
                {/* Back to Room button */}
                <button
                  onClick={() => {
                    setViewMode('room');
                    setActiveZoneId(null);
                    setSelectedWord(null);
                  }}
                  className="absolute top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-[#2B1E1A]/90 backdrop-blur rounded-full border border-[#F3E8D7]/20 text-[#F3E8D7] hover:text-[#E7A04D] hover:border-[#E7A04D]/50 transition-all"
                >
                  <ArrowLeft size={16} />
                  Back to {room.name}
                </button>
              </>
            )}
            
            {/* Main Room View */}
            {viewMode === 'room' && (
              <img
                src={room.image}
                alt={room.name}
                className="w-full h-full object-cover"
                style={{ display: 'block' }}
              />
            )}
            {/* Bottom gradient */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#2B1E1A] to-transparent pointer-events-none" />

            {/* Zone overlays */}
            {showZones && viewMode === 'room' &&
              room.zones.map((zone) => (
                <ZoneOverlay
                  key={zone.id}
                  zone={zone}
                  isActive={activeZone === zone.id}
                  hasInterior={!!zone.interiorImage}
                  onClick={() => setActiveZone(activeZone === zone.id ? null : zone.id)}
                  onEnter={() => {
                    if (zone.interiorImage) {
                      setActiveZoneId(zone.id);
                      setViewMode('zone');
                      setActiveZone(null);
                    }
                  }}
                />
              ))}

            {/* Vocabulary Dots */}
            {dictQuery.isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-[#2B1E1A]/90 backdrop-blur px-6 py-4 rounded-xl border border-[#F3E8D7]/20">
                  <p className="text-[#F3E8D7]/70 text-sm animate-pulse">Loading vocabulary...</p>
                </div>
              </div>
            ) : (
              vocabulary.map((word) => (
                <VocabDot
                  key={word.id}
                  word={word}
                  isSelected={selectedWord?.id === word.id}
                  onClick={() => {
                    setSelectedWord(word);
                    speakWord(word.word);
                  }}
                />
              ))
            )}

            {/* Side Panel for selected word */}
            {selectedWord && (
              <WordSidePanel
                word={selectedWord}
                onClose={() => setSelectedWord(null)}
                isReview={reviewWords.includes(selectedWord.id)}
                onToggleReview={() => toggleReviewWord(selectedWord.id)}
                position={{ x: selectedWord.x, y: selectedWord.y }}
              />
            )}

            {/* Gender Guide */}
            <div className="absolute bottom-4 left-4 bg-[#2B1E1A]/95 backdrop-blur-sm rounded-xl p-4 border border-[#F3E8D7]/20 shadow-xl">
              <h4 className="font-cinzel text-[#F3E8D7] text-sm mb-3">Gender Guide</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 w-6 h-6 rounded-full bg-[#3B82F6] blur-md opacity-70" />
                    <span className="relative w-6 h-6 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-xs shadow-lg border border-white/30">♂</span>
                  </div>
                  <div>
                    <span className="font-cinzel text-[#3B82F6] text-sm font-bold">il</span>
                    <span className="text-[#F3E8D7]/60 text-xs ml-2">maschile</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 w-6 h-6 rounded-full bg-[#EC4899] blur-md opacity-70" />
                    <span className="relative w-6 h-6 rounded-full bg-[#EC4899] flex items-center justify-center text-white text-xs shadow-lg border border-white/30">♀</span>
                  </div>
                  <div>
                    <span className="font-cinzel text-[#EC4899] text-sm font-bold">la</span>
                    <span className="text-[#F3E8D7]/60 text-xs ml-2">femminile</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Room Info + Controls */}
            <div className="absolute bottom-4 right-4 bg-[#2B1E1A]/95 backdrop-blur-sm rounded-xl p-4 border border-[#F3E8D7]/20 shadow-xl max-w-xs">
              <h3 className="font-cinzel text-[#F3E8D7] text-lg">{room.name}</h3>
              <p className="text-[#E7A04D] text-sm mb-1">{room.subtitle}</p>
              <p className="text-[#F3E8D7]/60 text-xs mb-3">{room.description}</p>

              {/* Depth Level Indicator */}
              <div className="mb-3 p-2 bg-[#F3E8D7]/5 rounded-lg">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#F3E8D7]/50">Room Depth</span>
                  <span className="text-[#E7A04D]">Level {currentDepth}/3</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3].map(level => (
                    <div 
                      key={level}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        level <= currentDepth ? 'bg-[#E7A04D]' : 'bg-[#F3E8D7]/10'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-[#F3E8D7]/40 mt-1">
                  {currentDepth === 1 && 'Showing basic words'}
                  {currentDepth === 2 && 'Showing basic + intermediate'}
                  {currentDepth === 3 && 'Showing all words'}
                </p>
              </div>

              {/* Zone filter pills */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <button
                  onClick={() => setActiveZone(null)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                    !activeZone
                      ? 'bg-[#E7A04D] text-[#2B1E1A] border-[#E7A04D]'
                      : 'text-[#F3E8D7]/60 border-[#F3E8D7]/20 hover:border-[#E7A04D]/50'
                  }`}
                >
                  All
                </button>
                {room.zones.map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => setActiveZone(activeZone === zone.id ? null : zone.id)}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                      activeZone === zone.id
                        ? 'bg-[#E7A04D] text-[#2B1E1A] border-[#E7A04D]'
                        : 'text-[#F3E8D7]/60 border-[#F3E8D7]/20 hover:border-[#E7A04D]/50'
                    }`}
                  >
                    {zone.icon} {zone.name}
                  </button>
                ))}
              </div>

              {/* Review filter */}
              {reviewWords.length > 0 && (
                <button
                  onClick={() => setShowOnlyReview(!showOnlyReview)}
                  className={`w-full text-xs py-1.5 px-2 rounded-full border transition-colors mb-2 flex items-center justify-center gap-1 ${
                    showOnlyReview
                      ? 'bg-[#E7A04D]/20 text-[#E7A04D] border-[#E7A04D]/50'
                      : 'text-[#F3E8D7]/60 border-[#F3E8D7]/20 hover:border-[#E7A04D]/50'
                  }`}
                >
                  <Bookmark size={12} />
                  {showOnlyReview ? 'Showing Review Words' : `${reviewWords.length} Marked for Review`}
                </button>
              )}

              {/* Advance depth button */}
              {currentDepth < 3 && !showOnlyReview && (
                <button
                  onClick={advanceDepth}
                  className="w-full text-xs py-1.5 px-2 rounded-full bg-[#E7A04D]/10 text-[#E7A04D] border border-[#E7A04D]/30 hover:bg-[#E7A04D]/20 transition-colors mb-2 flex items-center justify-center gap-1"
                >
                  <Sparkles size={12} />
                  Unlock More Words
                </button>
              )}

              {/* Toggle zone overlays */}
              <button
                onClick={() => setShowZones(!showZones)}
                className="text-xs text-[#F3E8D7]/40 hover:text-[#F3E8D7]/70 transition-colors"
              >
                {showZones ? 'Hide' : 'Show'} zone labels
              </button>

              {/* Stats */}
              <div className="flex gap-3 mt-3 text-center">
                <div>
                  <p className="text-lg font-bold text-[#3B82F6]">{vocabulary.filter((v) => v.gender === 'masculine').length}</p>
                  <p className="text-[10px] text-[#F3E8D7]/40">maschile</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#EC4899]">{vocabulary.filter((v) => v.gender === 'feminine').length}</p>
                  <p className="text-[10px] text-[#F3E8D7]/40">femminile</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#E7A04D]">{vocabulary.length}</p>
                  <p className="text-[10px] text-[#F3E8D7]/40">visible</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#F3E8D7]/60">{stats.total}</p>
                  <p className="text-[10px] text-[#F3E8D7]/40">total</p>
                </div>
              </div>
            </div>

            {/* Prev/Next Room Navigation */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {prevRoom && (
                <button
                  onClick={() => setLocation(`/palace/rooms/${prevRoom.id}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2B1E1A]/95 backdrop-blur rounded-full border border-[#F3E8D7]/20 text-[#F3E8D7]/70 hover:text-[#E7A04D] hover:border-[#E7A04D]/50 transition-all text-sm"
                >
                  <ArrowLeft size={14} />
                  {prevRoom.name}
                </button>
              )}
              {nextRoom && (
                <button
                  onClick={() => setLocation(`/palace/rooms/${nextRoom.id}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2B1E1A]/95 backdrop-blur rounded-full border border-[#F3E8D7]/20 text-[#F3E8D7]/70 hover:text-[#E7A04D] hover:border-[#E7A04D]/50 transition-all text-sm"
                >
                  {nextRoom.name}
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* LEARN TAB */}
        {activeTab === 'learn' && (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-[#2B1E1A] border border-[#F3E8D7]/10 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#E7A04D]/20 flex items-center justify-center">
                  <GraduationCap className="text-[#E7A04D]" size={24} />
                </div>
                <div>
                  <h2 className="font-cinzel text-2xl text-[#F3E8D7]">Grammar Focus</h2>
                  <p className="text-[#E7A04D]">{room.grammarFocus}</p>
                </div>
              </div>
              <p className="text-[#F3E8D7]/60 text-sm">
                Master the grammar concepts for this room through structured lessons. 
                Each lesson includes conjugations, examples, and tips.
              </p>
            </div>

            {grammar ? (
              <GrammarAccordion lessons={grammar.lessons} />
            ) : (
              <div className="text-center py-12 bg-[#F3E8D7]/5 rounded-2xl border border-[#F3E8D7]/10">
                <p className="text-[#F3E8D7]/50">Grammar lessons coming soon for this room.</p>
              </div>
            )}
          </div>
        )}

        {/* PRACTICE TAB */}
        {activeTab === 'practice' && (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-[#2B1E1A] border border-[#F3E8D7]/10 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#E7A04D]/20 flex items-center justify-center">
                  <Gamepad2 className="text-[#E7A04D]" size={24} />
                </div>
                <div>
                  <h2 className="font-cinzel text-2xl text-[#F3E8D7]">Practice</h2>
                  <p className="text-[#E7A04D]">Interactive exercises</p>
                </div>
              </div>
              <p className="text-[#F3E8D7]/60 text-sm">
                Reinforce your learning with interactive practice exercises.
                {reviewWords.length > 0 && (
                  <span className="text-[#E7A04D]"> You have {reviewWords.length} words marked for review.</span>
                )}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#F3E8D7]/5 border border-[#F3E8D7]/10 rounded-xl p-6 hover:border-[#E7A04D]/30 transition-colors cursor-pointer">
                <h3 className="font-cinzel text-[#F3E8D7] text-lg mb-2">Flashcards</h3>
                <p className="text-[#F3E8D7]/60 text-sm">Review vocabulary with spaced repetition.</p>
                <span className="inline-block mt-4 text-[#E7A04D] text-sm font-cinzel">Start →</span>
              </div>
              <div className="bg-[#F3E8D7]/5 border border-[#F3E8D7]/10 rounded-xl p-6 hover:border-[#E7A04D]/30 transition-colors cursor-pointer">
                <h3 className="font-cinzel text-[#F3E8D7] text-lg mb-2">Matching</h3>
                <p className="text-[#F3E8D7]/60 text-sm">Match Italian words with English translations.</p>
                <span className="inline-block mt-4 text-[#E7A04D] text-sm font-cinzel">Start →</span>
              </div>
              <div className="bg-[#F3E8D7]/5 border border-[#F3E8D7]/10 rounded-xl p-6 hover:border-[#E7A04D]/30 transition-colors cursor-pointer">
                <h3 className="font-cinzel text-[#F3E8D7] text-lg mb-2">Conjugation Drill</h3>
                <p className="text-[#F3E8D7]/60 text-sm">Practice verb conjugations for this room.</p>
                <span className="inline-block mt-4 text-[#E7A04D] text-sm font-cinzel">Start →</span>
              </div>
              <div className="bg-[#F3E8D7]/5 border border-[#F3E8D7]/10 rounded-xl p-6 hover:border-[#E7A04D]/30 transition-colors cursor-pointer">
                <h3 className="font-cinzel text-[#F3E8D7] text-lg mb-2">Listening</h3>
                <p className="text-[#F3E8D7]/60 text-sm">Train your ear with pronunciation exercises.</p>
                <span className="inline-block mt-4 text-[#E7A04D] text-sm font-cinzel">Start →</span>
              </div>
            </div>
          </div>
        )}

        {/* TEST TAB */}
        {activeTab === 'test' && (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-[#2B1E1A] border border-[#F3E8D7]/10 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#E7A04D]/20 flex items-center justify-center">
                  <GraduationCap className="text-[#E7A04D]" size={24} />
                </div>
                <div>
                  <h2 className="font-cinzel text-2xl text-[#F3E8D7]">Test Your Knowledge</h2>
                  <p className="text-[#E7A04D]">Assess your mastery</p>
                </div>
              </div>
              <p className="text-[#F3E8D7]/60 text-sm">
                Complete tests to earn stars and track your progress through the palace.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-[#F3E8D7]/5 border border-[#F3E8D7]/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-cinzel text-[#F3E8D7] text-lg">Vocabulary Check</h3>
                    <p className="text-[#F3E8D7]/60 text-sm">20 questions • Mixed format</p>
                  </div>
                  <span className="text-2xl">⭐⭐⭐</span>
                </div>
                <button className="w-full py-3 bg-[#E7A04D] text-[#2B1E1A] font-cinzel rounded-full hover:bg-[#F3E8D7] transition-colors">
                  Start Test
                </button>
              </div>

              <div className="bg-[#F3E8D7]/5 border border-[#F3E8D7]/10 rounded-xl p-6 opacity-60">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-cinzel text-[#F3E8D7] text-lg">Grammar Challenge</h3>
                    <p className="text-[#F3E8D7]/60 text-sm">15 questions • Conjugations & agreement</p>
                  </div>
                  <span className="text-2xl">🔒</span>
                </div>
                <p className="text-[#F3E8D7]/40 text-sm text-center">Complete Vocabulary Check to unlock</p>
              </div>

              <div className="bg-[#F3E8D7]/5 border border-[#F3E8D7]/10 rounded-xl p-6 opacity-60">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-cinzel text-[#F3E8D7] text-lg">Room Mastery</h3>
                    <p className="text-[#F3E8D7]/60 text-sm">Comprehensive assessment</p>
                  </div>
                  <span className="text-2xl">🔒</span>
                </div>
                <p className="text-[#F3E8D7]/40 text-sm text-center">Complete all tests to unlock</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
