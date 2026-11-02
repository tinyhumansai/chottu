import { Menu, SquarePen } from "lucide-react";
import { TopBarButton } from "@/components/top-bar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatStore } from "@/store/chat";

/** The hamburger menu in the top bar's corner. */
export function AppMenu() {
  const clear = useChatStore((s) => s.clear);
  const isEmpty = useChatStore((s) => s.messages.length === 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <TopBarButton label="Menu">
          <Menu />
        </TopBarButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="min-w-44">
        <DropdownMenuItem onSelect={clear} disabled={isEmpty}>
          <SquarePen />
          New chat
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
