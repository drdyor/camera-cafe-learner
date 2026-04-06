import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, "..", "data", "app.db"));

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
  // Deduplicate overlapping entries
  const deduped = [];
  for (const entry of raw) {
    const last = deduped[deduped.length - 1];
    if (last && entry.text === last.text) { last.end = Math.max(last.end, entry.end); continue; }
    if (last && (last.text.includes(entry.text) || entry.text.includes(last.text))) {
      if (entry.text.length > last.text.length) { last.text = entry.text; }
      last.end = Math.max(last.end, entry.end);
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

const episodes = [
  { youtubeId: "dOXgwWLR-sA" },
  { youtubeId: "KVO0GACP7Sg" },
  { youtubeId: "yMhxx7XIPaE" },
  { youtubeId: "bK7I8xlxN7A" },
];

const insert = db.prepare("INSERT INTO subtitles (episodeId, language, sequenceNumber, startTime, endTime, text) VALUES (?, ?, ?, ?, ?, ?)");

for (const ep of episodes) {
  const row = db.prepare("SELECT id FROM episodes WHERE youtubeId = ?").get(ep.youtubeId);
  if (!row) { console.log(`Episode ${ep.youtubeId} not in DB, skipping`); continue; }

  const srtFile = path.join(__dirname, "..", "data", "subs", `${ep.youtubeId}.it.srt`);
  if (!fs.existsSync(srtFile)) { console.log(`No SRT for ${ep.youtubeId}`); continue; }

  // Clear existing subs
  db.prepare("DELETE FROM subtitles WHERE episodeId = ? AND language = 'it'").run(row.id);

  const subs = parseSRT(fs.readFileSync(srtFile, "utf-8"));
  const tx = db.transaction(() => {
    for (let i = 0; i < subs.length; i++) {
      insert.run(row.id, "it", i + 1, subs[i].start, subs[i].end, subs[i].text);
    }
  });
  tx();
  console.log(`Episode ${row.id} (${ep.youtubeId}): imported ${subs.length} Italian subs`);
}

db.close();
