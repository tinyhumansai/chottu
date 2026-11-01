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

      return {
        messages: [],
        isRunning: false,

        async send(text) {
          if (get().isRunning) return;
          const user = message("user", text);
          const reply = message("assistant", "");
          set((s) => ({ messages: [...s.messages, user, reply], isRunning: true }));

          controller = new AbortController();
          const history = get().messages.filter((m) => m.id !== reply.id);
          try {
            for await (const chunk of backend.streamReply(history, controller.signal)) {
              patch(reply.id, (m) => ({ ...m, text: m.text + chunk }));
            }
          } catch (err) {
            const reason = controller.signal.aborted ? "cancelled" : String(err);
            patch(reply.id, (m) => ({ ...m, error: reason }));
          } finally {
            controller = null;
            set({ isRunning: false });
          }
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
