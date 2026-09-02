import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AdminService } from "./admin.service";

// 1. Get Dashboard Overview
const getOverview = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getOverviewStats();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin overview metrics retrieved successfully",
    data: result,
  });
});

export const AdminController = {
  getOverview,
};
