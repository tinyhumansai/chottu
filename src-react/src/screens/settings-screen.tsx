import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { isTauri } from "@tauri-apps/api/core";
import { Page } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chat";
import { useThemeStore, type ThemePreference } from "@/store/theme";
import { useUiStore } from "@/store/ui";
import { demoConversation } from "@/voice-notes/demo";

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
  const loadSample = () => {
    const { clear, register } = useChatStore.getState();
    clear();
    demoConversation().forEach(register);
    useUiStore.getState().setTab("chat");
  };
  const [version, setVersion] = useState("web");

  useEffect(() => {
    if (isTauri()) getVersion().then((v) => setVersion(`v${v}`));
  }, []);

  return (
    <Page title="Settings">
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
      {import.meta.env.DEV && (
        <section className="flex items-center justify-between gap-4 rounded-xl border border-dashed p-4">
          <div>
            <p className="font-medium">Sample chat</p>
            <p className="text-muted-foreground text-sm">Dev only: replace the chat with a demo, voice notes included</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadSample}>
            Load
          </Button>
        </section>
      )}
      <p className="text-muted-foreground text-center text-xs">Chottu {version}</p>
    </Page>
  );
}
