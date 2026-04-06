# Camera Café Language Learner - Delivery Summary

## Project Overview

**Camera Café Language Learner** is a sophisticated Italian language learning application that combines video content with frequency-based vocabulary learning. It uses the **Kelly Italian Vocabulary List** (6,865 words ranked by frequency) to intelligently extract and highlight learnable phrases from Italian TV episodes.

---

## ✅ Completed Features

### Phase 1: Database & Backend Infrastructure
- **Database Schema**: 6 core tables (episodes, subtitles, kellyList, phrases, userVocabulary, episodeProgress)
- **Kelly List Integration**: All 6,865 Italian vocabulary entries imported with frequency rankings and CEFR levels (A1-B2)
- **Backend API**: Complete tRPC router for episodes, phrases, vocabulary, and progress tracking
- **Phrase Extraction**: Intelligent algorithm that tokenizes subtitles, scores phrases using Kelly List, and filters for learnability (1-8 words, CEFR ≤ B1)
- **Unit Tests**: 15 passing tests covering phrase extraction, time conversion, and vocabulary highlighting logic

### Phase 2: Video Player & Dual Subtitles
- **HTML5 Video Player**: Full-featured player with play/pause, seek, volume, and speed controls
- **Dual Subtitle Display**: Italian and English subtitles synchronized to video playback
- **Subtitle Visibility Toggle**: Show/hide Italian and English subtitles independently
- **Playback Speed Control**: 0.5x, 1x, 1.5x, 2x speed options
- **Keyboard Shortcuts**: Space/K for play-pause, arrow keys for seek, M for mute, C for subtitle toggle

### Phase 3: Vocabulary Highlighting & Interactivity
- **Kelly Frequency Color Coding**: 
  - Green (A1): Most common words
  - Blue (A2): Common words
  - Orange (B1): Intermediate words
  - Red (B2+): Advanced words
- **Interactive Word Lookup Modal**: Click words to see translations, CEFR level, frequency rank, and usage context
- **Vocabulary Save/Remove**: Real tRPC mutations with loading states and toast notifications
- **Visual Feedback**: Saved words show heart icon and status indicator

### Phase 4: Episode Library & Discovery
- **Episode List Component**: Browse episodes with metadata (title, season, episode number, difficulty)
- **Difficulty Filtering**: Filter episodes by CEFR level (A1, A2, B1, B2)
- **Search Functionality**: Search episodes by title
- **Episode Cards**: Display episode metadata, difficulty badge, and duration
- **Episode Navigation**: Click to watch episode with full video player

### Phase 5: Vocabulary Collection & Progress
- **Vocabulary Collection Page**: View all saved words with status (learning/reviewing/mastered)
- **Status Management**: Update word status with color-coded badges
- **Statistics Dashboard**: Show total vocabulary, words by level, and learning progress
- **Filtering**: Filter vocabulary by status and CEFR level

### Phase 6: Sample Episode & Real Data
- **Sample Episode**: "Coffee Talk" (Season 1, Episode 1, A1 difficulty)
- **Real Subtitles**: 10 Italian + 10 English subtitle pairs (30 seconds)
- **Extracted Phrases**: 10 learnable phrases with Kelly frequency rankings
- **Database Integration**: All data wired into video player with real subtitle display

---

## 🏗️ Technical Architecture

### Frontend Stack
- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4 with custom theming
- **UI Components**: shadcn/ui (Button, Dialog, Card, Badge, Select, etc.)
- **State Management**: React Query (tRPC hooks)
- **Video Player**: HTML5 `<video>` element with custom controls
- **Routing**: Wouter (lightweight router)

### Backend Stack
- **API Framework**: Express.js with tRPC 11
- **Database**: MySQL/TiDB with Drizzle ORM
- **Authentication**: Manus OAuth (pre-configured)
- **Testing**: Vitest with 15 passing tests

### Database Schema
```
episodes: id, title, season, episodeNumber, difficulty, duration, videoUrl, description
subtitles: id, episodeId, language, startTime, endTime, text, sequenceNumber
kellyList: id, word, frequencyRank, cefrLevel
phrases: id, episodeId, italianText, englishTranslation, cefrLevel, minFrequencyRank, startTime, endTime, wordCount, isLearnable
userVocabulary: id, userId, phraseId, status, timesEncountered, lastReviewedAt, nextReviewAt, createdAt, updatedAt
episodeProgress: id, userId, episodeId, watchedDuration, totalDuration, completedAt, createdAt, updatedAt
```

