import { Prisma, UserRole, UserStatus } from "@prisma/client";
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import { IPaginationOptions } from "../../../interfaces/paginations";
import prisma from "../../../shared/prisma";
import { paginationHelpers } from "../../../utils/paginationHelper";
import { TUpdateProfile, TUserFilterRequest } from "./user.interface";
import { v4 as uuidv4 } from "uuid";

// 1. Get All Users (Admin)
const getAllUsers = async (
  params: TUserFilterRequest,
  options: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(options);

  const andConditions: Prisma.UserWhereInput[] = [];

  if (params.searchTerm) {
    andConditions.push({
      OR: [
        { username: { contains: params.searchTerm, mode: "insensitive" } },
        { email: { contains: params.searchTerm, mode: "insensitive" } },
      ],
    });
  }

  if (params.role) {
    andConditions.push({ role: params.role });
  }

  if (params.status) {
    andConditions.push({ status: params.status });
  }

  const whereConditions: Prisma.UserWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.user.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      [sortBy || "createdAt"]: sortOrder || "desc",
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      status: true,
      balance: true,
      currency: true,
      apiKey: true,
      ipWhitelist: true,
      telegramUsername: true,
      lastLoginAt: true,
      createdAt: true,
      _count: {
        select: {
          orders: true,
        },
      },
    },
  });

  const total = await prisma.user.count({ where: whereConditions });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

// 2. Get User By ID
const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      status: true,
      balance: true,
      currency: true,
      apiKey: true,
      ipWhitelist: true,
      telegramUsername: true,
      lastLoginAt: true,
      createdAt: true,
      _count: {
        select: {
          orders: true,
          transactions: true,
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  return user;
};

// 3. Update User Status (Admin: ACTIVE, BANNED, SUSPENDED)
const updateUserStatus = async (id: string, status: UserStatus) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { status },
    select: {
      id: true,
      username: true,
      status: true,
    },
  });

  return updatedUser;
};

// 4. Adjust User Balance (Admin)
const adjustUserBalance = async (
  id: string,
  payload: { amount: number; type: "ADD" | "DEDUCT"; description?: string }
) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const currentBalance = Number(user.balance);
  const adjustAmount = Math.abs(Number(payload.amount));

  if (payload.type === "DEDUCT" && currentBalance < adjustAmount) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot deduct more than user current balance"
    );
  }

  const newBalance =
    payload.type === "ADD"
      ? currentBalance + adjustAmount
      : currentBalance - adjustAmount;

  return await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id },
      data: { balance: newBalance },
      select: {
        id: true,
        username: true,
        balance: true,
      },
    });

    await tx.transaction.create({
      data: {
        userId: id,
        type: payload.type === "ADD" ? "BONUS" : "PURCHASE",
        amount: adjustAmount,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        paymentMethod: "ADMIN_ADJUST",
        description: payload.description || `Admin manual ${payload.type.toLowerCase()}`,
      },
    });

    return updatedUser;
  });
};

// 5. Update Profile (Self)
const updateProfile = async (userId: string, payload: TUpdateProfile) => {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      telegramUsername: payload.telegramUsername,
      currency: payload.currency,
    },
    select: {
      id: true,
      username: true,
      email: true,
      telegramUsername: true,
      currency: true,
    },
  });

  return updatedUser;
};

// 6. Regenerate API Key (Self)
const regenerateApiKey = async (userId: string) => {
  const newApiKey = `smv_${uuidv4().replace(/-/g, "")}`;
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { apiKey: newApiKey },
    select: {
      id: true,
      username: true,
      apiKey: true,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId,
      action: "REGENERATE_API_KEY",
      metadata: { newKeyPreview: `${newApiKey.slice(0, 8)}...` },
    },
  });

  return updatedUser;
};

export const UserService = {
  getAllUsers,
  getUserById,
  updateUserStatus,
  adjustUserBalance,
  updateProfile,
  regenerateApiKey,
};
