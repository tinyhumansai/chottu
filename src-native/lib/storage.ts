import AsyncStorage from "@react-native-async-storage/async-storage";
import { createJSONStorage } from "zustand/middleware";

/**
 * Where persisted stores live: AsyncStorage on iOS and Android, localStorage
 * on web (and so in the desktop app's webview).
 */
export const appStorage = createJSONStorage(() => AsyncStorage);
