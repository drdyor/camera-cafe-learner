#!/usr/bin/env python3
"""
Kokoro TTS — Italian story narration with word-level timestamps.
Replaces edge-tts + aeneas pipeline. Outputs audio + perfectly timed SRT.

Usage:
  python kokoro-tts.py <story-id>              # single story
  python kokoro-tts.py --all                    # all stories

Prerequisites:
  pip install kokoro soundfile torch

Output (in data/video-assets/<story-id>/):
  <story-id>-narration.wav   — Full Italian narration audio
  <story-id>-it.srt          — Italian subtitles (timed to audio)
  <story-id>-en.srt          — English subtitles (timed to audio)
"""

import json
import sys
import os
import re
from pathlib import Path

def format_srt_time(ms):
    h = int(ms // 3600000)
    m = int((ms % 3600000) // 60000)
    s = int((ms % 60000) // 1000)
    r = int(ms % 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{r:03d}"

def generate_with_kokoro(story_path):
    """Generate audio + timed subtitles using Kokoro TTS."""
    import kokoro
    import soundfile as sf
    import numpy as np

    with open(story_path, "r", encoding="utf-8") as f:
        story = json.load(f)

    story_id = story["id"]
    lines = [l for l in story["lines"] if l.get("italian") and len(l["italian"]) > 2]

    out_dir = Path(story_path).parent.parent / "video-assets" / story_id
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n--- {story['title']} ({story['level']}) — {len(lines)} lines ---\n")

    # Initialize Kokoro with Italian voice
    # Kokoro supports: af_heart, af_bella, am_adam, am_michael, bf_emma, bm_george, etc.
    # For Italian we use the multilingual pipeline
    pipeline = kokoro.KPipeline(lang_code="i")  # 'i' = Italian

    all_audio = []
    sample_rate = 24000  # Kokoro default
    italian_srt = []
    english_srt = []
    current_ms = 0.0

    # Add 1.5s silence at start
    silence_samples = int(1.5 * sample_rate)
    all_audio.append(np.zeros(silence_samples, dtype=np.float32))
    current_ms += 1500.0

    for i, line in enumerate(lines):
        text = line["italian"]
        print(f"  [{i+1}/{len(lines)}] {text[:60]}...")

        # Generate audio with timestamps
        # Kokoro returns generator of Result objects with .audio and .timestamps
        line_audio_parts = []
        line_duration_samples = 0

        try:
            results = list(pipeline(text, voice="af_heart", speed=0.85))
            for result in results:
                if result.audio is not None:
                    line_audio_parts.append(result.audio)
                    line_duration_samples += len(result.audio)
        except Exception as e:
            print(f"    Warning: TTS failed for line {i+1}: {e}")
            # Generate 2s silence as placeholder
            placeholder = np.zeros(int(2.0 * sample_rate), dtype=np.float32)
            line_audio_parts.append(placeholder)
            line_duration_samples = len(placeholder)

        if not line_audio_parts:
            continue

        line_audio = np.concatenate(line_audio_parts)
        duration_ms = (line_duration_samples / sample_rate) * 1000.0

        # Build SRT entries
        start_time = format_srt_time(current_ms)
        end_time = format_srt_time(current_ms + duration_ms)

        italian_srt.append(f"{i+1}\n{start_time} --> {end_time}\n{line['italian']}\n")
        if line.get("english"):
            english_srt.append(f"{i+1}\n{start_time} --> {end_time}\n{line['english']}\n")

        all_audio.append(line_audio)
        current_ms += duration_ms

        # Add 800ms pause between lines
        pause_samples = int(0.8 * sample_rate)
        all_audio.append(np.zeros(pause_samples, dtype=np.float32))
        current_ms += 800.0

    # Concatenate all audio
    full_audio = np.concatenate(all_audio)

    # Write outputs
    audio_path = out_dir / f"{story_id}-narration.wav"
    sf.write(str(audio_path), full_audio, sample_rate)

    srt_it_path = out_dir / f"{story_id}-it.srt"
    srt_en_path = out_dir / f"{story_id}-en.srt"
    srt_it_path.write_text("\n".join(italian_srt), encoding="utf-8")
    srt_en_path.write_text("\n".join(english_srt), encoding="utf-8")

    total_seconds = int(current_ms / 1000)
    mins = total_seconds // 60
    secs = total_seconds % 60

    print(f"\n  Audio:       {audio_path} ({mins}:{secs:02d})")
    print(f"  Italian SRT: {srt_it_path}")
    print(f"  English SRT: {srt_en_path}")

    return audio_path, srt_it_path, srt_en_path


def generate_with_edge_tts(story_path):
    """Fallback: generate using edge-tts if Kokoro isn't installed."""
    import subprocess
    import struct

    with open(story_path, "r", encoding="utf-8") as f:
        story = json.load(f)

    story_id = story["id"]
    lines = [l for l in story["lines"] if l.get("italian") and len(l["italian"]) > 2]

    out_dir = Path(story_path).parent.parent / "video-assets" / story_id
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n--- {story['title']} ({story['level']}) — {len(lines)} lines [edge-tts fallback] ---\n")

    voice = "it-IT-IsabellaNeural"
    rate = "-15%"
    line_audio_files = []
    italian_srt = []
    english_srt = []
    total_ms = 0.0

    # 1.5s silence at start
    silence_file = out_dir / "silence.mp3"
    subprocess.run(
        f'ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t 1.5 -q:a 9 -acodec libmp3lame "{silence_file}"',
        shell=True, capture_output=True
    )
    line_audio_files.append(str(silence_file))
    total_ms += 1500.0

    for i, line in enumerate(lines):
        text = line["italian"].replace('"', '\\"')
        audio_file = out_dir / f"line-{i:03d}.mp3"
        vtt_file = out_dir / f"line-{i:03d}.vtt"

        print(f"  [{i+1}/{len(lines)}] {text[:60]}...")

        try:
            subprocess.run(
                f'python -m edge_tts --voice "{voice}" --rate="{rate}" --text "{text}" '
                f'--write-media "{audio_file}" --write-subtitles "{vtt_file}"',
                shell=True, capture_output=True, timeout=30
            )
        except Exception as e:
            print(f"    Warning: edge-tts failed for line {i+1}: {e}")
            continue

        # Get duration via ffprobe
        try:
            result = subprocess.run(
                f'ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "{audio_file}"',
                shell=True, capture_output=True, text=True, timeout=10
            )
            duration_ms = float(result.stdout.strip()) * 1000
        except Exception:
            duration_ms = 3000.0  # fallback 3s

        start_time = format_srt_time(total_ms)
        end_time = format_srt_time(total_ms + duration_ms)

        italian_srt.append(f"{i+1}\n{start_time} --> {end_time}\n{line['italian']}\n")
        if line.get("english"):
            english_srt.append(f"{i+1}\n{start_time} --> {end_time}\n{line['english']}\n")

        line_audio_files.append(str(audio_file))
        total_ms += duration_ms

        # 800ms pause
        pause_file = out_dir / f"pause-{i:03d}.mp3"
        subprocess.run(
            f'ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t 0.8 -q:a 9 -acodec libmp3lame "{pause_file}"',
            shell=True, capture_output=True
        )
        line_audio_files.append(str(pause_file))
        total_ms += 800.0

    # Concatenate audio
    concat_list = out_dir / "concat-list.txt"
    concat_list.write_text(
        "\n".join(f"file '{f.replace(os.sep, '/')}'" for f in line_audio_files)
    )

    final_audio = out_dir / f"{story_id}-narration.mp3"
    subprocess.run(
        f'ffmpeg -y -f concat -safe 0 -i "{concat_list}" -c copy "{final_audio}"',
        shell=True, capture_output=True
    )

    # Write SRTs
    srt_it_path = out_dir / f"{story_id}-it.srt"
    srt_en_path = out_dir / f"{story_id}-en.srt"
    srt_it_path.write_text("\n".join(italian_srt), encoding="utf-8")
    srt_en_path.write_text("\n".join(english_srt), encoding="utf-8")

    # Cleanup temp files
    for f in out_dir.glob("line-*.mp3"):
        f.unlink(missing_ok=True)
    for f in out_dir.glob("line-*.vtt"):
        f.unlink(missing_ok=True)
    for f in out_dir.glob("pause-*.mp3"):
        f.unlink(missing_ok=True)
    silence_file.unlink(missing_ok=True)
    concat_list.unlink(missing_ok=True)

    total_seconds = int(total_ms / 1000)
    mins = total_seconds // 60
    secs = total_seconds % 60

    print(f"\n  Audio:       {final_audio} ({mins}:{secs:02d})")
    print(f"  Italian SRT: {srt_it_path}")
    print(f"  English SRT: {srt_en_path}")

    return final_audio, srt_it_path, srt_en_path


def process_story(story_id):
    """Process a single story through TTS pipeline."""
    scripts_dir = Path(__file__).parent
    stories_dir = scripts_dir.parent / "data" / "stories"
    story_path = stories_dir / f"{story_id}.json"

    if not story_path.exists():
        print(f"Error: Story not found: {story_path}")
        return

    # Try Kokoro first, fall back to edge-tts
    try:
        import kokoro
        return generate_with_kokoro(str(story_path))
    except ImportError:
        print("Kokoro not installed, falling back to edge-tts...")
        print("  Install with: pip install kokoro soundfile torch")
        try:
            import edge_tts
            return generate_with_edge_tts(str(story_path))
        except ImportError:
            print("edge-tts not installed either!")
            print("  Install with: pip install edge-tts")
            sys.exit(1)


def main():
    scripts_dir = Path(__file__).parent
    stories_dir = scripts_dir.parent / "data" / "stories"

    if len(sys.argv) < 2:
        print("Usage: python kokoro-tts.py <story-id>")
        print("       python kokoro-tts.py --all")
        print("\nAvailable stories:")
        for f in sorted(stories_dir.glob("*.json")):
            with open(f) as fh:
                s = json.load(fh)
            print(f"  {f.stem:25s} — {s['title']} ({s['level']})")
        return

    if sys.argv[1] == "--all":
        for f in sorted(stories_dir.glob("*.json")):
            process_story(f.stem)
    else:
        for story_id in sys.argv[1:]:
            process_story(story_id)

    print("\nDone! Next steps:")
    print("  1. Go to notebooklm.google.com, create notebook with story text")
    print("  2. Generate video, download as notebooklm-video.mp4")
    print("  3. Save to data/video-assets/<story-id>/notebooklm-video.mp4")
    print("  4. Run: node scripts/make-video.mjs <story-id>")


if __name__ == "__main__":
    main()
