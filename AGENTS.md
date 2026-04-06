# Camera Cafe Learner - Agent Guidelines

## Project Overview

An interactive Italian language learning platform built with React 19, TypeScript, Vite, and Tailwind CSS. Features multiple learning tools: Camera Cafe TV episodes with dual subtitles, Memory Palace (spatial vocabulary), stories, dialogues, visual dictionary, Chrome extension. Vocabulary is grounded in the **Kelly frequency word list** (6,529 words, CEFR A1-C2) and **GCSE categories**, not arbitrary translations.

## Architecture

### Tech Stack
- **Frontend**: React 19 + TypeScript + Vite 7
- **Styling**: Tailwind CSS 4.1 (CSS-first `@theme inline` in `client/src/index.css`)
- **Routing**: wouter (NOT react-router) — use `useLocation()`, `useRoute()`
- **Data fetching**: tRPC client + React Query
- **UI components**: shadcn/ui (54+ Radix components)
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Font**: Cinzel (Google Fonts) for palace headings
- **Backend**: Express + tRPC 11 + better-sqlite3 + drizzle-orm
- **Database**: SQLite (`data/app.db`)
- **Path aliases**: `@/` = `client/src/`, `@shared/` = `shared/`
- **Content gen**: Ollama qwen3:32b (local, zero API cost)
- **Pronunciation**: Web Speech API (browser-native, free)

### Color Theme (Palace)
```
#2B1E1A    Primary background (dark brown)
#F3E8D7    Text and accents (cream)
#E7A04D    Highlights and CTAs (gold)
#3B82F6    Masculine gender (blue)
#EC4899    Feminine gender (pink)
```

Palace pages use their own sepia theme inline. Main app uses light theme with blue primary (OKLCH).

## Current Status (April 6, 2026)

### What's Done
- Full-stack app: episodes, stories, dialogues, visual dictionary, Chrome extension
- Memory Palace landing (`/palace`), room list (`/palace/rooms`)
- 8 rooms with real photos, zones, category-based vocab mapping
- Sepia theme, Cinzel font, gender-colored dots (design complete)
- Kelly word list imported (6,529 words) + italian-dictionary.json (624 categorized words)
- GCSE overlap analysis done

### Recently Fixed
- **`MemoryPalaceRoom.tsx`** — Rewritten to fetch vocab from tRPC `dictionary.lookup`, filter by `room.categories`, auto-scatter dots with deterministic positioning. Zone drill-down working (click zone pill or zone overlay to filter vocab by sub-category).

### What Needs Building
1. Wire dictionary data to palace vocab dots (tRPC fetch → filter by category → scatter dots)
2. Zone drill-down (click zone → filter vocab to sub-category)
3. Tab system (Explore / Learn / Dialogues / Practice / Test)
4. Grammar lesson content per room
5. Dialogue content per room
6. Character chat (pre-written responses)
7. Language switcher (Italian first, then French/Spanish)
8. Connect to SRS system

## Memory Palace System

### Directory Structure
```
client/src/components/memory-palace/
  data/
    rooms.ts            # 8 rooms with categories + zones (NO vocabularySlots)
    types.ts            # VocabularyItem, Gender, SupportedLanguage interfaces
    language-config.ts  # Language registry (it-IT, fr-FR, etc.)
  SimpleViewer.tsx      # Pan/zoom room viewer (v1, used by /memory-palace)
  data.ts               # Original kitchen-only Italian data (v1)
  index.ts              # Barrel exports

client/src/pages/
  MemoryPalaceLanding.tsx   # /palace — hero + room grid
  MemoryPalaceRooms.tsx     # /palace/rooms — room card list
  MemoryPalaceRoom.tsx      # /palace/rooms/:roomId — BROKEN, needs fix
  MemoryPalace.tsx          # /memory-palace — original v1 spatial viewer (keep)

client/public/palace/
  rooms/                # 12 room photos (JPG)
  characters/           # 3 character PNGs (giulia, marco, nonna)
```

### Room Structure (CURRENT — rooms.ts was rewritten)

**Important**: `rooms.ts` no longer uses `vocabularySlots`. It now uses `categories` and `zones` with optional **interior images**.

