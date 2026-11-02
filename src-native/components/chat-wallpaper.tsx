import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, Path, Pattern, Rect } from "react-native-svg";
import { useCSSVariable } from "uniwind";

// One 160×160 doodle tile, drawn as strokes and repeated across the screen.
const DOODLES = [
  "M14 18h22a6 6 0 0 1 6 6v10a6 6 0 0 1-6 6H26l-7 6v-6h-5a6 6 0 0 1-6-6V24a6 6 0 0 1 6-6z",
  "M104 22c-4-6-14-3-12 5 2 6 12 11 12 11s10-5 12-11c2-8-8-11-12-5z",
  "M58 70l3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1z",
  "M132 70v12M126 76h12",
  "M12 104c6-6 12 6 18 0s12 6 18 0",
  "M83 121q5 4 10 0",
  "M124 120h24a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5h-3v6l-7-6h-14a5 5 0 0 1-5-5v-8a5 5 0 0 1 5-5z",
  "M28 66l3 3-3 3-3-3z",
];
const DOTS: [number, number, number][] = [
  [88, 118, 11],
  [60, 20, 2],
  [146, 40, 2],
  [30, 140, 2],
  [114, 80, 1.5],
  [84, 114, 0.6],
  [92, 114, 0.6],
];

/** The WhatsApp-style chat background: a flat colour with a faint doodle tile. */
export function ChatWallpaper({ children }: { children?: ReactNode }) {
  const stroke = String(useCSSVariable("--color-chat-pattern") ?? "transparent");
  return (
    <View className="bg-chat-bg flex-1">
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <Pattern id="chottu-doodles" width={160} height={160} patternUnits="userSpaceOnUse">
            {DOODLES.map((d) => (
              <Path key={d} d={d} fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
            ))}
            {DOTS.map(([cx, cy, r]) => (
              <Circle key={`${cx},${cy}`} cx={cx} cy={cy} r={r} fill="none" stroke={stroke} strokeWidth={1.6} />
            ))}
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#chottu-doodles)" />
      </Svg>
      {children}
    </View>
  );
}
