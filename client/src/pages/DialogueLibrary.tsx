import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, Coffee, MessageSquare } from "lucide-react";

const themeColors: Record<string, string> = {
  "Theme 1": "from-violet-500 to-purple-700",
  "Theme 2": "from-emerald-500 to-teal-700",
  "Theme 3": "from-sky-500 to-blue-700",
};

const themeLabels: Record<string, string> = {
  "Theme 1": "Identity & Culture",
  "Theme 2": "Local & International",
  "Theme 3": "Study & Employment",
};

function getThemeKey(gcseTheme: string): string {
  if (gcseTheme.includes("Theme 1")) return "Theme 1";
  if (gcseTheme.includes("Theme 2")) return "Theme 2";
  if (gcseTheme.includes("Theme 3")) return "Theme 3";
  return "Theme 1";
}

const getDifficultyColor = (level: string) => {
  if (level.includes("A1") && level.includes("A2")) return "bg-teal-100 text-teal-800";
  switch (level) {
    case "A1": return "bg-green-100 text-green-800";
    case "A2": return "bg-blue-100 text-blue-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

export default function DialogueLibrary() {
  const [, setLocation] = useLocation();
  const dialoguesQuery = trpc.dialogues.list.useQuery();
  const dialogues = dialoguesQuery.data || [];

  // Group by theme
  const grouped = dialogues.reduce((acc, d) => {
    const key = getThemeKey(d.gcseTheme);
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {} as Record<string, typeof dialogues>);

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
            <Button variant="ghost" size="sm" onClick={() => setLocation("/stories")}>
              Stories
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/visual-dictionary")}>
              Visual Dict
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">GCSE Dialogues</h1>
          <p className="text-gray-600">
            Practice real exam-style conversations. Read, role-play, and quiz yourself on A1-A2 dialogues across all three GCSE themes.
          </p>
        </div>

        {dialoguesQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : dialogues.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No dialogues found.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {(["Theme 1", "Theme 2", "Theme 3"] as const).map((theme) => {
              const items = grouped[theme];
              if (!items?.length) return null;
              return (
                <div key={theme}>
                  <div className={`rounded-xl bg-gradient-to-r ${themeColors[theme]} p-4 mb-4`}>
                    <h2 className="text-xl font-bold text-white">{theme}: {themeLabels[theme]}</h2>
                    <p className="text-white/70 text-sm">{items.length} dialogue{items.length > 1 ? "s" : ""}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((d) => (
                      <Card
                        key={d.id}
                        className="overflow-hidden hover:shadow-lg transition cursor-pointer group"
                        onClick={() => setLocation(`/dialogue/${d.id}`)}
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-violet-600 transition">
                                {d.title}
                              </h3>
                              <p className="text-sm text-gray-500">{d.englishTitle}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ml-2 ${getDifficultyColor(d.level)}`}>
                              {d.level}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{d.scenario}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              {d.characters.map((c) => (
                                <span key={c.id} className="text-sm" title={c.name}>
                                  {c.emoji}
                                </span>
                              ))}
                              <span className="text-xs text-gray-400 ml-1">{d.lineCount} lines</span>
                            </div>
                            <Button
                              size="sm"
                              className="bg-violet-600 hover:bg-violet-700 text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/dialogue/${d.id}`);
                              }}
                            >
                              <MessageSquare className="w-3 h-3 mr-1" />
                              Practice
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