```typescript
interface RoomZone {
  id: string;
  name: string;
  nameIt: string;       // Italian name
  description: string;
  icon: string;         // emoji
  categories: string[]; // dictionary categories to pull from
  x: number; y: number; // position on room image (%)
  width: number; height: number;
  interiorImage?: string; // close-up image of this zone (e.g., inside fridge)
  interiorVocab?: { word: string; x: number; y: number }[]; // words positioned in interior
}

interface Room {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  description: string;
  categories: string[];   // main dictionary categories
  zones: RoomZone[];      // clickable sub-areas for drill-down
  grammarFocus: string;   // what grammar concept this room teaches
}
```

### Room → Category → Dictionary Flow

Vocabulary comes from `data/italian-dictionary.json` (624 words), NOT from hardcoded slots.

| Room | Categories | Zones |
|------|-----------|-------|
| Entrance Hall | people | family-portrait (people), coat-rack (clothing), mirror (body) |
| Kitchen | kitchen | fridge (kitchen), pantry (kitchen), stove (kitchen), table (restaurant) |
| Library | school | bookshelf (school), desk (work), computer (technology) |
| Bedroom | bedroom, clothing | wardrobe (clothing), bed (bedroom), photos (people) |
| Garden | outdoors | flowers (outdoors), path (buildings), sky (weather) |
| Study | school, work | desk-study (school), clock (time) |
| Living Room | home, freetime | sofa (freetime), tv (technology, freetime), furniture (home) |
| Gallery | emotions, health | paintings (emotions), pharmacy (health), gift-shop (shop) |

### Zone Interior Images (NEW) — The Winning System

**Problem:** Words like "knife" don't match objects in generic room photos.
**Solution:** Multiple scene images per room with precisely positioned vocabulary.

**How it works:**
1. **Main room view** — Overview with zone overlays (fridge, pantry, stove, table)
2. **Click zone** → "Enter" button appears
3. **Interior view** — Close-up image of that specific area (e.g., open pantry)
4. **Words positioned ON actual objects** — "pasta" appears on pasta boxes, "olio" on oil bottles

**Kitchen Scene Images Needed:**
| Scene | Image File | Objects Visible | Words Positioned |
|-------|-----------|-----------------|------------------|
| Main Kitchen | kitchen.jpg | Overview | General kitchen words |
| Inside Fridge | kitchen-fridge.jpg | Milk, eggs, cheese, fruit | latte, uova, formaggio, frutta |
| Open Pantry | kitchen-pantry.jpg | Pasta, rice, oil, spices | pasta, riso, olio, sale |
| Stove Area | kitchen-stove.jpg | Pots, pans, utensils | pentola, padella, coltello |
| Dining Table | kitchen-table.jpg | Plates, glasses, food | piatto, bicchiere, caffè |

**Image Generation Strategy:**
- Use AI image gen (Midjourney/SDXL/DALL-E) for consistent style
- Prompt template: "Italian rustic kitchen [area], warm lighting, photorealistic, 16:9"
- Ensure objects match vocabulary words exactly
- Same color grading across all images for consistency

**Benefits:**
- Spatial memory: Word position = object position in photo
- Progressive discovery: Overview → specific areas → exact objects
- Scalable: Each room can have 3-5 scene images
- Real context: Words match what learners actually see

### Vocabulary Data Sources

1. **`data/italian-dictionary.json`** — 624 Italian words with `{en, g, emoji, cat}`
   - 554 of 624 overlap with Kelly list
   - Categories match room themes: kitchen, people, outdoors, school, etc.
   - Served via tRPC: `dictionary.lookup` returns full dictionary

2. **`extension/kelly.json`** — 6,529 Italian words with frequency rank + CEFR level
   - A1: words 1-838, A2: words 839-1806
   - Used for frequency sorting (most common words first)

### How Vocab Works (IMPLEMENTED)
1. Room page calls tRPC `dictionary.lookup` to get full dictionary
2. Filters entries where `cat` matches any of `room.categories`
3. Assigns deterministic x/y positions (seeded hash of word → scatter across image)
4. Renders as gender-colored dots (blue=m, pink=f, gold=none)
5. Clicking a zone filters to that zone's specific categories
6. Zones with `interiorImage` show "Enter" button for close-up view

## Key Components

