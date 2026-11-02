import { Lightbulb, MessageCircle, Settings, Shapes, Wallet } from "lucide-react";
import { AppNav, NAV_LEFT_SPACE, type Tab } from "@/components/app-nav";
import { CallScreen } from "@/components/call-screen";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useDeepLinkMessages } from "@/hooks/use-deep-link-messages";
import { cn } from "@/lib/utils";
import { AppsScreen } from "@/screens/apps-screen";
import { ChatScreen } from "@/screens/chat-screen";
import { IdeasScreen } from "@/screens/ideas-screen";
import { SettingsScreen } from "@/screens/settings-screen";
import { WalletScreen } from "@/screens/wallet-screen";
import { selectUnseenCount, useIdeasStore } from "@/store/ideas";
import { useApplyTheme } from "@/store/theme";
import { useUiStore, type TabId } from "@/store/ui";

const SCREENS: Record<TabId, () => React.JSX.Element> = {
  chat: ChatScreen,
  wallet: WalletScreen,
  ideas: IdeasScreen,
  apps: AppsScreen,
  settings: SettingsScreen,
};

export default function App() {
  useApplyTheme();
  useDeepLinkMessages();
  const tab = useUiStore((s) => s.tab);
  const setTab = useUiStore((s) => s.setTab);
  const unseenIdeas = useIdeasStore(selectUnseenCount);

  const tabs: readonly Tab<TabId>[] = [
    { id: "chat", label: "Chat", icon: MessageCircle },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "ideas", label: "Ideas", icon: Lightbulb, badge: unseenIdeas },
    { id: "apps", label: "Mini-apps", icon: Shapes },
    { id: "settings", label: "Settings", icon: Settings },
  ];
  const Screen = SCREENS[tab];

  return (
    <TooltipProvider>
      <div className={cn("text-foreground flex h-dvh flex-col", tab === "chat" ? "chat-wallpaper" : "bg-background")}>
        {/* Screens run under the floating nav; each one pads its own content. */}
        <main className="flex min-h-0 flex-1 flex-col" style={{ paddingLeft: NAV_LEFT_SPACE }}>
          <Screen />
        </main>
        <AppNav tabs={tabs} active={tab} onChange={setTab} />
        <CallScreen />
      </div>
    </TooltipProvider>
  );
}
