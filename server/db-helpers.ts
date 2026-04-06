import { eq, and, desc } from "drizzle-orm";
import {
  episodes,
  subtitles,
  kellyList,
  phrases,
  userVocabulary,
  episodeProgress,
} from "../drizzle/schema";
import { db } from "./db";

// Episodes
export async function getEpisodes(difficulty?: string) {
  const query = difficulty
    ? db.select().from(episodes).where(eq(episodes.difficulty, difficulty as any))
    : db.select().from(episodes);
  return query.orderBy(episodes.season, episodes.episodeNumber);
}

export async function getEpisodeById(id: number) {
  const result = db.select().from(episodes).where(eq(episodes.id, id)).limit(1).all();
  return result[0] || null;
}

export async function createEpisode(data: any) {
  return db.insert(episodes).values(data);
}

// Subtitles
export async function getSubtitlesByEpisode(episodeId: number, language: "it" | "en") {
  return db
    .select()
    .from(subtitles)
    .where(and(eq(subtitles.episodeId, episodeId), eq(subtitles.language, language)))
    .orderBy(subtitles.sequenceNumber)
    .all();
}

export async function createSubtitles(data: any[]) {
  return db.insert(subtitles).values(data);
}

// Kelly List
export async function lookupKellyWord(lemma: string) {
  const result = db.select().from(kellyList).where(eq(kellyList.lemma, lemma.toLowerCase())).limit(1).all();
  return result[0] || null;
}

// Phrases
export async function getPhrasesByEpisode(episodeId: number, cefrLevel?: string) {
  const query = cefrLevel
    ? db.select().from(phrases).where(and(eq(phrases.episodeId, episodeId), eq(phrases.cefrLevel, cefrLevel as any)))
    : db.select().from(phrases).where(eq(phrases.episodeId, episodeId));
  return query.orderBy(phrases.startTime).all();
}

export async function createPhrases(data: any[]) {
  return db.insert(phrases).values(data);
}

// User Vocabulary
export async function getUserVocabulary(userId: number, status?: string) {
  const query = status
    ? db.select().from(userVocabulary).where(and(eq(userVocabulary.userId, userId), eq(userVocabulary.status, status as any)))
    : db.select().from(userVocabulary).where(eq(userVocabulary.userId, userId));
  return query.orderBy(desc(userVocabulary.createdAt)).all();
}

export async function saveToVocabulary(userId: number, phraseId: number) {
  const existing = db.select().from(userVocabulary)
    .where(and(eq(userVocabulary.userId, userId), eq(userVocabulary.phraseId, phraseId)))
    .limit(1).all();

  if (existing.length > 0) return existing[0];

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + 1);

  db.insert(userVocabulary).values({
    userId,
    phraseId,
    status: "learning",
    timesEncountered: 1,
    nextReviewAt: nextReview,
  }).run();

  return db.select().from(userVocabulary)
    .where(and(eq(userVocabulary.userId, userId), eq(userVocabulary.phraseId, phraseId)))
    .limit(1).all()[0];
}

export async function updateVocabularyStatus(vocabularyId: number, status: "learning" | "reviewing" | "mastered") {
  const existing = db.select().from(userVocabulary).where(eq(userVocabulary.id, vocabularyId)).limit(1).all()[0];
  const encounters = existing?.timesEncountered || 0;

  const daysToAdd = encounters === 0 ? 1 : encounters === 1 ? 3 : encounters === 2 ? 7 : encounters === 3 ? 14 : 30;
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + daysToAdd);

  return db.update(userVocabulary).set({
    status,
    timesEncountered: encounters + 1,
    lastReviewedAt: new Date(),
    nextReviewAt: status === "mastered" ? null : nextReview,
  }).where(eq(userVocabulary.id, vocabularyId));
}

export async function removeFromVocabulary(vocabularyId: number) {
  return db.delete(userVocabulary).where(eq(userVocabulary.id, vocabularyId));
}

// Episode Progress
export async function getEpisodeProgress(userId: number, episodeId: number) {
  const result = db.select().from(episodeProgress)
    .where(and(eq(episodeProgress.userId, userId), eq(episodeProgress.episodeId, episodeId)))
    .limit(1).all();
  return result[0] || null;
}

export async function updateEpisodeProgress(userId: number, episodeId: number, watchedDuration: number, totalDuration: number) {
  const pct = Math.round((watchedDuration / totalDuration) * 100);
  const completedAt = pct >= 95 ? new Date() : null;

  const existing = await getEpisodeProgress(userId, episodeId);

  if (existing) {
    return db.update(episodeProgress).set({
      watchedDuration,
      percentageWatched: pct,
      lastWatchedAt: new Date(),
      completedAt: completedAt || existing.completedAt,
    }).where(and(eq(episodeProgress.userId, userId), eq(episodeProgress.episodeId, episodeId)));
  }

  return db.insert(episodeProgress).values({
    userId,
    episodeId,
    watchedDuration,
    percentageWatched: pct,
    lastWatchedAt: new Date(),
    completedAt,
  });
}

export async function getUserStats(userId: number) {
  const vocab = db.select().from(userVocabulary).where(eq(userVocabulary.userId, userId)).all();
  const progress = db.select().from(episodeProgress).where(eq(episodeProgress.userId, userId)).all();

  return {
    totalVocabulary: vocab.length,
    masteredCount: vocab.filter(v => v.status === "mastered").length,
    learningCount: vocab.filter(v => v.status === "learning").length,
    reviewingCount: vocab.filter(v => v.status === "reviewing").length,
    totalEpisodesWatched: progress.length,
    completedEpisodes: progress.filter(p => p.completedAt !== null).length,
  };
}
