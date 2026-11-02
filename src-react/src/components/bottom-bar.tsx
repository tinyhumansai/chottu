import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tab<T extends string> = { id: T; label: string; icon: LucideIcon };

type BottomBarProps<T extends string> = {
  tabs: readonly Tab<T>[];
  active: T;
  onChange: (id: T) => void;
};

export function BottomBar<T extends string>({ tabs, active, onChange }: BottomBarProps<T>) {
  return (
    <nav
      aria-label="Main"
      className="bg-background flex shrink-0 border-t pb-[env(safe-area-inset-bottom)]"
    >
      {tabs.map(({ id, label, icon: Icon }) => {
        const selected = id === active;
        return (
          <button
            key={id}
            type="button"
            aria-current={selected ? "page" : undefined}
            onClick={() => onChange(id)}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors",
              selected ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-5" strokeWidth={selected ? 2.25 : 1.75} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
