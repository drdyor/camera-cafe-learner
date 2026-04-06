import React, { useRef, useState, useCallback, useEffect } from "react";
import ReactPlayer from "react-player";
import { Play, Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface Subtitle {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
}

interface DualSubtitlePlayerProps {
  videoUrl: string;
  italianSubtitles: Subtitle[];
  englishSubtitles: Subtitle[];
  duration: number;
  onProgress?: (currentTime: number) => void;
  onEnded?: () => void;
}

export default function DualSubtitlePlayer({
  videoUrl,
  italianSubtitles,
  englishSubtitles,
  duration,
  onProgress,
  onEnded,
}: DualSubtitlePlayerProps) {
  const playerRef = useRef<ReactPlayer>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [played, setPlayed] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [ready, setReady] = useState(false);

  const getCurrentSubtitle = (subs: Subtitle[], time: number): string | null => {
    const current = subs.find(sub => time >= sub.startTime && time <= sub.endTime);
    return current?.text || null;
  };

  const currentItalianSubtitle = getCurrentSubtitle(italianSubtitles, currentTime);
  const currentEnglishSubtitle = getCurrentSubtitle(englishSubtitles, currentTime);

  const handleProgress = useCallback(
    (state: { playedSeconds: number; played: number }) => {
      if (!seeking) {
        const timeMs = state.playedSeconds * 1000;
        setCurrentTime(timeMs);
        setPlayed(state.played);
        onProgress?.(timeMs);
      }
    },
    [seeking, onProgress]
  );

  // Auto-scroll subtitle panel to active line
  useEffect(() => {
    if (!scrollRef.current) return;
    const active = scrollRef.current.querySelector("[data-active='true']");
    if (active) {
      active.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentItalianSubtitle]);

  const handleSeek = (value: number[]) => {
    const fraction = value[0] / 100;
    setPlayed(fraction);
    setSeeking(true);
  };

  const handleSeekCommit = (value: number[]) => {
    const fraction = value[0] / 100;
    playerRef.current?.seekTo(fraction, "fraction");
    setSeeking(false);
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  const isYouTube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");

  return (
    <div className="w-full bg-black rounded-lg overflow-hidden shadow-lg">
      {/* Video */}
      <div className="relative bg-black aspect-video">
        {isYouTube ? (
          <ReactPlayer
            ref={playerRef}
            url={videoUrl}
            playing={isPlaying}
            volume={volume}
            muted={false}
            playbackRate={playbackRate}
            onProgress={handleProgress}
            progressInterval={200}
            onReady={() => setReady(true)}
            onEnded={() => { setIsPlaying(false); onEnded?.(); }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            width="100%"
            height="100%"
            controls
            config={{
              youtube: {
                playerVars: {
                  modestbranding: 1,
                  rel: 0,
                  cc_load_policy: 0,
                  iv_load_policy: 3,
                },
              },
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <p>No video available</p>
          </div>
        )}

        {/* Subtitle overlay on video */}
        {showSubtitles && (currentItalianSubtitle || currentEnglishSubtitle) && (
          <div className="absolute bottom-4 left-0 right-0 px-4 text-center pointer-events-none z-10">
            {currentItalianSubtitle && (
              <div className="mb-1">
                <span className="text-white text-lg font-semibold bg-black/70 px-3 py-1.5 rounded inline-block">
                  {currentItalianSubtitle}
                </span>
              </div>
            )}
            {currentEnglishSubtitle && (
              <div>
                <span className="text-gray-200 text-sm bg-black/70 px-3 py-1 rounded inline-block">
                  {currentEnglishSubtitle}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-10 text-right">{formatTime(currentTime)}</span>
          <Slider
            value={[played * 100]}
            onValueChange={handleSeek}
            onValueCommit={handleSeekCommit}
            max={100}
            step={0.1}
            className="flex-1"
          />
          <span className="text-xs text-gray-400 w-10">{formatTime(duration)}</span>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsPlaying(!isPlaying)} size="sm" variant="ghost" className="text-white hover:bg-gray-700">
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          <div className="flex items-center gap-1">
            <Volume2 className="w-4 h-4 text-gray-400" />
            <Slider value={[volume * 100]} onValueChange={v => setVolume(v[0] / 100)} max={100} step={5} className="w-16" />
          </div>
          <Button onClick={() => setShowSubtitles(!showSubtitles)} size="sm" variant={showSubtitles ? "default" : "ghost"} className={showSubtitles ? "bg-blue-600" : "text-gray-400"}>
            CC
          </Button>
          <div className="ml-auto flex gap-1">
            {[0.5, 0.75, 1, 1.25].map(rate => (
              <Button key={rate} onClick={() => setPlaybackRate(rate)} size="sm" variant={playbackRate === rate ? "default" : "ghost"}
                className={`text-xs ${playbackRate === rate ? "bg-blue-600" : "text-gray-400 hover:bg-gray-700"}`}>
                {rate}x
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrolling subtitle panel */}
      <div ref={scrollRef} className="bg-gray-800 border-t border-gray-700 max-h-52 overflow-y-auto">
        <div className="p-3 space-y-0.5">
          {italianSubtitles.map((sub, i) => {
            const isActive = currentTime >= sub.startTime && currentTime <= sub.endTime;
            const englishSub = englishSubtitles[i];
            return (
              <div
                key={sub.id}
                data-active={isActive}
                className={`px-3 py-2 rounded cursor-pointer transition ${
                  isActive ? "bg-blue-600/20 border-l-2 border-blue-500" : "hover:bg-gray-700/50 border-l-2 border-transparent"
                }`}
                onClick={() => playerRef.current?.seekTo(sub.startTime / 1000, "seconds")}
              >
                <p className={`text-sm ${isActive ? "text-white font-medium" : "text-gray-300"}`}>
                  {sub.text}
                </p>
                {englishSub && englishSub.text !== sub.text && (
                  <p className={`text-xs mt-0.5 ${isActive ? "text-blue-300" : "text-gray-500"}`}>
                    {englishSub.text}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
