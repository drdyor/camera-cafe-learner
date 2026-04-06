import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { createEmptyCard, fsrs, generatorParameters, Rating, type Card } from "ts-fsrs";
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DB_PATH = path.resolve(import.meta.dirname, "../../data/app.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");

// Create SRS table
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS srsCards (
    word TEXT PRIMARY KEY,
    cardJson TEXT NOT NULL,
    storyId TEXT,
    createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    lastReviewedAt INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_srs_due ON srsCards(word);
`);

const f = fsrs(generatorParameters({ enable_fuzz: true }));

function getCard(word: string): Card | null {
  const row = sqlite.prepare("SELECT cardJson FROM srsCards WHERE word = ?").get(word) as
    | { cardJson: string }
    | undefined;
  if (!row) return null;
  return JSON.parse(row.cardJson);
}

function upsertCard(word: string, card: Card, storyId?: string) {
  sqlite.prepare(
    `INSERT INTO srsCards (word, cardJson, storyId, lastReviewedAt)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(word) DO UPDATE SET cardJson = ?, lastReviewedAt = ?`
  ).run(word, JSON.stringify(card), storyId || null, Date.now(), JSON.stringify(card), Date.now());
}

export const srsRouter = router({
  // Review a word: pass rating (1=Again, 2=Hard, 3=Good, 4=Easy)
  review: publicProcedure
    .input(z.object({
      word: z.string(),
      rating: z.number().min(1).max(4),
      storyId: z.string().optional(),
    }))
    .mutation(({ input }) => {
      const card: Card = getCard(input.word) ?? createEmptyCard();
      const now = new Date();
      const scheduling = f.repeat(card, now) as unknown as Record<number, { card: Card; log: unknown }>;
      const result = scheduling[input.rating];
      upsertCard(input.word, result.card, input.storyId);
      return {
        word: input.word,
        nextReview: result.card.due.toISOString(),
        stability: result.card.stability,
        difficulty: result.card.difficulty,
      };
    }),

  // Get all due words (for review session)
  due: publicProcedure.query(() => {
    const now = Date.now();
    const rows = sqlite.prepare(
      "SELECT word, cardJson, storyId FROM srsCards"
    ).all() as { word: string; cardJson: string; storyId: string | null }[];

    const dueWords = rows
      .map((r) => {
        const card: Card = JSON.parse(r.cardJson);
        return {
          word: r.word,
          storyId: r.storyId,
          due: new Date(card.due).getTime(),
          stability: card.stability,
          difficulty: card.difficulty,
          reps: card.reps,
        };
      })
      .filter((w) => w.due <= now)
      .sort((a, b) => a.due - b.due);

    return dueWords;
  }),

  // Get stats
  stats: publicProcedure.query(() => {
    const total = (sqlite.prepare("SELECT COUNT(*) as cnt FROM srsCards").get() as { cnt: number }).cnt;
    const now = Date.now();
    const rows = sqlite.prepare("SELECT cardJson FROM srsCards").all() as { cardJson: string }[];

    let dueCount = 0;
    let learnedCount = 0;
    for (const r of rows) {
      const card: Card = JSON.parse(r.cardJson);
      if (new Date(card.due).getTime() <= now) dueCount++;
      if (card.reps >= 3) learnedCount++;
    }

    return { total, due: dueCount, learned: learnedCount };
  }),

  // Mark a word as seen (creates card if not exists, doesn't schedule review)
  seen: publicProcedure
    .input(z.object({
      word: z.string(),
      storyId: z.string().optional(),
    }))
    .mutation(({ input }) => {
      const existing = getCard(input.word);
      if (!existing) {
        const card = createEmptyCard();
        upsertCard(input.word, card, input.storyId);
      }
      return { word: input.word, isNew: !existing };
    }),
});
