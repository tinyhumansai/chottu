import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { isTauri } from "@tauri-apps/api/core";
import { BOTTOM_BAR_SPACE } from "@/components/bottom-bar";
import { Button } from "@/components/ui/button";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chat";
import { useThemeStore, type ThemePreference } from "@/store/theme";

const THEMES: { id: ThemePreference; label: string; icon: typeof Sun }[] = [
  { id: "system", label: "System", icon: Monitor },
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
];

function ThemePicker() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  return (
    <div role="radiogroup" aria-label="Theme" className="bg-muted flex rounded-full p-1">
      {THEMES.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={theme === id}
          onClick={() => setTheme(id)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
            theme === id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-4" />
          {label}
        </button>
      ))}
    </div>
  );
}

export function SettingsScreen() {
  const count = useChatStore((s) => s.messages.length);
  const clear = useChatStore((s) => s.clear);
  const [version, setVersion] = useState("web");

  useEffect(() => {
    if (isTauri()) getVersion().then((v) => setVersion(`v${v}`));
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 overflow-y-auto px-4 pt-[calc(1.5rem+env(safe-area-inset-top))]"
      style={{ paddingBottom: `calc(${BOTTOM_BAR_SPACE} + 1rem)` }}
    >
      <h1 className="text-2xl font-semibold">Settings</h1>
      <section className="flex flex-col gap-3 rounded-xl border p-4">
        <p className="font-medium">Appearance</p>
        <ThemePicker />
      </section>
      <section className="flex items-center justify-between gap-4 rounded-xl border p-4">
        <div>
          <p className="font-medium">Chat history</p>
          <p className="text-muted-foreground text-sm">
            {count} {count === 1 ? "message" : "messages"} stored on this device
          </p>
        </div>
        <Button variant="destructive" size="sm" onClick={clear} disabled={count === 0}>
          Clear
        </Button>
      </section>
      <p className="text-muted-foreground text-center text-xs">Chottu {version}</p>
    </div>
  );
}
