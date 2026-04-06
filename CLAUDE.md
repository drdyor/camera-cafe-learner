# Camera Cafe Learner — Agent Guide

## What This Is

An Italian language learning platform that serves **multiple learning styles** through different tools. The core idea: learn Italian from real content (Camera Cafe TV show), reinforced by spatial memory (Memory Palace), structured practice (stories, dialogues, visual dictionary), and spaced repetition.

## Why We Built It

Traditional language apps teach vocabulary in isolation. This project connects words to:
- **Real TV episodes** — hear Italian in natural conversation
- **Physical spaces** — Memory Palace anchors words to locations (proven mnemonic technique)
- **Frequency data** — Kelly word list ensures you learn the most useful words first
- **GCSE curriculum** — practical alignment with exam requirements

## Who It's For (Learning Styles)

| Learner Type | Tool | Route |
|---|---|---|
| **Visual/Spatial** | Memory Palace — walk through rooms, see words in context | `/palace` |
| **Auditory** | Camera Cafe episodes with dual subtitles + pronunciation | `/episodes`, `/watch/:id` |
| **Reading/Writing** | Stories (A1/A2 Italian), Visual Dictionary | `/stories`, `/visual-dictionary` |
| **Social/Conversational** | Dialogues, (future: character chat) | `/dialogues` |
| **Structured/Academic** | Kelly word list, GCSE overlap, frequency grading | `/vocabulary` |
| **On-the-go** | Chrome extension — learn from any Italian YouTube video | `extension/` |

## What We Built (Session History)

### Session 1 (initial build)
- Full-stack app: React 19 + Vite + tRPC + SQLite
- Video player with dual subtitle display (Italian + English)
- Kelly word list import (6,529 words, CEFR A1-C2)
- Phrase extraction from Camera Cafe subtitles
- Chrome extension for YouTube vocabulary lookup
- Spaced repetition (SM-2 + FSRS algorithms)

### Session 2 (April 5-6, 2026)
- Stories library (Ollama-generated A1/A2 Italian stories)
- Visual Dictionary with Kelly frequency + GCSE overlap
- Dialogue system
- GCSE material integration
- Memory Palace v1 (spatial viewer with nested zoom/pan rooms, Italian kitchen vocab)

### Current Session (April 6, 2026)
- Ported the French Memory Palace (built months ago as standalone Kimi project) into the app
- New `/palace` route with warm sepia theme, real room photos, gender-colored vocab dots
- Language-agnostic architecture: same rooms work for Italian, French, Spanish, Mandarin
- Created landing page (`/palace`), room list (`/palace/rooms`), room explore view (`/palace/rooms/:roomId`)
- Rewrote `rooms.ts` to use category-based vocab from `italian-dictionary.json` instead of hardcoded vocab slots
- Each room has zones (clickable sub-areas) that drill into specific dictionary categories
- Created CLAUDE.md, ARCHITECTURE.md, AGENT.md for session continuity and Kimi coordination
- **In progress**: Fixing MemoryPalaceRoom.tsx to wire up dictionary API → vocab dots

## Vocabulary Strategy

**The Kelly word list is the source of truth.** All vocab features reference it:
- `extension/kelly.json` — 6,529 Italian words with frequency rank + CEFR level + POS
- 838 A1 words + 968 A2 words = **1,806 high-priority words**
- Palace rooms, visual dictionary, episode highlights all draw from this list
- GCSE overlap ensures practical exam relevance
- Words are organized by **frequency** (most common first) and **category** (thematic grouping)

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite 7, Tailwind 4, wouter, tRPC client |
| Backend | Express, tRPC, better-sqlite3, drizzle-orm |
| Database | SQLite (`data/app.db`) |
| Styling | Tailwind CSS 4.1 (`@theme inline` in `client/src/index.css`) |
| Path aliases | `@/` → `client/src/`, `@shared/` → `shared/` |
| Content gen | Ollama (qwen3:32b local, zero tokens) |
| Pronunciation | Web Speech API (browser-native, free) |
| Extension | Chrome Manifest V3, side panel |

## Project Structure

