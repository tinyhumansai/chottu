import * as Linking from "expo-linking";
import { useEffect } from "react";
import { useChatStore } from "@/store/chat";

/**
 * Registers every `chottu://` link the app is opened with as a chat message.
 * Links are untrusted input: only the URL text is shown, nothing is acted on.
 */
export function useDeepLinkMessages() {
  const url = Linking.useLinkingURL();
  useEffect(() => {
    if (url?.startsWith("chottu:")) useChatStore.getState().register({ role: "system", content: `Opened from ${url}` });
  }, [url]);
}
