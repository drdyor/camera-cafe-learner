import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, BookOpen, Loader2, Volume2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

interface WordInfo {
  word: string;
  translation: string;
  cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  frequencyRank: number;
  partOfSpeech?: string;
  context?: string;
}

// Simple Italian verb conjugation helper
function getConjugations(infinitive: string): { tense: string; forms: { pronoun: string; form: string }[] }[] | null {
  const word = infinitive.toLowerCase().trim();

  // Only conjugate verbs (infinitive forms ending in -are, -ere, -ire)
  if (!word.match(/(are|ere|ire)$/)) return null;

  const stem = word.slice(0, -3);
  const ending = word.slice(-3);

  // Common irregular verbs
  const irregulars: Record<string, { present: string[]; past: string; future: string[] }> = {
    essere: { present: ["sono", "sei", "è", "siamo", "siete", "sono"], past: "stato/a", future: ["sarò", "sarai", "sarà", "saremo", "sarete", "saranno"] },
    avere: { present: ["ho", "hai", "ha", "abbiamo", "avete", "hanno"], past: "avuto", future: ["avrò", "avrai", "avrà", "avremo", "avrete", "avranno"] },
    fare: { present: ["faccio", "fai", "fa", "facciamo", "fate", "fanno"], past: "fatto", future: ["farò", "farai", "farà", "faremo", "farete", "faranno"] },
    dire: { present: ["dico", "dici", "dice", "diciamo", "dite", "dicono"], past: "detto", future: ["dirò", "dirai", "dirà", "diremo", "direte", "diranno"] },
    andare: { present: ["vado", "vai", "va", "andiamo", "andate", "vanno"], past: "andato/a", future: ["andrò", "andrai", "andrà", "andremo", "andrete", "andranno"] },
    venire: { present: ["vengo", "vieni", "viene", "veniamo", "venite", "vengono"], past: "venuto/a", future: ["verrò", "verrai", "verrà", "verremo", "verrete", "verranno"] },
    potere: { present: ["posso", "puoi", "può", "possiamo", "potete", "possono"], past: "potuto", future: ["potrò", "potrai", "potrà", "potremo", "potrete", "potranno"] },
    volere: { present: ["voglio", "vuoi", "vuole", "vogliamo", "volete", "vogliono"], past: "voluto", future: ["vorrò", "vorrai", "vorrà", "vorremo", "vorrete", "vorranno"] },
    dovere: { present: ["devo", "devi", "deve", "dobbiamo", "dovete", "devono"], past: "dovuto", future: ["dovrò", "dovrai", "dovrà", "dovremo", "dovrete", "dovranno"] },
    sapere: { present: ["so", "sai", "sa", "sappiamo", "sapete", "sanno"], past: "saputo", future: ["saprò", "saprai", "saprà", "sapremo", "saprete", "sapranno"] },
    stare: { present: ["sto", "stai", "sta", "stiamo", "state", "stanno"], past: "stato/a", future: ["starò", "starai", "starà", "staremo", "starete", "staranno"] },
    dare: { present: ["do", "dai", "dà", "diamo", "date", "danno"], past: "dato", future: ["darò", "darai", "darà", "daremo", "darete", "daranno"] },
    vedere: { present: ["vedo", "vedi", "vede", "vediamo", "vedete", "vedono"], past: "visto", future: ["vedrò", "vedrai", "vedrà", "vedremo", "vedrete", "vedranno"] },
    prendere: { present: ["prendo", "prendi", "prende", "prendiamo", "prendete", "prendono"], past: "preso", future: ["prenderò", "prenderai", "prenderà", "prenderemo", "prenderete", "prenderanno"] },
    mettere: { present: ["metto", "metti", "mette", "mettiamo", "mettete", "mettono"], past: "messo", future: ["metterò", "metterai", "metterà", "metteremo", "metterete", "metteranno"] },
  };

  const pronouns = ["io", "tu", "lui/lei", "noi", "voi", "loro"];

  if (irregulars[word]) {
    const irr = irregulars[word];
    return [
      { tense: "Presente", forms: irr.present.map((f, i) => ({ pronoun: pronouns[i], form: f })) },
      { tense: "Passato", forms: [{ pronoun: "", form: `ho ${irr.past}` }] },
      { tense: "Futuro", forms: irr.future.map((f, i) => ({ pronoun: pronouns[i], form: f })) },
    ];
  }

  // Regular conjugation patterns
  let present: string[], pastPart: string, future: string[];

  if (ending === "are") {
    present = [`${stem}o`, `${stem}i`, `${stem}a`, `${stem}iamo`, `${stem}ate`, `${stem}ano`];
    pastPart = `${stem}ato`;
    future = [`${stem}erò`, `${stem}erai`, `${stem}erà`, `${stem}eremo`, `${stem}erete`, `${stem}eranno`];
  } else if (ending === "ere") {
    present = [`${stem}o`, `${stem}i`, `${stem}e`, `${stem}iamo`, `${stem}ete`, `${stem}ono`];
    pastPart = `${stem}uto`;
    future = [`${stem}erò`, `${stem}erai`, `${stem}erà`, `${stem}eremo`, `${stem}erete`, `${stem}eranno`];
  } else {
    present = [`${stem}o`, `${stem}i`, `${stem}e`, `${stem}iamo`, `${stem}ite`, `${stem}ono`];
    pastPart = `${stem}ito`;
    future = [`${stem}irò`, `${stem}irai`, `${stem}irà`, `${stem}iremo`, `${stem}irete`, `${stem}iranno`];
  }

  return [
    { tense: "Presente", forms: present.map((f, i) => ({ pronoun: pronouns[i], form: f })) },
    { tense: "Passato", forms: [{ pronoun: "", form: `ho ${pastPart}` }] },
    { tense: "Futuro", forms: future.map((f, i) => ({ pronoun: pronouns[i], form: f })) },
  ];
}

