import { useChatStore } from "@/store/chat";
import { useUiStore } from "@/store/ui";

/** Jump to the chat and send `prompt` as the user. Used by suggestions, mini-apps and the wallet. */
export function askChottu(prompt: string) {
  useUiStore.getState().setTab("chat");
  void useChatStore.getState().send(prompt);
}
