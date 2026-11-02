import { Pressable, Text, View } from "react-native";
import { Page } from "@/components/page";
import { Icon } from "@/components/ui/icon";
import { askChottu } from "@/lib/ask-chottu";
import { cn } from "@/lib/utils";
import { MINI_APPS } from "@/mini-apps/registry";

/** Mini-apps: small task-focused apps. Each one asks Chottu for now. */
export function AppsScreen() {
  return (
    <Page title="Mini-apps" subtitle="Quick ways to get things done with Chottu.">
      <View className="flex-row flex-wrap gap-3">
        {MINI_APPS.map((app) => (
          <Pressable
            key={app.id}
            accessibilityRole="button"
            accessibilityLabel={app.name}
            accessibilityHint={app.description}
            onPress={() => askChottu(app.prompt)}
            className="bg-card active:bg-accent web:hover:bg-accent min-w-36 grow basis-[30%] gap-3 rounded-2xl p-4"
          >
            <View className={cn("size-11 items-center justify-center rounded-xl", app.tint)}>
              <Icon as={app.icon} className="size-5 text-white" />
            </View>
            <View>
              <Text className="text-foreground text-base font-semibold">{app.name}</Text>
              <Text className="text-muted-foreground text-sm" numberOfLines={2}>
                {app.description}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </Page>
  );
}
