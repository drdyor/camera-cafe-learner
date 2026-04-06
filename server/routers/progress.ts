import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as dbHelpers from "../db-helpers";
import { TRPCError } from "@trpc/server";

export const progressRouter = router({
  /**
   * Get user's progress for a specific episode
   */
  getEpisodeProgress: protectedProcedure
    .input(z.object({ episodeId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const progress = await dbHelpers.getEpisodeProgress(
          ctx.user.id,
          input.episodeId
        );
        return progress;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch progress",
        });
      }
    }),

  /**
   * Update episode progress (watched duration)
   */
  updateEpisodeProgress: protectedProcedure
    .input(
      z.object({
        episodeId: z.number(),
        watchedDuration: z.number().int().nonnegative(),
        totalDuration: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await dbHelpers.updateEpisodeProgress(
          ctx.user.id,
          input.episodeId,
          input.watchedDuration,
          input.totalDuration
        );

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update progress",
        });
      }
    }),

  /**
   * Get user's overall learning statistics
   */
  getUserStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const stats = await dbHelpers.getUserStats(ctx.user.id);

      return (
        stats || {
          totalVocabulary: 0,
          masteredCount: 0,
          learningCount: 0,
          reviewingCount: 0,
          totalEpisodesWatched: 0,
          completedEpisodes: 0,
        }
      );
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch statistics",
      });
    }
  }),
});
