import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tab<T extends string> = { id: T; label: string; icon: LucideIcon };

type BottomBarProps<T extends string> = {
  tabs: readonly Tab<T>[];
  active: T;
  onChange: (id: T) => void;
};

/**
 * Height the floating bar takes up, including its gap from the screen edge:
 * 3rem tabs + 0.75rem padding + 2px border + 0.5rem bottom gap. Keep in sync with the classes below.
 */
export const BOTTOM_BAR_SPACE = "calc(4.25rem + 2px + env(safe-area-inset-bottom))";

/** A floating pill of icon tabs pinned to the bottom of the screen. Labels are for a11y and tooltips. */
export function BottomBar<T extends string>({ tabs, active, onChange }: BottomBarProps<T>) {
  return (
    <nav
      aria-label="Main"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
    >
      <div className="bg-background/80 pointer-events-auto flex gap-1 rounded-full border p-1.5 shadow-lg backdrop-blur-md">
        {tabs.map(({ id, label, icon: Icon }) => {
          const selected = id === active;
          return (
            <button
              key={id}
              type="button"
              aria-label={label}
              title={label}
              aria-current={selected ? "page" : undefined}
              onClick={() => onChange(id)}
              className={cn(
                "flex h-12 w-16 items-center justify-center rounded-full transition-colors",
                selected
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <Icon className="size-6" strokeWidth={1.75} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
