# Camera Café Language Learner - System Design

## Overview

The Camera Café Language Learner is a web application designed to help Italian language learners build vocabulary through context by watching authentic Italian television content with synchronized dual subtitles (Italian and English) and frequency-based vocabulary scoring.

## Architecture

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | React 19 + Tailwind 4 | User interface and interactions |
| Backend | Express 4 + tRPC 11 | API and business logic |
| Database | MySQL/TiDB | Data persistence |
| ORM | Drizzle | Type-safe database queries |
| Video Player | HTML5 Video API | Core playback functionality |
| Subtitle Processing | Custom parser | SRT parsing and synchronization |
| Vocabulary Data | Kelly List (Italian) | Frequency-based word ranking |

### Core Data Model

#### 1. Episodes Table
Stores metadata for Italian TV episodes with difficulty classification.

```sql
episodes
├── id (primary key)
├── title (episode title)
├── season (season number)
├── episodeNumber (episode number)
├── description (plot summary)
├── duration (in seconds)
├── difficulty (A1/A2/B1/B2 - CEFR level)
├── videoUrl (CDN URL to video file)
├── italianSubtitleUrl (CDN URL to Italian SRT)
├── englishSubtitleUrl (CDN URL to English SRT)
├── createdAt (timestamp)
└── updatedAt (timestamp)
```

#### 2. Subtitles Table
Stores parsed subtitle data with timing information.

```sql
subtitles
├── id (primary key)
├── episodeId (foreign key → episodes)
├── language (it/en)
├── sequenceNumber (subtitle order)
├── startTime (milliseconds)
├── endTime (milliseconds)
├── text (subtitle text)
└── createdAt (timestamp)
```

#### 3. Kelly List Table
Stores Italian vocabulary frequency data from the Kelly Project.

```sql
kellyList
├── id (primary key)
├── lemma (base word form)
├── pos (part of speech: v/n/adj/prep/etc)
├── cefrLevel (A1/A2/B1/B2/C1/C2)
├── frequencyRank (1-6865)
├── ipm (instances per million)
└── createdAt (timestamp)
```

#### 4. Phrases Table
Extracted phrases from subtitles with Kelly scoring.

```sql
phrases
├── id (primary key)
├── episodeId (foreign key → episodes)
├── italianText (phrase in Italian)
├── englishTranslation (English translation)
├── subtitleId (foreign key → subtitles)
├── startTime (milliseconds)
├── endTime (milliseconds)
├── wordCount (number of words)
├── minFrequencyRank (lowest rank among words = most common)
├── cefrLevel (A1/A2/B1/B2 - determined by most common word)
├── isLearnable (true if <= 8 words and CEFR <= B1)
└── createdAt (timestamp)
```

#### 5. User Vocabulary Collection Table
Tracks words/phrases saved by users for learning.

```sql
userVocabulary
├── id (primary key)
├── userId (foreign key → users)
├── phraseId (foreign key → phrases)
├── status (learning/mastered/reviewing)
├── timesEncountered (count)
├── lastReviewedAt (timestamp for spaced repetition)
├── nextReviewAt (calculated based on algorithm)
├── createdAt (timestamp)
└── updatedAt (timestamp)
```

#### 6. Episode Progress Table
Tracks user progress through episodes.

```sql
episodeProgress
├── id (primary key)
├── userId (foreign key → users)
├── episodeId (foreign key → episodes)
├── watchedDuration (seconds watched)
├── totalDuration (episode length)
├── percentageWatched (0-100)
├── lastWatchedAt (timestamp)
├── completedAt (timestamp if fully watched)
└── createdAt (timestamp)
```

## Processing Pipeline

### Subtitle Processing Flow

```
User uploads SRT file
    ↓
Parse SRT format (timestamps + text)
    ↓
Normalize text (lowercase, remove punctuation for matching)
    ↓
Tokenize into words
    ↓
Match against Kelly List
    ↓
Extract phrases (1-8 words, learnable content)
    ↓
Calculate CEFR level (minimum rank among words)
    ↓
Store in database
    ↓
Ready for UI display
```

### Phrase Extraction Algorithm

1. **Input**: Parsed subtitle text
2. **Tokenization**: Split into words, preserve original case
3. **Filtering**: Remove common stop words (optional, context-dependent)
4. **Kelly Matching**: For each word, look up frequency rank
5. **Phrase Scoring**:
   - Word count: 1-8 words (learnable threshold)
   - Minimum frequency rank: Use the most common word's rank
   - CEFR level: Determined by most common word
6. **Learnability Check**: Include if word count ≤ 8 AND CEFR ≤ B1
7. **Output**: Structured phrase object with all metadata

### Kelly List Integration

The Kelly Italian frequency list contains 6,865 lemmas with:
- **Lemma**: Base word form (e.g., "essere" for "è", "sono")
- **POS**: Part of speech (verb, noun, adjective, preposition, etc.)
- **CEFR Level**: A1 (absolute beginner) through C2 (advanced)
- **Frequency Rank**: 1 (most common) to 6,865 (least common in dataset)
- **IPM**: Instances per million words in corpus

