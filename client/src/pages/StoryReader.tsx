import { useState, useCallback, useRef, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, ArrowLeft, Coffee, Volume2, BookOpen, Eye, EyeOff, Pause, Play, CreditCard } from "lucide-react";

const getDifficultyColor = (level: string) => {
  if (level.includes("A1") && level.includes("A2")) return "bg-teal-100 text-teal-800";
  switch (level) {
    case "A1": return "bg-green-100 text-green-800";
    case "A2": return "bg-blue-100 text-blue-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const cefrBorderColor: Record<string, string> = {
  A1: "border-b-green-500",
  A2: "border-b-blue-500",
  B1: "border-b-orange-500",
  B2: "border-b-red-500",
};

const cefrBgColor: Record<string, string> = {
  A1: "bg-green-100 text-green-800",
  A2: "bg-blue-100 text-blue-800",
  B1: "bg-orange-100 text-orange-800",
  B2: "bg-red-100 text-red-800",
};

const posLabels: Record<string, string> = {
  n: "noun",
  v: "verb",
  adj: "adjective",
  adv: "adverb",
  prep: "preposition",
  conj: "conjunction",
  det: "determiner",
  pron: "pronoun",
  interj: "interjection",
  num: "numeral",
};

// Italian gender detection heuristics
function getGenderHint(word: string, pos: string): string | null {
  if (pos !== "n" && pos !== "adj" && pos !== "det") return null;
  const w = word.toLowerCase();
  if (w.endsWith("o") || w.endsWith("ore") || w.endsWith("iere")) return "m";
  if (w.endsWith("a") || w.endsWith("ione") || w.endsWith("tà") || w.endsWith("tù")) return "f";
  if (w.endsWith("e")) return "m/f";
  if (w.endsWith("i")) return "m.pl";
  return null;
}

// Verb tense detection
function getVerbTense(word: string): string | null {
  const w = word.toLowerCase();
  // Infinitive
  if (w.match(/(are|ere|ire)$/)) return "infinitive";
  // Past participle
  if (w.match(/(ato|uto|ito)$/)) return "past participle";
  // Gerund
  if (w.match(/(ando|endo)$/)) return "gerund";
  // Future (-rà, -rò, -rai, etc.)
  if (w.match(/(rà|rò|rai|remo|rete|ranno)$/)) return "future";
  // Imperfect (-ava, -eva, -iva)
  if (w.match(/(ava|avo|avi|avamo|avate|avano|eva|evo|evi|evamo|evate|evano|iva|ivo|ivi|ivamo|ivate|ivano)$/)) return "imperfect";
  // Common present endings
  if (w.match(/(iamo|ete|ite|ate|ono|ano)$/)) return "present";
  return null;
}

function speakWord(text: string) {
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "it-IT";
  utterance.rate = 0.75;
  speechSynthesis.speak(utterance);
}

// AnkiConnect helper (calls localhost:8765)
async function addToAnki(
  word: string,
  entry: { r: number; c: string; p: string },
  gender: string | null,
  tense: string | null,
  exampleLines: { italian: string; english: string }[],
  translation?: string
): Promise<{ ok: boolean; msg: string }> {
  const phrasesHtml = exampleLines
    .slice(0, 4)
    .map(
      (l) =>
        `<div style="margin-bottom:8px"><b>${l.italian}</b><br><i style="color:#666">${l.english}</i></div>`
    )
    .join("");

  const genderStr = gender === "m" ? "♂ maschile" : gender === "f" ? "♀ femminile" : gender || "";
  const posStr = posLabels[entry.p] || entry.p;
  const tenseStr = tense ? ` (${tense})` : "";
  const transLine = translation ? `<div style="font-size:20px;text-align:center;color:#333;margin-bottom:8px">${translation}</div>` : "";

  const front = `<div style="font-size:28px;text-align:center;margin-bottom:12px"><b>${word}</b></div>
<div style="text-align:center;color:#888">${entry.c} #${entry.r} · ${posStr}${tenseStr} ${genderStr}</div>`;

  const back = `<div style="font-size:28px;text-align:center;margin-bottom:8px"><b>${word}</b></div>
${transLine}
<div style="text-align:center;color:#888;margin-bottom:16px">${entry.c} · ${posStr}${tenseStr} ${genderStr}</div>
<hr style="margin:12px 0">
<div style="text-align:left">${phrasesHtml || "<i>No example phrases</i>"}</div>`;

  try {
    // Ensure deck + model exist
    await fetch("http://127.0.0.1:8765", {
      method: "POST",
      body: JSON.stringify({ action: "createDeck", version: 6, params: { deck: "CameraCafe::Stories" } }),
    });

    const res = await fetch("http://127.0.0.1:8765", {
      method: "POST",
      body: JSON.stringify({
        action: "addNote",
        version: 6,
        params: {
          note: {
            deckName: "CameraCafe::Stories",
            modelName: "Basic",
            fields: { Front: front, Back: back },
            options: { allowDuplicate: false },
            tags: ["camera-cafe", `cefr-${entry.c}`, entry.p],
          },
        },
      }),
    });
    const data = await res.json();
    if (data.error) {
      if (data.error.includes("duplicate")) return { ok: false, msg: "Already in Anki" };
      return { ok: false, msg: data.error };
    }
    return { ok: true, msg: "Added!" };
  } catch {
    return { ok: false, msg: "Anki not running — open Anki with AnkiConnect" };
  }
}

interface KellyEntry {
  r: number;
  c: string;
  p: string;
}

interface DictEntry { en: string; g?: string; emoji?: string; cat?: string }
interface IrregVerb { inf: string; en: string; tense: string; person: string }

function HighlightedLine({
  text,
  kelly,
  storyLines,
  dict,
  irregVerbs,
  onSrsReview,
}: {
  text: string;
  kelly: Record<string, KellyEntry>;
  storyLines: { italian: string; english: string }[];
  dict: Record<string, DictEntry>;
  irregVerbs: Record<string, IrregVerb>;
  onSrsReview?: (word: string, rating: number) => void;
}) {
  const [ankiStatus, setAnkiStatus] = useState<Record<string, { ok: boolean; msg: string }>>({});
  const tokens = text.split(/(\s+|[.,!?;:'"()«»""''…—–\-\[\]{}]+)/);

  return (
    <span>
      {tokens.map((token, idx) => {
        if (/^\s+$/.test(token) || /^[.,!?;:'"()«»""''…—–\-\[\]{}]+$/.test(token)) {
          return <span key={idx}>{token}</span>;
        }

        const clean = token.toLowerCase().replace(/[.,!?;:'"()«»""''…—–\-\[\]{}]/g, "");
        const entry = kelly[clean];
        const irregEntry = irregVerbs[clean];
        const dictEntry = dict[clean];

        // Show irregular verbs even if not in Kelly (è, ha, va, etc.)
        if (!entry && !irregEntry) {
          return <span key={idx}>{token}</span>;
        }
        if (entry && entry.r < 10 && !irregEntry && !dictEntry) {
          return <span key={idx}>{token}</span>;
        }

        // Use dictionary gender if available, else heuristic
        const dictGender = dictEntry?.g || null;
        const gender = dictGender || (entry ? getGenderHint(clean, entry.p) : null);
        // Use irregular verb tense if available, else regex
        const tense = irregEntry?.tense || (entry?.p === "v" ? getVerbTense(clean) : null);
        const translation = dictEntry?.en || irregEntry?.en || null;
        const borderClass = entry ? (cefrBorderColor[entry.c] || "border-b-gray-400") : "border-b-violet-400";

        return (
          <Popover key={idx}>
            <PopoverTrigger asChild>
              <span
                className={`border-b-2 ${borderClass} cursor-pointer hover:bg-amber-100 rounded-sm px-0.5 transition-colors`}
                onClick={(e) => e.stopPropagation()}
              >
                {token}
              </span>
            </PopoverTrigger>
            <PopoverContent
              className="w-72 p-3"
              side="top"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-2">
                {/* Emoji visual + category */}
                {dictEntry?.emoji && (
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{dictEntry.emoji}</span>
                    {dictEntry.cat && (
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                        {dictEntry.cat}
                      </span>
                    )}
                  </div>
                )}

                {/* Word + translation + speak */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold">{clean}</span>
                    {translation && (
                      <span className="text-sm text-gray-500 ml-2">— {translation}</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 flex-shrink-0"
                    onClick={() => speakWord(clean)}
                  >
                    <Volume2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* CEFR + rank (if in Kelly) */}
                {entry && (
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${cefrBgColor[entry.c] || "bg-gray-100"}`}>
                      {entry.c}
                    </span>
                    <span className="text-xs text-gray-500">#{entry.r}</span>
                    <span className="text-xs text-gray-500">{posLabels[entry.p] || entry.p}</span>
                  </div>
                )}

                {/* Irregular verb info */}
                {irregEntry && (
                  <div className="text-xs bg-violet-50 border border-violet-200 rounded px-2 py-1">
                    <span className="font-semibold text-violet-700">{irregEntry.tense}</span>
                    <span className="text-violet-500"> of </span>
                    <span className="font-bold text-violet-800">{irregEntry.inf}</span>
                    <span className="text-violet-400 ml-1">({irregEntry.person})</span>
                  </div>
                )}

                {/* Gender hint */}
                {gender && (
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                      gender === "m" ? "bg-blue-100 text-blue-700 border border-blue-200" :
                      gender === "f" ? "bg-pink-100 text-pink-700 border border-pink-200" :
                      gender === "m.pl" || gender === "m" ? "bg-blue-100 text-blue-700 border border-blue-200" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {gender === "m" ? "♂ maschile" :
                       gender === "f" ? "♀ femminile" :
                       gender === "m/f" ? "♂/♀" :
                       gender === "m.pl" ? "♂ pl." : gender}
                    </span>
                  </div>
                )}

                {/* Verb tense (non-irregular) */}
                {tense && !irregEntry && (
                  <div className="text-xs text-purple-600 font-medium">
                    {tense}
                  </div>
                )}

                {/* Example phrases from story */}
                {(() => {
                  const examples = storyLines.filter((l) =>
                    l.italian.toLowerCase().includes(clean)
                  ).slice(0, 2);
                  return examples.length > 0 ? (
                    <div className="border-t pt-2 mt-1 space-y-1">
                      {examples.map((ex, ei) => (
                        <div key={ei} className="text-xs">
                          <p className="text-gray-700">{ex.italian}</p>
                          <p className="text-gray-400 italic">{ex.english}</p>
                        </div>
                      ))}
                    </div>
                  ) : null;
                })()}

                {/* SRS rating + Add to Anki */}
                <div className="border-t pt-2 mt-1">
                  {onSrsReview && (
                    <div className="flex gap-1 mb-2">
                      <span className="text-xs text-gray-400 mr-1 self-center">Know it?</span>
                      {[
                        { r: 1, label: "No", cls: "text-red-600 hover:bg-red-50" },
                        { r: 2, label: "Hmm", cls: "text-orange-600 hover:bg-orange-50" },
                        { r: 3, label: "Yes", cls: "text-green-600 hover:bg-green-50" },
                        { r: 4, label: "Easy", cls: "text-blue-600 hover:bg-blue-50" },
                      ].map((btn) => (
                        <Button
                          key={btn.r}
                          variant="ghost"
                          size="sm"
                          className={`h-6 px-2 text-xs font-medium ${btn.cls}`}
                          onClick={() => onSrsReview(clean, btn.r)}
                        >
                          {btn.label}
                        </Button>
                      ))}
                    </div>
                  )}
                  {ankiStatus[clean] ? (
                    <div className={`text-xs font-medium ${ankiStatus[clean].ok ? "text-green-600" : "text-red-500"}`}>
                      {ankiStatus[clean].msg}
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-7"
                      onClick={async () => {
                        const examples = storyLines.filter((l) =>
                          l.italian.toLowerCase().includes(clean)
                        );
                        const result = await addToAnki(clean, entry, gender, tense, examples, translation || undefined);
                        setAnkiStatus((prev) => ({ ...prev, [clean]: result }));
                      }}
                    >
                      <CreditCard className="w-3 h-3 mr-1" /> Add to Anki
                    </Button>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        );
      })}
    </span>
  );
}

function StoryReinforcement({
  lines,
  kelly,
}: {
  lines: { italian: string; english: string }[];
  kelly: Record<string, KellyEntry>;
}) {
  const [quizRevealed, setQuizRevealed] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState<"vocab" | "grammar" | "practice" | "quiz">("vocab");
  const [ankiAdded, setAnkiAdded] = useState<Record<string, { ok: boolean; msg: string }>>({});
  const [bulkAdding, setBulkAdding] = useState(false);
  const [clozeAnswers, setClozeAnswers] = useState<Record<number, string | null>>({});
  const [clozeScore, setClozeScore] = useState({ correct: 0, total: 0 });

  // Extract all unique Kelly words from the story
  const storyWords = useMemo(() => {
    const seen = new Set<string>();
    const words: { word: string; entry: KellyEntry; gender: string | null; tense: string | null }[] = [];
    for (const line of lines) {
      const tokens = line.italian
        .toLowerCase()
        .replace(/[.,!?;:'"()«»""''…—–\-\[\]{}]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 1);
      for (const t of tokens) {
        if (seen.has(t)) continue;
        const entry = kelly[t];
        if (!entry || entry.r < 10) continue;
        seen.add(t);
        words.push({
          word: t,
          entry,
          gender: getGenderHint(t, entry.p),
          tense: entry.p === "v" ? getVerbTense(t) : null,
        });
      }
    }
    return words.sort((a, b) => a.entry.r - b.entry.r);
  }, [lines, kelly]);

  // Group by CEFR level
  const byLevel = useMemo(() => {
    const groups: Record<string, typeof storyWords> = {};
    for (const w of storyWords) {
      (groups[w.entry.c] ??= []).push(w);
    }
    return groups;
  }, [storyWords]);

  // Extract grammar patterns
  const grammarPatterns = useMemo(() => {
    const patterns: { rule: string; examples: string[]; color: string }[] = [];

    // Nouns by gender
    const masc = storyWords.filter((w) => w.gender === "m" && w.entry.p === "n");
    const fem = storyWords.filter((w) => w.gender === "f" && w.entry.p === "n");
    if (masc.length > 0) {
      patterns.push({
        rule: "Masculine nouns end in -o (plural: -i)",
        examples: masc.slice(0, 5).map((w) => w.word),
        color: "border-blue-300 bg-blue-50",
      });
    }
    if (fem.length > 0) {
      patterns.push({
        rule: "Feminine nouns end in -a (plural: -e)",
        examples: fem.slice(0, 5).map((w) => w.word),
        color: "border-pink-300 bg-pink-50",
      });
    }

    // Verbs by tense
    const verbs = storyWords.filter((w) => w.entry.p === "v");
    const infinitives = verbs.filter((w) => w.tense === "infinitive");
    const pastParts = verbs.filter((w) => w.tense === "past participle");
    const presents = verbs.filter((w) => w.tense === "present");

    if (infinitives.length > 0) {
      const areVerbs = infinitives.filter((w) => w.word.endsWith("are"));
      const ereVerbs = infinitives.filter((w) => w.word.endsWith("ere"));
      const ireVerbs = infinitives.filter((w) => w.word.endsWith("ire"));
      if (areVerbs.length > 0) {
        patterns.push({
          rule: "-ARE verbs (1st conjugation): the most common",
          examples: areVerbs.slice(0, 5).map((w) => w.word),
          color: "border-purple-300 bg-purple-50",
        });
      }
      if (ereVerbs.length > 0) {
        patterns.push({
          rule: "-ERE verbs (2nd conjugation)",
          examples: ereVerbs.slice(0, 5).map((w) => w.word),
          color: "border-purple-300 bg-purple-50",
        });
      }
      if (ireVerbs.length > 0) {
        patterns.push({
          rule: "-IRE verbs (3rd conjugation)",
          examples: ireVerbs.slice(0, 5).map((w) => w.word),
          color: "border-purple-300 bg-purple-50",
        });
      }
    }

    if (pastParts.length > 0) {
      patterns.push({
        rule: "Past participles end in -ato, -uto, -ito",
        examples: pastParts.slice(0, 5).map((w) => w.word),
        color: "border-amber-300 bg-amber-50",
      });
    }

    // Adjectives
    const adjs = storyWords.filter((w) => w.entry.p === "adj");
    if (adjs.length > 0) {
      patterns.push({
        rule: "Adjectives agree with noun gender: -o (m) / -a (f)",
        examples: adjs.slice(0, 5).map((w) => w.word),
        color: "border-teal-300 bg-teal-50",
      });
    }

    return patterns;
  }, [storyWords]);

  // Quiz: random lines
  const quizLines = useMemo(() => {
    const shuffled = [...lines].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(10, lines.length));
  }, [lines]);

  // Cloze exercises: pick sentences with Kelly words, remove the word, generate distractors
  const clozeExercises = useMemo(() => {
    const exercises: {
      sentence: string;
      english: string;
      answer: string;
      blank: string;
      options: string[];
    }[] = [];

    const usedLines = new Set<number>();
    const shuffledWords = [...storyWords].sort(() => Math.random() - 0.5);

    for (const w of shuffledWords) {
      if (exercises.length >= 10) break;

      // Find a line containing this word
      const lineIdx = lines.findIndex((l, i) => {
        if (usedLines.has(i)) return false;
        return l.italian.toLowerCase().includes(w.word);
      });
      if (lineIdx === -1) continue;
      usedLines.add(lineIdx);

      const line = lines[lineIdx];
      // Create blank by replacing the word (case-insensitive, first occurrence)
      const regex = new RegExp(`\\b${w.word}\\b`, "i");
      const blank = line.italian.replace(regex, "______");
      if (blank === line.italian) continue; // word boundary didn't match

      // Generate distractors: same POS, different CEFR or nearby rank
      const distractors = storyWords
        .filter((d) => d.word !== w.word && d.entry.p === w.entry.p)
        .sort(() => Math.random() - 0.5)
        .slice(0, 2)
        .map((d) => d.word);

      // If not enough same-POS distractors, grab any
      while (distractors.length < 2) {
        const rand = storyWords[Math.floor(Math.random() * storyWords.length)];
        if (rand.word !== w.word && !distractors.includes(rand.word)) {
          distractors.push(rand.word);
        }
      }

      // Shuffle options
      const options = [w.word, ...distractors].sort(() => Math.random() - 0.5);

      exercises.push({
        sentence: line.italian,
        english: line.english,
        answer: w.word,
        blank,
        options,
      });
    }
    return exercises;
  }, [lines, storyWords]);

  return (
    <div className="mt-12 border-t-2 border-amber-200 pt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
        Reinforce What You Learned
      </h2>
      <p className="text-gray-500 text-center text-sm mb-6">
        Review vocabulary, grammar patterns, and test yourself
      </p>

      {/* Tabs */}
      <div className="flex gap-2 justify-center mb-6">
        {(["vocab", "grammar", "practice", "quiz"] as const).map((tab) => (
          <Button
            key={tab}
            size="sm"
            variant={activeTab === tab ? "default" : "outline"}
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? "bg-amber-700 hover:bg-amber-800" : ""}
          >
            {tab === "vocab" ? "Key Words" : tab === "grammar" ? "Grammar" : tab === "practice" ? "Practice" : "Quick Quiz"}
          </Button>
        ))}
      </div>

      {/* Vocabulary tab */}
      {activeTab === "vocab" && (
        <div className="space-y-6">
          <div className="text-center">
            <Button
              size="sm"
              variant="outline"
              disabled={bulkAdding}
              onClick={async () => {
                setBulkAdding(true);
                for (const w of storyWords) {
                  if (ankiAdded[w.word]) continue;
                  const examples = lines.filter((l) =>
                    l.italian.toLowerCase().includes(w.word)
                  );
                  const result = await addToAnki(w.word, w.entry, w.gender, w.tense, examples);
                  setAnkiAdded((prev) => ({ ...prev, [w.word]: result }));
                }
                setBulkAdding(false);
              }}
            >
              <CreditCard className="w-3 h-3 mr-1" />
              {bulkAdding ? "Adding..." : `Add All ${storyWords.length} Words to Anki`}
            </Button>
          </div>
          {Object.entries(byLevel).map(([level, words]) => (
            <div key={level}>
              <h3 className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${cefrBgColor[level] || "bg-gray-100"}`}>
                  {level}
                </span>
                <span className="text-sm text-gray-500">{words.length} words</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {words.map((w) => (
                  <Card
                    key={w.word}
                    className="p-3 hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="font-semibold text-gray-900 cursor-pointer"
                        onClick={() => speakWord(w.word)}
                      >
                        {w.word}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => speakWord(w.word)}
                        >
                          <Volume2 className="w-3 h-3 text-gray-400" />
                        </Button>
                        {ankiAdded[w.word] ? (
                          <span className={`text-xs ${ankiAdded[w.word].ok ? "text-green-600" : "text-red-500"}`}>
                            {ankiAdded[w.word].ok ? "+" : "!"}
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={async () => {
                              const examples = lines.filter((l) =>
                                l.italian.toLowerCase().includes(w.word)
                              );
                              const result = await addToAnki(w.word, w.entry, w.gender, w.tense, examples);
                              setAnkiAdded((prev) => ({ ...prev, [w.word]: result }));
                            }}
                          >
                            <CreditCard className="w-3 h-3 text-gray-400" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-xs text-gray-500">{posLabels[w.entry.p] || w.entry.p}</span>
                      {w.gender && (
                        <span className={`text-xs px-1 rounded ${
                          w.gender === "m" || w.gender === "m.pl" ? "bg-blue-100 text-blue-700" :
                          w.gender === "f" ? "bg-pink-100 text-pink-700" : "text-gray-500"
                        }`}>
                          {w.gender === "m" ? "♂" : w.gender === "f" ? "♀" : w.gender === "m.pl" ? "♂pl" : "♂/♀"}
                        </span>
                      )}
                      {w.tense && (
                        <span className="text-xs text-purple-600">{w.tense}</span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grammar tab */}
      {activeTab === "grammar" && (
        <div className="space-y-4">
          {grammarPatterns.length === 0 ? (
            <p className="text-center text-gray-500">No grammar patterns extracted</p>
          ) : (
            grammarPatterns.map((p, i) => (
              <Card key={i} className={`p-4 border-l-4 ${p.color}`}>
                <h4 className="font-semibold text-gray-900 mb-2">{p.rule}</h4>
                <div className="flex flex-wrap gap-2">
                  {p.examples.map((ex) => (
                    <span
                      key={ex}
                      className="px-2 py-1 bg-white rounded border text-sm font-medium cursor-pointer hover:bg-gray-50"
                      onClick={() => speakWord(ex)}
                    >
                      {ex} <Volume2 className="w-3 h-3 inline text-gray-400 ml-1" />
                    </span>
                  ))}
                </div>
              </Card>
            ))
          )}

          {/* Gender rule card */}
          <Card className="p-4 border-l-4 border-gray-300 bg-gray-50">
            <h4 className="font-semibold text-gray-900 mb-2">Gender Quick Reference</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-blue-50 rounded p-3 border border-blue-200">
                <p className="font-bold text-blue-700 mb-1">♂ Maschile</p>
                <p className="text-blue-600">Ends in <strong>-o</strong> (singular)</p>
                <p className="text-blue-600">Ends in <strong>-i</strong> (plural)</p>
                <p className="text-blue-500 text-xs mt-1">il ragazzo → i ragazzi</p>
              </div>
              <div className="bg-pink-50 rounded p-3 border border-pink-200">
                <p className="font-bold text-pink-700 mb-1">♀ Femminile</p>
                <p className="text-pink-600">Ends in <strong>-a</strong> (singular)</p>
                <p className="text-pink-600">Ends in <strong>-e</strong> (plural)</p>
                <p className="text-pink-500 text-xs mt-1">la ragazza → le ragazze</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Practice tab — fill-in-the-blank */}
      {activeTab === "practice" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 text-center mb-4">
            Fill in the missing word. This tests active recall — harder than recognition!
          </p>
          {clozeExercises.length === 0 ? (
            <p className="text-center text-gray-400">Not enough words to generate exercises</p>
          ) : (
            <>
              {clozeScore.total > 0 && (
                <div className="text-center mb-4">
                  <span className={`text-lg font-bold ${clozeScore.correct === clozeScore.total ? "text-green-600" : "text-amber-600"}`}>
                    {clozeScore.correct}/{clozeScore.total}
                  </span>
                  <span className="text-sm text-gray-400 ml-2">correct</span>
                </div>
              )}
              {clozeExercises.map((ex, i) => {
                const chosen = clozeAnswers[i];
                const isCorrect = chosen === ex.answer;
                const isAnswered = chosen !== undefined && chosen !== null;

                return (
                  <Card
                    key={i}
                    className={`p-4 transition ${
                      isAnswered
                        ? isCorrect
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                        : "bg-white"
                    }`}
                  >
                    <p className="text-lg text-gray-900 font-medium mb-1">{ex.blank}</p>
                    <p className="text-xs text-gray-400 italic mb-3">{ex.english}</p>

                    <div className="flex gap-2 flex-wrap">
                      {ex.options.map((opt) => {
                        const isThis = chosen === opt;
                        const isRight = opt === ex.answer;
                        let cls = "border-gray-200 hover:border-amber-400 hover:bg-amber-50";
                        if (isAnswered) {
                          if (isRight) cls = "border-green-500 bg-green-100 text-green-800 font-bold";
                          else if (isThis && !isRight) cls = "border-red-400 bg-red-100 text-red-700 line-through";
                          else cls = "border-gray-200 opacity-50";
                        }

                        return (
                          <Button
                            key={opt}
                            variant="outline"
                            size="sm"
                            disabled={isAnswered}
                            className={`text-sm ${cls}`}
                            onClick={() => {
                              setClozeAnswers((prev) => ({ ...prev, [i]: opt }));
                              setClozeScore((prev) => ({
                                correct: prev.correct + (opt === ex.answer ? 1 : 0),
                                total: prev.total + 1,
                              }));
                            }}
                          >
                            {opt}
                          </Button>
                        );
                      })}
                    </div>

                    {isAnswered && !isCorrect && (
                      <p className="text-xs text-red-500 mt-2">
                        Correct answer: <strong>{ex.answer}</strong>
                      </p>
                    )}
                    {isAnswered && isCorrect && (
                      <p className="text-xs text-green-600 mt-2">Correct!</p>
                    )}
                  </Card>
                );
              })}
              <div className="text-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setClozeAnswers({});
                    setClozeScore({ correct: 0, total: 0 });
                  }}
                >
                  New Exercises
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Quiz tab */}
      {activeTab === "quiz" && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 text-center mb-4">
            Click each card to reveal the English translation
          </p>
          {quizLines.map((line, i) => (
            <Card
              key={i}
              className={`p-4 cursor-pointer transition hover:shadow-md ${
                quizRevealed[i] ? "bg-green-50 border-green-200" : "bg-white"
              }`}
              onClick={() => setQuizRevealed((prev) => ({ ...prev, [i]: !prev[i] }))}
            >
              <p className="text-lg text-gray-900 font-medium">{line.italian}</p>
              {quizRevealed[i] ? (
                <p className="text-sm text-green-700 mt-2">{line.english}</p>
              ) : (
                <p className="text-sm text-gray-400 mt-2 italic">Tap to reveal...</p>
              )}
            </Card>
          ))}
          <div className="text-center mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuizRevealed({})}
            >
              Reset Quiz
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StoryReader() {
  const [, setLocation] = useLocation();
  const params = useParams<{ storyId: string }>();
  const [showEnglish, setShowEnglish] = useState(true);
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [playingAll, setPlayingAll] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const stopRef = useRef(false);

  const storyQuery = trpc.stories.get.useQuery(
    { id: params.storyId || "" },
    { enabled: !!params.storyId }
  );
  const kellyQuery = trpc.kelly.lookup.useQuery();
  const dictQuery = trpc.dictionary.lookup.useQuery();
  const verbsQuery = trpc.dictionary.verbs.useQuery();
  const srsReview = trpc.srs.review.useMutation();

  const story = storyQuery.data;
  const kelly = kellyQuery.data || {};
  const dict = (dictQuery.data || {}) as Record<string, DictEntry>;
  const irregVerbs = (verbsQuery.data || {}) as Record<string, IrregVerb>;

  const handleSrsReview = useCallback((word: string, rating: number) => {
    srsReview.mutate({ word, rating, storyId: params.storyId });
  }, [srsReview, params.storyId]);

  const playAll = useCallback(async () => {
    if (!story || playingAll) return;
    setPlayingAll(true);
    setPaused(false);
    pausedRef.current = false;
    stopRef.current = false;
    speechSynthesis.cancel();

    for (let i = 0; i < story.lines.length; i++) {
      if (stopRef.current) break;

      // Wait while paused
      while (pausedRef.current) {
        await new Promise((r) => setTimeout(r, 100));
        if (stopRef.current) break;
      }
      if (stopRef.current) break;

      setActiveLine(i);
      const el = document.getElementById(`line-${i}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });

      await new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(story.lines[i].italian);
        utterance.lang = "it-IT";
        utterance.rate = 0.8;
        utterance.onend = () => setTimeout(resolve, 600);
        utterance.onerror = () => resolve();
        speechSynthesis.speak(utterance);
      });
    }
    setPlayingAll(false);
    setPaused(false);
    setActiveLine(null);
  }, [story, playingAll]);

  const togglePause = () => {
    if (paused) {
      pausedRef.current = false;
      setPaused(false);
      speechSynthesis.resume();
    } else {
      pausedRef.current = true;
      setPaused(true);
      speechSynthesis.pause();
    }
  };

  const stopPlaying = () => {
    stopRef.current = true;
    pausedRef.current = false;
    speechSynthesis.cancel();
    setPlayingAll(false);
    setPaused(false);
    setActiveLine(null);
  };

  if (storyQuery.isLoading || kellyQuery.isLoading || dictQuery.isLoading || verbsQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Story not found</p>
          <Button onClick={() => setLocation("/stories")}>Back to Stories</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/stories")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Stories
          </Button>
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-700" />
            <span className="font-semibold text-sm">{story.title}</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getDifficultyColor(story.level)}`}>
            {story.level}
          </span>
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEnglish(!showEnglish)}
            >
              {showEnglish ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
              {showEnglish ? "Hide EN" : "Show EN"}
            </Button>
            {playingAll ? (
              <>
                <Button size="sm" variant="outline" onClick={togglePause}>
                  {paused ? <Play className="w-3 h-3 mr-1" /> : <Pause className="w-3 h-3 mr-1" />}
                  {paused ? "Resume" : "Pause"}
                </Button>
                <Button size="sm" variant="destructive" onClick={stopPlaying}>
                  Stop
                </Button>
              </>
            ) : (
              <Button size="sm" className="bg-amber-700 hover:bg-amber-800 text-white" onClick={playAll}>
                <Volume2 className="w-3 h-3 mr-1" /> Play All
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Legend */}
      <div className="max-w-3xl mx-auto px-4 pt-4">
        <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
          <span className="flex items-center gap-1"><span className="w-4 border-b-2 border-green-500 inline-block" /> A1</span>
          <span className="flex items-center gap-1"><span className="w-4 border-b-2 border-blue-500 inline-block" /> A2</span>
          <span className="flex items-center gap-1"><span className="w-4 border-b-2 border-orange-500 inline-block" /> B1</span>
          <span className="flex items-center gap-1"><span className="w-4 border-b-2 border-red-500 inline-block" /> B2</span>
          <span className="flex items-center gap-1"><span className="w-4 border-b-2 border-violet-400 inline-block" /> irregular verb</span>
          <span className="text-gray-400">Click any underlined word for details</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Story header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{story.title}</h1>
          <p className="text-gray-500">{story.englishTitle}</p>
          <p className="text-sm text-gray-400 mt-2">{story.lines.length} sentences</p>
        </div>

        {/* Lines */}
        <div className="space-y-2">
          {story.lines.map((line, i) => (
            <Card
              key={i}
              id={`line-${i}`}
              className={`p-4 transition-all cursor-pointer hover:shadow-md ${
                activeLine === i
                  ? "ring-2 ring-amber-500 bg-amber-50"
                  : "bg-white"
              }`}
              onClick={() => {
                speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(line.italian);
                utterance.lang = "it-IT";
                utterance.rate = 0.8;
                speechSynthesis.speak(utterance);
              }}
            >
              <div className="flex items-start gap-3">
                <span className="text-xs text-gray-300 font-mono mt-1 w-6 text-right flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-lg text-gray-900 leading-relaxed">
                    <HighlightedLine text={line.italian} kelly={kelly} storyLines={story.lines} dict={dict} irregVerbs={irregVerbs} onSrsReview={handleSrsReview} />
                  </p>
                  {showEnglish && line.english && (
                    <p className="text-sm text-blue-600 mt-1 leading-relaxed">
                      {line.english}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0 text-gray-400 hover:text-amber-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    speechSynthesis.cancel();
                    const utterance = new SpeechSynthesisUtterance(line.italian);
                    utterance.lang = "it-IT";
                    utterance.rate = 0.8;
                    speechSynthesis.speak(utterance);
                  }}
                >
                  <Volume2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Reinforcement Section */}
        <StoryReinforcement lines={story.lines} kelly={kelly} />

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 text-sm mb-4">End of story</p>
          <Button variant="outline" onClick={() => setLocation("/stories")}>
            <BookOpen className="w-4 h-4 mr-1" /> More Stories
          </Button>
        </div>
      </div>
    </div>
  );
}
