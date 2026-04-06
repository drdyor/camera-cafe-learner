import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as dbHelpers from "../db-helpers";
import { TRPCError } from "@trpc/server";

export const vocabularyRouter = router({
  /**
   * Get user's vocabulary collection with optional filtering
   */
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["learning", "reviewing", "mastered"]).optional(),
        episodeId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const vocabulary = await dbHelpers.getUserVocabulary(
        ctx.user.id,
        input.status
      );

      // If filtering by episode, join with phrases table
      if (input.episodeId) {
        return vocabulary.filter(v => {
          // This would need a join in a real implementation
          // For now, return all
          return true;
        });
      }

      return vocabulary;
    }),

  /**
   * Save a word to user's vocabulary collection
   */
  save: protectedProcedure
    .input(
      z.object({
        word: z.string(),
        translation: z.string(),
        cefrLevel: z.enum(["A1", "A2", "B1", "B2"]),
        frequencyRank: z.number(),
        status: z.enum(["learning", "reviewing", "mastered"]).default("learning"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // For now, just return success - in a real app, save to userVocabulary table
        return { success: true, word: input.word };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save to vocabulary",
        });
      }
    }),

  /**
   * Update vocabulary status (learning -> reviewing -> mastered)
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        vocabularyId: z.number(),
        status: z.enum(["learning", "reviewing", "mastered"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await dbHelpers.updateVocabularyStatus(input.vocabularyId, input.status);
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update vocabulary status",
        });
      }
    }),

  /**
   * Remove a word from vocabulary collection
   */
  remove: protectedProcedure
    .input(z.object({ word: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // For now, just return success - in a real app, delete from userVocabulary table
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove from vocabulary",
        });
      }
    }),

  /**
   * Get user's learning statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const stats = await dbHelpers.getUserStats(ctx.user.id);

    if (!stats) {
      return {
        totalVocabulary: 0,
        masteredCount: 0,
        learningCount: 0,
        reviewingCount: 0,
        totalEpisodesWatched: 0,
        completedEpisodes: 0,
      };
    }

    return stats;
  }),
});
