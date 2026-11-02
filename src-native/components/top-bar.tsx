import { PhoneIcon } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/icon";
import { ChottuAvatar } from "./chottu-avatar";

/**
 * The chat's floating header: Chottu's avatar and name in a centred pill and
 * a call button beside it. There is no header bar; messages scroll under it.
 */
export function TopBar({ onCall }: { onCall: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" className="absolute inset-x-0 top-0 items-center" style={{ paddingTop: insets.top + 8 }}>
      <View pointerEvents="box-none" className="flex-row items-center">
        <View className="bg-glass border-border/60 flex-row items-center gap-2 rounded-full border py-1 pr-4 pl-1 shadow-sm">
          <ChottuAvatar size={36} />
          <Text className="text-foreground text-base font-semibold">Chottu</Text>
        </View>
        {/* Hangs off the pill's right edge so the name stays centred. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Call Chottu"
          onPress={onCall}
          className="bg-glass border-border/60 active:bg-accent absolute left-full ml-2 size-11 items-center justify-center rounded-full border shadow-sm"
        >
          <Icon as={PhoneIcon} className="text-foreground size-5" />
        </Pressable>
      </View>
    </View>
  );
}
