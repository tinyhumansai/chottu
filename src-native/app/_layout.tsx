import "@/global.css";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaListener, SafeAreaProvider } from "react-native-safe-area-context";
import { Uniwind } from "uniwind";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { useThemeStore } from "@/store/theme";

export default function RootLayout() {
  const theme = useThemeStore((s) => s.theme);
  return (
    <SafeAreaProvider>
      {/* Lets Uniwind's safe-area utilities follow the device insets. */}
      <SafeAreaListener onChange={({ insets }) => Uniwind.updateInsets(insets)}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <GluestackUIProvider mode={theme}>
            <Slot />
            <StatusBar style="auto" />
          </GluestackUIProvider>
        </GestureHandlerRootView>
      </SafeAreaListener>
    </SafeAreaProvider>
  );
}
