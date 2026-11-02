import { MicIcon, SendIcon, Trash2Icon } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { useChatStore } from "@/store/chat";
import { useVoiceRecorder } from "./recorder";
import { formatDuration, voiceNotePart } from "./types";

/**
 * The composer's mic. Tap to record; the recording bar then covers the whole
 * composer with discard, a timer and send.
 */
export function VoiceNoteButton() {
  const { state, elapsedMs, level, start, cancel, finish } = useVoiceRecorder();
  const send = useChatStore((s) => s.send);

  const sendNote = async () => {
    const note = await finish();
    if (note) void send([voiceNotePart(note)]);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Record voice note"
        onPress={start}
        disabled={state === "starting" || state === "recording"}
        className="active:bg-accent web:hover:bg-accent size-9 items-center justify-center rounded-full disabled:opacity-40"
      >
        <Icon as={MicIcon} className="text-muted-foreground size-5" />
      </Pressable>

      {state !== "idle" && (
        <View accessibilityLiveRegion="polite" className="bg-card absolute inset-0 z-10 flex-row items-center gap-2 rounded-full px-1.5">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Discard voice note"
            onPress={cancel}
            className="active:bg-accent size-9 items-center justify-center rounded-full"
          >
            <Icon as={Trash2Icon} className="text-muted-foreground size-5" />
          </Pressable>
          <View className="bg-recording size-2.5 rounded-full" style={{ transform: [{ scale: 1 + Math.min(level, 0.8) }] }} />
          <Text className="text-foreground flex-1 text-sm" style={{ fontVariant: ["tabular-nums"] }}>
            {state === "error" ? "Microphone unavailable" : state === "starting" ? "Starting…" : `Recording ${formatDuration(elapsedMs)}`}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send voice note"
            onPress={sendNote}
            disabled={state !== "recording"}
            className="bg-primary size-9 items-center justify-center rounded-full disabled:opacity-40"
          >
            <Icon as={SendIcon} className="text-primary-foreground size-4" />
          </Pressable>
        </View>
      )}
    </>
  );
}
