import { AssistantRuntimeProvider, useExternalStoreRuntime, type ThreadMessageLike } from "@assistant-ui/react-native";
import { Text, View } from "react-native";
import { Thread } from "@/components/assistant-ui/elements/thread.aui";
import { ChatWallpaper } from "@/components/chat-wallpaper";
import { ChottuAvatar } from "@/components/chottu-avatar";
import { TOP_BAR_SPACE, useNavInsets } from "@/components/layout";
import { TopBar } from "@/components/top-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallStore } from "@/store/call";
import { useChatStore, type ChatMessage, type ChatPart } from "@/store/chat";
import { VoiceNoteButton, VoiceNoteRecorderProvider, VoiceNoteRecordingBar } from "@/voice-notes/composer-button";
import { VoiceNoteDataUI } from "@/voice-notes/message-part";

const statusOf = (m: ChatMessage, isStreaming: boolean): ThreadMessageLike["status"] => {
  if (isStreaming) return { type: "running" };
  if (m.error) return { type: "incomplete", reason: m.error === "cancelled" ? "cancelled" : "error" };
  return { type: "complete", reason: "stop" };
};

function Welcome() {
  return (
    <View className="items-center gap-2 px-6 pb-6">
      <ChottuAvatar size={72} />
      <Text className="text-foreground text-2xl font-semibold">Talk to Chottu</Text>
      <Text className="text-muted-foreground text-center text-base">Type a message, or tap the mic to send a voice note.</Text>
    </View>
  );
}

const THREAD_COMPONENTS = { ComposerExtra: VoiceNoteButton, ComposerOverlay: VoiceNoteRecordingBar, Welcome };

/** The conversation, rendered by assistant-ui over the chat store. */
export function ChatScreen() {
  const { messages, isRunning, send, regenerate, cancel } = useChatStore();
  const startCall = useCallStore((s) => s.start);
  const nav = useNavInsets();
  const safe = useSafeAreaInsets();
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
      <ChatWallpaper>
        {/* The wallpaper runs under the sidebar; the conversation sits beside it. */}
        <View className="flex-1" style={{ paddingLeft: nav.left }}>
          <VoiceNoteRecorderProvider>
            <Thread
              components={THREAD_COMPONENTS}
              insets={{ top: safe.top + TOP_BAR_SPACE, bottom: nav.wide ? Math.max(safe.bottom, 12) : nav.bottom }}
            />
          </VoiceNoteRecorderProvider>
          <TopBar onCall={startCall} />
        </View>
        <VoiceNoteDataUI />
      </ChatWallpaper>
    </AssistantRuntimeProvider>
  );
}
