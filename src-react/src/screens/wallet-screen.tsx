import { ArrowDownLeft, ArrowUpRight, Sparkles } from "lucide-react";
import { Card, EmptyState, Page, Section } from "@/components/page";
import { Button } from "@/components/ui/button";
import { askChottu } from "@/lib/ask-chottu";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import {
  formatMoney,
  selectBalance,
  selectPendingOut,
  selectRecent,
  useWalletStore,
  type Transaction,
} from "@/store/wallet";

export function WalletScreen() {
  const currency = useWalletStore((s) => s.currency);
  const balance = useWalletStore(selectBalance);
  const pendingOut = useWalletStore(selectPendingOut);
  const transactions = useWalletStore((s) => s.transactions);
  const recent = selectRecent({ transactions });

  return (
    <Page title="Wallet">
      <Card className="flex flex-col gap-4 bg-gradient-to-br from-sky-600 to-indigo-700 p-5 text-white">
        <div>
          <p className="text-sm text-white/70">Balance</p>
          <p className="text-3xl font-semibold tracking-tight">{formatMoney(balance, currency)}</p>
          {pendingOut > 0 && (
            <p className="mt-1 text-sm text-white/70">{formatMoney(pendingOut, currency)} pending</p>
          )}
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="self-start rounded-full"
          onClick={() => askChottu("Where did my money go this month?")}
        >
          <Sparkles />
          Ask Chottu about my spending
        </Button>
      </Card>

      <Section title="Transactions">
        <Card className="divide-y">
          {recent.length === 0 ? (
            <div className="p-4">
              <EmptyState>No transactions yet.</EmptyState>
            </div>
          ) : (
            recent.map((tx) => <TransactionRow key={tx.id} tx={tx} currency={currency} />)
          )}
        </Card>
      </Section>
    </Page>
  );
}

function TransactionRow({ tx, currency }: { tx: Transaction; currency: string }) {
  const incoming = tx.amount > 0;
  const Icon = incoming ? ArrowDownLeft : ArrowUpRight;
  return (
    <div className="flex items-center gap-3 p-3">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          incoming ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{tx.title}</p>
        <p className="text-muted-foreground truncate text-sm">
          {tx.detail} · {timeAgo(tx.at)}
        </p>
      </div>
      <div className="text-right">
        <p
          className={cn(
            "font-medium tabular-nums",
            incoming && "text-emerald-600 dark:text-emerald-400",
            tx.status === "failed" && "text-muted-foreground line-through",
          )}
        >
          {incoming ? "+" : "−"}
          {formatMoney(Math.abs(tx.amount), currency)}
        </p>
        {tx.status !== "completed" && (
          <p className={cn("text-xs capitalize", tx.status === "failed" ? "text-destructive" : "text-muted-foreground")}>
            {tx.status}
          </p>
        )}
      </div>
    </div>
  );
}