**Strategy**: Words with rank < 3000 are prioritized as "learnable" for A1-B1 learners.

## Frontend Architecture

### Page Structure

```
App (Router)
├── Home (Landing/Dashboard)
├── EpisodeLibrary (Browse episodes)
│   ├── EpisodeCard (Episode metadata)
│   └── FilterPanel (Difficulty, search)
├── VideoPlayer (Main learning interface)
│   ├── DualSubtitleDisplay (Italian + English)
│   ├── VocabularyHighlighter (Kelly-scored words)
│   ├── WordLookup (Translations + frequency)
│   └── PlayerControls (Play, pause, speed, subtitles)
├── VocabularyCollection (User's saved words)
│   ├── VocabularyList (Saved phrases)
│   └── ReviewScheduler (Spaced repetition)
└── UserProfile (Progress tracking)
    ├── WatchedEpisodes (History)
    └── LearningStats (Words learned, CEFR progress)
```

### Interactive Features

#### 1. Dual Subtitle Display
- Two subtitle tracks displayed simultaneously
- Italian on top, English below (or configurable)
- Synchronized with video playback
- Color-coded by frequency level (visual hierarchy)

#### 2. Vocabulary Highlighting
- Words highlighted based on Kelly frequency rank
- Color scheme:
  - **Green**: A1 (most common, essential)
  - **Blue**: A2 (common, important)
  - **Orange**: B1 (intermediate, useful)
  - **Red**: B2+ (advanced, challenging)

#### 3. Word Lookup
- Click any highlighted word to see:
  - English translation
  - CEFR level
  - Frequency rank
  - Example usage in context
  - Option to save to vocabulary collection

#### 4. Progress Tracking
- Episode completion percentage
- Words learned from each episode
- Vocabulary mastery level (learning → reviewing → mastered)
- Spaced repetition schedule

## API Design (tRPC Procedures)

### Public Procedures

```typescript
// Episode browsing
episodes.list({ difficulty?, search? })
episodes.getById({ id })

// Subtitle retrieval
subtitles.getByEpisode({ episodeId, language })

// Kelly List lookup
kellyList.lookup({ word })
kellyList.getByFrequencyRange({ minRank, maxRank })
```

### Protected Procedures (Authenticated Users)

```typescript
// Vocabulary management
vocabulary.save({ phraseId })
vocabulary.remove({ vocabularyId })
vocabulary.list({ status?, episodeId? })
vocabulary.updateStatus({ vocabularyId, status })

// Progress tracking
progress.updateEpisodeProgress({ episodeId, watchedDuration })
progress.getEpisodeProgress({ episodeId })
progress.getUserStats()

// Phrase extraction
phrases.extractFromSubtitles({ episodeId })
phrases.getByEpisode({ episodeId, cefrLevel? })

// Subtitle upload
subtitles.uploadAndProcess({ episodeId, language, srtFile })
```

## Spaced Repetition Algorithm

Users reviewing vocabulary follow a simple spaced repetition schedule:

| Review Count | Next Review |
|--------------|-------------|
| 1st encounter | 1 day |
| 2nd review | 3 days |
| 3rd review | 7 days |
| 4th review | 14 days |
| 5th+ review | 30 days |

When `nextReviewAt` <= current time, the word appears in the review queue.

## Security & Constraints

1. **Authentication**: All user-specific operations require Manus OAuth
2. **Authorization**: Users can only access their own vocabulary and progress
3. **Rate Limiting**: Subtitle upload limited to 10MB per file
4. **Data Validation**: SRT files validated for format compliance
5. **SQL Injection Prevention**: All queries use Drizzle ORM parameterized queries

## Performance Considerations

1. **Subtitle Caching**: Parsed subtitles cached in database to avoid re-parsing
2. **Kelly List Indexing**: Lemma indexed for fast word lookup
3. **Lazy Loading**: Episode list paginated (20 per page)
4. **Video Streaming**: Videos served from CDN with adaptive bitrate
5. **Client-side Highlighting**: Highlighting computed in browser for responsiveness

## Deployment & Storage

1. **Videos & Subtitles**: Stored in S3, served via CDN
2. **Database**: MySQL/TiDB with automatic backups
3. **Frontend**: Deployed on Manus platform
4. **Backend**: Express server running on Manus platform

## Future Enhancements

1. **AI Translation**: Automatic English translation via LLM for user-uploaded subtitles
2. **Pronunciation Guide**: Audio pronunciation for highlighted words
3. **Contextual Quizzes**: Auto-generated quizzes from episode content
4. **Peer Learning**: Community vocabulary sharing and discussion
5. **Mobile App**: Native mobile application for on-the-go learning
6. **Offline Mode**: Download episodes for offline viewing
7. **Integration with Anki**: Export vocabulary to Anki for broader review
