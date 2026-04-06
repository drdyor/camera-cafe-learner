import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OLLAMA_URL = "http://localhost:11434/api/generate";

const stories = [
  { id: "cenerentola", title: "Cenerentola", english: "Cinderella", level: "A1" },
  { id: "cappuccetto-rosso", title: "Cappuccetto Rosso", english: "Little Red Riding Hood", level: "A1" },
  { id: "tre-porcellini", title: "I Tre Porcellini", english: "The Three Little Pigs", level: "A1" },
  { id: "biancaneve", title: "Biancaneve", english: "Snow White", level: "A1" },
  { id: "pinocchio", title: "Pinocchio", english: "Pinocchio", level: "A2" },
  { id: "brutto-anatroccolo", title: "Il Brutto Anatroccolo", english: "The Ugly Duckling", level: "A1" },
  { id: "gatto-stivali", title: "Il Gatto con gli Stivali", english: "Puss in Boots", level: "A2" },
  { id: "hansel-gretel", title: "Hansel e Gretel", english: "Hansel and Gretel", level: "A2" },
  { id: "la-bella-addormentata", title: "La Bella Addormentata", english: "Sleeping Beauty", level: "A1" },
  { id: "il-lupo-e-i-sette-capretti", title: "Il Lupo e i Sette Capretti", english: "The Wolf and Seven Kids", level: "A2" },
];

async function generate(prompt) {
  const res = await axios.post(OLLAMA_URL, {
    model: "qwen3:8b",
    prompt,
    stream: false,
    options: { temperature: 0.7, num_predict: 4096 },
  }, { timeout: 120000 });
  return (res.data.response || "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

async function generateStory(story) {
  const levelDesc = story.level === "A1"
    ? "Use ONLY the most basic Italian words. Very short sentences (4-8 words). Present tense and simple past only."
    : "Use common A1-A2 Italian words. Sentences can be slightly longer (5-12 words). Include some passato prossimo.";

  const prompt = `/no_think
Write "${story.title}" (${story.english}) in simplified Italian for ${story.level} learners.

Rules:
${levelDesc}
- About 35-40 sentences
- Include character dialogue (use quotation marks)
- Each Italian line on its own line
- After each Italian line, write English translation in parentheses
- Make it engaging and complete - tell the full story
- Use repetition of key vocabulary (good for learning)
- Start the story now:`;

  console.log(`Generating: ${story.title} (${story.level})...`);
  const text = await generate(prompt);

  // Parse into structured format
  const lines = text.split("\n").filter(l => l.trim());
  const parsed = [];

  for (const line of lines) {
    const match = line.match(/^(.+?)\s*\((.+?)\)\s*$/);
    if (match) {
      parsed.push({
        italian: match[1].trim(),
        english: match[2].trim(),
      });
    } else if (line.trim() && !line.startsWith("#") && !line.startsWith("---")) {
      parsed.push({
        italian: line.trim(),
        english: "",
      });
    }
  }

  const output = {
    id: story.id,
    title: story.title,
    englishTitle: story.english,
    level: story.level,
    lines: parsed,
    generatedAt: new Date().toISOString(),
  };

  const outDir = path.join(__dirname, "..", "data", "stories");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `${story.id}.json`), JSON.stringify(output, null, 2));
  console.log(`  ${parsed.length} lines → data/stories/${story.id}.json`);
  return output;
}

// Generate all stories
async function main() {
  const selected = process.argv.slice(2);
  const toGenerate = selected.length > 0
    ? stories.filter(s => selected.includes(s.id))
    : stories;

  for (const story of toGenerate) {
    try {
      await generateStory(story);
    } catch (err) {
      console.error(`  Error: ${err.message}`);
    }
  }
  console.log("\nDone! Stories saved to data/stories/");
}

main();
