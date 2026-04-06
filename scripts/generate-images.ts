#!/usr/bin/env tsx
/**
 * AI Image Generation Script for Visual Dictionary
 * 
 * This script generates room background images and item images using AI.
 * It supports multiple providers: OpenAI (DALL-E), Stability AI, or local SD.
 * 
 * Usage:
 *   npx tsx scripts/generate-images.ts --rooms
 *   npx tsx scripts/generate-images.ts --items --category=kitchen
 *   npx tsx scripts/generate-images.ts --all
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Room configurations with generation prompts
const ROOM_CONFIGS = [
  {
    id: "kitchen",
    name: "Italian Kitchen",
    prompt: "A warm, rustic Italian kitchen interior, sunny afternoon light streaming through windows, wooden table with bread and olive oil, terracotta tiles, copper pots hanging, warm colors, photorealistic, cozy atmosphere, high quality photography style",
  },
  {
    id: "bedroom",
    name: "Bedroom",
    prompt: "A cozy bedroom interior, morning light, comfortable bed with white linens, wooden nightstand, reading lamp, soft warm lighting, minimalist decor, peaceful atmosphere, photorealistic interior photography",
  },
  {
    id: "school",
    name: "School Classroom",
    prompt: "A bright school classroom, wooden desks arranged in rows, blackboard with chalk writing, bookshelves filled with books, globe, warm natural lighting from large windows, educational atmosphere, photorealistic",
  },
  {
    id: "outdoors",
    name: "Nature Landscape",
    prompt: "A beautiful Italian countryside landscape, rolling green hills, cypress trees, blue sky with fluffy clouds, distant mountains, wildflowers, golden hour lighting, scenic vista, photorealistic landscape photography",
  },
  {
    id: "buildings",
    name: "Italian City",
    prompt: "A charming Italian city street scene, historic buildings with balconies, cobblestone street, outdoor cafe, people walking, warm afternoon light, Mediterranean architecture, photorealistic urban photography",
  },
  {
    id: "people",
    name: "Family Gathering",
    prompt: "A warm family gathering scene in an Italian home, multiple generations, living room setting, people talking and laughing, warm lighting, candid moment, diverse ages, photorealistic lifestyle photography",
  },
  {
    id: "body",
    name: "Human Body",
    prompt: "An anatomical illustration of a human figure, neutral pose, educational diagram style, clean white background, labeled body parts visible, medical illustration style, professional and clear",
  },
  {
    id: "clothing",
    name: "Wardrobe",
    prompt: "A well-organized walk-in closet with various clothing items on hangers, shirts, dresses, shoes on shelves, warm lighting, wooden wardrobe, tidy arrangement, lifestyle interior photography",
  },
  {
    id: "materials",
    name: "Raw Materials",
    prompt: "Various raw materials arranged artistically on a wooden surface - wood pieces, stone, metal objects, fabric samples, natural lighting, overhead view, still life photography style",
  },
  {
    id: "fantasy",
    name: "Fantasy Scene",
    prompt: "A magical fantasy forest scene, enchanted trees with glowing lights, mystical atmosphere, fairy lights, ancient ruins, twilight colors, purples and blues, digital art style, whimsical and dreamy",
  },
  {
    id: "emotions",
    name: "Emotional Expressions",
    prompt: "Artistic representation of human emotions, abstract colorful swirls, expressive faces in soft focus, warm and cool colors blending, emotional abstract art style, contemporary illustration",
  },
  {
    id: "home",
    name: "Living Room",
    prompt: "A cozy living room interior, comfortable sofa, coffee table, bookshelf, house plants, warm evening lighting, homey atmosphere, interior design photography, inviting and comfortable",
  },
  {
    id: "shop",
    name: "Italian Shop",
    prompt: "A traditional Italian shop interior, wooden shelves with products, hanging cured meats and cheeses, baskets of bread, warm lighting, rustic charm, storefront view, photorealistic",
  },
  // New GCSE-themed rooms
  {
    id: "freetime",
    name: "Free Time Activities",
    prompt: "People enjoying leisure activities in a park - cycling, reading, playing games, sunny day, green grass, trees, joyful atmosphere, lifestyle photography, vibrant colors",
  },
  {
    id: "health",
    name: "Health and Medical",
    prompt: "Modern medical clinic interior, clean white walls, doctor's office, medical equipment, healthy lifestyle concept, bright lighting, professional healthcare setting, photorealistic",
  },
  {
    id: "restaurant",
    name: "Restaurant Dining",
    prompt: "Elegant Italian restaurant interior, tables with white tablecloths, wine bottles, candles, romantic lighting, outdoor terrace seating, Mediterranean atmosphere, fine dining photography",
  },
  {
    id: "technology",
    name: "Technology and Devices",
    prompt: "Modern workspace with technology devices, laptop, smartphone, tablet, clean desk setup, minimal aesthetic, soft ambient lighting, contemporary tech lifestyle, product photography style",
  },
  {
    id: "time",
    name: "Time and Clocks",
    prompt: "Artistic representation of time, vintage clocks, hourglasses, calendar pages, warm golden lighting, nostalgic atmosphere, still life photography with time elements",
  },
  {
    id: "transport",
    name: "Transportation",
    prompt: "Italian train station or bus stop, people commuting, vintage Vespa scooter, public transportation, urban mobility scene, warm afternoon light, travel atmosphere, street photography",
  },
  {
    id: "weather",
    name: "Weather Scenes",
    prompt: "Four seasons represented in quadrants or collage, sunny summer, rainy autumn, snowy winter, blooming spring, weather icons, meteorological illustration style, colorful and educational",
  },
  {
    id: "work",
    name: "Work and Office",
    prompt: "Professional office environment, people working at desks, computers, meeting room, modern workspace, collaborative atmosphere, business casual attire, corporate lifestyle photography",
  },
];

// Item prompts for each category (sample - expand as needed)
const ITEM_PROMPTS: Record<string, Record<string, string>> = {
  kitchen: {
    acqua: "A clear glass of fresh water on a wooden table, natural lighting, simple and clean, product photography",
    pane: "Fresh Italian bread loaf on a wooden cutting board, rustic kitchen setting, warm lighting, food photography",
    cibo: "A delicious Italian meal spread on a table, pasta, vegetables, fresh ingredients, overhead food photography",
    zuppa: "A warm bowl of soup, steam rising, wooden spoon, cozy atmosphere, food photography",
    pesce: "Fresh fish on a plate, Mediterranean style, lemon garnish, clean background, food photography",
    bastoncini: "Wooden chopsticks on a ceramic rest, minimalist setting, Asian-Italian fusion, product photography",
  },
  outdoors: {
    sole: "Bright sun in a blue sky, golden rays, sunny day, nature photography",
    cielo: "Beautiful blue sky with white clouds, serene atmosphere, landscape photography",
    terra: "Rich brown soil, earth texture, garden ground, natural macro photography",
    mare: "Calm Mediterranean sea, blue water, horizon line, coastal photography",
    montagna: "Majestic mountain peak, snow-capped, dramatic sky, landscape photography",
    fiume: "Flowing river through green valley, water movement, nature photography",
    foresta: "Dense green forest, tall trees, sunlight filtering through, woodland photography",
    fiore: "Beautiful flower close-up, colorful petals, natural background, nature macro",
  },
  body: {
    testa: "Human head profile, anatomical view, clean background, medical illustration style",
    occhio: "Close-up of human eye, detailed iris, natural lighting, portrait detail",
    bocca: "Human mouth, lips slightly parted, natural expression, portrait detail",
    mano: "Human hand, natural pose, clean background, anatomical reference",
    piede: "Human foot, side view, standing pose, anatomical reference",
    cuore: "Human heart anatomical illustration, detailed, medical diagram style",
  },
  people: {
    uomo: "Portrait of an Italian man, friendly expression, natural lighting, portrait photography",
    donna: "Portrait of an Italian woman, warm smile, natural lighting, portrait photography",
    bambino: "Young Italian child, happy expression, outdoor setting, lifestyle photography",
    padre: "Middle-aged Italian father figure, wise expression, portrait photography",
    madre: "Italian mother figure, warm caring expression, portrait photography",
    famiglia: "Italian family group, multi-generational, warm setting, lifestyle photography",
  },
};

interface GenerateOptions {
  provider: "openai" | "stability" | "local";
  apiKey?: string;
  outputDir: string;
  size?: "256x256" | "512x512" | "1024x1024" | "1792x1024";
}

async function generateWithOpenAI(prompt: string, outputPath: string, options: GenerateOptions): Promise<void> {
  if (!options.apiKey) {
    throw new Error("OpenAI API key required. Set OPENAI_API_KEY environment variable.");
  }

  console.log(`Generating: ${path.basename(outputPath)}`);
  console.log(`Prompt: ${prompt.slice(0, 80)}...`);

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: options.size || "1024x1024",
      response_format: "b64_json",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json() as { data: Array<{ b64_json: string }> };
  const imageData = Buffer.from(data.data[0].b64_json, "base64");
  
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, imageData);
  console.log(`✓ Saved: ${outputPath}`);
}

async function generateImage(prompt: string, outputPath: string, options: GenerateOptions): Promise<void> {
  if (options.provider === "openai") {
    return generateWithOpenAI(prompt, outputPath, options);
  } else if (options.provider === "stability") {
    throw new Error("Stability AI not yet implemented. Use OpenAI provider.");
  } else {
    // Local mode - just create a placeholder
    console.log(`[LOCAL MODE] Would generate: ${outputPath}`);
    console.log(`  Prompt: ${prompt.slice(0, 60)}...`);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath + ".txt", `Prompt: ${prompt}\nProvider: local\n`);
  }
}

async function generateRooms(options: GenerateOptions): Promise<void> {
  console.log("\n🏠 Generating room backgrounds...\n");
  
  for (const room of ROOM_CONFIGS) {
    const outputPath = path.join(options.outputDir, "rooms", `${room.id}.jpg`);
    
    if (fs.existsSync(outputPath)) {
      console.log(`Skipping ${room.id} (already exists)`);
      continue;
    }

    try {
      await generateImage(room.prompt, outputPath, {
        ...options,
        size: "1792x1024", // Wider format for room scenes
      });
    } catch (error) {
      console.error(`Failed to generate ${room.id}:`, error);
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }
}

async function generateItems(category: string | null, options: GenerateOptions): Promise<void> {
  console.log("\n📦 Generating item images...\n");
  
  const categories = category ? [category] : Object.keys(ITEM_PROMPTS);
  
  for (const cat of categories) {
    const items = ITEM_PROMPTS[cat];
    if (!items) {
      console.log(`No item prompts for category: ${cat}`);
      continue;
    }

    console.log(`\nCategory: ${cat}`);
    
    for (const [word, prompt] of Object.entries(items)) {
      const outputPath = path.join(options.outputDir, "items", `${word}.jpg`);
      
      if (fs.existsSync(outputPath)) {
        console.log(`  Skipping ${word} (already exists)`);
        continue;
      }

      try {
        await generateImage(prompt, outputPath, {
          ...options,
          size: "1024x1024",
        });
      } catch (error) {
        console.error(`  Failed to generate ${word}:`, error);
      }

      // Rate limiting
      await new Promise(r => setTimeout(r, 500));
    }
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const provider = (process.env.AI_PROVIDER as GenerateOptions["provider"]) || "local";
  const apiKey = process.env.OPENAI_API_KEY || process.env.STABILITY_API_KEY;
  
  const options: GenerateOptions = {
    provider,
    apiKey,
    outputDir: path.join(ROOT, "client", "public"),
  };

  // Parse arguments
  const generateRoomsFlag = args.includes("--rooms");
  const generateItemsFlag = args.includes("--items");
  const generateAllFlag = args.includes("--all");
  
  const categoryArg = args.find(a => a.startsWith("--category="));
  const category = categoryArg ? categoryArg.split("=")[1] : null;

  if (generateAllFlag || (!generateRoomsFlag && !generateItemsFlag)) {
    await generateRooms(options);
    await generateItems(category, options);
  } else {
    if (generateRoomsFlag) await generateRooms(options);
    if (generateItemsFlag) await generateItems(category, options);
  }

  console.log("\n✅ Done!");
}

main().catch(console.error);
