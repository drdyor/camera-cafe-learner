export type Gender = 'masculine' | 'feminine' | 'none';

export type SupportedLanguage = 'it' | 'fr' | 'es' | 'zh';

export interface VocabularyItem {
  id: string;
  word: string; // target language
  english: string;
  gender: Gender;
  pronunciation: string;
  mnemonic: string;
  x: number; // percentage position 0-100
  y: number; // percentage position 0-100
  icon?: string;
}

export interface GrammarPoint {
  id: string;
  title: string;
  explanation: string;
  example: string;
  color: string;
}

export interface RoomStory {
  title: string;
  narrative: string;
}

export interface VocabularySlot {
  id: string;
  x: number;
  y: number;
  icon?: string;
  defaultGender: Gender;
}

export interface Room {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  description: string;
  vocabularySlots: VocabularySlot[];
  grammar: GrammarPoint[];
  story?: RoomStory;
}

export interface Character {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar: string;
  greeting: string;
  personality: string;
  topics: string[];
}

export interface DialogueLine {
  speaker: string;
  characterId?: string;
  text: string;
  translation: string;
}

export interface RoomDialogue {
  roomId: string;
  title: string;
  present: DialogueLine[];
  past: DialogueLine[];
  future: DialogueLine[];
}

export interface GrammarLesson {
  title: string;
  titleNative: string;
  explanation: string;
  formula: string;
  examples: { native: string; english: string; highlight?: string }[];
  commonMistakes: { wrong: string; correct: string; explanation: string }[];
}

export interface RoomLessons {
  roomId: string;
  lessons: GrammarLesson[];
  keyVocabulary: { word: string; translation: string; gender: Gender }[];
}

export interface LanguageConfig {
  code: string; // BCP-47
  name: string;
  genderLabels: { m: string; f: string };
  speechLang: string;
}
