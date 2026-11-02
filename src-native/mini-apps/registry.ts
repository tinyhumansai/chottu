import { Bus, CalendarDays, Film, Pizza, Plane, ShoppingBag, type LucideIcon } from "lucide-react";

export type MiniApp = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  /** Tile colour, a Tailwind background class. */
  tint: string;
  /** What opening the app asks Chottu, until mini-apps have their own UI. */
  prompt: string;
};

/** The mini-apps Chottu can open. Sample list until the registry comes from the backend. */
export const MINI_APPS: readonly MiniApp[] = [
  { id: "food", name: "Food", description: "Order from nearby restaurants", icon: Pizza, tint: "bg-orange-500", prompt: "I want to order food." },
  { id: "shop", name: "Shopping", description: "Find and buy things", icon: ShoppingBag, tint: "bg-pink-500", prompt: "Help me shop for something." },
  { id: "travel", name: "Travel", description: "Flights and hotels", icon: Plane, tint: "bg-sky-500", prompt: "Help me plan a trip." },
  { id: "transit", name: "Rides", description: "Cabs, autos and metro", icon: Bus, tint: "bg-emerald-500", prompt: "Book me a ride." },
  { id: "movies", name: "Movies", description: "Showtimes and tickets", icon: Film, tint: "bg-violet-500", prompt: "What movies are playing near me?" },
  { id: "calendar", name: "Calendar", description: "Plans and reminders", icon: CalendarDays, tint: "bg-amber-500", prompt: "What's on my calendar this week?" },
];
