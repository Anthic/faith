import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { ActivityLogService } from "./activityLog.service";

const getMyLogs = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await ActivityLogService.getMyLogs(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Activity logs retrieved successfully",
    data: result,
  });
});

export const ActivityLogController = {
  getMyLogs,
};
