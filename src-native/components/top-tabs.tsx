import { Pressable, Text, View } from "react-native";
import { cn } from "@/lib/utils";

export type TopTab<T extends string> = {
  id: T;
  label: string;
  /** Shown as a count beside the label when above zero. */
  count?: number;
};

type Props<T extends string> = {
  tabs: readonly TopTab<T>[];
  current: T;
  onSelect: (id: T) => void;
  accessibilityLabel: string;
};

/** A segmented tab bar for switching views within a page. */
export function TopTabs<T extends string>({ tabs, current, onSelect, accessibilityLabel }: Props<T>) {
  return (
    <View accessibilityRole="tablist" accessibilityLabel={accessibilityLabel} className="bg-card flex-row gap-1 rounded-full p-1">
      {tabs.map((tab) => {
        const selected = tab.id === current;
        const count = tab.count ?? 0;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={count > 0 ? `${tab.label}, ${count}` : tab.label}
            onPress={() => onSelect(tab.id)}
            className={cn(
              "flex-1 flex-row items-center justify-center gap-1.5 rounded-full px-2 py-2",
              selected ? "bg-background shadow-sm" : "active:bg-accent web:hover:bg-accent",
            )}
          >
            <Text numberOfLines={1} className={cn("text-sm", selected ? "text-foreground font-semibold" : "text-muted-foreground")}>
              {tab.label}
            </Text>
            {count > 0 && (
              <View className={cn("min-w-5 items-center rounded-full px-1.5", selected ? "bg-primary" : "bg-muted")}>
                <Text className={cn("text-xs leading-5 font-semibold", selected ? "text-primary-foreground" : "text-muted-foreground")}>
                  {count}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