### VocabDot
- Positioned absolutely at x%, y% coordinates
- Pulsing glow animation for discoverability
- Hover shows tooltip with word + English + gender badge
- Click opens WordSidePanel + speaks word
- Gender-coded: blue (masculine), pink (feminine), gold (none)
- Review words get golden pulse ring

### WordSidePanel
- Appears NEXT to clicked word (not center modal) for spatial retention
- Shows Italian word, English translation, gender badge
- Mastery progress bar (if attempts > 0)
- "Listen" button (TTS, lang: 'it-IT', rate: 0.8)
- "Mark for Review" / "Remove from Review" button

### ZoneOverlay
- Clickable zone areas overlaid on room image
- Shows zone name label on hover
- Active state highlights the zone
- **NEW:** Zones with `interiorImage` show "Enter →" button when active
- Click "Enter" to view close-up interior image with positioned vocabulary

## Dialogue System

### GCSE Themes
- Ordering at a cafe, Shopping for clothes, Asking for directions
- Booking a hotel, Family introductions, Making plans
- Health and illness, Transportation, Restaurant dining
- Weather and seasons, At the doctor's

## Creating Zone Interior Images

### Workflow for New Scene Images

1. **List vocabulary** for the zone (6-10 words max per scene)
2. **Design the scene** — sketch what objects should be visible
3. **Generate image** using AI with consistent style
4. **Position words** — add `{ word, x, y }` entries to `interiorVocab`
5. **Test** — click zone, verify words appear on correct objects

### Example: Kitchen Pantry Scene

**Vocabulary:** pasta, riso, olio, sale, zucchero, pane

**Scene Design:**
- Open pantry with shelves
- Top shelf: pasta boxes, rice bags
- Middle shelf: oil bottles, salt container
- Bottom shelf: sugar jar, bread basket

**Image Generation Prompt:**
```
Rustic Italian kitchen pantry, open wooden cabinet, 
glass jars of pasta and rice, olive oil bottles, 
warm golden lighting, photorealistic, 16:9 aspect ratio
```

**Code Update:**
```typescript
{
  id: 'pantry',
  name: 'The Pantry',
  interiorImage: '/palace/rooms/kitchen-pantry.jpg',
  interiorVocab: [
    { word: 'pasta', x: 25, y: 30 }, // on pasta boxes
    { word: 'riso', x: 55, y: 30 },  // on rice bags
    { word: 'olio', x: 35, y: 55 },  // on oil bottles
    { word: 'sale', x: 65, y: 50 },  // on salt container
    { word: 'zucchero', x: 45, y: 75 }, // on sugar jar
    { word: 'pane', x: 75, y: 70 },  // on bread basket
  ]
}
```

### Image Requirements
- **Aspect ratio:** 16:9 or similar landscape
- **Resolution:** 1920x1080 minimum
- **Style:** Consistent across all room scenes
- **Objects:** Clearly visible, match vocabulary exactly
- **Lighting:** Warm, inviting (avoid harsh shadows)

## Development Guidelines

### Adding Vocabulary
1. Check `data/italian-dictionary.json` for existing words
2. Add entries with: `"word": { "en": "...", "g": "m|f", "emoji": "...", "cat": "category" }`
3. Ensure category matches a room's categories in `rooms.ts`
4. No need to manually position — dots should be auto-scattered

### Styling Conventions
- Palace: inline Tailwind with hex colors (`bg-[#2B1E1A]`, `text-[#F3E8D7]`)
- Main app: use theme variables (`bg-background`, `text-foreground`)
- Headings: `font-cinzel` for palace, default Inter for main app
- Don't modify main app theme for palace changes

### Routing
- wouter, NOT react-router
- `const [, setLocation] = useLocation()` for navigation
- `const [, params] = useRoute('/palace/rooms/:roomId')` for params

### Content Generation
- Use Ollama (`ollama run qwen3:32b`) for bulk work — saves API tokens
- Good for: translations, story generation, dialogue writing, grammar examples

## Commands

```bash
pnpm dev          # Start dev server (port 3000)
pnpm check        # TypeScript check
pnpm build        # Production build
pnpm test         # Run vitest
pnpm db:push      # Run drizzle migrations
```

## Route Map

