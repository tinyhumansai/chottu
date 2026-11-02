import { Bell, CalendarClock, Sparkles, X } from "lucide-react";
import { Card, EmptyState, Page, Section } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { askChottu } from "@/lib/ask-chottu";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import { selectByKind, useIdeasStore } from "@/store/ideas";
import { useShallow } from "zustand/react/shallow";

/** Suggestions, schedules (crons) and notifications: everything Chottu brings up on its own. */
export function IdeasScreen() {
  const suggestions = useIdeasStore(useShallow(selectByKind("suggestion")));
  const schedules = useIdeasStore(useShallow(selectByKind("schedule")));
  const notifications = useIdeasStore(useShallow(selectByKind("notification")));
  const { dismiss, toggleSchedule, markRead } = useIdeasStore();

  return (
    <Page title="Ideas">
      <Section title="Suggestions">
        {suggestions.length === 0 && <EmptyState>Nothing new. Chottu will suggest things here.</EmptyState>}
        {suggestions.map((s) => (
          <Card key={s.id} className="flex flex-col gap-3 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{s.title}</p>
                <p className="text-muted-foreground text-sm">{s.body}</p>
              </div>
              <button
                type="button"
                aria-label={`Dismiss ${s.title}`}
                onClick={() => dismiss(s.id)}
                className="text-muted-foreground hover:text-foreground -m-1 rounded-full p-1"
              >
                <X className="size-4" />
              </button>
            </div>
            <Button
              size="sm"
              className="self-end rounded-full"
              onClick={() => {
                askChottu(s.prompt);
                dismiss(s.id);
              }}
            >
              Ask Chottu
            </Button>
          </Card>
        ))}
      </Section>

      <Section title="Scheduled">
        <Card className="divide-y">
          {schedules.length === 0 && (
            <div className="p-4">
              <EmptyState>No scheduled tasks.</EmptyState>
            </div>
          )}
          {schedules.map((c) => (
            <label key={c.id} className="flex cursor-pointer items-center gap-3 p-3">
              <CalendarClock className="text-muted-foreground size-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{c.title}</p>
                <p className="text-muted-foreground text-sm">{c.body}</p>
                <code className="text-muted-foreground text-xs whitespace-nowrap">{c.cron}</code>
              </div>
              <Switch checked={c.enabled} onCheckedChange={() => toggleSchedule(c.id)} aria-label={c.title} />
            </label>
          ))}
        </Card>
      </Section>

      <Section title="Notifications">
        <Card className="divide-y">
          {notifications.length === 0 && (
            <div className="p-4">
              <EmptyState>You're all caught up.</EmptyState>
            </div>
          )}
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => markRead(n.id)}
              className="hover:bg-muted/50 flex w-full items-start gap-3 p-3 text-left first:rounded-t-xl last:rounded-b-xl"
            >
              <Bell className={cn("mt-0.5 size-4 shrink-0", n.read ? "text-muted-foreground" : "text-sky-500")} />
              <div className="min-w-0 flex-1">
                <p className={cn("font-medium", n.read && "text-muted-foreground")}>{n.title}</p>
                <p className="text-muted-foreground text-sm">{n.body}</p>
              </div>
              <span className="text-muted-foreground shrink-0 text-xs">{timeAgo(n.at)}</span>
              {!n.read && <span aria-label="Unread" className="mt-1.5 size-2 shrink-0 rounded-full bg-sky-500" />}
            </button>
          ))}
        </Card>
      </Section>
    </Page>
  );
}
