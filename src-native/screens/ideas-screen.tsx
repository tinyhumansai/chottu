import { BellIcon, CalendarClockIcon, LightbulbIcon, SparklesIcon, XIcon } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Card, EmptyState, Page } from "@/components/page";
import { TopTabs, type TopTab } from "@/components/top-tabs";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Icon } from "@/components/ui/icon";
import { Switch } from "@/components/ui/switch";
import { askChottu } from "@/lib/ask-chottu";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import { selectByKind, useIdeasStore, type Idea } from "@/store/ideas";

type IdeasTab = "suggestions" | "schedules" | "notifications";
type Suggestion = Extract<Idea, { kind: "suggestion" }>;
type Schedule = Extract<Idea, { kind: "schedule" }>;
type Notice = Extract<Idea, { kind: "notification" }>;

const selectSuggestions = selectByKind("suggestion");
const selectSchedules = selectByKind("schedule");
const selectNotifications = selectByKind("notification");

/**
 * Everything Chottu brings up on its own, one tab each: suggestions,
 * schedules (crons) and notifications.
 */
export function IdeasScreen() {
  const [tab, setTab] = useState<IdeasTab>("suggestions");
  const ideas = useIdeasStore((s) => s.ideas);
  const suggestions = selectSuggestions({ ideas });
  const schedules = selectSchedules({ ideas });
  const notifications = selectNotifications({ ideas });

  const tabs: readonly TopTab<IdeasTab>[] = [
    { id: "suggestions", label: "Suggestions", count: suggestions.length },
    { id: "schedules", label: "Schedules", count: schedules.filter((s) => s.enabled).length },
    { id: "notifications", label: "Notifications", count: notifications.filter((n) => !n.read).length },
  ];

  return (
    <Page
      title="Ideas"
      subtitle="What Chottu noticed, and what it runs for you."
      toolbar={<TopTabs tabs={tabs} current={tab} onSelect={setTab} accessibilityLabel="Ideas" />}
    >
      {tab === "suggestions" && <Suggestions items={suggestions} />}
      {tab === "schedules" && <Schedules items={schedules} />}
      {tab === "notifications" && <Notifications items={notifications} />}
    </Page>
  );
}

function Suggestions({ items }: { items: Suggestion[] }) {
  const dismiss = useIdeasStore((s) => s.dismiss);
  if (items.length === 0) return <EmptyState icon={LightbulbIcon} text="You're all caught up." />;
  return (
    <View className="gap-2">
      {items.map((s) => (
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
    </View>
  );
}

function Schedules({ items }: { items: Schedule[] }) {
  const toggleSchedule = useIdeasStore((s) => s.toggleSchedule);
  if (items.length === 0) return <EmptyState icon={CalendarClockIcon} text="Nothing scheduled." />;
  return (
    <Card>
      {items.map((s, i) => (
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
  );
}

function Notifications({ items }: { items: Notice[] }) {
  const markRead = useIdeasStore((s) => s.markRead);
  if (items.length === 0) return <EmptyState icon={BellIcon} text="No notifications." />;
  return (
    <Card>
      {items.map((n, i) => (
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
  );
}
