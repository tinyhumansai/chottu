import { View, type GestureResponderEvent } from "react-native";
import { cn } from "@/lib/utils";

type Props = {
  bars: number[];
  /** 0..1; bars up to here draw solid. */
  progress?: number;
  onSeek?: (fraction: number) => void;
  className?: string;
  barClassName?: string;
};

/** Waveform bars filled up to `progress`. Tap to seek when `onSeek` is set. */
export function Waveform({ bars, progress = 0, onSeek, className, barClassName = "bg-foreground" }: Props) {
  const seek = (e: GestureResponderEvent, width: number) => onSeek?.(Math.min(1, Math.max(0, e.nativeEvent.locationX / width)));
  let width = 1;
  return (
    <View
      className={cn("h-7 flex-row items-center gap-[2px]", className)}
      onLayout={(e) => (width = e.nativeEvent.layout.width || 1)}
      onStartShouldSetResponder={() => Boolean(onSeek)}
      onResponderRelease={(e) => seek(e, width)}
      accessibilityRole={onSeek ? "adjustable" : undefined}
    >
      {bars.map((h, i) => (
        <View
          // Bars never reorder; the index is their identity.
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          className={cn("flex-1 rounded-full", barClassName, (i + 0.5) / bars.length > progress && "opacity-35")}
          style={{ height: `${Math.max(8, Math.min(100, h * 100))}%` }}
        />
      ))}
    </View>
  );
}
