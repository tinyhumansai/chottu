import { beforeEach, describe, expect, it, vi } from "vitest";

// Pages served over plain http on a LAN or public IP are not a secure context,
// so browsers leave `crypto.randomUUID` undefined there.
function insecureContext() {
  vi.stubGlobal("crypto", { getRandomValues: globalThis.crypto.getRandomValues.bind(globalThis.crypto) });
}

function memoryStorage() {
  const data = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  });
}

describe("chat store", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    memoryStorage();
  });

  it("registers messages without crypto.randomUUID (insecure context)", async () => {
    insecureContext();
    const { useChatStore } = await import("./chat");

    const a = useChatStore.getState().register({ role: "user", content: "hello" });
    const b = useChatStore.getState().register({ role: "assistant", content: "hi" });

    const { messages } = useChatStore.getState();
    expect(messages.map((m) => m.id)).toEqual([a, b]);
    expect(a).not.toEqual(b);
    expect(messages[0].content).toEqual([{ type: "text", text: "hello" }]);
  });

  it("send adds the user message and streams a reply", async () => {
    vi.doMock("@/backend", () => ({
      backend: {
        async *streamReply() {
          yield "Hel";
          yield "lo";
        },
      },
    }));
    insecureContext();
    const { useChatStore, textOf } = await import("./chat");

    await useChatStore.getState().send("ping");

    const { messages, isRunning } = useChatStore.getState();
    expect(isRunning).toBe(false);
    expect(messages.map((m) => [m.role, textOf(m)])).toEqual([
      ["user", "ping"],
      ["assistant", "Hello"],
    ]);
  });

  it("a send while a reply is streaming stops that reply and is not dropped", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    vi.doMock("@/backend", () => ({
      backend: {
        async *streamReply(history: { text: string }[], signal: AbortSignal) {
          if (history.at(-1)?.text === "first") {
            yield "partial";
            await Promise.race([gate, new Promise((_, rej) => signal.addEventListener("abort", () => rej(signal.reason)))]);
          }
          yield "done";
        },
      },
    }));
    insecureContext();
    const { useChatStore, textOf } = await import("./chat");

    const first = useChatStore.getState().send("first");
    await vi.waitFor(() => expect(textOf(useChatStore.getState().messages.at(-1)!)).toBe("partial"));
    await useChatStore.getState().send("second");
    release();
    await first;

    const { messages, isRunning } = useChatStore.getState();
    expect(isRunning).toBe(false);
    expect(messages.map((m) => [m.role, textOf(m), m.error ?? null])).toEqual([
      ["user", "first", null],
      ["assistant", "partial", "cancelled"],
      ["user", "second", null],
      ["assistant", "done", null],
    ]);
  });
});

