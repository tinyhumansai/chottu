import { useEffect, useState } from "react";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { ChottuAvatar } from "@/components/chottu-avatar";
import { cn } from "@/lib/utils";
import { useCallStore } from "@/store/call";

const format = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

function useElapsed(since: number | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (since === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [since]);
  return since === null ? 0 : Math.max(0, now - since);
}

/** Full-screen call with Chottu. Shown whenever a call is not idle. */
export function CallScreen() {
  const { status, connectedAt, muted, end, toggleMute } = useCallStore();
  const elapsed = useElapsed(connectedAt);

  useEffect(() => {
    if (status === "idle") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && end();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, end]);

  if (status === "idle") return null;

  const label = status === "connecting" ? "Calling…" : status === "ended" ? "Call ended" : format(elapsed);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Call with Chottu"
      className="chat-wallpaper animate-in fade-in fixed inset-0 z-50 flex flex-col items-center justify-between px-6 pt-[calc(5rem+env(safe-area-inset-top))] pb-[calc(3rem+env(safe-area-inset-bottom))]"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {status === "connecting" && (
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/40" aria-hidden="true" />
          )}
          <ChottuAvatar className="relative size-32 drop-shadow-lg" />
        </div>
        <p className="text-2xl font-semibold">Chottu</p>
        <p className="text-muted-foreground tabular-nums" aria-live="polite">
          {label}
        </p>
      </div>

      <div className="flex items-center gap-8">
        <button
          type="button"
          onClick={toggleMute}
          disabled={status !== "connected"}
          aria-pressed={muted}
          aria-label={muted ? "Unmute" : "Mute"}
          className={cn(
            "flex size-16 items-center justify-center rounded-full shadow-md transition-colors disabled:opacity-40",
            muted ? "bg-foreground text-background" : "bg-background text-foreground",
          )}
        >
          {muted ? <MicOff className="size-6" /> : <Mic className="size-6" />}
        </button>
        <button
          type="button"
          onClick={end}
          disabled={status === "ended"}
          aria-label="End call"
          className="flex size-16 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition-colors hover:bg-red-600 disabled:opacity-60"
        >
          <PhoneOff className="size-6" />
        </button>
      </div>
    </div>
  );
}
