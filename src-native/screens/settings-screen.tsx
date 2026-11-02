import { MonitorIcon, MoonIcon, SunIcon, type LucideIcon } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Card, Page, Section } from "@/components/page";
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chat";
import { useThemeStore, type ThemePreference } from "@/store/theme";
import { useUiStore } from "@/store/ui";
import { demoConversation } from "@/voice-notes/demo";

const THEMES: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
  { value: "system", label: "System", icon: MonitorIcon },
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
];

export function SettingsScreen() {
  return (
    <Page title="Settings">
      <Section title="Appearance">
        <Card className="p-1.5">
          <ThemePicker />
        </Card>
      </Section>
      <Section title="Chat history">
        <ChatHistory />
      </Section>
    </Page>
  );
}

function ThemePicker() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Theme" className="flex-row gap-1">
      {THEMES.map((t) => {
        const selected = t.value === theme;
        return (
          <Pressable
            key={t.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => setTheme(t.value)}
            className={cn("flex-1 flex-row items-center justify-center gap-2 rounded-xl py-2.5", selected ? "bg-background shadow-sm" : "active:bg-accent")}
          >
            <Icon as={t.icon} className={cn("size-4", selected ? "text-foreground" : "text-muted-foreground")} />
            <Text className={cn("text-sm", selected ? "text-foreground font-medium" : "text-muted-foreground")}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ChatHistory() {
  const count = useChatStore((s) => s.messages.length);
  const [confirming, setConfirming] = useState(false);

  const loadSample = () => {
    const chat = useChatStore.getState();
    chat.clear();
    for (const m of demoConversation()) chat.register(m);
    useUiStore.getState().setTab("chat");
  };

  return (
    <Card>
      <Row title="Clear conversation" detail={`${count} message${count === 1 ? "" : "s"} on this device`}>
        <Button size="sm" variant="outline" onPress={() => setConfirming(true)} isDisabled={count === 0}>
          <ButtonText>Clear</ButtonText>
        </Button>
      </Row>
      {__DEV__ && (
        <Row title="Sample chat" detail="Development builds: a chat with voice notes">
          <Button size="sm" variant="outline" onPress={loadSample}>
            <ButtonText>Load</ButtonText>
          </Button>
        </Row>
      )}
      <AlertDialog isOpen={confirming} onClose={() => setConfirming(false)}>
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Heading size="md">Clear conversation?</Heading>
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text className="text-muted-foreground text-sm">Every message on this device is removed. This can't be undone.</Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button variant="outline" size="sm" onPress={() => setConfirming(false)}>
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onPress={() => {
                useChatStore.getState().clear();
                setConfirming(false);
              }}
            >
              <ButtonText>Clear</ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function Row({ title, detail, children }: { title: string; detail: string; children: React.ReactNode }) {
  return (
    <View className="flex-row items-center gap-3 px-4 py-3">
      <View className="flex-1">
        <Text className="text-foreground text-base">{title}</Text>
        <Text className="text-muted-foreground text-sm">{detail}</Text>
      </View>
      {children}
    </View>
  );
}
