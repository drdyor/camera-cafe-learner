import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { drizzle } from 'drizzle-orm/mysql2';
import { parse } from 'csv-parse/sync';
import { kellyList } from '../drizzle/schema.ts';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importKellyList() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable not set');
  }

  // Create connection pool
  const poolConnection = await mysql.createConnection(dbUrl);
  const db = drizzle(poolConnection);

  try {
    // Read CSV file
    const csvPath = path.join(__dirname, 'kelly_italian.csv');
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log(`Parsed ${records.length} records from Kelly List CSV`);

    // Prepare batch insert
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      // Map CSV columns to database columns
      const valuesToInsert = batch.map((record, idx) => {
        const lemma = record.Lemma.trim();
        const pos = record.Pos ? record.Pos.trim() : null;
        const cefrLevel = record.Points ? record.Points.trim() : 'C2';
        const frequencyRank = i + idx + 2; // +2 because row 1 is header
        
        return {
          lemma,
          pos,
          cefrLevel,
          frequencyRank,
          ipm: null,
        };
      });

      // Insert batch using Drizzle
      await db.insert(kellyList).values(valuesToInsert).onDuplicateKeyUpdate({
        set: {
          pos: valuesToInsert[0].pos,
          cefrLevel: valuesToInsert[0].cefrLevel,
          frequencyRank: valuesToInsert[0].frequencyRank,
        },
      });
      
      inserted += batch.length;
      console.log(`Inserted ${inserted}/${records.length} records...`);
    }

    console.log(`✓ Successfully imported ${inserted} Kelly List entries`);
  } finally {
    await poolConnection.end();
  }
}

importKellyList().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