```
client/src/
  pages/                    # Route pages (wouter)
    Home.tsx                # Landing page
    EpisodeLibrary.tsx      # Browse Camera Cafe episodes
    VideoPlayer.tsx         # Watch with dual subs
    VocabularyCollection.tsx # Saved words + review
    StoryLibrary.tsx        # A1/A2 stories
    StoryReader.tsx         # Read a story
    VisualDictionary.tsx    # Browse vocab by category
    DialogueLibrary.tsx     # Dialogue list
    DialoguePlayer.tsx      # Practice a dialogue
    MemoryPalaceLanding.tsx # /palace — hero + room grid
    MemoryPalaceRooms.tsx   # /palace/rooms — all 8 rooms
    MemoryPalaceRoom.tsx    # /palace/rooms/:roomId — explore
    MemoryPalace.tsx        # /memory-palace — original spatial viewer
  components/
    ui/                     # 54+ shadcn/Radix components
    memory-palace/
      data/
        types.ts            # Shared interfaces
        rooms.ts            # 8 rooms (structure + vocab slot positions)
        language-config.ts  # Language registry (it/fr/es/zh)
      SimpleViewer.tsx      # Original zoom/pan viewer
      SpatialViewer.tsx     # react-prismazoom viewer (TS errors, unused)
      data.ts               # Original kitchen-only Italian data
      index.ts              # Barrel exports
server/
  _core/                    # Express + tRPC + Vite middleware
  routers/                  # API: episodes, phrases, vocabulary, kelly, srs, etc.
  db.ts                     # SQLite schema DDL
  db-helpers.ts             # Query functions
data/                       # SQLite DB, subtitles, stories, dialogues
extension/                  # Chrome extension
scripts/                    # Ollama generators
```

## Memory Palace Architecture

Two implementations:
- **`/memory-palace`** — v1 spatial viewer (nested rooms, zoom/pan, emoji dots, kitchen only)
- **`/palace`** — v2 ported from French Memory Palace (sepia theme, room photos, gender dots)

### Palace v2 Design
- **Theme:** `#2B1E1A` bg, `#F3E8D7` text, `#E7A04D` gold, Cinzel serif font
- **Gender colors:** Blue `#3B82F6` = masculine (il), Pink `#EC4899` = feminine (la)
- **8 rooms:** entrance-hall, kitchen, library, bedroom, garden, study, living-room, gallery
- **Each room maps to an Italian grammar concept:**
  1. Entrance Hall → essere & avere
  2. Kitchen → fare & -ARE verbs
  3. Library → regular -ERE & -IRE verbs
  4. Bedroom → family & adjective agreement
  5. Garden → andare & prepositions
  6. Study → questions & negation
  7. Living Room → modal verbs (potere, volere, dovere)
  8. Gallery → passato prossimo
- **Language-agnostic:** Same room photos + dot positions serve Italian, French, Spanish, Mandarin
- **Room images:** `client/public/palace/rooms/*.jpg`
- **Character assets:** `client/public/palace/characters/*.png`

## What Works Right Now

- Landing page at `/palace` with room cards and feature descriptions
- Room list at `/palace/rooms` with photo cards
- Room explore view at `/palace/rooms/:roomId` with vocab dots overlay
- Gender-colored dots (blue/pink) with hover tooltips
- Web Speech API pronunciation on click
- Word detail modal with pronunciation + mnemonic
- Prev/next room navigation
- All existing features (`/episodes`, `/vocabulary`, etc.) still work

## What Needs Fixing / Completing

### Immediate (Palace v2)
- [x] **MemoryPalaceRoom.tsx fixed** — Now fetches vocab from tRPC `dictionary.lookup`, filters by `room.categories`, auto-scatters dots with deterministic positions
- [x] **Zone drill-down working** — Click zone pills or zone overlays to filter vocab by sub-category
- [ ] **Tabs not implemented** — Learn, Dialogues, Practice, Characters, Test tabs are in the plan but not built yet
- [ ] **`SpatialViewer.tsx` has TS errors** — PrismaZoom prop mismatch (unused, low priority)

### Next Steps (Phase 2-3)
- [ ] Build tab system (Explore / Learn / Dialogues / Practice / Characters / Test)
- [ ] Grammar lesson viewer (accordion with examples + common mistakes)
- [ ] Dialogue viewer with tense switching (presente / passato / futuro)
- [ ] Vocabulary test (4-mode quiz)
- [ ] Character chat (static responses, no AI API needed)
- [ ] Language switcher (Italian → French → Spanish)

### Backlog
- [ ] Connect palace vocab to SRS system (mark words as learned → track with FSRS)
- [ ] Subtitle timing adjustment controls
- [ ] Review queue / spaced repetition UI
- [ ] Export vocabulary to Anki
- [ ] YouTube channel content pipeline (stories → video → upload)
- [ ] Mobile optimization

## Commands

```bash
pnpm dev          # Start dev server (port 3000)
pnpm check        # TypeScript check
pnpm test         # Run vitest
pnpm build        # Production build
pnpm db:push      # Run drizzle migrations
```

## Working Conventions

- **Use Ollama** (`ollama run qwen3:32b`) for bulk content generation (translations, stories, vocab) — saves API tokens
- Palace pages use their own sepia theme — don't modify the main app's light theme
- Keep vocab aligned with Kelly word list frequency ranks
- wouter for routing (not react-router) — use `useLocation()` and `useRoute()`
- Test with `pnpm dev` then browse to the relevant route
- The old `/memory-palace` spatial viewer and new `/palace` coexist — don't delete either
