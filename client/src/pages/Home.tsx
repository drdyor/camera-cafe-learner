import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { BookOpen, Play, Heart, TrendingUp, Coffee, Brain, Image } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const [, setLocation] = useLocation();
  const meQuery = trpc.auth.me.useQuery(undefined, { retry: false });
  const srsStats = trpc.srs.stats.useQuery();
  const user = meQuery.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coffee className="w-6 h-6 text-amber-700" />
            <h1 className="text-2xl font-bold text-gray-900">Camera Cafe Learner</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation("/episodes")}>
              Episodes
            </Button>
            <Button variant="ghost" onClick={() => setLocation("/stories")}>
              Stories
            </Button>
            <Button variant="ghost" onClick={() => setLocation("/dialogues")}>
              Dialogues
            </Button>
            <Button variant="ghost" onClick={() => setLocation("/visual-dictionary")}>
              Visual Dict
            </Button>
            <Button variant="ghost" onClick={() => setLocation("/vocabulary")}>
              My Vocabulary
            </Button>
            {user && (
              <span className="text-sm text-gray-500">
                {user.name || "Learner"}
              </span>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Learn Italian Through TV
          </h2>
          <p className="text-xl text-gray-600 mb-2">
            Watch authentic <strong>Camera Cafe</strong> episodes with dual subtitles
          </p>
          <p className="text-lg text-gray-500 mb-8">
            Build vocabulary with frequency-based learning from 6,800+ Kelly-graded Italian words
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              className="bg-amber-700 hover:bg-amber-800 text-white"
              onClick={() => setLocation("/episodes")}
            >
              <Play className="w-5 h-5 mr-2" />
              Watch Episodes
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-amber-700 text-amber-700 hover:bg-amber-50"
              onClick={() => setLocation("/stories")}
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Read Stories
            </Button>
          </div>
        </div>

        {/* SRS Review Widget */}
        {srsStats.data && srsStats.data.total > 0 && (
          <Card className="max-w-lg mx-auto mb-12 p-6 bg-white/80 backdrop-blur border-amber-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Brain className="w-6 h-6 text-violet-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Your Vocabulary</h3>
                <p className="text-sm text-gray-500">
                  {srsStats.data.total} words tracked · {srsStats.data.learned} learned · <strong className={srsStats.data.due > 0 ? "text-amber-700" : "text-green-600"}>{srsStats.data.due} due for review</strong>
                </p>
              </div>
              {srsStats.data.due > 0 && (
                <Button
                  size="sm"
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                  onClick={() => setLocation("/stories")}
                >
                  Review
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 text-center hover:shadow-lg transition">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Play className="w-6 h-6 text-amber-700" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Dual Subtitles</h3>
            <p className="text-gray-600">
              Watch with Italian and English subtitles synchronized to the video. Click any subtitle line to jump to that moment.
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Vocabulary</h3>
            <p className="text-gray-600">
              Words ranked by CEFR level (A1-B2) using the Kelly Italian frequency list. Learn the most useful words first.
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">FSRS Spaced Repetition</h3>
            <p className="text-gray-600">
              Rate words as you read. FSRS optimizes review intervals based on your memory. Export to Anki anytime.
            </p>
          </Card>

          <Card
            className="p-6 text-center hover:shadow-lg transition cursor-pointer"
            onClick={() => setLocation("/visual-dictionary")}
          >
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Image className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Visual Dictionary</h3>
            <p className="text-gray-600">
              Browse vocabulary by room — kitchen, school, outdoors. Tap words to hear pronunciation.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
