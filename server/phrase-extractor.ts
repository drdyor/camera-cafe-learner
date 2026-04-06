import { lookupKellyWord } from "./db-helpers";

/**
 * Phrase extraction and Kelly List scoring
 * Converts raw subtitle text into learnable phrases with frequency-based scoring
 */

interface ExtractedPhrase {
  italianText: string;
  englishTranslation: string;
  startTime: number;
  endTime: number;
  wordCount: number;
  minFrequencyRank: number;
  cefrLevel: "A1" | "A2" | "B1" | "B2";
  isLearnable: boolean;
}

/**
 * Tokenize text into words, preserving case
 */
function tokenizeText(text: string): string[] {
  // Remove punctuation but keep apostrophes for contractions
  const cleaned = text.replace(/[^\w\s']/g, "");
  return cleaned.split(/\s+/).filter(word => word.length > 0);
}

/**
 * Normalize word for Kelly List lookup (lowercase)
 */
function normalizeWord(word: string): string {
  return word.toLowerCase().trim();
}

/**
 * Extract phrases from subtitle text with Kelly scoring
 * Strategy: Extract 1-8 word phrases that are learnable (CEFR <= B1)
 */
export async function extractPhrasesFromSubtitle(
  italianText: string,
  englishText: string,
  startTime: number,
  endTime: number
): Promise<ExtractedPhrase[]> {
  const phrases: ExtractedPhrase[] = [];
  const tokens = tokenizeText(italianText);

  if (tokens.length === 0) return phrases;

  // Extract phrases of varying lengths (1-8 words)
  for (let phraseLength = 1; phraseLength <= Math.min(8, tokens.length); phraseLength++) {
    for (let i = 0; i <= tokens.length - phraseLength; i++) {
      const phraseTokens = tokens.slice(i, i + phraseLength);
      const phrase = phraseTokens.join(" ");

      // Score the phrase
      const scored = await scorePhrase(phrase);

      if (scored && scored.isLearnable) {
        phrases.push({
          italianText: phrase,
          englishTranslation: englishText, // Simplified: use full English subtitle
          startTime,
          endTime,
          wordCount: phraseLength,
          minFrequencyRank: scored.minFrequencyRank,
          cefrLevel: scored.cefrLevel,
          isLearnable: true,
        });
      }
    }
  }

  // Remove duplicates and sort by frequency rank
  const uniquePhrases = Array.from(
    new Map(phrases.map(p => [p.italianText, p])).values()
  );

  return uniquePhrases.sort((a, b) => a.minFrequencyRank - b.minFrequencyRank);
}

/**
 * Score a phrase using Kelly List
 * Returns the minimum frequency rank (most common word) and CEFR level
 */
async function scorePhrase(
  phrase: string
): Promise<{
  minFrequencyRank: number;
  cefrLevel: "A1" | "A2" | "B1" | "B2";
  isLearnable: boolean;
} | null> {
  const words = tokenizeText(phrase);

  if (words.length === 0 || words.length > 8) {
    return null;
  }

  // Look up each word in Kelly List
  const wordScores = await Promise.all(
    words.map(async word => {
      const normalized = normalizeWord(word);
      const kellyWord = await lookupKellyWord(normalized);

      if (!kellyWord) {
        // Unknown word - assign high rank (less common)
        return {
          frequencyRank: 9999,
          cefrLevel: "C2" as const,
        };
      }

      return {
        frequencyRank: kellyWord.frequencyRank,
        cefrLevel: kellyWord.cefrLevel,
      };
    })
  );

  // Find the most common word (lowest rank)
  const minFrequencyRank = Math.min(...wordScores.map(s => s.frequencyRank));

  // Determine CEFR level based on most common word
  const mostCommonWord = wordScores.find(
    s => s.frequencyRank === minFrequencyRank
  );
  const cefrLevel = mostCommonWord?.cefrLevel || "C2";

  // Learnability criteria:
  // - Word count <= 8 (already checked)
  // - CEFR level <= B1 (focus on A1-B1 for learners)
  // - At least one word in Kelly List
  const isLearnable =
    words.length <= 8 &&
    (cefrLevel === "A1" || cefrLevel === "A2" || cefrLevel === "B1") &&
    minFrequencyRank < 9999;

  // Map C1/C2 to B2 for learnable phrases
  const mappedCefrLevel =
    cefrLevel === "C1" || cefrLevel === "C2"
      ? ("B2" as const)
      : (cefrLevel as "A1" | "A2" | "B1" | "B2");

  return {
    minFrequencyRank,
    cefrLevel: mappedCefrLevel,
    isLearnable,
  };
}

/**
 * Parse SRT subtitle file format
 * Returns array of subtitle objects with timing and text
 */
export function parseSRTSubtitles(
  srtContent: string
): Array<{
  sequenceNumber: number;
  startTime: number;
  endTime: number;
  text: string;
}> {
  const subtitles: Array<{
    sequenceNumber: number;
    startTime: number;
    endTime: number;
    text: string;
  }> = [];

  // Split by double newlines to separate subtitle blocks
  const blocks = srtContent.split(/\n\n+/);

  blocks.forEach((block, index) => {
    const lines = block.trim().split("\n");

    if (lines.length < 3) return; // Skip invalid blocks

    // Line 0: sequence number
    const sequenceNumber = parseInt(lines[0], 10);

    // Line 1: timing (HH:MM:SS,mmm --> HH:MM:SS,mmm)
    const timingLine = lines[1];
    const timeParts = timingLine.split(" --> ");

    if (timeParts.length !== 2) return;

    const startTime = timeToMilliseconds(timeParts[0].trim());
    const endTime = timeToMilliseconds(timeParts[1].trim());

    // Lines 2+: subtitle text
    const text = lines.slice(2).join("\n").trim();

    if (text) {
      subtitles.push({
        sequenceNumber,
        startTime,
        endTime,
        text,
      });
    }
  });

  return subtitles;
}

/**
 * Convert SRT time format (HH:MM:SS,mmm) to milliseconds
 */
function timeToMilliseconds(timeStr: string): number {
  const parts = timeStr.split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const secondsAndMs = parts[2].split(",");
  const seconds = parseInt(secondsAndMs[0], 10);
  const milliseconds = parseInt(secondsAndMs[1], 10);

  return hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds;
}

/**
 * Convert milliseconds back to SRT time format
 */
export function millisecondsToTime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;

  return (
    `${String(hours).padStart(2, "0")}:` +
    `${String(minutes).padStart(2, "0")}:` +
    `${String(seconds).padStart(2, "0")},` +
    `${String(milliseconds).padStart(3, "0")}`
  );
}
