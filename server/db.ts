import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import * as schema from "../drizzle/schema";

const DB_PATH = path.resolve(import.meta.dirname, "..", "data", "app.db");

// Ensure data directory exists
import fs from "node:fs";
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT DEFAULT 'Learner',
    role TEXT NOT NULL DEFAULT 'user',
    createdAt INTEGER
  );
  CREATE TABLE IF NOT EXISTS episodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    season INTEGER NOT NULL,
    episodeNumber INTEGER NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL,
    difficulty TEXT NOT NULL,
    youtubeId TEXT,
    createdAt INTEGER
  );
  CREATE TABLE IF NOT EXISTS subtitles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    episodeId INTEGER NOT NULL,
    language TEXT NOT NULL,
    sequenceNumber INTEGER NOT NULL,
    startTime INTEGER NOT NULL,
    endTime INTEGER NOT NULL,
    text TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS kellyList (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lemma TEXT NOT NULL UNIQUE,
    pos TEXT,
    cefrLevel TEXT NOT NULL,
    frequencyRank INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS phrases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    episodeId INTEGER NOT NULL,
    italianText TEXT NOT NULL,
    englishTranslation TEXT NOT NULL,
    subtitleId INTEGER,
    startTime INTEGER NOT NULL,
    endTime INTEGER NOT NULL,
    wordCount INTEGER NOT NULL,
    minFrequencyRank INTEGER NOT NULL,
    cefrLevel TEXT NOT NULL,
    isLearnable INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS userVocabulary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    phraseId INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'learning',
    timesEncountered INTEGER NOT NULL DEFAULT 1,
    lastReviewedAt INTEGER,
    nextReviewAt INTEGER,
    createdAt INTEGER
  );
  CREATE TABLE IF NOT EXISTS episodeProgress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    episodeId INTEGER NOT NULL,
    watchedDuration INTEGER NOT NULL DEFAULT 0,
    percentageWatched INTEGER NOT NULL DEFAULT 0,
    lastWatchedAt INTEGER,
    completedAt INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_subtitles_episode ON subtitles(episodeId, language);
  CREATE INDEX IF NOT EXISTS idx_phrases_episode ON phrases(episodeId);
  CREATE INDEX IF NOT EXISTS idx_kelly_lemma ON kellyList(lemma);
  CREATE INDEX IF NOT EXISTS idx_vocab_user ON userVocabulary(userId);
  CREATE INDEX IF NOT EXISTS idx_progress_user ON episodeProgress(userId, episodeId);
`);

// Seed default user if none exists
const userCount = sqlite.prepare("SELECT COUNT(*) as cnt FROM users").get() as { cnt: number };
if (userCount.cnt === 0) {
  sqlite.prepare("INSERT INTO users (name, role, createdAt) VALUES (?, ?, ?)").run(
    "Learner", "admin", Date.now()
  );
  console.log("[DB] Created default user");
}

console.log(`[DB] SQLite ready at ${DB_PATH}`);
