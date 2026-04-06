import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";

const storiesDir = path.resolve(import.meta.dirname, "../../data/stories");

interface StoryLine {
  italian: string;
  english: string;
}

interface Story {
  id: string;
  title: string;
  englishTitle: string;
  level: string;
  lines: StoryLine[];
  generatedAt: string;
  gcseTheme?: string;
  gcseTopic?: string;
}

function loadStory(id: string): Story | null {
  const filePath = path.join(storiesDir, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

// Recommended reading order: easiest first, building vocabulary progressively
const storyOrder: Record<string, number> = {
  // Graded Classics
  "tre-porcellini": 1,
  "riccioli-doro": 2,
  "pompei": 3,
  "leonardo": 4,
  "pinocchio": 5,
  "caverna-platone": 6,
  "romeo-giulietta": 7,
  "dante-inferno": 8,
  "galileo": 9,
  "marco-polo": 10,
  // GCSE Exam Stories
  "gcse-theme1-family-technology": 11,
  "gcse-theme2-travel-environment": 12,
  "gcse-theme3-school-career": 13,
};

function loadAllStories(): Story[] {
  if (!fs.existsSync(storiesDir)) return [];
  return fs
    .readdirSync(storiesDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => loadStory(f.replace(".json", ""))!)
    .filter(Boolean)
    .sort((a, b) => (storyOrder[a.id] ?? 99) - (storyOrder[b.id] ?? 99));
}

export const storiesRouter = router({
  list: publicProcedure.query(() => {
    return loadAllStories().map((s) => ({
      id: s.id,
      title: s.title,
      englishTitle: s.englishTitle,
      level: s.level,
      lineCount: s.lines.length,
      order: storyOrder[s.id] ?? 99,
      gcseTheme: s.gcseTheme || null,
    }));
  }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const story = loadStory(input.id);
      if (!story) throw new Error(`Story not found: ${input.id}`);
      return story;
    }),
});
