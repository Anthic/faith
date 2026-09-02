import { Request, Response } from "express";
import httpStatus from "http-status";
import { paginationFields } from "../../../constants/pagination";
import catchAsync from "../../../shared/catchAsync";
import pick from "../../../shared/pick";
import sendResponse from "../../../shared/sendResponse";
import { UserService } from "./user.service";

// 1. Get All Users (Admin)
const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, paginationFields);
  const filters = pick(req.query, ["searchTerm", "role", "status"]);

  const result = await UserService.getAllUsers(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

// 2. Get User By ID
const getUserById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.getUserById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User retrieved successfully",
    data: result,
  });
});

// 3. Update User Status (Admin)
const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const result = await UserService.updateUserStatus(id, status);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User status updated successfully",
    data: result,
  });
});

// 4. Adjust User Balance (Admin)
const adjustUserBalance = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.adjustUserBalance(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User balance adjusted successfully",
    data: result,
  });
});

// 5. Update Profile (Self)
const updateProfile = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const result = await UserService.updateProfile(req.user.id, req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Profile updated successfully",
      data: result,
    });
  }
);

// 6. Regenerate API Key (Self)
const regenerateApiKey = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const result = await UserService.regenerateApiKey(req.user.id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "API Key regenerated successfully",
      data: result,
    });
  }
);

export const UserController = {
  getAllUsers,
  getUserById,
  updateUserStatus,
  adjustUserBalance,
  updateProfile,
  regenerateApiKey,
};
