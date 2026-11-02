import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { isTauri } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/store/chat";

export function SettingsScreen() {
  const count = useChatStore((s) => s.messages.length);
  const clear = useChatStore((s) => s.clear);
  const [version, setVersion] = useState("web");

  useEffect(() => {
    if (isTauri()) getVersion().then((v) => setVersion(`v${v}`));
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 overflow-y-auto px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
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
