import { useEffect } from "react";
import { useChatStore } from "@/store/chat";

/**
 * In the desktop app (the web build inside Tauri), registers every
 * `chottu://` link as a chat message. In a plain browser there are none.
 * Links are untrusted input: only the URL text is shown.
 */
export function useDeepLinkMessages() {
  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;
    void (async () => {
      const { isTauri } = await import("@tauri-apps/api/core");
      if (!isTauri()) return;
      const { onOpenUrl } = await import("@tauri-apps/plugin-deep-link");
      const unlisten = await onOpenUrl((urls) => {
        for (const url of urls) useChatStore.getState().register({ role: "system", content: `Opened from ${url}` });
      });
      if (cancelled) unlisten();
      else stop = unlisten;
    })().catch(() => {
      // No Tauri host, or the plugin is unavailable: nothing to listen to.
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);
}
