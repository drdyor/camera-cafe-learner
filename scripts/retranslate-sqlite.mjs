import Database from "better-sqlite3";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, "..", "data", "app.db"));

const OLLAMA_URL = "http://localhost:11434/api/generate";

async function translate(prompt, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await axios.post(OLLAMA_URL, {
        model: "qwen3:8b",
        prompt,
        stream: false,
        options: { temperature: 0.3, num_predict: 2048 },
      }, { timeout: 120000 });
      let text = res.data.response || "";
      return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    } catch (err) {
      if (attempt < retries - 1) {
        console.log(`  Retry ${attempt + 1}...`);
        await new Promise(r => setTimeout(r, 3000));
      } else throw err;
    }
  }
}

async function retranslateEpisode(episodeId) {
  const itSubs = db.prepare("SELECT * FROM subtitles WHERE episodeId = ? AND language = 'it' ORDER BY sequenceNumber").all(episodeId);
  console.log(`\nEpisode ${episodeId}: ${itSubs.length} Italian subs`);

  // Delete bad English subs
  db.prepare("DELETE FROM subtitles WHERE episodeId = ? AND language = 'en'").run(episodeId);

  const batchSize = 10;
  const insertStmt = db.prepare("INSERT INTO subtitles (episodeId, language, sequenceNumber, startTime, endTime, text) VALUES (?, 'en', ?, ?, ?, ?)");

  for (let i = 0; i < itSubs.length; i += batchSize) {
    const batch = itSubs.slice(i, i + batchSize);
    const numbered = batch.map((s, idx) => `${i + idx + 1}. ${s.text}`).join("\n");

    const result = await translate(`/no_think\nTranslate each numbered Italian line to natural English. Keep numbering. Output ONLY translations.\n\n${numbered}`);
    const lines = result.split("\n").filter(l => l.trim());

    for (let j = 0; j < batch.length; j++) {
      const lineMatch = lines.find(l => l.match(new RegExp(`^${i + j + 1}\\.\\s`)));
      let translation = lineMatch
        ? lineMatch.replace(/^\d+\.\s*/, "").trim()
        : (lines[j] ? lines[j].replace(/^\d+\.\s*/, "").trim() : "...");

      insertStmt.run(episodeId, batch[j].sequenceNumber, batch[j].startTime, batch[j].endTime, translation);
    }
    process.stdout.write(`  ${Math.min(i + batchSize, itSubs.length)}/${itSubs.length}\r`);
  }
  console.log(`  Done`);
}

const epIds = process.argv.slice(2).map(Number);
for (const id of epIds) {
  await retranslateEpisode(id);
}
db.close();
console.log("All done!");
