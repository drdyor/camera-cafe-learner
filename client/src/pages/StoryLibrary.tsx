import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, BookOpen, ArrowLeft, Coffee } from "lucide-react";

const storyCovers: Record<string, { emoji: string; gradient: string }> = {
  "tre-porcellini": { emoji: "🐷", gradient: "from-red-500 to-red-700" },
  "riccioli-doro": { emoji: "🐻", gradient: "from-amber-400 to-amber-600" },
  "romeo-giulietta": { emoji: "🌹", gradient: "from-blue-500 to-blue-700" },
  "dante-inferno": { emoji: "🔥", gradient: "from-orange-600 to-gray-900" },
  "pinocchio": { emoji: "🤥", gradient: "from-yellow-500 to-amber-700" },
  "leonardo": { emoji: "🎨", gradient: "from-teal-500 to-emerald-700" },
  "caverna-platone": { emoji: "🕯️", gradient: "from-gray-600 to-gray-900" },
  "pompei": { emoji: "🌋", gradient: "from-red-600 to-orange-800" },
  "galileo": { emoji: "🔭", gradient: "from-indigo-500 to-purple-800" },
  "marco-polo": { emoji: "🧭", gradient: "from-cyan-500 to-blue-800" },
  // GCSE Exam Stories
  "gcse-theme1-family-technology": { emoji: "👨‍👩‍👧‍👦", gradient: "from-violet-500 to-purple-700" },
  "gcse-theme2-travel-environment": { emoji: "🚂", gradient: "from-emerald-500 to-green-800" },
  "gcse-theme3-school-career": { emoji: "🎓", gradient: "from-sky-500 to-blue-800" },
};

const getDifficultyColor = (level: string) => {
  if (level.includes("A1") && level.includes("A2")) return "bg-teal-100 text-teal-800";
  switch (level) {
    case "A1": return "bg-green-100 text-green-800";
    case "A2": return "bg-blue-100 text-blue-800";
    case "B1": return "bg-orange-100 text-orange-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

export default function StoryLibrary() {
  const [, setLocation] = useLocation();
  const storiesQuery = trpc.stories.list.useQuery();
  const stories = storiesQuery.data || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Home
          </Button>
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-700" />
            <span className="font-semibold">Camera Cafe Learner</span>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/episodes")}>
              Episodes
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/vocabulary")}>
              My Vocabulary
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Graded Stories
          </h1>
          <p className="text-gray-600">
            Classic literature simplified to A1/A2 Italian. Read Dante, Shakespeare, and fairy tales as a beginner.
          </p>
        </div>

        {storiesQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No stories found. Add JSON files to data/stories/</p>
          </div>
        ) : (
          <>
            {/* Graded Classics */}
            {stories.filter(s => !s.gcseTheme).length > 0 && (
              <div className="mb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {stories.filter(s => !s.gcseTheme).map((story) => {
                    const cover = storyCovers[story.id] || { emoji: "📖", gradient: "from-gray-500 to-gray-700" };
                    return (
                      <Card
                        key={story.id}
                        className="overflow-hidden hover:shadow-lg transition cursor-pointer group"
                        onClick={() => setLocation(`/story/${story.id}`)}
                      >
                        <div className={`w-full h-36 bg-gradient-to-br ${cover.gradient} flex items-center justify-center relative`}>
                          <span className="text-6xl group-hover:scale-110 transition-transform">
                            {cover.emoji}
                          </span>
                          <span className="absolute top-3 left-3 bg-black/40 text-white text-xs font-bold px-2 py-1 rounded">
                            #{story.order}
                          </span>
                          {story.order === 1 && (
                            <span className="absolute top-3 right-3 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded animate-pulse">
                              Start Here
                            </span>
                          )}
                        </div>
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition">
                                {story.title}
                              </h3>
                              <p className="text-sm text-gray-500">{story.englishTitle}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ml-2 ${getDifficultyColor(story.level)}`}>
                              {story.level}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            <span className="text-sm text-gray-500">{story.lineCount} sentences</span>
                            <Button
                              size="sm"
                              className="bg-amber-700 hover:bg-amber-800 text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/story/${story.id}`);
                              }}
                            >
                              <BookOpen className="w-3 h-3 mr-1" />
                              Read
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* GCSE Exam Prep */}
            {stories.filter(s => s.gcseTheme).length > 0 && (
              <div>
                <div className="mb-6 mt-4">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    GCSE Exam Prep
                  </h2>
                  <p className="text-gray-600">
                    Stories aligned to AQA/Edexcel GCSE Italian themes. Practice reading, listening, and vocabulary for your exam.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {stories.filter(s => s.gcseTheme).map((story) => {
                    const cover = storyCovers[story.id] || { emoji: "📖", gradient: "from-gray-500 to-gray-700" };
                    return (
                      <Card
                        key={story.id}
                        className="overflow-hidden hover:shadow-lg transition cursor-pointer group border-2 border-violet-100"
                        onClick={() => setLocation(`/story/${story.id}`)}
                      >
                        <div className={`w-full h-36 bg-gradient-to-br ${cover.gradient} flex items-center justify-center relative`}>
                          <span className="text-6xl group-hover:scale-110 transition-transform">
                            {cover.emoji}
                          </span>
                          <span className="absolute top-3 left-3 bg-violet-600 text-white text-xs font-bold px-2 py-1 rounded">
                            GCSE
                          </span>
                        </div>
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-violet-600 transition">
                                {story.title}
                              </h3>
                              <p className="text-sm text-gray-500">{story.englishTitle}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ml-2 ${getDifficultyColor(story.level)}`}>
                              {story.level}
                            </span>
                          </div>
                          <p className="text-xs text-violet-600 font-medium mb-3">{story.gcseTheme}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">{story.lineCount} sentences</span>
                            <Button
                              size="sm"
                              className="bg-violet-600 hover:bg-violet-700 text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/story/${story.id}`);
                              }}
                            >
                              <BookOpen className="w-3 h-3 mr-1" />
                              Study
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
