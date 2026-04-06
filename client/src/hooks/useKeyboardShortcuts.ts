import { useEffect } from "react";

interface KeyboardShortcutsConfig {
  onPlayPause?: () => void;
  onSkipForward?: () => void;
  onSkipBackward?: () => void;
  onToggleSubtitles?: () => void;
  onIncreaseVolume?: () => void;
  onDecreaseVolume?: () => void;
  onMute?: () => void;
}

/**
 * Hook for handling keyboard shortcuts in video player
 * Supports: space/k for play-pause, arrow keys for seek, m for mute, etc.
 */
export function useKeyboardShortcuts(config: KeyboardShortcutsConfig) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.code) {
        // Play/Pause: Space or K
        case "Space":
        case "KeyK":
          event.preventDefault();
          config.onPlayPause?.();
          break;

        // Skip forward: Right Arrow or J
        case "ArrowRight":
        case "KeyJ":
          event.preventDefault();
          config.onSkipForward?.();
          break;

        // Skip backward: Left Arrow or L
        case "ArrowLeft":
        case "KeyL":
          event.preventDefault();
          config.onSkipBackward?.();
          break;

        // Toggle subtitles: C
        case "KeyC":
          event.preventDefault();
          config.onToggleSubtitles?.();
          break;

        // Increase volume: Up Arrow
        case "ArrowUp":
          event.preventDefault();
          config.onIncreaseVolume?.();
          break;

        // Decrease volume: Down Arrow
        case "ArrowDown":
          event.preventDefault();
          config.onDecreaseVolume?.();
          break;

        // Mute: M
        case "KeyM":
          event.preventDefault();
          config.onMute?.();
          break;

        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [config]);
}
