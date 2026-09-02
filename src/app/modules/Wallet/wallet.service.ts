import { PaymentGateway, Prisma } from "@prisma/client";
import crypto from "crypto";
import httpStatus from "http-status";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";

// Default Platform Crypto Wallet Addresses
const CRYPTO_DEPOSIT_ADDRESSES = {
  USDT_TRC20: "TXx9...smvaults_usdt_trc20_vault_address",
  USDT_BEP20: "0x71...smvaults_usdt_bep20_vault_address",
  LTC: "ltc1q...smvaults_ltc_vault_address",
};

// 1. Create a Crypto USDT deposit invoice
const createRechargeInvoice = async (
  userId: string,
  payload: {
    amount: number;
    gateway: "CRYPTO" | "KORAPAY";
    cryptoNetwork?: string;
  }
) => {
  const { amount, gateway, cryptoNetwork } = payload;

  if (!amount || amount < 1) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Minimum deposit amount is $1.00");
  }

  const invoiceCode = `INV-${Date.now().toString().slice(-6)}${Math.floor(
    100 + Math.random() * 900
  )}`;

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

  const depositAddress =
    cryptoNetwork === "BEP20"
      ? CRYPTO_DEPOSIT_ADDRESSES.USDT_BEP20
      : cryptoNetwork === "LTC"
      ? CRYPTO_DEPOSIT_ADDRESSES.LTC
      : CRYPTO_DEPOSIT_ADDRESSES.USDT_TRC20;

  const invoice = await prisma.paymentInvoice.create({
    data: {
      userId,
      gateway: gateway === "KORAPAY" ? PaymentGateway.KORAPAY : PaymentGateway.CRYPTO,
      invoiceCode,
      amountRequested: new Prisma.Decimal(amount),
      currency: "USD",
      payAddress: depositAddress,
      status: "PENDING",
      expiresAt,
    },
  });

  return {
    invoiceCode: invoice.invoiceCode,
    amountRequested: Number(invoice.amountRequested),
    currency: invoice.currency,
    payAddress: invoice.payAddress,
    network: cryptoNetwork || "USDT (TRC20)",
    status: invoice.status,
    expiresAt: invoice.expiresAt,
  };
};

// 2. Initialize Korapay Charge Session (Official API)
const initializeKorapay = async (
  userId: string,
  payload: {
    amountNgn: number;
  }
) => {
  const { amountNgn } = payload;

  if (!amountNgn || amountNgn < 1000) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Minimum Korapay deposit is ₦1,000 NGN");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const exchangeRate = config.korapay.exchange_rate_usd_to_ngn || 1550;
  const usdEquivalent = Number((amountNgn / exchangeRate).toFixed(2));

  const reference = `KORA_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  const frontendUrl = config.url.frontend_url || "http://localhost:3000";
  const redirectUrl = `${frontendUrl}/recharge/success?reference=${reference}`;

  try {
    const korapayResponse = await fetch(
      "https://api.korapay.com/merchant/api/v1/charges/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.korapay.secret_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference,
          amount: Math.round(amountNgn),
          currency: "NGN",
          customer: {
            name: user.username || "Customer",
            email:
              user.email && user.email.includes("@")
                ? user.email
                : `${user.username || "user"}@customer.smvaults.com`,
          },
          redirect_url: redirectUrl,
        }),
      }
    );

    const korapayData = await korapayResponse.json();

    if (!korapayResponse.ok || !korapayData.status || !korapayData.data?.checkout_url) {
      throw new ApiError(
        httpStatus.BAD_GATEWAY,
        korapayData.message || "Failed to initialize Korapay payment session"
      );
    }

    const checkoutUrl = korapayData.data.checkout_url;

    // Save pending invoice
    await prisma.paymentInvoice.create({
      data: {
        userId,
        gateway: PaymentGateway.KORAPAY,
        invoiceCode: reference,
        amountRequested: new Prisma.Decimal(usdEquivalent),
        currency: "USD",
        payUrl: checkoutUrl,
        status: "PENDING",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    return {
      reference,
      checkoutUrl,
      amountNgn,
      amountUsd: usdEquivalent,
      exchangeRate,
    };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Korapay connection failed"
    );
  }
};

// 3. Verify Korapay Payment and Credit Wallet
const verifyKorapayPayment = async (reference: string) => {
  const invoice = await prisma.paymentInvoice.findUnique({
    where: { invoiceCode: reference },
    include: { user: true },
  });

  if (!invoice) {
    throw new ApiError(httpStatus.NOT_FOUND, "Invoice reference not found");
  }

  // Already credited check
  if (invoice.status === "PAID") {
    return {
      status: "PAID",
      alreadyCredited: true,
      amountCreditedUSD: Number(invoice.amountReceived),
      currentBalance: Number(invoice.user.balance),
    };
  }

  // Call Korapay Verify API
  try {
    const korapayResponse = await fetch(
      `https://api.korapay.com/merchant/api/v1/charges/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${config.korapay.secret_key}`,
        },
      }
    );

    const korapayData = await korapayResponse.json();

    if (!korapayResponse.ok || !korapayData.status) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        korapayData.message || "Could not verify charge with Korapay"
      );
    }

    const chargeStatus = korapayData.data?.status; // e.g. "success" | "failed" | "pending"

    if (chargeStatus !== "success") {
      return {
        status: chargeStatus.toUpperCase(),
        alreadyCredited: false,
        message: `Payment status is currently ${chargeStatus}`,
      };
    }

    // Payment Successful -> Credit User Wallet atomically
    const creditedUSD = Number(invoice.amountRequested);

    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: invoice.userId } });
      if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

      const balanceBefore = Number(user.balance);
      const balanceAfter = Number((balanceBefore + creditedUSD).toFixed(2));

      // 1. Update user balance
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          balance: new Prisma.Decimal(balanceAfter),
        },
      });

      // 2. Mark invoice PAID
      await tx.paymentInvoice.update({
        where: { id: invoice.id },
        data: {
          status: "PAID",
          amountReceived: new Prisma.Decimal(creditedUSD),
        },
      });

      // 3. Record Financial Ledger Transaction
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "DEPOSIT",
          amount: new Prisma.Decimal(creditedUSD),
          balanceBefore: new Prisma.Decimal(balanceBefore),
          balanceAfter: new Prisma.Decimal(balanceAfter),
          currency: "USD",
          status: "COMPLETED",
          paymentMethod: "KORAPAY",
          referenceId: reference,
          description: `Korapay deposit verification (${reference})`,
        },
      });

      // 4. Log Activity
      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: "KORAPAY_DEPOSIT_SUCCESS",
          metadata: {
            reference,
            amountCreditedUSD: creditedUSD,
            balanceAfter,
          },
        },
      });

      return {
        status: "PAID",
        alreadyCredited: false,
        amountCreditedUSD: creditedUSD,
        currentBalance: Number(updatedUser.balance),
        message: `Payment successful! $${creditedUSD.toFixed(2)} USD credited to your wallet.`,
      };
    });
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to verify Korapay payment"
    );
  }
};

