import { createConnection } from "mysql2/promise";
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
  const connection = await createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "camera_cafe",
    ssl: "Amazon RDS" === process.env.DB_TYPE ? { rejectUnauthorized: false } : undefined,
  });

  try {
    // Insert sample episode
    const [episodeResult] = await connection.execute(
      `INSERT INTO episodes (title, season, episodeNumber, description, difficulty, duration, videoUrl, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        "Coffee Talk",
        1,
        1,
        "A casual conversation at a local Italian café about coffee and life.",
        "A1",
        30,
        "https://example.com/video.mp4",
      ]
    );

    const episodeId = episodeResult.insertId;
    console.log(`✓ Created episode with ID: ${episodeId}`);

    // Insert Italian subtitles
    for (const [idx, sub] of sampleItalianSubtitles.entries()) {
      await connection.execute(
        `INSERT INTO subtitles (episodeId, language, sequenceNumber, startTime, endTime, text, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [episodeId, "it", idx + 1, sub.startTime, sub.endTime, sub.text]
      );
    }
    console.log(`✓ Inserted ${sampleItalianSubtitles.length} Italian subtitles`);

    // Insert English subtitles
    for (const [idx, sub] of sampleEnglishSubtitles.entries()) {
      await connection.execute(
        `INSERT INTO subtitles (episodeId, language, sequenceNumber, startTime, endTime, text, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [episodeId, "en", idx + 1, sub.startTime, sub.endTime, sub.text]
      );
    }
    console.log(`✓ Inserted ${sampleEnglishSubtitles.length} English subtitles`);

    // Extract and insert phrases
    const samplePhrases = [
      {
        italianText: "Buongiorno",
        englishTranslation: "Good morning",
        cefrLevel: "A1",
        minFrequencyRank: 500,
        startTime: 0,
        endTime: 3000,
      },
      {
        italianText: "Come stai",
        englishTranslation: "How are you",
        cefrLevel: "A1",
        minFrequencyRank: 800,
        startTime: 3500,
        endTime: 6000,
      },
      {
        italianText: "Mi piace",
        englishTranslation: "I like",
        cefrLevel: "A1",
        minFrequencyRank: 300,
        startTime: 9500,
        endTime: 12000,
      },
      {
        italianText: "caffè italiano",
        englishTranslation: "Italian coffee",
        cefrLevel: "A1",
        minFrequencyRank: 1200,
        startTime: 9500,
        endTime: 12000,
      },
      {
        italianText: "delizioso",
        englishTranslation: "delicious",
        cefrLevel: "A2",
        minFrequencyRank: 2500,
        startTime: 12500,
        endTime: 15000,
      },
      {
        italianText: "Vuoi",
        englishTranslation: "Do you want",
        cefrLevel: "A1",
        minFrequencyRank: 600,
        startTime: 15500,
        endTime: 18000,
      },
      {
        italianText: "per favore",
        englishTranslation: "please",
        cefrLevel: "A1",
        minFrequencyRank: 400,
        startTime: 18500,
        endTime: 21000,
      },
      {
        italianText: "miglior",
        englishTranslation: "best",
        cefrLevel: "A2",
        minFrequencyRank: 1800,
        startTime: 21500,
        endTime: 24000,
      },
      {
        italianText: "città",
        englishTranslation: "city",
        cefrLevel: "A1",
        minFrequencyRank: 1100,
        startTime: 21500,
        endTime: 24000,
      },
      {
        italianText: "completamente d'accordo",
        englishTranslation: "completely agree",
        cefrLevel: "B1",
        minFrequencyRank: 3200,
        startTime: 24500,
        endTime: 27000,
      },
    ];

    for (const phrase of samplePhrases) {
      const wordCount = phrase.italianText.split(/\s+/).length;
      await connection.execute(
        `INSERT INTO phrases (episodeId, italianText, englishTranslation, cefrLevel, minFrequencyRank, wordCount, startTime, endTime, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          episodeId,
          phrase.italianText,
          phrase.englishTranslation,
          phrase.cefrLevel,
          phrase.minFrequencyRank,
          wordCount,
          phrase.startTime,
          phrase.endTime,
        ]
      );
    }
    console.log(`✓ Inserted ${samplePhrases.length} phrases`);

    console.log("\n✓ Sample episode seeded successfully!");
    console.log(`  Episode ID: ${episodeId}`);
    console.log(`  Title: Coffee Talk`);
    console.log(`  Duration: 30 seconds`);
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedDatabase().catch(console.error);
