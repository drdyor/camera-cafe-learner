import { publicProcedure, router } from "../_core/trpc";
import fs from "node:fs";
import path from "node:path";

const dictPath = path.resolve(import.meta.dirname, "../../data/italian-dictionary.json");
const verbsPath = path.resolve(import.meta.dirname, "../../data/irregular-verbs.json");

let dictCache: Record<string, { en: string; g?: string; emoji?: string; cat?: string }> | null = null;
let verbsCache: Record<string, { inf: string; en: string; tense: string; person: string }> | null = null;

function getDict() {
  if (!dictCache) dictCache = JSON.parse(fs.readFileSync(dictPath, "utf-8"));
  return dictCache!;
}

function getVerbs() {
  if (!verbsCache) verbsCache = JSON.parse(fs.readFileSync(verbsPath, "utf-8"));
  return verbsCache!;
}

export const dictionaryRouter = router({
  lookup: publicProcedure.query(() => getDict()),
  verbs: publicProcedure.query(() => getVerbs()),
});
