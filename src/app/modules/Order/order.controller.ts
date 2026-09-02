import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { OrderService } from "./order.service";

// 1. Buy Product
const buyProduct = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await OrderService.buyProduct(user.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Purchase successful! Your accounts have been delivered.",
    data: result,
  });
});

// 2. Get My Orders
const getMyOrders = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await OrderService.getMyOrders(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Orders retrieved successfully",
    data: result,
  });
});

// 3. Get Single Order Detail
const getOrderById = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  const result = await OrderService.getOrderById(user.id, id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order details retrieved successfully",
    data: result,
  });
});

// 4. Download Order Credentials as TXT
const downloadOrderTxt = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  const result = await OrderService.getOrderById(user.id, id);

  const fileContent = result.credentials.join("\n");
  const filename = `${result.orderNumber}_accounts.txt`;

  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Type", "text/plain");
  res.send(fileContent);
});

// 5. Admin: Get All Orders
const getAllOrdersAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderService.getAllOrdersAdmin();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All orders retrieved successfully",
    data: result,
  });
});

export const OrderController = {
  buyProduct,
  getMyOrders,
  getOrderById,
  downloadOrderTxt,
  getAllOrdersAdmin,
};
