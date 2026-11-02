import type { ReactNode } from "react";
import { NAV_BOTTOM_SPACE } from "@/components/app-nav";
import { cn } from "@/lib/utils";

/** A scrolling tab page: big title, then sections. Pads itself clear of the floating nav. */
export function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 overflow-y-auto px-4 pt-[calc(1.5rem+env(safe-area-inset-top))]"
      style={{ paddingBottom: `calc(${NAV_BOTTOM_SPACE} + 1rem)` }}
    >
      <h1 className="text-2xl font-semibold">{title}</h1>
      {children}
    </div>
  );
}

/** A titled group on a page. */
export function Section({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-2", className)}>
      {title && <h2 className="text-muted-foreground px-1 text-xs font-medium tracking-wide uppercase">{title}</h2>}
      {children}
    </section>
  );
}

/** A bordered card used for list rows and panels. */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("bg-card rounded-xl border", className)}>{children}</div>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground px-1 py-2 text-sm">{children}</p>;
}
