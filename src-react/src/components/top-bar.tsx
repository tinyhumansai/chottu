import { ChottuAvatar } from "@/components/chottu-avatar";

/** Space the floating top bar takes, for content that scrolls beneath it. */
export const TOP_BAR_SPACE = "calc(6.5rem + env(safe-area-inset-top))";

/** Floating top bar: Chottu's avatar and name in a centered pill. Content scrolls under it. */
export function TopBar() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10">
      <div className="from-chat-bg via-chat-bg/80 absolute inset-x-0 top-0 h-full bg-gradient-to-b to-transparent" />
      <div className="relative flex justify-center px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-4">
        <div className="bg-background pointer-events-auto flex flex-col items-center gap-0.5 rounded-2xl px-4 pt-2 pb-1.5 shadow-[0_4px_20px_-4px_rgb(0_0_0/0.12)] dark:shadow-[0_4px_20px_-4px_rgb(0_0_0/0.6)] dark:ring-1 dark:ring-white/10">
          <ChottuAvatar />
          <span className="text-sm font-semibold">Chottu</span>
        </div>
      </div>
    </div>
  );
}
