import { useEffect } from "react";
import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  type AppendMessage,
  type ThreadMessageLike,
} from "@assistant-ui/react";
import { SquarePen } from "lucide-react";
import { Thread } from "@/components/assistant-ui/elements/thread.aui";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useChatStore, type ChatMessage } from "@/store/chat";

const convertMessage = (m: ChatMessage, idx: number, last: number, running: boolean): ThreadMessageLike => ({
  id: m.id,
  role: m.role,
  content: [{ type: "text", text: m.text }],
  createdAt: new Date(m.createdAt),
  ...(m.role === "assistant" && {
    status:
      running && idx === last
        ? { type: "running" }
        : m.error
          ? { type: "incomplete", reason: m.error === "cancelled" ? "cancelled" : "error" }
          : { type: "complete", reason: "stop" },
  }),
});

const textOf = (message: AppendMessage) =>
  message.content.map((p) => (p.type === "text" ? p.text : "")).join("");

function useSystemTheme() {
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => document.documentElement.classList.toggle("dark", query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
}

export default function App() {
  useSystemTheme();
  const { messages, isRunning, send, cancel, clear } = useChatStore();

  const runtime = useExternalStoreRuntime({
    messages,
    isRunning,
    convertMessage: (m, idx) => convertMessage(m, idx, messages.length - 1, isRunning),
    onNew: (message) => send(textOf(message)),
    onCancel: async () => cancel(),
  });

  return (
    <TooltipProvider>
      <AssistantRuntimeProvider runtime={runtime}>
        <div className="bg-background text-foreground flex h-dvh flex-col">
          <header className="flex items-center justify-between border-b px-4 py-2">
            <span className="font-semibold">Chottu</span>
            <Button variant="ghost" size="sm" onClick={clear} disabled={messages.length === 0}>
              <SquarePen />
              New chat
            </Button>
          </header>
          <main className="min-h-0 flex-1">
            <Thread />
          </main>
        </div>
      </AssistantRuntimeProvider>
    </TooltipProvider>
  );
}
