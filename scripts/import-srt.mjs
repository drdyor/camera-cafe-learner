import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createConnection } from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseSrt(content) {
  const blocks = content.trim().split(/\n\s*\n/);
  const subs = [];

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 3) continue;

    const timeMatch = lines[1].match(
      /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/
    );
    if (!timeMatch) continue;

    const startMs =
      parseInt(timeMatch[1]) * 3600000 +
      parseInt(timeMatch[2]) * 60000 +
      parseInt(timeMatch[3]) * 1000 +
      parseInt(timeMatch[4]);

    const endMs =
      parseInt(timeMatch[5]) * 3600000 +
      parseInt(timeMatch[6]) * 60000 +
      parseInt(timeMatch[7]) * 1000 +
      parseInt(timeMatch[8]);

    const text = lines.slice(2).join(" ").trim();
    if (text) {
      subs.push({ startTime: startMs, endTime: endMs, text });
    }
  }

  return subs;
}

// De-duplicate overlapping auto-generated subs
// Strategy: take every other entry (odd-indexed), which gives cleaner non-overlapping text
function deduplicateSubs(subs) {
  if (subs.length < 4) return subs;

  // For auto-generated subs, even entries tend to be fragments and odd entries
  // are the "completed" versions. Take odd entries.
  const deduped = [];
  for (let i = 1; i < subs.length; i += 2) {
    deduped.push(subs[i]);
  }
  // If last entry was even, include it
  if (subs.length % 2 === 1) {
    deduped.push(subs[subs.length - 1]);
  }
  return deduped;
}

async function importSrt() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error("Usage: node import-srt.mjs <episodeId> <language> <srtFile>");
    process.exit(1);
  }

  const [episodeIdStr, language, srtFile] = args;
  const episodeId = parseInt(episodeIdStr);
  const srtPath = path.resolve(srtFile);

  if (!fs.existsSync(srtPath)) {
    console.error(`SRT file not found: ${srtPath}`);
    process.exit(1);
  }

  const connection = await createConnection(process.env.DATABASE_URL);

  try {
    const content = fs.readFileSync(srtPath, "utf-8");
    const rawSubs = parseSrt(content);
    const subs = deduplicateSubs(rawSubs);

    console.log(`Parsed ${rawSubs.length} raw subs, deduped to ${subs.length}`);

    // Clear existing subs for this episode+language
    await connection.execute(
      "DELETE FROM subtitles WHERE episodeId = ? AND language = ?",
      [episodeId, language]
    );

    let seq = 1;
    for (const sub of subs) {
      await connection.execute(
        `INSERT INTO subtitles (episodeId, language, sequenceNumber, startTime, endTime, text, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [episodeId, language, seq++, sub.startTime, sub.endTime, sub.text]
      );
    }

    console.log(`✓ Imported ${subs.length} ${language} subtitles for episode ${episodeId}`);
  } finally {
    await connection.end();
  }
}

importSrt().catch(err => {
  console.error("Import failed:", err);
  process.exit(1);
});
