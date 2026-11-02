import type { ThreadMessageLike } from "@assistant-ui/react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { backend, type ChatTurn } from "@/backend";
import { newId } from "@/lib/id";

/** Any part assistant-ui can render: text, image, file, reasoning, tool-call, data-*. */
export type ChatPart = Exclude<ThreadMessageLike["content"], string>[number];
export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: ChatPart[];
  createdAt: number;
  /** Set on assistant messages that ended early (cancelled or failed). */
  error?: string;
};

/** What a caller hands to `register`; id and timestamp are filled in if missing. */
export type NewMessage = {
  role: ChatRole;
  content: string | ChatPart[];
  id?: string;
  createdAt?: number;
};

type ChatState = {
  messages: ChatMessage[];
  isRunning: boolean;
  /**
   * Add any message from anywhere (backend, deep link, notification, …). Returns its id.
   * Image parts must be `https:`, `blob:` or `data:image/…` URLs; assistant-ui drops others.
   */
  register: (message: NewMessage) => string;
  /** Add a user message and stream the backend's reply. */
  send: (content: string | ChatPart[]) => Promise<void>;
  /** Drop everything after `parentId` and generate a fresh reply to it. */
  regenerate: (parentId: string | null) => Promise<void>;
  cancel: () => void;
  clear: () => void;
};

let controller: AbortController | null = null;

const toMessage = ({ role, content, id, createdAt }: NewMessage): ChatMessage => ({
  id: id ?? newId(),
  role,
  content: typeof content === "string" ? [{ type: "text", text: content }] : content,
  createdAt: createdAt ?? Date.now(),
});

/** Plain-text view of a message, for backends that only take text. Voice notes become `[voice note m:ss]`. */
export const textOf = (m: Pick<ChatMessage, "content">) =>
  m.content
    .map((p) => {
      if (p.type === "text") return p.text;
      if (p.type === "data-voice-note") {
        const s = Math.round(((p.data as { durationMs?: number })?.durationMs ?? 0) / 1000);
        return `[voice note ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}]`;
      }
      return "";
    })
    .join("");

const appendText = (m: ChatMessage, chunk: string): ChatMessage => {
  const last = m.content.at(-1);
  if (last?.type === "text") {
    return { ...m, content: [...m.content.slice(0, -1), { ...last, text: last.text + chunk }] };
  }
  return { ...m, content: [...m.content, { type: "text", text: chunk }] };
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => {
      const patch = (id: string, fn: (m: ChatMessage) => ChatMessage) =>
        set((s) => ({ messages: s.messages.map((m) => (m.id === id ? fn(m) : m)) }));

      /**
       * Streams an assistant reply to the current history. Each run owns its
       * controller, so a newer run can stop an older one without either
       * clearing the other's state.
       */
      const reply = async () => {
        const run = new AbortController();
        controller = run;
        const history: ChatTurn[] = get().messages.map((m) => ({ role: m.role, text: textOf(m) }));
        const draft = toMessage({ role: "assistant", content: [] });
        set((s) => ({ messages: [...s.messages, draft], isRunning: true }));

        try {
          for await (const chunk of backend.streamReply(history, run.signal)) {
            if (run.signal.aborted) break;
            patch(draft.id, (m) => appendText(m, chunk));
          }
          if (run.signal.aborted) patch(draft.id, (m) => ({ ...m, error: "cancelled" }));
        } catch (err) {
          const reason = run.signal.aborted ? "cancelled" : String(err);
          patch(draft.id, (m) => ({ ...m, error: reason }));
        } finally {
          if (controller === run) {
            controller = null;
            set({ isRunning: false });
          }
        }
      };

      /** Stops the reply in flight, if any; its draft is kept and marked cancelled. */
      const stop = () => {
        controller?.abort();
        controller = null;
      };

      return {
        messages: [],
        isRunning: false,

        register(input) {
          const message = toMessage(input);
          set((s) => ({ messages: [...s.messages, message] }));
          return message.id;
        },

        async send(content) {
          // A new message wins over a reply still streaming (e.g. "Ask Chottu" from another tab).
          stop();
          get().register({ role: "user", content });
          await reply();
        },

        async regenerate(parentId) {
          stop();
          const idx = get().messages.findIndex((m) => m.id === parentId);
          set((s) => ({ messages: s.messages.slice(0, idx + 1) }));
          await reply();
        },

        cancel() {
          stop();
          set({ isRunning: false });
        },

        clear() {
          stop();
          set({ messages: [], isRunning: false });
        },
      };
    },
    {
      name: "chottu-chat",
      version: 1,
      partialize: (s) => ({ messages: s.messages }),
      // v0 stored `text: string`; v1 stores `content: ChatPart[]`.
      migrate: (persisted, version) => {
        const state = persisted as { messages?: Array<Record<string, unknown>> };
        if (version === 0 && state.messages) {
          state.messages = state.messages.map(({ text, ...m }) => ({
            ...m,
            content: [{ type: "text", text: String(text ?? "") }],
          }));
        }
        return state as { messages: ChatMessage[] };
      },
    },
  ),
);
