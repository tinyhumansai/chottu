import { useAudioPlayer, useAudioPlayerStatus, type AudioPlayer } from "expo-audio";
import { AlertCircleIcon, PauseIcon, PlayIcon } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { playableUri } from "./audio-files";
import { formatDuration, type VoiceNote } from "./types";
import { Waveform } from "./waveform";

// Only one note plays at a time: starting one pauses the last.
let current: AudioPlayer | null = null;

/** Play/pause, a seekable waveform and the time. `id` names the cached file. */
export function VoiceNotePlayer({ id, note, tone = "assistant" }: { id: string; note: VoiceNote; tone?: "user" | "assistant" }) {
  const player = useAudioPlayer(null, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);
  const loaded = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => () => {
    if (current === player) current = null;
  }, [player]);

  // Rewind when it finishes so the next tap plays from the start.
  useEffect(() => {
    if (status.didJustFinish) void player.seekTo(0).then(() => player.pause());
  }, [player, status.didJustFinish]);

  const ensureLoaded = async () => {
    if (loaded.current) return;
    player.replace({ uri: await playableUri(note.src, id) });
    loaded.current = true;
  };

  const toggle = async () => {
    try {
      if (status.playing) return player.pause();
      await ensureLoaded();
      if (current && current !== player) current.pause();
      current = player;
      player.play();
    } catch {
      setFailed(true);
    }
  };

  const seek = async (fraction: number) => {
    try {
      await ensureLoaded();
      await player.seekTo((note.durationMs / 1000) * fraction);
    } catch {
      setFailed(true);
    }
  };

  const positionMs = status.currentTime * 1000;
  const progress = note.durationMs > 0 ? positionMs / note.durationMs : 0;
  const fg = tone === "user" ? "text-bubble-user-foreground" : "text-bubble-assistant-foreground";
  const bar = tone === "user" ? "bg-bubble-user-foreground" : "bg-bubble-assistant-foreground";

  return (
    <View className="w-60 flex-row items-center gap-2" accessibilityLabel={`Voice note, ${formatDuration(note.durationMs)}`}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={failed ? "Can't play this voice note" : status.playing ? "Pause voice note" : "Play voice note"}
        disabled={failed}
        onPress={toggle}
        className="size-9 items-center justify-center rounded-full"
      >
        <Icon as={failed ? AlertCircleIcon : status.playing ? PauseIcon : PlayIcon} className={cn("size-6", fg)} />
      </Pressable>
      <View className="flex-1 gap-0.5">
        <Waveform bars={note.waveform} progress={progress} onSeek={failed ? undefined : seek} barClassName={bar} />
        <Text className={cn("text-xs opacity-70", fg)} style={{ fontVariant: ["tabular-nums"] }}>
          {formatDuration(status.playing || positionMs > 0 ? positionMs : note.durationMs)}
        </Text>
      </View>
    </View>
  );
}
