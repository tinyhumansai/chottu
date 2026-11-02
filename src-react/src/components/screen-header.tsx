import type { ReactNode } from "react";

export function ScreenHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="flex min-h-12 shrink-0 items-center justify-between border-b px-4 pt-[env(safe-area-inset-top)]">
      <h1 className="font-semibold">{title}</h1>
      {children}
    </header>
  );
}
