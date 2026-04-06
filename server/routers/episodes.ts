import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import * as dbHelpers from "../db-helpers";
import { db } from "../db";
import { subtitles } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

export const episodesRouter = router({
  list: publicProcedure
    .input(
      z.object({
        difficulty: z.enum(["A1", "A2", "B1", "B2"]).optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      let episodes = await dbHelpers.getEpisodes(input.difficulty);

      if (input.search) {
        const searchLower = input.search.toLowerCase();
        episodes = episodes.filter(
          ep =>
            ep.title.toLowerCase().includes(searchLower) ||
            ep.description?.toLowerCase().includes(searchLower)
        );
      }

      // Map youtubeId to videoUrl for frontend compatibility
      return episodes.map(ep => ({
        ...ep,
        videoUrl: ep.youtubeId ? `https://www.youtube.com/watch?v=${ep.youtubeId}` : null,
      }));
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const episode = await dbHelpers.getEpisodeById(input.id);
      if (!episode) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Episode not found" });
      }
      return {
        ...episode,
        videoUrl: episode.youtubeId ? `https://www.youtube.com/watch?v=${episode.youtubeId}` : null,
      };
    }),

  getItalianSubtitles: publicProcedure
    .input(z.object({ episodeId: z.number() }))
    .query(async ({ input }) => {
      const result = db
        .select()
        .from(subtitles)
        .where(and(eq(subtitles.episodeId, input.episodeId), eq(subtitles.language, "it")))
        .orderBy(subtitles.sequenceNumber)
        .all();

      return result.map(sub => ({
        id: sub.id,
        startTime: sub.startTime,
        endTime: sub.endTime,
        text: sub.text,
      }));
    }),

  getEnglishSubtitles: publicProcedure
    .input(z.object({ episodeId: z.number() }))
    .query(async ({ input }) => {
      const result = db
        .select()
        .from(subtitles)
        .where(and(eq(subtitles.episodeId, input.episodeId), eq(subtitles.language, "en")))
        .orderBy(subtitles.sequenceNumber)
        .all();

      return result.map(sub => ({
        id: sub.id,
        startTime: sub.startTime,
        endTime: sub.endTime,
        text: sub.text,
      }));
    }),
});
