import { create } from "zustand";

export type TransactionStatus = "completed" | "pending" | "failed";

export type Transaction = {
  id: string;
  title: string;
  /** Category or counterparty shown under the title. */
  detail: string;
  /** Signed amount in minor units (paise/cents): positive is money in, negative is money out. */
  amount: number;
  status: TransactionStatus;
  at: number;
};

type WalletState = {
  currency: string;
  transactions: Transaction[];
  addTransaction: (tx: Transaction) => void;
};

const day = 24 * 60 * 60 * 1000;
const now = Date.now();

/** Sample data until the wallet backend exists. */
const SAMPLE: Transaction[] = [
  { id: "t1", title: "Salary", detail: "Acme Corp", amount: 8_500_000, status: "completed", at: now - 6 * day },
  { id: "t2", title: "Swiggy", detail: "Food", amount: -48_000, status: "completed", at: now - 2 * day },
  { id: "t3", title: "Electricity bill", detail: "Utilities", amount: -215_000, status: "completed", at: now - day },
  { id: "t4", title: "Sent to Priya", detail: "UPI", amount: -150_000, status: "pending", at: now - 3 * 60 * 60 * 1000 },
  { id: "t5", title: "Netflix", detail: "Subscription", amount: -64_900, status: "failed", at: now - 60 * 60 * 1000 },
];

export const useWalletStore = create<WalletState>()((set) => ({
  currency: "INR",
  transactions: SAMPLE,
  addTransaction: (tx) => set((s) => ({ transactions: [...s.transactions, tx] })),
}));

/** Balance in minor units: every completed transaction, summed. Pending and failed ones don't count. */
export const selectBalance = (s: Pick<WalletState, "transactions">) =>
  s.transactions.filter((t) => t.status === "completed").reduce((sum, t) => sum + t.amount, 0);

/** Money that is on its way out (pending debits), in minor units, as a positive number. */
export const selectPendingOut = (s: Pick<WalletState, "transactions">) =>
  -s.transactions.filter((t) => t.status === "pending" && t.amount < 0).reduce((sum, t) => sum + t.amount, 0);

/** Newest first. */
export const selectRecent = (s: Pick<WalletState, "transactions">) =>
  [...s.transactions].sort((a, b) => b.at - a.at);

export function formatMoney(minor: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(minor / 100);
}
