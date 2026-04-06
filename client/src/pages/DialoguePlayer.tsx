import { useState, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Loader2,
  ArrowLeft,
  Coffee,
  Volume2,
  Eye,
  EyeOff,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ChevronRight,
} from "lucide-react";

function speak(text: string) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "it-IT";
  u.rate = 0.85;
  speechSynthesis.speak(u);
}

type Mode = "read" | "practice" | "roleplay";

export default function DialoguePlayer() {
  const [, setLocation] = useLocation();
  const params = useParams<{ dialogueId: string }>();
  const dialogueQuery = trpc.dialogues.get.useQuery({ id: params.dialogueId! });
  const dialogue = dialogueQuery.data;

  const [mode, setMode] = useState<Mode>("read");
  const [visibleLines, setVisibleLines] = useState(1);
  const [hideEnglish, setHideEnglish] = useState(false);
  const [hideItalian, setHideItalian] = useState(false);

  // Practice mode state
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [practiceScore, setPracticeScore] = useState({ correct: 0, total: 0 });

  // Role-play mode state
  const [roleplayIndex, setRoleplayIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [roleplayFeedback, setRoleplayFeedback] = useState<"correct" | "close" | "wrong" | null>(null);

  const characters = useMemo(() => {
    if (!dialogue) return {};
    const map: Record<string, { name: string; emoji: string; isYou: boolean }> = {};
    for (const c of dialogue.characters) {
      map[c.id] = { name: c.name, emoji: c.emoji, isYou: c.id === "you" };
    }
    return map;
  }, [dialogue]);

  if (dialogueQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!dialogue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Dialogue not found</p>
      </div>
    );
  }

  const currentPractice = dialogue.practicePrompts[practiceIndex];
  const roleplayLines = dialogue.lines.filter((_, i) => i <= roleplayIndex);
  const currentRoleplayLine = dialogue.lines[roleplayIndex];
  const isYourTurn = currentRoleplayLine && characters[currentRoleplayLine.speaker]?.isYou;

  function checkRoleplay() {
    if (!currentRoleplayLine) return;
    const norm = (s: string) => s.toLowerCase().replace(/[^a-zàèéìòù\s]/g, "").trim();
    const answer = norm(currentRoleplayLine.italian);
    const input = norm(userInput);
    if (input === answer) {
      setRoleplayFeedback("correct");
    } else if (answer.includes(input) || input.includes(answer.split(" ").slice(0, 3).join(" "))) {
      setRoleplayFeedback("close");
    } else {
      setRoleplayFeedback("wrong");
    }
  }

  function advanceRoleplay() {
    setRoleplayFeedback(null);
    setUserInput("");
    if (roleplayIndex < dialogue!.lines.length - 1) {
      setRoleplayIndex(roleplayIndex + 1);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/dialogues")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-700" />
            <span className="font-semibold text-sm truncate">{dialogue.title}</span>
          </div>
          <div className="ml-auto flex gap-1">
            <Button
              variant={mode === "read" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("read")}
              className={mode === "read" ? "bg-amber-700 hover:bg-amber-800 text-white" : ""}
            >
              Read
            </Button>
            <Button
              variant={mode === "roleplay" ? "default" : "ghost"}
              size="sm"
              onClick={() => { setMode("roleplay"); setRoleplayIndex(0); setUserInput(""); setRoleplayFeedback(null); }}
              className={mode === "roleplay" ? "bg-violet-600 hover:bg-violet-700 text-white" : ""}
            >
              Role-Play
            </Button>
            <Button
              variant={mode === "practice" ? "default" : "ghost"}
              size="sm"
              onClick={() => { setMode("practice"); setPracticeIndex(0); setShowAnswer(false); setPracticeScore({ correct: 0, total: 0 }); }}
              className={mode === "practice" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
            >
              Quiz
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Scenario */}
        <Card className="p-4 mb-6 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-900">{dialogue.scenario}</p>
              <div className="flex gap-4 mt-2">
                {dialogue.characters.map((c) => (
                  <span key={c.id} className="text-xs text-amber-700">
                    {c.emoji} {c.name} — {c.role}
                  </span>
                ))}
              </div>
              <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-amber-200 text-amber-800 font-semibold">
                {dialogue.level} · {dialogue.gcseTheme}
              </span>
            </div>
          </div>
        </Card>

        {/* ─── READ MODE ─── */}
        {mode === "read" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setHideEnglish(!hideEnglish)}>
                  {hideEnglish ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                  English
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setHideItalian(!hideItalian)}>
                  {hideItalian ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                  Italian
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setVisibleLines(1)}>
                  <RotateCcw className="w-4 h-4 mr-1" /> Reset
                </Button>
                {visibleLines < dialogue.lines.length && (
                  <Button
                    size="sm"
                    className="bg-amber-700 hover:bg-amber-800 text-white"
                    onClick={() => setVisibleLines(Math.min(visibleLines + 1, dialogue.lines.length))}
                  >
                    <SkipForward className="w-4 h-4 mr-1" /> Next
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {dialogue.lines.slice(0, visibleLines).map((line, i) => {
                const char = characters[line.speaker];
                const isRight = char?.isYou;
                return (
                  <div
                    key={i}
                    className={`flex ${isRight ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 cursor-pointer transition hover:shadow-md ${
                        isRight
                          ? "bg-amber-100 text-amber-900 rounded-br-sm"
                          : "bg-white border border-gray-200 rounded-bl-sm"
                      }`}
                      onClick={() => speak(line.italian)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{char?.emoji}</span>
                        <span className="text-xs font-semibold text-gray-500">{char?.name}</span>
                        <Volume2 className="w-3 h-3 text-gray-400" />
                      </div>
                      {!hideItalian && (
                        <p className="font-medium">{line.italian}</p>
                      )}
                      {!hideEnglish && (
                        <p className={`text-sm mt-1 ${hideItalian ? "font-medium" : "text-gray-500 italic"}`}>
                          {line.english}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {visibleLines >= dialogue.lines.length && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 mb-3">Dialogue complete! Try Role-Play or Quiz mode.</p>
                <div className="flex gap-3 justify-center">
                  <Button
                    className="bg-violet-600 hover:bg-violet-700 text-white"
                    onClick={() => { setMode("roleplay"); setRoleplayIndex(0); }}
                  >
                    Try Role-Play
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setMode("practice"); setPracticeIndex(0); setShowAnswer(false); }}
                  >
                    Take Quiz
                  </Button>
                </div>
              </div>
            )}

            {/* Key Vocabulary */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Key Vocabulary</h3>
              <div className="flex flex-wrap gap-2">
                {dialogue.keyVocab.map((word) => (
                  <button
                    key={word}
                    onClick={() => speak(word)}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-medium hover:bg-amber-50 hover:border-amber-300 transition"
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ─── ROLE-PLAY MODE ─── */}
        {mode === "roleplay" && (
          <div className="space-y-3">
            {roleplayLines.map((line, i) => {
              const char = characters[line.speaker];
              const isRight = char?.isYou;
              const isCurrent = i === roleplayIndex;
              return (
                <div
                  key={i}
                  className={`flex ${isRight ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      isRight
                        ? "bg-amber-100 text-amber-900 rounded-br-sm"
                        : "bg-white border border-gray-200 rounded-bl-sm"
                    } ${isCurrent && !isRight ? "ring-2 ring-blue-300" : ""}`}
                    onClick={() => !isCurrent && speak(line.italian)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{char?.emoji}</span>
                      <span className="text-xs font-semibold text-gray-500">{char?.name}</span>
                    </div>
                    {isCurrent && isRight && !roleplayFeedback ? (
                      <p className="text-sm text-gray-400 italic">{line.english}</p>
                    ) : (
                      <>
                        <p className="font-medium">{line.italian}</p>
                        <p className="text-sm text-gray-500 italic mt-1">{line.english}</p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Input for your turn */}
            {isYourTurn && !roleplayFeedback && roleplayIndex < dialogue.lines.length && (
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && checkRoleplay()}
                  placeholder="Type the Italian..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  autoFocus
                />
                <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={checkRoleplay}>
                  Check
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setRoleplayFeedback("wrong"); }}>
                  Skip
                </Button>
              </div>
            )}

            {/* Auto-advance for NPC lines */}
            {!isYourTurn && roleplayIndex < dialogue.lines.length && (
              <div className="mt-4 flex justify-center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    speak(currentRoleplayLine.italian);
                    setTimeout(advanceRoleplay, 500);
                  }}
                >
                  <Volume2 className="w-4 h-4 mr-1" /> Listen & Continue
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}

            {/* Feedback */}
            {roleplayFeedback && (
              <div className={`mt-3 p-3 rounded-lg flex items-center gap-3 ${
                roleplayFeedback === "correct" ? "bg-green-50 border border-green-200" :
                roleplayFeedback === "close" ? "bg-yellow-50 border border-yellow-200" :
                "bg-red-50 border border-red-200"
              }`}>
                {roleplayFeedback === "correct" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : roleplayFeedback === "close" ? (
                  <CheckCircle2 className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {roleplayFeedback === "correct" ? "Perfetto!" :
                     roleplayFeedback === "close" ? "Almost! Close enough." :
                     "Not quite."}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Answer:</strong> {currentRoleplayLine?.italian}
                  </p>
                </div>
                <Button size="sm" onClick={advanceRoleplay}>
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}

            {roleplayIndex >= dialogue.lines.length - 1 && roleplayFeedback && (
              <div className="mt-6 text-center">
                <p className="text-gray-600 mb-3">Dialogue complete! Well done!</p>
                <Button variant="outline" onClick={() => { setRoleplayIndex(0); setUserInput(""); setRoleplayFeedback(null); }}>
                  <RotateCcw className="w-4 h-4 mr-1" /> Try Again
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ─── PRACTICE / QUIZ MODE ─── */}
        {mode === "practice" && (
          <div>
            {practiceIndex < dialogue.practicePrompts.length ? (
              <Card className="p-6">
                <p className="text-sm text-gray-500 mb-1">
                  Question {practiceIndex + 1} of {dialogue.practicePrompts.length}
                </p>
                <p className="text-lg font-medium text-gray-900 mb-6">
                  {currentPractice.prompt}
                </p>

                {showAnswer ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="font-medium text-green-900">{currentPractice.answer}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-2"
                        onClick={() => speak(currentPractice.answer)}
                      >
                        <Volume2 className="w-4 h-4 mr-1" /> Listen
                      </Button>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => {
                          setPracticeScore({ correct: practiceScore.correct + 1, total: practiceScore.total + 1 });
                          setShowAnswer(false);
                          setPracticeIndex(practiceIndex + 1);
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" /> I knew it
                      </Button>
                      <Button
                        className="flex-1"
                        variant="outline"
                        onClick={() => {
                          setPracticeScore({ ...practiceScore, total: practiceScore.total + 1 });
                          setShowAnswer(false);
                          setPracticeIndex(practiceIndex + 1);
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-1" /> I didn't know
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    className="w-full bg-amber-700 hover:bg-amber-800 text-white"
                    onClick={() => setShowAnswer(true)}
                  >
                    Show Answer
                  </Button>
                )}
              </Card>
            ) : (
              <Card className="p-6 text-center">
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  {practiceScore.correct}/{practiceScore.total}
                </p>
                <p className="text-gray-600 mb-4">
                  {practiceScore.correct === practiceScore.total
                    ? "Perfect score! Bravo!"
                    : practiceScore.correct >= practiceScore.total / 2
                    ? "Good job! Keep practising."
                    : "Keep going! Review the dialogue and try again."}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => { setPracticeIndex(0); setShowAnswer(false); setPracticeScore({ correct: 0, total: 0 }); }}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" /> Retry
                  </Button>
                  <Button
                    className="bg-amber-700 hover:bg-amber-800 text-white"
                    onClick={() => { setMode("read"); setVisibleLines(dialogue.lines.length); }}
                  >
                    Review Dialogue
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