function speak(text: string) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "it-IT";
  utterance.rate = 0.8;
  speechSynthesis.speak(utterance);
}

interface WordLookupModalProps {
  isOpen: boolean;
  wordInfo: WordInfo | null;
  isSaved: boolean;
  onClose: () => void;
  onSave: () => void;
  onRemove: () => void;
}

const getCEFRColor = (level: string) => {
  switch (level) {
    case "A1":
      return "bg-green-100 text-green-800";
    case "A2":
      return "bg-blue-100 text-blue-800";
    case "B1":
      return "bg-orange-100 text-orange-800";
    case "B2":
      return "bg-red-100 text-red-800";
    case "C1":
      return "bg-purple-100 text-purple-800";
    case "C2":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getCEFRDescription = (level: string) => {
  switch (level) {
    case "A1":
      return "Beginner - Essential words";
    case "A2":
      return "Elementary - Common words";
    case "B1":
      return "Intermediate - Useful words";
    case "B2":
      return "Upper Intermediate - Advanced words";
    case "C1":
      return "Advanced - Rare words";
    case "C2":
      return "Mastery - Very rare words";
    default:
      return "Unknown level";
  }
};

export default function WordLookupModal({
  isOpen,
  wordInfo,
  isSaved: initialIsSaved,
  onClose,
  onSave,
  onRemove,
}: WordLookupModalProps) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [isLoading, setIsLoading] = useState(false);

  // Mutations for saving/removing vocabulary
  const saveVocabularyMutation = trpc.vocabulary.save.useMutation({
    onSuccess: () => {
      setIsSaved(true);
      toast.success("Word saved to your vocabulary!");
      onSave();
    },
    onError: () => {
      toast.error("Failed to save word");
    },
  });

  const removeVocabularyMutation = trpc.vocabulary.remove.useMutation({
    onSuccess: () => {
      setIsSaved(false);
      toast.success("Word removed from your vocabulary");
      onRemove();
    },
    onError: () => {
      toast.error("Failed to remove word");
    },
  });

  useEffect(() => {
    setIsSaved(initialIsSaved);
  }, [initialIsSaved]);

  const handleSave = async () => {
    if (!user || !wordInfo) return;

    setIsLoading(true);
    try {
      await saveVocabularyMutation.mutateAsync({
        word: wordInfo.word,
        translation: wordInfo.translation,
        cefrLevel: (wordInfo.cefrLevel as "A1" | "A2" | "B1" | "B2"),
        frequencyRank: wordInfo.frequencyRank,
        status: "learning",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!user || !wordInfo) return;

    setIsLoading(true);
    try {
      await removeVocabularyMutation.mutateAsync({
        word: wordInfo.word,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!wordInfo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-2xl font-bold">
              {wordInfo.word}
            </DialogTitle>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full w-9 h-9 p-0"
              onClick={() => speak(wordInfo.word)}
            >
              <Volume2 className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Translation */}
          <div>
            <p className="text-sm text-gray-500 mb-1">Translation</p>
            <p className="text-lg font-semibold text-gray-900">
              {wordInfo.translation}
            </p>
          </div>

          {/* Part of Speech */}
          {wordInfo.partOfSpeech && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Part of Speech</p>
              <p className="text-sm text-gray-700">{wordInfo.partOfSpeech}</p>
            </div>
          )}

          {/* CEFR Level */}
          <div>
            <p className="text-sm text-gray-500 mb-2">Difficulty Level</p>
            <div className="flex items-center gap-2">
              <Badge className={`${getCEFRColor(wordInfo.cefrLevel)} font-bold`}>
                {wordInfo.cefrLevel}
              </Badge>
              <span className="text-sm text-gray-600">
                {getCEFRDescription(wordInfo.cefrLevel)}
              </span>
            </div>
          </div>

          {/* Frequency Rank */}
          <div>
            <p className="text-sm text-gray-500 mb-1">Frequency Rank</p>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <p className="text-sm text-gray-700">
                Rank #{wordInfo.frequencyRank} out of 6,865 Italian words
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {wordInfo.frequencyRank < 1000
                ? "Very common - Essential to learn"
                : wordInfo.frequencyRank < 3000
                  ? "Common - Important for A1-B1 learners"
                  : "Less common - Advanced vocabulary"}
            </p>
          </div>

          {/* Context */}
          {wordInfo.context && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Context</p>
              <p className="text-sm text-gray-700 italic">"{wordInfo.context}"</p>
            </div>
          )}

          {/* Conjugation Table */}
          {(() => {
            const conjugations = getConjugations(wordInfo.word);
            if (!conjugations) return null;
            return (
              <div>
                <p className="text-sm text-gray-500 mb-2">Conjugation</p>
                <div className="grid grid-cols-3 gap-2">
                  {conjugations.map(({ tense, forms }) => (
                    <div key={tense} className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs font-semibold text-gray-600 mb-1 text-center">{tense}</p>
                      <div className="space-y-0.5">
                        {forms.slice(0, 3).map(({ pronoun, form }, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-1">
                            <span className="text-xs text-gray-400">{pronoun}</span>
                            <button
                              className="text-xs text-blue-700 font-medium hover:text-blue-900 flex items-center gap-0.5"
                              onClick={() => speak(pronoun ? `${pronoun} ${form}` : form)}
                            >
                              {form}
                              <Volume2 className="w-2.5 h-2.5 opacity-50" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {isSaved ? (
              <Button
                onClick={handleRemove}
                disabled={isLoading || !user}
                variant="outline"
                className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 mr-2 fill-current" />
                    Remove from Vocabulary
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={isLoading || !user}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 mr-2" />
                    Save to Vocabulary
                  </>
                )}
              </Button>
            )}
            <Button onClick={onClose} variant="outline" className="flex-1">
              Close
            </Button>
          </div>

          {!user && (
            <p className="text-xs text-gray-500 text-center">
              Please log in to save words to your vocabulary
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
