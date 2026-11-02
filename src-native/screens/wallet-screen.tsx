import { ArrowDownLeftIcon, ArrowUpRightIcon, ReceiptTextIcon, SparklesIcon } from "lucide-react-native";
import { Text, View } from "react-native";
import { Card, EmptyState, Page, Section } from "@/components/page";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Icon } from "@/components/ui/icon";
import { askChottu } from "@/lib/ask-chottu";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import { formatMoney, selectBalance, selectPendingOut, selectRecent, useWalletStore, type Transaction } from "@/store/wallet";

export function WalletScreen() {
  const currency = useWalletStore((s) => s.currency);
  const balance = useWalletStore(selectBalance);
  const pendingOut = useWalletStore(selectPendingOut);
  const transactions = useWalletStore((s) => s.transactions);
  const recent = selectRecent({ transactions });

  return (
    <Page title="Wallet">
      <Card className="bg-primary gap-4 p-5">
        <View>
          <Text className="text-primary-foreground/70 text-sm">Balance</Text>
          <Text className="text-primary-foreground text-4xl font-semibold tracking-tight">{formatMoney(balance, currency)}</Text>
          {pendingOut > 0 && <Text className="text-primary-foreground/70 mt-1 text-sm">{formatMoney(pendingOut, currency)} pending</Text>}
        </View>
        <Button variant="secondary" size="sm" className="self-start rounded-full" onPress={() => askChottu("Where did my money go this month?")}>
          <ButtonIcon as={SparklesIcon} />
          <ButtonText>Ask Chottu about my spending</ButtonText>
        </Button>
      </Card>

      <Section title="Transactions">
        {recent.length === 0 ? (
          <EmptyState icon={ReceiptTextIcon} text="No transactions yet." />
        ) : (
          <Card>
            {recent.map((tx, i) => (
              <View key={tx.id}>
                {i > 0 && <Divider className="ml-16" />}
                <TransactionRow tx={tx} currency={currency} />
              </View>
            ))}
          </Card>
        )}
      </Section>
    </Page>
  );
}

function TransactionRow({ tx, currency }: { tx: Transaction; currency: string }) {
  const incoming = tx.amount > 0;
  return (
    <View className="flex-row items-center gap-3 px-4 py-3">
      <View className="bg-muted size-10 items-center justify-center rounded-full">
        <Icon as={incoming ? ArrowDownLeftIcon : ArrowUpRightIcon} className="text-muted-foreground size-5" />
      </View>
      <View className="flex-1">
        <Text className="text-foreground text-base">{tx.title}</Text>
        <Text className="text-muted-foreground text-sm">
          {tx.detail} · {timeAgo(tx.at)}
        </Text>
      </View>
      <View className="items-end">
        <Text
          className={cn(
            "text-base font-semibold",
            tx.status === "failed" ? "text-muted-foreground line-through" : incoming ? "text-money-in" : "text-foreground",
          )}
        >
          {incoming ? "+" : ""}
          {formatMoney(tx.amount, currency)}
        </Text>
        {tx.status !== "completed" && (
          <Text className={cn("text-xs", tx.status === "failed" ? "text-destructive" : "text-muted-foreground")}>
            {tx.status === "failed" ? "Failed" : "Pending"}
          </Text>
        )}
      </View>
    </View>
  );
}
