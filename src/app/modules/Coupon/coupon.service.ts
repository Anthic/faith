import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";

// 1. Validate Promo Code / Coupon
const validateCoupon = async (code: string, subtotalUSD: number) => {
  if (!code || !code.trim()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Coupon code is required");
  }

  const cleanCode = code.trim().toUpperCase();

  const coupon = await prisma.coupon.findUnique({
    where: { code: cleanCode },
  });

  if (!coupon || !coupon.isActive) {
    throw new ApiError(httpStatus.NOT_FOUND, "Invalid or expired coupon code");
  }

  // Check expiration date
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "This coupon code has expired");
  }

  // Check usage limit
  if (coupon.usedCount >= coupon.maxUses) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "This coupon code has reached its maximum usage limit"
    );
  }

  // Check minimum spend
  const minSpendNum = Number(coupon.minSpend);
  if (minSpendNum > 0 && subtotalUSD < minSpendNum) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Minimum order of $${minSpendNum.toFixed(2)} is required to use this code`
    );
  }

  // Calculate discount
  let calculatedDiscount = 0;
  if (coupon.discountPercent && Number(coupon.discountPercent) > 0) {
    calculatedDiscount = (subtotalUSD * Number(coupon.discountPercent)) / 100;
  } else if (coupon.discountAmount && Number(coupon.discountAmount) > 0) {
    calculatedDiscount = Number(coupon.discountAmount);
  }

  // Cap discount to not exceed subtotal
  calculatedDiscount = Math.min(calculatedDiscount, subtotalUSD);
  const finalTotal = Math.max(0, subtotalUSD - calculatedDiscount);

  return {
    valid: true,
    code: coupon.code,
    discountPercent: coupon.discountPercent ? Number(coupon.discountPercent) : 0,
    discountAmount: Number(calculatedDiscount.toFixed(2)),
    subtotal: subtotalUSD,
    finalTotal: Number(finalTotal.toFixed(2)),
    message: `Coupon applied! You saved $${calculatedDiscount.toFixed(2)}`,
  };
};

// 2. Admin: Create Coupon
const createCoupon = async (payload: {
  code: string;
  discountPercent?: number;
  discountAmount?: number;
  minSpend?: number;
  maxUses?: number;
  expiresAt?: string | Date;
}) => {
  const cleanCode = payload.code.trim().toUpperCase();

  const existing = await prisma.coupon.findUnique({
    where: { code: cleanCode },
  });

  if (existing) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Coupon with code "${cleanCode}" already exists`
    );
  }

  const coupon = await prisma.coupon.create({
    data: {
      code: cleanCode,
      discountPercent: payload.discountPercent ?? null,
      discountAmount: payload.discountAmount ?? null,
      minSpend: payload.minSpend ?? 0.0,
      maxUses: payload.maxUses ?? 100,
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
      isActive: true,
    },
  });

  return coupon;
};

// 3. Admin: Get All Coupons
const getAllCoupons = async () => {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  });

  return coupons.map((c) => ({
    id: c.id,
    code: c.code,
    discountPercent: c.discountPercent ? Number(c.discountPercent) : null,
    discountAmount: c.discountAmount ? Number(c.discountAmount) : null,
    minSpend: Number(c.minSpend),
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    isActive: c.isActive,
    expiresAt: c.expiresAt,
    createdAt: c.createdAt,
  }));
};

// 4. Admin: Delete Coupon
const deleteCoupon = async (id: string) => {
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Coupon not found");
  }

  await prisma.coupon.delete({ where: { id } });
  return { message: "Coupon deleted successfully" };
};

export const CouponService = {
  validateCoupon,
  createCoupon,
  getAllCoupons,
  deleteCoupon,
};