---

## 📊 Key Algorithms

### Phrase Extraction Algorithm
1. **Tokenization**: Split subtitles into words
2. **Phrase Building**: Create phrases of 1-8 words
3. **Kelly Scoring**: Find minimum frequency rank among words in phrase
4. **Filtering**: Keep only phrases with CEFR level ≤ B1
5. **Deduplication**: Remove duplicate phrases

### Spaced Repetition Schedule
- **Initial**: 1 day
- **After 1st review**: 3 days
- **After 2nd review**: 7 days
- **After 3rd review**: 14 days
- **After 4th review**: 30 days (mastered)

### CEFR Level Mapping
- **A1**: Frequency rank 1-1000 (Essential words)
- **A2**: Frequency rank 1001-2000 (Common words)
- **B1**: Frequency rank 2001-3500 (Useful words)
- **B2+**: Frequency rank 3501+ (Advanced words)

---

## 🎯 User Workflows

### Learning Flow
1. User logs in via Manus OAuth
2. Browses episode library, filters by difficulty
3. Selects episode to watch
4. Video player displays dual Italian/English subtitles
5. Clicks highlighted words to see translations and frequency info
6. Saves words to personal vocabulary collection
7. Reviews saved words with spaced repetition schedule

### Vocabulary Management
1. View vocabulary collection with status indicators
2. Update word status (learning → reviewing → mastered)
3. Filter by status or CEFR level
4. View learning statistics and progress

---

## 🚀 Deployment Ready

The application is production-ready with:
- ✅ TypeScript compilation (0 errors)
- ✅ All tests passing (15/15)
- ✅ Dev server running and responsive
- ✅ Database fully configured and seeded
- ✅ Authentication integrated
- ✅ Error handling and loading states
- ✅ Responsive design for desktop/tablet

---

## 📝 Remaining Enhancements (Optional)

While the core application is complete, these features could be added:

1. **Subtitle Upload**: Allow users to upload their own SRT files
2. **User Dashboard**: Personalized learning dashboard with progress charts
3. **Advanced Search**: Global search across episodes and vocabulary
4. **Spaced Repetition Review Queue**: Dedicated review interface
5. **Dark Mode**: Theme toggle for dark/light appearance
6. **Mobile Optimization**: Enhanced mobile UI
7. **Export Vocabulary**: Download vocabulary lists as CSV/PDF
8. **Community Features**: Share vocabulary lists, episode recommendations
9. **AI Pronunciation**: Text-to-speech for Italian words
10. **Subtitle Timing Adjustment**: Manual subtitle sync controls

---

## 🔧 Getting Started

### Development
```bash
cd /home/ubuntu/camera-cafe-learner
pnpm dev
```

### Testing
```bash
pnpm test
```

### Building
```bash
pnpm build
pnpm start
```

---

## 📚 Key Files

- **Frontend**: `client/src/pages/VideoPlayer.tsx`, `client/src/pages/EpisodeLibrary.tsx`, `client/src/pages/VocabularyCollection.tsx`
- **Backend**: `server/routers/episodes.ts`, `server/routers/phrases.ts`, `server/routers/vocabulary.ts`
- **Database**: `drizzle/schema.ts`
- **Components**: `client/src/components/DualSubtitlePlayer.tsx`, `client/src/components/WordLookupModal.tsx`
- **Tests**: `server/phrase-extractor.test.ts`, `server/vocabulary-highlighting.test.ts`

---

## 🎓 Learning Outcomes

This application demonstrates:
- Full-stack TypeScript development (React + Express)
- Database design for language learning
- Video player implementation with subtitle synchronization
- Frequency-based vocabulary selection (Kelly List)
- tRPC for type-safe API communication
- Spaced repetition algorithm implementation
- Authentication and user management
- Real-time data synchronization with React Query

---

**Version**: 8f57dd97  
**Last Updated**: April 5, 2026  
**Status**: ✅ Production Ready
