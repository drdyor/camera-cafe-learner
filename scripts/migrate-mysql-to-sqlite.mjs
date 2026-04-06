/**
 * Migrate data from MySQL (Docker) to SQLite.
 * Run after translations are complete.
 */
import { createConnection } from "mysql2/promise";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SQLITE_PATH = path.join(__dirname, "..", "data", "app.db");
const MYSQL_URL = process.env.DATABASE_URL || "mysql://root:cameracafe@localhost:3306/camera_cafe";

async function migrate() {
  // Ensure data dir
  fs.mkdirSync(path.dirname(SQLITE_PATH), { recursive: true });

  // Delete existing SQLite if present
  if (fs.existsSync(SQLITE_PATH)) {
    fs.unlinkSync(SQLITE_PATH);
    console.log("Deleted existing SQLite DB");
  }

  const sqlite = new Database(SQLITE_PATH);
  sqlite.pragma("journal_mode = WAL");

  // Create tables
  sqlite.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT DEFAULT 'Learner',
      role TEXT NOT NULL DEFAULT 'user',
      createdAt INTEGER
    );
    CREATE TABLE episodes (
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
    CREATE TABLE subtitles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      episodeId INTEGER NOT NULL,
      language TEXT NOT NULL,
      sequenceNumber INTEGER NOT NULL,
      startTime INTEGER NOT NULL,
      endTime INTEGER NOT NULL,
      text TEXT NOT NULL
    );
    CREATE TABLE kellyList (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lemma TEXT NOT NULL UNIQUE,
      pos TEXT,
      cefrLevel TEXT NOT NULL,
      frequencyRank INTEGER NOT NULL
    );
    CREATE TABLE phrases (
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
    CREATE TABLE userVocabulary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      phraseId INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'learning',
      timesEncountered INTEGER NOT NULL DEFAULT 1,
      lastReviewedAt INTEGER,
      nextReviewAt INTEGER,
      createdAt INTEGER
    );
    CREATE TABLE episodeProgress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      episodeId INTEGER NOT NULL,
      watchedDuration INTEGER NOT NULL DEFAULT 0,
      percentageWatched INTEGER NOT NULL DEFAULT 0,
      lastWatchedAt INTEGER,
      completedAt INTEGER
    );
    CREATE INDEX idx_subtitles_episode ON subtitles(episodeId, language);
    CREATE INDEX idx_phrases_episode ON phrases(episodeId);
    CREATE INDEX idx_kelly_lemma ON kellyList(lemma);
  `);

  const mysql = await createConnection(MYSQL_URL);

  try {
    // Default user
    sqlite.prepare("INSERT INTO users (name, role, createdAt) VALUES (?, ?, ?)").run("Learner", "admin", Date.now());
    console.log("✓ Created default user");

    // Episodes — extract youtubeId from videoUrl
    const [episodes] = await mysql.execute("SELECT * FROM episodes");
    const insertEp = sqlite.prepare(
      "INSERT INTO episodes (id, title, season, episodeNumber, description, duration, difficulty, youtubeId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    for (const ep of episodes) {
      let ytId = null;
      if (ep.videoUrl?.includes("youtube.com")) {
        try { ytId = new URL(ep.videoUrl).searchParams.get("v"); } catch {}
      }
      insertEp.run(ep.id, ep.title, ep.season, ep.episodeNumber, ep.description, ep.duration, ep.difficulty, ytId, Date.now());
    }
    console.log(`✓ Migrated ${episodes.length} episodes`);

    // Subtitles
    const [subs] = await mysql.execute("SELECT * FROM subtitles ORDER BY episodeId, language, sequenceNumber");
    const insertSub = sqlite.prepare(
      "INSERT INTO subtitles (episodeId, language, sequenceNumber, startTime, endTime, text) VALUES (?, ?, ?, ?, ?, ?)"
    );
    const insertSubMany = sqlite.transaction((rows) => {
      for (const s of rows) {
        insertSub.run(s.episodeId, s.language, s.sequenceNumber, s.startTime, s.endTime, s.text);
      }
    });
    insertSubMany(subs);
    console.log(`✓ Migrated ${subs.length} subtitles`);

    // Kelly List
    const [kelly] = await mysql.execute("SELECT * FROM kellyList");
    const insertKelly = sqlite.prepare(
      "INSERT OR IGNORE INTO kellyList (lemma, pos, cefrLevel, frequencyRank) VALUES (?, ?, ?, ?)"
    );
    const insertKellyMany = sqlite.transaction((rows) => {
      for (const k of rows) {
        insertKelly.run(k.lemma, k.pos, k.cefrLevel, k.frequencyRank);
      }
    });
    insertKellyMany(kelly);
    console.log(`✓ Migrated ${kelly.length} Kelly words`);

    // Phrases
    const [phrs] = await mysql.execute("SELECT * FROM phrases");
    const insertPhrase = sqlite.prepare(
      "INSERT INTO phrases (episodeId, italianText, englishTranslation, subtitleId, startTime, endTime, wordCount, minFrequencyRank, cefrLevel, isLearnable) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    const insertPhraseMany = sqlite.transaction((rows) => {
      for (const p of rows) {
        insertPhrase.run(p.episodeId, p.italianText, p.englishTranslation, p.subtitleId, p.startTime, p.endTime, p.wordCount, p.minFrequencyRank, p.cefrLevel, p.isLearnable ? 1 : 0);
      }
    });
    insertPhraseMany(phrs);
    console.log(`✓ Migrated ${phrs.length} phrases`);

    const fileSize = fs.statSync(SQLITE_PATH).size;
    console.log(`\n✓ Migration complete! SQLite DB: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
  } finally {
    await mysql.end();
    sqlite.close();
  }
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
