import { create } from "zustand";
import { persist } from "zustand/middleware";
import { appStorage } from "@/lib/storage";

export type ThemePreference = "system" | "light" | "dark";

type ThemeState = {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
};

/**
 * The light/dark preference. The root layout hands it to
 * `GluestackUIProvider`, which switches Uniwind's theme; nothing else reads
 * the colour scheme.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme) => set({ theme }),
    }),
    { name: "chottu-theme", storage: appStorage },
  ),
);
