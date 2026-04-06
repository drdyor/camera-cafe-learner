# Batch produce all stories: TTS audio + video assets + metadata
# Usage: .\scripts\batch-produce.ps1
#
# Pipeline per story:
#   1. kokoro-tts.py  -> audio + timed SRT files
#   2. story-to-video-assets.mjs -> Veo scene prompts + YouTube metadata + vocab list

$ErrorActionPreference = "Stop"
Set-Location "$PSScriptRoot\.."

$stories = @(
    "tre-porcellini"
    "riccioli-doro"
    "romeo-giulietta"
    "dante-inferno"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Camera Cafe Learner - Batch Produce"
Write-Host "  $(Get-Date)"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Stories: $($stories -join ', ')"
Write-Host ""

# Step 1: Generate TTS audio + timed subtitles
Write-Host "--- STEP 1: TTS Audio Generation ---" -ForegroundColor Yellow
Write-Host ""

foreach ($story in $stories) {
    $wavPath = "data\video-assets\$story\$story-narration.wav"
    $mp3Path = "data\video-assets\$story\$story-narration.mp3"

    if ((Test-Path $wavPath) -or (Test-Path $mp3Path)) {
        Write-Host "  [$story] Audio already exists, skipping. Delete to regenerate." -ForegroundColor DarkGray
    } else {
        Write-Host "  [$story] Generating audio..." -ForegroundColor Green
        python scripts\kokoro-tts.py $story
    }
    Write-Host ""
}

# Step 2: Generate video assets (scenes, metadata, vocab)
Write-Host "--- STEP 2: Video Assets ---" -ForegroundColor Yellow
Write-Host ""

node scripts\story-to-video-assets.mjs @stories

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DONE! All assets generated."
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps for each story:"
Write-Host "  1. Open notebooklm.google.com"
Write-Host "  2. Create notebook, paste story from data\stories\<id>.json"
Write-Host "  3. Generate video -> download as notebooklm-video.mp4"
Write-Host "  4. Save to data\video-assets\<id>\notebooklm-video.mp4"
Write-Host "  5. Run: node scripts\make-video.mjs <id>"
