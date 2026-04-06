#!/bin/bash
# Batch produce all stories: TTS audio + video assets + metadata
# Usage: bash scripts/batch-produce.sh [--kokoro|--edge-tts]
#
# Pipeline per story:
#   1. kokoro-tts.py  → audio.wav + timed SRT files
#   2. story-to-video-assets.mjs → Veo scene prompts + YouTube metadata + vocab list
#
# After running, manually:
#   3. Upload story text to NotebookLM → generate video → save as notebooklm-video.mp4
#   4. node scripts/make-video.mjs <story-id> → final combined video

set -e
cd "$(dirname "$0")/.."

STORIES=(
  "tre-porcellini"
  "riccioli-doro"
  "romeo-giulietta"
  "dante-inferno"
)

echo "========================================"
echo "  Camera Cafe Learner — Batch Produce"
echo "  $(date)"
echo "========================================"
echo ""
echo "Stories: ${STORIES[*]}"
echo ""

# Step 1: Generate TTS audio + timed subtitles
echo "--- STEP 1: TTS Audio Generation ---"
echo ""

for story in "${STORIES[@]}"; do
  if [ -f "data/video-assets/$story/$story-narration.wav" ] || [ -f "data/video-assets/$story/$story-narration.mp3" ]; then
    echo "  [$story] Audio already exists, skipping. Delete to regenerate."
  else
    echo "  [$story] Generating audio..."
    python scripts/kokoro-tts.py "$story"
  fi
  echo ""
done

# Step 2: Generate video assets (scenes, metadata, vocab)
echo "--- STEP 2: Video Assets ---"
echo ""

node scripts/story-to-video-assets.mjs "${STORIES[@]}"

echo ""
echo "========================================"
echo "  DONE! All assets generated."
echo "========================================"
echo ""
echo "Output directories:"
for story in "${STORIES[@]}"; do
  echo "  data/video-assets/$story/"
done
echo ""
echo "Next steps for each story:"
echo "  1. Open notebooklm.google.com"
echo "  2. Create notebook, paste story from data/stories/<id>.json"
echo "  3. Generate video -> download as notebooklm-video.mp4"
echo "  4. Save to data/video-assets/<id>/notebooklm-video.mp4"
echo "  5. Run: node scripts/make-video.mjs <id>"
echo ""
echo "Estimated time to first YouTube upload: ~2 hours"
