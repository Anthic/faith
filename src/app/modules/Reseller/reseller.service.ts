import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import { OrderService } from "../Order/order.service";

// 1. Get Reseller Profile & Balance
const getBalance = async (user: any) => {
  const freshUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      username: true,
      email: true,
      balance: true,
      currency: true,
      apiKey: true,
      createdAt: true,
    },
  });

  if (!freshUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "Reseller user not found");
  }

  return {
    username: freshUser.username,
    email: freshUser.email,
    balance: Number(freshUser.balance),
    currency: freshUser.currency,
  };
};

// 2. Get Live Product Catalog & Stock for Resellers
const getProducts = async () => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
      stockItems: {
        where: { status: "AVAILABLE" },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return products.map((prod) => ({
    productId: prod.id,
    title: prod.title,
    slug: prod.slug,
    category: prod.category.name,
    nation: prod.nation,
    priceUSD: Number(prod.priceUSD),
    priceNGN: Number(prod.priceNGN),
    stock: prod.stockItems.length,
    format: prod.format || "UID|PASS|2FA|MAIL|MAILPASS",
    minBuy: prod.minBuy,
    maxBuy: prod.maxBuy,
  }));
};

// 3. Programmatic Instant Purchase for Reseller Bots
const buyProduct = async (
  user: any,
  payload: {
    productId: string;
    quantity: number;
    couponCode?: string;
  }
) => {
  if (!payload.productId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "productId is required");
  }

  if (!payload.quantity || payload.quantity < 1) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "quantity must be an integer greater than 0"
    );
  }

  // Execute purchase via atomic OrderService
  const orderResult = await OrderService.buyProduct(user.id, {
    productId: payload.productId,
    quantity: Number(payload.quantity),
    couponCode: payload.couponCode,
  });

  // Fetch updated balance
  const updatedUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { balance: true },
  });

  return {
    orderNumber: orderResult.orderNumber,
    productId: payload.productId,
    quantity: orderResult.quantity,
    totalAmount: orderResult.totalAmount,
    discountAmount: orderResult.discountAmount || 0,
    remainingBalance: Number(updatedUser?.balance || 0),
    currency: "USD",
    accounts: orderResult.credentials,
  };
};

export const ResellerService = {
  getBalance,
  getProducts,
  buyProduct,
};
