import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  type ThreadMessageLike,
} from "@assistant-ui/react";
import { Thread } from "@/components/assistant-ui/elements/thread.aui";
import { AppMenu } from "@/components/app-menu";
import { NAV_BOTTOM_SPACE } from "@/components/app-nav";
import { TOP_BAR_SPACE, TopBar } from "@/components/top-bar";
import { useChatStore, type ChatMessage, type ChatPart } from "@/store/chat";

const statusOf = (m: ChatMessage, isStreaming: boolean): ThreadMessageLike["status"] => {
  if (isStreaming) return { type: "running" };
  if (m.error) return { type: "incomplete", reason: m.error === "cancelled" ? "cancelled" : "error" };
  return { type: "complete", reason: "stop" };
};

export function ChatScreen() {
  const { messages, isRunning, send, regenerate, cancel } = useChatStore();
  const lastIdx = messages.length - 1;

  const runtime = useExternalStoreRuntime({
    messages,
    isRunning,
    convertMessage: (m, idx): ThreadMessageLike => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: new Date(m.createdAt),
      ...(m.role === "assistant" && { status: statusOf(m, isRunning && idx === lastIdx) }),
    }),
    onNew: (message) => send([...message.content] as ChatPart[]),
    onReload: (parentId) => regenerate(parentId),
    onCancel: async () => cancel(),
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="relative min-h-0 flex-1" style={{
          ["--thread-top-inset" as string]: TOP_BAR_SPACE,
          ["--thread-bottom-inset" as string]: NAV_BOTTOM_SPACE,
        }}>
        <TopBar action={<AppMenu />} />
        <Thread />
      </div>
    </AssistantRuntimeProvider>
  );
}
