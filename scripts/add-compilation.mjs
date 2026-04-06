import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, "..", "data", "app.db"));

// Parse SRT, deduplicating overlapping YouTube auto-subs
function parseSRT(content) {
  const blocks = content.split(/\n\s*\n/).filter(b => b.trim());
  const raw = [];
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 3) continue;
    const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/);
    if (!timeMatch) continue;
    const start = parseTime(timeMatch[1]);
    const end = parseTime(timeMatch[2]);
    const text = lines.slice(2).join(" ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (text.length > 0) raw.push({ start, end, text });
  }

  // Deduplicate: merge overlapping entries with similar text
  const deduped = [];
  for (const entry of raw) {
    const last = deduped[deduped.length - 1];
    if (last && entry.text === last.text) {
      last.end = Math.max(last.end, entry.end);
      continue;
    }
    // Skip if text is substring of previous
    if (last && (last.text.includes(entry.text) || entry.text.includes(last.text))) {
      if (entry.text.length > last.text.length) {
        last.text = entry.text;
        last.end = Math.max(last.end, entry.end);
      } else {
        last.end = Math.max(last.end, entry.end);
      }
      continue;
    }
    deduped.push({ ...entry });
  }
  return deduped;
}

function parseTime(str) {
  const [h, m, rest] = str.split(":");
  const [s, ms] = rest.replace(",", ".").split(".");
  return (parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s)) * 1000 + parseInt(ms);
}

// Add compilation episode
const youtubeId = "8jTr8Ld2QWA";
const title = "Camera Cafe Stagione 5 - Compilation";
const duration = 14130; // seconds

// Check if already exists
const existing = db.prepare("SELECT id FROM episodes WHERE youtubeId = ?").get(youtubeId);
let episodeId;

if (existing) {
  episodeId = existing.id;
  console.log(`Episode already exists with id ${episodeId}, updating subs...`);
  db.prepare("DELETE FROM subtitles WHERE episodeId = ?").run(episodeId);
} else {
  const result = db.prepare(
    "INSERT INTO episodes (title, season, episodeNumber, difficulty, youtubeId, duration, description) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(title, 5, 25, "A2", youtubeId, duration, "4-hour compilation of Camera Cafe Season 5 episodes with original Italian subtitles. Great for immersive learning.");
  episodeId = result.lastInsertRowid;
  console.log(`Created episode with id ${episodeId}`);
}

// Parse and import Italian subs
const srtFile = path.join(__dirname, "..", "data", "subs", `${youtubeId}.it.srt`);
const content = fs.readFileSync(srtFile, "utf-8");
const subs = parseSRT(content);
console.log(`Parsed ${subs.length} deduplicated Italian subtitles`);

const insert = db.prepare("INSERT INTO subtitles (episodeId, language, sequenceNumber, startTime, endTime, text) VALUES (?, ?, ?, ?, ?, ?)");
const tx = db.transaction(() => {
  for (let i = 0; i < subs.length; i++) {
    insert.run(episodeId, "it", i + 1, subs[i].start, subs[i].end, subs[i].text);
  }
});
tx();
console.log(`Inserted ${subs.length} Italian subtitles for episode ${episodeId}`);

// Also add the 18-min compilation
const vid2 = "dOXgwWLR-sA";
const existing2 = db.prepare("SELECT id FROM episodes WHERE youtubeId = ?").get(vid2);
if (!existing2) {
  db.prepare(
    "INSERT INTO episodes (title, season, episodeNumber, difficulty, youtubeId, duration, description) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run("Camera Cafe - Feromoni (Vecchi episodi)", 1, 1, "A2", vid2, 1105, "18-minute collection of classic Camera Cafe episodes.");
  console.log("Added 18-min compilation too");
}

// Add two more longer single episodes
for (const ep of [
  { id: "KVO0GACP7Sg", title: "La ex di Luca", s: 3, e: 70, dur: 568 },
  { id: "yMhxx7XIPaE", title: "Il palmare", s: 4, e: 38, dur: 491 },
  { id: "bK7I8xlxN7A", title: "Attrazione fatale", s: 5, e: 14, dur: 519 },
]) {
  const ex = db.prepare("SELECT id FROM episodes WHERE youtubeId = ?").get(ep.id);
  if (!ex) {
    db.prepare(
      "INSERT INTO episodes (title, season, episodeNumber, difficulty, youtubeId, duration, description) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(ep.title, ep.s, ep.e, "A2", ep.id, ep.dur, `Camera Cafe S${ep.s}E${ep.e} - ${ep.title}`);
    console.log(`Added episode: ${ep.title}`);
  }
}

db.close();
console.log("Done!");
