import { MicIcon, MicOffIcon, PhoneOffIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { useCallStore } from "@/store/call";
import { formatDuration } from "@/voice-notes/types";
import { ChatWallpaper } from "./chat-wallpaper";
import { ChottuAvatar } from "./chottu-avatar";

function useElapsed(since: number | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (since === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [since]);
  return since === null ? 0 : Math.max(0, now - since);
}

/** Escape ends the call on web and desktop, like closing any dialog. */
function useEscapeToEnd(active: boolean, end: () => void) {
  useEffect(() => {
    if (!active || Platform.OS !== "web") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && end();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, end]);
}

/** Full-screen call with Chottu. Shown whenever a call is not idle. */
export function CallScreen() {
  const { status, connectedAt, muted, end, toggleMute } = useCallStore();
  const elapsed = useElapsed(connectedAt);
  const insets = useSafeAreaInsets();
  const open = status !== "idle";
  useEscapeToEnd(open, end);

  const label = status === "connecting" ? "Calling…" : status === "ended" ? "Call ended" : formatDuration(elapsed);

  return (
    <Modal visible={open} animationType="fade" transparent={false} onRequestClose={end} accessibilityViewIsModal>
      <ChatWallpaper>
        <View
          accessibilityLabel="Call with Chottu"
          className="flex-1 items-center justify-between px-6"
          style={{ paddingTop: insets.top + 80, paddingBottom: insets.bottom + 48 }}
        >
          <View className="items-center gap-4">
            <View className={cn("rounded-full", status === "connecting" && "border-primary/30 border-8")}>
              <ChottuAvatar size={128} />
            </View>
            <Text className="text-foreground text-2xl font-semibold">Chottu</Text>
            <Text accessibilityLiveRegion="polite" className="text-muted-foreground text-base" style={{ fontVariant: ["tabular-nums"] }}>
              {label}
            </Text>
          </View>

          <View className="flex-row items-center gap-12">
            <CallButton
              label={muted ? "Unmute" : "Mute"}
              onPress={toggleMute}
              disabled={status !== "connected"}
              className={muted ? "bg-foreground" : "bg-card"}
            >
              <Icon as={muted ? MicOffIcon : MicIcon} className={cn("size-6", muted ? "text-background" : "text-foreground")} />
            </CallButton>
            <CallButton label="End call" onPress={end} disabled={status === "ended"} className="bg-recording">
              <Icon as={PhoneOffIcon} className="size-6 text-white" />
            </CallButton>
          </View>
        </View>
      </ChatWallpaper>
    </Modal>
  );
}

function CallButton({ label, onPress, disabled, className, children }: { label: string; onPress: () => void; disabled?: boolean; className: string; children: React.ReactNode }) {
  return (
    <View className="items-center gap-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        disabled={disabled}
        className={cn("size-16 items-center justify-center rounded-full shadow-md disabled:opacity-40", className)}
      >
        {children}
      </Pressable>
      <Text className="text-foreground text-xs">{label}</Text>
    </View>
  );
}
