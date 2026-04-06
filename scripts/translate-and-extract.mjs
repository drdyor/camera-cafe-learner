/**
 * Translates Italian subtitles to English via Ollama (qwen3:8b)
 * and extracts learnable phrases scored against the Kelly list.
 *
 * Usage: node scripts/translate-and-extract.mjs [episodeId]
 *   If no episodeId, processes all episodes missing English subs.
 */
import { createConnection } from "mysql2/promise";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const OLLAMA_URL = "http://localhost:11434/api/generate";
const MODEL = "qwen3:8b";

async function ollamaGenerate(prompt, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await axios.post(OLLAMA_URL, {
        model: MODEL,
        prompt,
        stream: false,
        options: { temperature: 0.3, num_predict: 2048 },
      }, { timeout: 60000 });
      // Strip <think> blocks from qwen3 output
      let text = res.data.response || "";
      text = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
      return text;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      console.log(`  Retry ${attempt + 1}...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

async function translateSubtitles(connection, episodeId) {
  // Get Italian subs
  const [itSubs] = await connection.execute(
    "SELECT id, sequenceNumber, startTime, endTime, text FROM subtitles WHERE episodeId = ? AND language = 'it' ORDER BY sequenceNumber",
    [episodeId]
  );

  if (itSubs.length === 0) {
    console.log(`  No Italian subs for episode ${episodeId}`);
    return;
  }

  // Check if English subs already exist
  const [enCount] = await connection.execute(
    "SELECT COUNT(*) as cnt FROM subtitles WHERE episodeId = ? AND language = 'en'",
    [episodeId]
  );
  if (enCount[0].cnt > 0) {
    console.log(`  English subs already exist (${enCount[0].cnt} lines), skipping translation`);
    return;
  }

  console.log(`  Translating ${itSubs.length} Italian subtitles...`);

  // Batch translate in chunks of 10 for efficiency
  const batchSize = 10;
  const translations = [];

  for (let i = 0; i < itSubs.length; i += batchSize) {
    const batch = itSubs.slice(i, i + batchSize);
    const numberedLines = batch.map((s, idx) => `${i + idx + 1}. ${s.text}`).join("\n");

    const prompt = `/no_think
Translate each numbered Italian line to natural English. Keep the same numbering. Output ONLY the translations, one per line, with the number prefix.

${numberedLines}`;

    const result = await ollamaGenerate(prompt);
    const lines = result.split("\n").filter(l => l.trim());

    for (let j = 0; j < batch.length; j++) {
      // Try to match numbered line, fallback to sequential
      const lineMatch = lines.find(l => l.match(new RegExp(`^${i + j + 1}\\.\\s`)));
      let translation = lineMatch
        ? lineMatch.replace(/^\d+\.\s*/, "").trim()
        : (lines[j] ? lines[j].replace(/^\d+\.\s*/, "").trim() : batch[j].text);
      translations.push({
        ...batch[j],
        translation,
      });
    }

    process.stdout.write(`  ${Math.min(i + batchSize, itSubs.length)}/${itSubs.length} translated\r`);
  }

  console.log();

  // Insert English subs
  for (const t of translations) {
    await connection.execute(
      `INSERT INTO subtitles (episodeId, language, sequenceNumber, startTime, endTime, text, createdAt)
       VALUES (?, 'en', ?, ?, ?, ?, NOW())`,
      [episodeId, t.sequenceNumber, t.startTime, t.endTime, t.translation]
    );
  }

  console.log(`  ✓ Inserted ${translations.length} English subtitles`);
}

async function extractPhrases(connection, episodeId) {
  // Check if phrases already exist
  const [existingPhrases] = await connection.execute(
    "SELECT COUNT(*) as cnt FROM phrases WHERE episodeId = ?",
    [episodeId]
  );
  if (existingPhrases[0].cnt > 0) {
    console.log(`  Phrases already exist (${existingPhrases[0].cnt}), skipping extraction`);
    return;
  }

  // Get Italian subs with their English translations
  const [itSubs] = await connection.execute(
    "SELECT id, sequenceNumber, startTime, endTime, text FROM subtitles WHERE episodeId = ? AND language = 'it' ORDER BY sequenceNumber",
    [episodeId]
  );
  const [enSubs] = await connection.execute(
    "SELECT sequenceNumber, text FROM subtitles WHERE episodeId = ? AND language = 'en' ORDER BY sequenceNumber",
    [episodeId]
  );

  const enMap = new Map(enSubs.map(s => [s.sequenceNumber, s.text]));

  // Get Kelly list for word scoring
  const [kellyWords] = await connection.execute(
    "SELECT lemma, cefrLevel, frequencyRank FROM kellyList"
  );
  const kellyMap = new Map(kellyWords.map(w => [w.lemma.toLowerCase(), w]));

  console.log(`  Extracting phrases from ${itSubs.length} subtitle lines...`);

  let phraseCount = 0;

  for (const sub of itSubs) {
    const enText = enMap.get(sub.sequenceNumber) || "";

    // Extract individual meaningful words/short phrases
    const italianText = sub.text;
    // Clean and tokenize
    const words = italianText
      .replace(/[.,!?;:'"()\[\]{}]/g, " ")
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2);

    // Find Kelly-listed words
    for (const word of words) {
      const kellyEntry = kellyMap.get(word);
      if (kellyEntry && ["A1", "A2", "B1", "B2"].includes(kellyEntry.cefrLevel)) {
        // Check if we already added this word for this episode
        const [existing] = await connection.execute(
          "SELECT id FROM phrases WHERE episodeId = ? AND italianText = ?",
          [episodeId, word]
        );
        if (existing.length > 0) continue;

        await connection.execute(
          `INSERT INTO phrases (episodeId, italianText, englishTranslation, subtitleId, startTime, endTime, wordCount, minFrequencyRank, cefrLevel, isLearnable, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, true, NOW())`,
          [
            episodeId,
            word,
            enText, // Context translation (full subtitle line)
            sub.id,
            sub.startTime,
            sub.endTime,
            kellyEntry.frequencyRank,
            kellyEntry.cefrLevel,
          ]
        );
        phraseCount++;
      }
    }
  }

  // Now use Ollama to extract multi-word phrases
  const allText = itSubs.map(s => s.text).join(" ");
  const prompt = `/no_think
From this Italian dialogue, extract 10-15 useful learnable phrases (2-4 words each) that a language student should know. For each, give the Italian phrase and English translation.

Format each as: ITALIAN | ENGLISH

Dialogue:
${allText.slice(0, 2000)}`;

  try {
    const result = await ollamaGenerate(prompt);
    const phraseLines = result.split("\n").filter(l => l.includes("|"));

    for (const line of phraseLines) {
      const [it, en] = line.split("|").map(s => s.trim());
      if (!it || !en || it.length < 3) continue;

      // Find which subtitle this phrase appears in
      const matchSub = itSubs.find(s =>
        s.text.toLowerCase().includes(it.toLowerCase())
      );

      // Score against Kelly list
      const phraseWords = it.toLowerCase().split(/\s+/);
      let maxRank = 9999;
      let level = "B1";
      for (const w of phraseWords) {
        const k = kellyMap.get(w);
        if (k) {
          if (k.frequencyRank < maxRank) {
            maxRank = k.frequencyRank;
          }
          const levels = ["A1", "A2", "B1", "B2"];
          if (levels.indexOf(k.cefrLevel) > levels.indexOf(level)) {
            level = k.cefrLevel;
          }
        }
      }

      const [existing] = await connection.execute(
        "SELECT id FROM phrases WHERE episodeId = ? AND italianText = ?",
        [episodeId, it.toLowerCase()]
      );
      if (existing.length > 0) continue;

      await connection.execute(
        `INSERT INTO phrases (episodeId, italianText, englishTranslation, subtitleId, startTime, endTime, wordCount, minFrequencyRank, cefrLevel, isLearnable, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true, NOW())`,
        [
          episodeId,
          it,
          en,
          matchSub?.id || null,
          matchSub?.startTime || 0,
          matchSub?.endTime || 0,
          phraseWords.length,
          maxRank,
          ["A1", "A2", "B1", "B2"].includes(level) ? level : "B1",
        ]
      );
      phraseCount++;
    }
  } catch (err) {
    console.log(`  ⚠ Phrase extraction via Ollama failed: ${err.message}`);
  }

  console.log(`  ✓ Extracted ${phraseCount} phrases`);
}

async function main() {
  const connection = await createConnection(process.env.DATABASE_URL);

  try {
    const targetEpisodeId = process.argv[2] ? parseInt(process.argv[2]) : null;

    let episodeIds;
    if (targetEpisodeId) {
      episodeIds = [targetEpisodeId];
    } else {
      const [rows] = await connection.execute("SELECT id, title FROM episodes ORDER BY id");
      episodeIds = rows.map(r => r.id);
      console.log(`Processing ${episodeIds.length} episodes...`);
    }

    for (const id of episodeIds) {
      const [ep] = await connection.execute("SELECT title FROM episodes WHERE id = ?", [id]);
      console.log(`\n📺 Episode ${id}: ${ep[0]?.title}`);

      await translateSubtitles(connection, id);
      await extractPhrases(connection, id);
    }

    console.log("\n✓ All done!");
  } finally {
    await connection.end();
  }
}

main().catch(err => {
  console.error("Failed:", err);
  process.exit(1);
});
