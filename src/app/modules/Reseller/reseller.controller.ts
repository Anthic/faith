import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { ResellerService } from "./reseller.service";

// 1. Get Balance
const getBalance = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const result = await ResellerService.getBalance(req.user);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Reseller balance retrieved successfully",
      data: result,
    });
  }
);

// 2. Get Products Catalog
const getProducts = catchAsync(async (req: Request, res: Response) => {
  const result = await ResellerService.getProducts();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reseller products retrieved successfully",
    data: result,
  });
});

// 3. Programmatic Account Purchase
const buyProduct = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const result = await ResellerService.buyProduct(req.user, req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Accounts purchased and delivered successfully",
      data: result,
    });
  }
);

export const ResellerController = {
  getBalance,
  getProducts,
  buyProduct,
};
