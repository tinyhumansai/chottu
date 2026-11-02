import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** From this width up the nav is a left sidebar; below it, a bottom tab bar. */
export const WIDE_BREAKPOINT = 768;

/** Height of one control row: the tab bar and the composer share it. */
export const BAR_HEIGHT = 46;

/** Gap between the floating bars and the screen edge. */
export const EDGE_GAP = 16;

/** Width the desktop sidebar covers, including its gap to the screen edge. */
export const SIDEBAR_SPACE = 90;

/** Space the chat's floating top bar covers below the status bar. */
export const TOP_BAR_SPACE = 72;

export type NavInsets = {
  wide: boolean;
  /** Room the bottom tab bar covers, safe area included (0 when wide). */
  bottom: number;
  /** Room the left sidebar covers (0 when narrow). */
  left: number;
  /** Gap under the bottom tab bar. */
  bottomGap: number;
};

/**
 * How much room the floating nav takes. Screens run underneath it and pad
 * their scroll areas by these values; change the constants above when the
 * nav's size changes.
 */
export function useNavInsets(): NavInsets {
  const { width } = useWindowDimensions();
  const safe = useSafeAreaInsets();
  const wide = width >= WIDE_BREAKPOINT;
  const bottomGap = Math.max(EDGE_GAP, safe.bottom);
  return wide
    ? { wide, bottom: 0, left: SIDEBAR_SPACE + safe.left, bottomGap }
    : { wide, bottom: BAR_HEIGHT + bottomGap, left: 0, bottomGap };
}
