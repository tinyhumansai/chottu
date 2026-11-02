import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { useNavInsets } from "./layout";

/** A scrolling tab page with a large title. Content runs under the floating nav. */
export function Page({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const nav = useNavInsets();
  return (
    <ScrollView
      className="bg-background flex-1"
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: nav.bottom + 24, paddingHorizontal: 16 }}
    >
      <View className="mx-auto w-full max-w-[44rem] gap-6">
        <View className="gap-1">
          <Heading size="3xl">{title}</Heading>
          {subtitle && <Text className="text-muted-foreground">{subtitle}</Text>}
        </View>
        {children}
      </View>
    </ScrollView>
  );
}

/** A titled group of cards on a page. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text size="xs" className="text-muted-foreground px-1 font-medium tracking-widest uppercase">
        {title}
      </Text>
      {children}
    </View>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={cn("bg-card overflow-hidden rounded-2xl", className)}>{children}</View>;
}

/** Shown in a section with nothing in it. */
export function EmptyState({ icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <Card className="items-center gap-2 px-4 py-6">
      <Icon as={icon} className="text-muted-foreground size-5" />
      <Text className="text-muted-foreground text-center">{text}</Text>
    </Card>
  );
}
