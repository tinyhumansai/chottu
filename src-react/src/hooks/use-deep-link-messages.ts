import { useEffect } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { useChatStore } from "@/store/chat";

/** Registers every `chottu://` link the app is opened with as a chat message. */
export function useDeepLinkMessages() {
  useEffect(() => {
    if (!isTauri()) return;
    const { register } = useChatStore.getState();
    const unlisten = onOpenUrl((urls) => {
      for (const url of urls) register({ role: "system", content: `Opened from ${url}` });
    });
    return () => {
      unlisten.then((stop) => stop());
    };
  }, []);
}
