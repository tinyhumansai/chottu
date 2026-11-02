import { LightbulbIcon, MessageCircleIcon, SettingsIcon, ShapesIcon, WalletIcon } from "lucide-react-native";
import type { JSX } from "react";
import { Platform, View } from "react-native";
import { AppNav, type NavTab } from "@/components/app-nav";
import { CallScreen } from "@/components/call-screen";
import { useDeepLinkMessages } from "@/hooks/use-deep-link-messages";
import { AppsScreen } from "@/screens/apps-screen";
import { ChatScreen } from "@/screens/chat-screen";
import { IdeasScreen } from "@/screens/ideas-screen";
import { SettingsScreen } from "@/screens/settings-screen";
import { WalletScreen } from "@/screens/wallet-screen";
import { selectUnseenCount, useIdeasStore } from "@/store/ideas";
import { useChatStore } from "@/store/chat";
import { useUiStore, type TabId } from "@/store/ui";

// Development web builds: poke the chat from the browser console.
if (__DEV__ && Platform.OS === "web") Object.assign(globalThis, { chottuChat: useChatStore });

const SCREENS: Record<TabId, () => JSX.Element> = {
  chat: ChatScreen,
  wallet: WalletScreen,
  ideas: IdeasScreen,
  apps: AppsScreen,
  settings: SettingsScreen,
};

/** The app shell: the current tab's screen under the floating nav, plus the call overlay. */
export default function Home() {
  useDeepLinkMessages();
  const tab = useUiStore((s) => s.tab);
  const setTab = useUiStore((s) => s.setTab);
  const unseenIdeas = useIdeasStore(selectUnseenCount);

  const tabs: readonly NavTab<TabId>[] = [
    { id: "chat", label: "Chat", icon: MessageCircleIcon },
    { id: "wallet", label: "Wallet", icon: WalletIcon },
    { id: "ideas", label: "Ideas", icon: LightbulbIcon, badge: unseenIdeas },
    { id: "apps", label: "Mini-apps", icon: ShapesIcon },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];
  const Screen = SCREENS[tab];

  return (
    <View className="bg-background flex-1">
      {/* Screens run under the floating nav; each one pads its own content by `useNavInsets`. */}
      <Screen />
      <AppNav tabs={tabs} current={tab} onSelect={setTab} />
      <CallScreen />
    </View>
  );
}
