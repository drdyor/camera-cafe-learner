import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, Sparkles, Eye, EyeOff, RotateCcw,
  ChefHat, Bed, Sofa, TreePine, BookOpen, Bus
} from "lucide-react";
import { 
  SimpleViewer, 
  SpatialLevel, 
  SpatialZone, 
  SpatialWord,
  kitchenLevels,
  getLevelById 
} from "@/components/memory-palace";

// Palace metadata for sidebar
const PALACES = [
  { id: "kitchen", name: "Kitchen", nameIt: "Cucina", icon: ChefHat, levelCount: 7, color: "amber" },
  { id: "bedroom", name: "Bedroom", nameIt: "Camera", icon: Bed, levelCount: 4, color: "indigo" },
  { id: "living", name: "Living Room", nameIt: "Soggiorno", icon: Sofa, levelCount: 3, color: "teal" },
  { id: "outdoors", name: "Outdoors", nameIt: "Natura", icon: TreePine, levelCount: 5, color: "green" },
  { id: "school", name: "School", nameIt: "Scuola", icon: BookOpen, levelCount: 4, color: "blue" },
  { id: "transport", name: "Transport", nameIt: "Trasporti", icon: Bus, levelCount: 3, color: "cyan" },
];

// Flatten all levels for lookup
const ALL_LEVELS: SpatialLevel[] = [
  ...kitchenLevels,
  // Add other palace levels here
];

export default function MemoryPalace() {
  const [, setLocation] = useLocation();
  
  // Navigation state
  const [currentLevelId, setCurrentLevelId] = useState("kitchen-main");
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>(["kitchen-main"]);
  const [currentPalace, setCurrentPalace] = useState("kitchen");
  
  // UI state
  const [showTranslation, setShowTranslation] = useState(true);

  const currentLevel = useMemo(() => {
    return getLevelById(currentLevelId) || ALL_LEVELS[0];
  }, [currentLevelId]);

  const navigateToZone = (zone: SpatialZone) => {
    setCurrentLevelId(zone.targetLevelId);
    setBreadcrumbs(prev => [...prev, zone.targetLevelId]);
  };

  const navigateToLevel = (levelId: string) => {
    setCurrentLevelId(levelId);
    setBreadcrumbs(prev => [...prev, levelId]);
  };

  const goBack = () => {
    if (breadcrumbs.length > 1) {
      const newBreadcrumbs = breadcrumbs.slice(0, -1);
      setBreadcrumbs(newBreadcrumbs);
      setCurrentLevelId(newBreadcrumbs[newBreadcrumbs.length - 1]);
    }
  };

  const resetToMain = () => {
    const rootId = `${currentPalace}-main`;
    setCurrentLevelId(rootId);
    setBreadcrumbs([rootId]);
  };

  const switchPalace = (palaceId: string) => {
    setCurrentPalace(palaceId);
    const rootId = `${palaceId}-main`;
    setCurrentLevelId(rootId);
    setBreadcrumbs([rootId]);
  };

  const handleWordClick = (word: SpatialWord) => {
    console.log("Word clicked:", word);
    // Could add to SRS, show detail modal, etc.
  };

  // Calculate stats
  const totalWords = useMemo(() => {
    return ALL_LEVELS.reduce((sum, level) => sum + level.words.length, 0);
  }, []);

  const currentPalaceData = PALACES.find(p => p.id === currentPalace) || PALACES[0];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="text-slate-400">
            <ArrowLeft className="w-4 h-4 mr-1" /> Home
          </Button>
          
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-lg">Memory Palace</span>
          </div>

          {/* Breadcrumbs */}
          <div className="flex-1 flex items-center gap-2 text-sm text-slate-400 overflow-x-auto">
            <span className="text-slate-600">/</span>
            {breadcrumbs.map((crumb, idx) => {
              const level = ALL_LEVELS.find(l => l.id === crumb);
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <span key={crumb} className="flex items-center gap-2 whitespace-nowrap">
                  <button
                    onClick={() => {
                      if (!isLast) {
                        setCurrentLevelId(crumb);
                        setBreadcrumbs(breadcrumbs.slice(0, idx + 1));
                      }
                    }}
                    className={isLast ? "text-amber-400 font-medium" : "hover:text-white transition"}
                    disabled={isLast}
                  >
                    {level?.nameIt || level?.name}
                  </button>
                  {!isLast && <span className="text-slate-600">›</span>}
                </span>
              );
            })}
          </div>

          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowTranslation(!showTranslation)}
              title={showTranslation ? "Hide English" : "Show English"}
            >
              {showTranslation ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
            {breadcrumbs.length > 1 && (
              <Button variant="ghost" size="sm" onClick={goBack}>
                <RotateCcw className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-60px)]">
        {/* Palace Sidebar */}
        <aside className="lg:w-72 bg-slate-900 border-r border-slate-800 flex-shrink-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <p className="text-xs text-amber-400 font-medium">
                  {totalWords}+ words across {PALACES.length} palaces
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Multi-level spatial learning
                </p>
              </div>
              
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Palaces
              </h2>
              <div className="space-y-2">
                {PALACES.map((palace) => {
                  const Icon = palace.icon;
                  const isActive = currentPalace === palace.id;
                  const colorClasses = {
                    amber: "bg-amber-500/20 border-amber-500/50 text-amber-400",
                    indigo: "bg-indigo-500/20 border-indigo-500/50 text-indigo-400",
                    teal: "bg-teal-500/20 border-teal-500/50 text-teal-400",
                    green: "bg-green-500/20 border-green-500/50 text-green-400",
                    blue: "bg-blue-500/20 border-blue-500/50 text-blue-400",
                    cyan: "bg-cyan-500/20 border-cyan-500/50 text-cyan-400",
                  }[palace.color];

                  return (
                    <button
                      key={palace.id}
                      onClick={() => switchPalace(palace.id)}
                      className={`w-full p-3 rounded-xl text-left transition-all border ${
                        isActive ? colorClasses : "bg-slate-800/50 border-transparent hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isActive ? "bg-white/10" : "bg-slate-700"
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className={`font-semibold ${isActive ? "" : "text-slate-300"}`}>
                            {palace.nameIt}
                          </p>
                          <p className="text-xs text-slate-500">{palace.levelCount} areas</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Instructions */}
              <div className="mt-6 p-3 bg-slate-800/50 rounded-xl">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">How to Explore</h3>
                <ul className="text-xs text-slate-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded bg-amber-500/20 flex items-center justify-center text-[10px] flex-shrink-0">🖱️</span>
                    <span>Click <strong className="text-amber-400">dashed zones</strong> to enter areas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center text-[10px] flex-shrink-0">🔤</span>
                    <span>Click <strong className="text-blue-400">blue dots</strong> for words</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded bg-purple-500/20 flex items-center justify-center text-[10px] flex-shrink-0">🔍</span>
                    <span><strong className="text-purple-400">Scroll</strong> to zoom, <strong className="text-purple-400">drag</strong> to pan</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded bg-green-500/20 flex items-center justify-center text-[10px] flex-shrink-0">🔄</span>
                    <span>Same layout works for <strong className="text-green-400">all languages</strong></span>
                  </li>
                </ul>
              </div>
            </div>
          </ScrollArea>
        </aside>

        {/* Main Spatial Viewer */}
        <main className="flex-1 relative">
          <SimpleViewer
            level={currentLevel}
            onZoneClick={navigateToZone}
            onWordClick={handleWordClick}
            onBack={breadcrumbs.length > 1 ? goBack : undefined}
            showTranslation={showTranslation}
          />
        </main>
      </div>
    </div>
  );
}
