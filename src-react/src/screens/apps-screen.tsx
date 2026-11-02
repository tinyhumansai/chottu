import { Page } from "@/components/page";
import { askChottu } from "@/lib/ask-chottu";
import { cn } from "@/lib/utils";
import { MINI_APPS } from "@/mini-apps/registry";

/** Mini-apps Chottu can run. For now opening one asks Chottu in the chat. */
export function AppsScreen() {
  return (
    <Page title="Mini-apps">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {MINI_APPS.map((app) => (
          <button
            key={app.id}
            type="button"
            onClick={() => askChottu(app.prompt)}
            title={app.description}
            className="hover:bg-muted/60 flex flex-col items-center gap-2 rounded-2xl p-3 transition-colors"
          >
            <span className={cn("flex size-14 items-center justify-center rounded-2xl text-white shadow-sm", app.tint)}>
              <app.icon className="size-7" />
            </span>
            <span className="text-sm font-medium">{app.name}</span>
          </button>
        ))}
      </div>
    </Page>
  );
}
