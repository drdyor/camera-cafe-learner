# Camera Café Language Learner - Project TODO

## Phase 1: Database & Backend Setup
- [x] Create database schema (episodes, subtitles, kellyList, phrases, userVocabulary, episodeProgress)
- [x] Import Kelly Italian vocabulary list into database
- [x] Create tRPC procedures for episode management
- [x] Create tRPC procedures for vocabulary management
- [x] Create tRPC procedures for progress tracking
- [x] Implement subtitle parsing and phrase extraction logic
- [x] Write unit tests for phrase extraction algorithm
- [x] Write unit tests for Kelly List matching

## Phase 2: Video Player & Subtitle Display
- [x] Build HTML5 video player component
- [x] Implement dual subtitle display (Italian + English)
- [x] Synchronize subtitles with video playback
- [ ] Add subtitle timing adjustment controls
- [x] Implement subtitle visibility toggle
- [x] Add playback speed controls
- [x] Add keyboard shortcuts (play/pause, skip, subtitle toggle)

## Phase 3: Vocabulary Highlighting & Interactivity
- [x] Implement Kelly frequency-based color coding system
- [x] Build word highlighting logic for subtitles
- [x] Create clickable word lookup modal/popover
- [x] Display word translations and CEFR level
- [x] Show frequency rank and example usage
- [x] Implement "Save to Vocabulary" button in lookup
- [x] Add visual feedback for saved words

## Phase 4: Episode Library & Discovery
- [x] Build episode list component with metadata display
- [x] Implement difficulty level filtering (A1/A2/B1/B2)
- [x] Implement search by episode title
- [ ] Add pagination for episode list
- [x] Display episode cards with thumbnail/metadata
- [ ] Show vocabulary stats per episode (words to learn, difficulty)
- [x] Link episodes to video player

## Phase 5: Vocabulary Collection & Progress
- [x] Build vocabulary collection page
- [x] Display saved words with status (learning/reviewing/mastered)
- [x] Implement status update functionality
- [ ] Show spaced repetition schedule
- [ ] Display review queue
- [x] Add filtering by status and CEFR level
- [x] Show vocabulary statistics (total learned, by level)

## Phase 6: Sample Episode & Real Data
- [x] Create sample Camera Café episode with real subtitles
- [x] Seed Italian and English subtitle data
- [x] Seed phrases with Kelly frequency rankings
- [x] Wire real subtitles into video player
- [x] Test dual subtitle display with real data

## Phase 7: Subtitle Upload & Processing
- [ ] Build subtitle upload form
- [ ] Implement SRT file validation
- [ ] Create subtitle parsing logic
- [ ] Implement phrase extraction from uploaded subtitles
- [ ] Store processed subtitles in database
- [ ] Display processing status/progress
- [ ] Handle upload errors gracefully

## Phase 7: User Dashboard & Progress Tracking
- [ ] Build user dashboard/home page
- [ ] Display watched episodes list
- [ ] Show learning progress (words learned, episodes watched)
- [ ] Display CEFR level progression
- [ ] Show recent vocabulary additions
- [ ] Implement episode progress bar (% watched)
- [ ] Add statistics visualization

## Phase 8: Search & Filtering
- [ ] Implement global search across episodes and vocabulary
- [ ] Add advanced filters (difficulty, vocabulary themes)
- [ ] Implement sorting options (by difficulty, by new, by popular)
- [ ] Add filter persistence (remember user preferences)
- [ ] Build filter UI component

## Phase 9: Spaced Repetition & Review
- [ ] Implement spaced repetition algorithm
- [ ] Build review queue page
- [ ] Create review interaction (mark as correct/incorrect)
- [ ] Update nextReviewAt based on performance
- [ ] Display review statistics
- [ ] Add review streak tracking

## Phase 10: UI Polish & Refinement
- [ ] Design and implement consistent color scheme
- [ ] Add loading states and skeletons
- [ ] Implement error boundaries and error messages
- [ ] Add empty states for all pages
- [ ] Optimize responsive design for mobile
- [ ] Add accessibility features (keyboard navigation, ARIA labels)
- [ ] Implement dark/light theme toggle

## Phase 11: Testing & Quality Assurance
- [ ] Write integration tests for tRPC procedures
- [ ] Write component tests for UI elements
- [ ] Test subtitle synchronization accuracy
- [ ] Test Kelly List matching accuracy
- [ ] Test phrase extraction with real Camera Café data
- [ ] Performance testing (large subtitle files, many phrases)
- [ ] Cross-browser testing

## Phase 12: Documentation & Deployment
- [ ] Write user documentation
- [ ] Create API documentation
- [ ] Document database schema
- [ ] Create deployment guide
- [ ] Set up CI/CD pipeline
- [ ] Prepare for production deployment
