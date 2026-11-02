import { Mic, Send, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chat";
import { canRecord, useVoiceRecorder } from "./recorder";
import { formatDuration, voiceNotePart } from "./types";

/**
 * Mic button for the composer. Tap to record; the recording bar covers the
 * composer with discard / send. Disabled where the mic is not available.
 */
export function VoiceNoteButton() {
  const { state, elapsedMs, level, start, cancel, finish } = useVoiceRecorder();
  const send = useChatStore((s) => s.send);
  const available = canRecord();

  const sendNote = async () => {
    const note = await finish();
    if (note) void send([voiceNotePart(note)]);
  };

  return (
    <>
      <button
        type="button"
        onClick={start}
        disabled={!available || state !== "idle"}
        aria-label="Record voice note"
        title={available ? "Record voice note" : "Voice notes need a secure connection (https or the app)"}
        className="text-muted-foreground hover:text-foreground hover:bg-muted flex size-8 items-center justify-center rounded-full transition-colors disabled:opacity-40"
      >
        <Mic className="size-[18px]" />
      </button>

      {state !== "idle" && (
        // Covers the whole composer (its root is the nearest positioned ancestor).
        <div
          role="status"
          className="bg-background absolute inset-0 z-10 flex items-center gap-2 rounded-[1.375rem] border p-1.5 pl-2"
        >
          <button
            type="button"
            onClick={cancel}
            aria-label="Discard voice note"
            className="text-muted-foreground hover:text-destructive flex size-8 items-center justify-center rounded-full transition-colors"
          >
            <Trash2 className="size-[18px]" />
          </button>
          <span
            className={cn("size-2.5 rounded-full bg-red-500", state === "recording" && "animate-pulse")}
            style={{ transform: `scale(${1 + Math.min(level * 6, 0.8)})` }}
            aria-hidden="true"
          />
          <span className="flex-1 text-sm tabular-nums">
            {state === "error"
              ? "Microphone blocked"
              : state === "starting"
                ? "Starting…"
                : `Recording ${formatDuration(elapsedMs)}`}
          </span>
          <button
            type="button"
            onClick={sendNote}
            disabled={state !== "recording"}
            aria-label="Send voice note"
            className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-full disabled:opacity-40"
          >
            <Send className="size-4" />
          </button>
        </div>
      )}
    </>
  );
}
