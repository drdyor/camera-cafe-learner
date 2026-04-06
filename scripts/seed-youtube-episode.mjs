import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createConnection } from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse SRT file into structured subtitle entries
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

// Merge overlapping/fragmented auto-generated subs into cleaner blocks
function mergeSubtitles(subs, gapThresholdMs = 500) {
  if (subs.length === 0) return [];

  const merged = [];
  let current = { ...subs[0] };

  for (let i = 1; i < subs.length; i++) {
    const next = subs[i];
    // If next sub starts before current ends or within threshold, merge
    if (next.startTime <= current.endTime + gapThresholdMs) {
      current.endTime = Math.max(current.endTime, next.endTime);
      current.text += " " + next.text;
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);
  return merged;
}

const EPISODES = [
  {
    youtubeId: "TrBFyBIkdQA",
    title: "La guerra dei calendari",
    season: 2,
    episodeNumber: 4,
    description: "Luca e Paolo litigano per i calendari in ufficio. Una commedia classica sulla vita quotidiana al distributore del caffè.",
    duration: 274, // 4:34
    difficulty: "A2",
  },
  {
    youtubeId: "sAWUKxMbDY8",
    title: "L'amica del cuore",
    season: 4,
    episodeNumber: 276,
    description: "Un'amica speciale arriva in ufficio e sconvolge la routine del caffè.",
    duration: 307, // 5:07
    difficulty: "B1",
  },
  {
    youtubeId: "Dom4sY1TPMU",
    title: "Pecora",
    season: 4,
    episodeNumber: 114,
    description: "Un episodio divertente sulla vita d'ufficio con il solito caffè come sfondo.",
    duration: 370, // 6:10
    difficulty: "A2",
  },
  {
    youtubeId: "LHhXEArKzIg",
    title: "Al centesimo",
    season: 2,
    episodeNumber: 90,
    description: "Questioni di soldi e centesimi al distributore del caffè creano situazioni esilaranti.",
    duration: 368, // 6:08
    difficulty: "B1",
  },
  {
    youtubeId: "DjQnFO9WTG8",
    title: "Eroe per caso",
    season: 2,
    episodeNumber: 87,
    description: "Un atto eroico inaspettato trasforma la giornata in ufficio.",
    duration: 514, // 8:34
    difficulty: "B1",
  },
];

async function seedEpisodes() {
  const connection = await createConnection(process.env.DATABASE_URL);

  try {
    for (const ep of EPISODES) {
      const videoUrl = `https://www.youtube.com/watch?v=${ep.youtubeId}`;

      // Check if episode already exists
      const [existing] = await connection.execute(
        "SELECT id FROM episodes WHERE title = ? AND season = ?",
        [ep.title, ep.season]
      );

      if (existing.length > 0) {
        console.log(`⏭ Skipping "${ep.title}" (already exists)`);
        continue;
      }

      // Insert episode
      const [result] = await connection.execute(
        `INSERT INTO episodes (title, season, episodeNumber, description, duration, difficulty, videoUrl, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [ep.title, ep.season, ep.episodeNumber, ep.description, ep.duration, ep.difficulty, videoUrl]
      );

      const episodeId = result.insertId;
      console.log(`✓ Created episode "${ep.title}" (ID: ${episodeId})`);

      // Try to load Italian subtitles from subs/ directory
      const srtPath = path.join(__dirname, "..", "subs", `${ep.youtubeId}.it.srt`);
      if (fs.existsSync(srtPath)) {
        const srtContent = fs.readFileSync(srtPath, "utf-8");
        const rawSubs = parseSrt(srtContent);
        const subs = mergeSubtitles(rawSubs, 300);

        let seq = 1;
        for (const sub of subs) {
          await connection.execute(
            `INSERT INTO subtitles (episodeId, language, sequenceNumber, startTime, endTime, text, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [episodeId, "it", seq++, sub.startTime, sub.endTime, sub.text]
          );
        }
        console.log(`  ✓ Imported ${subs.length} Italian subtitles`);
      } else {
        console.log(`  ⚠ No Italian SRT found at ${srtPath}`);
      }

      // Try English subtitles
      const enSrtPath = path.join(__dirname, "..", "subs", `${ep.youtubeId}.en.srt`);
      if (fs.existsSync(enSrtPath)) {
        const srtContent = fs.readFileSync(enSrtPath, "utf-8");
        const rawSubs = parseSrt(srtContent);
        const subs = mergeSubtitles(rawSubs, 300);

        let seq = 1;
        for (const sub of subs) {
          await connection.execute(
            `INSERT INTO subtitles (episodeId, language, sequenceNumber, startTime, endTime, text, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [episodeId, "en", seq++, sub.startTime, sub.endTime, sub.text]
          );
        }
        console.log(`  ✓ Imported ${subs.length} English subtitles`);
      }
    }

    console.log("\n✓ All episodes seeded!");
  } finally {
    await connection.end();
  }
}

seedEpisodes().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