| Route | Page | Status |
|---|---|---|
| `/` | Home | Working |
| `/episodes` | EpisodeLibrary | Working |
| `/watch/:episodeId` | VideoPlayer | Working |
| `/vocabulary` | VocabularyCollection | Working |
| `/stories` | StoryLibrary | Working |
| `/story/:storyId` | StoryReader | Working |
| `/visual-dictionary` | VisualDictionary | Working |
| `/dialogues` | DialogueLibrary | Working |
| `/dialogue/:dialogueId` | DialoguePlayer | Working |
| `/palace` | MemoryPalaceLanding | Working |
| `/palace/rooms` | MemoryPalaceRooms | Working |
| `/palace/rooms/:roomId` | MemoryPalaceRoom | **WORKING** — Room depth levels, side-panel popups, review system |
| `/memory-palace` | MemoryPalace (v1) | Working (keep) |

## Recent Updates (April 6, 2026)

### MemoryPalaceRoom — NOW WORKING ✓
- **Dictionary wiring**: Fetches from tRPC `dictionary.lookup`, filters by room categories
- **Auto-scatter**: Vocab dots positioned via grid + jitter algorithm
- **Zone drill-down**: Click zone overlays or pill buttons to filter by sub-category
- **Gender-coded dots**: Blue (♂ masculine), Pink (♀ feminine), Gold (none)

### Grammar Content Added
- Created `client/src/components/memory-palace/data/grammar.ts` with 24 lessons
- 3 lessons per room covering the `grammarFocus` topic
- Accordion UI in Learn tab with expandable lessons
- Each lesson: title (EN/IT), explanation, formula, examples, tips

### Tab System Implemented
4 tabs added to room page:
1. **Explore** — Interactive room with vocab dots, zone filtering, gender guide
2. **Learn** — Grammar accordion with 3 lessons per room
3. **Practice** — Placeholder cards (flashcards, matching, conjugation, listening)
4. **Test** — Placeholder for assessments (vocabulary check, grammar challenge, mastery)

### Grammar Topics by Room
| Room | Topics |
|------|--------|
| Entrance Hall | essere & avere (all forms), expressions |
| Kitchen | fare, regular -ARE verbs, partitive (del/della) |
| Library | -ERE verbs, -IRE verbs, -ISC- verbs |
| Bedroom | possessives, adjective agreement, reflexive verbs |
| Garden | andare, preposizioni articolate, weather |
| Study | studiare, school subjects, piacere |
| Living Room | telling time, days of week, stare |
| Gallery | emotions with essere, emotion verbs, opinions |

## New Features (April 6, 2026)

### Room Depth System
- 3 vocabulary depth levels per room (1=basic, 2=intermediate, 3=advanced)
- Words sorted by complexity: short/common words = Level 1, complex words = Level 3
- **Default: All words visible (Level 3)** - users can filter down if desired
- "Unlock More Words" button available for progressive reveal if preferred
- Progress saved to localStorage per room

### Zone Interior Images
**Problem:** Vocabulary words (e.g., "knife") don't match objects visible in the main room photo.
**Solution:** Zones can have interior close-up images with precisely positioned vocabulary.

**How it works:**
1. Main room view shows overview with zone overlays
2. Click zone → filters vocabulary to that zone's category
3. Zones with `interiorImage` show "Enter Zone" button
4. Interior view shows close-up photo with words positioned ON actual objects
5. "Back to Room" returns to main view

**Benefits:**
- Words match actual visible objects (knife appears on a knife in the stove area)
- Spatial memory association (word position = object position)
- Progressive exploration (main room → specific areas)

### Review System
- Click any vocab dot → side panel opens with "Mark for Review" button
- Review words get golden pulse ring animation
- Filter to show only review words
- Review list saved to localStorage per room

### Side Panel Popups (Spatial Retention)
- Word details appear in side panel NEXT to the clicked word (not center modal)
- No background blur - keeps spatial context
- Panel positions left/right based on dot location
- Shows: Italian word, English, gender badge, mastery progress, Listen, Review buttons

### Mastery Tracking
- Each word tracks attempts and correct answers
- Progress bar shows mastery percentage
- Words with <70% accuracy get red pulse (struggling)

## Updated Route Status

| Route | Page | Status |
| `/palace/rooms/:roomId` | MemoryPalaceRoom | **WORKING** — Explore tab complete, Learn tab has grammar |
