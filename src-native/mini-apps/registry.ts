import {
  BusIcon,
  CalendarDaysIcon,
  FilmIcon,
  PizzaIcon,
  PlaneIcon,
  ShoppingBagIcon,
  type LucideIcon,
} from "lucide-react-native";

export type MiniApp = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  /** Tile colour, a Tailwind background class. Saturated enough for both themes. */
  tint: string;
  /** What opening the app asks Chottu, until mini-apps have their own UI. */
  prompt: string;
};

/** The mini-apps Chottu can open. Sample list until the registry comes from the backend. */
export const MINI_APPS: readonly MiniApp[] = [
  { id: "food", name: "Food", description: "Order from nearby restaurants", icon: PizzaIcon, tint: "bg-orange-500", prompt: "I want to order food." },
  { id: "shop", name: "Shopping", description: "Find and buy things", icon: ShoppingBagIcon, tint: "bg-pink-500", prompt: "Help me shop for something." },
  { id: "travel", name: "Travel", description: "Flights and hotels", icon: PlaneIcon, tint: "bg-sky-500", prompt: "Help me plan a trip." },
  { id: "transit", name: "Rides", description: "Cabs, autos and metro", icon: BusIcon, tint: "bg-emerald-500", prompt: "Book me a ride." },
  { id: "movies", name: "Movies", description: "Showtimes and tickets", icon: FilmIcon, tint: "bg-violet-500", prompt: "What movies are playing near me?" },
  { id: "calendar", name: "Calendar", description: "Plans and reminders", icon: CalendarDaysIcon, tint: "bg-amber-500", prompt: "What's on my calendar this week?" },
];
