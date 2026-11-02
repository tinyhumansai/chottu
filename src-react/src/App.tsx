import { useState } from "react";
import { MessageCircle, Settings } from "lucide-react";
import { BOTTOM_BAR_SPACE, BottomBar, type Tab } from "@/components/bottom-bar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useDeepLinkMessages } from "@/hooks/use-deep-link-messages";
import { ChatScreen } from "@/screens/chat-screen";
import { SettingsScreen } from "@/screens/settings-screen";
import { useApplyTheme } from "@/store/theme";

type TabId = "chat" | "settings";

const TABS: readonly Tab<TabId>[] = [
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function App() {
  useApplyTheme();
  useDeepLinkMessages();
  const [tab, setTab] = useState<TabId>("chat");

  return (
    <TooltipProvider>
      <div className="bg-background text-foreground flex h-dvh flex-col">
        <main className="flex min-h-0 flex-1 flex-col" style={{ paddingBottom: BOTTOM_BAR_SPACE }}>
          {tab === "chat" ? <ChatScreen /> : <SettingsScreen />}
        </main>
        <BottomBar tabs={TABS} active={tab} onChange={setTab} />
      </div>
    </TooltipProvider>
  );
}
