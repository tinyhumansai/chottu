import type { LucideIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type Tab<T extends string> = { id: T; label: string; icon: LucideIcon };

type AppNavProps<T extends string> = {
  tabs: readonly Tab<T>[];
  active: T;
  onChange: (id: T) => void;
};

/**
 * Space the floating nav takes, as CSS values that switch with the layout
 * (see `--nav-*-space` in index.css): a bottom bar on phones, a left sidebar from `md` up.
 * Screens run underneath the nav and pad their own content by these.
 */
export const NAV_BOTTOM_SPACE = "var(--nav-bottom-space)";
export const NAV_LEFT_SPACE = "var(--nav-left-space)";

const pill =
  "bg-background/80 pointer-events-auto flex gap-1 rounded-full border p-1.5 shadow-lg backdrop-blur-md";

/** Floating icon tabs: a bottom bar on phones, a vertical sidebar on desktop. */
export function AppNav<T extends string>(props: AppNavProps<T>) {
  return (
    <>
      <nav
        aria-label="Main"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:hidden"
      >
        <div className={pill}>
          <NavButtons {...props} className="h-12 w-16" />
        </div>
      </nav>
      <nav
        aria-label="Main"
        className="pointer-events-none fixed inset-y-0 left-0 z-20 hidden items-center pl-4 md:flex"
      >
        <div className={cn(pill, "flex-col")}>
          <NavButtons {...props} className="size-12" tooltipSide="right" />
        </div>
      </nav>
    </>
  );
}

function NavButtons<T extends string>({
  tabs,
  active,
  onChange,
  className,
  tooltipSide,
}: AppNavProps<T> & { className: string; tooltipSide?: "right" }) {
  return tabs.map(({ id, label, icon: Icon }) => {
    const selected = id === active;
    const button = (
      <button
        key={id}
        type="button"
        aria-label={label}
        title={tooltipSide ? undefined : label}
        aria-current={selected ? "page" : undefined}
        onClick={() => onChange(id)}
        className={cn(
          "flex items-center justify-center rounded-full transition-colors",
          className,
          selected
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )}
      >
        <Icon className="size-6" strokeWidth={1.75} />
      </button>
    );
    if (!tooltipSide) return button;
    return (
      <Tooltip key={id}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side={tooltipSide}>{label}</TooltipContent>
      </Tooltip>
    );
  });
}
