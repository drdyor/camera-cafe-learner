import { integer, text, sqliteTable, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").default("Learner"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const episodes = sqliteTable("episodes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  season: integer("season").notNull(),
  episodeNumber: integer("episodeNumber").notNull(),
  description: text("description"),
  duration: integer("duration").notNull(), // seconds
  difficulty: text("difficulty", { enum: ["A1", "A2", "B1", "B2"] }).notNull(),
  youtubeId: text("youtubeId"), // YouTube video ID
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type Episode = typeof episodes.$inferSelect;
export type InsertEpisode = typeof episodes.$inferInsert;

export const subtitles = sqliteTable("subtitles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  episodeId: integer("episodeId").notNull(),
  language: text("language", { enum: ["it", "en"] }).notNull(),
  sequenceNumber: integer("sequenceNumber").notNull(),
  startTime: integer("startTime").notNull(), // ms
  endTime: integer("endTime").notNull(), // ms
  text: text("text").notNull(),
});

export type Subtitle = typeof subtitles.$inferSelect;

export const kellyList = sqliteTable("kellyList", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  lemma: text("lemma").notNull().unique(),
  pos: text("pos"),
  cefrLevel: text("cefrLevel", { enum: ["A1", "A2", "B1", "B2", "C1", "C2"] }).notNull(),
  frequencyRank: integer("frequencyRank").notNull(),
});

export type KellyWord = typeof kellyList.$inferSelect;

export const phrases = sqliteTable("phrases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  episodeId: integer("episodeId").notNull(),
  italianText: text("italianText").notNull(),
  englishTranslation: text("englishTranslation").notNull(),
  subtitleId: integer("subtitleId"),
  startTime: integer("startTime").notNull(), // ms
  endTime: integer("endTime").notNull(), // ms
  wordCount: integer("wordCount").notNull(),
  minFrequencyRank: integer("minFrequencyRank").notNull(),
  cefrLevel: text("cefrLevel", { enum: ["A1", "A2", "B1", "B2"] }).notNull(),
  isLearnable: integer("isLearnable", { mode: "boolean" }).default(true).notNull(),
});

export type Phrase = typeof phrases.$inferSelect;

export const userVocabulary = sqliteTable("userVocabulary", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  phraseId: integer("phraseId").notNull(),
  status: text("status", { enum: ["learning", "reviewing", "mastered"] }).default("learning").notNull(),
  timesEncountered: integer("timesEncountered").default(1).notNull(),
  lastReviewedAt: integer("lastReviewedAt", { mode: "timestamp" }),
  nextReviewAt: integer("nextReviewAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type UserVocabularyEntry = typeof userVocabulary.$inferSelect;

export const episodeProgress = sqliteTable("episodeProgress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  episodeId: integer("episodeId").notNull(),
  watchedDuration: integer("watchedDuration").default(0).notNull(), // seconds
  percentageWatched: integer("percentageWatched").default(0).notNull(),
  lastWatchedAt: integer("lastWatchedAt", { mode: "timestamp" }),
  completedAt: integer("completedAt", { mode: "timestamp" }),
});

export type EpisodeProgress = typeof episodeProgress.$inferSelect;

// Relations
export const episodesRelations = relations(episodes, ({ many }) => ({
  subtitles: many(subtitles),
  phrases: many(phrases),
}));

export const subtitlesRelations = relations(subtitles, ({ one }) => ({
  episode: one(episodes, { fields: [subtitles.episodeId], references: [episodes.id] }),
}));

export const phrasesRelations = relations(phrases, ({ one }) => ({
  episode: one(episodes, { fields: [phrases.episodeId], references: [episodes.id] }),
}));
