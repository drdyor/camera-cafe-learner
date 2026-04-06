#!/usr/bin/env tsx
/**
 * FREE Image Generation Script for Memory Palace
 * 
 * Uses free alternatives:
 * 1. Pollinations AI (free, no key needed)
 * 2. Unsplash API (free tier)
 * 3. SVG/CSS placeholders (100% free)
 * 
 * Usage:
 *   npx tsx scripts/generate-images-free.ts --rooms
 *   npx tsx scripts/generate-images-free.ts --items
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Room configurations with generation prompts
const ROOM_CONFIGS = [
  {
    id: "kitchen/main",
    prompt: "A warm rustic Italian kitchen interior, sunny afternoon light, terracotta tiles, wooden table with bread and olive oil, copper pots hanging, cozy atmosphere, photorealistic, high quality",
    unsplashKeyword: "italian+kitchen",
  },
  {
    id: "kitchen/fridge",
    prompt: "Inside a refrigerator, shelves with fresh food, milk, cheese, eggs, vegetables, clean and organized, bright lighting, photorealistic",
    unsplashKeyword: "refrigerator+interior",
  },
  {
    id: "kitchen/cabinets",
    prompt: "Kitchen cabinet interior, stacked white plates, glass cups, ceramic bowls, wooden shelves, warm lighting, organized, photorealistic",
    unsplashKeyword: "kitchen+cabinets",
  },
  {
    id: "kitchen/drawers",
    prompt: "Open kitchen drawer, silverware organizer, wooden utensils, cutlery, neat and tidy, top view, photorealistic",
    unsplashKeyword: "kitchen+drawer",
  },
  {
    id: "kitchen/cooking",
    prompt: "Italian grandmother cooking pasta, steam rising from pot, wooden spoon, traditional kitchen, warm lighting, nostalgic, photorealistic",
    unsplashKeyword: "cooking+pasta",
  },
  {
    id: "kitchen/sink",
    prompt: "Kitchen sink with running water, soap bubbles, dishes, window above, natural light, clean, photorealistic",
    unsplashKeyword: "kitchen+sink",
  },
  {
    id: "kitchen/pantry",
    prompt: "Walk-in pantry, wooden shelves, jars of pasta, cans, bottles, organized storage, warm lighting, photorealistic",
    unsplashKeyword: "pantry",
  },
];

interface GenerateOptions {
  provider: "pollinations" | "unsplash" | "svg";
  outputDir: string;
}

// 1. Pollinations AI - FREE, no key needed!
async function generateWithPollinations(prompt: string, outputPath: string): Promise<void> {
  console.log(`Generating with Pollinations: ${path.basename(outputPath)}`);
  
  // Pollinations free API
  const encodedPrompt = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=42&nologo=true`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Pollinations API error: ${response.status}`);
  }
  
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buffer);
  console.log(`✓ Saved: ${outputPath}`);
}

// 2. Unsplash - FREE (50 requests/hour)
async function downloadFromUnsplash(keyword: string, outputPath: string): Promise<void> {
  console.log(`Downloading from Unsplash: ${keyword}`);
  
  // Using Unsplash Source (free, no key required for basic usage)
  const url = `https://source.unsplash.com/1024x1024/?${keyword}`;
  
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Unsplash error: ${response.status}`);
  }
  
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buffer);
  console.log(`✓ Saved: ${outputPath}`);
}

// 3. Create SVG placeholder (100% free, instant)
function createSvgPlaceholder(name: string, outputPath: string): void {
  console.log(`Creating SVG placeholder: ${path.basename(outputPath)}`);
  
  const colors: Record<string, string> = {
    "kitchen": "#f59e0b",
    "fridge": "#3b82f6", 
    "cabinet": "#8b5cf6",
    "drawer": "#10b981",
    "cooking": "#ef4444",
    "sink": "#06b6d4",
    "pantry": "#d97706",
  };
  
  const color = colors[name.split("/")[1] || "#6366f1";
  
  const svg = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:${color};stop-opacity:0.1" />
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${color}" stroke-opacity="0.1" stroke-width="1"/>
    </pattern>
  </defs>
  
  <!-- Background -->
  <rect width="1024" height="1024" fill="url(#grad)"/>
  <rect width="1024" height="1024" fill="url(#grid)"/>
  
  <!-- Decorative circles -->
  <circle cx="200" cy="200" r="100" fill="${color}" fill-opacity="0.1"/>
  <circle cx="824" cy="824" r="150" fill="${color}" fill-opacity="0.1"/>
  <circle cx="800" cy="200" r="80" fill="${color}" fill-opacity="0.05"/>
  <circle cx="200" cy="800" r="120" fill="${color}" fill-opacity="0.05"/>
  
  <!-- Room icon -->
  <text x="512" y="450" font-size="200" text-anchor="middle" fill="${color}" fill-opacity="0.5">
    ${getIconForRoom(name)}
  </text>
  
  <!-- Room name -->
  <text x="512" y="650" font-family="system-ui, sans-serif" font-size="48" font-weight="bold" 
        text-anchor="middle" fill="${color}" fill-opacity="0.8">
    ${name.replace("kitchen/", "").replace(/-/g, " ").toUpperCase()}
  </text>
  
  <!-- Subtitle -->
  <text x="512" y="720" font-family="system-ui, sans-serif" font-size="24" 
        text-anchor="middle" fill="#64748b">
    Memory Palace • Italian Kitchen
  </text>
</svg>
  `.trim();
  
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, svg);
  console.log(`✓ Saved SVG: ${outputPath}`);
}

function getIconForRoom(name: string): string {
  const icons: Record<string, string> = {
    "main": "🍳",
    "fridge": "❄️",
    "cabinets": "🗄️",
    "drawers": "🗂️",
    "cooking": "👨‍🍳",
    "sink": "🚰",
    "pantry": "🥫",
  };
  return icons[name.split("/")[1]] || "🏠";
}

async function generateRooms(options: GenerateOptions): Promise<void> {
  console.log("\n🏠 Generating room images...\n");
  
  for (const room of ROOM_CONFIGS) {
    const outputPath = path.join(options.outputDir, "palace", `${room.id}.jpg`);
    const svgPath = path.join(options.outputDir, "palace", `${room.id}.svg`);
    
    if (fs.existsSync(outputPath) || fs.existsSync(svgPath)) {
      console.log(`Skipping ${room.id} (already exists)`);
      continue;
    }

    try {
      switch (options.provider) {
        case "pollinations":
          await generateWithPollinations(room.prompt, outputPath);
          break;
        case "unsplash":
          await downloadFromUnsplash(room.unsplashKeyword, outputPath);
          break;
        case "svg":
        default:
          createSvgPlaceholder(room.id, svgPath);
          break;
      }
    } catch (error) {
      console.error(`Failed to generate ${room.id}:`, error);
      // Fallback to SVG
      console.log(`  Falling back to SVG...`);
      createSvgPlaceholder(room.id, svgPath);
    }

    // Rate limiting (be nice to free APIs)
    if (options.provider !== "svg") {
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  
  const options: GenerateOptions = {
    provider: (process.env.IMAGE_PROVIDER as GenerateOptions["provider"]) || "svg", // Default to SVG (free)
    outputDir: path.join(ROOT, "client", "public"),
  };

  // Parse provider from args
  if (args.includes("--pollinations")) options.provider = "pollinations";
  if (args.includes("--unsplash")) options.provider = "unsplash";
  if (args.includes("--svg")) options.provider = "svg";

  console.log(`Using provider: ${options.provider}`);

  const generateRoomsFlag = args.includes("--rooms");
  const generateAllFlag = args.includes("--all") || (!generateRoomsFlag);

  if (generateAllFlag || generateRoomsFlag) {
    await generateRooms(options);
  }

  console.log("\n✅ Done!");
  console.log("\nNote: If using SVG placeholders, you can replace them with real images later.");
  console.log("The app will work perfectly with SVGs - they're lightweight and instant!");
}

main().catch(console.error);
