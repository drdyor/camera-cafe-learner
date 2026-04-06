import { drizzle } from "drizzle-orm/mysql2";
import { episodes, subtitles, phrases } from "../drizzle/schema";
import dotenv from "dotenv";

dotenv.config();

const sampleItalianSubtitles = [
  { startTime: 0, endTime: 3000, text: "Buongiorno!" },
  { startTime: 3500, endTime: 6000, text: "Come stai?" },
  { startTime: 6500, endTime: 9000, text: "Tutto bene, grazie." },
  { startTime: 9500, endTime: 12000, text: "Mi piace il caffè italiano." },
  { startTime: 12500, endTime: 15000, text: "È delizioso!" },
  { startTime: 15500, endTime: 18000, text: "Vuoi un'altra tazza?" },
  { startTime: 18500, endTime: 21000, text: "Sì, per favore." },
  { startTime: 21500, endTime: 24000, text: "Questo è il miglior caffè della città." },
  { startTime: 24500, endTime: 27000, text: "Sono completamente d'accordo." },
  { startTime: 27500, endTime: 30000, text: "Arrivederci!" },
];

const sampleEnglishSubtitles = [
  { startTime: 0, endTime: 3000, text: "Good morning!" },
  { startTime: 3500, endTime: 6000, text: "How are you?" },
  { startTime: 6500, endTime: 9000, text: "All good, thanks." },
  { startTime: 9500, endTime: 12000, text: "I love Italian coffee." },
  { startTime: 12500, endTime: 15000, text: "It's delicious!" },
  { startTime: 15500, endTime: 18000, text: "Would you like another cup?" },
  { startTime: 18500, endTime: 21000, text: "Yes, please." },
  { startTime: 21500, endTime: 24000, text: "This is the best coffee in the city." },
  { startTime: 24500, endTime: 27000, text: "I completely agree." },
  { startTime: 27500, endTime: 30000, text: "Goodbye!" },
];

async function seedDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not set");
  }

  const db = drizzle(process.env.DATABASE_URL);

  try {
    // Insert sample episode
    const [episodeResult] = await db
      .insert(episodes)
      .values({
        title: "Coffee Talk",
        season: 1,
        episodeNumber: 1,
        description: "A casual conversation at a local Italian café about coffee and life.",
        difficulty: "A1",
        duration: 30,
        videoUrl: "https://example.com/video.mp4",
      });

    const episodeId = episodeResult.insertId;
    console.log(`✓ Created episode with ID: ${episodeId}`);

    // Insert Italian subtitles
    for (let i = 0; i < sampleItalianSubtitles.length; i++) {
      const sub = sampleItalianSubtitles[i];
      await db.insert(subtitles).values({
        episodeId,
        language: "it",
        sequenceNumber: i + 1,
        startTime: sub.startTime,
        endTime: sub.endTime,
        text: sub.text,
      });
    }
    console.log(`✓ Inserted ${sampleItalianSubtitles.length} Italian subtitles`);

    // Insert English subtitles
    for (let i = 0; i < sampleEnglishSubtitles.length; i++) {
      const sub = sampleEnglishSubtitles[i];
      await db.insert(subtitles).values({
        episodeId,
        language: "en",
        sequenceNumber: i + 1,
        startTime: sub.startTime,
        endTime: sub.endTime,
        text: sub.text,
      });
    }
    console.log(`✓ Inserted ${sampleEnglishSubtitles.length} English subtitles`);

    // Extract and insert phrases
    const samplePhrases = [
      {
        episodeId,
        italianText: "Buongiorno",
        englishTranslation: "Good morning",
        cefrLevel: "A1" as const,
        minFrequencyRank: 500,
        startTime: 0,
        endTime: 3000,
        wordCount: 1,
        isLearnable: true,
      },
      {
        episodeId,
        italianText: "Come stai",
        englishTranslation: "How are you",
        cefrLevel: "A1" as const,
        minFrequencyRank: 800,
        startTime: 3500,
        endTime: 6000,
        wordCount: 2,
        isLearnable: true,
      },
      {
        episodeId,
        italianText: "Mi piace",
        englishTranslation: "I like",
        cefrLevel: "A1" as const,
        minFrequencyRank: 300,
        startTime: 9500,
        endTime: 12000,
        wordCount: 2,
        isLearnable: true,
      },
      {
        episodeId,
        italianText: "caffè italiano",
        englishTranslation: "Italian coffee",
        cefrLevel: "A1" as const,
        minFrequencyRank: 1200,
        startTime: 9500,
        endTime: 12000,
        wordCount: 2,
        isLearnable: true,
      },
      {
        episodeId,
        italianText: "delizioso",
        englishTranslation: "delicious",
        cefrLevel: "A2" as const,
        minFrequencyRank: 2500,
        startTime: 12500,
        endTime: 15000,
        wordCount: 1,
        isLearnable: true,
      },
      {
        episodeId,
        italianText: "Vuoi",
        englishTranslation: "Do you want",
        cefrLevel: "A1" as const,
        minFrequencyRank: 600,
        startTime: 15500,
        endTime: 18000,
        wordCount: 1,
        isLearnable: true,
      },
      {
        episodeId,
        italianText: "per favore",
        englishTranslation: "please",
        cefrLevel: "A1" as const,
        minFrequencyRank: 400,
        startTime: 18500,
        endTime: 21000,
        wordCount: 2,
        isLearnable: true,
      },
      {
        episodeId,
        italianText: "miglior",
        englishTranslation: "best",
        cefrLevel: "A2" as const,
        minFrequencyRank: 1800,
        startTime: 21500,
        endTime: 24000,
        wordCount: 1,
        isLearnable: true,
      },
      {
        episodeId,
        italianText: "città",
        englishTranslation: "city",
        cefrLevel: "A1" as const,
        minFrequencyRank: 1100,
        startTime: 21500,
        endTime: 24000,
        wordCount: 1,
        isLearnable: true,
      },
      {
        episodeId,
        italianText: "completamente d'accordo",
        englishTranslation: "completely agree",
        cefrLevel: "B1" as const,
        minFrequencyRank: 3200,
        startTime: 24500,
        endTime: 27000,
        wordCount: 2,
        isLearnable: true,
      },
    ];

    await db.insert(phrases).values(samplePhrases);
    console.log(`✓ Inserted ${samplePhrases.length} phrases`);

    console.log("\n✓ Sample episode seeded successfully!");
    console.log(`  Episode ID: ${episodeId}`);
    console.log(`  Title: Coffee Talk`);
    console.log(`  Duration: 30 seconds`);
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

seedDatabase().catch(console.error);
