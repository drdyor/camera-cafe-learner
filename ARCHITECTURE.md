# Camera Cafe Learner — Architecture

## System Overview

```
┌──────────────────────────────────────────────────────┐
│                   Browser                            │
│                                                      │
│  ┌─────────────┐  ┌──────────┐  ┌─────────────────┐ │
│  │ Camera Cafe  │  │ Memory   │  │ Stories/Dict/   │ │
│  │ Episodes     │  │ Palace   │  │ Dialogues       │ │
│  │ /episodes    │  │ /palace  │  │ /stories etc    │ │
│  └──────┬───────┘  └────┬─────┘  └───────┬─────────┘ │
│         │               │                │           │
│         └───────────┬───┴────────────────┘           │
│                     │ tRPC                           │
│  ┌──────────────────▼──────────────────────┐         │
│  │         Chrome Extension                │         │
│  │  (YouTube vocab lookup, side panel)     │         │
│  └─────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│              Express + tRPC Server                   │
│                                                      │
│  Routers: episodes, phrases, vocabulary, kelly,      │
│           srs, progress, stories, dialogues,         │
│           dictionary                                 │
│                                                      │
│  ┌─────────────────────────────────────────┐         │
│  │            SQLite (data/app.db)         │         │
│  │                                         │         │
│  │  episodes (10)     subtitles (8,500+)   │         │
│  │  kellyList (6,529) phrases (2,688)      │         │
│  │  userVocabulary    episodeProgress      │         │
│  └─────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│              Ollama (localhost:11434)                 │
│  qwen3:32b — translation, story gen, vocab gen       │
│  (zero API cost, runs locally)                       │
└──────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Stack
- React 19 + TypeScript + Vite 7
- Tailwind CSS 4.1 (CSS-first config with `@theme inline`)
- wouter (routing) — lightweight, hooks-based
- tRPC client + React Query (data fetching)
- shadcn/ui (54+ Radix-based components)
- framer-motion (animations)

### Route Map

| Route | Page | Feature |
|---|---|---|
| `/` | Home | Landing page with feature cards |
| `/episodes` | EpisodeLibrary | Browse Camera Cafe episodes |
| `/watch/:episodeId` | VideoPlayer | Dual subtitle player + vocab sidebar |
| `/vocabulary` | VocabularyCollection | Saved words + SRS review |
| `/stories` | StoryLibrary | A1/A2 Italian stories |
| `/story/:storyId` | StoryReader | Read a story |
| `/visual-dictionary` | VisualDictionary | Browse by category (Kelly + GCSE) |
| `/dialogues` | DialogueLibrary | Dialogue list |
| `/dialogue/:dialogueId` | DialoguePlayer | Practice dialogues |
| `/palace` | MemoryPalaceLanding | Palace hero + room grid |
| `/palace/rooms` | MemoryPalaceRooms | All 8 rooms with photos |
| `/palace/rooms/:roomId` | MemoryPalaceRoom | Explore room with vocab dots |
| `/memory-palace` | MemoryPalace | Original spatial viewer (v1) |

### Styling Strategy
- **Main app:** Light theme, blue primary, OKLCH color space
- **Memory Palace:** Self-contained sepia theme (`#2B1E1A`/`#F3E8D7`/`#E7A04D`), Cinzel serif font
- Both coexist — palace pages apply their own colors inline

## Backend Architecture

### Stack
- Express.js + tRPC 11
- better-sqlite3 + drizzle-orm
- SQLite database at `data/app.db`

### Database Schema
```
episodes      — Camera Cafe episodes (id, title, season, difficulty, youtubeId)
subtitles     — Italian + English subs (episodeId, language, startTime, endTime, text)
kellyList     — 6,529 Italian words (lemma, pos, cefrLevel, frequencyRank)
phrases       — Extracted learnable phrases (episodeId, italianText, englishTranslation, cefrLevel)
userVocabulary — User's saved words + SRS state (status, nextReviewAt)
episodeProgress — Watch history
```

### Key Algorithms
- **Phrase extraction:** Tokenize subtitles → build 1-8 word phrases → score against Kelly list → filter CEFR ≤ B1
- **Spaced repetition:** SM-2 + FSRS algorithms (ts-fsrs, supermemo packages)
- **Kelly scoring:** Words ranked 1-1000 = A1, 1001-2000 = A2, 2001-3500 = B1, 3500+ = B2+

## Memory Palace Architecture

### Language-Agnostic Design
```
Room Structure (rooms.ts)          Per-Language Vocab
┌─────────────────────┐           ┌──────────────────┐
│ room: entrance-hall  │           │ vocab-it.ts      │
│ image: /palace/...   │  ×  lang  │ vocab-fr.ts      │
│ slots: [{x,y}, ...]  │    ====>  │ vocab-es.ts      │
│ grammar: [...]        │           │ vocab-zh.ts      │
└─────────────────────┘           └──────────────────┘
```

- **8 rooms** with real photos, each mapped to a grammar concept
- **Vocabulary slots** define positions (x%, y%) on the room image
- **Per-language files** map slot IDs to translated words with pronunciation + mnemonics
- **Same photos work for all languages** — only the text labels change

### Room → Grammar Mapping
1. Entrance Hall → essere & avere (to be & to have)
2. Kitchen → fare & -ARE verbs
3. Library → regular -ERE & -IRE verbs
4. Bedroom → family & adjective agreement
5. Garden → andare & prepositions
6. Study → questions & negation
7. Living Room → modal verbs (potere, volere, dovere)
8. Gallery → passato prossimo (past tense)

## Content Pipeline

### Camera Cafe Episodes
```
YouTube (Camera Cafe) → yt-dlp (auto-captions) → SQLite (subtitles)
                                                      ↓
                                              Phrase Extractor
                                                      ↓
                                              Kelly-scored phrases
```

### Stories
```
Kelly A1/A2 word list → Ollama (qwen3:32b) → Italian stories → data/stories/
```

### Palace Vocabulary
```
Kelly word list + Room themes → Ollama translation → vocab-it.ts
Room photos (generic interiors) → client/public/palace/rooms/
```

## Chrome Extension

Manifest V3 side panel extension for YouTube:
- Reads YouTube auto-captions
- Makes Italian words clickable → shows CEFR level, conjugation, pronunciation
- Side panel with Live / Vocab / Review tabs
- Saves words to Chrome storage with spaced repetition
- Uses `extension/kelly.json` (6,529 words) — fully offline

## Key Decisions

| Decision | Reasoning |
|---|---|
| SQLite over MySQL | Zero setup, portable, single-file database |
| Ollama over Claude API | Heavy batch work (translation, stories) at zero cost |
| wouter over react-router | Lightweight, ~1KB, sufficient for this project |
| Kelly word list | Academic frequency data, CEFR-graded, proven methodology |
| Web Speech API | Free Italian/French TTS, no API keys needed |
| Language-agnostic palace | Build once, serve Italian/French/Spanish/Mandarin |
| Sepia palace theme | Distinct visual identity, matches "old palace" aesthetic |
| shadcn/Radix components | Accessible, composable, tree-shakeable |

## File Sizes (key files)

| File | Lines | Purpose |
|---|---|---|
| `server/db.ts` | ~100 | Schema DDL |
| `client/src/pages/VideoPlayer.tsx` | ~300 | Main video player |
| `client/src/components/memory-palace/data/rooms.ts` | 475 | 8 palace rooms |
| `extension/kelly.json` | 6,529 entries | Word frequency data |
| `data/app.db` | ~10MB | All application data |
