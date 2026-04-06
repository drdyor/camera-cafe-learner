import { publicProcedure, router } from "./_core/trpc";
import { episodesRouter } from "./routers/episodes";
import { phrasesRouter } from "./routers/phrases";
import { vocabularyRouter } from "./routers/vocabulary";
import { progressRouter } from "./routers/progress";
import { storiesRouter } from "./routers/stories";
import { kellyRouter } from "./routers/kelly";
import { dictionaryRouter } from "./routers/dictionary";
import { srsRouter } from "./routers/srs";
import { dialoguesRouter } from "./routers/dialogues";

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
  }),
  episodes: episodesRouter,
  phrases: phrasesRouter,
  vocabulary: vocabularyRouter,
  progress: progressRouter,
  stories: storiesRouter,
  kelly: kellyRouter,
  dictionary: dictionaryRouter,
  srs: srsRouter,
  dialogues: dialoguesRouter,
});

export type AppRouter = typeof appRouter;
