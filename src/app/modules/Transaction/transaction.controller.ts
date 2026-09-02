import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { TransactionService } from "./transaction.service";

const getMyTransactions = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await TransactionService.getMyTransactions(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Transactions retrieved successfully",
    data: result,
  });
});

export const TransactionController = {
  getMyTransactions,
};
