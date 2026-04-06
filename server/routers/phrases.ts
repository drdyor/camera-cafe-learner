import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import * as dbHelpers from "../db-helpers";
import {
  extractPhrasesFromSubtitle,
  parseSRTSubtitles,
} from "../phrase-extractor";
import { TRPCError } from "@trpc/server";

export const phrasesRouter = router({
  /**
   * Get phrases for an episode, optionally filtered by CEFR level
   */
  getByEpisode: publicProcedure
    .input(
      z.object({
        episodeId: z.number(),
        cefrLevel: z.enum(["A1", "A2", "B1", "B2"]).optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const phrases = await dbHelpers.getPhrasesByEpisode(
          input.episodeId,
          input.cefrLevel
        );
        return phrases;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch phrases",
        });
      }
    }),

  /**
   * Extract and process phrases from uploaded subtitles
   * Admin only - processes Italian and English subtitles
   */
  extractFromSubtitles: protectedProcedure
    .input(
      z.object({
        episodeId: z.number(),
        italianSrtContent: z.string(),
        englishSrtContent: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can process subtitles",
        });
      }

      try {
        // Parse both subtitle files
        const italianSubs = parseSRTSubtitles(input.italianSrtContent);
        const englishSubs = parseSRTSubtitles(input.englishSrtContent);

        if (italianSubs.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No subtitles found in Italian file",
          });
        }

        // Create a map of English subtitles by timing for quick lookup
        const englishMap = new Map<number, string>();
        englishSubs.forEach(sub => {
          englishMap.set(sub.startTime, sub.text);
        });

        // Store parsed subtitles in database
        const italianSubtitleData = italianSubs.map(sub => ({
          episodeId: input.episodeId,
          language: "it" as const,
          sequenceNumber: sub.sequenceNumber,
          startTime: sub.startTime,
          endTime: sub.endTime,
          text: sub.text,
        }));

        const englishSubtitleData = englishSubs.map(sub => ({
          episodeId: input.episodeId,
          language: "en" as const,
          sequenceNumber: sub.sequenceNumber,
          startTime: sub.startTime,
          endTime: sub.endTime,
          text: sub.text,
        }));

        await dbHelpers.createSubtitles([
          ...italianSubtitleData,
          ...englishSubtitleData,
        ]);

        // Extract phrases with Kelly scoring
        const allPhrases: Array<{
          episodeId: number;
          italianText: string;
          englishTranslation: string;
          subtitleId?: number;
          startTime: number;
          endTime: number;
          wordCount: number;
          minFrequencyRank: number;
          cefrLevel: "A1" | "A2" | "B1" | "B2";
          isLearnable: boolean;
        }> = [];

        for (const italianSub of italianSubs) {
          const englishText = englishMap.get(italianSub.startTime) || "";

          const extractedPhrases = await extractPhrasesFromSubtitle(
            italianSub.text,
            englishText,
            italianSub.startTime,
            italianSub.endTime
          );

          allPhrases.push(
            ...extractedPhrases.map(phrase => ({
              episodeId: input.episodeId,
              italianText: phrase.italianText,
              englishTranslation: phrase.englishTranslation,
              startTime: phrase.startTime,
              endTime: phrase.endTime,
              wordCount: phrase.wordCount,
              minFrequencyRank: phrase.minFrequencyRank,
              cefrLevel: phrase.cefrLevel,
              isLearnable: phrase.isLearnable,
            }))
          );
        }

        // Store phrases in database
        if (allPhrases.length > 0) {
          await dbHelpers.createPhrases(allPhrases);
        }

        return {
          success: true,
          subtitlesProcessed: italianSubs.length,
          phrasesExtracted: allPhrases.length,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to process subtitles: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),

  /**
   * Lookup Kelly frequency for a word
   */
  lookupWord: publicProcedure
    .input(z.object({ word: z.string() }))
    .query(async ({ input }) => {
      try {
        const kellyWord = await dbHelpers.lookupKellyWord(input.word);
        return kellyWord;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to lookup word",
        });
      }
    }),
});
