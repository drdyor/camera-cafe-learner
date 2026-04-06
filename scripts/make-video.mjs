#!/usr/bin/env node
// End-to-end pipeline: story JSON → YouTube-ready video
// Usage: node make-video.mjs <story-id>
//
// Steps:
// 1. Read story JSON
// 2. Generate Italian TTS audio (Coqui TTS)
// 3. Align audio to text (aeneas) → timed SRT
// 4. Combine: video (from NotebookLM) + Italian audio + subtitles (ffmpeg)
//
// Prerequisites: pip install TTS aeneas, ffmpeg installed

import { execSync, exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");

const storyId = process.argv[2];
if (!storyId) {
  console.log("Usage: node make-video.mjs <story-id>");
  console.log("Available stories:");
  const storiesDir = path.join(dataDir, "stories");
  if (fs.existsSync(storiesDir)) {
    fs.readdirSync(storiesDir).filter(f => f.endsWith(".json")).forEach(f => {
      const s = JSON.parse(fs.readFileSync(path.join(storiesDir, f)));
      console.log(`  ${f.replace(".json", "")} — ${s.title} (${s.level})`);
    });
  }
  process.exit(0);
}

const storyPath = path.join(dataDir, "stories", `${storyId}.json`);
if (!fs.existsSync(storyPath)) {
  console.error(`Story not found: ${storyPath}`);
  process.exit(1);
}

const story = JSON.parse(fs.readFileSync(storyPath, "utf-8"));
const outDir = path.join(dataDir, "video-assets", storyId);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const lines = story.lines.filter(l => l.italian && l.italian.length > 2);
console.log(`\n📖 ${story.title} (${story.level}) — ${lines.length} lines\n`);

// Step 1: Generate Italian narration audio
console.log("🔊 Step 1: Generating Italian TTS audio...");
const fullItalianText = lines.map(l => l.italian).join(". ");
const textFile = path.join(outDir, "narration-text.txt");
fs.writeFileSync(textFile, fullItalianText);

// Use Coqui TTS with Italian model
const audioFile = path.join(outDir, "narration-it.wav");
try {
  execSync(
    `tts --text "${fullItalianText.replace(/"/g, '\\"').slice(0, 5000)}" --model_name tts_models/it/mai_female/glow-tts --out_path "${audioFile}"`,
    { stdio: "pipe", timeout: 300000 }
  );
  console.log(`  ✅ Audio saved: ${audioFile}`);
} catch (err) {
  // Fallback: try with multilingual model
  console.log("  Trying multilingual model...");
  try {
    execSync(
      `tts --text "${fullItalianText.replace(/"/g, '\\"').slice(0, 5000)}" --model_name tts_models/multilingual/multi-dataset/xtts_v2 --language_idx it --out_path "${audioFile}"`,
      { stdio: "pipe", timeout: 300000 }
    );
    console.log(`  ✅ Audio saved: ${audioFile}`);
  } catch (err2) {
    console.log(`  ⚠️ TTS failed. Generate audio manually or use Google TTS.`);
    console.log(`  Text file: ${textFile}`);
  }
}

// Step 2: Generate timed subtitles with aeneas
console.log("\n⏱️ Step 2: Aligning subtitles to audio...");

// Create fragment text file for aeneas (one line per subtitle)
const fragmentFile = path.join(outDir, "fragments.txt");
fs.writeFileSync(fragmentFile, lines.map((l, i) => `${i + 1}|${l.italian}`).join("\n"));

const srtOutIt = path.join(outDir, "subtitles-timed-it.srt");
const srtOutEn = path.join(outDir, "subtitles-timed-en.srt");

if (fs.existsSync(audioFile)) {
  try {
    // aeneas produces a sync map
    const syncFile = path.join(outDir, "sync.json");
    execSync(
      `python -m aeneas.tools.execute_task "${audioFile}" "${fragmentFile}" "task_language=ita|os_task_file_format=json|is_text_type=plain" "${syncFile}"`,
      { stdio: "pipe", timeout: 120000 }
    );

    // Parse sync map into SRT
    const sync = JSON.parse(fs.readFileSync(syncFile));
    const italianSrt = [];
    const englishSrt = [];

    (sync.fragments || []).forEach((frag, i) => {
      const start = formatSrtTime(parseFloat(frag.begin) * 1000);
      const end = formatSrtTime(parseFloat(frag.end) * 1000);
      italianSrt.push(`${i + 1}\n${start} --> ${end}\n${lines[i]?.italian || ""}\n`);
      if (lines[i]?.english) {
        englishSrt.push(`${i + 1}\n${start} --> ${end}\n${lines[i].english}\n`);
      }
    });

    fs.writeFileSync(srtOutIt, italianSrt.join("\n"));
    fs.writeFileSync(srtOutEn, englishSrt.join("\n"));
    console.log(`  ✅ Italian SRT: ${srtOutIt}`);
    console.log(`  ✅ English SRT: ${srtOutEn}`);
  } catch (err) {
    console.log(`  ⚠️ aeneas alignment failed. Using estimated timing instead.`);
    generateEstimatedSrt(lines, srtOutIt, srtOutEn);
  }
} else {
  console.log("  No audio file — using estimated timing.");
  generateEstimatedSrt(lines, srtOutIt, srtOutEn);
}

// Step 3: Combine video + audio + subtitles
console.log("\n🎬 Step 3: Combining assets with ffmpeg...");
const videoInput = path.join(outDir, "notebooklm-video.mp4");
const finalOutput = path.join(outDir, `${storyId}-final.mp4`);

if (fs.existsSync(videoInput) && fs.existsSync(audioFile)) {
  try {
    execSync(
      `ffmpeg -y -i "${videoInput}" -i "${audioFile}" -c:v copy -map 0:v:0 -map 1:a:0 -shortest "${finalOutput}"`,
      { stdio: "pipe", timeout: 120000 }
    );
    console.log(`  ✅ Final video: ${finalOutput}`);

    // Burn in subtitles
    const subtitledOutput = path.join(outDir, `${storyId}-subtitled.mp4`);
    execSync(
      `ffmpeg -y -i "${finalOutput}" -vf "subtitles=${srtOutIt.replace(/\\/g, '/')}:force_style='FontSize=20,PrimaryColour=&H00FFFFFF,BackColour=&H80000000,BorderStyle=4',subtitles=${srtOutEn.replace(/\\/g, '/')}:force_style='FontSize=16,PrimaryColour=&H0093C5FD,BackColour=&H80000000,BorderStyle=4,MarginV=60'" -c:a copy "${subtitledOutput}"`,
      { stdio: "pipe", timeout: 300000 }
    );
    console.log(`  ✅ Subtitled video: ${subtitledOutput}`);
  } catch (err) {
    console.log(`  ⚠️ FFmpeg failed: ${err.message}`);
  }
} else {
  console.log(`  ⏳ Waiting for NotebookLM video. Save it as:`);
  console.log(`     ${videoInput}`);
  console.log(`  Then re-run this script to combine.`);
}

// Step 4: Generate YouTube metadata
console.log("\n📋 YouTube metadata:");
const meta = {
  title: `${story.title} | Learn Italian A1 | Italian Stories for Beginners`,
  description: `🇮🇹 Learn Italian with "${story.title}" (${story.englishTitle})

📚 Level: ${story.level}
⏱️ ${lines.length} sentences
🎯 Uses only ${story.level} vocabulary

Turn on Italian subtitles and follow along!
Click any word with the Camera Cafe Learner Chrome extension for instant translation + conjugation.

#LearnItalian #ItalianStories #${story.level} #ItalianForBeginners`,
};
fs.writeFileSync(path.join(outDir, "youtube-metadata.json"), JSON.stringify(meta, null, 2));
console.log(`  Title: ${meta.title}`);

console.log(`\n✅ All assets in: ${outDir}/`);
console.log("Next steps:");
console.log("  1. Go to notebooklm.google.com");
console.log(`  2. Create notebook, paste story from: data/stories/${storyId}.json`);
console.log("  3. Generate video → download as notebooklm-video.mp4");
console.log(`  4. Save to: ${videoInput}`);
console.log("  5. Re-run this script to combine audio + subtitles");

function formatSrtTime(ms) {
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  const msR = String(Math.floor(ms % 1000)).padStart(3, "0");
  return `${h}:${m}:${s},${msR}`;
}

function generateEstimatedSrt(lines, itPath, enPath) {
  let timeMs = 1000; // 1s lead-in
  const itSrt = [];
  const enSrt = [];

  lines.forEach((line, i) => {
    const words = line.italian.split(/\s+/).length;
    const duration = Math.max(2500, Math.min(6000, words * 600)); // ~600ms per word

    const start = formatSrtTime(timeMs);
    const end = formatSrtTime(timeMs + duration);

    itSrt.push(`${i + 1}\n${start} --> ${end}\n${line.italian}\n`);
    if (line.english) {
      enSrt.push(`${i + 1}\n${start} --> ${end}\n${line.english}\n`);
    }

    timeMs += duration + 400;
  });

  fs.writeFileSync(itPath, itSrt.join("\n"));
  fs.writeFileSync(enPath, enSrt.join("\n"));
  console.log(`  ✅ Estimated Italian SRT: ${itPath}`);
  console.log(`  ✅ Estimated English SRT: ${enPath}`);
}
