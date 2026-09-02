import prisma from "../../../shared/prisma";

// 1. Get user's personal financial transactions ledger
const getMyTransactions = async (userId: string) => {
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return transactions.map((tx) => ({
    id: tx.id,
    type: tx.type, // "DEPOSIT" | "PURCHASE" | "REFUND"
    amount: Number(tx.amount),
    balanceBefore: Number(tx.balanceBefore),
    balanceAfter: Number(tx.balanceAfter),
    currency: tx.currency,
    status: tx.status,
    paymentMethod: tx.paymentMethod,
    referenceId: tx.referenceId,
    description: tx.description,
    createdAt: tx.createdAt,
  }));
};

export const TransactionService = {
  getMyTransactions,
};
