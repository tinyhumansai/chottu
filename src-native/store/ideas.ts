import { create } from "zustand";

/**
 * Everything Chottu brings up on its own:
 * - suggestion: something Chottu thinks you might want to do
 * - schedule: a recurring task (cron) Chottu runs for you
 * - notification: something that happened and is worth knowing
 */
export type Idea =
  | { id: string; kind: "suggestion"; title: string; body: string; prompt: string; at: number }
  | { id: string; kind: "schedule"; title: string; body: string; cron: string; enabled: boolean; at: number }
  | { id: string; kind: "notification"; title: string; body: string; read: boolean; at: number };

type IdeasState = {
  ideas: Idea[];
  dismiss: (id: string) => void;
  toggleSchedule: (id: string) => void;
  markRead: (id: string) => void;
};

const hour = 60 * 60 * 1000;
const now = Date.now();

/** Sample data until Chottu's proactive backend exists. */
const SAMPLE: Idea[] = [
  { id: "s1", kind: "suggestion", title: "Cancel unused subscriptions", body: "3 subscriptions haven't been opened in 90 days. That's ₹1,347/mo.", prompt: "Which subscriptions am I not using, and can you cancel them?", at: now - hour },
  { id: "s2", kind: "suggestion", title: "Plan this weekend", body: "Saturday looks free and the weather's good.", prompt: "Help me plan something fun for Saturday.", at: now - 3 * hour },
  { id: "c1", kind: "schedule", title: "Morning brief", body: "Weather, calendar and news, every day.", cron: "0 8 * * *", enabled: true, at: now - 48 * hour },
  { id: "c2", kind: "schedule", title: "Weekly spending summary", body: "Where your money went this week.", cron: "0 19 * * 0", enabled: false, at: now - 72 * hour },
  { id: "n1", kind: "notification", title: "Payment received", body: "₹1,500 from Rahul for dinner.", read: false, at: now - 20 * 60 * 1000 },
  { id: "n2", kind: "notification", title: "Bill due tomorrow", body: "Airtel postpaid, ₹799.", read: true, at: now - 5 * hour },
];

const update = (ideas: Idea[], id: string, fn: (i: Idea) => Idea) => ideas.map((i) => (i.id === id ? fn(i) : i));

export const useIdeasStore = create<IdeasState>()((set) => ({
  ideas: SAMPLE,
  dismiss: (id) => set((s) => ({ ideas: s.ideas.filter((i) => i.id !== id) })),
  toggleSchedule: (id) =>
    set((s) => ({ ideas: update(s.ideas, id, (i) => (i.kind === "schedule" ? { ...i, enabled: !i.enabled } : i)) })),
  markRead: (id) =>
    set((s) => ({ ideas: update(s.ideas, id, (i) => (i.kind === "notification" ? { ...i, read: true } : i)) })),
}));

export const selectByKind = <K extends Idea["kind"]>(kind: K) => (s: Pick<IdeasState, "ideas">) =>
  s.ideas.filter((i): i is Extract<Idea, { kind: K }> => i.kind === kind).sort((a, b) => b.at - a.at);

/** Badge count for the nav: suggestions waiting plus unread notifications. */
export const selectUnseenCount = (s: IdeasState) =>
  s.ideas.filter((i) => i.kind === "suggestion" || (i.kind === "notification" && !i.read)).length;
