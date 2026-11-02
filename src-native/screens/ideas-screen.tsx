import { BellIcon, CalendarClockIcon, LightbulbIcon, SparklesIcon, XIcon } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { Card, EmptyState, Page, Section } from "@/components/page";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Icon } from "@/components/ui/icon";
import { Switch } from "@/components/ui/switch";
import { askChottu } from "@/lib/ask-chottu";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import { selectByKind, useIdeasStore } from "@/store/ideas";

const selectSuggestions = selectByKind("suggestion");
const selectSchedules = selectByKind("schedule");
const selectNotifications = selectByKind("notification");

/** Everything Chottu brings up on its own: suggestions, schedules (crons) and notifications. */
export function IdeasScreen() {
  const ideas = useIdeasStore((s) => s.ideas);
  const { dismiss, toggleSchedule, markRead } = useIdeasStore.getState();
  const suggestions = selectSuggestions({ ideas } as Parameters<typeof selectSuggestions>[0]);
  const schedules = selectSchedules({ ideas } as Parameters<typeof selectSchedules>[0]);
  const notifications = selectNotifications({ ideas } as Parameters<typeof selectNotifications>[0]);

  return (
    <Page title="Ideas" subtitle="What Chottu noticed, and what it runs for you.">
      <Section title="Suggestions">
        {suggestions.length === 0 && <EmptyState icon={LightbulbIcon} text="You're all caught up." />}
        {suggestions.map((s) => (
          <Card key={s.id} className="gap-2 p-4">
            <View className="flex-row items-start gap-2">
              <Text className="text-foreground flex-1 text-base font-semibold">{s.title}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" hitSlop={8} onPress={() => dismiss(s.id)}>
                <Icon as={XIcon} className="text-muted-foreground size-4" />
              </Pressable>
            </View>
            <Text className="text-muted-foreground text-sm">{s.body}</Text>
            <View className="flex-row items-center justify-between pt-1">
              <Text className="text-muted-foreground text-xs">{timeAgo(s.at)}</Text>
              <Button
                size="sm"
                variant="secondary"
                className="rounded-full"
                onPress={() => {
                  dismiss(s.id);
                  askChottu(s.prompt);
                }}
              >
                <ButtonIcon as={SparklesIcon} />
                <ButtonText>Ask Chottu</ButtonText>
              </Button>
            </View>
          </Card>
        ))}
      </Section>

      <Section title="Schedules">
        {schedules.length === 0 ? (
          <EmptyState icon={CalendarClockIcon} text="Nothing scheduled." />
        ) : (
          <Card>
            {schedules.map((s, i) => (
              <View key={s.id}>
                {i > 0 && <Divider />}
                <View className="flex-row items-center gap-3 px-4 py-3">
                  <View className="flex-1">
                    <Text className="text-foreground text-base">{s.title}</Text>
                    <Text className="text-muted-foreground text-sm">{s.body}</Text>
                    <Text className="text-muted-foreground font-mono text-xs" numberOfLines={1}>
                      {s.cron}
                    </Text>
                  </View>
                  <Switch value={s.enabled} onValueChange={() => toggleSchedule(s.id)} accessibilityLabel={`${s.title} schedule`} />
                </View>
              </View>
            ))}
          </Card>
        )}
      </Section>

      <Section title="Notifications">
        {notifications.length === 0 ? (
          <EmptyState icon={BellIcon} text="No notifications." />
        ) : (
          <Card>
            {notifications.map((n, i) => (
              <View key={n.id}>
                {i > 0 && <Divider className="ml-12" />}
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: n.read }}
                  onPress={() => markRead(n.id)}
                  className="active:bg-accent flex-row gap-3 px-4 py-3"
                >
                  <View>
                    <Icon as={BellIcon} className="text-muted-foreground size-5" />
                    {!n.read && <View className="bg-destructive absolute -top-0.5 -right-0.5 size-2 rounded-full" />}
                  </View>
                  <View className="flex-1">
                    <Text className={cn("text-foreground text-base", !n.read && "font-semibold")}>{n.title}</Text>
                    <Text className="text-muted-foreground text-sm">{n.body}</Text>
                    <Text className="text-muted-foreground text-xs">{timeAgo(n.at)}</Text>
                  </View>
                </Pressable>
              </View>
            ))}
          </Card>
        )}
      </Section>
    </Page>
  );
}
