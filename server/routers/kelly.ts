import { publicProcedure, router } from "../_core/trpc";
import fs from "node:fs";
import path from "node:path";

const kellyPath = path.resolve(import.meta.dirname, "../../extension/kelly.json");
let kellyCache: Record<string, { r: number; c: string; p: string }> | null = null;

function getKelly() {
  if (!kellyCache) {
    kellyCache = JSON.parse(fs.readFileSync(kellyPath, "utf-8"));
  }
  return kellyCache!;
}

export const kellyRouter = router({
  lookup: publicProcedure.query(() => {
    return getKelly();
  }),
});
