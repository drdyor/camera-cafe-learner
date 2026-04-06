import React from "react";

interface WordInfo {
  word: string;
  cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  frequencyRank: number;
}

interface HighlightedSubtitleProps {
  text: string;
  highlightedWords: Map<string, WordInfo>;
  onWordClick: (word: string, info: WordInfo) => void;
}

const getCEFRColor = (level: string): string => {
  switch (level) {
    case "A1":
      return "bg-green-200 text-green-900 hover:bg-green-300";
    case "A2":
      return "bg-blue-200 text-blue-900 hover:bg-blue-300";
    case "B1":
      return "bg-orange-200 text-orange-900 hover:bg-orange-300";
    case "B2":
      return "bg-red-200 text-red-900 hover:bg-red-300";
    case "C1":
      return "bg-purple-200 text-purple-900 hover:bg-purple-300";
    case "C2":
      return "bg-gray-300 text-gray-900 hover:bg-gray-400";
    default:
      return "";
  }
};

export default function HighlightedSubtitle({
  text,
  highlightedWords,
  onWordClick,
}: HighlightedSubtitleProps) {
  // Split text into words and punctuation
  const words = text.split(/(\s+|[.,!?;:])/);

  return (
    <span>
      {words.map((word, index) => {
        // Check if this word (case-insensitive) is in our highlighted words map
        const lowerWord = word.toLowerCase();
        const wordInfo = highlightedWords.get(lowerWord);

        if (wordInfo) {
          return (
            <span
              key={index}
              className={`${getCEFRColor(wordInfo.cefrLevel)} px-1 rounded cursor-pointer transition font-semibold`}
              onClick={() => onWordClick(word, wordInfo)}
              title={`Rank: #${wordInfo.frequencyRank} (${wordInfo.cefrLevel})`}
            >
              {word}
            </span>
          );
        }

        // Return non-highlighted text as-is
        return <span key={index}>{word}</span>;
      })}
    </span>
  );
}
