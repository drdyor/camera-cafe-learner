"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PrismaZoom from "react-prismazoom";
import { Tooltip } from "react-tooltip";
import { ZoomIn, ZoomOut, RotateCcw, X, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// ===== TYPES =====
export interface SpatialZone {
  id: string;
  name: string;
  nameIt: string;
  x: number; // percentage 0-100
  y: number;
  width: number;
  height: number;
  icon: string;
  targetLevelId: string;
  description?: string;
}

export interface SpatialWord {
  id: string;
  word: string;
  en: string;
  g?: "m" | "f";
  emoji?: string;
  x: number;
  y: number;
  mnemonic?: string;
}

export interface SpatialLevel {
  id: string;
  name: string;
  nameIt: string;
  description: string;
  image: string;
  parentId?: string;
  zones: SpatialZone[];
  words: SpatialWord[];
}

// ===== COMPONENTS =====
interface SpatialViewerProps {
  level: SpatialLevel;
  onZoneClick: (zone: SpatialZone) => void;
  onWordClick: (word: SpatialWord) => void;
  onBack?: () => void;
  showTranslation?: boolean;
}

export function SpatialViewer({ 
  level, 
  onZoneClick, 
  onWordClick, 
  onBack,
  showTranslation = true 
}: SpatialViewerProps) {
  const zoomRef = useRef<any>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<SpatialWord | null>(null);
  const [imageError, setImageError] = useState(false);

  const handleZoomChange = useCallback((scale: number) => {
    setZoomScale(scale);
  }, []);

  const zoomIn = () => zoomRef.current?.zoomIn();
  const zoomOut = () => zoomRef.current?.zoomOut();
  const resetZoom = () => zoomRef.current?.reset();

  const speak = (text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "it-IT";
    u.rate = 0.85;
    speechSynthesis.speak(u);
  };

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={zoomIn}
          className="bg-slate-800/90 backdrop-blur hover:bg-slate-700"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={zoomOut}
          className="bg-slate-800/90 backdrop-blur hover:bg-slate-700"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={resetZoom}
          className="bg-slate-800/90 backdrop-blur hover:bg-slate-700"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        {onBack && (
          <Button
            variant="secondary"
            size="icon"
            onClick={onBack}
            className="bg-slate-800/90 backdrop-blur hover:bg-slate-700 mt-2"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Zoom/Pan Container */}
      <PrismaZoom
        ref={zoomRef}
        onZoomChange={handleZoomChange}
        scrollVelocity={0.1}
        maxScale={4}
        minScale={0.5}
        className="w-full h-full"
      >
        <div className="relative w-full h-full">
          {/* Background Image */}
          {!imageError && level.image ? (
            <img
              src={level.image}
              alt={level.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
              <div className="text-center text-slate-500">
                <span className="text-6xl mb-4 block">
                  {level.id.includes("fridge") ? "❄️" :
                   level.id.includes("cooking") ? "👨‍🍳" :
                   level.id.includes("cabinet") ? "🗄️" : "🏠"}
                </span>
                <p>{level.nameIt}</p>
              </div>
            </div>
          )}

          {/* Dark Overlay for readability */}
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />

          {/* Zones (Navigation Hotspots) */}
          {level.zones.map((zone) => (
            <motion.button
              key={zone.id}
              onClick={() => onZoneClick(zone)}
              onMouseEnter={() => setHoveredZone(zone.id)}
              onMouseLeave={() => setHoveredZone(null)}
              className="absolute group"
              style={{
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                width: `${zone.width}%`,
                height: `${zone.height}%`,
                transform: "translate(-50%, -50%)",
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Zone Area */}
              <div 
                className={`
                  w-full h-full rounded-xl border-2 border-dashed 
                  transition-all duration-300
                  ${hoveredZone === zone.id 
                    ? "bg-amber-500/30 border-amber-400 shadow-lg shadow-amber-500/30" 
                    : "bg-amber-500/10 border-amber-500/50"
                  }
                `}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-3xl animate-pulse">{zone.icon}</span>
                </div>
              </div>

              {/* Zone Label (always visible when zoomed out) */}
              {(zoomScale < 1.5 || hoveredZone === zone.id) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-2 whitespace-nowrap z-30"
                >
                  <div className="bg-slate-900/95 backdrop-blur px-3 py-2 rounded-lg border border-amber-500/30">
                    <p className="font-bold text-amber-400 text-sm">{zone.nameIt}</p>
                    <p className="text-xs text-slate-400">{zone.name}</p>
                    <p className="text-[10px] text-amber-500/70 mt-1">Click to enter</p>
                  </div>
                </motion.div>
              )}
            </motion.button>
          ))}

          {/* Words (Vocabulary Items) */}
          {level.words.map((word) => (
            <motion.button
              key={word.id}
              onClick={() => {
                setSelectedWord(word);
                onWordClick(word);
                speak(word.word);
              }}
              onMouseEnter={() => setHoveredWord(word.id)}
              onMouseLeave={() => setHoveredWord(null)}
              className="absolute z-20"
              style={{
                left: `${word.x}%`,
                top: `${word.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              {/* Word Marker */}
              <div className="relative">
                <div 
                  className={`
                    w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-xl
                    transition-all duration-200
                    ${hoveredWord === word.id 
                      ? "bg-blue-500 shadow-blue-500/50 scale-110" 
                      : "bg-blue-500/80"
                    }
                  `}
                >
                  {word.emoji}
                </div>
                {/* Pulse animation */}
                <div className="absolute inset-0 w-10 h-10 rounded-full bg-blue-500 animate-ping opacity-20" />
              </div>

              {/* Word Label */}
              <AnimatePresence>
                {(hoveredWord === word.id || zoomScale > 1.5) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-2 whitespace-nowrap z-30"
                  >
                    <div className="bg-slate-900/95 backdrop-blur px-3 py-2 rounded-lg border border-blue-500/30 shadow-xl">
                      <p className="font-bold text-white">{word.word}</p>
                      {showTranslation && (
                        <p className="text-xs text-slate-400">{word.en}</p>
                      )}
                      {word.g && (
                        <span 
                          className={`
                            text-[10px] px-1.5 py-0.5 rounded mt-1 inline-block
                            ${word.g === "f" 
                              ? "bg-pink-500/20 text-pink-400" 
                              : "bg-blue-500/20 text-blue-400"
                            }
                          `}
                        >
                          {word.g}
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>
      </PrismaZoom>

      {/* Level Info Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h2 className="text-xl font-bold text-white">{level.nameIt}</h2>
            <p className="text-sm text-slate-400">{level.name}</p>
            <p className="text-xs text-slate-500 mt-1">{level.description}</p>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-amber-400">{level.zones.length}</p>
              <p className="text-xs text-slate-500">areas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-400">{level.words.length}</p>
              <p className="text-xs text-slate-500">words</p>
            </div>
          </div>
        </div>
      </div>

      {/* Word Detail Modal */}
      <AnimatePresence>
        {selectedWord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setSelectedWord(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-5xl">{selectedWord.emoji}</span>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{selectedWord.word}</h3>
                    {selectedWord.g && (
                      <span 
                        className={`
                          text-xs px-2 py-1 rounded-full
                          ${selectedWord.g === "f" 
                            ? "bg-pink-500/20 text-pink-400" 
                            : "bg-blue-500/20 text-blue-400"
                          }
                        `}
                      >
                        {selectedWord.g === "f" ? "feminine" : "masculine"}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedWord(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-800 rounded-xl">
                  <p className="text-sm text-slate-400 uppercase tracking-wider mb-1">English</p>
                  <p className="text-xl text-white">{selectedWord.en}</p>
                </div>

                {selectedWord.mnemonic && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <p className="text-sm text-amber-400 uppercase tracking-wider mb-1">Memory Aid</p>
                    <p className="text-slate-300 italic">"{selectedWord.mnemonic}"</p>
                  </div>
                )}

                <Button 
                  onClick={() => speak(selectedWord.word)}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  <Volume2 className="w-4 h-4 mr-2" />
                  Listen
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tooltips */}
      <Tooltip id="zone-tooltip" />
    </div>
  );
}
