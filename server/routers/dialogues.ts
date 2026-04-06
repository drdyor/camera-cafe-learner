import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";

const dialoguesDir = path.resolve(import.meta.dirname, "../../data/dialogues");

interface DialogueLine {
  speaker: string;
  italian: string;
  english: string;
}

interface PracticePrompt {
  prompt: string;
  answer: string;
}

interface Dialogue {
  id: string;
  title: string;
  englishTitle: string;
  level: string;
  gcseTheme: string;
  scenario: string;
  characters: { id: string; name: string; emoji: string; role: string }[];
  lines: DialogueLine[];
  keyVocab: string[];
  practicePrompts: PracticePrompt[];
}

function loadDialogue(id: string): Dialogue | null {
  const filePath = path.join(dialoguesDir, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function loadAllDialogues(): Dialogue[] {
  if (!fs.existsSync(dialoguesDir)) return [];
  return fs
    .readdirSync(dialoguesDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => loadDialogue(f.replace(".json", ""))!)
    .filter(Boolean);
}

export const dialoguesRouter = router({
  list: publicProcedure.query(() => {
    return loadAllDialogues().map((d) => ({
      id: d.id,
      title: d.title,
      englishTitle: d.englishTitle,
      level: d.level,
      gcseTheme: d.gcseTheme,
      scenario: d.scenario,
      lineCount: d.lines.length,
      characters: d.characters,
    }));
  }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const dialogue = loadDialogue(input.id);
      if (!dialogue) throw new Error(`Dialogue not found: ${input.id}`);
      return dialogue;
    }),
});
