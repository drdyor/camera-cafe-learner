import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, "..", "data", "app.db"));

// Ultra-common function words to skip
const SKIP_WORDS = new Set([
  'non','che','qui','sia','con','gli','le','la','il','lo','un','una','di','da',
  'in','per','su','al','del','dei','delle','degli','alla','allo','alle','nel',
  'nella','nello','nelle','nei','negli','ci','si','mi','ti','vi','li','ne',
  'ma','se','come','dove','quando','anche','più','già','ancora','solo','sempre',
  'mai','molto','poco','tutto','ogni','altro','primo','ultimo','suo','mio','tuo',
  'nostro','vostro','loro','quale','cui','chi','cosa','no','io','tu','lui','lei',
  'noi','voi','esso','essa','essi','esse','questo','quello','e','o','a','è',
  'ho','ha','hanno','sono','sei','era','ero','stata','stato','stati','state',
  'me','te','sì','poi','ora','proprio','così','perché','però','dopo','prima',
  'oh','ah','eh','uh','va','fa','sa','può','vuole','deve','vuoi','devi',
]);

const kellyLookup = db.prepare("SELECT lemma, frequencyRank, cefrLevel FROM kellyList WHERE lemma = ?");
const insertPhrase = db.prepare(
  "INSERT INTO phrases (episodeId, italianText, englishTranslation, startTime, endTime, wordCount, minFrequencyRank, cefrLevel, isLearnable) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)"
);

// Get English translation for a subtitle if available
const getEnglishSub = db.prepare(
  "SELECT text FROM subtitles WHERE episodeId = ? AND language = 'en' AND sequenceNumber = ?"
);

function extractPhrases(episodeId) {
  // Check if phrases already exist
  const existing = db.prepare("SELECT count(*) as cnt FROM phrases WHERE episodeId = ?").get(episodeId);
  if (existing.cnt > 0) {
    console.log(`Episode ${episodeId}: already has ${existing.cnt} phrases, skipping`);
    return;
  }

  const itSubs = db.prepare(
    "SELECT * FROM subtitles WHERE episodeId = ? AND language = 'it' ORDER BY sequenceNumber"
  ).all(episodeId);

  console.log(`Episode ${episodeId}: processing ${itSubs.length} Italian subtitles`);

  const seenWords = new Set();
  let added = 0;

  const tx = db.transaction(() => {
    for (const sub of itSubs) {
      // Tokenize Italian text
      const words = sub.text
        .toLowerCase()
        .replace(/[.,!?;:'"()\[\]{}«»""''…—–\-]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 1);

      // Get English translation if available
      const enSub = getEnglishSub.get(episodeId, sub.sequenceNumber);
      const englishText = enSub?.text || "";

      for (const word of words) {
        if (SKIP_WORDS.has(word)) continue;
        if (seenWords.has(word)) continue;

        const kelly = kellyLookup.get(word);
        if (!kelly) continue;
        if (kelly.frequencyRank < 50) continue; // Skip ultra-common

        seenWords.add(word);

        // Use English subtitle as context, or just the word itself
        const translation = englishText || word;

        insertPhrase.run(
          episodeId,
          word,
          translation,
          sub.startTime,
          sub.endTime,
          1,
          kelly.frequencyRank,
          kelly.cefrLevel
        );
        added++;
      }
    }
  });
  tx();
  console.log(`  Added ${added} phrases`);
}

// Process specified episodes or all that need it
const epIds = process.argv.slice(2).map(Number);
if (epIds.length > 0) {
  for (const id of epIds) extractPhrases(id);
} else {
  // All episodes without phrases
  const all = db.prepare("SELECT id FROM episodes").all();
  for (const ep of all) extractPhrases(ep.id);
}

db.close();
console.log("Done!");
