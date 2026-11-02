import { create } from "zustand";
import { persist } from "zustand/middleware";
import { backend } from "@/backend";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: number;
  /** Set on assistant messages that ended early (cancelled or failed). */
  error?: string;
};

type ChatState = {
  messages: ChatMessage[];
  isRunning: boolean;
  send: (text: string) => Promise<void>;
  /** Drop everything after `parentId` and generate a fresh reply to it. */
  regenerate: (parentId: string | null) => Promise<void>;
  cancel: () => void;
  clear: () => void;
};

let controller: AbortController | null = null;

const message = (role: ChatMessage["role"], text: string): ChatMessage => ({
  id: crypto.randomUUID(),
  role,
  text,
  createdAt: Date.now(),
});

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => {
      const patch = (id: string, fn: (m: ChatMessage) => ChatMessage) =>
        set((s) => ({ messages: s.messages.map((m) => (m.id === id ? fn(m) : m)) }));

      /** Streams an assistant reply to the current history. */
      const reply = async () => {
        const history = get().messages;
        const draft = message("assistant", "");
        set((s) => ({ messages: [...s.messages, draft], isRunning: true }));

        controller = new AbortController();
        try {
          for await (const chunk of backend.streamReply(history, controller.signal)) {
            patch(draft.id, (m) => ({ ...m, text: m.text + chunk }));
          }
        } catch (err) {
          const reason = controller.signal.aborted ? "cancelled" : String(err);
          patch(draft.id, (m) => ({ ...m, error: reason }));
        } finally {
          controller = null;
          set({ isRunning: false });
        }
      };

      return {
        messages: [],
        isRunning: false,

        async send(text) {
          if (get().isRunning) return;
          set((s) => ({ messages: [...s.messages, message("user", text)] }));
          await reply();
        },

        async regenerate(parentId) {
          if (get().isRunning) return;
          const idx = get().messages.findIndex((m) => m.id === parentId);
          set((s) => ({ messages: s.messages.slice(0, idx + 1) }));
          await reply();
        },

        cancel() {
          controller?.abort();
        },

        clear() {
          controller?.abort();
          set({ messages: [], isRunning: false });
        },
      };
    },
    {
      name: "chottu-chat",
      partialize: (s) => ({ messages: s.messages }),
    },
  ),
);