// 4. Korapay Webhook Listener
const handleKorapayWebhook = async (body: any, signature: string) => {
  // Verify HMAC SHA256 Signature
  const calculatedHash = crypto
    .createHmac("sha256", config.korapay.secret_key || "")
    .update(JSON.stringify(body))
    .digest("hex");

  if (signature !== calculatedHash) {
    console.warn("Invalid Korapay Webhook signature rejected.");
    return { success: false, message: "Invalid signature" };
  }

  const event = body.event;
  const data = body.data;

  if (event === "charge.success" && data?.reference) {
    console.log(`⚡ Korapay Webhook charge.success received for: ${data.reference}`);
    await verifyKorapayPayment(data.reference);
  }

  return { success: true };
};

// 5. Get user invoices
const getMyInvoices = async (userId: string) => {
  const invoices = await prisma.paymentInvoice.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return invoices.map((inv) => ({
    id: inv.id,
    invoiceCode: inv.invoiceCode,
    gateway: inv.gateway,
    amountRequested: Number(inv.amountRequested),
    amountReceived: Number(inv.amountReceived),
    currency: inv.currency,
    payAddress: inv.payAddress,
    payUrl: inv.payUrl,
    status: inv.status,
    createdAt: inv.createdAt,
    expiresAt: inv.expiresAt,
  }));
};

// 6. Admin: Credit or Adjust User Balance Manually
const adminCreditBalance = async (
  adminId: string,
  payload: {
    identifier: string;
    amount: number;
    note?: string;
  }
) => {
  const { identifier, amount, note } = payload;

  if (!amount || amount === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Amount cannot be zero");
  }

  const targetUser = await prisma.user.findFirst({
    where: {
      OR: [{ username: identifier }, { email: identifier }],
    },
  });

  if (!targetUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "Target user not found");
  }

  return await prisma.$transaction(async (tx) => {
    const currentBalance = Number(targetUser.balance);
    const newBalance = Number((currentBalance + amount).toFixed(2));

    if (newBalance < 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Cannot deduct more than user current balance"
      );
    }

    const updatedUser = await tx.user.update({
      where: { id: targetUser.id },
      data: {
        balance: new Prisma.Decimal(newBalance),
      },
    });

    await tx.transaction.create({
      data: {
        userId: targetUser.id,
        type: amount > 0 ? "DEPOSIT" : "REFUND",
        amount: new Prisma.Decimal(Math.abs(amount)),
        balanceBefore: new Prisma.Decimal(currentBalance),
        balanceAfter: new Prisma.Decimal(newBalance),
        currency: "USD",
        status: "COMPLETED",
        paymentMethod: "ADMIN_ADJUST",
        description: note || `Admin manual balance adjustment ($${amount > 0 ? "+" : ""}${amount})`,
      },
    });

    await tx.activityLog.create({
      data: {
        userId: adminId,
        action: "ADMIN_BALANCE_ADJUSTMENT",
        metadata: {
          targetUserId: targetUser.id,
          targetUsername: targetUser.username,
          amount,
          previousBalance: currentBalance,
          newBalance,
          note,
        },
      },
    });

    return {
      username: updatedUser.username,
      previousBalance: currentBalance,
      newBalance,
      creditedAmount: amount,
    };
  });
};

export const WalletService = {
  createRechargeInvoice,
  initializeKorapay,
  verifyKorapayPayment,
  handleKorapayWebhook,
  getMyInvoices,
  adminCreditBalance,
};
