import { create } from "zustand";

export type CallStatus = "idle" | "connecting" | "connected" | "ended";

type CallState = {
  status: CallStatus;
  /** When the call connected (ms epoch), for the timer. */
  connectedAt: number | null;
  muted: boolean;
  start: () => void;
  end: () => void;
  toggleMute: () => void;
};

/** How long the mock call takes to "connect". Replace with a real voice session. */
export const MOCK_CONNECT_MS = 1500;
const ENDED_LINGER_MS = 800;

let timer: ReturnType<typeof setTimeout> | undefined;

/** A voice call with Chottu. Connection is mocked; the UI and state machine are real. */
export const useCallStore = create<CallState>()((set, get) => ({
  status: "idle",
  connectedAt: null,
  muted: false,

  start() {
    if (get().status === "connecting" || get().status === "connected") return;
    clearTimeout(timer);
    set({ status: "connecting", connectedAt: null, muted: false });
    timer = setTimeout(() => {
      if (get().status === "connecting") set({ status: "connected", connectedAt: Date.now() });
    }, MOCK_CONNECT_MS);
  },

  end() {
    if (get().status === "idle") return;
    clearTimeout(timer);
    set({ status: "ended" });
    timer = setTimeout(() => set({ status: "idle", connectedAt: null, muted: false }), ENDED_LINGER_MS);
  },

  toggleMute() {
    if (get().status === "connected") set((s) => ({ muted: !s.muted }));
  },
}));
