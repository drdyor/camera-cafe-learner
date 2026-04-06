import { useState } from "react";
import { useParams, useLocation } from "wouter";
import DualSubtitlePlayer from "@/components/DualSubtitlePlayer";
import WordLookupModal from "@/components/WordLookupModal";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, BookOpen, Coffee, Volume2 } from "lucide-react";

interface Phrase {
  id: number;
  italianText: string;
  englishTranslation: string;
  cefrLevel: "A1" | "A2" | "B1" | "B2";
  minFrequencyRank: number;
  startTime: number;
  endTime: number;
}

const getDifficultyColor = (level: string) => {
  switch (level) {
    case "A1": return "bg-green-100 text-green-800";
    case "A2": return "bg-blue-100 text-blue-800";
    case "B1": return "bg-orange-100 text-orange-800";
    case "B2": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

export default function VideoPlayer() {
  const { episodeId } = useParams();
  const [, setLocation] = useLocation();
  const [selectedWord, setSelectedWord] = useState<Phrase | null>(null);
  const [wordLookupOpen, setWordLookupOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const episodeQuery = trpc.episodes.getById.useQuery({
    id: parseInt(episodeId || "0"),
  });

  const italianSubtitlesQuery = trpc.episodes.getItalianSubtitles.useQuery({
    episodeId: parseInt(episodeId || "0"),
  });

  const englishSubtitlesQuery = trpc.episodes.getEnglishSubtitles.useQuery({
    episodeId: parseInt(episodeId || "0"),
  });

  const phrasesQuery = trpc.phrases.getByEpisode.useQuery({
    episodeId: parseInt(episodeId || "0"),
  });

  const episode = episodeQuery.data;
  const italianSubtitles = italianSubtitlesQuery.data || [];
  const englishSubtitles = englishSubtitlesQuery.data || [];
  const phrases = phrasesQuery.data || [];

  // Sort phrases: B2 > B1 > A2 > A1, then by frequency rank desc (rarer = more useful)
  const cefrOrder: Record<string, number> = { B2: 4, B1: 3, A2: 2, A1: 1 };
  const sortedPhrases = [...phrases].sort((a, b) => {
    const levelDiff = (cefrOrder[b.cefrLevel] || 0) - (cefrOrder[a.cefrLevel] || 0);
    if (levelDiff !== 0) return levelDiff;
    return (b.minFrequencyRank || 0) - (a.minFrequencyRank || 0);
  });

  // Get phrases visible at current time
  const getCurrentPhrases = () => {
    return phrases.filter(
      phrase => currentTime >= phrase.startTime - 500 && currentTime <= phrase.endTime + 500
    );
  };

  const speak = (word: string) => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "it-IT";
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  };

  const handleWordClick = (phrase: Phrase) => {
    setSelectedWord(phrase);
    setWordLookupOpen(true);
  };

  if (episodeQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-500">Episode not found</p>
        <Button onClick={() => setLocation("/episodes")}>Back to Episodes</Button>
      </div>
    );
  }

  const currentPhrases = getCurrentPhrases();

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Nav */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            onClick={() => setLocation("/episodes")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Episodes
          </Button>
          <div className="flex items-center gap-2">
            <Coffee className="w-4 h-4 text-amber-500" />
            <span className="text-gray-300 text-sm">
              S{episode.season}E{episode.episodeNumber}
            </span>
            <span className="text-white font-medium">{episode.title}</span>
          </div>
          <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${getDifficultyColor(episode.difficulty)}`}>
            {episode.difficulty}
          </span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video + Subtitles — takes 2/3 */}
          <div className="lg:col-span-2">
            <DualSubtitlePlayer
              videoUrl={episode.videoUrl || ""}
              italianSubtitles={italianSubtitles}
              englishSubtitles={englishSubtitles}
              duration={episode.duration * 1000}
              onProgress={(time) => setCurrentTime(time)}
            />
          </div>

          {/* Sidebar — vocabulary panel */}
          <div className="space-y-4">
            {/* Episode Info */}
            <Card className="bg-gray-800 border-gray-700 p-4">
              <h2 className="text-white font-semibold mb-2">{episode.title}</h2>
              {episode.description && (
                <p className="text-gray-400 text-sm mb-3">{episode.description}</p>
              )}
              <div className="flex gap-2 text-xs">
                <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded">
                  {Math.floor(episode.duration / 60)}:{String(episode.duration % 60).padStart(2, "0")} min
                </span>
                <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded">
                  {italianSubtitles.length} subtitles
                </span>
                <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded">
                  {phrases.length} phrases
                </span>
              </div>
            </Card>

            {/* Current Vocabulary */}
            <Card className="bg-gray-800 border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-amber-500" />
                <h3 className="text-white font-semibold text-sm">
                  {currentPhrases.length > 0 ? "Words in this scene" : "All vocabulary"}
                </h3>
              </div>

              <div className="space-y-1.5 max-h-96 overflow-y-auto">
                {(currentPhrases.length > 0 ? currentPhrases : sortedPhrases.slice(0, 30)).map(phrase => (
                  <div
                    key={phrase.id}
                    className={`p-2 rounded cursor-pointer transition ${
                      currentPhrases.includes(phrase)
                        ? "bg-amber-900/30 border border-amber-600/50"
                        : "bg-gray-700/50 hover:bg-gray-700"
                    }`}
                    onClick={() => handleWordClick(phrase)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          className="text-gray-400 hover:text-amber-400 transition p-0.5"
                          onClick={(e) => { e.stopPropagation(); speak(phrase.italianText); }}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-white text-sm font-medium">
                          {phrase.italianText}
                        </span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${getDifficultyColor(phrase.cefrLevel)}`}>
                        {phrase.cefrLevel}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs mt-0.5 truncate ml-6">
                      {phrase.englishTranslation}
                    </p>
                  </div>
                ))}

                {phrases.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No vocabulary extracted yet
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Word Lookup Modal */}
      {selectedWord && (
        <WordLookupModal
          isOpen={wordLookupOpen}
          wordInfo={{
            word: selectedWord.italianText,
            translation: selectedWord.englishTranslation,
            cefrLevel: selectedWord.cefrLevel,
            frequencyRank: selectedWord.minFrequencyRank,
            partOfSpeech: "phrase",
            context: `Appears at ${Math.floor(selectedWord.startTime / 1000)}s in "${episode.title}"`,
          }}
          isSaved={false}
          onClose={() => setWordLookupOpen(false)}
          onSave={() => setWordLookupOpen(false)}
          onRemove={() => setWordLookupOpen(false)}
        />
      )}
    </div>
  );
}
