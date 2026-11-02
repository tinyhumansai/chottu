import { describe, expect, it } from "vitest";
import { selectBalance, selectPendingOut, selectRecent, type Transaction } from "./wallet";

const tx = (id: string, amount: number, status: Transaction["status"], at = 0): Transaction => ({
  id, title: id, detail: "", amount, status, at,
});

describe("wallet selectors", () => {
  const transactions = [
    tx("salary", 100_00, "completed", 1),
    tx("food", -30_00, "completed", 3),
    tx("transfer", -20_00, "pending", 2),
    tx("refund-failed", 5_00, "failed", 4),
  ];

  it("balance counts only completed transactions", () => {
    expect(selectBalance({ transactions })).toBe(70_00);
  });

  it("pending out is the pending debits, as a positive number", () => {
    expect(selectPendingOut({ transactions })).toBe(20_00);
  });

  it("recent lists newest first without mutating the store's array", () => {
    expect(selectRecent({ transactions }).map((t) => t.id)).toEqual(["refund-failed", "food", "transfer", "salary"]);
    expect(transactions[0].id).toBe("salary");
  });
});
