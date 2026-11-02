import type { LucideIcon } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { BAR_HEIGHT, EDGE_GAP, useNavInsets } from "./layout";

export type NavTab<T extends string> = {
  id: T;
  label: string;
  icon: LucideIcon;
  /** Shown as a count on the icon when above zero. */
  badge?: number;
};

type Props<T extends string> = {
  tabs: readonly NavTab<T>[];
  current: T;
  onSelect: (id: T) => void;
};

/**
 * Floating navigation: a bottom tab bar on phones, a left sidebar from the
 * wide breakpoint up. Screens run underneath it; see `useNavInsets`.
 */
export function AppNav<T extends string>({ tabs, current, onSelect }: Props<T>) {
  const nav = useNavInsets();
  const items = tabs.map((tab) => (
    <NavButton key={tab.id} tab={tab} selected={tab.id === current} onPress={() => onSelect(tab.id)} wide={nav.wide} />
  ));

  if (nav.wide) {
    return (
      <View pointerEvents="box-none" className="absolute inset-y-0 justify-center" style={{ left: EDGE_GAP }}>
        <View accessibilityRole="tablist" className="bg-glass border-border/60 gap-1 rounded-[28px] border p-1 shadow-md">
          {items}
        </View>
      </View>
    );
  }

  return (
    <View pointerEvents="box-none" className="absolute inset-x-0 items-center" style={{ bottom: nav.bottomGap, paddingHorizontal: EDGE_GAP }}>
      <View
        accessibilityRole="tablist"
        className="bg-glass border-border/60 w-full max-w-[44rem] flex-row rounded-full border p-1 shadow-md"
        style={{ height: BAR_HEIGHT }}
      >
        {items}
      </View>
    </View>
  );
}

function NavButton<T extends string>({ tab, selected, onPress, wide }: { tab: NavTab<T>; selected: boolean; onPress: () => void; wide: boolean }) {
  const badge = tab.badge ?? 0;
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected }}
      onPress={onPress}
      className={cn(
        "items-center justify-center rounded-full",
        wide ? "size-12" : "flex-1",
        selected ? "bg-secondary" : "active:bg-accent web:hover:bg-accent",
      )}
    >
      <View>
        <Icon as={tab.icon} className={cn("size-[22px]", selected ? "text-foreground" : "text-muted-foreground")} />
        {badge > 0 && (
          <View className="bg-destructive absolute -top-1.5 -right-2 min-w-4 items-center rounded-full px-1">
            <Text className="text-[10px] leading-4 font-semibold text-white">{badge}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
