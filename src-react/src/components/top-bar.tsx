import { Phone } from "lucide-react";
import { ChottuAvatar } from "@/components/chottu-avatar";
import { useCallStore } from "@/store/call";

const floating =
  "shadow-[0_4px_20px_-4px_rgb(0_0_0/0.12)] dark:shadow-[0_4px_20px_-4px_rgb(0_0_0/0.6)] dark:ring-1 dark:ring-white/10";

/** Space the floating top bar takes, for content that scrolls beneath it. */
export const TOP_BAR_SPACE = "calc(6.5rem + env(safe-area-inset-top))";

/** Floating top bar: Chottu's avatar and name in a centered pill, with a call button. Content scrolls under it. */
export function TopBar() {
  const startCall = useCallStore((s) => s.start);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10">
      <div className="from-chat-bg via-chat-bg/80 absolute inset-x-0 top-0 h-full bg-gradient-to-b to-transparent" />
      <div className="relative flex justify-center px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-4">
        {/* The pill stays centered; the call button hangs off its right side. */}
        <div className="relative">
          <div className={`bg-background pointer-events-auto flex flex-col items-center gap-0.5 rounded-2xl px-4 pt-2 pb-1.5 ${floating}`}>
            <ChottuAvatar />
            <span className="text-sm font-semibold">Chottu</span>
          </div>
          <button
            type="button"
            aria-label="Call Chottu"
            title="Call Chottu"
            onClick={startCall}
            className={`bg-background pointer-events-auto absolute top-1/2 left-full ml-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950 ${floating}`}
          >
            <Phone className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
