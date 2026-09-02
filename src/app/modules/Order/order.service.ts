import { Prisma } from "@prisma/client";
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";

// 1. Instant Purchase Engine (Atomic Transaction)
const buyProduct = async (
  userId: string,
  payload: {
    productId: string;
    quantity: number;
    couponCode?: string;
  }
) => {
  const { productId, quantity } = payload;

  if (!quantity || quantity <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Quantity must be at least 1");
  }

  return await prisma.$transaction(async (tx) => {
    // A. Check User
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User account not found");
    }

    if (user.status !== "ACTIVE") {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Your account is not active. Please contact support."
      );
    }

    // B. Check Product
    const product = await tx.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });

    if (!product || !product.isActive) {
      throw new ApiError(httpStatus.NOT_FOUND, "Product is not available");
    }

    // C. Calculate Price & Coupon Discount
    const unitPrice = Number(product.priceUSD);
    const subtotal = Number((unitPrice * quantity).toFixed(2));
    let discountAmount = 0;
    let appliedCouponCode: string | null = null;

    if (payload.couponCode) {
      const cleanCode = payload.couponCode.trim().toUpperCase();
      const coupon = await tx.coupon.findUnique({
        where: { code: cleanCode },
      });

      if (coupon && coupon.isActive) {
        const isNotExpired =
          !coupon.expiresAt || new Date(coupon.expiresAt) >= new Date();
        const hasUsesLeft = coupon.usedCount < coupon.maxUses;
        const meetsMinSpend = subtotal >= Number(coupon.minSpend);

        if (isNotExpired && hasUsesLeft && meetsMinSpend) {
          if (coupon.discountPercent && Number(coupon.discountPercent) > 0) {
            discountAmount = (subtotal * Number(coupon.discountPercent)) / 100;
          } else if (coupon.discountAmount && Number(coupon.discountAmount) > 0) {
            discountAmount = Number(coupon.discountAmount);
          }
          discountAmount = Math.min(discountAmount, subtotal);
          appliedCouponCode = coupon.code;

          // Increment coupon usage
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          });
        }
      }
    }

    const totalAmount = Number((subtotal - discountAmount).toFixed(2));
    const currentBalance = Number(user.balance);

    if (currentBalance < totalAmount) {
      throw new ApiError(
        httpStatus.PAYMENT_REQUIRED,
        `Insufficient balance! Required: $${totalAmount.toFixed(2)}, Available: $${currentBalance.toFixed(2)}. Please recharge your wallet.`
      );
    }

    // D. Fetch and Claim Stock Items
    const availableItems = await tx.stockItem.findMany({
      where: {
        productId,
        status: "AVAILABLE",
      },
      take: quantity,
      select: {
        id: true,
        credentials: true,
      },
    });

    if (availableItems.length < quantity) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Not enough stock in vault! Requested: ${quantity}, Available in stock: ${availableItems.length}.`
      );
    }

    // E. Generate Unique Order Number
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}${Math.floor(
      100 + Math.random() * 900
    )}`;

    // F. Create Order Record
    const order = await tx.order.create({
      data: {
        orderNumber,
        userId,
        productId,
        quantity,
        unitPrice: new Prisma.Decimal(unitPrice),
        totalAmount: new Prisma.Decimal(totalAmount),
        currency: "USD",
        status: "COMPLETED",
        couponCode: appliedCouponCode,
        discountAmount: new Prisma.Decimal(discountAmount),
      },
    });

    // G. Mark StockItems as SOLD and link to Order
    const itemIds = availableItems.map((item) => item.id);
    await tx.stockItem.updateMany({
      where: {
        id: { in: itemIds },
      },
      data: {
        status: "SOLD",
        orderId: order.id,
        soldAt: new Date(),
      },
    });

    // H. Deduct User Wallet Balance
    const newBalance = Number((currentBalance - totalAmount).toFixed(2));
    await tx.user.update({
      where: { id: userId },
      data: {
        balance: new Prisma.Decimal(newBalance),
      },
    });

    // I. Log Transaction Ledger
    await tx.transaction.create({
      data: {
        userId,
        type: "PURCHASE",
        amount: new Prisma.Decimal(totalAmount),
        balanceBefore: new Prisma.Decimal(currentBalance),
        balanceAfter: new Prisma.Decimal(newBalance),
        currency: "USD",
        status: "COMPLETED",
        paymentMethod: "WALLET_BALANCE",
        description: `Purchased ${quantity}x ${product.title}`,
        referenceId: order.id,
      },
    });

    // J. Log Activity
    await tx.activityLog.create({
      data: {
        userId,
        action: "ORDER_PURCHASE",
        metadata: {
          orderNumber,
          productId,
          productTitle: product.title,
          quantity,
          totalAmount,
        },
      },
    });

    return {
      orderId: order.id,
      orderNumber,
      productTitle: product.title,
      quantity,
      unitPrice,
      totalAmount,
      discountAmount,
      couponCode: appliedCouponCode,
      balanceRemaining: newBalance,
      purchasedAt: order.createdAt,
      credentials: availableItems.map((item) => item.credentials),
    };
  });
};

// 2. Get User Orders
const getMyOrders = async (userId: string) => {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          nation: true,
          nationFlag: true,
          format: true,
          category: {
            select: { name: true },
          },
        },
      },
      items: {
        select: {
          id: true,
          credentials: true,
          previewData: true,
        },
      },
    },
  });

  return orders.map((ord) => ({
    id: ord.id,
    orderNumber: ord.orderNumber,
    createdAt: ord.createdAt,
    productTitle: ord.product.title,
    categoryName: ord.product.category.name,
    nation: ord.product.nation,
    nationFlag: ord.product.nationFlag,
    quantity: ord.quantity,
    unitPrice: Number(ord.unitPrice),
    totalAmount: Number(ord.totalAmount),
    currency: ord.currency,
    status: ord.status,
    format: ord.product.format,
    credentials: ord.items.map((i) => i.credentials),
  }));
};

// 3. Get Single Order Detail
const getOrderById = async (userId: string, orderId: string) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    include: {
      product: true,
      items: true,
    },
  });

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  }

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    productTitle: order.product.title,
    quantity: order.quantity,
    totalAmount: Number(order.totalAmount),
    credentials: order.items.map((i) => i.credentials),
  };
};

// 4. Admin: Get All Orders
const getAllOrdersAdmin = async () => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, username: true, email: true },
      },
      product: {
        select: { id: true, title: true },
      },
      items: {
        select: { credentials: true },
      },
    },
  });

  return orders;
};

export const OrderService = {
  buyProduct,
  getMyOrders,
  getOrderById,
  getAllOrdersAdmin,
};
