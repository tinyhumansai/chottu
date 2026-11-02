import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration, type VoiceNote } from "./types";

/** Only one voice note plays at a time. */
let playing: HTMLAudioElement | null = null;

export function VoiceNotePlayer({ note }: { note: VoiceNote }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => () => audio.current?.pause(), []);

  const ensureAudio = () => {
    if (audio.current) return audio.current;
    const el = new Audio(note.src);
    el.addEventListener("timeupdate", () => setProgress(el.currentTime / (note.durationMs / 1000)));
    el.addEventListener("play", () => setIsPlaying(true));
    el.addEventListener("pause", () => setIsPlaying(false));
    el.addEventListener("ended", () => {
      setIsPlaying(false);
      setProgress(0);
    });
    audio.current = el;
    return el;
  };

  const toggle = () => {
    const el = ensureAudio();
    if (!el.paused) return el.pause();
    if (playing && playing !== el) playing.pause();
    playing = el;
    void el.play();
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const el = ensureAudio();
    el.currentTime = ratio * (note.durationMs / 1000);
    setProgress(ratio);
  };

  const elapsed = progress * note.durationMs;

  return (
    <div className="flex w-60 max-w-full items-center gap-2.5 py-0.5" data-slot="voice-note">
      <button
        type="button"
        onClick={toggle}
        aria-label={isPlaying ? "Pause voice note" : "Play voice note"}
        className="bg-foreground/10 hover:bg-foreground/15 flex size-9 shrink-0 items-center justify-center rounded-full transition-colors"
      >
        {isPlaying ? <Pause className="size-4 fill-current" /> : <Play className="ml-0.5 size-4 fill-current" />}
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(note.durationMs / 1000)}
          aria-valuenow={Math.round(elapsed / 1000)}
          tabIndex={-1}
          onClick={seek}
          className="flex h-7 cursor-pointer items-center gap-[2px]"
        >
          {note.waveform.map((v, i) => (
            <span
              key={i}
              className={cn(
                "w-[3px] flex-1 rounded-full transition-colors",
                i / note.waveform.length < progress ? "bg-current" : "bg-current opacity-30",
              )}
              style={{ height: `${Math.round(v * 100)}%` }}
            />
          ))}
        </div>
        <span className="text-xs tabular-nums opacity-60">
          {formatDuration(isPlaying || progress > 0 ? elapsed : note.durationMs)}
        </span>
      </div>
    </div>
  );
}
