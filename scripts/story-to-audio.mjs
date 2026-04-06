// Generates Italian audio + timed subtitles from a story JSON
// Uses edge-tts (Microsoft neural TTS) — free, high quality
// Usage: node story-to-audio.mjs <story-id>

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storyId = process.argv[2];
if (!storyId) { console.log("Usage: node story-to-audio.mjs <story-id>"); process.exit(0); }

const storyPath = path.join(__dirname, "..", "data", "stories", `${storyId}.json`);
const story = JSON.parse(fs.readFileSync(storyPath, "utf-8"));
const lines = story.lines.filter(l => l.italian && l.italian.length > 2);

const outDir = path.join(__dirname, "..", "data", "video-assets", storyId);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

console.log(`\n📖 ${story.title} (${story.level}) — ${lines.length} lines\n`);

// Generate audio for each line separately (for precise timing)
const voice = "it-IT-IsabellaNeural";
const rate = "-15%"; // Slightly slower for learners
const lineAudioFiles = [];
let totalDurationMs = 0;

// Add 1.5s silence at start
const silenceFile = path.join(outDir, "silence.mp3");
execSync(`ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t 1.5 -q:a 9 -acodec libmp3lame "${silenceFile}" 2>NUL`);
lineAudioFiles.push(silenceFile);
totalDurationMs += 1500;

// SRT builders
const italianSrt = [];
const englishSrt = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const audioFile = path.join(outDir, `line-${String(i).padStart(3, "0")}.mp3`);
  const vttFile = path.join(outDir, `line-${String(i).padStart(3, "0")}.vtt`);

  // Generate audio + timing for this line
  const text = line.italian.replace(/"/g, '\\"');
  execSync(
    `python -m edge_tts --voice "${voice}" --rate="${rate}" --text "${text}" --write-media "${audioFile}" --write-subtitles "${vttFile}"`,
    { timeout: 30000 }
  );

  // Get audio duration via ffprobe
  const durationStr = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioFile}"`,
    { encoding: "utf-8" }
  ).trim();
  const durationMs = Math.ceil(parseFloat(durationStr) * 1000);

  // Build SRT entries with accumulated timing
  const startTime = totalDurationMs;
  const endTime = totalDurationMs + durationMs;

  italianSrt.push(
    `${i + 1}\n${formatSrtTime(startTime)} --> ${formatSrtTime(endTime)}\n${line.italian}\n`
  );
  if (line.english) {
    englishSrt.push(
      `${i + 1}\n${formatSrtTime(startTime)} --> ${formatSrtTime(endTime)}\n${line.english}\n`
    );
  }

  lineAudioFiles.push(audioFile);
  totalDurationMs = endTime;

  // Add pause between lines (800ms)
  const pauseFile = path.join(outDir, `pause-${String(i).padStart(3, "0")}.mp3`);
  execSync(`ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t 0.8 -q:a 9 -acodec libmp3lame "${pauseFile}" 2>NUL`);
  lineAudioFiles.push(pauseFile);
  totalDurationMs += 800;

  process.stdout.write(`  ${i + 1}/${lines.length}\r`);
}

// Concatenate all audio files
console.log(`\n\n🔗 Concatenating ${lineAudioFiles.length} audio segments...`);
const listFile = path.join(outDir, "concat-list.txt");
fs.writeFileSync(listFile, lineAudioFiles.map(f => `file '${f.replace(/\\/g, '/')}'`).join("\n"));

const finalAudio = path.join(outDir, `${storyId}-narration.mp3`);
execSync(`ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${finalAudio}" 2>NUL`);

// Write SRT files
const srtItFile = path.join(outDir, `${storyId}-it.srt`);
const srtEnFile = path.join(outDir, `${storyId}-en.srt`);
fs.writeFileSync(srtItFile, italianSrt.join("\n"));
fs.writeFileSync(srtEnFile, englishSrt.join("\n"));

// Clean up temp files
lineAudioFiles.forEach(f => { if (f.includes("line-") || f.includes("pause-") || f.includes("silence")) try { fs.unlinkSync(f); } catch {} });
fs.readdirSync(outDir).filter(f => f.endsWith(".vtt") && f.startsWith("line-")).forEach(f => fs.unlinkSync(path.join(outDir, f)));
try { fs.unlinkSync(listFile); } catch {}

const totalSeconds = Math.ceil(totalDurationMs / 1000);
console.log(`\n✅ Done!`);
console.log(`  🔊 Audio: ${finalAudio} (${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")})`);
console.log(`  🇮🇹 Italian SRT: ${srtItFile}`);
console.log(`  🇬🇧 English SRT: ${srtEnFile}`);
console.log(`\nNext: Go to notebooklm.google.com, paste the story, generate video.`);
console.log(`Save as: ${path.join(outDir, "notebooklm-video.mp4")}`);
console.log(`Then run: node scripts/make-video.mjs ${storyId}`);

function formatSrtTime(ms) {
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  const msR = String(Math.floor(ms % 1000)).padStart(3, "0");
  return `${h}:${m}:${s},${msR}`;
}
