import { create } from "zustand";

export type TabId = "chat" | "wallet" | "ideas" | "apps" | "settings";

type UiState = {
  tab: TabId;
  setTab: (tab: TabId) => void;
};

/** App navigation state, so any screen can switch tabs (e.g. "ask Chottu" jumps to chat). */
export const useUiStore = create<UiState>()((set) => ({
  tab: "chat",
  setTab: (tab) => set({ tab }),
}));
