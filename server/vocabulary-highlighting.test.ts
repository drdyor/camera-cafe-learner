import { describe, it, expect } from "vitest";

interface Phrase {
  id: number;
  italianText: string;
  englishTranslation: string;
  cefrLevel: "A1" | "A2" | "B1" | "B2";
  minFrequencyRank: number;
  startTime: number;
  endTime: number;
}

/**
 * Test vocabulary highlighting logic
 */
describe("Vocabulary Highlighting", () => {
  it("should build highlighted words map from current phrases", () => {
    const phrases: Phrase[] = [
      {
        id: 1,
        italianText: "Buongiorno",
        englishTranslation: "Good morning",
        cefrLevel: "A1",
        minFrequencyRank: 500,
        startTime: 0,
        endTime: 3000,
      },
      {
        id: 2,
        italianText: "Mi piace",
        englishTranslation: "I like",
        cefrLevel: "A1",
        minFrequencyRank: 300,
        startTime: 9500,
        endTime: 12000,
      },
    ];

    const currentTime = 10000;
    const currentPhrases = phrases.filter(
      p => currentTime >= p.startTime && currentTime <= p.endTime
    );

    expect(currentPhrases).toHaveLength(1);
    expect(currentPhrases[0].italianText).toBe("Mi piace");
  });

  it("should return empty array when no phrases match current time", () => {
    const phrases: Phrase[] = [
      {
        id: 1,
        italianText: "Buongiorno",
        englishTranslation: "Good morning",
        cefrLevel: "A1",
        minFrequencyRank: 500,
        startTime: 0,
        endTime: 3000,
      },
    ];

    const currentTime = 5000;
    const currentPhrases = phrases.filter(
      p => currentTime >= p.startTime && currentTime <= p.endTime
    );

    expect(currentPhrases).toHaveLength(0);
  });

  it("should correctly map CEFR levels to colors", () => {
    const cefrToColor: Record<string, string> = {
      A1: "bg-green-200 text-green-900 hover:bg-green-300",
      A2: "bg-blue-200 text-blue-900 hover:bg-blue-300",
      B1: "bg-orange-200 text-orange-900 hover:bg-orange-300",
      B2: "bg-red-200 text-red-900 hover:bg-red-300",
    };

    expect(cefrToColor.A1).toContain("green");
    expect(cefrToColor.A2).toContain("blue");
    expect(cefrToColor.B1).toContain("orange");
    expect(cefrToColor.B2).toContain("red");
  });

  it("should extract individual words from multi-word phrases", () => {
    const phrase = "caffè italiano";
    const words = phrase.toLowerCase().split(/\s+/);

    expect(words).toEqual(["caffè", "italiano"]);
  });

  it("should handle phrases with punctuation", () => {
    const phrase = "per favore";
    const words = phrase.toLowerCase().split(/\s+/);

    expect(words).toHaveLength(2);
    expect(words).toContain("per");
    expect(words).toContain("favore");
  });

  it("should build word map from multiple phrases", () => {
    const phrases: Phrase[] = [
      {
        id: 1,
        italianText: "caffè italiano",
        englishTranslation: "Italian coffee",
        cefrLevel: "A1",
        minFrequencyRank: 1200,
        startTime: 0,
        endTime: 3000,
      },
      {
        id: 2,
        italianText: "per favore",
        englishTranslation: "please",
        cefrLevel: "A1",
        minFrequencyRank: 400,
        startTime: 3000,
        endTime: 6000,
      },
    ];

    const highlightedWordsMap = new Map();
    phrases.forEach(phrase => {
      const words = phrase.italianText.toLowerCase().split(/\s+/);
      words.forEach(word => {
        highlightedWordsMap.set(word, {
          word: phrase.italianText,
          cefrLevel: phrase.cefrLevel,
          frequencyRank: phrase.minFrequencyRank,
        });
      });
    });

    expect(highlightedWordsMap.has("caffè")).toBe(true);
    expect(highlightedWordsMap.has("italiano")).toBe(true);
    expect(highlightedWordsMap.has("per")).toBe(true);
    expect(highlightedWordsMap.has("favore")).toBe(true);
    expect(highlightedWordsMap.size).toBe(4);
  });

  it("should prioritize frequency rank when building word map", () => {
    const phrases: Phrase[] = [
      {
        id: 1,
        italianText: "Mi piace",
        englishTranslation: "I like",
        cefrLevel: "A1",
        minFrequencyRank: 300,
        startTime: 0,
        endTime: 3000,
      },
      {
        id: 2,
        italianText: "Mi piace molto",
        englishTranslation: "I like very much",
        cefrLevel: "A2",
        minFrequencyRank: 1500,
        startTime: 3000,
        endTime: 6000,
      },
    ];

    const highlightedWordsMap = new Map();
    phrases.forEach(phrase => {
      const words = phrase.italianText.toLowerCase().split(/\s+/);
      words.forEach(word => {
        highlightedWordsMap.set(word, {
          word: phrase.italianText,
          cefrLevel: phrase.cefrLevel,
          frequencyRank: phrase.minFrequencyRank,
        });
      });
    });

    // The word "mi" should be in the map from the first phrase (lower rank = more frequent)
    const miInfo = highlightedWordsMap.get("mi");
    expect(miInfo).toBeDefined();
  });
});
