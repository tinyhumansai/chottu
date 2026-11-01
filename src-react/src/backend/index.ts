/**
 * Chat backend seam. `streamReply` receives the conversation so far and yields
 * the assistant's reply as text chunks. Swap `mockBackend` for a real one
 * (an LLM API, a Tauri command over a Channel, …) without touching the UI or store.
 */
export type ChatTurn = { role: "user" | "assistant"; text: string };

export type ChatBackend = {
  streamReply(history: readonly ChatTurn[], signal: AbortSignal): AsyncIterable<string>;
};

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });

/** Echoes the last user message back, a word at a time, to show streaming. */
export const mockBackend: ChatBackend = {
  async *streamReply(history, signal) {
    const last = history.findLast((t) => t.role === "user")?.text ?? "";
    const reply = `You said: **${last}**\n\nThis is a mock reply. Plug a real model into \`src/backend\`.`;
    for (const word of reply.split(/(?<=\s)/)) {
      await sleep(30, signal);
      yield word;
    }
  },
};

export const backend: ChatBackend = mockBackend;
