import Database from "better-sqlite3";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, "..", "data", "app.db"));

async function translate(prompt) {
  const res = await axios.post("http://localhost:11434/api/generate", {
    model: "qwen3:8b",
    prompt,
    stream: false,
    options: { temperature: 0.2, num_predict: 4096 },
  }, { timeout: 60000 });
  return (res.data.response || "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

async function main() {
  // Get all single-word phrases with bad translations (full subtitle line)
  const words = db.prepare(
    "SELECT id, italianText FROM phrases WHERE wordCount = 1 AND LENGTH(englishTranslation) > 30"
  ).all();

  console.log(`${words.length} words need translation`);

  const batchSize = 40;
  const update = db.prepare("UPDATE phrases SET englishTranslation = ? WHERE id = ?");

  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize);
    const wordList = batch.map((w, idx) => `${idx + 1}. ${w.italianText}`).join("\n");

    const result = await translate(`/no_think\nTranslate each Italian word to English. One word or short phrase per line. Keep numbering.\n\n${wordList}`);

    const lines = result.split("\n").filter(l => l.trim());

    for (let j = 0; j < batch.length; j++) {
      const lineMatch = lines.find(l => l.match(new RegExp(`^${j + 1}\\.\\s`)));
      let trans = lineMatch
        ? lineMatch.replace(/^\d+\.\s*/, "").trim()
        : (lines[j] ? lines[j].replace(/^\d+\.\s*/, "").trim() : batch[j].italianText);
      // Clean any remaining artifacts
      trans = trans.replace(/\*\*/g, "").replace(/^\-+\s*/, "").trim();
      if (trans.length > 0) {
        update.run(trans, batch[j].id);
      }
    }
    process.stdout.write(`  ${Math.min(i + batchSize, words.length)}/${words.length}\r`);
  }

  console.log("\nDone!");
  db.close();
}

main().catch(err => { console.error(err); process.exit(1); });
