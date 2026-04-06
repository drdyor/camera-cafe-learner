import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Takes a story JSON and produces:
// 1. Scene descriptions for Google Veo (English)
// 2. Italian narration script (for TTS)
// 3. SRT subtitle files (Italian + English)
// 4. YouTube description with vocabulary list

function processStory(storyId) {
  const storyPath = path.join(__dirname, "..", "data", "stories", `${storyId}.json`);
  const story = JSON.parse(fs.readFileSync(storyPath, "utf-8"));
  const outDir = path.join(__dirname, "..", "data", "video-assets", storyId);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const lines = story.lines.filter(l => l.italian && l.italian.length > 2);

  // 1. Scene descriptions for Veo
  // Group ~3-4 lines per scene (each scene = ~10-15 seconds of video)
  const scenes = [];
  for (let i = 0; i < lines.length; i += 3) {
    const batch = lines.slice(i, i + 3);
    const englishContext = batch.map(l => l.english || l.italian).join(". ");
    scenes.push({
      sceneNumber: scenes.length + 1,
      duration: "10-12 seconds",
      prompt: `Animated fairy tale style, warm colors, storybook illustration: ${englishContext}. Studio Ghibli inspired, soft lighting, children's book aesthetic.`,
      narrationLines: batch.map(l => l.italian),
    });
  }

  fs.writeFileSync(
    path.join(outDir, "veo-scenes.json"),
    JSON.stringify(scenes, null, 2)
  );

  // 2. Italian narration script (full text for TTS)
  const narration = lines.map((l, i) => `${i + 1}. ${l.italian}`).join("\n");
  fs.writeFileSync(path.join(outDir, "narration-italian.txt"), narration);

  // 3. SRT subtitles
  // Estimate ~3 seconds per short line, ~5 seconds for longer ones
  let timeMs = 0;
  const italianSrt = [];
  const englishSrt = [];

  lines.forEach((line, i) => {
    const words = line.italian.split(/\s+/).length;
    const duration = Math.max(2500, Math.min(5000, words * 500));

    const startTime = formatSrtTime(timeMs);
    const endTime = formatSrtTime(timeMs + duration);

    italianSrt.push(`${i + 1}\n${startTime} --> ${endTime}\n${line.italian}\n`);
    if (line.english) {
      englishSrt.push(`${i + 1}\n${startTime} --> ${endTime}\n${line.english}\n`);
    }

    timeMs += duration + 300; // 300ms gap between lines
  });

  fs.writeFileSync(path.join(outDir, "subtitles-it.srt"), italianSrt.join("\n"));
  fs.writeFileSync(path.join(outDir, "subtitles-en.srt"), englishSrt.join("\n"));

  // 4. YouTube metadata
  const totalDuration = Math.ceil(timeMs / 1000);
  const metadata = {
    title: `${story.title} | Learn Italian with Stories | ${story.level} Level`,
    description: `Learn Italian with the classic story "${story.title}" (${story.englishTitle})!

📚 Level: ${story.level} (${story.level === "A1" ? "Beginner" : "Elementary"})
⏱️ Duration: ~${Math.ceil(totalDuration / 60)} minutes
🎯 ${lines.length} Italian sentences with English translations

This story uses only ${story.level} vocabulary from the Kelly Italian Frequency List, making it perfect for beginners.

🇮🇹 Italian subtitles + 🇬🇧 English translations
🔊 Italian narration at learner-friendly pace

#LearnItalian #ItalianForBeginners #${story.level} #ItalianStories #CameraCafeLearner`,
    tags: ["learn italian", "italian for beginners", story.level, "italian stories",
           story.englishTitle.toLowerCase(), "italian subtitles", "italian listening practice"],
    totalDurationSeconds: totalDuration,
    lineCount: lines.length,
    sceneCount: scenes.length,
  };

  fs.writeFileSync(path.join(outDir, "youtube-metadata.json"), JSON.stringify(metadata, null, 2));

  // 5. Vocabulary list for video description
  const vocabWords = new Set();
  const kellyPath = path.join(__dirname, "..", "extension", "kelly.json");
  const kelly = JSON.parse(fs.readFileSync(kellyPath, "utf-8"));

  lines.forEach(line => {
    const words = line.italian.toLowerCase()
      .replace(/[.,!?;:'"()[\]{}«»""''…—–\-]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 2);
    words.forEach(w => {
      if (kelly[w]) vocabWords.add(w);
    });
  });

  const vocabList = [...vocabWords]
    .map(w => ({ word: w, ...kelly[w] }))
    .sort((a, b) => a.r - b.r)
    .map(w => `${w.word} (${w.c}) — rank #${w.r}`)
    .join("\n");

  fs.writeFileSync(path.join(outDir, "vocabulary-list.txt"), `Key vocabulary in this story:\n\n${vocabList}`);

  console.log(`\n📁 ${storyId}/`);
  console.log(`  veo-scenes.json      — ${scenes.length} scenes for video generation`);
  console.log(`  narration-italian.txt — ${lines.length} lines for Italian TTS`);
  console.log(`  subtitles-it.srt     — Italian subtitle file`);
  console.log(`  subtitles-en.srt     — English subtitle file`);
  console.log(`  youtube-metadata.json — title, description, tags`);
  console.log(`  vocabulary-list.txt  — ${vocabWords.size} unique words used`);
  console.log(`  Total duration: ~${Math.ceil(totalDuration / 60)} minutes`);
}

function formatSrtTime(ms) {
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  const msR = String(ms % 1000).padStart(3, "0");
  return `${h}:${m}:${s},${msR}`;
}

// Process specified stories or all
const storyIds = process.argv.slice(2);
if (storyIds.length > 0) {
  storyIds.forEach(processStory);
} else {
  const storiesDir = path.join(__dirname, "..", "data", "stories");
  if (fs.existsSync(storiesDir)) {
    fs.readdirSync(storiesDir)
      .filter(f => f.endsWith(".json"))
      .forEach(f => processStory(f.replace(".json", "")));
  }
}
